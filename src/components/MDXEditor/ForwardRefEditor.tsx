'use client'
import dynamic from 'next/dynamic'
import { forwardRef } from 'react'
import { type MDXEditorMethods, type MDXEditorProps } from '@mdxeditor/editor'

// This is the only place InitializedMDXEditor is imported directly.
const Editor = dynamic(() => import('./InitializedMDXEditor'), {
  // Make sure we turn SSR off
  ssr: false,
})

// This is what is imported by other components. Pre-initialized with plugins, and ready
// to accept other props, including a ref.
export const ForwardRefEditor = forwardRef<
  MDXEditorMethods,
  MDXEditorProps & {
    onEditorReady?: (element: HTMLElement) => void
    readOnly: boolean
    diffMarkdown?: string
  }
>((props, ref) => (
  <Editor
    {...props}
    editorRef={ref}
    className={props.className}
    onEditorReady={props.onEditorReady}
    markdown={props.markdown}
    readOnly={props.readOnly}
    diffMarkdown={props.diffMarkdown}
  />
))

// TS complains without the following line
ForwardRefEditor.displayName = 'ForwardRefEditor'
