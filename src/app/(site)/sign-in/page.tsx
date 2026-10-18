import { PUBLIC_PAGES } from '@/modules/marketing/domain/site'
import { AccountEntry } from '@/modules/marketing/ui/account-entry'
import { pageMetadata } from '@/modules/marketing/ui/page-metadata'

export const metadata = pageMetadata('signIn')

export default function SignInPage() {
  return (
    <AccountEntry
      title="Sign in"
      message="Sign-in isn’t available yet because Nexefiy accounts haven’t opened. When they do, you’ll sign in here with your email and a password or a one-time link."
      alternate={{ prompt: 'New to Nexefiy?', label: 'Create an account', href: PUBLIC_PAGES.signUp.path }}
    />
  )
}
