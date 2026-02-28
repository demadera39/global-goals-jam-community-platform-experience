import React, { useEffect, useState } from 'react'
import { blink } from '../lib/blink'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Link } from 'react-router-dom'
import { Heart, ArrowLeft, ExternalLink } from 'lucide-react'

interface Supporter {
  id: string
  donorName: string
  donorOrganization: string | null
  donorLogoUrl: string | null
  amount: number
  amountDisplay: string
  tierName: string
  paidAt: string
}

export default function SupportersPage() {
  const [supporters, setSupporters] = useState<Supporter[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        const donations = await blink.db.donations.list({
          where: { status: 'completed' },
          orderBy: { amount: 'desc' }
        })
        if (!mounted) return
        setSupporters(donations || [])
      } catch (e) {
        console.error('Failed to load supporters', e)
      } finally {
        setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  const getTierBadgeVariant = (tierName: string) => {
    switch (tierName.toLowerCase()) {
      case 'champion': return 'default'
      case 'advocate': return 'secondary' 
      case 'supporter': return 'outline'
      default: return 'outline'
    }
  }

  const getTierDescription = (tierName: string) => {
    switch (tierName.toLowerCase()) {
      case 'champion': return 'Major supporter helping fund host training and global coordination'
      case 'advocate': return 'Supporting toolkit development and community resources'
      case 'supporter': return 'Contributing to the movement and local jam costs'
      default: return 'Supporting the Global Goals Jam community'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1,2,3,4,5,6].map(i => (
                <div key={i} className="h-64 bg-muted rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const eventsSupported = supporters.reduce((acc, s) => acc + (s.paidAt ? 1 : 0), 0)

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Link>
            </Button>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Heart className="w-6 h-6 text-primary" />
              <h1 className="text-4xl font-bold tracking-tight">Our Supporters</h1>
            </div>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              These organizations and individuals make the Global Goals Jam possible, 
              supporting everything from host training to toolkit development.
            </p>
          </div>
        </div>

        {/* Support CTA */}
        <div className="mb-12 text-center">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold mb-3">Join our supporters</h3>
              <p className="text-muted-foreground mb-4">
                Help us reach more cities, train more hosts, and create bigger impact.
              </p>
              <Button asChild className="bg-primary-solid text-white hover:bg-primary/90">
                <Link to="/contact">Support the Movement</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Supporters Grid */}
        {supporters.length === 0 ? (
          <div className="text-center py-12">
            <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Be the first supporter</h3>
            <p className="text-muted-foreground mb-6">Help us launch this movement with your contribution.</p>
            <Button asChild>
              <Link to="/contact">Get involved</Link>
            </Button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {supporters.map((supporter) => (
              <Card key={supporter.id} className="group hover:shadow-lg transition-all duration-200">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <Badge variant={getTierBadgeVariant(supporter.tierName)} className="mb-3">
                        {supporter.tierName}
                      </Badge>
                      <CardTitle className="text-lg leading-tight">
                        {supporter.donorName}
                      </CardTitle>
                      {supporter.donorOrganization && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {supporter.donorOrganization}
                        </p>
                      )}
                    </div>
                    {(supporter.donorLogoUrl) && (() => {
                      const src = supporter.donorLogoUrl.startsWith('http') ? supporter.donorLogoUrl : `/assets/${supporter.donorLogoUrl}`
                      return (
                        <div className="w-16 h-16 flex-shrink-0 bg-background rounded-lg border p-2 flex items-center justify-center">
                          <img
                            src={src}
                            alt={`${supporter.donorName} logo`}
                            className="max-w-full max-h-full object-contain"
                            loading="lazy"
                            onError={(e) => { const img = e.target as HTMLImageElement; img.style.display = 'none' }}
                          />
                        </div>
                      )
                    })()}
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {getTierDescription(supporter.tierName)}
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {new Date(supporter.paidAt).toLocaleDateString()}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {supporter.tierName}
                    </span>
                  </div>

                  {supporter.donorOrganization && (
                    <div className="pt-2 border-t">
                      <Button variant="ghost" size="sm" className="w-full justify-center text-xs">
                        Learn more <ExternalLink className="w-3 h-3 ml-1" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Impact Summary */}
        {supporters.length > 0 && (
          <div className="mt-16">
            <Card className="bg-gradient-to-r from-primary/5 to-accent/5">
              <CardContent className="p-8 text-center">
                <h3 className="text-2xl font-bold mb-4">Community Impact</h3>
                <div className="grid sm:grid-cols-3 gap-6">
                  <div>
                    <div className="text-3xl font-bold text-primary">
                      {supporters.length}
                    </div>
                    <p className="text-sm text-muted-foreground">Supporters</p>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-primary">
                      {eventsSupported}
                    </div>
                    <p className="text-sm text-muted-foreground">Events Supported</p>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-primary">
                      {new Set(supporters.map(s => s.tierName)).size}
                    </div>
                    <p className="text-sm text-muted-foreground">Support Tiers</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
