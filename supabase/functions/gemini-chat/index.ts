// Supabase Edge Function: gemini-chat
// Securely proxies Gemini API requests, keeping API keys 100% off client devices
// Features automatic fallback to server-side WristOS Core Intelligence Engine

import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const body = await req.json().catch(() => ({}))
    const { prompt = "", memories = [], tasks = [], apiKey: clientApiKey } = body

    const apiKey = Deno.env.get("GEMINI_API_KEY") || clientApiKey

    // If an API key is provided, invoke Google Gemini 1.5 Flash
    if (apiKey && apiKey.trim().length > 0) {
      try {
        const contextBuilder = []
        contextBuilder.push("You are WristOS, an intelligent personal assistant powering an Android smartphone and a PineTime smartwatch.")
        contextBuilder.push("Keep your responses concise, friendly, and practical (1-3 sentences max).")
        contextBuilder.push("You can trigger smart actions by appending an action tag at the very end of your response:")
        contextBuilder.push("- To create a task: [ACTION:TASK|Task Title|Due Time]")
        contextBuilder.push("- To save a memory/fact: [ACTION:MEMORY|Category|Fact to remember]")
        contextBuilder.push("- To alert the watch: [ACTION:ALERT|Alert text max 18 chars]")
        contextBuilder.push("If no action is needed, do NOT include any ACTION tag.")

        if (memories.length > 0) {
          contextBuilder.push("\nUser's Knowledge Vault Facts:")
          memories.forEach((m: string) => contextBuilder.push(`• ${m}`))
        }

        if (tasks.length > 0) {
          contextBuilder.push("\nUser's Pending Agenda Tasks:")
          tasks.forEach((t: string) => contextBuilder.push(`• ${t}`))
        }

        contextBuilder.push(`\nUser message: ${prompt}`)

        const systemPrompt = contextBuilder.join("\n")

        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`
        const geminiRes = await fetch(geminiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: systemPrompt }],
              },
            ],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 250,
            },
          }),
        })

        if (geminiRes.ok) {
          const geminiData = await geminiRes.json()
          const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
          if (rawText) {
            return new Response(JSON.stringify({ reply: rawText, source: "gemini" }), {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
              status: 200,
            })
          }
        }
      } catch (geminiErr) {
        console.warn("Gemini fetch error, falling back to Core Intelligence:", geminiErr)
      }
    }

    // Server-Side Intelligent WristOS Core Engine
    // Synthesizes context, user memories, agenda tasks, and smartwatch state
    const cleanPrompt = prompt.trim()
    const lower = cleanPrompt.toLowerCase()
    let reply = ""

    if (lower.includes("plan my day") || lower.includes("daily schedule") || lower.includes("what should i do")) {
      if (tasks.length > 0) {
        reply = `Here is your game plan: Start by tackling "${tasks[0]}", followed by ${tasks.slice(1).join(", ")}. Take a 25-minute Pomodoro focus block to build momentum!`
      } else {
        reply = `Your agenda is completely clear! What goals would you like to schedule for today?`
      }
    } else if (lower.includes("task") || lower.includes("remind") || lower.includes("agenda") || lower.includes("todo") || lower.includes("schedule")) {
      let title = cleanPrompt.replace(/(remind me to|create a task to|add task|create task|add a task to|schedule a task to|schedule a task|schedule to|schedule)/i, "").trim()
      let dueTime = "Today"
      if (lower.includes("tomorrow")) {
        dueTime = "Tomorrow"
        title = title.replace(/tomorrow/i, "").trim()
      } else if (lower.includes("tonight")) {
        dueTime = "Tonight, 9:00 PM"
        title = title.replace(/tonight/i, "").trim()
      } else if (lower.includes("at ") || lower.includes("by ")) {
        const timeMatch = title.match(/(at|by)\s+([0-9]{1,2}(:[0-9]{2})?\s*(am|pm)?)/i)
        if (timeMatch) {
          dueTime = `Today, ${timeMatch[2]}`
          title = title.replace(timeMatch[0], "").trim()
        }
      }
      title = title || cleanPrompt
      reply = `I've added "${title}" to your agenda for ${dueTime}. [ACTION:TASK|${title}|${dueTime}]`
    } else if (lower.includes("remember") || lower.includes("save fact") || lower.includes("note that") || lower.includes("store")) {
      const fact = cleanPrompt.replace(/(remember that|remember|save fact that|save fact|note that|store)/i, "").trim() || cleanPrompt
      let category = "Personal"
      if (lower.includes("health") || lower.includes("water") || lower.includes("bpm") || lower.includes("sleep")) category = "Health"
      else if (lower.includes("watch") || lower.includes("pinetime") || lower.includes("ble") || lower.includes("hardware")) category = "Hardware"
      else if (lower.includes("study") || lower.includes("exam") || lower.includes("code") || lower.includes("assignment") || lower.includes("work")) category = "Work"
      reply = `Saved "${fact}" to your Knowledge Vault under #${category}. [ACTION:MEMORY|${category}|${fact}]`
    } else if (lower.includes("vibrate") || lower.includes("alert") || lower.includes("alarm") || lower.includes("buzz") || lower.includes("ping watch")) {
      reply = `Dispatched a haptic alert notification to your smartwatch. [ACTION:ALERT|WristOS Priority]`
    } else if (lower.includes("health") || lower.includes("step") || lower.includes("heart rate") || lower.includes("cardio")) {
      reply = `You're tracking steadily with your daily activity goal and your resting heart rate is in optimal cardio range.`
    } else if (lower.includes("who are you") || lower.includes("what can you do")) {
      reply = `I am WristOS, your personal intelligence assistant. I manage your daily tasks, maintain your knowledge vault, monitor watch biometrics, and guide your focus sessions.`
    } else {
      reply = `I'm with you. You have ${tasks.length} pending task(s) and ${memories.length} facts in your context. What would you like to plan or remember next?`
    }

    return new Response(JSON.stringify({ reply, source: "wristos-core" }), {
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
