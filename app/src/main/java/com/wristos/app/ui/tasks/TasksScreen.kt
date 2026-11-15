package com.wristos.app.ui.tasks

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.outlined.RadioButtonUnchecked
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

data class TaskItem(val id: Int, val title: String, val time: String, val isCompleted: Boolean = false)

@Composable
fun TasksScreen() {
    val tasks = remember {
        mutableStateListOf(
            TaskItem(1, "Team sync with Group 2 (BLE Protocol)", "Today, 4:00 PM", false),
            TaskItem(2, "Review InfiniTime sensor documentation", "Today, 6:30 PM", false),
            TaskItem(3, "Walk 10,000 steps daily target", "All Day", true),
            TaskItem(4, "Configure Supabase credentials", "Tomorrow, 10:00 AM", false)
        )
    }

    var showDialog by remember { mutableStateOf(false) }
    var newTaskTitle by remember { mutableStateOf("") }

    Scaffold(
        floatingActionButton = {
            FloatingActionButton(
                onClick = { showDialog = true },
                containerColor = MaterialTheme.colorScheme.primary
            ) {
                Icon(Icons.Default.Add, contentDescription = "Add Task")
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
                text = "Tasks & Reminders",
                style = MaterialTheme.typography.headlineMedium,
                fontWeight = FontWeight.Bold
            )
            Text(
                text = "${tasks.count { !it.isCompleted }} pending tasks",
                fontSize = 13.sp,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )

            Spacer(modifier = Modifier.height(16.dp))

            LazyColumn(
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                items(tasks) { task ->
                    TaskCard(
                        task = task,
                        onToggle = {
                            val idx = tasks.indexOfFirst { it.id == task.id }
                            if (idx != -1) {
                                tasks[idx] = tasks[idx].copy(isCompleted = !tasks[idx].isCompleted)
                            }
                        }
                    )
                }
            }
        }

        if (showDialog) {
            AlertDialog(
                onDismissRequest = { showDialog = false },
                title = { Text("New Task") },
                text = {
                    OutlinedTextField(
                        value = newTaskTitle,
                        onValueChange = { newTaskTitle = it },
                        placeholder = { Text("Enter task description...") },
                        singleLine = true
                    )
                },
                confirmButton = {
                    TextButton(onClick = {
                        if (newTaskTitle.isNotBlank()) {
                            tasks.add(TaskItem(tasks.size + 1, newTaskTitle.trim(), "Today", false))
                            newTaskTitle = ""
                            showDialog = false
                        }
                    }) {
                        Text("Add")
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

@Composable
fun TaskCard(task: TaskItem, onToggle: () -> Unit) {
    Card(
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(
            containerColor = if (task.isCompleted) MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)
            else MaterialTheme.colorScheme.surfaceVariant
        ),
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(14.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            IconButton(onClick = onToggle, modifier = Modifier.size(28.dp)) {
                if (task.isCompleted) {
                    Icon(
                        imageVector = Icons.Filled.CheckCircle,
                        contentDescription = "Completed",
                        tint = Color(0xFF10B981)
                    )
                } else {
                    Icon(
                        imageVector = Icons.Outlined.RadioButtonUnchecked,
                        contentDescription = "Pending",
                        tint = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
            Spacer(modifier = Modifier.width(12.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = task.title,
                    fontWeight = FontWeight.Medium,
                    fontSize = 15.sp,
                    textDecoration = if (task.isCompleted) TextDecoration.LineThrough else TextDecoration.None,
                    color = if (task.isCompleted) MaterialTheme.colorScheme.onSurfaceVariant else MaterialTheme.colorScheme.onSurface
                )
                Text(
                    text = task.time,
                    fontSize = 12.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}
