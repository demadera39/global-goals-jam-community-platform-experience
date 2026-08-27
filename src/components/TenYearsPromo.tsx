import { Link } from 'react-router-dom'
import { ArrowRight, Play } from 'lucide-react'
import { HERO_VIDEO, youtubeThumb } from '../data/decade'

/**
 * TenYearsPromo — landing-page teaser for /ten.
 *
 * Left: eyebrow + heading + blurb + CTAs. Right: a small fan of three tilted
 * artefact cards (the 2018 aftermovie still, the decade numbers, a polaroid
 * quote) that all lead to the retrospective. Same jam-poster vocabulary as
 * the rest of the homepage.
 */
export default function TenYearsPromo() {
  return (
    <section className="border-y border-[#dfe9e2] bg-white/70 overflow-x-clip">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-16 sm:py-20">
        <div className="grid lg:grid-cols-[1fr_1fr] gap-12 lg:gap-10 items-center">
          {/* Copy */}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#00713a]">
              2016 — 2026
            </p>
            <h2 className="font-display font-extrabold tracking-tight text-3xl sm:text-4xl mt-3 [text-wrap:balance]">
              Ten years of jamming
            </h2>
            <p className="text-[#4c5a52] text-lg leading-relaxed mt-4">
              What started with 500 people in seventeen cities has become a
              network of a hundred cities and 7,000+ jammers. Explore the
              decade: the story of every edition, the films, and the memories
              the community is adding right now.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3">
              <Link
                to="/ten"
                className="inline-flex items-center rounded-full bg-[#00A651] px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#008a44] transition-colors"
              >
                Explore ten years <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
              <Link
                to="/memories"
                className="inline-flex items-center text-sm font-semibold text-[#00713a] underline decoration-2 decoration-[#00A651]/30 underline-offset-4 hover:decoration-[#00A651] transition-colors"
              >
                Add your memory <ArrowRight className="w-4 h-4 ml-1.5" />
              </Link>
            </div>
          </div>

          {/* Tilted card fan — everything leads to /ten */}
          <div className="relative mx-auto w-full max-w-md h-[340px] sm:h-[360px]" aria-hidden={false}>
            {/* Aftermovie still */}
            <Link
              to="/ten"
              className="ggj-artefact absolute left-0 top-2 w-[72%] rounded-2xl border border-[#dfe9e2] bg-white p-2.5 pb-3 shadow-card block"
              style={{ transform: 'rotate(-3deg)' }}
            >
              <span className="relative block overflow-hidden rounded-xl bg-[#0e1712]">
                <img
                  src={youtubeThumb(HERO_VIDEO.id)}
                  alt="Still from the official 2018 Global Goals Jam aftermovie"
                  loading="lazy"
                  className="block w-full aspect-video object-cover"
                />
                <span className="absolute inset-0 flex items-center justify-center bg-black/20">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/95 shadow-lg">
                    <Play className="ml-0.5 h-4 w-4 text-[#14201a]" fill="currentColor" />
                  </span>
                </span>
              </span>
              <span className="mt-2 block px-1 text-xs font-semibold text-[#14201a]">
                The official aftermovies, 2016 → now
              </span>
            </Link>

            {/* Numbers card */}
            <Link
              to="/ten"
              className="ggj-artefact absolute right-0 top-[34%] w-[46%] rounded-2xl border border-[#dfe9e2] bg-white p-5 shadow-card block"
              style={{ transform: 'rotate(2.6deg)' }}
            >
              <span className="ggj-rainbow block h-1 w-10 rounded-full" aria-hidden="true" />
              <span className="mt-3 block font-display text-3xl font-extrabold tabular-nums text-[#00A651]">
                100
              </span>
              <span className="block text-xs text-[#4c5a52] leading-snug">
                cities have hosted a jam
              </span>
              <span className="mt-2 block font-display text-3xl font-extrabold tabular-nums text-[#00A651]">
                7,000+
              </span>
              <span className="block text-xs text-[#4c5a52] leading-snug">jammers since 2016</span>
            </Link>

            {/* Polaroid quote */}
            <Link
              to="/ten"
              className="ggj-artefact absolute left-[8%] bottom-0 w-[62%] rounded-2xl border border-[#dfe9e2] bg-white p-5 shadow-card block"
              style={{ transform: 'rotate(-1.6deg)' }}
            >
              <span className="block font-display text-sm font-bold leading-snug text-[#14201a]">
                “Think BIG, start SMALL, act FAST!”
              </span>
              <span className="mt-1.5 block text-[11px] text-[#7d8a83]">
                Mariko Sugita, host of GGJ Tokyo 2017
              </span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
