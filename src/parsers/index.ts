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
import { parseBunLock } from './bun'

export function detectLockfileType(filename: string): LockfileType {
  if (filename === 'package-lock.json') {
    return 'npm'
  }
  if (filename === 'yarn.lock') {
  return 'yarn'
  }
  if (filename === 'pnpm-lock.yaml' || filename === 'pnpm-lock.yml') {
    return 'pnpm'
  }
  if (filename === 'bun.lock') {
    return 'bun'
  }
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
    case 'bun':
      return parseBunLock(raw)
    default:
      return new Map()
  }
}

const MAX_DEPTH = 20

export function buildAnalysisResult(
  packageJsonRaw: string,
  lockfileRaw: string | null,
  lockfileType: LockfileType,
  sourceLabel: string
): AnalysisResult {
  const pkgJson: PackageJson = JSON.parse(packageJsonRaw)
  const map: PackageMap = lockfileRaw && lockfileType !== 'none' ? parseLockfile(lockfileRaw, lockfileType) : new Map()

  const circularDeps: string[] = []
  const visitedNames = new Set<string>()

  const root: PackageNode = {
    id: 'root',
    name: pkgJson.name ?? 'root',
    version: pkgJson.version ?? '0.0.0',
    kind: 'dependency',
    children: [],
    isCircular: false,
    path: [],
  }

  const depEntries: { deps: Record<string, string> | undefined; kind: DepKind }[] = [
    { deps: pkgJson.dependencies, kind: 'dependency' },
    { deps: pkgJson.devDependencies, kind: 'devDependency' },
    { deps: pkgJson.peerDependencies, kind: 'peerDependency' },
    { deps: pkgJson.optionalDependencies, kind: 'optionalDependency' },
  ]

  for (const { deps, kind } of depEntries) {
    if (!deps) {
        continue
    }
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

  const duplicates: Record<string, string[]> = {}
  const nameVersionMap: Record<string, Set<string>> = {}
  for (const [key, pkg] of map.entries()) {
    void key
    if (!nameVersionMap[pkg.name]) {
        nameVersionMap[pkg.name] = new Set()
    }
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
  const isCircular = ancestorPath.includes(name)
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

function resolvePackage(name: string, spec: string, map: PackageMap): ResolvedPackage | undefined {
  const exactKey = `${name}@${spec}`
  if (map.has(exactKey)) {
  return map.get(exactKey)
  }

  const cleanSpec = spec.replace(/^[^0-9]/, '').split(/[-+]/)[0]
  const cleanKey = `${name}@${cleanSpec}`
  if (map.has(cleanKey)) {
    return map.get(cleanKey)
  }

  const prefix = `${name}@`
  for (const [key, pkg] of map.entries()) {
    if (key.startsWith(prefix) && pkg.name === name) {
        return pkg
    }
  }

  return undefined
}
