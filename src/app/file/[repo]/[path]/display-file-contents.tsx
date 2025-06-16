'use client'
import React from 'react'

import '@mdxeditor/editor/style.css'
import { ForwardRefEditor } from '@/components/MDXEditor/ForwardRefEditor'

export default function DisplayFileContents({
  markdown,
}: {
  markdown: string
}) {
  return <ForwardRefEditor markdown={markdown} />
}
