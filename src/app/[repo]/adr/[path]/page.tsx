'use client'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useLiveQuery } from 'dexie-react-hooks'
import { getFileContent } from '@/app/actions'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'
import '@mdxeditor/editor/style.css'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import {
  getAdrByNameAndRepository,
  updateAdrContents,
  updateAdrTemplate,
  deleteAdr,
  updateAdrLastFetched,
  getAdrLiveQuery,
  createAdr,
} from '@/lib/adr-db-actions'
import type { MDXEditorMethods } from '@mdxeditor/editor'
import { SkeletonEditor } from '@/lib/helpers'
import AdrTemplateSidebar from '@/app/[repo]/adr/[path]/adr-template-sidebar'
import type { AdrTemplate, ExtendedSection } from '@/definitions/types'
import {
  getTemplateById,
  TEMPLATE_PARSERS,
} from '@/app/[repo]/adr/[path]/adr-templates'
import { useRepoAdrs } from '@/hooks/use-repo-queries'
import { useAtom } from 'jotai'
import { ForwardRefEditor } from '@/components/MDXEditor/ForwardRefEditor'
import { markdownAtom } from '../../layout'
import { RightSidebarTrigger } from '@/components/ui/right-sidebar'
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
  const [selectedTemplate, setSelectedTemplate] = useState<AdrTemplate | null>(
    null,
  )
  const editorRef = useRef<MDXEditorMethods>(null)
  const inactivityTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const eventListenersRef = useRef<(() => void) | null>(null)
  const [sections, setSections] = useState<ExtendedSection[]>([])
  const [isEditorFocused, setIsEditorFocused] = useState(false)

  // Live query for the current ADR
  const liveAdr = useLiveQuery(() => {
    if (!adrName.trim() || !repo.trim()) return undefined
    return getAdrLiveQuery(adrName, repo)
  }, [adrName, repo])

  const adr = useQuery({
    queryKey: ['adr', repo, adrName],
    queryFn: async () => {
      // Skip query if adrName is empty to prevent IndexedDB key errors
      if (!adrName.trim()) {
        console.error('Invalid ADR name extracted from path:', path)
        return null
      }

      const existingAdr = await getAdrByNameAndRepository(adrName, repo)

      // If no ADR exists in database, fetch from remote
      if (!existingAdr) {
        console.log('made it inside no existing adr')
        try {
          const fileResponse = await getFileContent(
            repo,
            `${path.replaceAll('~', '/')}`,
            owner ?? '',
          )
          if (fileResponse.data) {
            // Update the database with the fetched content
            await createAdr({
              name: adrName,
              path: `${path.replaceAll('~', '/')}`,
              contents: fileResponse.data.content,
              repository: repo,
              branch: branch ?? '',
              owner: owner ?? '',
              createdAt: new Date(),
              templateId: undefined,
              status: 'todo',
              tags: [],
              sha: fileResponse.data.sha,
              lastFetched: new Date(),
              id: uuidv4(),
            })

            // Update lastFetched timestamp
            await updateAdrLastFetched(adrName, repo, new Date())

            // Get the updated ADR from database
            const updatedAdr = await getAdrByNameAndRepository(adrName, repo)
            console.log('updated adr', updatedAdr)
            return updatedAdr
          }
        } catch (error) {
          console.error('Failed to fetch file from remote:', error)
        }

        // If ADR doesn't exist and can't be fetched, redirect to repo page
        router.push(`/${repo}?owner=${owner}&branch=${branch}`)
        return null
      }

      // If ADR exists, check if we need to refresh from remote
      // Only refresh if lastFetched exists (meaning it was previously fetched from remote)
      // and is older than 5 minutes
      const now = new Date()
      const lastFetched = existingAdr.lastFetched
      const shouldRefresh =
        lastFetched && now.getTime() - lastFetched.getTime() > 5 * 60 * 1000 // 5 minutes

      if (shouldRefresh) {
        try {
          const fileResponse = await getFileContent(
            repo,
            `${path.replaceAll('~', '/')}`,
            owner ?? '',
          )
          if (fileResponse.data) {
            // Update the database with the fetched content
            await updateAdrContents(adrName, repo, fileResponse.data.content)

            // Update lastFetched timestamp
            await updateAdrLastFetched(adrName, repo, now)

            // Get the updated ADR from database
            const updatedAdr = await getAdrByNameAndRepository(adrName, repo)
            return updatedAdr
          }
        } catch (error) {
          console.error('Failed to refresh file from remote:', error)
        }
      }

      return existingAdr
    },
    enabled: adrName.trim().length > 0,
  })

  const adrs = useRepoAdrs(repo)

  const searchParams = useSearchParams()
  const searchOwner = searchParams.get('owner')
  const searchBranch = searchParams.get('branch')

  const owner = adrs?.find((adr) => adr.name === adrName)?.owner ?? searchOwner
  const branch =
    adrs?.find((adr) => adr.name === adrName)?.branch ?? searchBranch

  const adrKey = `${repo}-${adrName}`

  // Handle ADR not found error by redirecting to repo page
  useEffect(() => {
    if (adr.error && adr.error.message === 'ADR not found') {
      router.push(`/${repo}?owner=${owner}&branch=${branch}`)
    }
  }, [adr.error, router, repo, owner, branch])

  // Update sections when markdown changes and template is selected
  useEffect(() => {
    console.log('PARSER EFFECT CALLED')
    if (markdown && selectedTemplate && isEditorFocused) {
      const sections =
        TEMPLATE_PARSERS[
          selectedTemplate.id as keyof typeof TEMPLATE_PARSERS
        ]?.parseMarkdown(markdown)
      if (sections) {
        setSections(sections)
      }
    }
  }, [markdown, selectedTemplate, isEditorFocused])

  // Update database when markdown changes
  useEffect(() => {
    console.log('UPDATE EFFECT CALLED')
    if (adrName.trim() && currentAdrKey === adrKey && isEditorFocused) {
      void updateAdrContents(adrName, repo, markdown)
        .then(() => {
          void queryClient.invalidateQueries({
            queryKey: ['adr', repo, adrName],
          })
        })
        .catch((error) => {
          console.error('Failed to update ADR contents:', error)
        })
    }
  }, [
    markdown,
    adrName,
    repo,
    currentAdrKey,
    adrKey,
    queryClient,
    isEditorFocused,
  ])

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

      // Update template if it exists
      if (liveAdr.templateId) {
        const template = getTemplateById(liveAdr.templateId)
        if (template) {
          setSelectedTemplate(template)
        }
      }
    }
  }, [liveAdr, markdown, setMarkdown, isEditorFocused])

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
    }, 200)
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
      if (
        adr.data &&
        session?.user &&
        typeof markdown === 'string' &&
        currentAdrKey === adrKey
      ) {
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
          setIsEditorFocused(true)
        }
        const handleFocusOut = () => {
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
      adr.data,
      session?.user,
      markdown,
      currentAdrKey,
      adrKey,
      handleUserActivity,
      cleanupEventListeners,
      getEditorContent,
    ],
  )

  const handleTemplateSelected = useCallback(
    (template: AdrTemplate) => {
      if (!adrName.trim()) {
        console.error('Cannot update template: invalid adrName')
        return
      }

      setSelectedTemplate(template)

      const initialMarkdown = template.generateMarkdown(template.sections)
      setMarkdown(initialMarkdown)

      void updateAdrContents(adrName, repo, initialMarkdown)
      void updateAdrTemplate(adrName, repo, template.id)
    },
    [adrName, repo, setMarkdown],
  )

  const handleTemplateChanged = useCallback(
    (template: AdrTemplate) => {
      if (!adrName.trim()) {
        console.error('Cannot update template: invalid adrName')
        return
      }

      setSelectedTemplate(template)

      const newMarkdown = template.generateMarkdown(template.sections)
      setMarkdown(newMarkdown)

      void updateAdrContents(adrName, repo, newMarkdown)
      void updateAdrTemplate(adrName, repo, template.id)
    },
    [adrName, repo, setMarkdown],
  )

  const handleCancelAdr = useCallback(async () => {
    if (adr.data?.id) {
      try {
        await deleteAdr(adr.data.id)

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
  }, [adr.data?.id, queryClient, router, repo, owner, branch])

  // Cleanup event listeners on unmount or key change
  useEffect(() => {
    console.log('CLEANUP EFFECT CALLED')
    return () => {
      cleanupEventListeners()
    }
  }, [cleanupEventListeners])

  // Initialize markdown when ADR data is available
  useEffect(() => {
    console.log('LAST USEEFFECT CALLED')
    if (adr.data) {
      const initialMarkdown = adr.data.contents ?? ''
      setMarkdown(initialMarkdown)
      setCurrentAdrKey(adrKey)

      if (adr.data.templateId) {
        const template = getTemplateById(adr.data.templateId)
        if (template) {
          setSelectedTemplate(template)
        }
      } else {
        setSelectedTemplate(null)
      }
    }
  }, [adr.data?.contents, adrKey, setMarkdown, isEditorFocused])

  return (
    <AdrTemplateSidebar
      initialTemplate={selectedTemplate ?? undefined}
      showInitialDialog={false}
      onTemplateSelected={handleTemplateSelected}
      onTemplateChanged={handleTemplateChanged}
      onCancelAdr={handleCancelAdr}
      sections={sections}
      setSections={setSections}
    >
      <div className="flex overflow-y-scroll z-50">
        <div className="flex-1">
          <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
            <div className="flex items-center gap-2 px-4 w-full justify-between">
              <div className="flex items-center gap-2">
                <SidebarTrigger className="-ml-1" />

                <Separator
                  orientation="vertical"
                  className="mr-2 data-[orientation=vertical]:h-4"
                />
                <Breadcrumb>
                  <BreadcrumbList>
                    <BreadcrumbItem className="hidden md:block">
                      <BreadcrumbLink href="#">{repo}</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator className="hidden md:block" />
                    <BreadcrumbItem>
                      <BreadcrumbPage>{adrName}</BreadcrumbPage>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>
              </div>
              <div className="flex items-center gap-2">
                <Separator
                  orientation="vertical"
                  className="ml-2 data-[orientation=vertical]:h-4"
                />
                <RightSidebarTrigger className="-ml-1" />
              </div>
            </div>
          </header>
          {!adrName.trim() ? (
            <div className="p-4 text-red-500">
              Invalid ADR path: Unable to extract ADR name from path &quot;
              {path}&quot;
            </div>
          ) : session?.user &&
            typeof markdown === 'string' &&
            currentAdrKey === adrKey ? (
            <ForwardRefEditor
              key={adrKey}
              ref={editorRef}
              onEditorReady={handleEditorReady}
              markdown={markdown}
              readOnly={false}
            />
          ) : (
            <SkeletonEditor />
          )}
        </div>
      </div>
    </AdrTemplateSidebar>
  )
}
