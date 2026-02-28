import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { callAuth, signup, login } from '@/lib/auth'
import blink from '@/lib/blink'

export default function AuthTestPage() {
  const [email, setEmail] = useState('test@globalgoalsjam.org')
  const [password, setPassword] = useState('TestPassword123!')
  const [hashResult, setHashResult] = useState('')
  const [signupResult, setSignupResult] = useState('')
  const [loginResult, setLoginResult] = useState('')
  const { toast } = useToast()

  const testPasswordHash = async () => {
    try {
      const result = await callAuth('test-hash', { password })
      setHashResult(JSON.stringify(result, null, 2))
      toast({
        title: 'Hash generated',
        description: 'Check the result below'
      })
    } catch (error: any) {
      setHashResult(`Error: ${error.message}`)
      toast({
        title: 'Hash failed',
        description: error.message,
        variant: 'destructive'
      })
    }
  }

  const testSignup = async () => {
    try {
      const result = await signup(email, password, 'Test User')
      setSignupResult(JSON.stringify(result, null, 2))
      
      if (result.success && result.token) {
        toast({
          title: 'Signup successful!',
          description: 'User created and logged in'
        })
      }
    } catch (error: any) {
      setSignupResult(`Error: ${error.message}`)
      toast({
        title: 'Signup failed',
        description: error.message,
        variant: 'destructive'
      })
    }
  }

  const testLogin = async () => {
    try {
      const result = await login(email, password)
      setLoginResult(JSON.stringify(result, null, 2))
      
      if (result.success && result.token) {
        toast({
          title: 'Login successful!',
          description: 'You are now logged in'
        })
      }
    } catch (error: any) {
      setLoginResult(`Error: ${error.message}`)
      toast({
        title: 'Login failed',
        description: error.message,
        variant: 'destructive'
      })
    }
  }

  const checkUsers = async () => {
    try {
      const users = await blink.db.users.list({
        where: { email },
        limit: 1
      })
      
      if (users && users.length > 0) {
        const user = users[0]
        toast({
          title: 'User found',
          description: `ID: ${user.id}, Role: ${user.role}, Has password: ${!!user.passwordHash}`
        })
        console.log('User data:', user)
      } else {
        toast({
          title: 'User not found',
          description: `No user with email ${email}`,
          variant: 'destructive'
        })
      }
    } catch (error: any) {
      toast({
        title: 'Database error',
        description: error.message,
        variant: 'destructive'
      })
    }
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Authentication Test Page</h1>
      
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Test Credentials</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Test Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button onClick={testPasswordHash} variant="outline">
                Test Password Hash
              </Button>
              <Button onClick={checkUsers} variant="outline">
                Check User in DB
              </Button>
              <Button onClick={testSignup} variant="default">
                Test Signup
              </Button>
              <Button onClick={testLogin} variant="default">
                Test Login
              </Button>
            </div>
            
            {hashResult && (
              <div>
                <h3 className="font-semibold mb-2">Hash Result:</h3>
                <pre className="bg-muted p-2 rounded text-xs overflow-auto">
                  {hashResult}
                </pre>
              </div>
            )}
            
            {signupResult && (
              <div>
                <h3 className="font-semibold mb-2">Signup Result:</h3>
                <pre className="bg-muted p-2 rounded text-xs overflow-auto">
                  {signupResult}
                </pre>
              </div>
            )}
            
            {loginResult && (
              <div>
                <h3 className="font-semibold mb-2">Login Result:</h3>
                <pre className="bg-muted p-2 rounded text-xs overflow-auto">
                  {loginResult}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}