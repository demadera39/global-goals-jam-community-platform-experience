import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { CheckCircle, Heart, Globe, ArrowRight, Users, Upload, X, UserX } from 'lucide-react'
import { db, storage } from '../lib/supabase'
import toast from 'react-hot-toast'

interface PendingDonation {
  paymentId: string
  tierName: string
  amount: number
}

const DonationSuccessPage = () => {
  const navigate = useNavigate()
  const [donation, setDonation] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [formDone, setFormDone] = useState(false)
  const [donorName, setDonorName] = useState('')
  const [donorOrganization, setDonorOrganization] = useState('')
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [logoUrl, setLogoUrl] = useState('')

  useEffect(() => {
    const raw = localStorage.getItem('pendingDonation')
    if (!raw) {
      setLoading(false)
      return
    }

    const pending: PendingDonation = JSON.parse(raw)
    let attempts = 0
    const maxAttempts = 12

    const poll = async () => {
      attempts++
      try {
        const results = await db.donations.list({
          where: { molliePaymentId: pending.paymentId },
        })
        if (results.length > 0) {
          setDonation(results[0])
          setLoading(false)
          localStorage.removeItem('pendingDonation')
          return
        }
      } catch (e) {
        console.error('Failed to fetch donation:', e)
      }

      if (attempts >= maxAttempts) {
        setLoading(false)
        localStorage.removeItem('pendingDonation')
        return
      }

      setTimeout(poll, 2500)
    }

    poll()
  }, [])

  const handleLogoUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Logo must be smaller than 5MB')
      return
    }

    setLogoPreview(URL.createObjectURL(file))

    try {
      const path = `sponsor-logos/${donation?.id || Date.now()}-${file.name}`
      const { publicUrl } = await storage.upload(file, path, { upsert: true })
      setLogoUrl(publicUrl)
      toast.success('Logo uploaded')
    } catch (e) {
      console.error('Logo upload error:', e)
      toast.error('Failed to upload logo')
    }
  }

  const handleSubmitName = async () => {
    if (!donorName.trim()) {
      toast.error('Please enter your name')
      return
    }
    if (!donation) return

    setSubmitting(true)
    try {
      await db.donations.update(donation.id, {
        donorName: donorName.trim(),
        donorOrganization: donorOrganization.trim() || null,
        donorLogoUrl: logoUrl || null,
        formCompletedAt: new Date().toISOString(),
      })
      toast.success('Thank you! Your name will appear on our supporters page.')
      setFormDone(true)
    } catch (e) {
      console.error('Update error:', e)
      toast.error('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleAnonymous = async () => {
    if (!donation) {
      setFormDone(true)
      return
    }

    setSubmitting(true)
    try {
      await db.donations.update(donation.id, {
        donorName: 'Anonymous',
        formCompletedAt: new Date().toISOString(),
      })
      toast.success('Your donation has been recorded anonymously.')
      setFormDone(true)
    } catch (e) {
      console.error('Update error:', e)
      setFormDone(true)
    } finally {
      setSubmitting(false)
    }
  }

  const showForm = donation && !formDone && !donation.formCompletedAt

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-pastel-green/20">
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-10">
          <div className="mx-auto w-20 h-20 bg-pastel-green rounded-full flex items-center justify-center mb-6 shadow-soft">
            <CheckCircle className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-3">
            Thank You for Your Generosity!
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Your donation directly supports communities around the world in tackling
            the UN Sustainable Development Goals through collaborative design sprints.
          </p>
        </div>

        {loading && (
          <Card className="mb-8 shadow-card">
            <CardContent className="py-8 text-center">
              <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-muted-foreground">Processing your donation...</p>
            </CardContent>
          </Card>
        )}

        {showForm && (
          <Card className="mb-8 shadow-card">
            <CardHeader>
              <CardTitle className="text-xl">
                Would you like to be recognized as a supporter?
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Your name and organization will appear on our{' '}
                <button onClick={() => navigate('/supporters')} className="text-primary underline">
                  supporters page
                </button>.
              </p>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="donorName">Your name or organization name *</Label>
                <Input
                  id="donorName"
                  value={donorName}
                  onChange={(e) => setDonorName(e.target.value)}
                  placeholder="e.g. Jane Doe or Acme Inc."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="donorOrg">Organization (optional)</Label>
                <Input
                  id="donorOrg"
                  value={donorOrganization}
                  onChange={(e) => setDonorOrganization(e.target.value)}
                  placeholder="Your company or institution"
                />
              </div>

              <div className="space-y-2">
                <Label>Logo (optional)</Label>
                {logoPreview ? (
                  <div className="relative inline-block">
                    <img
                      src={logoPreview}
                      alt="Logo preview"
                      className="w-28 h-28 object-contain border rounded-lg p-2 bg-white"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute -top-2 -right-2 w-6 h-6 rounded-full p-0"
                      onClick={() => {
                        setLogoPreview(null)
                        setLogoUrl('')
                      }}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed rounded-lg p-5 text-center">
                    <Upload className="w-7 h-7 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mb-2">
                      PNG, JPG or SVG (max 5 MB)
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
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button
                  onClick={handleSubmitName}
                  disabled={submitting || !donorName.trim()}
                  className="flex-1"
                >
                  {submitting ? 'Saving...' : 'Save & Show on Supporters Page'}
                </Button>
                <Button
                  variant="ghost"
                  onClick={handleAnonymous}
                  disabled={submitting}
                  className="gap-2 text-muted-foreground"
                >
                  <UserX className="w-4 h-4" />
                  Stay Anonymous
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {(!loading && !showForm) && (
          <>
            <Card className="mb-8 shadow-card">
              <CardHeader>
                <CardTitle className="text-xl text-center">Your Impact</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="text-center p-4">
                    <div className="mx-auto w-12 h-12 bg-pastel-green rounded-full flex items-center justify-center mb-3">
                      <Globe className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-1">Global Reach</h3>
                    <p className="text-sm text-muted-foreground">
                      Supporting jam events in 100+ cities across 6 continents
                    </p>
                  </div>
                  <div className="text-center p-4">
                    <div className="mx-auto w-12 h-12 bg-pastel-green rounded-full flex items-center justify-center mb-3">
                      <Users className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-1">Community Growth</h3>
                    <p className="text-sm text-muted-foreground">
                      Enabling hosts to organize impactful local events
                    </p>
                  </div>
                  <div className="text-center p-4">
                    <div className="mx-auto w-12 h-12 bg-pastel-green rounded-full flex items-center justify-center mb-3">
                      <Heart className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-1">SDG Action</h3>
                    <p className="text-sm text-muted-foreground">
                      Turning global goals into local solutions through design
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="mb-8 bg-pastel-green/30 border-primary/20 shadow-soft">
              <CardContent className="py-6">
                <p className="text-center text-foreground">
                  A confirmation email with your donation receipt is on its way.
                  <br />
                  <span className="text-sm text-muted-foreground">
                    For questions, reach out to{' '}
                    <a href="mailto:marco@globalgoalsjam.org" className="text-primary hover:underline">
                      marco@globalgoalsjam.org
                    </a>
                  </span>
                </p>
              </CardContent>
            </Card>
          </>
        )}

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button onClick={() => navigate('/supporters')} size="lg" className="gap-2">
            View Our Supporters
            <ArrowRight className="w-4 h-4" />
          </Button>
          <Button onClick={() => navigate('/')} variant="outline" size="lg">
            Return to Home
          </Button>
        </div>
      </main>
    </div>
  )
}

export default DonationSuccessPage
