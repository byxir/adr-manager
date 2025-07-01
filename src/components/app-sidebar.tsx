'use client'

import * as React from 'react'
import { useEffect, useState } from 'react'

import { useSession } from 'next-auth/react'
import { useQueryClient } from '@tanstack/react-query'
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
import type { Item, RepoTree } from '@/definitions/types'
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
        <div className="flex h-7 items-center gap-2 px-2">
          <Skeleton className="size-6 rounded-sm" />
          <Skeleton className="h-6 w-48 rounded-sm" />
        </div>

        <div className="space-y-1 pl-6">
          <div className="flex h-7 items-center gap-2 px-2">
            <Skeleton className="size-6 rounded-sm" />
            <Skeleton className="h-6 w-64 rounded-sm" />
          </div>

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

          <div className="flex h-7 items-center gap-2 px-2">
            <Skeleton className="size-6 rounded-sm" />
            <Skeleton className="h-6 w-48 rounded-sm" />
          </div>

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
  owner,
  branch,
  adrs,
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
  owner: string | undefined | null
  branch: string | null
  adrs: Adr[] | null
}) {
  const router = useRouter()
  const queryClient = useQueryClient()

  const handleFileClick = async (filePath: string, fileName: string) => {
    if (!activeRepo) return

    const adr = await getAdrByNameAndRepository(fileName, activeRepo)

    if (adr && !adr.hasMatch) {
      router.push(
        `/${activeRepo}/adr/${fileName}?owner=${owner}&branch=${branch}`,
      )
    } else {
      router.push(
        `/${activeRepo}/file/${filePath.replaceAll('/', '~')}?owner=${owner}&branch=${branch}`,
      )
    }
  }

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
    isItemFolder: (item) => item.getItemData()?.isFolder,
    canReorder: true,
    canDrag: (items) => {
      return items.every((item) => item.getItemData()?.isAdr === true)
    },
    onDrop: createOnDropHandler((parentItem, newChildrenIds) => {
      setItems((prevItems: Record<string, Item> | null) => {
        if (!prevItems) return null

        const dropParentId = parentItem.getId()
        const isAdrsFolder =
          dropParentId === 'adrs' || prevItems[dropParentId]?.name === 'adrs'

        const sortedChildren = [...newChildrenIds].sort((a, b) => {
          const itemA = prevItems[a]
          const itemB = prevItems[b]

          if (!itemA || !itemB || newChildrenIds.length === 0) return 0

          if (itemA?.name === 'adrs') return -1
          if (itemB?.name === 'adrs') return 1

          if (isAdrsFolder && adrs) {
            const isAFile = (itemA?.children?.length ?? 0) === 0
            const isBFile = (itemB?.children?.length ?? 0) === 0

            if (isAFile && isBFile) {
              const adrA = adrs.find((adr) => adr.name === itemA?.name)
              const adrB = adrs.find((adr) => adr.name === itemB?.name)

              if (adrA && adrB) {
                return (
                  new Date(adrA.createdAt).getTime() -
                  new Date(adrB.createdAt).getTime()
                )
              }
            }
          }

          const isAFolder = (itemA?.children?.length ?? 0) > 0
          const isBFolder = (itemB?.children?.length ?? 0) > 0

          if (isAFolder && !isBFolder) return -1
          if (!isAFolder && isBFolder) return 1

          return (itemA?.name ?? '').localeCompare(itemB?.name ?? '')
        })

        const parentId = parentItem.getId()
        const parentData = prevItems[parentId]
        if (!parentData) return prevItems

        console.log('parentId', parentId)
        console.log('sortedChildren', sortedChildren)

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
            isFolder: true,
            isAdr: false,
          }
          return rootItem
        }
        const item = items?.[itemId] ?? {
          name: 'Unknown',
          isFolder: false,
          isAdr: false,
        }
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
          return rootChildren.sort((a, b) => {
            const itemA = items?.[a]
            const itemB = items?.[b]

            if (!itemA || !itemB) return 0

            if (itemA?.name === 'adrs') return -1
            if (itemB?.name === 'adrs') return 1

            const isAFolder = itemA?.isFolder
            const isBFolder = itemB?.isFolder

            if (isAFolder && !isBFolder) return -1
            if (!isAFolder && isBFolder) return 1

            return (itemA?.name ?? '').localeCompare(itemB?.name ?? '')
          })
        }
        const children = items?.[itemId]?.children ?? []

        const isAdrsFolder =
          itemId === 'adrs' || items?.[itemId]?.name === 'adrs'

        if (isAdrsFolder && adrs) {
          return [...children].sort((a, b) => {
            const itemA = items?.[a]
            const itemB = items?.[b]

            if (!itemA || !itemB) return 0

            const isAFile = !itemA?.isFolder
            const isBFile = !itemB?.isFolder

            if (isAFile && isBFile) {
              const adrA = adrs.find((adr) => adr.name === itemA?.name)
              const adrB = adrs.find((adr) => adr.name === itemB?.name)

              if (adrA && adrB) {
                return (
                  new Date(adrA.createdAt).getTime() -
                  new Date(adrB.createdAt).getTime()
                )
              }
            }

            const isAFolder = itemA?.isFolder
            const isBFolder = itemB?.isFolder

            if (isAFolder && !isBFolder) return -1
            if (!isAFolder && isBFolder) return 1

            return (itemA?.name ?? '').localeCompare(itemB?.name ?? '')
          })
        }

        return [...children].sort((a, b) => {
          const itemA = items?.[a]
          const itemB = items?.[b]

          if (!itemA || !itemB) return 0

          const isAFolder = itemA?.isFolder
          const isBFolder = itemB?.isFolder

          if (isAFolder && !isBFolder) return -1
          if (!isAFolder && isBFolder) return 1

          return (itemA?.name ?? '').localeCompare(itemB?.name ?? '')
        })
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

  useEffect(() => {
    if (items) {
      const adrsItem = tree.getItems().find((item) => item.getId() === 'adrs')
      if (adrsItem) {
        adrsItem.collapse()

        setTimeout(() => {
          adrsItem.expand()
        }, 0)
      }
    }
  }, [items])

  const addNewAdr = async () => {
    const newAdrName = `000${(adrs?.length ?? 0) + 1}-adr-${(adrs?.length ?? 0) + 1}.md`

    const preparedAdr = {
      id: uuidv4(),
      name: newAdrName,
      path: `adrs/${newAdrName}`,
      contents: '',
      repository: activeRepo ?? '',
      hasMatch: false,
      createdAt: new Date(),
      branch: branch ?? '',
      owner: owner ?? '',
      templateId: undefined,
    }

    try {
      await createAdr(preparedAdr)

      await new Promise((resolve) => setTimeout(resolve, 100))

      await queryClient.invalidateQueries({
        predicate: (query) => {
          const queryKey = query.queryKey
          return (
            queryKey.includes('adr') ||
            queryKey.includes('ADR') ||
            (Array.isArray(queryKey) &&
              queryKey.some(
                (key) =>
                  typeof key === 'string' &&
                  (key.includes('adr') || key === activeRepo),
              ))
          )
        },
      })

      router.push(
        `/${activeRepo}/adr/${newAdrName}?owner=${owner}&branch=${branch}`,
      )
    } catch (error) {
      console.error('Error creating ADR:', error)
    }
  }

  if (!items) {
    return <SkeletonTree />
  }

  return (
    <div className="flex h-full flex-col gap-2 *:first:grow">
      <div>
        <div className="py-4 px-3">
          <Button
            onClick={() => void addNewAdr()}
            className="w-full"
            variant="default"
          >
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
                      className="flex items-center gap-2 w-full text-left"
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
  branch,
}: {
  children: React.ReactNode
  repoTree: RepoTree | null
  activeRepo: string | null
  owner: string | undefined | null
  adrs: Adr[] | null
  branch: string | null
}) {
  const { data: session } = useSession()

  const [items, setItems] = useState<Record<string, Item> | null>(null)

  const { data: reposData, isLoading, error } = useRepos()

  useEffect(() => {
    const transformTree = async () => {
      if (repoTree?.tree && adrs && activeRepo) {
        const transformedItems = await transformAndAppendTreeData({
          tree: repoTree.tree,
          adrs: adrs ?? [],
          repository: activeRepo,
          branch: branch ?? '',
          owner: owner ?? '',
        })
        setItems(transformedItems)
      }
    }

    void transformTree()
  }, [repoTree?.tree, adrs])

  console.log('items', items)

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
              adrs={adrs}
              owner={owner}
              branch={branch}
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
      <div className="flex-1 h-screen overflow-hidden">{children}</div>
    </div>
  )
}
