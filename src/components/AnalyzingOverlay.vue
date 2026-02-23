<script setup lang="ts">
import { ref } from 'vue'

const nodes = [
  { cx: 400, cy: 220, r: 10, delay: 0 },
  { cx: 240, cy: 340, r: 7,  delay: 0.2 },
  { cx: 560, cy: 340, r: 7,  delay: 0.4 },
  { cx: 160, cy: 460, r: 5,  delay: 0.6 },
  { cx: 320, cy: 460, r: 5,  delay: 0.8 },
  { cx: 480, cy: 460, r: 5,  delay: 1.0 },
  { cx: 640, cy: 460, r: 5,  delay: 1.2 },
  { cx: 120, cy: 560, r: 4,  delay: 1.4 },
  { cx: 200, cy: 560, r: 4,  delay: 1.6 },
  { cx: 360, cy: 560, r: 4,  delay: 1.8 },
  { cx: 520, cy: 560, r: 4,  delay: 2.0 },
  { cx: 680, cy: 560, r: 4,  delay: 2.2 },
]

const edges: [number, number][] = [
  [0, 1], [0, 2],
  [1, 3], [1, 4],
  [2, 5], [2, 6],
  [3, 7], [3, 8],
  [4, 9],
  [5, 10],
  [6, 11],
]

const exiting = ref(false)

defineExpose({
  async fadeOut() {
    exiting.value = true
    await new Promise(r => setTimeout(r, 400))
  },
})
</script>

<template>
  <Teleport to="body">
    <div class="overlay" :class="{ exiting }">
      <div class="overlay-inner">
        <svg class="graph-svg" viewBox="0 0 800 700" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="node-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stop-color="#a5b4fc" stop-opacity="0.7" />
              <stop offset="100%" stop-color="#818cf8" stop-opacity="0" />
            </radialGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <g class="edges-group">
            <line
              v-for="(edge, i) in edges"
              :key="i"
              :x1="nodes[edge[0]]!.cx"
              :y1="nodes[edge[0]]!.cy"
              :x2="nodes[edge[1]]!.cx"
              :y2="nodes[edge[1]]!.cy"
              class="edge-line"
              :style="{ animationDelay: `${nodes[edge[1]]!.delay}s` }"
            />
          </g>

          <g class="nodes-group">
            <g v-for="(n, i) in nodes" :key="i" :style="{ animationDelay: `${n.delay}s` }" class="node-g">
              <circle
                :cx="n.cx"
                :cy="n.cy"
                :r="n.r * 4"
                fill="url(#node-glow)"
                class="node-halo"
                :style="{ animationDelay: `${n.delay}s` }"
              />
              <circle
                :cx="n.cx"
                :cy="n.cy"
                :r="n.r"
                class="node-circle"
                filter="url(#glow)"
                :style="{ animationDelay: `${n.delay}s` }"
              />
            </g>
          </g>

          <g class="scan-group">
            <line x1="0" y1="0" x2="800" y2="0" class="scan-line" />
          </g>
        </svg>

        <div class="text-area">
          <span class="label-analyzing">Analyzing</span><span class="dot-anim">
            <span class="dot" style="animation-delay:0s">.</span>
            <span class="dot" style="animation-delay:0.2s">.</span>
            <span class="dot" style="animation-delay:0.4s">.</span>
          </span>
          <p class="label-sub">Building dependency tree</p>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background:
    radial-gradient(ellipse 80% 60% at 50% 40%, rgba(99, 102, 241, 0.12) 0%, transparent 70%),
    radial-gradient(ellipse 60% 50% at 20% 80%, rgba(129, 140, 248, 0.07) 0%, transparent 60%),
    linear-gradient(160deg, #07080f 0%, #0d0f1e 50%, #080a14 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  animation: overlay-fade-in 0.4s ease;
  overflow: hidden;
  transition: opacity 0.4s ease;
}

.overlay.exiting {
  opacity: 0;
}

.overlay::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(99, 102, 241, 0.06) 1px, transparent 1px),
    linear-gradient(90deg, rgba(99, 102, 241, 0.06) 1px, transparent 1px);
  background-size: 48px 48px;
  mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 80%);
}

.overlay::after {
  content: '';
  position: absolute;
  inset: 0;
  border: 1px solid rgba(99, 102, 241, 0.08);
  pointer-events: none;
}

@keyframes overlay-fade-in {
  from { opacity: 0; transform: scale(1.01); }
  to   { opacity: 1; transform: scale(1); }
}

.overlay-inner {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 28px;
  user-select: none;
}

.graph-svg {
  width: min(480px, 88vw);
  height: auto;
  overflow: visible;
}

.edge-line {
  stroke: #a5b4fc;
  stroke-width: 1.5;
  stroke-opacity: 0;
  animation: edge-appear 0.7s ease forwards;
}

@keyframes edge-appear {
  from { stroke-opacity: 0; stroke-dashoffset: 60; stroke-dasharray: 60; }
  to   { stroke-opacity: 0.55; stroke-dashoffset: 0; stroke-dasharray: 60; }
}

.node-circle {
  fill: #818cf8;
  opacity: 0;
  animation: node-pop 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) forwards, node-pulse 3s ease-in-out infinite;
}

@keyframes node-pop {
  from { opacity: 0; transform-origin: center; transform: scale(0.1); }
  to   { opacity: 1; transform-origin: center; transform: scale(1); }
}

@keyframes node-pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.5; }
}

.node-halo {
  opacity: 0;
  animation: halo-in 0.7s ease forwards, halo-pulse 3s ease-in-out infinite;
}

@keyframes halo-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}

@keyframes halo-pulse {
  0%, 100% { opacity: 0.8; }
  50%       { opacity: 0.25; }
}

.scan-line {
  stroke: #c7d2fe;
  stroke-width: 1.5;
  stroke-opacity: 0;
  filter: drop-shadow(0 0 6px #818cf8);
  animation: scan-down 2.2s cubic-bezier(0.4, 0, 0.6, 1) infinite 1.0s;
}

@keyframes scan-down {
  0%   { transform: translateY(140px); opacity: 0; }
  10%  { opacity: 0.8; }
  85%  { transform: translateY(640px); opacity: 0.4; }
  100% { transform: translateY(640px); opacity: 0; }
}

.text-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.label-analyzing {
  font-size: 24px;
  font-weight: 700;
  color: #e2e8f0;
  letter-spacing: 0.06em;
  font-family: 'JetBrains Mono', monospace;
  text-shadow: 0 0 24px rgba(129, 140, 248, 0.5);
}

.dot-anim {
  display: inline-flex;
  font-size: 24px;
  font-weight: 700;
  color: #a5b4fc;
  font-family: 'JetBrains Mono', monospace;
  margin-left: 2px;
}

.dot {
  animation: dot-blink 1.1s ease-in-out infinite;
  display: inline-block;
}

@keyframes dot-blink {
  0%, 75%, 100% { opacity: 0; transform: translateY(0); }
  40%            { opacity: 1; transform: translateY(-4px); }
}

.label-sub {
  font-size: 11px;
  color: #818cf8;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  font-family: 'JetBrains Mono', monospace;
  animation: sub-fade 2s ease-in-out infinite alternate;
  text-shadow: 0 0 12px rgba(129, 140, 248, 0.4);
}

@keyframes sub-fade {
  from { opacity: 0.3; }
  to   { opacity: 1; }
}
</style>
