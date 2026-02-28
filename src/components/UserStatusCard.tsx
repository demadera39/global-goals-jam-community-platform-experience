import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Progress } from './ui/progress'
import { 
  User, 
  GraduationCap, 
  Shield, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  ArrowRight,
  CreditCard,
  BookOpen
} from 'lucide-react'
import { UserProfile, getUserStatusSummary, canAccessFeature } from '../lib/userStatus'
import { useNavigate } from 'react-router-dom'
import blink from '@/lib/blink'

interface UserStatusCardProps {
  profile: UserProfile | null
  showActions?: boolean
}

export default function UserStatusCard({ profile, showActions = true }: UserStatusCardProps) {
  const navigate = useNavigate()
  const statusSummary = getUserStatusSummary(profile)
  
  if (!profile) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Account Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-muted-foreground mb-4">Please sign in to view your status</p>
            <Button onClick={() => { window.location.href = `/sign-in?redirect=${encodeURIComponent(window.location.href)}` }}>
              Sign In
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }
  
  // Calculate course progress if enrolled
  const courseProgress = profile.courseStatus === 'active' ? 60 : // Example progress
                        profile.courseStatus === 'completed' ? 100 : 0
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {profile.role === 'admin' && <Shield className="w-5 h-5 text-primary" />}
            {profile.role === 'host' && <GraduationCap className="w-5 h-5 text-primary" />}
            {profile.role === 'participant' && <User className="w-5 h-5 text-primary" />}
            Account Status
          </CardTitle>
          <Badge variant={statusSummary.variant}>
            {statusSummary.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* User Info */}
        <div>
          <p className="font-medium">{profile.displayName || profile.email}</p>
          <p className="text-sm text-muted-foreground">{profile.email}</p>
        </div>
        
        {/* Status Message */}
        <div className="p-3 bg-muted/50 rounded-lg">
          <p className="text-sm">{statusSummary.message}</p>
        </div>
        
        {/* Course Progress */}
        {profile.courseStatus === 'active' && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Course Progress</span>
              <span className="text-sm text-muted-foreground">{courseProgress}%</span>
            </div>
            <Progress value={courseProgress} className="h-2" />
          </div>
        )}
        
        {/* Feature Access Summary */}
        <div className="space-y-2">
          <p className="text-sm font-medium">What you can access:</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className={`flex items-center gap-1 ${canAccessFeature(profile, 'forum') ? 'text-green-600' : 'text-muted-foreground'}`}>
              {canAccessFeature(profile, 'forum') ? 
                <CheckCircle className="w-3 h-3" /> : 
                <Clock className="w-3 h-3" />
              }
              <span>Community Forum</span>
            </div>
            
            <div className={`flex items-center gap-1 ${canAccessFeature(profile, 'host_dashboard') ? 'text-green-600' : 'text-muted-foreground'}`}>
              {canAccessFeature(profile, 'host_dashboard') ? 
                <CheckCircle className="w-3 h-3" /> : 
                <Clock className="w-3 h-3" />
              }
              <span>Host Tools</span>
            </div>
            
            <div className={`flex items-center gap-1 ${canAccessFeature(profile, 'course_content') ? 'text-green-600' : 'text-muted-foreground'}`}>
              {canAccessFeature(profile, 'course_content') ? 
                <CheckCircle className="w-3 h-3" /> : 
                <Clock className="w-3 h-3" />
              }
              <span>Course Content</span>
            </div>
            
            <div className={`flex items-center gap-1 ${canAccessFeature(profile, 'admin_dashboard') ? 'text-green-600' : 'text-muted-foreground'}`}>
              {canAccessFeature(profile, 'admin_dashboard') ? 
                <CheckCircle className="w-3 h-3" /> : 
                <Clock className="w-3 h-3" />
              }
              <span>Admin Panel</span>
            </div>
          </div>
        </div>
        
        {/* Action Buttons */}
        {showActions && statusSummary.nextSteps.length > 0 && (
          <div className="space-y-2 pt-2 border-t">
            <p className="text-sm font-medium">Next steps:</p>
            <div className="space-y-2">
              {statusSummary.nextSteps.map((step, index) => {
                if (step.includes('certification') || step.includes('course')) {
                  return (
                    <Button 
                      key={index}
                      size="sm" 
                      className="w-full justify-start"
                      onClick={() => navigate('/course/enroll')}
                    >
                      <GraduationCap className="w-4 h-4 mr-2" />
                      {step}
                      <ArrowRight className="w-4 h-4 ml-auto" />
                    </Button>
                  )
                }
                
                if (step.includes('payment')) {
                  return (
                    <Button 
                      key={index}
                      size="sm" 
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => navigate('/course/enroll')}
                    >
                      <CreditCard className="w-4 h-4 mr-2" />
                      {step}
                      <ArrowRight className="w-4 h-4 ml-auto" />
                    </Button>
                  )
                }
                
                if (step.includes('modules')) {
                  return (
                    <Button 
                      key={index}
                      size="sm" 
                      className="w-full justify-start"
                      onClick={() => navigate('/course/dashboard')}
                    >
                      <BookOpen className="w-4 h-4 mr-2" />
                      {step}
                      <ArrowRight className="w-4 h-4 ml-auto" />
                    </Button>
                  )
                }
                
                if (step.includes('host')) {
                  return (
                    <Button 
                      key={index}
                      size="sm" 
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => navigate('/host/apply')}
                    >
                      <Shield className="w-4 h-4 mr-2" />
                      {step}
                      <ArrowRight className="w-4 h-4 ml-auto" />
                    </Button>
                  )
                }
                
                return (
                  <div key={index} className="text-sm text-muted-foreground flex items-center gap-2">
                    <AlertCircle className="w-3 h-3" />
                    {step}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
