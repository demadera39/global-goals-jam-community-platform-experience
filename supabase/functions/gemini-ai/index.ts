import { corsHeaders } from '../_shared/cors.ts'

// NOTE: slug is still "gemini-ai" for backwards-compat with existing callers
// (ToolkitPage, AIAssistant, HostDashboard), but this function is now powered
// by Anthropic Claude — Sonnet for heavy toolkit generation, Haiku for light
// tasks. Mirrors Metodic's facilitation engines (metodic.io).

const RATE_LIMIT_WINDOW = 60_000 // 1 minute
const MAX_REQUESTS_PER_WINDOW = 20
const requestLog = new Map<string, number[]>()

// Generation can be slow for large toolkits — give it room before aborting.
const REQUEST_TIMEOUT_MS = 110_000

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages'
const ANTHROPIC_VERSION = '2023-06-01'

// Override via secrets if model names change.
const SONNET_MODEL = Deno.env.get('CLAUDE_SONNET_MODEL') || 'claude-sonnet-4-6'
const HAIKU_MODEL = Deno.env.get('CLAUDE_HAIKU_MODEL') || 'claude-haiku-4-5'

function isRateLimited(key: string): boolean {
  const now = Date.now()
  const times = requestLog.get(key) || []
  const recent = times.filter((t) => now - t < RATE_LIMIT_WINDOW)
  requestLog.set(key, recent)
  if (recent.length >= MAX_REQUESTS_PER_WINDOW) return true
  recent.push(now)
  return false
}

// The GGJ method is a Double-Diamond-derived 4-sprint design sprint.
// Every generated toolkit MUST map cleanly onto these four sprints/phases.
const GGJ_SPRINT_GUIDANCE = `
The Global Goals Jam runs as a structured design sprint built from FOUR SPRINTS. Everything you produce must map cleanly onto these four sprints/phases (use the lowercase phase keys exactly in JSON):

1. UNDERSTAND (phase key: "understand") — Sprint 1: Frame & empathise. Map the system around the challenge, gather data and lived experience, identify who is affected and the root causes. Outputs: problem framing, stakeholder/system maps, insights.
2. DEFINE (phase key: "define") — Sprint 2: Reframe & ideate. Converge insights into a sharp "How Might We", then diverge into many ideas. Outputs: design challenge statement, prioritised idea(s).
3. PROTOTYPE (phase key: "prototype") — Sprint 3: Make it tangible. Build a low-fidelity prototype of the chosen concept and test the riskiest assumptions with people. Outputs: prototype, test feedback.
4. IMPLEMENT (phase key: "implement") — Sprint 4: Plan for real-world impact & scale. Define next steps, partners, resources and how the concept connects to the relevant SDG target. Outputs: action/implementation plan, pitch.

Rules:
- Distribute the session timeline so each day/segment clearly belongs to one of the four sprints, in order.
- Every methodCard MUST have a "phase" of exactly "understand" | "define" | "prototype" | "implement".
- Methods must be specific and SDG-relevant — avoid generic "post-it brainstorm" filler. Favour concrete, named techniques with facilitator guidance.
- Always include the four sprints; never skip a sprint even for short jams (compress instead).`

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  try {
    const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!apiKey) {
      return json(
        { error: 'AI is not configured yet. The ANTHROPIC_API_KEY secret is missing on this project.' },
        500,
      )
    }

    const body = await req.json()
    const { prompt, action, context } = body

    if (!prompt && !action) {
      return json({ error: 'prompt or action is required' }, 400)
    }

    // Rate limit by authorization header (user session)
    const authHeader = req.headers.get('authorization') || 'anonymous'
    const rateLimitKey = authHeader.slice(-16)
    if (isRateLimited(rateLimitKey)) {
      return json({ error: 'Rate limit exceeded. Please wait a moment and try again.' }, 429)
    }

    const isToolkit = action === 'generate_toolkit'

    // Build the system instruction based on action type
    let system =
      'You are an AI assistant for the Global Goals Jam (GGJ) community platform, focused on the UN Sustainable Development Goals (SDGs). The toolkit generation experience is powered by Metodic (metodic.io), a facilitation methodology platform.'

    switch (action) {
      case 'generate_toolkit':
        system =
          'You are a Transdisciplinary Methodology Architect generating a complete, ready-to-run Global Goals Jam toolkit, powered by Metodic (metodic.io). ' +
          'You design world-class, design-sprint workshop toolkits that are specific, contextual and immediately actionable — never generic filler. ' +
          'You draw on Design Thinking, the Double Diamond, service design, systems thinking, speculative design and inclusive facilitation practice. ' +
          GGJ_SPRINT_GUIDANCE +
          '\n\nReturn ONLY a single valid JSON object — no commentary, no markdown fences.'
        break
      case 'event_description':
        system +=
          ' You help hosts write compelling event descriptions for Global Goals Jam events. Be inspiring and action-oriented.'
        break
      case 'sdg_match':
        system +=
          ' You suggest relevant UN SDGs based on event themes. Return a JSON array of SDG numbers (1-17) with brief explanations.'
        break
      case 'impact_summary':
        system += ' You generate concise impact summaries from event results and outcomes data.'
        break
      case 'course_qa':
        system +=
          ' You answer questions about the GGJ Host Certification Course content. Be helpful and educational.'
        break
      default:
        system += ' Be helpful, concise, and focused on sustainable development topics.'
    }

    if (context) {
      system += `\n\nAdditional context: ${context}`
    }

    // Heavy structured generation → Sonnet. Light text tasks → Haiku (fast/cheap).
    const primaryModel = isToolkit ? SONNET_MODEL : HAIKU_MODEL
    const fallbackModel = isToolkit ? HAIKU_MODEL : SONNET_MODEL
    const modelChain = [primaryModel, fallbackModel]

    const maxTokens = isToolkit ? 32768 : 2048

    const callClaude = async (model: string): Promise<Response> => {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
      try {
        return await fetch(ANTHROPIC_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': ANTHROPIC_VERSION,
          },
          body: JSON.stringify({
            model,
            max_tokens: maxTokens,
            temperature: isToolkit ? 0.7 : 0.8,
            system,
            messages: [{ role: 'user', content: prompt }],
          }),
          signal: controller.signal,
        })
      } finally {
        clearTimeout(timer)
      }
    }

    let usedModel = ''
    let data: any = null
    let lastErr = ''
    let lastStatus = 0

    for (const model of modelChain) {
      try {
        const resp = await callClaude(model)
        if (resp.ok) {
          data = await resp.json()
          usedModel = model
          break
        }
        lastStatus = resp.status
        lastErr = await resp.text()
        console.error(`[gemini-ai/claude] model ${model} failed (${resp.status}): ${lastErr.slice(0, 500)}`)
        // 400 (e.g. unknown model) / 404 → try the fallback model.
        // 401/403 → key problem, no point retrying another model.
        if (resp.status === 401 || resp.status === 403) break
      } catch (e) {
        lastErr = e instanceof Error ? e.message : String(e)
        if (lastErr.includes('aborted')) lastErr = 'The AI request timed out. Please try again.'
        console.error(`[gemini-ai/claude] model ${model} threw:`, lastErr)
      }
    }

    if (!data) {
      if (lastStatus === 401 || lastStatus === 403) {
        return json({ error: 'AI authentication failed. The ANTHROPIC_API_KEY is missing or invalid.' }, 502)
      }
      if (lastStatus === 429) {
        return json({ error: 'The AI service is busy right now. Please try again in a moment.' }, 429)
      }
      return json(
        { error: 'AI service temporarily unavailable. Please try again shortly.', details: lastErr.slice(0, 500) },
        502,
      )
    }

    const stopReason = data?.stop_reason || null
    const text: string = Array.isArray(data?.content)
      ? data.content.filter((b: any) => b?.type === 'text').map((b: any) => b.text).join('')
      : ''

    if (!text) {
      return json(
        { error: 'The AI returned an empty response. Please try again.', stopReason },
        502,
      )
    }

    // stop_reason === 'max_tokens' means the output is truncated — we still
    // return it; the client repairs the partial JSON.
    return json({ text, model: usedModel, stopReason, truncated: stopReason === 'max_tokens' })
  } catch (error) {
    console.error('[gemini-ai/claude] error:', error)
    return json({ error: error instanceof Error ? error.message : 'Unexpected error' }, 500)
  }
})
