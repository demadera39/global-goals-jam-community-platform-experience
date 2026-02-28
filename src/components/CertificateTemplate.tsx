import React from 'react'

interface CertificateTemplateProps {
  participantName?: string
  eventTitle?: string
  eventLocation?: string
  eventDate?: string // ISO
  editionYear?: string
  certificateKind?: 'participation' | 'host'
  logoSrc?: string
  signatureSrc?: string
  // New fields for admin certificate creator
  recipientName?: string
  year?: string
  certificateType?: 'general' | 'host' | 'participant'
  organization?: string
  issuedBy?: string
  customText?: string
}

// Certificate with outer frame and SDG color bar - improved alignment and spacing
export const CertificateTemplate = React.forwardRef<HTMLDivElement, CertificateTemplateProps>(
  ({
    participantName,
    eventTitle,
    eventLocation,
    eventDate,
    editionYear,
    certificateKind = 'participation',
    logoSrc,
    signatureSrc,
    // New admin creator fields
    recipientName,
    year,
    certificateType = 'general',
    organization,
    issuedBy,
    customText
  }, ref) => {
    // Support both old and new field names
    const displayName = recipientName || participantName || ''
    const displayYear = year || editionYear || String(new Date().getFullYear())
    const displayOrganization = organization || 'Global Goals Jam'
    const displayIssuedBy = issuedBy || 'Marco van Hout, Founder Global Goals Jam'

    // Determine the title and subject based on type
    let titleText = 'Certificate of Recognition'
    let subjectLabel = 'Recipient'
    let bodyText = ''

    if (certificateType === 'host' || certificateKind === 'host') {
      titleText = 'Certificate of Hosting'
      subjectLabel = 'Host'
      bodyText = `is hereby recognised as an eligible and recognised facilitator and host for Global Goals Jams around the world${
        eventTitle ? ` — ${eventTitle}` : ''
      }${eventLocation ? ` (${eventLocation})` : ''}.`
    } else if (certificateType === 'participant' || certificateKind === 'participation') {
      titleText = 'Certificate of Participation'
      subjectLabel = 'Participant'
      bodyText = `has actively participated in the Global Goals Jam${
        eventTitle ? ` — ${eventTitle}` : ''
      }${eventLocation ? ` (${eventLocation})` : ''}.`
    } else {
      // General certificate
      titleText = 'Certificate of Recognition'
      subjectLabel = 'Recipient'
      bodyText = `is recognised for their contribution and participation in the Global Goals Jam community.`
    }

    const date = eventDate ? new Date(eventDate) : new Date()
    const formattedDate = date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })

    return (
      <div ref={ref as any} className="w-[1100px] h-[800px] bg-white relative certificate-font">
        {/* Outer frame */}
        <div className="absolute inset-6 rounded-[24px] border-[3px] border-[#E5E7EB] pointer-events-none" />

        {/* SDG color bar at bottom */}
        <div
          className="absolute left-0 right-0 bottom-0 h-4"
          style={{
            background: 'linear-gradient(90deg, #E5243B 0%, #DDA63A 9%, #4C9F38 18%, #C5192D 27%, #FF3A21 36%, #26BDE2 45%, #FCC30B 54%, #A21942 63%, #FD6925 72%, #DD1367 81%, #0A97D9 90%, #56C02B 100%)'
          }}
        />

        {/* Header logo - reduced size and moved up for better spacing */}
        <div className="absolute left-1/2 -translate-x-1/2 top-[60px] flex items-center justify-center" style={{ width: '180px', height: '180px' }}>
          <img
            src={logoSrc || 'https://ovpxkzmevqowrgoiuxta.supabase.co/storage/v1/object/public/GGJ/GGJ_logo_socials.png'}
            crossOrigin="anonymous"
            alt="Global Goals Jam"
            className="max-w-full max-h-full object-contain"
            style={{ width: 'auto', height: 'auto' }}
            onError={(e) => {
              // Fallback to Supabase hosted logo
              const target = e.currentTarget as HTMLImageElement
              if (target.src !== 'https://ovpxkzmevqowrgoiuxta.supabase.co/storage/v1/object/public/GGJ/GGJ_logo_socials.png') {
                target.src = 'https://ovpxkzmevqowrgoiuxta.supabase.co/storage/v1/object/public/GGJ/GGJ_logo_socials.png'
              }
            }}
          />
        </div>

        {/* Titles - moved up and improved spacing */}
        <div className="absolute top-[300px] left-0 right-0 text-center px-20">
          <div className="text-xs tracking-[0.22em] text-[#6B7280] mb-3 font-normal">
            {displayOrganization.toUpperCase()} — CERTIFICATION YEAR {displayYear}
          </div>
          <h1 className="text-[38px] font-black text-[#111827] leading-tight mb-5">{titleText}</h1>

          <p className="text-base text-[#374151] my-4 leading-relaxed">This certifies that</p>
          <div className="text-[32px] font-extrabold text-[#111827] my-5 leading-tight break-words whitespace-normal max-w-[700px] mx-auto">
            {displayName}
          </div>

          <p className="text-base text-[#374151] mt-4 leading-relaxed">{bodyText}</p>

          {customText && (
            <p className="text-base text-[#374151] mt-4 leading-relaxed italic">{customText}</p>
          )}

          <p className="text-base text-[#374151] mt-6 mb-8 leading-relaxed">Date: {formattedDate}</p>
        </div>

        {/* Footer - improved spacing and alignment with more padding from date */}
        <div className="absolute bottom-[120px] left-20 right-20 flex items-end justify-between">
          {/* Subject line */}
          <div className="text-left">
            <div className="h-[1px] w-[240px] bg-[#D1D5DB]" />
            <div className="mt-2 text-sm text-[#374151]">{subjectLabel}</div>
          </div>

          {/* Center brand small */}
          <div className="text-center">
            <div className="flex items-center justify-center mx-auto" style={{ width: '56px', height: '56px' }}>
              <img
                src={logoSrc || 'https://ovpxkzmevqowrgoiuxta.supabase.co/storage/v1/object/public/GGJ/GGJ_logo_socials.png'}
                crossOrigin="anonymous"
                alt="Global Goals Jam"
                className="max-w-full max-h-full object-contain"
                style={{ width: 'auto', height: 'auto' }}
                onError={(e) => {
                  // Fallback to Supabase hosted logo
                  const target = e.currentTarget as HTMLImageElement
                  if (target.src !== 'https://ovpxkzmevqowrgoiuxta.supabase.co/storage/v1/object/public/GGJ/GGJ_logo_socials.png') {
                    target.src = 'https://ovpxkzmevqowrgoiuxta.supabase.co/storage/v1/object/public/GGJ/GGJ_logo_socials.png'
                  }
                }}
              />
            </div>
            <div className="text-xs text-[#6B7280] mt-1">Global Goals Jam</div>
          </div>

          {/* Signature */}
          <div className="text-right">
            <div className="w-[240px] h-[80px] flex items-center justify-center">
              <img
                src={signatureSrc || 'https://ovpxkzmevqowrgoiuxta.supabase.co/storage/v1/object/public/GGJ/signature.png'}
                crossOrigin="anonymous"
                alt="Marco van Hout signature"
                className="max-h-[80px] max-w-full object-contain"
                onError={(e) => {
                  // Fallback to Supabase-hosted signature
                  const target = e.currentTarget as HTMLImageElement
                  if (target.src !== 'https://ovpxkzmevqowrgoiuxta.supabase.co/storage/v1/object/public/GGJ/signature.png') {
                    target.src = 'https://ovpxkzmevqowrgoiuxta.supabase.co/storage/v1/object/public/GGJ/signature.png'
                  }
                }}
              />
            </div>
            <div className="h-[1px] w-[240px] bg-[#D1D5DB] mt-2" />
            <div className="mt-2 text-sm text-[#374151]">{displayIssuedBy}</div>
          </div>
        </div>
      </div>
    )
  }
)

CertificateTemplate.displayName = 'CertificateTemplate'

export default CertificateTemplate
