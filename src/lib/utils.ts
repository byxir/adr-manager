import type { Item, RepoTree } from '@/app/types'
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const transformTreeData = (tree: RepoTree['tree']) => {
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
      }
    }
  }

  // First pass: create all items
  tree.forEach((item) => {
    const path = item.path
    const isDirectory = item.type === 'tree'
    const name = path.split('/').pop() ?? path

    result[path] = {
      name,
      children: isDirectory ? [] : undefined,
      fileExtension: isDirectory ? undefined : path.split('.').pop(),
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

  return result
}
