<template>
  <div class="floor-upload">
    <!-- 上传区 -->
    <el-upload
      drag
      :show-file-list="false"
      accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
      :http-request="doUpload"
      :disabled="uploading"
    >
      <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
      <div class="el-upload__text">拖拽平面图到此处，或 <em>点击上传</em></div>
      <template #tip>
        <div class="el-upload__tip">支持 png / jpg / webp / gif / svg，上传后经网关 /uploads 访问</div>
      </template>
    </el-upload>

    <!-- 预览 + 标定 -->
    <div v-if="displayUrl" class="floor-upload__calibration">
      <div class="floor-upload__img-wrap" @click="onImageClick">
        <img
          ref="imgEl"
          :src="displayUrl"
          alt="平面图预览"
          @load="onImageLoad"
        />
        <span
          v-for="i in ANCHOR_SLOTS"
          :key="i"
          v-show="anchors[i]"
          class="floor-upload__anchor"
          :class="{ active: activeAnchor === i + 1 }"
          :style="anchorStyle(i)"
        >
          {{ i + 1 }}
        </span>
        <div class="floor-upload__mask">点击图片放置标定点</div>
      </div>

      <div class="floor-upload__panel">
        <div class="floor-upload__anchor-btns">
          <el-radio-group v-model="activeAnchor" size="small">
            <el-radio-button :value="1">标定点 1</el-radio-button>
            <el-radio-button :value="2">标定点 2</el-radio-button>
          </el-radio-group>
        </div>

        <div v-for="i in 2" :key="i" class="floor-upload__anchor-inputs">
          <span class="floor-upload__anchor-label">点 {{ i }}</span>
          <el-input-number
            v-model="anchors[i - 1].mx"
            :controls="false"
            placeholder="米制X"
            size="small"
            style="width: 110px"
          />
          <el-input-number
            v-model="anchors[i - 1].my"
            :controls="false"
            placeholder="米制Y"
            size="small"
            style="width: 110px"
          />
          <span class="floor-upload__pixel-hint">
            {{ pixelHint(i - 1) }}
          </span>
        </div>

        <el-alert
          v-if="calibration"
          type="success"
          :closable="false"
          class="floor-upload__result"
        >
          <template #title>
            标定结果：X {{ calibration.scaleX.toFixed(4) }} 米/px、偏移
            {{ calibration.offsetX.toFixed(2) }}；Y {{ calibration.scaleY.toFixed(4) }}
            米/px、偏移 {{ calibration.offsetY.toFixed(2) }}
          </template>
        </el-alert>

        <div class="floor-upload__actions">
          <el-button size="small" :disabled="!calibration" @click="clearCalibration">
            清除标定
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { ElMessage, type UploadRequestOptions } from 'element-plus'
import { UploadFilled } from '@element-plus/icons-vue'

import { uploadFile } from '@/api/file'
import type { Calibration } from '@/types/file'
import { resolveStaticUrl } from '@/utils/resolveStaticUrl'

const props = defineProps<{
  imageUrl?: string
  calibration?: Calibration | null
}>()

const emit = defineEmits<{
  (e: 'update:imageUrl', value: string): void
  (e: 'update:calibration', value: Calibration | null): void
}>()

const ANCHOR_SLOTS = [0, 1] as const

const uploading = ref(false)
const imgEl = ref<HTMLImageElement | null>(null)
const naturalSize = reactive({ w: 1, h: 1 })
const activeAnchor = ref<1 | 2>(1)

interface Anchor {
  px: number | null
  py: number | null
  mx: number
  my: number
}
const anchors = ref<Anchor[]>([
  { px: null, py: null, mx: 0, my: 0 },
  { px: null, py: null, mx: 0, my: 0 },
])

const displayUrl = computed(() => resolveStaticUrl(props.imageUrl))

function onImageLoad() {
  if (imgEl.value) {
    naturalSize.w = imgEl.value.naturalWidth || 1
    naturalSize.h = imgEl.value.naturalHeight || 1
  }
}

function onImageClick(e: MouseEvent) {
  const rect = imgEl.value?.getBoundingClientRect()
  if (!rect || !rect.width || !rect.height) return
  const px = ((e.clientX - rect.left) / rect.width) * naturalSize.w
  const py = ((e.clientY - rect.top) / rect.height) * naturalSize.h
  anchors.value[activeAnchor.value - 1].px = px
  anchors.value[activeAnchor.value - 1].py = py
}

function anchorStyle(i: number) {
  const a = anchors.value[i]
  if (a == null || a.px == null || a.py == null) return {}
  return {
    left: `${(a.px / naturalSize.w) * 100}%`,
    top: `${(a.py / naturalSize.h) * 100}%`,
  }
}

function pixelHint(i: number) {
  const a = anchors.value[i]
  if (a == null || a.px == null || a.py == null) return '未放置'
  return `像素(${Math.round(a.px)}, ${Math.round(a.py)})`
}

const calibration = computed<Calibration | null>(() => {
  const [a1, a2] = anchors.value
  if (
    a1.px == null ||
    a1.py == null ||
    a2.px == null ||
    a2.py == null ||
    a2.px === a1.px ||
    a2.py === a1.py
  ) {
    return null
  }
  const scaleX = (a2.mx - a1.mx) / (a2.px - a1.px)
  const scaleY = (a2.my - a1.my) / (a2.py - a1.py)
  return {
    scaleX,
    scaleY,
    offsetX: a1.mx - a1.px * scaleX,
    offsetY: a1.my - a1.py * scaleY,
    anchors: [
      { px: a1.px, py: a1.py, mx: a1.mx, my: a1.my },
      { px: a2.px, py: a2.py, mx: a2.mx, my: a2.my },
    ],
  }
})

// 标定变化 -> 回写父组件
watch(calibration, (v) => emit('update:calibration', v))

// 外部传入标定（编辑回显）时恢复锚点
watch(
  () => props.calibration,
  (c) => {
    if (!c || !c.anchors || c.anchors.length < 2) return
    anchors.value = c.anchors.map((a) => ({ ...a }))
  },
  { immediate: true },
)

function clearCalibration() {
  anchors.value = anchors.value.map(() => ({ px: null, py: null, mx: 0, my: 0 }))
}

async function doUpload(options: UploadRequestOptions) {
  uploading.value = true
  try {
    const res = await uploadFile(options.file as File)
    emit('update:imageUrl', res.url)
    ElMessage.success('平面图上传成功')
  } catch {
    // 错误已由拦截器提示
  } finally {
    uploading.value = false
  }
}
</script>

<style scoped>
.floor-upload {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.floor-upload__calibration {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.floor-upload__img-wrap {
  position: relative;
  flex: 1;
  min-width: 280px;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  overflow: hidden;
  cursor: crosshair;
}

.floor-upload__img-wrap img {
  display: block;
  width: 100%;
  max-height: 320px;
  object-fit: contain;
  background: #f0f2f5;
}

.floor-upload__mask {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 4px 8px;
  font-size: 12px;
  color: #fff;
  background: rgba(0, 0, 0, 0.45);
  pointer-events: none;
}

.floor-upload__anchor {
  position: absolute;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #f56c6c;
  color: #fff;
  font-size: 12px;
  line-height: 22px;
  text-align: center;
  transform: translate(-50%, -50%);
  border: 2px solid #fff;
  box-shadow: 0 0 4px rgba(0, 0, 0, 0.4);
  cursor: pointer;
  pointer-events: none;
}

.floor-upload__anchor.active {
  background: #2f6bb0;
}

.floor-upload__panel {
  flex: 1;
  min-width: 320px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.floor-upload__anchor-btns {
  display: flex;
}

.floor-upload__anchor-inputs {
  display: flex;
  align-items: center;
  gap: 8px;
}

.floor-upload__anchor-label {
  width: 36px;
  color: #606266;
  font-size: 13px;
}

.floor-upload__pixel-hint {
  color: #909399;
  font-size: 12px;
}

.floor-upload__result {
  margin-top: 2px;
}

.floor-upload__actions {
  display: flex;
}
</style>
