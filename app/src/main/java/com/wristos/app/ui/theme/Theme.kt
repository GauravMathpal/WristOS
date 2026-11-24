package com.wristos.app.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.graphics.Color
import com.wristos.app.data.local.AppThemePreset

data class WristOSPalette(
    val primary: Color,
    val primaryVariant: Color,
    val secondary: Color,
    val gradStart: Color,
    val gradEnd: Color,
    val bgPrimary: Color,
    val surface: Color,
    val surfaceElevated: Color,
    val border: Color,
    val previewColors: List<Color>
)

fun paletteForPreset(preset: AppThemePreset): WristOSPalette = when (preset) {
    AppThemePreset.AURORA -> WristOSPalette(
        primary = Color(0xFFA78BFA),
        primaryVariant = Color(0xFFC4B5FD),
        secondary = Color(0xFFEC4899),
        gradStart = Color(0xFF8B5CF6),
        gradEnd = Color(0xFFEC4899),
        bgPrimary = Color(0xFF06040D),
        surface = Color(0xFF140E29),
        surfaceElevated = Color(0xFF1C1535),
        border = Color(0xFF2D2654),
        previewColors = listOf(Color(0xFF6366F1), Color(0xFFA855F7), Color(0xFFEC4899))
    )
    AppThemePreset.OCEAN -> WristOSPalette(
        primary = Color(0xFF38BDF8),
        primaryVariant = Color(0xFF7DD3FC),
        secondary = Color(0xFF06B6D4),
        gradStart = Color(0xFF0284C7),
        gradEnd = Color(0xFF06B6D4),
        bgPrimary = Color(0xFF050B14),
        surface = Color(0xFF0D1829),
        surfaceElevated = Color(0xFF15253E),
        border = Color(0xFF1E3A5F),
        previewColors = listOf(Color(0xFF0284C7), Color(0xFF06B6D4), Color(0xFF38BDF8))
    )
    AppThemePreset.EMERALD -> WristOSPalette(
        primary = Color(0xFF34D399),
        primaryVariant = Color(0xFF6EE7B7),
        secondary = Color(0xFF10B981),
        gradStart = Color(0xFF059669),
        gradEnd = Color(0xFF14B8A6),
        bgPrimary = Color(0xFF040E0A),
        surface = Color(0xFF0C1E17),
        surfaceElevated = Color(0xFF132D23),
        border = Color(0xFF1C4736),
        previewColors = listOf(Color(0xFF059669), Color(0xFF10B981), Color(0xFF34D399))
    )
    AppThemePreset.ROSE -> WristOSPalette(
        primary = Color(0xFFFB7185),
        primaryVariant = Color(0xFFFDA4AF),
        secondary = Color(0xFFEC4899),
        gradStart = Color(0xFFE11D48),
        gradEnd = Color(0xFFEC4899),
        bgPrimary = Color(0xFF0D0409),
        surface = Color(0xFF210B17),
        surfaceElevated = Color(0xFF2F1222),
        border = Color(0xFF4D1E37),
        previewColors = listOf(Color(0xFFE11D48), Color(0xFFEC4899), Color(0xFFFB7185))
    )
}

val LocalWristOSPalette = staticCompositionLocalOf { paletteForPreset(AppThemePreset.AURORA) }

@Composable
fun WristOSTheme(
    preset: AppThemePreset = AppThemePreset.AURORA,
    content: @Composable () -> Unit
) {
    val palette = paletteForPreset(preset)
    val colorScheme = darkColorScheme(
        primary = palette.primary,
        onPrimary = Color(0xFF06040D),
        primaryContainer = palette.primary.copy(alpha = 0.16f),
        onPrimaryContainer = palette.primaryVariant,
        secondary = palette.secondary,
        onSecondary = Color(0xFF06040D),
        secondaryContainer = palette.secondary.copy(alpha = 0.2f),
        onSecondaryContainer = TextPrimary,
        tertiary = EmeraldSuccess,
        onTertiary = Color(0xFF06040D),
        background = palette.bgPrimary,
        onBackground = TextPrimary,
        surface = palette.surface,
        onSurface = TextPrimary,
        surfaceVariant = palette.surfaceElevated,
        onSurfaceVariant = TextSecondary,
        error = CoralWarning,
        onError = TextPrimary,
        outline = palette.border
    )

    CompositionLocalProvider(LocalWristOSPalette provides palette) {
        MaterialTheme(
            colorScheme = colorScheme,
            typography = Typography,
            content = content
        )
    }
}
