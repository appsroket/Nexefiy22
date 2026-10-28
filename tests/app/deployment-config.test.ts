// Vercel deployment configuration: security headers on every route, cron
// schedules that point at real, authenticated routes and that a Hobby plan
// accepts (Vercel rejects the whole deployment otherwise), and the Node
// version the project is verified on.

import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import nextConfig, { SECURITY_HEADERS } from '../../next.config'

const root = join(__dirname, '..', '..')

interface VercelConfig {
  crons?: { path: string; schedule: string }[]
  [key: string]: unknown
}

const vercel = JSON.parse(readFileSync(join(root, 'vercel.json'), 'utf8')) as VercelConfig

describe('security headers', () => {
  it('applies every header to every path', async () => {
    const rules = await nextConfig.headers!()
    expect(rules).toEqual([{ source: '/:path*', headers: SECURITY_HEADERS }])
    const names = SECURITY_HEADERS.map((header) => header.key)
    expect(names).toEqual(
      expect.arrayContaining(['X-Content-Type-Options', 'X-Frame-Options', 'Referrer-Policy', 'Permissions-Policy']),
    )
    expect(nextConfig.poweredByHeader).toBe(false)
  })
})

describe('vercel.json', () => {
  it('only configures cron jobs', () => {
    expect(Object.keys(vercel).filter((key) => key !== '$schema')).toEqual(['crons'])
  })

  it.each(vercel.crons ?? [])('$path runs at most once a day and requires CRON_SECRET', ({ path, schedule }) => {
    const [minute, hour, ...rest] = schedule.split(' ')
    expect(rest).toEqual(['*', '*', '*'])
    expect(minute).toMatch(/^\d{1,2}$/)
    expect(hour).toMatch(/^\d{1,2}$/)

    const route = join(root, 'src', 'app', ...path.split('/').filter(Boolean), 'route.ts')
    expect(existsSync(route)).toBe(true)
    const source = readFileSync(route, 'utf8')
    expect(source).toContain("isFeatureConfigured('cronAuth')")
    expect(source).toContain('timingSafeEqual')
  })

  it('schedules every cron route', () => {
    const scheduled = (vercel.crons ?? []).map((cron) => cron.path).sort()
    expect(scheduled).toEqual(['/api/cron/governance', '/api/cron/integrations', '/api/cron/knowledge', '/api/cron/tasks'])
  })
})

describe('CI workflow', () => {
  const workflow = readFileSync(join(root, '.github', 'workflows', 'ci.yml'), 'utf8')

  it.each(['npm ci', 'npm run typecheck', 'npm run lint', 'npm test', 'npm run build', 'npm run check:bundle', 'npm run db:test:local'])(
    'runs %s',
    (command) => {
      expect(workflow).toMatch(new RegExp(`^\\s+- run: ${command}$`, 'm'))
    },
  )

  it('uses no secrets and only reads the repository', () => {
    expect(workflow).not.toContain('secrets.')
    expect(workflow).toMatch(/^permissions:\n {2}contents: read$/m)
  })

  it('uses the pinned Node version', () => {
    expect(workflow.match(/node-version: (\d+)/g)?.every((line) => line.endsWith('24'))).toBe(true)
  })
})

describe('runtime', () => {
  it('pins Node 24', () => {
    const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as { engines: { node: string } }
    expect(pkg.engines.node).toBe('24.x')
  })
})
