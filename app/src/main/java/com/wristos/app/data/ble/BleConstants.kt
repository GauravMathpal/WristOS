package com.wristos.app.data.ble

import java.util.UUID

object BleConstants {
    // Current Time Service
    val SERVICE_CTS: UUID = UUID.fromString("00001805-0000-1000-8000-00805f9b34fb")
    val CHAR_CURRENT_TIME: UUID = UUID.fromString("00002a2b-0000-1000-8000-00805f9b34fb")

    // Heart Rate Service
    val SERVICE_HRS: UUID = UUID.fromString("0000180d-0000-1000-8000-00805f9b34fb")
    val CHAR_HEART_RATE_MEASUREMENT: UUID = UUID.fromString("00002a37-0000-1000-8000-00805f9b34fb")

    // Battery Service
    val SERVICE_BAS: UUID = UUID.fromString("0000180f-0000-1000-8000-00805f9b34fb")
    val CHAR_BATTERY_LEVEL: UUID = UUID.fromString("00002a19-0000-1000-8000-00805f9b34fb")

    // Alert Notification Service (PineTime Phone Alerts)
    val SERVICE_ANS: UUID = UUID.fromString("00001811-0000-1000-8000-00805f9b34fb")
    val CHAR_NEW_ALERT: UUID = UUID.fromString("00002a46-0000-1000-8000-00805f9b34fb")

    // InfiniTime Motion Service (Steps)
    val SERVICE_MOTION: UUID = UUID.fromString("00030000-78fc-48fe-8e23-433b3a1942d0")
    val CHAR_STEPS: UUID = UUID.fromString("00030001-78fc-48fe-8e23-433b3a1942d0")

    // InfiniTime / WristOS Event Service (AI Trigger & Media)
    val SERVICE_MUSIC: UUID = UUID.fromString("00000000-78fc-48fe-8e23-433b3a1942d0")
    val CHAR_MUSIC_EVENT: UUID = UUID.fromString("00000001-78fc-48fe-8e23-433b3a1942d0")

    // Nordic Legacy DFU Service advertised in InfiniTime scan response
    val SERVICE_DFU: UUID = UUID.fromString("00001530-1212-efde-1523-785feabcd123")

    // Client Characteristic Configuration Descriptor (for notifications)
    val CLIENT_CHARACTERISTIC_CONFIG: UUID = UUID.fromString("00002902-0000-1000-8000-00805f9b34fb")
}

enum class WatchConnectionState {
    DISCONNECTED,
    SCANNING,
    CONNECTING,
    CONNECTED
}

data class WatchData(
    val deviceName: String = "WatchOS",
    val connectionState: WatchConnectionState = WatchConnectionState.DISCONNECTED,
    val heartRate: Int = 0,
    val stepCount: Int = 0,
    val batteryLevel: Int = 0,
    val lastSyncTime: Long = 0L,
    val statusMessage: String? = null
)
