import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Mail } from 'lucide-react'
import blink from '@/lib/blink'

export default function CreateAccountPage() {
  const navigate = useNavigate()

  const handleEmailSignup = () => {
    navigate('/sign-in')
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gradient-to-b from-background to-secondary/20 flex items-center justify-center py-12">
      <div className="w-full max-w-md px-4">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Create Your Account</CardTitle>
            <CardDescription className="text-base">
              Join the Global Goals Jam community
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <Button
                onClick={handleEmailSignup}
                className="w-full"
                size="lg"
              >
                <Mail className="h-4 w-4 mr-2" />
                Continue with Email
              </Button>

              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  By creating an account, you agree to our terms and privacy policy
                </p>
                <Button
                  type="button"
                  variant="link"
                  onClick={() => navigate('/sign-in')}
                  className="text-sm font-medium"
                >
                  Already have an account? Sign in
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}