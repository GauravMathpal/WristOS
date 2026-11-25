package com.wristos.app.navigation

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.MoreHoriz
import androidx.compose.material.icons.filled.Psychology
import androidx.compose.material.icons.filled.Timer
import androidx.compose.ui.graphics.vector.ImageVector

sealed class Screen(val route: String, val title: String, val icon: ImageVector) {
    data object Dashboard : Screen("dashboard", "Home", Icons.Filled.Home)
    data object Assistant : Screen("assistant", "AI", Icons.Filled.AutoAwesome)
    data object Tasks : Screen("tasks", "Tasks", Icons.Filled.CheckCircle)
    data object Health : Screen("health", "Health", Icons.Filled.Favorite)
    data object Focus : Screen("focus", "Focus", Icons.Filled.Timer)
    data object Memory : Screen("memory", "Memory", Icons.Filled.Psychology)
    data object Settings : Screen("settings", "More", Icons.Filled.MoreHoriz)
}

val bottomNavItems = listOf(
    Screen.Dashboard,
    Screen.Assistant,
    Screen.Tasks,
    Screen.Health,
    Screen.Settings
)
