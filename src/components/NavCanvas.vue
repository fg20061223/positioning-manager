<template>
  <div ref="containerEl" class="nav-canvas" :style="{ height }" />
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import * as maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

import type { Calibration } from '@/types/file'
import type { FloorConnect, NavEdge, NavNode, RouteVO } from '@/types/nav'
import { resolveStaticUrl } from '@/utils/resolveStaticUrl'

/** 最小 GeoJSON 类型（避免依赖 geojson 包） */
interface GPoint {
  type: 'Point'
  coordinates: number[]
}
interface GLineString {
  type: 'LineString'
  coordinates: number[][]
}
interface GFeature {
  type: 'Feature'
  geometry: GPoint | GLineString
  properties: Record<string, unknown>
}
interface GFeatureCollection {
  type: 'FeatureCollection'
  features: GFeature[]
}

const props = defineProps<{
  nodes: NavNode[]
  edges: NavEdge[]
  connects: FloorConnect[]
  floorImage?: { url: string; calibration?: Calibration | null }
  /** 当前工具模式 */
  tool: 'select' | 'create-node' | 'create-edge' | 'connect-floor' | 'delete' | 'route'
  selected: { type: 'node' | 'edge' | 'connect'; id: number } | null
  route?: RouteVO | null
  height?: string
}>()

const emit = defineEmits<{
  (e: 'canvas-click', pos: { x: number; y: number }): void
  (e: 'node-click', nodeId: number): void
  (e: 'edge-click', edgeId: number): void
  (e: 'node-drag', payload: { id: number; x: number; y: number }): void
}>()

const containerEl = ref<HTMLDivElement | null>(null)
let map: maplibregl.Map | null = null

/** 画布渲染用节点副本：拖拽时直接改本地坐标，不触碰 props */
const displayNodes = ref<NavNode[]>([])
watch(
  () => props.nodes,
  (v) => {
    displayNodes.value = v.map((n) => ({ ...n }))
  },
  { immediate: true },
)

/** 米制坐标 -> MapLibre lng/lat（本地平面坐标直接映射，楼层范围小、畸变可忽略） */
function toLngLat(x: number, y: number): [number, number] {
  return [x, y]
}

/** 节点 -> 坐标（解析 geom GeoJSON Point） */
function nodeCoord(n: NavNode): [number, number] | null {
  if (!n.geom) return null
  try {
    const g = JSON.parse(n.geom)
    if (g.type === 'Point') return toLngLat(g.coordinates[0], g.coordinates[1])
  } catch {
    // 忽略坏几何
  }
  return null
}

function nodesGeoJson(): GFeatureCollection {
  return {
    type: 'FeatureCollection',
    features: displayNodes.value
      .map((n) => {
        const c = nodeCoord(n)
        if (!c) return null
        return {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: c },
          properties: { id: String(n.id), nodeType: n.nodeType, name: n.name ?? '' },
        } as GFeature
      })
      .filter((f): f is GFeature => f !== null),
  }
}

function edgesGeoJson(): GFeatureCollection {
  const byId = new Map(displayNodes.value.map((n) => [n.id, n]))
  const feats: GFeature[] = []
  for (const e of props.edges) {
    const a = byId.get(e.fromNodeId)
    const b = byId.get(e.toNodeId)
    const ca = a ? nodeCoord(a) : null
    const cb = b ? nodeCoord(b) : null
    if (!ca || !cb) continue
    feats.push({
      type: 'Feature',
      geometry: { type: 'LineString', coordinates: [ca, cb] },
      properties: { id: String(e.id) },
    } as GFeature)
  }
  return { type: 'FeatureCollection', features: feats }
}

/** 跨层连接：仅渲染本层端点出发的示意虚线 */
function connectsGeoJson(): GFeatureCollection {
  const byId = new Map(displayNodes.value.map((n) => [n.id, n]))
  const feats: GFeature[] = []
  for (const c of props.connects) {
    const n = byId.get(c.fromNodeId)
    const coord = n ? nodeCoord(n) : null
    if (!coord) continue
    feats.push({
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [coord, [coord[0] + 4, coord[1] + 4]],
      },
      properties: { id: String(c.id), connectType: c.connectType },
    } as GFeature)
  }
  return { type: 'FeatureCollection', features: feats }
}

function routeGeoJson(): GFeatureCollection {
  if (!props.route) return { type: 'FeatureCollection', features: [] }
  const byId = new Map(displayNodes.value.map((n) => [n.id, n]))
  const coords: [number, number][] = []
  for (const id of props.route.nodeIds) {
    const n = byId.get(id)
    const c = n ? nodeCoord(n) : null
    if (c) coords.push(c)
  }
  if (coords.length < 2) return { type: 'FeatureCollection', features: [] }
  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: { type: 'LineString', coordinates: coords },
        properties: {},
      } as GFeature,
    ],
  }
}

function selectedNode(): GFeatureCollection {
  if (!props.selected || props.selected.type !== 'node') {
    return { type: 'FeatureCollection', features: [] }
  }
  const n = displayNodes.value.find((x) => x.id === props.selected!.id)
  const c = n ? nodeCoord(n) : null
  if (!c) return { type: 'FeatureCollection', features: [] }
  return {
    type: 'FeatureCollection',
    features: [
      { type: 'Feature', geometry: { type: 'Point', coordinates: c }, properties: {} } as GFeature,
    ],
  }
}

function selectedEdge(): GFeatureCollection {
  if (!props.selected || props.selected.type !== 'edge') {
    return { type: 'FeatureCollection', features: [] }
  }
  const byId = new Map(displayNodes.value.map((n) => [n.id, n]))
  const e = props.edges.find((x) => x.id === props.selected!.id)
  const a = e ? byId.get(e.fromNodeId) : undefined
  const b = e ? byId.get(e.toNodeId) : undefined
  const ca = a ? nodeCoord(a) : null
  const cb = b ? nodeCoord(b) : null
  if (!ca || !cb) return { type: 'FeatureCollection', features: [] }
  return {
    type: 'FeatureCollection',
    features: [
      { type: 'Feature', geometry: { type: 'LineString', coordinates: [ca, cb] }, properties: {} } as GFeature,
    ],
  }
}

function fitToData() {
  if (!map) return
  const bounds = new maplibregl.LngLatBounds()
  let has = false
  for (const n of displayNodes.value) {
    const c = nodeCoord(n)
    if (c) {
      bounds.extend(c)
      has = true
    }
  }
  const img = props.floorImage
  if (img?.calibration) {
    const cal = img.calibration
    bounds.extend([cal.offsetX, cal.offsetY])
    bounds.extend([cal.offsetX + 60, cal.offsetY + 60])
    has = true
  }
  if (!has) {
    bounds.extend([0, 0])
    bounds.extend([100, 100])
  }
  map.fitBounds(bounds, { padding: 40, maxZoom: 19 })
}

function setupImageSource() {
  if (!map) return
  const img = props.floorImage
  if (!img || !img.url) {
    if (map.getSource('floor-image')) {
      map.removeLayer('floor-image')
      map.removeSource('floor-image')
    }
    return
  }
  const url = resolveStaticUrl(img.url)
  const cal = img.calibration
  // 无标定时按图片原始像素当米制（像素=米）显示
  const sx = cal?.scaleX ?? 1
  const sy = cal?.scaleY ?? 1
  const ox = cal?.offsetX ?? 0
  const oy = cal?.offsetY ?? 0
  // 有标定时以标定 offset 为左上角、100x100m 见方铺图（图片被拉伸铺满，比例由标定决定）
  const w = cal ? 100 / (sx || 1) : 1000
  const h = cal ? 100 / (sy || 1) : 800
  const topLeft: [number, number] = [ox, oy]
  const topRight: [number, number] = [ox + w * sx, oy]
  const bottomRight: [number, number] = [ox + w * sx, oy + h * sy]
  const bottomLeft: [number, number] = [ox, oy + h * sy]
  if (map.getSource('floor-image')) {
    ;(map.getSource('floor-image') as maplibregl.ImageSource).updateImage({
      url,
      coordinates: [topLeft, topRight, bottomRight, bottomLeft],
    })
  } else {
    map.addSource('floor-image', {
      type: 'image',
      url,
      coordinates: [topLeft, topRight, bottomRight, bottomLeft],
    })
    map.addLayer({
      id: 'floor-image',
      type: 'raster',
      source: 'floor-image',
    })
  }
}

function ensureSource(id: string, data: GFeatureCollection) {
  if (!map || !map.getSource(id)) return
  ;(map.getSource(id) as maplibregl.GeoJSONSource).setData(data)
}

function addLayers() {
  if (!map) return
  if (!map.getSource('edges')) {
    map.addSource('edges', { type: 'geojson', data: edgesGeoJson() })
    map.addLayer({
      id: 'edges',
      type: 'line',
      source: 'edges',
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': '#8c8c8c', 'line-width': 2.5 },
    })
    map.on('click', 'edges', (e) => {
      const id = e.features?.[0]?.properties?.id
      if (id != null) emit('edge-click', Number(id))
    })
  }
  if (!map.getSource('connects')) {
    map.addSource('connects', { type: 'geojson', data: connectsGeoJson() })
    map.addLayer({
      id: 'connects',
      type: 'line',
      source: 'connects',
      layout: { 'line-cap': 'round' },
      paint: { 'line-color': '#9254de', 'line-width': 3, 'line-dasharray': [2, 2] },
    })
  }
  if (!map.getSource('nodes')) {
    map.addSource('nodes', { type: 'geojson', data: nodesGeoJson() })
    map.addLayer({
      id: 'nodes',
      type: 'circle',
      source: 'nodes',
      paint: {
        'circle-radius': 6,
        'circle-color': [
          'match',
          ['get', 'nodeType'],
          'ELEVATOR', '#f56c6c',
          'ESCALATOR', '#f56c6c',
          'STAIR', '#f56c6c',
          'DOOR', '#e6a23c',
          'SPACE_ENTRY', '#67c23a',
          'SHOP_ENTRY', '#409eff',
          'POI_ENTRY', '#409eff',
          'JUNCTION', '#303133',
          '#909399',
        ],
        'circle-stroke-color': '#ffffff',
        'circle-stroke-width': 1.5,
      },
    })
    map.on('click', 'nodes', (e) => {
      const id = e.features?.[0]?.properties?.id
      if (id != null) emit('node-click', Number(id))
    })
    map.on('mousedown', 'nodes', onNodeMouseDown)
  }
  if (!map.getSource('route-line')) {
    map.addSource('route-line', { type: 'geojson', data: routeGeoJson() })
    map.addLayer({
      id: 'route-line',
      type: 'line',
      source: 'route-line',
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': '#13c2c2', 'line-width': 5 },
    })
  }
  if (!map.getSource('sel-node')) {
    map.addSource('sel-node', { type: 'geojson', data: selectedNode() })
    map.addLayer({
      id: 'sel-node',
      type: 'circle',
      source: 'sel-node',
      paint: {
        'circle-radius': 10,
        'circle-color': '#ff0000',
        'circle-stroke-color': '#ffffff',
        'circle-stroke-width': 2,
      },
    })
  }
  if (!map.getSource('sel-edge')) {
    map.addSource('sel-edge', { type: 'geojson', data: selectedEdge() })
    map.addLayer({
      id: 'sel-edge',
      type: 'line',
      source: 'sel-edge',
      layout: { 'line-cap': 'round' },
      paint: { 'line-color': '#ff0000', 'line-width': 4 },
    })
  }
}

function updateAll() {
  if (!map) return
  addLayers()
  ensureSource('edges', edgesGeoJson())
  ensureSource('connects', connectsGeoJson())
  ensureSource('nodes', nodesGeoJson())
  ensureSource('route-line', routeGeoJson())
  ensureSource('sel-node', selectedNode())
  ensureSource('sel-edge', selectedEdge())
}

/* ---------- 节点拖拽（select 模式下） ---------- */
let dragging: { id: number; moved: boolean } | null = null
let startPos: [number, number] = [0, 0]

function onNodeMouseDown(e: maplibregl.MapLayerMouseEvent) {
  if (props.tool !== 'select') return
  const id = e.features?.[0]?.properties?.id
  if (id == null) return
  dragging = { id: Number(id), moved: false }
  startPos = [e.lngLat.lng, e.lngLat.lat]
  if (map) map.getCanvas().style.cursor = 'grabbing'
  map?.on('mousemove', onDragMove)
  map?.on('mouseup', onDragEnd)
}

function onDragMove(e: maplibregl.MapMouseEvent) {
  if (!dragging || !map) return
  const dx = e.lngLat.lng - startPos[0]
  const dy = e.lngLat.lat - startPos[1]
  if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) dragging.moved = true
  const n = displayNodes.value.find((x) => x.id === dragging!.id)
  if (!n) return
  n.geom = JSON.stringify({ type: 'Point', coordinates: [e.lngLat.lng, e.lngLat.lat] })
  ensureSource('nodes', nodesGeoJson())
  ensureSource('sel-node', selectedNode())
}

function onDragEnd(e: maplibregl.MapMouseEvent) {
  if (!dragging || !map) return
  const payload = { id: dragging.id, x: e.lngLat.lng, y: e.lngLat.lat }
  const moved = dragging.moved
  dragging = null
  map.getCanvas().style.cursor = ''
  map.off('mousemove', onDragMove)
  map.off('mouseup', onDragEnd)
  if (moved) emit('node-drag', payload)
}

/* ---------- 空白处点击（新建节点等） ---------- */
function onMapClick(e: maplibregl.MapMouseEvent) {
  emit('canvas-click', { x: e.lngLat.lng, y: e.lngLat.lat })
}

function onMouseMove(e: maplibregl.MapMouseEvent) {
  if (!map) return
  const features = map.queryRenderedFeatures(e.point, { layers: ['nodes'] })
  const interactive =
    props.tool === 'select' ||
    props.tool === 'create-edge' ||
    props.tool === 'connect-floor' ||
    props.tool === 'route'
  map.getCanvas().style.cursor = features.length
    ? interactive
      ? 'pointer'
      : 'not-allowed'
    : 'crosshair'
}

onMounted(() => {
  if (!containerEl.value) return
  map = new maplibregl.Map({
    container: containerEl.value,
    style: { version: 8, sources: {}, layers: [] },
    center: [50, 50],
    zoom: 10,
    attributionControl: false,
  })
  map.on('load', () => {
    setupImageSource()
    addLayers()
    fitToData()
  })
  map.on('click', onMapClick)
  map.on('mousemove', onMouseMove)
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
  () => updateAll(),
  { deep: true },
)
</script>

<style scoped>
.nav-canvas {
  width: 100%;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  overflow: hidden;
  position: relative;
}
</style>
