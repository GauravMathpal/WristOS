package com.wristos.app.ui.memory

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalClipboardManager
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.wristos.app.data.local.memory.MemoryEntity
import com.wristos.app.ui.theme.*
import kotlinx.coroutines.delay
import java.text.SimpleDateFormat
import java.util.*

@Composable
fun MemoryScreen(
    onBack: (() -> Unit)? = null,
    viewModel: MemoryViewModel = viewModel()
) {
    val searchQuery by viewModel.searchQuery.collectAsState()
    val memories by viewModel.memories.collectAsState()
    val palette = LocalWristOSPalette.current
    val clipboard = LocalClipboardManager.current

    var selectedTag by remember { mutableStateOf("All") }
    var aiQuestion by remember { mutableStateOf("") }
    var aiAnswer by remember { mutableStateOf<String?>(null) }
    var showDialog by remember { mutableStateOf(false) }
    var editingMemory by remember { mutableStateOf<MemoryEntity?>(null) }
    var newFact by remember { mutableStateOf("") }
    var newTag by remember { mutableStateOf("Personal") }
    var toastMsg by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(toastMsg) {
        if (toastMsg != null) {
            delay(2500L)
            toastMsg = null
        }
    }

    val categories = listOf("All", "Personal", "Work", "Health", "Hardware", "Study", "Preferences")
    val filtered = remember(memories, selectedTag) {
        if (selectedTag == "All") memories
        else memories.filter { it.tag.equals(selectedTag, ignoreCase = true) }
    }

    Scaffold(
        floatingActionButton = {
            FloatingActionButton(
                onClick = {
                    editingMemory = null
                    newTag = "Personal"
                    newFact = ""
                    showDialog = true
                },
                containerColor = palette.secondary,
                contentColor = TextPrimary,
                shape = CircleShape
            ) {
                Icon(Icons.Default.Add, contentDescription = "Add Memory")
            }
        },
        containerColor = Color.Transparent
    ) { padding ->
        Box(modifier = Modifier.fillMaxSize().padding(padding)) {
            Column(
                modifier = Modifier.fillMaxSize().padding(horizontal = 16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Spacer(modifier = Modifier.height(6.dp))

                Row(verticalAlignment = Alignment.CenterVertically) {
                    if (onBack != null) {
                        Box(
                            modifier = Modifier
                                .size(38.dp)
                                .clip(RoundedCornerShape(12.dp))
                                .background(palette.surfaceElevated)
                                .border(1.dp, palette.border, RoundedCornerShape(12.dp))
                                .clickable { onBack() },
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(Icons.Default.ChevronLeft, contentDescription = "Back", tint = TextSecondary)
                        }
                        Spacer(modifier = Modifier.width(12.dp))
                    }
                    AuroraSectionHeader(
                        eyebrow = "KNOWLEDGE VAULT",
                        title = "Personal Memory",
                        trailing = {
                            AuroraPillBadge(text = "${memories.size} facts", color = palette.secondary)
                        }
                    )
                }

                // AI Semantic Retrieval Box
                AuroraGlassCard(cornerRadius = 20.dp, highlightBorder = true) {
                    Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.AutoAwesome, contentDescription = null, tint = palette.primary, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("Ask Knowledge Vault", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = palette.primaryVariant)
                        }
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            OutlinedTextField(
                                value = aiQuestion,
                                onValueChange = { aiQuestion = it },
                                placeholder = { Text("Ask e.g. cardio BPM, watch specs...", color = TextTertiary, fontSize = 12.sp) },
                                singleLine = true,
                                colors = OutlinedTextFieldDefaults.colors(
                                    focusedContainerColor = palette.bgPrimary.copy(alpha = 0.7f),
                                    unfocusedContainerColor = palette.bgPrimary.copy(alpha = 0.7f),
                                    focusedBorderColor = palette.primary,
                                    unfocusedBorderColor = palette.border,
                                    focusedTextColor = TextPrimary,
                                    unfocusedTextColor = TextPrimary
                                ),
                                shape = RoundedCornerShape(14.dp),
                                modifier = Modifier.weight(1f)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            AuroraGradientButton(
                                text = "Recall",
                                onClick = {
                                    if (aiQuestion.isNotBlank()) {
                                        aiAnswer = viewModel.queryVaultAnswer(aiQuestion, memories)
                                    }
                                }
                            )
                        }
                        if (aiAnswer != null) {
                            Text(text = aiAnswer ?: "", fontSize = 12.sp, color = TextPrimary, fontWeight = FontWeight.Medium)
                        }
                    }
                }

                // Search Bar
                AuroraGlassCard(cornerRadius = 16.dp) {
                    OutlinedTextField(
                        value = searchQuery,
                        onValueChange = { viewModel.onSearchQueryChanged(it) },
                        placeholder = { Text("Filter personal memory facts...", color = TextTertiary, fontSize = 13.sp) },
                        leadingIcon = { Icon(Icons.Default.Search, contentDescription = null, tint = TextTertiary) },
                        trailingIcon = {
                            if (searchQuery.isNotEmpty()) {
                                IconButton(onClick = { viewModel.onSearchQueryChanged("") }) {
                                    Icon(Icons.Default.Close, contentDescription = "Clear", tint = TextTertiary)
                                }
                            }
                        },
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedContainerColor = Color.Transparent,
                            unfocusedContainerColor = Color.Transparent,
                            focusedBorderColor = Color.Transparent,
                            unfocusedBorderColor = Color.Transparent,
                            focusedTextColor = TextPrimary,
                            unfocusedTextColor = TextPrimary
                        ),
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true
                    )
                }

                // Category Chips
                Row(
                    modifier = Modifier.fillMaxWidth().horizontalScroll(rememberScrollState()),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    categories.forEach { tag ->
                        val active = selectedTag == tag
                        Surface(
                            shape = CircleShape,
                            color = if (active) palette.secondary.copy(alpha = 0.22f) else palette.surface,
                            border = BorderStroke(1.dp, if (active) palette.secondary else palette.border),
                            modifier = Modifier.clickable { selectedTag = tag }
                        ) {
                            Text(
                                text = tag,
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold,
                                color = if (active) palette.secondary else TextTertiary,
                                modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp)
                            )
                        }
                    }
                }

                if (filtered.isEmpty()) {
                    Box(modifier = Modifier.fillMaxWidth().weight(1f), contentAlignment = Alignment.Center) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Box(
                                modifier = Modifier.size(54.dp).background(palette.secondary.copy(alpha = 0.15f), CircleShape),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(Icons.Default.Psychology, contentDescription = null, tint = palette.secondary, modifier = Modifier.size(28.dp))
                            }
                            Spacer(modifier = Modifier.height(12.dp))
                            Text(
                                text = if (searchQuery.isBlank()) "Vault is empty" else "No matching memory found",
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold,
                                color = TextSecondary
                            )
                            Spacer(modifier = Modifier.height(4.dp))
                            Text("Save habits, specs, or ask AI to remember", fontSize = 13.sp, color = TextTertiary)
                        }
                    }
                } else {
                    LazyColumn(verticalArrangement = Arrangement.spacedBy(10.dp), modifier = Modifier.weight(1f)) {
                        items(filtered, key = { it.id }) { item ->
                            MemoryVaultCard(
                                item = item,
                                onCopy = {
                                    clipboard.setText(AnnotatedString(item.fact))
                                    toastMsg = "Copied to clipboard"
                                },
                                onSendToWatch = {
                                    viewModel.sendMemoryToWatch(item)
                                    toastMsg = "Sent to WristOS Watch"
                                },
                                onEdit = {
                                    editingMemory = item
                                    newTag = item.tag
                                    newFact = item.fact
                                    showDialog = true
                                },
                                onDelete = { viewModel.deleteMemory(item) }
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
                onDismissRequest = { showDialog = false },
                containerColor = palette.surfaceElevated,
                title = {
                    Text(
                        if (editingMemory != null) "Edit Memory" else "Store New Memory",
                        color = TextPrimary,
                        fontWeight = FontWeight.Bold
                    )
                },
                text = {
                    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        OutlinedTextField(
                            value = newTag,
                            onValueChange = { newTag = it },
                            label = { Text("Category (Health, Work, Hardware)") },
                            singleLine = true
                        )
                        OutlinedTextField(
                            value = newFact,
                            onValueChange = { newFact = it },
                            label = { Text("Fact to remember") },
                            maxLines = 3
                        )
                    }
                },
                confirmButton = {
                    Button(
                        onClick = {
                            if (newFact.isNotBlank()) {
                                val current = editingMemory
                                if (current != null) viewModel.updateMemory(current, newTag, newFact)
                                else viewModel.addMemory(newTag, newFact)
                                showDialog = false
                            }
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = palette.secondary, contentColor = TextPrimary)
                    ) {
                        Text(if (editingMemory != null) "Save Changes" else "Store Memory")
                    }
                },
                dismissButton = {
                    TextButton(onClick = { showDialog = false }) { Text("Cancel", color = TextSecondary) }
                }
            )
        }
    }
}

@Composable
fun MemoryVaultCard(
    item: MemoryEntity,
    onCopy: () -> Unit,
    onSendToWatch: () -> Unit,
    onEdit: () -> Unit,
    onDelete: () -> Unit
) {
    val palette = LocalWristOSPalette.current
    val dateFormat = remember { SimpleDateFormat("MMM d, yyyy", Locale.getDefault()) }
    val formattedDate = remember(item.createdAt) { dateFormat.format(Date(item.createdAt)) }

    AuroraGlassCard(cornerRadius = 18.dp) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                AuroraPillBadge(text = "#${item.tag.uppercase()}", color = palette.secondary)

                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(formattedDate, fontSize = 11.sp, color = TextTertiary)
                    Spacer(modifier = Modifier.width(6.dp))
                    IconButton(onClick = onCopy, modifier = Modifier.size(26.dp)) {
                        Icon(Icons.Default.ContentCopy, contentDescription = "Copy", tint = TextSecondary, modifier = Modifier.size(14.dp))
                    }
                    IconButton(onClick = onSendToWatch, modifier = Modifier.size(26.dp)) {
                        Icon(Icons.Default.Watch, contentDescription = "Send to Watch", tint = palette.primary, modifier = Modifier.size(15.dp))
                    }
                    IconButton(onClick = onEdit, modifier = Modifier.size(26.dp)) {
                        Icon(Icons.Default.Edit, contentDescription = "Edit", tint = TextSecondary, modifier = Modifier.size(14.dp))
                    }
                    IconButton(onClick = onDelete, modifier = Modifier.size(26.dp)) {
                        Icon(Icons.Default.DeleteOutline, contentDescription = "Delete", tint = TextTertiary, modifier = Modifier.size(15.dp))
                    }
                }
            }

            Spacer(modifier = Modifier.height(10.dp))

            Text(text = item.fact, fontSize = 14.sp, lineHeight = 20.sp, color = TextPrimary)
        }
    }
}
