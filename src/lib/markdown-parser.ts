// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import md2json from 'md-2-json'

export interface ParsedSection {
  id: string
  title: string
  content: string
  level: number
}

export function parseMarkdownToSections(markdown: string): ParsedSection[] {
  if (!markdown.trim()) return []
  // if (!markdown) return [];

  try {
    const parsed = md2json.parse(markdown)
    const sections: ParsedSection[] = []

    const extractSections = (obj: any, parentPath = '', level = 1) => {
      Object.keys(obj).forEach((key) => {
        if (key === 'raw') return // Skip raw content

        const value = obj[key]
        const currentPath = parentPath ? `${parentPath}.${key}` : key

        // If this object has raw content, it's a section
        if (value && typeof value === 'object' && value.raw) {
          sections.push({
            id: currentPath.replace(/\./g, '_').toLowerCase(),
            title: key,
            content: value.raw.trim(),
            // content: value.raw,
            level,
          })
        }

        // Recursively process nested sections
        if (value && typeof value === 'object' && !value.raw) {
          extractSections(value, currentPath, level + 1)
        }
      })
    }

    extractSections(parsed)
    return sections
  } catch (error) {
    console.error('Error parsing markdown:', error)
    return []
  }
}

export function sectionsToMarkdown(sections: ParsedSection[]): string {
  return sections
    .map((section) => {
      const headingLevel = '#'.repeat(section.level)
      return `${headingLevel} ${section.title}\n\n${section.content}`
    })
    .join('\n\n')
}

export function updateSectionInMarkdown(
  markdown: string,
  sectionId: string,
  newContent: string,
): string {
  const sections = parseMarkdownToSections(markdown)
  const updatedSections = sections.map((section) =>
    section.id === sectionId ? { ...section, content: newContent } : section,
  )
  return sectionsToMarkdown(updatedSections)
}

export function addSectionToMarkdown(
  markdown: string,
  title: string,
  content = '',
  level = 1,
  insertAfter?: string,
): string {
  const sections = parseMarkdownToSections(markdown)
  const newSection: ParsedSection = {
    id: title.toLowerCase().replace(/\s+/g, '_'),
    title,
    content,
    level,
  }

  if (insertAfter) {
    const insertIndex = sections.findIndex((s) => s.id === insertAfter)
    if (insertIndex !== -1) {
      sections.splice(insertIndex + 1, 0, newSection)
    } else {
      sections.push(newSection)
    }
  } else {
    sections.push(newSection)
  }

  return sectionsToMarkdown(sections)
}

export function removeSectionFromMarkdown(
  markdown: string,
  sectionId: string,
): string {
  const sections = parseMarkdownToSections(markdown)
  const filteredSections = sections.filter(
    (section) => section.id !== sectionId,
  )
  return sectionsToMarkdown(filteredSections)
}

export function slugify(text: string): string {
  return text
    .toLowerCase() // lowercase
    .replace(/[\s]+/g, '-') // spaces → hyphens
    .replace(/[^\w\-]+/g, '') // remove non-word chars
    .replace(/\-+/g, '-') // collapse multiple hyphens
}
