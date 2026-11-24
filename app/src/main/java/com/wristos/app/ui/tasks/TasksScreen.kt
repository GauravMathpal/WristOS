package com.wristos.app.ui.tasks

import androidx.compose.animation.animateColorAsState
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.wristos.app.data.local.task.TaskEntity
import com.wristos.app.ui.theme.*
import kotlinx.coroutines.delay

@Composable
fun TasksScreen(viewModel: TasksViewModel = viewModel()) {
    val tasks by viewModel.tasks.collectAsState()
    val palette = LocalWristOSPalette.current

    var filter by remember { mutableStateOf("all") } // all | pending | completed
    var quickInput by remember { mutableStateOf("") }
    var showDialog by remember { mutableStateOf(false) }
    var newTaskTitle by remember { mutableStateOf("") }
    var newTaskDueTime by remember { mutableStateOf("Today, 6:00 PM") }
    var newTaskPriority by remember { mutableStateOf("normal") }
    var toastMsg by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(toastMsg) {
        if (toastMsg != null) {
            delay(2500L)
            toastMsg = null
        }
    }

    val pendingCount = tasks.count { !it.isCompleted }
    val completedCount = tasks.count { it.isCompleted }
    val filteredTasks = remember(tasks, filter) {
        when (filter) {
            "pending" -> tasks.filter { !it.isCompleted }
            "completed" -> tasks.filter { it.isCompleted }
            else -> tasks
        }
    }

    Scaffold(
        floatingActionButton = {
            FloatingActionButton(
                onClick = { showDialog = true },
                containerColor = palette.primary,
                contentColor = Color(0xFF06040D),
                shape = CircleShape
            ) {
                Icon(Icons.Default.Add, contentDescription = "Add Task")
            }
        },
        containerColor = Color.Transparent
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(horizontal = 18.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Spacer(modifier = Modifier.height(6.dp))

            // Header
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = "SMART AGENDA",
                        style = MaterialTheme.typography.labelMedium,
                        letterSpacing = 1.8.sp,
                        color = palette.primary,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = "Tasks & Reminders",
                        style = MaterialTheme.typography.headlineMedium,
                        fontWeight = FontWeight.ExtraBold,
                        color = TextPrimary
                    )
                }

                Surface(
                    shape = RoundedCornerShape(12.dp),
                    color = palette.surfaceElevated,
                    border = BorderStroke(1.dp, palette.border)
                ) {
                    Text(
                        text = "$pendingCount open",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        color = TextSecondary,
                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp)
                    )
                }
            }

            // Toast
            if (toastMsg != null) {
                Surface(
                    shape = RoundedCornerShape(12.dp),
                    color = EmeraldSuccess.copy(alpha = 0.14f),
                    border = BorderStroke(1.dp, EmeraldSuccess.copy(alpha = 0.4f)),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text(
                        text = "⚡ $toastMsg",
                        color = EmeraldSuccess,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.SemiBold,
                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp)
                    )
                }
            }

            // Natural Language Quick-Add Bar (matches web TasksScreen!)
            Surface(
                shape = RoundedCornerShape(18.dp),
                color = palette.surface,
                border = BorderStroke(1.dp, palette.border),
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(Icons.Default.AutoAwesome, contentDescription = null, tint = palette.secondary, modifier = Modifier.size(18.dp))
                    Spacer(modifier = Modifier.width(8.dp))
                    OutlinedTextField(
                        value = quickInput,
                        onValueChange = { quickInput = it },
                        placeholder = {
                            Text("e.g. Finish lab report by tmr 5pm #urgent", color = TextTertiary, fontSize = 12.sp)
                        },
                        singleLine = true,
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedContainerColor = Color.Transparent,
                            unfocusedContainerColor = Color.Transparent,
                            focusedBorderColor = Color.Transparent,
                            unfocusedBorderColor = Color.Transparent,
                            focusedTextColor = TextPrimary,
                            unfocusedTextColor = TextPrimary
                        ),
                        modifier = Modifier.weight(1f)
                    )
                    Button(
                        onClick = {
                            val summary = viewModel.addNaturalLanguageTask(quickInput)
                            if (summary != null) {
                                toastMsg = "Added $summary"
                                quickInput = ""
                            }
                        },
                        enabled = quickInput.isNotBlank(),
                        colors = ButtonDefaults.buttonColors(containerColor = palette.primary, contentColor = Color(0xFF06040D)),
                        shape = RoundedCornerShape(12.dp),
                        contentPadding = PaddingValues(horizontal = 12.dp, vertical = 8.dp)
                    ) {
                        Text("Add", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }

            // Completion Progress Bar
            if (tasks.isNotEmpty()) {
                val ratio = completedCount.toFloat() / tasks.size.toFloat()
                Surface(
                    shape = RoundedCornerShape(16.dp),
                    color = palette.surface,
                    border = BorderStroke(1.dp, palette.border),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(14.dp)) {
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text("Completion Progress", fontSize = 12.sp, color = TextSecondary)
                            Text("${(ratio * 100).toInt()}%", fontSize = 12.sp, color = palette.primary, fontWeight = FontWeight.Bold)
                        }
                        Spacer(modifier = Modifier.height(8.dp))
                        LinearProgressIndicator(
                            progress = { ratio },
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(6.dp)
                                .clip(RoundedCornerShape(3.dp)),
                            color = palette.primary,
                            trackColor = palette.surfaceElevated
                        )
                    }
                }
            }

            // Filter Pills
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                listOf("all" to "All (${tasks.size})", "pending" to "Pending ($pendingCount)", "completed" to "Done ($completedCount)")
                    .forEach { (id, label) ->
                        val active = filter == id
                        Surface(
                            shape = CircleShape,
                            color = if (active) palette.primary.copy(alpha = 0.2f) else palette.surface,
                            border = BorderStroke(1.dp, if (active) palette.primary else palette.border),
                            modifier = Modifier.clickable { filter = id }
                        ) {
                            Text(
                                text = label,
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold,
                                color = if (active) palette.primary else TextTertiary,
                                modifier = Modifier.padding(horizontal = 14.dp, vertical = 7.dp)
                            )
                        }
                    }
            }

            if (filteredTasks.isEmpty()) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .weight(1f),
                    contentAlignment = Alignment.Center
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text(
                            text = "No tasks queued",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                            color = TextSecondary
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = "Use natural language above or ask WristOS AI",
                            fontSize = 13.sp,
                            color = TextTertiary
                        )
                    }
                }
            } else {
                LazyColumn(
                    verticalArrangement = Arrangement.spacedBy(10.dp),
                    modifier = Modifier.weight(1f)
                ) {
                    items(filteredTasks, key = { it.id }) { task ->
                        TaskCard(
                            task = task,
                            onToggle = { viewModel.toggleTask(task) },
                            onAlertWatch = {
                                viewModel.sendTaskAlertToWatch(task)
                                toastMsg = "Sent \"${task.title}\" alert to watch"
                            },
                            onDelete = { viewModel.deleteTask(task) }
                        )
                    }
                    item { Spacer(modifier = Modifier.height(72.dp)) }
                }
            }
        }

        if (showDialog) {
            AlertDialog(
                onDismissRequest = { showDialog = false },
                containerColor = palette.surfaceElevated,
                title = { Text("Create Task", color = TextPrimary, fontWeight = FontWeight.Bold) },
                text = {
                    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        OutlinedTextField(
                            value = newTaskTitle,
                            onValueChange = { newTaskTitle = it },
                            label = { Text("Task title") },
                            singleLine = true
                        )
                        OutlinedTextField(
                            value = newTaskDueTime,
                            onValueChange = { newTaskDueTime = it },
                            label = { Text("Due time (e.g. Tomorrow, 5:00 PM)") },
                            singleLine = true
                        )
                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            listOf("normal", "high", "urgent").forEach { prio ->
                                FilterChip(
                                    selected = newTaskPriority == prio,
                                    onClick = { newTaskPriority = prio },
                                    label = { Text(prio.uppercase(), fontSize = 11.sp) }
                                )
                            }
                        }
                    }
                },
                confirmButton = {
                    Button(
                        onClick = {
                            if (newTaskTitle.isNotBlank()) {
                                viewModel.addTask(newTaskTitle, newTaskDueTime, newTaskPriority)
                                newTaskTitle = ""
                                newTaskDueTime = "Today, 6:00 PM"
                                newTaskPriority = "normal"
                                showDialog = false
                            }
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = palette.primary, contentColor = Color(0xFF06040D))
                    ) {
                        Text("Add Task")
                    }
                },
                dismissButton = {
                    TextButton(onClick = { showDialog = false }) {
                        Text("Cancel", color = TextSecondary)
                    }
                }
            )
        }
    }
}

@Composable
fun TaskCard(
    task: TaskEntity,
    onToggle: () -> Unit,
    onAlertWatch: () -> Unit,
    onDelete: () -> Unit
) {
    val palette = LocalWristOSPalette.current
    val checkBorderColor by animateColorAsState(
        targetValue = if (task.isCompleted) EmeraldSuccess else palette.primary,
        label = "taskCheckBorder"
    )
    val priorityColor = when (task.priority.lowercase()) {
        "urgent" -> CoralWarning
        "high" -> AmberAlert
        else -> palette.primary
    }

    Surface(
        shape = RoundedCornerShape(18.dp),
        color = if (task.isCompleted) palette.surface.copy(alpha = 0.55f) else palette.surface,
        border = BorderStroke(1.dp, if (task.isCompleted) palette.border else palette.primary.copy(alpha = 0.45f)),
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(14.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(26.dp)
                    .clip(CircleShape)
                    .background(if (task.isCompleted) EmeraldSuccess else Color.Transparent)
                    .border(2.dp, checkBorderColor, CircleShape)
                    .clickable { onToggle() },
                contentAlignment = Alignment.Center
            ) {
                if (task.isCompleted) {
                    Icon(Icons.Default.Check, contentDescription = "Done", tint = Color(0xFF06040D), modifier = Modifier.size(16.dp))
                }
            }

            Spacer(modifier = Modifier.width(12.dp))

            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = task.title,
                    fontWeight = FontWeight.SemiBold,
                    fontSize = 15.sp,
                    textDecoration = if (task.isCompleted) TextDecoration.LineThrough else TextDecoration.None,
                    color = if (task.isCompleted) TextTertiary else TextPrimary
                )
                Spacer(modifier = Modifier.height(4.dp))
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.Schedule, contentDescription = null, tint = TextTertiary, modifier = Modifier.size(12.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(text = task.dueTime, fontSize = 11.sp, color = TextSecondary)
                    }
                    Surface(
                        shape = RoundedCornerShape(6.dp),
                        color = priorityColor.copy(alpha = 0.14f)
                    ) {
                        Text(
                            text = task.priority.uppercase(),
                            fontSize = 9.sp,
                            fontWeight = FontWeight.Bold,
                            color = priorityColor,
                            modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                        )
                    }
                }
            }

            IconButton(onClick = onAlertWatch, modifier = Modifier.size(30.dp)) {
                Icon(Icons.Default.Watch, contentDescription = "Send to Watch", tint = palette.primary, modifier = Modifier.size(17.dp))
            }
            IconButton(onClick = onDelete, modifier = Modifier.size(30.dp)) {
                Icon(Icons.Default.DeleteOutline, contentDescription = "Delete", tint = TextTertiary, modifier = Modifier.size(18.dp))
            }
        }
    }
}
