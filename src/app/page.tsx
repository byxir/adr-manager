/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
'use client'
import React from 'react'
import { Button } from '@/components/ui/button'
import { signIn, useSession } from 'next-auth/react'
import { useQuery } from '@tanstack/react-query'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'

import '@mdxeditor/editor/style.css'
import { AppSidebar } from '@/components/app-sidebar'
import { ForwardRefEditor } from '@/components/MDXEditor/ForwardRefEditor'

function getRepos() {
  return fetch('/api/git/repos').then((r) => r.json())
}
export default function Home() {
  const { data: session } = useSession()
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const { data } = useQuery({ queryKey: ['todos'], queryFn: getRepos })

  const markdown = `
Hello **world**!
`

  console.log(data)
  return (
    <div>
      <SidebarProvider>
        <AppSidebar />
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
                      Building Your Application
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Data Fetching</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </header>
          <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <div>
              <Button onClick={() => signIn('github')}>Sign in</Button>
              {session?.user?.name}
            </div>
            <ForwardRefEditor markdown={markdown} />
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  )
}
