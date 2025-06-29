'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ADR_TEMPLATES } from '@/app/[repo]/adr/[adrName]/adr-templates'
import type { AdrTemplate } from '@/definitions/types'
import { CheckCircle, FileText, Lightbulb, Edit3 } from 'lucide-react'

interface TemplateSelectionDialogProps {
  open: boolean
  onClose: () => void
  onSelectTemplate: (template: AdrTemplate) => void
  onCancel?: () => void
  showChangeWarning?: boolean
  mandatory?: boolean
}

const templateIcons = {
  'madr-minimal': FileText,
  'madr-full': CheckCircle,
  'y-statement': Lightbulb,
  'free-form': Edit3,
}

export default function TemplateSelectionDialog({
  open,
  onClose,
  onSelectTemplate,
  onCancel,
  showChangeWarning = false,
  mandatory = false,
}: TemplateSelectionDialogProps) {
  const handleSelectTemplate = (template: AdrTemplate) => {
    onSelectTemplate(template)
    onClose()
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (mandatory && !newOpen) {
      return
    }
    if (!newOpen) {
      onClose()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className=" max-w-max">
        <DialogHeader>
          <DialogTitle>
            {showChangeWarning ? 'Change Template' : 'Choose ADR Template'}
          </DialogTitle>
          <DialogDescription>
            {showChangeWarning
              ? 'Changing the template will clear all current content. This action cannot be undone.'
              : 'Select a template to structure your Architecture Decision Record.'}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 py-4">
          {ADR_TEMPLATES.map((template) => {
            const Icon =
              templateIcons[template.id as keyof typeof templateIcons] ??
              FileText
            return (
              <motion.div
                key={template.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  variant="outline"
                  className="w-full h-auto p-4 flex flex-col items-start gap-2 text-left justify-start"
                  onClick={() => handleSelectTemplate(template)}
                >
                  <div className="flex items-center gap-2 w-full">
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span className="font-semibold">{template.name}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {template.description}
                  </p>
                </Button>
              </motion.div>
            )
          })}
        </div>
        {mandatory && onCancel && (
          <div className="flex justify-center pt-2 border-t">
            <Button
              variant="ghost"
              onClick={onCancel}
              className="text-muted-foreground"
            >
              Cancel ADR Creation
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
