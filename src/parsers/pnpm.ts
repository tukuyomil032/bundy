/**
 * pnpm parser — pnpm-lock.yaml (v5 / v6 / v9)
 *
 * v5/v6: packages キーに "/@scope/name/version:" や "/name/version:" 形式
 * v9:    snapshots と packages キーが分離
 */
import jsYaml from 'js-yaml'
import type { PackageMap, ResolvedPackage } from '@/types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyObj = Record<string, any>

export function parsePnpmLock(raw: string): PackageMap {
  const map: PackageMap = new Map()
  let parsed: AnyObj
  try {
    parsed = jsYaml.load(raw) as AnyObj
  } catch {
    return map
  }

  const lockfileVersion: string = String(parsed.lockfileVersion ?? '5')
  const versionParts = lockfileVersion.split('.')
  const majorVersion = parseInt(versionParts[0] ?? '5', 10)

  if (majorVersion >= 9) {
    parsePnpmV9(parsed, map)
  } else {
    parsePnpmV5V6(parsed, map)
  }

  return map
}

// ─── v5 / v6 ─────────────────────────────────────────────────────────────────

function parsePnpmV5V6(parsed: AnyObj, map: PackageMap): void {
  const packages = parsed.packages as AnyObj | undefined
  if (!packages) return

  for (const [pkgKey, info] of Object.entries(packages)) {
    const infoObj = info as AnyObj
    const { name, version } = parsePnpmPackageKey(pkgKey, infoObj)
    if (!name || !version) continue

    const mapKey = `${name}@${version}`
    if (!map.has(mapKey)) {
      const pkg: ResolvedPackage = {
        name,
        version,
        dependencies: flattenDeps(infoObj.dependencies),
        optionalDependencies: flattenDeps(infoObj.optionalDependencies),
        peerDependencies: flattenDeps(infoObj.peerDependencies),
      }
      map.set(mapKey, pkg)
    }
  }
}

/**
 * pnpm v5: "/@scope/name/version_peerSuffix:" → { name: "@scope/name", version }
 * pnpm v6: "/name@version(peer...):"          → { name, version }
 */
function parsePnpmPackageKey(key: string, info: AnyObj): { name: string; version: string } {
  // info に name/version フィールドがあれば最優先
  if (info.name && info.version) {
    return { name: info.name, version: info.version }
  }

  // key の先頭スラッシュを除去
  const k = key.startsWith('/') ? key.slice(1) : key

  // v6 形式: "name@version(peer...)" — 最初の @ で分割
  if (k.includes('@')) {
    const atIdx = k.startsWith('@') ? k.indexOf('@', 1) : k.indexOf('@')
    if (atIdx > 0) {
      const name = k.slice(0, atIdx)
      // version は @ 以降、"(" より前
      let ver = k.slice(atIdx + 1)
      const parenIdx = ver.indexOf('(')
      if (parenIdx >= 0) ver = ver.slice(0, parenIdx)
      return { name, version: ver }
    }
  }

  // v5 形式: "scope/name/version" もしくは "name/version"
  const parts = k.split('/')
  if (parts.length >= 2) {
    const lastPart = parts[parts.length - 1] ?? ''
    const version = lastPart.split('_')[0] ?? ''
    let name: string
    if (k.startsWith('@')) {
      name = `@${parts[1] ?? ''}/${parts[2] ?? ''}`
    } else {
      name = parts[0] ?? ''
    }
    return { name, version }
  }

  return { name: '', version: '' }
}

// ─── v9 ──────────────────────────────────────────────────────────────────────

function parsePnpmV9(parsed: AnyObj, map: PackageMap): void {
  // packages: パッケージのメタ情報 (peerDependencies 等)
  // snapshots: 実際の解決済みの dependencies が入る
  const snapshots = (parsed.snapshots ?? parsed.packages) as AnyObj | undefined
  if (!snapshots) return

  for (const [snapshotKey, info] of Object.entries(snapshots)) {
    const infoObj = info as AnyObj
    // v9 の key: "name@version(peer_sig...)"
    const { name, version } = parseV9Key(snapshotKey)
    if (!name || !version) continue

    const mapKey = `${name}@${version}`
    if (!map.has(mapKey)) {
      const pkg: ResolvedPackage = {
        name,
        version,
        dependencies: flattenDeps(infoObj.dependencies),
        optionalDependencies: flattenDeps(infoObj.optionalDependencies),
      }
      map.set(mapKey, pkg)
    }
  }
}

function parseV9Key(key: string): { name: string; version: string } {
  const k = key.startsWith('/') ? key.slice(1) : key

  // "@scope/name@version(peer...)"
  if (k.startsWith('@')) {
    const secondAt = k.indexOf('@', 1)
    if (secondAt > 0) {
      const name = k.slice(0, secondAt)
      let ver = k.slice(secondAt + 1)
      const parenIdx = ver.indexOf('(')
      if (parenIdx >= 0) ver = ver.slice(0, parenIdx)
      return { name, version: ver }
    }
    return { name: k, version: '' }
  }

  // "name@version(peer...)"
  const atIdx = k.indexOf('@')
  if (atIdx > 0) {
    const name = k.slice(0, atIdx)
    let ver = k.slice(atIdx + 1)
    const parenIdx = ver.indexOf('(')
    if (parenIdx >= 0) ver = ver.slice(0, parenIdx)
    return { name, version: ver }
  }

  return { name: k, version: '' }
}

// ─── 共通ヘルパー ─────────────────────────────────────────────────────────────

function flattenDeps(raw: AnyObj | undefined): Record<string, string> {
  if (!raw) return {}
  const result: Record<string, string> = {}
  for (const [k, v] of Object.entries(raw)) {
    result[k] = typeof v === 'string' ? v : String(v)
  }
  return result
}
