// Script to setup a test user directly in the database
// This creates a user with email: test@globalgoalsjam.org and password: TestPassword123!

import { createClient } from '@blinkdotnew/sdk'

const blink = createClient({
  projectId: 'global-goals-jam-community-platform-7uamgc2j',
  authRequired: false
})

// Simple hash function that matches the edge function
async function hashPassword(password: string, secret: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password + secret)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

async function main() {
  const JWT_SECRET = 'ggj-jwt-secret-2025' // This should match the actual JWT_SECRET
  const testEmail = 'test@globalgoalsjam.org'
  const testPassword = 'TestPassword123!'
  
  try {
    // Check if user already exists
    const existingUsers = await blink.db.users.list({
      where: { email: testEmail },
      limit: 1
    })
    
    if (existingUsers && existingUsers.length > 0) {
      console.log('Test user already exists, updating password...')
      const user = existingUsers[0]
      const passwordHash = await hashPassword(testPassword, JWT_SECRET)
      
      await blink.db.users.update(user.id, {
        passwordHash: passwordHash,
        updatedAt: new Date().toISOString()
      })
      
      console.log('Updated password for test user')
    } else {
      console.log('Creating new test user...')
      const passwordHash = await hashPassword(testPassword, JWT_SECRET)
      const userId = `user_test_${Date.now()}`
      
      await blink.db.users.create({
        id: userId,
        email: testEmail,
        displayName: 'Test User',
        role: 'participant',
        status: 'approved',
        passwordHash: passwordHash,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      
      console.log('Created test user')
    }
    
    console.log('')
    console.log('Test User Credentials:')
    console.log('Email: test@globalgoalsjam.org')
    console.log('Password: TestPassword123!')
    console.log('')
    console.log('You can now login with these credentials.')
    
  } catch (error) {
    console.error('Error setting up test user:', error)
  }
}

main()