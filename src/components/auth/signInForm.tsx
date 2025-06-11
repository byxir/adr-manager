'use client'

import { cn } from '@/lib/utils'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Github, Gitlab } from 'lucide-react'
import { signIn } from 'next-auth/react'
import SignInButton from '@/components/auth/signInButton'

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Welcome</CardTitle>
          <CardDescription>
            Sign in with your chosen Git account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6">
            <div className="flex flex-col gap-4">
              <SignInButton
                action={() => signIn('github', { redirectTo: '/dashboard' })}
              >
                <Github />
                Login with GitHub
              </SignInButton>
              <SignInButton
                disabledReason={'GitLab integration is not currently enabled.'}
                disabled={true}
              >
                <Gitlab />
                Login with GitLab
              </SignInButton>
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="text-muted-foreground *:[a]:hover:text-primary text-center text-xs text-balance *:[a]:underline *:[a]:underline-offset-4">
        Can't find the git provider you would like to login with? Help us add
        more by contributing to our{' '}
        <a target={'_blank'} href="https://github.com/adr/adr-manager">
          GitHub Repository
        </a>
      </div>
    </div>
  )
}
