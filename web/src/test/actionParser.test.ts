import { describe, it, expect } from 'vitest'
import {
  hasTaskIntent,
  hasMemoryIntent,
  hasAlertIntent,
  extractTaskDetails,
  extractMemoryDetails,
  parseAssistantReply
} from '../lib/actionParser'

describe('Action Parser & Natural Language Intelligence', () => {
  it('detects task intent accurately across various colloquial forms', () => {
    expect(hasTaskIntent('i have complete xyz task by tmr 5pm')).toBe(true)
    expect(hasTaskIntent('i have to finish math homework by tomorrow')).toBe(true)
    expect(hasTaskIntent('need to buy groceries at 6pm')).toBe(true)
    expect(hasTaskIntent('submit physics report by 17:00')).toBe(true)
    expect(hasTaskIntent('complete project proposal')).toBe(true)
    expect(hasTaskIntent('what is the weather today?')).toBe(false)
    expect(hasTaskIntent('hello how are you')).toBe(false)
  })

  it('correctly extracts title and dueTime for "i have complete xyz task by tmr 5pm"', () => {
    const res = extractTaskDetails('i have complete xyz task by tmr 5pm')
    expect(res.dueTime).toBe('Tomorrow, 5:00 PM')
    expect(res.title.toLowerCase()).toContain('xyz task')
    expect(res.title.toLowerCase()).not.toContain('i have complete')
    expect(res.title.toLowerCase()).not.toContain('by tmr')
  })

  it('extracts bare hour with at/by (e.g. by 5)', () => {
    const res = extractTaskDetails('finish assignment by 5')
    expect(res.dueTime).toBe('Today, 5:00 PM')
    expect(res.title).toBe('Finish assignment')
  })

  it('extracts military 24h format (e.g. at 17:30)', () => {
    const res = extractTaskDetails('attend meeting tomorrow at 17:30')
    expect(res.dueTime).toBe('Tomorrow, 5:30 PM')
    expect(res.title).toBe('Attend meeting')
  })

  it('extracts tonight deadlines', () => {
    const res = extractTaskDetails('complete coding challenge tonight')
    expect(res.dueTime).toBe('Tonight, 9:00 PM')
    expect(res.title).toBe('Complete coding challenge')
  })

  it('falls back to creating a task action tag if LLM omits it', () => {
    const rawReply = "I have noted that down for you!"
    const userPrompt = "i have complete xyz task by tmr 5pm"
    const parsed = parseAssistantReply(rawReply, userPrompt)
    
    expect(parsed.action.type).toBe('TASK')
    expect(parsed.action.task).toBeDefined()
    expect(parsed.action.task?.dueTime).toBe('Tomorrow, 5:00 PM')
    expect(parsed.action.task?.title.toLowerCase()).toContain('xyz task')
  })

  it('handles explicit action tags cleanly', () => {
    const rawWithTag = "Done! I scheduled this for you. [ACTION:TASK|Review PR #42|Tomorrow, 2:00 PM]"
    const parsed = parseAssistantReply(rawWithTag)
    expect(parsed.cleanText).toBe("Done! I scheduled this for you.")
    expect(parsed.action.type).toBe('TASK')
    expect(parsed.action.task?.title).toBe('Review PR #42')
    expect(parsed.action.task?.dueTime).toBe('Tomorrow, 2:00 PM')
  })

  it('detects and parses memory facts', () => {
    expect(hasMemoryIntent('remember that my locker combination is 4829')).toBe(true)
    const mem = extractMemoryDetails('remember that my locker combination is 4829')
    expect(mem.fact).toBe('my locker combination is 4829')
  })

  it('detects watch alert intent', () => {
    expect(hasAlertIntent('vibrate my watch now')).toBe(true)
    expect(hasAlertIntent('ping watch')).toBe(true)
  })
})
