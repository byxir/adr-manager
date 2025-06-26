import { Skeleton } from '@/components/ui/skeleton'
import {
  RiBracesLine,
  RiCodeSSlashLine,
  RiFileLine,
  RiFileTextLine,
  RiImageLine,
  RiReactjsLine,
} from '@remixicon/react'

export const SkeletonEditor = () => {
  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-2 border-b border-neutral-900 p-2">
        <Skeleton className="h-7 w-full rounded-sm" />
      </div>

      {/* Editor Area */}
      <div className="flex-1 p-4 space-y-2 font-mono text-sm">
        <Skeleton className="h-5 w-12 rounded-sm" /> {/* Line number */}
        <div className="flex gap-2">
          <Skeleton className="h-5 w-4 rounded-sm" /> {/* Indent */}
          <Skeleton className="h-5 w-48 rounded-sm" /> {/* Keyword */}
          <Skeleton className="h-5 w-64 rounded-sm" /> {/* Variable */}
          <Skeleton className="h-5 w-4 rounded-sm" /> {/* Operator */}
          <Skeleton className="h-5 w-32 rounded-sm" /> {/* Value */}
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-5 w-4 rounded-sm" /> {/* Indent */}
          <Skeleton className="h-5 w-72 rounded-sm" /> {/* Function call */}
          <Skeleton className="h-5 w-4 rounded-sm" /> {/* Parenthesis */}
          <Skeleton className="h-5 w-48 rounded-sm" /> {/* Argument */}
          <Skeleton className="h-5 w-4 rounded-sm" /> {/* Parenthesis */}
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-5 w-4 rounded-sm" /> {/* Indent */}
          <Skeleton className="h-5 w-96 rounded-sm" /> {/* Comment */}
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-5 w-4 rounded-sm" /> {/* Indent */}
          <Skeleton className="h-5 w-80 rounded-sm" /> {/* Code block */}
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-5 w-4 rounded-sm" /> {/* Indent */}
          <Skeleton className="h-5 w-40 rounded-sm" /> {/* Keyword */}
          <Skeleton className="h-5 w-72 rounded-sm" /> {/* Condition */}
        </div>
        <div className="flex gap-2 pl-6">
          <Skeleton className="h-5 w-4 rounded-sm" /> {/* Nested indent */}
          <Skeleton className="h-5 w-96 rounded-sm" /> {/* Nested code */}
        </div>
        <div className="flex gap-2 pl-6">
          <Skeleton className="h-5 w-4 rounded-sm" /> {/* Nested indent */}
          <Skeleton className="h-5 w-64 rounded-sm" /> {/* Nested code */}
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-5 w-4 rounded-sm" /> {/* Indent */}
          <Skeleton className="h-5 w-48 rounded-sm" /> {/* Closing brace */}
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-5 w-4 rounded-sm" /> {/* Indent */}
          <Skeleton className="h-5 w-80 rounded-sm" /> {/* Code block */}
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-5 w-4 rounded-sm" /> {/* Indent */}
          <Skeleton className="h-5 w-56 rounded-sm" /> {/* Variable */}
          <Skeleton className="h-5 w-4 rounded-sm" /> {/* Operator */}
          <Skeleton className="h-5 w-64 rounded-sm" /> {/* Value */}
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-5 w-4 rounded-sm" /> {/* Indent */}
          <Skeleton className="h-5 w-72 rounded-sm" /> {/* Function call */}
        </div>
        <div className="flex gap-2 pl-6">
          <Skeleton className="h-5 w-4 rounded-sm" /> {/* Nested indent */}
          <Skeleton className="h-5 w-88 rounded-sm" /> {/* Nested code */}
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-5 w-4 rounded-sm" /> {/* Indent */}
          <Skeleton className="h-5 w-40 rounded-sm" /> {/* Closing brace */}
        </div>
      </div>
    </div>
  )
}

// Helper function to get icon based on file extension
export function getFileIcon(extension: string | undefined, className: string) {
  switch (extension) {
    case 'tsx':
    case 'jsx':
      return <RiReactjsLine className={className} />
    case 'ts':
    case 'js':
    case 'mjs':
      return <RiCodeSSlashLine className={className} />
    case 'json':
      return <RiBracesLine className={className} />
    case 'svg':
    case 'ico':
    case 'png':
    case 'jpg':
      return <RiImageLine className={className} />
    case 'md':
      return <RiFileTextLine className={className} />
    default:
      return <RiFileLine className={className} />
  }
}
