// Building blocks shared by every public page. Server Components only.

import Link from 'next/link'
import type { ReactNode } from 'react'

import { StatusIndicator } from '@/components/status-badge'
import { cn } from '@/lib/utils'

import { CAPABILITY_STATUS, STATUS_ORDER, type CapabilityStatus } from '../domain/capabilities'

export function Container({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('mx-auto w-full max-w-[75rem] px-4 sm:px-6 lg:px-8', className)}>{children}</div>
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2 font-heading font-semibold tracking-tight text-heading', className)}>
      <svg aria-hidden="true" viewBox="0 0 32 32" className="size-7 shrink-0">
        <rect width="32" height="32" rx="8" className="fill-primary" />
        <path d="M10 23V9h2.6l6.8 9.4V9H22v14h-2.6l-6.8-9.4V23z" className="fill-primary-foreground" />
      </svg>
      Nexefiy
    </span>
  )
}

/** Small label above a heading: Mist Violet pill, Royal Amethyst text. */
export function PillTag({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cn('w-fit rounded-full bg-secondary px-3 py-1 text-xs font-medium text-amethyst', className)}>
      {children}
    </p>
  )
}

/**
 * 24px frame carrying the hero gradient, with a white surface (a product
 * preview or a call to action) floating on it. Text never sits on the
 * gradient itself.
 */
export function HeroFrame({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('rounded-3xl bg-hero-wash p-2 sm:p-6', className)}>{children}</div>
}

/** Introduction at the top of a page: its single <h1>, a lead paragraph, and actions. */
export function PageIntro({
  eyebrow,
  title,
  lead,
  actions,
  children,
}: {
  eyebrow?: string
  title: string
  lead: ReactNode
  actions?: ReactNode
  children?: ReactNode
}) {
  return (
    <div className="bg-tint-wash">
      <Container className="flex flex-col gap-5 py-16 sm:py-20">
        {eyebrow ? <PillTag>{eyebrow}</PillTag> : null}
        <h1 className="max-w-3xl text-[2.5rem] leading-none font-medium tracking-tight text-balance sm:text-[3.5rem]">
          {title}
        </h1>
        <div className="max-w-2xl text-base text-pretty text-slate sm:text-lg">{lead}</div>
        {actions ? <div className="flex flex-wrap gap-3 pt-2">{actions}</div> : null}
        {children}
      </Container>
    </div>
  )
}

/**
 * A titled page section; the heading labels the region for assistive
 * technology. The intro (tag, heading, one short lead) is centred; a longer
 * lead uses align="start" so body text is never centred over several lines.
 * `muted` gives the white-to-Mist-Violet tint, alternating with plain white.
 */
export function Section({
  id,
  eyebrow,
  title,
  description,
  children,
  className,
  tone = 'plain',
  align = 'center',
}: {
  id: string
  eyebrow?: string
  title: string
  description?: ReactNode
  children: ReactNode
  className?: string
  tone?: 'plain' | 'muted'
  align?: 'center' | 'start'
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-heading`}
      className={cn('scroll-mt-24 py-16 sm:py-20', tone === 'muted' && 'bg-tint-wash', className)}
    >
      <Container className="flex flex-col gap-10">
        <div className={cn('flex max-w-3xl flex-col gap-4', align === 'center' ? 'mx-auto items-center text-center' : 'items-start')}>
          {eyebrow ? <PillTag>{eyebrow}</PillTag> : null}
          <h2
            id={`${id}-heading`}
            className="text-[2rem] leading-none font-medium tracking-tight text-balance sm:text-[2.5rem]"
          >
            {title}
          </h2>
          {description ? (
            <div className={cn('max-w-2xl text-base text-slate sm:text-lg', align === 'center' ? 'text-balance' : 'text-pretty')}>
              {description}
            </div>
          ) : null}
        </div>
        {children}
      </Container>
    </section>
  )
}

export function CapabilityStatusBadge({ status, className }: { status: CapabilityStatus; className?: string }) {
  const { label, tone } = CAPABILITY_STATUS[status]
  return <StatusIndicator tone={tone} label={label} className={className} />
}

/** Explains the status labels; shown wherever statuses appear. */
export function StatusLegend({ className }: { className?: string }) {
  return (
    <dl className={cn('grid gap-4 rounded-lg bg-card p-5 text-sm shadow-sm sm:grid-cols-3', className)}>
      {STATUS_ORDER.map((status) => (
        <div key={status} className="flex flex-col gap-1.5">
          <dt>
            <CapabilityStatusBadge status={status} />
          </dt>
          <dd className="text-slate">{CAPABILITY_STATUS[status].description}</dd>
        </div>
      ))}
    </dl>
  )
}

/** Inline text link in body copy. */
export function TextLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="font-medium text-amethyst underline-offset-4 hover:underline">
      {children}
    </Link>
  )
}

/** A visible "this is an example" marker for illustrative content. */
export function IllustrativeNote({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-lg border border-dashed bg-background px-3 py-2 text-sm text-slate">
      <span className="font-medium text-plum">Illustrative: </span>
      {children}
    </p>
  )
}
