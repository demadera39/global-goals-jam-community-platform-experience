import { corsHeaders } from '../_shared/cors.ts'
import { getSupabaseClient } from '../_shared/supabase.ts'

// weekly-editorial — the GGJ content agent. Same pattern as Metodic's
// agent-orchestrator + agent-approve, collapsed into one weekly run:
//
//   pg_cron (Tue 09:00) → this function
//     1. pick this week's category + topic (rotating Methods → Impact → News;
//        Jam Stories are NEVER automated — the community writes those)
//     2. research fresh sources with Claude web search
//     3. pick an SDG / jam-flavoured cover on Unsplash (rotating pool)
//     4. write the piece via generate-article (Sonnet 5, the jam voice)
//     5. publish to public.articles (source='ai')
//     6. schedule the LinkedIn post on the GGJ company page via Postiz
//
// Deterministic pipeline — Claude only researches and writes; what gets
// published and where is enforced in code. ?dry_run=1 does everything except
// the insert and the Postiz call and returns the would-be article.
// ?topic=…&category=… overrides the rotation (for a manual run).
//
// Secrets: ANTHROPIC_API_KEY (exists), UNSPLASH_ACCESS_KEY, POSTIZ_API_KEY,
// POSTIZ_GGJ_INTEGRATION_ID (the LinkedIn page's integration id in Postiz).
// Optional: POSTIZ_API_URL, EDITORIAL_RUN_KEY (shared secret for cron).

const SITE = 'https://www.globalgoalsjam.org'
const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages'
const RESEARCH_MODEL = Deno.env.get('CLAUDE_RESEARCH_MODEL') || 'claude-sonnet-5'

type Cat = 'methods' | 'impact' | 'news'

const CALENDAR: Record<Cat, string[]> = {
  methods: [
    'how to facilitate the Understand sprint of a Global Goals Jam',
    'problem framing for SDG design sprints: how-might-we questions that work',
    'rapid prototyping techniques for a 2-day SDG jam',
    'how to run a stakeholder mapping session for a local SDG challenge',
    'pitch formats for SDG jam teams: three minutes, one prototype',
    'facilitation methods for mixed groups of students, civil servants and designers',
    'how to keep energy up during a 48-hour design sprint',
    'from prototype to pilot: the Implement sprint explained',
    'systems thinking methods for local SDG action',
    'how to choose the right SDG target for your city jam',
  ],
  impact: [
    'what happens after a design sprint: how local SDG prototypes become projects',
    'measuring the impact of community design sprints for the SDGs',
    'how cities use design jams to accelerate local SDG action',
    'examples of student-led SDG innovation projects that scaled',
    'the role of universities in local SDG implementation',
    'how municipalities partner with design communities on the Global Goals',
  ],
  news: [
    'latest news on UN Sustainable Development Goals progress',
    'SDG Action Week events and initiatives',
    'climate resilience design innovation news',
    'youth-led climate and SDG initiatives worldwide',
    'urban resilience and adaptation projects',
    'circular economy local initiatives',
  ],
}

// Cover photo search terms — always SDG / jam / hackathon flavoured; rotate so
// consecutive articles don't look alike.
const IMAGE_POOLS: Record<Cat, string[]> = {
  methods: [
    'design sprint workshop sticky notes team',
    'hackathon teamwork whiteboard',
    'facilitator workshop diverse group collaboration',
    'prototyping cardboard workshop hands',
    'brainstorm post-it wall creative team',
  ],
  impact: [
    'community garden city volunteers',
    'sustainable city green rooftop',
    'students presenting project community',
    'urban neighbourhood people collaboration',
    'climate action community project',
  ],
  news: [
    'sustainable development goals city',
    'renewable energy community',
    'climate resilience city flood adaptation',
    'circular economy recycling community',
    'clean water sustainable community',
  ],
}

const CATS: Cat[] = ['methods', 'impact', 'news']

function isoWeek(d = new Date()): number {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  const day = t.getUTCDay() || 7
  t.setUTCDate(t.getUTCDate() + 4 - day)
  const y0 = new Date(Date.UTC(t.getUTCFullYear(), 0, 1))
  return Math.ceil(((t.getTime() - y0.getTime()) / 86400000 + 1) / 7)
}

/** Research: ask Claude (with web search) for 3–4 fresh, reputable sources. */
async function research(topic: string, cat: Cat, apiKey: string): Promise<{ urls: string[]; notes: string }> {
  const year = new Date().getFullYear()
  const res = await fetch(ANTHROPIC_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model: RESEARCH_MODEL,
      max_tokens: 1500,
      tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 5 }],
      messages: [{
        role: 'user',
        content: `Find 3–4 reputable, recent sources (${cat === 'news' ? `from the last few weeks, ${year}` : 'ideally from the last two years'}) for an editorial article on: "${topic}". Prefer UN/UNDP, universities, municipalities, established design/innovation publications and case studies; avoid content farms. Reply ONLY with JSON: {"urls":["…"],"notes":"2–3 sentences on the most useful angle"}.`,
      }],
    }),
  })
  if (!res.ok) throw new Error(`research ${res.status}: ${(await res.text()).slice(0, 200)}`)
  const data = await res.json()
  const text = (data.content || []).filter((b: any) => b.type === 'text').map((b: any) => b.text).join('\n')
  const m = text.match(/\{[\s\S]*\}/)
  const parsed = m ? JSON.parse(m[0]) : { urls: [], notes: '' }
  return { urls: (parsed.urls || []).filter((u: string) => /^https?:\/\//.test(u)).slice(0, 4), notes: String(parsed.notes || '') }
}

async function unsplashCover(cat: Cat, week: number): Promise<{ url: string | null; credit: string | null }> {
  const key = Deno.env.get('UNSPLASH_ACCESS_KEY')
  if (!key) return { url: null, credit: null }
  const pool = IMAGE_POOLS[cat]
  const q = pool[week % pool.length]
  const res = await fetch(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(q)}&orientation=landscape&per_page=8&content_filter=high`, {
    headers: { Authorization: `Client-ID ${key}` },
  })
  if (!res.ok) return { url: null, credit: null }
  const data = await res.json()
  const photos = (data.results || []).filter((p: any) => p.width > p.height)
  const pick = photos.length ? photos[week % photos.length] : data.results?.[0]
  if (!pick) return { url: null, credit: null }
  // Unsplash guidelines: trigger the download endpoint when using a photo.
  if (pick.links?.download_location) fetch(pick.links.download_location, { headers: { Authorization: `Client-ID ${key}` } }).catch(() => {})
  return { url: `${pick.urls.raw}&w=1600&h=900&fit=crop&q=80`, credit: `Photo by ${pick.user.name} on Unsplash` }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  const json = (b: unknown, status = 200) =>
    new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  try {
    // Optional shared secret so only cron / Marco can trigger a publish.
    const runKey = Deno.env.get('EDITORIAL_RUN_KEY')
    const url = new URL(req.url)
    if (runKey && url.searchParams.get('key') !== runKey && req.headers.get('x-editorial-key') !== runKey) {
      return json({ error: 'unauthorised' }, 401)
    }
    const dryRun = url.searchParams.get('dry_run') === '1'
    const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!apiKey) return json({ error: 'ANTHROPIC_API_KEY not configured' }, 500)
    const supabase = getSupabaseClient()

    // 1. Pick category + topic (rotation, or explicit override).
    const week = isoWeek()
    const catParam = url.searchParams.get('category') as Cat | null
    const cat: Cat = catParam && CATS.includes(catParam) ? catParam : CATS[week % CATS.length]
    const pool = CALENDAR[cat]
    const topic = url.searchParams.get('topic') || pool[Math.floor(week / CATS.length) % pool.length]

    // Idempotency: one editorial per ISO week.
    if (!dryRun && !url.searchParams.get('topic')) {
      const since = new Date(Date.now() - 6 * 86400000).toISOString()
      const { data: recent } = await supabase.from('articles').select('id').eq('source', 'ai').gte('created_at', since).limit(1)
      if (recent && recent.length) return json({ skipped: true, reason: 'an editorial was already published this week' })
    }

    // 2. Research (best effort — the writer can work from topic alone).
    let sources: string[] = []
    let notes = ''
    try { const r = await research(topic, cat, apiKey); sources = r.urls; notes = r.notes } catch (e) { console.warn('[editorial] research failed:', e) }

    // 3. Cover.
    const cover = await unsplashCover(cat, week)

    // 4. Write.
    const gen = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/generate-article`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${Deno.env.get('SUPABASE_ANON_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
      },
      body: JSON.stringify({
        topic: `${topic}${notes ? `\n\nResearch angle: ${notes}` : ''}`,
        urls: sources,
        category: cat,
        extraContext: 'This is the weekly editorial for the GGJ Articles section, written for jam hosts, facilitators and local SDG changemakers. Ground it in the provided sources and cite them naturally. Where relevant, point readers to the free GGJ Host Programme (globalgoalsjam.org/course/enroll) or the Toolkit Generator (globalgoalsjam.org/toolkit) — lightly, never as a sales pitch. End the LinkedIn post with the placeholder {{article_url}} on its own line.',
      }),
    })
    const genData = await gen.json().catch(() => null)
    const a = genData?.article
    if (!gen.ok || !a?.title) return json({ error: `generate-article failed: ${genData?.error || gen.status}` }, 502)

    // 5. Assemble + publish.
    const allowed: Cat[] = ['methods', 'impact', 'news']
    const category: Cat = allowed.includes(a.suggested_category) ? a.suggested_category : cat
    let slug = String(a.slug || a.title).toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 80)
    const { data: clash } = await supabase.from('articles').select('id').eq('slug', slug).limit(1)
    if (clash && clash.length) slug = `${slug}-${new Date().toISOString().slice(0, 10)}`
    const articleUrl = `${SITE}/articles/${slug}`
    const words = String(a.content_markdown || '').split(/\s+/).length
    const sourcesNote = sources.length ? `\n\n---\n*Sources: ${sources.map((u) => `[${new URL(u).hostname.replace(/^www\./, '')}](${u})`).join(' · ')}*` : ''
    let linkedin = String(a.linkedin_post || '').replace(/\{\{\s*article_url\s*\}\}/g, articleUrl).trim()
    if (!linkedin) linkedin = `${a.excerpt}\n\n${articleUrl}\n\n#GlobalGoalsJam #SDGs`
    if (!linkedin.includes(articleUrl)) linkedin += `\n\n${articleUrl}`

    const row = {
      slug,
      title: a.title,
      excerpt: a.excerpt,
      content: String(a.content_markdown || '') + sourcesNote,
      cover_image_url: cover.url,
      cover_caption: cover.credit,
      category,
      tags: (a.tags || []).join(', '),
      author_name: 'Global Goals Jam',
      source: 'ai',
      status: 'published',
      read_minutes: Math.max(1, Math.ceil(words / 200)),
      published_at: new Date().toISOString(),
      linkedin_post: linkedin,
    }

    if (dryRun) return json({ dryRun: true, week, category, topic, sources, cover, article: row })

    const { error: insErr } = await supabase.from('articles').insert(row)
    if (insErr) return json({ error: `insert failed: ${insErr.message}` }, 500)

    // 6. LinkedIn via Postiz (same integration as Metodic). Best effort — the
    //    article is live regardless; failures are reported, not fatal.
    let social: unknown = { skipped: 'POSTIZ_API_KEY / POSTIZ_GGJ_INTEGRATION_ID not set' }
    const postizKey = Deno.env.get('POSTIZ_API_KEY')
    const integration = Deno.env.get('POSTIZ_GGJ_INTEGRATION_ID')
    if (postizKey && integration) {
      const base = Deno.env.get('POSTIZ_API_URL') ?? 'https://api.postiz.com/public/v1'
      const body = {
        type: 'schedule',
        date: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        shortLink: false,
        posts: [{
          integration: { id: integration },
          value: [{ content: linkedin, image: cover.url ? [{ path: cover.url }] : [] }],
          settings: {},
        }],
      }
      const resp = await fetch(`${base}/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: postizKey },
        body: JSON.stringify(body),
      })
      social = resp.ok ? { scheduled: true, date: body.date } : { error: `Postiz ${resp.status}: ${(await resp.text()).slice(0, 300)}` }
    }

    return json({ ok: true, week, category, topic, slug, url: articleUrl, sources, social })
  } catch (e) {
    console.error('[weekly-editorial] error', e)
    return json({ error: e instanceof Error ? e.message : 'Unexpected error' }, 500)
  }
})
