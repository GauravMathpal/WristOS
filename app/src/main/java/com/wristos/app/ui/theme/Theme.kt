package com.wristos.app.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val WristOSColorScheme = darkColorScheme(
    primary = CyanPrimary,
    onPrimary = CyanOnPrimary,
    primaryContainer = CyanPrimary.copy(alpha = 0.15f),
    onPrimaryContainer = CyanPrimary,

    secondary = VioletSecondary,
    onSecondary = VioletOnSecondary,
    secondaryContainer = VioletSecondary.copy(alpha = 0.2f),
    onSecondaryContainer = Color(0xFFD1C4E9),

    tertiary = EmeraldSuccess,
    onTertiary = CyanOnPrimary,

    background = DarkBackground,
    onBackground = TextPrimary,

    surface = DarkSurface,
    onSurface = TextPrimary,
    surfaceVariant = DarkSurfaceElevated,
    onSurfaceVariant = TextSecondary,

    error = CoralWarning,
    onError = TextPrimary,

    outline = CardBorder
)

@Composable
fun WristOSTheme(
    content: @Composable () -> Unit
) {
    MaterialTheme(
        colorScheme = WristOSColorScheme,
        typography = Typography,
        content = content
    )
}
