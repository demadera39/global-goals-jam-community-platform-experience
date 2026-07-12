import { stripHtml } from './utils'

/**
 * Shared "jam highlights" derivation.
 *
 * A completed jam surfaces as a highlight — on the homepage strip and as the
 * enriched community "Results are in" card — when it has real results to show:
 * a written summary and/or at least one uploaded media item. Both surfaces use
 * these helpers so they judge results, excerpts and thumbnails identically.
 */

export interface HighlightEvent {
  id: string
  title: string
  location?: string
  eventDate?: string
  status?: string
  coverImage?: string
  resultsSummary?: string
  createdAt?: string
  updatedAt?: string
  endDate?: string
}

export interface HighlightMedia {
  id?: string
  eventId?: string
  fileUrl?: string
  fileType?: string
  createdAt?: string
}

/** True when a media row is (or looks like) an image we can use as a thumbnail. */
export function isImageMedia(m: HighlightMedia): boolean {
  const t = (m.fileType || '').toLowerCase()
  const url = (m.fileUrl || '').toLowerCase()
  return t.startsWith('image/') || /\.(png|jpe?g|gif|webp)$/i.test(url)
}

/** First usable image URL from a set of media rows, if any. */
export function firstMediaImage(media: HighlightMedia[]): string | undefined {
  const hit = media.find(isImageMedia)
  return hit?.fileUrl || undefined
}

/** Non-empty results summary? (stripHtml ignores empty markup like `<p></p>`.) */
export function hasSummary(event: Pick<HighlightEvent, 'resultsSummary'>): boolean {
  return stripHtml(event.resultsSummary).length > 0
}

/**
 * A completed jam "has results" worth surfacing when it carries a written
 * summary OR at least one uploaded media item.
 */
export function hasResults(
  event: Pick<HighlightEvent, 'resultsSummary'>,
  mediaCount: number,
): boolean {
  return hasSummary(event) || mediaCount > 0
}

/** Plain-text, length-capped excerpt of a results summary (for card previews). */
export function summaryExcerpt(html?: string | null, maxChars = 140): string {
  const text = stripHtml(html)
  if (text.length <= maxChars) return text
  return `${text.slice(0, maxChars - 1).trimEnd()}…`
}

/** Thumbnail preference: first uploaded image, else the event cover image. */
export function highlightThumb(
  event: Pick<HighlightEvent, 'coverImage'>,
  media: HighlightMedia[],
): string | undefined {
  return firstMediaImage(media) || event.coverImage || undefined
}
