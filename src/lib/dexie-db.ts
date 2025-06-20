import Dexie, { liveQuery } from 'dexie'

export interface Adr {
  name: string
  path: string
  contents: string
  repository: string
  hasMatch: boolean
}

class AdrDatabase extends Dexie {
  adrs: Dexie.Table<Adr, string>

  constructor() {
    super('AdrDatabase')
    this.version(3).stores({
      adrs: 'name, path, repository, hasMatch, [name+repository]',
    })
    this.adrs = this.table('adrs')
  }
}

export const adrDB = new AdrDatabase()
export const adrsLiveQuery = () => liveQuery(() => adrDB.adrs.toArray())
