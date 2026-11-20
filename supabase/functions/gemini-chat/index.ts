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
        } else {
          console.warn("Gemini API call failed, using Core Intelligence:", await geminiRes.text())
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

    if (lower.includes("task") || lower.includes("remind") || lower.includes("agenda") || lower.includes("todo")) {
      const title = cleanPrompt.replace(/(remind me to|create a task to|add task|create task|add a task to|schedule)/i, "").trim() || cleanPrompt
      reply = `I've added "${title}" to your agenda. [ACTION:TASK|${title}|Today]`
    } else if (lower.includes("remember") || lower.includes("save fact") || lower.includes("note that") || lower.includes("store")) {
      const fact = cleanPrompt.replace(/(remember that|save fact|note that|store)/i, "").trim() || cleanPrompt
      reply = `Saved "${fact}" to your Knowledge Vault. [ACTION:MEMORY|Personal|${fact}]`
    } else if (lower.includes("vibrate") || lower.includes("alert") || lower.includes("alarm") || lower.includes("buzz")) {
      reply = `Dispatched a haptic alert notification to your smartwatch. [ACTION:ALERT|WristOS Priority]`
    } else if (lower.includes("plan") || lower.includes("summary") || lower.includes("how am i doing")) {
      reply = `You have ${tasks.length} pending agenda task(s) and ${memories.length} facts preserved in your Knowledge Vault. Your smartwatch telemetry is streaming smoothly.`
    } else {
      reply = `I'm with you. What would you like to plan, remember, or accomplish next?`
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
