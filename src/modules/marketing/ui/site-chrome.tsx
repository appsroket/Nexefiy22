// Header, footer and the product-status banner for the public website.

import { Info } from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'

import { EARLY_ACCESS_HREF, FOOTER_NAV, PUBLIC_PAGES } from '../domain/site'
import { Container, Logo } from './layout-primitives'
import { DesktopNav, MobileNav } from './site-nav'

export function StatusBanner() {
  return (
    <div className="bg-secondary text-sm text-plum">
      <Container className="flex items-start gap-2 py-2 sm:items-center">
        <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-amethyst sm:mt-0" />
        <p className="text-pretty">
          Nexefiy is in early development: accounts and workspaces work, AI employees don’t yet.{' '}
          <Link href="/#whats-built" className="font-medium text-amethyst underline underline-offset-4">
            See what’s built and what’s planned
          </Link>
        </p>
      </Container>
    </div>
  )
}

export function SiteHeader() {
  return (
    // Floating header: a white bar with a small shadow, sticky just below the top edge.
    <header className="sticky top-0 z-30 pt-3">
      <Container>
        <div className="flex h-14 items-center gap-4 rounded-lg bg-background/95 px-3 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/90 sm:px-4">
          <Link href="/" className="rounded-lg" aria-label="Nexefiy home">
            <Logo className="text-lg" />
          </Link>
          <div className="ml-auto flex items-center gap-2 xl:ml-6 xl:flex-1">
            <DesktopNav />
            <div className="ml-auto hidden items-center gap-2 sm:flex">
              <Button asChild variant="outline">
                <Link href={PUBLIC_PAGES.signIn.path}>Sign in</Link>
              </Button>
              <Button asChild>
                <Link href={EARLY_ACCESS_HREF}>Get early access</Link>
              </Button>
            </div>
            <MobileNav />
          </div>
        </div>
      </Container>
    </header>
  )
}

export function SiteFooter() {
  return (
    <footer className="mt-4 border-t bg-muted">
      <Container className="grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <div className="flex flex-col gap-3">
          <Logo />
          <p className="max-w-xs text-sm text-pretty text-slate">
            Supervised AI employees for small and mid-sized businesses. In development.
          </p>
        </div>
        {FOOTER_NAV.map((group) => (
          <nav key={group.title} aria-label={group.title}>
            <h2 className="font-sans text-xs font-medium tracking-wide text-plum uppercase">{group.title}</h2>
            <ul className="mt-3 flex flex-col gap-2 text-sm">
              {group.links.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="rounded-sm text-slate hover:text-primary hover:underline">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </Container>
      <Container className="border-t py-6 text-xs text-slate">
        <p>
          © {new Date().getFullYear()} Nexefiy. The legal documents linked above are drafts awaiting legal review and are
          not in effect.
        </p>
      </Container>
    </footer>
  )
}
