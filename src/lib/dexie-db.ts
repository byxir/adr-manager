import Dexie, { liveQuery } from 'dexie'

export interface Adr {
  id: string
  name: string
  path: string
  contents: string
  repository: string
  branch: string
  owner: string
  hasMatch: boolean
  createdAt: Date
  templateId?: string // Optional for backward compatibility
}

class AdrDatabase extends Dexie {
  adrs: Dexie.Table<Adr, string>

  constructor() {
    super('AdrDatabase')
    this.version(5).stores({
      adrs: '&id, name, path, repository, branch, owner, hasMatch, createdAt, templateId, [name+repository]',
    })
    this.adrs = this.table('adrs')
  }
}

export const adrDB = new AdrDatabase()
export const adrsLiveQuery = () => liveQuery(() => adrDB.adrs.toArray())
