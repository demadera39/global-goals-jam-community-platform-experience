export interface ToolkitExportOptions {
  title: string
  sdgLabel?: string
  jamDuration?: string
  participants?: string
  challenge?: string
  contentHtml: string // already HTML (can be <pre> or rich HTML)
}

// Build a clean, printable HTML document with fixed layout and inline styles
export function buildToolkitHtml(opts: ToolkitExportOptions) {
  const primary = '#00A651'
  const accent = '#F59E0B'

  const metaTop = [
    opts.sdgLabel ? `<span><strong>SDG:</strong> ${escapeHtml(opts.sdgLabel)}</span>` : '',
    opts.jamDuration ? `<span><strong>Duration:</strong> ${escapeHtml(opts.jamDuration)} day(s)</span>` : '',
    opts.participants ? `<span><strong>Participants:</strong> ${escapeHtml(opts.participants)}</span>` : ''
  ]
    .filter(Boolean)
    .join('<span class="dot">•</span>')

  const challenge = opts.challenge
    ? `<div class="challenge"><strong>Challenge:</strong> ${escapeHtml(opts.challenge)}</div>`
    : ''

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(opts.title)}</title>
    <style>
      :root { --primary: ${primary}; --accent: ${accent}; }
      * { box-sizing: border-box; }
      html, body { height: 100%; }
      body { margin: 0; font-family: Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"; color: #0f172a; background: #ffffff; }
      .wrap { max-width: 900px; margin: 0 auto; padding: 32px; }
      .header { background: var(--primary); color: #ffffff; border-radius: 16px; padding: 24px 28px; }
      .title { margin: 0 0 6px 0; font-size: 24px; font-weight: 800; letter-spacing: -0.02em; }
      .meta { display: flex; flex-wrap: wrap; gap: 10px; font-size: 13px; opacity: 0.95; }
      .dot { display:inline-block; margin: 0 8px; opacity: 0.6; }
      .challenge { margin-top: 8px; font-size: 14px; }
      .content { margin-top: 20px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; }
      .content h1, .content h2, .content h3 { color: #0f172a; }
      .content h2 { margin-top: 20px; padding-bottom: 4px; border-bottom: 2px solid var(--primary); }
      .content h3 { margin-top: 16px; color: var(--primary); }
      .content pre { white-space: pre-wrap; font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; line-height: 1.7; font-size: 14px; }
      .footer { margin-top: 28px; padding-top: 16px; border-top: 1px solid #e2e8f0; display: flex; align-items: center; justify-content: space-between; font-size: 12px; color: #475569; }
      .badge { display:inline-flex; align-items:center; gap:8px; padding:6px 10px; background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 999px; color:#0f172a; font-weight: 600; text-decoration: none; }
      .badge .dot { width: 6px; height: 6px; background: var(--primary); border-radius: 50%; margin: 0; }
      @media print {
        .wrap { padding: 24px; }
        .header { border-radius: 0; }
        .content { page-break-inside: auto; }
      }
    </style>
  </head>
  <body>
    <div class="wrap">
      <div class="header">
        <h1 class="title">${escapeHtml(opts.title)}</h1>
        <div class="meta">${metaTop}</div>
        ${challenge}
      </div>
      <div class="content">
        ${opts.contentHtml}
      </div>
      <div class="footer">
        <span>Printed on ${new Date().toLocaleDateString()}</span>
        <a class="badge" href="https://metodic.io" target="_blank" rel="noopener noreferrer"><span class="dot"></span> Built with Metodic.io</a>
      </div>
    </div>
  </body>
</html>`
}

export function markdownToBasicHtml(md: string) {
  // Minimal conversions: ### → h3, ## → h2, **bold** → strong, line breaks
  let html = md
    .replace(/^###\s?(.*)$/gm, '<h3>$1</h3>')
    .replace(/^##\s?(.*)$/gm, '<h2>$1</h2>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')

  // Convert simple lists "- " into <ul><li>
  html = html.replace(/(^|\n)-\s+(.*)(?=\n|$)/g, (match, p1, item) => `${p1}<li>${item}</li>`)
  // Wrap consecutive <li> groups in <ul>
  html = html.replace(/(<li>[^<]*<\/li>\n?)+/g, (group) => `<ul>${group.replace(/\n/g, '')}</ul>`) 

  // Wrap the rest as paragraphs
  html = html
    .split(/\n{2,}/)
    .map(block => {
      if (/^<h[23]>/.test(block) || /^<ul>/.test(block) || /^<li>/.test(block)) return block
      return `<p>${block.replace(/\n/g, '<br>')}</p>`
    })
    .join('\n')

  return html
}

function escapeHtml(s: string) {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

// ------- INDIVIDUAL ITEM EXPORTS -------
export interface MethodExportData {
  title: string
  description: string
  duration: string
  participants: string
  phase: 'understand' | 'define' | 'prototype' | 'implement'
  difficulty: 'easy' | 'medium' | 'hard'
  materials: string[]
  steps: string[]
  tips?: string[]
}

export function buildMethodCardHtml(method: MethodExportData) {
  const phaseLabel = {
    understand: 'Understand & Empathize',
    define: 'Define & Ideate',
    prototype: 'Prototype & Test',
    implement: 'Implement & Scale'
  }[method.phase]

  const difficultyColor = {
    easy: '#22c55e',
    medium: '#eab308',
    hard: '#ef4444'
  }[method.difficulty]

  const content = `
    <div class="section">
      <div class="row between">
        <div>
          <h2 class="h">${escapeHtml(method.title)}</h2>
          <div class="muted">${escapeHtml(phaseLabel)}</div>
        </div>
        <span class="pill" style="--pill:${difficultyColor}">${escapeHtml(method.difficulty.toUpperCase())}</span>
      </div>

      <p class="lead">${escapeHtml(method.description)}</p>

      <div class="meta">
        <span>⏱ ${escapeHtml(method.duration)}</span>
        <span>👥 ${escapeHtml(method.participants)}</span>
      </div>

      ${method.materials?.length ? `
      <h3>Materials</h3>
      <ul>${method.materials.map(m => `<li>${escapeHtml(m)}</li>`).join('')}</ul>
      ` : ''}

      ${method.steps?.length ? `
      <h3>Steps</h3>
      <ol>${method.steps.map(s => `<li>${escapeHtml(s)}</li>`).join('')}</ol>
      ` : ''}

      ${method.tips?.length ? `
      <div class="note">
        <strong>Facilitator Tips</strong>
        <ul>${method.tips.map(t => `<li>${escapeHtml(t)}</li>`).join('')}</ul>
      </div>
      ` : ''}
    </div>
  `

  return buildBaseDocument(`Method Card — ${method.title}`, content, { pageSize: 'A4', orientation: 'portrait' })
}

export interface TemplateSection {
  title: string
  type: 'text' | 'list' | 'canvas' | 'rating'
  prompt: string
  placeholder?: string
  options?: string[]
}
export interface ParticipantTemplateExportData {
  title: string
  description: string
  phase: 'understand' | 'define' | 'prototype' | 'implement'
  sections: TemplateSection[]
}

export function buildParticipantTemplateHtml(tpl: ParticipantTemplateExportData) {
  const phaseLabel = {
    understand: 'Understand & Empathize',
    define: 'Define & Ideate',
    prototype: 'Prototype & Test',
    implement: 'Implement & Scale'
  }[tpl.phase]

  const sectionsHtml = tpl.sections.map((s) => {
    if (s.type === 'text') {
      return `
      <div class="section">
        <h3>${escapeHtml(s.title)}</h3>
        <p class="muted">${escapeHtml(s.prompt)}</p>
        <div class="lines">${Array.from({length:4}).map(() => '<div class="line"></div>').join('')}</div>
      </div>`
    }
    if (s.type === 'list') {
      return `
      <div class="section">
        <h3>${escapeHtml(s.title)}</h3>
        <p class="muted">${escapeHtml(s.prompt)}</p>
        <div class="checklist">${Array.from({length:5}).map(() => '<div class="item"><div class="box"></div><div class="blank"></div></div>').join('')}</div>
      </div>`
    }
    if (s.type === 'canvas') {
      return `
      <div class="section">
        <h3>${escapeHtml(s.title)}</h3>
        <p class="muted">${escapeHtml(s.prompt)}</p>
        <div class="canvas">${escapeHtml(s.placeholder || 'Draw, sketch, or write here')}</div>
      </div>`
    }
    if (s.type === 'rating') {
      return `
      <div class="section">
        <h3>${escapeHtml(s.title)}</h3>
        <p class="muted">${escapeHtml(s.prompt)}</p>
        <div class="ratings">
          ${(s.options || []).map(o => `
            <div class="rate-row">
              <span>${escapeHtml(o)}</span>
              <div class="circles">${Array.from({length:5}).map(() => '<span class="circle"></span>').join('')}</div>
            </div>
          `).join('')}
        </div>
      </div>`
    }
    return ''
  }).join('')

  const header = `
    <div class="row between">
      <div>
        <h2 class="h">${escapeHtml(tpl.title)}</h2>
        <div class="muted">${escapeHtml(phaseLabel)}</div>
      </div>
      <a class="badge" href="https://metodic.io" target="_blank" rel="noopener noreferrer"><span class="dot"></span> Built with Metodic.io</a>
    </div>
    <p class="lead">${escapeHtml(tpl.description)}</p>
    <div class="info">
      <div><strong>Name:</strong> <span class="blank short"></span></div>
      <div><strong>Team:</strong> <span class="blank short"></span></div>
    </div>
  `

  return buildBaseDocument(`Template — ${tpl.title}`, header + sectionsHtml, { pageSize: 'A3', orientation: 'landscape' })
}

export interface SessionActivity {
  time: string
  duration: string
  title: string
  description: string
  materials: string[]
  steps?: string[]
  facilitatorNotes: string[]
  energyLevel: 'low' | 'medium' | 'high'
}
export interface SessionPlanExportData {
  title: string
  duration: string
  participants: string
  sdgFocus: string
  challenge: string
  guideSections?: {
    principles?: string[]
    facilitationTips?: string[]
    inclusionTips?: string[]
    openingScript?: string
    closingScript?: string
  }
  days: {
    day: number
    theme: string
    objective: string
    activities: SessionActivity[]
  }[]
}

export function buildSessionPlanHtml(plan: SessionPlanExportData) {
  // Normalize each day's activities to guarantee 09:00–17:00, contiguous, exact 480 min
  let normalizedPlan = plan
  try {
    // Lazy import to avoid circular deps at build time
    // @ts-expect-error - require available in bundler context
    const { normalizeDayActivities } = require('./schedule') as typeof import('./schedule')
    const days = plan.days.map((d) => {
      const res = normalizeDayActivities(d.activities)
      return { ...d, activities: res.activities, _notes: res.notes as string[] }
    })
    normalizedPlan = { ...plan, days } as any
  } catch (_err) {
    // ignore normalization if dynamic import unavailable in this context
  }

  const daysHtml = normalizedPlan.days.map((day: any) => `
    <div class="day">
      <div class="day-head">
        <div class="bubble">${day.day}</div>
        <div>
          <h3>Day ${day.day}: ${escapeHtml(day.theme)}</h3>
          <div class="muted">${escapeHtml(day.objective)}</div>
        </div>
      </div>
      ${day._notes && day._notes.length ? `<div class="note"><ul>${day._notes.map((n:string)=>`<li>${escapeHtml(n)}</li>`).join('')}</ul></div>` : ''}
      ${day.activities.map((act: SessionActivity) => `
        <div class="activity">
          <div class="time">
            <div class="t">${escapeHtml(act.time)}</div>
            <div class="d">${escapeHtml(act.duration)}</div>
          </div>
          <div class="content">
            <h4>${escapeHtml(act.title)}</h4>
            <p class="muted">${escapeHtml(act.description)}</p>
            ${act.materials?.length ? `<div class="chips">${act.materials.map(m => `<span class="chip">${escapeHtml(m)}</span>`).join('')}</div>` : ''}
            ${act.steps?.length ? `<h5>Steps</h5><ol>${act.steps.map(s => `<li>${escapeHtml(s)}</li>`).join('')}</ol>` : ''}
            ${act.facilitatorNotes?.length ? `<div class="note"><strong>Facilitator Notes</strong><ul>${act.facilitatorNotes.map(n => `<li>${escapeHtml(n)}</li>`).join('')}</ul></div>` : ''}
          </div>
        </div>
      `).join('')}
    </div>
  `).join('')

  const header = `
    <div class="row between">
      <div>
        <h2 class="h">Facilitator Session Plan</h2>
        <div class="muted">${escapeHtml(plan.title)}</div>
      </div>
      <div class="tags">
        <span class="tag">${escapeHtml(plan.sdgFocus)}</span>
        <span class="tag">⏱ ${escapeHtml(plan.duration)}</span>
        <span class="tag">👥 ${escapeHtml(plan.participants)}</span>
      </div>
    </div>
    <div class="section">
      <h3>Challenge Focus</h3>
      <p>${escapeHtml(plan.challenge)}</p>
    </div>
    ${plan.guideSections ? `
    <div class="section">
      <h3>Core Principles</h3>
      <ul>${(plan.guideSections.principles || []).map(p => `<li>${escapeHtml(p)}</li>`).join('')}</ul>
      <h3>Facilitation Tips</h3>
      <ul>${(plan.guideSections.facilitationTips || []).map(p => `<li>${escapeHtml(p)}</li>`).join('')}</ul>
      <h3>Inclusion & Safety</h3>
      <ul>${(plan.guideSections.inclusionTips || []).map(p => `<li>${escapeHtml(p)}</li>`).join('')}</ul>
      ${plan.guideSections.openingScript ? `<div class="note"><strong>Opening Script</strong><p>${escapeHtml(plan.guideSections.openingScript)}</p></div>` : ''}
      ${plan.guideSections.closingScript ? `<div class="note"><strong>Closing Script</strong><p>${escapeHtml(plan.guideSections.closingScript)}</p></div>` : ''}
    </div>` : ''}
  `

  return buildBaseDocument('Session Plan', header + daysHtml, { pageSize: 'A4', orientation: 'portrait' })
}

// Base document builder shared by all item exports
function buildBaseDocument(title: string, bodyHtml: string, opts?: { pageSize?: 'A4' | 'A3', orientation?: 'portrait' | 'landscape' }) {
  const pageSize = opts?.pageSize || 'A4'
  const orientation = opts?.orientation || 'portrait'
  const styles = `
    :root { --primary: #00A651; --accent: #F59E0B; }
    * { box-sizing: border-box; }
    body { margin:0; background:#ffffff; color:#0f172a; font-family: Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; }
    .wrap { max-width: 900px; margin: 0 auto; padding: 32px; }
    .h { margin:0; font-size: 24px; font-weight: 800; letter-spacing: -0.02em; }
    .muted { color:#475569; }
    .lead { margin: 12px 0 16px; font-size: 14px; color:#334155; }
    .row { display:flex; align-items:center; gap:16px; }
    .between { justify-content: space-between; }
    .badge { display:inline-flex; align-items:center; gap:8px; padding:6px 10px; background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 999px; color:#0f172a; font-weight: 600; text-decoration: none; }
    .badge .dot { width: 6px; height: 6px; background: var(--primary); border-radius: 50%; }
    .pill { display:inline-flex; align-items:center; gap:8px; padding:6px 10px; background: color-mix(in srgb, var(--primary) 10%, white); border: 1px solid #e2e8f0; border-radius: 999px; font-weight:700; color:#0f172a; }
    .section { background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:20px; margin:16px 0; }
    .meta { display:flex; gap:12px; color:#475569; font-size: 13px; margin: 8px 0 12px; }
    .note { background:#fff7ed; border:1px solid #fed7aa; color:#9a3412; padding:12px; border-radius:10px; margin-top:12px; }
    .chips { display:flex; flex-wrap:wrap; gap:6px; margin-top:6px; }
    .chip { background:#eef2ff; border:1px solid #e0e7ff; color:#3730a3; padding:4px 8px; border-radius:999px; font-size:12px; }
    .info { display:flex; gap:24px; align-items:center; margin: 8px 0 12px; }
    .blank { display:inline-block; height: 16px; border-bottom: 2px dashed #cbd5e1; vertical-align: middle; }
    .short { width: 160px; }
    .lines { display:flex; flex-direction:column; gap:8px; margin-top:8px; }
    .line { height: 22px; border-bottom: 2px dashed #cbd5e1; }
    .checklist { display:flex; flex-direction:column; gap:10px; margin-top:8px; }
    .item { display:flex; align-items:center; gap:10px; }
    .box { width:16px; height:16px; border: 1px solid #cbd5e1; border-radius: 4px; }
    .canvas { height: 160px; border:2px dashed #cbd5e1; border-radius: 12px; display:flex; align-items:center; justify-content:center; color:#64748b; }
    .ratings { display:flex; flex-direction:column; gap:10px; margin-top:8px; }
    .rate-row { display:flex; align-items:center; justify-content:space-between; gap:10px; }
    .circles { display:flex; gap:8px; }
    .circle { width:14px; height:14px; border:1px solid #cbd5e1; border-radius:999px; }
    .day { border:1px solid #e2e8f0; border-radius:12px; overflow:hidden; margin:16px 0; }
    .day-head { display:flex; align-items:center; gap:12px; padding:14px 16px; background:#f1f5f9; }
    .bubble { width:36px; height:36px; border-radius:12px; background: hsl(142 76% 36% / 1); display:flex; align-items:center; justify-content:center; color:white; font-weight:800; }
    .activity { display:flex; gap:16px; padding:16px; border-top:1px solid #e2e8f0; }
    .time { width:90px; flex-shrink:0; }
    .t { font-weight: 700; }
    .d { color:#64748b; font-size:12px; }
    h2 { margin: 0 0 4px; }
    h3 { margin: 8px 0; color: #0f172a; border-bottom: 2px solid var(--primary); padding-bottom: 4px; }
    h4 { margin: 6px 0; }
    ul { margin: 6px 0 0 16px; }
    ol { margin: 6px 0 0 20px; }
    footer { margin-top: 24px; display:flex; justify-content:space-between; align-items:center; color:#64748b; font-size:12px; }
    @page { size: ${pageSize} ${orientation}; margin: 18mm; }
  `

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <style>${styles}</style>
</head>
<body>
  <div class="wrap">
    ${bodyHtml}
    <footer>
      <span>Exported on ${new Date().toLocaleDateString()}</span>
      <a class="badge" href="https://metodic.io" target="_blank" rel="noopener noreferrer"><span class="dot"></span> Built with Metodic.io</a>
    </footer>
  </div>
</body>
</html>`
}
