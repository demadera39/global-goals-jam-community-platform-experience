import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Button } from './ui/button'
import { X, Star, ArrowRight } from 'lucide-react'
import { getUserProfile, UserProfile, COURSE_STATUS } from '../lib/userStatus'
import blink from '../lib/blink'

interface EnrollmentNudgeBannerProps {
  onDismiss?: () => void
}

export default function EnrollmentNudgeBanner({ onDismiss }: EnrollmentNudgeBannerProps) {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)
  const [nudgeCount, setNudgeCount] = useState(0)

  useEffect(() => {
    const checkUserStatus = async () => {
      try {
        const profile = await getUserProfile()
        setUserProfile(profile)
        
        // SIMPLIFIED: Don't show banner for ANY logged-in user
        // Toolkit is now free for all registered users
        if (profile) {
          setIsVisible(false)
          setIsDismissed(true)
          return
        }
      } catch (error) {
        console.error('Error checking user enrollment status:', error)
      }
    }

    const unsubscribe = blink.auth.onAuthStateChanged(() => {
      checkUserStatus()
    })

    checkUserStatus()
    return unsubscribe
  }, [])

  const handleDismiss = () => {
    if (userProfile) {
      const dismissKey = `enrollment-nudge-dismissed-${userProfile.id}`
      const nudgeKey = `enrollment-nudge-count-${userProfile.id}`
      
      localStorage.setItem(dismissKey, Date.now().toString())
      localStorage.setItem(nudgeKey, (nudgeCount + 1).toString())
    }
    
    setIsVisible(false)
    setIsDismissed(true)
    onDismiss?.()
  }

  // SIMPLIFIED: Force hide for any logged-in user
  useEffect(() => {
    if (userProfile) {
      setIsVisible(false)
      setIsDismissed(true)
    }
  }, [userProfile])

  const getNudgeMessage = () => {
    if (nudgeCount === 0) {
      return {
        title: "Welcome! Support the community and unlock tools 🌟",
        message: "You’re signed up! Make a one‑time contribution to enroll in the certification course and unlock lifetime access to premium facilitator & host tools and the global community.",
        cta: "Enroll now"
      }
    } else if (nudgeCount === 1) {
      return {
        title: "Don’t miss out 🚀",
        message: "Join certified facilitators and hosts worldwide. Your one‑time enrollment supports the platform and unlocks all facilitation methods and templates.",
        cta: "Get certified"
      }
    } else {
      return {
        title: "Friendly reminder ⭐",
        message: "Become a certified facilitator (and host if you want) to unlock everything — advanced toolkits, method cards, templates, and the global community.",
        cta: "Finish enrollment"
      }
    }
  }

  if (!isVisible || !userProfile) return null

  const { title, message, cta } = getNudgeMessage()

  return (
    <div className="fixed top-16 left-0 right-0 z-40 bg-gradient-to-r from-primary to-primary/90 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 flex-1">
            <div className="flex-shrink-0">
              <Star className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm">{title}</h3>
              <p className="text-xs opacity-90 hidden sm:block">{message}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 flex-shrink-0">
            <Button
              asChild
              variant="secondary"
              size="sm"
              className="bg-white text-primary hover:bg-gray-100 font-medium"
            >
              <Link to="/course/enroll" className="flex items-center space-x-1">
                <span>{cta}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="text-white hover:bg-white/20 p-1"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}