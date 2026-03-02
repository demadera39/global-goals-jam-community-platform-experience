import { cn } from '@/lib/utils'

interface SponsorBannerProps {
  className?: string
}

export default function SponsorBanner({ className }: SponsorBannerProps) {
  return (
    <section
      className={cn(
        'relative overflow-hidden rounded-xl border border-border/40 bg-muted/30',
        'px-6 py-4 sm:px-8',
        className
      )}
      aria-label="Metodic sponsorship banner"
    >
      <div className="relative max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-5">
        {/* Left: Logo + label */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <img
            src="https://firebasestorage.googleapis.com/v0/b/blink-451505.firebasestorage.app/o/user-uploads%2Fz9Up8fyufsOU2ncxMU2r2iGBON23%2Flogotype__fc060903.png?alt=media&token=9075314a-0c8f-4585-be0d-b9fdfd4092f6"
            alt="Metodic logo"
            className="h-6 w-auto object-contain"
          />
          <span className="hidden sm:inline text-[10px] uppercase tracking-[0.15em] text-muted-foreground/70 font-medium">
            Toolkit Sponsor
          </span>
        </div>

        {/* Center: Copy — single line on desktop */}
        <p className="text-sm text-muted-foreground text-center leading-snug">
          Design engaging workshops in minutes — powered by science-backed AI
        </p>

        {/* Right: CTA */}
        <a
          href="https://metodic.io"
          target="_blank"
          rel="noreferrer"
          className="flex-shrink-0 inline-flex items-center px-4 py-1.5 rounded-full text-xs font-medium bg-foreground text-background hover:bg-foreground/90 transition-colors"
        >
          metodic.io &rarr;
        </a>
      </div>
    </section>
  )
}
