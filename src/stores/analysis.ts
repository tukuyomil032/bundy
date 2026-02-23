import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { AnalysisResult, FilterOptions, PackageNode } from '@/types'
import { buildAnalysisResult } from '@/parsers'
import { fetchFromGitHub, parseGitHubInput } from '@/services/github'
import { detectLockfileType } from '@/parsers'

export const useAnalysisStore = defineStore('analysis', () => {
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

  const hasResult = computed(() => result.value !== null)
  const filteredRoot = computed(() => {
    if (!result.value) {
        return null
    }
    return filterNode(result.value.root, filterOptions.value, 0)
  })

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

      result.value = buildAnalysisResult(packageJsonRaw, lockfileRaw, lockfileType, 'Local Upload')
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'An error occurred during analysis'
    } finally {
      loading.value = false
    }
  }

  async function analyzeGitHub(inputUrl: string): Promise<void> {
    loading.value = true
    error.value = null
    result.value = null
    selectedNode.value = null

    try {
      const parsed = parseGitHubInput(inputUrl)
      if (!parsed) {
        throw new Error(
          'Invalid GitHub URL. Enter in "owner/repo" or "https://github.com/owner/repo" format.'
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
      error.value = e instanceof Error ? e.message : 'An error occurred while fetching data'
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

  function readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = () => reject(new Error(`Failed to read file: ${file.name}`))
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

function filterNode(node: PackageNode, opts: FilterOptions, depth: number): PackageNode | null {

  if (depth > opts.maxDepth && depth > 0) {
    return null
  }

  if (depth > 0) {
    if (node.kind === 'dependency' && !opts.showDeps) {
        return null
    }
    if (node.kind === 'devDependency' && !opts.showDevDeps) {
        return null
    }
    if (node.kind === 'peerDependency' && !opts.showPeerDeps) {
        return null
    }
    if (node.kind === 'optionalDependency' && !opts.showOptionalDeps) {
        return null
    }
  }

  const filteredChildren: PackageNode[] = []
  for (const child of node.children) {
    const filtered = filterNode(child, opts, depth + 1)
    if (filtered !== null) {
        filteredChildren.push(filtered)
    }
  }

  return { ...node, children: filteredChildren }
}
