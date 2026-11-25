package com.wristos.app.data.local

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.room.migration.Migration
import androidx.sqlite.db.SupportSQLiteDatabase
import com.wristos.app.data.local.memory.MemoryDao
import com.wristos.app.data.local.memory.MemoryEntity
import com.wristos.app.data.local.task.TaskDao
import com.wristos.app.data.local.task.TaskEntity
import com.wristos.app.data.local.wellness.DailyActivityDao
import com.wristos.app.data.local.wellness.DailyActivityEntity
import com.wristos.app.data.local.wellness.FocusSessionDao
import com.wristos.app.data.local.wellness.FocusSessionEntity
import com.wristos.app.data.local.wellness.HabitDao
import com.wristos.app.data.local.wellness.HabitEntity
import com.wristos.app.data.local.wellness.HydrationDao
import com.wristos.app.data.local.wellness.HydrationEntity

@Database(
    entities = [
        TaskEntity::class,
        MemoryEntity::class,
        HabitEntity::class,
        HydrationEntity::class,
        FocusSessionEntity::class,
        DailyActivityEntity::class
    ],
    version = 4,
    exportSchema = false
)
abstract class WristOSDatabase : RoomDatabase() {
    abstract fun taskDao(): TaskDao
    abstract fun memoryDao(): MemoryDao
    abstract fun habitDao(): HabitDao
    abstract fun hydrationDao(): HydrationDao
    abstract fun focusSessionDao(): FocusSessionDao
    abstract fun dailyActivityDao(): DailyActivityDao

    companion object {
        @Volatile
        private var INSTANCE: WristOSDatabase? = null

        private val MIGRATION_1_2 = object : Migration(1, 2) {
            override fun migrate(db: SupportSQLiteDatabase) {
                db.execSQL("ALTER TABLE tasks ADD COLUMN priority TEXT NOT NULL DEFAULT 'normal'")
                db.execSQL("ALTER TABLE tasks ADD COLUMN category TEXT NOT NULL DEFAULT 'general'")
            }
        }

        private val MIGRATION_2_3 = object : Migration(2, 3) {
            override fun migrate(db: SupportSQLiteDatabase) {
                db.execSQL(
                    """
                    CREATE TABLE IF NOT EXISTS habits (
                        id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
                        title TEXT NOT NULL,
                        category TEXT NOT NULL DEFAULT 'Health',
                        streakCount INTEGER NOT NULL DEFAULT 0,
                        lastCompletedDate TEXT NOT NULL DEFAULT '',
                        createdAt INTEGER NOT NULL
                    )
                    """.trimIndent()
                )
                db.execSQL(
                    """
                    CREATE TABLE IF NOT EXISTS hydration_logs (
                        date TEXT PRIMARY KEY NOT NULL,
                        amountMl INTEGER NOT NULL DEFAULT 0,
                        goalMl INTEGER NOT NULL DEFAULT 2500,
                        updatedAt INTEGER NOT NULL
                    )
                    """.trimIndent()
                )
                db.execSQL(
                    """
                    CREATE TABLE IF NOT EXISTS focus_sessions (
                        id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
                        mode TEXT NOT NULL,
                        tag TEXT NOT NULL DEFAULT '#General',
                        durationMinutes INTEGER NOT NULL,
                        completedAt INTEGER NOT NULL
                    )
                    """.trimIndent()
                )
            }
        }

        private val MIGRATION_3_4 = object : Migration(3, 4) {
            override fun migrate(db: SupportSQLiteDatabase) {
                db.execSQL(
                    """
                    CREATE TABLE IF NOT EXISTS daily_activity (
                        date TEXT PRIMARY KEY NOT NULL,
                        steps INTEGER NOT NULL DEFAULT 0,
                        lastHeartRate INTEGER NOT NULL DEFAULT 0,
                        lastSyncedAt INTEGER NOT NULL DEFAULT 0
                    )
                    """.trimIndent()
                )
                // Remove synthetic pre-seeded fake defaults introduced in v3
                db.execSQL("DELETE FROM hydration_logs WHERE amountMl = 1250")
                db.execSQL("UPDATE habits SET streakCount = 0 WHERE lastCompletedDate = '' AND streakCount IN (2, 3, 4, 5)")
            }
        }

        fun getDatabase(context: Context): WristOSDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    WristOSDatabase::class.java,
                    "wristos_database"
                )
                    .addMigrations(MIGRATION_1_2, MIGRATION_2_3, MIGRATION_3_4)
                    .build()
                INSTANCE = instance
                instance
            }
        }
    }
}
