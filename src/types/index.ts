// DepKind: package.json の依存種別
export type DepKind = 'dependency' | 'devDependency' | 'peerDependency' | 'optionalDependency'

// ツリーの各ノード
export interface PackageNode {
  id: string // 一意識別子: "{name}@{version}@{path}" などでユニークに
  name: string
  version: string
  kind: DepKind
  children: PackageNode[]
  isCircular: boolean // 循環依存の折り返し点
  path: string[] // ルートからこのノードまでの名前リスト（循環検知用）
}

// 解析結果全体
export interface AnalysisResult {
  root: PackageNode
  lockfileType: LockfileType
  totalPackages: number // ユニークパッケージ数
  circularDeps: string[] // 循環依存ペアの文字列表現
  duplicates: Record<string, string[]> // name -> [version, version, ...]
  sourceLabel: string // "Local upload" or "github.com/owner/repo"
}

// ロックファイルの種類
export type LockfileType = 'npm' | 'yarn' | 'pnpm' | 'none'

// アップロードされたファイルセット
export interface UploadedFiles {
  packageJson: string
  lockfile: string | null
  lockfileType: LockfileType
}

// フラットな解決済みパッケージマップ (パーサー内部で使用)
export interface ResolvedPackage {
  name: string
  version: string
  dependencies: Record<string, string> // name -> version spec or resolved version
  optionalDependencies?: Record<string, string>
  peerDependencies?: Record<string, string>
}

// パーサーが返すフラットマップの型
// key: "name@resolvedVersion"
export type PackageMap = Map<string, ResolvedPackage>

// package.json の型 (最小限)
export interface PackageJson {
  name?: string
  version?: string
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
  peerDependencies?: Record<string, string>
  optionalDependencies?: Record<string, string>
}

// フィルタリング設定
export interface FilterOptions {
  showDeps: boolean
  showDevDeps: boolean
  showPeerDeps: boolean
  showOptionalDeps: boolean
  maxDepth: number
}
