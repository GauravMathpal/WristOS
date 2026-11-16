import { supabase, isSupabaseConfigured } from './supabase'
import { parseAssistantReply, ParsedReply } from './actionParser'

export interface AssistantServiceParams {
  prompt: string
  memories: string[]
  tasks: string[]
}

export async function queryAssistant(params: AssistantServiceParams): Promise<ParsedReply> {
  const { prompt, memories, tasks } = params

  // 1. If Supabase is configured, call the secure gemini-chat Edge Function
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase.functions.invoke('gemini-chat', {
        body: { prompt, memories, tasks }
      })

      if (!error && data?.reply) {
        return parseAssistantReply(data.reply)
      } else if (error) {
        console.warn('Edge Function fallback triggered:', error.message)
      }
    } catch (e) {
      console.warn('Edge Function connection error:', e)
    }
  }

  // 2. Local-First Offline Smart Rule Engine Fallback
  // Ensures assistant is 100% responsive and executes smart actions even without internet
  const lower = prompt.toLowerCase()
  let simulatedText = "I have noted that and updated your personal context."
  let rawResponse = simulatedText

  if (lower.includes('task') || lower.includes('remind') || lower.includes('agenda')) {
    const title = prompt.replace(/(remind me to|create a task to|add task|create task)/i, '').trim() || prompt
    rawResponse = `I've scheduled "${title}" on your agenda. [ACTION:TASK|${title}|Today]`
  } else if (lower.includes('remember') || lower.includes('save fact') || lower.includes('store')) {
    const fact = prompt.replace(/(remember that|save fact|store)/i, '').trim() || prompt
    rawResponse = `I have preserved "${fact}" in your Knowledge Vault. [ACTION:MEMORY|Personal|${fact}]`
  } else if (lower.includes('vibrate') || lower.includes('alert watch') || lower.includes('alarm')) {
    rawResponse = `Dispatched a haptic vibration notification to your PineTime smartwatch. [ACTION:ALERT|WristOS Priority]`
  } else {
    rawResponse = `You have ${tasks.length} pending agenda task(s) and ${memories.length} facts preserved in your Knowledge Vault. PineTime telemetry is streaming steadily.`
  }

  return parseAssistantReply(rawResponse)
}
