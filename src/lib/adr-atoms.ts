import { atom } from 'jotai'

// Template section delimiters
export const DELIMITERS = {
  TITLE: '{adr_title}',
  METADATA: '{adr_metadata}',
  CONTEXT: '{adr_context}',
  DRIVERS: '{adr_drivers}',
  OPTIONS: '{adr_options}',
  DECISION: '{adr_decision}',
  CONSEQUENCES: '{adr_consequences}',
  CONFIRMATION: '{adr_confirmation}',
  PROSCONS: '{adr_proscons}',
  MOREINFO: '{adr_moreinfo}',
} as const

// Main markdown atom
export const markdownAtom = atom<string>('')

// Selected template atom
export const selectedTemplateAtom = atom<string | null>(null)

// Template sections atom (derived from markdown)
export const templateSectionsAtom = atom(
  (get) => {
    const markdown = get(markdownAtom)
    return parseMarkdownToSections(markdown)
  },
  (get, set, sections: Record<string, string>) => {
    const selectedTemplate = get(selectedTemplateAtom)
    if (!selectedTemplate) return

    const newMarkdown = generateMarkdownFromSections(sections, selectedTemplate)
    set(markdownAtom, newMarkdown)
  },
)

// Helper function to parse markdown into sections using delimiters
function parseMarkdownToSections(markdown: string): Record<string, string> {
  const sections: Record<string, string> = {}

  // Get all delimiter values
  const delimiterValues = Object.values(DELIMITERS)

  for (let i = 0; i < delimiterValues.length; i++) {
    const currentDelimiter = delimiterValues[i]
    const nextDelimiter = delimiterValues[i + 1]

    if (!currentDelimiter) continue

    const startIndex = markdown.indexOf(currentDelimiter)
    if (startIndex === -1) continue

    const contentStart = startIndex + currentDelimiter.length
    let contentEnd = markdown.length

    if (nextDelimiter) {
      const nextIndex = markdown.indexOf(nextDelimiter, contentStart)
      if (nextIndex !== -1) {
        contentEnd = nextIndex
      }
    }

    const content = markdown.slice(contentStart, contentEnd).trim()

    // Map delimiter to section key
    const sectionKey = Object.keys(DELIMITERS)
      .find(
        (key) =>
          DELIMITERS[key as keyof typeof DELIMITERS] === currentDelimiter,
      )
      ?.toLowerCase()

    if (sectionKey) {
      sections[sectionKey] = content
    }
  }

  return sections
}

// Helper function to generate markdown from sections
function generateMarkdownFromSections(
  sections: Record<string, string>,
  templateType: string,
): string {
  if (templateType === 'madr-minimal') {
    return generateMADRMinimalFromSections(sections)
  } else if (templateType === 'madr-full') {
    return generateMADRFullFromSections(sections)
  }
  return ''
}

function generateMADRMinimalFromSections(
  sections: Record<string, string>,
): string {
  return `${DELIMITERS.TITLE}
# ${sections.title ?? '## Title'}

${DELIMITERS.CONTEXT}
## Context and Problem Statement

${sections.context ?? '{Describe the context and problem statement, e.g., in free form using two to three sentences or in the form of an illustrative story. You may want to articulate the problem in form of a question and add links to collaboration boards or issue management systems.}'}

${DELIMITERS.OPTIONS}
## Considered Options

${sections.options ?? '* {title of option 1}\n* {title of option 2}\n* {title of option 3}\n* … <!-- numbers of options can vary -->'}

${DELIMITERS.DECISION}
## Decision Outcome

${sections.decision ?? 'Chosen option: "{title of option 1}", because {justification. e.g., only option, which meets k.o. criterion decision driver | which resolves force {force} | … | comes out best (see below)}.'}

${DELIMITERS.CONSEQUENCES}
<!-- This is an optional element. Feel free to remove. -->
### Consequences

${sections.consequences ?? '* Good, because {positive consequence, e.g., improvement of one or more desired qualities, …}\n* Bad, because {negative consequence, e.g., compromising one or more desired qualities, …}\n* … <!-- numbers of consequences can vary -->'}
`
}

function generateMADRFullFromSections(
  sections: Record<string, string>,
): string {
  return `${DELIMITERS.METADATA}
---
# These are optional metadata elements. Feel free to remove any of them.
${sections.metadata ?? 'status: "{proposed | rejected | accepted | deprecated | … | superseded by ADR-0123}"\ndate: {YYYY-MM-DD when the decision was last updated}\ndecision-makers: {list everyone involved in the decision}\nconsulted: {list everyone whose opinions are sought (typically subject-matter experts); and with whom there is a two-way communication}\ninformed: {list everyone who is kept up-to-date on progress; and with whom there is a one-way communication}'}
---

${DELIMITERS.TITLE}
# ${sections.title ?? '{short title, representative of solved problem and found solution}'}

${DELIMITERS.CONTEXT}
## Context and Problem Statement

${sections.context ?? '{Describe the context and problem statement, e.g., in free form using two to three sentences or in the form of an illustrative story. You may want to articulate the problem in form of a question and add links to collaboration boards or issue management systems.}'}

${DELIMITERS.DRIVERS}
<!-- This is an optional element. Feel free to remove. -->
## Decision Drivers

${sections.drivers ?? '* {decision driver 1, e.g., a force, facing concern, …}\n* {decision driver 2, e.g., a force, facing concern, …}\n* … <!-- numbers of drivers can vary -->'}

${DELIMITERS.OPTIONS}
## Considered Options

${sections.options ?? '* {title of option 1}\n* {title of option 2}\n* {title of option 3}\n* … <!-- numbers of options can vary -->'}

${DELIMITERS.DECISION}
## Decision Outcome

${sections.decision ?? 'Chosen option: "{title of option 1}", because {justification. e.g., only option, which meets k.o. criterion decision driver | which resolves force {force} | … | comes out best (see below)}.'}

${DELIMITERS.CONSEQUENCES}
<!-- This is an optional element. Feel free to remove. -->
### Consequences

${sections.consequences ?? '* Good, because {positive consequence, e.g., improvement of one or more desired qualities, …}\n* Bad, because {negative consequence, e.g., compromising one or more desired qualities, …}\n* … <!-- numbers of consequences can vary -->'}

${DELIMITERS.CONFIRMATION}
<!-- This is an optional element. Feel free to remove. -->
### Confirmation

${sections.confirmation ?? '{Describe how the implementation of/compliance with the ADR can/will be confirmed. Are the design that was decided for and its implementation in line with the decision made? E.g., a design/code review or a test with a library such as ArchUnit can help validate this. Not that although we classify this element as optional, it is included in many ADRs.}'}

${DELIMITERS.PROSCONS}
<!-- This is an optional element. Feel free to remove. -->
## Pros and Cons of the Options

${sections.proscons ?? '### {title of option 1}\n\n<!-- This is an optional element. Feel free to remove. -->\n{example | description | pointer to more information | …}\n\n* Good, because {argument a}\n* Good, because {argument b}\n<!-- use "neutral" if the given argument weights neither for good nor bad -->\n* Neutral, because {argument c}\n* Bad, because {argument d}\n* … <!-- numbers of pros and cons can vary -->\n\n### {title of other option}\n\n{example | description | pointer to more information | …}\n\n* Good, because {argument a}\n* Good, because {argument b}\n* Neutral, because {argument c}\n* Bad, because {argument d}\n* …'}

${DELIMITERS.MOREINFO}
<!-- This is an optional element. Feel free to remove. -->
## More Information

${sections.moreinfo ?? '{You might want to provide additional evidence/confidence for the decision outcome here and/or document the team agreement on the decision and/or define when/how this decision the decision should be realized and if/when it should be re-visited. Links to other decisions and resources might appear here as well.}'}
`
}

// Helper function to update a specific section
export const updateSectionAtom = atom(
  null,
  (
    get,
    set,
    { sectionKey, content }: { sectionKey: string; content: string },
  ) => {
    const currentSections = get(templateSectionsAtom)
    const updatedSections = {
      ...currentSections,
      [sectionKey]: content,
    }
    set(templateSectionsAtom, updatedSections)
  },
)

// Function to create a clean markdown with delimiters for display (removes delimiters)
export const getCleanMarkdownAtom = atom((get) => {
  const markdown = get(markdownAtom)

  // Remove all delimiters for clean display
  let cleanMarkdown = markdown
  Object.values(DELIMITERS).forEach((delimiter) => {
    cleanMarkdown = cleanMarkdown.replace(
      new RegExp(`${delimiter}\\s*`, 'g'),
      '',
    )
  })

  return cleanMarkdown.trim()
})
