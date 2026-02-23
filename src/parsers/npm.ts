import type { PackageMap, ResolvedPackage } from '@/types'

type AnyObj = Record<string, any>

export function parseNpmLock(raw: string): PackageMap {
  const lock: AnyObj = JSON.parse(raw)
  const version: number = lock.lockfileVersion ?? 1
  const map: PackageMap = new Map()

  if (version >= 2 && lock.packages) {
    for (const [pkgPath, info] of Object.entries(lock.packages as AnyObj)) {
      if (pkgPath === '') {
        continue
       }
      const name = (info as AnyObj).name ?? pkgPath.split('node_modules/').pop()!
      const version = (info as AnyObj).version ?? '0.0.0'
      const key = `${name}@${version}`
      if (!map.has(key)) {
        const pkg: ResolvedPackage = {
          name,
          version,
          dependencies: normalizeVersionMap((info as AnyObj).dependencies),
          optionalDependencies: normalizeVersionMap((info as AnyObj).optionalDependencies),
          peerDependencies: normalizeVersionMap((info as AnyObj).peerDependencies),
        }
        map.set(key, pkg)
      }
    }
  } else if (lock.dependencies) {
    extractV1Deps(lock.dependencies as AnyObj, map)
  }

  return map
}

function extractV1Deps(deps: AnyObj, map: PackageMap): void {
  for (const [name, info] of Object.entries(deps)) {
    const version: string = (info as AnyObj).version ?? '0.0.0'
    const key = `${name}@${version}`
    if (!map.has(key)) {
      const pkg: ResolvedPackage = {
        name,
        version,
        dependencies: normalizeVersionMap((info as AnyObj).requires),
      }
      map.set(key, pkg)
    }
    if ((info as AnyObj).dependencies) {
      extractV1Deps((info as AnyObj).dependencies as AnyObj, map)
    }
  }
}

function normalizeVersionMap(raw: AnyObj | undefined): Record<string, string> {
  if (!raw) {
    return {}
  }
  const result: Record<string, string> = {}
  for (const [k, v] of Object.entries(raw)) {
    result[k] = typeof v === 'string' ? v : ((v as AnyObj).version ?? '')
  }
  return result
}
