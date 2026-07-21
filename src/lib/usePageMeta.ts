import { useEffect } from 'react'

// Per-route SEO for the SPA: keeps document.title, meta description,
// canonical and the og:/twitter: mirrors in sync with the active page.
// Google renders JS, so this is what its index sees per route; non-JS
// crawlers get the strong defaults baked into index.html.

const SITE = 'https://www.globalgoalsjam.org'
const SUFFIX = ' · Global Goals Jam'

function setMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

export function usePageMeta(opts: {
  title: string
  description?: string
  /** Path for the canonical URL, e.g. '/events' or '/articles/my-slug'. */
  path?: string
  /** Absolute URL of a page-specific share image. */
  image?: string
  /** Extra JSON-LD for this page; replaced per route, cleaned up on unmount. */
  jsonLd?: object | null
}) {
  const { title, description, path, image, jsonLd } = opts
  const jsonLdString = jsonLd ? JSON.stringify(jsonLd) : ''

  useEffect(() => {
    if (!title) return
    const fullTitle = title.includes('Global Goals Jam') ? title : `${title}${SUFFIX}`
    document.title = fullTitle
    setMeta('property', 'og:title', fullTitle)
    setMeta('name', 'twitter:title', fullTitle)

    if (description) {
      setMeta('name', 'description', description)
      setMeta('property', 'og:description', description)
      setMeta('name', 'twitter:description', description)
    }

    if (path !== undefined) {
      const url = `${SITE}${path}`
      setMeta('property', 'og:url', url)
      let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
      if (!canonical) {
        canonical = document.createElement('link')
        canonical.setAttribute('rel', 'canonical')
        document.head.appendChild(canonical)
      }
      canonical.setAttribute('href', url)
    }

    if (image) {
      setMeta('property', 'og:image', image)
      setMeta('name', 'twitter:image', image)
    }
  }, [title, description, path, image])

  useEffect(() => {
    if (!jsonLdString) return
    const el = document.createElement('script')
    el.type = 'application/ld+json'
    el.setAttribute('data-page-jsonld', 'true')
    el.textContent = jsonLdString
    document.head.appendChild(el)
    return () => { el.remove() }
  }, [jsonLdString])
}
