<script setup lang="ts">
import { computed } from 'vue'
import { useAnalysisStore } from '@/stores/analysis'

const store = useAnalysisStore()
const node = computed(() => store.selectedNode!)

const npmUrl = computed(() => `https://www.npmjs.com/package/${node.value.name}`)

// 重複バージョン情報
const duplicateVersions = computed(() => {
  const dups = store.result?.duplicates ?? {}
  return dups[node.value.name] ?? null
})

const kindLabel: Record<string, string> = {
  dependency: '通常依存 (dependencies)',
  devDependency: '開発依存 (devDependencies)',
  peerDependency: 'ピア依存 (peerDependencies)',
  optionalDependency: 'オプション依存 (optionalDependencies)',
}

const kindColor: Record<string, string> = {
  dependency: '#6366f1',
  devDependency: '#22d3ee',
  peerDependency: '#a78bfa',
  optionalDependency: '#f59e0b',
}
</script>

<template>
  <aside
    class="w-72 shrink-0 overflow-y-auto flex flex-col"
    style="background: var(--color-surface); border-left: 1px solid var(--color-border)"
  >
    <!-- ヘッダー -->
    <div
      class="flex items-center justify-between px-4 py-3 shrink-0"
      style="border-bottom: 1px solid var(--color-border)"
    >
      <span class="text-sm font-semibold" style="color: var(--color-text)">パッケージ詳細</span>
      <button
        class="w-6 h-6 flex items-center justify-center rounded cursor-pointer text-sm transition-colors"
        style="color: var(--color-muted)"
        @click="store.selectNode(null)"
        aria-label="詳細パネルを閉じる"
      >
        ×
      </button>
    </div>

    <!-- コンテンツ -->
    <div class="p-4 space-y-4 flex-1">
      <!-- パッケージ名 -->
      <div>
        <p class="text-[10px] uppercase tracking-wider mb-1" style="color: var(--color-muted)">パッケージ名</p>
        <p class="font-mono font-semibold text-base break-all" style="color: var(--color-text)">
          {{ node.name }}
        </p>
      </div>

      <!-- バージョン -->
      <div>
        <p class="text-[10px] uppercase tracking-wider mb-1" style="color: var(--color-muted)">バージョン</p>
        <p class="font-mono text-sm" style="color: var(--color-accent-hover)">{{ node.version }}</p>
      </div>

      <!-- 依存種別 -->
      <div>
        <p class="text-[10px] uppercase tracking-wider mb-1" style="color: var(--color-muted)">種別</p>
        <span
          class="text-xs px-2 py-1 rounded font-medium"
          :style="{
            background: `${kindColor[node.kind]}15`,
            color: kindColor[node.kind],
            border: `1px solid ${kindColor[node.kind]}30`,
          }"
        >
          {{ kindLabel[node.kind] }}
        </span>
      </div>

      <!-- 循環依存警告 -->
      <div
        v-if="node.isCircular"
        class="p-3 rounded-lg text-xs"
        style="background: rgba(249, 115, 22, 0.1); color: #fb923c; border: 1px solid rgba(249, 115, 22, 0.3)"
      >
        🔄 このノードは循環依存の折り返し点です。実際の子は上位のノードと同じです。
      </div>

      <!-- 重複バージョン警告 -->
      <div
        v-if="duplicateVersions"
        class="p-3 rounded-lg text-xs"
        style="background: rgba(234, 179, 8, 0.1); color: #fbbf24; border: 1px solid rgba(234, 179, 8, 0.3)"
      >
        <p class="font-medium mb-1">⚠️ 複数バージョンが存在します</p>
        <div class="flex flex-wrap gap-1 mt-1">
          <code
            v-for="ver in duplicateVersions"
            :key="ver"
            class="px-1 rounded"
            :style="{
              background: ver === node.version ? 'rgba(234,179,8,0.2)' : 'transparent',
              border: '1px solid rgba(234,179,8,0.3)',
            }"
            >{{ ver }}</code
          >
        </div>
      </div>

      <!-- 依存パス -->
      <div>
        <p class="text-[10px] uppercase tracking-wider mb-1" style="color: var(--color-muted)">依存パス</p>
        <div class="flex flex-wrap items-center gap-1 text-xs font-mono" style="color: var(--color-muted)">
          <template v-for="(segment, i) in node.path" :key="i">
            <span :style="{ color: i === node.path.length - 1 ? 'var(--color-text)' : 'var(--color-muted)' }">
              {{ segment }}
            </span>
            <span v-if="i < node.path.length - 1">→</span>
          </template>
        </div>
      </div>

      <!-- 子パッケージ数 -->
      <div>
        <p class="text-[10px] uppercase tracking-wider mb-1" style="color: var(--color-muted)">直接依存パッケージ数</p>
        <p class="text-sm font-mono" style="color: var(--color-text)">{{ node.children.length }}</p>
      </div>

      <!-- npm リンク -->
      <a
        :href="npmUrl"
        target="_blank"
        rel="noopener noreferrer"
        class="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm transition-colors"
        style="background: var(--color-surface-2); color: var(--color-muted); border: 1px solid var(--color-border)"
      >
        <span>📦</span>
        <span>npmjs.com で見る</span>
        <span class="ml-auto text-xs">↗</span>
      </a>
    </div>
  </aside>
</template>
