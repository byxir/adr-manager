/* eslint-disable @typescript-eslint/no-unsafe-assignment */

'use client'
import React from 'react'
import { Button } from '@/components/ui/button'
import { signIn, useSession } from 'next-auth/react'
import { useQuery } from '@tanstack/react-query'

function getRepos() {
  return fetch('/api/git/repos').then((r) => r.json())
}

function getRepoTree() {
  return fetch('/api/git/repo/web-chat?branch=main&owner=Xignotic84').then(
    (r) => r.json(),
  )
}

function getFileContent() {
  return fetch('/api/git/file/web-chat?path=.gitignore&owner=Xignotic84').then(
    (r) => r.json(),
  )
}

export default function Home() {
  const { data: session } = useSession()

  const { data } = useQuery({ queryKey: ['repositories'], queryFn: getRepos })

  const { data: repoTree } = useQuery({
    queryKey: ['repositoryTree'],
    queryFn: getRepoTree,
  })

  const { data: fileContent } = useQuery({
    queryKey: ['fileContent'],
    queryFn: getFileContent,
  })

  console.log(fileContent)

  return (
    <div>
      <Button onClick={() => signIn('github')}>Sign in</Button>
      {session?.user?.name}
    </div>
  )
}
