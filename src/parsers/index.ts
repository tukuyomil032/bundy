/**
 * パーサーエントリーポイント
 * パッケージマップからツリーを構築する
 */
import type {
  PackageMap,
  PackageNode,
  PackageJson,
  DepKind,
  AnalysisResult,
  LockfileType,
  ResolvedPackage,
} from '@/types'
import { parseNpmLock } from './npm'
import { parseYarnLock } from './yarn'
import { parsePnpmLock } from './pnpm'

// ─── ロックファイル検出・パース ───────────────────────────────────────────────

export function detectLockfileType(filename: string): LockfileType {
  if (filename === 'package-lock.json') return 'npm'
  if (filename === 'yarn.lock') return 'yarn'
  if (filename === 'pnpm-lock.yaml' || filename === 'pnpm-lock.yml') return 'pnpm'
  return 'none'
}

export function parseLockfile(raw: string, type: LockfileType): PackageMap {
  switch (type) {
    case 'npm':
      return parseNpmLock(raw)
    case 'yarn':
      return parseYarnLock(raw)
    case 'pnpm':
      return parsePnpmLock(raw)
    default:
      return new Map()
  }
}

// ─── ツリー構築 ───────────────────────────────────────────────────────────────

const MAX_DEPTH = 20 // 無限再帰防止の絶対上限

/**
 * package.json と PackageMap からツリーを構築し AnalysisResult を返す
 */
export function buildAnalysisResult(
  packageJsonRaw: string,
  lockfileRaw: string | null,
  lockfileType: LockfileType,
  sourceLabel: string
): AnalysisResult {
  const pkgJson: PackageJson = JSON.parse(packageJsonRaw)
  const map: PackageMap = lockfileRaw && lockfileType !== 'none' ? parseLockfile(lockfileRaw, lockfileType) : new Map()

  const circularDeps: string[] = []
  const visitedNames = new Set<string>() // ユニーク名の収集

  // root ノードを構築
  const root: PackageNode = {
    id: 'root',
    name: pkgJson.name ?? 'root',
    version: pkgJson.version ?? '0.0.0',
    kind: 'dependency',
    children: [],
    isCircular: false,
    path: [],
  }

  // 4 種の依存を順番に追加
  const depEntries: { deps: Record<string, string> | undefined; kind: DepKind }[] = [
    { deps: pkgJson.dependencies, kind: 'dependency' },
    { deps: pkgJson.devDependencies, kind: 'devDependency' },
    { deps: pkgJson.peerDependencies, kind: 'peerDependency' },
    { deps: pkgJson.optionalDependencies, kind: 'optionalDependency' },
  ]

  for (const { deps, kind } of depEntries) {
    if (!deps) continue
    for (const [name, spec] of Object.entries(deps)) {
      const resolved = resolvePackage(name, spec, map)
      const child = buildNode(
        name,
        resolved?.version ?? spec,
        kind,
        resolved,
        map,
        [root.name],
        circularDeps,
        visitedNames,
        0
      )
      root.children.push(child)
    }
  }

  // 重複バージョン検出
  const duplicates: Record<string, string[]> = {}
  const nameVersionMap: Record<string, Set<string>> = {}
  for (const [key, pkg] of map.entries()) {
    void key
    if (!nameVersionMap[pkg.name]) nameVersionMap[pkg.name] = new Set()
    nameVersionMap[pkg.name]!.add(pkg.version)
  }
  for (const [name, versions] of Object.entries(nameVersionMap)) {
    if (versions.size > 1) {
      duplicates[name] = [...versions]
    }
  }

  return {
    root,
    lockfileType,
    totalPackages: visitedNames.size,
    circularDeps: [...new Set(circularDeps)],
    duplicates,
    sourceLabel,
  }
}

// ─── ノード再帰構築 ───────────────────────────────────────────────────────────

function buildNode(
  name: string,
  version: string,
  kind: DepKind,
  resolved: ResolvedPackage | undefined,
  map: PackageMap,
  ancestorPath: string[],
  circularDeps: string[],
  visitedNames: Set<string>,
  depth: number
): PackageNode {
  visitedNames.add(name)

  const nodeId = `${name}@${version}`
  const isCircular = ancestorPath.includes(name) // 先祖にすでに存在するなら循環
  const newPath = [...ancestorPath, name]

  if (isCircular) {
    circularDeps.push(`${ancestorPath[ancestorPath.length - 1]} → ${name}`)
    return {
      id: `${nodeId}-circular-${depth}`,
      name,
      version,
      kind,
      children: [],
      isCircular: true,
      path: newPath,
    }
  }

  const children: PackageNode[] = []

  if (resolved && depth < MAX_DEPTH) {
    for (const [depName, depSpec] of Object.entries(resolved.dependencies ?? {})) {
      const depResolved = resolvePackage(depName, depSpec, map)
      children.push(
        buildNode(
          depName,
          depResolved?.version ?? depSpec,
          'dependency',
          depResolved,
          map,
          newPath,
          circularDeps,
          visitedNames,
          depth + 1
        )
      )
    }
    if (resolved.optionalDependencies) {
      for (const [depName, depSpec] of Object.entries(resolved.optionalDependencies)) {
        const depResolved = resolvePackage(depName, depSpec, map)
        children.push(
          buildNode(
            depName,
            depResolved?.version ?? depSpec,
            'optionalDependency',
            depResolved,
            map,
            newPath,
            circularDeps,
            visitedNames,
            depth + 1
          )
        )
      }
    }
  }

  return {
    id: `${nodeId}-${depth}-${ancestorPath.length}`,
    name,
    version,
    kind,
    children,
    isCircular: false,
    path: newPath,
  }
}

// ─── バージョン解決 ───────────────────────────────────────────────────────────

/**
 * パッケージマップから最も近いバージョンを探す
 * semver の完全解決はブラウザでは重いため、前方一致で近似する
 */
function resolvePackage(name: string, spec: string, map: PackageMap): ResolvedPackage | undefined {
  // まず spec がそのままバージョンのケース (pnpm 等)
  const exactKey = `${name}@${spec}`
  if (map.has(exactKey)) return map.get(exactKey)

  // prefix (^/~/>=等) を除去してマッチ
  const cleanSpec = spec.replace(/^[^0-9]/, '').split(/[-+]/)[0]
  const cleanKey = `${name}@${cleanSpec}`
  if (map.has(cleanKey)) return map.get(cleanKey)

  // 名前だけで前方一致検索 — 最初にヒットしたものを返す
  const prefix = `${name}@`
  for (const [key, pkg] of map.entries()) {
    if (key.startsWith(prefix) && pkg.name === name) return pkg
  }

  return undefined
}
