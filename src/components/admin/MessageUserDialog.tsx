import { useEffect, useMemo, useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2, Send, CheckCircle2, AlertTriangle, Eye, Pencil } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { notifications } from '@/lib/supabase'

// --- template types ---------------------------------------------------------

export type MessageTemplate = 'invite' | 'payment_followup' | 'custom'

export interface MessageRecipient {
  id: string
  email: string
  displayName?: string
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  recipient: MessageRecipient | null
  /** Which template to pre-select when the dialog opens. */
  initialTemplate?: MessageTemplate
  /** Optional base URL for links; defaults to window.location.origin. */
  baseUrl?: string
}

// --- template builders ------------------------------------------------------

type TemplateBuild = { subject: string; bodyHtml: string; fromLabel: string }

function buildInvite(recipient: MessageRecipient, baseUrl: string): TemplateBuild {
  const firstName = (recipient.displayName || recipient.email || '').split('@')[0]
  const enrollUrl = `${baseUrl}/course/enroll?utm_source=admin_invite&utm_medium=email&utm_campaign=ggj_course_invite`
  return {
    subject: "You're Invited to the GGJ Host Certification Course!",
    fromLabel: 'Global Goals Jam <marco@globalgoalsjam.org>',
    bodyHtml: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #111827;">
  <div style="background: #00A651; padding: 24px; text-align: center;">
    <h1 style="color: white; margin: 0;">You're Invited!</h1>
  </div>
  <div style="padding: 24px; line-height: 1.6;">
    <p>Hi ${firstName},</p>
    <p>You've been invited to enrol in the <strong>GGJ Host Certification Course</strong>.</p>
    <p>This course equips you to host a Global Goals Jam in your community — an intensive weekend of design work tackling the UN Sustainable Development Goals.</p>
    <p style="text-align: center; margin: 24px 0;"><a href="${enrollUrl}" style="display:inline-block;padding:12px 24px;background:#00A651;color:white;text-decoration:none;border-radius:8px;font-weight:bold;">Enrol Now</a></p>
    <p>Warmly,<br/>Marco<br/><em>Founder, Global Goals Jam</em></p>
  </div>
</div>`
  }
}

function buildPaymentFollowup(recipient: MessageRecipient, baseUrl: string): TemplateBuild {
  const firstName = (recipient.displayName || recipient.email || '').split('@')[0]
  const enrollUrl = `${baseUrl}/course/enroll?utm_source=admin_inquiry&utm_medium=email&utm_campaign=ggj_course_payment_followup`
  return {
    subject: 'Everything OK with your GGJ enrollment?',
    fromLabel: 'Global Goals Jam <marco@globalgoalsjam.org>',
    bodyHtml: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #111827;">
  <div style="background: #00A651; padding: 24px; text-align: center;">
    <h1 style="color: white; margin: 0;">A quick check-in</h1>
  </div>
  <div style="padding: 24px; line-height: 1.6;">
    <p>Hi ${firstName},</p>
    <p>I noticed you started signing up for the <strong>GGJ Host Certification Course</strong>, but your payment didn't come through. These things happen — a bank redirect can time out, the iDEAL app doesn't always open, or life just got in the way.</p>
    <p>Was there anything that went wrong on your side? I'd love to hear it so we can smooth things out.</p>
    <p>If you're still keen to join and support the Global Goals Jam movement, you can pick up right where you left off:</p>
    <p style="text-align: center;"><a href="${enrollUrl}" style="display:inline-block;padding:12px 24px;background:#00A651;color:white;text-decoration:none;border-radius:8px;font-weight:bold;">Complete my enrollment</a></p>
    <p>Either way, just reply to this email — I read every message.</p>
    <p>Warmly,<br/>Marco<br/><em>Founder, Global Goals Jam</em></p>
  </div>
</div>`
  }
}

function buildCustom(recipient: MessageRecipient): TemplateBuild {
  const firstName = (recipient.displayName || recipient.email || '').split('@')[0]
  return {
    subject: '',
    fromLabel: 'Global Goals Jam <marco@globalgoalsjam.org>',
    bodyHtml: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #111827;">
  <div style="background: #00A651; padding: 24px; text-align: center;">
    <h1 style="color: white; margin: 0;">Global Goals Jam</h1>
  </div>
  <div style="padding: 24px; line-height: 1.6;">
    <p>Hi ${firstName},</p>
    <p><!-- write your message here --></p>
    <p>Warmly,<br/>Marco<br/><em>Founder, Global Goals Jam</em></p>
  </div>
</div>`
  }
}

const TEMPLATES: Record<MessageTemplate, { label: string; description: string; build: (r: MessageRecipient, b: string) => TemplateBuild }> = {
  invite: {
    label: 'Invite to course',
    description: 'Warm invite to enrol in the Host Certification Course.',
    build: buildInvite
  },
  payment_followup: {
    label: 'Payment follow-up',
    description: 'Friendly check-in for a checkout that timed out, with a fresh enrolment link.',
    build: buildPaymentFollowup
  },
  custom: {
    label: 'Custom / open',
    description: 'Blank template with a header and signature — write anything you like.',
    build: buildCustom
  }
}

// --- dialog ----------------------------------------------------------------

export default function MessageUserDialog({ open, onOpenChange, recipient, initialTemplate = 'invite', baseUrl }: Props) {
  const { toast } = useToast()
  const resolvedBaseUrl = baseUrl || (typeof window !== 'undefined' ? window.location.origin : 'https://globalgoalsjam.org')

  const [template, setTemplate] = useState<MessageTemplate>(initialTemplate)
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [view, setView] = useState<'edit' | 'preview'>('edit')
  const [sending, setSending] = useState(false)
  const [sentAt, setSentAt] = useState<string | null>(null)
  const [sendError, setSendError] = useState<string | null>(null)
  const [lastMessageId, setLastMessageId] = useState<string | null>(null)

  // When dialog opens (or recipient/template changes), reload the chosen template.
  useEffect(() => {
    if (!open || !recipient) return
    setTemplate(initialTemplate)
    setSentAt(null)
    setSendError(null)
    setLastMessageId(null)
  }, [open, recipient?.id, initialTemplate])

  // Reset body/subject when template changes.
  useEffect(() => {
    if (!open || !recipient) return
    const built = TEMPLATES[template].build(recipient, resolvedBaseUrl)
    setSubject(built.subject)
    setBody(built.bodyHtml)
    // Clear prior send state — a new template implies a fresh draft.
    setSentAt(null)
    setSendError(null)
  }, [template, recipient?.id, open, resolvedBaseUrl])

  const fromLabel = useMemo(() => {
    if (!recipient) return ''
    return TEMPLATES[template].build(recipient, resolvedBaseUrl).fromLabel
  }, [recipient?.id, template, resolvedBaseUrl])

  const canSend = !!recipient?.email && !!subject.trim() && !!body.trim() && !sending

  const handleSend = async () => {
    if (!recipient?.email) return
    setSending(true)
    setSendError(null)
    setSentAt(null)
    setLastMessageId(null)
    try {
      const result = await notifications.email({
        to: recipient.email,
        from: fromLabel,
        subject: subject.trim(),
        html: body,
        // Also derive a plaintext fallback from the HTML.
        text: body.replace(/<[^>]+>/g, '').replace(/\n\s*\n+/g, '\n\n').trim()
      })
      if (result && (result as any).success) {
        const ts = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        setSentAt(ts)
        setLastMessageId(((result as any).messageId as string) || null)
        toast({ title: 'Message sent', description: `Delivered to ${recipient.email} at ${ts}` })
      } else {
        const msg = ((result as any)?.error as string) || 'Email service returned no success flag.'
        setSendError(msg)
        toast({ title: 'Send failed', description: msg, variant: 'destructive' })
      }
    } catch (err: any) {
      const msg = err?.message || String(err)
      setSendError(msg)
      toast({ title: 'Send failed', description: msg, variant: 'destructive' })
    } finally {
      setSending(false)
    }
  }

  if (!recipient) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Message {recipient.displayName || recipient.email}</DialogTitle>
          <DialogDescription>
            Compose an email to <strong>{recipient.email}</strong>. From <code className="text-xs">{fromLabel}</code>
          </DialogDescription>
        </DialogHeader>

        {/* Template picker */}
        <div className="space-y-2">
          <Label>Template</Label>
          <Tabs value={template} onValueChange={(v) => setTemplate(v as MessageTemplate)}>
            <TabsList className="grid grid-cols-3 w-full">
              {(Object.keys(TEMPLATES) as MessageTemplate[]).map((key) => (
                <TabsTrigger key={key} value={key}>
                  {TEMPLATES[key].label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <p className="text-xs text-muted-foreground">{TEMPLATES[template].description}</p>
        </div>

        {/* Subject */}
        <div className="space-y-2">
          <Label htmlFor="msg-subject">Subject</Label>
          <Input
            id="msg-subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Enter a subject line"
          />
        </div>

        {/* Edit / preview toggle */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Body (HTML)</Label>
            <div className="inline-flex items-center rounded-md border p-0.5 gap-0.5 text-xs">
              <button
                type="button"
                onClick={() => setView('edit')}
                className={`flex items-center gap-1 px-2 py-1 rounded ${view === 'edit' ? 'bg-muted' : 'hover:bg-muted/60'}`}
                aria-pressed={view === 'edit'}
              >
                <Pencil className="h-3 w-3" /> Edit
              </button>
              <button
                type="button"
                onClick={() => setView('preview')}
                className={`flex items-center gap-1 px-2 py-1 rounded ${view === 'preview' ? 'bg-muted' : 'hover:bg-muted/60'}`}
                aria-pressed={view === 'preview'}
              >
                <Eye className="h-3 w-3" /> Preview
              </button>
            </div>
          </div>

          {view === 'edit' ? (
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="font-mono text-xs min-h-[320px]"
              spellCheck={false}
            />
          ) : (
            <div className="border rounded-md bg-muted/30 p-4 max-h-[400px] overflow-y-auto">
              <div className="text-xs text-muted-foreground mb-2">
                <strong>Subject:</strong> {subject || <em>(no subject)</em>}
              </div>
              <div
                className="bg-white rounded shadow-sm p-2"
                // eslint-disable-next-line react/no-danger
                dangerouslySetInnerHTML={{ __html: body }}
              />
            </div>
          )}
        </div>

        {/* Status line */}
        <div className="min-h-[24px] text-sm">
          {sending && (
            <span className="inline-flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Sending to {recipient.email}…
            </span>
          )}
          {!sending && sentAt && (
            <span className="inline-flex items-center gap-2 text-emerald-700">
              <CheckCircle2 className="h-4 w-4" /> Sent to {recipient.email} at {sentAt}
              {lastMessageId && <code className="text-[10px] text-muted-foreground ml-1">({lastMessageId})</code>}
            </span>
          )}
          {!sending && sendError && (
            <span className="inline-flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-4 w-4" /> {sendError}
            </span>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={sending}>
            {sentAt ? 'Close' : 'Cancel'}
          </Button>
          <Button onClick={handleSend} disabled={!canSend}>
            {sending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Sending…
              </>
            ) : sentAt ? (
              <>
                <Send className="h-4 w-4 mr-2" /> Send again
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" /> Send message
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
