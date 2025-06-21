import Dexie, { liveQuery } from 'dexie'

export interface Adr {
  id: string
  name: string
  path: string
  contents: string
  repository: string
  hasMatch: boolean
  createdAt: Date
}

class AdrDatabase extends Dexie {
  adrs: Dexie.Table<Adr, string>

  constructor() {
    super('AdrDatabase')
    this.version(4).stores({
      adrs: '&id, name, path, repository, hasMatch, createdAt, [name+repository]',
    })
    this.adrs = this.table('adrs')
  }
}

export const adrDB = new AdrDatabase()
export const adrsLiveQuery = () => liveQuery(() => adrDB.adrs.toArray())
