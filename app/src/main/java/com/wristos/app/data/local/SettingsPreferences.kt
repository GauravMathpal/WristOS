package com.wristos.app.data.local

import android.content.Context
import android.content.SharedPreferences
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

enum class AppThemePreset(
    val id: String,
    val displayName: String,
    val description: String
) {
    AURORA("aurora", "Aurora Nebula", "Purple, Violet & Pink (Default)"),
    OCEAN("ocean", "Midnight Ocean", "Deep Blue & Cyan Wave"),
    EMERALD("emerald", "Emerald Pulse", "Forest Green & Mint Neon"),
    ROSE("rose", "Rose Cosmos", "Crimson, Magenta & Rose Glow")
}

class SettingsPreferences private constructor(context: Context) {

    private val prefs: SharedPreferences =
        context.applicationContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

    private val _userName = MutableStateFlow(prefs.getString(KEY_USER_NAME, "Gaurav") ?: "Gaurav")
    val userName: StateFlow<String> = _userName.asStateFlow()

    private val _dailyStepGoal = MutableStateFlow(prefs.getInt(KEY_STEP_GOAL, 10000))
    val dailyStepGoal: StateFlow<Int> = _dailyStepGoal.asStateFlow()

    private val _autoSync = MutableStateFlow(prefs.getBoolean(KEY_AUTO_SYNC, true))
    val autoSync: StateFlow<Boolean> = _autoSync.asStateFlow()

    private val _notificationsEnabled = MutableStateFlow(prefs.getBoolean(KEY_NOTIFICATIONS, true))
    val notificationsEnabled: StateFlow<Boolean> = _notificationsEnabled.asStateFlow()

    private val _vibrationAlerts = MutableStateFlow(prefs.getBoolean(KEY_VIBRATION, true))
    val vibrationAlerts: StateFlow<Boolean> = _vibrationAlerts.asStateFlow()

    private val _ttsEnabled = MutableStateFlow(prefs.getBoolean(KEY_TTS_ENABLED, true))
    val ttsEnabled: StateFlow<Boolean> = _ttsEnabled.asStateFlow()

    private val _autoListenOnTrigger = MutableStateFlow(prefs.getBoolean(KEY_AUTO_LISTEN, true))
    val autoListenOnTrigger: StateFlow<Boolean> = _autoListenOnTrigger.asStateFlow()

    private val _themePreset = MutableStateFlow(
        AppThemePreset.entries.firstOrNull { it.id == prefs.getString(KEY_THEME_PRESET, "aurora") }
            ?: AppThemePreset.AURORA
    )
    val themePreset: StateFlow<AppThemePreset> = _themePreset.asStateFlow()

    private val _customGeminiApiKey = MutableStateFlow(prefs.getString(KEY_GEMINI_API_KEY, "") ?: "")
    val customGeminiApiKey: StateFlow<String> = _customGeminiApiKey.asStateFlow()

    fun setUserName(name: String) {
        val clean = name.trim().ifEmpty { "Gaurav" }
        prefs.edit().putString(KEY_USER_NAME, clean).apply()
        _userName.value = clean
    }

    fun setDailyStepGoal(goal: Int) {
        val clamped = goal.coerceIn(1000, 50000)
        prefs.edit().putInt(KEY_STEP_GOAL, clamped).apply()
        _dailyStepGoal.value = clamped
    }

    fun setAutoSync(enabled: Boolean) {
        prefs.edit().putBoolean(KEY_AUTO_SYNC, enabled).apply()
        _autoSync.value = enabled
    }

    fun setNotificationsEnabled(enabled: Boolean) {
        prefs.edit().putBoolean(KEY_NOTIFICATIONS, enabled).apply()
        _notificationsEnabled.value = enabled
    }

    fun setVibrationAlerts(enabled: Boolean) {
        prefs.edit().putBoolean(KEY_VIBRATION, enabled).apply()
        _vibrationAlerts.value = enabled
    }

    fun setTtsEnabled(enabled: Boolean) {
        prefs.edit().putBoolean(KEY_TTS_ENABLED, enabled).apply()
        _ttsEnabled.value = enabled
    }

    fun setAutoListenOnTrigger(enabled: Boolean) {
        prefs.edit().putBoolean(KEY_AUTO_LISTEN, enabled).apply()
        _autoListenOnTrigger.value = enabled
    }

    fun setThemePreset(preset: AppThemePreset) {
        prefs.edit().putString(KEY_THEME_PRESET, preset.id).apply()
        _themePreset.value = preset
    }

    fun setCustomGeminiApiKey(key: String) {
        val clean = key.trim()
        prefs.edit().putString(KEY_GEMINI_API_KEY, clean).apply()
        _customGeminiApiKey.value = clean
    }

    fun getLastWatchAddress(): String? = prefs.getString(KEY_LAST_WATCH_ADDRESS, null)

    fun setLastWatch(address: String?, name: String?) {
        prefs.edit()
            .putString(KEY_LAST_WATCH_ADDRESS, address)
            .putString(KEY_LAST_WATCH_NAME, name)
            .apply()
    }

    fun getLastWatchName(): String? = prefs.getString(KEY_LAST_WATCH_NAME, null)

    companion object {
        private const val PREFS_NAME = "wristos_prefs"
        private const val KEY_USER_NAME = "user_name"
        private const val KEY_STEP_GOAL = "daily_step_goal"
        private const val KEY_AUTO_SYNC = "auto_sync"
        private const val KEY_NOTIFICATIONS = "notifications_enabled"
        private const val KEY_VIBRATION = "vibration_alerts"
        private const val KEY_TTS_ENABLED = "tts_enabled"
        private const val KEY_AUTO_LISTEN = "auto_listen_on_trigger"
        private const val KEY_THEME_PRESET = "theme_preset"
        private const val KEY_GEMINI_API_KEY = "custom_gemini_api_key"
        private const val KEY_LAST_WATCH_ADDRESS = "last_watch_address"
        private const val KEY_LAST_WATCH_NAME = "last_watch_name"

        @Volatile
        private var instance: SettingsPreferences? = null

        fun getInstance(context: Context): SettingsPreferences {
            return instance ?: synchronized(this) {
                instance ?: SettingsPreferences(context.applicationContext).also { instance = it }
            }
        }
    }
}
