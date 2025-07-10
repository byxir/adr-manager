'use client'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useLiveQuery } from 'dexie-react-hooks'
import '@mdxeditor/editor/style.css'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { updateAdrContents, getAdrLiveQuery } from '@/lib/adr-db-actions'
import type { MDXEditorMethods } from '@mdxeditor/editor'
import { SkeletonEditor } from '@/lib/helpers'
import AdrTemplateSidebar from '@/app/[repo]/adr/[path]/adr-template-sidebar'
import { getTemplateById } from '@/app/[repo]/adr/[path]/adr-templates'
import { useRepoAdrs, useRepoTree, useAdr } from '@/hooks/use-repo-queries'
import { useAtom } from 'jotai'
import { ForwardRefEditor } from '@/components/MDXEditor/ForwardRefEditor'
import { markdownAtom } from '../../layout'

export default function AdrPage() {
  const [markdown, setMarkdown] = useAtom(markdownAtom)

  const { data: session } = useSession()
  const { repo, path }: { repo: string; path: string } = useParams()
  const formattedPath = path.replaceAll('~', '/')
  const adrName = formattedPath.split('/').filter(Boolean).pop() ?? ''
  const router = useRouter()
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

  // Use the custom hook to get ADR data
  const adrQuery = useAdr(
    adrName,
    repo,
    owner,
    branch,
    formattedPath,
    repoTree.data?.data,
    repoTree.isFetching || repoTree.isLoading,
  )

  const adrKey = `${repo}-${adrName}`

  // Handle ADR not found error by redirecting to repo page
  useEffect(() => {
    if (adrQuery.error) {
      router.push(`/${repo}?owner=${owner}&branch=${branch}`)
    }
  }, [adrQuery.error, router, repo, owner, branch])

  // Update database when markdown changes
  useEffect(() => {
    if (adrName.trim() && currentAdrKey === adrKey && isEditorFocused) {
      void updateAdrContents(adrName, repo, markdown).catch((error) => {
        console.error('Failed to update ADR contents:', error)
      })
    }
  }, [markdown, adrName, repo, currentAdrKey, adrKey, isEditorFocused])

  // Listen to database changes and update markdown content (database changes + not focused scenario)
  useEffect(() => {
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

        const keyboardEvents = [
          'input',
          'keydown',
          'keyup',
          'paste',
          'cut',
          'drop',
        ]

        const handleFocusIn = () => {
          setIsEditorFocused(true)
        }
        const handleFocusOut = () => {
          setIsEditorFocused(false)
          getEditorContent()
        }

        // Handle toolbar button clicks
        const handleToolbarClick = (event: MouseEvent) => {
          const target = event.target as HTMLElement

          // Check if the clicked element is a toolbar button
          if (
            target.closest('button[data-editor-toolbar-button]') ||
            target.closest('[role="button"]') ||
            target.closest('button')
          ) {
            setTimeout(() => {
              handleUserActivity()
            }, 100)
            return
          }
        }

        // Add keyboard event listeners
        keyboardEvents.forEach((event) => {
          element.addEventListener(event, handleUserActivity, {
            passive: true,
          })
        })

        // Add toolbar click listener
        element.addEventListener('click', handleToolbarClick, { passive: true })

        // Add mutation observer to detect DOM changes (fallback for element removal/addition)
        const mutationObserver = new MutationObserver((mutations) => {
          let shouldTriggerUpdate = false

          mutations.forEach((mutation) => {
            // Check if nodes were added or removed
            if (
              mutation.addedNodes.length > 0 ||
              mutation.removedNodes.length > 0
            ) {
              // Check if the changes involve editor elements
              const relevantChange = [
                ...mutation.addedNodes,
                ...mutation.removedNodes,
              ].some((node) => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                  const element = node as Element

                  // Check if element itself matches editor element selectors
                  const elementMatches =
                    element.matches &&
                    (element.matches('.code-block-container') ||
                      element.matches('.table-container') ||
                      element.matches('.sandpack-container') ||
                      element.matches('[data-lexical-editor-theme]'))

                  // Check if element contains editor elements
                  const containsEditorElements =
                    element.querySelector &&
                    (element.querySelector('.code-block-container') ??
                      element.querySelector('.table-container') ??
                      element.querySelector('.sandpack-container') ??
                      element.querySelector('[data-lexical-editor-theme]'))

                  return elementMatches || containsEditorElements
                }
                return false
              })

              if (relevantChange) {
                shouldTriggerUpdate = true
              }
            }
          })

          if (shouldTriggerUpdate) {
            setTimeout(() => {
              handleUserActivity()
            }, 200) // Delay to allow editor state to stabilize
          }
        })

        // Start observing the editor container
        mutationObserver.observe(element, {
          childList: true,
          subtree: true,
          attributes: false,
        })

        // Use focusin/focusout which bubble up from child elements
        element.addEventListener('focusin', handleFocusIn, { passive: true })
        element.addEventListener('focusout', handleFocusOut, { passive: true })

        eventListenersRef.current = () => {
          keyboardEvents.forEach((event) => {
            element.removeEventListener(event, handleUserActivity)
          })
          element.removeEventListener('click', handleToolbarClick)
          element.removeEventListener('focusin', handleFocusIn)
          element.removeEventListener('focusout', handleFocusOut)
          mutationObserver.disconnect()
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

  // Reset editor initialization flag when ADR key changes
  useEffect(() => {
    isEditorInitializedRef.current = false
  }, [adrKey])

  // Cleanup event listeners on unmount or key change
  useEffect(() => {
    return () => {
      cleanupEventListeners()
    }
  }, [cleanupEventListeners])

  return (
    <AdrTemplateSidebar
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
