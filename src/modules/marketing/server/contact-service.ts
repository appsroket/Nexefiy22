// Contact-form handling, separated from the Server Action so it can be tested
// with fake configuration, a fake rate limiter and a fake fetch.
//
// Messages are delivered by email (Resend) and never stored. Their content is
// never logged: failures log only the HTTP status.

import 'server-only'

import { actionError, actionSuccess, parseFormData, type ActionState } from '@/lib/forms/action-state'
import { redact } from '@/lib/logging/redact'

import { HONEYPOT_FIELD, topicLabel } from '../domain/contact'
import { contactMessageSchema, type ContactMessage } from '../domain/contact-schema'

export const RESEND_EMAILS_URL = 'https://api.resend.com/emails'

export interface ContactDeliveryConfig {
  resendApiKey: string
  from: string
  to: string
}

export interface ContactDeps {
  /** Null when the email or contactForm feature isn't configured. */
  config: ContactDeliveryConfig | null
  /** Returns false when this sender has sent too many messages recently. */
  allowSubmission: () => boolean
  fetch: typeof fetch
}

export const CONTACT_UNAVAILABLE_MESSAGE =
  'The contact form isn’t connected yet, so messages can’t be sent. Please try again later.'

export const CONTACT_SUCCESS_MESSAGE = 'Thanks, your message was sent. We’ll reply to the email address you gave.'

export async function handleContactSubmission(formData: FormData, deps: ContactDeps): Promise<ActionState> {
  if (!deps.config) return actionError(CONTACT_UNAVAILABLE_MESSAGE)

  // Bots fill every field; people never see this one. Pretend it worked.
  const honeypot = formData.get(HONEYPOT_FIELD)
  if (typeof honeypot === 'string' && honeypot.trim() !== '') return actionSuccess(CONTACT_SUCCESS_MESSAGE)

  const fields = new FormData()
  for (const name of ['name', 'email', 'company', 'topic', 'message']) {
    const value = formData.get(name)
    if (typeof value === 'string') fields.set(name, value)
  }
  const parsed = parseFormData(contactMessageSchema, fields)
  if (!parsed.ok) return parsed.state

  if (!deps.allowSubmission()) {
    return actionError('You’ve sent several messages in a short time. Please wait a few minutes and try again.')
  }

  try {
    const response = await deps.fetch(RESEND_EMAILS_URL, {
      method: 'POST',
      headers: { authorization: `Bearer ${deps.config.resendApiKey}`, 'content-type': 'application/json' },
      body: JSON.stringify(buildContactEmail(parsed.data, deps.config)),
      signal: AbortSignal.timeout(10_000),
    })
    if (!response.ok) {
      console.error('[marketing] contact message delivery failed', { status: response.status })
      return actionError('We couldn’t send your message just now. Please try again in a few minutes.')
    }
  } catch (error) {
    console.error('[marketing] contact message delivery failed', redact(error instanceof Error ? error.name : 'unknown'))
    return actionError('We couldn’t send your message just now. Please try again in a few minutes.')
  }

  return actionSuccess(CONTACT_SUCCESS_MESSAGE)
}

/** Resend request body. Plain text only, so message content can't inject HTML. */
export function buildContactEmail(message: ContactMessage, config: Pick<ContactDeliveryConfig, 'from' | 'to'>) {
  const topic = topicLabel(message.topic)
  return {
    from: config.from,
    to: [config.to],
    reply_to: message.email,
    subject: `Website contact: ${topic} (${message.name})`,
    text: [
      `Topic: ${topic}`,
      `Name: ${message.name}`,
      `Email: ${message.email}`,
      `Company: ${message.company || 'not given'}`,
      '',
      message.message,
      '',
      '— Sent from the contact form on the Nexefiy website.',
    ].join('\n'),
  }
}
