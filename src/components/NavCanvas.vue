<template>
  <div class="nav-canvas-wrap" :style="{ height }">
    <div ref="containerEl" class="nav-canvas" />
    <!-- 状态指示器：便于确认数据链路与排查渲染 -->
    <div class="nav-canvas__status">
      <el-tag size="small" :type="mapReady ? 'success' : 'warning'">
        地图{{ mapReady ? '已就绪' : '初始化中' }}
      </el-tag>
      <el-tag size="small">节点 {{ nodeCount }}</el-tag>
      <el-tag size="small">边 {{ edgeCount }}</el-tag>
      <el-tag v-if="!floorImage?.url" size="small" type="info">无平面图底图</el-tag>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

import type { Calibration } from '@/types/file'
import type { FloorConnect, NavEdge, NavNode, RouteVO } from '@/types/nav'
import { resolveStaticUrl } from '@/utils/resolveStaticUrl'

const props = defineProps<{
  nodes: NavNode[]
  edges: NavEdge[]
  connects: FloorConnect[]
  floorImage?: { url: string; calibration?: Calibration | null }
  /** 当前工具模式 */
  tool: 'select' | 'create-node' | 'create-edge' | 'connect-floor' | 'delete' | 'route'
  selected: { type: 'node' | 'edge' | 'connect'; id: number } | null
  route?: RouteVO | null
  /** 请求视野跟随到某米制坐标（如新建节点后） */
  focus?: { x: number; y: number } | null
  height?: string
}>()

const emit = defineEmits<{
  (e: 'canvas-click', pos: { x: number; y: number }): void
  (e: 'node-click', nodeId: number): void
  (e: 'edge-click', edgeId: number): void
  (e: 'node-drag', payload: { id: number; x: number; y: number }): void
}>()

const containerEl = ref<HTMLDivElement | null>(null)
let map: L.Map | null = null
const mapReady = ref(false)
const nodeCount = computed(() => displayNodes.value.filter((n) => nodeCoord(n)).length)
const edgeCount = computed(() => props.edges.length)

/** 画布渲染用节点副本：拖拽时直接改本地坐标，不触碰 props */
const displayNodes = ref<NavNode[]>([])
watch(
  () => props.nodes,
  (v) => {
    displayNodes.value = v.map((n) => ({ ...n }))
  },
  { immediate: true },
)

/**
 * Leaflet CRS.Simple：米制坐标 (x, y) 直接映射到地图 [lat=y, lng=x]。
 * CRS.Simple 的 y 轴向下（与屏幕一致），楼层米制 y 向下（M2 标定 my=py*scaleY+offsetY，
 * scaleY>0 时随像素增大），与图片方向一致、不翻转。
 */
function toLatLng(x: number, y: number): [number, number] {
  return [y, x]
}

/** 节点 -> 米制坐标（解析 geom GeoJSON Point） */
function nodeCoord(n: NavNode): [number, number] | null {
  if (!n.geom) return null
  try {
    const g = JSON.parse(n.geom)
    if (g.type === 'Point') return [g.coordinates[0], g.coordinates[1]]
  } catch {
    // 忽略坏几何
  }
  return null
}

/** 节点类型 -> 颜色 */
function nodeColor(nodeType?: string): string {
  switch (nodeType) {
    case 'ELEVATOR':
    case 'ESCALATOR':
    case 'STAIR':
      return '#f56c6c'
    case 'DOOR':
      return '#e6a23c'
    case 'SPACE_ENTRY':
      return '#67c23a'
    case 'SHOP_ENTRY':
    case 'POI_ENTRY':
      return '#409eff'
    case 'JUNCTION':
      return '#303133'
    default:
      return '#909399'
  }
}

/* ---------- 图层 ---------- */
let imageLayer: L.ImageOverlay | null = null
let edgeLayer: L.LayerGroup | null = null
let connectLayer: L.LayerGroup | null = null
let nodeLayer: L.LayerGroup | null = null
let routeLayer: L.LayerGroup | null = null
let selEdgeLayer: L.LayerGroup | null = null

function setupImageSource() {
  if (!map) return
  if (imageLayer) {
    imageLayer.remove()
    imageLayer = null
  }
  const img = props.floorImage
  if (!img || !img.url) return
  const url = resolveStaticUrl(img.url)
  const cal = img.calibration
  const sx = cal?.scaleX ?? 1
  const sy = cal?.scaleY ?? 1
  const ox = cal?.offsetX ?? 0
  const oy = cal?.offsetY ?? 0
  // 有标定时按标定偏移铺图（图片像素 -> 米制）；无标定时按像素=米显示
  const w = cal ? 100 / (sx || 1) : 1000
  const h = cal ? 100 / (sy || 1) : 800
  const bounds: L.LatLngBoundsExpression = [
    [oy, ox],
    [oy + h * sy, ox + w * sx],
  ]
  imageLayer = L.imageOverlay(url, bounds, { opacity: 1, interactive: false }).addTo(map)
}

function renderNodes() {
  if (!map) return
  if (nodeLayer) {
    nodeLayer.clearLayers()
  } else {
    nodeLayer = L.layerGroup().addTo(map)
  }
  for (const n of displayNodes.value) {
    const c = nodeCoord(n)
    if (!c) continue
    const [y, x] = toLatLng(c[0], c[1])
    const isSel = props.selected?.type === 'node' && props.selected.id === n.id
    const size = isSel ? 16 : 12
    const color = nodeColor(n.nodeType)
    const icon = L.divIcon({
      className: 'nav-node-marker',
      html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};border:${isSel ? 3 : 1.5}px solid ${isSel ? '#ff0000' : '#ffffff'};box-shadow:0 0 2px rgba(0,0,0,.4);"></div>`,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    })
    const marker = L.marker([y, x], {
      icon,
      draggable: props.tool === 'select',
    })
    marker.on('click', (e) => {
      L.DomEvent.stopPropagation(e)
      emit('node-click', n.id)
    })
    marker.on('dragend', () => {
      const ll = marker.getLatLng()
      emit('node-drag', { id: n.id, x: ll.lng, y: ll.lat })
      const node = displayNodes.value.find((z) => z.id === n.id)
      if (node) {
        node.geom = JSON.stringify({ type: 'Point', coordinates: [ll.lng, ll.lat] })
      }
    })
    marker.bindTooltip(n.name || `#${n.id}`, { direction: 'top', offset: [0, -10] })
    marker.addTo(nodeLayer)
  }
}

function renderEdges() {
  if (!map) return
  if (edgeLayer) edgeLayer.clearLayers()
  else edgeLayer = L.layerGroup().addTo(map)
  if (selEdgeLayer) selEdgeLayer.clearLayers()
  else selEdgeLayer = L.layerGroup().addTo(map)
  const byId = new Map(displayNodes.value.map((n) => [n.id, n]))
  for (const e of props.edges) {
    const a = byId.get(e.fromNodeId)
    const b = byId.get(e.toNodeId)
    const ca = a ? nodeCoord(a) : null
    const cb = b ? nodeCoord(b) : null
    if (!ca || !cb) continue
    const isSel = props.selected?.type === 'edge' && props.selected.id === e.id
    const line = L.polyline([toLatLng(ca[0], ca[1]), toLatLng(cb[0], cb[1])], {
      color: isSel ? '#ff0000' : '#8c8c8c',
      weight: isSel ? 4 : 2.5,
      interactive: true,
    })
    line.on('click', (ev) => {
      L.DomEvent.stopPropagation(ev)
      emit('edge-click', e.id)
    })
    line.addTo(isSel ? selEdgeLayer : edgeLayer)
  }
}

function renderConnects() {
  if (!map) return
  if (connectLayer) connectLayer.clearLayers()
  else connectLayer = L.layerGroup().addTo(map)
  const byId = new Map(displayNodes.value.map((n) => [n.id, n]))
  for (const c of props.connects) {
    const n = byId.get(c.fromNodeId)
    const coord = n ? nodeCoord(n) : null
    if (!coord) continue
    const [y, x] = toLatLng(coord[0], coord[1])
    L.polyline(
      [
        [y, x],
        [y + 4, x + 4],
      ],
      { color: '#9254de', weight: 3, dashArray: '4 6', interactive: false },
    ).addTo(connectLayer)
  }
}

function renderRoute() {
  if (!map) return
  if (routeLayer) routeLayer.clearLayers()
  else routeLayer = L.layerGroup().addTo(map)
  if (!props.route) return
  const byId = new Map(displayNodes.value.map((n) => [n.id, n]))
  const latlngs: [number, number][] = []
  for (const id of props.route.nodeIds) {
    const n = byId.get(id)
    const c = n ? nodeCoord(n) : null
    if (c) latlngs.push(toLatLng(c[0], c[1]))
  }
  if (latlngs.length >= 2) {
    L.polyline(latlngs, { color: '#13c2c2', weight: 5, interactive: false }).addTo(routeLayer)
  }
}

function updateAll() {
  if (!map) return
  renderEdges()
  renderConnects()
  renderNodes()
  renderRoute()
}

function fitToData() {
  if (!map) return
  const latlngs: [number, number][] = []
  for (const n of displayNodes.value) {
    const c = nodeCoord(n)
    if (c) latlngs.push(toLatLng(c[0], c[1]))
  }
  const img = props.floorImage
  if (img?.calibration) {
    const cal = img.calibration
    latlngs.push(toLatLng(cal.offsetX, cal.offsetY))
    latlngs.push(toLatLng(cal.offsetX + 60, cal.offsetY + 60))
  }
  if (!latlngs.length) {
    latlngs.push(toLatLng(0, 0))
    latlngs.push(toLatLng(100, 100))
  }
  map.fitBounds(L.latLngBounds(latlngs), { padding: [40, 40], maxZoom: 4 })
}

/** 首次有节点数据时自动 fit（避免空视野） */
let fittedOnce = false
function maybeFit() {
  if (!fittedOnce && displayNodes.value.some((n) => nodeCoord(n)) && map) {
    fittedOnce = true
    fitToData()
  }
}

onMounted(() => {
  if (!containerEl.value) return
  map = L.map(containerEl.value, {
    crs: L.CRS.Simple,
    zoomControl: true,
    attributionControl: false,
  })
  map.setView(toLatLng(50, 50), 0)
  map.on('click', (e: L.LeafletMouseEvent) => {
    emit('canvas-click', { x: e.latlng.lng, y: e.latlng.lat })
  })
  // CRS.Simple 下初始 bounds 较大，先 fit 到底图/默认范围
  fitToData()
  mapReady.value = true
})

onUnmounted(() => {
  map?.remove()
  map = null
})

watch(
  () => props.floorImage,
  () => {
    if (map) setupImageSource()
  },
  { deep: true },
)

watch(
  () => [props.nodes, props.edges, props.connects, props.route, props.selected],
  () => {
    updateAll()
    maybeFit()
  },
  { deep: true },
)

/** 外部请求视野跟随（如新建节点后飞到新节点） */
watch(
  () => props.focus,
  (f) => {
    if (f && map) {
      map.setView(toLatLng(f.x, f.y), Math.max(map.getZoom(), 2), { animate: true })
    }
  },
)
</script>

<style scoped>
.nav-canvas-wrap {
  width: 100%;
  position: relative;
}

.nav-canvas {
  width: 100%;
  height: 100%;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  overflow: hidden;
  background: #f2f3f5;
}

.nav-canvas__status {
  position: absolute;
  top: 8px;
  left: 8px;
  display: flex;
  gap: 6px;
  z-index: 400;
  pointer-events: none;
}
</style>
