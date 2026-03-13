import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { CheckCircle, Heart, Globe, ArrowRight, Users } from 'lucide-react'

const DonationSuccessPage = () => {
  const navigate = useNavigate()

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
            Your donation directly supports communities around the world in tackling the UN Sustainable Development Goals through collaborative design sprints.
          </p>
        </div>

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
                For questions, reach out to <a href="mailto:marco@globalgoalsjam.org" className="text-primary hover:underline">marco@globalgoalsjam.org</a>
              </span>
            </p>
          </CardContent>
        </Card>

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
