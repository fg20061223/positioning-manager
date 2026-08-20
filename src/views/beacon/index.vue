<template>
  <div class="page">
    <el-card shadow="never">
      <!-- 筛选（beacon/query 服务端过滤） -->
      <div class="toolbar">
        <el-select
          v-model="filters.mallId"
          placeholder="商场"
          clearable
          style="width: 160px"
          @change="onMallFilterChange"
        >
          <el-option v-for="m in malls" :key="m.id" :label="m.name" :value="m.id" />
        </el-select>
        <el-select
          v-if="filters.mallId"
          v-model="filters.floorId"
          placeholder="楼层"
          clearable
          style="width: 130px"
          @change="load"
        >
          <el-option v-for="f in floors" :key="f.id" :label="f.name" :value="f.id" />
        </el-select>
        <el-select
          v-model="filters.status"
          placeholder="状态"
          clearable
          style="width: 120px"
          @change="load"
        >
          <el-option v-for="s in beaconStatusOptions" :key="s.code" :label="s.label" :value="s.code" />
        </el-select>
        <div class="spacer" />
        <el-button type="primary" :icon="Plus" @click="openCreate">新建信标</el-button>
      </div>

      <el-table v-loading="loading" :data="records" border stripe>
        <el-table-column prop="id" label="ID" width="170" />
        <el-table-column label="UUID" min-width="150" show-overflow-tooltip>
          <template #default="{ row }">{{ row.uuid || '-' }}</template>
        </el-table-column>
        <el-table-column prop="major" label="Major" width="80" />
        <el-table-column prop="minor" label="Minor" width="80" />
        <el-table-column prop="mac" label="MAC" width="130" />
        <el-table-column label="协议" width="100">
          <template #default="{ row }">
            <el-tag size="small">{{ row.beaconType }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="楼层" width="90">
          <template #default="{ row }">{{ floorName(row.floorId) }}</template>
        </el-table-column>
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag size="small" :type="beaconStatusTag(row.status)">{{ beaconStatusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="txPower" label="TxPower" width="80" />
        <el-table-column prop="battery" label="电量%" width="80" />
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
            <el-button link type="danger" @click="onDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="table-pagination">
        <el-pagination
          v-model:current-page="pageNum"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          @current-change="load"
          @size-change="onSizeChange"
        />
      </div>
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="editingId ? '编辑信标' : '新建信标'"
      width="560px"
      destroy-on-close
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px" style="padding-right: 16px">
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="商场" prop="mallId">
              <el-select v-model="form.mallId" style="width: 100%" @change="onMallFormChange">
                <el-option v-for="m in malls" :key="m.id" :label="m.name" :value="m.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="楼层" prop="floorId">
              <el-select
                v-if="form.mallId"
                v-model="form.floorId"
                style="width: 100%"
              >
                <el-option v-for="f in floors" :key="f.id" :label="f.name" :value="f.id" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="UUID" prop="uuid">
          <el-input v-model="form.uuid" placeholder="iBeacon 广播 UUID" />
        </el-form-item>
        <el-row :gutter="12">
          <el-col :span="8">
            <el-form-item label="Major" prop="major">
              <el-input-number v-model="form.major" :min="0" :max="65535" controls-position="right" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="Minor" prop="minor">
              <el-input-number v-model="form.minor" :min="0" :max="65535" controls-position="right" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="协议" prop="beaconType">
              <el-select v-model="form.beaconType" style="width: 100%">
                <el-option v-for="t in beaconTypeOptions" :key="t.code" :label="t.label" :value="t.code" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="MAC 地址">
              <el-input v-model="form.mac" placeholder="可选" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态" prop="status">
              <el-select v-model="form.status" style="width: 100%">
                <el-option v-for="s in beaconStatusOptions" :key="s.code" :label="s.label" :value="s.code" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="TxPower">
              <el-input-number v-model="form.txPower" :min="-127" :max="0" controls-position="right" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="电量(%)">
              <el-input-number v-model="form.battery" :min="0" :max="100" controls-position="right" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
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
import { computed, reactive, ref, watch } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import {
  ElMessage,
  ElMessageBox,
  type FormInstance,
  type FormRules,
} from 'element-plus'

import { beaconCreate, beaconDelete, beaconQuery, beaconUpdate } from '@/api/facility'
import { useDicts } from '@/composables/useDicts'
import { useMallData } from '@/composables/useMallData'
import { DICT_TYPES } from '@/types/dict'
import type {
  Beacon,
  BeaconQuery,
  BeaconStatus,
  BeaconType,
} from '@/types/facility'

const { malls, floors, loadMalls, loadFloors } = useMallData()

// 信标协议/状态下拉数据来自后端字典（beacon_type / beacon_status）
const { options: dictOptions, label: dictLabel } = useDicts([
  DICT_TYPES.BEACON_TYPE,
  DICT_TYPES.BEACON_STATUS,
])
const beaconTypeOptions = computed(() => dictOptions(DICT_TYPES.BEACON_TYPE))
const beaconStatusOptions = computed(() => dictOptions(DICT_TYPES.BEACON_STATUS))

const loading = ref(false)
const saving = ref(false)
const records = ref<Beacon[]>([])
const total = ref(0)
const pageNum = ref(1)
const pageSize = ref(10)

const filters = reactive<BeaconQuery>({
  mallId: undefined,
  floorId: undefined,
  status: '',
})

async function load() {
  loading.value = true
  try {
    const data = await beaconQuery({
      pageNum: pageNum.value,
      pageSize: pageSize.value,
      mallId: filters.mallId,
      floorId: filters.floorId,
      status: filters.status || undefined,
    })
    records.value = data.records
    total.value = data.total
  } finally {
    loading.value = false
  }
}
function onMallFilterChange() {
  filters.floorId = undefined
  loadFloors(filters.mallId)
  load()
}
function onSizeChange() {
  pageNum.value = 1
  load()
}

/* ---------- CRUD ---------- */
const dialogVisible = ref(false)
const editingId = ref<number | null>(null)
const formRef = ref<FormInstance>()

const emptyForm = () => ({
  mallId: undefined as number | undefined,
  floorId: undefined as number | undefined,
  uuid: '',
  major: 1,
  minor: 1,
  mac: '',
  beaconType: 'IBEACON' as BeaconType,
  txPower: -59,
  battery: 100,
  status: 'ACTIVE' as BeaconStatus,
  remark: '',
})
const form = reactive(emptyForm())

const rules: FormRules = {
  mallId: [{ required: true, message: '请选择商场', trigger: 'change' }],
  floorId: [{ required: true, message: '请选择楼层', trigger: 'change' }],
  uuid: [{ required: true, message: '请输入 UUID', trigger: 'blur' }],
  major: [{ required: true, message: '请输入 Major', trigger: 'change' }],
  minor: [{ required: true, message: '请输入 Minor', trigger: 'change' }],
  beaconType: [{ required: true, message: '请选择协议', trigger: 'change' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }],
}

function onMallFormChange() {
  form.floorId = undefined
  loadFloors(form.mallId)
}

function openCreate() {
  editingId.value = null
  Object.assign(form, emptyForm())
  dialogVisible.value = true
}
function openEdit(row: unknown) {
  const r = row as Beacon
  editingId.value = r.id
  Object.assign(form, emptyForm(), r)
  dialogVisible.value = true
}

async function onSubmit() {
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  saving.value = true
  try {
    if (editingId.value) {
      await beaconUpdate({ ...form, id: editingId.value })
      ElMessage.success('修改成功')
    } else {
      await beaconCreate({ ...form })
      ElMessage.success('新增成功')
    }
    dialogVisible.value = false
    await load()
  } catch {
    // 拦截器已提示
  } finally {
    saving.value = false
  }
}

async function onDelete(row: unknown) {
  const r = row as Beacon
  await ElMessageBox.confirm(
    `确定删除信标（major=${r.major}, minor=${r.minor}）吗？`,
    '删除确认',
    { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' },
  ).catch(() => null)
  await beaconDelete(r.id)
  ElMessage.success('删除成功')
  await load()
}

function beaconStatusLabel(s?: BeaconStatus) {
  return dictLabel(DICT_TYPES.BEACON_STATUS, s)
}
function beaconStatusTag(s?: BeaconStatus) {
  if (s === 'ACTIVE') return 'success'
  if (s === 'INACTIVE') return 'info'
  return 'danger'
}
function floorName(id?: number) {
  return floors.value.find((f) => f.id === id)?.name ?? id ?? '-'
}

watch(
  () => filters.mallId,
  (v) => {
    if (!v) {
      filters.floorId = undefined
      floors.value = []
    }
  },
)

loadMalls()
load()
</script>
