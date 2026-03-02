import { corsHeaders } from '../_shared/cors.ts'

const RATE_LIMIT_WINDOW = 60_000 // 1 minute
const MAX_REQUESTS_PER_WINDOW = 20
const requestLog = new Map<string, number[]>()

function isRateLimited(key: string): boolean {
  const now = Date.now()
  const times = requestLog.get(key) || []
  const recent = times.filter((t) => now - t < RATE_LIMIT_WINDOW)
  requestLog.set(key, recent)
  if (recent.length >= MAX_REQUESTS_PER_WINDOW) return true
  recent.push(now)
  return false
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const apiKey = Deno.env.get('GEMINI_API_KEY')
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'Gemini API not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const body = await req.json()
    const { prompt, action, context } = body

    if (!prompt && !action) {
      return new Response(
        JSON.stringify({ error: 'prompt or action is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Rate limit by authorization header (user session)
    const authHeader = req.headers.get('authorization') || 'anonymous'
    const rateLimitKey = authHeader.slice(-16)
    if (isRateLimited(rateLimitKey)) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please wait a moment.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Build the system instruction based on action type
    let systemInstruction = 'You are an AI assistant for the Global Goals Jam community platform, focused on the UN Sustainable Development Goals (SDGs).'

    switch (action) {
      case 'generate_toolkit':
        systemInstruction += ' You generate structured toolkit content for design sprint workshops. Return ONLY valid JSON.'
        break
      case 'event_description':
        systemInstruction += ' You help hosts write compelling event descriptions for Global Goals Jam events. Be inspiring and action-oriented.'
        break
      case 'sdg_match':
        systemInstruction += ' You suggest relevant UN SDGs based on event themes. Return a JSON array of SDG numbers (1-17) with brief explanations.'
        break
      case 'impact_summary':
        systemInstruction += ' You generate concise impact summaries from event results and outcomes data.'
        break
      case 'course_qa':
        systemInstruction += ' You answer questions about the GGJ Host Certification Course content. Be helpful and educational.'
        break
      default:
        systemInstruction += ' Be helpful, concise, and focused on sustainable development topics.'
    }

    if (context) {
      systemInstruction += `\n\nAdditional context: ${context}`
    }

    // Call Gemini API
    const model = 'gemini-2.0-flash'
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`

    const geminiResponse = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        systemInstruction: { parts: [{ text: systemInstruction }] },
        generationConfig: {
          temperature: action === 'generate_toolkit' ? 0.7 : 0.8,
          maxOutputTokens: 4096,
          topP: 0.95,
        },
      }),
    })

    if (!geminiResponse.ok) {
      const errorData = await geminiResponse.text()
      console.error('Gemini API error:', geminiResponse.status, errorData)
      return new Response(
        JSON.stringify({ error: 'AI service temporarily unavailable', details: geminiResponse.status }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const geminiData = await geminiResponse.json()
    const text = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || ''

    if (!text) {
      return new Response(
        JSON.stringify({ error: 'AI returned empty response' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ text, model }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('gemini-ai error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
