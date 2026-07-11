import { ArrowRight, ExternalLink } from 'lucide-react'
import { Link } from 'react-router-dom'

const WIDD_BANNER = 'https://kzeoegabvbaonypooaev.supabase.co/storage/v1/object/public/Assets/widd-2026-banner.png'
const WIDD_REGISTER_FORM = 'https://forms.gle/XZpJMKv8J8fywnkz7'
const WIDD_PAGE = 'https://wdo.org/programmes/widd/widd-2026/'

/**
 * WIDD 2026 partnership announcement — the homepage's one dark band,
 * in the deep ink-green of the GGJ design language. The WIDD rose
 * accent survives only as the partner highlight + banner artwork.
 */
export default function WIDDAnnouncement() {
  return (
    <section className="border-y border-[#dfe9e2] bg-[#0d1f16] text-[#eef5f0]">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-16 sm:py-20">
        <div className="grid lg:grid-cols-[1fr_1.1fr] gap-10 items-center">
          {/* Left: Content */}
          <div className="space-y-5">
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#56C02B]">
              Amplify your impact
            </p>

            <h2 className="font-display font-extrabold tracking-tight text-2xl sm:text-3xl md:text-4xl leading-tight [text-wrap:balance]">
              Our theme aligns with{' '}
              <span className="text-[#F0B4BF]">World Industrial Design Day 2026</span>
            </h2>

            <p className="text-[#b9c9be] text-base sm:text-lg leading-relaxed max-w-xl">
              The World Design Organization just announced <strong className="text-white">"Resilience"</strong> as
              the WIDD 2026 theme — the same theme powering our Global Goals
              Jams this year. This is a great opportunity to amplify your local
              Jam's impact by also registering it as a WIDD event.
            </p>

            <div className="rounded-2xl bg-white/[0.06] border border-white/10 p-5">
              <p className="text-sm text-[#b9c9be] font-medium mb-3">
                Register your Global Goals Jam as a WIDD event:
              </p>
              <ul className="space-y-2 text-sm text-white/90">
                <li className="flex items-start gap-2.5">
                  <span className="font-mono text-[13px] tabular-nums text-[#56C02B] mt-0.5">1.</span>
                  <span><strong>Submit your Jam</strong> via the WDO event form to appear on their global map</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="font-mono text-[13px] tabular-nums text-[#56C02B] mt-0.5">2.</span>
                  <span><strong>Host on or around 29 June</strong> — World Industrial Design Day</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="font-mono text-[13px] tabular-nums text-[#56C02B] mt-0.5">3.</span>
                  <span><strong>Reach a wider audience</strong> through WDO's global design community</span>
                </li>
              </ul>
            </div>

            <div className="flex flex-wrap gap-3 pt-1">
              <a
                href={WIDD_REGISTER_FORM}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#0d1f16] hover:bg-[#e8f6ee] transition-colors"
              >
                Register at WDO <ExternalLink className="w-4 h-4 ml-2" />
              </a>
              <Link
                to="/theme"
                className="inline-flex items-center rounded-full border border-white/30 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
              >
                Our 2026 Theme <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </div>

            <p className="text-xs text-[#7f948a]">
              Learn more at{' '}
              <a
                href={WIDD_PAGE}
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 hover:text-white transition-colors"
              >
                wdo.org/programmes/widd
              </a>
              {' '}&middot;{' '}
              <a
                href="https://wdo.org/programmes/widd/get-involved/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 hover:text-white transition-colors"
              >
                Ideas for your WIDD event
              </a>
            </p>
          </div>

          {/* Right: Banner image */}
          <div className="hidden lg:flex flex-col items-center gap-4">
            <div className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
              <img
                src={WIDD_BANNER}
                alt="World Industrial Design Day 2026 — Resilience — 29 June 2026"
                className="w-full h-auto object-cover"
                onError={(e) => {
                  // Fallback: hide image if not yet uploaded to storage
                  (e.target as HTMLImageElement).style.display = 'none'
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
