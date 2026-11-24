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

@Database(
    entities = [TaskEntity::class, MemoryEntity::class],
    version = 2,
    exportSchema = false
)
abstract class WristOSDatabase : RoomDatabase() {
    abstract fun taskDao(): TaskDao
    abstract fun memoryDao(): MemoryDao

    companion object {
        @Volatile
        private var INSTANCE: WristOSDatabase? = null

        private val MIGRATION_1_2 = object : Migration(1, 2) {
            override fun migrate(db: SupportSQLiteDatabase) {
                db.execSQL("ALTER TABLE tasks ADD COLUMN priority TEXT NOT NULL DEFAULT 'normal'")
                db.execSQL("ALTER TABLE tasks ADD COLUMN category TEXT NOT NULL DEFAULT 'general'")
            }
        }

        fun getDatabase(context: Context): WristOSDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    WristOSDatabase::class.java,
                    "wristos_database"
                )
                    .addMigrations(MIGRATION_1_2)
                    .build()
                INSTANCE = instance
                instance
            }
        }
    }
}
