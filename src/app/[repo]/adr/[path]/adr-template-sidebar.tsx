'use client'
import React, {
  useCallback,
  useState,
  useEffect,
  useRef,
  type SetStateAction,
  type Dispatch,
} from 'react'
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
  FileText,
  Edit3,
  Minus,
  Plus,
  Tag,
  Users,
  X,
  RefreshCw,
  CircleDot,
  PlayCircle,
  CheckCircle,
  Archive,
} from 'lucide-react'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  updateAdrStatus,
  updateAdrTags,
  getAdrByNameAndRepository,
} from '@/lib/adr-db-actions'
import { useParams } from 'next/navigation'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
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

interface ExtendedSection extends AdrTemplateSection {
  items?: string[]
}

type AdrStatus = 'todo' | 'in-progress' | 'done' | 'backlog'

interface AdrTemplateSidebarProps {
  initialTemplate?: AdrTemplate
  showInitialDialog?: boolean

  onCancelAdr?: () => void

  children: React.ReactNode
}

export default function AdrTemplateSidebar({
  initialTemplate,
  showInitialDialog = false,

  onCancelAdr,

  children,
}: AdrTemplateSidebarProps) {
  const { repo, path }: { repo: string; path: string } = useParams()
  const formattedPath = path.replaceAll('~', '/')
  const adrName = formattedPath.split('/').filter(Boolean).pop() ?? ''
  const [sections, setSections] = useState<ExtendedSection[]>([])

  const adr = useLiveQuery(
    () => getAdrByNameAndRepository(adrName, repo),
    [adrName, repo],
  )

  const [selectedTemplate, setSelectedTemplate] = useState<AdrTemplate | null>(
    initialTemplate ?? null,
  )
  const [showTemplateDialog, setShowTemplateDialog] =
    useState(showInitialDialog)
  const [hasContent, setHasContent] = useState(false)

  const [isTeamOpen, setIsTeamOpen] = useState(false)
  const [isTagsOpen, setIsTagsOpen] = useState(false)
  const [adrStatus, setAdrStatus] = useState<AdrStatus>('todo')
  const [collaborators] = useState([
    { name: 'John Doe', username: 'john.doe', avatar: '' },
    { name: 'Jane Smith', username: 'jane.smith', avatar: '' },
    { name: 'Alex Chen', username: 'alex.chen', avatar: '' },
  ])
  const [tags, setTags] = useState<string[]>([])
  const [newTag, setNewTag] = useState('')

  // Use live query to sync with database
  const adrData = useLiveQuery(
    () => getAdrByNameAndRepository(adrName, repo),
    [adrName, repo],
  )

  // Sync status and tags from database
  useEffect(() => {
    if (adrData) {
      if (adrData.status) {
        setAdrStatus(adrData.status)
      }
      if (adrData.tags) {
        setTags(adrData.tags)
      }
    }
  }, [adrData])

  useEffect(() => {
    if (initialTemplate && initialTemplate !== selectedTemplate) {
      setSelectedTemplate(initialTemplate)
    }
  }, [initialTemplate, selectedTemplate])

  useEffect(() => {
    if (!selectedTemplate) return

    const newSections = selectedTemplate.sections.map((section) => {
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
  }, [selectedTemplate])

  const handleTemplateChange = useCallback((template: AdrTemplate) => {
    setSelectedTemplate(template)
  }, [])

  const handleTemplateChangeWithWarning = useCallback(() => {
    if (hasContent) {
      setShowTemplateDialog(true)
    } else {
      setShowTemplateDialog(true)
    }
  }, [hasContent])

  const [localSectionContent, setLocalSectionContent] = useState<
    Record<string, string>
  >({})
  const [localItemContent, setLocalItemContent] = useState<
    Record<string, Record<number, string>>
  >({})

  const sectionTimeoutRef = useRef<Record<string, NodeJS.Timeout>>({})
  const itemTimeoutRef = useRef<Record<string, Record<number, NodeJS.Timeout>>>(
    {},
  )

  const updateSectionContent = useCallback(
    (sectionId: string, content: string) => {
      setSections((prev) =>
        prev.map((section) =>
          section.id === sectionId ? { ...section, content } : section,
        ),
      )
      setHasContent(true)
    },
    [setSections],
  )

  const updateItemContent = useCallback(
    (sectionId: string, itemIndex: number, content: string) => {
      setSections((prev) =>
        prev.map((section) => {
          if (section.id === sectionId && section.items) {
            const newItems = [...section.items]
            newItems[itemIndex] = content
            return { ...section, items: newItems }
          }
          return section
        }),
      )
      setHasContent(true)
    },
    [setSections],
  )

  const handleSectionContentChange = useCallback(
    (sectionId: string, content: string) => {
      setLocalSectionContent((prev) => ({ ...prev, [sectionId]: content }))

      if (sectionTimeoutRef.current[sectionId]) {
        clearTimeout(sectionTimeoutRef.current[sectionId])
      }

      sectionTimeoutRef.current[sectionId] = setTimeout(() => {
        updateSectionContent(sectionId, content)
        setLocalSectionContent((prev) => {
          const newState = { ...prev }
          delete newState[sectionId]
          return newState
        })
      }, 200)
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
    }
  }, [])

  const addListItem = useCallback((sectionId: string) => {
    setSections((prev) =>
      prev.map((section) => {
        if (section.id === sectionId) {
          const existingItems = section.items ?? []

          if (
            existingItems.length > 0 &&
            !existingItems[existingItems.length - 1]?.trim()
          ) {
            return section
          }

          const newItemText =
            section.id === 'options'
              ? ''
              : section.id === 'consequences'
                ? ''
                : section.id === 'drivers'
                  ? ''
                  : ''

          return { ...section, items: [...existingItems, newItemText] }
        }
        return section
      }),
    )
  }, [])

  const removeLastListItem = useCallback((sectionId: string) => {
    setSections((prev) =>
      prev.map((section) => {
        if (
          section.id === sectionId &&
          section.items &&
          section.items.length > 0
        ) {
          const newItems = section.items.slice(0, -1)
          return { ...section, items: newItems }
        }
        return section
      }),
    )
  }, [])

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

  const addTag = useCallback(async () => {
    if (newTag.trim() && !tags.includes(newTag.trim().toLowerCase())) {
      const updatedTags = [...tags, newTag.trim().toLowerCase()]
      setTags(updatedTags)
      setNewTag('')
      await updateAdrTags(adrName, repo, updatedTags)
    }
  }, [newTag, tags, adrName, repo])

  const removeTag = useCallback(
    async (tag: string) => {
      const updatedTags = tags.filter((t) => t !== tag)
      setTags(updatedTags)
      await updateAdrTags(adrName, repo, updatedTags)
    },
    [tags, adrName, repo],
  )

  const handleStatusChange = useCallback(
    async (status: AdrStatus) => {
      setAdrStatus(status)
      await updateAdrStatus(adrName, repo, status)
    },
    [adrName, repo],
  )

  const getStatusColor = useCallback((status: AdrStatus) => {
    switch (status) {
      case 'todo':
        return 'bg-slate-50 text-slate-600 border-slate-200'
      case 'in-progress':
        return 'bg-blue-50 text-blue-600 border-blue-200'
      case 'done':
        return 'bg-green-50 text-green-600 border-green-200'
      case 'backlog':
        return 'bg-amber-50 text-amber-600 border-amber-200'
      default:
        return 'bg-slate-50 text-slate-600 border-slate-200'
    }
  }, [])

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
  const noTemplateSelected = false

  return (
    <div className="flex h-screen w-full">
      <div className="flex-shrink overflow-y-scroll w-full px-4">
        {children}
      </div>
      <RightSidebar side="right" className="">
        <RightSidebarContent className="flex-shrink-0 h-screen bg-background border-l flex flex-col">
          <div className="p-4 border-b flex-shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold">ADR Builder</h2>
                <p className="text-xs text-muted-foreground mt-1">
                  {selectedTemplate?.name ?? 'Free Form'}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleTemplateChangeWithWarning}
                className="flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                {selectedTemplate ? 'Change' : 'Select Template'}
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto min-h-0">
            {/* Status Section - Always visible */}
            <div className="p-4 border-b">
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Status
                </Label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className={`w-full justify-between text-sm h-8 ${getStatusColor(adrStatus)}`}
                    >
                      <span className="flex items-center gap-2">
                        {React.createElement(getStatusIcon(adrStatus), {
                          className: 'w-4 h-4',
                        })}
                        {adrStatus === 'todo'
                          ? 'To Do'
                          : adrStatus === 'in-progress'
                            ? 'In Progress'
                            : adrStatus === 'done'
                              ? 'Done'
                              : 'Backlog'}
                      </span>
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-40">
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
                            className="text-sm"
                          >
                            <span className="flex items-center gap-2">
                              <StatusIcon className="w-4 h-4" />
                              {displayName}
                            </span>
                          </DropdownMenuItem>
                        )
                      },
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Team Section - Collapsible */}
            <Collapsible open={isTeamOpen} onOpenChange={setIsTeamOpen}>
              <Contributors isOpen={isTeamOpen} />
            </Collapsible>

            <Collapsible open={isTagsOpen} onOpenChange={setIsTagsOpen}>
              <div className="p-4 border-b">
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full justify-between p-0 h-auto font-semibold text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <Tag className="w-4 h-4" />
                      Tags ({tags.length})
                    </div>
                    {isTagsOpen ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-3 mt-3">
                  <div className="flex gap-1">
                    <Input
                      placeholder="Add tag..."
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      className="text-xs h-6 flex-1"
                      onKeyPress={(e) => e.key === 'Enter' && addTag()}
                    />
                    <Button
                      size="sm"
                      onClick={addTag}
                      className="h-6 w-6 p-0"
                      disabled={!newTag.trim()}
                    >
                      <Plus className="w-2 h-2" />
                    </Button>
                  </div>

                  <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                    {tags.map((tag, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full px-2 py-1 text-xs"
                      >
                        <Tag className="w-2 h-2" />
                        <span>{tag}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeTag(tag)}
                          className="h-3 w-3 p-0 hover:bg-red-100 hover:text-red-600 rounded-full"
                        >
                          <X className="w-2 h-2" />
                        </Button>
                      </div>
                    ))}
                    {tags.length === 0 && (
                      <div className="text-xs text-muted-foreground italic text-center py-2 w-full">
                        No tags added
                      </div>
                    )}
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
                              value={
                                localSectionContent[section.id] ??
                                section.content
                              }
                              onChange={(e) =>
                                handleSectionContentChange(
                                  section.id,
                                  e.target.value,
                                )
                              }
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
                              value={
                                localSectionContent[section.id] ??
                                section.content
                              }
                              onChange={(e) =>
                                handleSectionContentChange(
                                  section.id,
                                  e.target.value,
                                )
                              }
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
                  <h3 className="font-semibold">
                    {selectedTemplate
                      ? 'Free Form Template'
                      : 'Free Form Editor'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedTemplate
                      ? 'Write your ADR in the editor. This template provides complete freedom to structure your document as you prefer.'
                      : 'You&apos;re using the free form editor. Write your ADR however you prefer, or select a template for guided structure.'}
                  </p>
                  {!selectedTemplate && (
                    <Button
                      onClick={() => setShowTemplateDialog(true)}
                      variant="outline"
                      className="w-full mt-2"
                    >
                      Select Template
                    </Button>
                  )}
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
