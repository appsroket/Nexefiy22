import type { Metadata, Viewport } from 'next'
import { Geist_Mono, Inter, Plus_Jakarta_Sans } from 'next/font/google'
import type { ReactNode } from 'react'

import { TooltipProvider } from '@/components/ui/tooltip'
import { getServerEnv } from '@/lib/env/server'
import { cn } from '@/lib/utils'

import './globals.css'

// Inter for UI and body text, Plus Jakarta Sans for display and headings.
const sans = Inter({ subsets: ['latin'], variable: '--font-sans' })
const display = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['500', '600'], variable: '--font-display' })
const mono = Geist_Mono({ subsets: ['latin'], variable: '--font-mono' })

// Not indexed unless a layout below says otherwise: the public website opts in
// (in production only); the signed-in application never does.
export function generateMetadata(): Metadata {
  return {
    metadataBase: new URL(getServerEnv().core.appUrl),
    title: { default: 'Nexefiy', template: '%s · Nexefiy' },
    description: 'Configure AI employees, connect your business apps, and supervise their work with approvals.',
    applicationName: 'Nexefiy',
    robots: { index: false, follow: false },
  }
}

export const viewport: Viewport = {
  themeColor: '#ffffff',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={cn('font-sans', sans.variable, display.variable, mono.variable)}>
      <body className="min-h-svh">
        <a
          href="#main-content"
          className="sr-only z-50 rounded-lg bg-background px-3 py-2 text-sm font-medium shadow-sm focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:ring-2 focus:ring-ring"
        >
          Skip to main content
        </a>
        <TooltipProvider delayDuration={300}>{children}</TooltipProvider>
      </body>
    </html>
  )
}
