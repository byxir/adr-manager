'use client'

import * as React from 'react'

import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import {
  createOnDropHandler,
  dragAndDropFeature,
  hotkeysCoreFeature,
  keyboardDragAndDropFeature,
  selectionFeature,
  syncDataLoaderFeature,
} from '@headless-tree/core'
import { AssistiveTreeDescription, useTree } from '@headless-tree/react'
import { RiAddLine } from '@remixicon/react'
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
import type { Item, RepoTree } from '@/app/types'
import { transformAndAppendTreeData } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from './ui/button'
import { createAdr, getAdrByNameAndRepository } from '@/lib/adr-db-actions'
import { useRouter } from 'next/navigation'
import type { Adr } from '@/lib/dexie-db'
import { getFileIcon } from '@/lib/helpers'
import { useRepos } from '@/hooks/use-repo-queries'
import { v4 as uuidv4 } from 'uuid'

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
  items,
  setItems,
  addNewAdr,
  owner,
}: {
  activeRepo: string | null
  items: Record<string, Item> | null
  setItems: (
    items:
      | Record<string, Item>
      | ((
          prevItems: Record<string, Item> | null,
        ) => Record<string, Item> | null),
  ) => void
  addNewAdr: () => void
  owner: string | null
}) {
  const router = useRouter()

  // Function to handle file clicks and check for ADRs
  const handleFileClick = async (filePath: string, fileName: string) => {
    if (!activeRepo) return

    // Check if this file is an ADR in the database
    const adr = await getAdrByNameAndRepository(fileName, activeRepo)

    if (adr && !adr.hasMatch) {
      // Redirect to ADR page
      router.push(`/${activeRepo}/adr/${fileName}`)
    } else {
      // Navigate to regular file page
      router.push(
        `/${activeRepo}/file/${filePath.replaceAll('/', '~')}?owner=${owner}`,
      )
    }
  }

  // Find any adrs folder to expand it
  const adrsFolderId = items
    ? Object.keys(items).find(
        (key) =>
          items[key]?.name?.startsWith('adrs') &&
          (items[key]?.children?.length ?? 0) > 0,
      )
    : null

  const tree = useTree<Item>({
    initialState: {
      expandedItems: ['root', ...(adrsFolderId ? [adrsFolderId] : [])],
      selectedItems: [],
    },
    indent,
    rootItemId: 'root',
    getItemName: (item) => item.getItemData()?.name ?? 'Unknown',
    isItemFolder: (item) => (item.getItemData()?.children?.length ?? 0) > 0,
    canReorder: true,
    onDrop: createOnDropHandler((parentItem, newChildrenIds) => {
      setItems((prevItems: Record<string, Item> | null) => {
        if (!prevItems) return null
        // Sort the children with "adrs" folder first, then folders, then files
        const sortedChildren = [...newChildrenIds].sort((a, b) => {
          const itemA = prevItems[a]
          const itemB = prevItems[b]

          if (!itemA || !itemB || newChildrenIds.length === 0) return 0

          // First, put "adrs" folder at the top
          if (itemA?.name === 'adrs') return -1
          if (itemB?.name === 'adrs') return 1

          // Then sort folders before files
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
            name: activeRepo ?? 'Root',
            children: items
              ? [
                  ...Object.keys(items).filter(
                    (key) => !key.includes('/') && key !== 'root',
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
                ...Object.keys(items).filter(
                  (key) => !key.includes('/') && key !== 'root',
                ),
              ]
            : []
          // Sort root children with "adrs" folder first
          return rootChildren.sort((a, b) => {
            const itemA = items?.[a]
            const itemB = items?.[b]

            if (!itemA || !itemB) return 0

            // First, put "adrs" folder at the top
            if (itemA?.name === 'adrs') return -1
            if (itemB?.name === 'adrs') return 1

            // Then sort folders before files
            const isAFolder = (itemA?.children?.length ?? 0) > 0
            const isBFolder = (itemB?.children?.length ?? 0) > 0

            if (isAFolder && !isBFolder) return -1
            if (!isAFolder && isBFolder) return 1

            // Then sort alphabetically by name
            return (itemA?.name ?? '').localeCompare(itemB?.name ?? '')
          })
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
          className="relative overflow-scroll before:absolute before:inset-0 before:-ms-1 before:bg-[repeating-linear-gradient(to_right,transparent_0,transparent_calc(var(--tree-indent)-1px),var(--border)_calc(var(--tree-indent)-1px),var(--border)_calc(var(--tree-indent)))]"
          indent={indent}
          tree={tree}
        >
          <AssistiveTreeDescription tree={tree} />
          {tree.getItems().map((item) => {
            const itemData = item.getItemData()
            const isFile = !item.isFolder()
            const filePath = item.getId()

            return (
              <TreeItem key={item.getId()} item={item} className="pb-0!">
                <TreeItemLabel className="rounded-none py-1">
                  {isFile ? (
                    <div
                      onClick={() =>
                        handleFileClick(filePath, item.getItemName())
                      }
                      className="flex items-center gap-2 w-full text-left hover:bg-accent hover:text-accent-foreground rounded-sm px-2 py-1"
                    >
                      {getFileIcon(
                        itemData?.fileExtension,
                        'text-muted-foreground pointer-events-none size-4',
                      )}
                      {item.getItemName()}
                    </div>
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

export function AppSidebar({
  children,
  repoTree,
  activeRepo,
  owner,
  adrs,
}: {
  children: React.ReactNode
  repoTree: RepoTree | null
  activeRepo: string | null
  owner: string | null
  adrs: Adr[] | null
}) {
  const { data: session } = useSession()

  const [items, setItems] = useState<Record<string, Item> | null>(null)

  const { data: reposData, isLoading, error } = useRepos()

  // Effect to handle async tree transformation
  useEffect(() => {
    const transformTree = async () => {
      if (repoTree?.tree && adrs && activeRepo) {
        const transformedItems = await transformAndAppendTreeData({
          tree: repoTree.tree,
          adrs: adrs ?? [],
          repository: activeRepo,
        })
        setItems(transformedItems)
      }
    }

    void transformTree()
  }, [repoTree?.tree, adrs])

  const addNewAdr = () => {
    const newAdrName = `000${(adrs?.length ?? 0) + 1}-adr-${(adrs?.length ?? 0) + 1}.md`

    void createAdr({
      id: uuidv4(),
      name: newAdrName,
      path: `adrs/${newAdrName}`,
      contents: '',
      repository: activeRepo ?? '',
      hasMatch: false,
    })
  }

  const handleSetItems = (
    items:
      | Record<string, Item>
      | ((
          prevItems: Record<string, Item> | null,
        ) => Record<string, Item> | null),
  ) => {
    setItems(items)
  }

  return (
    <div className="flex h-screen w-full">
      <Sidebar collapsible="icon" className="h-screen">
        <SidebarHeader>
          <RepoSwitcher
            repos={reposData?.data ?? []}
            activeRepo={activeRepo}
            owner={owner}
          />
        </SidebarHeader>
        <SidebarContent className="overflow-x-hidden">
          {items ? (
            <FileTree
              activeRepo={activeRepo}
              items={items}
              setItems={handleSetItems}
              addNewAdr={addNewAdr}
              owner={owner}
            />
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
