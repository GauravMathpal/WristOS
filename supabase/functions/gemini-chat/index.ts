// Supabase Edge Function: gemini-chat
// Securely proxies Gemini API requests, keeping API keys 100% off client devices

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
    const { prompt, memories = [], tasks = [] } = await req.json()

    const apiKey = Deno.env.get("GEMINI_API_KEY")
    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error: "GEMINI_API_KEY is not configured on Supabase Edge Function secrets.",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      )
    }

    // Build system instructions and context
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

    // Call Google Gemini API (gemini-1.5-flash)
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

    const geminiData = await geminiRes.json()

    if (!geminiRes.ok) {
      return new Response(
        JSON.stringify({ error: geminiData.error?.message || "Gemini API request failed" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: geminiRes.status,
        }
      )
    }

    const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "I couldn't process that response."

    return new Response(JSON.stringify({ reply: rawText }), {
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
