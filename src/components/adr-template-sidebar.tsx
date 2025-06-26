'use client'

import React, { useCallback, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Separator } from '@/components/ui/separator'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ADR_TEMPLATES } from '@/lib/adr-templates'
import type { AdrTemplate, AdrTemplateSection } from '@/definitions/types'
import {
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Clock,
  FileText,
  Lightbulb,
  Minus,
  Plus,
  Tag,
  Users,
  X,
} from 'lucide-react'
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

interface ExtendedSection extends AdrTemplateSection {
  items?: string[] // For list sections
}

type AdrStatus = 'TO DO' | 'IN PROGRESS' | 'DONE' | 'BACKLOG'

export default function AdrTemplateSidebar() {
  const [selectedTemplate, setSelectedTemplate] = useState<AdrTemplate>(
    ADR_TEMPLATES[0],
  )
  const [sections, setSections] = useState<ExtendedSection[]>(
    ADR_TEMPLATES[0]!.sections.map((section) => {
      const isListType = [
        'options',
        'consequences',
        'drivers',
        'proscons',
      ].includes(section.id)
      if (isListType) {
        if (section.content) {
          // Parse existing content into items
          const items = section.content
            .split('\n')
            .filter((line) => line.trim())
            .map((line) => line.replace(/^\*\s*/, '').trim())
          return { ...section, items }
        } else {
          // Initialize with empty items array
          return { ...section, items: [] }
        }
      }
      return section
    }),
  )

  // ADR Status and Collaboration state
  const [isStatusOpen, setIsStatusOpen] = useState(false)
  const [isTagsOpen, setIsTagsOpen] = useState(false)
  const [adrStatus, setAdrStatus] = useState<AdrStatus>('TO DO')
  const [collaborators] = useState([
    { name: 'John Doe', username: 'john.doe', avatar: '' },
    { name: 'Jane Smith', username: 'jane.smith', avatar: '' },
    { name: 'Alex Chen', username: 'alex.chen', avatar: '' },
  ])
  const [tags, setTags] = useState<string[]>(['architecture', 'backend'])
  const [newTag, setNewTag] = useState('')

  // Template icons
  const templateIcons = {
    'madr-minimal': FileText,
    'madr-full': CheckCircle,
    'y-statement': Lightbulb,
  }

  const handleTemplateChange = useCallback((template: AdrTemplate) => {
    setSelectedTemplate(template)
    setSections(
      template.sections.map((section) => {
        const isListType = [
          'options',
          'consequences',
          'drivers',
          'proscons',
        ].includes(section.id)
        if (isListType) {
          if (section.content) {
            // Parse existing content into items
            const items = section.content
              .split('\n')
              .filter((line) => line.trim())
              .map((line) => line.replace(/^\*\s*/, '').trim())
            return { ...section, items }
          } else {
            // Initialize with empty items array
            return { ...section, items: [] }
          }
        }
        return section
      }),
    )
  }, [])

  const updateSectionContent = useCallback(
    (sectionId: string, content: string) => {
      setSections((prev) =>
        prev.map((section) =>
          section.id === sectionId ? { ...section, content } : section,
        ),
      )
    },
    [],
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
    },
    [],
  )

  // Handle dynamic list items (for options, consequences, etc.)
  const addListItem = useCallback((sectionId: string) => {
    setSections((prev) =>
      prev.map((section) => {
        if (section.id === sectionId) {
          const existingItems = section.items ?? []

          // Don't add new item if the last item is empty
          if (
            existingItems.length > 0 &&
            !existingItems[existingItems.length - 1]?.trim()
          ) {
            return section // Return unchanged section
          }

          const newItemText =
            section.id === 'options'
              ? 'New option'
              : section.id === 'consequences'
                ? 'Good/Bad, because...'
                : section.id === 'drivers'
                  ? 'New decision driver'
                  : 'New item'

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

  const getMarkdown = useCallback(() => {
    // Convert sections back to the format expected by generateMarkdown
    const convertedSections = sections.map((section) => {
      if (section.items) {
        // Convert items array back to bullet point content
        const content = section.items.map((item) => `* ${item}`).join('\n')
        return { ...section, content }
      }
      return section
    })
    return selectedTemplate.generateMarkdown(convertedSections)
  }, [selectedTemplate, sections])

  const copyToClipboard = useCallback(() => {
    void navigator.clipboard.writeText(getMarkdown())
  }, [getMarkdown])

  const hasContent = useCallback((section: ExtendedSection) => {
    if (section.items) {
      return (
        section.items.length > 0 && section.items.some((item) => item.trim())
      )
    }
    return (
      section.content.trim() &&
      !section.content.includes('{') &&
      !section.content.includes('…')
    )
  }, [])

  const isListSection = useCallback((sectionId: string) => {
    return ['options', 'consequences', 'drivers', 'proscons'].includes(
      sectionId,
    )
  }, [])

  // Tag management functions
  const addTag = useCallback(() => {
    if (newTag.trim() && !tags.includes(newTag.trim().toLowerCase())) {
      setTags((prev) => [...prev, newTag.trim().toLowerCase()])
      setNewTag('')
    }
  }, [newTag, tags])

  const removeTag = useCallback((tag: string) => {
    setTags((prev) => prev.filter((t) => t !== tag))
  }, [])

  const getStatusColor = useCallback((status: AdrStatus) => {
    switch (status) {
      case 'TO DO':
        return 'bg-gray-100 text-gray-700 border-gray-300'
      case 'IN PROGRESS':
        return 'bg-blue-100 text-blue-700 border-blue-300'
      case 'DONE':
        return 'bg-green-100 text-green-700 border-green-300'
      case 'BACKLOG':
        return 'bg-orange-100 text-orange-700 border-orange-300'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300'
    }
  }, [])

  const getStatusIcon = useCallback((status: AdrStatus) => {
    switch (status) {
      case 'TO DO':
        return '⏳'
      case 'IN PROGRESS':
        return '🔄'
      case 'DONE':
        return '✅'
      case 'BACKLOG':
        return '📋'
      default:
        return '⏳'
    }
  }, [])

  return (
    <div className="w-80 flex-shrink-0 h-screen bg-background border-l flex flex-col">
      {/* Fixed Header */}
      <div className="p-4 border-b flex-shrink-0">
        <h2 className="text-lg font-bold">ADR Template Builder</h2>
        <p className="text-xs text-muted-foreground mt-1">
          Choose a template and fill in the sections
        </p>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Template Selection */}
        <div className="p-4 border-b">
          <Label className="text-sm font-semibold mb-2 block">Template</Label>
          <div className="grid gap-2">
            {ADR_TEMPLATES.map((template) => {
              const Icon =
                templateIcons[template.id as keyof typeof templateIcons]
              return (
                <motion.div
                  key={template.id}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <Button
                    variant={
                      selectedTemplate.id === template.id
                        ? 'default'
                        : 'outline'
                    }
                    className="w-full h-auto p-2 flex items-center gap-2 text-left justify-start"
                    onClick={() => handleTemplateChange(template)}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="font-medium text-xs">{template.name}</span>
                  </Button>
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* ADR Status and Collaboration */}
        <Collapsible open={isStatusOpen} onOpenChange={setIsStatusOpen}>
          <div className="p-4 border-b">
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-between p-0 h-auto font-semibold text-sm"
              >
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Status & Team
                </div>
                {isStatusOpen ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 mt-3">
              {/* Status Selection */}
              <div className="space-y-2">
                <Label className="text-xs font-medium">ADR Status</Label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className={`w-full justify-between text-xs h-6 ${getStatusColor(adrStatus)}`}
                    >
                      <span className="flex items-center gap-1">
                        <span>{getStatusIcon(adrStatus)}</span>
                        {adrStatus}
                      </span>
                      <ChevronDown className="w-3 h-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-40">
                    {(['TO DO', 'IN PROGRESS', 'DONE', 'BACKLOG'] as const).map(
                      (status) => (
                        <DropdownMenuItem
                          key={status}
                          onClick={() => setAdrStatus(status)}
                          className="text-xs"
                        >
                          <span className="flex items-center gap-2">
                            <span>{getStatusIcon(status)}</span>
                            {status}
                          </span>
                        </DropdownMenuItem>
                      ),
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Collaborators */}
              <div className="space-y-2">
                <Label className="text-xs font-medium flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  Collaborators ({collaborators.length})
                </Label>

                {/* Collaborator List */}
                <div className="space-y-2 max-h-24 overflow-y-auto">
                  {collaborators.map((collaborator, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 rounded px-2 py-1.5"
                    >
                      <Avatar className="w-5 h-5">
                        <AvatarImage
                          src={collaborator.avatar}
                          alt={collaborator.name}
                        />
                        <AvatarFallback className="text-xs bg-blue-100 text-blue-700">
                          {collaborator.name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium truncate">
                          {collaborator.name}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          @{collaborator.username}
                        </div>
                      </div>
                    </div>
                  ))}
                  {collaborators.length === 0 && (
                    <div className="text-xs text-muted-foreground italic text-center py-2">
                      No collaborators assigned
                    </div>
                  )}
                </div>
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>

        {/* Tags Section */}
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
              {/* Add Tag */}
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

              {/* Tags List */}
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

        {/* Template Sections */}
        <div className="p-4 space-y-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedTemplate.id}
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
                    key={`${selectedTemplate.id}-${section.id}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="space-y-2"
                  >
                    <div className="flex items-start justify-between gap-1">
                      <Label
                        htmlFor={`section-${section.id}`}
                        className="text-sm font-bold flex items-center gap-1 flex-1 min-w-0"
                      >
                        <div
                          className={`w-2 h-2 rounded-full flex-shrink-0 ${
                            hasContent(section) ? 'bg-green-500' : 'bg-gray-300'
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
                              !section.items[section.items.length - 1]?.trim()
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
                          updateSectionContent(section.id, e.target.value)
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
                                {getSingularName(section.id)} {itemIndex + 1}
                              </Label>
                              <textarea
                                className="w-full px-2 py-1 text-xs border rounded-md resize-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 min-h-[40px]"
                                placeholder={`Enter ${getSingularName(section.id).toLowerCase()} ${itemIndex + 1}...`}
                                value={item}
                                onChange={(e) =>
                                  updateItemContent(
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
                        value={section.content}
                        onChange={(e) =>
                          updateSectionContent(section.id, e.target.value)
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
      </div>

      {/* Fixed Action Buttons */}
      <div className="p-4 border-t space-y-2 flex-shrink-0 bg-background">
        <Button onClick={copyToClipboard} className="w-full text-xs h-8">
          Push ADR
        </Button>
        <div className="text-xs text-muted-foreground text-center">
          {sections.filter(hasContent).length} / {sections.length} completed
        </div>
      </div>
    </div>
  )
}
