// Sign-in and sign-up entry points. Accounts don't exist yet, so these pages
// say so and offer the real next steps instead of a form that can't work.

import { LayoutDashboard, Mail } from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { APP_HOME } from '@/modules/app-shell/domain/navigation'

import { EARLY_ACCESS_HREF } from '../domain/site'
import { Container, TextLink } from './layout-primitives'

export function AccountEntry({
  title,
  message,
  alternate,
}: {
  title: string
  message: string
  alternate: { prompt: string; label: string; href: string }
}) {
  return (
    <Container className="flex justify-center py-16 sm:py-24">
      <div className="flex w-full max-w-md flex-col gap-6 rounded-2xl border bg-card p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="text-pretty text-muted-foreground">{message}</p>
        </div>
        <div className="flex flex-col gap-3">
          <Button asChild size="lg" className="h-10">
            <Link href={EARLY_ACCESS_HREF}>
              <Mail aria-hidden="true" data-icon="inline-start" />
              Ask for early access
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="h-10">
            <Link href={APP_HOME}>
              <LayoutDashboard aria-hidden="true" data-icon="inline-start" />
              Look around the workspace (no data)
            </Link>
          </Button>
        </div>
        <p className="border-t pt-4 text-sm text-muted-foreground">
          {alternate.prompt} <TextLink href={alternate.href}>{alternate.label}</TextLink>
        </p>
      </div>
    </Container>
  )
}
