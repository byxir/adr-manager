import type { AdrTemplate, AdrTemplateSection } from '@/definitions/types'

const MADR_MINIMAL_SECTIONS: AdrTemplateSection[] = [
  {
    id: 'title',
    title: 'Title',
    placeholder:
      'Short title, representative of solved problem and found solution',
    content: 'Choose Database Technology for User Management System',
    isRequired: true,
  },
  {
    id: 'context',
    title: 'Context and Problem Statement',
    placeholder: 'Describe the context and problem statement...',
    content:
      'We are building a new user management system for our e-commerce platform. The system needs to handle user authentication, profile management, and session data. We need to choose a database technology that can scale with our growing user base while maintaining data consistency and providing good performance for read-heavy workloads.',
    isRequired: true,
  },
  {
    id: 'options',
    title: 'Considered Options',
    placeholder:
      '* Title of option 1\n* Title of option 2\n* Title of option 3',
    content:
      '* PostgreSQL with connection pooling\n* MongoDB with replica sets\n* Redis with persistence\n* MySQL with read replicas',
    isRequired: true,
  },
  {
    id: 'decision',
    title: 'Decision Outcome',
    placeholder: 'Chosen option: "title of option", because justification...',
    content:
      'Chosen option: "PostgreSQL with connection pooling", because it provides ACID compliance for critical user data, has excellent JSON support for flexible schemas, strong community support, and proven scalability patterns that align with our team\'s expertise.',
    isRequired: true,
  },
  {
    id: 'consequences',
    title: 'Consequences',
    placeholder: '* Good, because...\n* Bad, because...',
    content:
      '* Good, because we get strong data consistency and reliability\n* Good, because our team already has PostgreSQL expertise\n* Good, because it supports both relational and document-style queries\n* Bad, because it may require more complex setup for high availability\n* Bad, because it might be more resource-intensive than NoSQL alternatives',
    isRequired: false,
  },
]

const MADR_FULL_SECTIONS: AdrTemplateSection[] = [
  {
    id: 'metadata',
    title: 'Metadata',
    placeholder:
      'status: "proposed"\ndate: YYYY-MM-DD\ndecision-makers: ...\nconsulted: ...\ninformed: ...',
    content:
      'status: "accepted"\ndate: 2024-01-15\ndecision-makers: John Doe, Jane Smith\nconsulted: Database Team, DevOps Team\ninformed: Development Team, Product Team',
    isRequired: false,
  },
  {
    id: 'title',
    title: 'Title',
    placeholder:
      'Short title, representative of solved problem and found solution',
    content: 'Adopt Microservices Architecture for Payment Processing',
    isRequired: true,
  },
  {
    id: 'context',
    title: 'Context and Problem Statement',
    placeholder: 'Describe the context and problem statement...',
    content:
      'Our current monolithic payment processing system is becoming difficult to maintain and scale. As we expand to new markets and payment methods, we need an architecture that allows independent development and deployment of payment features while maintaining reliability and compliance with financial regulations.',
    isRequired: true,
  },
  {
    id: 'drivers',
    title: 'Decision Drivers',
    placeholder: '* Decision driver 1\n* Decision driver 2',
    content:
      '* Need for independent scaling of payment components\n* Regulatory compliance requirements for different regions\n* Team autonomy and faster development cycles\n* High availability and fault tolerance requirements\n* Integration with multiple third-party payment providers',
    isRequired: false,
  },
  {
    id: 'options',
    title: 'Considered Options',
    placeholder:
      '* Title of option 1\n* Title of option 2\n* Title of option 3',
    content:
      '* Continue with monolithic architecture\n* Microservices with event-driven communication\n* Modular monolith with clear boundaries\n* Service-oriented architecture (SOA)',
    isRequired: true,
  },
  {
    id: 'decision',
    title: 'Decision Outcome',
    placeholder: 'Chosen option: "title of option", because justification...',
    content:
      'Chosen option: "Microservices with event-driven communication", because it provides the scalability and independence we need while enabling better fault isolation and team autonomy. The event-driven approach aligns well with financial transaction processing patterns.',
    isRequired: true,
  },
  {
    id: 'consequences',
    title: 'Consequences',
    placeholder: '* Good, because...\n* Bad, because...',
    content:
      '* Good, because teams can deploy independently\n* Good, because individual services can be scaled based on demand\n* Good, because failure isolation prevents cascading issues\n* Bad, because increased operational complexity\n* Bad, because distributed system challenges (network latency, eventual consistency)',
    isRequired: false,
  },
  {
    id: 'confirmation',
    title: 'Confirmation',
    placeholder: 'Describe how the implementation can be confirmed...',
    content:
      'Implementation will be confirmed through code reviews ensuring service boundaries are respected, automated tests verifying service contracts, and monitoring dashboards showing independent service deployment and scaling metrics.',
    isRequired: false,
  },
  {
    id: 'proscons',
    title: 'Pros and Cons of the Options',
    placeholder: '### Option 1\n\n* Good, because...\n* Bad, because...',
    content:
      '### Microservices with event-driven communication\n\n* Good, because enables independent deployment and scaling\n* Good, because improves fault isolation\n* Good, because allows technology diversity\n* Bad, because increases operational complexity\n* Bad, because requires distributed system expertise\n\n### Modular monolith\n\n* Good, because simpler deployment and debugging\n* Good, because easier to maintain consistency\n* Bad, because limited scalability options\n* Bad, because potential for tight coupling over time',
    isRequired: false,
  },
  {
    id: 'moreinfo',
    title: 'More Information',
    placeholder:
      'Additional evidence, team agreement, links to other decisions...',
    content:
      'See related ADR-002 for API Gateway selection and ADR-003 for event store implementation. Team consensus reached after architecture review sessions. Implementation timeline: Q2 2024.',
    isRequired: false,
  },
]

const Y_STATEMENT_SECTIONS: AdrTemplateSection[] = [
  {
    id: 'context',
    title: 'In the context of',
    placeholder:
      'functional requirement (story, use case) or architectural component',
    content: 'the user authentication service for our e-commerce platform',
    isRequired: true,
  },
  {
    id: 'facing',
    title: 'facing',
    placeholder: 'non-functional requirement, for instance a desired quality',
    content:
      'the need to ensure secure user sessions while maintaining fast login times across multiple devices',
    isRequired: true,
  },
  {
    id: 'decided',
    title: 'we decided for',
    placeholder: 'decision outcome (the most important part)',
    content: 'JWT tokens with Redis session store',
    isRequired: true,
  },
  {
    id: 'neglected',
    title: 'and against',
    placeholder: 'alternatives not chosen (not to be forgotten!)',
    content: 'server-side sessions only, or stateless JWT-only approach',
    isRequired: true,
  },
  {
    id: 'achieve',
    title: 'to achieve',
    placeholder: 'benefits, the full or partial satisfaction of requirement(s)',
    content:
      'fast authentication with the ability to revoke sessions instantly when needed',
    isRequired: true,
  },
  {
    id: 'accepting',
    title: 'accepting that',
    placeholder:
      'drawbacks and other consequences, for instance impact on other properties/context and effort/cost',
    content:
      'we need to maintain Redis infrastructure and handle token refresh logic',
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

${sectionMap.options ?? '* {title of option 1}\n* {title of option 2}\n* {title of option 3}\n* … <!-- numbers of options can vary -->'}

## Decision Outcome

${sectionMap.decision ?? 'Chosen option: "{title of option 1}", because {justification. e.g., only option, which meets k.o. criterion decision driver | which resolves force {force} | … | comes out best (see below)}.'}

${sectionMap.consequences ? '<!-- This is an optional element. Feel free to remove. -->\n### Consequences\n\n' + sectionMap.consequences : '<!-- This is an optional element. Feel free to remove. -->\n### Consequences\n\n* Good, because {positive consequence, e.g., improvement of one or more desired qualities, …}\n* Bad, because {negative consequence, e.g., compromising one or more desired qualities, …}\n* … <!-- numbers of consequences can vary -->'}
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

${sectionMap.drivers ? '<!-- This is an optional element. Feel free to remove. -->\n## Decision Drivers\n\n' + sectionMap.drivers : '<!-- This is an optional element. Feel free to remove. -->\n## Decision Drivers\n\n* {decision driver 1, e.g., a force, facing concern, …}\n* {decision driver 2, e.g., a force, facing concern, …}\n* … <!-- numbers of drivers can vary -->'}

## Considered Options

${sectionMap.options ?? '* {title of option 1}\n* {title of option 2}\n* {title of option 3}\n* … <!-- numbers of options can vary -->'}

## Decision Outcome

${sectionMap.decision ?? 'Chosen option: "{title of option 1}", because {justification. e.g., only option, which meets k.o. criterion decision driver | which resolves force {force} | … | comes out best (see below)}.'}

${sectionMap.consequences ? '<!-- This is an optional element. Feel free to remove. -->\n### Consequences\n\n' + sectionMap.consequences : '<!-- This is an optional element. Feel free to remove. -->\n### Consequences\n\n* Good, because {positive consequence, e.g., improvement of one or more desired qualities, …}\n* Bad, because {negative consequence, e.g., compromising one or more desired qualities, …}\n* … <!-- numbers of consequences can vary -->'}

${sectionMap.confirmation ? '<!-- This is an optional element. Feel free to remove. -->\n### Confirmation\n\n' + sectionMap.confirmation : '<!-- This is an optional element. Feel free to remove. -->\n### Confirmation\n\n{Describe how the implementation of/compliance with the ADR can/will be confirmed. Are the design that was decided for and its implementation in line with the decision made? E.g., a design/code review or a test with a library such as ArchUnit can help validate this. Not that although we classify this element as optional, it is included in many ADRs.}'}

${sectionMap.proscons ? '<!-- This is an optional element. Feel free to remove. -->\n## Pros and Cons of the Options\n\n' + sectionMap.proscons : '<!-- This is an optional element. Feel free to remove. -->\n## Pros and Cons of the Options\n\n### {title of option 1}\n\n<!-- This is an optional element. Feel free to remove. -->\n{example | description | pointer to more information | …}\n\n* Good, because {argument a}\n* Good, because {argument b}\n<!-- use "neutral" if the given argument weights neither for good nor bad -->\n* Neutral, because {argument c}\n* Bad, because {argument d}\n* … <!-- numbers of pros and cons can vary -->\n\n### {title of other option}\n\n{example | description | pointer to more information | …}\n\n* Good, because {argument a}\n* Good, because {argument b}\n* Neutral, because {argument c}\n* Bad, because {argument d}\n* …'}

${sectionMap.moreinfo ? '<!-- This is an optional element. Feel free to remove. -->\n## More Information\n\n' + sectionMap.moreinfo : '<!-- This is an optional element. Feel free to remove. -->\n## More Information\n\n{You might want to provide additional evidence/confidence for the decision outcome here and/or document the team agreement on the decision and/or define when/how this decision the decision should be realized and if/when it should be re-visited. Links to other decisions and resources might appear here as well.}'}
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

In the context of ${sectionMap.context ?? '{functional requirement (story, use case) or architectural component}'},
facing ${sectionMap.facing ?? '{non-functional requirement, for instance a desired quality}'},
we decided for ${sectionMap.decided ?? '{decision outcome (the most important part)}'}
and against ${sectionMap.neglected ?? '{alternatives not chosen (not to be forgotten!)}'}
to achieve ${sectionMap.achieve ?? '{benefits, the full or partial satisfaction of requirement(s)}'},
accepting that ${sectionMap.accepting ?? '{drawbacks and other consequences, for instance impact on other properties/context and effort/cost}'}.

## Rationale

This Y-statement captures the essential elements of our architectural decision in a concise format that emphasizes the "why" behind our choice.

## References

- [Y-Statements: A light template for architectural decision capturing](https://medium.com/olzzio/y-statements-10eb07b5a177)
`
}

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
]

export const getTemplateById = (id: string): AdrTemplate | undefined => {
  return ADR_TEMPLATES.find((template) => template.id === id)
}

export const parseMarkdownToSections = (
  markdown: string,
  template: AdrTemplate,
): AdrTemplateSection[] => {
  const sections = template.sections.map((section) => ({ ...section }))

  // Simple parsing logic - this can be enhanced based on specific needs
  const lines = markdown.split('\n')
  let currentSection: AdrTemplateSection | null = null
  let currentContent: string[] = []

  for (const line of lines) {
    // Check if this line is a section header
    const isHeader = line.startsWith('#')

    if (isHeader) {
      // Save previous section content
      if (currentSection) {
        currentSection.content = currentContent.join('\n').trim()
      }

      // Find matching section
      const headerText = line.replace(/^#+\s*/, '').toLowerCase()
      currentSection =
        sections.find(
          (s) =>
            s.title.toLowerCase().includes(headerText) ||
            headerText.includes(s.title.toLowerCase()),
        ) ?? null

      currentContent = []
    } else if (currentSection) {
      currentContent.push(line)
    }
  }

  // Save final section content
  if (currentSection) {
    currentSection.content = currentContent.join('\n').trim()
  }

  return sections
}
