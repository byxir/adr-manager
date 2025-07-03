import type { Item, RepoTree } from '@/definitions/types'
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { Adr } from './dexie-db'
import {
  updateAdrContentAndPath,
  createAdr,
  updateAdrPath,
} from './adr-db-actions'
import { useEffect, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const transformAndAppendTreeData = async ({
  tree,
  adrs,
  repository,
  branch,
  owner,
}: {
  tree: RepoTree['tree'] | undefined
  adrs: Adr[]
  repository: string
  branch: string
  owner: string
}) => {
  if (!tree) return null

  // Filter ADRs to only include those belonging to the current repository
  const repositoryAdrs = adrs.filter((adr) => {
    return adr.repository === repository
  })

  const result: Record<string, Item> = {}

  // Helper to ensure parent directories exist
  const ensureParentDirs = (path: string) => {
    const parts = path.split('/')
    let currentPath = ''

    for (let i = 0; i < parts.length - 1; i++) {
      currentPath = currentPath
        ? `${currentPath}/${parts[i]}`
        : (parts[i] ?? '')
      result[currentPath] ??= {
        name: parts[i]!,
        children: [],
        isFolder: true,
        isAdr: false,
      }
    }
  }

  // First pass: create all items from tree
  tree.forEach((item) => {
    const path = item.path
    const isDirectory = item.type === 'tree'
    const name = path.split('/').pop() ?? path
    const fileExtension = isDirectory ? undefined : path.split('.').pop()

    result[path] = {
      name,
      children: isDirectory ? [] : undefined,
      fileExtension,
      isFolder: isDirectory,
      isAdr: !isDirectory && fileExtension === 'md', // Set isAdr true for all .md files
    }

    if (!isDirectory) {
      ensureParentDirs(path)
    }
  })

  // Second pass: build parent-child relationships
  tree.forEach((item) => {
    const path = item.path
    const parts = path.split('/')

    if (parts.length > 1) {
      const parentPath = parts.slice(0, -1).join('/')
      const parent = result[parentPath]
      parent?.children?.push(path)
    }
  })

  // Third pass: handle ADR matching
  const matchedAdrs = new Set<string>()

  for (const adr of repositoryAdrs) {
    // Find matching tree item by filename
    const matchingTreeItem = tree.find((item) => {
      const itemName = item.path.split('/').pop() ?? item.path
      return itemName === adr.name && item.type === 'blob'
    })

    if (matchingTreeItem) {
      // Update the ADR with the new path and content from the tree
      await updateAdrContentAndPath(
        adr.name,
        repository,
        adr.contents, // Keep existing content for now, this can be updated when fetching file content
        matchingTreeItem.path,
      )

      // Update the tree item to mark it as an ADR
      const treeItem = result[matchingTreeItem.path]
      if (treeItem) {
        treeItem.isAdr = true
      }

      matchedAdrs.add(adr.id)
    }
  }

  // Fourth pass: handle unmatched ADRs using their database paths
  const unmatchedAdrs = repositoryAdrs.filter((adr) => !matchedAdrs.has(adr.id))

  for (const adr of unmatchedAdrs) {
    const adrPath = adr.path
    const name = adr.name

    // Create the necessary folder structure for this ADR
    ensureParentDirs(adrPath)

    // Add the ADR to the result
    result[adrPath] = {
      name,
      children: undefined,
      fileExtension: 'md',
      isFolder: false,
      isAdr: true,
    }

    // Add this ADR to its parent's children array
    const parts = adrPath.split('/')
    if (parts.length > 1) {
      const parentPath = parts.slice(0, -1).join('/')
      const parent = result[parentPath]
      if (parent?.children) {
        parent.children.push(adrPath)
      }
    }
  }

  return result
}

export function useDebounce(input: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(input)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(input)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [input, delay])

  return debouncedValue
}

export function getFileExtension(filename: string): string | undefined {
  const lastDot = filename.lastIndexOf('.')
  return lastDot !== -1 ? filename.slice(lastDot + 1) : undefined
}
