package com.wristos.app.ui

import androidx.compose.animation.animateColorAsState
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.wristos.app.data.ble.BleManagerProvider
import com.wristos.app.navigation.Screen
import com.wristos.app.navigation.bottomNavItems
import com.wristos.app.ui.assistant.AssistantScreen
import com.wristos.app.ui.dashboard.DashboardScreen
import com.wristos.app.ui.memory.MemoryScreen
import com.wristos.app.ui.settings.SettingsScreen
import com.wristos.app.ui.tasks.TasksScreen
import com.wristos.app.ui.theme.LocalWristOSPalette
import com.wristos.app.ui.theme.TextTertiary

@Composable
fun MainScreen() {
    val navController = rememberNavController()
    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = navBackStackEntry?.destination?.route
    val palette = LocalWristOSPalette.current

    val context = LocalContext.current
    val bleManager = BleManagerProvider.getInstance(context)
    val pendingAiTrigger by bleManager.pendingAiTrigger.collectAsState()

    fun navigateToTab(route: String) {
        if (currentRoute != route) {
            navController.navigate(route) {
                popUpTo(navController.graph.findStartDestination().id) {
                    saveState = true
                }
                launchSingleTop = true
                restoreState = true
            }
        }
    }

    // Durable AI trigger observer: works from cold start, lockscreen wake, or any other tab
    LaunchedEffect(pendingAiTrigger) {
        if (pendingAiTrigger != 0L && currentRoute != Screen.Assistant.route) {
            navigateToTab(Screen.Assistant.route)
        }
    }

    Scaffold(
        containerColor = palette.bgPrimary,
        bottomBar = {
            NavigationBar(
                containerColor = palette.surface.copy(alpha = 0.96f),
                tonalElevation = 0.dp,
                modifier = Modifier
                    .clip(RoundedCornerShape(topStart = 24.dp, topEnd = 24.dp))
                    .drawBehind {
                        drawLine(
                            brush = Brush.horizontalGradient(
                                listOf(
                                    palette.gradStart.copy(alpha = 0.45f),
                                    palette.gradEnd.copy(alpha = 0.45f),
                                    palette.gradStart.copy(alpha = 0.45f)
                                )
                            ),
                            start = Offset(0f, 0f),
                            end = Offset(size.width, 0f),
                            strokeWidth = 2f
                        )
                    }
            ) {
                bottomNavItems.forEach { screen ->
                    val selected = currentRoute == screen.route
                    val iconTint by animateColorAsState(
                        targetValue = if (selected) palette.primary else TextTertiary,
                        label = "navIconTint"
                    )

                    NavigationBarItem(
                        icon = {
                            Icon(
                                imageVector = screen.icon,
                                contentDescription = screen.title,
                                tint = iconTint,
                                modifier = Modifier.size(22.dp)
                            )
                        },
                        label = {
                            Text(
                                text = screen.title,
                                color = if (selected) palette.primary else TextTertiary,
                                style = MaterialTheme.typography.labelSmall
                            )
                        },
                        selected = selected,
                        colors = NavigationBarItemDefaults.colors(
                            indicatorColor = palette.primary.copy(alpha = 0.14f)
                        ),
                        onClick = { navigateToTab(screen.route) }
                    )
                }
            }
        }
    ) { innerPadding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .background(palette.bgPrimary)
                .drawBehind {
                    drawCircle(
                        color = palette.gradStart.copy(alpha = 0.08f),
                        radius = size.width * 0.65f,
                        center = Offset(size.width * 0.18f, size.height * 0.12f)
                    )
                    drawCircle(
                        color = palette.gradEnd.copy(alpha = 0.05f),
                        radius = size.width * 0.55f,
                        center = Offset(size.width * 0.85f, size.height * 0.72f)
                    )
                }
        ) {
            NavHost(
                navController = navController,
                startDestination = Screen.Dashboard.route
            ) {
                composable(Screen.Dashboard.route) {
                    DashboardScreen(onNavigate = { route -> navigateToTab(route) })
                }
                composable(Screen.Assistant.route) {
                    AssistantScreen(onNavigateBack = { navigateToTab(Screen.Dashboard.route) })
                }
                composable(Screen.Tasks.route) { TasksScreen() }
                composable(Screen.Memory.route) { MemoryScreen() }
                composable(Screen.Settings.route) { SettingsScreen() }
            }
        }
    }
}
