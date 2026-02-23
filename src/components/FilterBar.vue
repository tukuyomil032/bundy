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
  <div class="filter-bar">
    <div class="search-field">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="search-icon">
        <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
      </svg>
      <input
        v-model="store.searchQuery"
        class="search-input"
        type="text"
        placeholder="Search packages..."
      />
      <button v-if="store.searchQuery" class="clear-btn" @click="store.searchQuery = ''">×</button>
    </div>

    <div class="bar-sep"></div>

    <div class="kind-filters">
      <button
        v-for="f in filters"
        :key="f.key"
        class="kind-btn"
        :class="{ active: opts[f.key] }"
        :style="{
          '--kind-color': f.color,
          opacity: opts[f.key] ? '1' : '0.4',
        }"
        :title="f.title"
        @click="toggle(f.key)"
      >{{ f.label }}</button>
    </div>

    <div class="bar-sep"></div>

    <div class="depth-row">
      <span class="depth-label">Depth</span>
      <input
        type="range"
        min="1"
        max="20"
        :value="opts.maxDepth"
        class="depth-slider"
        @input="setMaxDepth(Number(($event.target as HTMLInputElement).value))"
      />
      <span class="depth-val">{{ opts.maxDepth }}</span>
    </div>
  </div>
</template>

<style scoped>
.filter-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 16px;
  height: 40px;
  background: var(--surface);
  border-bottom: 1px solid var(--border-light);
  flex-shrink: 0;
  flex-wrap: wrap;
}

.search-field {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  min-width: 160px;
  max-width: 260px;
  background: var(--surface-3);
  border: 1px solid var(--border);
  border-radius: 5px;
  padding: 4px 8px;
}
.search-icon {
  color: var(--muted);
  flex-shrink: 0;
}
.search-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  font-size: 12px;
  color: var(--text-bright);
  font-family: 'JetBrains Mono', monospace;
  caret-color: var(--accent);
}
.search-input::placeholder {
  color: var(--muted);
  font-family: inherit;
}
.clear-btn {
  background: transparent;
  border: none;
  color: var(--muted);
  cursor: pointer;
  font-size: 12px;
  line-height: 1;
  padding: 0;
  flex-shrink: 0;
}
.clear-btn:hover {
  color: var(--text-bright);
}

.bar-sep {
  width: 1px;
  height: 16px;
  background: var(--border);
  flex-shrink: 0;
}

.kind-filters {
  display: flex;
  gap: 4px;
}
.kind-btn {
  padding: 2px 8px;
  font-size: 11px;
  font-family: 'JetBrains Mono', monospace;
  background: var(--surface-3);
  color: var(--muted);
  border: 1px solid var(--border);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s;
}
.kind-btn.active {
  background: color-mix(in srgb, var(--kind-color) 15%, transparent);
  color: var(--kind-color);
  border-color: color-mix(in srgb, var(--kind-color) 40%, transparent);
}

.depth-row {
  display: flex;
  align-items: center;
  gap: 6px;
}
.depth-label {
  font-size: 11px;
  color: var(--muted);
  white-space: nowrap;
}
.depth-slider {
  width: 80px;
  accent-color: var(--accent);
  cursor: pointer;
}
.depth-val {
  font-size: 11px;
  font-family: 'JetBrains Mono', monospace;
  color: var(--text-bright);
  min-width: 16px;
  text-align: right;
}
</style>
