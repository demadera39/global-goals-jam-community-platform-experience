import { useState, useRef } from 'react'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Textarea } from '../components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Award, Download, Loader2 } from 'lucide-react'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import CertificateTemplate from '../components/CertificateTemplate'
import { toast } from 'sonner'
import AdminShell, { Pill, adminCardClass, quietButtonClass, primaryButtonClass } from '../components/admin/AdminShell'

type CertificateType = 'general' | 'host' | 'participant' | 'custom'

interface CertificateData {
  name: string
  year: string
  yearTo: string // optional end year for a range
  certificateDate: string // ISO date format
  certificateType: CertificateType
  organization: string
  issuedBy: string
  customText: string
  // Custom / tailored fields
  customTitle: string
  customSubject: string
  periodLabel: string
  locationLabel: string
  bodyOverride: string
}

const DEFAULT_ISSUED_BY = 'Global Goals Jam'

const CERTIFICATE_TYPES: { value: CertificateType; label: string; description: string }[] = [
  {
    value: 'general',
    label: 'General Certificate',
    description: 'A general recognition certificate for any achievement'
  },
  {
    value: 'host',
    label: 'Host Certificate',
    description: 'Recognition for hosting a Global Goals Jam event'
  },
  {
    value: 'participant',
    label: 'Participant Certificate',
    description: 'Recognition for participating in a Global Goals Jam event'
  },
  {
    value: 'custom',
    label: 'Custom / Tailored Certificate',
    description: 'Fully custom title, period, location and body — e.g. "Global Goals Jam from 2017 to 2025 for India in Delhi NCR"'
  }
]

export default function AdminCertificateCreator() {
  const certificateRef = useRef<HTMLDivElement>(null)
  const [generating, setGenerating] = useState(false)
  const [certificateData, setCertificateData] = useState<CertificateData>({
    name: '',
    year: new Date().getFullYear().toString(),
    yearTo: '',
    certificateDate: new Date().toISOString().split('T')[0], // Today's date in ISO format
    certificateType: 'general',
    organization: 'Global Goals Jam',
    issuedBy: DEFAULT_ISSUED_BY,
    customText: '',
    customTitle: '',
    customSubject: '',
    periodLabel: '',
    locationLabel: '',
    bodyOverride: ''
  })

  const handleInputChange = (field: keyof CertificateData, value: string) => {
    setCertificateData(prev => ({ ...prev, [field]: value }))
  }

  const generatePDF = async () => {
    if (!certificateData.name.trim() || !certificateData.year.trim() || !certificateData.certificateDate.trim()) {
      toast.error('Please fill in the required fields (Name, Year, and Date)')
      return
    }

    setGenerating(true)
    try {
      if (!certificateRef.current) {
        throw new Error('Certificate element not found')
      }

      // Create a temporary container at full size for proper rendering
      const tempContainer = document.createElement('div')
      tempContainer.style.position = 'fixed'
      tempContainer.style.left = '-9999px'
      tempContainer.style.top = '-9999px'
      tempContainer.style.width = '1100px'
      tempContainer.style.height = '800px'
      tempContainer.style.display = 'block'
      document.body.appendChild(tempContainer)

      // Clone the certificate into the temp container to ensure full dimensions
      const clonedCertificate = certificateRef.current.cloneNode(true) as HTMLElement
      tempContainer.appendChild(clonedCertificate)

      // Create canvas from certificate at full dimensions
      const canvas = await html2canvas(tempContainer, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#FFFFFF',
        allowTaint: true,
        logging: false,
        width: 1100,
        height: 800
      })

      // Remove temp container
      document.body.removeChild(tempContainer)

      // Certificate dimensions in pixels
      const certWidth = 1100
      const certHeight = 800
      
      // Convert to mm (at 96 DPI)
      const pxToMm = 25.4 / 96
      const certWidthMm = certWidth * pxToMm
      const certHeightMm = certHeight * pxToMm
      
      // Create PDF with A4 landscape orientation
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
        compress: true
      })

      const pdfWidth = pdf.internal.pageSize.getWidth() // 297mm
      const pdfHeight = pdf.internal.pageSize.getHeight() // 210mm
      
      // Apply margins
      const margin = 3 // 3mm margins
      const availableWidth = pdfWidth - (2 * margin)
      const availableHeight = pdfHeight - (2 * margin)
      
      // Calculate scale to fit with margins
      const scaleX = availableWidth / certWidthMm
      const scaleY = availableHeight / certHeightMm
      const scale = Math.min(scaleX, scaleY)
      
      // Final dimensions on PDF
      const finalWidth = certWidthMm * scale
      const finalHeight = certHeightMm * scale
      
      // Center the certificate on the page
      const x = (pdfWidth - finalWidth) / 2
      const y = (pdfHeight - finalHeight) / 2
      
      // Add image to PDF
      const imgData = canvas.toDataURL('image/jpeg', 0.95)
      pdf.addImage(imgData, 'JPEG', x, y, finalWidth, finalHeight)
      
      // Save PDF
      pdf.save(`certificate_${certificateData.name.replace(/\s+/g, '_')}_${certificateData.year}.pdf`)

      // Success feedback
      toast.success('Certificate downloaded successfully')
    } catch (error) {
      console.error('Failed to generate PDF:', error)
      toast.error('Failed to generate certificate. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  const generateMultiple = async () => {
    if (!certificateData.name.trim() || !certificateData.year.trim()) {
      toast.error('Please fill in the required fields (Name and Year)')
      return
    }
    // For batch processing, user would need to upload a CSV
    // For now, show a placeholder
    toast.info('Batch certificate generation coming soon. Please generate certificates individually or upload a CSV file with names.')
  }

  return (
    <AdminShell
      title="Certificate creator"
      description="Create and download custom certificates for your community."
    >
      <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Form Section */}
          <div className="lg:col-span-1 space-y-6">
            <div className={`${adminCardClass} p-6`}>
              <h2 className="flex items-center gap-2 font-display text-lg font-extrabold text-[#14201a]">
                <Award className="w-5 h-5 text-[#00A651]" />
                Certificate details
              </h2>
              <div className="mt-5 space-y-4">
                {/* Certificate Type */}
                <div>
                  <Label htmlFor="type">Certificate Type *</Label>
                  <Select value={certificateData.certificateType} onValueChange={(v) => handleInputChange('certificateType', v as CertificateType)}>
                    <SelectTrigger id="type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CERTIFICATE_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    {CERTIFICATE_TYPES.find(t => t.value === certificateData.certificateType)?.description}
                  </p>
                </div>

                {/* Recipient Name */}
                <div>
                  <Label htmlFor="name">Recipient Name *</Label>
                  <Input
                    id="name"
                    value={certificateData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="e.g., Jane Doe"
                    className="text-lg"
                  />
                </div>

                {/* Year / Year range */}
                <div>
                  <Label>Year *</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Input
                        id="year"
                        type="number"
                        value={certificateData.year}
                        onChange={(e) => handleInputChange('year', e.target.value)}
                        placeholder="2024"
                        min="1900"
                        max={new Date().getFullYear().toString()}
                      />
                      <p className="text-[10px] text-muted-foreground mt-1">Year (or start of range)</p>
                    </div>
                    <div>
                      <Input
                        id="yearTo"
                        type="number"
                        value={certificateData.yearTo}
                        onChange={(e) => handleInputChange('yearTo', e.target.value)}
                        placeholder="End year (optional)"
                        min="1900"
                        max={new Date().getFullYear().toString()}
                      />
                      <p className="text-[10px] text-muted-foreground mt-1">End year (for a range)</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Leave End Year blank for a single year; fill it to render as "2017 – 2025".</p>
                </div>

                {/* Certificate Date */}
                <div>
                  <Label htmlFor="certificateDate">Certificate Date *</Label>
                  <Input
                    id="certificateDate"
                    type="date"
                    value={certificateData.certificateDate}
                    onChange={(e) => handleInputChange('certificateDate', e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                  />
                  <p className="text-xs text-muted-foreground mt-1">The date to display on the certificate</p>
                </div>

                {/* Organization */}
                <div>
                  <Label htmlFor="organization">Organization</Label>
                  <Input
                    id="organization"
                    value={certificateData.organization}
                    onChange={(e) => handleInputChange('organization', e.target.value)}
                    placeholder="Global Goals Jam"
                  />
                </div>

                {/* Issued By */}
                <div>
                  <Label htmlFor="issuedBy">Issued By</Label>
                  <Input
                    id="issuedBy"
                    value={certificateData.issuedBy}
                    onChange={(e) => handleInputChange('issuedBy', e.target.value)}
                    placeholder={DEFAULT_ISSUED_BY}
                  />
                </div>

                {/* Custom Text */}
                <div>
                  <Label htmlFor="customText">Custom Text (Optional)</Label>
                  <Textarea
                    id="customText"
                    value={certificateData.customText}
                    onChange={(e) => handleInputChange('customText', e.target.value)}
                    placeholder="Add a custom message or achievement description"
                    className="min-h-24"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Appears as an italic line below the main body.</p>
                </div>

                {/* Custom / Tailored fields — only shown when type === 'custom' */}
                {certificateData.certificateType === 'custom' && (
                  <div className="space-y-4 pt-4 border-t">
                    <div className="flex items-center gap-2">
                      <Pill tone="ink">tailored</Pill>
                      <p className="text-xs text-muted-foreground">These fields override the default title, header and body.</p>
                    </div>

                    <div>
                      <Label htmlFor="customTitle">Certificate Title</Label>
                      <Input
                        id="customTitle"
                        value={certificateData.customTitle}
                        onChange={(e) => handleInputChange('customTitle', e.target.value)}
                        placeholder="e.g., Certificate of Recognition"
                      />
                      <p className="text-xs text-muted-foreground mt-1">Leave blank to use "Certificate of Recognition".</p>
                    </div>

                    <div>
                      <Label htmlFor="periodLabel">Period</Label>
                      <Input
                        id="periodLabel"
                        value={certificateData.periodLabel}
                        onChange={(e) => handleInputChange('periodLabel', e.target.value)}
                        placeholder="e.g., 2017 – 2025"
                      />
                      <p className="text-xs text-muted-foreground mt-1">Shown in the header strip. Leave blank to fall back to the single year above.</p>
                    </div>

                    <div>
                      <Label htmlFor="locationLabel">Location</Label>
                      <Input
                        id="locationLabel"
                        value={certificateData.locationLabel}
                        onChange={(e) => handleInputChange('locationLabel', e.target.value)}
                        placeholder="e.g., India — Delhi NCR"
                      />
                      <p className="text-xs text-muted-foreground mt-1">Country, city or region — appended to the header.</p>
                    </div>

                    <div>
                      <Label htmlFor="customSubject">Subject Label</Label>
                      <Input
                        id="customSubject"
                        value={certificateData.customSubject}
                        onChange={(e) => handleInputChange('customSubject', e.target.value)}
                        placeholder="e.g., Long-time Contributor, Ambassador, Organiser"
                      />
                      <p className="text-xs text-muted-foreground mt-1">Small footer label under the signature line.</p>
                    </div>

                    <div>
                      <Label htmlFor="bodyOverride">Body Paragraph</Label>
                      <Textarea
                        id="bodyOverride"
                        value={certificateData.bodyOverride}
                        onChange={(e) => handleInputChange('bodyOverride', e.target.value)}
                        placeholder="e.g., has been recognised for their dedication and contribution to Global Goals Jam events across India, from 2017 to 2025, shaping the Delhi NCR community."
                        className="min-h-28"
                      />
                      <p className="text-xs text-muted-foreground mt-1">Fully replaces the default body sentence.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className={`${adminCardClass} p-6 space-y-3`}>
              <button
                type="button"
                onClick={generatePDF}
                disabled={generating || !certificateData.name.trim()}
                className={`${primaryButtonClass} w-full`}
              >
                {generating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating…
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Download PDF
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={generateMultiple}
                className={`${quietButtonClass} w-full`}
              >
                Batch download (CSV)
              </button>
            </div>

            {/* Help Section */}
            <div className={`${adminCardClass} p-6`}>
              <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#00713a]">Tips</p>
              <ul className="mt-4 space-y-2 text-sm text-[#4c5a52]">
                {[
                  'Fill in Name, Year, and Date',
                  'Date field is required and editable',
                  'Preview updates in real-time',
                  'PDF downloads with proper layout',
                  'Use custom text for achievements',
                ].map((tip) => (
                  <li key={tip} className="flex items-start gap-2.5">
                    <span className="mt-[7px] h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#00A651]" aria-hidden="true" />
                    <span className="leading-relaxed">{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Preview Section */}
          <div className="lg:col-span-2">
            <div className={`${adminCardClass} overflow-hidden`}>
              <div className="border-b border-[#dfe9e2] px-6 py-4">
                <h2 className="font-display text-lg font-extrabold text-[#14201a]">Preview</h2>
                <p className="mt-0.5 text-sm text-[#4c5a52]">Live preview of your certificate.</p>
              </div>
              <div className="flex items-center justify-center bg-[#F6FAF7] p-6 sm:p-8">
                {certificateData.name && certificateData.year ? (
                  <div ref={certificateRef} className="w-full max-w-4xl">
                    <CertificateTemplate
                      recipientName={certificateData.name}
                      year={certificateData.year}
                      yearTo={certificateData.yearTo}
                      eventDate={certificateData.certificateDate}
                      certificateType={certificateData.certificateType}
                      organization={certificateData.organization}
                      issuedBy={certificateData.issuedBy}
                      customText={certificateData.customText}
                      customTitle={certificateData.customTitle}
                      customSubject={certificateData.customSubject}
                      periodLabel={certificateData.periodLabel}
                      locationLabel={certificateData.locationLabel}
                      bodyOverride={certificateData.bodyOverride}
                    />
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <Award className="w-10 h-10 text-[#7d8a83] mx-auto mb-4" />
                    <h3 className="font-display text-lg font-extrabold text-[#14201a] mb-1">No preview yet</h3>
                    <p className="text-sm text-[#7d8a83]">Fill in the Name, Year, and Date to see your certificate preview.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
      </div>
    </AdminShell>
  )
}