'use server'

import { headers } from 'next/headers'

import type { ActionState } from '@/lib/forms/action-state'

import { getContactDeliveryConfig } from './contact-config'
import { handleContactSubmission } from './contact-service'
import { createRateLimiter } from './rate-limit'

const contactRateLimit = createRateLimiter({ limit: 5, windowMs: 15 * 60 * 1000 })

/** Public contact form. Validates on the server and delivers by email. */
export async function sendContactMessage(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const requestHeaders = await headers()
  // The first forwarded address is the client's on Vercel; used only as a rate-limit key, never logged or stored.
  const sender =
    requestHeaders.get('x-forwarded-for')?.split(',')[0]?.trim() || requestHeaders.get('x-real-ip') || 'unknown'

  return handleContactSubmission(formData, {
    config: getContactDeliveryConfig(),
    allowSubmission: () => contactRateLimit(sender),
    fetch,
  })
}
