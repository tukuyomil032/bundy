<script setup lang="ts">
import { computed } from 'vue'
import { useAnalysisStore } from '@/stores/analysis'

const store = useAnalysisStore()
const opts = computed(() => store.filterOptions)

function toggle(key: keyof typeof opts.value) {
  store.updateFilter({ [key]: !opts.value[key] })
}

function setMaxDepth(val: number) {
  store.updateFilter({ maxDepth: Math.max(1, Math.min(20, val)) })
}

const filters = [
  { key: 'showDeps', label: 'dep', color: '#6366f1', title: 'dependencies' },
  { key: 'showDevDeps', label: 'dev', color: '#22d3ee', title: 'devDependencies' },
  { key: 'showPeerDeps', label: 'peer', color: '#a78bfa', title: 'peerDependencies' },
  { key: 'showOptionalDeps', label: 'opt', color: '#f59e0b', title: 'optionalDependencies' },
] as const
</script>

<template>
  <div
    class="flex items-center gap-3 px-4 py-2 shrink-0 flex-wrap"
    style="background: var(--color-surface); border-bottom: 1px solid var(--color-border)"
  >
    <!-- 検索 -->
    <div class="flex items-center gap-2 flex-1 min-w-48">
      <span class="text-xs" style="color: var(--color-muted)">🔍</span>
      <input
        v-model="store.searchQuery"
        type="text"
        placeholder="パッケージ名で検索..."
        class="flex-1 text-sm bg-transparent outline-none font-mono"
        style="color: var(--color-text); caret-color: var(--color-accent)"
      />
      <button
        v-if="store.searchQuery"
        class="text-xs cursor-pointer shrink-0"
        style="color: var(--color-muted)"
        @click="store.searchQuery = ''"
      >
        ×
      </button>
    </div>

    <div class="w-px h-4" style="background: var(--color-border)"></div>

    <!-- 種別フィルター -->
    <div class="flex items-center gap-1.5">
      <button
        v-for="f in filters"
        :key="f.key"
        class="px-2 py-0.5 rounded text-[11px] font-mono cursor-pointer transition-all"
        :style="{
          background: opts[f.key] ? `${f.color}20` : 'var(--color-surface-2)',
          color: opts[f.key] ? f.color : 'var(--color-muted)',
          border: opts[f.key] ? `1px solid ${f.color}40` : '1px solid var(--color-border)',
          opacity: opts[f.key] ? '1' : '0.5',
        }"
        :title="f.title"
        @click="toggle(f.key)"
      >
        {{ f.label }}
      </button>
    </div>

    <div class="w-px h-4" style="background: var(--color-border)"></div>

    <!-- 深さ制御 -->
    <div class="flex items-center gap-2">
      <span class="text-xs shrink-0" style="color: var(--color-muted)">深さ</span>
      <input
        type="range"
        min="1"
        max="20"
        :value="opts.maxDepth"
        class="w-24 accent-indigo-500 cursor-pointer"
        @input="setMaxDepth(Number(($event.target as HTMLInputElement).value))"
      />
      <span class="text-xs font-mono w-4 shrink-0" style="color: var(--color-text)">
        {{ opts.maxDepth }}
      </span>
    </div>
  </div>
</template>
