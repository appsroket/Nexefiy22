// Paths that external providers call back into. Registered in provider
// dashboards, so changing one requires updating every environment's
// configuration (see docs/credential-setup.md#urls-to-register-with-providers).
//
// `built: false` marks a reserved path with no route yet (it answers 404):
// don't register it with the provider. tests/app/endpoints.test.ts ties
// every `built` path to a route file and every reserved one to its absence.

export const PROVIDER_ENDPOINTS = [
  { provider: 'Supabase Auth', kind: 'auth redirect', path: '/auth/callback', built: true },
  { provider: 'Google', kind: 'OAuth redirect URI', path: '/api/integrations/google/callback', built: false },
  { provider: 'Google', kind: 'Gmail push (Pub/Sub)', path: '/api/webhooks/google', built: false },
  { provider: 'Slack', kind: 'OAuth redirect URL', path: '/api/integrations/slack/callback', built: true },
  { provider: 'Slack', kind: 'Event Subscriptions request URL', path: '/api/webhooks/slack', built: false },
  { provider: 'HubSpot', kind: 'OAuth redirect URL', path: '/api/integrations/hubspot/callback', built: true },
  { provider: 'HubSpot', kind: 'webhook target URL', path: '/api/webhooks/hubspot', built: false },
  { provider: 'Stripe', kind: 'webhook endpoint', path: '/api/webhooks/stripe', built: false },
  { provider: 'Vercel Cron', kind: 'cron job path prefix', path: '/api/cron/', built: true },
] as const

export function absoluteUrl(appUrl: string, path: string): string {
  return `${appUrl.replace(/\/+$/, '')}${path}`
}
