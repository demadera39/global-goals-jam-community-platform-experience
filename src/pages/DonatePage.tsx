import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Heart, Coffee, Globe, Target, Award, ArrowLeft } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { blink } from '../lib/blink'
import toast from 'react-hot-toast'

const DonatePage = () => {
  const [searchParams] = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null)
  const [selectedTier, setSelectedTier] = useState<string | null>(null)
  const [customValue, setCustomValue] = useState<number | null>(null)

  useEffect(() => {
    const amount = searchParams.get('amount')
    const tier = searchParams.get('tier')
    if (amount && tier) {
      setSelectedAmount(parseInt(amount))
      setSelectedTier(tier)
    }
  }, [searchParams])

  const donationTiers = [
    {
      amount: 25,
      priceId: 'price_1S19pERi3jJmKDrbDsevnK85',
      title: 'Supporter',
      description: 'Help fund toolkit development',
      icon: Heart,
      impact: '25 - covers the generation of toolkits for 10 hosts',
      requiresForm: false
    },
    {
      amount: 50,
      priceId: 'price_1S19pERi3jJmKDrb47m0HsUQ',
      title: 'Contributor', 
      description: 'Support global community growth',
      icon: Coffee,
      impact: '50 - Enables the development of webinars and community communication',
      requiresForm: false
    },
    {
      amount: 100,
      priceId: 'price_1S19pERi3jJmKDrbuS5jOdq8',
      title: 'Partner',
      description: 'Champion sustainable innovation',
      icon: Globe,
      impact: '100 - Funds this full platform for 1 month',
      requiresForm: true
    },
    {
      amount: 250,
      priceId: 'price_1S19pERi3jJmKDrbprJ5T2lw',
      title: 'Advocate',
      description: 'Accelerate SDG impact worldwide',
      icon: Target,
      impact: '250 - Sponsors the host certification of at last 5 organizers who cannot afford the certification fee',
      requiresForm: true
    },
    {
      amount: 500,
      priceId: 'price_1S19pERi3jJmKDrbnsV0Nsu1',
      title: 'Champion',
      description: 'Lead the movement for change',
      icon: Award,
      impact: '500 - Funds the community in all abovementioned ways for at least 6 months',
      requiresForm: true
    },
    // Custom amount card: user fills amount (minimum $5)
    {
      amount: null,
      priceId: 'custom',
      title: 'Choose your amount (minimum 5 dollars)',
      description: 'Impact: endless love from the community',
      icon: Heart,
      impact: 'Endless love from the community',
      requiresForm: false
    }
  ]

  const handleDonate = async (tier: typeof donationTiers[0], customAmount?: number) => {
    setLoading(true)
    try {
      let amountCents: number
      let priceId = tier.priceId
      let tierName = tier.title

      if (tier.priceId === 'custom') {
        if (!customAmount || Number(customAmount) < 5) {
          toast.error('Please enter a custom amount of at least $5')
          setLoading(false)
          return
        }
        amountCents = Math.round(Number(customAmount) * 100)
        priceId = null
        tierName = `Custom: $${customAmount}`
      } else {
        amountCents = Math.round((tier.amount || 0) * 100)
      }

      const response = await blink.data.fetch({
        url: 'https://7uamgc2j--create-donation-session.functions.blink.new',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: {
          priceId,
          amount: amountCents,
          tierName,
          requiresForm: tier.requiresForm,
          returnUrl: window.location.origin
        }
      })

      if (response.status === 200) {
        const data = response.body
        if (data.url) {
          window.open(data.url, '_blank')
        } else {
          throw new Error('No checkout URL received')
        }
      } else {
        throw new Error('Failed to create donation session')
      }
    } catch (error) {
      console.error('Donation error:', error)
      toast.error('Failed to process donation. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="py-12 bg-muted/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <Button variant="ghost" asChild className="mb-4">
              <Link to="/">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Link>
            </Button>
          </div>
          
          <div className="text-center space-y-4">
            <Badge variant="secondary" className="text-sm">
              Supporting Global Goals Jam
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight">
              Help us scale impact worldwide
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Your donation directly supports host training, toolkit development, and platform improvements that enable communities worldwide to tackle SDG challenges.
            </p>
          </div>
        </div>
      </section>

      {/* Donation Tiers */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {donationTiers.map((tier, index) => {
              const Icon = tier.icon
              const isCustom = tier.priceId === 'custom'
              return (
                <Card key={tier.title + index} className={`relative transition-all duration-300 hover:shadow-lg ${index === 2 ? 'border-primary shadow-sm' : ''}`}>
                  {index === 2 && (
                    <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground">
                      Most Popular
                    </Badge>
                  )}
                  <CardHeader className="text-center pb-4">
                    <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="text-2xl">{isCustom ? '' : `$${tier.amount}`}</CardTitle>
                    <h3 className="font-semibold text-lg">{tier.title}</h3>
                    <p className="text-sm text-muted-foreground">{tier.description}</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-center">
                      <p className="text-sm font-medium text-primary mb-2">Your Impact:</p>
                      <p className="text-sm text-muted-foreground">{tier.impact}</p>
                    </div>

                    {isCustom ? (
                      <div className="space-y-3">
                        <input
                          type="number"
                          min={5}
                          step={1}
                          value={customValue ?? ''}
                          onChange={(e) => setCustomValue(e.target.value === '' ? null : Number(e.target.value))}
                          className="w-full border rounded-md p-2 text-lg"
                          placeholder="Enter amount in USD (min $5)"
                        />
                        <Button
                          onClick={() => handleDonate(tier, customValue ?? 0)}
                          disabled={loading}
                          className="w-full"
                          variant="default"
                        >
                          {loading ? 'Processing...' : `Donate custom amount`}
                        </Button>
                        <p className="text-xs text-muted-foreground text-center">Minimum $5. You’ll be redirected to secure checkout.</p>
                      </div>
                    ) : (
                      <>
                        <Button 
                          onClick={() => handleDonate(tier)}
                          disabled={loading}
                          className="w-full"
                          variant={index === 2 ? 'default' : 'outline'}
                        >
                          {loading ? 'Processing...' : (
                            selectedAmount === tier.amount ? 
                              `Donate ${tier.amount} (Selected)` : 
                              `Donate ${tier.amount}`
                          )}
                        </Button>
                        {tier.requiresForm && (
                          <p className="text-xs text-center text-muted-foreground mt-2">
                            ✓ Includes sponsor recognition
                          </p>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* Impact Information */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-6">
            <h2 className="text-3xl font-bold">Why Your Support Matters</h2>
            <div className="grid md:grid-cols-3 gap-6 mt-8">
              <div className="space-y-2">
                <div className="text-2xl font-bold text-primary">50+</div>
                <div className="font-medium">Cities Worldwide</div>
                <div className="text-sm text-muted-foreground">Local jams happening globally</div>
              </div>
              <div className="space-y-2">
                <div className="text-2xl font-bold text-primary">500+</div>
                <div className="font-medium">Trained Hosts</div>
                <div className="text-sm text-muted-foreground">Community organizers certified</div>
              </div>
              <div className="space-y-2">
                <div className="text-2xl font-bold text-primary">2000+</div>
                <div className="font-medium">Participants</div>
                <div className="text-sm text-muted-foreground">People creating SDG solutions</div>
              </div>
            </div>
          </div>

          <div className="mt-12">
            <Card>
              <CardHeader>
                <CardTitle>Where Your Donation Goes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Host training & certification</span>
                  <span className="font-semibold">40%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Platform development & hosting</span>
                  <span className="font-semibold">30%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Toolkit creation & maintenance</span>
                  <span className="font-semibold">20%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Community support & operations</span>
                  <span className="font-semibold">10%</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground">
              Global Goals Jam is a non-profit initiative. Your donation helps us remain free and accessible to communities worldwide.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}

export default DonatePage
