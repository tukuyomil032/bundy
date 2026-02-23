<script setup lang="ts">
import { ref } from 'vue'

const emit = defineEmits<{
  analyze: [url: string]
}>()

const input = ref('')
const examples = ['vuejs/vue', 'facebook/react', 'vercel/next.js']

function handleAnalyze() {
  const val = input.value.trim()
  if (!val) return
  emit('analyze', val)
}

function fillExample(example: string) {
  input.value = example
}
</script>

<template>
  <div class="github-wrap">
    <div class="field-group">
      <label class="field-label">GitHub repository URL or <code>owner/repo</code></label>
      <div class="input-row">
        <input
          v-model="input"
          class="field-input"
          type="text"
          placeholder="e.g. facebook/react"
          @keydown.enter="handleAnalyze"
        />
        <button class="btn-primary" :disabled="!input.trim()" @click="handleAnalyze">Analyze</button>
      </div>
      <p class="field-hint">
        Branch: <code>owner/repo@branch</code> or
        <code>https://github.com/owner/repo/tree/branch</code>
      </p>
    </div>

    <div class="examples-row">
      <span class="examples-label">Examples:</span>
      <button
        v-for="ex in examples"
        :key="ex"
        class="example-chip"
        @click="fillExample(ex)"
      >{{ ex }}</button>
    </div>

    <div class="notice-box">
      <span class="notice-icon">i</span>
      <span>
        Only <strong>public repositories</strong> are supported.
        For private repos, use Local Upload.
      </span>
    </div>
  </div>
</template>

<style scoped>
.github-wrap {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.field-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field-label code {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  background: var(--surface-3);
  padding: 1px 5px;
  border-radius: 3px;
  color: var(--accent);
}

.input-row {
  display: flex;
  gap: 8px;
}

.field-hint {
  font-size: 11px;
  color: var(--muted);
  line-height: 1.6;
}
.field-hint code {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  background: var(--surface-3);
  padding: 1px 5px;
  border-radius: 3px;
  color: var(--text);
  border: 1px solid var(--border-light);
}

.examples-row {
  display: flex;
  align-items: center;
  gap: 7px;
  flex-wrap: wrap;
}
.examples-label {
  font-size: 11px;
  color: var(--muted);
  flex-shrink: 0;
}
.example-chip {
  padding: 3px 10px;
  font-size: 11px;
  font-family: 'JetBrains Mono', monospace;
  background: var(--surface-2);
  color: var(--text);
  border: 1px solid var(--border);
  border-radius: 4px;
  cursor: pointer;
  transition: border-color 0.15s, color 0.15s;
}
.example-chip:hover {
  border-color: var(--accent);
  color: var(--accent);
}

.notice-box {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 10px 12px;
  background: var(--accent-dim);
  border: 1px solid var(--accent-border);
  border-radius: 6px;
  font-size: 12px;
  color: var(--text);
  line-height: 1.5;
}
.notice-icon {
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--accent);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 700;
  margin-top: 1px;
}
.notice-box strong {
  color: var(--text-bright);
}
</style>
