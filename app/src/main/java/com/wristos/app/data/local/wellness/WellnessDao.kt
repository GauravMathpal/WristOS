package com.wristos.app.data.local.wellness

import androidx.room.Dao
import androidx.room.Delete
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import kotlinx.coroutines.flow.Flow

@Dao
interface HabitDao {
    @Query("SELECT * FROM habits ORDER BY createdAt ASC")
    fun getAllHabits(): Flow<List<HabitEntity>>

    @Query("SELECT COUNT(*) FROM habits")
    suspend fun getHabitCount(): Int

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertHabit(habit: HabitEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertHabits(habits: List<HabitEntity>)

    @Update
    suspend fun updateHabit(habit: HabitEntity)

    @Delete
    suspend fun deleteHabit(habit: HabitEntity)
}

@Dao
interface HydrationDao {
    @Query("SELECT * FROM hydration_logs WHERE date = :date LIMIT 1")
    fun observeForDate(date: String): Flow<HydrationEntity?>

    @Query("SELECT * FROM hydration_logs WHERE date = :date LIMIT 1")
    suspend fun getForDate(date: String): HydrationEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsert(entry: HydrationEntity)
}

@Dao
interface FocusSessionDao {
    @Query("SELECT * FROM focus_sessions ORDER BY completedAt DESC")
    fun getAllSessions(): Flow<List<FocusSessionEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertSession(session: FocusSessionEntity)

    @Delete
    suspend fun deleteSession(session: FocusSessionEntity)
}

@Dao
interface DailyActivityDao {
    @Query("SELECT * FROM daily_activity WHERE date = :date LIMIT 1")
    fun observeForDate(date: String): Flow<DailyActivityEntity?>

    @Query("SELECT * FROM daily_activity WHERE date = :date LIMIT 1")
    suspend fun getForDate(date: String): DailyActivityEntity?

    @Query("SELECT * FROM daily_activity ORDER BY date DESC LIMIT 7")
    fun observeRecent(): Flow<List<DailyActivityEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsert(entry: DailyActivityEntity)
}
