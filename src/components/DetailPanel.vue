<script setup lang="ts">
import { computed } from 'vue'
import { useAnalysisStore } from '@/stores/analysis'

const store = useAnalysisStore()
const node = computed(() => store.selectedNode!)

const npmUrl = computed(() => `https://www.npmjs.com/package/${node.value.name}`)

const duplicateVersions = computed(() => {
  const dups = store.result?.duplicates ?? {}
  return dups[node.value.name] ?? null
})

const kindLabel: Record<string, string> = {
  dependency: 'dependencies',
  devDependency: 'devDependencies',
  peerDependency: 'peerDependencies',
  optionalDependency: 'optionalDependencies',
}

const kindColor: Record<string, string> = {
  dependency: '#6366f1',
  devDependency: '#22d3ee',
  peerDependency: '#a78bfa',
  optionalDependency: '#f59e0b',
}
</script>

<template>
  <aside class="detail-panel">
    <div class="panel-header">
      <span class="panel-title">Package Details</span>
      <button class="close-btn" aria-label="Close" @click="store.selectNode(null)">×</button>
    </div>

    <div class="panel-body">
      <div class="detail-row">
        <span class="detail-key">Package</span>
        <code class="detail-pkg-name">{{ node.name }}</code>
      </div>

      <div class="detail-row">
        <span class="detail-key">Version</span>
        <code class="detail-version">{{ node.version }}</code>
      </div>

      <div class="detail-row">
        <span class="detail-key">Type</span>
        <span
          class="kind-badge"
          :style="{
            background: `${kindColor[node.kind]}15`,
            color: kindColor[node.kind],
            borderColor: `${kindColor[node.kind]}30`,
          }"
        >{{ kindLabel[node.kind] }}</span>
      </div>

      <div class="detail-row">
        <span class="detail-key">Direct Deps</span>
        <span class="detail-val">{{ node.children.length }}</span>
      </div>

      <div v-if="node.isCircular" class="alert-box alert-warn">
        This package is a circular dependency breakpoint.
      </div>

      <div v-if="duplicateVersions" class="alert-box alert-dup">
        <p class="alert-title">Multiple versions detected</p>
        <div class="dup-versions">
          <code
            v-for="ver in duplicateVersions"
            :key="ver"
            class="dup-ver"
            :class="{ current: ver === node.version }"
          >{{ ver }}</code>
        </div>
      </div>

      <div class="detail-path-block">
        <span class="detail-key">Dependency Path</span>
        <div class="path-crumbs">
          <template v-for="(segment, i) in node.path" :key="i">
            <span class="path-seg" :class="{ last: i === node.path.length - 1 }">{{ segment }}</span>
            <span v-if="i < node.path.length - 1" class="path-arrow">›</span>
          </template>
        </div>
      </div>

      <a :href="npmUrl" target="_blank" rel="noopener noreferrer" class="npm-link">
        <span>View on npmjs.com</span>
        <span class="npm-arrow">↗</span>
      </a>
    </div>
  </aside>
</template>

<style scoped>
.detail-panel {
  width: 268px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  background: var(--surface);
  border-left: 1px solid var(--border-light);
  overflow-y: auto;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  border-bottom: 1px solid var(--border-light);
  flex-shrink: 0;
}
.panel-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-bright);
}
.close-btn {
  width: 20px;
  height: 20px;
  background: transparent;
  border: none;
  color: var(--muted);
  cursor: pointer;
  font-size: 14px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 3px;
}
.close-btn:hover {
  background: var(--surface-2);
  color: var(--text-bright);
}

.panel-body {
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.detail-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.detail-key {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--muted);
}
.detail-pkg-name {
  font-size: 13px;
  font-weight: 600;
  font-family: 'JetBrains Mono', monospace;
  color: var(--text-bright);
  word-break: break-all;
}
.detail-version {
  font-size: 12px;
  font-family: 'JetBrains Mono', monospace;
  color: var(--accent);
}
.detail-val {
  font-size: 13px;
  color: var(--text);
  font-family: 'JetBrains Mono', monospace;
}

.kind-badge {
  align-self: flex-start;
  font-size: 11px;
  padding: 3px 8px;
  border-radius: 4px;
  border: 1px solid;
  font-weight: 500;
  font-family: 'JetBrains Mono', monospace;
}

.alert-box {
  padding: 9px 11px;
  border-radius: 6px;
  font-size: 12px;
}
.alert-warn {
  background: rgba(249, 115, 22, 0.08);
  border: 1px solid rgba(249, 115, 22, 0.25);
  color: #fb923c;
}
.alert-dup {
  background: rgba(234, 179, 8, 0.08);
  border: 1px solid rgba(234, 179, 8, 0.25);
  color: #fbbf24;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.alert-title {
  font-size: 11px;
  font-weight: 600;
}
.dup-versions {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.dup-ver {
  font-size: 11px;
  font-family: 'JetBrains Mono', monospace;
  padding: 1px 6px;
  border-radius: 3px;
  background: rgba(234, 179, 8, 0.1);
  border: 1px solid rgba(234, 179, 8, 0.25);
}
.dup-ver.current {
  background: rgba(234, 179, 8, 0.25);
  font-weight: 600;
}

.detail-path-block {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.path-crumbs {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 3px;
}
.path-seg {
  font-size: 11px;
  font-family: 'JetBrains Mono', monospace;
  color: var(--muted);
}
.path-seg.last {
  color: var(--text-bright);
  font-weight: 600;
}
.path-arrow {
  font-size: 11px;
  color: var(--muted);
}

.npm-link {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: 6px;
  font-size: 12px;
  color: var(--muted);
  text-decoration: none;
  transition: border-color 0.15s, color 0.15s;
  margin-top: 4px;
}
.npm-link:hover {
  border-color: var(--accent-border);
  color: var(--text-bright);
}
.npm-arrow {
  font-size: 11px;
}
</style>
