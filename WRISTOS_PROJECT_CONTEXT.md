# WRISTOS — MASTER PROJECT CONTEXT

## Quick Summary
WristOS is an AI-powered personal assistant ecosystem: Android phone app (brain) + PineTime smartwatch (companion) over BLE.

## Team
- **Group 1 (AI & App):** Gaurav (lead), Dhruv — Android app, AI, backend, phone-watch integration
- **Group 2 (Watch & Firmware):** Daksh (lead), Atharv — InfiniTime firmware, sensors, BLE, watch features
- **Group 3 (Product & QA):** Ashish (co-lead), Arjun, Ravikant — testing, docs, UI/UX research

## Tech Stack
- **Android:** Kotlin, Jetpack Compose, MVVM, Min SDK API 26
- **Local Storage:** Room Database, DataStore
- **Backend:** Supabase PostgreSQL (free tier), Supabase Auth, Supabase Edge Functions
- **AI:** Google Gemini API (~₹700 balance — use wisely)
- **Watch:** PineTime + InfiniTime firmware, Android BLE APIs
- **Version Control:** Git, GitHub (private repo "WristOS")

## Key Decisions Made
- Call Gemini directly from Android during dev; move to Supabase Edge Function later for production
- No separate Node.js/Express server — keep it simple
- API keys in `local.properties` (gitignored), never hardcoded or committed
- Build on existing InfiniTime firmware, don't replace it
- Watch has NO mic/speaker — voice interaction is phone-only
- Only ONE physical watch — use simulators when possible

## Cost Rules
- Free tools/services first, paid only if absolutely necessary
- Monitor Gemini API usage carefully
- No unnecessary databases, backends, or paid APIs

## App Structure (Screens)
1. Home Dashboard
2. AI Assistant
3. Tasks
4. Personal Memory
5. Settings

## Package Organization (build gradually)
```
navigation/
ui/dashboard/
ui/assistant/
ui/tasks/
ui/memory/
ui/settings/
data/local/
data/remote/
data/repository/
domain/
core/
```

## V1 Features (Priority 1)
1. AI personal assistant
2. Voice interaction (phone)
3. Personal memory (save/retrieve)
4. Smart tasks & reminders
5. Android app
6. Watch dashboard (time, date, battery, connection)
7. Step tracking
8. Heart-rate measurement
9. Phone-to-watch notifications
10. Watch vibration alerts
11. Focus timer, stopwatch, countdown
12. Basic phone-watch sync

## Development Roadmap
1. ✅ Project Setup — inspect env, create Android project, Git/GitHub
2. Android UI — Dashboard, Assistant, Tasks, Memory, Settings
3. Local Functionality — navigation, Room DB, task/memory CRUD, settings
4. Backend — Supabase setup, DB structure, secure ops
5. Gemini Integration — AI chat, memory retrieval, task interactions
6. BLE Integration — protocol with Group 2, phone-side BLE
7. Testing & Refinement — bugs, UI polish, demo prep

## Current Status
- **Date:** 2026-11-15
- **Project dir:** `/Users/gauravm/Projects/WristOS` (empty)
- **Environment:** Java 17 ✅, Git ✅, ADB ✅
- **BLOCKER:** Android Studio not installed, no Android SDK
- **Next action:** Install Android Studio, then create the project

## Dev Rules for AI Assistants
- CODE FIRST — write code, don't just describe it
- SHORT explanations only
- Gaurav is a BEGINNER — give exact step-by-step instructions
- Don't ask Gaurav to do what you can do yourself
- Work in small milestones
- Never claim something works unless tested
- Protect existing code — don't overwrite without approval
- Never expose API keys in code or commits
- Use format: Completed / Verification / My Action / Next

