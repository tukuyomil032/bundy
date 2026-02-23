<script setup lang="ts">
import { ref } from 'vue'

const emit = defineEmits<{
  analyze: [packageJsonFile: File, lockfileFile: File | null]
}>()

const isDragging = ref(false)
const packageJsonFile = ref<File | null>(null)
const lockfileFile = ref<File | null>(null)

const lockfileNames = ['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', 'pnpm-lock.yml', 'bun.lock']

function onDrop(e: DragEvent) {
  isDragging.value = false
  const files = Array.from(e.dataTransfer?.files ?? [])
  files.forEach(classifyFile)
}

function onFileInput(e: Event, type: 'package' | 'lockfile') {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  if (type === 'package') packageJsonFile.value = file
  else lockfileFile.value = file
}

function classifyFile(file: File) {
  if (file.name === 'package.json') packageJsonFile.value = file
  else if (lockfileNames.includes(file.name)) lockfileFile.value = file
}

function handleAnalyze() {
  if (!packageJsonFile.value) return
  emit('analyze', packageJsonFile.value, lockfileFile.value)
}

function removeFile(type: 'package' | 'lockfile') {
  if (type === 'package') packageJsonFile.value = null
  else lockfileFile.value = null
}
</script>

<template>
  <div class="upload-wrap">
    <div
      class="drop-zone"
      :class="{ dragging: isDragging }"
      @dragover.prevent="isDragging = true"
      @dragleave="isDragging = false"
      @drop.prevent="onDrop"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M16 12l-4-4-4 4M12 8v8" />
      </svg>
      <span class="drop-text">Drag &amp; Drop files here</span>
      <span class="drop-hint">package.json / package-lock.json / yarn.lock / pnpm-lock.yaml / bun.lock</span>
    </div>

    <div class="file-fields">
      <div class="file-field">
        <label class="field-label">
          package.json <span class="required">*</span>
        </label>
        <label class="file-picker" :class="{ selected: packageJsonFile }">
          <input type="file" accept=".json" class="file-input" @change="onFileInput($event, 'package')" />
          <span class="file-icon">{{ packageJsonFile ? '✓' : '+' }}</span>
          <span class="file-name">{{ packageJsonFile ? packageJsonFile.name : 'Select...' }}</span>
          <button v-if="packageJsonFile" class="file-remove" @click.prevent="removeFile('package')">×</button>
        </label>
      </div>

      <div class="file-field">
        <label class="field-label">Lockfile <span class="optional">(optional)</span></label>
        <label class="file-picker" :class="{ selected: lockfileFile }">
          <input type="file" accept=".json,.yaml,.yml" class="file-input" @change="onFileInput($event, 'lockfile')" />
          <span class="file-icon">{{ lockfileFile ? '✓' : '+' }}</span>
          <span class="file-name">{{ lockfileFile ? lockfileFile.name : 'Select...' }}</span>
          <button v-if="lockfileFile" class="file-remove" @click.prevent="removeFile('lockfile')">×</button>
        </label>
      </div>
    </div>

    <button class="btn-primary analyze-btn" :disabled="!packageJsonFile" @click="handleAnalyze">
      Analyze Dependencies
    </button>
  </div>
</template>

<style scoped>
.upload-wrap {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.drop-zone {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  padding: 20px 16px;
  border: 1px dashed var(--border);
  border-radius: 8px;
  background: var(--surface-2);
  color: var(--muted);
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
}
.drop-zone:hover,
.drop-zone.dragging {
  border-color: var(--accent);
  background: var(--accent-dim);
  color: var(--text);
}
.drop-text {
  font-size: 12px;
  font-weight: 500;
  color: var(--text);
}
.drop-hint {
  font-size: 11px;
  color: var(--muted);
  text-align: center;
  font-family: 'JetBrains Mono', monospace;
}

.file-fields {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.file-field {
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.required {
  color: var(--accent);
}
.optional {
  color: var(--muted);
  font-weight: 400;
}
.file-picker {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 7px 10px;
  background: var(--surface-3);
  border: 1px solid var(--border);
  border-radius: 6px;
  cursor: pointer;
  transition: border-color 0.15s;
  overflow: hidden;
}
.file-picker:hover {
  border-color: var(--muted);
}
.file-picker.selected {
  border-color: var(--accent-border);
  background: var(--accent-dim);
}
.file-input {
  display: none;
}
.file-icon {
  font-size: 11px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--surface-2);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--accent);
  font-weight: 700;
  flex-shrink: 0;
  border: 1px solid var(--border);
}
.file-picker.selected .file-icon {
  background: var(--accent);
  color: #fff;
  border-color: var(--accent);
}
.file-name {
  flex: 1;
  font-size: 12px;
  color: var(--muted);
  font-family: 'JetBrains Mono', monospace;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.file-picker.selected .file-name {
  color: var(--text-bright);
}
.file-remove {
  font-size: 12px;
  color: var(--muted);
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0 2px;
  flex-shrink: 0;
  line-height: 1;
}
.file-remove:hover {
  color: var(--text-bright);
}

.analyze-btn {
  width: 100%;
  padding: 9px 16px;
  font-size: 13px;
}
</style>
