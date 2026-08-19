# GGJ Weekly Editorial & LinkedIn (n8n)

`n8n-ggj-weekly-editorial.json` — import into n8n (Workflows → Import from file).
Mirrors the Metodic content automation, adapted to GGJ.

**Cadence:** one article per week, Tuesday 09:00 Europe/Amsterdam, rotating
Methods → Impact → News. **Jam Stories are never automated** — the community
writes those from the host dashboard.

**Pipeline:** theme (ISO-week rotation) → Tavily research (fresh sources) →
SDG/jam-flavoured Unsplash cover (rotating pool, landscape only) →
`generate-article` (Claude Sonnet 5, GGJ editorial voice; returns article +
LinkedIn post) → saved to `public.articles` as `status=published`,
`source='ai'`, `author_name='Global Goals Jam'` → posted on the GGJ LinkedIn
company page with the article URL.

Published articles are picked up automatically by the sitemap, the homepage
Articles band, and the Article JSON-LD; the reader shows an "Editorial" badge
on `source='ai'` pieces.

## One-time setup in n8n
1. Supabase HTTP nodes (2×): replace `YOUR_SUPABASE_ANON_KEY` and
   `YOUR_SUPABASE_SERVICE_ROLE_KEY` (project `kzeoegabvbaonypooaev`).
2. `YOUR_TAVILY_API_KEY` in *Search with Tavily*.
3. `YOUR_UNSPLASH_ACCESS_KEY` in *Find Header Image (Unsplash)*.
4. LinkedIn OAuth2 credential with scope `w_organization_social`; put the GGJ
   company page **organization ID** in *Post to LinkedIn (GGJ page)*.
5. Run once with *Manual Trigger*; check the article on the site and the
   LinkedIn post; then activate the workflow.

Pause LinkedIn only: disable the last node — articles keep publishing.
Want review before publishing instead? In *Prepare Article & LinkedIn Post*
set `status: 'pending'` — it then shows up in /admin/articles for approval.
