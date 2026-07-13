import { useEffect } from 'react'
import { goToLearn } from '@/lib/learnUrl'

/**
 * The GGJ Host Programme lives entirely on the learning platform
 * (learn.globalgoalsjam.org). The legacy in-app course at /course/dashboard
 * is retired: this component takes its route and forwards every visitor —
 * bookmarks, old emails, "My Course" menu links — to the learn platform with
 * single sign-on (goToLearn() falls back to the plain learn login when there's
 * no session). Learn's own middleware handles the paid-entitlement gate.
 */
export default function CourseRedirect() {
  useEffect(() => {
    goToLearn()
  }, [])

  return (
    <div className="min-h-[60vh] flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto" />
        <p className="mt-4 text-muted-foreground">Taking you to your course…</p>
      </div>
    </div>
  )
}
