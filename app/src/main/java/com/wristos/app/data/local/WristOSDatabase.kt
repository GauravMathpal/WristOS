package com.wristos.app.data.local

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import com.wristos.app.data.local.memory.MemoryDao
import com.wristos.app.data.local.memory.MemoryEntity
import com.wristos.app.data.local.task.TaskDao
import com.wristos.app.data.local.task.TaskEntity

@Database(
    entities = [TaskEntity::class, MemoryEntity::class],
    version = 1,
    exportSchema = false
)
abstract class WristOSDatabase : RoomDatabase() {
    abstract fun taskDao(): TaskDao
    abstract fun memoryDao(): MemoryDao

    companion object {
        @Volatile
        private var INSTANCE: WristOSDatabase? = null

        fun getDatabase(context: Context): WristOSDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    WristOSDatabase::class.java,
                    "wristos_database"
                ).build()
                INSTANCE = instance
                instance
            }
        }
    }
}
