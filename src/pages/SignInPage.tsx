import React from 'react'
import { useSearchParams } from 'react-router-dom'
import { SimpleEmailSignIn } from '../components/SimpleEmailSignIn'

export default function SignInPage() {
  const [searchParams] = useSearchParams()
  const redirectTo = searchParams.get('redirect') || '/course/enroll'

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <SimpleEmailSignIn redirectUrl={redirectTo} />
    </div>
  )
}