import React from 'react'
import { useSearchParams } from 'react-router-dom'
import { SimpleEmailSignIn } from '../components/SimpleEmailSignIn'

export function SignupPage() {
  const [searchParams] = useSearchParams()
  const redirectTo = searchParams.get('redirect') || '/profile?welcome=1'

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <SimpleEmailSignIn redirectUrl={redirectTo} />
    </div>
  )
}