'use client'
import { GitMerge } from 'lucide-react'

import { SignInForm } from '@/components/auth/signInForm'
import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace('/') // or wherever you want to redirect
    }
  }, [status, router])

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
        <SignInForm />
      </div>
    </div>
  )
}
