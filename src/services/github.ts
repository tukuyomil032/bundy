import { detectLockfileType } from '@/parsers'
import type { LockfileType } from '@/types'

const RAW_BASE = 'https://raw.githubusercontent.com'
const LOCKFILE_CANDIDATES = ['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', 'pnpm-lock.yml', 'bun.lock']

export interface GitHubFetchResult {
  packageJson: string
  lockfile: string | null
  lockfileType: LockfileType
  ref: string
}

export function parseGitHubInput(input: string): {
  owner: string
  repo: string
  ref?: string
} | null {
  input = input.trim().replace(/\/+$/, '')

  const urlMatch = input.match(/^https?:\/\/github\.com\/([a-z0-9_-]+)\/([a-z0-9._-]+?)(?:\/tree\/([a-z0-9_\/-]+))?(?:\.git)?$/i)
  if (urlMatch) {
    return { owner: urlMatch[1]!, repo: urlMatch[2]!, ref: urlMatch[3] }
  }

  const shortMatch = input.match(/^([a-z0-9_-]+)\/([a-z0-9._-]+)(?:@([a-z0-9_\/-]+))?$/i)
  if (shortMatch) {
    return { owner: shortMatch[1]!, repo: shortMatch[2]!, ref: shortMatch[3] }
  }

  return null
}

async function getDefaultBranch(owner: string, repo: string): Promise<string> {
  try {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`)
    if (!res.ok) {
      if (res.status === 404) {
        throw new Error(`Repository not found: ${owner}/${repo}`)
      }
      if (res.status === 403) {
        throw new Error('GitHub API rate limit exceeded. Please try again later.')
      }
      throw new Error(`GitHub API error: ${res.status}`)
    }
    const data = await res.json() as Record<string, unknown>
    return (data.default_branch as string) ?? 'main'
  } catch (e) {
    if (e instanceof Error) {
      throw e
    }
    throw new Error('GitHub API communication error')
  }
}

async function fetchRaw(owner: string, repo: string, ref: string, path: string): Promise<string | null> {
  try {
    const url = `${RAW_BASE}/${owner}/${repo}/${ref}/${path}`
    const res = await fetch(url)
    if (res.status === 404) {
      return null
    }
    if (!res.ok) {
      throw new Error(`Failed to fetch file (${path}): HTTP ${res.status}`)
    }
    return res.text()
  } catch (e) {
    if (e instanceof Error) {
      throw e
    }
    throw new Error(`Error fetching file (${path})`)
  }
}

export async function fetchFromGitHub(owner: string, repo: string, ref?: string): Promise<GitHubFetchResult> {
  const resolvedRef = ref ?? (await getDefaultBranch(owner, repo))

  const packageJson = await fetchRaw(owner, repo, resolvedRef, 'package.json')
  if (!packageJson) {
    throw new Error(`package.json not found in ${owner}/${repo}@${resolvedRef}`)
  }

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
