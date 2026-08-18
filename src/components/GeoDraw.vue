<template>
  <div class="geo-draw" :style="{ height }">
    <div class="geo-draw__toolbar">
      <span class="geo-draw__hint">{{ hint }}</span>
      <el-button size="small" :disabled="points.length === 0" @click="undo">
        撤销
      </el-button>
      <el-button size="small" :disabled="points.length === 0" @click="clear">
        清空
      </el-button>
    </div>
    <svg
      ref="svgEl"
      class="geo-draw__svg"
      :viewBox="`0 0 ${size.w} ${size.h}`"
      preserveAspectRatio="none"
      @click="onSvgClick"
    >
      <polygon
        v-if="polygonClosed"
        :points="polygonPoints"
        fill="rgba(47, 107, 176, 0.22)"
        stroke="#2f6bb0"
        stroke-width="2"
      />
      <polyline
        v-if="lineVisible"
        :points="linePoints"
        fill="none"
        stroke="#2f6bb0"
        stroke-width="2"
        stroke-dasharray="6 4"
      />
      <circle
        v-for="(p, i) in points"
        :key="i"
        class="geo-draw__vertex"
        :cx="toSvgX(p.x)"
        :cy="toSvgY(p.y)"
        r="6"
        fill="#ffffff"
        stroke="#2f6bb0"
        stroke-width="2"
        @mousedown.stop="onVertexDown(i)"
        @click.stop
      />
    </svg>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'

import type { GeoJsonGeometry } from '@/types/file'
import {
  fitTransform,
  geometryToPoints,
  parseGeometry,
  pointsBounds,
  pointsToGeometry,
} from '@/utils/geo'

const props = defineProps<{
  /** 初始几何（对象/JSON 字符串），编辑过程中持续 v-model 回写 */
  modelValue?: unknown
  /** point=点 / line=线 / polygon=面 */
  geometryType?: 'point' | 'line' | 'polygon'
  height?: string
  hint?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: GeoJsonGeometry | null): void
}>()

const svgEl = ref<SVGSVGElement | null>(null)
const size = ref({ w: 800, h: 500 })
const points = ref<{ x: number; y: number }[]>([])
let emitting = false
let observer: ResizeObserver | null = null
let dragIndex: number | null = null

function updateSize() {
  if (svgEl.value) {
    size.value = {
      w: svgEl.value.clientWidth || 800,
      h: svgEl.value.clientHeight || 500,
    }
  }
}

onMounted(() => {
  points.value = geometryToPoints(parseGeometry(props.modelValue))
  updateSize()
  observer = new ResizeObserver(updateSize)
  if (svgEl.value) observer.observe(svgEl.value)
})
onUnmounted(() => {
  observer?.disconnect()
  endDrag()
})

// 外部回写（如打开对话框预填）时同步内部状态；自身 emit 时跳过避免抖动
watch(
  () => props.modelValue,
  (v) => {
    if (!emitting) points.value = geometryToPoints(parseGeometry(v))
  },
)

async function commit() {
  emitting = true
  emit('update:modelValue', pointsToGeometry(props.geometryType ?? 'polygon', points.value))
  await nextTick()
  emitting = false
}

const view = computed(() => {
  const bounds = pointsBounds(points.value)
  const t = fitTransform(bounds, size.value.w, size.value.h, 30)
  return { bounds, ...t }
})

function toSvgX(x: number) {
  return view.value.ox + (x - view.value.bounds.minX) * view.value.s
}
function toSvgY(y: number) {
  return view.value.oy + (y - view.value.bounds.minY) * view.value.s
}
function toMeter(clientX: number, clientY: number) {
  const rect = svgEl.value?.getBoundingClientRect()
  if (!rect || !rect.width || !rect.height) return { x: 0, y: 0 }
  const sx = ((clientX - rect.left) / rect.width) * size.value.w
  const sy = ((clientY - rect.top) / rect.height) * size.value.h
  return {
    x: view.value.bounds.minX + (sx - view.value.ox) / view.value.s,
    y: view.value.bounds.minY + (sy - view.value.oy) / view.value.s,
  }
}

function onSvgClick(e: MouseEvent) {
  const p = toMeter(e.clientX, e.clientY)
  if ((props.geometryType ?? 'polygon') === 'point') {
    points.value = [p]
  } else {
    points.value = [...points.value, p]
  }
  commit()
}

function onVertexDown(idx: number) {
  dragIndex = idx
  window.addEventListener('mousemove', onDragMove)
  window.addEventListener('mouseup', endDrag)
}
function onDragMove(e: MouseEvent) {
  if (dragIndex === null) return
  const p = toMeter(e.clientX, e.clientY)
  points.value = points.value.map((v, i) => (i === dragIndex ? p : v))
  commit()
}
function endDrag() {
  dragIndex = null
  window.removeEventListener('mousemove', onDragMove)
  window.removeEventListener('mouseup', endDrag)
}

function undo() {
  if (!points.value.length) return
  points.value = points.value.slice(0, -1)
  commit()
}
function clear() {
  points.value = []
  commit()
}

const polygonClosed = computed(
  () => (props.geometryType ?? 'polygon') === 'polygon' && points.value.length >= 3,
)
const lineVisible = computed(() => {
  const type = props.geometryType ?? 'polygon'
  if (type === 'point') return false
  return points.value.length >= 2
})
const polygonPoints = computed(() => {
  const ring = [...points.value, points.value[0]]
  return ring.map((p) => `${toSvgX(p.x)},${toSvgY(p.y)}`).join(' ')
})
const linePoints = computed(() =>
  points.value.map((p) => `${toSvgX(p.x)},${toSvgY(p.y)}`).join(' '),
)

const hint = computed(
  () =>
    props.hint ??
    (props.geometryType === 'point'
      ? '点击画布设置点位，拖拽顶点可移动'
      : '点击画布添加顶点，拖拽顶点可调整，至少 3 个点构成面'),
)
</script>

<style scoped>
.geo-draw {
  width: 100%;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  background: #fafafa;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.geo-draw__toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-bottom: 1px solid #ebeef5;
  background: #fff;
}

.geo-draw__hint {
  flex: 1;
  color: #909399;
  font-size: 12px;
}

.geo-draw__svg {
  flex: 1;
  width: 100%;
  cursor: crosshair;
}
</style>
