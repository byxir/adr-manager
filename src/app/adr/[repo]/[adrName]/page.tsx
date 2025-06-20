'use client'
import React, { useEffect, useState, useRef, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import '@mdxeditor/editor/style.css'
import { useParams } from 'next/navigation'
import DisplayFileContents from '../../../file/[repo]/[path]/display-file-contents'
import {
  getAdrByNameAndRepository,
  updateAdrContents,
} from '@/lib/adr-db-actions'
import { useDebounce } from '@/lib/utils'
import type { MDXEditorMethods } from '@mdxeditor/editor'
import { SkeletonEditor } from '@/lib/helpers'
import { useLiveQuery } from 'dexie-react-hooks'

export default function AdrPage() {
  const { data: session } = useSession()
  const { repo, adrName }: { repo: string; adrName: string } = useParams()
  // const [adr, setAdr] = useState<Adr | null>(null)
  const [markdown, setMarkdown] = useState<string>('')
  const [currentAdrKey, setCurrentAdrKey] = useState<string>('')
  const editorRef = useRef<MDXEditorMethods>(null)
  const editorElementRef = useRef<HTMLElement | null>(null)
  const inactivityTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const eventListenersRef = useRef<(() => void) | null>(null)

  const debouncedAdrContent = useDebounce(markdown ?? '', 500)

  const adr = useLiveQuery(() => getAdrByNameAndRepository(adrName, repo))

  // Create a unique key for the current ADR to force re-render
  const adrKey = `${repo}-${adrName}`

  console.log('adrKey', adrKey)

  useEffect(() => {
    if (debouncedAdrContent) {
      console.log('debouncedAdrContent', debouncedAdrContent)
      void updateAdrContents(adrName, repo, debouncedAdrContent)
    }
  }, [debouncedAdrContent, currentAdrKey, adrKey, adrName, repo])

  // Function to get content from editor
  const getEditorContent = useCallback(() => {
    if (editorRef.current) {
      const content = editorRef.current.getMarkdown()
      setMarkdown(content)
      return content
    }
    return null
  }, [])

  // Handle user activity - reset the inactivity timer
  const handleUserActivity = useCallback(() => {
    // Clear existing timeout
    if (inactivityTimeoutRef.current) {
      clearTimeout(inactivityTimeoutRef.current)
    }

    // Set new timeout to get content after 500ms of inactivity
    inactivityTimeoutRef.current = setTimeout(() => {
      getEditorContent()
    }, 200)
  }, [getEditorContent])

  // Clean up event listeners
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

  // Set up event listeners when editor becomes ready
  const handleEditorReady = useCallback(
    (element: HTMLElement) => {
      console.log('Editor ready callback called with:', element)
      editorElementRef.current = element

      // Set up listeners if all conditions are met
      if (
        adr &&
        session?.user &&
        typeof markdown === 'string' &&
        currentAdrKey === adrKey
      ) {
        console.log('Setting up listeners on editor element:', element)

        // Clean up any existing listeners first
        cleanupEventListeners()

        // Listen for various user input events
        const events = ['input', 'keydown', 'keyup', 'paste', 'cut', 'drop']

        events.forEach((event) => {
          element.addEventListener(event, handleUserActivity, {
            passive: true,
          })
        })

        // Store cleanup function
        eventListenersRef.current = () => {
          events.forEach((event) => {
            element.removeEventListener(event, handleUserActivity)
          })
          if (inactivityTimeoutRef.current) {
            clearTimeout(inactivityTimeoutRef.current)
          }
        }
      }
    },
    [
      adr,
      session?.user,
      markdown,
      currentAdrKey,
      adrKey,
      handleUserActivity,
      cleanupEventListeners,
    ],
  )

  useEffect(() => {
    cleanupEventListeners()
    setMarkdown('')

    return () => {
      cleanupEventListeners()
    }
  }, [cleanupEventListeners])

  useEffect(() => {
    if (adr) {
      setMarkdown(adr.contents)
      setCurrentAdrKey(adrKey)
    }
  }, [adr, adrKey])

  console.log('markdown', markdown, typeof markdown)
  console.log('user', session?.user)
  console.log('currentAdrKey', currentAdrKey, 'adrKey', adrKey)

  return (
    <SidebarInset>
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4">
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
      </header>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        {session?.user &&
        typeof markdown === 'string' &&
        currentAdrKey === adrKey ? (
          <DisplayFileContents
            key={adrKey}
            markdown={markdown}
            ref={editorRef}
            onEditorReady={handleEditorReady}
          />
        ) : (
          <SkeletonEditor />
        )}
      </div>
    </SidebarInset>
  )
}
