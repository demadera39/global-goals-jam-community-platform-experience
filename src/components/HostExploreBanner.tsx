import { Link } from 'react-router-dom'
import { ArrowRight, Users } from 'lucide-react'

export default function HostExploreBanner() {
  return (
    <section className="py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-2xl border bg-card shadow-sm">
          <div className="absolute inset-0 sdg-colors opacity-[0.06] pointer-events-none" />
          <div className="relative p-6 sm:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Community</p>
              <h3 className="text-xl sm:text-2xl font-bold tracking-tight">Explore all of our hosts</h3>
              <p className="text-muted-foreground text-sm mt-1">Meet the organisers behind this global movement and find a jam near you.</p>
            </div>
            <Link
              to="/host-directory"
              className="inline-flex items-center px-5 py-3 rounded-lg bg-primary-solid text-white hover:bg-primary/90 transition-colors w-fit"
            >
              <Users className="w-4 h-4 mr-2" />
              Browse Host Directory
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
