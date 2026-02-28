import { cn } from '@/lib/utils'

interface SponsorBannerProps {
  className?: string
}

export default function SponsorBanner({ className }: SponsorBannerProps) {
  return (
    <section
      className={cn(
        'relative overflow-hidden rounded-2xl border bg-card shadow-sm',
        'px-6 py-8 sm:px-10 sm:py-10',
        className
      )}
      aria-label="Metodic sponsorship banner"
    >
      {/* subtle SDG texture */}
      <div className="absolute inset-0 sdg-colors opacity-[0.06] pointer-events-none" />

      <div className="relative max-w-4xl mx-auto flex flex-col items-center text-center gap-4">
        <img
          src="https://firebasestorage.googleapis.com/v0/b/blink-451505.firebasestorage.app/o/user-uploads%2Fz9Up8fyufsOU2ncxMU2r2iGBON23%2Flogotype__fc060903.png?alt=media&token=9075314a-0c8f-4585-be0d-b9fdfd4092f6"
          alt="Metodic logo"
          className="h-10 w-auto sm:h-12 object-contain"
        />

        <p className="text-xs sm:text-sm uppercase tracking-[0.18em] text-muted-foreground">
          Main Toolkit & Process Sponsor
        </p>

        <h3 className="text-lg sm:text-xl font-semibold text-foreground">
          Metodic — The #1 Solution for 21st Century Facilitators
        </h3>

        <div className="space-y-1">
          <p className="text-sm sm:text-base text-muted-foreground">
            Who know how to...
          </p>
          <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-primary">
            FACILITATE SMARTER!
          </p>
          <p className="text-sm sm:text-base text-foreground">
            Build full session toolkits in less than 10 min.
          </p>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Powered by purpose-built AI for facilitators
          </p>
        </div>

        <div className="pt-4">
          <a
            href="https://metodic.io"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center px-5 py-2.5 rounded-full bg-primary-solid text-white hover:bg-primary/90 transition-colors"
          >
            Visit metodic.io
          </a>
        </div>
      </div>
    </section>
  )
}
