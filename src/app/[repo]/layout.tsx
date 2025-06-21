'use client'
import { AppSidebar } from '@/components/app-sidebar'
import { SidebarProvider } from '@/components/ui/sidebar'
import { useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { useRepoTree, useRepoAdrs } from '@/hooks/use-repo-queries'

export default function RepoLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { repo } = useParams()
  const searchParams = useSearchParams()
  const owner = searchParams.get('owner')
  const branch = searchParams.get('branch')

  const activeRepo = repo as string

  const adrs = useRepoAdrs(activeRepo)
  const { data: repoTree } = useRepoTree(activeRepo, owner, branch)

  return (
    <SidebarProvider>
      <AppSidebar
        repoTree={repoTree?.data ?? null}
        activeRepo={activeRepo}
        adrs={adrs ?? null}
        owner={owner ?? null}
        // repos={repos?.data ?? null}
      >
        {children}
      </AppSidebar>
    </SidebarProvider>
  )
}
