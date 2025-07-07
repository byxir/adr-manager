export interface Repo {
  id: number
  name: string
  full_name: string
  description: string | null
  language: string | null
  private: boolean
  default_branch: string
  last_updated_at: string
  stars_count: number
  forks_count: number
  owner: {
    id: number
    name: string
    avatar: string | null
  }
}

export interface ApiResponse<T> {
  code: number
  data: T
  message?: string
}

export interface RepoTree {
  sha: string
  url: string
  tree: Array<{
    path: string
    mode: string
    type: string
    sha: string
    url: string
    size?: number
  }>
}

export interface Item {
  name: string
  children?: string[]
  fileExtension?: string
  isFolder: boolean
  isAdr: boolean
}

export interface AdrTemplateSection {
  id: string
  title: string
  placeholder: string
  content: string
  isRequired?: boolean
}

export interface AdrTemplate {
  id: string
  name: string
  description: string
  sections: AdrTemplateSection[]
  generateMarkdown: (sections: AdrTemplateSection[]) => string
}

export interface TemplateFormData {
  selectedTemplate: string | null
  sections: Record<string, string>
}

export interface ExtendedSection extends AdrTemplateSection {
  items?: string[]
}
