<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAnalysisStore } from '@/stores/analysis'
import LocalUpload from '@/components/InputPanel/LocalUpload.vue'
import GitHubInput from '@/components/InputPanel/GitHubInput.vue'
import AnalyzingOverlay from '@/components/AnalyzingOverlay.vue'

const MIN_OVERLAY_MS = 3200

type Tab = 'local' | 'github'

const router = useRouter()
const store = useAnalysisStore()
const activeTab = ref<Tab>('local')
const showOverlay = ref(false)
const overlayRef = ref<InstanceType<typeof AnalyzingOverlay> | null>(null)

async function runWithMinDelay(task: () => Promise<void>) {
  showOverlay.value = true
  const start = Date.now()
  await task()
  const elapsed = Date.now() - start
  const minTime = store.error ? 200 : MIN_OVERLAY_MS
  const remaining = minTime - elapsed
  if (remaining > 0) {
    await new Promise(r => setTimeout(r, remaining))
  }
  if (!store.error && overlayRef.value) {
    await overlayRef.value.fadeOut()
  }
  showOverlay.value = false
}

async function handleLocalAnalyze(packageJsonFile: File, lockfileFile: File | null) {
  await runWithMinDelay(() => store.analyzeLocal(packageJsonFile, lockfileFile))
  if (!store.error) {
    router.push({ name: 'analysis' })
  }
}

async function handleGitHubAnalyze(url: string) {
  await runWithMinDelay(() => store.analyzeGitHub(url))
  if (!store.error) {
    router.push({ name: 'analysis' })
  }
}
</script>

<template>
  <div class="home-root">
    <header class="app-header">
      <div class="app-header-inner">
        <div class="app-logo">
          <svg width="22" height="22" viewBox="0 0 40 40" fill="none">
            <circle cx="20" cy="7" r="5" fill="#6366f1" />
            <circle cx="7" cy="30" r="5" fill="#818cf8" />
            <circle cx="33" cy="30" r="5" fill="#818cf8" />
            <line x1="20" y1="12" x2="7" y2="25" stroke="#6366f1" stroke-width="2" />
            <line x1="20" y1="12" x2="33" y2="25" stroke="#6366f1" stroke-width="2" />
          </svg>
          <span class="app-name">Bundy</span>
        </div>
        <span class="app-tagline">Package Dependency Visualizer</span>
      </div>
    </header>

    <main class="home-main">
      <div class="home-grid">
        <div class="home-left">
          <div class="card">
            <div class="card-header">
              <p class="card-title">Input Source</p>
              <p class="card-desc">Analyze from local files or a GitHub repository</p>
            </div>

            <div class="src-tabs">
              <button
                class="src-tab"
                :class="{ active: activeTab === 'local' }"
                @click="activeTab = 'local'"
              >
                Local Files
              </button>
              <button
                class="src-tab"
                :class="{ active: activeTab === 'github' }"
                @click="activeTab = 'github'"
              >
                GitHub URL
              </button>
            </div>

            <div class="card-body">
              <LocalUpload v-if="activeTab === 'local'" @analyze="handleLocalAnalyze" />
              <GitHubInput v-else @analyze="handleGitHubAnalyze" />
              <div v-if="store.loading" class="status-row loading">
                <svg class="spin-icon" fill="none" viewBox="0 0 24 24" width="14" height="14">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Analyzing...
              </div>
              <div v-if="store.error" class="status-error">
                {{ store.error }}
              </div>
            </div>
          </div>
        </div>

        <div class="home-right">
          <div class="card">
            <div class="card-header">
              <p class="card-title">Supported Lockfiles</p>
              <p class="card-desc">Parses lockfiles from the following package managers</p>
            </div>
            <div class="card-body">
              <div class="pm-list">
                <div v-for="pm in pmList" :key="pm.name" class="pm-row">
                  <div class="pm-dot" :style="{ background: pm.color }"></div>
                  <div class="pm-info">
                    <span class="pm-name">{{ pm.name }}</span>
                    <code class="pm-file">{{ pm.file }}</code>
                  </div>
                  <span class="pm-badge" :class="pm.supported ? 'badge-ok' : 'badge-no'">
                    {{ pm.supported ? 'supported' : 'planned' }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div class="card mt-3">
            <div class="card-header">
              <p class="card-title">Features</p>
              <p class="card-desc">Available after analysis</p>
            </div>
            <div class="card-body">
              <ul class="feature-list">
                <li v-for="f in features" :key="f">{{ f }}</li>
              </ul>
            </div>
          </div>
          <p class="privacy-note">Files are processed locally in your browser — never sent to external servers</p>
        </div>
      </div>
    </main>
  </div>

  <AnalyzingOverlay v-if="showOverlay" ref="overlayRef" />
</template>

<script lang="ts">
const pmList = [
  { name: 'npm', file: 'package-lock.json', color: '#f97316', supported: true },
  { name: 'Yarn', file: 'yarn.lock', color: '#2563eb', supported: true },
  { name: 'pnpm', file: 'pnpm-lock.yaml', color: '#f59e0b', supported: true },
  { name: 'Bun', file: 'bun.lock', color: '#a21caf', supported: true },
]

const features = [
  'Expand / collapse dependency tree nodes',
  'Incremental search by package name',
  'Filter by dependency type (dep / dev / peer / opt)',
  'Automatic circular dependency detection',
  'Duplicate version detection',
  'Export analysis results as JSON',
]
</script>

<style scoped>
.home-root {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: var(--bg);
}

.app-header {
  height: 48px;
  border-bottom: 1px solid var(--border-light);
  background: var(--surface);
  flex-shrink: 0;
}
.app-header-inner {
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 24px;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.app-logo {
  display: flex;
  align-items: center;
  gap: 8px;
}
.app-name {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-bright);
  letter-spacing: -0.01em;
}
.app-tagline {
  font-size: 11px;
  color: var(--muted);
}

.home-main {
  flex: 1;
  padding: 32px 24px;
  max-width: 1100px;
  width: 100%;
  margin: 0 auto;
}

.home-grid {
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 16px;
  align-items: start;
}

@media (max-width: 768px) {
  .home-grid {
    grid-template-columns: 1fr;
  }
}

.src-tabs {
  display: flex;
  border-bottom: 1px solid var(--border-light);
  background: var(--surface);
}
.src-tab {
  flex: 1;
  padding: 10px 16px;
  font-size: 12px;
  font-weight: 500;
  color: var(--muted);
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s, background 0.15s;
  font-family: inherit;
}
.src-tab:hover {
  color: var(--text);
  background: var(--surface-2);
}
.src-tab.active {
  color: var(--text-bright);
  border-bottom-color: var(--accent);
  background: var(--surface-2);
}

.status-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 12px;
  font-size: 12px;
}
.status-row.loading {
  color: var(--muted);
}
.spin-icon {
  animation: spin 1s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
.status-error {
  margin-top: 12px;
  padding: 10px 12px;
  background: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.25);
  border-radius: 6px;
  font-size: 12px;
  color: #fca5a5;
}

.pm-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.pm-row {
  display: flex;
  align-items: center;
  gap: 10px;
}
.pm-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
.pm-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1px;
}
.pm-name {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-bright);
}
.pm-file {
  font-size: 11px;
  color: var(--muted);
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
}
.pm-badge {
  font-size: 10px;
  font-weight: 600;
  padding: 2px 7px;
  border-radius: 99px;
}
.badge-ok {
  background: rgba(34, 197, 94, 0.12);
  color: #4ade80;
  border: 1px solid rgba(34, 197, 94, 0.25);
}
.badge-no {
  background: rgba(107, 114, 128, 0.1);
  color: var(--muted);
  border: 1px solid var(--border);
}

.feature-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 7px;
}
.feature-list li {
  font-size: 12px;
  color: var(--text);
  padding-left: 14px;
  position: relative;
}
.feature-list li::before {
  content: '–';
  position: absolute;
  left: 0;
  color: var(--accent);
}

.mt-3 {
  margin-top: 12px;
}

.privacy-note {
  margin-top: 14px;
  font-size: 11px;
  color: var(--muted);
  text-align: center;
}
</style>
