// Session refresh for the proxy (src/proxy.ts). Runs before every page
// request so expired access tokens are refreshed and written back as cookies
// before Server Components read them.

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

import { getPublicEnv } from '@/lib/env/public'

import type { Database } from './database.types'

export async function refreshSession(request: NextRequest): Promise<NextResponse> {
  let response = NextResponse.next({ request })
  const { supabaseUrl, supabasePublishableKey } = getPublicEnv()

  const supabase = createServerClient<Database>(supabaseUrl, supabasePublishableKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet, headers) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value)
        response = NextResponse.next({ request })
        for (const { name, value, options } of cookiesToSet) response.cookies.set(name, value, options)
        // Responses that set auth cookies must never be cached by a CDN.
        for (const [key, value] of Object.entries(headers)) response.headers.set(key, value)
      },
    },
  })

  // Verifies the access token (refreshing it if needed). Do not put code
  // between client creation and this call.
  await supabase.auth.getClaims()
  return response
}
