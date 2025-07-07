'use client'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useLiveQuery } from 'dexie-react-hooks'
import { getFileContent } from '@/app/actions'
import '@mdxeditor/editor/style.css'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import {
  getAdrByNameAndRepository,
  updateAdrContents,
  deleteAdr,
  getAdrLiveQuery,
  createAdr,
} from '@/lib/adr-db-actions'
import type { MDXEditorMethods } from '@mdxeditor/editor'
import { SkeletonEditor } from '@/lib/helpers'
import AdrTemplateSidebar from '@/app/[repo]/adr/[path]/adr-template-sidebar'
import { getTemplateById } from '@/app/[repo]/adr/[path]/adr-templates'
import { useRepoAdrs, useRepoTree } from '@/hooks/use-repo-queries'
import { useAtom } from 'jotai'
import { ForwardRefEditor } from '@/components/MDXEditor/ForwardRefEditor'
import { markdownAtom } from '../../layout'
import { v4 as uuidv4 } from 'uuid'

export default function AdrPage() {
  const [markdown, setMarkdown] = useAtom(markdownAtom)

  const { data: session } = useSession()
  const { repo, path }: { repo: string; path: string } = useParams()
  const formattedPath = path.replaceAll('~', '/')
  const adrName = formattedPath.split('/').filter(Boolean).pop() ?? ''
  const router = useRouter()
  const queryClient = useQueryClient()
  const [currentAdrKey, setCurrentAdrKey] = useState<string>('')

  const editorRef = useRef<MDXEditorMethods>(null)
  const inactivityTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const eventListenersRef = useRef<(() => void) | null>(null)
  const isEditorInitializedRef = useRef(false)
  const [isEditorFocused, setIsEditorFocused] = useState(false)

  const adrs = useRepoAdrs(repo)
  const searchParams = useSearchParams()
  const searchOwner = searchParams.get('owner')
  const searchBranch = searchParams.get('branch')

  const owner = adrs?.find((adr) => adr.name === adrName)?.owner ?? searchOwner
  const branch =
    adrs?.find((adr) => adr.name === adrName)?.branch ?? searchBranch

  // Get repo tree to check if ADR exists in repository
  const repoTree = useRepoTree(repo, owner, branch)

  // Live query for the current ADR
  const liveAdr = useLiveQuery(() => {
    if (!adrName.trim() || !repo.trim()) return undefined
    return getAdrLiveQuery(adrName, repo)
  }, [adrName, repo])

  // Helper function to check if ADR exists in repo tree
  const adrExistsInRepo = useCallback(() => {
    if (!repoTree.data?.data?.tree) return false
    return repoTree.data.data.tree.some((item) => item.path === formattedPath)
  }, [repoTree.data, formattedPath])

  const adrQuery = useQuery({
    queryKey: ['adr', repo, adrName, owner, branch],
    queryFn: async () => {
      // Skip query if adrName is empty to prevent IndexedDB key errors
      if (!adrName.trim()) {
        console.error('Invalid ADR name extracted from path:', path)
        return { adr: null, fetchedContent: null }
      }

      const existingAdr = await getAdrByNameAndRepository(adrName, repo)
      const existsInRepo = adrExistsInRepo()

      console.log('ADR exists in DB:', !!existingAdr)
      console.log('ADR exists in repo:', existsInRepo)

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
            return { adr: existingAdr, fetchedContent }
          }

          // Scenario 3: ADR exists only in repo, not in DB
          if (fetchedContent) {
            console.log(
              'Scenario 3: ADR exists only in repo, creating DB entry',
            )

            const newAdr = await createAdr({
              name: adrName,
              path: formattedPath,
              contents: fetchedContent,
              repository: repo,
              branch: branch ?? '',
              owner: owner ?? '',
              createdAt: new Date(),
              status: 'todo',
              tags: [],
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
    enabled: adrName.trim().length > 0 && repoTree.isSuccess,
  })

  const adrKey = `${repo}-${adrName}`

  // Handle ADR not found error by redirecting to repo page
  useEffect(() => {
    if (adrQuery.error) {
      router.push(`/${repo}?owner=${owner}&branch=${branch}`)
    }
  }, [adrQuery.error, router, repo, owner, branch])

  // Update database when markdown changes
  useEffect(() => {
    console.log('UPDATE EFFECT CALLED')
    if (adrName.trim() && currentAdrKey === adrKey && isEditorFocused) {
      void updateAdrContents(adrName, repo, markdown).catch((error) => {
        console.error('Failed to update ADR contents:', error)
      })
    }
  }, [markdown, adrName, repo, currentAdrKey, adrKey, isEditorFocused])

  // Listen to database changes and update markdown content (database changes + not focused scenario)
  useEffect(() => {
    console.log('LIVE QUERY EFFECT CALLED')
    if (liveAdr && liveAdr.contents !== markdown && !isEditorFocused) {
      const newMarkdown = liveAdr.contents ?? ''
      setMarkdown(newMarkdown)

      // Set the internal MDX editor markdown forcefully (database changes + not focused)
      if (editorRef.current) {
        editorRef.current.setMarkdown(newMarkdown)
      }
    }
  }, [liveAdr, markdown, setMarkdown, isEditorFocused])

  // Initialize markdown when ADR data is available
  useEffect(() => {
    console.log('LAST USEEFFECT CALLED')
    if (adrQuery.data?.adr) {
      const initialMarkdown = adrQuery.data.adr.contents ?? ''
      setMarkdown(initialMarkdown)
      setCurrentAdrKey(adrKey)

      if (adrQuery.data.adr.templateId) {
        const template = getTemplateById(adrQuery.data.adr.templateId)
        if (template) {
          // setSelectedTemplate(template)
        }
      } else {
        // setSelectedTemplate(null)
      }
    }
  }, [adrQuery.data?.adr?.contents, adrKey, setMarkdown])

  const getEditorContent = useCallback(() => {
    if (editorRef.current) {
      const content = editorRef.current.getMarkdown()
      setMarkdown(content)
      return content
    }
    return null
  }, [setMarkdown])

  const handleUserActivity = useCallback(() => {
    if (inactivityTimeoutRef.current) {
      clearTimeout(inactivityTimeoutRef.current)
    }

    inactivityTimeoutRef.current = setTimeout(() => {
      getEditorContent()
    }, 500)
  }, [getEditorContent])

  const cleanupEventListeners = useCallback(() => {
    if (eventListenersRef.current) {
      eventListenersRef.current()
      eventListenersRef.current = null
    }
    if (inactivityTimeoutRef.current) {
      clearTimeout(inactivityTimeoutRef.current)
      inactivityTimeoutRef.current = null
    }
  }, [])

  const handleEditorReady = useCallback(
    (element: HTMLElement) => {
      // Only initialize once per mount
      if (isEditorInitializedRef.current) {
        return
      }

      if (
        adrQuery.data?.adr &&
        session?.user &&
        typeof markdown === 'string' &&
        currentAdrKey === adrKey
      ) {
        // Mark editor as initialized
        isEditorInitializedRef.current = true

        cleanupEventListeners()

        // Set the initial markdown content when editor is ready
        if (editorRef.current && markdown) {
          editorRef.current.setMarkdown(markdown)
        }

        // Automatically focus on the editor when it's ready
        setTimeout(() => {
          if (editorRef.current) {
            editorRef.current.focus()
          }
        }, 0)

        const events = ['input', 'keydown', 'keyup', 'paste', 'cut', 'drop']

        const handleFocusIn = () => {
          console.log('FOCUS IN CALLED')
          setIsEditorFocused(true)
        }
        const handleFocusOut = () => {
          console.log('FOCUS OUT CALLED')
          setIsEditorFocused(false)
          getEditorContent()
        }

        events.forEach((event) => {
          element.addEventListener(event, handleUserActivity, {
            passive: true,
          })
        })

        // Use focusin/focusout which bubble up from child elements
        element.addEventListener('focusin', handleFocusIn, { passive: true })
        element.addEventListener('focusout', handleFocusOut, { passive: true })

        eventListenersRef.current = () => {
          events.forEach((event) => {
            element.removeEventListener(event, handleUserActivity)
          })
          element.removeEventListener('focusin', handleFocusIn)
          element.removeEventListener('focusout', handleFocusOut)
          if (inactivityTimeoutRef.current) {
            clearTimeout(inactivityTimeoutRef.current)
          }
        }
      }
    },
    [
      adrQuery.data?.adr,
      session?.user,
      markdown,
      currentAdrKey,
      adrKey,
      handleUserActivity,
      cleanupEventListeners,
      getEditorContent,
    ],
  )

  const handleCancelAdr = useCallback(async () => {
    if (adrQuery.data?.adr?.id) {
      try {
        await deleteAdr(adrQuery.data.adr.id)

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
                    (key.includes('adr') || key === repo),
                ))
            )
          },
        })

        router.push(`/${repo}?owner=${owner}&branch=${branch}`)
      } catch (error) {
        console.error('Failed to cancel ADR:', error)
      }
    }
  }, [adrQuery.data?.adr?.id, queryClient, router, repo, owner, branch])

  // Reset editor initialization flag when ADR key changes
  useEffect(() => {
    isEditorInitializedRef.current = false
  }, [adrKey])

  // Cleanup event listeners on unmount or key change
  useEffect(() => {
    console.log('CLEANUP EFFECT CALLED')
    return () => {
      cleanupEventListeners()
    }
  }, [cleanupEventListeners])

  return (
    <AdrTemplateSidebar
      onCancelAdr={handleCancelAdr}
      adr={adrQuery.data?.adr ?? null}
      fetchedContent={adrQuery.data?.fetchedContent ?? null}
    >
      <div className="flex overflow-y-scroll z-50">
        <div className="flex-1">
          {!adrName.trim() ? (
            <div className="p-4 text-red-500">
              Invalid ADR path: Unable to extract ADR name from path &quot;
              {path}&quot;
            </div>
          ) : session?.user &&
            typeof markdown === 'string' &&
            currentAdrKey === adrKey ? (
            <ForwardRefEditor
              className={'textEditor'}
              key={adrKey}
              ref={editorRef}
              onEditorReady={handleEditorReady}
              markdown={markdown}
              readOnly={false}
              diffMarkdown={adrQuery.data?.fetchedContent ?? undefined}
            />
          ) : (
            <SkeletonEditor />
          )}
        </div>
      </div>
    </AdrTemplateSidebar>
  )
}
