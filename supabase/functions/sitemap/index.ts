import { getSupabaseClient } from '../_shared/supabase.ts'

// Dynamic sitemap for www.globalgoalsjam.org. Served via the Vercel rewrite
// /sitemap.xml → this function, so search engines and AI crawlers always see
// the current set of published articles and events alongside the static pages.

const BASE = 'https://www.globalgoalsjam.org'

const STATIC_ROUTES: Array<{ path: string; priority: string; changefreq: string }> = [
  { path: '/', priority: '1.0', changefreq: 'weekly' },
  { path: '/events', priority: '0.9', changefreq: 'weekly' },
  { path: '/course/enroll', priority: '0.9', changefreq: 'monthly' },
  { path: '/toolkit', priority: '0.8', changefreq: 'monthly' },
  { path: '/articles', priority: '0.8', changefreq: 'weekly' },
  { path: '/process', priority: '0.7', changefreq: 'yearly' },
  { path: '/theme', priority: '0.7', changefreq: 'yearly' },
  { path: '/about', priority: '0.6', changefreq: 'yearly' },
  { path: '/faq', priority: '0.6', changefreq: 'monthly' },
  { path: '/host-directory', priority: '0.5', changefreq: 'monthly' },
  { path: '/supporters', priority: '0.4', changefreq: 'yearly' },
  { path: '/donate', priority: '0.4', changefreq: 'yearly' },
  { path: '/contact', priority: '0.4', changefreq: 'yearly' },
]

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

Deno.serve(async () => {
  const supabase = getSupabaseClient()

  const urls: string[] = STATIC_ROUTES.map(
    (r) => `<url><loc>${BASE}${r.path}</loc><changefreq>${r.changefreq}</changefreq><priority>${r.priority}</priority></url>`
  )

  try {
    const { data: articles } = await supabase
      .from('articles')
      .select('slug, updated_at, published_at')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(500)
    for (const a of articles || []) {
      if (!a.slug) continue
      const lastmod = (a.updated_at || a.published_at || '').slice(0, 10)
      urls.push(`<url><loc>${BASE}/articles/${esc(a.slug)}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}<changefreq>monthly</changefreq><priority>0.6</priority></url>`)
    }
  } catch (_) { /* articles unavailable — static routes still serve */ }

  try {
    const { data: events } = await supabase
      .from('events')
      .select('id, updated_at')
      .limit(500)
    for (const e of events || []) {
      if (!e.id) continue
      const lastmod = (e.updated_at || '').slice(0, 10)
      urls.push(`<url><loc>${BASE}/events/${esc(String(e.id))}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}<changefreq>monthly</changefreq><priority>0.5</priority></url>`)
    }
  } catch (_) { /* events unavailable */ }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=21600',
    },
  })
})
