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
  <div class="space-y-4">
    <div>
      <label class="block text-xs mb-1.5" style="color: var(--color-muted)">
        GitHub リポジトリ URL または owner/repo
      </label>
      <div class="flex gap-2">
        <input
          v-model="input"
          type="text"
          placeholder="例: facebook/react"
          class="flex-1 px-3 py-2 rounded-lg text-sm outline-none transition-colors font-mono"
          style="background: var(--color-surface-2); border: 1px solid var(--color-border); color: var(--color-text)"
          @keydown.enter="handleAnalyze"
        />
        <button
          class="px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer disabled:opacity-40"
          :style="{
            background: input.trim() ? 'var(--color-accent)' : 'var(--color-surface-2)',
            color: input.trim() ? '#fff' : 'var(--color-muted)',
          }"
          :disabled="!input.trim()"
          @click="handleAnalyze"
        >
          解析
        </button>
      </div>
    </div>

    <!-- ブランチ指定の説明 -->
    <p class="text-xs" style="color: var(--color-muted)">
      ブランチ指定: <code class="px-1 rounded" style="background: var(--color-surface-2)">owner/repo@branch</code>
      &nbsp;または&nbsp;
      <code class="px-1 rounded" style="background: var(--color-surface-2)"
        >https://github.com/owner/repo/tree/branch</code
      >
    </p>

    <!-- サンプルリポジトリ -->
    <div>
      <p class="text-xs mb-1.5" style="color: var(--color-muted)">サンプル:</p>
      <div class="flex gap-2 flex-wrap">
        <button
          v-for="ex in examples"
          :key="ex"
          class="px-2 py-1 rounded text-xs font-mono cursor-pointer transition-colors"
          style="background: var(--color-surface-2); color: var(--color-muted); border: 1px solid var(--color-border)"
          @click="fillExample(ex)"
        >
          {{ ex }}
        </button>
      </div>
    </div>

    <!-- 公開リポジトリのみの注意 -->
    <div
      class="flex items-start gap-2 p-3 rounded-lg text-xs"
      style="background: rgba(99, 102, 241, 0.05); border: 1px solid rgba(99, 102, 241, 0.2)"
    >
      <span>ℹ️</span>
      <span style="color: var(--color-muted)">
        現在は <strong style="color: var(--color-text)">公開リポジトリのみ</strong> に対応しています。
        プライベートリポジトリはローカルアップロードをご利用ください。
      </span>
    </div>
  </div>
</template>
