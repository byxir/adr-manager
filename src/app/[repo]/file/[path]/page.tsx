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
import { templateMarkdownAtom } from '../../layout'
import { useAtom } from 'jotai'

export default function FilePage() {
  const { data: session } = useSession()
  const { repo, path }: { repo: string; path: string } = useParams()

  const searchParams = useSearchParams()

  const formattedPath = path.replaceAll('~', '/')

  const owner = searchParams.get('owner')

  const [templateMarkdown, setTemplateMarkdown] = useAtom(templateMarkdownAtom)

  const { data: fileResponse, isLoading } = useQuery<
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
      setTemplateMarkdown(
        `\`\`\`${path?.split('.').pop() ?? ''}\n${fileResponse.data.content}\n\`\`\``,
      )
    }
  }, [fileResponse])

  return (
    <SidebarInset>
      <div className="h-screen">
        {session?.user && templateMarkdown && !isLoading && (
          <DisplayFileContents markdown={templateMarkdown} />
        )}
        {session?.user && isLoading && <SkeletonEditor />}
      </div>
    </SidebarInset>
  )
}
