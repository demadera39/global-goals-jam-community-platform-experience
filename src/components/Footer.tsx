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
        { name: 'Host a Jam', href: '/course/enroll' },
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
    <footer className="bg-white border-t border-[#dfe9e2] text-[#14201a]">
      {/* Main footer content */}
      <div className="max-w-6xl mx-auto px-5 sm:px-8 pt-14 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8">
          {/* Brand section */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-2.5 group mb-4">
              <img
                src="/marker.png"
                alt="Global Goals Jam"
                className="h-9 w-auto object-contain transition-transform group-hover:scale-105"
                onError={(e) => {
                  const img = e.currentTarget as HTMLImageElement
                  if (!img.src.endsWith('/ggj-logo.svg')) img.src = '/ggj-logo.svg'
                }}
              />
              <span className="whitespace-nowrap font-display font-extrabold tracking-tight text-lg">
                Global Goals Jam
              </span>
            </Link>
            <p className="text-[#4c5a52] text-sm leading-relaxed max-w-sm mb-6">
              A global movement of designers, thinkers, and changemakers tackling
              the UN Sustainable Development Goals through creative
              problem-solving.
            </p>
            <a
              href="https://globalgoalsjam.org"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-[#4c5a52] hover:text-[#00713a] transition-colors"
            >
              <Globe className="w-4 h-4" />
              globalgoalsjam.org
              <ArrowUpRight className="w-3 h-3" />
            </a>
          </div>

          {/* Navigation sections */}
          {navSections.map((section) => (
            <div key={section.title}>
              <h3 className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#00713a] mb-4">
                {section.title}
              </h3>
              <ul className="space-y-2.5">
                {section.links.map((link) => (
                  <li key={link.name}>
                    {(link as any).external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm text-[#4c5a52] hover:text-[#00713a] transition-colors"
                      >
                        {link.name}
                      </a>
                    ) : (
                      <Link
                        to={link.href}
                        className="text-sm text-[#4c5a52] hover:text-[#00713a] transition-colors"
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
        <div className="border-t border-[#dfe9e2] mt-12 pt-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-1.5 text-sm text-[#7d8a83]">
              <span>&copy; {currentYear} Global Goals Jam.</span>
              <span className="hidden sm:inline">Powered by</span>
              <a
                href="https://metodic.io"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#00713a] transition-colors inline-flex items-center gap-1"
              >
                <span className="sm:hidden">by </span>Metodic.io
                <ArrowUpRight className="w-3 h-3" />
              </a>
            </div>
            <div className="flex items-center gap-4">
              <Link
                to="/contact"
                className="text-sm text-[#7d8a83] hover:text-[#00713a] transition-colors inline-flex items-center gap-1.5"
              >
                <Mail className="w-3.5 h-3.5" />
                Contact
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* SDG rainbow hairline — the page's bottom edge */}
      <div className="ggj-rainbow h-1.5 w-full" aria-hidden="true" />
    </footer>
  )
}
