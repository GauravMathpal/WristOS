package com.wristos.app.ui.memory

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Bookmark
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

data class MemoryItem(val id: Int, val tag: String, val fact: String, val date: String)

@Composable
fun MemoryScreen() {
    var searchQuery by remember { mutableStateOf("") }
    val memories = remember {
        mutableStateListOf(
            MemoryItem(1, "Personal", "Prefers morning focus sessions between 8 AM and 10 AM", "Nov 14"),
            MemoryItem(2, "Health", "Daily hydration target is 3.5 liters", "Nov 13"),
            MemoryItem(3, "Work", "PineTime firmware BLE service UUID: 0x180D (Heart Rate)", "Nov 12"),
            MemoryItem(4, "Preferences", "Dark theme preferred across all screens", "Nov 11")
        )
    }

    var showDialog by remember { mutableStateOf(false) }
    var newFact by remember { mutableStateOf("") }
    var newTag by remember { mutableStateOf("Personal") }

    Scaffold(
        floatingActionButton = {
            FloatingActionButton(
                onClick = { showDialog = true },
                containerColor = MaterialTheme.colorScheme.primary
            ) {
                Icon(Icons.Default.Add, contentDescription = "Add Memory")
            }
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .background(MaterialTheme.colorScheme.background)
                .padding(padding)
                .padding(16.dp)
        ) {
            Text(
                text = "Personal Memory",
                style = MaterialTheme.typography.headlineMedium,
                fontWeight = FontWeight.Bold
            )
            Text(
                text = "Facts and context WristOS remembers about you",
                fontSize = 13.sp,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )

            Spacer(modifier = Modifier.height(14.dp))

            // Search Bar
            OutlinedTextField(
                value = searchQuery,
                onValueChange = { searchQuery = it },
                placeholder = { Text("Search memories...") },
                leadingIcon = { Icon(Icons.Default.Search, contentDescription = "Search") },
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(24.dp),
                singleLine = true
            )

            Spacer(modifier = Modifier.height(14.dp))

            val filtered = memories.filter {
                it.fact.contains(searchQuery, ignoreCase = true) || it.tag.contains(searchQuery, ignoreCase = true)
            }

            LazyColumn(
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                items(filtered) { item ->
                    Card(
                        shape = RoundedCornerShape(12.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(modifier = Modifier.padding(14.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                SuggestionChip(
                                    onClick = {},
                                    label = { Text(item.tag, fontSize = 11.sp, fontWeight = FontWeight.Bold) }
                                )
                                Text(item.date, fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            }
                            Spacer(modifier = Modifier.height(6.dp))
                            Text(text = item.fact, fontSize = 14.sp)
                        }
                    }
                }
            }
        }

        if (showDialog) {
            AlertDialog(
                onDismissRequest = { showDialog = false },
                title = { Text("Add Memory Item") },
                text = {
                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        OutlinedTextField(
                            value = newTag,
                            onValueChange = { newTag = it },
                            label = { Text("Category (e.g. Work, Health)") },
                            singleLine = true
                        )
                        OutlinedTextField(
                            value = newFact,
                            onValueChange = { newFact = it },
                            label = { Text("What should WristOS remember?") },
                            maxLines = 3
                        )
                    }
                },
                confirmButton = {
                    TextButton(onClick = {
                        if (newFact.isNotBlank()) {
                            memories.add(0, MemoryItem(memories.size + 1, newTag.trim(), newFact.trim(), "Today"))
                            newFact = ""
                            showDialog = false
                        }
                    }) {
                        Text("Save")
                    }
                },
                dismissButton = {
                    TextButton(onClick = { showDialog = false }) {
                        Text("Cancel")
                    }
                }
            )
        }
    }
}
