'use client'

import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { type JSX, type ReactNode } from 'react'

export default function SignInButton({
  disabled,
  action,
  children,
}: {
  disabled?: boolean
  action?: () => void
  children: ReactNode
}) {
  const button: JSX.Element = (
    <span>
      <Button
        disabled={disabled}
        onClick={() => {
          if (!disabled && action) {
            action()
          }
        }}
        variant="outline"
        className="w-full"
      >
        {children}
      </Button>
    </span>
  )

  return disabled ? (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent>
          This integration is currently not enabled.
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  ) : (
    button
  )
}
