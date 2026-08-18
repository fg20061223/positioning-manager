<template>
  <div class="page">
    <el-card shadow="never">
      <template #header>
        <div class="page-header">
          <div class="page-title">
            <el-button link type="primary" :icon="ArrowLeft" @click="back">返回</el-button>
            <span>{{ mallName }} · 楼层管理</span>
          </div>
          <el-button type="primary" :icon="Plus" @click="openCreate">新建楼层</el-button>
        </div>
      </template>

      <el-table v-loading="loading" :data="floors" border stripe>
        <el-table-column prop="id" label="ID" width="170" />
        <el-table-column prop="floorCode" label="楼层编码" width="100" />
        <el-table-column prop="floorName" label="楼层名称" min-width="120" />
        <el-table-column prop="sortOrder" label="排序号" width="80" />
        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'">
              {{ row.status === 1 ? '开放' : '关闭' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="平面图尺寸(m)" width="120">
          <template #default="{ row }">
            {{ row.widthM && row.heightM ? `${row.widthM} × ${row.heightM}` : '-' }}
          </template>
        </el-table-column>
        <el-table-column label="平面图" width="90">
          <template #default="{ row }">
            <el-tag v-if="hasCalibration(row.remark)" type="warning" size="small">已标定</el-tag>
            <el-tag v-else-if="row.imageUrl" type="success" size="small">已上传</el-tag>
            <el-tag v-else type="info" size="small">未上传</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="120" show-overflow-tooltip />
        <el-table-column label="操作" width="240" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="goZones(row)">分区管理</el-button>
            <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
            <el-button link type="danger" @click="onDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="editingId ? '编辑楼层' : '新建楼层'"
      width="560px"
      destroy-on-close
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
        style="padding-right: 16px"
      >
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="楼层编码" prop="floorCode">
              <el-input v-model="form.floorCode" placeholder="如 B2 / 1F / 3F" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="楼层名称" prop="floorName">
              <el-input v-model="form.floorName" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="排序号" prop="sortOrder">
              <el-input-number
                v-model="form.sortOrder"
                :min="-10"
                :max="100"
                controls-position="right"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态">
              <el-radio-group v-model="form.status">
                <el-radio :value="1">开放</el-radio>
                <el-radio :value="0">关闭</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="宽度(米)">
              <el-input-number
                v-model="form.widthM"
                :min="0"
                :precision="2"
                controls-position="right"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="高度(米)">
              <el-input-number
                v-model="form.heightM"
                :min="0"
                :precision="2"
                controls-position="right"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="平面图">
          <FloorImageUpload
            v-model:image-url="form.imageUrl"
            v-model:calibration="calibration"
          />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="onSubmit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Plus } from '@element-plus/icons-vue'
import {
  ElMessage,
  ElMessageBox,
  type FormInstance,
  type FormRules,
} from 'element-plus'

import {
  floorByMall,
  floorCreate,
  floorDelete,
  floorUpdate,
  mallGet,
} from '@/api/mall'
import FloorImageUpload from '@/components/FloorImageUpload.vue'
import type { Calibration } from '@/types/file'
import type { MallFloor, MallFloorForm } from '@/types/mall'

const route = useRoute()
const router = useRouter()
const mallId = Number(route.params.mallId)

const loading = ref(false)
const saving = ref(false)
const mallName = ref('')
const floors = ref<MallFloor[]>([])
const dialogVisible = ref(false)
const editingId = ref<number | null>(null)
const formRef = ref<FormInstance>()

const emptyForm = (): MallFloorForm => ({
  mallId,
  floorCode: '',
  floorName: '',
  sortOrder: 0,
  status: 1,
  widthM: undefined,
  heightM: undefined,
  imageUrl: '',
  remark: '',
})
const form = reactive<MallFloorForm>(emptyForm())
/** 平面图标定参数（随 remark JSON 一起保存，见 mergeRemark） */
const calibration = ref<Calibration | null>(null)

const rules: FormRules = {
  floorCode: [{ required: true, message: '请输入楼层编码', trigger: 'blur' }],
  floorName: [{ required: true, message: '请输入楼层名称', trigger: 'blur' }],
}

async function load() {
  loading.value = true
  try {
    const mall = await mallGet(mallId).catch(() => null)
    mallName.value = mall?.mallName ?? `商场 #${mallId}`
    floors.value = await floorByMall(mallId)
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editingId.value = null
  Object.assign(form, emptyForm())
  calibration.value = null
  dialogVisible.value = true
}

function openEdit(row: unknown) {
  const r = row as MallFloor
  editingId.value = r.id
  Object.assign(form, emptyForm(), r)
  // remark 可能存的是 {calibration, note} JSON（见 mergeRemark）
  form.remark = parseNote(r.remark)
  calibration.value = parseCalibration(r.remark)
  dialogVisible.value = true
}

async function onSubmit() {
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  saving.value = true
  try {
    const payload: MallFloorForm = { ...form }
    if (calibration.value) {
      payload.remark = JSON.stringify({
        calibration: calibration.value,
        note: form.remark || '',
      })
    }
    if (editingId.value) {
      await floorUpdate({ ...payload, id: editingId.value })
      ElMessage.success('修改成功')
    } else {
      await floorCreate({ ...payload })
      ElMessage.success('新增成功')
    }
    dialogVisible.value = false
    await load()
  } catch {
    // 错误提示已由拦截器统一处理
  } finally {
    saving.value = false
  }
}

async function onDelete(row: unknown) {
  const r = row as MallFloor
  await ElMessageBox.confirm(
    `确定删除楼层「${r.floorName}」吗？`,
    '删除确认',
    { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' },
  ).catch(() => null)
  await floorDelete(r.id)
  ElMessage.success('删除成功')
  await load()
}

function goZones(row: unknown) {
  const r = row as MallFloor
  router.push(`/mall/${mallId}/floor/${r.id}/zones`)
}

function back() {
  router.push('/mall')
}

/* ---------- 平面图标定（存入 remark JSON） ---------- */
function parseCalibration(remark?: string): Calibration | null {
  if (!remark) return null
  try {
    const o = JSON.parse(remark)
    if (o && o.calibration) return o.calibration as Calibration
  } catch {
    // 普通文本备注
  }
  return null
}
function parseNote(remark?: string): string {
  if (!remark) return ''
  try {
    const o = JSON.parse(remark)
    if (o && o.calibration) return (o.note as string) ?? ''
  } catch {
    // 普通文本备注
  }
  return remark
}
function hasCalibration(remark?: string): boolean {
  return parseCalibration(remark) !== null
}

load()
</script>

<style scoped>
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.page-title {
  display: flex;
  align-items: center;
  gap: 4px;
  font-weight: 600;
}
</style>
