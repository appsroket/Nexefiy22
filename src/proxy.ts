import type { NextRequest } from 'next/server'

import { refreshSession } from '@/lib/supabase/session'

export async function proxy(request: NextRequest) {
  return refreshSession(request)
}

export const config = {
  // Only the signed-in application reads the Supabase session, so public
  // website pages skip the proxy and stay static. Add auth routes here when
  // sign-in is built.
  matcher: ['/app', '/app/:path*'],
}
