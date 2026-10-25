import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

import { parsePublicEnv, publicDeployment, PublicEnvError } from '@/lib/env/public'

import { CORE_VARS, fake } from '../helpers/env-fixtures'

describe('public environment module', () => {
  it('parses the browser-safe values', () => {
    const env = parsePublicEnv({ ...CORE_VARS, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: fake('pk_test_') }, 'development')
    expect(env.supabaseUrl).toBe(CORE_VARS.NEXT_PUBLIC_SUPABASE_URL)
    expect(env.appUrl).toBe('http://localhost:3000')
    expect(env.stripePublishableKey).toBe(fake('pk_test_'))
  })

  it('treats a missing Stripe key as billing disabled, not an error', () => {
    expect(parsePublicEnv(CORE_VARS, 'development').stripePublishableKey).toBeUndefined()
  })

  it('requires the app URL in production builds', () => {
    expect(() => parsePublicEnv(CORE_VARS, 'production')).toThrow(PublicEnvError)
    expect(() => parsePublicEnv({ ...CORE_VARS, NEXT_PUBLIC_VERCEL_URL: 'nexefiy-abc.vercel.app' }, 'production')).toThrow(
      'NEXT_PUBLIC_APP_URL is missing (required in production)',
    )
  })

  it('defaults to the deployment URL on Vercel previews, like the server does', () => {
    // A preview without NEXT_PUBLIC_APP_URL crashed every session route (2026-10-19).
    const env = parsePublicEnv({ ...CORE_VARS, NEXT_PUBLIC_VERCEL_URL: 'nexefiy-abc.vercel.app' }, 'preview')
    expect(env.appUrl).toBe('https://nexefiy-abc.vercel.app')
    expect(() => parsePublicEnv(CORE_VARS, 'preview')).toThrow(/required in preview/)
    expect(parsePublicEnv({ ...CORE_VARS, NEXT_PUBLIC_APP_URL: 'https://app.example.com/' }, 'preview').appUrl).toBe(
      'https://app.example.com',
    )
  })

  it("takes the deployment from Vercel's environment before NODE_ENV", () => {
    expect(publicDeployment('preview', 'production')).toBe('preview')
    expect(publicDeployment('production', 'production')).toBe('production')
    expect(publicDeployment(undefined, 'production')).toBe('production')
    expect(publicDeployment(undefined, 'development')).toBe('development')
    expect(publicDeployment('staging', 'test')).toBe('development')
  })

  it('reports a missing Supabase URL', () => {
    expect(() => parsePublicEnv({ ...CORE_VARS, NEXT_PUBLIC_SUPABASE_URL: undefined }, 'development')).toThrow(
      /NEXT_PUBLIC_SUPABASE_URL is missing/,
    )
  })

  it('only references NEXT_PUBLIC_ variables and never imports server code', () => {
    const source = readFileSync(new URL('../../src/lib/env/public.ts', import.meta.url), 'utf8')
    const referenced = [...source.matchAll(/process\.env\.([A-Z0-9_]+)/g)].map((match) => match[1])
    expect(referenced.filter((name) => name !== 'NODE_ENV' && !name?.startsWith('NEXT_PUBLIC_'))).toEqual([])
    expect(source).not.toMatch(/from '\.\/(core|server|catalog)'/)
    expect(source).not.toMatch(/node:/)
  })
})
