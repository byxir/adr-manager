'use client'
import { AppSidebar } from '@/components/app-sidebar'
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { useParams, useSearchParams, usePathname } from 'next/navigation'
import {
  useRepoAdrs,
  useRepos,
  useRepoTree,
  useAdr,
} from '@/hooks/use-repo-queries'
import { atom } from 'jotai'
import {
  RightSidebarProvider,
  RightSidebarTrigger,
} from '@/components/ui/right-sidebar'
import { Separator } from '@radix-ui/react-separator'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import Link from 'next/link'
import FirstTimeTour from '@/components/tour'
import React, { useState, useEffect } from 'react'
import type { Adr } from '@/lib/dexie-db'

export const markdownAtom = atom<string>('')
export const templateMarkdownAtom = atom<string>('')
export const syncMarkdownAtom = atom<string>('')

export const leftSidebarOpenAtom = atom<boolean>(false)
export const rightSidebarOpenAtom = atom<boolean>(false)

export default function RepoLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { repo, path } = useParams()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  console.log('pathname', pathname)
  const owner = searchParams.get('owner')
  const branch = searchParams.get('branch')

  const activeRepo = repo as string

  const adrs = useRepoAdrs(activeRepo)
  const repoTree = useRepoTree(activeRepo, owner, branch)
  const { data: repos, error: reposError } = useRepos()

  const repoOwner = repos?.data?.find((repo) => repo.name === activeRepo)?.owner
    ?.name

  const repoDefaultBranch =
    repos?.data?.find((repo) => repo.name === activeRepo)?.default_branch ??
    null

  // State for selected ADR
  const [selectedAdr, setSelectedAdr] = useState<Adr | null>(null)

  // Extract ADR name from pathname if we're viewing an ADR
  const isAdrPage = pathname.includes('/adr/')
  const currentAdrName =
    isAdrPage && path
      ? ((path as string)
          .replaceAll('~', '/')
          .split('/')
          .filter(Boolean)
          .pop() ?? '')
      : ''
  const formattedPath =
    isAdrPage && path ? (path as string).replaceAll('~', '/') : ''

  // Use the custom hook to get current ADR data if we're on an ADR page
  const currentAdrQuery = useAdr(
    currentAdrName,
    activeRepo,
    owner ?? repoOwner,
    branch ?? repoDefaultBranch,
    formattedPath,
    repoTree.data?.data,
    repoTree.isFetching || repoTree.isLoading,
  )

  // Update selectedAdr when current ADR query data changes
  useEffect(() => {
    if (isAdrPage && currentAdrQuery.data?.adr) {
      setSelectedAdr(currentAdrQuery.data.adr)
    } else if (!isAdrPage) {
      setSelectedAdr(null)
    }
  }, [isAdrPage, currentAdrQuery.data?.adr])

  return (
    <div>
      <SidebarProvider>
        <RightSidebarProvider>
          <AppSidebar
            repoTree={repoTree.data?.data ?? null}
            activeRepo={activeRepo}
            adrs={adrs ?? null}
            owner={owner ?? repoOwner}
            branch={branch ?? repoDefaultBranch}
            selectedAdr={selectedAdr}
            setSelectedAdr={setSelectedAdr}
          >
            <header className="flex w-full max-w-[calc(100%-312px)] h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
              <div className="flex items-center gap-2 px-4 w-full justify-between">
                <div className="flex items-center gap-2">
                  <SidebarTrigger className="-ml-1" />

                  <Separator
                    orientation="vertical"
                    className="mr-2 data-[orientation=vertical]:h-4"
                  />
                  <Breadcrumb>
                    <BreadcrumbList>
                      <BreadcrumbItem className="hidden md:block">
                        <Link
                          href={`/${activeRepo}?owner=${owner}&branch=${branch}`}
                        >
                          {activeRepo}
                        </Link>
                      </BreadcrumbItem>
                      {pathname.replace(`/${activeRepo}`, '').length > 0 && (
                        <>
                          <BreadcrumbSeparator className="hidden md:block" />

                          <BreadcrumbItem>
                            <BreadcrumbPage>
                              {pathname
                                .replace(`/${activeRepo}`, '')
                                .replaceAll('~', '/')}
                            </BreadcrumbPage>
                          </BreadcrumbItem>
                        </>
                      )}
                    </BreadcrumbList>
                  </Breadcrumb>
                </div>
                {pathname.includes('/adr/') && (
                  <div className="flex items-center gap-2">
                    <Separator
                      orientation="vertical"
                      className="ml-2 data-[orientation=vertical]:h-4"
                    />

                    <RightSidebarTrigger className="-ml-1" />
                  </div>
                )}
              </div>
            </header>
            {children}
          </AppSidebar>
        </RightSidebarProvider>
      </SidebarProvider>
      <FirstTimeTour />
    </div>
  )
}
