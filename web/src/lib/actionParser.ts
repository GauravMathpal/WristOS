export interface AssistantAction {
  type: 'TASK' | 'MEMORY' | 'ALERT' | 'NONE'
  task?: { title: string; dueTime: string }
  memory?: { tag: string; fact: string }
  alert?: { message: string }
}

export interface ParsedReply {
  cleanText: string
  action: AssistantAction
}

export function parseAssistantReply(rawText: string): ParsedReply {
  const actionRegex = /\[ACTION:(TASK|MEMORY|ALERT)\|(.*?)\]/s
  const match = actionRegex.exec(rawText)

  if (!match) {
    return {
      cleanText: rawText,
      action: { type: 'NONE' }
    }
  }

  const cleanText = rawText.replace(match[0], '').trim()
  const type = match[1]
  const payload = match[2].split('|')

  let action: AssistantAction = { type: 'NONE' }

  if (type === 'TASK') {
    action = {
      type: 'TASK',
      task: {
        title: payload[0]?.trim() || 'New Task',
        dueTime: payload[1]?.trim() || 'Today'
      }
    }
  } else if (type === 'MEMORY') {
    action = {
      type: 'MEMORY',
      memory: {
        tag: payload[0]?.trim() || 'General',
        fact: payload[1]?.trim() || ''
      }
    }
  } else if (type === 'ALERT') {
    action = {
      type: 'ALERT',
      alert: {
        message: payload[0]?.trim() || 'WristOS Alert'
      }
    }
  }

  return { cleanText, action }
}
