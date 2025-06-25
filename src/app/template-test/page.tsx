'use client'

import React from 'react'
import AdrTemplateSidebar from '@/components/adr-template-sidebar'

export default function TemplateTestPage() {
  return (
    <div className="h-screen flex">
      <div className="flex-1 bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">ADR Template Builder</h1>
          <p className="text-lg text-muted-foreground mb-8">
            Choose a template and build your Architecture Decision Record
          </p>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-lg max-w-md">
            <h2 className="text-xl font-semibold mb-4">Features:</h2>
            <ul className="text-left space-y-2 text-muted-foreground">
              <li>• 3 different ADR templates</li>
              <li>• Dynamic list management</li>
              <li>• Pre-populated examples</li>
              <li>• Copy to clipboard</li>
              <li>• Smooth animations</li>
            </ul>
          </div>
        </div>
      </div>
      <AdrTemplateSidebar />
    </div>
  )
}
