/**
 * /sitemap.xml — served from our own edge so it carries an XML content type.
 *
 * The sitemap itself is built by the Supabase `sitemap` function (it needs DB
 * access for published articles, events and host cities). Proxying it through
 * here rather than rewriting straight to Supabase is deliberate: Supabase's
 * gateway rewrites the function's `application/xml` to `text/plain`, and
 * Vercel's `headers` config cannot override the content type of an external
 * rewrite. This wrapper sets it on a response we control.
 */
const UPSTREAM = 'https://kzeoegabvbaonypooaev.supabase.co/functions/v1/sitemap'

export default async function handler(_req, res) {
  try {
    const upstream = await fetch(UPSTREAM, { headers: { accept: 'application/xml' } })
    const xml = await upstream.text()

    if (!upstream.ok || !xml.startsWith('<?xml')) {
      console.error('sitemap upstream failed', upstream.status, xml.slice(0, 200))
      res.status(502).send('Sitemap temporarily unavailable')
      return
    }

    res.setHeader('Content-Type', 'application/xml; charset=utf-8')
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=21600')
    res.status(200).send(xml)
  } catch (error) {
    console.error('sitemap proxy error', error)
    res.status(502).send('Sitemap temporarily unavailable')
  }
}
