'use client'

import * as React from 'react'

import { useSession } from 'next-auth/react'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import {
  createOnDropHandler,
  dragAndDropFeature,
  hotkeysCoreFeature,
  insertItemsAtTarget,
  keyboardDragAndDropFeature,
  selectionFeature,
  syncDataLoaderFeature,
} from '@headless-tree/core'
import { AssistiveTreeDescription, useTree } from '@headless-tree/react'
import {
  RiBracesLine,
  RiCodeSSlashLine,
  RiFileLine,
  RiFileTextLine,
  RiImageLine,
  RiReactjsLine,
  RiAddLine,
} from '@remixicon/react'
import Link from 'next/link'

import { NavUser } from '@/components/nav-user'
import { RepoSwitcher } from '@/components/repo-switcher'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar'
import { Tree, TreeItem, TreeItemLabel } from '@/components/tree'
import { getRepos, getRepoTree } from '@/app/actions'
import type { Item, Repo } from '@/app/types'
import { transformTreeData } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from './ui/button'

interface ApiResponse<T> {
  code: number
  data: T
  message?: string
}

interface RepoTree {
  sha: string
  url: string
  tree: Array<{
    path: string
    mode: string
    type: string
    sha: string
    url: string
    size?: number
  }>
}

// Helper function to get icon based on file extension
function getFileIcon(extension: string | undefined, className: string) {
  switch (extension) {
    case 'tsx':
    case 'jsx':
      return <RiReactjsLine className={className} />
    case 'ts':
    case 'js':
    case 'mjs':
      return <RiCodeSSlashLine className={className} />
    case 'json':
      return <RiBracesLine className={className} />
    case 'svg':
    case 'ico':
    case 'png':
    case 'jpg':
      return <RiImageLine className={className} />
    case 'md':
      return <RiFileTextLine className={className} />
    default:
      return <RiFileLine className={className} />
  }
}

const indent = 20

function SkeletonTree() {
  return (
    <div className="flex h-full flex-col gap-2 *:first:grow">
      <div className="space-y-1">
        {/* Root folder */}
        <div className="flex h-7 items-center gap-2 px-2">
          <Skeleton className="size-6 rounded-sm" />
          <Skeleton className="h-6 w-48 rounded-sm" />
        </div>

        {/* First level items */}
        <div className="space-y-1 pl-6">
          {/* Folder */}
          <div className="flex h-7 items-center gap-2 px-2">
            <Skeleton className="size-6 rounded-sm" />
            <Skeleton className="h-6 w-64 rounded-sm" />
          </div>

          {/* Files */}
          <div className="space-y-1 pl-6">
            <div className="flex h-7 items-center gap-2 px-2">
              <Skeleton className="size-6 rounded-sm" />
              <Skeleton className="h-6 w-56 rounded-sm" />
            </div>
            <div className="flex h-7 items-center gap-2 px-2">
              <Skeleton className="size-6 rounded-sm" />
              <Skeleton className="h-6 w-64 rounded-sm" />
            </div>
          </div>

          {/* Another folder */}
          <div className="flex h-7 items-center gap-2 px-2">
            <Skeleton className="size-6 rounded-sm" />
            <Skeleton className="h-6 w-48 rounded-sm" />
          </div>

          {/* More files */}
          <div className="space-y-1 pl-6">
            <div className="flex h-7 items-center gap-2 px-2">
              <Skeleton className="size-6 rounded-sm" />
              <Skeleton className="h-6 w-56 rounded-sm" />
            </div>
            <div className="flex h-7 items-center gap-2 px-2">
              <Skeleton className="size-6 rounded-sm" />
              <Skeleton className="h-6 w-48 rounded-sm" />
            </div>
            <div className="flex h-7 items-center gap-2 px-2">
              <Skeleton className="size-6 rounded-sm" />
              <Skeleton className="h-6 w-64 rounded-sm" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function FileTree({
  activeRepo,
  repoTree,
}: {
  activeRepo: Repo | null
  repoTree: RepoTree
}) {
  const { data: session } = useSession()
  const [items, setItems] = useState<Record<string, Item> | null>({
    ...transformTreeData(repoTree?.tree),
    adrs: {
      name: 'adrs',
      children: ['adrs/0001-initial-adr.md'],
    },
    'adrs/0001-initial-adr.md': {
      name: '0001-initial-adr.md',
      fileExtension: 'md',
    },
  })
  const [adrCount, setAdrCount] = useState(1)

  const addNewAdr = () => {
    setItems((prevItems) => {
      if (!prevItems) return null
      const newCount = adrCount + 1
      const newAdrName = `000${newCount}-adr-${newCount}.md`
      const adrsFolder = prevItems.adrs

      const newItems: Record<string, Item> = {
        ...prevItems,
        adrs: {
          name: 'adrs',
          children: [...(adrsFolder?.children ?? []), `adrs/${newAdrName}`],
        },
        [`adrs/${newAdrName}`]: {
          name: newAdrName,
          fileExtension: 'md',
        },
      }
      return newItems
    })

    const adrsItem = tree.getItems().find((item) => item.getId() === 'adrs')
    if (!adrsItem) return

    adrsItem.collapse()
    setTimeout(() => {
      adrsItem.expand()
    }, 0)

    setAdrCount(adrCount + 1)
  }

  const tree = useTree<Item>({
    initialState: {
      expandedItems: ['root', 'adrs'],
      selectedItems: [],
    },
    indent,
    rootItemId: 'root',
    getItemName: (item) => item.getItemData()?.name ?? 'Unknown',
    isItemFolder: (item) => (item.getItemData()?.children?.length ?? 0) > 0,
    canReorder: true,
    onDrop: createOnDropHandler((parentItem, newChildrenIds) => {
      setItems((prevItems) => {
        if (!prevItems) return null
        // Sort the children alphabetically
        const sortedChildren = [...newChildrenIds].sort((a, b) => {
          const itemA = prevItems[a]
          const itemB = prevItems[b]

          if (!itemA || !itemB || newChildrenIds.length === 0) return 0

          // First sort folders before files
          const isAFolder = (itemA?.children?.length ?? 0) > 0
          const isBFolder = (itemB?.children?.length ?? 0) > 0

          if (isAFolder && !isBFolder) return -1
          if (!isAFolder && isBFolder) return 1

          // Then sort alphabetically by name
          return (itemA?.name ?? '').localeCompare(itemB?.name ?? '')
        })

        const parentId = parentItem.getId()
        const parentData = prevItems[parentId]
        if (!parentData) return prevItems

        return {
          ...prevItems,
          [parentId]: {
            ...parentData,
            children: sortedChildren,
          },
        }
      })
    }),
    dataLoader: {
      getItem: (itemId) => {
        if (itemId === 'root') {
          const rootItem = {
            name: activeRepo?.name ?? 'Root',
            children: items
              ? [
                  'adrs',
                  ...Object.keys(items).filter(
                    (key) => !key.includes('/') && key !== 'adrs',
                  ),
                ]
              : [],
          }
          return rootItem
        }
        const item = items?.[itemId] ?? { name: 'Unknown' }
        return item
      },
      getChildren: (itemId) => {
        if (itemId === 'root') {
          const rootChildren = items
            ? [
                'adrs',
                ...Object.keys(items).filter(
                  (key) => !key.includes('/') && key !== 'adrs',
                ),
              ]
            : []
          return rootChildren
        }
        const children = items?.[itemId]?.children ?? []
        return children
      },
    },
    features: [
      syncDataLoaderFeature,
      selectionFeature,
      hotkeysCoreFeature,
      dragAndDropFeature,
      keyboardDragAndDropFeature,
    ],
  })

  if (!items) {
    return <SkeletonTree />
  }

  return (
    <div className="flex h-full flex-col gap-2 *:first:grow">
      <div>
        <div className="py-4 px-3">
          <Button onClick={addNewAdr} className="w-full" variant="default">
            <RiAddLine className="size-4" />
            Add ADR
          </Button>
        </div>
        <Tree
          className="relative before:absolute before:inset-0 before:-ms-1 before:bg-[repeating-linear-gradient(to_right,transparent_0,transparent_calc(var(--tree-indent)-1px),var(--border)_calc(var(--tree-indent)-1px),var(--border)_calc(var(--tree-indent)))]"
          indent={indent}
          tree={tree}
        >
          <AssistiveTreeDescription tree={tree} />
          {tree.getItems().map((item) => {
            const itemData = item.getItemData()
            const isFile = !item.isFolder()
            const filePath = item.getId()
            const isAdrsFolder = filePath === 'adrs'
            const isAdrFile = filePath.startsWith('adrs/')

            return (
              <TreeItem key={item.getId()} item={item} className="pb-0!">
                <TreeItemLabel className="rounded-none py-1">
                  {isFile ? (
                    <Link
                      href={{
                        pathname: '/file',
                        query: {
                          author: session?.user?.gitUsername,
                          repo: activeRepo?.name,
                          path: filePath,
                        },
                      }}
                      className="flex items-center gap-2 w-full"
                    >
                      {getFileIcon(
                        itemData?.fileExtension,
                        'text-muted-foreground pointer-events-none size-4',
                      )}
                      {item.getItemName()}
                    </Link>
                  ) : (
                    <span className="flex items-center gap-2">
                      {item.getItemName()}
                    </span>
                  )}
                </TreeItemLabel>
              </TreeItem>
            )
          })}
        </Tree>
      </div>
    </div>
  )
}

export function AppSidebar({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()
  const { data: reposData } = useQuery({
    queryKey: ['repos'],
    queryFn: getRepos,
  })
  const [activeRepo, setActiveRepo] = useState<Repo | null>(null)

  // Query for repo tree when activeRepo changes
  const { data: repoTree } = useQuery<ApiResponse<RepoTree> | null>({
    queryKey: ['repoTree', activeRepo?.name, activeRepo?.owner?.login],
    queryFn: () =>
      getRepoTree(
        activeRepo?.name ?? '',
        activeRepo?.default_branch ?? '',
        activeRepo?.owner?.login ?? '',
      ),
    enabled: !!activeRepo,
  })

  return (
    <div className="flex h-screen w-full">
      <Sidebar collapsible="icon" className="h-screen">
        <SidebarHeader>
          <RepoSwitcher
            repos={reposData?.data ?? []}
            activeRepo={activeRepo}
            setActiveRepo={setActiveRepo}
          />
        </SidebarHeader>
        <SidebarContent>
          {activeRepo && repoTree?.data ? (
            <FileTree activeRepo={activeRepo} repoTree={repoTree.data} />
          ) : (
            <SkeletonTree />
          )}
        </SidebarContent>
        <SidebarFooter>
          <NavUser user={session?.user ?? null} />
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
      <div className="flex-1 overflow-auto h-screen">{children}</div>
    </div>
  )
}
