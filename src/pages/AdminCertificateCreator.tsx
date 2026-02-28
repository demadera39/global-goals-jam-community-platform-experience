import React, { useState, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Textarea } from '../components/ui/textarea'
import { Badge } from '../components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Award, Download, Loader2, ArrowLeft } from 'lucide-react'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { useNavigate } from 'react-router-dom'
import CertificateTemplate from '../components/CertificateTemplate'
import { toast } from 'sonner'

type CertificateType = 'general' | 'host' | 'participant'

interface CertificateData {
  name: string
  year: string
  certificateDate: string // ISO date format
  certificateType: CertificateType
  organization: string
  issuedBy: string
  customText: string
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
  }
]

export default function AdminCertificateCreator() {
  const navigate = useNavigate()
  const certificateRef = useRef<HTMLDivElement>(null)
  const [generating, setGenerating] = useState(false)
  const [certificateData, setCertificateData] = useState<CertificateData>({
    name: '',
    year: new Date().getFullYear().toString(),
    certificateDate: new Date().toISOString().split('T')[0], // Today's date in ISO format
    certificateType: 'general',
    organization: 'Global Goals Jam',
    issuedBy: DEFAULT_ISSUED_BY,
    customText: ''
  })

  const handleInputChange = (field: keyof CertificateData, value: string) => {
    setCertificateData(prev => ({ ...prev, [field]: value }))
  }

  const generatePDF = async () => {
    if (!certificateData.name.trim() || !certificateData.year.trim() || !certificateData.certificateDate.trim()) {
      alert('Please fill in the required fields (Name, Year, and Date)')
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
      alert('Failed to generate certificate. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  const generateMultiple = async () => {
    if (!certificateData.name.trim() || !certificateData.year.trim()) {
      alert('Please fill in the required fields (Name and Year)')
      return
    }
    // For batch processing, user would need to upload a CSV
    // For now, show a placeholder
    alert('Batch certificate generation coming soon. Please generate certificates individually or upload a CSV file with names.')
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6 flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/admin-dashboard')}
              className="hover:bg-muted"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Certificate Creator</h1>
              <p className="text-muted-foreground mt-1">Create and download custom certificates for your community</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Form Section */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  Certificate Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
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

                {/* Year */}
                <div>
                  <Label htmlFor="year">Year *</Label>
                  <Input
                    id="year"
                    type="number"
                    value={certificateData.year}
                    onChange={(e) => handleInputChange('year', e.target.value)}
                    placeholder="2024"
                    min="1900"
                    max={new Date().getFullYear().toString()}
                  />
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
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <Card>
              <CardContent className="p-6 space-y-3">
                <Button
                  onClick={generatePDF}
                  disabled={generating || !certificateData.name.trim()}
                  className="w-full bg-primary-solid text-white hover:bg-primary/90"
                >
                  {generating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Download PDF
                    </>
                  )}
                </Button>
                <Button
                  onClick={generateMultiple}
                  variant="outline"
                  className="w-full"
                >
                  Batch Download (CSV)
                </Button>
              </CardContent>
            </Card>

            {/* Help Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Tips</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2 text-muted-foreground">
                <p>✓ Fill in Name, Year, and Date</p>
                <p>✓ Date field is required and editable</p>
                <p>✓ Preview updates in real-time</p>
                <p>✓ PDF downloads with proper layout</p>
                <p>✓ Use custom text for achievements</p>
              </CardContent>
            </Card>
          </div>

          {/* Preview Section */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Preview</CardTitle>
                <p className="text-sm text-muted-foreground">Live preview of your certificate</p>
              </CardHeader>
              <CardContent className="flex items-center justify-center p-8 bg-muted/50 rounded-lg">
                {certificateData.name && certificateData.year ? (
                  <div ref={certificateRef} className="w-full max-w-4xl">
                    <CertificateTemplate
                      recipientName={certificateData.name}
                      year={certificateData.year}
                      eventDate={certificateData.certificateDate}
                      certificateType={certificateData.certificateType}
                      organization={certificateData.organization}
                      issuedBy={certificateData.issuedBy}
                      customText={certificateData.customText}
                    />
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <Award className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">No Preview Yet</h3>
                    <p className="text-muted-foreground">Fill in the Name, Year, and Date to see your certificate preview</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}