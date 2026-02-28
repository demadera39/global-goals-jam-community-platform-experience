import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Upload, X } from 'lucide-react'
import { blink } from '../lib/blink'
import toast from 'react-hot-toast'

interface DonationFormProps {
  sessionId: string
  amount: number
  tierName: string
  onComplete?: () => void
}

const DonationForm = ({ sessionId, amount, tierName, onComplete }: DonationFormProps) => {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    donorName: '',
    donorOrganization: '',
    donorLogoUrl: ''
  })
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)

  const handleLogoUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast.error('Logo file must be smaller than 5MB')
      return
    }

    setLogoFile(file)
    const preview = URL.createObjectURL(file)
    setLogoPreview(preview)

    // Upload to storage
    try {
      const { publicUrl } = await blink.storage.upload(
        file,
        `sponsor-logos/${sessionId}-${file.name}`,
        { upsert: true }
      )
      setFormData(prev => ({ ...prev, donorLogoUrl: publicUrl }))
      toast.success('Logo uploaded successfully')
    } catch (error) {
      console.error('Logo upload error:', error)
      toast.error('Failed to upload logo')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.donorName.trim()) {
      toast.error('Please enter your name')
      return
    }

    setLoading(true)
    try {
      // Update donation record with form data
      const donations = await blink.db.donations.list({
        where: { stripeSessionId: sessionId }
      })

      if (donations.length === 0) {
        toast.error('Donation record not found')
        return
      }

      const donation = donations[0]
      await blink.db.donations.update(donation.id, {
        donorName: formData.donorName,
        donorOrganization: formData.donorOrganization || null,
        donorLogoUrl: formData.donorLogoUrl || null,
        formCompletedAt: new Date().toISOString()
      })

      toast.success('Thank you! Your sponsorship information has been saved.')
      onComplete?.()
    } catch (error) {
      console.error('Form submission error:', error)
      toast.error('Failed to save information. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const removeLogo = () => {
    setLogoFile(null)
    setLogoPreview(null)
    setFormData(prev => ({ ...prev, donorLogoUrl: '' }))
  }

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Thank you for your ${amount / 100} {tierName} donation!
          </h1>
          <p className="text-muted-foreground">
            Please provide your information to be recognized as a supporter on our website.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sponsor Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="donorName">Name *</Label>
                <Input
                  id="donorName"
                  value={formData.donorName}
                  onChange={(e) => setFormData(prev => ({ ...prev, donorName: e.target.value }))}
                  placeholder="Your full name or preferred name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="donorOrganization">Organization (Optional)</Label>
                <Input
                  id="donorOrganization"
                  value={formData.donorOrganization}
                  onChange={(e) => setFormData(prev => ({ ...prev, donorOrganization: e.target.value }))}
                  placeholder="Your company, institution, or organization"
                />
              </div>

              <div className="space-y-2">
                <Label>Logo (Optional)</Label>
                {logoPreview ? (
                  <div className="relative inline-block">
                    <img 
                      src={logoPreview} 
                      alt="Logo preview" 
                      className="w-32 h-32 object-contain border rounded-lg p-2 bg-white"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute -top-2 -right-2 w-6 h-6 rounded-full p-0"
                      onClick={removeLogo}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed rounded-lg p-6 text-center">
                    <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mb-2">
                      Upload your logo (PNG, JPG, or SVG)
                    </p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleLogoUpload(file)
                      }}
                      className="hidden"
                      id="logo-upload"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById('logo-upload')?.click()}
                    >
                      Choose File
                    </Button>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Max file size: 5MB. Your logo will be displayed on our website.
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? 'Saving...' : 'Complete Sponsorship'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => window.close()}
                >
                  Skip for now
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default DonationForm