/* eslint-disable jsx-a11y/alt-text */
/* eslint-disable @next/next/no-img-element */
'use client'

import * as React from 'react'
import { ChevronsUpDown } from 'lucide-react'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import type { Repo } from '@/definitions/types'
import { useRouter } from 'next/navigation'

export function RepoSwitcher({
  repos,
  activeRepo,
  owner,
}: {
  repos: Repo[]
  activeRepo: string | null
  owner: string | undefined | null
}) {
  const { isMobile } = useSidebar()
  const router = useRouter()

  if (!activeRepo) {
    return null
  }

  const handleSwitchRepo = (repo: Repo) => {
    router.push(
      `/${repo.name}?owner=${repo.owner.name}&branch=${repo.default_branch}`,
    )
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                {repos.find((repo) => repo.name === activeRepo)?.owner
                  .avatar ? (
                  <img
                    src={
                      repos.find((repo) => repo.name === activeRepo)?.owner
                        .avatar ?? ''
                    }
                    className="rounded-lg"
                  />
                ) : null}
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{activeRepo}</span>
                <span className="truncate text-xs">{owner}</span>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg max-h-96"
            align="start"
            side={isMobile ? 'bottom' : 'right'}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-muted-foreground text-xs">
              Repos
            </DropdownMenuLabel>
            {repos.map((repo, index) => (
              <DropdownMenuItem
                key={repo.id}
                onClick={() => handleSwitchRepo(repo)}
                className="gap-2 p-2"
              >
                <div className="flex size-6 items-center justify-center rounded-md border">
                  <img
                    src={repo.owner.avatar ?? ''}
                    alt={repo.owner.name}
                    className="size-3.5 shrink-0"
                  />
                </div>
                {repo.name}
                <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
