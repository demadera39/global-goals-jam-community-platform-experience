import { corsHeaders } from '../_shared/cors.ts'

// generate-article — drafts a GGJ article with Claude (Sonnet 5).
//
// Mirrors Metodic's generate-article architecture: optional source URLs are
// scraped (tags stripped, truncated), plus a free-text topic/brief and
// editor context; one model call returns strict JSON (title, slug, excerpt,
// markdown content, tags, suggested category, and a bonus LinkedIn post).
// The function does NOT write to the database — the admin UI drops the
// result into the editor for human review before anything is published.

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages'
const ANTHROPIC_VERSION = '2023-06-01'
const ARTICLE_MODEL = Deno.env.get('CLAUDE_ARTICLE_MODEL') || 'claude-sonnet-5'

const RATE_LIMIT_WINDOW = 60_000
const MAX_REQUESTS_PER_WINDOW = 10
const requestLog = new Map<string, number[]>()

function isRateLimited(key: string): boolean {
  const now = Date.now()
  const recent = (requestLog.get(key) || []).filter((t) => now - t < RATE_LIMIT_WINDOW)
  requestLog.set(key, recent)
  if (recent.length >= MAX_REQUESTS_PER_WINDOW) return true
  recent.push(now)
  return false
}

/** Fetch a URL and reduce it to readable text (Metodic pattern). */
async function scrape(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (GGJ article research)' },
      signal: AbortSignal.timeout(15_000),
    })
    if (!res.ok) return `[Could not fetch ${url}: HTTP ${res.status}]`
    const html = await res.text()
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<(nav|header|footer|aside)[\s\S]*?<\/\1>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&[a-z#0-9]+;/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim()
    return text.slice(0, 8000)
  } catch (e) {
    return `[Could not fetch ${url}: ${e instanceof Error ? e.message : 'error'}]`
  }
}

const SYSTEM_PROMPT = `You are the editorial voice of the Global Goals Jam (globalgoalsjam.org) — a non-profit global network of 2-day design sprints where local teams prototype solutions for the UN Sustainable Development Goals. You write for its Articles section.

AUDIENCE:
- Jam hosts and facilitators running (or considering) a jam in their own city
- Designers, educators and students who work on the SDGs locally
- Municipality officers, NGO workers and community organisers
- Past jam participants who want the work to continue after the weekend

TONE & STYLE — the jam voice:
- Warm, concrete, activist-practical. A practitioner talking to practitioners.
- Grounded in real rooms: streets, neighbourhoods, flipcharts, prototypes — not abstractions.
- Confident but non-profit humble. Never corporate, never growth-hacky, never slop.
- "You" speaks directly to the reader. Short paragraphs (2–3 sentences).
- Use subheadings to carry the structure. Examples over adjectives.
- When relevant, connect to the GGJ method: the 4 sprints (Understand → Define → Prototype → Implement), mixed local teams, output over attendance, the 90 days after the weekend.
- Name SDG targets specifically (e.g. "SDG 11.6") when the topic touches one, never vaguely ("sustainability").

KEY PRINCIPLES:
1. Every piece should leave a host or organiser with something they can USE.
2. Local beats global: one street in Amsterdam Noord teaches more than "cities worldwide".
3. Honest about what is hard. Jams fail in known ways; say so when useful.
4. End with a concrete next move for the reader, not a platitude.

CATEGORIES (choose suggested_category honestly):
- "stories" — what happened when a city jammed: narrative, people, outcomes. 800–1200 words.
- "methods" — facilitation craft and tools, how-to depth. 700–1200 words.
- "impact" — what outlived a weekend: follow-ups, adoptions, measured change. 500–900 words.
- "news" — quick updates from the network. 200–400 words.

MARKDOWN RULES for content_markdown:
- Start directly with the opening paragraph — do NOT repeat the title as a heading.
- "##" for main sections, "###" sparingly for sub-points.
- "> " blockquotes for real-feeling voices or key insights (sparingly).
- Lists only where a list genuinely helps. Bold for emphasis inside sentences only.
- No emojis. No horizontal rules. No "Conclusion" heading — end with a short section that lands the next move.

LINKEDIN POST RULES for linkedin_post:
Write a standalone LinkedIn post promoting the article, in the voice of the GGJ founder. It must feel human-written.
- Vary the opening: a bold claim, a tiny story, a number, a question, a confession. Never a formula.
- 600–1200 characters. 1–2 line paragraphs. Line breaks for rhythm.
- One core idea, not a summary. Minimal or zero emojis. 2–4 hashtags max, at the very end.
- Drop the article URL naturally using the placeholder {{article_url}} — no "Read more →" labels.

Produce the article by calling the emit_article tool exactly once with complete JSON.
CRITICAL: each tool argument holds ONLY its own value. content_markdown contains the article body alone — no LinkedIn post, no tags, no XML-style tags, no field markers. The LinkedIn post goes ONLY in the linkedin_post argument; tags ONLY in the tags array.`

const ARTICLE_TOOL = {
  name: 'emit_article',
  description: 'Emit the complete drafted article as structured JSON.',
  input_schema: {
    type: 'object',
    required: ['title', 'slug', 'excerpt', 'content_markdown', 'tags', 'suggested_category', 'linkedin_post'],
    properties: {
      title: { type: 'string', description: 'Compelling headline, max 80 chars, sentence case' },
      slug: { type: 'string', description: 'kebab-case url slug derived from the title' },
      excerpt: { type: 'string', description: '1–2 sentence preview, max 200 chars' },
      content_markdown: { type: 'string', description: 'The full article body in markdown per the rules' },
      tags: { type: 'array', items: { type: 'string' }, minItems: 3, maxItems: 5 },
      suggested_category: { type: 'string', enum: ['stories', 'methods', 'impact', 'news'] },
      linkedin_post: { type: 'string', description: 'The standalone LinkedIn post with {{article_url}} placeholder' },
    },
  },
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const json = (b: unknown, status = 200) =>
    new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  try {
    const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!apiKey) return json({ error: 'ANTHROPIC_API_KEY not configured' }, 500)

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'
    if (isRateLimited(ip)) return json({ error: 'Too many requests — try again in a minute.' }, 429)

    const { topic, urls, category, extraContext } = (await req.json()) as {
      topic?: string
      urls?: string[]
      category?: string
      extraContext?: string
    }

    const cleanUrls = (urls || []).filter((u) => /^https?:\/\//i.test(u)).slice(0, 4)
    if (!topic?.trim() && cleanUrls.length === 0) {
      return json({ error: 'Provide a topic, source URLs, or both.' }, 400)
    }

    // Scrape sources in parallel (Metodic pattern: labelled source blocks).
    const sources = await Promise.all(cleanUrls.map((u) => scrape(u)))
    const sourceBlock = sources.length
      ? sources.map((s, i) => `--- SOURCE ${i + 1} (${cleanUrls[i]}) ---\n${s}`).join('\n\n')
      : ''

    const userPrompt = [
      topic?.trim() ? `TOPIC / BRIEF:\n${topic.trim()}` : '',
      category ? `REQUESTED CATEGORY: ${category} (follow its length guidance; override suggested_category only if the content truly is a different kind)` : '',
      extraContext?.trim() ? `EDITOR NOTES:\n${extraContext.trim()}` : '',
      sourceBlock ? `SOURCE MATERIAL (transform, never copy; attribute ideas naturally):\n${sourceBlock}` : '',
      'Write the article now.',
    ]
      .filter(Boolean)
      .join('\n\n')

    const res = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': ANTHROPIC_VERSION,
      },
      body: JSON.stringify({
        model: ARTICLE_MODEL,
        max_tokens: 6000,
        // NOTE: no `temperature` — Sonnet 5 deprecates the param.
        system: SYSTEM_PROMPT,
        tools: [ARTICLE_TOOL],
        tool_choice: { type: 'tool', name: 'emit_article' },
        messages: [{ role: 'user', content: userPrompt }],
      }),
      signal: AbortSignal.timeout(110_000),
    })

    if (!res.ok) {
      const errText = await res.text()
      console.error('[generate-article] Anthropic error', res.status, errText.slice(0, 300))
      return json({ error: `Model error (${res.status})` }, 502)
    }

    const data = await res.json()
    const toolUse = (data.content || []).find((b: { type: string }) => b.type === 'tool_use')
    if (!toolUse?.input?.title || !toolUse?.input?.content_markdown) {
      return json({ error: 'Model returned an incomplete article' }, 502)
    }

    // Normalize/recover: models occasionally fold trailing fields into the
    // body (e.g. an XML-tagged linkedin post at the end of content_markdown).
    const input = toolUse.input as Record<string, unknown>
    let content = String(input.content_markdown)
    let linkedin = typeof input.linkedin_post === 'string' ? input.linkedin_post : ''
    const folded = content.match(/<linkedin_post>([\s\S]*?)(?:<\/linkedin_post>)?\s*$/i)
    if (folded) {
      if (!linkedin) linkedin = folded[1].trim()
      content = content.slice(0, folded.index).trim()
    }
    const article = {
      title: String(input.title).slice(0, 120),
      slug: String(input.slug || '').toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, ''),
      excerpt: String(input.excerpt || '').slice(0, 220),
      content_markdown: content,
      tags: Array.isArray(input.tags) ? input.tags.slice(0, 5).map(String) : [],
      suggested_category: ['stories', 'methods', 'impact', 'news'].includes(String(input.suggested_category))
        ? input.suggested_category
        : category || 'stories',
      linkedin_post: linkedin,
    }

    return json({ article, model: ARTICLE_MODEL })
  } catch (e) {
    console.error('[generate-article] error', e)
    return json({ error: e instanceof Error ? e.message : 'Unexpected error' }, 500)
  }
})
