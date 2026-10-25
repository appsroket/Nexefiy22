import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

/** Top of every page: the single <h1>, a plain-language summary, and page actions. */
export function PageHeader({
  title,
  description,
  actions,
  className,
}: {
  title: string
  description?: ReactNode
  actions?: ReactNode
  className?: string
}) {
  return (
    <header className={cn('flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between', className)}>
      <div className="flex min-w-0 flex-col gap-2">
        <h1 className="text-2xl leading-none font-medium tracking-tight text-balance sm:text-[2rem]">{title}</h1>
        {description ? <p className="max-w-2xl text-sm text-pretty text-slate">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  )
}
