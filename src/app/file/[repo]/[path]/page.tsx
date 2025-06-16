'use client'
import React, { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import '@mdxeditor/editor/style.css'
import { getFileContent } from '../../../actions'
import { useQuery } from '@tanstack/react-query'
import { useParams, useSearchParams } from 'next/navigation'
import { type ApiResponse } from '../../../types'
import DisplayFileContents from './display-file-contents'
import { Skeleton } from '@/components/ui/skeleton'

export default function FilePage() {
  const { data: session } = useSession()
  const { repo, path }: { repo: string; path: string } = useParams()

  const searchParams = useSearchParams()

  const formattedPath = path.replaceAll('~', '/')

  const owner = searchParams.get('owner')

  const [markdown, setMarkdown] = useState<string | null>(null)

  const { data: fileResponse, error } = useQuery<ApiResponse<string>>({
    queryKey: ['file', repo, formattedPath],
    queryFn: () => getFileContent(repo ?? '', formattedPath ?? '', owner ?? ''),
    enabled: !!repo && !!path && !!owner,
  })

  useEffect(() => {
    if (fileResponse) {
      setMarkdown(
        `\`\`\`${path?.split('.').pop() ?? ''}\n${fileResponse.data}\n\`\`\``,
      )
    }
  }, [fileResponse])

  if (error) {
    console.error('Error fetching file:', error)
  }

  return (
    <SidebarInset>
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="#">
                  {owner}/{repo}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>{path}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        {session?.user && markdown && (
          <DisplayFileContents markdown={markdown} />
        )}
        {session?.user && !markdown && (
          <div className="flex flex-col h-full">
            {/* Toolbar */}
            <div className="flex items-center gap-2 border-b border-neutral-900 p-2">
              <Skeleton className="h-7 w-full rounded-sm" />
            </div>

            {/* Editor Area */}
            <div className="flex-1 p-4 space-y-2 font-mono text-sm">
              <Skeleton className="h-5 w-12 rounded-sm" /> {/* Line number */}
              <div className="flex gap-2">
                <Skeleton className="h-5 w-4 rounded-sm" /> {/* Indent */}
                <Skeleton className="h-5 w-48 rounded-sm" /> {/* Keyword */}
                <Skeleton className="h-5 w-64 rounded-sm" /> {/* Variable */}
                <Skeleton className="h-5 w-4 rounded-sm" /> {/* Operator */}
                <Skeleton className="h-5 w-32 rounded-sm" /> {/* Value */}
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-5 w-4 rounded-sm" /> {/* Indent */}
                <Skeleton className="h-5 w-72 rounded-sm" />{' '}
                {/* Function call */}
                <Skeleton className="h-5 w-4 rounded-sm" /> {/* Parenthesis */}
                <Skeleton className="h-5 w-48 rounded-sm" /> {/* Argument */}
                <Skeleton className="h-5 w-4 rounded-sm" /> {/* Parenthesis */}
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-5 w-4 rounded-sm" /> {/* Indent */}
                <Skeleton className="h-5 w-96 rounded-sm" /> {/* Comment */}
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-5 w-4 rounded-sm" /> {/* Indent */}
                <Skeleton className="h-5 w-80 rounded-sm" /> {/* Code block */}
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-5 w-4 rounded-sm" /> {/* Indent */}
                <Skeleton className="h-5 w-40 rounded-sm" /> {/* Keyword */}
                <Skeleton className="h-5 w-72 rounded-sm" /> {/* Condition */}
              </div>
              <div className="flex gap-2 pl-6">
                <Skeleton className="h-5 w-4 rounded-sm" />{' '}
                {/* Nested indent */}
                <Skeleton className="h-5 w-96 rounded-sm" /> {/* Nested code */}
              </div>
              <div className="flex gap-2 pl-6">
                <Skeleton className="h-5 w-4 rounded-sm" />{' '}
                {/* Nested indent */}
                <Skeleton className="h-5 w-64 rounded-sm" /> {/* Nested code */}
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-5 w-4 rounded-sm" /> {/* Indent */}
                <Skeleton className="h-5 w-48 rounded-sm" />{' '}
                {/* Closing brace */}
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-5 w-4 rounded-sm" /> {/* Indent */}
                <Skeleton className="h-5 w-80 rounded-sm" /> {/* Code block */}
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-5 w-4 rounded-sm" /> {/* Indent */}
                <Skeleton className="h-5 w-56 rounded-sm" /> {/* Variable */}
                <Skeleton className="h-5 w-4 rounded-sm" /> {/* Operator */}
                <Skeleton className="h-5 w-64 rounded-sm" /> {/* Value */}
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-5 w-4 rounded-sm" /> {/* Indent */}
                <Skeleton className="h-5 w-72 rounded-sm" />{' '}
                {/* Function call */}
              </div>
              <div className="flex gap-2 pl-6">
                <Skeleton className="h-5 w-4 rounded-sm" />{' '}
                {/* Nested indent */}
                <Skeleton className="h-5 w-88 rounded-sm" /> {/* Nested code */}
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-5 w-4 rounded-sm" /> {/* Indent */}
                <Skeleton className="h-5 w-40 rounded-sm" />{' '}
                {/* Closing brace */}
              </div>
            </div>
          </div>
        )}
      </div>
    </SidebarInset>
  )
}
