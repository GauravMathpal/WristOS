package com.wristos.app.ui.theme

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

/**
 * Glassmorphic card matching Web `.glass-card-premium`: vertical dark-nebula gradient,
 * luminous violet/pink border, top inner specular edge, and ambient shadow.
 */
@Composable
fun AuroraGlassCard(
    modifier: Modifier = Modifier,
    cornerRadius: Dp = 24.dp,
    highlightBorder: Boolean = false,
    accentGlow: Color? = null,
    onClick: (() -> Unit)? = null,
    content: @Composable ColumnScope.() -> Unit
) {
    val palette = LocalWristOSPalette.current
    val shape = RoundedCornerShape(cornerRadius)
    val borderBrush = if (highlightBorder) {
        Brush.linearGradient(listOf(palette.gradStart.copy(alpha = 0.75f), palette.gradEnd.copy(alpha = 0.75f)))
    } else {
        Brush.linearGradient(
            listOf(
                palette.primary.copy(alpha = 0.28f),
                Color.White.copy(alpha = 0.08f),
                palette.secondary.copy(alpha = 0.18f)
            )
        )
    }

    val cardBrush = Brush.verticalGradient(
        colors = listOf(
            palette.surfaceElevated.copy(alpha = 0.92f),
            palette.surface.copy(alpha = 0.88f),
            palette.bgPrimary.copy(alpha = 0.94f)
        )
    )

    val glowColor = accentGlow ?: palette.gradStart
    val baseMod = modifier
        .shadow(
            elevation = 14.dp,
            shape = shape,
            ambientColor = glowColor.copy(alpha = 0.22f),
            spotColor = glowColor.copy(alpha = 0.26f)
        )
        .clip(shape)
        .background(cardBrush, shape)
        .border(BorderStroke(1.dp, borderBrush), shape)
        .drawBehind {
            drawLine(
                color = Color.White.copy(alpha = 0.11f),
                start = Offset(cornerRadius.toPx(), 1f),
                end = Offset(size.width - cornerRadius.toPx(), 1f),
                strokeWidth = 1.5f
            )
        }

    val finalMod = if (onClick != null) baseMod.clickable(onClick = onClick) else baseMod

    Column(modifier = finalMod, content = content)
}

@Composable
fun AuroraPillBadge(
    text: String,
    color: Color,
    modifier: Modifier = Modifier
) {
    Surface(
        shape = CircleShape,
        color = color.copy(alpha = 0.16f),
        border = BorderStroke(1.dp, color.copy(alpha = 0.42f)),
        modifier = modifier
    ) {
        Text(
            text = text,
            fontSize = 10.sp,
            fontFamily = FontFamily.Monospace,
            fontWeight = FontWeight.Bold,
            color = color,
            modifier = Modifier.padding(horizontal = 9.dp, vertical = 3.dp)
        )
    }
}

@Composable
fun AuroraGradientButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    leadingIcon: (@Composable () -> Unit)? = null
) {
    val palette = LocalWristOSPalette.current
    val shape = RoundedCornerShape(14.dp)
    val bgBrush = if (enabled) {
        Brush.horizontalGradient(listOf(palette.gradStart, palette.gradEnd))
    } else {
        Brush.horizontalGradient(listOf(palette.surfaceElevated, palette.surfaceElevated))
    }

    Row(
        modifier = modifier
            .shadow(
                elevation = if (enabled) 10.dp else 0.dp,
                shape = shape,
                ambientColor = palette.gradEnd.copy(alpha = 0.4f),
                spotColor = palette.gradEnd.copy(alpha = 0.4f)
            )
            .clip(shape)
            .background(bgBrush, shape)
            .border(
                1.dp,
                if (enabled) Color.White.copy(alpha = 0.22f) else palette.border,
                shape
            )
            .clickable(enabled = enabled, onClick = onClick)
            .padding(horizontal = 16.dp, vertical = 11.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.Center
    ) {
        if (leadingIcon != null) {
            leadingIcon()
            Spacer(modifier = Modifier.width(6.dp))
        }
        Text(
            text = text,
            fontSize = 13.sp,
            fontWeight = FontWeight.Bold,
            color = if (enabled) TextPrimary else TextTertiary
        )
    }
}

@Composable
fun AuroraSectionHeader(
    eyebrow: String,
    title: String,
    trailing: (@Composable () -> Unit)? = null
) {
    val palette = LocalWristOSPalette.current
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = eyebrow.uppercase(),
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold,
                letterSpacing = 1.6.sp,
                style = TextStyle(
                    brush = Brush.linearGradient(listOf(palette.primary, palette.secondary))
                )
            )
            Spacer(modifier = Modifier.height(2.dp))
            Text(
                text = title,
                style = MaterialTheme.typography.headlineMedium,
                fontWeight = FontWeight.ExtraBold,
                color = TextPrimary
            )
        }
        if (trailing != null) {
            trailing()
        }
    }
}

@Composable
fun AuroraToastPill(message: String, modifier: Modifier = Modifier) {
    val palette = LocalWristOSPalette.current
    Surface(
        shape = CircleShape,
        color = palette.surfaceElevated.copy(alpha = 0.96f),
        border = BorderStroke(
            1.dp,
            Brush.horizontalGradient(listOf(palette.gradStart, palette.gradEnd))
        ),
        shadowElevation = 12.dp,
        modifier = modifier
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 16.dp, vertical = 9.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                imageVector = Icons.Default.AutoAwesome,
                contentDescription = null,
                tint = palette.secondary,
                modifier = Modifier.size(15.dp)
            )
            Spacer(modifier = Modifier.width(7.dp))
            Text(
                text = message,
                color = TextPrimary,
                fontSize = 12.sp,
                fontWeight = FontWeight.Bold
            )
        }
    }
}
