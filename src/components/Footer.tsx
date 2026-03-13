import { Link } from 'react-router-dom'
import { Globe, Mail, ArrowUpRight } from 'lucide-react'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  const navSections = [
    {
      title: 'Platform',
      links: [
        { name: '2026 Theme', href: '/theme' },
        { name: 'Events', href: '/events' },
        { name: 'About', href: '/about' },
        { name: 'FAQ', href: '/faq' },
        { name: 'Contact', href: '/contact' },
      ],
    },
    {
      title: 'Get Involved',
      links: [
        { name: 'Host a Jam', href: '/course/train-the-trainer' },
        { name: 'Toolkit', href: '/toolkit' },
        { name: 'Certification Course', href: '/course/enroll' },
        { name: '2026 Guide (PDF)', href: 'https://kzeoegabvbaonypooaev.supabase.co/storage/v1/object/public/Assets/GGJ_2026_Resilient_by_Design.pdf', external: true },
      ],
    },
    {
      title: 'Community',
      links: [
        { name: 'Host Directory', href: '/host-directory' },
        { name: 'Supporters', href: '/supporters' },
        { name: 'Organizer Booklet', href: '/organizer-booklet' },
      ],
    },
  ]

  return (
    <footer className="bg-foreground text-background/80">
      {/* SDG Color Strip — 17 official goal colors */}
      <div className="flex w-full h-2" aria-label="UN Sustainable Development Goals color strip">
        {Array.from({ length: 17 }, (_, i) => (
          <div key={i} className={`flex-1 bg-sdg-${i + 1}`} />
        ))}
      </div>

      {/* Main footer content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8">
          {/* Brand section */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center space-x-2.5 group mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <img
                  src="/marker.png"
                  alt="Global Goals Jam"
                  className="w-7 h-7 object-contain"
                  onError={(e) => {
                    const img = e.currentTarget as HTMLImageElement
                    if (!img.src.endsWith('/ggj-logo.svg')) img.src = '/ggj-logo.svg'
                  }}
                />
              </div>
              <span className="text-lg font-display font-bold text-background">Global Goals Jam</span>
            </Link>
            <p className="text-background/60 text-sm leading-relaxed max-w-sm mb-6">
              A global movement of designers, thinkers, and changemakers tackling the UN Sustainable Development Goals through creative problem-solving.
            </p>
            <div className="flex items-center gap-3">
              <a
                href="https://globalgoalsjam.org"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-background/50 hover:text-primary transition-colors"
              >
                <Globe className="w-4 h-4" />
                globalgoalsjam.org
                <ArrowUpRight className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Navigation sections */}
          {navSections.map((section) => (
            <div key={section.title}>
              <h3 className="font-display font-semibold text-background text-sm mb-4">{section.title}</h3>
              <ul className="space-y-2.5">
                {section.links.map((link) => (
                  <li key={link.name}>
                    {(link as any).external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm text-background/50 hover:text-primary transition-colors"
                      >
                        {link.name}
                      </a>
                    ) : (
                      <Link
                        to={link.href}
                        className="text-sm text-background/50 hover:text-primary transition-colors"
                      >
                        {link.name}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="border-t border-background/10 mt-12 pt-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-1.5 text-sm text-background/40">
              <span>&copy; {currentYear} Global Goals Jam.</span>
              <span className="hidden sm:inline">Powered by</span>
              <a
                href="https://metodic.io"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary transition-colors inline-flex items-center gap-1"
              >
                <span className="sm:hidden">by </span>Metodic.io
                <ArrowUpRight className="w-3 h-3" />
              </a>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/contact" className="text-sm text-background/40 hover:text-primary transition-colors inline-flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" />
                Contact
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
