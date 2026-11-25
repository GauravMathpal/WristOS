export interface SlideMeta {
  id: string
  number: number
  category: string
  title: string
  durationSeconds: number
}

export const SLIDES: SlideMeta[] = [
  { id: 'cover', number: 1, category: '00 / OPENING', title: 'WristOS — Team & Introduction', durationSeconds: 20 },
  { id: 'hook', number: 2, category: '01 / THE HOOK', title: 'Did Today Feel Productive?', durationSeconds: 25 },
  { id: 'survey-gap', number: 3, category: '02 / RESEARCH & AI GAP', title: '85.4% Wear a Watch. Normal AI Forgets.', durationSeconds: 25 },
  { id: 'wristos-reveal', number: 4, category: '03 / THE IDEA', title: 'WRISTOS — Your Personal Intelligence', durationSeconds: 20 },
  { id: 'market', number: 5, category: '04 / MARKET VALUE', title: 'Three Converging Global Markets', durationSeconds: 40 },
  { id: 'positioning', number: 6, category: '05 / POSITIONING & USERS', title: 'Why WristOS Wins & Who It Serves', durationSeconds: 30 },
  { id: 'watch-os', number: 7, category: '06 / WATCH OS', title: 'Latest PineTime LVGL Watch OS', durationSeconds: 25 },
  { id: 'focus-tasks', number: 8, category: '07 / FOCUS & TASKS', title: 'Pomodoro Focus & Priority Tasks', durationSeconds: 25 },
  { id: 'ai-memory', number: 9, category: '08 / GEMINI AI & VAULT', title: 'Personalized AI & Knowledge Vault', durationSeconds: 25 },
  { id: 'ecosystem-ble', number: 10, category: '09 / WEB, MOBILE & BLE', title: 'Web Portal, Mobile App & NimBLE', durationSeconds: 25 },
  { id: 'safety-status', number: 11, category: '10 / SAFETY & STATUS', title: 'Simulator-First Safety & Deliverables', durationSeconds: 20 },
  { id: 'conclusion', number: 12, category: '11 / CONCLUSION', title: 'Thank You & Questions', durationSeconds: 20 },
]

export const TOTAL_DURATION_SECONDS = SLIDES.reduce((acc, s) => acc + s.durationSeconds, 0)
