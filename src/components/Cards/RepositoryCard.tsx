import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Calendar, GitFork, Lock, Star } from 'lucide-react'
import React from 'react'
import type { Repo } from '@/definitions/types'

export default function RepositoryCard({
  repo,
  handleRepoClick,
}: {
  repo: Repo
  handleRepoClick: (repo: Repo) => void
}) {
  return (
    <Card
      key={repo.id}
      className="cursor-pointer hover:shadow-lg transition-shadow duration-200 hover:border-primary/50"
      onClick={() => handleRepoClick(repo)}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={repo.owner.avatar_url} alt={repo.owner.login} />
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
            <span>Updated {new Date(repo.pushed_at).toLocaleDateString()}</span>
          </div>
          <div className="bg-border px-2 py-1 rounded-md">
            <span>{repo.default_branch}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
