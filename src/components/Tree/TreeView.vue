<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAnalysisStore } from '@/stores/analysis'
import type { PackageNode } from '@/types'
import TreeNode from './TreeNode.vue'

const props = defineProps<{
  root: PackageNode
}>()

const store = useAnalysisStore()
const expandKey = ref(0)
const collapseKey = ref(0)

const searchQuery = computed(() => store.searchQuery)

const totalNodes = computed(() => countNodes(props.root))

function countNodes(node: PackageNode): number {
  return 1 + node.children.reduce((sum, c) => sum + countNodes(c), 0)
}

const matchCount = computed(() => {
  if (searchQuery.value.length < 2) return 0
  return countMatches(props.root, searchQuery.value.toLowerCase())
})

function countMatches(node: PackageNode, q: string): number {
  const self = node.name.toLowerCase().includes(q) ? 1 : 0
  return self + node.children.reduce((sum, c) => sum + countMatches(c, q), 0)
}
</script>

<template>
  <div class="tree-view">
    <div class="tree-toolbar">
      <span class="tree-stat">{{ totalNodes }} nodes</span>
      <span v-if="searchQuery.length >= 2" class="tree-match">{{ matchCount }} matches</span>
      <div class="toolbar-spacer"></div>
      <button class="btn-ghost btn-xs" @click="expandKey++; collapseKey = 0">Expand All</button>
      <button class="btn-ghost btn-xs" @click="collapseKey++; expandKey = 0">Collapse All</button>
    </div>

    <div class="tree-body">
      <TreeNode
        :key="`e${expandKey}-c${collapseKey}`"
        :node="root"
        :depth="0"
        :search-query="searchQuery"
      />
    </div>
  </div>
</template>

<style scoped>
.tree-view {
  display: flex;
  flex-direction: column;
  min-height: 100%;
}

.tree-toolbar {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-bottom: 1px solid var(--border-light);
  flex-shrink: 0;
}
.tree-stat {
  font-size: 11px;
  color: var(--muted);
}
.tree-match {
  font-size: 11px;
  color: #fde047;
}
.toolbar-spacer {
  flex: 1;
}

.btn-xs {
  padding: 3px 8px;
  font-size: 11px;
}

.tree-body {
  padding: 6px 4px;
}
</style>
