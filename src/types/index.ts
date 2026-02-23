export type DepKind = 'dependency' | 'devDependency' | 'peerDependency' | 'optionalDependency'

export interface PackageNode {
  id: string
  name: string
  version: string
  kind: DepKind
  children: PackageNode[]
  isCircular: boolean
  path: string[]
}

export interface AnalysisResult {
  root: PackageNode
  lockfileType: LockfileType
  totalPackages: number
  circularDeps: string[]
  duplicates: Record<string, string[]>
  sourceLabel: string
}

export type LockfileType = 'npm' | 'yarn' | 'pnpm' | 'bun' | 'none'

export interface UploadedFiles {
  packageJson: string
  lockfile: string | null
  lockfileType: LockfileType
}

export interface ResolvedPackage {
  name: string
  version: string
  dependencies: Record<string, string>
  optionalDependencies?: Record<string, string>
  peerDependencies?: Record<string, string>
}

export type PackageMap = Map<string, ResolvedPackage>

export interface PackageJson {
  name?: string
  version?: string
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
  peerDependencies?: Record<string, string>
  optionalDependencies?: Record<string, string>
}

export interface FilterOptions {
  showDeps: boolean
  showDevDeps: boolean
  showPeerDeps: boolean
  showOptionalDeps: boolean
  maxDepth: number
}
