<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAnalysisStore } from '@/stores/analysis'
import LocalUpload from '@/components/InputPanel/LocalUpload.vue'
import GitHubInput from '@/components/InputPanel/GitHubInput.vue'

type Tab = 'local' | 'github'

const router = useRouter()
const store = useAnalysisStore()
const activeTab = ref<Tab>('local')

async function handleLocalAnalyze(packageJsonFile: File, lockfileFile: File | null) {
  await store.analyzeLocal(packageJsonFile, lockfileFile)
  if (!store.error) {
    router.push({ name: 'analysis' })
  }
}

async function handleGitHubAnalyze(url: string) {
  await store.analyzeGitHub(url)
  if (!store.error) {
    router.push({ name: 'analysis' })
  }
}
</script>

<template>
  <div class="min-h-screen flex flex-col items-center justify-center px-4 py-16" style="background: var(--color-bg)">
    <!-- ヘッダー -->
    <div class="mb-12 text-center">
      <div class="flex items-center justify-center gap-3 mb-4">
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="2" y="2" width="36" height="36" rx="10" fill="#6366f1" opacity="0.15" />
          <circle cx="20" cy="8" r="4" fill="#6366f1" />
          <circle cx="8" cy="28" r="4" fill="#818cf8" />
          <circle cx="32" cy="28" r="4" fill="#818cf8" />
          <line x1="20" y1="12" x2="8" y2="24" stroke="#6366f1" stroke-width="1.5" />
          <line x1="20" y1="12" x2="32" y2="24" stroke="#6366f1" stroke-width="1.5" />
        </svg>
        <h1 class="text-3xl font-bold tracking-tight" style="color: var(--color-text)">Bundy</h1>
      </div>
      <p style="color: var(--color-muted)" class="text-base max-w-md mx-auto">
        package.json とロックファイルから依存関係ツリーを可視化するツール
      </p>
      <div class="flex items-center justify-center gap-2 mt-3 flex-wrap">
        <span
          v-for="badge in ['npm', 'yarn', 'pnpm']"
          :key="badge"
          class="px-2 py-0.5 rounded text-xs font-mono"
          style="background: var(--color-surface-2); color: var(--color-muted); border: 1px solid var(--color-border)"
        >
          {{ badge }}
        </span>
      </div>
    </div>

    <!-- カード -->
    <div
      class="w-full max-w-xl rounded-2xl overflow-hidden"
      style="background: var(--color-surface); border: 1px solid var(--color-border)"
    >
      <!-- タブ -->
      <div class="flex" style="border-bottom: 1px solid var(--color-border)">
        <button
          v-for="tab in [
            { id: 'local', label: 'ローカルアップロード', icon: '📁' },
            { id: 'github', label: 'GitHub URL', icon: '🐙' },
          ]"
          :key="tab.id"
          class="flex-1 py-3.5 text-sm font-medium transition-colors cursor-pointer"
          :style="{
            background: activeTab === tab.id ? 'var(--color-surface-2)' : 'transparent',
            color: activeTab === tab.id ? 'var(--color-text)' : 'var(--color-muted)',
            borderBottom: activeTab === tab.id ? '2px solid var(--color-accent)' : '2px solid transparent',
          }"
          @click="activeTab = tab.id as Tab"
        >
          <span class="mr-1.5">{{ tab.icon }}</span
          >{{ tab.label }}
        </button>
      </div>

      <!-- タブコンテンツ -->
      <div class="p-6">
        <LocalUpload v-if="activeTab === 'local'" @analyze="handleLocalAnalyze" />
        <GitHubInput v-else @analyze="handleGitHubAnalyze" />

        <!-- ローディング -->
        <div v-if="store.loading" class="mt-4 flex items-center gap-2 text-sm" style="color: var(--color-muted)">
          <svg class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          解析中...
        </div>

        <!-- エラー -->
        <div
          v-if="store.error"
          class="mt-4 p-3 rounded-lg text-sm"
          style="background: rgba(239, 68, 68, 0.1); color: #fca5a5; border: 1px solid rgba(239, 68, 68, 0.3)"
        >
          ⚠️ {{ store.error }}
        </div>
      </div>
    </div>

    <!-- フッター -->
    <p class="mt-8 text-xs" style="color: var(--color-muted)">
      ファイルはブラウザ内のみで処理され、外部へ送信されません
    </p>
  </div>
</template>
