/* eslint-disable @typescript-eslint/no-unsafe-assignment */

'use client'
import React from 'react'
import { Button } from '@/components/ui/button'
import { signIn, useSession } from 'next-auth/react'
import { useQuery } from '@tanstack/react-query'

function getRepos() {
  return fetch('/api/git/repos').then((r) => r.json())
}

function getRepoContent() {
  return fetch('/api/git/repo/web-chat?branch=main').then((r) => r.json())
}

export default function Home() {
  const { data: session } = useSession()

  const { data } = useQuery({ queryKey: ['repositories'], queryFn: getRepos })
  const { data: repoContent } = useQuery({
    queryKey: ['repositoryContent'],
    queryFn: getRepoContent,
  })

  return (
    <div>
      <Button onClick={() => signIn('github')}>Sign in</Button>
      {session?.user?.name}
    </div>
  )
}
