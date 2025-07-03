'use client'
import React from 'react'
import '@mdxeditor/editor/style.css'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import type { Repo } from '@/definitions/types'
import { useRepos } from '@/hooks/use-repo-queries'
import RepositoryCard from '@/components/home/RepositoryCard'
import ProfileDropdown from '@/components/User/ProfileDropdown'
import RepositorySkeleton from '@/components/home/RepositorySkeleton'
import ErrorOverlay from '@/components/home/ErrorOverlay'

export default function Home() {
  const router = useRouter()
  const { status } = useSession()

  const { data: reposData, isLoading, error } = useRepos()

  const handleRepoClick = (repo: Repo) => {
    router.push(
      `/${repo.name}?owner=${repo.owner.login}&branch=${repo.default_branch}`,
    )
  }

  if (isLoading) return <RepositorySkeleton />

  if (status === 'unauthenticated') {
    return (
      <ErrorOverlay
        heading={'Welcome to ADR Manager'}
        description={'Please sign in to view your repositories\n'}
      />
    )
  }

  if (error) {
    return (
      <ErrorOverlay
        heading={'Error Loading Repositories'}
        description={'Failed to load your repositories. Please try again.'}
      />
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

      {!isLoading && reposData && repositories.length === 0 ? (
        <ErrorOverlay
          heading={'No repositories found'}
          description={
            'Make sure you have access to repositories in your connected account'
          }
        />
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
