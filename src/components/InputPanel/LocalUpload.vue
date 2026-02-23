<script setup lang="ts">
import { ref } from 'vue'

const emit = defineEmits<{
  analyze: [packageJsonFile: File, lockfileFile: File | null]
}>()

const isDragging = ref(false)
const packageJsonFile = ref<File | null>(null)
const lockfileFile = ref<File | null>(null)

const lockfileNames = ['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', 'pnpm-lock.yml']

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
  <div class="space-y-4">
    <!-- ドロップゾーン -->
    <div
      class="rounded-xl border-2 border-dashed p-8 text-center transition-colors cursor-pointer"
      :style="{
        borderColor: isDragging ? 'var(--color-accent)' : 'var(--color-border)',
        background: isDragging ? 'rgba(99,102,241,0.05)' : 'transparent',
      }"
      @dragover.prevent="isDragging = true"
      @dragleave="isDragging = false"
      @drop.prevent="onDrop"
    >
      <div class="text-3xl mb-2">📦</div>
      <p class="text-sm" style="color: var(--color-muted)">ファイルをドラッグ＆ドロップ</p>
      <p class="text-xs mt-1" style="color: var(--color-muted)">
        package.json・package-lock.json・yarn.lock・pnpm-lock.yaml
      </p>
    </div>

    <!-- ファイル選択ボタン -->
    <div class="grid grid-cols-2 gap-3">
      <!-- package.json -->
      <div>
        <label
          class="flex flex-col items-center gap-1.5 p-3 rounded-lg cursor-pointer transition-colors text-center"
          :style="{
            background: packageJsonFile ? 'rgba(99,102,241,0.1)' : 'var(--color-surface-2)',
            border: packageJsonFile ? '1px solid var(--color-accent)' : '1px solid var(--color-border)',
          }"
        >
          <input type="file" accept=".json" class="hidden" @change="onFileInput($event, 'package')" />
          <span class="text-lg">{{ packageJsonFile ? '✅' : '📄' }}</span>
          <span
            class="text-xs font-mono truncate w-full"
            :style="{ color: packageJsonFile ? 'var(--color-accent)' : 'var(--color-muted)' }"
          >
            {{ packageJsonFile ? packageJsonFile.name : 'package.json' }}
          </span>
        </label>
        <button
          v-if="packageJsonFile"
          class="w-full text-xs mt-1 cursor-pointer"
          style="color: var(--color-muted)"
          @click="removeFile('package')"
        >
          × 削除
        </button>
      </div>

      <!-- lockfile -->
      <div>
        <label
          class="flex flex-col items-center gap-1.5 p-3 rounded-lg cursor-pointer transition-colors text-center"
          :style="{
            background: lockfileFile ? 'rgba(99,102,241,0.1)' : 'var(--color-surface-2)',
            border: lockfileFile ? '1px solid var(--color-accent)' : '1px solid var(--color-border)',
          }"
        >
          <input type="file" accept=".json,.yaml,.yml" class="hidden" @change="onFileInput($event, 'lockfile')" />
          <span class="text-lg">{{ lockfileFile ? '✅' : '🔒' }}</span>
          <span
            class="text-xs font-mono truncate w-full"
            :style="{ color: lockfileFile ? 'var(--color-accent)' : 'var(--color-muted)' }"
          >
            {{ lockfileFile ? lockfileFile.name : 'ロックファイル (任意)' }}
          </span>
        </label>
        <button
          v-if="lockfileFile"
          class="w-full text-xs mt-1 cursor-pointer"
          style="color: var(--color-muted)"
          @click="removeFile('lockfile')"
        >
          × 削除
        </button>
      </div>
    </div>

    <!-- 解析ボタン -->
    <button
      class="w-full py-2.5 rounded-lg font-medium text-sm transition-all cursor-pointer disabled:opacity-40"
      :style="{
        background: packageJsonFile ? 'var(--color-accent)' : 'var(--color-surface-2)',
        color: packageJsonFile ? '#fff' : 'var(--color-muted)',
      }"
      :disabled="!packageJsonFile"
      @click="handleAnalyze"
    >
      依存関係を解析する →
    </button>
  </div>
</template>
