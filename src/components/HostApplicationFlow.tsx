import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, ArrowRight, BookOpen, CreditCard, Award } from 'lucide-react';
import { blink } from '@/lib/blink';
import { toast } from 'sonner';

export default function HostApplicationFlow() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    location: '',
    motivation: ''
  });

  const handleSubmitApplication = async () => {
    if (!formData.email || !formData.location || !formData.motivation) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const user = await blink.auth.me();
      
      // Create host application
      await blink.db.hostApplications.create({
        id: `app_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: user.id,
        email: formData.email,
        location: formData.location,
        motivation: formData.motivation,
        status: 'pending_certification'
      });

      toast.success('Application submitted! To support the community and unlock host tools, the certification course is required. Redirecting…');
      
      // Redirect to unified auth → checkout flow
      setTimeout(() => {
        navigate('/course/enroll');
      }, 1600);
    } catch (error) {
      console.error('Error submitting application:', error);
      toast.error('Failed to submit application');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className={`flex items-center gap-2 ${step >= 1 ? 'text-primary' : 'text-muted-foreground'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
              step >= 1 ? 'border-primary bg-primary text-white' : 'border-muted-foreground'
            }`}>
              {step > 1 ? <CheckCircle className="h-5 w-5" /> : '1'}
            </div>
            <span className="font-medium">Apply</span>
          </div>
          
          <div className="flex-1 h-0.5 bg-muted mx-4" />
          
          <div className={`flex items-center gap-2 ${step >= 2 ? 'text-primary' : 'text-muted-foreground'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
              step >= 2 ? 'border-primary bg-primary text-white' : 'border-muted-foreground'
            }`}>
              {step > 2 ? <CheckCircle className="h-5 w-5" /> : '2'}
            </div>
            <span className="font-medium">Certification</span>
          </div>
          
          <div className="flex-1 h-0.5 bg-muted mx-4" />
          
          <div className={`flex items-center gap-2 ${step >= 3 ? 'text-primary' : 'text-muted-foreground'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
              step >= 3 ? 'border-primary bg-primary text-white' : 'border-muted-foreground'
            }`}>
              {step > 3 ? <CheckCircle className="h-5 w-5" /> : '3'}
            </div>
            <span className="font-medium">Host Access</span>
          </div>
        </div>
      </div>

      {/* Step 1: Application Form */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Apply to Become a Host</CardTitle>
            <CardDescription>
              Start your journey to become a certified Global Goals Jam host
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Important:</strong> Becoming a host requires completing our 8-day certification course ($39.99).
                This ensures all hosts are properly trained to facilitate impactful Global Goals Jam events.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="location">Your Location</Label>
                <Input
                  id="location"
                  placeholder="City, Country"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="motivation">Why do you want to become a GGJ host?</Label>
                <Textarea
                  id="motivation"
                  placeholder="Share your motivation and vision for hosting Global Goals Jam events in your community..."
                  className="min-h-[120px]"
                  value={formData.motivation}
                  onChange={(e) => setFormData({ ...formData, motivation: e.target.value })}
                />
              </div>
            </div>

            <div className="pt-4">
              <Button 
                onClick={handleSubmitApplication}
                disabled={loading}
                className="w-full"
                size="lg"
              >
                {loading ? 'Submitting...' : (
                  <>
                    Continue to Certification
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Certification Info (shown after redirect) */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-6 w-6" />
              Certification Required
            </CardTitle>
            <CardDescription>
              Complete the 8-day certification course to become a host
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4">
              <div className="flex items-start gap-3">
                <CreditCard className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <h4 className="font-medium">Investment: $39.99</h4>
                  <p className="text-sm text-muted-foreground">
                    Your contribution supports the GGJ platform and community
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <BookOpen className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <h4 className="font-medium">8 Comprehensive Modules</h4>
                  <p className="text-sm text-muted-foreground">
                    Daily email lessons with interactive learning dashboard
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Award className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <h4 className="font-medium">Official Certification</h4>
                  <p className="text-sm text-muted-foreground">
                    Automatic host access upon course completion
                  </p>
                </div>
              </div>
            </div>

            <Button 
              onClick={() => navigate('/course/enroll')}
              className="w-full"
              size="lg"
            >
              Start Certification Course
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}