import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// SDG helpers
export function sdgNumberFromFocus(focus?: string | null): number | null {
  if (!focus) return null
  // Accept values like "3", "SDG 3", "sdg-3", "03 - Good Health"
  const match = String(focus).match(/\b(1[0-7]|\d)\b/)
  if (!match) return null
  const n = parseInt(match[1], 10)
  return n >= 1 && n <= 17 ? n : null
}

export function sdgBg(n?: number | null): string {
  return n ? `bg-sdg-${n}` : ''
}

export function sdgText(n?: number | null): string {
  return n ? `text-sdg-${n}` : ''
}

export function sdgBorder(n?: number | null): string {
  return n ? `border-sdg-${n}` : ''
}

export function sdgTheme(n?: number | null): string {
  return n ? `sdg-theme-${n}` : ''
}

// Cross-browser helpers for triggering downloads from data URLs
export function dataUrlToBlob(dataUrl: string): Blob {
  const parts = dataUrl.split(',')
  const header = parts[0]
  const base64 = parts[1]
  const mimeMatch = header.match(/:(.*?);/)
  const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream'
  const binary = atob(base64)
  const len = binary.length
  const u8 = new Uint8Array(len)
  for (let i = 0; i < len; i++) u8[i] = binary.charCodeAt(i)
  return new Blob([u8], { type: mime })
}

function isIOS(): boolean {
  const ua = navigator.userAgent || ''
  // iOS devices or iPadOS (Mac with touch points)
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const isIpadOS = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1
  return /iPad|iPhone|iPod/.test(ua) || isIpadOS
}

export function downloadDataUrl(dataUrl: string, filename: string): void {
  try {
    const blob = dataUrlToBlob(dataUrl)

    if (isIOS()) {
      // iOS Safari cannot reliably download programmatically; open in a new tab
      const reader = new FileReader()
      reader.onload = () => {
        const win = window.open(reader.result as string, '_blank')
        if (!win) alert('Please allow popups to save the file.')
      }
      reader.readAsDataURL(blob)
      return
    }

    const blobUrl = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = blobUrl
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(blobUrl), 4000)
  } catch (err) {
    console.warn('downloadDataUrl fallback path due to error:', err)
    // Last resort fallback
    const a = document.createElement('a')
    a.href = dataUrl
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }
}