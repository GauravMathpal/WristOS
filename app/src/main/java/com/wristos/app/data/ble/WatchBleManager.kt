package com.wristos.app.data.ble

import android.annotation.SuppressLint
import android.app.ActivityOptions
import android.app.KeyguardManager
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
    private var isPassiveAutoConnectGatt = false
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
    private data class QueuedGattOp(val op: () -> Boolean, val retriesLeft: Int = 3)
    private val gattOpQueue = ArrayDeque<QueuedGattOp>()
    private var isGattOpInFlight = false
    private var gattOpTimeoutJob: Job? = null
    private var gattOpRetryJob: Job? = null

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
                    serviceUuids.contains(BleConstants.SERVICE_BAS) ||
                    serviceUuids.contains(BleConstants.SERVICE_DFU) ||
                    serviceUuids.contains(BleConstants.SERVICE_MUSIC) ||
                    serviceUuids.contains(BleConstants.SERVICE_MOTION)

                if (hasMatch || hasServices) {
                    Log.d(TAG, "Discovered watch via LE scan: $name (${device.address})")
                    prefs.setLastWatch(device.address, name.ifBlank { "WristOS" })
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
                        lastSyncTime = System.currentTimeMillis(),
                        statusMessage = null
                    )
                    gatt?.discoverServices()
                } else if (newState == BluetoothProfile.STATE_DISCONNECTED || status != BluetoothGatt.GATT_SUCCESS) {
                    Log.w(TAG, "GATT disconnected (status=$status, newState=$newState)")
                    if (status != BluetoothGatt.GATT_SUCCESS || newState != BluetoothProfile.STATE_CONNECTED) {
                        directConnectFailures++
                    }
                    cleanupGatt(alreadyDisconnected = (newState == BluetoothProfile.STATE_DISCONNECTED))
                    _watchData.value = _watchData.value.copy(
                        connectionState = WatchConnectionState.DISCONNECTED,
                        statusMessage = if (status == 133 || status == 5 || status == 19) "Re-scanning for watch..." else null
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

                    // Give Android GATT stack a short settle window after discovery so initial CCCD writes don't hit BUSY
                    delay(180L)
                    if (gatt !== bluetoothGatt) return@launch

                    clearGattQueue()
                    musicNotifyRetries = 0
                    enqueueGattOp { enableNotifications(gatt, BleConstants.SERVICE_MUSIC, BleConstants.CHAR_MUSIC_EVENT) }
                    enqueueGattOp { syncCurrentTime(gatt) }
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
        gattOpQueue.addLast(QueuedGattOp(op, retriesLeft = 3))
        processNextGattOp()
    }

    private fun processNextGattOp() {
        if (isGattOpInFlight) return
        while (gattOpQueue.isNotEmpty()) {
            val item = gattOpQueue.removeFirst()
            val started = try {
                item.op()
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
            } else if (item.retriesLeft > 0 && bluetoothGatt != null) {
                // Retry after short settle when Android GATT returns BUSY right after discovery
                gattOpQueue.addFirst(item.copy(retriesLeft = item.retriesLeft - 1))
                gattOpRetryJob?.cancel()
                gattOpRetryJob = scope.launch {
                    delay(260L)
                    processNextGattOp()
                }
                return
            }
        }
    }

    private fun finishCurrentGattOp() {
        gattOpTimeoutJob?.cancel()
        gattOpTimeoutJob = null
        gattOpRetryJob?.cancel()
        gattOpRetryJob = null
        isGattOpInFlight = false
        processNextGattOp()
    }

    private fun clearGattQueue() {
        gattOpTimeoutJob?.cancel()
        gattOpTimeoutJob = null
        gattOpRetryJob?.cancel()
        gattOpRetryJob = null
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
        if (state == WatchConnectionState.DISCONNECTED && (!isScanning || isPassiveAutoConnectGatt)) {
            startScan()
        }
    }

    fun startScan(preserveReconnectCount: Boolean = false, forceActiveScan: Boolean = false) {
        if (bluetoothAdapter == null || !bluetoothAdapter.isEnabled) {
            _watchData.value = _watchData.value.copy(
                connectionState = WatchConnectionState.DISCONNECTED,
                statusMessage = "Turn on Bluetooth to connect"
            )
            return
        }

        if (!hasBluetoothConnectPermission() || !hasBluetoothScanPermission()) {
            Log.w(TAG, "Missing Bluetooth permissions; deferring scan")
            _watchData.value = _watchData.value.copy(
                connectionState = WatchConnectionState.DISCONNECTED,
                statusMessage = "Allow Nearby Devices permission"
            )
            return
        }

        val scanner = bluetoothAdapter.bluetoothLeScanner
        if (scanner == null) {
            _watchData.value = _watchData.value.copy(
                connectionState = WatchConnectionState.DISCONNECTED,
                statusMessage = "BLE scanner unavailable"
            )
            return
        }

        isExplicitDisconnect = false
        if (!preserveReconnectCount) {
            reconnectAttempts = 0
            if (!forceActiveScan) {
                directConnectFailures = 0
            }
        }
        reconnectJob?.cancel()

        if (isPassiveAutoConnectGatt && bluetoothGatt != null) {
            cleanupGatt()
        }

        // First check if Android OS already maintains an active GATT/ACL connection (e.g. after app swipe-close & reopen)
        val osConnectedWatch = findAlreadyConnectedWatch()
        if (osConnectedWatch != null) {
            Log.d(TAG, "Found OS-connected watch via BluetoothManager: ${osConnectedWatch.name} (${osConnectedWatch.address})")
            prefs.setLastWatch(osConnectedWatch.address, osConnectedWatch.name?.takeIf { it.isNotBlank() } ?: "WristOS")
            connectToDevice(osConnectedWatch)
            return
        }

        // When user explicitly taps Connect or direct connect failed previously, run active LE scan directly
        if (!forceActiveScan && directConnectFailures == 0) {
            val savedAddr = prefs.getLastWatchAddress()
            if (!savedAddr.isNullOrBlank()) {
                try {
                    val savedDevice = bluetoothAdapter.getRemoteDevice(savedAddr)
                    if (savedDevice.type != BluetoothDevice.DEVICE_TYPE_UNKNOWN) {
                        Log.d(TAG, "Connecting to known watch: $savedAddr")
                        connectToDevice(savedDevice)
                        return
                    }
                } catch (e: Exception) {
                    Log.w(TAG, "Invalid saved watch address: $savedAddr", e)
                }
            }
        }

        // Active LE scan discovers WristOS / PineTime regardless of cached MAC/random BLE address
        startActiveScan()
    }

    private fun findAlreadyConnectedWatch(): BluetoothDevice? {
        if (!hasBluetoothConnectPermission()) return null
        val savedAddr = prefs.getLastWatchAddress()
        val connected = try {
            bluetoothManager?.getConnectedDevices(BluetoothProfile.GATT) ?: emptyList()
        } catch (_: Exception) {
            emptyList()
        }
        return connected.firstOrNull { d ->
            val name = try { d.name ?: "" } catch (_: Exception) { "" }
            val matchesName = name.contains("WristOS", ignoreCase = true) ||
                name.contains("PineTime", ignoreCase = true) ||
                name.contains("InfiniTime", ignoreCase = true)
            val matchesSaved = !savedAddr.isNullOrBlank() && d.address.equals(savedAddr, ignoreCase = true)
            matchesName || matchesSaved
        }
    }

    fun startActiveScan() {
        val scanner = bluetoothAdapter?.bluetoothLeScanner ?: return
        if (!bluetoothAdapter.isEnabled || !hasBluetoothScanPermission()) return

        stopScan()
        isScanning = true
        _watchData.value = _watchData.value.copy(
            connectionState = WatchConnectionState.SCANNING,
            statusMessage = "Scanning for WristOS watch..."
        )

        val isForegroundBurst = reconnectAttempts <= 2
        val scanMode = if (isForegroundBurst) {
            ScanSettings.SCAN_MODE_LOW_LATENCY
        } else {
            // Balanced mode prevents Android background scan throttling during long disconnections
            ScanSettings.SCAN_MODE_BALANCED
        }
        val settings = ScanSettings.Builder()
            .setScanMode(scanMode)
            .setReportDelay(0)
            .build()

        val filters = if (isForegroundBurst) {
            // Unfiltered scan guarantees discovery across all Android OEMs regardless of scan-response timing or GAP name cache
            null
        } else {
            listOf(
                ScanFilter.Builder().setDeviceName("WristOS").build(),
                ScanFilter.Builder().setDeviceName("PineTime").build(),
                ScanFilter.Builder().setDeviceName("InfiniTime").build(),
                ScanFilter.Builder().setServiceUuid(ParcelUuid(BleConstants.SERVICE_HRS)).build(),
                ScanFilter.Builder().setServiceUuid(ParcelUuid(BleConstants.SERVICE_DFU)).build()
            )
        }

        try {
            if (filters != null) {
                scanner.startScan(filters, settings, scanCallback)
            } else {
                scanner.startScan(null, settings, scanCallback)
            }
        } catch (e: Exception) {
            Log.w(TAG, "Filtered scan start failed; falling back to open low-latency scan", e)
            try {
                scanner.startScan(scanCallback)
            } catch (ex: Exception) {
                Log.e(TAG, "Open LE scan failed", ex)
                isScanning = false
                _watchData.value = _watchData.value.copy(
                    connectionState = WatchConnectionState.DISCONNECTED,
                    statusMessage = "Enable Location & Bluetooth to scan"
                )
                return
            }
        }

        // Scan window watchdog (22s covers any BLE supervision timeout after app kill) -> hand off to passive autoConnect/retry
        connectionWatchdogJob?.cancel()
        connectionWatchdogJob = scope.launch {
            delay(22_000L)
            if (isScanning && _watchData.value.connectionState == WatchConnectionState.SCANNING) {
                Log.d(TAG, "LE scan window ended without finding watch; switching to passive autoConnect / retry")
                stopScan()
                _watchData.value = _watchData.value.copy(
                    connectionState = WatchConnectionState.DISCONNECTED,
                    statusMessage = "Listening for watch in background..."
                )
                attachBackgroundAutoConnectIfSaved()
                scheduleReconnect()
            }
        }
    }

    private fun attachBackgroundAutoConnectIfSaved() {
        if (isExplicitDisconnect || !hasBluetoothConnectPermission()) return
        val adapter = bluetoothAdapter ?: return
        if (!adapter.isEnabled || bluetoothGatt != null) return
        val savedAddr = prefs.getLastWatchAddress() ?: return
        try {
            val savedDevice = adapter.getRemoteDevice(savedAddr)
            Log.d(TAG, "Attaching low-power autoConnect=true observer for $savedAddr")
            isPassiveAutoConnectGatt = true
            bluetoothGatt = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                savedDevice.connectGatt(appContext, true, gattCallback, BluetoothDevice.TRANSPORT_LE)
            } else {
                savedDevice.connectGatt(appContext, true, gattCallback)
            }
        } catch (_: Exception) {
            isPassiveAutoConnectGatt = false
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
            delay(7500L)
            if (_watchData.value.connectionState == WatchConnectionState.CONNECTING) {
                Log.d(TAG, "Direct connect timed out (>7.5s); falling back to LE scan")
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
        isPassiveAutoConnectGatt = false
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
        // BLE CTS (0x2A2B) uses ISO day of week: 1 = Monday .. 7 = Sunday
        val calDay = calendar.get(Calendar.DAY_OF_WEEK)
        val dayOfWeek = (if (calDay == Calendar.SUNDAY) 7 else calDay - 1).toByte()

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
                    enableVibration(true)
                    setSound(
                        android.media.RingtoneManager.getDefaultUri(android.media.RingtoneManager.TYPE_NOTIFICATION),
                        android.media.AudioAttributes.Builder()
                            .setUsage(android.media.AudioAttributes.USAGE_NOTIFICATION_EVENT)
                            .build()
                    )
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

            val keyguardManager = appContext.getSystemService(Context.KEYGUARD_SERVICE) as? KeyguardManager
            if (isAppInForeground && isScreenInteractive && keyguardManager?.isKeyguardLocked != true) {
                // MainScreen & AssistantScreen are already visible and unlocked; they will start the mic directly
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

            // 4. Launch Activity (works from background when SYSTEM_ALERT_WINDOW is granted or FGS BAL exempt)
            try {
                appContext.startActivity(intent)
            } catch (e: Exception) {
                Log.w(TAG, "Direct startActivity fell back to PendingIntent/FullScreenIntent", e)
            }
            try {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
                    val options = ActivityOptions.makeBasic()
                        .setPendingIntentBackgroundActivityStartMode(
                            ActivityOptions.MODE_BACKGROUND_ACTIVITY_START_ALLOWED
                        )
                    fullScreenPendingIntent.send(appContext, 0, intent, null, null, null, options.toBundle())
                }
            } catch (e: Exception) {
                Log.w(TAG, "PendingIntent background send blocked without overlay/full-screen perm", e)
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

    companion object {
        private const val TAG = "WatchBleManager"
        const val ACTION_TRIGGER_AI = "com.wristos.app.TRIGGER_AI"
        private const val AI_WAKE_CHANNEL_ID = "wristos_ai_wake_v2"
        private const val AI_WAKE_NOTIFICATION_ID = 1002
    }
}
