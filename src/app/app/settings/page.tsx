import { Users } from 'lucide-react'
import type { Metadata } from 'next'

import { SectionCard } from '@/components/cards'
import { EmptyState } from '@/components/empty-state'
import { PageHeader } from '@/components/page-header'
import { getNavItem } from '@/modules/app-shell/domain/navigation'
import { roleLabel } from '@/modules/app-shell/domain/workspace'
import { getShellContext } from '@/modules/app-shell/server/shell-context'
import { requireWorkspace } from '@/modules/app-shell/ui/workspace-gate'

export const metadata: Metadata = { title: 'Settings' }

export default async function SettingsPage() {
  const item = getNavItem('/settings')
  const gate = requireWorkspace(await getShellContext(), 'workspace settings')

  return (
    <>
      <PageHeader title={item.title} description={item.description} />
      {gate.ok ? (
        <>
          <SectionCard title="Workspace" description="Basic details of the workspace you’re working in.">
            <dl className="grid gap-4 text-sm sm:grid-cols-3">
              <div className="flex flex-col gap-1">
                <dt className="text-muted-foreground">Name</dt>
                <dd className="font-medium">{gate.workspace.name}</dd>
              </div>
              <div className="flex flex-col gap-1">
                <dt className="text-muted-foreground">Workspace address</dt>
                <dd className="font-mono text-xs">{gate.workspace.slug}</dd>
              </div>
              <div className="flex flex-col gap-1">
                <dt className="text-muted-foreground">Your role</dt>
                <dd className="font-medium">{roleLabel(gate.workspace.role)}</dd>
              </div>
            </dl>
          </SectionCard>
          <EmptyState
            icon={Users}
            title="More settings are on the way"
            description="Managing members and invitations, approval policies, and billing isn’t available in this version yet."
          />
        </>
      ) : (
        gate.fallback
      )}
    </>
  )
}
