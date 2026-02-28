import blink from './blink'
import { safeDbCall } from './blink'

export interface BuildCertData {
  participantName: string
  eventTitle?: string
  eventLocation?: string
  eventDate?: string // ISO
  editionYear?: string
  certificateKind?: 'participation' | 'host'
}

// Certificate HTML with outer frame + SDG color bar, supports host/participation
export function buildCertificateHtml(data: BuildCertData) {
  const date = data.eventDate ? new Date(data.eventDate) : new Date()
  const year = data.editionYear || String(date.getFullYear())
  const formattedDate = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

  const isHost = data.certificateKind === 'host'
  const titleText = isHost ? 'Certificate of Hosting' : 'Certificate of Participation'
  const subjectLabel = isHost ? 'Host' : 'Participant'

  const siteOrigin = (typeof window !== 'undefined' ? window.location.origin : '')

  // Build optional event strings safely (avoid nested template backticks)
  const eventSuffix = (data.eventTitle ? ' — ' + escapeHtml(data.eventTitle) : '') + (data.eventLocation ? ' (' + escapeHtml(data.eventLocation) + ')' : '')

  const hostParagraph = '<div class="p">is hereby recognised as an eligible and recognised facilitator and host for Global Goals Jams around the world, upon successful completion of the Host Certification Course' + eventSuffix + '.</div>'
  const participantParagraph = '<div class="p">has actively participated in the Global Goals Jam' + eventSuffix + '.</div>'

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(titleText)} — ${escapeHtml(data.participantName)}</title>
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;800;900&display=swap" rel="stylesheet">
  <style>
    :root { color-scheme: light only; }
    body { 
      margin: 0; 
      background: #fff; 
      color: #111827; 
      font-family: 'Poppins', Inter, ui-sans-serif, system-ui; 
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 20px;
      box-sizing: border-box;
    }
    .wrap { 
      width: 1100px; 
      height: 800px; 
      position: relative; 
      background: #fff; 
      box-shadow: 0 10px 25px rgba(0,0,0,0.1);
      border-radius: 8px;
      overflow: hidden;
    }
    .frame { 
      position: absolute; 
      inset: 24px; 
      border: 3px solid #E5E7EB; 
      border-radius: 24px; 
    }
    .sdg { 
      position: absolute; 
      left: 0; 
      right: 0; 
      bottom: 0; 
      height: 16px; 
      background: linear-gradient(90deg, #E5243B 0%, #DDA63A 9%, #4C9F38 18%, #C5192D 27%, #FF3A21 36%, #26BDE2 45%, #FCC30B 54%, #A21942 63%, #FD6925 72%, #DD1367 81%, #0A97D9 90%, #56C02B 100%); 
    }
    .logo-top { 
      position: absolute; 
      left: 50%; 
      transform: translateX(-50%); 
      top: 60px; 
      width: 180px; 
      height: 180px; 
    }
    .title { 
      position: absolute; 
      top: 300px; 
      left: 0; 
      right: 0; 
      text-align: center; 
      padding: 0 80px; 
    }
    .eyebrow { 
      font-size: 12px; 
      letter-spacing: 0.22em; 
      color: #6B7280; 
      margin-bottom: 12px; 
      font-weight: 400;
    }
    h1 { 
      font-size: 38px; 
      font-weight: 900; 
      line-height: 1.1; 
      margin: 0 0 20px 0; 
      color: #111827;
    }
    .p { 
      font-size: 16px; 
      color: #374151; 
      margin: 16px 0; 
      line-height: 1.5; 
    }
    .name { 
      font-size: 32px; 
      font-weight: 800; 
      margin: 20px 0; 
      color: #111827; 
      line-height: 1.2; 
      word-break: break-word; 
      max-width: 700px; 
      margin-left: auto; 
      margin-right: auto; 
    }
    .footer { 
      position: absolute; 
      bottom: 140px; 
      left: 80px; 
      right: 80px; 
      display: flex; 
      align-items: flex-end; 
      justify-content: space-between; 
    }
    .line { 
      height: 1px; 
      width: 240px; 
      background: #D1D5DB; 
    }
    .label { 
      margin-top: 8px; 
      font-size: 12px; 
      color: #374151; 
    }
    .brand img { 
      width: 56px; 
      height: 56px; 
      object-fit: contain; 
    }
    .sig img { 
      max-height: 80px; 
      max-width: 100%; 
      object-fit: contain; 
    }
    .print-controls {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 1000;
      display: flex;
      gap: 10px;
    }
    .print-btn {
      background: #00A651;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 6px;
      font-family: inherit;
      font-weight: 600;
      cursor: pointer;
      font-size: 14px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .print-btn:hover {
      background: #008A44;
    }
    @media print {
      body { 
        padding: 0; 
        min-height: auto;
      }
      .print-controls { 
        display: none; 
      }
      .wrap {
        box-shadow: none;
        border-radius: 0;
      }
    }
  </style>
</head>
<body>
  <div class="print-controls">
    <button class="print-btn" onclick="window.print()">🖨️ Print Certificate</button>
    <button class="print-btn" onclick="downloadPDF()">⬇️ Download PDF</button>
    <button class="print-btn" onclick="downloadJPG()">⬇️ Download Image (JPG)</button>
    <button class="print-btn" onclick="window.close()">✕ Close</button>
  </div>

  <div class="wrap">
    <div class="frame"></div>
    <div class="sdg"></div>

    <div class="logo-top">
      <img 
        src="https://ovpxkzmevqowrgoiuxta.supabase.co/storage/v1/object/public/GGJ/GGJ_logo_socials.png" 
        crossorigin="anonymous"
        alt="Global Goals Jam" 
        style="width:100%;height:100%;object-fit:contain;" 
        onerror="if (this.src !== 'https://ovpxkzmevqowrgoiuxta.supabase.co/storage/v1/object/public/GGJ/GGJ_logo_socials.png') this.src='https://ovpxkzmevqowrgoiuxta.supabase.co/storage/v1/object/public/GGJ/GGJ_logo_socials.png'" 
      />
    </div>

    <div class="title">
      <div class="eyebrow">GLOBAL GOALS JAM — CERTIFICATION YEAR ${year}</div>
      <h1>${escapeHtml(titleText)}</h1>

      <div class="p">This certifies that</div>
      <div class="name">${escapeHtml(data.participantName)}</div>
      ${isHost ? hostParagraph : participantParagraph}
      <div class="p">Date: ${escapeHtml(formattedDate)}</div>
    </div>

    <div class="footer">
      <div>
        <div class="line"></div>
        <div class="label">${escapeHtml(subjectLabel)}</div>
      </div>

      <div class="brand" style="text-align:center;">
        <img 
          src="https://ovpxkzmevqowrgoiuxta.supabase.co/storage/v1/object/public/GGJ/GGJ_logo_socials.png" 
          crossorigin="anonymous"
          alt="Global Goals Jam" 
          onerror="if (this.src !== 'https://ovpxkzmevqowrgoiuxta.supabase.co/storage/v1/object/public/GGJ/GGJ_logo_socials.png') this.src='https://ovpxkzmevqowrgoiuxta.supabase.co/storage/v1/object/public/GGJ/GGJ_logo_socials.png'" 
        />
        <div class="label">Global Goals Jam</div>
      </div>

      <div class="sig" style="text-align:right;">
        <div style="width:240px;height:80px;display:flex;align-items:center;justify-content:center;">
          <img 
            src="${siteOrigin}/marco-signature.svg" 
            crossorigin="anonymous"
            alt="Marco van Hout signature" 
            onerror="if (this.src !== '${siteOrigin}/marco-signature.svg') this.src='${siteOrigin}/marco-signature.svg'" 
          />
        </div>
        <div class="line" style="margin-top:8px"></div>
        <div class="label">Marco van Hout, Founder Global Goals Jam</div>
      </div>
    </div>
  </div>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
  <script>
    async function waitForImages(container) {
      const imgs = Array.from(container.querySelectorAll('img'));
      await Promise.all(imgs.map(img => new Promise((resolve) => {
        if (img.complete && img.naturalWidth > 0) return resolve(true);
        const onDone = () => { img.removeEventListener('load', onDone); img.removeEventListener('error', onDone); resolve(true); };
        img.addEventListener('load', onDone);
        img.addEventListener('error', onDone);
      })));
    }
    async function downloadPDF() {
      try {
        const wrap = document.querySelector('.wrap');
        await waitForImages(wrap);
        const canvas = await html2canvas(wrap, { scale: 2, useCORS: true, foreignObjectRendering: false, backgroundColor: '#ffffff', imageTimeout: 15000 });
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const ratio = Math.min(pageWidth / canvas.width, pageHeight / canvas.height);
        const imgWidth = canvas.width * ratio;
        const imgHeight = canvas.height * ratio;
        const x = (pageWidth - imgWidth) / 2;
        const y = (pageHeight - imgHeight) / 2;
        pdf.addImage(imgData, 'JPEG', x, y, imgWidth, imgHeight);
        const date = new Date().toISOString().slice(0,10);
        pdf.save('GGJ-Certificate-' + date + '.pdf');
      } catch (e) {
        console.error(e);
        alert('Failed to generate PDF. Please try again.');
      }
    }
    function dataUrlToBlob(dataUrl) {
      var arr = dataUrl.split(',');
      var mime = arr[0].match(/:(.*?);/)[1];
      var bstr = atob(arr[1]);
      var n = bstr.length;
      var u8arr = new Uint8Array(n);
      while (n--) u8arr[n] = bstr.charCodeAt(n);
      return new Blob([u8arr], { type: mime });
    }
    function isIOS() {
      return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.userAgent.includes('Mac') && 'ontouchend' in document);
    }
    function downloadDataUrl(dataUrl, filename) {
      try {
        var blob = dataUrlToBlob(dataUrl);
        if (isIOS()) {
          var reader = new FileReader();
          reader.onload = function () {
            var win = window.open(reader.result, '_blank');
            if (!win) alert('Please allow popups to save the image.');
          };
          reader.readAsDataURL(blob);
          return;
        }
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
      } catch (err) {
        console.error('download fallback failed', err);
        // Last resort
        var a2 = document.createElement('a');
        a2.href = dataUrl;
        a2.download = filename;
        document.body.appendChild(a2);
        a2.click();
        document.body.removeChild(a2);
      }
    }
    async function downloadJPG() {
      try {
        const wrap = document.querySelector('.wrap');
        await waitForImages(wrap);
        const canvas = await html2canvas(wrap, { scale: 3, useCORS: true, foreignObjectRendering: false, backgroundColor: '#ffffff', imageTimeout: 15000 });
        const imgData = canvas.toDataURL('image/jpeg', 0.98);
        const date = new Date().toISOString().slice(0,10);
        downloadDataUrl(imgData, 'GGJ-Certificate-' + date + '.jpg');
      } catch (e) {
        console.error(e);
        alert('Failed to generate image. Please try again.');
      }
    }
  </script>
</body>
</html>
`
}

export async function createCertificateRecord(params: {
  eventId: string
  recipientId: string
  participantName: string
  eventTitle?: string
  eventLocation?: string
  eventDate?: string
  certificateUrl?: string
  issuedByUserId?: string
  certificateType?: 'participation' | 'host'
}) {
  const certType = params.certificateType || 'participation'
  // Ensure recipient exists (FK constraint)
  const recipient = await safeDbCall(() => (blink.db as any).users.list({ where: { id: params.recipientId }, limit: 1 }))
  if (!recipient?.[0]) {
    throw new Error('Recipient user does not exist')
  }

  // Determine a valid issuer userId for FK: prefer provided, then current user, then event host, then recipient as last resort
  let issuerId = params.issuedByUserId
  try {
    if (!issuerId) {
      const me = await blink.auth.me()
      issuerId = me?.id || undefined
    }
  } catch {
    // ignore
  }
  if (!issuerId) {
    try {
      const ev = await safeDbCall(() => (blink.db as any).events.list({ where: { id: params.eventId }, limit: 1 }))
      issuerId = ev?.[0]?.hostId || undefined
    } catch {
      // ignore
    }
  }
  if (!issuerId) issuerId = params.recipientId

  // If a certificate already exists for this event+recipient+type, update it instead of creating a duplicate
  const existing = await safeDbCall(() => (blink.db as any).certificates.list({
    where: {
      eventId: params.eventId,
      recipientId: params.recipientId,
      certificateType: certType
    },
    limit: 1
  }))

  if (existing?.[0]) {
    const updated = await safeDbCall(() => (blink.db as any).certificates.update(existing[0].id, {
      recipientName: params.participantName,
      eventTitle: params.eventTitle,
      eventLocation: params.eventLocation,
      eventDate: params.eventDate,
      issuedBy: issuerId,
      certificateUrl: params.certificateUrl,
      certificateType: certType
    }))
    return updated
  }

  const res = await safeDbCall(() => (blink.db as any).certificates.create({
    certificateType: certType,
    eventId: params.eventId,
    recipientId: params.recipientId,
    recipientName: params.participantName,
    eventTitle: params.eventTitle,
    eventLocation: params.eventLocation,
    eventDate: params.eventDate,
    issuedBy: issuerId,
    certificateUrl: params.certificateUrl
  }))
  return res
}

function escapeHtml(s: string) {
  return String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

// New function to show certificate in HTML tab instead of PDF export
export async function showCertificateInNewTab(data: BuildCertData, opts?: { saveRecord?: { eventId: string, recipientId: string, certificateType?: 'participation' | 'host' } }): Promise<void> {
  // Generate the HTML content
  let htmlContent = buildCertificateHtml(data)

  // Inline critical public assets as data URLs so they always render inside blob previews
  try {
    const origin = window.location.origin

    const toDataUrl = async (path: string): Promise<string> => {
      const url = `${origin}${path}`
      const res = await fetch(url, { cache: 'no-store' })
      if (!res.ok) throw new Error(`Failed to fetch asset: ${url}`)
      const contentType = res.headers.get('content-type') || ''

      if (contentType.includes('svg')) {
        const svgText = await res.text()
        // Encode SVG as base64 for maximum compatibility inside blob documents and canvases
        const base64 = btoa(unescape(encodeURIComponent(svgText)))
        return `data:image/svg+xml;base64,${base64}`
      } else {
        const blob = await res.blob()
        const reader = new FileReader()
        const dataUrl: string = await new Promise((resolve) => {
          reader.onload = () => resolve(reader.result as string)
          reader.readAsDataURL(blob)
        })
        return dataUrl
      }
    }

    const logoUrl = 'https://ovpxkzmevqowrgoiuxta.supabase.co/storage/v1/object/public/GGJ/GGJ_logo_socials.png'
    const signatureUrl = `${origin}/marco-signature.svg`

    const [logoDataUrl, signatureDataUrl] = await Promise.all([
      toDataUrl(logoUrl.startsWith('http') ? logoUrl : `${origin}${logoUrl}`),
      toDataUrl(signatureUrl)
    ])

    htmlContent = htmlContent
      .replaceAll(logoUrl, logoDataUrl)
      .replaceAll(signatureUrl, signatureDataUrl)
      // Also replace any remaining relative paths just in case
      .replaceAll('/marco-signature.svg', signatureDataUrl)
      // Remove crossorigin attributes which can interfere in blob contexts
      .replaceAll('crossorigin="anonymous"', '')
      .replaceAll("crossorigin='anonymous'", '')
  } catch (err) {
    console.warn('Failed to inline certificate assets, falling back to absolute URLs:', err)
  }
  
  // Create a blob URL for the HTML
  const blob = new Blob([htmlContent], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  
  // Open in new tab
  const newWindow = window.open(url, '_blank')
  
  if (!newWindow) {
    alert('Please allow popups to view the certificate')
    return
  }
  
  // Clean up the blob URL after a delay
  setTimeout(() => {
    URL.revokeObjectURL(url)
  }, 15000)
  
  // If requested, save record to database
  if (opts?.saveRecord) {
    try {
      await createCertificateRecord({
        eventId: opts.saveRecord.eventId,
        recipientId: opts.saveRecord.recipientId,
        participantName: data.participantName,
        eventTitle: data.eventTitle,
        eventLocation: data.eventLocation,
        eventDate: data.eventDate,
        certificateUrl: `certificate-${data.participantName.toLowerCase().replace(/\s+/g, '-')}.html`,
        certificateType: opts.saveRecord.certificateType || 'participation'
      })
    } catch (err) {
      console.warn('Failed to save certificate record:', err)
    }
  }
}

// Legacy function for backward compatibility - now redirects to HTML version
export async function generateCertificate(data: BuildCertData, opts?: { saveRecord?: { eventId: string, recipientId: string, certificateType?: 'participation' | 'host' } }): Promise<void> {
  return showCertificateInNewTab(data, opts)
}