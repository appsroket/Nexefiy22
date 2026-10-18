import { PUBLIC_PAGES } from '@/modules/marketing/domain/site'
import { AccountEntry } from '@/modules/marketing/ui/account-entry'
import { pageMetadata } from '@/modules/marketing/ui/page-metadata'

export const metadata = pageMetadata('signUp')

export default function SignUpPage() {
  return (
    <AccountEntry
      title="Create an account"
      message="Sign-ups aren’t open yet. Ask for early access and we’ll let you know as soon as you can create your workspace."
      alternate={{ prompt: 'Looking for sign-in?', label: 'Sign in', href: PUBLIC_PAGES.signIn.path }}
    />
  )
}
