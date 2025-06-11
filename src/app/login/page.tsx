import { GitMerge } from 'lucide-react'

import { LoginForm } from '@/components/auth/signInForm'

export default function LoginPage() {
  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <a
          href="#"
          className="flex items-center gap-2 self-center text-xl font-medium"
        >
          <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
            <GitMerge className={'size-4'} />
          </div>
          ADR Manager
        </a>
        <LoginForm />
      </div>
    </div>
  )
}
