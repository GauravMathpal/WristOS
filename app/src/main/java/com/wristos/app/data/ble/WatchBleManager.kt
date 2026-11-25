package com.wristos.app.data.ble

import android.annotation.SuppressLint
import android.app.ActivityOptions
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.bluetooth.*
import android.bluetooth.le.ScanCallback
import android.bluetooth.le.ScanFilter
import android.bluetooth.le.ScanResult
import android.bluetooth.le.ScanSettings
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.PackageManager
import android.os.Build
import android.os.ParcelUuid
import android.os.PowerManager
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.util.Log
import androidx.core.app.NotificationCompat
import androidx.core.content.ContextCompat
import com.wristos.app.MainActivity
import com.wristos.app.R
import com.wristos.app.data.local.SettingsPreferences
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.util.*

@SuppressLint("MissingPermission")
class WatchBleManager(private val context: Context) {

    private val appContext = context.applicationContext
    private val prefs = SettingsPreferences.getInstance(appContext)
    private val bluetoothManager = appContext.getSystemService(Context.BLUETOOTH_SERVICE) as? BluetoothManager
    private val bluetoothAdapter: BluetoothAdapter? = bluetoothManager?.adapter

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main.immediate)

    private val _watchData = MutableStateFlow(
        WatchData(deviceName = prefs.getLastWatchName() ?: "WristOS Watch")
    )
    val watchData: StateFlow<WatchData> = _watchData.asStateFlow()

    private val _aiTriggerEvent = MutableSharedFlow<Unit>(extraBufferCapacity = 4)
    val aiTriggerEvent: SharedFlow<Unit> = _aiTriggerEvent.asSharedFlow()

    // Durable token so triggers fired while UI isn't mounted yet are never lost
    private val _pendingAiTrigger = MutableStateFlow(0L)
    val pendingAiTrigger: StateFlow<Long> = _pendingAiTrigger.asStateFlow()

    private var bluetoothGatt: BluetoothGatt? = null
    private var isScanning = false
    private var reconnectAttempts = 0
    private var directConnectFailures = 0
    private var refreshedCacheForCurrentGatt = false
    private var musicNotifyRetries = 0
    private var connectionWatchdogJob: Job? = null
    private var reconnectJob: Job? = null
    private var periodicSyncJob: Job? = null
    private var isExplicitDisconnect = false
    @Volatile
    private var isAppInForeground = false

    fun setAppForeground(inForeground: Boolean) {
        isAppInForeground = inForeground
    }

    fun canDrawOverlaysCompat(): Boolean {
        return Build.VERSION.SDK_INT < Build.VERSION_CODES.M ||
            android.provider.Settings.canDrawOverlays(appContext)
    }

    fun canUseFullScreenIntentCompat(): Boolean {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.UPSIDE_DOWN_CAKE) return true
        val nm = appContext.getSystemService(NotificationManager::class.java) ?: return false
        return nm.canUseFullScreenIntent()
    }

    // Sequential BLE GATT operation queue (Android drops overlapping read/write/descriptor calls)
    private val gattOpQueue = ArrayDeque<() -> Boolean>()
    private var isGattOpInFlight = false
    private var gattOpTimeoutJob: Job? = null

    init {
        ensureAiWakeChannel()
        try {
            val filter = IntentFilter(BluetoothAdapter.ACTION_STATE_CHANGED)
            ContextCompat.registerReceiver(
                appContext,
                object : BroadcastReceiver() {
                    override fun onReceive(c: Context?, intent: Intent?) {
                        val state = intent?.getIntExtra(BluetoothAdapter.EXTRA_STATE, BluetoothAdapter.ERROR)
                        if (state == BluetoothAdapter.STATE_ON) {
                            Log.d(TAG, "Bluetooth powered ON; auto-initiating watch reconnect")
                            isExplicitDisconnect = false
                            reconnectAttempts = 0
                            scope.launch {
                                delay(600)
                                startScan()
                            }
                        } else if (state == BluetoothAdapter.STATE_OFF) {
                            stopScan()
                            cleanupGatt()
                            _watchData.value = _watchData.value.copy(
                                connectionState = WatchConnectionState.DISCONNECTED
                            )
                        }
                    }
                },
                filter,
                ContextCompat.RECEIVER_EXPORTED
            )
        } catch (e: Exception) {
            Log.w(TAG, "Bluetooth state receiver registration failed", e)
        }
    }

    private fun hasBluetoothConnectPermission(): Boolean {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            ContextCompat.checkSelfPermission(appContext, android.Manifest.permission.BLUETOOTH_CONNECT) ==
                PackageManager.PERMISSION_GRANTED
        } else {
            true
        }
    }

    private fun hasBluetoothScanPermission(): Boolean {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            ContextCompat.checkSelfPermission(appContext, android.Manifest.permission.BLUETOOTH_SCAN) ==
                PackageManager.PERMISSION_GRANTED
        } else {
            ContextCompat.checkSelfPermission(appContext, android.Manifest.permission.ACCESS_FINE_LOCATION) ==
                PackageManager.PERMISSION_GRANTED
        }
    }

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
                    Log.d(TAG, "Discovered watch via LE scan: $name (${device.address})")
                    prefs.setLastWatch(device.address, name.ifBlank { "WristOS Watch" })
                    stopScan()
                    connectToDevice(device)
                }
            }
        }

        override fun onScanFailed(errorCode: Int) {
            Log.e(TAG, "Scan failed with error code: $errorCode")
            isScanning = false
            _watchData.value = _watchData.value.copy(connectionState = WatchConnectionState.DISCONNECTED)
            scheduleReconnect()
        }
    }

    private val gattCallback = object : BluetoothGattCallback() {
        override fun onConnectionStateChange(gatt: BluetoothGatt?, status: Int, newState: Int) {
            scope.launch {
                // Ignore late callbacks from stale closed/superseded GATT handles
                if (gatt != null && bluetoothGatt != null && gatt !== bluetoothGatt) {
                    try {
                        gatt.close()
                    } catch (_: Exception) {
                    }
                    return@launch
                }

                connectionWatchdogJob?.cancel()
                connectionWatchdogJob = null

                if (newState == BluetoothProfile.STATE_CONNECTED && status == BluetoothGatt.GATT_SUCCESS) {
                    reconnectAttempts = 0
                    directConnectFailures = 0
                    reconnectJob?.cancel()
                    isExplicitDisconnect = false

                    val resolvedName = gatt?.device?.name?.takeIf { it.isNotBlank() }
                        ?: prefs.getLastWatchName()
                        ?: "WristOS Watch"
                    gatt?.device?.address?.let { addr -> prefs.setLastWatch(addr, resolvedName) }

                    _watchData.value = _watchData.value.copy(
                        connectionState = WatchConnectionState.CONNECTED,
                        deviceName = resolvedName,
                        lastSyncTime = System.currentTimeMillis()
                    )
                    gatt?.discoverServices()
                } else if (newState == BluetoothProfile.STATE_DISCONNECTED || status != BluetoothGatt.GATT_SUCCESS) {
                    Log.w(TAG, "GATT disconnected (status=$status, newState=$newState)")
                    if (status == 133 || status == 257 || newState != BluetoothProfile.STATE_CONNECTED) {
                        directConnectFailures++
                    }
                    cleanupGatt(alreadyDisconnected = (newState == BluetoothProfile.STATE_DISCONNECTED))
                    _watchData.value = _watchData.value.copy(
                        connectionState = WatchConnectionState.DISCONNECTED
                    )
                    if (!isExplicitDisconnect) {
                        scheduleReconnect()
                    }
                }
            }
        }

        override fun onServicesDiscovered(gatt: BluetoothGatt?, status: Int) {
            if (status == BluetoothGatt.GATT_SUCCESS && gatt != null) {
                scope.launch {
                    if (gatt !== bluetoothGatt) return@launch

                    val musicChar = gatt.getService(BleConstants.SERVICE_MUSIC)
                        ?.getCharacteristic(BleConstants.CHAR_MUSIC_EVENT)
                    if (musicChar == null && !refreshedCacheForCurrentGatt) {
                        refreshedCacheForCurrentGatt = true
                        Log.w(TAG, "CHAR_MUSIC_EVENT missing from cached GATT table; refreshing and re-discovering")
                        if (refreshGattCache(gatt)) {
                            delay(250L)
                            gatt.discoverServices()
                            return@launch
                        }
                    }

                    clearGattQueue()
                    musicNotifyRetries = 0
                    enqueueGattOp { syncCurrentTime(gatt) }
                    enqueueGattOp { enableNotifications(gatt, BleConstants.SERVICE_MUSIC, BleConstants.CHAR_MUSIC_EVENT) }
                    enqueueGattOp { enableNotifications(gatt, BleConstants.SERVICE_HRS, BleConstants.CHAR_HEART_RATE_MEASUREMENT) }
                    enqueueGattOp { enableNotifications(gatt, BleConstants.SERVICE_MOTION, BleConstants.CHAR_STEPS) }
                    enqueueGattOp { readBattery(gatt) }
                    enqueueGattOp { readSteps(gatt) }
                    startPeriodicSync(gatt)
                }
            }
        }

        override fun onCharacteristicWrite(gatt: BluetoothGatt?, characteristic: BluetoothGattCharacteristic?, status: Int) {
            scope.launch { finishCurrentGattOp() }
        }

        override fun onDescriptorWrite(gatt: BluetoothGatt?, descriptor: BluetoothGattDescriptor?, status: Int) {
            scope.launch {
                if (status != BluetoothGatt.GATT_SUCCESS &&
                    gatt != null &&
                    descriptor?.characteristic?.uuid == BleConstants.CHAR_MUSIC_EVENT &&
                    musicNotifyRetries < 2
                ) {
                    musicNotifyRetries++
                    Log.w(TAG, "CHAR_MUSIC_EVENT CCCD write failed ($status); retrying ($musicNotifyRetries)")
                    delay(200L)
                    enqueueGattOp { enableNotifications(gatt, BleConstants.SERVICE_MUSIC, BleConstants.CHAR_MUSIC_EVENT) }
                }
                finishCurrentGattOp()
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

        @Deprecated("Deprecated in Java")
        override fun onCharacteristicRead(gatt: BluetoothGatt?, characteristic: BluetoothGattCharacteristic?, status: Int) {
            if (status == BluetoothGatt.GATT_SUCCESS && characteristic != null) {
                handleCharacteristicData(characteristic, characteristic.value)
            }
            scope.launch { finishCurrentGattOp() }
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
            scope.launch { finishCurrentGattOp() }
        }
    }

    private fun enqueueGattOp(op: () -> Boolean) {
        gattOpQueue.addLast(op)
        processNextGattOp()
    }

    private fun processNextGattOp() {
        if (isGattOpInFlight) return
        while (gattOpQueue.isNotEmpty()) {
            val next = gattOpQueue.removeFirst()
            val started = try {
                next()
            } catch (e: Exception) {
                Log.w(TAG, "GATT op exception", e)
                false
            }
            if (started) {
                isGattOpInFlight = true
                gattOpTimeoutJob?.cancel()
                gattOpTimeoutJob = scope.launch {
                    delay(2500L)
                    Log.w(TAG, "GATT op timed out; advancing queue")
                    finishCurrentGattOp()
                }
                return
            }
        }
    }

    private fun finishCurrentGattOp() {
        gattOpTimeoutJob?.cancel()
        gattOpTimeoutJob = null
        isGattOpInFlight = false
        processNextGattOp()
    }

    private fun clearGattQueue() {
        gattOpTimeoutJob?.cancel()
        gattOpTimeoutJob = null
        isGattOpInFlight = false
        gattOpQueue.clear()
    }

    private fun startPeriodicSync(gatt: BluetoothGatt) {
        periodicSyncJob?.cancel()
        periodicSyncJob = scope.launch {
            while (_watchData.value.connectionState == WatchConnectionState.CONNECTED && bluetoothGatt == gatt) {
                delay(60_000L)
                if (prefs.autoSync.value) {
                    enqueueGattOp { readBattery(gatt) }
                    enqueueGattOp { readSteps(gatt) }
                }
            }
        }
    }

    private fun scheduleReconnect() {
        if (isExplicitDisconnect) return
        if (bluetoothAdapter == null || !bluetoothAdapter.isEnabled) return
        if (!hasBluetoothConnectPermission() || !hasBluetoothScanPermission()) return

        reconnectJob?.cancel()
        reconnectAttempts++
        val delayMs = when (reconnectAttempts) {
            1 -> 1500L
            2 -> 3000L
            3 -> 6000L
            4 -> 15000L
            5 -> 30000L
            else -> 60000L
        }
        Log.d(TAG, "Scheduling watch auto-reconnect #$reconnectAttempts in ${delayMs}ms")
        reconnectJob = scope.launch {
            delay(delayMs)
            if (!isExplicitDisconnect && _watchData.value.connectionState == WatchConnectionState.DISCONNECTED) {
                startScan(preserveReconnectCount = true)
            }
        }
    }

    fun ensureScanningOrConnected() {
        if (isExplicitDisconnect) return
        val state = _watchData.value.connectionState
        if (state == WatchConnectionState.DISCONNECTED && !isScanning) {
            startScan()
        }
    }

    fun startScan(preserveReconnectCount: Boolean = false) {
        val scanner = bluetoothAdapter?.bluetoothLeScanner
        if (bluetoothAdapter == null || !bluetoothAdapter.isEnabled) {
            // Only simulate if there's no Bluetooth hardware (e.g. Android Emulator)
            if (bluetoothAdapter == null) {
                simulateWatchConnection()
            } else {
                _watchData.value = _watchData.value.copy(connectionState = WatchConnectionState.DISCONNECTED)
            }
            return
        }

        if (!hasBluetoothConnectPermission() || !hasBluetoothScanPermission()) {
            Log.w(TAG, "Missing Bluetooth permissions; deferring scan")
            return
        }

        if (scanner == null) {
            simulateWatchConnection()
            return
        }

        isExplicitDisconnect = false
        if (!preserveReconnectCount) {
            reconnectAttempts = 0
            directConnectFailures = 0
        }
        reconnectJob?.cancel()

        // 1. Try previously connected watch address first unless direct connect failed repeatedly
        val savedAddr = prefs.getLastWatchAddress()
        if (!savedAddr.isNullOrBlank() && directConnectFailures < 2) {
            try {
                val savedDevice = bluetoothAdapter.getRemoteDevice(savedAddr)
                Log.d(TAG, "Connecting to saved watch: $savedAddr")
                connectToDevice(savedDevice)
                return
            } catch (e: Exception) {
                Log.w(TAG, "Invalid saved watch address: $savedAddr", e)
            }
        }

        // 2. Check OS bonded devices if direct connect hasn't already failed repeatedly
        if (directConnectFailures < 2) {
            val bonded = bluetoothAdapter.bondedDevices
            val pairedWatch = bonded?.firstOrNull { d ->
                val name = d.name ?: ""
                name.contains("WristOS", ignoreCase = true) ||
                    name.contains("PineTime", ignoreCase = true) ||
                    name.contains("InfiniTime", ignoreCase = true)
            }
            if (pairedWatch != null) {
                Log.d(TAG, "Found bonded watch: ${pairedWatch.name} (${pairedWatch.address})")
                connectToDevice(pairedWatch)
                return
            }
        }

        // 3. Active LE scan (always picks up fresh advertising packets regardless of cached MAC/GATT state)
        startActiveScan()
    }

    fun startActiveScan() {
        val scanner = bluetoothAdapter?.bluetoothLeScanner ?: return
        if (!bluetoothAdapter.isEnabled || !hasBluetoothScanPermission()) return

        stopScan()
        isScanning = true
        _watchData.value = _watchData.value.copy(connectionState = WatchConnectionState.SCANNING)

        val scanMode = if (reconnectAttempts <= 2) {
            ScanSettings.SCAN_MODE_LOW_LATENCY
        } else {
            // Balanced mode prevents Android background scan throttling during long disconnections
            ScanSettings.SCAN_MODE_BALANCED
        }
        val settings = ScanSettings.Builder()
            .setScanMode(scanMode)
            .setReportDelay(0)
            .build()

        val filters = listOf(
            ScanFilter.Builder().setDeviceName("WristOS").build(),
            ScanFilter.Builder().setDeviceName("PineTime").build(),
            ScanFilter.Builder().setServiceUuid(ParcelUuid(BleConstants.SERVICE_CTS)).build(),
            ScanFilter.Builder().setServiceUuid(ParcelUuid(BleConstants.SERVICE_HRS)).build()
        )

        try {
            scanner.startScan(filters, settings, scanCallback)
        } catch (e: Exception) {
            Log.w(TAG, "Filtered scan start failed; falling back to open low-latency scan", e)
            try {
                scanner.startScan(scanCallback)
            } catch (ex: Exception) {
                Log.e(TAG, "Open LE scan failed", ex)
                isScanning = false
                _watchData.value = _watchData.value.copy(connectionState = WatchConnectionState.DISCONNECTED)
                return
            }
        }

        // Scan window watchdog (15s) -> retry or backoff instead of burning battery forever
        connectionWatchdogJob?.cancel()
        connectionWatchdogJob = scope.launch {
            delay(15_000L)
            if (isScanning && _watchData.value.connectionState == WatchConnectionState.SCANNING) {
                Log.d(TAG, "LE scan window ended without finding watch; pausing before retry")
                stopScan()
                _watchData.value = _watchData.value.copy(connectionState = WatchConnectionState.DISCONNECTED)
                scheduleReconnect()
            }
        }
    }

    fun stopScan() {
        if (isScanning) {
            try {
                bluetoothAdapter?.bluetoothLeScanner?.stopScan(scanCallback)
            } catch (_: Exception) {
            }
            isScanning = false
        }
    }

    private fun connectToDevice(device: BluetoothDevice) {
        if (!hasBluetoothConnectPermission()) return
        stopScan()
        connectionWatchdogJob?.cancel()
        cleanupGatt()
        refreshedCacheForCurrentGatt = false

        _watchData.value = _watchData.value.copy(connectionState = WatchConnectionState.CONNECTING)

        val gatt = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            device.connectGatt(appContext, false, gattCallback, BluetoothDevice.TRANSPORT_LE)
        } else {
            device.connectGatt(appContext, false, gattCallback)
        }
        bluetoothGatt = gatt

        connectionWatchdogJob = scope.launch {
            delay(7000L)
            if (_watchData.value.connectionState == WatchConnectionState.CONNECTING) {
                Log.d(TAG, "Direct connect timed out (>7s); falling back to LE scan")
                directConnectFailures++
                cleanupGatt()
                startActiveScan()
            }
        }
    }

    fun disconnect() {
        isExplicitDisconnect = true
        connectionWatchdogJob?.cancel()
        connectionWatchdogJob = null
        reconnectJob?.cancel()
        reconnectJob = null
        stopScan()
        cleanupGatt()
        _watchData.value = _watchData.value.copy(connectionState = WatchConnectionState.DISCONNECTED)
    }

    private fun cleanupGatt(alreadyDisconnected: Boolean = false) {
        periodicSyncJob?.cancel()
        periodicSyncJob = null
        clearGattQueue()
        try {
            if (!alreadyDisconnected) {
                bluetoothGatt?.disconnect()
            }
            bluetoothGatt?.close()
        } catch (_: Exception) {
        } finally {
            bluetoothGatt = null
        }
    }

    private fun refreshGattCache(gatt: BluetoothGatt?): Boolean {
        return try {
            val refreshMethod = gatt?.javaClass?.getMethod("refresh")
            (refreshMethod?.invoke(gatt) as? Boolean) ?: false
        } catch (_: Exception) {
            false
        }
    }

    fun forceSyncTelemetry() {
        val gatt = bluetoothGatt ?: run {
            startScan()
            return
        }
        enqueueGattOp { syncCurrentTime(gatt) }
        enqueueGattOp { readBattery(gatt) }
        enqueueGattOp { readSteps(gatt) }
    }

    private fun writeCharacteristicCompat(
        gatt: BluetoothGatt,
        char: BluetoothGattCharacteristic,
        payload: ByteArray
    ): Boolean {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            val code = gatt.writeCharacteristic(char, payload, BluetoothGattCharacteristic.WRITE_TYPE_DEFAULT)
            code == BluetoothStatusCodes.SUCCESS
        } else {
            @Suppress("DEPRECATION")
            char.value = payload
            @Suppress("DEPRECATION")
            gatt.writeCharacteristic(char)
        }
    }

    private fun writeDescriptorCompat(
        gatt: BluetoothGatt,
        descriptor: BluetoothGattDescriptor,
        value: ByteArray
    ): Boolean {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            val code = gatt.writeDescriptor(descriptor, value)
            code == BluetoothStatusCodes.SUCCESS
        } else {
            @Suppress("DEPRECATION")
            descriptor.value = value
            @Suppress("DEPRECATION")
            gatt.writeDescriptor(descriptor)
        }
    }

    private fun syncCurrentTime(gatt: BluetoothGatt): Boolean {
        val cts = gatt.getService(BleConstants.SERVICE_CTS) ?: return false
        val char = cts.getCharacteristic(BleConstants.CHAR_CURRENT_TIME) ?: return false

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
            0,
            1
        )
        return writeCharacteristicCompat(gatt, char, payload)
    }

    private fun readBattery(gatt: BluetoothGatt): Boolean {
        val bas = gatt.getService(BleConstants.SERVICE_BAS) ?: return false
        val char = bas.getCharacteristic(BleConstants.CHAR_BATTERY_LEVEL) ?: return false
        return gatt.readCharacteristic(char)
    }

    private fun readSteps(gatt: BluetoothGatt): Boolean {
        val motion = gatt.getService(BleConstants.SERVICE_MOTION) ?: return false
        val char = motion.getCharacteristic(BleConstants.CHAR_STEPS) ?: return false
        return gatt.readCharacteristic(char)
    }

    private fun enableNotifications(gatt: BluetoothGatt, serviceUuid: UUID, charUuid: UUID): Boolean {
        val service = gatt.getService(serviceUuid) ?: return false
        val char = service.getCharacteristic(charUuid) ?: return false

        gatt.setCharacteristicNotification(char, true)
        val descriptor = char.getDescriptor(BleConstants.CLIENT_CHARACTERISTIC_CONFIG) ?: return false
        return writeDescriptorCompat(gatt, descriptor, BluetoothGattDescriptor.ENABLE_NOTIFICATION_VALUE)
    }

    private fun handleCharacteristicData(char: BluetoothGattCharacteristic, data: ByteArray? = char.value) {
        val bytes = data ?: return
        when (char.uuid) {
            BleConstants.CHAR_HEART_RATE_MEASUREMENT -> {
                if (bytes.size >= 2) {
                    val hr = if (bytes[0].toInt() and 0x01 == 0) {
                        bytes[1].toInt() and 0xFF
                    } else if (bytes.size >= 3) {
                        (bytes[1].toInt() and 0xFF) or ((bytes[2].toInt() and 0xFF) shl 8)
                    } else 0
                    if (hr > 0) {
                        _watchData.value = _watchData.value.copy(
                            heartRate = hr,
                            lastSyncTime = System.currentTimeMillis()
                        )
                    }
                }
            }
            BleConstants.CHAR_STEPS -> {
                if (bytes.size >= 4) {
                    val steps = (bytes[0].toInt() and 0xFF) or
                        ((bytes[1].toInt() and 0xFF) shl 8) or
                        ((bytes[2].toInt() and 0xFF) shl 16) or
                        ((bytes[3].toInt() and 0xFF) shl 24)
                    _watchData.value = _watchData.value.copy(
                        stepCount = steps,
                        lastSyncTime = System.currentTimeMillis()
                    )
                }
            }
            BleConstants.CHAR_BATTERY_LEVEL -> {
                if (bytes.isNotEmpty()) {
                    _watchData.value = _watchData.value.copy(
                        batteryLevel = bytes[0].toInt() and 0xFF,
                        lastSyncTime = System.currentTimeMillis()
                    )
                }
            }
            BleConstants.CHAR_MUSIC_EVENT -> {
                if (bytes.isNotEmpty() && (bytes[0].toInt() and 0xFF) == 0xAA) {
                    Log.d(TAG, "Received EVENT_TRIGGER_AI (0xAA) from watch!")
                    _pendingAiTrigger.value = System.currentTimeMillis()
                    _aiTriggerEvent.tryEmit(Unit)
                    scope.launch {
                        wakePhoneForAi()
                    }
                }
            }
        }
    }

    fun triggerAiManually() {
        _pendingAiTrigger.value = System.currentTimeMillis()
        _aiTriggerEvent.tryEmit(Unit)
    }

    fun consumePendingAiTrigger(): Boolean {
        return if (_pendingAiTrigger.value != 0L) {
            _pendingAiTrigger.value = 0L
            true
        } else {
            false
        }
    }

    private fun ensureAiWakeChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val manager = appContext.getSystemService(NotificationManager::class.java) ?: return
            if (manager.getNotificationChannel(AI_WAKE_CHANNEL_ID) == null) {
                val channel = NotificationChannel(
                    AI_WAKE_CHANNEL_ID,
                    "Watch AI Wake Trigger",
                    NotificationManager.IMPORTANCE_HIGH
                ).apply {
                    description = "Wakes the phone screen and opens WristOS AI when triggered from your watch"
                    setShowBadge(false)
                    enableVibration(false)
                    setSound(null, null)
                    lockscreenVisibility = android.app.Notification.VISIBILITY_PUBLIC
                }
                manager.createNotificationChannel(channel)
            }
        }
    }

    fun dismissWakeNotification() {
        try {
            val manager = appContext.getSystemService(NotificationManager::class.java)
            manager?.cancel(AI_WAKE_NOTIFICATION_ID)
        } catch (_: Exception) {
        }
    }

    private fun wakePhoneForAi() {
        try {
            // 1. Wake screen/CPU even when phone is locked or sleeping
            val powerManager = appContext.getSystemService(Context.POWER_SERVICE) as? PowerManager
            val isScreenInteractive = powerManager?.isInteractive == true
            @Suppress("DEPRECATION")
            val wakeLock = powerManager?.newWakeLock(
                PowerManager.SCREEN_BRIGHT_WAKE_LOCK or
                    PowerManager.ACQUIRE_CAUSES_WAKEUP or
                    PowerManager.ON_AFTER_RELEASE,
                "wristos:ai_wake"
            )
            wakeLock?.acquire(10_000L)

            // 2. Haptic buzz confirmation
            if (prefs.vibrationAlerts.value) {
                val vibrator = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                    val vm = appContext.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as? VibratorManager
                    vm?.defaultVibrator
                } else {
                    @Suppress("DEPRECATION")
                    appContext.getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
                }
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    vibrator?.vibrate(VibrationEffect.createOneShot(180, VibrationEffect.DEFAULT_AMPLITUDE))
                } else {
                    @Suppress("DEPRECATION")
                    vibrator?.vibrate(180)
                }
            }

            if (isAppInForeground && isScreenInteractive) {
                // MainScreen & AssistantScreen are already active and will immediately start the mic
                return
            }

            // 3. Build Activity Intent + Full-Screen Intent Notification (required for Android 10-16 lockscreen/background wake)
            val intent = Intent(appContext, MainActivity::class.java).apply {
                action = ACTION_TRIGGER_AI
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or
                    Intent.FLAG_ACTIVITY_SINGLE_TOP or
                    Intent.FLAG_ACTIVITY_REORDER_TO_FRONT or
                    Intent.FLAG_ACTIVITY_CLEAR_TOP
            }

            val pendingFlags = PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            val fullScreenPendingIntent = PendingIntent.getActivity(appContext, 1002, intent, pendingFlags)

            ensureAiWakeChannel()
            val wakeNotification = NotificationCompat.Builder(appContext, AI_WAKE_CHANNEL_ID)
                .setSmallIcon(R.mipmap.ic_launcher)
                .setContentTitle("WristOS AI Activated")
                .setContentText("Watch triggered voice assistant • Tap to speak")
                .setPriority(NotificationCompat.PRIORITY_MAX)
                .setCategory(NotificationCompat.CATEGORY_CALL)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .setAutoCancel(true)
                .setTimeoutAfter(12_000L)
                .setContentIntent(fullScreenPendingIntent)
                .setFullScreenIntent(fullScreenPendingIntent, true)
                .addAction(0, "Speak Now", fullScreenPendingIntent)
                .build()

            val notifManager = appContext.getSystemService(NotificationManager::class.java)
            if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU ||
                ContextCompat.checkSelfPermission(appContext, android.Manifest.permission.POST_NOTIFICATIONS) ==
                PackageManager.PERMISSION_GRANTED
            ) {
                notifManager?.notify(AI_WAKE_NOTIFICATION_ID, wakeNotification)
            }

            // 4. Direct launch (succeeds immediately when app was recently active or SYSTEM_ALERT_WINDOW is granted)
            try {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
                    val options = ActivityOptions.makeBasic()
                        .setPendingIntentBackgroundActivityStartMode(
                            ActivityOptions.MODE_BACKGROUND_ACTIVITY_START_ALLOWED
                        )
                    appContext.startActivity(intent, options.toBundle())
                } else {
                    appContext.startActivity(intent)
                }
            } catch (e: Exception) {
                Log.w(TAG, "Direct background startActivity fell back to FullScreenIntent notification", e)
            }
        } catch (e: Exception) {
            Log.e(TAG, "Could not wake phone for AI trigger", e)
        }
    }

    fun sendAlertNotification(title: String, message: String = "") {
        if (!prefs.notificationsEnabled.value) return
        val gatt = bluetoothGatt ?: return
        enqueueGattOp {
            val ans = gatt.getService(BleConstants.SERVICE_ANS) ?: return@enqueueGattOp false
            val char = ans.getCharacteristic(BleConstants.CHAR_NEW_ALERT) ?: return@enqueueGattOp false

            val titleBytes = title.toByteArray(Charsets.UTF_8).take(32).toByteArray()
            val msgBytes = (if (message.isNotEmpty()) message else title).toByteArray(Charsets.UTF_8).take(64).toByteArray()
            val payload = byteArrayOf(0x05, 0x01, 0x00) + titleBytes + byteArrayOf(0x00) + msgBytes
            writeCharacteristicCompat(gatt, char, payload)
        }
    }

    private fun simulateWatchConnection() {
        scope.launch {
            _watchData.value = _watchData.value.copy(connectionState = WatchConnectionState.CONNECTING)
            delay(800)
            _watchData.value = WatchData(
                deviceName = "PineTime (Simulated)",
                connectionState = WatchConnectionState.CONNECTED,
                heartRate = 74,
                stepCount = 6840,
                batteryLevel = 88,
                lastSyncTime = System.currentTimeMillis()
            )
        }
    }

    companion object {
        private const val TAG = "WatchBleManager"
        const val ACTION_TRIGGER_AI = "com.wristos.app.TRIGGER_AI"
        private const val AI_WAKE_CHANNEL_ID = "wristos_ai_wake_channel"
        private const val AI_WAKE_NOTIFICATION_ID = 1002
    }
}
