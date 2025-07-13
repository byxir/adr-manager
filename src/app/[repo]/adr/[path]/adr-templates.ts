import type { AdrTemplate, AdrTemplateSection } from '@/definitions/types'

export type AdrStatus = 'todo' | 'in-progress' | 'done' | 'backlog'

export interface ParsedAdrContent {
  sections: AdrTemplateSection[]
  status?: AdrStatus
  tags?: string[]
  frontmatter?: Record<string, any>
}

export interface GenerateMarkdownOptions {
  status?: AdrStatus
  tags?: string[]
  frontmatter?: Record<string, any>
}

// Utility function to trim trailing whitespace from each line and overall content
const trimLineTrailingWhitespace = (content: string): string => {
  return content.replace('&#x20;', '').trim().replace(/&+$/, '') // Remove leading/trailing whitespace and trailing & characters
}

// Helper function to parse frontmatter and preserve all content
const parseFrontmatter = (
  markdown: string,
): {
  content: string
  status?: AdrStatus
  tags?: string[]
  frontmatter?: Record<string, any>
} => {
  const frontmatterMatch = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/m.exec(
    markdown,
  )

  if (!frontmatterMatch || frontmatterMatch.length < 3) {
    return { content: markdown }
  }

  const frontmatterContent = frontmatterMatch[1]!
  const remainingContent = frontmatterMatch[2]!
  const status = extractStatusFromFrontmatter(frontmatterContent)
  const tags = extractTagsFromFrontmatter(frontmatterContent)
  const frontmatter = parseFrontmatterToObject(frontmatterContent)

  return {
    content: remainingContent,
    status,
    tags,
    frontmatter,
  }
}

// Helper function to parse frontmatter into an object
const parseFrontmatterToObject = (
  frontmatterContent: string,
): Record<string, any> => {
  const frontmatter: Record<string, any> = {}
  const lines = frontmatterContent.split('\n')

  for (const line of lines) {
    // Skip comments and empty lines
    if (line.trim().startsWith('#') || line.trim() === '') {
      continue
    }

    const match = /^([^:]+):\s*(.*)$/.exec(line)
    if (match) {
      const key = match[1]!.trim()
      const value = match[2]!.trim()

      // Handle different value types
      if (value.startsWith('[') && value.endsWith(']')) {
        // Array value
        try {
          frontmatter[key] = JSON.parse(value)
        } catch {
          frontmatter[key] = value
        }
      } else if (value.startsWith('"') && value.endsWith('"')) {
        // String value
        frontmatter[key] = value.slice(1, -1)
      } else if (value.startsWith("'") && value.endsWith("'")) {
        // String value with single quotes
        frontmatter[key] = value.slice(1, -1)
      } else {
        // Plain value
        frontmatter[key] = value
      }
    }
  }

  return frontmatter
}

// Helper function to generate frontmatter from object
const generateFrontmatter = (options: GenerateMarkdownOptions): string => {
  const frontmatter = { ...options.frontmatter }

  // Update status if provided
  if (options.status) {
    frontmatter.status = options.status
  }

  // Update tags if provided (including empty array to remove tags)
  if (options.tags !== undefined) {
    if (options.tags.length > 0) {
      frontmatter.tags = options.tags
    } else {
      // Remove tags from frontmatter if empty array is passed
      delete frontmatter.tags
    }
  }

  // If no frontmatter content, return empty string
  if (!frontmatter || Object.keys(frontmatter).length === 0) {
    return ''
  }

  const frontmatterLines: string[] = []

  // Add comments if they exist
  if (frontmatter['#comment']) {
    frontmatterLines.push(
      '# These are optional metadata elements. Feel free to remove any of them.',
    )
  }

  // Add all frontmatter fields
  for (const [key, value] of Object.entries(frontmatter)) {
    if (key.startsWith('#')) continue // Skip comments

    if (Array.isArray(value)) {
      const tagList = value.map((tag) => `"${tag}"`).join(', ')
      frontmatterLines.push(`${key}: [${tagList}]`)
    } else if (typeof value === 'string') {
      frontmatterLines.push(`${key}: "${value}"`)
    } else {
      frontmatterLines.push(`${key}: ${value}`)
    }
  }

  return `---\n${frontmatterLines.join('\n')}\n---\n\n`
}

// Helper function to create MADR full frontmatter
const createMADRFullFrontmatter = (
  existingFrontmatter?: Record<string, any>,
): Record<string, any> => {
  const defaultFrontmatter = {
    '#comment': true,
    status: 'proposed',
    date: new Date().toISOString().split('T')[0],
    'decision-makers': '',
    consulted: '',
    informed: '',
  }

  // Merge with existing frontmatter, preserving existing values
  return { ...defaultFrontmatter, ...existingFrontmatter }
}

// Helper function to extract status from frontmatter
const extractStatusFromFrontmatter = (
  frontmatter: string,
): AdrStatus | undefined => {
  const statusMatch =
    /^status:\s*["']?(todo|in-progress|done|backlog)["']?\s*$/m.exec(
      frontmatter,
    )
  return statusMatch?.[1] as AdrStatus | undefined
}

// Helper function to extract tags from frontmatter
const extractTagsFromFrontmatter = (
  frontmatter: string,
): string[] | undefined => {
  const tagsMatch = /^tags:\s*\[(.*?)\]\s*$/m.exec(frontmatter)
  if (!tagsMatch?.[1]) {
    return undefined
  }

  const tagString = tagsMatch[1]
  const tags = tagString
    .split(',')
    .map((tag) => {
      return tag.trim().replace(/^["']|["']$/g, '')
    })
    .filter((tag) => tag.length > 0)

  return tags.length > 0 ? tags : undefined
}

const MADR_MINIMAL_SECTIONS: AdrTemplateSection[] = [
  {
    id: 'title',
    title: 'Title',
    placeholder: 'Short title',
    content: '',
    isRequired: true,
  },
  {
    id: 'context',
    title: 'Context and Problem Statement',
    placeholder: 'Describe the context and problem statement...',
    content: '',
    isRequired: true,
  },
  {
    id: 'options',
    title: 'Considered Options',
    placeholder:
      '* Title of option 1\n* Title of option 2\n* Title of option 3',
    content: '',
    isRequired: true,
  },
  {
    id: 'decision',
    title: 'Decision Outcome',
    placeholder: 'Chosen option: "title of option", because justification...',
    content: '',
    isRequired: true,
  },
  {
    id: 'consequences',
    title: 'Consequences',
    placeholder: '* Good, because...\n* Bad, because...',
    content: '',
    isRequired: false,
  },
]

const MADR_FULL_SECTIONS: AdrTemplateSection[] = [
  {
    id: 'title',
    title: 'Title',
    placeholder: 'Short title',
    content: '',
    isRequired: true,
  },
  {
    id: 'context',
    title: 'Context and Problem Statement',
    placeholder: 'Describe the context and problem statement...',
    content: '',
    isRequired: true,
  },
  {
    id: 'drivers',
    title: 'Decision Drivers',
    placeholder: '* Decision driver 1\n* Decision driver 2',
    content: '',
    isRequired: false,
  },
  {
    id: 'options',
    title: 'Considered Options',
    placeholder:
      '* Title of option 1\n* Title of option 2\n* Title of option 3',
    content: '',
    isRequired: true,
  },
  {
    id: 'decision',
    title: 'Decision Outcome',
    placeholder: 'Chosen option: "title of option", because justification...',
    content: '',
    isRequired: true,
  },
  {
    id: 'consequences',
    title: 'Consequences',
    placeholder: '* Good, because...\n* Bad, because...',
    content: '',
    isRequired: false,
  },
  {
    id: 'confirmation',
    title: 'Confirmation',
    placeholder: 'Describe how the implementation can be confirmed...',
    content: '',
    isRequired: false,
  },
  {
    id: 'proscons',
    title: 'Pros and Cons of the Options',
    placeholder: '### Option 1\n\n* Good, because...\n* Bad, because...',
    content: '',
    isRequired: false,
  },
  {
    id: 'moreinfo',
    title: 'More Information',
    placeholder:
      'Additional evidence, team agreement, links to other decisions...',
    content: '',
    isRequired: false,
  },
]

const Y_STATEMENT_SECTIONS: AdrTemplateSection[] = [
  {
    id: 'context',
    title: 'In the context of',
    placeholder:
      'functional requirement (story, use case) or architectural component',
    content: '',
    isRequired: true,
  },
  {
    id: 'facing',
    title: 'facing',
    placeholder: 'non-functional requirement, for instance a desired quality',
    content: '',
    isRequired: true,
  },
  {
    id: 'decided',
    title: 'we decided for',
    placeholder: 'decision outcome (the most important part)',
    content: '',
    isRequired: true,
  },
  {
    id: 'neglected',
    title: 'and against',
    placeholder: 'alternatives not chosen (not to be forgotten!)',
    content: '',
    isRequired: true,
  },
  {
    id: 'achieve',
    title: 'to achieve',
    placeholder: 'benefits, the full or partial satisfaction of requirement(s)',
    content: '',
    isRequired: true,
  },
  {
    id: 'accepting',
    title: 'accepting that',
    placeholder:
      'drawbacks and other consequences, for instance impact on other properties/context and effort/cost',
    content: '',
    isRequired: true,
  },
  {
    id: 'rationale',
    title: 'Rationale',
    placeholder:
      'Additional explanation of the reasoning behind this decision...',
    content: '',
    isRequired: false,
  },
  {
    id: 'references',
    title: 'References',
    placeholder:
      'Links to documentation, articles, or other relevant resources...',
    content: '',
    isRequired: false,
  },
]

export const FREE_FORM_SECTIONS: AdrTemplateSection[] = [
  {
    id: 'content',
    title: 'Free Form Content',
    placeholder:
      'Enter your Architecture Decision Record content in markdown format...',
    content: '',
    isRequired: true,
  },
]

const generateMADRMinimalMarkdown = (
  sections: AdrTemplateSection[],
  options?: GenerateMarkdownOptions,
): string => {
  const sectionMap = sections.reduce(
    (acc, section) => {
      acc[section.id] = section.content
      return acc
    },
    {} as Record<string, string>,
  )

  // Always generate frontmatter, even if no options provided
  const frontmatter = generateFrontmatter(options ?? {})

  return `${frontmatter}# ${sectionMap.title ?? ''}

## Context and Problem Statement

${sectionMap.context ?? ''}

## Considered Options

${sectionMap.options ?? ''}

## Decision Outcome

${sectionMap.decision ?? ''}

### Consequences

${sectionMap.consequences ?? ''}
`
}

const generateMADRFullMarkdown = (
  sections: AdrTemplateSection[],
  options?: GenerateMarkdownOptions,
): string => {
  const sectionMap = sections.reduce(
    (acc, section) => {
      acc[section.id] = section.content
      return acc
    },
    {} as Record<string, string>,
  )

  // For MADR Full, always include the default metadata if no frontmatter exists
  const frontmatterOptions: GenerateMarkdownOptions = {
    ...options,
    frontmatter: createMADRFullFrontmatter(options?.frontmatter),
  }

  const frontmatter = generateFrontmatter(frontmatterOptions)

  return `${frontmatter}# ${sectionMap.title ?? ''}

## Context and Problem Statement

${sectionMap.context ?? '\n\n'}

## Decision Drivers

${sectionMap.drivers ?? ''}

## Considered Options

${sectionMap.options ?? ''}

## Decision Outcome

${sectionMap.decision ?? ''}

### Consequences

${sectionMap.consequences ?? ''}

### Confirmation

${sectionMap.confirmation ?? ''}

## Pros and Cons of the Options

${sectionMap.proscons ?? ''}

## More Information

${sectionMap.moreinfo ?? ''}
`
}

const generateYStatementMarkdown = (
  sections: AdrTemplateSection[],
  options?: GenerateMarkdownOptions,
): string => {
  const sectionMap = sections.reduce(
    (acc, section) => {
      acc[section.id] = section.content
      return acc
    },
    {} as Record<string, string>,
  )

  // Always generate frontmatter, even if no options provided
  const frontmatter = generateFrontmatter(options ?? {})

  return `${frontmatter}# Y-Statement: ${sectionMap.decided ?? ''}

In the context of ${sectionMap.context ?? ''}
facing ${sectionMap.facing ?? ''}
we decided for ${sectionMap.decided ?? ''}
and against ${sectionMap.neglected ?? ''}
to achieve ${sectionMap.achieve ?? ''}
accepting that ${sectionMap.accepting ?? ''}

## Rationale

${sectionMap.rationale ?? ''}

## References

${sectionMap.references ?? ''}
`
}

const generateFreeFormMarkdown = (
  sections: AdrTemplateSection[],
  options?: GenerateMarkdownOptions,
): string => {
  const sectionMap = sections.reduce(
    (acc, section) => {
      acc[section.id] = section.content
      return acc
    },
    {} as Record<string, string>,
  )

  // Always generate frontmatter, even if no options provided
  const frontmatter = generateFrontmatter(options ?? {})
  const content = sectionMap.content ?? ''

  return frontmatter + content
}

const parseMADRMinimalMarkdown = (markdown: string): ParsedAdrContent => {
  const { content, status, tags, frontmatter } = parseFrontmatter(markdown)
  const sections = MADR_MINIMAL_SECTIONS.map((section) => ({ ...section }))

  const titleMatch = /^# (.+)/m.exec(content)
  if (titleMatch?.[1]) {
    const titleSection = sections.find((s) => s.id === 'title')
    if (titleSection)
      titleSection.content = trimLineTrailingWhitespace(titleMatch[1])
  }

  const contextMatch =
    /(?:^|\n)## Context and Problem Statement\s[^\n]*\n(.*?\n*)(?=#|$)/gs.exec(
      content,
    )

  if (contextMatch?.[1]) {
    const contextSection = sections.find((s) => s.id === 'context')
    if (contextSection)
      contextSection.content = trimLineTrailingWhitespace(contextMatch[1])
  }

  const optionsMatch =
    /(?:^|\n)## Considered Options\s[^\n]*\n(.*?\n*)(?=#|$)/gs.exec(content)
  if (optionsMatch?.[1]) {
    const optionsSection = sections.find((s) => s.id === 'options')
    if (optionsSection)
      optionsSection.content = trimLineTrailingWhitespace(optionsMatch[1])
  }

  const decisionMatch =
    /(?:^|\n)## Decision Outcome\s[^\n]*\n(.*?\n*)(?=#|$)/gs.exec(content)
  if (decisionMatch?.[1]) {
    const decisionSection = sections.find((s) => s.id === 'decision')
    if (decisionSection)
      decisionSection.content = trimLineTrailingWhitespace(decisionMatch[1])
  }

  const consequencesMatch =
    /(?:^|\n)### Consequences\s[^\n]*\n(.*?\n*)(?=#|$)/gs.exec(content)
  if (consequencesMatch?.[1]) {
    const consequencesSection = sections.find((s) => s.id === 'consequences')
    if (consequencesSection)
      consequencesSection.content = trimLineTrailingWhitespace(
        consequencesMatch[1],
      )
  }

  return { sections, status, tags, frontmatter }
}

const parseMADRFullMarkdown = (markdown: string): ParsedAdrContent => {
  const { content, status, tags, frontmatter } = parseFrontmatter(markdown)
  const sections = MADR_FULL_SECTIONS.map((section) => ({ ...section }))

  const titleMatch = /^# (.+)/m.exec(content)
  if (titleMatch?.[1]) {
    const titleSection = sections.find((s) => s.id === 'title')
    if (titleSection)
      titleSection.content = trimLineTrailingWhitespace(titleMatch[1])
  }

  const contextMatch =
    /(?:^|\n)## Context and Problem Statement\s[^\n]*\n(.*?\n*)(?=#|$)/gs.exec(
      content,
    )
  if (contextMatch?.[1]) {
    const contextSection = sections.find((s) => s.id === 'context')
    if (contextSection)
      contextSection.content = trimLineTrailingWhitespace(contextMatch[1])
  }

  const driversMatch =
    /(?:^|\n)## Decision Drivers\s[^\n]*\n(.*?\n*)(?=#|$)/gs.exec(content)
  if (driversMatch?.[1]) {
    const driversSection = sections.find((s) => s.id === 'drivers')
    if (driversSection)
      driversSection.content = trimLineTrailingWhitespace(driversMatch[1])
  }

  const optionsMatch =
    /(?:^|\n)## Considered Options\s[^\n]*\n(.*?\n*)(?=#|$)/gs.exec(content)
  if (optionsMatch?.[1]) {
    const optionsSection = sections.find((s) => s.id === 'options')
    if (optionsSection)
      optionsSection.content = trimLineTrailingWhitespace(optionsMatch[1])
  }

  const decisionMatch =
    /(?:^|\n)## Decision Outcome\s[^\n]*\n(.*?\n*)(?=#|$)/gs.exec(content)
  if (decisionMatch?.[1]) {
    const decisionSection = sections.find((s) => s.id === 'decision')
    if (decisionSection)
      decisionSection.content = trimLineTrailingWhitespace(decisionMatch[1])
  }

  const consequencesMatch =
    /(?:^|\n)### Consequences\s[^\n]*\n(.*?\n*)(?=#|$)/gs.exec(content)
  if (consequencesMatch?.[1]) {
    const consequencesSection = sections.find((s) => s.id === 'consequences')
    if (consequencesSection)
      consequencesSection.content = trimLineTrailingWhitespace(
        consequencesMatch[1],
      )
  }

  const confirmationMatch =
    /(?:^|\n)### Confirmation\s[^\n]*\n(.*?\n*)(?=#|$)/gs.exec(content)
  if (confirmationMatch?.[1]) {
    const confirmationSection = sections.find((s) => s.id === 'confirmation')
    if (confirmationSection)
      confirmationSection.content = trimLineTrailingWhitespace(
        confirmationMatch[1],
      )
  }

  const prosconsMatch =
    /(?:^|\n)## Pros and Cons of the Options\s[^\n]*\n(.*?\n*)(?=#|$)/gs.exec(
      content,
    )
  if (prosconsMatch?.[1]) {
    const prosconsSection = sections.find((s) => s.id === 'proscons')
    if (prosconsSection)
      prosconsSection.content = trimLineTrailingWhitespace(prosconsMatch[1])
  }

  const moreinfoMatch =
    /(?:^|\n)## More Information\s[^\n]*\n(.*?\n*)(?=#|$)/gs.exec(content)
  if (moreinfoMatch?.[1]) {
    const moreinfoSection = sections.find((s) => s.id === 'moreinfo')
    if (moreinfoSection)
      moreinfoSection.content = trimLineTrailingWhitespace(moreinfoMatch[1])
  }

  return { sections, status, tags, frontmatter }
}

const parseYStatementMarkdown = (markdown: string): ParsedAdrContent => {
  const { content, status, tags, frontmatter } = parseFrontmatter(markdown)
  const sections = Y_STATEMENT_SECTIONS.map((section) => ({ ...section }))

  const titleMatch = /# Y-Statement: (.+)/m.exec(content)
  if (titleMatch) {
    const decidedSection = sections.find((s) => s.id === 'decided')
    if (decidedSection && titleMatch?.[1])
      decidedSection.content = trimLineTrailingWhitespace(titleMatch[1])
  }

  // Parse each prefix and its content
  const contextMatch =
    /In the context of\s+([\s\S]*?)(?=^facing\s|^we decided for\s|^and against\s|^to achieve\s|^accepting that\s|$)/m.exec(
      content,
    )
  if (contextMatch?.[1]) {
    const contextSection = sections.find((s) => s.id === 'context')
    if (contextSection)
      contextSection.content = trimLineTrailingWhitespace(contextMatch[1])
  }

  const facingMatch =
    /^facing\s+([\s\S]*?)(?=^we decided for\s|^and against\s|^to achieve\s|^accepting that\s|$)/m.exec(
      content,
    )
  if (facingMatch?.[1]) {
    const facingSection = sections.find((s) => s.id === 'facing')
    if (facingSection)
      facingSection.content = trimLineTrailingWhitespace(facingMatch[1])
  }

  const decidedMatch =
    /^we decided for\s+([\s\S]*?)(?=^and against\s|^to achieve\s|^accepting that\s|$)/m.exec(
      content,
    )
  if (decidedMatch?.[1]) {
    const decidedSection = sections.find((s) => s.id === 'decided')
    if (decidedSection)
      decidedSection.content = trimLineTrailingWhitespace(decidedMatch[1])
  }

  const neglectedMatch =
    /^and against\s+([\s\S]*?)(?=^to achieve\s|^accepting that\s|$)/m.exec(
      content,
    )
  if (neglectedMatch?.[1]) {
    const neglectedSection = sections.find((s) => s.id === 'neglected')
    if (neglectedSection)
      neglectedSection.content = trimLineTrailingWhitespace(neglectedMatch[1])
  }

  const achieveMatch = /^to achieve\s+([\s\S]*?)(?=^accepting that\s|$)/m.exec(
    content,
  )
  if (achieveMatch?.[1]) {
    const achieveSection = sections.find((s) => s.id === 'achieve')
    if (achieveSection)
      achieveSection.content = trimLineTrailingWhitespace(achieveMatch[1])
  }

  const acceptingMatch = /^accepting that\s+([\s\S]*?\n*)(?=#|$)/m.exec(content)
  if (acceptingMatch?.[1]) {
    const acceptingSection = sections.find((s) => s.id === 'accepting')
    if (acceptingSection)
      acceptingSection.content = trimLineTrailingWhitespace(acceptingMatch[1])
  }

  const rationaleMatch = /(?:^|\n)## Rationale\s[^\n]*\n(.*?\n*)(?=#|$)/gs.exec(
    content,
  )

  if (rationaleMatch?.[1]) {
    const rationaleSection = sections.find((s) => s.id === 'rationale')
    if (rationaleSection)
      rationaleSection.content = trimLineTrailingWhitespace(rationaleMatch[1])
  }

  const referencesMatch =
    /(?:^|\n)## References\s[^\n]*\n(.*?\n*)(?=#|$)/gs.exec(content)

  if (referencesMatch?.[1]) {
    const referencesSection = sections.find((s) => s.id === 'references')
    if (referencesSection)
      referencesSection.content = trimLineTrailingWhitespace(referencesMatch[1])
  }

  return { sections, status, tags, frontmatter }
}

const parseFreeFormMarkdown = (markdown: string): ParsedAdrContent => {
  const { content, status, tags, frontmatter } = parseFrontmatter(markdown)
  const sections = FREE_FORM_SECTIONS.map((section) => ({ ...section }))

  const contentSection = sections.find((s) => s.id === 'content')
  if (contentSection) {
    contentSection.content = content
  }

  return { sections, status, tags, frontmatter }
}

export const TEMPLATE_PARSERS = {
  'madr-minimal': {
    parseMarkdown: parseMADRMinimalMarkdown,
    generateMarkdown: generateMADRMinimalMarkdown,
  },
  'madr-full': {
    parseMarkdown: parseMADRFullMarkdown,
    generateMarkdown: generateMADRFullMarkdown,
  },
  'y-statement': {
    parseMarkdown: parseYStatementMarkdown,
    generateMarkdown: generateYStatementMarkdown,
  },
  'free-form': {
    parseMarkdown: parseFreeFormMarkdown,
    generateMarkdown: generateFreeFormMarkdown,
  },
} as const

export const ADR_TEMPLATES: AdrTemplate[] = [
  {
    id: 'madr-minimal',
    name: 'MADR Minimal',
    description: 'A minimal MADR template with essential sections',
    sections: MADR_MINIMAL_SECTIONS,
    generateMarkdown: (sections: AdrTemplateSection[]) =>
      generateMADRMinimalMarkdown(sections),
  },
  {
    id: 'madr-full',
    name: 'MADR Full',
    description: 'A comprehensive MADR template with all optional sections',
    sections: MADR_FULL_SECTIONS,
    generateMarkdown: (sections: AdrTemplateSection[]) =>
      generateMADRFullMarkdown(sections),
  },
  {
    id: 'y-statement',
    name: 'Y-Statement',
    description:
      'A concise Y-statement template focusing on the "why" of decisions',
    sections: Y_STATEMENT_SECTIONS,
    generateMarkdown: (sections: AdrTemplateSection[]) =>
      generateYStatementMarkdown(sections),
  },
  {
    id: 'free-form',
    name: 'Free Form',
    description: 'A simple free-form template for custom ADR structures',
    sections: FREE_FORM_SECTIONS,
    generateMarkdown: (sections: AdrTemplateSection[]) =>
      generateFreeFormMarkdown(sections),
  },
]

export const getTemplateById = (id: string): AdrTemplate | undefined => {
  return ADR_TEMPLATES.find((template) => template.id === id)
}

export const getTemplateParser = (templateId: string) => {
  return TEMPLATE_PARSERS[templateId as keyof typeof TEMPLATE_PARSERS]
}

export const markdownToSections = (
  markdown: string,
  templateId: string,
): ParsedAdrContent => {
  const parser = getTemplateParser(templateId)
  if (!parser) {
    throw new Error(`No parser found for template: ${templateId}`)
  }
  return parser.parseMarkdown(markdown)
}

export const sectionsToMarkdown = (
  sections: AdrTemplateSection[],
  templateId: string,
  options?: GenerateMarkdownOptions,
): string => {
  const parser = getTemplateParser(templateId)
  if (!parser) {
    throw new Error(`No parser found for template: ${templateId}`)
  }
  return parser.generateMarkdown(sections, options)
}

export const parseMarkdownToSections = (
  markdown: string,
  template: AdrTemplate,
): ParsedAdrContent => {
  return markdownToSections(markdown, template.id)
}

// Generic frontmatter utilities that work independently of templates
export const extractFrontmatterFromMarkdown = (
  markdown: string,
): {
  content: string
  status?: AdrStatus
  tags?: string[]
  frontmatter?: Record<string, any>
} => {
  return parseFrontmatter(markdown)
}

export const addFrontmatterToMarkdown = (
  content: string,
  options: GenerateMarkdownOptions,
): string => {
  // Check if content already has frontmatter
  const {
    content: existingContent,
    status,
    tags,
    frontmatter,
  } = parseFrontmatter(content)

  // Merge existing frontmatter with new options
  const mergedOptions: GenerateMarkdownOptions = {
    status: options.status ?? status,
    tags: options.tags ?? tags,
    frontmatter: { ...frontmatter, ...options.frontmatter },
  }

  // Generate new frontmatter and combine with content
  const newFrontmatter = generateFrontmatter(mergedOptions)
  return newFrontmatter + existingContent
}

export const updateFrontmatterInMarkdown = (
  markdown: string,
  options: Partial<GenerateMarkdownOptions>,
): string => {
  const { content, status, tags, frontmatter } = parseFrontmatter(markdown)

  const updatedOptions: GenerateMarkdownOptions = {
    status: options.status ?? status,
    tags: options.tags ?? tags,
    frontmatter: { ...frontmatter, ...options.frontmatter },
  }

  return generateFrontmatter(updatedOptions) + content
}

// Fallback function for when no template is selected but frontmatter is needed
export const ensureFrontmatterInMarkdown = (
  markdown: string,
  options?: GenerateMarkdownOptions,
): string => {
  const { content, status, tags, frontmatter } = parseFrontmatter(markdown)

  // If no frontmatter exists, add it only if there's content to add
  if (!markdown.startsWith('---')) {
    const frontmatterOptions: GenerateMarkdownOptions = {
      status: options?.status ?? status,
      tags: options?.tags ?? tags ?? [],
      frontmatter: { ...frontmatter, ...options?.frontmatter },
    }
    const newFrontmatter = generateFrontmatter(frontmatterOptions)
    return newFrontmatter + markdown
  }

  // If frontmatter exists but options are provided, update it
  if (options && (options.status || options.tags || options.frontmatter)) {
    return updateFrontmatterInMarkdown(markdown, options)
  }

  // Return as-is if frontmatter exists and no updates needed
  return markdown
}
