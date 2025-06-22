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
import { getFileContent } from '@/app/actions'
import { useQuery } from '@tanstack/react-query'
import { useParams, useSearchParams } from 'next/navigation'
import DisplayFileContents from './display-file-contents'
import { SkeletonEditor } from '@/lib/helpers'
import type { ApiResponse } from '@/definitions/types'

export default function FilePage() {
  const { data: session } = useSession()
  const { repo, path }: { repo: string; path: string } = useParams()

  const searchParams = useSearchParams()

  const formattedPath = path.replaceAll('~', '/')

  const owner = searchParams.get('owner')

  const [markdown, setMarkdown] = useState<string | null>(null)

  const { data: fileResponse, error } = useQuery<
    ApiResponse<{
      content: string
      name: string
      path: string
      sha: string
    }>
  >({
    queryKey: ['file', repo, formattedPath],
    queryFn: () => getFileContent(repo ?? '', formattedPath ?? '', owner ?? ''),
    enabled: !!repo && !!path && !!owner,
  })

  useEffect(() => {
    if (fileResponse) {
      setMarkdown(
        `\`\`\`${path?.split('.').pop() ?? ''}\n${fileResponse.data.content}\n\`\`\``,
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
        {session?.user && !markdown && <SkeletonEditor />}
      </div>
    </SidebarInset>
  )
}
