import type { Adr } from './dexie-db'
import { adrDB } from './dexie-db'

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

export async function getAdrByNameAndRepository(
  name: string,
  repository: string,
): Promise<Adr | undefined> {
  return await adrDB.adrs
    .where(['name', 'repository'])
    .equals([name, repository])
    .first()
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
  console.log('ADR created successfully in database')

  // Force a query to make sure the change is committed
  const verifyCount = await adrDB.adrs
    .where('repository')
    .equals(adr.repository)
    .count()
  console.log(
    'ADR count after creation for repository',
    adr.repository,
    ':',
    verifyCount,
  )
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

export async function updateAdrContents(
  name: string,
  repository: string,
  contents: string,
) {
  await adrDB.adrs
    .where(['name', 'repository'])
    .equals([name, repository])
    .modify({ contents })
}

export async function updateAdrTemplate(
  name: string,
  repository: string,
  templateId: string,
) {
  await adrDB.adrs
    .where(['name', 'repository'])
    .equals([name, repository])
    .modify({ templateId })
}

export async function updateAdrName(
  id: string,
  newName: string,
  newPath: string,
) {
  await adrDB.adrs.update(id, { name: newName, path: newPath })
}

export async function updateAdrStatus(
  name: string,
  repository: string,
  status: 'todo' | 'in-progress' | 'done' | 'backlog',
) {
  await adrDB.adrs
    .where(['name', 'repository'])
    .equals([name, repository])
    .modify({ status })
}

export async function updateAdrTags(
  name: string,
  repository: string,
  tags: string[],
) {
  await adrDB.adrs
    .where(['name', 'repository'])
    .equals([name, repository])
    .modify({ tags })
}
