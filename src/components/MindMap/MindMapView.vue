<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import * as d3 from 'd3'
import { useAnalysisStore } from '@/stores/analysis'
import type { PackageNode } from '@/types'

const props = defineProps<{
  root: PackageNode
}>()

const store = useAnalysisStore()
const svgRef = ref<SVGSVGElement | null>(null)
const containerRef = ref<HTMLDivElement | null>(null)

const MAX_DEPTH = ref(4)
const NODE_H = 28
const NODE_W = 200
const H_GAP = 240

const kindColor: Record<string, string> = {
  dependency: '#6366f1',
  devDependency: '#22d3ee',
  peerDependency: '#a78bfa',
  optionalDependency: '#f59e0b',
}

function buildHierarchy(node: PackageNode, depth = 0): d3.HierarchyNode<PackageNode> {
  const d3node = d3.hierarchy<PackageNode>(node, (n) => {
    if (depth >= MAX_DEPTH.value) return []
    return n.children
  })
  return d3node
}

let zoomBehavior: d3.ZoomBehavior<SVGSVGElement, unknown> | null = null

function draw() {
  const svgEl = svgRef.value
  const containerEl = containerRef.value
  if (!svgEl || !containerEl) return

  const H = containerEl.clientHeight || 600

  const root = buildHierarchy(props.root)

  const treeLayout = d3
    .tree<PackageNode>()
    .nodeSize([NODE_H, H_GAP])
    .separation((a, b) => (a.parent === b.parent ? 1.2 : 1.8))

  treeLayout(root)

  let minX = Infinity,
    minY = Infinity,
    maxY = -Infinity
  root.each((n) => {
    const nx = n.y ?? 0
    const ny = n.x ?? 0
    if (nx < minX) minX = nx
    if (ny < minY) minY = ny
    if (ny > maxY) maxY = ny
  })

  const svg = d3.select(svgEl)
  svg.selectAll('*').remove()
  svg.attr('width', '100%').attr('height', '100%')

  const g = svg.append('g').attr('class', 'zoom-group')

  zoomBehavior = d3
    .zoom<SVGSVGElement, unknown>()
    .scaleExtent([0.05, 3])
    .on('zoom', (event) => {
      g.attr('transform', event.transform)
    })

  svg.call(zoomBehavior)

  const initX = 60 - minX
  const initY = H / 2 - ((minY + maxY) / 2)
  const initTransform = d3.zoomIdentity.translate(initX, initY)
  svg.call(zoomBehavior.transform, initTransform)

  const linkGen = d3
    .linkHorizontal<d3.HierarchyLink<PackageNode>, d3.HierarchyPointNode<PackageNode>>()
    .x((d) => d.y ?? 0)
    .y((d) => d.x ?? 0)

  g.append('g')
    .attr('class', 'links')
    .selectAll('path')
    .data(root.links())
    .join('path')
    .attr('d', (d) => linkGen(d as d3.HierarchyLink<PackageNode> & { source: d3.HierarchyPointNode<PackageNode>; target: d3.HierarchyPointNode<PackageNode> }))
    .attr('fill', 'none')
    .attr('stroke', (d) => {
      const color = kindColor[(d.target as d3.HierarchyNode<PackageNode>).data.kind] ?? '#6366f1'
      return color + '55'
    })
    .attr('stroke-width', 1.5)

  const nodeG = g
    .append('g')
    .attr('class', 'nodes')
    .selectAll('g')
    .data(root.descendants())
    .join('g')
    .attr('transform', (d) => `translate(${d.y},${d.x})`)
    .attr('cursor', 'pointer')
    .on('click', (_event, d) => {
      const isSelected = store.selectedNode?.id === d.data.id
      store.selectNode(isSelected ? null : d.data)
    })

  const depth0 = '#e5e7eb'

  nodeG
    .append('rect')
    .attr('x', 4)
    .attr('y', -12)
    .attr('width', (d) => Math.min(d.data.name.length * 7.5 + 50, NODE_W - 4))
    .attr('height', 22)
    .attr('rx', 5)
    .attr('fill', (d) => {
      return d.depth === 0 ? '#6366f1' : (kindColor[d.data.kind] ?? '#6366f1') + '1a'
    })
    .attr('stroke', (d) => {
      return d.depth === 0 ? '#818cf8' : (kindColor[d.data.kind] ?? '#6366f1') + '55'
    })
    .attr('stroke-width', (d) => (d.depth === 0 ? 1.5 : 1))
    .attr('class', 'node-rect')

  nodeG
    .append('text')
    .attr('x', 12)
    .attr('y', 4)
    .attr('font-size', (d) => (d.depth === 0 ? '13px' : '11px'))
    .attr('font-family', "'JetBrains Mono', 'Fira Code', monospace")
    .attr('font-weight', (d) => (d.depth === 0 ? '700' : '400'))
    .attr('fill', (d) => (d.depth === 0 ? '#fff' : depth0))
    .attr('pointer-events', 'none')
    .text((d) => {
      const maxLen = 24
      return d.data.name.length > maxLen ? d.data.name.slice(0, maxLen) + '…' : d.data.name
    })

  nodeG
    .filter((d) => d.depth > 0)
    .append('text')
    .attr('x', (d) => Math.min(d.data.name.length * 7.5 + 16, NODE_W - 40))
    .attr('y', 4)
    .attr('font-size', '10px')
    .attr('font-family', "'JetBrains Mono', 'Fira Code', monospace")
    .attr('fill', '#6b7280')
    .attr('pointer-events', 'none')
    .text((d) => d.data.version)

  nodeG
    .filter((d) => d.data.children.length > 0 && (!d.children || d.children.length === 0))
    .append('g')
    .attr('transform', (d) => `translate(${Math.min(d.data.name.length * 7.5 + 50, NODE_W - 4) + 2}, -4)`)
    .call((sel) => {
      sel.append('circle').attr('r', 8).attr('fill', '#25262b').attr('stroke', '#373a40')
      sel
        .append('text')
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'central')
        .attr('font-size', '8px')
        .attr('fill', '#9ca3af')
        .text((d) => `+${d.data.children.length}`)
    })

  nodeG
    .filter((d) => d.data.isCircular)
    .append('text')
    .attr('x', -2)
    .attr('y', 4)
    .attr('font-size', '10px')
    .attr('fill', '#fb923c')
    .attr('pointer-events', 'none')
    .text('↺')

  applySelection()
}

function applySelection() {
  if (!svgRef.value) return
  const selectedId = store.selectedNode?.id
  d3.select(svgRef.value)
    .selectAll<SVGRectElement, d3.HierarchyNode<PackageNode>>('.node-rect')
    .attr('stroke', (d) => {
      if (d.data.id === selectedId) return '#818cf8'
      return d.depth === 0 ? '#818cf8' : (kindColor[d.data.kind] ?? '#6366f1') + '55'
    })
    .attr('stroke-width', (d) => {
      if (d.data.id === selectedId) return 2
      return d.depth === 0 ? 1.5 : 1
    })
    .attr('fill', (d) => {
      if (d.data.id === selectedId) return 'rgba(99,102,241,0.25)'
      return d.depth === 0 ? '#6366f1' : (kindColor[d.data.kind] ?? '#6366f1') + '1a'
    })
}

function resetZoom() {
  const svgEl = svgRef.value
  const containerEl = containerRef.value
  if (!svgEl || !containerEl || !zoomBehavior) return
  const H = containerEl.clientHeight || 600
  const root = buildHierarchy(props.root)
  const treeLayout = d3.tree<PackageNode>().nodeSize([NODE_H, H_GAP])
  treeLayout(root)
  let minX = Infinity, minY = Infinity, maxY = -Infinity
  root.each((n) => {
    if ((n.y ?? 0) < minX) minX = n.y ?? 0
    if ((n.x ?? 0) < minY) minY = n.x ?? 0
    if ((n.x ?? 0) > maxY) maxY = n.x ?? 0
  })
  const initX = 60 - minX
  const initY = H / 2 - ((minY + maxY) / 2)
  d3.select(svgEl)
    .transition()
    .duration(500)
    .call(zoomBehavior.transform, d3.zoomIdentity.translate(initX, initY))
}

onMounted(async () => {
  await nextTick()
  draw()
})

watch(() => [props.root, MAX_DEPTH.value], async () => {
  await nextTick()
  draw()
})

watch(() => store.selectedNode, () => {
  applySelection()
})

let resizeObs: ResizeObserver | null = null
onMounted(() => {
  if (!containerRef.value) return
  resizeObs = new ResizeObserver(() => draw())
  resizeObs.observe(containerRef.value)
})
onUnmounted(() => {
  resizeObs?.disconnect()
})

const searchQuery = computed(() => store.searchQuery)
watch(searchQuery, () => {
  if (!svgRef.value) return
  const q = searchQuery.value.toLowerCase()
  d3.select(svgRef.value)
    .selectAll<SVGTextElement, d3.HierarchyNode<PackageNode>>('.nodes text:first-of-type')
    .attr('fill', (d) => {
      if (q.length >= 2 && d.data.name.toLowerCase().includes(q)) return '#fde047'
      return d.depth === 0 ? '#fff' : '#e5e7eb'
    })
})
</script>

<template>
  <div class="mindmap-wrap" ref="containerRef">
    <div class="mm-toolbar">
      <span class="mm-stat">{{ store.result?.totalPackages ?? 0 }} packages</span>
      <div class="depth-ctrl">
        <span class="depth-label">Depth</span>
        <input
          v-model.number="MAX_DEPTH"
          type="range"
          min="1"
          max="8"
          class="depth-slider"
          @change="draw"
        />
        <span class="depth-val">{{ MAX_DEPTH }}</span>
      </div>
      <div style="flex:1"></div>
      <button class="btn-ghost btn-xs" @click="resetZoom">Center</button>
      <span class="mm-hint">Scroll: zoom &nbsp;|&nbsp; Drag: pan</span>
    </div>
    <svg ref="svgRef" class="mm-svg"></svg>
  </div>
</template>

<style scoped>
.mindmap-wrap {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  background: var(--bg);
  overflow: hidden;
}

.mm-toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 14px;
  height: 36px;
  background: var(--surface);
  border-bottom: 1px solid var(--border-light);
  flex-shrink: 0;
}
.mm-stat {
  font-size: 11px;
  color: var(--muted);
}
.depth-ctrl {
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
  width: 72px;
  accent-color: var(--accent);
  cursor: pointer;
}
.depth-val {
  font-size: 11px;
  font-family: 'JetBrains Mono', monospace;
  color: var(--text-bright);
  min-width: 14px;
}
.mm-hint {
  font-size: 10px;
  color: var(--muted);
  white-space: nowrap;
}

.mm-svg {
  flex: 1;
  width: 100%;
  height: 100%;
  display: block;
}

</style>

<style>
.mm-svg .links path {
  transition: stroke 0.15s;
}
.mm-svg .nodes g:hover .node-rect {
  filter: brightness(1.2);
}
</style>
