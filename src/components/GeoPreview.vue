<template>
  <div class="geo-preview" :style="{ height }">
    <svg
      v-if="hasGeometry"
      ref="svgEl"
      class="geo-preview__svg"
      :viewBox="`0 0 ${size.w} ${size.h}`"
      preserveAspectRatio="none"
    >
      <g v-for="(g, gi) in geometries" :key="gi">
        <polygon
          v-if="g.type === 'Polygon'"
          :points="polygonPoints(g)"
          fill="rgba(47, 107, 176, 0.22)"
          stroke="#2f6bb0"
          stroke-width="2"
        />
        <polyline
          v-else-if="g.type === 'LineString'"
          :points="polylinePoints(g)"
          fill="none"
          stroke="#2f6bb0"
          stroke-width="2"
        />
        <circle
          v-else-if="g.type === 'Point'"
          :cx="toSvgX((g.coordinates as number[])[0])"
          :cy="toSvgY((g.coordinates as number[])[1])"
          r="6"
          fill="#f56c6c"
          stroke="#fff"
          stroke-width="1.5"
        />
      </g>
    </svg>
    <el-empty v-else description="暂无几何数据" :image-size="60" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'

import type { GeoJsonGeometry } from '@/types/file'
import { fitTransform, geometryToPoints, parseGeometry, pointsBounds } from '@/utils/geo'

const props = defineProps<{
  /** 单个几何（对象/JSON 字符串）或几何数组 */
  geojson?: unknown
  height?: string
}>()

const svgEl = ref<SVGSVGElement | null>(null)
const size = ref({ w: 800, h: 600 })
let observer: ResizeObserver | null = null

function updateSize() {
  if (svgEl.value) {
    size.value = {
      w: svgEl.value.clientWidth || 800,
      h: svgEl.value.clientHeight || 600,
    }
  }
}

onMounted(() => {
  updateSize()
  observer = new ResizeObserver(updateSize)
  if (svgEl.value) observer.observe(svgEl.value)
})
onUnmounted(() => observer?.disconnect())

const geometries = computed<GeoJsonGeometry[]>(() => {
  const input = props.geojson
  if (!input) return []
  if (Array.isArray(input)) {
    return input
      .map((g) => parseGeometry(g))
      .filter((g): g is GeoJsonGeometry => g !== null)
  }
  const g = parseGeometry(input)
  return g ? [g] : []
})

const hasGeometry = computed(() => geometries.value.length > 0)

/** 统一包围盒 + 缩放变换（所有几何共用同一套映射） */
const view = computed(() => {
  const pts = geometries.value.flatMap((g) => geometryToPoints(g))
  const bounds = pointsBounds(pts)
  const t = fitTransform(bounds, size.value.w, size.value.h, 30)
  return { bounds, ...t }
})

function toSvgX(x: number) {
  return view.value.ox + (x - view.value.bounds.minX) * view.value.s
}
function toSvgY(y: number) {
  return view.value.oy + (y - view.value.bounds.minY) * view.value.s
}

function polygonPoints(g: GeoJsonGeometry) {
  const ring = (g.coordinates as number[][][])[0] ?? []
  return ring.map((c) => `${toSvgX(c[0])},${toSvgY(c[1])}`).join(' ')
}
function polylinePoints(g: GeoJsonGeometry) {
  const line = g.coordinates as number[][]
  return line.map((c) => `${toSvgX(c[0])},${toSvgY(c[1])}`).join(' ')
}
</script>

<style scoped>
.geo-preview {
  width: 100%;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  background: #fafafa;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.geo-preview__svg {
  width: 100%;
  height: 100%;
  display: block;
  cursor: default;
}
</style>
