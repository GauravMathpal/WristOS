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
        FocusSessionEntity::class
    ],
    version = 3,
    exportSchema = false
)
abstract class WristOSDatabase : RoomDatabase() {
    abstract fun taskDao(): TaskDao
    abstract fun memoryDao(): MemoryDao
    abstract fun habitDao(): HabitDao
    abstract fun hydrationDao(): HydrationDao
    abstract fun focusSessionDao(): FocusSessionDao

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

        fun getDatabase(context: Context): WristOSDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    WristOSDatabase::class.java,
                    "wristos_database"
                )
                    .addMigrations(MIGRATION_1_2, MIGRATION_2_3)
                    .build()
                INSTANCE = instance
                instance
            }
        }
    }
}
