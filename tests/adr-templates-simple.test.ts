import { test, expect } from '@playwright/test'
import {
  getTemplateParser,
  type GenerateMarkdownOptions,
  type AdrStatus,
} from '../src/app/[repo]/adr/[path]/adr-templates'
import type { AdrTemplateSection } from '../src/definitions/types'

test.describe('Simple Round-trip Tests', () => {
  test('should round-trip MADR minimal correctly', () => {
    const parser = getTemplateParser('madr-minimal')
    if (!parser) {
      throw new Error('Parser not found')
    }

    const testSections: AdrTemplateSection[] = [
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
        content: 'We need to make a decision.',
        placeholder: '',
        isRequired: true,
      },
      {
        id: 'options',
        title: 'Options',
        content: '* Option A\n* Option B',
        placeholder: '',
        isRequired: true,
      },
      {
        id: 'decision',
        title: 'Decision',
        content: 'Chosen option: "Option A".',
        placeholder: '',
        isRequired: true,
      },
      {
        id: 'consequences',
        title: 'Consequences',
        content: "* Good, because it works\n* Bad, because it's complex",
        placeholder: '',
        isRequired: false,
      },
    ]

    const status: AdrStatus = 'todo'
    const options: GenerateMarkdownOptions = {
      status,
      tags: ['test', 'round-trip'],
      frontmatter: { date: '2023-12-01' },
    }

    const generatedMarkdown = parser.generateMarkdown(testSections, options)
    expect(generatedMarkdown).toBeDefined()
    expect(generatedMarkdown).toContain('status: "todo"')
    expect(generatedMarkdown).toContain('tags: ["test", "round-trip"]')
    expect(generatedMarkdown).toContain('# Test Decision')

    const parsedResult = parser.parseMarkdown(generatedMarkdown)
    expect(parsedResult).toBeDefined()
    expect(parsedResult.status).toBe(status)
    expect(parsedResult.tags).toEqual(['test', 'round-trip'])
    expect(parsedResult.frontmatter?.date).toBe('2023-12-01')

    const titleSection = parsedResult.sections.find((s) => s.id === 'title')
    expect(titleSection?.content).toBe('Test Decision')
  })

  test('should round-trip MADR full correctly', () => {
    const parser = getTemplateParser('madr-full')
    if (!parser) {
      throw new Error('Parser not found')
    }

    const testSections: AdrTemplateSection[] = [
      {
        id: 'title',
        title: 'Title',
        content: 'Full Test Decision',
        placeholder: '',
        isRequired: true,
      },
      {
        id: 'context',
        title: 'Context',
        content: 'We need to make a comprehensive decision.',
        placeholder: '',
        isRequired: true,
      },
      {
        id: 'drivers',
        title: 'Drivers',
        content: '* Performance\n* Maintainability',
        placeholder: '',
        isRequired: false,
      },
      {
        id: 'options',
        title: 'Options',
        content: '* Option A\n* Option B',
        placeholder: '',
        isRequired: true,
      },
      {
        id: 'decision',
        title: 'Decision',
        content: 'Chosen option: "Option A".',
        placeholder: '',
        isRequired: true,
      },
      {
        id: 'consequences',
        title: 'Consequences',
        content: '* Good, because it works',
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
        content: '### Option A\n\n* Good, because fast',
        placeholder: '',
        isRequired: false,
      },
      {
        id: 'moreinfo',
        title: 'More Info',
        content: 'Additional information here.',
        placeholder: '',
        isRequired: false,
      },
    ]

    const status: AdrStatus = 'done'
    const options: GenerateMarkdownOptions = {
      status,
      tags: ['architecture'],
    }

    const generatedMarkdown = parser.generateMarkdown(testSections, options)
    expect(generatedMarkdown).toBeDefined()
    expect(generatedMarkdown).toContain('status: "done"')
    expect(generatedMarkdown).toContain('# Full Test Decision')

    const parsedResult = parser.parseMarkdown(generatedMarkdown)
    expect(parsedResult).toBeDefined()
    expect(parsedResult.status).toBe(status)
    expect(parsedResult.tags).toEqual(['architecture'])

    const titleSection = parsedResult.sections.find((s) => s.id === 'title')
    expect(titleSection?.content).toBe('Full Test Decision')

    const driversSection = parsedResult.sections.find((s) => s.id === 'drivers')
    expect(driversSection?.content).toContain('Performance')
  })

  test('should round-trip Y-statement correctly', () => {
    const parser = getTemplateParser('y-statement')
    if (!parser) {
      throw new Error('Parser not found')
    }

    const testSections: AdrTemplateSection[] = [
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
        content: 'Vue.js',
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
        content: 'React has the best ecosystem.',
        placeholder: '',
        isRequired: false,
      },
      {
        id: 'references',
        title: 'References',
        content: '* React docs',
        placeholder: '',
        isRequired: false,
      },
    ]

    const status: AdrStatus = 'in-progress'
    const options: GenerateMarkdownOptions = {
      status,
      tags: ['frontend'],
    }

    const generatedMarkdown = parser.generateMarkdown(testSections, options)
    expect(generatedMarkdown).toBeDefined()
    expect(generatedMarkdown).toContain('status: "in-progress"')
    expect(generatedMarkdown).toContain('# Y-Statement: React')

    const parsedResult = parser.parseMarkdown(generatedMarkdown)
    expect(parsedResult).toBeDefined()
    expect(parsedResult.status).toBe(status)
    expect(parsedResult.tags).toEqual(['frontend'])

    const decidedSection = parsedResult.sections.find((s) => s.id === 'decided')
    expect(decidedSection?.content).toBe('React')
  })

  test('should round-trip free-form correctly', () => {
    const parser = getTemplateParser('free-form')
    if (!parser) {
      throw new Error('Parser not found')
    }

    const customContent = `# Custom ADR

## Problem

We need to decide on our approach.

## Solution

We will use a hybrid approach.

## Benefits

* Flexible
* Scalable
* Maintainable
`

    const testSections: AdrTemplateSection[] = [
      {
        id: 'content',
        title: 'Content',
        content: customContent,
        placeholder: '',
        isRequired: true,
      },
    ]

    const status: AdrStatus = 'backlog'
    const options: GenerateMarkdownOptions = {
      status,
      tags: ['custom'],
    }

    const generatedMarkdown = parser.generateMarkdown(testSections, options)
    expect(generatedMarkdown).toBeDefined()
    expect(generatedMarkdown).toContain('status: "backlog"')
    expect(generatedMarkdown).toContain('# Custom ADR')

    const parsedResult = parser.parseMarkdown(generatedMarkdown)
    expect(parsedResult).toBeDefined()
    expect(parsedResult.status).toBe(status)
    expect(parsedResult.tags).toEqual(['custom'])

    const contentSection = parsedResult.sections.find((s) => s.id === 'content')
    expect(contentSection?.content.trim()).toBe(customContent.trim())
  })

  test('should handle empty sections', () => {
    const parser = getTemplateParser('madr-minimal')
    if (!parser) {
      throw new Error('Parser not found')
    }

    const emptySections: AdrTemplateSection[] = [
      {
        id: 'title',
        title: 'Title',
        content: '',
        placeholder: '',
        isRequired: true,
      },
      {
        id: 'context',
        title: 'Context',
        content: '',
        placeholder: '',
        isRequired: true,
      },
      {
        id: 'options',
        title: 'Options',
        content: '',
        placeholder: '',
        isRequired: true,
      },
      {
        id: 'decision',
        title: 'Decision',
        content: '',
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

    const generatedMarkdown = parser.generateMarkdown(emptySections)
    expect(generatedMarkdown).toBeDefined()
    expect(generatedMarkdown).toContain('# ')
    expect(generatedMarkdown).toContain('## Context and Problem Statement')

    const parsedResult = parser.parseMarkdown(generatedMarkdown)
    expect(parsedResult).toBeDefined()
    expect(parsedResult.sections).toHaveLength(5)
  })

  test('should handle complex markdown formatting', () => {
    const parser = getTemplateParser('free-form')
    if (!parser) {
      throw new Error('Parser not found')
    }

    const complexContent = `# ADR with **Bold** and *Italic*

## Code Example

\`\`\`javascript
function example() {
  return "Hello World";
}
\`\`\`

## Table

| Option | Pros | Cons |
|--------|------|------|
| A      | Fast | Complex |
| B      | Simple | Slow |

## List

1. First item
   - Nested item
2. Second item

> This is a blockquote
> with multiple lines

[Link to documentation](https://example.com)
`

    const testSections: AdrTemplateSection[] = [
      {
        id: 'content',
        title: 'Content',
        content: complexContent,
        placeholder: '',
        isRequired: true,
      },
    ]

    const status: AdrStatus = 'todo'
    const options: GenerateMarkdownOptions = {
      status,
      tags: ['complex', 'formatting'],
    }

    const generatedMarkdown = parser.generateMarkdown(testSections, options)
    expect(generatedMarkdown).toBeDefined()
    expect(generatedMarkdown).toContain('status: "todo"')
    expect(generatedMarkdown).toContain('**Bold**')
    expect(generatedMarkdown).toContain('```javascript')
    expect(generatedMarkdown).toContain('| Option | Pros | Cons |')

    const parsedResult = parser.parseMarkdown(generatedMarkdown)
    expect(parsedResult).toBeDefined()
    expect(parsedResult.status).toBe(status)
    expect(parsedResult.tags).toEqual(['complex', 'formatting'])

    const contentSection = parsedResult.sections.find((s) => s.id === 'content')
    expect(contentSection?.content.trim()).toBe(complexContent.trim())
  })
})
