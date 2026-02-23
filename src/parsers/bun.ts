import type { PackageMap, ResolvedPackage } from '@/types'

interface BunLockFile {
  lockfileVersion?: number
  workspaces?: Record<string, unknown>
  packages?: Record<string, [string, Record<string, unknown>, Record<string, string>]>
}

export function parseBunLock(raw: string): PackageMap {
  const map: PackageMap = new Map()

  let parsed: BunLockFile
  try {
    parsed = JSON.parse(raw) as BunLockFile
  } catch {
    return map
  }

  if (!parsed.packages) return map

  for (const [pkgKey, entry] of Object.entries(parsed.packages)) {
    if (!Array.isArray(entry) || entry.length < 1) continue

    const nameAtVersion = entry[0] as string
    const deps = (entry[2] ?? {}) as Record<string, string>

    const lastAt = nameAtVersion.lastIndexOf('@')
    const name = lastAt > 0 ? nameAtVersion.slice(0, lastAt) : (pkgKey || nameAtVersion)
    const version = lastAt > 0 ? nameAtVersion.slice(lastAt + 1) : '0.0.0'

    const pkg: ResolvedPackage = {
      name,
      version,
      dependencies: deps,
    }

    map.set(`${name}@${version}`, pkg)
  }

  return map
}
