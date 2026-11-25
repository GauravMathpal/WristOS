package com.wristos.app.data.local.wellness

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "habits")
data class HabitEntity(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val title: String,
    val category: String = "Health",
    val streakCount: Int = 0,
    val lastCompletedDate: String = "",
    val createdAt: Long = System.currentTimeMillis()
)

@Entity(tableName = "hydration_logs")
data class HydrationEntity(
    @PrimaryKey
    val date: String,
    val amountMl: Int = 0,
    val goalMl: Int = 2500,
    val updatedAt: Long = System.currentTimeMillis()
)

@Entity(tableName = "focus_sessions")
data class FocusSessionEntity(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val mode: String,
    val tag: String = "#General",
    val durationMinutes: Int,
    val completedAt: Long = System.currentTimeMillis()
)

@Entity(tableName = "daily_activity")
data class DailyActivityEntity(
    @PrimaryKey
    val date: String,
    val steps: Int = 0,
    val lastHeartRate: Int = 0,
    val lastSyncedAt: Long = 0L
)
