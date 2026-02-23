<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAnalysisStore } from '@/stores/analysis'
import type { PackageNode } from '@/types'
import TreeNode from './TreeNode.vue'

const props = defineProps<{
  root: PackageNode
}>()

const store = useAnalysisStore()

// ツリー全展開 / 折りたたみのキーを使って強制再レンダリング
const expandKey = ref(0)
const collapseKey = ref(0)

// 検索ハイライト
const searchQuery = computed(() => store.searchQuery)

// ノード総数 (フィルター適用後のルートから)
const totalNodes = computed(() => countNodes(props.root))

function countNodes(node: PackageNode): number {
  return 1 + node.children.reduce((sum, c) => sum + countNodes(c), 0)
}

// 検索結果ノード数
const matchCount = computed(() => {
  if (!searchQuery.value || searchQuery.value.length < 2) return 0
  return countMatches(props.root, searchQuery.value.toLowerCase())
})

function countMatches(node: PackageNode, q: string): number {
  let count = node.name.toLowerCase().includes(q) ? 1 : 0
  for (const child of node.children) count += countMatches(child, q)
  return count
}
</script>

<template>
  <div class="flex flex-col h-full">
    <!-- ツリーコントロール -->
    <div class="flex items-center gap-3 px-4 py-2 shrink-0" style="border-bottom: 1px solid var(--color-border)">
      <span class="text-xs" style="color: var(--color-muted)">
        {{ totalNodes.toLocaleString() }} ノード
        <template v-if="matchCount > 0">
          · <span style="color: #fde047">{{ matchCount }} 件ヒット</span>
        </template>
      </span>
      <div class="ml-auto flex gap-2">
        <button
          class="text-xs px-2 py-1 rounded cursor-pointer transition-colors"
          style="background: var(--color-surface-2); color: var(--color-muted); border: 1px solid var(--color-border)"
          @click="expandKey++"
          title="すべて展開 (一部ブラウザでは遅くなる場合があります)"
        >
          すべて展開
        </button>
        <button
          class="text-xs px-2 py-1 rounded cursor-pointer transition-colors"
          style="background: var(--color-surface-2); color: var(--color-muted); border: 1px solid var(--color-border)"
          @click="collapseKey++"
        >
          すべて折りたたむ
        </button>
      </div>
    </div>

    <!-- ツリー本体 -->
    <div ref="treeContainerRef" class="flex-1 overflow-auto p-4">
      <TreeNode :key="`root-${expandKey}-${collapseKey}`" :node="root" :depth="0" :search-query="searchQuery" />
    </div>
  </div>
</template>
