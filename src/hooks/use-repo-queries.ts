'use client'

import { useQuery } from '@tanstack/react-query'
import { useLiveQuery } from 'dexie-react-hooks'
import { getRepos, getRepoTree, getFileContent } from '@/app/actions'
import {
  getAdrByNameAndRepository,
  updateAdrSha,
  createAdr,
  getAdrsByRepository,
} from '@/lib/adr-db-actions'
import type { ApiResponse, RepoTree } from '@/definitions/types'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { v4 as uuidv4 } from 'uuid'
import { useCallback } from 'react'

export function useRepos() {
  const { data: session } = useSession()
  return useQuery({
    queryKey: ['repos'],
    queryFn: getRepos,
    enabled: !!session,
  })
}

export function useRepoTree(
  activeRepo: string | null,
  owner: string | null,
  branch: string | null,
) {
  const { data: session } = useSession()
  return useQuery<ApiResponse<RepoTree> | null>({
    queryKey: ['repoTree', activeRepo, owner, branch],
    queryFn: () => getRepoTree(activeRepo ?? '', branch ?? '', owner ?? ''),
    enabled:
      !!activeRepo &&
      !!owner &&
      !!branch &&
      typeof activeRepo === 'string' &&
      !!session,
  })
}

export function useRepoAdrs(activeRepo: string | null) {
  return useLiveQuery(async () => {
    if (!activeRepo || typeof activeRepo !== 'string') return null
    const adrs = await getAdrsByRepository(activeRepo)
    return adrs
  }, [activeRepo])
}

export const useAdr = (
  adrName: string,
  repo: string,
  owner: string | null | undefined,
  branch: string | null | undefined,
  formattedPath: string,
  repoTreeData: any,
  isRepoTreeLoading = false,
) => {
  const router = useRouter()

  // Helper function to check if ADR exists in repo tree
  const adrExistsInRepo = () => {
    if (!repoTreeData?.tree) return false
    return repoTreeData.tree.some((item: any) => item.path === formattedPath)
  }

  const adrQuery = useQuery({
    queryKey: ['adr', repo, adrName, owner, branch],
    queryFn: async () => {
      // Skip query if adrName is empty to prevent IndexedDB key errors
      if (!adrName.trim()) {
        console.error('Invalid ADR name extracted from path:', adrName)
        return { adr: null, fetchedContent: null }
      }

      const existingAdr = await getAdrByNameAndRepository(adrName, repo)
      const existsInRepo = adrExistsInRepo()

      // Scenario 1: ADR exists in DB but not in repo
      if (existingAdr && !existsInRepo) {
        console.log('Scenario 1: ADR exists in DB but not in repo')
        return { adr: existingAdr, fetchedContent: null }
      }

      // Scenario 2 & 3: ADR exists in repo (with or without DB entry)
      if (existsInRepo) {
        try {
          const fileResponse = await getFileContent(
            repo,
            formattedPath,
            owner ?? '',
          )

          const fetchedContent = fileResponse.data?.content ?? null

          // Scenario 2: ADR exists in both DB and repo
          if (existingAdr) {
            console.log('Scenario 2: ADR exists in both DB and repo')

            // Update SHA if it's different or missing
            const currentSha = existingAdr.sha
            const newSha = fileResponse.data?.sha

            if (newSha && currentSha !== newSha) {
              console.log('Updating SHA:', { currentSha, newSha })
              await updateAdrSha(adrName, repo, newSha)

              // Get the updated ADR from database
              const updatedAdr = await getAdrByNameAndRepository(adrName, repo)
              return { adr: updatedAdr, fetchedContent }
            }

            return { adr: existingAdr, fetchedContent }
          }

          // Scenario 3: ADR exists only in repo, not in DB
          if (fetchedContent) {
            console.log(
              'Scenario 3: ADR exists only in repo, creating DB entry',
            )

            await createAdr({
              name: adrName,
              path: formattedPath,
              contents: fetchedContent,
              repository: repo,
              branch: branch ?? '',
              owner: owner ?? '',
              createdAt: new Date(),
              sha: fileResponse.data?.sha ?? '',
              id: uuidv4(),
            })

            // Get the newly created ADR from database
            const updatedAdr = await getAdrByNameAndRepository(adrName, repo)
            console.log('Created new ADR:', updatedAdr)
            return { adr: updatedAdr, fetchedContent }
          }
        } catch (error) {
          console.error('Failed to fetch file from remote:', error)
        }
      }

      // If we reach here, something went wrong or ADR doesn't exist anywhere
      console.log('ADR not found in DB or repo, redirecting')
      router.push(`/${repo}?owner=${owner}&branch=${branch}`)
      return { adr: null, fetchedContent: null }
    },
    enabled: adrName.trim().length > 0 && !!repoTreeData && !isRepoTreeLoading,
  })

  return adrQuery
}
