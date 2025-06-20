import { adrDB } from './dexie-db'
import type { Adr } from './dexie-db'

export async function getAllAdrs(): Promise<Adr[]> {
  return adrDB.adrs.toArray()
}

export async function getAdrsByRepository(repository: string): Promise<Adr[]> {
  console.log('Searching for repository:', repository)
  const allAdrs = await adrDB.adrs.toArray()
  console.log('All ADRs in DB:', allAdrs)
  const res = await adrDB.adrs.where('repository').equals(repository).toArray()
  console.log('RESPONSE FROM DEXIE for repository', repository, ':', res)
  return res
}

export async function updateAdrPath(id: string, path: string) {
  await adrDB.adrs.update(id, { path })
}

export async function deleteAdr(id: string) {
  await adrDB.adrs.delete(id)
}

export async function createAdr(adr: Adr) {
  console.log('Creating ADR:', adr)
  await adrDB.adrs.add(adr)
}

export async function updateAdrHasMatch(id: string, hasMatch: boolean) {
  await adrDB.adrs.update(id, { hasMatch })
}

export async function bulkUpdateAdrHasMatch(
  adrs: { name: string; hasMatch: boolean }[],
) {
  await adrDB.transaction('rw', adrDB.adrs, async () => {
    for (const adr of adrs) {
      await adrDB.adrs.update(adr.name, { hasMatch: adr.hasMatch })
    }
  })
}
