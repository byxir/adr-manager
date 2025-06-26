import React from 'react'
import { Button } from '@/components/ui/button'
import { signOut } from 'next-auth/react'
import { CircleAlert } from 'lucide-react'

export default function ErrorOverlay({
  heading,
  description,
}: {
  heading: string
  description: string
}) {
  return (
    <div className={'mt-30 flex flex-col items-center gap-4'}>
      <CircleAlert />
      <div className="flex flex-col text-center gap-2">
        <h1 className="text-2xl font-bold">{heading}</h1>
        <p className="text-muted-foreground">{description}</p>
      </div>
      <Button className={'w-[300px]'} onClick={() => signOut()}>
        Sign Out
      </Button>
    </div>
  )
}
