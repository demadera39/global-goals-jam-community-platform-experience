import { ArrowRight, Download } from 'lucide-react'
import { LEARN_URL } from '../lib/learnUrl'

/**
 * Homepage hero — "the jam poster" design language.
 * Ground #F6FAF7, ink #14201a, GGJ green as the only voice colour,
 * the SDG wheel ring bleeding off the right edge, staggered reveals.
 */

const STATS = [
  { value: '~55', label: 'Events per year' },
  { value: '~2,750', label: 'Changemakers yearly' },
  { value: '2', label: 'Days to impact' },
]

export default function HeroSection() {
  return (
    <section className="relative">
      {/* The SDG wheel — oversized, bleeding off-canvas, slow spin */}
      <div
        className="absolute -right-44 -top-24 h-[440px] w-[440px] sm:h-[560px] sm:w-[560px] pointer-events-none select-none opacity-[0.28] sm:opacity-90"
        aria-hidden="true"
      >
        <div className="ggj-wheel absolute inset-0 rounded-full" />
        <img
          src="/marker.png"
          alt=""
          className="absolute left-1/2 top-1/2 hidden w-20 -translate-x-1/2 -translate-y-1/2 object-contain sm:block"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = 'none'
          }}
        />
      </div>

      <div className="relative max-w-6xl mx-auto px-5 sm:px-8 pt-16 sm:pt-24 pb-16 sm:pb-20">
        <div className="max-w-2xl">
          {/* Eyebrow */}
          <p className="ggj-rise text-[11px] font-bold uppercase tracking-[0.3em] text-[#00713a]">
            The 2026 theme · A 2-day design sprint for the Global Goals
          </p>

          {/* Display headline */}
          <h1
            className="ggj-rise font-display font-extrabold tracking-tight text-[clamp(2.8rem,7vw,4.6rem)] leading-[1.02] mt-4 text-[#14201a] [text-wrap:balance]"
            style={{ animationDelay: '80ms' }}
          >
            Resilient <span className="text-[#00A651]">by Design</span>.
          </h1>

          {/* Muted sub */}
          <p
            className="ggj-rise text-lg text-[#4c5a52] mt-6 max-w-xl leading-relaxed"
            style={{ animationDelay: '160ms' }}
          >
            Local solutions for a world under pressure. From water stress to
            extreme heat, from food insecurity to displacement — join a global
            movement of designers and changemakers building resilience from the
            ground up, city by city.
          </p>

          {/* CTAs */}
          <div
            className="ggj-rise mt-9 flex flex-wrap items-center gap-x-6 gap-y-4"
            style={{ animationDelay: '240ms' }}
          >
            <a
              href={LEARN_URL}
              className="group inline-flex items-center rounded-full bg-[#00A651] px-7 py-3.5 text-base font-semibold text-white shadow-lg shadow-[#00A651]/25 hover:bg-[#008a44] transition-colors"
            >
              Start your host journey
              <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
            </a>
            <a
              href="https://kzeoegabvbaonypooaev.supabase.co/storage/v1/object/public/Assets/GGJ_2026_Resilient_by_Design.pdf"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#00713a] underline decoration-2 decoration-[#00A651]/30 underline-offset-4 hover:decoration-[#00A651] transition-colors"
            >
              <Download className="w-4 h-4" />
              Download the 2026 guide
            </a>
            <a
              href="/GGJ-Playbook.pdf"
              download="GGJ-Playbook.pdf"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#00713a] underline decoration-2 decoration-[#00A651]/30 underline-offset-4 hover:decoration-[#00A651] transition-colors"
            >
              <Download className="w-4 h-4" />
              The GGJ Playbook (PDF)
            </a>
          </div>

          {/* Quiet stat tiles */}
          <dl
            className="ggj-rise mt-12 grid max-w-md grid-cols-3 divide-x divide-[#dfe9e2] border-y border-[#dfe9e2]"
            style={{ animationDelay: '320ms' }}
          >
            {STATS.map((s, i) => (
              <div key={s.label} className={`py-4 ${i === 0 ? 'pr-4 sm:pr-6' : 'px-4 sm:px-6'}`}>
                <dd className="font-display text-2xl sm:text-3xl font-extrabold tabular-nums text-[#14201a]">
                  {s.value}
                </dd>
                <dt className="mt-1 text-[12px] leading-snug text-[#7d8a83]">{s.label}</dt>
              </div>
            ))}
          </dl>

          {/* Trust line */}
          <p className="ggj-rise mt-8 text-[13px] text-[#7d8a83]" style={{ animationDelay: '400ms' }}>
            Co-founded with UNDP in 2016 · run by local hosts, powered by a
            global community
          </p>
        </div>
      </div>
    </section>
  )
}
