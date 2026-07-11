import { Link } from 'react-router-dom'
import { ArrowRight, Users } from 'lucide-react'

export default function HostExploreBanner() {
  return (
    <section className="max-w-6xl mx-auto px-5 sm:px-8 py-8">
      <div className="rounded-2xl border border-[#dfe9e2] bg-white shadow-sm">
        <div className="p-6 sm:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#00713a]">Community</p>
            <h3 className="font-display font-extrabold tracking-tight text-xl sm:text-2xl mt-2">
              Explore all of our hosts
            </h3>
            <p className="text-sm text-[#4c5a52] mt-1.5">
              Meet the organisers behind this global movement and find a jam near you.
            </p>
          </div>
          <Link
            to="/host-directory"
            className="inline-flex items-center rounded-full bg-[#00A651] px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#008a44] transition-colors w-fit"
          >
            <Users className="w-4 h-4 mr-2" />
            Browse Host Directory
            <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </div>
      </div>
    </section>
  )
}
