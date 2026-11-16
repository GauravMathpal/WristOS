package com.wristos.app.data.ble

import android.content.Context

object BleManagerProvider {
    @Volatile
    private var instance: WatchBleManager? = null

    fun getInstance(context: Context): WatchBleManager {
        return instance ?: synchronized(this) {
            instance ?: WatchBleManager(context.applicationContext).also { instance = it }
        }
    }
}
