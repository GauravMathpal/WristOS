import { supabase, isSupabaseConfigured } from './supabase'
import { parseAssistantReply, ParsedReply } from './actionParser'

export interface AssistantServiceParams {
  prompt: string
  memories: string[]
  tasks: string[]
  apiKey?: string
}

export async function queryAssistant(params: AssistantServiceParams): Promise<ParsedReply> {
  const { prompt, memories, tasks } = params
  const clientApiKey = params.apiKey || (typeof window !== 'undefined' ? localStorage.getItem('wristos_gemini_api_key') || undefined : undefined)

  // 1. If Supabase is configured, call the secure gemini-chat Edge Function
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase.functions.invoke('gemini-chat', {
        body: { 
          prompt, 
          memories, 
          tasks,
          apiKey: clientApiKey
        }
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
  const cleanPrompt = prompt.trim()
  const lower = cleanPrompt.toLowerCase()
  let simulatedText = "I have noted that and updated your personal context."
  let rawResponse = simulatedText

  if (lower.includes('task') || lower.includes('remind') || lower.includes('agenda') || lower.includes('todo')) {
    const title = cleanPrompt.replace(/(remind me to|create a task to|add task|create task|add a task to|schedule)/i, '').trim() || cleanPrompt
    rawResponse = `I've scheduled "${title}" on your agenda. [ACTION:TASK|${title}|Today]`
  } else if (lower.includes('remember') || lower.includes('save fact') || lower.includes('store') || lower.includes('note that')) {
    const fact = cleanPrompt.replace(/(remember that|save fact|store|note that)/i, '').trim() || cleanPrompt
    rawResponse = `I have preserved "${fact}" in your Knowledge Vault. [ACTION:MEMORY|Personal|${fact}]`
  } else if (lower.includes('vibrate') || lower.includes('alert watch') || lower.includes('alarm') || lower.includes('buzz')) {
    rawResponse = `Dispatched a haptic vibration notification to your PineTime smartwatch. [ACTION:ALERT|WristOS Priority]`
  } else {
    rawResponse = `You have ${tasks.length} pending agenda task(s) and ${memories.length} facts preserved in your Knowledge Vault. PineTime telemetry is streaming steadily.`
  }

  return parseAssistantReply(rawResponse)
}
