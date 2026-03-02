import React from 'react'
import { useSearchParams } from 'react-router-dom'
import { SimpleEmailSignIn } from '../components/SimpleEmailSignIn'

export default function SignInPage() {
  const [searchParams] = useSearchParams()
  const redirectTo = searchParams.get('redirect') || '/course/enroll'

  return (
    <div className="min-h-screen flex items-center justify-center bg-section-alt hero-pattern p-4">
      <SimpleEmailSignIn redirectUrl={redirectTo} />
    </div>
  )
}