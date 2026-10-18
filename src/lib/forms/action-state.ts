// Result shape for Server Actions used with useActionState. Expected failures
// (validation, permission, not found) are returned, not thrown, so forms can
// show them inline; unexpected errors are thrown and reach an error boundary.

import { z } from 'zod'

export type FieldErrors = Partial<Record<string, string[]>>

export type ActionState =
  | { status: 'idle' }
  | { status: 'success'; message?: string }
  | { status: 'error'; message: string; fieldErrors?: FieldErrors }

export const IDLE_ACTION_STATE: ActionState = { status: 'idle' }

export function actionSuccess(message?: string): ActionState {
  return message === undefined ? { status: 'success' } : { status: 'success', message }
}

export function actionError(message: string, fieldErrors?: FieldErrors): ActionState {
  return fieldErrors ? { status: 'error', message, fieldErrors } : { status: 'error', message }
}

/** Maps a Zod error to per-field messages. Errors without a path go under "_form". */
export function fieldErrorsFromZod(error: z.ZodError): FieldErrors {
  const flattened = z.flattenError(error)
  const result: FieldErrors = { ...(flattened.fieldErrors as FieldErrors) }
  if (flattened.formErrors.length) result._form = flattened.formErrors
  return result
}

/** Parses FormData with a Zod schema into either data or a ready-to-return ActionState. */
export function parseFormData<T extends z.ZodType>(
  schema: T,
  formData: FormData,
): { ok: true; data: z.infer<T> } | { ok: false; state: ActionState } {
  const result = schema.safeParse(Object.fromEntries(formData))
  if (result.success) return { ok: true, data: result.data }
  return { ok: false, state: actionError('Please correct the highlighted fields.', fieldErrorsFromZod(result.error)) }
}
