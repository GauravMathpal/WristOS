// Supabase Edge Function: gemini-briefing
// Generates personalized daily briefings, task prioritization, and health insights
// Powered by Google Gemini 3.8 Flash with 0-budget thinking & strict anti-hallucination guardrails

import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

interface BriefingRequest {
  tasks?: Array<{ title: string; dueTime?: string; priority?: string; isCompleted?: boolean }>
  memories?: Array<{ tag: string; fact: string }>
  activity?: { steps?: number; stepGoal?: number; heartRateAvg?: number; calories?: number; activeMinutes?: number }
  focusMinutes?: number
  apiKey?: string
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const body: BriefingRequest = await req.json().catch(() => ({}))
    const { 
      tasks = [], 
      memories = [], 
      activity = { steps: 0, stepGoal: 10000, heartRateAvg: 72 }, 
      focusMinutes = 0,
      apiKey: clientApiKey 
    } = body

    const activeTasks = tasks.filter(t => !t.isCompleted).slice(0, 5)
    const apiKey = Deno.env.get("GEMINI_API_KEY") || clientApiKey

    if (apiKey && apiKey.trim().length > 0) {
      try {
        const promptContext = [
          "You are WristOS intelligence engine generating a concise daily briefing.",
          "STRICT RULES:",
          "- Return pure JSON only with no markdown backticks, no code blocks, and no extra text.",
          "- Exactly follow this JSON schema:",
          '  {"greeting": "string", "priorities": ["task1", "task2"], "healthInsight": "string", "focusRecommendation": "string"}',
          "- Keep every sentence short and grounded.",
          "- Never hallucinate unmentioned events or false sensor metrics.",
          `Tasks: ${JSON.stringify(activeTasks.map(t => t.title))}`,
          `Memories: ${JSON.stringify(memories.slice(0, 4).map(m => `${m.tag}: ${m.fact}`))}`,
          `Activity: Steps: ${activity.steps || 0} / ${activity.stepGoal || 10000}, Heart Rate: ${activity.heartRateAvg || 72} BPM, Focus: ${focusMinutes} mins`
        ].join("\n")

        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKey}`
        const geminiRes = await fetch(geminiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: promptContext }] }],
            generationConfig: {
              temperature: 0.2,
              maxOutputTokens: 250,
              responseMimeType: "application/json",
              thinkingConfig: { thinkingBudget: 0 }
            }
          })
        })

        if (geminiRes.ok) {
          const geminiData = await geminiRes.json()
          const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
          if (rawText) {
            try {
              const parsed = JSON.parse(rawText)
              return new Response(JSON.stringify({ ...parsed, source: "gemini-3.8-flash" }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
              })
            } catch {
              // JSON parse failover
            }
          }
        }
      } catch (e) {
        console.warn("Gemini briefing error, falling back to local calculation:", e)
      }
    }

    // Deterministic fallback (0 tokens, 0 delay)
    const steps = activity.steps || 0
    const stepGoal = activity.stepGoal || 10000
    const remainingSteps = Math.max(0, stepGoal - steps)
    const taskTitles = activeTasks.map(t => t.title)

    const fallbackResponse = {
      greeting: "Good day! Your personal intelligence dashboard is active.",
      priorities: taskTitles.length > 0 ? taskTitles.slice(0, 3) : ["Plan today's key goals in the Tasks tab"],
      healthInsight: remainingSteps === 0 
        ? "Daily step goal achieved! Keep up the great cardio consistency." 
        : `You are ${remainingSteps.toLocaleString()} steps away from your daily ${stepGoal.toLocaleString()} goal.`,
      focusRecommendation: focusMinutes > 0 
        ? `Completed ${focusMinutes} minutes of deep focus today. Schedule another 25m Pomodoro session to maintain momentum!` 
        : "Start your day with an uninterrupted 25-minute Pomodoro focus block.",
      source: "wristos-core"
    }

    return new Response(JSON.stringify(fallbackResponse), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    })
  }
})
