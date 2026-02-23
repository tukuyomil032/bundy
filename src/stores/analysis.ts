/**
 * Pinia ストア — 解析結果と UI 状態を管理する
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { AnalysisResult, FilterOptions, PackageNode } from '@/types'
import { buildAnalysisResult } from '@/parsers'
import { fetchFromGitHub, parseGitHubInput } from '@/services/github'
import { detectLockfileType } from '@/parsers'

export const useAnalysisStore = defineStore('analysis', () => {
  // ─── State ──────────────────────────────────────────────────────────────────
  const result = ref<AnalysisResult | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const selectedNode = ref<PackageNode | null>(null)
  const searchQuery = ref('')

  const filterOptions = ref<FilterOptions>({
    showDeps: true,
    showDevDeps: true,
    showPeerDeps: true,
    showOptionalDeps: true,
    maxDepth: 10,
  })

  // ─── Computed ────────────────────────────────────────────────────────────────
  const hasResult = computed(() => result.value !== null)
  const filteredRoot = computed(() => {
    if (!result.value) return null
    return filterNode(result.value.root, filterOptions.value, 0)
  })

  // ─── Actions ─────────────────────────────────────────────────────────────────

  /** ローカルファイルから解析を実行する */
  async function analyzeLocal(packageJsonFile: File, lockfileFile: File | null): Promise<void> {
    loading.value = true
    error.value = null
    result.value = null
    selectedNode.value = null

    try {
      const packageJsonRaw = await readFileAsText(packageJsonFile)
      let lockfileRaw: string | null = null
      const lockfileType = lockfileFile ? detectLockfileType(lockfileFile.name) : 'none'

      if (lockfileFile) {
        lockfileRaw = await readFileAsText(lockfileFile)
      }

      result.value = buildAnalysisResult(packageJsonRaw, lockfileRaw, lockfileType, 'ローカルアップロード')
    } catch (e) {
      error.value = e instanceof Error ? e.message : '解析中にエラーが発生しました'
    } finally {
      loading.value = false
    }
  }

  /** GitHub URL から解析を実行する */
  async function analyzeGitHub(inputUrl: string): Promise<void> {
    loading.value = true
    error.value = null
    result.value = null
    selectedNode.value = null

    try {
      const parsed = parseGitHubInput(inputUrl)
      if (!parsed) {
        throw new Error(
          '無効な GitHub URL です。"owner/repo" または "https://github.com/owner/repo" 形式で入力してください。'
        )
      }

      const { packageJson, lockfile, lockfileType, ref } = await fetchFromGitHub(parsed.owner, parsed.repo, parsed.ref)

      result.value = buildAnalysisResult(
        packageJson,
        lockfile,
        lockfileType,
        `github.com/${parsed.owner}/${parsed.repo}@${ref}`
      )
    } catch (e) {
      error.value = e instanceof Error ? e.message : '取得中にエラーが発生しました'
    } finally {
      loading.value = false
    }
  }

  function selectNode(node: PackageNode | null): void {
    selectedNode.value = node
  }

  function resetResult(): void {
    result.value = null
    error.value = null
    selectedNode.value = null
    searchQuery.value = ''
  }

  function updateFilter(opts: Partial<FilterOptions>): void {
    filterOptions.value = { ...filterOptions.value, ...opts }
  }

  // ─── ヘルパー ──────────────────────────────────────────────────────────────

  function readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = () => reject(new Error(`ファイル読み込みエラー: ${file.name}`))
      reader.readAsText(file)
    })
  }

  return {
    result,
    loading,
    error,
    selectedNode,
    searchQuery,
    filterOptions,
    hasResult,
    filteredRoot,
    analyzeLocal,
    analyzeGitHub,
    selectNode,
    resetResult,
    updateFilter,
  }
})

// ─── フィルタリング ────────────────────────────────────────────────────────────

function filterNode(node: PackageNode, opts: FilterOptions, depth: number): PackageNode | null {
  // 深さ超過はルートのみ無効にしない
  if (depth > opts.maxDepth && depth > 0) return null

  // 種別フィルター
  if (depth > 0) {
    if (node.kind === 'dependency' && !opts.showDeps) return null
    if (node.kind === 'devDependency' && !opts.showDevDeps) return null
    if (node.kind === 'peerDependency' && !opts.showPeerDeps) return null
    if (node.kind === 'optionalDependency' && !opts.showOptionalDeps) return null
  }

  const filteredChildren: PackageNode[] = []
  for (const child of node.children) {
    const filtered = filterNode(child, opts, depth + 1)
    if (filtered !== null) filteredChildren.push(filtered)
  }

  return { ...node, children: filteredChildren }
}
