import type { Item, RepoTree } from '@/definitions/types'
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { Adr } from './dexie-db'
import {
  createAdr,
  updateAdrPath,
  bulkUpdateAdrHasMatch,
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
    console.log('ADR REPO', adr.repository)
    console.log('REPO IN UTILS', repository)
    return adr.repository === repository
  })

  console.log('REPOSITORY ADRS', repositoryAdrs)

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

  // Helper to find a unique ADRs folder name
  const findUniqueAdrsFolderName = () => {
    let folderName = 'adrs'
    let counter = 1

    while (result[folderName]) {
      folderName = `adrs-${counter}`
      counter++
    }

    return folderName
  }

  // Helper to check if a file exists in the tree
  const fileExistsInTree = (filename: string) => {
    return tree.some(
      (item) => item.path === filename || item.path.endsWith(`/${filename}`),
    )
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

  // Handle ADRs based on the four scenarios
  if (repositoryAdrs.length === 0) {
    // Scenario 1: No ADRs - create root-level "adrs" folder with default ADR
    const adrsFolderName = findUniqueAdrsFolderName()

    // Create the ADRs folder
    result[adrsFolderName] = {
      name: adrsFolderName,
      children: [],
    }

    // Create default ADR file
    const defaultAdrPath = `${adrsFolderName}/0001-adr-1.md`
    result[defaultAdrPath] = {
      name: '0001-adr-1.md',
      fileExtension: 'md',
    }

    // Add to parent folder's children
    result[adrsFolderName].children?.push(defaultAdrPath)

    // Create ADR in database
    await createAdr({
      id: uuidv4(),
      name: '0001-adr-1.md',
      path: defaultAdrPath,
      contents: '',
      repository,
      hasMatch: false,
      createdAt: new Date(),
      branch: branch ?? '',
      owner: owner ?? '',
    })
  } else {
    // Check which ADRs have matching files in the tree
    const matchingAdrs: Adr[] = []
    const nonMatchingAdrs: Adr[] = []

    repositoryAdrs.forEach((adr) => {
      if (fileExistsInTree(adr.path)) {
        matchingAdrs.push(adr)
      } else {
        nonMatchingAdrs.push(adr)
      }
    })

    if (nonMatchingAdrs.length === 0) {
      // Scenario 3: All ADRs have matches - update hasMatch to true
      await bulkUpdateAdrHasMatch(
        repositoryAdrs.map((adr) => ({ name: adr.name, hasMatch: true })),
      )
    } else if (matchingAdrs.length === 0) {
      // Scenario 2: No ADRs have matches - create ADRs folder with all ADRs
      const adrsFolderName = findUniqueAdrsFolderName()

      // Create the ADRs folder
      result[adrsFolderName] = {
        name: adrsFolderName,
        children: [],
      }

      // Add all ADRs to the folder
      for (const adr of repositoryAdrs) {
        const adrPath = `${adrsFolderName}/${adr.name}`
        result[adrPath] = {
          name: adr.name,
          fileExtension: adr.name.split('.').pop(),
        }
        result[adrsFolderName].children?.push(adrPath)

        // Update the ADR path in database
        await updateAdrPath(adr.name, adrPath)
      }
    } else {
      // Scenario 4: Some ADRs have matches, some don't
      // Update matching ADRs to hasMatch = true
      await bulkUpdateAdrHasMatch(
        matchingAdrs.map((adr) => ({ name: adr.name, hasMatch: true })),
      )

      // Create ADRs folder for non-matching ADRs
      const adrsFolderName = findUniqueAdrsFolderName()

      // Create the ADRs folder
      result[adrsFolderName] = {
        name: adrsFolderName,
        children: [],
      }

      // Add non-matching ADRs to the folder
      for (const adr of nonMatchingAdrs) {
        const adrPath = `${adrsFolderName}/${adr.name}`
        result[adrPath] = {
          name: adr.name,
          fileExtension: adr.name.split('.').pop(),
        }
        result[adrsFolderName].children?.push(adrPath)

        // Update the ADR path in database
        await updateAdrPath(adr.name, adrPath)
      }

      // Return error information about mismatched files
      const mismatchedFiles = nonMatchingAdrs.map((adr) => adr.path).join(', ')
      console.error(
        `Some ADRs could not find matching files in the repository: ${mismatchedFiles}`,
      )
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
