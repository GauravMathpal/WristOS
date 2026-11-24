import { supabase, isSupabaseConfigured } from './supabase'
import {
  parseAssistantReply,
  ParsedReply,
  hasTaskIntent,
  hasMemoryIntent,
  hasAlertIntent,
  extractTaskDetails,
  extractMemoryDetails
} from './actionParser'

export interface AssistantServiceParams {
  prompt: string
  memories: string[]
  tasks: string[]
}

/**
 * Enriches user prompt with explicit directive instructions so the LLM knows to
 * detect tasks, deadlines, to-dos, and memories, and append the appropriate action tags.
 */
function enrichPromptForAssistant(prompt: string): string {
  const cleanPrompt = prompt.trim()

  const isExplicitTask = /^(add task|create task|schedule task|remind me to|set a reminder)/i.test(cleanPrompt)
  const isExplicitMemory = /^(remember that|save fact|note that)/i.test(cleanPrompt)
  const isExplicitAlert = /^(send alert|alert watch|vibrate watch|ping watch)/i.test(cleanPrompt)

  if (!isExplicitTask && !isExplicitMemory && !isExplicitAlert) {
    if (hasTaskIntent(cleanPrompt)) {
      return `[Action Request: The user is stating a task, commitment, or deadline. Extract the task title and due time, confirm concisely in 1 sentence, and append [ACTION:TASK|Task Title|Due Time] at the end]\nUser says: ${cleanPrompt}`
    }

    if (hasMemoryIntent(cleanPrompt)) {
      return `[Action Request: The user is stating a personal fact to remember. Extract category and fact, confirm concisely, and append [ACTION:MEMORY|Category|Fact] at the end]\nUser says: ${cleanPrompt}`
    }

    if (hasAlertIntent(cleanPrompt)) {
      return `[Action Request: The user wants to trigger a watch alert. Confirm and append [ACTION:ALERT|Max 18 chars] at the end]\nUser says: ${cleanPrompt}`
    }
  }

  return cleanPrompt
}

export async function queryAssistant(params: AssistantServiceParams): Promise<ParsedReply> {
  const { prompt } = params
  const cleanPrompt = prompt.trim()
  const lower = cleanPrompt.toLowerCase()

  // Prune context payload to top 6 to prevent burning tokens
  const memories = (params.memories || []).slice(0, 6)
  const tasks = (params.tasks || []).slice(0, 6)

  // 1. If Supabase is configured, call the secure gemini-chat Edge Function with enriched prompt
  if (isSupabaseConfigured) {
    try {
      const enrichedPrompt = enrichPromptForAssistant(cleanPrompt)
      const { data, error } = await supabase.functions.invoke('gemini-chat', {
        body: {
          prompt: enrichedPrompt,
          memories,
          tasks
        }
      })

      if (!error && data?.reply) {
        return parseAssistantReply(data.reply, cleanPrompt)
      } else if (error) {
        console.warn('Edge Function fallback triggered:', error.message)
      }
    } catch (e) {
      console.warn('Edge Function connection error, using Smart Offline Engine:', e)
    }
  }

  // 2. Client-Side Offline Smart Reasoning Engine
  // Ensures assistant is 100% responsive and executes smart actions even without internet
  let reply = ''

  if (lower.includes('plan my day') || lower.includes('daily schedule') || lower.includes('what should i do')) {
    if (tasks.length > 0) {
      reply = `Here is your game plan: Start by tackling "${tasks[0]}", followed by ${tasks.slice(1).join(', ')}. Take a 25-minute Pomodoro focus block to build momentum!`
    } else {
      reply = `Your agenda is completely clear! What goals would you like to schedule for today?`
    }
  } else if (hasTaskIntent(cleanPrompt)) {
    const { title, dueTime } = extractTaskDetails(cleanPrompt)
    reply = `I've added "${title}" to your agenda for ${dueTime}. [ACTION:TASK|${title}|${dueTime}]`
  } else if (hasMemoryIntent(cleanPrompt)) {
    const { tag, fact } = extractMemoryDetails(cleanPrompt)
    reply = `Saved "${fact}" to your Knowledge Vault under #${tag}. [ACTION:MEMORY|${tag}|${fact}]`
  } else if (hasAlertIntent(cleanPrompt)) {
    reply = `Dispatched a haptic alert notification to your smartwatch. [ACTION:ALERT|WristOS Priority]`
  } else if (lower.includes('health') || lower.includes('step') || lower.includes('heart rate') || lower.includes('cardio') || lower.includes('bpm')) {
    reply = `You're tracking steadily with your daily activity goal and your resting heart rate is in optimal cardio range.`
  } else if (lower.includes('who are you') || lower.includes('what can you do')) {
    reply = `I am WristOS, your personal intelligence assistant. I manage your daily tasks, maintain your knowledge vault, monitor watch biometrics, and guide your focus sessions.`
  } else {
    reply = `I'm with you. You have ${tasks.length} pending task(s) and ${memories.length} facts in your records. What would you like to plan or remember next?`
  }

  return parseAssistantReply(reply, cleanPrompt)
}
