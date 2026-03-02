import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Textarea } from '../components/ui/textarea'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../components/ui/form'
import { Card } from '../components/ui/card'
import { AlertCircle, CheckCircle2, Mail, MapPin, MessageCircle, Phone } from 'lucide-react'
import { Badge } from '../components/ui/badge'
import { toast } from 'sonner'
import { notifications } from '../lib/supabase'

const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Please enter a valid email address'),
  subject: z.string().min(5, 'Subject must be at least 5 characters').max(100),
  message: z.string().min(10, 'Message must be at least 10 characters').max(2000),
})

type ContactFormData = z.infer<typeof contactSchema>

export default function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: '',
      email: '',
      subject: '',
      message: '',
    },
  })

  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true)
    try {
      // Send email to Marco via Blink notifications
      const emailHtml = `
        <div style="font-family: Inter, Arial, sans-serif; max-width: 640px; margin: 0 auto; color: #0B1324;">
          <div style="padding: 20px 0; text-align: center;">
            <a href="https://globalgoalsjam.org" style="text-decoration: none; color: #0B1324; font-weight: 700; font-size: 18px;">
              Global Goals Jam
            </a>
          </div>
          <div style="background: #ffffff; border: 1px solid #E5E7EB; border-radius: 12px; overflow: hidden;">
            <div style="padding: 24px;">
              <h1 style="margin: 0 0 12px; font-size: 20px; line-height: 1.2;">New Contact Form Submission</h1>
              <div style="font-size: 14px; line-height: 1.6; color: #3F4654;">
                <p><strong>From:</strong> ${data.name}</p>
                <p><strong>Email:</strong> ${data.email}</p>
                <p><strong>Subject:</strong> ${data.subject}</p>
                <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 16px 0;" />
                <p><strong>Message:</strong></p>
                <p style="white-space: pre-wrap;">${escapeHtml(data.message)}</p>
              </div>
            </div>
            <div style="padding: 16px 24px; background: #F9FAFB; border-top: 1px solid #E5E7EB; font-size: 12px; color: #6B7280;">
              © ${new Date().getFullYear()} Global Goals Jam
            </div>
          </div>
        </div>
      `

      const result = await notifications.email({
        to: 'marco@globalgoalsjam.org',
        from: 'Global Goals Jam <marco@globalgoalsjam.org>',
        subject: `Contact Form: ${data.subject}`,
        html: emailHtml,
        text: `New contact form submission from ${data.name} (${data.email})\n\nSubject: ${data.subject}\n\nMessage:\n${data.message}`,
      })

      if (result.success) {
        setSubmitSuccess(true)
        form.reset()
        toast.success('Message sent! We\'ll get back to you soon.')
        setTimeout(() => setSubmitSuccess(false), 5000)
      } else {
        console.error('Email send failed:', result)
        toast.error('Failed to send message. Please try again.')
      }
    } catch (error) {
      console.error('Contact form error:', error)
      if (error instanceof Error) {
        console.error('Error details - message:', error.message)
        console.error('Error details - stack:', error.stack)
      }
      toast.error('An error occurred. Please try again later.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-20 hero-pattern">
        <div className="absolute inset-0 bg-gradient-to-br from-background/80 to-background/60" aria-hidden="true" />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs uppercase tracking-[0.2em] font-semibold text-primary/60 mb-3">Reach Out</p>
          <Badge variant="green" className="mb-6 px-4 py-2 text-sm font-medium rounded-pill">
            <MessageCircle className="w-4 h-4 mr-2" />
            Contact Us
          </Badge>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold text-foreground mb-6 tracking-tight">
            Get in <span className="text-primary-solid">Touch</span>
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Have a question or suggestion? We'd love to hear from you.
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Info */}
          <div className="lg:col-span-1">
            <div className="space-y-6">
              <Card className="p-6 shadow-soft">
                <div className="flex items-start space-x-4">
                  <Mail className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-foreground">Email</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      We respond to all inquiries within 1-2 business days.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 shadow-soft">
                <div className="flex items-start space-x-4">
                  <MapPin className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-foreground">About GGJ</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Part of the Metodic movement for sustainable impact.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 shadow-soft">
                <div className="flex items-start space-x-4">
                  <Phone className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-foreground">Response Time</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Typically respond during business hours (Mon-Fri UTC).
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <Card className="p-8">
              {submitSuccess && (
                <div className="mb-6 p-4 bg-pastel-green border-0 rounded-lg flex items-start space-x-3">
                  <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-foreground">Message Sent!</h3>
                    <p className="text-sm text-foreground mt-1">
                      Thank you for contacting us. We'll get back to you shortly.
                    </p>
                  </div>
                </div>
              )}

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Name */}
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Your full name"
                            {...field}
                            disabled={isSubmitting}
                            className="border-border focus:border-primary"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Email */}
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address *</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="your@email.com"
                            {...field}
                            disabled={isSubmitting}
                            className="border-border focus:border-primary"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Subject */}
                  <FormField
                    control={form.control}
                    name="subject"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subject *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="What is this about?"
                            {...field}
                            disabled={isSubmitting}
                            className="border-border focus:border-primary"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Message */}
                  <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Message *</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Tell us more about your inquiry..."
                            rows={6}
                            {...field}
                            disabled={isSubmitting}
                            className="border-border focus:border-primary resize-none"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-primary hover:bg-primary/90 text-white rounded-pill"
                  >
                    {isSubmitting ? 'Sending...' : 'Send Message'}
                  </Button>

                  {/* Privacy Note */}
                  <p className="text-xs text-muted-foreground text-center">
                    Your email address will only be used to respond to your inquiry.
                  </p>
                </form>
              </Form>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

// Helper to escape HTML in user input
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }
  return text.replace(/[&<>"']/g, (m) => map[m])
}