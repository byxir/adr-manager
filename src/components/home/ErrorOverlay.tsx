import React from 'react'
import { Button } from '@/components/ui/button'
import { signOut } from 'next-auth/react'

export default function ErrorOverlay({
  heading,
  description,
}: {
  heading: string
  description: string
}) {
  return (
    <div>
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">{heading}</h1>
          <p className="text-muted-foreground">{description}</p>
        </div>
      </div>
      <Button onClick={() => signOut()}>Sign Out</Button>
    </div>
  )
}
