<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAnalysisStore } from '@/stores/analysis'
import type { PackageNode } from '@/types'

const props = defineProps<{
  node: PackageNode
  depth?: number
  searchQuery?: string
}>()

const store = useAnalysisStore()
const isExpanded = ref(props.depth === 0 || (props.depth ?? 0) < 2)
const depth = computed(() => props.depth ?? 0)

const kindColor: Record<string, string> = {
  dependency: '#6366f1',
  devDependency: '#22d3ee',
  peerDependency: '#a78bfa',
  optionalDependency: '#f59e0b',
}

const kindLabel: Record<string, string> = {
  dependency: 'dep',
  devDependency: 'dev',
  peerDependency: 'peer',
  optionalDependency: 'opt',
}

const isSelected = computed(() => store.selectedNode?.id === props.node.id)

const isHighlighted = computed(() => {
  const q = props.searchQuery?.toLowerCase() ?? store.searchQuery.toLowerCase()
  return q.length >= 2 && props.node.name.toLowerCase().includes(q)
})

function toggleExpand() {
  isExpanded.value = !isExpanded.value
}

function selectNode() {
  store.selectNode(isSelected.value ? null : props.node)
}
</script>

<template>
  <div class="select-none">
    <!-- ノード行 -->
    <div
      class="flex items-center gap-1.5 py-1 px-2 rounded-lg cursor-pointer transition-colors group"
      :style="{
        marginLeft: `${depth * 20}px`,
        background: isSelected ? 'rgba(99,102,241,0.15)' : isHighlighted ? 'rgba(250,204,21,0.08)' : 'transparent',
        border: isSelected ? '1px solid rgba(99,102,241,0.4)' : '1px solid transparent',
      }"
      @click="selectNode"
    >
      <!-- 展開トグル -->
      <button
        v-if="node.children.length > 0"
        class="w-4 h-4 flex items-center justify-center text-xs shrink-0 rounded cursor-pointer transition-colors"
        style="color: var(--color-muted)"
        @click.stop="toggleExpand"
        :aria-expanded="isExpanded"
        :aria-label="isExpanded ? '折りたたむ' : '展開する'"
      >
        {{ isExpanded ? '▼' : '▶' }}
      </button>
      <span v-else class="w-4 h-4 shrink-0"></span>

      <!-- 循環依存アイコン -->
      <span v-if="node.isCircular" title="循環依存" class="text-xs shrink-0" style="color: #f97316">🔄</span>

      <!-- 依存種別バッジ (ルート以外) -->
      <span
        v-if="depth > 0"
        class="text-[10px] px-1 rounded font-mono shrink-0"
        :style="{
          background: `${kindColor[node.kind]}20`,
          color: kindColor[node.kind],
          border: `1px solid ${kindColor[node.kind]}40`,
        }"
      >
        {{ kindLabel[node.kind] }}
      </span>

      <!-- パッケージ名 -->
      <span
        class="text-sm font-mono truncate"
        :style="{
          color: isHighlighted ? '#fde047' : isSelected ? 'var(--color-accent-hover)' : 'var(--color-text)',
          fontWeight: depth === 0 ? '600' : '400',
        }"
        >{{ node.name }}</span
      >

      <!-- バージョン -->
      <span class="text-xs font-mono shrink-0" style="color: var(--color-muted)">
        {{ node.version }}
      </span>

      <!-- 子ノード数バッジ -->
      <span
        v-if="node.children.length > 0 && !isExpanded"
        class="ml-auto text-[10px] px-1.5 py-0.5 rounded-full font-mono shrink-0"
        style="background: var(--color-surface-2); color: var(--color-muted)"
      >
        +{{ node.children.length }}
      </span>
    </div>

    <!-- 子ノード (再帰) -->
    <div v-if="isExpanded && node.children.length > 0">
      <TreeNode
        v-for="child in node.children"
        :key="child.id"
        :node="child"
        :depth="depth + 1"
        :search-query="searchQuery"
      />
    </div>
  </div>
</template>
