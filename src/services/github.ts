/**
 * GitHub 公開リポジトリから package.json とロックファイルを取得するサービス
 * raw.githubusercontent.com を使用 (CORS 不要)
 */
import { detectLockfileType } from '@/parsers'
import type { LockfileType } from '@/types'

const RAW_BASE = 'https://raw.githubusercontent.com'
const LOCKFILE_CANDIDATES = ['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', 'pnpm-lock.yml']

export interface GitHubFetchResult {
  packageJson: string
  lockfile: string | null
  lockfileType: LockfileType
  ref: string // 実際に使用したブランチ/タグ/SHA
}

/** GitHub URL または "owner/repo" 形式を正規化する */
export function parseGitHubInput(input: string): {
  owner: string
  repo: string
  ref?: string
} | null {
  input = input.trim().replace(/\/+$/, '')

  // https://github.com/owner/repo[@/]ref 形式
  const urlMatch = input.match(/^https?:\/\/github\.com\/([^/]+)\/([^/]+?)(?:\/tree\/(.+))?(?:\.git)?$/)
  if (urlMatch) {
    return { owner: urlMatch[1] ?? '', repo: urlMatch[2] ?? '', ref: urlMatch[3] }
  }

  // owner/repo[@ref] 形式
  const shortMatch = input.match(/^([^/]+)\/([^/@]+)(?:@(.+))?$/)
  if (shortMatch) {
    return { owner: shortMatch[1] ?? '', repo: shortMatch[2] ?? '', ref: shortMatch[3] }
  }

  return null
}

/** リポジトリのデフォルトブランチを GitHub API で取得する */
async function getDefaultBranch(owner: string, repo: string): Promise<string> {
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`)
  if (!res.ok) {
    if (res.status === 404) throw new Error(`リポジトリが見つかりません: ${owner}/${repo}`)
    if (res.status === 403) throw new Error('GitHub API のレート制限に達しました。しばらく後に再試行してください。')
    throw new Error(`GitHub API エラー: ${res.status}`)
  }
  const data = await res.json()
  return data.default_branch ?? 'main'
}

/** raw.githubusercontent.com からファイルを取得する */
async function fetchRaw(owner: string, repo: string, ref: string, path: string): Promise<string | null> {
  const url = `${RAW_BASE}/${owner}/${repo}/${ref}/${path}`
  const res = await fetch(url)
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`ファイル取得失敗 (${path}): HTTP ${res.status}`)
  return res.text()
}

/** GitHub リポジトリから package.json とロックファイルを取得する */
export async function fetchFromGitHub(owner: string, repo: string, ref?: string): Promise<GitHubFetchResult> {
  const resolvedRef = ref ?? (await getDefaultBranch(owner, repo))

  // package.json を取得
  const packageJson = await fetchRaw(owner, repo, resolvedRef, 'package.json')
  if (!packageJson) {
    throw new Error(`package.json が見つかりません (${owner}/${repo}@${resolvedRef})`)
  }

  // ロックファイルを順番に試みる
  let lockfile: string | null = null
  let lockfileType: LockfileType = 'none'

  for (const candidate of LOCKFILE_CANDIDATES) {
    const content = await fetchRaw(owner, repo, resolvedRef, candidate)
    if (content !== null) {
      lockfile = content
      lockfileType = detectLockfileType(candidate)
      break
    }
  }

  return { packageJson, lockfile, lockfileType, ref: resolvedRef }
}
