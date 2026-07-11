import React, { useEffect, useState } from 'react'
import { X } from 'lucide-react'

export default function FloatingAnnouncement() {
  const STORAGE_KEY = 'ggj_banner_dismissed'
  const [visible, setVisible] = useState<boolean>(false)

  useEffect(() => {
    try {
      const dismissed = localStorage.getItem(STORAGE_KEY)
      setVisible(dismissed !== '1')
    } catch (e) {
      setVisible(true)
    }
  }, [])

  const dismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, '1')
    } catch (e) {
      // ignore
    }
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      role="region"
      aria-label="Platform launch announcement"
      aria-live="polite"
      className="relative z-10 w-full flex justify-center px-4 pt-4"
    >
      <div className="max-w-3xl w-full">
        <div className="flex items-center justify-between gap-4 bg-white border border-[#dfe9e2] text-[#14201a] rounded-2xl shadow-sm p-3 sm:p-4">
          <div className="flex items-start gap-3">
            <span className="flex-shrink-0 mt-1.5 h-2.5 w-2.5 rounded-full bg-[#00A651]" aria-hidden="true" />
            <div className="text-sm sm:text-base leading-snug">
              <div className="font-semibold">Welcome — our brand new community platform has just launched!</div>
              <div className="mt-1 text-sm text-[#4c5a52]">Hosts: Host dashboard, Local Page Editor, Certificate generator, Media uploads, AI toolkits — now Global Goals Jam runs year‑round.</div>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <a
              href="/host-dashboard"
              className="hidden sm:inline-flex items-center whitespace-nowrap px-3.5 py-2 rounded-full bg-[#00A651] text-white text-sm font-semibold hover:bg-[#008a44] transition-colors"
            >
              For hosts →
            </a>

            <button
              onClick={dismiss}
              aria-label="Dismiss announcement"
              className="p-2 rounded-full text-[#7d8a83] hover:bg-[#14201a]/5 hover:text-[#14201a] focus:outline-none focus:ring-2 focus:ring-[#00A651]/40 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
