import React, { useState } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Textarea } from './ui/textarea'
import { Input } from './ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog'
import { Badge } from './ui/badge'
import { Mail, Send, Eye, Users, User, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface SimpleUser {
  id: string
  email: string
  displayName?: string
  role: string
  status: string
}

interface SimpleMessageSenderProps {
  users: SimpleUser[]
  onRefresh?: () => void
}

export function SimpleMessageSender({ users, onRefresh }: SimpleMessageSenderProps) {
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [messageType, setMessageType] = useState<'individual' | 'role' | 'all'>('individual')
  const [selectedRole, setSelectedRole] = useState<string>('')
  const [templateType, setTemplateType] = useState<string>('welcome')
  const [customSubject, setCustomSubject] = useState('')
  const [customMessage, setCustomMessage] = useState('')
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null)

  const roles = Array.from(new Set(users.map(u => u.role)))

  const getTargetUsers = () => {
    switch (messageType) {
      case 'individual':
        return users.filter(u => selectedUsers.includes(u.id))
      case 'role':
        return users.filter(u => u.role === selectedRole)
      case 'all':
        return users
      default:
        return []
    }
  }

  const targetUsers = getTargetUsers()

  const handleSendMessage = async () => {
    if (targetUsers.length === 0) {
      toast.error('No recipients selected')
      return
    }

    setIsSending(true)
    try {
      const response = await fetch('https://7uamgc2j--send-message.functions.blink.new', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipients: targetUsers.map(u => ({
            id: u.id,
            email: u.email,
            name: u.displayName || u.email.split('@')[0],
            role: u.role
          })),
          template: getEmailTemplate(),
          messageType: messageType
        })
      })

      const result = await response.json()
      if (result.success) {
        toast.success(`Message sent to ${result.sent} recipients${result.failed > 0 ? `, ${result.failed} failed` : ''}`)
        // Reset form
        setSelectedUsers([])
        setCustomSubject('')
        setCustomMessage('')
        setTemplateType('welcome')
      } else {
        throw new Error(result.error || 'Failed to send message')
      }
    } catch (error) {
      console.error('Error sending message:', error)
      toast.error('Failed to send message')
    } finally {
      setIsSending(false)
    }
  }

  const handleDeleteUser = async (userId: string, userEmail: string, userName?: string) => {
    setDeletingUserId(userId)
    try {
      const response = await fetch('https://7uamgc2j--delete-user.functions.blink.new', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId, 
          userEmail, 
          userName: userName || userEmail.split('@')[0] 
        })
      })

      const result = await response.json()
      if (result.success) {
        toast.success('User deleted successfully. Notification sent to user.')
        onRefresh?.()
      } else {
        throw new Error(result.error || 'Failed to delete user')
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      toast.error('Failed to delete user')
    } finally {
      setDeletingUserId(null)
    }
  }

  const getEmailTemplate = () => {
    const templates = {
      welcome: {
        subject: 'Welcome to Global Goals Jam Community!',
        content: getWelcomeEmailContent()
      },
      payment_reminder: {
        subject: 'Complete Your Global Goals Jam Registration',
        content: getPaymentReminderContent()
      },
      custom: {
        subject: customSubject || 'Message from Global Goals Jam',
        content: getCustomEmailContent()
      }
    }
    return templates[templateType as keyof typeof templates] || templates.custom
  }

  const getWelcomeEmailContent = () => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <img src="https://global-goals-jam-community-platform-7uamgc2j.sites.blink.new/ggj-logo.svg" alt="Global Goals Jam" style="max-width: 200px; height: auto;" />
        <h1 style="color: #00A651; margin: 20px 0;">Welcome to Global Goals Jam!</h1>
      </div>
      
      <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <p style="margin: 0 0 15px; font-size: 16px; line-height: 1.6;">Dear {{name}},</p>
        <p style="margin: 0 0 15px; font-size: 16px; line-height: 1.6;">Welcome to the Global Goals Jam community! We're excited to have you join our global network of changemakers.</p>
        <p style="margin: 0 0 15px; font-size: 16px; line-height: 1.6;">As a {{role}}, you now have access to our platform where you can connect with fellow participants and make a real impact.</p>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="https://globalgoalsjam.org/dashboard" style="background: #00A651; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Access Your Dashboard</a>
      </div>
      
      <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px; text-align: center; color: #666; font-size: 14px;">
        <p>Best regards,<br/>The Global Goals Jam Team</p>
        <p style="margin-top: 15px;"><a href="https://globalgoalsjam.org" style="color: #00A651;">globalgoalsjam.org</a></p>
      </div>
    </div>
  `

  const getPaymentReminderContent = () => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <img src="https://global-goals-jam-community-platform-7uamgc2j.sites.blink.new/ggj-logo.svg" alt="Global Goals Jam" style="max-width: 200px; height: auto;" />
        <h1 style="color: #00A651; margin: 20px 0;">Complete Your Registration</h1>
      </div>
      
      <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <p style="margin: 0 0 15px; font-size: 16px; line-height: 1.6;">Dear {{name}},</p>
        <p style="margin: 0 0 15px; font-size: 16px; line-height: 1.6;">We noticed your Global Goals Jam registration is still pending payment. Don't miss out on joining our incredible community!</p>
        <p style="margin: 0 0 15px; font-size: 16px; line-height: 1.6;">Complete your registration today to access exclusive resources and start making an impact.</p>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="https://global-goals-jam-community-platform-7uamgc2j.sites.blink.new/course/enroll" style="background: #F59E0B; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Complete Registration</a>
      </div>
      
      <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px; text-align: center; color: #666; font-size: 14px;">
        <p>Questions? Contact us at <a href="mailto:hello@globalgoalsjam.org" style="color: #00A651;">hello@globalgoalsjam.org</a></p>
      </div>
    </div>
  `

  const getCustomEmailContent = () => {
    const messageHtml = customMessage ? customMessage.split('\n').map(line => `<p style="margin: 0 0 15px;">${line}</p>`).join('') : 'Your message will appear here.'
    
    return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <img src="https://global-goals-jam-community-platform-7uamgc2j.sites.blink.new/ggj-logo.svg" alt="Global Goals Jam" style="max-width: 200px; height: auto;" />
        <h1 style="color: #00A651; margin: 20px 0;">${customSubject || 'Message from Global Goals Jam'}</h1>
      </div>
      
      <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <p style="margin: 0 0 15px; font-size: 16px; line-height: 1.6;">Dear {{name}},</p>
        <div style="margin: 0 0 15px; font-size: 16px; line-height: 1.6;">${messageHtml}</div>
      </div>
      
      <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px; text-align: center; color: #666; font-size: 14px;">
        <p>Best regards,<br/>The Global Goals Jam Team</p>
        <p style="margin-top: 15px;"><a href="https://globalgoalsjam.org" style="color: #00A651;">globalgoalsjam.org</a></p>
      </div>
    </div>
  `
  }

  const getPreviewContent = () => {
    const template = getEmailTemplate()
    const sampleUser = targetUsers[0] || { displayName: 'John Doe', role: 'participant' }
    return template.content
      .replace(/{{name}}/g, sampleUser.displayName || 'John Doe')
      .replace(/{{role}}/g, sampleUser.role || 'participant')
  }

  return (
    <div className="space-y-6">
      {/* Message Sender Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Send Message to Users
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Message Type Selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Message Type</label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={messageType === 'individual' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setMessageType('individual')}
              >
                <User className="h-4 w-4 mr-2" />
                Individual
              </Button>
              <Button
                type="button"
                variant={messageType === 'role' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setMessageType('role')}
              >
                <Users className="h-4 w-4 mr-2" />
                By Role
              </Button>
              <Button
                type="button"
                variant={messageType === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setMessageType('all')}
              >
                <Users className="h-4 w-4 mr-2" />
                All Users
              </Button>
            </div>
          </div>

          {/* Recipients Selection */}
          {messageType === 'individual' && (
            <div className="space-y-3">
              <label className="text-sm font-medium">Select Recipients</label>
              <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto border rounded p-2">
                {users.map(user => (
                  <label key={user.id} className="flex items-center space-x-2 cursor-pointer p-2 hover:bg-gray-50 rounded">
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedUsers(prev => [...prev, user.id])
                        } else {
                          setSelectedUsers(prev => prev.filter(id => id !== user.id))
                        }
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{user.displayName || user.email}</div>
                      <div className="text-xs text-gray-500">{user.email}</div>
                    </div>
                    <Badge variant="secondary" className="text-xs">{user.role}</Badge>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete User Account</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete {user.displayName || user.email}?
                            This action cannot be undone. The user will be notified via email.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteUser(user.id, user.email, user.displayName)}
                            disabled={deletingUserId === user.id}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            {deletingUserId === user.id ? 'Deleting...' : 'Delete Account'}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </label>
                ))}
              </div>
            </div>
          )}

          {messageType === 'role' && (
            <div className="space-y-3">
              <label className="text-sm font-medium">Select Role</label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map(role => (
                    <SelectItem key={role} value={role}>
                      {role} ({users.filter(u => u.role === role).length} users)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Template Selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Email Template</label>
            <Select value={templateType} onValueChange={setTemplateType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="welcome">Welcome Message</SelectItem>
                <SelectItem value="payment_reminder">Payment Reminder</SelectItem>
                <SelectItem value="custom">Custom Message</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Custom Message Fields */}
          {templateType === 'custom' && (
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Subject</label>
                <Input
                  value={customSubject}
                  onChange={(e) => setCustomSubject(e.target.value)}
                  placeholder="Enter email subject"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Message</label>
                <Textarea
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder="Enter your message"
                  rows={6}
                />
              </div>
            </div>
          )}

          {/* Target Summary */}
          {targetUsers.length > 0 && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="text-sm font-medium text-blue-900">
                Will send to {targetUsers.length} recipient{targetUsers.length > 1 ? 's' : ''}
              </div>
              <div className="text-xs text-blue-700 mt-1">
                {targetUsers.slice(0, 3).map(u => u.displayName || u.email).join(', ')}
                {targetUsers.length > 3 && ` and ${targetUsers.length - 3} more`}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
              <DialogTrigger asChild>
                <Button type="button" variant="outline">
                  <Eye className="h-4 w-4 mr-2" />
                  Preview Email
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Email Preview</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="text-sm text-gray-600">
                    <strong>Subject:</strong> {getEmailTemplate().subject}
                  </div>
                  <div className="border rounded-lg p-4 bg-white">
                    <div dangerouslySetInnerHTML={{ __html: getPreviewContent() }} />
                  </div>
                  <div className="text-xs text-gray-500">
                    Preview shows sample data. Actual emails will be personalized for each recipient.
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Button 
              onClick={handleSendMessage} 
              disabled={targetUsers.length === 0 || isSending}
              className="flex-1"
            >
              <Send className="h-4 w-4 mr-2" />
              {isSending ? 'Sending...' : `Send to ${targetUsers.length} recipient${targetUsers.length !== 1 ? 's' : ''}`}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}