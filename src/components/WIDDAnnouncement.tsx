import { Button } from './ui/button'
import { ArrowRight, ExternalLink, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'

const WIDD_BANNER = 'https://kzeoegabvbaonypooaev.supabase.co/storage/v1/object/public/Assets/widd-2026-banner.png'
const WIDD_REGISTER_FORM = 'https://forms.gle/XZpJMKv8J8fywnkz7'
const WIDD_PAGE = 'https://wdo.org/programmes/widd/widd-2026/'

export default function WIDDAnnouncement() {
  return (
    <section className="relative overflow-hidden bg-[#7A2E3E]">
      {/* Decorative petals */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-8 -left-8 w-32 h-32 rounded-full bg-[#C47A8A]/20 blur-2xl" />
        <div className="absolute top-4 right-[20%] w-20 h-20 rounded-full bg-[#E8A5B3]/15 blur-xl" />
        <div className="absolute bottom-0 right-0 w-48 h-48 rounded-full bg-[#C47A8A]/10 blur-3xl" />
        {/* Small flower accents */}
        <svg className="absolute top-6 left-[8%] w-5 h-5 text-[#C47A8A]/40" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" />
        </svg>
        <svg className="absolute top-10 left-[30%] w-8 h-8 text-[#D4919F]/30" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="6" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="12" r="3" />
          <circle cx="12" cy="18" r="3" />
          <circle cx="12" cy="12" r="2" />
        </svg>
        <svg className="absolute bottom-8 left-[15%] w-6 h-6 text-[#C47A8A]/25" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C12 2 14 6 14 8C14 10 12 12 12 12C12 12 10 10 10 8C10 6 12 2 12 2Z" />
          <path d="M12 2C12 2 14 6 14 8C14 10 12 12 12 12C12 12 10 10 10 8C10 6 12 2 12 2Z" transform="rotate(90 12 12)" />
          <path d="M12 2C12 2 14 6 14 8C14 10 12 12 12 12C12 12 10 10 10 8C10 6 12 2 12 2Z" transform="rotate(45 12 12)" />
          <path d="M12 2C12 2 14 6 14 8C14 10 12 12 12 12C12 12 10 10 10 8C10 6 12 2 12 2Z" transform="rotate(135 12 12)" />
        </svg>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid lg:grid-cols-[1fr_1.1fr] gap-8 items-center">
          {/* Left: Content */}
          <div className="text-white space-y-5">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm text-xs font-semibold uppercase tracking-wider text-[#F5C6CF]">
                <Sparkles className="w-3.5 h-3.5" />
                Amplify Your Impact
              </span>
            </div>

            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold leading-tight">
              Our theme aligns with<br />
              <span className="text-[#F0B4BF]">World Industrial Design Day 2026</span>
            </h2>

            <p className="text-[#E8C5CC] text-base sm:text-lg leading-relaxed max-w-xl">
              The World Design Organization just announced <strong className="text-white">"Resilience"</strong> as the WIDD 2026 theme — the same theme powering our Global Goals Jams this year. This is a great opportunity to amplify your local Jam's impact by also registering it as a WIDD event.
            </p>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <p className="text-sm text-[#E8C5CC] font-medium mb-3">Register your Global Goals Jam as a WIDD event:</p>
              <ul className="space-y-2 text-sm text-white/90">
                <li className="flex items-start gap-2">
                  <span className="text-[#F0B4BF] mt-0.5">1.</span>
                  <span><strong>Submit your Jam</strong> via the WDO event form to appear on their global map</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#F0B4BF] mt-0.5">2.</span>
                  <span><strong>Host on or around 29 June</strong> — World Industrial Design Day</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#F0B4BF] mt-0.5">3.</span>
                  <span><strong>Reach a wider audience</strong> through WDO's global design community</span>
                </li>
              </ul>
            </div>

            <div className="flex flex-wrap gap-3 pt-1">
              <Button asChild size="lg" className="bg-white text-[#7A2E3E] hover:bg-[#F5E6EA] font-semibold rounded-full px-6">
                <a href={WIDD_REGISTER_FORM} target="_blank" rel="noopener noreferrer">
                  Register at WDO <ExternalLink className="w-4 h-4 ml-2" />
                </a>
              </Button>
              <Button asChild size="lg" className="bg-transparent border-2 border-white/40 text-white hover:bg-white/10 rounded-full px-6">
                <Link to="/theme">
                  Our 2026 Theme <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>

            <p className="text-xs text-[#C9A0A9]">
              Learn more at{' '}
              <a href={WIDD_PAGE} target="_blank" rel="noopener noreferrer" className="underline hover:text-white transition-colors">
                wdo.org/programmes/widd
              </a>
              {' '}·{' '}
              <a href="https://wdo.org/programmes/widd/get-involved/" target="_blank" rel="noopener noreferrer" className="underline hover:text-white transition-colors">
                Ideas for your WIDD event
              </a>
            </p>
          </div>

          {/* Right: Banner image */}
          <div className="hidden lg:flex flex-col items-center gap-4">
            <div className="rounded-2xl overflow-hidden shadow-2xl border-2 border-white/10 bg-[#8A3B4C]">
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
