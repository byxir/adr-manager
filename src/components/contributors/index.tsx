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
    <>
      {/* Update the count in the parent's subtitle */}
      <div className="space-y-2 max-h-32 overflow-y-auto">
        {pathExistsInTree ? (
          contributors.map((contributor: Contributor, index: number) => (
            <div
              key={index}
              className="flex items-center gap-3 bg-white dark:bg-slate-700 rounded-lg p-3 border border-slate-200 dark:border-slate-600 hover:shadow-sm transition-shadow"
            >
              <Avatar className="w-8 h-8 border-2 border-blue-200 dark:border-blue-700">
                <AvatarImage src={contributor.avatar} alt={contributor.name} />
                <AvatarFallback className="text-xs bg-gradient-to-br from-blue-500 to-blue-600 text-white font-semibold">
                  {contributor.username
                    ?.split(' ')
                    .map((n: string) => n[0])
                    .join('')
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                  {contributor.name}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  @{contributor.username}
                </div>
              </div>
              <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0" />
            </div>
          ))
        ) : (
          <div className="text-center py-6">
            <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-2">
              <Users className="w-6 h-6 text-slate-400" />
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400">
              File not found in repository
            </div>
          </div>
        )}
        {pathExistsInTree && contributors.length === 0 && !isLoading && (
          <div className="text-center py-6">
            <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-2">
              <Users className="w-6 h-6 text-slate-400" />
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400">
              No contributors found
            </div>
            <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              Contributors will appear here once changes are made
            </div>
          </div>
        )}
        {isLoading && (
          <div className="text-center py-6">
            <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-2 animate-pulse">
              <Users className="w-6 h-6 text-slate-400" />
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400">
              Loading contributors...
            </div>
          </div>
        )}
      </div>
    </>
  )
}
