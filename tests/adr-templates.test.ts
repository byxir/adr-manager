import { test, expect } from '@playwright/test'
import {
  ADR_TEMPLATES,
  getTemplateById,
  getTemplateParser,
  markdownToSections,
  sectionsToMarkdown,
  extractFrontmatterFromMarkdown,
  addFrontmatterToMarkdown,
  updateFrontmatterInMarkdown,
  ensureFrontmatterInMarkdown,
  parseMarkdownToSections,
  type GenerateMarkdownOptions,
} from '../src/app/[repo]/adr/[path]/adr-templates'
import type { AdrTemplateSection } from '@/definitions/types'

// Test data
const sampleMADRMinimalMarkdown = `---
status: "todo"
tags: ["architecture", "decision"]
---

# Use React for Frontend

## Context and Problem Statement

We need to choose a frontend framework for our web application.

## Considered Options

* React
* Vue.js
* Angular

## Decision Outcome

Chosen option: "React", because it has the largest ecosystem and team expertise.

### Consequences

* Good, because large community support
* Bad, because steep learning curve
`

const sampleYStatementMarkdown = `---
status: "done"
tags: ["architecture"]
---

# Y-Statement: React

In the context of building a web application
facing performance and maintainability requirements
we decided for React
and against Vue.js and Angular
to achieve better developer experience and performance
accepting that there will be a learning curve

## Rationale

React provides the best balance of performance and developer experience.

## References

* React documentation
* Performance benchmarks
`

const sampleFreeFormMarkdown = `---
status: "in-progress"
tags: ["custom", "decision"]
---

# Custom ADR Format

This is a custom ADR that follows no specific template.

## Background

Some background information.

## Decision

The decision we made.

## Impact

The impact of this decision.
`

test.describe('ADR Templates', () => {
  test('should have all expected templates', () => {
    expect(ADR_TEMPLATES).toHaveLength(4)
    expect(ADR_TEMPLATES.map((t) => t.id)).toEqual([
      'madr-minimal',
      'madr-full',
      'y-statement',
      'free-form',
    ])
  })

  test('should get template by id', () => {
    const template = getTemplateById('madr-minimal')
    expect(template).toBeDefined()
    expect(template?.id).toBe('madr-minimal')
    expect(template?.name).toBe('MADR Minimal')
  })

  test('should return undefined for non-existent template', () => {
    const template = getTemplateById('non-existent')
    expect(template).toBeUndefined()
  })

  test('should get template parser', () => {
    const parser = getTemplateParser('madr-minimal')
    expect(parser).toBeDefined()
    expect(parser?.parseMarkdown).toBeDefined()
    expect(parser?.generateMarkdown).toBeDefined()
  })
})

test.describe('MADR Minimal Parser', () => {
  test('should parse MADR minimal markdown correctly', () => {
    const parser = getTemplateParser('madr-minimal')
    const result = parser?.parseMarkdown(sampleMADRMinimalMarkdown)

    expect(result).toBeDefined()
    expect(result?.status).toBe('todo')
    expect(result?.tags).toEqual(['architecture', 'decision'])
    expect(result?.sections).toHaveLength(5)

    const titleSection = result?.sections.find((s) => s.id === 'title')
    expect(titleSection?.content).toBe('Use React for Frontend')

    const contextSection = result?.sections.find((s) => s.id === 'context')
    expect(contextSection?.content).toContain(
      'We need to choose a frontend framework',
    )

    const optionsSection = result?.sections.find((s) => s.id === 'options')
    expect(optionsSection?.content).toContain('React')
    expect(optionsSection?.content).toContain('Vue.js')

    const decisionSection = result?.sections.find((s) => s.id === 'decision')
    expect(decisionSection?.content).toContain('Chosen option: "React"')

    const consequencesSection = result?.sections.find(
      (s) => s.id === 'consequences',
    )
    expect(consequencesSection?.content).toContain(
      'Good, because large community support',
    )
  })

  test('should parse MADR minimal without frontmatter', () => {
    const markdownWithoutFrontmatter = `# Use React for Frontend

## Context and Problem Statement

We need to choose a frontend framework.

## Considered Options

* React
* Vue.js

## Decision Outcome

Chosen option: "React".

### Consequences

* Good, because popular
`

    const parser = getTemplateParser('madr-minimal')
    const result = parser?.parseMarkdown(markdownWithoutFrontmatter)

    expect(result).toBeDefined()
    expect(result?.status).toBeUndefined()
    expect(result?.tags).toBeUndefined()
    expect(result?.frontmatter).toBeUndefined()

    const titleSection = result?.sections.find((s) => s.id === 'title')
    expect(titleSection?.content).toBe('Use React for Frontend')
  })

  test('should handle empty sections gracefully', () => {
    const minimalMarkdown = `# Title Only`

    const parser = getTemplateParser('madr-minimal')
    const result = parser?.parseMarkdown(minimalMarkdown)

    expect(result).toBeDefined()
    expect(result?.sections).toHaveLength(5)

    const titleSection = result?.sections.find((s) => s.id === 'title')
    expect(titleSection?.content).toBe('Title Only')

    const contextSection = result?.sections.find((s) => s.id === 'context')
    expect(contextSection?.content).toBe('')
  })
})

test.describe('MADR Full Parser', () => {
  test('should handle missing optional sections', () => {
    const partialMarkdown = `---
status: "todo"
---

# Title

## Context and Problem Statement

Context here.

## Considered Options

* Option 1

## Decision Outcome

Decision here.
`

    const parser = getTemplateParser('madr-full')
    const result = parser?.parseMarkdown(partialMarkdown)

    expect(result).toBeDefined()
    expect(result?.sections).toHaveLength(9)

    const driversSection = result?.sections.find((s) => s.id === 'drivers')
    expect(driversSection?.content).toBe('')

    const confirmationSection = result?.sections.find(
      (s) => s.id === 'confirmation',
    )
    expect(confirmationSection?.content).toBe('')
  })
})

test.describe('Y-Statement Parser', () => {
  test('should parse Y-statement markdown correctly', () => {
    const parser = getTemplateParser('y-statement')
    const result = parser?.parseMarkdown(sampleYStatementMarkdown)

    expect(result).toBeDefined()
    expect(result?.status).toBe('done')
    expect(result?.tags).toEqual(['architecture'])
    expect(result?.sections).toHaveLength(8)

    const decidedSection = result?.sections.find((s) => s.id === 'decided')
    expect(decidedSection?.content).toBe('React')

    const contextSection = result?.sections.find((s) => s.id === 'context')
    expect(contextSection?.content).toContain('building a web application')

    const facingSection = result?.sections.find((s) => s.id === 'facing')
    expect(facingSection?.content).toContain('performance and maintainability')

    const rationaleSection = result?.sections.find((s) => s.id === 'rationale')
    expect(rationaleSection?.content).toContain('best balance of performance')

    const referencesSection = result?.sections.find(
      (s) => s.id === 'references',
    )
    expect(referencesSection?.content).toContain('React documentation')
  })

  test('should handle Y-statement without optional sections', () => {
    const minimalYStatement = `# Y-Statement: React

In the context of building a web application
facing performance requirements
we decided for React
and against Vue.js
to achieve better performance
accepting that there will be complexity
`

    const parser = getTemplateParser('y-statement')
    const result = parser?.parseMarkdown(minimalYStatement)

    expect(result).toBeDefined()
    expect(result?.sections).toHaveLength(8)

    const decidedSection = result?.sections.find((s) => s.id === 'decided')
    expect(decidedSection?.content).toBe('React')

    const rationaleSection = result?.sections.find((s) => s.id === 'rationale')
    expect(rationaleSection?.content).toBe('')
  })
})

test.describe('Free Form Parser', () => {
  test('should parse free form markdown correctly', () => {
    const parser = getTemplateParser('free-form')
    const result = parser?.parseMarkdown(sampleFreeFormMarkdown)

    expect(result).toBeDefined()
    expect(result?.status).toBe('in-progress')
    expect(result?.tags).toEqual(['custom', 'decision'])
    expect(result?.sections).toHaveLength(1)

    const contentSection = result?.sections.find((s) => s.id === 'content')
    expect(contentSection?.content).toContain('# Custom ADR Format')
    expect(contentSection?.content).toContain('## Background')
    expect(contentSection?.content).toContain('## Decision')
    expect(contentSection?.content).toContain('## Impact')
  })

  test('should handle free form without frontmatter', () => {
    const plainMarkdown = `# My Custom ADR

This is just plain markdown content.

## Section 1

Content here.

## Section 2

More content.`

    const parser = getTemplateParser('free-form')
    const result = parser?.parseMarkdown(plainMarkdown)

    expect(result).toBeDefined()
    expect(result?.status).toBeUndefined()
    expect(result?.tags).toBeUndefined()
    expect(result?.sections).toHaveLength(1)

    const contentSection = result?.sections.find((s) => s.id === 'content')
    expect(contentSection?.content).toBe(plainMarkdown)
  })
})

test.describe('MADR Minimal Generator', () => {
  test('should generate MADR minimal markdown correctly', () => {
    const sections: AdrTemplateSection[] = [
      {
        id: 'title',
        title: 'Title',
        content: 'Use React for Frontend',
        placeholder: '',
        isRequired: true,
      },
      {
        id: 'context',
        title: 'Context',
        content: 'We need to choose a frontend framework.',
        placeholder: '',
        isRequired: true,
      },
      {
        id: 'options',
        title: 'Options',
        content: '* React\n* Vue.js\n* Angular',
        placeholder: '',
        isRequired: true,
      },
      {
        id: 'decision',
        title: 'Decision',
        content:
          'Chosen option: "React", because it has the largest ecosystem.',
        placeholder: '',
        isRequired: true,
      },
      {
        id: 'consequences',
        title: 'Consequences',
        content:
          '* Good, because large community\n* Bad, because steep learning curve',
        placeholder: '',
        isRequired: false,
      },
    ]

    const options: GenerateMarkdownOptions = {
      status: 'todo',
      tags: ['architecture', 'decision'],
      frontmatter: { date: '2023-12-01' },
    }

    const parser = getTemplateParser('madr-minimal')
    const result = parser?.generateMarkdown(sections, options)

    expect(result).toBeDefined()
    expect(result).toContain('---')
    expect(result).toContain('status: "todo"')
    expect(result).toContain('tags: ["architecture", "decision"]')
    expect(result).toContain('date: "2023-12-01"')
    expect(result).toContain('# Use React for Frontend')
    expect(result).toContain('## Context and Problem Statement')
    expect(result).toContain('We need to choose a frontend framework.')
    expect(result).toContain('## Considered Options')
    expect(result).toContain('* React')
    expect(result).toContain('## Decision Outcome')
    expect(result).toContain('Chosen option: "React"')
    expect(result).toContain('### Consequences')
    expect(result).toContain('* Good, because large community')
  })

  test('should generate MADR minimal without frontmatter', () => {
    const sections: AdrTemplateSection[] = [
      {
        id: 'title',
        title: 'Title',
        content: 'Simple Decision',
        placeholder: '',
        isRequired: true,
      },
      {
        id: 'context',
        title: 'Context',
        content: 'Context here.',
        placeholder: '',
        isRequired: true,
      },
      {
        id: 'options',
        title: 'Options',
        content: '* Option 1',
        placeholder: '',
        isRequired: true,
      },
      {
        id: 'decision',
        title: 'Decision',
        content: 'Decision here.',
        placeholder: '',
        isRequired: true,
      },
      {
        id: 'consequences',
        title: 'Consequences',
        content: '',
        placeholder: '',
        isRequired: false,
      },
    ]

    const parser = getTemplateParser('madr-minimal')
    const result = parser?.generateMarkdown(sections)

    expect(result).toBeDefined()
    expect(result).toContain('# Simple Decision')
    expect(result).toContain('## Context and Problem Statement')
    expect(result).toContain('Context here.')
    expect(result).not.toContain('---')
  })
})

test.describe('MADR Full Generator', () => {
  test('should generate MADR full markdown correctly', () => {
    const sections: AdrTemplateSection[] = [
      {
        id: 'title',
        title: 'Title',
        content: 'Use React for Frontend',
        placeholder: '',
        isRequired: true,
      },
      {
        id: 'context',
        title: 'Context',
        content: 'We need to choose a frontend framework.',
        placeholder: '',
        isRequired: true,
      },
      {
        id: 'drivers',
        title: 'Drivers',
        content: '* Team expertise\n* Community support',
        placeholder: '',
        isRequired: false,
      },
      {
        id: 'options',
        title: 'Options',
        content: '* React\n* Vue.js',
        placeholder: '',
        isRequired: true,
      },
      {
        id: 'decision',
        title: 'Decision',
        content: 'Chosen option: "React".',
        placeholder: '',
        isRequired: true,
      },
      {
        id: 'consequences',
        title: 'Consequences',
        content: '* Good, because popular',
        placeholder: '',
        isRequired: false,
      },
      {
        id: 'confirmation',
        title: 'Confirmation',
        content: 'We will build a prototype.',
        placeholder: '',
        isRequired: false,
      },
      {
        id: 'proscons',
        title: 'Pros and Cons',
        content: '### React\n\n* Good, because mature',
        placeholder: '',
        isRequired: false,
      },
      {
        id: 'moreinfo',
        title: 'More Info',
        content: 'Additional resources.',
        placeholder: '',
        isRequired: false,
      },
    ]

    const options: GenerateMarkdownOptions = {
      status: 'todo',
      tags: ['architecture'],
    }

    const parser = getTemplateParser('madr-full')
    const result = parser?.generateMarkdown(sections, options)

    expect(result).toBeDefined()
    expect(result).toContain('---')
    expect(result).toContain('status: "todo"')
    expect(result).toContain('tags: ["architecture"]')
    expect(result).toContain('date:') // Should have default date
    expect(result).toContain('# Use React for Frontend')
    expect(result).toContain('## Decision Drivers')
    expect(result).toContain('* Team expertise')
    expect(result).toContain('### Confirmation')
    expect(result).toContain('We will build a prototype.')
    expect(result).toContain('## Pros and Cons of the Options')
    expect(result).toContain('### React')
    expect(result).toContain('## More Information')
    expect(result).toContain('Additional resources.')
  })
})

test.describe('Y-Statement Generator', () => {
  test('should generate Y-statement markdown correctly', () => {
    const sections: AdrTemplateSection[] = [
      {
        id: 'context',
        title: 'Context',
        content: 'building a web application',
        placeholder: '',
        isRequired: true,
      },
      {
        id: 'facing',
        title: 'Facing',
        content: 'performance requirements',
        placeholder: '',
        isRequired: true,
      },
      {
        id: 'decided',
        title: 'Decided',
        content: 'React',
        placeholder: '',
        isRequired: true,
      },
      {
        id: 'neglected',
        title: 'Neglected',
        content: 'Vue.js and Angular',
        placeholder: '',
        isRequired: true,
      },
      {
        id: 'achieve',
        title: 'Achieve',
        content: 'better performance',
        placeholder: '',
        isRequired: true,
      },
      {
        id: 'accepting',
        title: 'Accepting',
        content: 'learning curve',
        placeholder: '',
        isRequired: true,
      },
      {
        id: 'rationale',
        title: 'Rationale',
        content: 'React has the best performance characteristics.',
        placeholder: '',
        isRequired: false,
      },
      {
        id: 'references',
        title: 'References',
        content: '* React docs\n* Performance benchmarks',
        placeholder: '',
        isRequired: false,
      },
    ]

    const options: GenerateMarkdownOptions = {
      status: 'done',
      tags: ['architecture'],
    }

    const parser = getTemplateParser('y-statement')
    const result = parser?.generateMarkdown(sections, options)

    expect(result).toBeDefined()
    expect(result).toContain('---')
    expect(result).toContain('status: "done"')
    expect(result).toContain('tags: ["architecture"]')
    expect(result).toContain('# Y-Statement: React')
    expect(result).toContain('In the context of building a web application')
    expect(result).toContain('facing performance requirements')
    expect(result).toContain('we decided for React')
    expect(result).toContain('and against Vue.js and Angular')
    expect(result).toContain('to achieve better performance')
    expect(result).toContain('accepting that learning curve')
    expect(result).toContain('## Rationale')
    expect(result).toContain('React has the best performance characteristics.')
    expect(result).toContain('## References')
    expect(result).toContain('* React docs')
  })

  test('should generate Y-statement without optional sections', () => {
    const sections: AdrTemplateSection[] = [
      {
        id: 'context',
        title: 'Context',
        content: 'building an app',
        placeholder: '',
        isRequired: true,
      },
      {
        id: 'facing',
        title: 'Facing',
        content: 'speed requirements',
        placeholder: '',
        isRequired: true,
      },
      {
        id: 'decided',
        title: 'Decided',
        content: 'React',
        placeholder: '',
        isRequired: true,
      },
      {
        id: 'neglected',
        title: 'Neglected',
        content: 'Vue.js',
        placeholder: '',
        isRequired: true,
      },
      {
        id: 'achieve',
        title: 'Achieve',
        content: 'better speed',
        placeholder: '',
        isRequired: true,
      },
      {
        id: 'accepting',
        title: 'Accepting',
        content: 'complexity',
        placeholder: '',
        isRequired: true,
      },
      {
        id: 'rationale',
        title: 'Rationale',
        content: '',
        placeholder: '',
        isRequired: false,
      },
      {
        id: 'references',
        title: 'References',
        content: '',
        placeholder: '',
        isRequired: false,
      },
    ]

    const parser = getTemplateParser('y-statement')
    const result = parser?.generateMarkdown(sections)

    expect(result).toBeDefined()
    expect(result).toContain('# Y-Statement: React')
    expect(result).toContain('In the context of building an app')
    expect(result).toContain('## Rationale')
    expect(result).toContain('## References')
    expect(result).not.toContain('---')
  })
})

test.describe('Free Form Generator', () => {
  test('should generate free form markdown correctly', () => {
    const sections: AdrTemplateSection[] = [
      {
        id: 'content',
        title: 'Content',
        content:
          "# My Custom ADR\n\nThis is custom content.\n\n## Decision\n\nWe decided to use React.\n\n## Rationale\n\nBecause it's popular.",
        placeholder: '',
        isRequired: true,
      },
    ]

    const options: GenerateMarkdownOptions = {
      status: 'in-progress',
      tags: ['custom', 'decision'],
    }

    const parser = getTemplateParser('free-form')
    const result = parser?.generateMarkdown(sections, options)

    expect(result).toBeDefined()
    expect(result).toContain('---')
    expect(result).toContain('status: "in-progress"')
    expect(result).toContain('tags: ["custom", "decision"]')
    expect(result).toContain('# My Custom ADR')
    expect(result).toContain('This is custom content.')
    expect(result).toContain('## Decision')
    expect(result).toContain('We decided to use React.')
    expect(result).toContain('## Rationale')
    expect(result).toContain("Because it's popular.")
  })

  test('should generate free form without frontmatter', () => {
    const sections: AdrTemplateSection[] = [
      {
        id: 'content',
        title: 'Content',
        content: '# Simple ADR\n\nJust the content.',
        placeholder: '',
        isRequired: true,
      },
    ]

    const parser = getTemplateParser('free-form')
    const result = parser?.generateMarkdown(sections)

    expect(result).toBeDefined()
    expect(result).toContain('# Simple ADR')
    expect(result).toContain('Just the content.')
    expect(result).not.toContain('---')
  })
})

test.describe('Utility Functions', () => {
  test('markdownToSections should work correctly', () => {
    const result = markdownToSections(sampleMADRMinimalMarkdown, 'madr-minimal')
    expect(result).toBeDefined()
    expect(result.status).toBe('todo')
    expect(result.tags).toEqual(['architecture', 'decision'])
    expect(result.sections).toHaveLength(5)
  })

  test('sectionsToMarkdown should work correctly', () => {
    const sections: AdrTemplateSection[] = [
      {
        id: 'title',
        title: 'Title',
        content: 'Test Decision',
        placeholder: '',
        isRequired: true,
      },
      {
        id: 'context',
        title: 'Context',
        content: 'Context here.',
        placeholder: '',
        isRequired: true,
      },
      {
        id: 'options',
        title: 'Options',
        content: '* Option 1',
        placeholder: '',
        isRequired: true,
      },
      {
        id: 'decision',
        title: 'Decision',
        content: 'Decision here.',
        placeholder: '',
        isRequired: true,
      },
      {
        id: 'consequences',
        title: 'Consequences',
        content: '',
        placeholder: '',
        isRequired: false,
      },
    ]

    const options: GenerateMarkdownOptions = {
      status: 'todo',
      tags: ['test'],
    }

    const result = sectionsToMarkdown(sections, 'madr-minimal', options)
    expect(result).toBeDefined()
    expect(result).toContain('status: "todo"')
    expect(result).toContain('tags: ["test"]')
    expect(result).toContain('# Test Decision')
  })

  test('parseMarkdownToSections should work correctly', () => {
    const template = getTemplateById('madr-minimal')
    expect(template).toBeDefined()

    const result = parseMarkdownToSections(sampleMADRMinimalMarkdown, template!)
    expect(result).toBeDefined()
    expect(result.status).toBe('todo')
    expect(result.sections).toHaveLength(5)
  })

  test('should throw error for invalid template id', () => {
    expect(() => {
      markdownToSections('# Test', 'invalid-template')
    }).toThrow('No parser found for template: invalid-template')
  })
})

test.describe('Frontmatter Utilities', () => {
  test('extractFrontmatterFromMarkdown should work correctly', () => {
    const result = extractFrontmatterFromMarkdown(sampleMADRMinimalMarkdown)
    expect(result).toBeDefined()
    expect(result.status).toBe('todo')
    expect(result.tags).toEqual(['architecture', 'decision'])
    expect(result.frontmatter).toBeDefined()
    expect(result.content).toContain('# Use React for Frontend')
  })

  test('extractFrontmatterFromMarkdown should handle markdown without frontmatter', () => {
    const markdownWithoutFrontmatter = '# Test\n\nContent here.'
    const result = extractFrontmatterFromMarkdown(markdownWithoutFrontmatter)
    expect(result).toBeDefined()
    expect(result.status).toBeUndefined()
    expect(result.tags).toBeUndefined()
    expect(result.frontmatter).toBeUndefined()
    expect(result.content).toBe(markdownWithoutFrontmatter)
  })

  test('addFrontmatterToMarkdown should work correctly', () => {
    const content = '# Test\n\nContent here.'
    const options: GenerateMarkdownOptions = {
      status: 'todo',
      tags: ['test'],
      frontmatter: { date: '2023-12-01' },
    }

    const result = addFrontmatterToMarkdown(content, options)
    expect(result).toBeDefined()
    expect(result).toContain('---')
    expect(result).toContain('status: "todo"')
    expect(result).toContain('tags: ["test"]')
    expect(result).toContain('date: "2023-12-01"')
    expect(result).toContain('# Test')
  })

  test('updateFrontmatterInMarkdown should work correctly', () => {
    const options: Partial<GenerateMarkdownOptions> = {
      status: 'done',
      tags: ['updated'],
    }

    const result = updateFrontmatterInMarkdown(
      sampleMADRMinimalMarkdown,
      options,
    )
    expect(result).toBeDefined()
    expect(result).toContain('status: "done"')
    expect(result).toContain('tags: ["updated"]')
    expect(result).toContain('# Use React for Frontend')
  })

  test('ensureFrontmatterInMarkdown should add frontmatter when missing', () => {
    const markdownWithoutFrontmatter = '# Test\n\nContent here.'
    const options: GenerateMarkdownOptions = {
      status: 'todo',
      tags: ['test'],
    }

    const result = ensureFrontmatterInMarkdown(
      markdownWithoutFrontmatter,
      options,
    )
    expect(result).toBeDefined()
    expect(result).toContain('---')
    expect(result).toContain('status: "todo"')
    expect(result).toContain('tags: ["test"]')
    expect(result).toContain('# Test')
  })

  test('ensureFrontmatterInMarkdown should update existing frontmatter', () => {
    const options: GenerateMarkdownOptions = {
      status: 'done',
    }

    const result = ensureFrontmatterInMarkdown(
      sampleMADRMinimalMarkdown,
      options,
    )
    expect(result).toBeDefined()
    expect(result).toContain('status: "done"')
    expect(result).toContain('tags: ["architecture", "decision"]') // Should preserve existing tags
  })

  test('ensureFrontmatterInMarkdown should return unchanged when no options provided', () => {
    const result = ensureFrontmatterInMarkdown(sampleMADRMinimalMarkdown)
    expect(result).toBe(sampleMADRMinimalMarkdown)
  })
})

test.describe('Edge Cases and Error Handling', () => {
  test('should handle empty markdown', () => {
    const parser = getTemplateParser('madr-minimal')
    const result = parser?.parseMarkdown('')
    expect(result).toBeDefined()
    expect(result?.sections).toHaveLength(5)
    expect(result?.sections.every((s) => s.content === '')).toBe(true)
  })

  test('should handle empty sections array', () => {
    const parser = getTemplateParser('madr-minimal')
    const result = parser?.generateMarkdown([])
    expect(result).toBeDefined()
    expect(result).toContain('# ')
    expect(result).toContain('## Context and Problem Statement')
  })

  test('should handle sections with special characters', () => {
    const sections: AdrTemplateSection[] = [
      {
        id: 'title',
        title: 'Title',
        content: 'Use "React" & Angular',
        placeholder: '',
        isRequired: true,
      },
      {
        id: 'context',
        title: 'Context',
        content: 'Context with <html> tags',
        placeholder: '',
        isRequired: true,
      },
      {
        id: 'options',
        title: 'Options',
        content: '* Option with *emphasis*',
        placeholder: '',
        isRequired: true,
      },
      {
        id: 'decision',
        title: 'Decision',
        content: 'Decision with `code`',
        placeholder: '',
        isRequired: true,
      },
      {
        id: 'consequences',
        title: 'Consequences',
        content: 'Consequences with [link](url)',
        placeholder: '',
        isRequired: false,
      },
    ]

    const parser = getTemplateParser('madr-minimal')
    const result = parser?.generateMarkdown(sections)
    expect(result).toBeDefined()
    expect(result).toContain('Use "React" & Angular')
    expect(result).toContain('Context with <html> tags')
    expect(result).toContain('* Option with *emphasis*')
    expect(result).toContain('Decision with `code`')
    expect(result).toContain('Consequences with [link](url)')
  })

  test('should handle empty tags array', () => {
    const options: GenerateMarkdownOptions = {
      status: 'todo',
      tags: [],
    }

    const parser = getTemplateParser('madr-minimal')
    const result = parser?.generateMarkdown([], options)
    expect(result).toBeDefined()
    expect(result).toContain('status: "todo"')
    expect(result).not.toContain('tags:')
  })

  test('should handle undefined status', () => {
    const options: GenerateMarkdownOptions = {
      tags: ['test'],
    }

    const parser = getTemplateParser('madr-minimal')
    const result = parser?.generateMarkdown([], options)
    expect(result).toBeDefined()
    expect(result).toContain('tags: ["test"]')
    expect(result).not.toContain('status:')
  })
})
