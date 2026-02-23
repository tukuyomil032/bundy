<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAnalysisStore } from '@/stores/analysis'
import TreeView from '@/components/Tree/TreeView.vue'
import MindMapView from '@/components/MindMap/MindMapView.vue'
import DetailPanel from '@/components/DetailPanel.vue'
import FilterBar from '@/components/FilterBar.vue'

const router = useRouter()
const store = useAnalysisStore()

type ViewMode = 'tree' | 'mindmap'
const viewMode = ref<ViewMode>('tree')

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
  <div class="analysis-root">
    <header class="analysis-header">
      <div class="header-left">
        <button class="btn-ghost btn-sm" @click="goHome">← Back</button>
        <div class="logo-mark">
          <svg width="16" height="16" viewBox="0 0 40 40" fill="none">
            <circle cx="20" cy="7" r="5" fill="#6366f1" />
            <circle cx="7" cy="30" r="5" fill="#818cf8" />
            <circle cx="33" cy="30" r="5" fill="#818cf8" />
            <line x1="20" y1="12" x2="7" y2="25" stroke="#6366f1" stroke-width="2" />
            <line x1="20" y1="12" x2="33" y2="25" stroke="#6366f1" stroke-width="2" />
          </svg>
          <span class="logo-name">Bundy</span>
        </div>
        <div class="header-sep"></div>
        <template v-if="store.result">
          <span class="header-label">{{ store.result.sourceLabel }}</span>
          <span class="header-badge">{{ store.result.lockfileType }}</span>
          <span class="header-label">{{ store.result.totalPackages }} packages</span>
          <span v-if="store.result.circularDeps.length" class="header-warn">
            {{ store.result.circularDeps.length }} circular
          </span>
          <span v-if="Object.keys(store.result.duplicates).length" class="header-dup">
            {{ Object.keys(store.result.duplicates).length }} duplicates
          </span>
        </template>
      </div>
      <div class="header-right">
        <div class="view-toggle">
          <button
            class="view-btn"
            :class="{ active: viewMode === 'tree' }"
            title="Tree View"
            @click="viewMode = 'tree'"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            Tree
          </button>
          <button
            class="view-btn"
            :class="{ active: viewMode === 'mindmap' }"
            title="Mind Map"
            @click="viewMode = 'mindmap'"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="3" />
              <circle cx="3" cy="5" r="2" />
              <circle cx="21" cy="5" r="2" />
              <circle cx="3" cy="19" r="2" />
              <circle cx="21" cy="19" r="2" />
              <line x1="12" y1="9" x2="4" y2="6" />
              <line x1="12" y1="9" x2="20" y2="6" />
              <line x1="12" y1="15" x2="4" y2="18" />
              <line x1="12" y1="15" x2="20" y2="18" />
            </svg>
            Map
          </button>
        </div>
        <button v-if="store.result" class="btn-ghost btn-sm" @click="exportJson">
          ↓ JSON
        </button>
      </div>
    </header>

    <FilterBar v-if="viewMode === 'tree'" />

    <div class="analysis-body">
      <template v-if="viewMode === 'tree'">
        <div class="tree-area">
          <TreeView v-if="store.filteredRoot" :root="store.filteredRoot" />
          <div v-else class="empty-state">No data available</div>
        </div>
        <DetailPanel v-if="store.selectedNode" />
      </template>

      <template v-else>
        <div class="mindmap-area">
          <MindMapView v-if="store.filteredRoot" :root="store.filteredRoot" />
          <div v-else class="empty-state">No data available</div>
        </div>
        <DetailPanel v-if="store.selectedNode" />
      </template>
    </div>
  </div>
</template>

<style scoped>
.analysis-root {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
  background: var(--bg);
}

.analysis-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 44px;
  padding: 0 16px;
  background: var(--surface);
  border-bottom: 1px solid var(--border-light);
  flex-shrink: 0;
  gap: 8px;
}
.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  flex: 1;
}
.header-right {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}
.logo-mark {
  display: flex;
  align-items: center;
  gap: 6px;
}
.logo-name {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-bright);
}
.header-sep {
  width: 1px;
  height: 16px;
  background: var(--border);
  flex-shrink: 0;
}
.header-label {
  font-size: 12px;
  color: var(--muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 220px;
}
.header-badge {
  font-size: 11px;
  padding: 2px 7px;
  border-radius: 4px;
  background: var(--surface-2);
  color: var(--accent);
  border: 1px solid var(--border);
  font-family: 'JetBrains Mono', monospace;
  flex-shrink: 0;
}
.header-warn {
  font-size: 11px;
  color: #fb923c;
  flex-shrink: 0;
}
.header-dup {
  font-size: 11px;
  color: #fbbf24;
  flex-shrink: 0;
}

.btn-sm {
  padding: 4px 10px;
  font-size: 12px;
}

.view-toggle {
  display: flex;
  background: var(--surface-3);
  border: 1px solid var(--border);
  border-radius: 6px;
  overflow: hidden;
}
.view-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  font-size: 11px;
  font-weight: 500;
  font-family: inherit;
  color: var(--muted);
  background: transparent;
  border: none;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
  white-space: nowrap;
}
.view-btn:hover {
  color: var(--text);
  background: var(--surface-2);
}
.view-btn.active {
  background: var(--accent);
  color: #fff;
}

.analysis-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}
.tree-area {
  flex: 1;
  overflow: auto;
  padding: 12px;
}
.mindmap-area {
  flex: 1;
  overflow: hidden;
  display: flex;
  min-width: 0;
}
.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--muted);
  font-size: 13px;
}
</style>
