import { test, expect } from '@playwright/test'
import {
  getTemplateParser,
  type GenerateMarkdownOptions,
  type AdrStatus,
} from '../src/app/[repo]/adr/[path]/adr-templates'
import type { AdrTemplateSection } from '../src/definitions/types'

test.describe('Round-trip Tests', () => {
  const templateIds = ['madr-minimal', 'madr-full', 'y-statement', 'free-form']
  const templateIdsFormatted = ['madr-minimal', 'y-statement', 'free-form']

  templateIdsFormatted.forEach((templateId) => {
    test(`should round-trip correctly for ${templateId}`, () => {
      const parser = getTemplateParser(templateId)
      expect(parser).toBeDefined()

      // Create test sections based on template
      const testSections = createTestSections(templateId)
      const options: GenerateMarkdownOptions = {
        status: 'todo' as AdrStatus,
        tags: ['test', 'round-trip'],
        frontmatter: { date: '2023-12-01', author: 'Test User' },
      }

      // Generate markdown from sections
      const generatedMarkdown = parser?.generateMarkdown(testSections, options)
      expect(generatedMarkdown).toBeDefined()

      // Parse the generated markdown back to sections
      const parsedResult = parser?.parseMarkdown(generatedMarkdown)
      expect(parsedResult).toBeDefined()

      // Verify that the round-trip preserves the data
      expect(parsedResult?.status).toBe(options.status)
      expect(parsedResult?.tags).toEqual(options.tags)
      expect(parsedResult?.frontmatter?.date).toBe(options.frontmatter?.date)
      expect(parsedResult?.frontmatter?.author).toBe(
        options.frontmatter?.author,
      )

      // Verify section content is preserved
      testSections.forEach((originalSection) => {
        const parsedSection = parsedResult?.sections.find(
          (s) => s.id === originalSection.id,
        )
        expect(parsedSection).toBeDefined()
        expect(parsedSection?.content.trim()).toBe(
          originalSection.content.trim(),
        )
      })
    })
  })

  templateIds.forEach((templateId) => {
    test(`should handle empty content round-trip for ${templateId}`, () => {
      const parser = getTemplateParser(templateId)
      expect(parser).toBeDefined()

      const emptySections = createEmptySections(templateId)
      const generatedMarkdown = parser?.generateMarkdown(emptySections)
      expect(generatedMarkdown).toBeDefined()

      const parsedResult = parser?.parseMarkdown(generatedMarkdown)
      expect(parsedResult).toBeDefined()
      expect(parsedResult?.sections).toHaveLength(emptySections.length)
    })
  })

  test('should handle frontmatter-only changes', () => {
    const parser = getTemplateParser('madr-minimal')
    expect(parser).toBeDefined()

    const testSections = createTestSections('madr-minimal')

    // Generate with initial frontmatter
    const initialOptions: GenerateMarkdownOptions = {
      status: 'todo' as AdrStatus,
      tags: ['initial'],
      frontmatter: { version: '1.0' },
    }

    const initialMarkdown = parser?.generateMarkdown(
      testSections,
      initialOptions,
    )
    expect(initialMarkdown).toBeDefined()

    // Parse and update frontmatter
    const parsedResult = parser?.parseMarkdown(initialMarkdown)
    expect(parsedResult).toBeDefined()

    const updatedOptions: GenerateMarkdownOptions = {
      status: 'done',
      tags: ['updated', 'final'],
      frontmatter: { version: '2.0', reviewer: 'John Doe' },
    }

    const updatedMarkdown = parser?.generateMarkdown(
      parsedResult?.sections,
      updatedOptions,
    )
    expect(updatedMarkdown).toBeDefined()

    // Parse again and verify changes
    const finalResult = parser?.parseMarkdown(updatedMarkdown)
    expect(finalResult).toBeDefined()
    expect(finalResult?.status).toBe('done')
    expect(finalResult?.tags).toEqual(['updated', 'final'])
    expect(finalResult?.frontmatter?.version).toBe('2.0')
    expect(finalResult?.frontmatter?.reviewer).toBe('John Doe')
  })

  test('should handle complex markdown content', () => {
    const parser = getTemplateParser('free-form')
    expect(parser).toBeDefined()

    const complexContent = `# Complex ADR

## Background

This is a complex ADR with various markdown features:

- **Bold text**
- *Italic text*
- \`inline code\`
- [Links](https://example.com)

### Code Block

\`\`\`typescript
function example() {
  return "Hello World";
}
\`\`\`

### Table

| Option | Pros | Cons |
|--------|------|------|
| A      | Fast | Complex |
| B      | Simple | Slow |

### Nested Lists

1. First item
   - Nested item 1
   - Nested item 2
2. Second item
   - Another nested item

## Decision

We decided to use **Option A** because:

> It provides the best performance characteristics
> while maintaining acceptable complexity.

## References

- [Documentation](https://docs.example.com)
- [RFC 123](https://rfc.example.com/123)
`

    const sections: AdrTemplateSection[] = [
      {
        id: 'content',
        title: 'Content',
        content: complexContent,
        placeholder: '',
        isRequired: true,
      },
    ]

    const options: GenerateMarkdownOptions = {
      status: 'todo',
      tags: ['complex', 'markdown'],
      frontmatter: { complexity: 'high' },
    }

    const generatedMarkdown = parser?.generateMarkdown(sections, options)
    expect(generatedMarkdown).toBeDefined()

    const parsedResult = parser?.parseMarkdown(generatedMarkdown)
    expect(parsedResult).toBeDefined()
    expect(parsedResult?.status).toBe('todo')
    expect(parsedResult?.tags).toEqual(['complex', 'markdown'])
    expect(parsedResult?.frontmatter?.complexity).toBe('high')

    const contentSection = parsedResult?.sections.find(
      (s) => s.id === 'content',
    )
    expect(contentSection).toBeDefined()
    expect(contentSection?.content.trim()).toBe(complexContent.trim())
  })
})

function createTestSections(templateId: string): AdrTemplateSection[] {
  switch (templateId) {
    case 'madr-minimal':
      return [
        {
          id: 'title',
          title: 'Title',
          content: 'Test MADR Minimal Decision',
          placeholder: '',
          isRequired: true,
        },
        {
          id: 'context',
          title: 'Context',
          content: 'We need to make a decision about our architecture.',
          placeholder: '',
          isRequired: true,
        },
        {
          id: 'options',
          title: 'Options',
          content:
            '* Option A - Fast but complex\n* Option B - Simple but slow\n* Option C - Balanced approach',
          placeholder: '',
          isRequired: true,
        },
        {
          id: 'decision',
          title: 'Decision',
          content:
            'Chosen option: "Option C", because it provides the best balance of performance and simplicity.',
          placeholder: '',
          isRequired: true,
        },
        {
          id: 'consequences',
          title: 'Consequences',
          content:
            "* Good, because it's maintainable\n* Bad, because it requires more initial setup\n* Neutral, because it's a standard approach",
          placeholder: '',
          isRequired: false,
        },
      ]

    case 'madr-full':
      return [
        {
          id: 'title',
          title: 'Title',
          content: 'Test MADR Full Decision',
          placeholder: '',
          isRequired: true,
        },
        {
          id: 'context',
          title: 'Context',
          content:
            'We need to make a comprehensive decision about our architecture.',
          placeholder: '',
          isRequired: true,
        },
        {
          id: 'drivers',
          title: 'Drivers',
          content:
            '* Performance requirements\n* Maintainability concerns\n* Team expertise\n* Budget constraints',
          placeholder: '',
          isRequired: false,
        },
        {
          id: 'options',
          title: 'Options',
          content:
            '* Option A - High performance\n* Option B - Easy maintenance\n* Option C - Cost effective',
          placeholder: '',
          isRequired: true,
        },
        {
          id: 'decision',
          title: 'Decision',
          content:
            'Chosen option: "Option A", because performance is our top priority.',
          placeholder: '',
          isRequired: true,
        },
        {
          id: 'consequences',
          title: 'Consequences',
          content:
            '* Good, because it meets our performance goals\n* Bad, because it requires specialized knowledge',
          placeholder: '',
          isRequired: false,
        },
        {
          id: 'confirmation',
          title: 'Confirmation',
          content:
            'We will implement a proof of concept to validate our assumptions.',
          placeholder: '',
          isRequired: false,
        },
        {
          id: 'proscons',
          title: 'Pros and Cons',
          content:
            '### Option A\n\n* Good, because fastest\n* Bad, because most complex\n\n### Option B\n\n* Good, because easiest to maintain\n* Bad, because slower',
          placeholder: '',
          isRequired: false,
        },
        {
          id: 'moreinfo',
          title: 'More Info',
          content:
            'See performance benchmarks in /docs/benchmarks.md\nConsult with the performance team for optimization strategies.',
          placeholder: '',
          isRequired: false,
        },
      ]

    case 'y-statement':
      return [
        {
          id: 'context',
          title: 'Context',
          content: 'building a scalable web application',
          placeholder: '',
          isRequired: true,
        },
        {
          id: 'facing',
          title: 'Facing',
          content: 'high traffic demands and complex user interactions',
          placeholder: '',
          isRequired: true,
        },
        {
          id: 'decided',
          title: 'Decided',
          content: 'microservices architecture with React frontend',
          placeholder: '',
          isRequired: true,
        },
        {
          id: 'neglected',
          title: 'Neglected',
          content: 'monolithic architecture and server-side rendering',
          placeholder: '',
          isRequired: true,
        },
        {
          id: 'achieve',
          title: 'Achieve',
          content: 'better scalability, maintainability, and user experience',
          placeholder: '',
          isRequired: true,
        },
        {
          id: 'accepting',
          title: 'Accepting',
          content:
            'increased complexity in deployment and inter-service communication',
          placeholder: '',
          isRequired: true,
        },
        {
          id: 'rationale',
          title: 'Rationale',
          content:
            'The microservices architecture allows us to scale individual components independently and enables different teams to work on different services. React provides a rich user interface with excellent performance.',
          placeholder: '',
          isRequired: false,
        },
        {
          id: 'references',
          title: 'References',
          content:
            '* [Microservices Patterns](https://microservices.io/patterns/)\n* [React Best Practices](https://react.dev/learn)\n* [Scalability Guidelines](https://example.com/scalability)',
          placeholder: '',
          isRequired: false,
        },
      ]

    case 'free-form':
      return [
        {
          id: 'content',
          title: 'Content',
          content:
            '# Custom Architecture Decision\n\n## Problem\n\nWe need to decide on our deployment strategy.\n\n## Analysis\n\nAfter analyzing our options, we found:\n\n- **Option 1**: Traditional hosting\n- **Option 2**: Cloud containers\n- **Option 3**: Serverless functions\n\n## Decision\n\nWe chose **Option 2** (Cloud containers) because:\n\n1. Better scalability than traditional hosting\n2. More control than serverless\n3. Cost-effective for our use case\n\n## Implementation\n\n```yaml\n# docker-compose.yml\nversion: "3.8"\nservices:\n  web:\n    image: nginx:alpine\n    ports:\n      - "80:80"\n```\n\n## Next Steps\n\n- [ ] Set up CI/CD pipeline\n- [ ] Configure monitoring\n- [ ] Train team on containerization',
          placeholder: '',
          isRequired: true,
        },
      ]

    default:
      return []
  }
}

function createEmptySections(templateId: string): AdrTemplateSection[] {
  const testSections = createTestSections(templateId)
  return testSections.map((section) => ({
    ...section,
    content: '',
  }))
}
