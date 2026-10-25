// Frame for the sign-in, sign-up, password and invitation pages.

import Link from 'next/link'
import type { ReactNode } from 'react'

export function AuthCard({
  title,
  description,
  children,
  footer,
}: {
  title: string
  description?: ReactNode
  children: ReactNode
  footer?: ReactNode
}) {
  return (
    // A white card floating on the pale tint, like the landing page's frames.
    <div className="bg-tint-wash">
      <div className="mx-auto flex w-full max-w-[75rem] justify-center px-4 py-12 sm:px-6 sm:py-20">
        <div className="flex w-full max-w-md flex-col gap-6 rounded-lg bg-card p-6 text-card-foreground shadow-lg sm:p-8">
          <div className="flex flex-col gap-3">
            <h1 className="text-[2rem] leading-none font-medium tracking-tight">{title}</h1>
            {description ? <p className="text-pretty text-slate">{description}</p> : null}
          </div>
          {children}
          {footer ? <div className="border-t pt-4 text-sm text-slate">{footer}</div> : null}
        </div>
      </div>
    </div>
  )
}

export function InlineLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="font-medium text-amethyst underline-offset-4 hover:underline">
      {children}
    </Link>
  )
}
