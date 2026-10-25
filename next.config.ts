import type { NextConfig } from 'next'

// Sent on every response. Vercel adds Strict-Transport-Security itself.
// There is no full Content-Security-Policy yet (docs/known-limitations.md);
// `frame-ancestors` alone only forbids framing.
export const SECURITY_HEADERS = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Content-Security-Policy', value: "frame-ancestors 'none'" },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
]

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  // Cache Components stays off for now: every authenticated page is rendered
  // per request so tenant data never lands in a shared cache (ADR-018).
  async headers() {
    return [{ source: '/:path*', headers: SECURITY_HEADERS }]
  },
}

export default nextConfig
