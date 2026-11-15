package com.wristos.app.data.local.memory

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "memories")
data class MemoryEntity(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val tag: String,
    val fact: String,
    val createdAt: Long = System.currentTimeMillis()
)
