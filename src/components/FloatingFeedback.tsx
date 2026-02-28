import { useState } from 'react';
import { MessageCircle, X, Send, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { toast } from 'sonner';
import { blink } from '@/lib/blink';
import { cn } from '@/lib/utils';

interface FloatingFeedbackProps {
  context?: 'course' | 'host' | 'general';
  userEmail?: string;
  userName?: string;
}

export function FloatingFeedback({ context = 'general', userEmail = '', userName = '' }: FloatingFeedbackProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: userName,
    email: userEmail,
    subject: '',
    message: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.message) {
      toast.error('Please fill in your email and message');
      return;
    }

    setIsSubmitting(true);

    try {
      // Determine the subject based on context
      const contextLabel = context === 'course' ? '[Course Feedback]' : context === 'host' ? '[Host Dashboard]' : '[General Feedback]';
      const finalSubject = formData.subject || `${contextLabel} Feedback from ${formData.name || formData.email}`;

      // Send email using platform notifications
      const result = await blink.notifications.email({
        to: 'demadera@marcovanhout.com',
        from: 'feedback@globalgoalsjam.org',
        replyTo: formData.email,
        subject: finalSubject,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #00A651;">New Feedback Received</h2>
            <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Context:</strong> ${context === 'course' ? 'Course Dashboard' : context === 'host' ? 'Host Dashboard' : 'General'}</p>
              <p><strong>From:</strong> ${formData.name || 'Not provided'}</p>
              <p><strong>Email:</strong> ${formData.email}</p>
              <p><strong>Subject:</strong> ${formData.subject || 'No subject'}</p>
              <hr style="border: none; border-top: 1px solid #ddd; margin: 15px 0;">
              <p><strong>Message:</strong></p>
              <div style="background: white; padding: 15px; border-radius: 4px;">
                ${formData.message.replace(/\n/g, '<br>')}
              </div>
            </div>
            <p style="color: #666; font-size: 12px;">This feedback was sent from the Global Goals Jam platform.</p>
          </div>
        `,
        text: `
New Feedback Received\n\nContext: ${context}\nFrom: ${formData.name || 'Not provided'}\nEmail: ${formData.email}\nSubject: ${formData.subject || 'No subject'}\n\nMessage:\n${formData.message}\n\n---\nThis feedback was sent from the Global Goals Jam platform.
        `
      });

      if (result.success) {
        toast.success('Thank you for your feedback! We\'ll get back to you soon.');
        setFormData({ name: userName, email: userEmail, subject: '', message: '' });
        setTimeout(() => setIsOpen(false), 2000);
      } else {
        throw new Error('Failed to send feedback');
      }
    } catch (error) {
      console.error('Error sending feedback:', error);
      toast.error('Failed to send feedback. Please try again or email directly to demadera@marcovanhout.com');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-6 right-6 z-40 bg-primary text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110",
          isOpen && "scale-0 opacity-0 pointer-events-none"
        )}
        aria-label="Send feedback"
      >
        <MessageCircle className="h-6 w-6" />
      </button>

      {/* Feedback Modal */}
      <div
        className={cn(
          "fixed bottom-6 right-6 z-50 bg-white rounded-lg shadow-2xl border border-gray-200 transition-all duration-300",
          isOpen ? "scale-100 opacity-100" : "scale-95 opacity-0 pointer-events-none",
          "w-[90vw] max-w-md"
        )}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {context === 'course' ? 'Course Feedback' : context === 'host' ? 'Host Support' : 'Send Feedback'}
            </h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close feedback form"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name" className="text-sm">Name (optional)</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Your name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="email" className="text-sm">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="subject" className="text-sm">Subject (optional)</Label>
              <Input
                id="subject"
                type="text"
                placeholder={context === 'course' ? 'e.g., Question about Module 3' : 'What is this about?'}
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="message" className="text-sm">Message *</Label>
              <Textarea
                id="message"
                placeholder={
                  context === 'course' 
                    ? 'Share your feedback, questions, or suggestions about the course...'
                    : context === 'host'
                    ? 'How can we help you as a host? Share your questions or feedback...'
                    : 'How can we help you? Share your feedback or questions...'
                }
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                required
                rows={4}
                className="mt-1 resize-none"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-gray-500">
                We'll respond within 24-48 hours
              </p>
              <Button
                type="submit"
                disabled={isSubmitting || !formData.email || !formData.message}
                className="bg-primary hover:bg-primary/90"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send Feedback
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}