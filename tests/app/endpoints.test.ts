import { existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { PROVIDER_ENDPOINTS } from '@/lib/config/endpoints'
import { CONNECTORS } from '@/modules/integrations/connectors/registry'

// The list env:check prints for provider dashboards must only offer paths
// that answer: a 404 registered with a provider fails without telling anyone.
function hasRoute(path: string): boolean {
  if (path === '/api/cron/') return readdirSync('src/app/api/cron').some((job) => existsSync(join('src/app/api/cron', job, 'route.ts')))
  const callback = /^\/api\/integrations\/([^/]+)\/callback$/.exec(path)
  if (callback) {
    return existsSync('src/app/api/integrations/[provider]/callback/route.ts') && CONNECTORS.some((c) => c.provider === callback[1])
  }
  return existsSync(join('src/app', path, 'route.ts'))
}

describe('provider endpoints', () => {
  it.each(PROVIDER_ENDPOINTS.map((e) => [e.path, e.built] as const))('%s has a route: %s', (path, built) => {
    expect(hasRoute(path)).toBe(built)
  })
})
