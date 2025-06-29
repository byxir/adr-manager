import type { AdrTemplate, AdrTemplateSection } from '@/definitions/types'

const MADR_MINIMAL_SECTIONS: AdrTemplateSection[] = [
  {
    id: 'title',
    title: 'Title',
    placeholder:
      'Short title, representative of solved problem and found solution',
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
    id: 'metadata',
    title: 'Metadata',
    placeholder:
      'status: "proposed"\ndate: YYYY-MM-DD\ndecision-makers: ...\nconsulted: ...\ninformed: ...',
    content: '',
    isRequired: false,
  },
  {
    id: 'title',
    title: 'Title',
    placeholder:
      'Short title, representative of solved problem and found solution',
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

const FREE_FORM_SECTIONS: AdrTemplateSection[] = [
  {
    id: 'title',
    title: 'Title',
    placeholder: 'Enter the title of your Architecture Decision Record',
    content: '',
    isRequired: true,
  },
]

const generateMADRMinimalMarkdown = (
  sections: AdrTemplateSection[],
): string => {
  const sectionMap = sections.reduce(
    (acc, section) => {
      acc[section.id] = section.content
      return acc
    },
    {} as Record<string, string>,
  )

  return `# ${sectionMap.title ?? '{short title, representative of solved problem and found solution}'}

## Context and Problem Statement

${sectionMap.context ?? '{Describe the context and problem statement, e.g., in free form using two to three sentences or in the form of an illustrative story. You may want to articulate the problem in form of a question and add links to collaboration boards or issue management systems.}'}

## Considered Options

${sectionMap.options ?? '* {title of option 1}\n* {title of option 2}\n* {title of option 3}\n* …'}

## Decision Outcome

${sectionMap.decision ?? 'Chosen option: "{title of option 1}", because {justification. e.g., only option, which meets k.o. criterion decision driver | which resolves force {force} | … | comes out best (see below)}.'}

${sectionMap.consequences ? '### Consequences\n\n' + sectionMap.consequences : '### Consequences\n\n* Good, because {positive consequence, e.g., improvement of one or more desired qualities, …}\n* Bad, because {negative consequence, e.g., compromising one or more desired qualities, …}\n* …'}
`
}

const generateMADRFullMarkdown = (sections: AdrTemplateSection[]): string => {
  const sectionMap = sections.reduce(
    (acc, section) => {
      acc[section.id] = section.content
      return acc
    },
    {} as Record<string, string>,
  )

  return `${sectionMap.metadata ? '---\n# These are optional metadata elements. Feel free to remove any of them.\n' + sectionMap.metadata + '\n---\n\n' : '---\n# These are optional metadata elements. Feel free to remove any of them.\nstatus: "{proposed | rejected | accepted | deprecated | … | superseded by ADR-0123}"\ndate: {YYYY-MM-DD when the decision was last updated}\ndecision-makers: {list everyone involved in the decision}\nconsulted: {list everyone whose opinions are sought (typically subject-matter experts); and with whom there is a two-way communication}\ninformed: {list everyone who is kept up-to-date on progress; and with whom there is a one-way communication}\n---\n\n'}# ${sectionMap.title ?? '{short title, representative of solved problem and found solution}'}

## Context and Problem Statement

${sectionMap.context ?? '{Describe the context and problem statement, e.g., in free form using two to three sentences or in the form of an illustrative story. You may want to articulate the problem in form of a question and add links to collaboration boards or issue management systems.}'}

${sectionMap.drivers ? '## Decision Drivers\n\n' + sectionMap.drivers : '## Decision Drivers\n\n* {decision driver 1, e.g., a force, facing concern, …}\n* {decision driver 2, e.g., a force, facing concern, …}\n* …'}

## Considered Options

${sectionMap.options ?? '* {title of option 1}\n* {title of option 2}\n* {title of option 3}\n* …'}

## Decision Outcome

${sectionMap.decision ?? 'Chosen option: "{title of option 1}", because {justification. e.g., only option, which meets k.o. criterion decision driver | which resolves force {force} | … | comes out best (see below)}.'}

${sectionMap.consequences ? '### Consequences\n\n' + sectionMap.consequences : '### Consequences\n\n* Good, because {positive consequence, e.g., improvement of one or more desired qualities, …}\n* Bad, because {negative consequence, e.g., compromising one or more desired qualities, …}\n* …'}

${sectionMap.confirmation ? '### Confirmation\n\n' + sectionMap.confirmation : '### Confirmation\n\n{Describe how the implementation of/compliance with the ADR can/will be confirmed. Are the design that was decided for and its implementation in line with the decision made? E.g., a design/code review or a test with a library such as ArchUnit can help validate this. Not that although we classify this element as optional, it is included in many ADRs.}'}

${sectionMap.proscons ? '## Pros and Cons of the Options\n\n' + sectionMap.proscons : '## Pros and Cons of the Options\n\n### {title of option 1}\n\n{example | description | pointer to more information | …}\n\n* Good, because {argument a}\n* Good, because {argument b}\n* Neutral, because {argument c}\n* Bad, because {argument d}\n* …\n\n### {title of other option}\n\n{example | description | pointer to more information | …}\n\n* Good, because {argument a}\n* Good, because {argument b}\n* Neutral, because {argument c}\n* Bad, because {argument d}\n* …'}

${sectionMap.moreinfo ? '## More Information\n\n' + sectionMap.moreinfo : '## More Information\n\n{You might want to provide additional evidence/confidence for the decision outcome here and/or document the team agreement on the decision and/or define when/how this decision the decision should be realized and if/when it should be re-visited. Links to other decisions and resources might appear here as well.}'}
`
}

const generateYStatementMarkdown = (sections: AdrTemplateSection[]): string => {
  const sectionMap = sections.reduce(
    (acc, section) => {
      acc[section.id] = section.content
      return acc
    },
    {} as Record<string, string>,
  )

  return `# Y-Statement: ${sectionMap.decided ?? 'Decision Title'}

In the context of ${sectionMap.context ?? '{functional requirement (story, use case) or architectural component}'}
facing ${sectionMap.facing ?? '{non-functional requirement, for instance a desired quality}'}
we decided for ${sectionMap.decided ?? '{decision outcome (the most important part)}'}
and against ${sectionMap.neglected ?? '{alternatives not chosen (not to be forgotten!)}'}
to achieve ${sectionMap.achieve ?? '{benefits, the full or partial satisfaction of requirement(s)}'}
accepting that ${sectionMap.accepting ?? '{drawbacks and other consequences, for instance impact on other properties/context and effort/cost}'}

## Rationale

${sectionMap.rationale ?? 'This Y-statement captures the essential elements of our architectural decision in a concise format that emphasizes the "why" behind our choice.'}

## References

${sectionMap.references ?? '- [Y-Statements: A light template for architectural decision capturing](https://medium.com/olzzio/y-statements-10eb07b5a177)'}
`
}

const generateFreeFormMarkdown = (sections: AdrTemplateSection[]): string => {
  const sectionMap = sections.reduce(
    (acc, section) => {
      acc[section.id] = section.content
      return acc
    },
    {} as Record<string, string>,
  )

  return `# ${sectionMap.title ?? 'Untitled ADR'}

Write your Architecture Decision Record here in free form. You can structure it however you like.
`
}

const parseMADRMinimalMarkdown = (markdown: string): AdrTemplateSection[] => {
  const sections = MADR_MINIMAL_SECTIONS.map((section) => ({ ...section }))
  const lines = markdown.split('\n')

  const titleMatch = /^# (.+)/m.exec(markdown)
  if (titleMatch?.[1]) {
    const titleSection = sections.find((s) => s.id === 'title')
    if (titleSection) titleSection.content = titleMatch[1].trim()
  }

  const contextMatch =
    /## Context and Problem Statement\s*\n([\s\S]*?)(?=^#+\s|$)/m.exec(markdown)
  if (contextMatch?.[1]) {
    const contextSection = sections.find((s) => s.id === 'context')
    if (contextSection) contextSection.content = contextMatch[1].trim()
  }

  const optionsMatch = /## Considered Options\s*\n([\s\S]*?)(?=^#+\s|$)/m.exec(
    markdown,
  )
  if (optionsMatch?.[1]) {
    const optionsSection = sections.find((s) => s.id === 'options')
    if (optionsSection) optionsSection.content = optionsMatch[1].trim()
  }

  const decisionMatch = /## Decision Outcome\s*\n([\s\S]*?)(?=^#+\s|$)/m.exec(
    markdown,
  )
  if (decisionMatch?.[1]) {
    const decisionSection = sections.find((s) => s.id === 'decision')
    if (decisionSection) decisionSection.content = decisionMatch[1].trim()
  }

  const consequencesMatch = /### Consequences\s*\n([\s\S]*?)(?=^#+\s|$)/m.exec(
    markdown,
  )
  if (consequencesMatch?.[1]) {
    const consequencesSection = sections.find((s) => s.id === 'consequences')
    if (consequencesSection)
      consequencesSection.content = consequencesMatch[1].trim()
  }

  return sections
}

const parseMADRFullMarkdown = (markdown: string): AdrTemplateSection[] => {
  const sections = MADR_FULL_SECTIONS.map((section) => ({ ...section }))

  const metadataMatch = /^---\s*\n([\s\S]*?)\n---/m.exec(markdown)
  if (metadataMatch?.[1]) {
    const metadataSection = sections.find((s) => s.id === 'metadata')
    if (metadataSection) {
      const metadata = metadataMatch[1]
        .replace(/^# These are optional metadata elements.*\n/m, '')
        .trim()
      metadataSection.content = metadata
    }
  }

  const titleMatch = /^# (.+)/m.exec(markdown)
  if (titleMatch?.[1]) {
    const titleSection = sections.find((s) => s.id === 'title')
    if (titleSection) titleSection.content = titleMatch[1].trim()
  }

  const contextMatch =
    /## Context and Problem Statement\s*\n([\s\S]*?)(?=^#+\s|$)/m.exec(markdown)
  if (contextMatch?.[1]) {
    const contextSection = sections.find((s) => s.id === 'context')
    if (contextSection) contextSection.content = contextMatch[1].trim()
  }

  const driversMatch = /## Decision Drivers\s*\n([\s\S]*?)(?=^#+\s|$)/m.exec(
    markdown,
  )
  if (driversMatch?.[1]) {
    const driversSection = sections.find((s) => s.id === 'drivers')
    if (driversSection) driversSection.content = driversMatch[1].trim()
  }

  const optionsMatch = /## Considered Options\s*\n([\s\S]*?)(?=^#+\s|$)/m.exec(
    markdown,
  )
  if (optionsMatch?.[1]) {
    const optionsSection = sections.find((s) => s.id === 'options')
    if (optionsSection) optionsSection.content = optionsMatch[1].trim()
  }

  const decisionMatch = /## Decision Outcome\s*\n([\s\S]*?)(?=^#+\s|$)/m.exec(
    markdown,
  )
  if (decisionMatch?.[1]) {
    const decisionSection = sections.find((s) => s.id === 'decision')
    if (decisionSection) decisionSection.content = decisionMatch[1].trim()
  }

  const consequencesMatch = /### Consequences\s*\n([\s\S]*?)(?=^#+\s|$)/m.exec(
    markdown,
  )
  if (consequencesMatch?.[1]) {
    const consequencesSection = sections.find((s) => s.id === 'consequences')
    if (consequencesSection)
      consequencesSection.content = consequencesMatch[1].trim()
  }

  const confirmationMatch = /### Confirmation\s*\n([\s\S]*?)(?=^#+\s|$)/m.exec(
    markdown,
  )
  if (confirmationMatch?.[1]) {
    const confirmationSection = sections.find((s) => s.id === 'confirmation')
    if (confirmationSection)
      confirmationSection.content = confirmationMatch[1].trim()
  }

  const prosconsMatch =
    /## Pros and Cons of the Options\s*\n([\s\S]*?)(?=^#+\s|$)/m.exec(markdown)
  if (prosconsMatch?.[1]) {
    const prosconsSection = sections.find((s) => s.id === 'proscons')
    if (prosconsSection) prosconsSection.content = prosconsMatch[1].trim()
  }

  const moreinfoMatch = /## More Information\s*\n([\s\S]*?)(?=^#+\s|$)/m.exec(
    markdown,
  )
  if (moreinfoMatch?.[1]) {
    const moreinfoSection = sections.find((s) => s.id === 'moreinfo')
    if (moreinfoSection) moreinfoSection.content = moreinfoMatch[1].trim()
  }

  return sections
}

const parseYStatementMarkdown = (markdown: string): AdrTemplateSection[] => {
  const sections = Y_STATEMENT_SECTIONS.map((section) => ({ ...section }))

  const titleMatch = /# Y-Statement: (.+)/m.exec(markdown)
  if (titleMatch) {
    const decidedSection = sections.find((s) => s.id === 'decided')
    if (decidedSection && titleMatch?.[1])
      decidedSection.content = titleMatch[1].trim()
  }

  // Parse each prefix and its content
  const contextMatch =
    /In the context of\s+([\s\S]*?)(?=^facing\s|^we decided for\s|^and against\s|^to achieve\s|^accepting that\s|$)/m.exec(
      markdown,
    )
  if (contextMatch?.[1]) {
    const contextSection = sections.find((s) => s.id === 'context')
    if (contextSection) contextSection.content = contextMatch[1].trim()
  }

  const facingMatch =
    /^facing\s+([\s\S]*?)(?=^we decided for\s|^and against\s|^to achieve\s|^accepting that\s|$)/m.exec(
      markdown,
    )
  if (facingMatch?.[1]) {
    const facingSection = sections.find((s) => s.id === 'facing')
    if (facingSection) facingSection.content = facingMatch[1].trim()
  }

  const decidedMatch =
    /^we decided for\s+([\s\S]*?)(?=^and against\s|^to achieve\s|^accepting that\s|$)/m.exec(
      markdown,
    )
  if (decidedMatch?.[1]) {
    const decidedSection = sections.find((s) => s.id === 'decided')
    if (decidedSection) decidedSection.content = decidedMatch[1].trim()
  }

  const neglectedMatch =
    /^and against\s+([\s\S]*?)(?=^to achieve\s|^accepting that\s|$)/m.exec(
      markdown,
    )
  if (neglectedMatch?.[1]) {
    const neglectedSection = sections.find((s) => s.id === 'neglected')
    if (neglectedSection) neglectedSection.content = neglectedMatch[1].trim()
  }

  const achieveMatch = /^to achieve\s+([\s\S]*?)(?=^accepting that\s|$)/m.exec(
    markdown,
  )
  if (achieveMatch?.[1]) {
    const achieveSection = sections.find((s) => s.id === 'achieve')
    if (achieveSection) achieveSection.content = achieveMatch[1].trim()
  }

  const acceptingMatch = /^accepting that\s+([\s\S]*?)(?=^##\s|$)/m.exec(
    markdown,
  )
  if (acceptingMatch?.[1]) {
    const acceptingSection = sections.find((s) => s.id === 'accepting')
    if (acceptingSection) acceptingSection.content = acceptingMatch[1].trim()
  }

  const rationaleMatch = /## Rationale\s*\n([\s\S]*?)(?=^#+\s|$)/m.exec(
    markdown,
  )
  if (rationaleMatch?.[1]) {
    const rationaleSection = sections.find((s) => s.id === 'rationale')
    if (rationaleSection) rationaleSection.content = rationaleMatch[1].trim()
  }

  const referencesMatch = /## References\s*\n([\s\S]*?)(?=^#+\s|$)/m.exec(
    markdown,
  )
  if (referencesMatch?.[1]) {
    const referencesSection = sections.find((s) => s.id === 'references')
    if (referencesSection) referencesSection.content = referencesMatch[1].trim()
  }

  return sections
}

const parseFreeFormMarkdown = (markdown: string): AdrTemplateSection[] => {
  const sections = FREE_FORM_SECTIONS.map((section) => ({ ...section }))

  const titleMatch = /^# (.+)/m.exec(markdown)
  if (titleMatch) {
    const titleSection = sections.find((s) => s.id === 'title')
    if (titleSection && titleMatch?.[1])
      titleSection.content = titleMatch[1].trim()
  }

  return sections
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
    generateMarkdown: generateMADRMinimalMarkdown,
  },
  {
    id: 'madr-full',
    name: 'MADR Full',
    description: 'A comprehensive MADR template with all optional sections',
    sections: MADR_FULL_SECTIONS,
    generateMarkdown: generateMADRFullMarkdown,
  },
  {
    id: 'y-statement',
    name: 'Y-Statement',
    description:
      'A concise Y-statement template focusing on the "why" of decisions',
    sections: Y_STATEMENT_SECTIONS,
    generateMarkdown: generateYStatementMarkdown,
  },
  {
    id: 'free-form',
    name: 'Free Form',
    description: 'A simple free-form template for custom ADR structures',
    sections: FREE_FORM_SECTIONS,
    generateMarkdown: generateFreeFormMarkdown,
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
): AdrTemplateSection[] => {
  const parser = getTemplateParser(templateId)
  if (!parser) {
    throw new Error(`No parser found for template: ${templateId}`)
  }
  return parser.parseMarkdown(markdown)
}

export const sectionsToMarkdown = (
  sections: AdrTemplateSection[],
  templateId: string,
): string => {
  const parser = getTemplateParser(templateId)
  if (!parser) {
    throw new Error(`No parser found for template: ${templateId}`)
  }
  return parser.generateMarkdown(sections)
}

export const parseMarkdownToSections = (
  markdown: string,
  template: AdrTemplate,
): AdrTemplateSection[] => {
  return markdownToSections(markdown, template.id)
}
