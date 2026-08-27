import { useMemo, useState } from 'react'
import { Play, MapPin } from 'lucide-react'
import {
  HERO_VIDEO,
  JAM_VIDEOS,
  youtubeEmbedUrl,
  youtubeThumb,
  type JamVideo,
} from '../data/decade'

/**
 * Jam Cinema — the ten-year video archive.
 *
 * Reuses the LearnShowcase browser-chrome frame for the hero video and the
 * tilted-card motif for the grid. Videos load as YouTube thumbnails and only
 * become an (privacy-enhanced) embed after a click, so the page stays light
 * even with 50+ videos on it.
 */

function VideoCard({ video, index }: { video: JamVideo; index: number }) {
  const [playing, setPlaying] = useState(false)
  const rotations = [-1.2, 0.9, -0.7, 1.1, -1.0, 0.6]
  const rot = rotations[index % rotations.length]

  return (
    <div
      className="article-card"
      style={{ ['--rot' as any]: `${rot}deg` }}
    >
      <div className="relative aspect-video w-full overflow-hidden bg-[#0e1712]">
        {playing ? (
          <iframe
            src={youtubeEmbedUrl(video.id, true)}
            title={video.title}
            className="absolute inset-0 h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <button
            type="button"
            onClick={() => setPlaying(true)}
            className="group absolute inset-0 h-full w-full"
            aria-label={`Play: ${video.title}`}
          >
            <img
              src={youtubeThumb(video.id)}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            />
            <span className="absolute inset-0 flex items-center justify-center bg-black/20 transition-colors group-hover:bg-black/10">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/95 shadow-lg transition-transform group-hover:scale-110">
                <Play className="ml-0.5 h-5 w-5 text-[#14201a]" fill="currentColor" />
              </span>
            </span>
            {video.duration && (
              <span className="absolute bottom-2 right-2 rounded-md bg-black/70 px-1.5 py-0.5 font-mono text-[11px] tabular-nums text-white">
                {video.duration}
              </span>
            )}
          </button>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <p className="text-sm font-semibold leading-snug text-[#14201a]">{video.title}</p>
        <div className="mt-auto flex flex-wrap items-center gap-2 text-[11px] text-[#7d8a83]">
          <span className="font-mono tabular-nums">{video.year}</span>
          {video.city && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {video.city}
            </span>
          )}
          <span
            className={
              video.kind === 'official'
                ? 'ml-auto rounded-full bg-[#00A651]/10 px-2 py-0.5 font-semibold text-[#00713a]'
                : 'ml-auto rounded-full bg-[#eef4f0] px-2 py-0.5 font-semibold text-[#4c5a52]'
            }
          >
            {video.kind === 'official' ? 'official' : 'local jam'}
          </span>
        </div>
      </div>
    </div>
  )
}

export default function VideoArchive() {
  const [heroPlaying, setHeroPlaying] = useState(false)
  const [yearFilter, setYearFilter] = useState<number | 'all'>('all')
  const [showAll, setShowAll] = useState(false)

  const years = useMemo(
    () => Array.from(new Set(JAM_VIDEOS.map((v) => v.year))).sort(),
    []
  )

  const filtered = useMemo(() => {
    const list = JAM_VIDEOS.filter(
      (v) => yearFilter === 'all' || v.year === yearFilter
    )
    // Official first within a year view; chronological across the archive.
    return [...list].sort((a, b) => a.year - b.year || (a.kind === b.kind ? 0 : a.kind === 'official' ? -1 : 1))
  }, [yearFilter])

  const visible = showAll || yearFilter !== 'all' ? filtered : filtered.slice(0, 12)

  return (
    <div>
      {/* Hero — the 2018 worldwide aftermovie in the browser-chrome frame */}
      <div className="learn-demo-stage mb-14">
        <div className="learn-demo-glow" aria-hidden="true" />
        <div className="learn-demo-frame">
          <div className="learn-demo-chrome">
            <span className="learn-demo-dot bg-[#FD6925]" />
            <span className="learn-demo-dot bg-[#FCC30B]" />
            <span className="learn-demo-dot bg-[#4C9F38]" />
            <span className="learn-demo-url">
              <span className="learn-demo-lock">●</span>
              youtube.com — {HERO_VIDEO.title}
            </span>
          </div>
          <div className="relative aspect-video w-full bg-[#0e1712]">
            {heroPlaying ? (
              <iframe
                src={youtubeEmbedUrl(HERO_VIDEO.id, true)}
                title={HERO_VIDEO.title}
                className="absolute inset-0 h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <button
                type="button"
                onClick={() => setHeroPlaying(true)}
                className="group absolute inset-0 h-full w-full"
                aria-label={`Play: ${HERO_VIDEO.title}`}
              >
                <img
                  src={`https://img.youtube.com/vi/${HERO_VIDEO.id}/maxresdefault.jpg`}
                  alt=""
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    ;(e.currentTarget as HTMLImageElement).src = youtubeThumb(HERO_VIDEO.id)
                  }}
                />
                <span className="absolute inset-0 flex items-center justify-center bg-black/25 transition-colors group-hover:bg-black/15">
                  <span className="flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-xl transition-transform group-hover:scale-110">
                    <Play className="ml-1 h-8 w-8 text-[#00A651]" fill="currentColor" />
                  </span>
                </span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Year filter */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setYearFilter('all')}
          aria-pressed={yearFilter === 'all'}
          className={
            yearFilter === 'all'
              ? 'rounded-full border border-[#14201a] bg-[#14201a] px-3.5 py-1.5 text-[13px] font-semibold text-white'
              : 'rounded-full border border-[#dfe9e2] bg-white px-3.5 py-1.5 text-[13px] font-semibold text-[#4c5a52] transition-colors hover:border-[#00A651]/50 hover:text-[#00713a]'
          }
        >
          All years
        </button>
        {years.map((y) => (
          <button
            key={y}
            type="button"
            onClick={() => setYearFilter(y)}
            aria-pressed={yearFilter === y}
            className={
              yearFilter === y
                ? 'rounded-full border border-[#14201a] bg-[#14201a] px-3.5 py-1.5 font-mono text-[13px] font-semibold tabular-nums text-white'
                : 'rounded-full border border-[#dfe9e2] bg-white px-3.5 py-1.5 font-mono text-[13px] font-semibold tabular-nums text-[#4c5a52] transition-colors hover:border-[#00A651]/50 hover:text-[#00713a]'
            }
          >
            {y}
          </button>
        ))}
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((v, i) => (
          <VideoCard key={`${v.id}-${i}`} video={v} index={i} />
        ))}
      </div>

      {!showAll && yearFilter === 'all' && filtered.length > 12 && (
        <div className="mt-8 text-center">
          <button
            type="button"
            onClick={() => setShowAll(true)}
            className="rounded-full border border-[#dfe9e2] bg-white px-6 py-2.5 text-sm font-semibold text-[#14201a] shadow-soft transition-colors hover:border-[#00A651]/50 hover:text-[#00713a]"
          >
            Show all {filtered.length} videos
          </button>
        </div>
      )}
    </div>
  )
}
