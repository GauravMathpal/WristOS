package com.wristos.app.navigation

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Assistant
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Dashboard
import androidx.compose.material.icons.filled.Psychology
import androidx.compose.material.icons.filled.Settings
import androidx.compose.ui.graphics.vector.ImageVector

sealed class Screen(val route: String, val title: String, val icon: ImageVector) {
    data object Dashboard : Screen("dashboard", "Dashboard", Icons.Filled.Dashboard)
    data object Assistant : Screen("assistant", "Assistant", Icons.Filled.Assistant)
    data object Tasks : Screen("tasks", "Tasks", Icons.Filled.CheckCircle)
    data object Memory : Screen("memory", "Memory", Icons.Filled.Psychology)
    data object Settings : Screen("settings", "Settings", Icons.Filled.Settings)
}

val bottomNavItems = listOf(
    Screen.Dashboard,
    Screen.Assistant,
    Screen.Tasks,
    Screen.Memory,
    Screen.Settings
)
