'use client'
import {
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronRight, Users } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import React from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { getFileContent } from '@/app/actions'
import { useRepoTree } from '@/hooks/use-repo-queries'

interface Contributor {
  name: string
  username: string
  avatar: string
}

interface FileContentResponse {
  content: string
  name: string
  path: string
  sha: string
}

interface FileApiResponse {
  code: number
  data: FileContentResponse
  contributors: Contributor[]
}

export default function Contributors({ isOpen }: { isOpen: boolean }) {
  const { repo, path }: { repo: string; path: string } = useParams()

  const searchParams = useSearchParams()

  const formattedPath = path?.replaceAll('~', '/')

  const owner = searchParams.get('owner')
  const branch = searchParams.get('branch')

  // Get the repository tree to check if the path exists
  const { data: repoTree } = useRepoTree(repo, owner, branch)

  // Check if the current path exists in the repository tree
  const pathExistsInTree = React.useMemo(() => {
    if (!repoTree?.data?.tree || !formattedPath) return false

    return repoTree.data.tree.some((item) => item.path === formattedPath)
  }, [repoTree?.data?.tree, formattedPath])

  const { data: fileResponse, isLoading } = useQuery<FileApiResponse>({
    queryKey: ['file', repo, formattedPath],
    queryFn: () =>
      getFileContent(
        repo ?? '',
        formattedPath ?? '',
        owner ?? '',
      ) as Promise<FileApiResponse>,
    enabled: !!repo && !!path && !!owner && pathExistsInTree,
  })

  // Filter out empty/non-existent contributors
  const contributors =
    fileResponse?.contributors?.filter(
      (contributor: Contributor) => Object.keys(contributor).length !== 0,
    ) ?? []

  return (
    <div className="p-4 border-b">
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          className="w-full justify-between p-0 h-auto font-semibold text-sm"
        >
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Contributors{' '}
            {!isLoading && pathExistsInTree ? `(${contributors.length})` : ''}
          </div>
          {isOpen ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-3 mt-3">
        <div className="space-y-2 max-h-24 overflow-y-auto">
          {pathExistsInTree ? (
            contributors.map((contributor: Contributor, index: number) => (
              <div
                key={index}
                className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 rounded px-2 py-1.5"
              >
                <Avatar className="w-5 h-5">
                  <AvatarImage
                    src={contributor.avatar}
                    alt={contributor.name}
                  />
                  <AvatarFallback className="text-xs bg-blue-100 text-blue-700">
                    {contributor.username
                      ?.split(' ')
                      .map((n: string) => n[0])
                      .join('')
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium truncate">
                    {contributor.name}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    @{contributor.username}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-xs text-muted-foreground italic text-center py-2">
              File not found in repository
            </div>
          )}
          {pathExistsInTree && contributors.length === 0 && !isLoading && (
            <div className="text-xs text-muted-foreground italic text-center py-2">
              No collaborators assigned
            </div>
          )}
        </div>
      </CollapsibleContent>
    </div>
  )
}
