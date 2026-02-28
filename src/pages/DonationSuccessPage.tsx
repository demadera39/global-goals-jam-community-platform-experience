import React, { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { CheckCircle, ArrowLeft } from 'lucide-react'
import DonationForm from '../components/DonationForm'
import { blink } from '../lib/blink'

const DonationSuccessPage = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const sessionId = searchParams.get('session_id')
  const [donation, setDonation] = useState<any>(null)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!sessionId) {
      navigate('/donate')
      return
    }

    const checkDonation = async () => {
      try {
        const donations = await blink.db.donations.list({
          where: { stripeSessionId: sessionId }
        })

        if (donations.length === 0) {
          // Create placeholder donation record if it doesn't exist
          const newDonation = await blink.db.donations.create({
            id: `donation_${Date.now()}`,
            stripeSessionId: sessionId,
            amount: 10000, // Default $100
            amountDisplay: '$100',
            tierName: 'Partner',
            status: 'completed',
            paidAt: new Date().toISOString()
          })
          setDonation(newDonation)
        } else {
          setDonation(donations[0])
        }

        // Show form for Partner level ($100) and above
        const donationAmount = donations[0]?.amount || 10000
        setShowForm(donationAmount >= 10000)
      } catch (error) {
        console.error('Error checking donation:', error)
      } finally {
        setLoading(false)
      }
    }

    checkDonation()
  }, [sessionId, navigate])

  const handleFormComplete = () => {
    setShowForm(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background py-12">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <p>Processing your donation...</p>
        </div>
      </div>
    )
  }

  if (!donation) {
    return (
      <div className="min-h-screen bg-background py-12">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <p>Donation not found.</p>
          <Button onClick={() => navigate('/donate')} className="mt-4">
            Return to Donate
          </Button>
        </div>
      </div>
    )
  }

  if (showForm && !donation.formCompletedAt) {
    return (
      <DonationForm
        sessionId={sessionId!}
        amount={donation.amount}
        tierName={donation.tierName}
        onComplete={handleFormComplete}
      />
    )
  }

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card className="text-center">
          <CardHeader>
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl">
              Thank you for your donation!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-lg font-semibold">
                {donation.amountDisplay} {donation.tierName} Donation
              </p>
              <p className="text-sm text-muted-foreground">
                Your support helps us scale impact worldwide
              </p>
            </div>

            {donation.formCompletedAt && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-800 font-medium">
                  ✓ Your sponsorship information has been saved
                </p>
                <p className="text-green-700 text-sm mt-1">
                  You'll be recognized on our website within 24 hours
                </p>
              </div>
            )}

            <div className="space-y-3">
              <Button onClick={() => navigate('/')} className="w-full">
                Return to Home
              </Button>
              <Button 
                onClick={() => navigate('/donate')} 
                variant="outline" 
                className="w-full"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Donate
              </Button>
            </div>

            <div className="text-sm text-muted-foreground border-t pt-4">
              <p>
                You will receive a confirmation email with your donation receipt.
                For questions, contact us at support@globalgoalsjam.org
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default DonationSuccessPage