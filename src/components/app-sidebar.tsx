'use client'

import * as React from 'react'
import { useEffect, useState, useMemo } from 'react'

import { useSession } from 'next-auth/react'
import { useQueryClient } from '@tanstack/react-query'
import {
  dragAndDropFeature,
  hotkeysCoreFeature,
  keyboardDragAndDropFeature,
  selectionFeature,
  syncDataLoaderFeature,
} from '@headless-tree/core'
import { AssistiveTreeDescription, useTree } from '@headless-tree/react'
import { RiAddLine, RiEditLine, RiDeleteBinLine } from '@remixicon/react'
import { NavUser } from '@/components/nav-user'
import { RepoSwitcher } from '@/components/repo-switcher'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Tree, TreeItem, TreeItemLabel } from '@/components/tree'
import type { Item, RepoTree } from '@/definitions/types'
import { transformAndAppendTreeData } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from './ui/button'
import { createAdr, deleteAdr, updateAdrName } from '@/lib/adr-db-actions'
import { deleteFile, moveFile } from '@/app/actions'
import { useRouter, usePathname } from 'next/navigation'
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
  selectedAdr,
  setSelectedAdr,
  repoTree,
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
  selectedAdr: Adr | null
  setSelectedAdr: (adr: Adr | null) => void
  repoTree: RepoTree | null
}) {
  const router = useRouter()
  const pathname = usePathname()
  const queryClient = useQueryClient()

  // Dialog states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editName, setEditName] = useState('')

  // Search states
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Get matching files for search results
  const searchResults = useMemo(() => {
    if (!items || !debouncedSearchQuery) return []

    const query = debouncedSearchQuery.toLowerCase()
    const results: Array<{ id: string; item: Item }> = []

    // Helper function to recursively find matching files
    const findMatchingFiles = (itemId: string, visited = new Set<string>()) => {
      if (visited.has(itemId)) return
      visited.add(itemId)

      const item = items[itemId]
      if (!item) return

      // If it's a file (not folder) and matches the query
      if (!item.isFolder && item.name?.toLowerCase().includes(query)) {
        results.push({ id: itemId, item })
      }

      // Recursively search children
      if (item.children) {
        item.children.forEach((childId) => findMatchingFiles(childId, visited))
      }
    }

    // Start search from all root items
    Object.keys(items).forEach((itemId) => {
      if (!itemId.includes('/') && itemId !== 'root') {
        findMatchingFiles(itemId)
      }
    })

    // Sort results with ADR files first
    return results.sort((a, b) => {
      const aIsAdr = a.item.isAdr === true
      const bIsAdr = b.item.isAdr === true

      if (aIsAdr && !bIsAdr) return -1
      if (!aIsAdr && bIsAdr) return 1

      // If both are ADRs or both are not ADRs, sort alphabetically
      return (a.item.name ?? '').localeCompare(b.item.name ?? '')
    })
  }, [items, debouncedSearchQuery])

  const handleFileClick = async (filePath: string, item: Item) => {
    if (!activeRepo) return

    if (item.isAdr) {
      // If it's an ADR in the database, route to the ADR page
      router.push(
        `/${activeRepo}/adr/${filePath.replaceAll('/', '~')}?owner=${owner}&branch=${branch}`,
      )
    } else {
      // Otherwise, route to the file page
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

  // Delete handler
  const handleDeleteAdr = async () => {
    if (!selectedAdr || !activeRepo || !owner || !branch) return

    try {
      // Check if we're currently viewing the ADR being deleted
      const currentAdrPath = `/${activeRepo}/adr/${selectedAdr.path.replaceAll('/', '~')}`
      const isCurrentlyViewing = pathname === currentAdrPath

      // Check if the ADR exists in the repository before attempting to delete it
      const adrExistsInRepo =
        repoTree?.tree?.some((item) => item.path === selectedAdr.path) ?? false

      // Only delete from GitHub if the file actually exists in the repository
      if (adrExistsInRepo) {
        await deleteFile({
          repo: activeRepo,
          path: selectedAdr.path,
          owner: owner,
          sha: selectedAdr.sha ?? '',
          branch: branch,
        })
      }

      // Always delete from local database
      await deleteAdr(selectedAdr.id)

      // Wait a bit for the live query to update before invalidating the repo tree
      // This ensures the tree transformation happens with the updated ADRs data
      await new Promise((resolve) => setTimeout(resolve, 100))

      await queryClient.invalidateQueries({
        queryKey: ['repoTree', activeRepo, owner, branch],
      })

      // Redirect to repo page if we were viewing the deleted ADR
      if (isCurrentlyViewing) {
        router.push(`/${activeRepo}?owner=${owner}&branch=${branch}`)
      }

      setDeleteDialogOpen(false)
      setSelectedAdr(null)
    } catch (error) {
      console.error('Error deleting ADR:', error)
    }
  }

  // Edit handler
  const handleEditAdr = async () => {
    if (!selectedAdr || !editName.trim() || !activeRepo || !owner || !branch)
      return

    try {
      const newName = editName.endsWith('.md') ? editName : `${editName}.md`
      const newPath = `adrs/${newName}`

      // Check if we're currently viewing the ADR being edited
      const currentAdrPath = `/${activeRepo}/adr/${selectedAdr.name}`
      const isCurrentlyViewing = pathname === currentAdrPath

      // Check if the ADR exists in the repository before attempting to move it
      const adrExistsInRepo =
        repoTree?.tree?.some((item) => item.path === selectedAdr.path) ?? false

      // If the path is different and file exists in repo, move the file in GitHub
      if (selectedAdr.path !== newPath && adrExistsInRepo) {
        await moveFile({
          repo: activeRepo,
          oldPath: selectedAdr.path,
          newPath: newPath,
          owner: owner,
          sha: selectedAdr.sha ?? '',
          branch: branch,
          content: selectedAdr.contents ?? '',
        })
      } else if (selectedAdr.path !== newPath) {
      }

      // Update the local database
      await updateAdrName(selectedAdr.id, newName, newPath)

      // Wait a bit for the live query to update before invalidating the repo tree
      // This ensures the tree transformation happens with the updated ADRs data
      await new Promise((resolve) => setTimeout(resolve, 100))

      // Invalidate the repo tree query to trigger a proper refresh
      await queryClient.invalidateQueries({
        queryKey: ['repoTree', activeRepo, owner, branch],
      })

      // Redirect to new ADR name if we were viewing the edited ADR
      if (isCurrentlyViewing) {
        router.push(
          `/${activeRepo}/adr/${newName}?owner=${owner}&branch=${branch}`,
        )
      }

      setEditDialogOpen(false)
      setSelectedAdr(null)
      setEditName('')
    } catch (error) {
      console.error('Error editing ADR:', error)
    }
  }

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

    canDrag: () => false,

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
    // Check if this is the first ADR being created
    const isFirstAdr = !adrs || adrs.length === 0

    // Check for existing ADRs with similar names in database
    const existingNamesFromDb = adrs?.map((adr) => adr.name) ?? []

    // Check for existing ADRs in the file tree
    const existingNamesFromTree: string[] = []
    if (items) {
      Object.values(items).forEach((item) => {
        if (item.isAdr && item.name) {
          existingNamesFromTree.push(item.name)
        }
      })
    }

    // Combine both sources of existing names
    const existingNames = [...existingNamesFromDb, ...existingNamesFromTree]

    // Find the highest existing number
    let maxNumber = 0
    const adrPattern = /^(\d{4})-adr\.md$/
    existingNames.forEach((name) => {
      // Match pattern like "0001-adr.md"
      if (name) {
        const match = adrPattern.exec(name)
        if (match?.[1]) {
          const number = parseInt(match[1], 10)
          if (number > maxNumber) {
            maxNumber = number
          }
        }
      }
    })

    // Use next number after the highest
    const counter = maxNumber + 1
    const newAdrName = `${counter.toString().padStart(4, '0')}-adr.md`

    const preparedAdr = {
      id: uuidv4(),
      name: newAdrName,
      path: `adrs/${newAdrName}`,
      contents: '',
      repository: activeRepo ?? '',
      createdAt: new Date(),
      branch: branch ?? '',
      owner: owner ?? '',
      templateId: 'free-form',
      lastFetched: null,
    }

    try {
      await createAdr(preparedAdr)

      await new Promise((resolve) => setTimeout(resolve, 100))

      // If this is the first ADR, simulate invalidation by closing and reopening the root element
      if (isFirstAdr) {
        // Create the "adrs" folder and new ADR file in the tree structure
        setItems((prevItems) => {
          if (!prevItems) return null

          const newItems = { ...prevItems }

          // Create or update the "adrs" folder
          if (!newItems.adrs) {
            newItems.adrs = {
              name: 'adrs',
              isFolder: true,
              isAdr: false,
              children: [],
            }

            // Add "adrs" folder to root's children if not already there
            if (newItems.root && !newItems.root.children?.includes('adrs')) {
              newItems.root = {
                ...newItems.root,
                children: [...(newItems.root.children ?? []), 'adrs'],
              }
            }
          }

          // Create the new ADR file
          const adrId = `adrs/${newAdrName}`
          newItems[adrId] = {
            name: newAdrName,
            isFolder: false,
            isAdr: true,
            children: [],
            fileExtension: '.md',
          }

          // Add the new ADR to the "adrs" folder's children
          if (newItems.adrs && !newItems.adrs.children?.includes(adrId)) {
            newItems.adrs = {
              ...newItems.adrs,
              children: [...(newItems.adrs.children ?? []), adrId],
            }
          }

          return newItems
        })
      }

      router.push(
        `/${activeRepo}/adr/adrs~${newAdrName}?owner=${owner}&branch=${branch}`,
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
        <div className="py-4 px-3 space-y-4">
          <Input
            type="text"
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
          {!debouncedSearchQuery && (
            <Button
              onClick={() => void addNewAdr()}
              className="w-full"
              variant="default"
            >
              <RiAddLine className="size-4" />
              Add ADR
            </Button>
          )}
        </div>

        {debouncedSearchQuery ? (
          // Search results list
          <div className="space-y-1 px-2">
            {searchResults.length > 0 ? (
              searchResults.map(({ id, item }) => {
                const isAdr = item.isAdr === true
                return (
                  <div
                    key={id}
                    className="flex items-center justify-between w-full group py-1 px-2 hover:bg-muted rounded-md"
                  >
                    <div
                      onClick={() => handleFileClick(id, item)}
                      className="flex items-center gap-2 flex-1 text-left cursor-pointer"
                    >
                      {getFileIcon(
                        item.fileExtension,
                        'text-muted-foreground pointer-events-none size-4',
                      )}
                      {item.name}
                    </div>
                    {isAdr && (
                      <div className="flex items-center gap-1 opacity-100 transition-opacity cursor-pointer">
                        <div
                          className="h-6 w-6 p-0 flex justify-center items-center hover:bg-muted-foreground/10 rounded-md"
                          onClick={(e) => {
                            e.stopPropagation()
                            const adr = adrs?.find((a) => a.name === item.name)
                            if (adr) {
                              setSelectedAdr(adr)
                              setEditName(adr.name.replace('.md', ''))
                              setEditDialogOpen(true)
                            }
                          }}
                        >
                          <RiEditLine className="size-3" />
                        </div>
                        <div
                          className="h-6 w-6 p-0 text-destructive hover:text-destructive flex justify-center items-center hover:bg-muted-foreground/10 rounded-md"
                          onClick={(e) => {
                            e.stopPropagation()
                            const adr = adrs?.find((a) => a.name === item.name)
                            if (adr) {
                              setSelectedAdr(adr)
                              setDeleteDialogOpen(true)
                            }
                          }}
                        >
                          <RiDeleteBinLine className="size-3" />
                        </div>
                      </div>
                    )}
                  </div>
                )
              })
            ) : (
              <div className="px-2 py-4 text-center text-muted-foreground">
                No files found matching &quot;{debouncedSearchQuery}&quot;
              </div>
            )}
          </div>
        ) : (
          // Regular tree view
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
              const isAdr = itemData?.isAdr === true

              return (
                <TreeItem key={item.getId()} item={item} className="pb-0!">
                  <TreeItemLabel className="rounded-none py-1">
                    {isFile ? (
                      <div className="flex items-center justify-between w-full group">
                        <div
                          onClick={() => handleFileClick(filePath, itemData)}
                          className="flex items-center gap-2 flex-1 text-left cursor-pointer"
                        >
                          {getFileIcon(
                            itemData?.fileExtension,
                            'text-muted-foreground pointer-events-none size-4',
                          )}
                          {item.getItemName()}
                        </div>
                        {isAdr && (
                          <div className="flex items-center gap-1 opacity-100 transition-opacity cursor-pointer ">
                            <div
                              className="h-6 w-6 p-0 flex justify-center items-center hover:bg-muted-foreground/10 rounded-md"
                              onClick={(e) => {
                                e.stopPropagation()
                                const adr = adrs?.find(
                                  (a) => a.name === item.getItemName(),
                                )
                                if (adr) {
                                  setSelectedAdr(adr)
                                  setEditName(adr.name.replace('.md', ''))
                                  setEditDialogOpen(true)
                                }
                              }}
                            >
                              <RiEditLine className="size-3" />
                            </div>
                            <div
                              className="h-6 w-6 p-0 text-destructive hover:text-destructive flex justify-center items-center hover:bg-muted-foreground/10 rounded-md"
                              onClick={(e) => {
                                e.stopPropagation()
                                const adr = adrs?.find(
                                  (a) => a.name === item.getItemName(),
                                )
                                if (adr) {
                                  setSelectedAdr(adr)
                                  setDeleteDialogOpen(true)
                                }
                              }}
                            >
                              <RiDeleteBinLine className="size-3" />
                            </div>
                          </div>
                        )}
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
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete ADR</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{selectedAdr?.name}&quot;?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteAdr}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Name Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit ADR Name</DialogTitle>
            <DialogDescription>
              Enter a new name for the ADR file.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Input
              placeholder="ADR name"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  void handleEditAdr()
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditAdr} disabled={!editName.trim()}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
  selectedAdr,
  setSelectedAdr,
}: {
  children: React.ReactNode
  repoTree: RepoTree | null
  activeRepo: string | null
  owner: string | undefined | null
  adrs: Adr[] | null
  branch: string | null
  selectedAdr: Adr | null
  setSelectedAdr: (adr: Adr | null) => void
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
    <div className="flex h-full w-full">
      <Sidebar collapsible="icon" className="h-full z-0">
        <SidebarHeader>
          <RepoSwitcher
            repos={reposData?.data ?? []}
            activeRepo={activeRepo}
            owner={owner}
          />
        </SidebarHeader>
        <SidebarContent className="overflow-x-hidden fileTreeSidebar">
          {items ? (
            <FileTree
              activeRepo={activeRepo}
              items={items}
              setItems={handleSetItems}
              adrs={adrs}
              owner={owner}
              branch={branch}
              selectedAdr={selectedAdr}
              setSelectedAdr={setSelectedAdr}
              repoTree={repoTree}
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
      <div className="h-full overflow-hidden flex-shrink z-0 w-full">
        {children}
      </div>
    </div>
  )
}
