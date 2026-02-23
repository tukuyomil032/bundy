<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAnalysisStore } from '@/stores/analysis'
import TreeView from '@/components/Tree/TreeView.vue'
import DetailPanel from '@/components/DetailPanel.vue'
import FilterBar from '@/components/FilterBar.vue'

const router = useRouter()
const store = useAnalysisStore()

onMounted(() => {
  if (!store.hasResult) {
    router.replace({ name: 'home' })
  }
})

function exportJson() {
  if (!store.result) return
  const json = JSON.stringify(store.result, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'bundy-analysis.json'
  a.click()
  URL.revokeObjectURL(url)
}

function goHome() {
  store.resetResult()
  router.push({ name: 'home' })
}
</script>

<template>
  <div class="flex flex-col h-screen overflow-hidden" style="background: var(--color-bg)">
    <!-- ヘッダー -->
    <header
      class="flex items-center gap-4 px-4 py-2.5 shrink-0"
      style="background: var(--color-surface); border-bottom: 1px solid var(--color-border)"
    >
      <button
        class="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
        style="color: var(--color-muted); hover:color: var(--color-text)"
        @click="goHome"
      >
        ← 戻る
      </button>

      <div class="flex items-center gap-2">
        <svg width="20" height="20" viewBox="0 0 40 40" fill="none">
          <circle cx="20" cy="8" r="4" fill="#6366f1" />
          <circle cx="8" cy="28" r="4" fill="#818cf8" />
          <circle cx="32" cy="28" r="4" fill="#818cf8" />
          <line x1="20" y1="12" x2="8" y2="24" stroke="#6366f1" stroke-width="2" />
          <line x1="20" y1="12" x2="32" y2="24" stroke="#6366f1" stroke-width="2" />
        </svg>
        <span class="font-semibold text-sm" style="color: var(--color-text)">Bundy</span>
      </div>

      <div class="h-4 w-px" style="background: var(--color-border)"></div>

      <div v-if="store.result" class="flex items-center gap-3 text-xs flex-1 min-w-0">
        <span class="truncate" style="color: var(--color-muted)"> 📦 {{ store.result.sourceLabel }} </span>
        <span
          class="px-2 py-0.5 rounded font-mono shrink-0"
          style="background: var(--color-surface-2); color: var(--color-accent); border: 1px solid var(--color-border)"
        >
          {{ store.result.lockfileType }}
        </span>
        <span style="color: var(--color-muted)" class="shrink-0"> {{ store.result.totalPackages }} packages </span>
        <span
          v-if="store.result.circularDeps.length"
          class="shrink-0"
          style="color: #f97316"
          :title="store.result.circularDeps.join('\n')"
        >
          🔄 {{ store.result.circularDeps.length }} circular
        </span>
        <span v-if="Object.keys(store.result.duplicates).length" class="shrink-0" style="color: #eab308">
          ⚠️ {{ Object.keys(store.result.duplicates).length }} duplicates
        </span>
      </div>

      <!-- JSON エクスポート -->
      <button
        v-if="store.result"
        class="ml-auto flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors cursor-pointer shrink-0"
        style="background: var(--color-surface-2); color: var(--color-muted); border: 1px solid var(--color-border)"
        @click="exportJson"
      >
        ↓ JSON
      </button>
    </header>

    <!-- フィルターバー -->
    <FilterBar />

    <!-- メインコンテンツ -->
    <div class="flex flex-1 overflow-hidden">
      <!-- ツリーエリア -->
      <div class="flex-1 overflow-auto">
        <TreeView v-if="store.filteredRoot" :root="store.filteredRoot" />
        <div v-else class="flex items-center justify-center h-full" style="color: var(--color-muted)">
          データがありません
        </div>
      </div>

      <!-- 詳細パネル -->
      <DetailPanel v-if="store.selectedNode" />
    </div>
  </div>
</template>
