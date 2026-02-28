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
      className="fixed inset-x-0 top-4 z-50 flex justify-center pointer-events-none"
    >
      <div className="pointer-events-auto max-w-3xl w-full mx-4">
        <div className="flex items-center justify-between gap-4 bg-primary-solid text-white rounded-lg shadow-lg p-3 sm:p-4 transition-transform duration-300 transform translate-y-0">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M12 2v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M21 12h-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 22v-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M3 12h6"  stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="text-sm sm:text-base leading-snug">
              <div className="font-semibold">Welcome — our brand new community platform has just launched!</div>
              <div className="mt-1 text-sm opacity-90">Hosts: Host dashboard, Local Page Editor, Certificate generator, Media uploads, AI toolkits — now Global Goals Jam runs year‑round.</div>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <a href="/host-dashboard" className="hidden sm:inline-flex items-center px-3 py-2 rounded-md bg-white/10 text-white text-sm font-medium hover:bg-white/20">For hosts →</a>

            <button
              onClick={dismiss}
              aria-label="Dismiss announcement"
              className="p-2 rounded-md text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/40"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
