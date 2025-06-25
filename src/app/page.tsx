'use client'
import React from 'react'
import '@mdxeditor/editor/style.css'
import { useRouter } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { Repo } from '@/definitions/types'
import { useRepos } from '@/hooks/use-repo-queries'
import { Button } from '@/components/ui/button'
import RepositoryCard from '@/components/Cards/RepositoryCard'
import ProfileDropdown from '@/components/User/ProfileDropdown'

export default function Home() {
  const router = useRouter()
  const { data: session } = useSession()

  const { data: reposData, isLoading, error } = useRepos()

  const handleRepoClick = (repo: Repo) => {
    console.log('handleRepoClick: ', repo)
    router.push(
      `/${repo.name}?owner=${repo.owner.login}&branch=${repo.default_branch}`,
    )
  }

  if (!session?.user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Welcome to ADR Manager</h1>
          <p className="text-muted-foreground">
            Please sign in to view your repositories
          </p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96 mt-2" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="h-48">
              <CardHeader>
                <div className="flex items-center space-x-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center flex flex-col gap-4">
          <div>
            <h1 className="text-2xl font-bold mb-4">
              Error Loading Repositories
            </h1>
            <p className="text-muted-foreground">
              Failed to load your repositories. Please try again.
            </p>
          </div>
          <Button onClick={() => signOut()}>Sign out</Button>
        </div>
      </div>
    )
  }

  const repositories = reposData?.data ?? []

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">Your Repositories</h1>
          <div>
            <p className="text-muted-foreground">
              Select a repository to manage its Architecture Decision Records
            </p>
            <div className="mt-2 text-sm text-muted-foreground">
              {repositories.length} repositories found
            </div>
          </div>
        </div>
        <ProfileDropdown />
      </div>

      {repositories.length === 0 ? (
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-2">No repositories found</h2>
          <p className="text-muted-foreground">
            Make sure you have access to repositories in your connected account
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {repositories.map((repo: Repo) => (
            <RepositoryCard
              key={repo.id}
              repo={repo}
              handleRepoClick={handleRepoClick}
            />
          ))}
        </div>
      )}
    </div>
  )
}
