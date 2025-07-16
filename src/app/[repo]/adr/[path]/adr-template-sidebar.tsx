'use client'
import React, { useCallback, useState, useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Separator } from '@/components/ui/separator'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { AdrTemplate, AdrTemplateSection } from '@/definitions/types'
import {
  ChevronDown,
  ChevronRight,
  Clock,
  Edit3,
  Minus,
  Plus,
  Tag,
  X,
  RefreshCw,
  CircleDot,
  PlayCircle,
  CheckCircle,
  Archive,
  Users,
} from 'lucide-react'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  getAdrByNameAndRepository,
  updateAdrContents,
} from '@/lib/adr-db-actions'
import { useParams } from 'next/navigation'
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import UpdateOrCreateFileButton from '@/components/actions/CreateOrUpdateFile'
import TemplateSelectionDialog from '@/components/TemplateSelectionDialog'
import {
  RightSidebar,
  RightSidebarContent,
} from '@/components/ui/right-sidebar'
import Contributors from 'src/components/contributors'
import type { Adr } from '@/lib/dexie-db'
import {
  getTemplateById,
  getTemplateParser,
  ensureFrontmatterInMarkdown,
  type AdrStatus,
} from '@/app/[repo]/adr/[path]/adr-templates'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface ExtendedSection extends AdrTemplateSection {
  items?: string[]
}

interface AdrTemplateSidebarProps {
  adr?: Adr | null
  onCancelAdr?: () => void
  children: React.ReactNode
  fetchedContent?: string | null
}

// Contributors Section Component
function ContributorsSection({
  isOpen,
  onOpenChange,
}: {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Collapsible open={isOpen} onOpenChange={onOpenChange}>
      <div className="border-b p-4" onClick={() => onOpenChange(!isOpen)}>
        <div className="flex items-center justify-between cursor-pointer">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
              <Users className="w-4 h-4 text-white" />
            </div>
            <div className="text-left">
              <div className="font-semibold">Contributors</div>
              <div className="text-xs text-muted-foreground">
                View team members
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            {isOpen ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </div>
        </div>
        <CollapsibleContent className="space-y-3 mt-4">
          <div className="rounded-lg p-3 border">
            <Contributors isOpen={isOpen} />
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  )
}

export default function AdrTemplateSidebar({
  onCancelAdr,
  children,
  fetchedContent,
}: AdrTemplateSidebarProps) {
  const { repo, path }: { repo: string; path: string } = useParams()
  const formattedPath = path.replaceAll('~', '/')
  const adrName = formattedPath.split('/').filter(Boolean).pop() ?? ''
  const [sections, setSections] = useState<ExtendedSection[]>([])
  const [showSynchronizeButton, setShowSynchronizeButton] = useState(false)

  const adr = useLiveQuery(
    () => getAdrByNameAndRepository(adrName, repo),
    [adrName, repo],
  )

  const [selectedTemplate, setSelectedTemplate] = useState<AdrTemplate | null>(
    null,
  )
  const [detectedTemplate, setDetectedTemplate] = useState<AdrTemplate | null>(
    null,
  )
  const [showTemplateDialog, setShowTemplateDialog] = useState(false)
  const [hasContent, setHasContent] = useState(false)

  const [isTeamOpen, setIsTeamOpen] = useState(false)
  const [isTagsOpen, setIsTagsOpen] = useState(false)
  const [adrStatus, setAdrStatus] = useState<AdrStatus | undefined>(undefined)

  const [tags, setTags] = useState<string[]>([])
  const [newTag, setNewTag] = useState('')
  const [frontmatter, setFrontmatter] = useState<Record<string, any>>({})

  // Track if any textarea is focused to prevent parsing during editing
  const [isTextareaFocused, setIsTextareaFocused] = useState(false)

  // Check if synchronize button should be shown
  useEffect(() => {
    if (fetchedContent && adr?.contents) {
      const shouldShow = fetchedContent.trim() !== adr.contents.trim()
      setShowSynchronizeButton(shouldShow)
    } else {
      setShowSynchronizeButton(false)
    }
  }, [fetchedContent, adr?.contents])

  // Handle synchronize button click
  const handleSynchronize = useCallback(async () => {
    if (fetchedContent && adr) {
      try {
        await updateAdrContents(adrName, repo, fetchedContent)
        setShowSynchronizeButton(false)
      } catch (error) {
        console.error('Failed to synchronize ADR content:', error)
      }
    }
  }, [fetchedContent, adr, adrName, repo])

  // Template detection logic
  const detectTemplate = useCallback((content: string): AdrTemplate | null => {
    if (!content || content.trim() === '') {
      // For empty content, default to free-form template
      return getTemplateById('free-form') ?? null
    }

    // Check for Y-Statement template
    const yStatementPatterns = [
      /In the context of/i,
      /facing/i,
      /we decided for/i,
      /and against/i,
      /to achieve/i,
      /accepting that/i,
    ]

    const yStatementMatches = yStatementPatterns.filter((pattern) =>
      pattern.test(content),
    )
    if (yStatementMatches.length >= 4) {
      // At least 4 out of 6 patterns
      return getTemplateById('y-statement') ?? null
    }

    // Check for MADR templates
    const madrFullPatterns = [
      /^#{1,2}\s*Context and Problem Statement/im,
      /^#{1,2}\s*Decision Drivers/im,
      /^#{1,2}\s*Considered Options/im,
      /^#{1,2}\s*Decision Outcome/im,
      /^#{1,3}\s*Consequences/im,
      /^#{1,3}\s*Confirmation/im,
      /^#{1,2}\s*Pros and Cons of the Options/im,
      /^#{1,2}\s*More Information/im,
    ]

    const madrMinimalPatterns = [
      /^#{1,2}\s*Context and Problem Statement/im,
      /^#{1,2}\s*Considered Options/im,
      /^#{1,2}\s*Decision Outcome/im,
      /^#{1,3}\s*Consequences/im,
    ]

    const madrFullMatches = madrFullPatterns.filter((pattern) =>
      pattern.test(content),
    )
    const madrMinimalMatches = madrMinimalPatterns.filter((pattern) =>
      pattern.test(content),
    )

    if (madrFullMatches.length >= 6) {
      // Most MADR full patterns
      return getTemplateById('madr-full') ?? null
    } else if (madrMinimalMatches.length >= 3) {
      // Most MADR minimal patterns
      return getTemplateById('madr-minimal') ?? null
    }

    // Default to free-form if no specific template is detected
    return getTemplateById('free-form') ?? null
  }, [])

  // Parse content when ADR changes externally
  useEffect(() => {
    // Handle case where ADR exists but has no content (new ADR)
    if (adr && (!adr.contents || adr.contents.trim() === '')) {
      const freeFormTemplate = getTemplateById('free-form')
      setSelectedTemplate(freeFormTemplate ?? null)
      setDetectedTemplate(freeFormTemplate ?? null)
      setSections([])
      setHasContent(false)
      setAdrStatus(undefined)
      setTags([])
      setFrontmatter({})
      return
    }

    if (adr?.contents && !isTextareaFocused) {
      const detected = detectTemplate(adr.contents)
      setDetectedTemplate(detected)

      // Use the detected template or fall back to stored templateId
      const templateToUse =
        detected ?? (adr.templateId && getTemplateById(adr.templateId))

      if (templateToUse && templateToUse.id !== 'free-form') {
        setSelectedTemplate(templateToUse)

        // Parse the content using the template's parser
        const parser = getTemplateParser(templateToUse.id)
        if (parser) {
          const parsedContent = parser.parseMarkdown(adr.contents)

          // Update status, tags, and frontmatter from parsed content
          if (parsedContent.status) {
            setAdrStatus(parsedContent.status)
          }
          if (parsedContent.tags) {
            setTags(parsedContent.tags)
          }
          if (parsedContent.frontmatter) {
            setFrontmatter(parsedContent.frontmatter)
          }

          // Convert parsed sections to extended sections with items for list types
          const extendedSections = parsedContent.sections.map((section) => {
            const isListType = [
              'options',
              'consequences',
              'drivers',
              'proscons',
            ].includes(section.id)
            if (isListType) {
              if (section.content) {
                // Parse list items from content
                const lines = section.content.split('\n')
                const listLines = lines.filter(
                  (line) =>
                    line.trim().startsWith('*') || line.trim().startsWith('-'),
                )

                const items = listLines.map((line) =>
                  line.replace(/^[\s]*[-*]\s*/, '').trim(),
                )

                return { ...section, items }
              } else {
                // Empty list type section should still have items array
                return { ...section, items: [] }
              }
            }
            return section
          })

          setSections(extendedSections)
          setHasContent(true)
        }
      } else {
        // For free-form template
        setSelectedTemplate(getTemplateById('free-form') ?? null)
        setSections([])

        // Parse frontmatter for free-form template
        const parser = getTemplateParser('free-form')
        if (parser) {
          const parsedContent = parser.parseMarkdown(adr.contents)

          // Update status, tags, and frontmatter from parsed content
          if (parsedContent.status) {
            setAdrStatus(parsedContent.status)
          }
          if (parsedContent.tags) {
            setTags(parsedContent.tags)
          }
          if (parsedContent.frontmatter) {
            setFrontmatter(parsedContent.frontmatter)
          }

          // If no frontmatter exists, add it to enable status/tags functionality
          if (!adr.contents.startsWith('---')) {
            const contentWithFrontmatter = ensureFrontmatterInMarkdown(
              adr.contents,
              {
                status: parsedContent.status,
                tags: parsedContent.tags ?? [],
              },
            )
            // Update the content with frontmatter
            void updateAdrContents(adrName, repo, contentWithFrontmatter)
          }
        }

        setHasContent(adr.contents.trim().length > 0)
      }
    }
  }, [adr?.contents, detectTemplate, isTextareaFocused, adrName, repo])

  // Initial setup effect for completely new ADRs
  useEffect(() => {
    if (!adr && !selectedTemplate) {
      const freeFormTemplate = getTemplateById('free-form')
      setSelectedTemplate(freeFormTemplate ?? null)
      setDetectedTemplate(freeFormTemplate ?? null)
      setSections([])
      setHasContent(false)
      setAdrStatus(undefined)
      setTags([])
      setFrontmatter({})
    }
  }, [adr, selectedTemplate])

  const handleTemplateChange = useCallback(
    (template: AdrTemplate) => {
      setSelectedTemplate(template)

      // Clear status, tags, and frontmatter when selecting a template
      setAdrStatus(undefined)
      setTags([])
      setFrontmatter({})

      if (template.id !== 'free-form') {
        const newSections = template.sections.map((section) => {
          const isListType = [
            'options',
            'consequences',
            'drivers',
            'proscons',
          ].includes(section.id)
          if (isListType) {
            return { ...section, items: [] }
          }
          return { ...section }
        })
        setSections(newSections)
        setHasContent(false)

        // Generate and save initial template content to database
        const saveInitialContent = async () => {
          const parser = getTemplateParser(template.id)
          if (parser) {
            const emptySections = template.sections.map((section) => ({
              ...section,
              content: '',
            }))

            // For MADR full template, set up default frontmatter
            const generateOptions: any = {
              tags: [],
            }
            if (template.id === 'madr-full') {
              generateOptions.frontmatter = {
                '#comment': true,
                status: 'proposed',
                date: new Date().toISOString().split('T')[0],
                'decision-makers': '',
                consulted: '',
                informed: '',
              }
            }

            const initialContent = parser.generateMarkdown(
              emptySections,
              generateOptions,
            )
            await updateAdrContents(adrName, repo, initialContent)
          }
        }

        void saveInitialContent()
      } else {
        setSections([])

        // For free-form, generate minimal frontmatter
        const saveInitialContent = async () => {
          const parser = getTemplateParser('free-form')
          if (parser) {
            const emptySections = [
              {
                id: 'content',
                title: 'Free Form Content',
                placeholder: '',
                content: '',
                isRequired: true,
              },
            ]
            const initialContent = parser.generateMarkdown(emptySections, {
              tags: [],
              frontmatter: {},
            })
            await updateAdrContents(adrName, repo, initialContent)
          }
        }

        void saveInitialContent()
      }
    },
    [adrName, repo],
  )

  const handleTemplateChangeWithWarning = useCallback(() => {
    if (hasContent) {
      setShowTemplateDialog(true)
    } else {
      setShowTemplateDialog(true)
    }
  }, [hasContent])

  const [localItemContent, setLocalItemContent] = useState<
    Record<string, Record<number, string>>
  >({})

  const sectionTimeoutRef = useRef<Record<string, NodeJS.Timeout>>({})
  const itemTimeoutRef = useRef<Record<string, Record<number, NodeJS.Timeout>>>(
    {},
  )
  const generateMarkdownTimeoutRef = useRef<NodeJS.Timeout | undefined>(
    undefined,
  )

  // Generate markdown and update database after changes
  const generateAndUpdateMarkdown = useCallback(
    async (
      currentSections?: ExtendedSection[],
      currentStatus?: AdrStatus,
      currentTags?: string[],
      currentFrontmatter?: Record<string, any>,
    ) => {
      if (!selectedTemplate) return

      // Use passed status/tags/frontmatter or fall back to state values
      const statusToUse = currentStatus ?? adrStatus
      const tagsToUse = currentTags ?? tags
      const frontmatterToUse = currentFrontmatter ?? frontmatter

      // For free-form templates, we need to preserve existing content
      // and only update the frontmatter
      if (selectedTemplate.id === 'free-form') {
        if (adr?.contents) {
          // Use the updateFrontmatterInMarkdown utility to preserve content
          const { updateFrontmatterInMarkdown } = await import(
            './adr-templates'
          )
          const updatedMarkdown = updateFrontmatterInMarkdown(adr.contents, {
            status: statusToUse,
            tags: tagsToUse,
            frontmatter: frontmatterToUse,
          })
          await updateAdrContents(adrName, repo, updatedMarkdown)
        }
        return
      }

      // For structured templates, use the normal generation process
      const parser = getTemplateParser(selectedTemplate.id)
      if (!parser) return

      // Use passed sections or fall back to state sections
      const sectionsToUse = currentSections ?? sections

      // Convert sections back to proper format for markdown generation
      const sectionsForMarkdown = sectionsToUse.map((section) => {
        if (section.items !== undefined) {
          // For list sections, convert items array to markdown list format
          if (section.items.length > 0) {
            const listContent = section.items
              .map((item) => `* ${item}`)
              .join('\n')
            return { ...section, content: listContent }
          } else {
            // Empty list should have empty content
            return { ...section, content: '' }
          }
        }
        return section
      })

      // Pass status, tags, and frontmatter as options to the generate function
      const generateOptions = {
        status: statusToUse,
        tags: tagsToUse, // Always pass tags array, even if empty
        frontmatter: frontmatterToUse,
      }

      const markdownContent = parser.generateMarkdown(
        sectionsForMarkdown,
        generateOptions,
      )
      await updateAdrContents(adrName, repo, markdownContent)
    },
    [
      selectedTemplate,
      sections,
      adrName,
      repo,
      adrStatus,
      tags,
      frontmatter,
      adr?.contents,
    ],
  )

  const updateSectionContent = useCallback(
    (sectionId: string, content: string) => {
      setSections((prev) => {
        const updatedSections = prev.map((section) =>
          section.id === sectionId ? { ...section, content } : section,
        )

        // Schedule markdown update with the updated sections
        if (generateMarkdownTimeoutRef.current) {
          clearTimeout(generateMarkdownTimeoutRef.current)
        }
        generateMarkdownTimeoutRef.current = setTimeout(() => {
          void generateAndUpdateMarkdown(
            updatedSections,
            adrStatus,
            tags,
            frontmatter,
          )
        }, 500)

        return updatedSections
      })
      setHasContent(true)
    },
    [generateAndUpdateMarkdown, adrStatus, tags, frontmatter],
  )

  const updateItemContent = useCallback(
    (sectionId: string, itemIndex: number, content: string) => {
      setSections((prev) => {
        const updatedSections = prev.map((section) => {
          if (section.id === sectionId && section.items) {
            const newItems = [...section.items]
            newItems[itemIndex] = content
            return { ...section, items: newItems }
          }
          return section
        })

        // Schedule markdown update with the updated sections
        if (generateMarkdownTimeoutRef.current) {
          clearTimeout(generateMarkdownTimeoutRef.current)
        }
        generateMarkdownTimeoutRef.current = setTimeout(() => {
          void generateAndUpdateMarkdown(
            updatedSections,
            adrStatus,
            tags,
            frontmatter,
          )
        }, 500)

        return updatedSections
      })
      setHasContent(true)
    },
    [generateAndUpdateMarkdown, adrStatus, tags, frontmatter],
  )

  const handleSectionContentChange = useCallback(
    (sectionId: string, content: string) => {
      updateSectionContent(sectionId, content)

      if (sectionTimeoutRef.current[sectionId]) {
        clearTimeout(sectionTimeoutRef.current[sectionId])
      }
    },
    [updateSectionContent],
  )

  const handleItemContentChange = useCallback(
    (sectionId: string, itemIndex: number, content: string) => {
      setLocalItemContent((prev) => ({
        ...prev,
        [sectionId]: { ...prev[sectionId], [itemIndex]: content },
      }))

      if (itemTimeoutRef.current[sectionId]?.[itemIndex]) {
        clearTimeout(itemTimeoutRef.current[sectionId][itemIndex])
      }

      itemTimeoutRef.current[sectionId] ??= {}

      itemTimeoutRef.current[sectionId][itemIndex] = setTimeout(() => {
        updateItemContent(sectionId, itemIndex, content)
        setLocalItemContent((prev) => {
          const newState = { ...prev }
          if (newState[sectionId]) {
            delete newState[sectionId][itemIndex]
            if (Object.keys(newState[sectionId]).length === 0) {
              delete newState[sectionId]
            }
          }
          return newState
        })
      }, 200)
    },
    [updateItemContent],
  )

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      Object.values(sectionTimeoutRef.current).forEach((timeout) => {
        if (timeout) clearTimeout(timeout)
      })
      Object.values(itemTimeoutRef.current).forEach((sectionTimeouts) => {
        Object.values(sectionTimeouts).forEach((timeout) => {
          if (timeout) clearTimeout(timeout)
        })
      })
      if (generateMarkdownTimeoutRef.current) {
        clearTimeout(generateMarkdownTimeoutRef.current)
      }
    }
  }, [])

  const addListItem = useCallback(
    (sectionId: string) => {
      setSections((prev) => {
        const updatedSections = prev.map((section) => {
          if (section.id === sectionId) {
            const existingItems = section.items ?? []

            if (
              existingItems.length > 0 &&
              !existingItems[existingItems.length - 1]?.trim()
            ) {
              return section
            }

            const newItemText = ''
            const newItems = [...existingItems, newItemText]

            return { ...section, items: newItems }
          }
          return section
        })

        // Schedule markdown update with the updated sections
        if (generateMarkdownTimeoutRef.current) {
          clearTimeout(generateMarkdownTimeoutRef.current)
        }
        generateMarkdownTimeoutRef.current = setTimeout(() => {
          void generateAndUpdateMarkdown(
            updatedSections,
            adrStatus,
            tags,
            frontmatter,
          )
        }, 500)

        return updatedSections
      })
    },
    [generateAndUpdateMarkdown, adrStatus, tags, frontmatter],
  )

  const removeLastListItem = useCallback(
    (sectionId: string) => {
      setSections((prev) => {
        const updatedSections = prev.map((section) => {
          if (
            section.id === sectionId &&
            section.items &&
            section.items.length > 0
          ) {
            const newItems = section.items.slice(0, -1)

            return { ...section, items: newItems }
          }
          return section
        })

        // Schedule markdown update with the updated sections
        if (generateMarkdownTimeoutRef.current) {
          clearTimeout(generateMarkdownTimeoutRef.current)
        }
        generateMarkdownTimeoutRef.current = setTimeout(() => {
          void generateAndUpdateMarkdown(
            updatedSections,
            adrStatus,
            tags,
            frontmatter,
          )
        }, 500)

        return updatedSections
      })
    },
    [generateAndUpdateMarkdown, adrStatus, tags, frontmatter],
  )

  const checkHasContent = useCallback((section: ExtendedSection) => {
    if (section.items) {
      return (
        section.items.length > 0 && section.items.some((item) => item.trim())
      )
    }
    return section.content.trim() !== ''
  }, [])

  const isListSection = useCallback((sectionId: string) => {
    return ['options', 'consequences', 'drivers', 'proscons'].includes(
      sectionId,
    )
  }, [])

  const addTag = useCallback(() => {
    if (newTag.trim() && !tags.includes(newTag.trim().toLowerCase())) {
      const updatedTags = [...tags, newTag.trim().toLowerCase()]
      setTags(updatedTags)
      setNewTag('')
      // Trigger markdown regeneration with new tags
      void generateAndUpdateMarkdown(
        undefined,
        adrStatus,
        updatedTags,
        frontmatter,
      )
    }
  }, [newTag, tags, generateAndUpdateMarkdown, adrStatus, frontmatter])

  const removeTag = useCallback(
    (tag: string) => {
      const updatedTags = tags.filter((t) => t !== tag)
      setTags(updatedTags)
      // Trigger markdown regeneration with updated tags
      void generateAndUpdateMarkdown(
        undefined,
        adrStatus,
        updatedTags,
        frontmatter,
      )
    },
    [tags, generateAndUpdateMarkdown, adrStatus, frontmatter],
  )

  const handleStatusChange = useCallback(
    (status: AdrStatus) => {
      setAdrStatus(status)
      // Trigger markdown regeneration with new status
      void generateAndUpdateMarkdown(undefined, status, tags, frontmatter)
    },
    [generateAndUpdateMarkdown, tags, frontmatter],
  )

  const getStatusIcon = useCallback((status: AdrStatus) => {
    switch (status) {
      case 'todo':
        return CircleDot
      case 'in-progress':
        return PlayCircle
      case 'done':
        return CheckCircle
      case 'backlog':
        return Archive
      default:
        return CircleDot
    }
  }, [])

  const isFreeForm = selectedTemplate?.id === 'free-form' || !selectedTemplate

  return (
    <div className="flex h-screen w-full">
      <div className="flex-shrink overflow-y-scroll w-full px-4">
        {children}
      </div>
      <RightSidebar side="right" className="">
        <RightSidebarContent className="flex-shrink-0 h-screen bg-background border-l flex flex-col templateSidebar">
          <div className="p-4 border-b flex-shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold">ADR Builder</h2>
                <p className="text-xs text-muted-foreground mt-1">
                  {selectedTemplate?.name ?? 'Free Form'}
                  {detectedTemplate &&
                    detectedTemplate.id !== selectedTemplate?.id && (
                      <span className="ml-2 text-blue-600">
                        (Detected: {detectedTemplate.name})
                      </span>
                    )}
                </p>
              </div>
              <div className="flex flex-col gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleTemplateChangeWithWarning}
                      className="flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" />
                      {selectedTemplate ? 'Change' : 'Select Template'}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Change the template</p>
                  </TooltipContent>
                </Tooltip>
                {showSynchronizeButton && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSynchronize}
                        className="flex items-center gap-1 text-xs synchronizeButton"
                      >
                        <RefreshCw className="w-3 h-3" />
                        Synchronize
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        Synchronize with the latest version of the template from
                        GitHub
                      </p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto min-h-0">
            {/* Status Section - Redesigned */}
            <div className="p-4 border-b">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <Label className="text-sm font-semibold">Status</Label>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-between text-sm h-10"
                    >
                      <span className="flex items-center gap-3">
                        {adrStatus ? (
                          React.createElement(getStatusIcon(adrStatus), {
                            className: 'w-4 h-4',
                          })
                        ) : (
                          <CircleDot className="w-4 h-4 opacity-50" />
                        )}
                        <span className="font-medium">
                          {adrStatus === 'todo'
                            ? 'To Do'
                            : adrStatus === 'in-progress'
                              ? 'In Progress'
                              : adrStatus === 'done'
                                ? 'Done'
                                : adrStatus === 'backlog'
                                  ? 'Backlog'
                                  : 'Select Status'}
                        </span>
                      </span>
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-44">
                    {(['todo', 'in-progress', 'done', 'backlog'] as const).map(
                      (status) => {
                        const StatusIcon = getStatusIcon(status)
                        const displayName =
                          status === 'todo'
                            ? 'To Do'
                            : status === 'in-progress'
                              ? 'In Progress'
                              : status === 'done'
                                ? 'Done'
                                : 'Backlog'
                        return (
                          <DropdownMenuItem
                            key={status}
                            onClick={() => handleStatusChange(status)}
                            className="text-sm cursor-pointer"
                          >
                            <span className="flex items-center gap-3">
                              <StatusIcon className="w-4 h-4" />
                              <span className="font-medium">{displayName}</span>
                            </span>
                          </DropdownMenuItem>
                        )
                      },
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Contributors Section - Redesigned */}
            <ContributorsSection
              isOpen={isTeamOpen}
              onOpenChange={setIsTeamOpen}
            />

            {/* Tags Section - Redesigned */}
            <Collapsible open={isTagsOpen} onOpenChange={setIsTagsOpen}>
              <div
                className="p-4 border-b"
                onClick={(e) => {
                  // Only close if clicking outside of input, tags, or plus button
                  const target = e.target as HTMLElement
                  const isInput = target.closest('input')
                  const isTag = target.closest('[data-tag]')
                  const isPlusButton = target.closest('[data-plus-button]')

                  if (!isInput && !isTag && !isPlusButton) {
                    setIsTagsOpen(!isTagsOpen)
                  }
                }}
              >
                <div className="flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                      <Tag className="w-4 h-4 text-white" />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold">Tags</div>
                      <div className="text-xs text-muted-foreground">
                        {tags.length} {tags.length === 1 ? 'tag' : 'tags'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full ${tags.length > 0 ? 'bg-purple-500' : 'bg-gray-300'}`}
                    />
                    {isTagsOpen ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </div>
                </div>
                <CollapsibleContent className="space-y-4 mt-4">
                  {/* Add Tag Input */}
                  <div className="rounded-lg p-3 border">
                    <Label className="text-xs font-medium mb-2 block">
                      Add New Tag
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter tag name..."
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        className="text-sm h-8 flex-1"
                        onKeyPress={(e) => e.key === 'Enter' && addTag()}
                      />
                      <Button
                        size="sm"
                        onClick={addTag}
                        className="h-8 px-3"
                        disabled={!newTag.trim()}
                        data-plus-button
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Tags Display */}
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Current Tags</Label>
                    <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto p-2 rounded-lg border">
                      {tags.map((tag, index) => (
                        <div
                          key={index}
                          className="group flex items-center gap-2 bg-muted text-muted-foreground rounded-full px-3 py-1.5 text-xs border"
                          data-tag
                        >
                          <Tag className="w-3 h-3" />
                          <span className="font-medium">{tag}</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeTag(tag)}
                            className="h-4 w-4 p-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-2.5 h-2.5" />
                          </Button>
                        </div>
                      ))}
                      {tags.length === 0 && (
                        <div className="text-xs text-muted-foreground italic text-center py-4 w-full">
                          No tags added yet
                        </div>
                      )}
                    </div>
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>

            {selectedTemplate && !isFreeForm && (
              <div className="p-4 space-y-4">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={selectedTemplate?.id ?? 'no-template'}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-4"
                  >
                    {sections.map((section, index) => {
                      const isTitle =
                        section.id === 'title' ||
                        section.title.toLowerCase().includes('title')
                      const isContext =
                        section.id === 'context' ||
                        section.title.toLowerCase().includes('context')
                      const isListType = isListSection(section.id)

                      return (
                        <motion.div
                          key={`${selectedTemplate?.id ?? 'no-template'}-${section.id}`}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{
                            duration: 0.3,
                            delay: index * 0.05,
                          }}
                          className="space-y-2"
                        >
                          <div className="flex items-start justify-between gap-1">
                            <Label
                              htmlFor={`section-${section.id}`}
                              className="text-sm font-bold flex items-center gap-1 flex-1 min-w-0"
                            >
                              <div
                                className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                  checkHasContent(section)
                                    ? 'bg-green-500'
                                    : 'bg-gray-300'
                                }`}
                              />
                              <span className="truncate">{section.title}</span>
                              {section.isRequired && (
                                <span className="text-red-500 text-sm">*</span>
                              )}
                            </Label>
                            {isListType && (
                              <div className="flex gap-1 flex-shrink-0">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => addListItem(section.id)}
                                  disabled={
                                    section.items &&
                                    section.items.length > 0 &&
                                    !section.items[
                                      section.items.length - 1
                                    ]?.trim()
                                  }
                                  className="h-5 w-5 p-0"
                                >
                                  <Plus className="w-2 h-2" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => removeLastListItem(section.id)}
                                  className="h-5 w-5 p-0"
                                >
                                  <Minus className="w-2 h-2" />
                                </Button>
                              </div>
                            )}
                          </div>

                          {isTitle ? (
                            <Input
                              id={`section-${section.id}`}
                              placeholder={section.placeholder}
                              value={section.content}
                              onChange={(e) =>
                                handleSectionContentChange(
                                  section.id,
                                  e.target.value,
                                )
                              }
                              onFocus={() => setIsTextareaFocused(true)}
                              onBlur={() => setIsTextareaFocused(false)}
                              className="font-medium text-xs"
                            />
                          ) : isListType && section.items ? (
                            <div className="space-y-2">
                              {section.items.map((item, itemIndex) => {
                                const getSingularName = (sectionId: string) => {
                                  switch (sectionId) {
                                    case 'options':
                                      return 'Option'
                                    case 'consequences':
                                      return 'Consequence'
                                    case 'drivers':
                                      return 'Decision Driver'
                                    case 'proscons':
                                      return 'Pros/Cons'
                                    default:
                                      return 'Item'
                                  }
                                }

                                return (
                                  <div key={itemIndex} className="space-y-1">
                                    <Label className="text-xs font-medium text-muted-foreground">
                                      {getSingularName(section.id)}{' '}
                                      {itemIndex + 1}
                                    </Label>
                                    <textarea
                                      className="w-full px-2 py-1 text-xs border rounded-md resize-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 min-h-[40px]"
                                      placeholder={`Enter ${getSingularName(section.id).toLowerCase()} ${itemIndex + 1}...`}
                                      value={
                                        localItemContent[section.id]?.[
                                          itemIndex
                                        ] ?? item
                                      }
                                      onChange={(e) =>
                                        handleItemContentChange(
                                          section.id,
                                          itemIndex,
                                          e.target.value,
                                        )
                                      }
                                      onFocus={() => setIsTextareaFocused(true)}
                                      onBlur={() => setIsTextareaFocused(false)}
                                    />
                                  </div>
                                )
                              })}
                              {section.items.length === 0 && (
                                <div className="text-xs text-muted-foreground italic text-center py-2">
                                  Click + to add items
                                </div>
                              )}
                            </div>
                          ) : (
                            <textarea
                              id={`section-${section.id}`}
                              className={`w-full px-2 py-1 text-xs border rounded-md resize-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${
                                isContext ? 'min-h-[100px]' : 'min-h-[60px]'
                              }`}
                              placeholder={section.placeholder}
                              value={section.content}
                              onChange={(e) =>
                                handleSectionContentChange(
                                  section.id,
                                  e.target.value,
                                )
                              }
                              onFocus={() => setIsTextareaFocused(true)}
                              onBlur={() => setIsTextareaFocused(false)}
                            />
                          )}

                          {index < sections.length - 1 && (
                            <Separator className="mt-2" />
                          )}
                        </motion.div>
                      )
                    })}
                  </motion.div>
                </AnimatePresence>
              </div>
            )}

            {isFreeForm && (
              <div className="p-4">
                <div className="text-center space-y-2">
                  <Edit3 className="w-8 h-8 mx-auto text-muted-foreground" />
                  <h3 className="font-semibold">Free Form Template</h3>
                  <p className="text-sm text-muted-foreground">
                    Write your ADR in the editor with complete freedom to
                    structure your document as you prefer. Status and tags are
                    fully supported.
                  </p>
                  <Button
                    onClick={() => setShowTemplateDialog(true)}
                    variant="outline"
                    className="w-full mt-2"
                  >
                    Change Template
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 border-t space-y-2 flex-shrink-0 bg-background">
            <UpdateOrCreateFileButton
              repo={adr?.repository ?? ''}
              path={adr?.path ?? ''}
              owner={adr?.owner ?? ''}
              sha={adr?.sha ?? ''}
              branch={adr?.branch ?? ''}
              content={adr?.contents ?? ''}
            />
            {selectedTemplate && !isFreeForm && (
              <div className="text-xs text-muted-foreground text-center">
                {sections.filter(checkHasContent).length} / {sections.length}{' '}
                completed
              </div>
            )}
          </div>
        </RightSidebarContent>
        <TemplateSelectionDialog
          open={showTemplateDialog}
          onClose={() => setShowTemplateDialog(false)}
          onSelectTemplate={handleTemplateChange}
          onCancel={onCancelAdr}
          showChangeWarning={hasContent}
          mandatory={false}
        />
      </RightSidebar>
    </div>
  )
}
