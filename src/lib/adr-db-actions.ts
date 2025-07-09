import type { Adr } from './dexie-db'
import { adrDB } from './dexie-db'

export async function getAllAdrs(): Promise<Adr[]> {
  return adrDB.adrs.toArray()
}

export async function getAdrsByRepository(repository: string): Promise<Adr[]> {
  // console.log('Searching for repository:', repository)

  // Validate repository parameter to prevent IndexedDB key errors
  if (!repository?.trim()) {
    console.warn(
      'Invalid repository parameter for getAdrsByRepository:',
      repository,
    )
    return []
  }

  const allAdrs = await adrDB.adrs.toArray()
  // console.log('All ADRs in DB:', allAdrs)
  const res = await adrDB.adrs
    .where('repository')
    .equals(repository.trim())
    .toArray()
  // console.log('RESPONSE FROM DEXIE for repository', repository, ':', res)
  return res
}

export async function getAdrByNameAndRepository(
  name: string,
  repository: string,
): Promise<Adr | undefined> {
  // console.log('name, repository', name, repository)

  // Validate parameters to prevent IndexedDB key errors
  if (!name || !repository || !name.trim() || !repository.trim()) {
    console.warn('Invalid parameters for getAdrByNameAndRepository:', {
      name,
      repository,
    })
    return undefined
  }

  return await adrDB.adrs
    .where(['name', 'repository'])
    .equals([name.trim(), repository.trim()])
    .first()
}

export async function updateAdrPath(id: string, path: string) {
  await adrDB.adrs.update(id, { path })
}

export async function deleteAdr(id: string) {
  await adrDB.adrs.delete(id)
}

export async function createAdr(adr: Adr) {
  // console.log('Creating ADR:', adr)
  await adrDB.adrs.add(adr)
  // console.log('ADR created successfully in database')

  // Force a query to make sure the change is committed
  const verifyCount = await adrDB.adrs
    .where('repository')
    .equals(adr.repository)
    .count()
  // console.log(
  //   'ADR count after creation for repository',
  //   adr.repository,
  //   ':',
  //   verifyCount,
  // )
}

export async function updateAdrContentAndPath(
  name: string,
  repository: string,
  contents: string,
  path: string,
) {
  // Validate parameters to prevent IndexedDB key errors
  if (!name || !repository || !name.trim() || !repository.trim()) {
    console.warn('Invalid parameters for updateAdrContentAndPath:', {
      name,
      repository,
    })
    return
  }

  await adrDB.adrs
    .where(['name', 'repository'])
    .equals([name.trim(), repository.trim()])
    .modify({ contents, path })
}

export async function updateAdrContents(
  name: string,
  repository: string,
  contents: string,
) {
  // Validate parameters to prevent IndexedDB key errors
  if (!name || !repository || !name.trim() || !repository.trim()) {
    console.warn('Invalid parameters for updateAdrContents:', {
      name,
      repository,
    })
    return
  }

  await adrDB.adrs
    .where(['name', 'repository'])
    .equals([name.trim(), repository.trim()])
    .modify({ contents })
}

export async function updateAdrTemplate(
  name: string,
  repository: string,
  templateId: string,
) {
  // Validate parameters to prevent IndexedDB key errors
  if (!name || !repository || !name.trim() || !repository.trim()) {
    console.warn('Invalid parameters for updateAdrTemplate:', {
      name,
      repository,
    })
    return
  }

  await adrDB.adrs
    .where(['name', 'repository'])
    .equals([name.trim(), repository.trim()])
    .modify({ templateId })
}

export async function updateAdrName(
  id: string,
  newName: string,
  newPath: string,
) {
  await adrDB.adrs.update(id, { name: newName, path: newPath })
}

export async function updateAdrSha(
  name: string,
  repository: string,
  sha: string,
) {
  // Validate parameters to prevent IndexedDB key errors
  if (!name || !repository || !name.trim() || !repository.trim()) {
    console.warn('Invalid parameters for updateAdrSha:', {
      name,
      repository,
    })
    return
  }

  await adrDB.adrs
    .where(['name', 'repository'])
    .equals([name.trim(), repository.trim()])
    .modify({ sha })
}

// Add liveQuery function for a specific ADR
export function getAdrLiveQuery(name: string, repository: string) {
  if (!name || !repository || !name.trim() || !repository.trim()) {
    return undefined
  }

  return adrDB.adrs
    .where(['name', 'repository'])
    .equals([name.trim(), repository.trim()])
    .first()
}
