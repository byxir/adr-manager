'use client'
import { AppSidebar } from '@/components/app-sidebar'
import { SidebarProvider } from '@/components/ui/sidebar'
import { useParams, useSearchParams } from 'next/navigation'
import { useRepoAdrs, useRepos, useRepoTree } from '@/hooks/use-repo-queries'
import { atom } from 'jotai'
import { RightSidebarProvider } from '@/components/ui/right-sidebar'

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
  const { repo } = useParams()
  const searchParams = useSearchParams()
  const owner = searchParams.get('owner')
  const branch = searchParams.get('branch')

  const activeRepo = repo as string

  const adrs = useRepoAdrs(activeRepo)
  const { data: repoTree } = useRepoTree(activeRepo, owner, branch)
  const { data: repos, error: reposError } = useRepos()

  const repoOwner = repos?.data?.find((repo) => repo.name === activeRepo)?.owner
    ?.login

  const repoDefaultBranch =
    repos?.data?.find((repo) => repo.name === activeRepo)?.default_branch ??
    null

  return (
    <SidebarProvider>
      <RightSidebarProvider>
        <AppSidebar
          repoTree={repoTree?.data ?? null}
          activeRepo={activeRepo}
          adrs={adrs ?? null}
          owner={owner ?? repoOwner}
          branch={branch ?? repoDefaultBranch}
        >
          {children}
        </AppSidebar>
      </RightSidebarProvider>
    </SidebarProvider>
  )
}
