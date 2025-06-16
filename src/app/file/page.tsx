'use client'
import React from 'react'
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
import { ForwardRefEditor } from '@/components/MDXEditor/ForwardRefEditor'
import { getFileContent } from '../actions'
import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'next/navigation'
import { type ApiResponse } from '../types'

export default function Home() {
  const { data: session } = useSession()
  const searchParams = useSearchParams()

  const repo = searchParams.get('repo')
  const path = searchParams.get('path')
  const owner = searchParams.get('owner')

  console.log('repo ->', repo)
  console.log('path ->', path)

  const { data: fileResponse, error } = useQuery<ApiResponse<string>>({
    queryKey: ['file', repo, path],
    queryFn: () => getFileContent(repo ?? '', path ?? '', owner ?? ''),
    enabled: !!repo && !!path && !!owner,
  })

  console.log('file ->', fileResponse)

  const markdown = fileResponse?.data
    ? `\`\`\`${path?.split('.').pop() ?? ''}\n${fileResponse.data}\n\`\`\``
    : ''

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
        {session?.user && <ForwardRefEditor markdown={markdown} />}
      </div>
    </SidebarInset>
  )
}
