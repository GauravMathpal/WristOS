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
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
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
    var editingTask by remember { mutableStateOf<TaskEntity?>(null) }
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
        contentWindowInsets = WindowInsets(0, 0, 0, 0),
        floatingActionButton = {
            FloatingActionButton(
                onClick = {
                    editingTask = null
                    newTaskTitle = ""
                    newTaskDueTime = "Today, 6:00 PM"
                    newTaskPriority = "normal"
                    showDialog = true
                },
                containerColor = palette.secondary,
                contentColor = TextPrimary,
                shape = CircleShape
            ) {
                Icon(Icons.Default.Add, contentDescription = "Add Task")
            }
        },
        containerColor = Color.Transparent
    ) { padding ->
        Box(modifier = Modifier.fillMaxSize().padding(padding)) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(horizontal = 16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Spacer(modifier = Modifier.height(6.dp))

                AuroraSectionHeader(
                    eyebrow = "SMART AGENDA",
                    title = "Tasks & Reminders",
                    trailing = {
                        AuroraPillBadge(text = "$pendingCount open", color = palette.primary)
                    }
                )

                // Natural Language Quick-Add Bar inside AuroraGlassCard
                AuroraGlassCard(cornerRadius = 18.dp, highlightBorder = quickInput.isNotBlank()) {
                    Row(
                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 5.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(Icons.Default.AutoAwesome, contentDescription = null, tint = palette.secondary, modifier = Modifier.size(18.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        OutlinedTextField(
                            value = quickInput,
                            onValueChange = { quickInput = it },
                            placeholder = { Text("e.g. Finish lab report by tmr 5pm #urgent", color = TextTertiary, fontSize = 12.sp) },
                            singleLine = true,
                            keyboardOptions = KeyboardOptions(imeAction = ImeAction.Done),
                            keyboardActions = KeyboardActions(
                                onDone = {
                                    if (quickInput.isNotBlank()) {
                                        val summary = viewModel.addNaturalLanguageTask(quickInput)
                                        if (summary != null) {
                                            toastMsg = "Added $summary"
                                            quickInput = ""
                                        }
                                    }
                                }
                            ),
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
                        AuroraGradientButton(
                            text = "Add",
                            enabled = quickInput.isNotBlank(),
                            onClick = {
                                val summary = viewModel.addNaturalLanguageTask(quickInput)
                                if (summary != null) {
                                    toastMsg = "Added $summary"
                                    quickInput = ""
                                }
                            }
                        )
                    }
                }

                // Completion Progress Card
                if (tasks.isNotEmpty()) {
                    val ratio = completedCount.toFloat() / tasks.size.toFloat()
                    AuroraGlassCard(cornerRadius = 18.dp) {
                        Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                Text("Completion Progress", fontSize = 12.sp, color = TextSecondary)
                                Text(
                                    text = "${(ratio * 100).toInt()}%",
                                    fontSize = 12.sp,
                                    fontFamily = FontFamily.Monospace,
                                    color = palette.primaryVariant,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(8.dp)
                                    .clip(CircleShape)
                                    .background(palette.surfaceElevated)
                            ) {
                                Box(
                                    modifier = Modifier
                                        .fillMaxHeight()
                                        .fillMaxWidth(ratio.coerceIn(0f, 1f))
                                        .clip(CircleShape)
                                        .background(Brush.horizontalGradient(listOf(palette.gradStart, palette.gradEnd)))
                                )
                            }
                        }
                    }
                }

                // Filter Pills
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    listOf("all" to "All (${tasks.size})", "pending" to "Pending ($pendingCount)", "completed" to "Done ($completedCount)")
                        .forEach { (id, label) ->
                            val active = filter == id
                            Surface(
                                shape = CircleShape,
                                color = if (active) palette.primary.copy(alpha = 0.22f) else palette.surface,
                                border = BorderStroke(1.dp, if (active) palette.primary else palette.border),
                                modifier = Modifier.clickable { filter = id }
                            ) {
                                Text(
                                    text = label,
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = if (active) palette.primaryVariant else TextTertiary,
                                    modifier = Modifier.padding(horizontal = 14.dp, vertical = 7.dp)
                                )
                            }
                        }
                }

                if (filteredTasks.isEmpty()) {
                    Box(modifier = Modifier.fillMaxWidth().weight(1f), contentAlignment = Alignment.Center) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Text("No tasks queued", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = TextSecondary)
                            Spacer(modifier = Modifier.height(4.dp))
                            Text("Use natural language above or ask WristOS AI", fontSize = 13.sp, color = TextTertiary)
                        }
                    }
                } else {
                    LazyColumn(verticalArrangement = Arrangement.spacedBy(10.dp), modifier = Modifier.weight(1f)) {
                        items(filteredTasks, key = { it.id }) { task ->
                            TaskCard(
                                task = task,
                                onToggle = { viewModel.toggleTask(task) },
                                onEdit = {
                                    editingTask = task
                                    newTaskTitle = task.title
                                    newTaskDueTime = task.dueTime
                                    newTaskPriority = task.priority
                                    showDialog = true
                                },
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

            if (toastMsg != null) {
                AuroraToastPill(toastMsg ?: "", modifier = Modifier.align(Alignment.TopCenter).padding(top = 10.dp))
            }
        }

        if (showDialog) {
            AlertDialog(
                onDismissRequest = { showDialog = false; editingTask = null },
                containerColor = palette.surfaceElevated,
                title = {
                    Text(
                        if (editingTask == null) "Create Task" else "Edit Task",
                        color = TextPrimary,
                        fontWeight = FontWeight.Bold
                    )
                },
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
                                val target = editingTask
                                if (target != null) {
                                    viewModel.updateTask(
                                        target.copy(
                                            title = newTaskTitle.trim(),
                                            dueTime = newTaskDueTime.trim().ifEmpty { "Today" },
                                            priority = newTaskPriority
                                        )
                                    )
                                    toastMsg = "Task updated"
                                } else {
                                    viewModel.addTask(newTaskTitle, newTaskDueTime, newTaskPriority)
                                    toastMsg = "Task added"
                                }
                                editingTask = null
                                newTaskTitle = ""
                                newTaskDueTime = "Today, 6:00 PM"
                                newTaskPriority = "normal"
                                showDialog = false
                            }
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = palette.primary, contentColor = Color(0xFF06040D))
                    ) { Text(if (editingTask == null) "Add Task" else "Save") }
                },
                dismissButton = {
                    TextButton(onClick = { showDialog = false; editingTask = null }) { Text("Cancel", color = TextSecondary) }
                }
            )
        }
    }
}

@Composable
fun TaskCard(
    task: TaskEntity,
    onToggle: () -> Unit,
    onEdit: () -> Unit,
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

    AuroraGlassCard(cornerRadius = 18.dp, highlightBorder = !task.isCompleted && task.priority == "urgent") {
        Row(
            modifier = Modifier.fillMaxWidth().padding(14.dp),
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
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.Schedule, contentDescription = null, tint = TextTertiary, modifier = Modifier.size(12.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(text = task.dueTime, fontSize = 11.sp, color = TextSecondary)
                    }
                    Surface(shape = RoundedCornerShape(6.dp), color = priorityColor.copy(alpha = 0.16f)) {
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

            IconButton(onClick = onEdit, modifier = Modifier.size(30.dp)) {
                Icon(Icons.Default.Edit, contentDescription = "Edit", tint = TextSecondary, modifier = Modifier.size(16.dp))
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
