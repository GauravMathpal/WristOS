package com.wristos.app.ui.memory

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.wristos.app.data.ble.BleManagerProvider
import com.wristos.app.data.local.WristOSDatabase
import com.wristos.app.data.local.memory.MemoryEntity
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch

@OptIn(ExperimentalCoroutinesApi::class)
class MemoryViewModel(application: Application) : AndroidViewModel(application) {
    private val memoryDao = WristOSDatabase.getDatabase(application).memoryDao()
    private val bleManager = BleManagerProvider.getInstance(application)

    private val _searchQuery = MutableStateFlow("")
    val searchQuery: StateFlow<String> = _searchQuery.asStateFlow()

    val memories: StateFlow<List<MemoryEntity>> = _searchQuery
        .flatMapLatest { query ->
            if (query.isBlank()) {
                memoryDao.getAllMemories()
            } else {
                memoryDao.searchMemories(query.trim())
            }
        }
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5000),
            initialValue = emptyList()
        )

    fun onSearchQueryChanged(query: String) {
        _searchQuery.value = query
    }

    fun addMemory(tag: String, fact: String) {
        viewModelScope.launch {
            memoryDao.insertMemory(
                MemoryEntity(
                    tag = tag.trim().ifEmpty { "Personal" },
                    fact = fact.trim()
                )
            )
        }
    }

    fun updateMemory(memory: MemoryEntity, tag: String, fact: String) {
        viewModelScope.launch {
            memoryDao.updateMemory(
                memory.copy(
                    tag = tag.trim().ifEmpty { "Personal" },
                    fact = fact.trim()
                )
            )
        }
    }

    fun deleteMemory(memory: MemoryEntity) {
        viewModelScope.launch {
            memoryDao.deleteMemory(memory)
        }
    }

    fun sendMemoryToWatch(memory: MemoryEntity) {
        val brief = if (memory.fact.length > 48) memory.fact.take(45) + "..." else memory.fact
        bleManager.sendAlertNotification("Vault #${memory.tag}", brief)
    }

    fun queryVaultAnswer(question: String, allMemories: List<MemoryEntity>): String {
        val q = question.trim()
        val lower = q.lowercase()
        val keywords = lower.split(Regex("\\s+")).filter { it.length > 3 }
        val match = allMemories.firstOrNull { mem ->
            val factLower = mem.fact.lowercase()
            val tagLower = mem.tag.lowercase()
            factLower.contains(lower) || tagLower == lower || keywords.any { kw -> factLower.contains(kw) || tagLower.contains(kw) }
        }
        return when {
            match != null -> "Found in #${match.tag}: \"${match.fact}\""
            lower.contains("watch") || lower.contains("pinetime") ->
                "Your smartwatch runs WristOS on Nordic nRF52832 over BLE CTS/HRS/ANS."
            else -> "No exact match for \"$q\". Tap + Store Fact to save it to your Knowledge Vault."
        }
    }
}
