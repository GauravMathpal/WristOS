package com.wristos.app.ui

import androidx.compose.animation.animateColorAsState
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Icon
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
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
import com.wristos.app.ui.focus.FocusScreen
import com.wristos.app.ui.health.HealthScreen
import com.wristos.app.ui.memory.MemoryScreen
import com.wristos.app.ui.settings.SettingsScreen
import com.wristos.app.ui.tasks.TasksScreen
import com.wristos.app.ui.theme.LocalWristOSPalette
import com.wristos.app.ui.theme.TextPrimary
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

    // Navigate automatically to AI Assistant when Watch sends 0xAA trigger
    LaunchedEffect(pendingAiTrigger) {
        if (pendingAiTrigger != 0L && currentRoute != Screen.Assistant.route) {
            navigateToTab(Screen.Assistant.route)
        }
    }

    Scaffold(
        containerColor = palette.bgPrimary,
        bottomBar = {
            // Web-matched floating glassmorphic bottom nav bar
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(
                        Brush.verticalGradient(
                            listOf(
                                palette.surface.copy(alpha = 0.94f),
                                palette.bgPrimary.copy(alpha = 0.98f)
                            )
                        )
                    )
                    .drawBehind {
                        drawLine(
                            brush = Brush.horizontalGradient(
                                listOf(
                                    palette.gradStart.copy(alpha = 0.2f),
                                    palette.gradStart.copy(alpha = 0.55f),
                                    palette.gradEnd.copy(alpha = 0.55f),
                                    palette.gradStart.copy(alpha = 0.2f)
                                )
                            ),
                            start = Offset(0f, 0f),
                            end = Offset(size.width, 0f),
                            strokeWidth = 2.5f
                        )
                    }
                    .navigationBarsPadding()
                    .padding(horizontal = 8.dp, vertical = 8.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceAround,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    bottomNavItems.forEach { screen ->
                        val selected = currentRoute == screen.route ||
                            (screen == Screen.Settings && (currentRoute == Screen.Memory.route || currentRoute == Screen.Focus.route))
                        val tint by animateColorAsState(
                            targetValue = if (selected) palette.secondary else TextTertiary,
                            label = "navTint"
                        )
                        val isAi = screen == Screen.Assistant

                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.Center,
                            modifier = Modifier
                                .weight(1f)
                                .clip(RoundedCornerShape(16.dp))
                                .clickable(
                                    interactionSource = remember { MutableInteractionSource() },
                                    indication = null
                                ) { navigateToTab(screen.route) }
                                .padding(vertical = 4.dp)
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(width = 46.dp, height = 30.dp)
                                    .clip(CircleShape)
                                    .background(
                                        when {
                                            selected && isAi -> Brush.horizontalGradient(
                                                listOf(palette.gradStart, palette.gradEnd)
                                            )
                                            selected -> Brush.horizontalGradient(
                                                listOf(
                                                    palette.gradStart.copy(alpha = 0.24f),
                                                    palette.gradEnd.copy(alpha = 0.18f)
                                                )
                                            )
                                            else -> Brush.horizontalGradient(listOf(Color.Transparent, Color.Transparent))
                                        }
                                    ),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    imageVector = screen.icon,
                                    contentDescription = screen.title,
                                    tint = if (selected && isAi) TextPrimary else if (selected) palette.primaryVariant else tint,
                                    modifier = Modifier.size(20.dp)
                                )
                            }
                            Spacer(modifier = Modifier.height(2.dp))
                            Text(
                                text = screen.title,
                                fontSize = 10.sp,
                                fontWeight = if (selected) FontWeight.Bold else FontWeight.Medium,
                                color = if (selected) TextPrimary else TextTertiary
                            )
                        }
                    }
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
                    // Ambient Aurora Nebula radial glow shaders matching Web App.tsx
                    drawCircle(
                        brush = Brush.radialGradient(
                            colors = listOf(Color(0xFF6366F1).copy(alpha = 0.18f), Color.Transparent),
                            center = Offset(size.width * 0.15f, size.height * 0.10f),
                            radius = size.width * 0.72f
                        ),
                        radius = size.width * 0.72f,
                        center = Offset(size.width * 0.15f, size.height * 0.10f)
                    )
                    drawCircle(
                        brush = Brush.radialGradient(
                            colors = listOf(palette.gradStart.copy(alpha = 0.16f), Color.Transparent),
                            center = Offset(size.width * 0.85f, size.height * 0.35f),
                            radius = size.width * 0.65f
                        ),
                        radius = size.width * 0.65f,
                        center = Offset(size.width * 0.85f, size.height * 0.35f)
                    )
                    drawCircle(
                        brush = Brush.radialGradient(
                            colors = listOf(palette.gradEnd.copy(alpha = 0.14f), Color.Transparent),
                            center = Offset(size.width * 0.75f, size.height * 0.82f),
                            radius = size.width * 0.70f
                        ),
                        radius = size.width * 0.70f,
                        center = Offset(size.width * 0.75f, size.height * 0.82f)
                    )
                    drawCircle(
                        brush = Brush.radialGradient(
                            colors = listOf(Color(0xFF06B6D4).copy(alpha = 0.09f), Color.Transparent),
                            center = Offset(size.width * 0.22f, size.height * 0.72f),
                            radius = size.width * 0.55f
                        ),
                        radius = size.width * 0.55f,
                        center = Offset(size.width * 0.22f, size.height * 0.72f)
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
                composable(Screen.Tasks.route) {
                    TasksScreen()
                }
                composable(Screen.Health.route) {
                    HealthScreen(onNavigate = { route -> navigateToTab(route) })
                }
                composable(Screen.Focus.route) {
                    FocusScreen(onBack = { navigateToTab(Screen.Dashboard.route) })
                }
                composable(Screen.Memory.route) {
                    MemoryScreen(onBack = { navigateToTab(Screen.Settings.route) })
                }
                composable(Screen.Settings.route) {
                    SettingsScreen(onNavigate = { route -> navigateToTab(route) })
                }
            }
        }
    }
}
