import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { config } from '../lib/config'
import { Alert, AlertDescription } from '../components/ui/alert'
import { blink } from '../lib/blink'

export default function TestAuthPage() {
  const [results, setResults] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const addResult = (message: string) => {
    setResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const testEmailDelivery = async () => {
    setLoading(true)
    addResult('Testing email delivery to demadera@marcovanhout.com...')
    
    try {
      // Test direct email send
      const emailResult = await blink.notifications.email({
        to: 'demadera@marcovanhout.com',
        from: 'Marco <marco@globalgoalsjam.org>',
        subject: 'Test Email from Global Goals Jam',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #00A651; padding: 24px; text-align: center;">
              <h1 style="color: white; margin: 0;">Test Email</h1>
            </div>
            <div style="padding: 24px;">
              <p>This is a test email to verify email delivery is working.</p>
              <p>Timestamp: ${new Date().toISOString()}</p>
            </div>
          </div>
        `,
        text: `Test Email\n\nThis is a test email to verify delivery.\n\nTimestamp: ${new Date().toISOString()}`
      })
      
      if (emailResult.success) {
        addResult(`✅ Test email sent successfully! Message ID: ${emailResult.messageId}`)
      } else {
        addResult(`❌ Email send failed: ${JSON.stringify(emailResult)}`)
      }
    } catch (error: any) {
      addResult(`❌ Error sending test email: ${error?.message || 'Unknown error'}`)
    }
    
    setLoading(false)
  }

  const testPasswordReset = async () => {
    setLoading(true)
    addResult('Testing password reset for demadera@marcovanhout.com...')
    
    try {
      const response = await fetch(config.api.baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'forgot-password', 
          email: 'demadera@marcovanhout.com' 
        })
      })
      
      const result = await response.json()
      
      if (response.ok && result.success) {
        addResult(`✅ Password reset endpoint returned success`)
      } else {
        addResult(`❌ Password reset failed: ${JSON.stringify(result)}`)
      }
    } catch (error: any) {
      addResult(`❌ Error calling password reset: ${error?.message || 'Unknown error'}`)
    }
    
    setLoading(false)
  }

  const checkUserStatus = async () => {
    setLoading(true)
    addResult('Checking user status for demadera@marcovanhout.com...')
    
    try {
      const users = await blink.db.users.list({
        where: { email: 'demadera@marcovanhout.com' },
        limit: 1
      })
      
      if (users.length > 0) {
        const user = users[0]
        addResult(`✅ User found:`)
        addResult(`  - ID: ${user.id}`)
        addResult(`  - Display Name: ${user.displayName}`)
        addResult(`  - Role: ${user.role}`)
        addResult(`  - Has Password: ${user.passwordHash ? 'Yes' : 'No'}`)
        addResult(`  - Status: ${user.status}`)
      } else {
        addResult('❌ No user found with this email')
      }
    } catch (error: any) {
      addResult(`❌ Error checking user: ${error?.message || 'Unknown error'}`)
    }
    
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Auth System Test Page</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertDescription>
                This page tests the authentication system for the email: demadera@marcovanhout.com
              </AlertDescription>
            </Alert>
            
            <div className="flex gap-4">
              <Button 
                onClick={checkUserStatus} 
                disabled={loading}
                variant="outline"
              >
                Check User Status
              </Button>
              
              <Button 
                onClick={testEmailDelivery} 
                disabled={loading}
                variant="outline"
              >
                Test Direct Email
              </Button>
              
              <Button 
                onClick={testPasswordReset} 
                disabled={loading}
              >
                Test Password Reset
              </Button>
            </div>
            
            {results.length > 0 && (
              <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm">
                {results.map((result, i) => (
                  <div key={i}>{result}</div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}