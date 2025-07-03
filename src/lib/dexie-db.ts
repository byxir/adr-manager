import Dexie, { liveQuery } from 'dexie'

export interface Adr {
  id: string
  name: string
  path: string
  contents: string
  repository: string
  branch: string
  owner: string
  createdAt: Date
  templateId?: string // Optional for backward compatibility
  status?: 'todo' | 'in-progress' | 'done' | 'backlog' // ADR status
  tags?: string[] // ADR tags
  sha?: string
  lastFetched?: Date | null // Timestamp for when the file was last fetched from remote
}

class AdrDatabase extends Dexie {
  adrs: Dexie.Table<Adr, string>

  constructor() {
    super('AdrDatabase')
    this.version(8).stores({
      adrs: '&id, name, path, repository, branch, owner, createdAt, templateId, status, tags, sha, lastFetched, [name+repository]',
    })
    this.adrs = this.table('adrs')
  }
}

export const adrDB = new AdrDatabase()
export const adrsLiveQuery = () => liveQuery(() => adrDB.adrs.toArray())
