'use server'

// Server Actions for the shell. Each one re-reads the session and re-checks
// membership itself; nothing sent by the browser is trusted.

import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { z } from 'zod'

import { getServerEnv } from '@/lib/env/server'
import { actionError, actionSuccess, type ActionState } from '@/lib/forms/action-state'
import { redact } from '@/lib/logging/redact'
import { createUserClient } from '@/lib/supabase/server'

import { ACTIVE_WORKSPACE_COOKIE } from '../domain/workspace'

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365

/** Remembers the chosen workspace after confirming the user is an active member of it. */
export async function switchWorkspace(organizationId: string): Promise<ActionState> {
  const parsed = z.uuid().safeParse(organizationId)
  if (!parsed.success) return actionError('That workspace could not be found.')

  const supabase = await createUserClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  const userId = claimsData?.claims.sub
  if (!userId) return actionError('Your session has ended. Please sign in again.')

  const { data, error } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('organization_id', parsed.data)
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle()
  if (error) {
    console.error('[app-shell] workspace switch failed', redact(error))
    return actionError('We couldn’t switch workspaces. Please try again.')
  }
  if (!data) return actionError('You are not a member of that workspace.')

  ;(await cookies()).set(ACTIVE_WORKSPACE_COOKIE, data.organization_id, {
    httpOnly: true,
    sameSite: 'lax',
    secure: getServerEnv().appEnv !== 'development',
    path: '/',
    maxAge: ONE_YEAR_SECONDS,
  })
  revalidatePath('/app', 'layout')
  return actionSuccess()
}

export async function signOut(): Promise<void> {
  const supabase = await createUserClient()
  const { error } = await supabase.auth.signOut()
  if (error) console.error('[app-shell] sign-out failed', redact(error))
  ;(await cookies()).delete(ACTIVE_WORKSPACE_COOKIE)
  redirect('/')
}
