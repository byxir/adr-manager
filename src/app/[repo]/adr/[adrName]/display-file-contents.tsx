'use client'
import React, { forwardRef } from 'react'

import '@mdxeditor/editor/style.css'
import { ForwardRefEditor } from '@/components/MDXEditor/ForwardRefEditor'
import type { MDXEditorMethods } from '@mdxeditor/editor'

export default forwardRef<
  MDXEditorMethods,
  {
    markdown: string
    className?: string
    onEditorReady?: (element: HTMLElement) => void
    templateMarkdown: string
  }
>(function DisplayFileContents(
  { markdown, className, onEditorReady, templateMarkdown },
  ref,
) {
  return (
    <ForwardRefEditor
      markdown={markdown}
      ref={ref}
      className={className}
      onEditorReady={onEditorReady}
      templateMarkdown={templateMarkdown}
    />
  )
})
