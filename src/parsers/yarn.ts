/**
 * yarn parser — yarn.lock (v1 Classic / v2+ Berry)
 *
 * v1: 独自フォーマット (非YAML) — 手動パース
 * v2+: YAML フォーマット — js-yaml でパース
 */
import jsYaml from 'js-yaml'
import type { PackageMap, ResolvedPackage } from '@/types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyObj = Record<string, any>

/** yarn.lock を解析して PackageMap を返す */
export function parseYarnLock(raw: string): PackageMap {
  // __metadata キーの存在で v2+ (Berry) を判定
  if (raw.includes('__metadata:')) {
    return parseYarnBerry(raw)
  }
  return parseYarnClassic(raw)
}

// ─── Yarn Classic (v1) ────────────────────────────────────────────────────────

function parseYarnClassic(raw: string): PackageMap {
  const map: PackageMap = new Map()
  // コメント行を除去してブロック分割
  const lines = raw.split('\n').filter((l) => !l.startsWith('#'))
  const blocks: string[][] = []
  let current: string[] = []

  for (const line of lines) {
    if (line.trim() === '') {
      if (current.length > 0) {
        blocks.push(current)
        current = []
      }
    } else {
      current.push(line)
    }
  }
  if (current.length > 0) blocks.push(current)

  for (const block of blocks) {
    parseYarnClassicBlock(block, map)
  }

  return map
}

function parseYarnClassicBlock(lines: string[], map: PackageMap): void {
  // 最初の行がキー行 (末尾 ":")
  let keyLine = lines[0]
  if (!keyLine || !keyLine.trim().endsWith(':')) return
  keyLine = keyLine.trim().replace(/:$/, '')

  // キーは "name@spec" または "name@spec, name@spec2" のカンマ区切り
  const keys = keyLine.split(/\s*,\s*/).map((k) => k.trim().replace(/^"|"$/g, ''))

  // フィールドをパース
  let version = ''
  const deps: Record<string, string> = {}
  const optionalDeps: Record<string, string> = {}
  let inDeps = false
  let inOptional = false

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]
    if (!line) continue
    const indentMatch = line.match(/^(\s+)/)
    const indent = indentMatch ? indentMatch[1]!.length : 0
    const trimmed = line.trim()

    if (indent === 2) {
      inDeps = false
      inOptional = false
      const m = trimmed.match(/^version\s+"?([^"]+)"?$/)
      if (m?.[1]) version = m[1]
      if (trimmed === 'dependencies:') inDeps = true
      if (trimmed === 'optionalDependencies:') inOptional = true
    } else if (indent === 4) {
      // "  name \"spec\""
      const m = trimmed.match(/^"?([^"]+)"?\s+"?([^"]*)"?$/)
      if (m?.[1] !== undefined && m?.[2] !== undefined) {
        if (inDeps) deps[m[1]] = m[2]
        else if (inOptional) optionalDeps[m[1]] = m[2]
      }
    }
  }

  if (!version) return

  for (const key of keys) {
    // key = "name@^1.0.0"  → name = last part before last @
    const name = extractNameFromYarnKey(key)
    if (!name) continue
    const mapKey = `${name}@${version}`
    if (!map.has(mapKey)) {
      const pkg: ResolvedPackage = {
        name,
        version,
        dependencies: deps,
        optionalDependencies: optionalDeps,
      }
      map.set(mapKey, pkg)
    }
  }
}

/** "react@^18.0.0" → "react" ; "@scope/pkg@^1.0.0" → "@scope/pkg" */
function extractNameFromYarnKey(key: string): string {
  key = key.trim().replace(/^"|"$/g, '')
  if (key.startsWith('@')) {
    // scoped: @scope/pkg@spec
    const idx = key.indexOf('@', 1)
    return idx > 0 ? key.slice(0, idx) : key
  }
  const idx = key.lastIndexOf('@')
  return idx > 0 ? key.slice(0, idx) : key
}

// ─── Yarn Berry (v2+) ────────────────────────────────────────────────────────

function parseYarnBerry(raw: string): PackageMap {
  const map: PackageMap = new Map()

  let parsed: AnyObj
  try {
    parsed = jsYaml.load(raw) as AnyObj
  } catch {
    return map
  }

  for (const [block, info] of Object.entries(parsed)) {
    if (block === '__metadata') continue
    const infoObj = info as AnyObj
    const version: string = infoObj.version ?? ''
    if (!version) continue

    // ブロックキーはカンマ区切り "name@spec, name@spec2"
    const keys = block.split(/\s*,\s*/)
    const name = extractNameFromYarnKey(keys[0] ?? '')
    if (!name) continue

    const mapKey = `${name}@${version}`
    if (!map.has(mapKey)) {
      const pkg: ResolvedPackage = {
        name,
        version,
        dependencies: flattenBerryDeps(infoObj.dependencies),
        peerDependencies: flattenBerryDeps(infoObj.peerDependencies),
        optionalDependencies: flattenBerryDeps(infoObj.optionalDependencies),
      }
      map.set(mapKey, pkg)
    }
  }
  return map
}

function flattenBerryDeps(raw: AnyObj | undefined): Record<string, string> {
  if (!raw) return {}
  const result: Record<string, string> = {}
  for (const [k, v] of Object.entries(raw)) {
    result[k] = typeof v === 'string' ? v : String(v)
  }
  return result
}
