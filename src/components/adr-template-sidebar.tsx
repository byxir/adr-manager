'use client'

import React, { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ADR_TEMPLATES } from '@/lib/adr-templates'
import type { AdrTemplateSection, AdrTemplate } from '@/definitions/types'
import { Plus, Minus, FileText, Lightbulb, CheckCircle } from 'lucide-react'

interface ExtendedSection extends AdrTemplateSection {
  items?: string[] // For list sections
}

export default function AdrTemplateSidebar() {
  const [selectedTemplate, setSelectedTemplate] = useState<AdrTemplate>(
    ADR_TEMPLATES[0]!,
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
