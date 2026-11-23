package com.wristos.app.data.ble

import android.annotation.SuppressLint
import android.bluetooth.*
import android.bluetooth.le.ScanCallback
import android.bluetooth.le.ScanResult
import android.content.Context
import android.content.Intent
import android.os.Build
import android.util.Log
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.launch
import java.util.*

@SuppressLint("MissingPermission")
class WatchBleManager(private val context: Context) {

    private val bluetoothManager = context.getSystemService(Context.BLUETOOTH_SERVICE) as? BluetoothManager
    private val bluetoothAdapter: BluetoothAdapter? = bluetoothManager?.adapter

    private val scope = CoroutineScope(Dispatchers.Main)

    private val _watchData = MutableStateFlow(WatchData())
    val watchData: StateFlow<WatchData> = _watchData.asStateFlow()

    private val _aiTriggerEvent = MutableSharedFlow<Unit>(extraBufferCapacity = 1)
    val aiTriggerEvent: SharedFlow<Unit> = _aiTriggerEvent.asSharedFlow()

    private var bluetoothGatt: BluetoothGatt? = null
    private var isScanning = false

    private val scanCallback = object : ScanCallback() {
        override fun onScanResult(callbackType: Int, result: ScanResult?) {
            result?.device?.let { device ->
                val name = device.name ?: result.scanRecord?.deviceName ?: ""
                val hasMatch = name.contains("WristOS", ignoreCase = true) ||
                    name.contains("PineTime", ignoreCase = true) ||
                    name.contains("InfiniTime", ignoreCase = true)

                val serviceUuids = result.scanRecord?.serviceUuids?.map { it.uuid } ?: emptyList()
                val hasServices = serviceUuids.contains(BleConstants.SERVICE_CTS) ||
                    serviceUuids.contains(BleConstants.SERVICE_HRS) ||
                    serviceUuids.contains(BleConstants.SERVICE_BAS)

                if (hasMatch || hasServices) {
                    stopScan()
                    connectToDevice(device)
                }
            }
        }

        override fun onScanFailed(errorCode: Int) {
            Log.e("WatchBleManager", "Scan failed with error code: $errorCode")
            _watchData.value = _watchData.value.copy(connectionState = WatchConnectionState.DISCONNECTED)
            isScanning = false
        }
    }

    private val gattCallback = object : BluetoothGattCallback() {
        override fun onConnectionStateChange(gatt: BluetoothGatt?, status: Int, newState: Int) {
            if (newState == BluetoothProfile.STATE_CONNECTED) {
                _watchData.value = _watchData.value.copy(
                    connectionState = WatchConnectionState.CONNECTED,
                    deviceName = gatt?.device?.name ?: "WatchOS",
                    lastSyncTime = System.currentTimeMillis()
                )
                gatt?.discoverServices()
            } else if (newState == BluetoothProfile.STATE_DISCONNECTED) {
                _watchData.value = _watchData.value.copy(
                    connectionState = WatchConnectionState.DISCONNECTED
                )
                bluetoothGatt?.close()
                bluetoothGatt = null
            }
        }

        override fun onServicesDiscovered(gatt: BluetoothGatt?, status: Int) {
            if (status == BluetoothGatt.GATT_SUCCESS && gatt != null) {
                scope.launch {
                    syncCurrentTime(gatt)
                    kotlinx.coroutines.delay(200)
                    enableNotifications(gatt, BleConstants.SERVICE_HRS, BleConstants.CHAR_HEART_RATE_MEASUREMENT)
                    kotlinx.coroutines.delay(200)
                    enableNotifications(gatt, BleConstants.SERVICE_MOTION, BleConstants.CHAR_STEPS)
                    kotlinx.coroutines.delay(200)
                    enableNotifications(gatt, BleConstants.SERVICE_MUSIC, BleConstants.CHAR_MUSIC_EVENT)
                    kotlinx.coroutines.delay(200)
                    readBattery(gatt)
                    kotlinx.coroutines.delay(200)
                    readSteps(gatt)
                }
            }
        }

        @Deprecated("Deprecated in Java")
        override fun onCharacteristicChanged(gatt: BluetoothGatt?, characteristic: BluetoothGattCharacteristic?) {
            characteristic?.let { handleCharacteristicData(it) }
        }

        override fun onCharacteristicChanged(
            gatt: BluetoothGatt,
            characteristic: BluetoothGattCharacteristic,
            value: ByteArray
        ) {
            handleCharacteristicData(characteristic, value)
        }

        override fun onCharacteristicRead(
            gatt: BluetoothGatt,
            characteristic: BluetoothGattCharacteristic,
            value: ByteArray,
            status: Int
        ) {
            if (status == BluetoothGatt.GATT_SUCCESS) {
                handleCharacteristicData(characteristic, value)
            }
        }
    }

    fun startScan() {
        val scanner = bluetoothAdapter?.bluetoothLeScanner
        if (scanner == null || !bluetoothAdapter.isEnabled) {
            // Emulated demo mode fallback for emulator testing
            simulateWatchConnection()
            return
        }

        // Check if watch is already bonded in system settings
        val bonded = bluetoothAdapter.bondedDevices
        val pairedWatch = bonded?.firstOrNull { d ->
            val name = d.name ?: ""
            name.contains("WristOS", ignoreCase = true) ||
            name.contains("PineTime", ignoreCase = true) ||
            name.contains("InfiniTime", ignoreCase = true)
        }
        if (pairedWatch != null) {
            Log.d("WatchBleManager", "Found bonded watch: ${pairedWatch.name} (${pairedWatch.address})")
            connectToDevice(pairedWatch)
            return
        }

        isScanning = true
        _watchData.value = _watchData.value.copy(connectionState = WatchConnectionState.SCANNING)
        scanner.startScan(scanCallback)
    }

    fun stopScan() {
        if (isScanning) {
            bluetoothAdapter?.bluetoothLeScanner?.stopScan(scanCallback)
            isScanning = false
        }
    }

    private fun connectToDevice(device: BluetoothDevice) {
        _watchData.value = _watchData.value.copy(connectionState = WatchConnectionState.CONNECTING)
        bluetoothGatt = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            device.connectGatt(context, false, gattCallback, BluetoothDevice.TRANSPORT_LE)
        } else {
            device.connectGatt(context, false, gattCallback)
        }
    }

    fun disconnect() {
        bluetoothGatt?.disconnect()
        bluetoothGatt?.close()
        bluetoothGatt = null
        _watchData.value = _watchData.value.copy(connectionState = WatchConnectionState.DISCONNECTED)
    }

    private fun syncCurrentTime(gatt: BluetoothGatt) {
        val cts = gatt.getService(BleConstants.SERVICE_CTS)
        val char = cts?.getCharacteristic(BleConstants.CHAR_CURRENT_TIME) ?: return

        val calendar = Calendar.getInstance()
        val year = calendar.get(Calendar.YEAR)
        val month = (calendar.get(Calendar.MONTH) + 1).toByte()
        val day = calendar.get(Calendar.DAY_OF_MONTH).toByte()
        val hours = calendar.get(Calendar.HOUR_OF_DAY).toByte()
        val minutes = calendar.get(Calendar.MINUTE).toByte()
        val seconds = calendar.get(Calendar.SECOND).toByte()
        val dayOfWeek = calendar.get(Calendar.DAY_OF_WEEK).toByte()

        val payload = byteArrayOf(
            (year and 0xFF).toByte(),
            ((year shr 8) and 0xFF).toByte(),
            month,
            day,
            hours,
            minutes,
            seconds,
            dayOfWeek,
            0, // Fractions 1/256
            1  // Adjust reason
        )

        char.value = payload
        gatt.writeCharacteristic(char)
    }

    private fun readBattery(gatt: BluetoothGatt) {
        val bas = gatt.getService(BleConstants.SERVICE_BAS)
        val char = bas?.getCharacteristic(BleConstants.CHAR_BATTERY_LEVEL) ?: return
        gatt.readCharacteristic(char)
    }

    private fun readSteps(gatt: BluetoothGatt) {
        val motion = gatt.getService(BleConstants.SERVICE_MOTION)
        val char = motion?.getCharacteristic(BleConstants.CHAR_STEPS) ?: return
        gatt.readCharacteristic(char)
    }

    private fun enableNotifications(gatt: BluetoothGatt, serviceUuid: UUID, charUuid: UUID) {
        val service = gatt.getService(serviceUuid) ?: return
        val char = service.getCharacteristic(charUuid) ?: return

        gatt.setCharacteristicNotification(char, true)
        val descriptor = char.getDescriptor(BleConstants.CLIENT_CHARACTERISTIC_CONFIG)
        if (descriptor != null) {
            descriptor.value = BluetoothGattDescriptor.ENABLE_NOTIFICATION_VALUE
            gatt.writeDescriptor(descriptor)
        }
    }

    private fun handleCharacteristicData(char: BluetoothGattCharacteristic, data: ByteArray? = char.value) {
        val bytes = data ?: return
        when (char.uuid) {
            BleConstants.CHAR_HEART_RATE_MEASUREMENT -> {
                if (bytes.isNotEmpty()) {
                    val hr = if (bytes[0].toInt() and 0x01 == 0) bytes[1].toInt() and 0xFF
                    else (bytes[1].toInt() and 0xFF) or ((bytes[2].toInt() and 0xFF) shl 8)
                    _watchData.value = _watchData.value.copy(heartRate = hr)
                }
            }
            BleConstants.CHAR_STEPS -> {
                if (bytes.size >= 4) {
                    val steps = (bytes[0].toInt() and 0xFF) or
                            ((bytes[1].toInt() and 0xFF) shl 8) or
                            ((bytes[2].toInt() and 0xFF) shl 16) or
                            ((bytes[3].toInt() and 0xFF) shl 24)
                    _watchData.value = _watchData.value.copy(stepCount = steps)
                }
            }
            BleConstants.CHAR_BATTERY_LEVEL -> {
                if (bytes.isNotEmpty()) {
                    _watchData.value = _watchData.value.copy(batteryLevel = bytes[0].toInt() and 0xFF)
                }
            }
            BleConstants.CHAR_MUSIC_EVENT -> {
                if (bytes.isNotEmpty() && (bytes[0].toInt() and 0xFF) == 0xAA) {
                    _aiTriggerEvent.tryEmit(Unit)
                    wakePhoneForAi()
                }
            }
        }
    }

    fun triggerAiManually() {
        _aiTriggerEvent.tryEmit(Unit)
    }

    private fun wakePhoneForAi() {
        try {
            // 1. Wake screen if device is locked or screen is off
            val powerManager = context.getSystemService(Context.POWER_SERVICE) as? android.os.PowerManager
            val wakeLock = powerManager?.newWakeLock(
                android.os.PowerManager.SCREEN_BRIGHT_WAKE_LOCK or android.os.PowerManager.ACQUIRE_CAUSES_WAKEUP,
                "wristos:ai_wake"
            )
            wakeLock?.acquire(3000)

            // 2. Play haptic buzz so user feels the phone is awake
            val vibrator = if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.S) {
                val vm = context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as? android.os.VibratorManager
                vm?.defaultVibrator
            } else {
                @Suppress("DEPRECATION")
                context.getSystemService(Context.VIBRATOR_SERVICE) as? android.os.Vibrator
            }
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
                vibrator?.vibrate(android.os.VibrationEffect.createOneShot(150, android.os.VibrationEffect.DEFAULT_AMPLITUDE))
            } else {
                @Suppress("DEPRECATION")
                vibrator?.vibrate(150)
            }

            // 3. Bring MainActivity to foreground
            val intent = Intent(context, com.wristos.app.MainActivity::class.java).apply {
                action = "com.wristos.app.TRIGGER_AI"
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_REORDER_TO_FRONT
            }
            context.startActivity(intent)
        } catch (e: Exception) {
            android.util.Log.e("WatchBleManager", "Could not wake phone for AI trigger", e)
        }
    }

    fun sendAlertNotification(title: String, message: String = "") {
        val gatt = bluetoothGatt ?: return
        val ans = gatt.getService(BleConstants.SERVICE_ANS)
        val char = ans?.getCharacteristic(BleConstants.CHAR_NEW_ALERT) ?: return

        val titleBytes = title.toByteArray(Charsets.UTF_8).take(32).toByteArray()
        val msgBytes = (if (message.isNotEmpty()) message else title).toByteArray(Charsets.UTF_8).take(64).toByteArray()
        val payload = byteArrayOf(0x05, 0x01, 0x00) + titleBytes + byteArrayOf(0x00) + msgBytes
        char.value = payload
        gatt.writeCharacteristic(char)
    }

    // Emulator / Simulator fallback so team can test UI without physical watch connected
    private fun simulateWatchConnection() {
        scope.launch {
            _watchData.value = _watchData.value.copy(connectionState = WatchConnectionState.CONNECTING)
            kotlinx.coroutines.delay(1000)
            _watchData.value = WatchData(
                deviceName = "PineTime (Simulated)",
                connectionState = WatchConnectionState.CONNECTED,
                heartRate = 72,
                stepCount = 6840,
                batteryLevel = 88,
                lastSyncTime = System.currentTimeMillis()
            )
        }
    }
}
