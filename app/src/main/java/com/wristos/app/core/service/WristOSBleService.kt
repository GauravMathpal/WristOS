package com.wristos.app.core.service

import android.Manifest
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Intent
import android.content.pm.PackageManager
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.IBinder
import android.util.Log
import androidx.core.app.NotificationCompat
import androidx.core.content.ContextCompat
import com.wristos.app.MainActivity
import com.wristos.app.R
import com.wristos.app.data.ble.BleManagerProvider
import com.wristos.app.data.ble.WatchBleManager
import com.wristos.app.data.ble.WatchConnectionState
import com.wristos.app.data.ble.WatchData
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch

class WristOSBleService : Service() {

    private val serviceScope = CoroutineScope(SupervisorJob() + Dispatchers.Main.immediate)
    private var bleManager: WatchBleManager? = null
    private var isForegroundStarted = false

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()

        if (!hasRequiredBlePermissions()) {
            Log.w(TAG, "Cannot start connectedDevice foreground service yet: missing BLE permissions")
            stopSelf()
            return
        }

        val initialNotification = buildNotification(WatchData())
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                startForeground(
                    NOTIFICATION_ID,
                    initialNotification,
                    ServiceInfo.FOREGROUND_SERVICE_TYPE_CONNECTED_DEVICE
                )
            } else {
                startForeground(NOTIFICATION_ID, initialNotification)
            }
            isForegroundStarted = true
        } catch (e: SecurityException) {
            Log.e(TAG, "Missing permissions to start connectedDevice foreground service", e)
            stopSelf()
            return
        }

        val manager = BleManagerProvider.getInstance(applicationContext)
        bleManager = manager
        manager.startScan()

        // Keep notification status synchronized with watch state
        serviceScope.launch {
            manager.watchData.collect { data ->
                if (isForegroundStarted) {
                    val notifManager = getSystemService(NotificationManager::class.java)
                    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU ||
                        ContextCompat.checkSelfPermission(this@WristOSBleService, Manifest.permission.POST_NOTIFICATIONS) ==
                        PackageManager.PERMISSION_GRANTED
                    ) {
                        notifManager?.notify(NOTIFICATION_ID, buildNotification(data))
                    }
                }
            }
        }
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (!hasRequiredBlePermissions()) {
            stopSelf()
            return START_NOT_STICKY
        }
        bleManager?.ensureScanningOrConnected()
        return START_STICKY
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onDestroy() {
        isForegroundStarted = false
        serviceScope.cancel()
        bleManager = null
        super.onDestroy()
    }

    private fun hasRequiredBlePermissions(): Boolean {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            ContextCompat.checkSelfPermission(this, Manifest.permission.BLUETOOTH_CONNECT) ==
                PackageManager.PERMISSION_GRANTED &&
                ContextCompat.checkSelfPermission(this, Manifest.permission.BLUETOOTH_SCAN) ==
                PackageManager.PERMISSION_GRANTED
        } else {
            ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) ==
                PackageManager.PERMISSION_GRANTED
        }
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                CHANNEL_NAME,
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Keeps the BLE connection to your WristOS watch active in the background"
                setShowBadge(false)
            }
            val manager = getSystemService(NotificationManager::class.java)
            manager?.createNotificationChannel(channel)
        }
    }

    private fun buildNotification(data: WatchData): Notification {
        val openAppIntent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
        val pendingIntent = PendingIntent.getActivity(
            this,
            0,
            openAppIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val (title, subtitle) = when (data.connectionState) {
            WatchConnectionState.CONNECTED ->
                "WristOS • ${data.deviceName} Connected" to
                    "Battery ${data.batteryLevel}% • Listening for Watch AI trigger"
            WatchConnectionState.CONNECTING ->
                "WristOS • Linking Watch..." to "Establishing BLE bridge"
            WatchConnectionState.SCANNING ->
                "WristOS • Scanning for Watch" to "Bring your PineTime / WristOS near phone"
            WatchConnectionState.DISCONNECTED ->
                "WristOS • Auto-Reconnect Active" to "Waiting for watch BLE signal"
        }

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle(title)
            .setContentText(subtitle)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .setOnlyAlertOnce(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()
    }

    companion object {
        private const val TAG = "WristOSBleService"
        const val CHANNEL_ID = "wristos_ble_channel"
        private const val CHANNEL_NAME = "WristOS Watch Connection"
        private const val NOTIFICATION_ID = 1001
    }
}
