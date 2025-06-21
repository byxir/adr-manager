'use client'
import React from 'react'
import '@mdxeditor/editor/style.css'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { getRepos } from './actions'
import { useSession } from 'next-auth/react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { Star, GitFork, Calendar, Lock } from 'lucide-react'
import type { Repo } from '@/app/types'
import { useRepos } from '@/hooks/use-repo-queries'

export default function Home() {
  const router = useRouter()
  const { data: session } = useSession()

  const { data: reposData, isLoading, error } = useRepos()

  const handleRepoClick = (repo: Repo) => {
    router.push(
      `/${repo.name}?owner=${repo.owner.login}&branch=${repo.default_branch}`,
    )
  }

  if (!session) {
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
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">
            Error Loading Repositories
          </h1>
          <p className="text-muted-foreground">
            Failed to load your repositories. Please try again.
          </p>
        </div>
      </div>
    )
  }

  const repositories = reposData?.data ?? []

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Your Repositories</h1>
        <p className="text-muted-foreground">
          Select a repository to manage its Architecture Decision Records
        </p>
        <div className="mt-2 text-sm text-muted-foreground">
          {repositories.length} repositories found
        </div>
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
            <Card
              key={repo.id}
              className="cursor-pointer hover:shadow-lg transition-shadow duration-200 hover:border-primary/50"
              onClick={() => handleRepoClick(repo)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage
                        src={repo.owner.avatar_url}
                        alt={repo.owner.login}
                      />
                      <AvatarFallback>
                        {repo.owner.login[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg line-clamp-1">
                        {repo.name}
                      </CardTitle>
                      <CardDescription className="text-sm">
                        {repo.owner.login}
                      </CardDescription>
                    </div>
                  </div>
                  {repo.private && (
                    <div className="flex items-center space-x-1 bg-secondary px-2 py-1 rounded-md">
                      <Lock className="h-3 w-3" />
                      <span className="text-xs">Private</span>
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {repo.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {repo.description}
                  </p>
                )}

                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center space-x-4">
                    {repo.language && (
                      <div className="flex items-center space-x-1">
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                        <span>{repo.language}</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-1">
                      <Star className="h-3 w-3" />
                      <span>{repo.stargazers_count}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <GitFork className="h-3 w-3" />
                      <span>{repo.forks_count}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-3 w-3" />
                    <span>
                      Updated {new Date(repo.pushed_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="bg-border px-2 py-1 rounded-md">
                    <span>{repo.default_branch}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
