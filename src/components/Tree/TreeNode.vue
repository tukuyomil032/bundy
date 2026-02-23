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
  <div class="node-wrap">
    <div
      class="node-row"
      :class="{ selected: isSelected, highlighted: isHighlighted }"
      :style="{ paddingLeft: `${8 + depth * 18}px` }"
      @click="selectNode"
    >
      <button
        v-if="node.children.length > 0"
        class="expand-btn"
        :aria-expanded="isExpanded"
        @click.stop="toggleExpand"
      >{{ isExpanded ? '▾' : '▸' }}</button>
      <span v-else class="expand-spacer"></span>
      <span v-if="node.isCircular" class="circ-mark" title="Circular dependency">↺</span>
      <span
        v-if="depth > 0"
        class="kind-chip"
        :style="{
          background: `${kindColor[node.kind]}18`,
          color: kindColor[node.kind],
          borderColor: `${kindColor[node.kind]}40`,
        }"
      >{{ kindLabel[node.kind] }}</span>

      <span
        class="pkg-name"
        :class="{ root: depth === 0, matched: isHighlighted }"
      >{{ node.name }}</span>

      <span class="pkg-version">{{ node.version }}</span>

      <span v-if="node.children.length > 0 && !isExpanded" class="child-count">
        +{{ node.children.length }}
      </span>
    </div>

    <div v-if="isExpanded && node.children.length > 0" class="children">
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

<style scoped>
.node-wrap {
  user-select: none;
}
.node-row {
  display: flex;
  align-items: center;
  gap: 5px;
  padding-top: 3px;
  padding-bottom: 3px;
  padding-right: 10px;
  border-radius: 5px;
  cursor: pointer;
  border: 1px solid transparent;
  transition: background 0.1s, border-color 0.1s;
}
.node-row:hover {
  background: var(--surface-2);
}
.node-row.selected {
  background: rgba(99, 102, 241, 0.12);
  border-color: rgba(99, 102, 241, 0.35);
}
.node-row.highlighted:not(.selected) {
  background: rgba(250, 204, 21, 0.07);
}

.expand-btn {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  color: var(--muted);
  background: transparent;
  border: none;
  cursor: pointer;
  border-radius: 3px;
}
.expand-btn:hover {
  color: var(--text-bright);
  background: var(--surface-3);
}
.expand-spacer {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.circ-mark {
  font-size: 11px;
  color: #fb923c;
  flex-shrink: 0;
}

.kind-chip {
  font-size: 10px;
  padding: 1px 5px;
  border-radius: 3px;
  border: 1px solid;
  font-family: 'JetBrains Mono', monospace;
  flex-shrink: 0;
}

.pkg-name {
  font-size: 12px;
  font-family: 'JetBrains Mono', monospace;
  color: var(--text);
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}
.pkg-name.root {
  color: var(--text-bright);
  font-weight: 600;
  font-size: 13px;
}
.pkg-name.matched {
  color: #fde047;
}
.pkg-version {
  font-size: 11px;
  font-family: 'JetBrains Mono', monospace;
  color: var(--muted);
  flex-shrink: 0;
}

.child-count {
  margin-left: auto;
  font-size: 10px;
  font-family: 'JetBrains Mono', monospace;
  padding: 1px 6px;
  border-radius: 99px;
  background: var(--surface-3);
  color: var(--muted);
  border: 1px solid var(--border);
  flex-shrink: 0;
}
</style>
