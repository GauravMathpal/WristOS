package com.wristos.app.ui.dashboard

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.wristos.app.data.ble.BleManagerProvider
import com.wristos.app.data.ble.WatchBleManager
import com.wristos.app.data.ble.WatchData
import com.wristos.app.data.local.WristOSDatabase
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.stateIn

class DashboardViewModel(application: Application) : AndroidViewModel(application) {
    private val bleManager = BleManagerProvider.getInstance(application)
    private val database = WristOSDatabase.getDatabase(application)

    val watchData: StateFlow<WatchData> = bleManager.watchData

    val pendingTasksCount: StateFlow<Int> = database.taskDao().getAllTasks()
        .map { tasks -> tasks.count { !it.isCompleted } }
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5000),
            initialValue = 0
        )

    fun connectWatch() {
        bleManager.startScan()
    }

    fun disconnectWatch() {
        bleManager.disconnect()
    }

    fun sendTestAlert() {
        bleManager.sendAlertNotification("WristOS Alert: Focus session starting!")
    }
}
