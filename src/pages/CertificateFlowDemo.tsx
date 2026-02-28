import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Award, Download, ArrowRight, BookOpen, Clock, Trophy, FileText } from 'lucide-react';
import { CertificateTemplate } from '@/components/CertificateTemplate';

export default function CertificateFlowDemo() {
  const [currentStep, setCurrentStep] = useState(0);
  const [showCertificate, setShowCertificate] = useState(false);

  const steps = [
    {
      title: "Course Progress Tracking",
      description: "As you complete modules, your progress is tracked in the database",
      icon: BookOpen,
      details: [
        "Each module completion is recorded with timestamp",
        "Quiz answers and exercise completions are saved",
        "Progress syncs across all your devices"
      ]
    },
    {
      title: "Final Module Completion",
      description: "When you complete Module 8, the system checks if all modules are done",
      icon: CheckCircle,
      details: [
        "System verifies all 8 modules are completed",
        "Checks that all exercises and quizzes are submitted",
        "Validates enrollment status is 'active'"
      ]
    },
    {
      title: "Automatic Redirect",
      description: "After completing all modules, you're automatically redirected to the certificate page",
      icon: Trophy,
      details: [
        "2-second success notification shows",
        "Automatic navigation to /course/certificate",
        "Certificate data is prepared from your enrollment"
      ]
    },
    {
      title: "Certificate Generation",
      description: "Your personalized certificate is generated with your details",
      icon: Award,
      details: [
        "Certificate includes your name from profile",
        "Shows completion date and course details",
        "Generates unique certificate ID"
      ]
    },
    {
      title: "Achievement Recording",
      description: "Your certification is permanently recorded in multiple places",
      icon: FileText,
      details: [
        "Certificate record saved in certificates table",
        "Achievement badge added to your profile (100 points)",
        "Enrollment updated with certificate_issued_at timestamp"
      ]
    },
    {
      title: "Download & Access",
      description: "You can download your certificate and access your host dashboard",
      icon: Download,
      details: [
        "Download as HTML (opens in new tab for printing)",
        "Certificate always accessible from your profile",
        "Unlocks host dashboard and exclusive resources"
      ]
    }
  ];

  const CurrentStepComponent = steps[currentStep].icon;

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Certificate Generation Flow</h1>
            <p className="text-xl text-muted-foreground">
              How the GGJ Host Certification is awarded after course completion
            </p>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <Progress value={(currentStep + 1) / steps.length * 100} className="h-2" />
            <div className="flex justify-between mt-2">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`text-xs ${index <= currentStep ? 'text-primary font-semibold' : 'text-muted-foreground'}`}
                >
                  Step {index + 1}
                </div>
              ))}
            </div>
          </div>

          {/* Main Content Area */}
          <div className="grid lg:grid-cols-2 gap-8 mb-8">
            {/* Step Details */}
            <Card className="h-fit">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-3 rounded-full bg-primary/10">
                    <CurrentStepComponent className="h-6 w-6 text-primary" />
                  </div>
                  <Badge>Step {currentStep + 1} of {steps.length}</Badge>
                </div>
                <CardTitle>{steps[currentStep].title}</CardTitle>
                <CardDescription>{steps[currentStep].description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {steps[currentStep].details.map((detail, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                      <span className="text-sm">{detail}</span>
                    </div>
                  ))}
                </div>

                {/* Navigation Buttons */}
                <div className="flex gap-3 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                    disabled={currentStep === 0}
                  >
                    Previous
                  </Button>
                  {currentStep < steps.length - 1 ? (
                    <Button
                      onClick={() => setCurrentStep(currentStep + 1)}
                      className="flex-1"
                    >
                      Next Step
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      onClick={() => setShowCertificate(true)}
                      className="flex-1"
                      variant="default"
                    >
                      View Certificate
                      <Award className="ml-2 h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Visual Representation */}
            <Card>
              <CardHeader>
                <CardTitle>Visual Flow</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {steps.map((step, index) => {
                    const StepIcon = step.icon;
                    return (
                      <div
                        key={index}
                        className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                          index === currentStep
                            ? 'bg-primary/10 border-2 border-primary'
                            : index < currentStep
                            ? 'bg-green-50 border border-green-200'
                            : 'bg-gray-50 border border-gray-200'
                        }`}
                      >
                        <div className={`p-2 rounded-full ${
                          index <= currentStep ? 'bg-primary text-white' : 'bg-gray-300 text-gray-600'
                        }`}>
                          <StepIcon className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <p className={`font-medium text-sm ${
                            index <= currentStep ? 'text-foreground' : 'text-muted-foreground'
                          }`}>
                            {step.title}
                          </p>
                        </div>
                        {index < currentStep && (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Certificate Preview */}
          {showCertificate && (
            <Card>
              <CardHeader>
                <CardTitle>Sample Certificate</CardTitle>
                <CardDescription>
                  This is how your certificate will look after completing all 8 modules
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 rounded-lg p-8 overflow-auto">
                  <div className="transform scale-50 origin-top">
                    <CertificateTemplate
                      participantName="Jane Smith"
                      eventTitle="Host Certification Course"
                      eventLocation="Online"
                      eventDate={new Date().toISOString()}
                      editionYear={new Date().getFullYear().toString()}
                      certificateKind="host"
                    />
                  </div>
                </div>
                <div className="mt-6 text-center">
                  <Button size="lg" onClick={() => setShowCertificate(false)}>
                    Back to Flow
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Technical Details */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Technical Implementation</CardTitle>
              <CardDescription>How the certificate system works behind the scenes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Completion Detection
                  </h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    The system checks completion status after each module submission:
                  </p>
                  <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
{`// In CourseDashboard.tsx
if (completedModules.length === 8) {
  toast.success('Course completed!');
  setTimeout(() => {
    navigate('/course/certificate');
  }, 2000);
}`}
                  </pre>
                </div>

                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Database Records
                  </h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Three database tables are updated when certificate is issued:
                  </p>
                  <ul className="text-sm space-y-1">
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span><strong>course_enrollments:</strong> certificate_issued_at timestamp</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span><strong>certificates:</strong> Full certificate record with details</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span><strong>user_achievements:</strong> 100 points for certification</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Award className="h-4 w-4" />
                    Certificate Generation
                  </h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    The certificate is generated as HTML with print styles:
                  </p>
                  <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
{`// Opens in new tab for printing
generateCertificate({
  participantName: user.displayName,
  eventTitle: 'Host Certification',
  certificateKind: 'host'
})`}
                  </pre>
                </div>

                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Trophy className="h-4 w-4" />
                    Access Control
                  </h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Certificate page validates completion before showing:
                  </p>
                  <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
{`// Validation in CourseCertificate.tsx
if (completed.length < 8) {
  toast.error('Complete all modules');
  navigate('/course/dashboard');
  return;
}`}
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}