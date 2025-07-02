'use client'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'
import {
  Sidebar,
  SidebarContent,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import '@mdxeditor/editor/style.css'
import { useParams, useRouter } from 'next/navigation'
import {
  getAdrByNameAndRepository,
  updateAdrContents,
  updateAdrTemplate,
  deleteAdr,
} from '@/lib/adr-db-actions'
import { cn, useDebounce } from '@/lib/utils'
import type { MDXEditorMethods } from '@mdxeditor/editor'
import { SkeletonEditor } from '@/lib/helpers'
import AdrTemplateSidebar from '@/app/[repo]/adr/[adrName]/adr-template-sidebar'
import type { AdrTemplate, ExtendedSection } from '@/definitions/types'
import {
  getTemplateById,
  TEMPLATE_PARSERS,
} from '@/app/[repo]/adr/[adrName]/adr-templates'
import { useRepoAdrs } from '@/hooks/use-repo-queries'
import { atom, useAtom } from 'jotai'
import { ForwardRefEditor } from '@/components/MDXEditor/ForwardRefEditor'
import {
  markdownAtom,
  syncMarkdownAtom,
  templateMarkdownAtom,
} from '../../layout'
import { Button } from '@/components/ui/button'
import { PanelLeftIcon, PanelRightIcon } from 'lucide-react'
import { RightSidebarTrigger } from '@/components/ui/right-sidebar'

export default function AdrPage() {
  const [markdown, setMarkdown] = useAtom(markdownAtom)
  const [templateMarkdown, setTemplateMarkdown] = useAtom(templateMarkdownAtom)
  const [syncMarkdown, setSyncMarkdown] = useAtom(syncMarkdownAtom)

  const { data: session } = useSession()
  const { repo, adrName }: { repo: string; adrName: string } = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [currentAdrKey, setCurrentAdrKey] = useState<string>('')
  const [selectedTemplate, setSelectedTemplate] = useState<AdrTemplate | null>(
    null,
  )
  const [isNewAdr, setIsNewAdr] = useState(false)
  const editorRef = useRef<MDXEditorMethods>(null)
  const editorElementRef = useRef<HTMLElement | null>(null)
  const inactivityTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const sectionsDebounceTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const eventListenersRef = useRef<(() => void) | null>(null)
  const [sections, setSections] = useState<ExtendedSection[]>([])
  const [isEditorFocused, setIsEditorFocused] = useState(false)

  const debouncedAdrContent = useDebounce(markdown ?? '', 500)

  const adr = useQuery({
    queryKey: ['adr', repo, adrName],
    queryFn: async () => {
      const res = await getAdrByNameAndRepository(adrName, repo)
      return res ?? null
    },
  })

  const adrs = useRepoAdrs(repo)

  const owner = adrs?.find((adr) => adr.name === adrName)?.owner
  const branch = adrs?.find((adr) => adr.name === adrName)?.branch

  const adrKey = `${repo}-${adrName}`

  useEffect(() => {
    if (syncMarkdown && isEditorFocused) {
      const sections =
        TEMPLATE_PARSERS[
          selectedTemplate?.id as keyof typeof TEMPLATE_PARSERS
        ].parseMarkdown(syncMarkdown)
      setSections(sections)
    }
  }, [syncMarkdown, selectedTemplate, isEditorFocused])

  useEffect(() => {
    if (sectionsDebounceTimeoutRef.current) {
      clearTimeout(sectionsDebounceTimeoutRef.current)
    }

    if (sections.length > 0 && !isEditorFocused) {
      sectionsDebounceTimeoutRef.current = setTimeout(() => {
        const markdown =
          TEMPLATE_PARSERS[
            selectedTemplate?.id as keyof typeof TEMPLATE_PARSERS
          ].generateMarkdown(sections)
        setMarkdown(markdown)
      }, 200)
    }

    return () => {
      if (sectionsDebounceTimeoutRef.current) {
        clearTimeout(sectionsDebounceTimeoutRef.current)
      }
    }
  }, [sections, isEditorFocused, selectedTemplate])

  useEffect(() => {
    if (debouncedAdrContent) {
      void updateAdrContents(adrName, repo, debouncedAdrContent)
        .then(() => {
          void queryClient.invalidateQueries({
            queryKey: ['adr', repo, adrName],
          })
        })
        .catch((error) => {
          console.error('Failed to update ADR contents:', error)
        })
    }
  }, [debouncedAdrContent, currentAdrKey, adrKey, adrName, repo, queryClient])

  const getEditorContent = useCallback(() => {
    if (editorRef.current) {
      const content = editorRef.current.getMarkdown()
      setSyncMarkdown(content)
      return content
    }
    return null
  }, [])

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
    if (sectionsDebounceTimeoutRef.current) {
      clearTimeout(sectionsDebounceTimeoutRef.current)
      sectionsDebounceTimeoutRef.current = null
    }
  }, [])

  const handleEditorReady = useCallback(
    (element: HTMLElement) => {
      editorElementRef.current = element

      if (
        adr.data &&
        session?.user &&
        typeof markdown === 'string' &&
        currentAdrKey === adrKey
      ) {
        cleanupEventListeners()

        const events = ['input', 'keydown', 'keyup', 'paste', 'cut', 'drop']

        const handleFocusIn = () => {
          console.log('Editor focused')
          setIsEditorFocused(true)
        }
        const handleFocusOut = () => {
          console.log('Editor blurred')
          setIsEditorFocused(false)
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
    ],
  )

  const handleTemplateSelected = useCallback(
    (template: AdrTemplate) => {
      setSelectedTemplate(template)
      setIsNewAdr(false)

      const initialMarkdown = template.generateMarkdown(template.sections)
      setTemplateMarkdown(initialMarkdown)

      void updateAdrContents(adrName, repo, initialMarkdown)
      void updateAdrTemplate(adrName, repo, template.id)
    },
    [adrName, repo],
  )

  const handleTemplateChanged = useCallback(
    (template: AdrTemplate) => {
      setSelectedTemplate(template)

      const newMarkdown = template.generateMarkdown(template.sections)
      setTemplateMarkdown(newMarkdown)

      void updateAdrContents(adrName, repo, newMarkdown)
      void updateAdrTemplate(adrName, repo, template.id)
    },
    [adrName, repo],
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
  }, [adr.data?.id, queryClient, router, repo])

  useEffect(() => {
    cleanupEventListeners()
    setMarkdown('')

    return () => {
      cleanupEventListeners()
    }
  }, [cleanupEventListeners])

  useEffect(() => {
    if (adr.data) {
      setTemplateMarkdown(adr.data.contents ?? '')
      setCurrentAdrKey(adrKey)

      let templateLoaded = false
      if (adr.data.templateId) {
        const template = getTemplateById(adr.data.templateId)
        if (template) {
          setSelectedTemplate(template)
          templateLoaded = true
          setIsNewAdr(false)
        }
      }

      if (
        !templateLoaded &&
        (!adr.data.contents || adr.data.contents.trim() === '')
      ) {
        setIsNewAdr(true)
        setSelectedTemplate(null)
      } else if (!templateLoaded) {
        setIsNewAdr(false)
      }
    }
  }, [adr.data, adrKey])

  return (
    <AdrTemplateSidebar
      initialTemplate={selectedTemplate ?? undefined}
      showInitialDialog={isNewAdr}
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
          {session?.user &&
          typeof markdown === 'string' &&
          currentAdrKey === adrKey &&
          !isNewAdr ? (
            <ForwardRefEditor
              key={adrKey}
              ref={editorRef}
              onEditorReady={handleEditorReady}
              markdown={''}
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
