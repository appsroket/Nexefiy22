import type { ReactNode } from 'react'

import { AppShell } from '@/modules/app-shell/ui/app-shell'

export default function AppLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>
}
