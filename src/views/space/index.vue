<template>
  <div class="page">
    <el-card shadow="never">
      <!-- 筛选 -->
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
          @change="onFilterChange"
        >
          <el-option v-for="f in floors" :key="f.id" :label="f.name" :value="f.id" />
        </el-select>
        <el-select
          v-model="filters.status"
          placeholder="状态"
          clearable
          style="width: 120px"
          @change="onFilterChange"
        >
          <el-option v-for="s in spaceStatusOptions" :key="s.code" :label="s.label" :value="s.code" />
        </el-select>
        <el-input
          v-model="keyword"
          placeholder="车位号搜索"
          clearable
          style="width: 180px"
          @keyup.enter="onSearch"
          @clear="clearSearch"
        />
        <el-button type="primary" @click="onSearch">搜索</el-button>
        <div class="spacer" />
        <el-button type="primary" :icon="Plus" @click="openCreate">新建车位</el-button>
      </div>

      <el-alert
        v-if="searchMode"
        type="info"
        :closable="false"
        class="search-tip"
      >
        <template #title>
          车位号搜索「{{ keyword }}」共 {{ searchResults.length }} 条
          <el-button link type="primary" @click="clearSearch">清除搜索</el-button>
        </template>
      </el-alert>

      <!-- 列表 -->
      <el-table v-loading="loading" :data="tableData" border stripe>
        <el-table-column prop="id" label="ID" width="170" />
        <el-table-column prop="spaceNo" label="车位号" width="120" />
        <el-table-column label="类型" width="90">
          <template #default="{ row }">
            <el-tag size="small">{{ spaceTypeLabel(row.spaceType) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag size="small" :type="spaceStatusTag(row.status)">{{ spaceStatusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="楼层" width="80">
          <template #default="{ row }">{{ floorName(row.floorId) }}</template>
        </el-table-column>
        <el-table-column label="分区" width="90">
          <template #default="{ row }">{{ zoneName(row.zoneId) }}</template>
        </el-table-column>
        <el-table-column prop="occupySource" label="占用来源" width="90" />
        <el-table-column prop="sortOrder" label="排序" width="70" />
        <el-table-column prop="remark" label="备注" min-width="100" show-overflow-tooltip />
        <el-table-column label="操作" width="330" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openGeometry(row)">几何</el-button>
            <el-button v-if="canEdit" link type="primary" @click="openEdit(row)">编辑</el-button>
            <el-button
              v-if="canEdit && row.status === 'FREE'"
              link
              type="warning"
              @click="onOccupy(row)"
            >
              占用
            </el-button>
            <el-button
              v-if="canEdit && row.status === 'OCCUPIED'"
              link
              type="success"
              @click="onRelease(row)"
            >
              释放
            </el-button>
            <el-button v-if="canEdit" link type="danger" @click="onDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div v-if="!searchMode" class="table-pagination">
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

    <!-- 新建 / 编辑 -->
    <el-dialog
      v-model="dialogVisible"
      :title="editingId ? '编辑车位' : '新建车位'"
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
                @change="onFloorFormChange"
              >
                <el-option v-for="f in floors" :key="f.id" :label="f.name" :value="f.id" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="分区">
              <el-select v-model="form.zoneId" clearable placeholder="可选" style="width: 100%">
                <el-option v-for="z in zones" :key="z.id" :label="z.name" :value="z.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="车位号" prop="spaceNo">
              <el-input v-model="form.spaceNo" placeholder="如 B3-012" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="类型" prop="spaceType">
              <el-select v-model="form.spaceType" style="width: 100%">
                <el-option v-for="t in spaceTypeOptions" :key="t.code" :label="t.label" :value="t.code" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态" prop="status">
              <el-select v-model="form.status" style="width: 100%">
                <el-option v-for="s in spaceStatusOptions" :key="s.code" :label="s.label" :value="s.code" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="排序号">
              <el-input-number v-model="form.sortOrder" :min="0" controls-position="right" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="备注">
              <el-input v-model="form.remark" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-alert type="info" :closable="false" title="车位轮廓/入口点几何请使用「几何」功能在平面图上绘制" />
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="onSubmit">保存</el-button>
      </template>
    </el-dialog>

    <!-- 几何编辑 -->
    <el-dialog v-model="geometryVisible" title="车位几何（本地米制坐标）" width="760px" destroy-on-close>
      <el-row :gutter="16">
        <el-col :span="18">
          <p class="geo-label">车位轮廓（面，点击画布添加顶点）</p>
          <GeoDraw v-model="polyDraft" geometry-type="polygon" height="360px" />
        </el-col>
        <el-col :span="6">
          <p class="geo-label">入口点（点）</p>
          <GeoDraw v-model="entranceDraft" geometry-type="point" height="360px" hint="点击画布设置入口点" />
        </el-col>
      </el-row>
      <template #footer>
        <el-button @click="geometryVisible = false">取消</el-button>
        <el-button type="primary" :loading="savingGeo" @click="onSaveGeometry">保存几何</el-button>
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

import {
  spaceCreate,
  spaceDelete,
  spaceGetGeometry,
  spaceOccupy,
  spaceQuery,
  spaceRelease,
  spaceSearch,
  spaceUpdate,
  spaceUpdateGeometry,
} from '@/api/space'
import GeoDraw from '@/components/GeoDraw.vue'
import { useDicts } from '@/composables/useDicts'
import { useMallData } from '@/composables/useMallData'
import { useAuthStore } from '@/stores/auth'
import { DICT_TYPES } from '@/types/dict'
import type { GeoJsonGeometry } from '@/types/file'
import type { ParkingSpace, SpaceStatus, SpaceType } from '@/types/space'

const auth = useAuthStore()
const canEdit = computed(() => ['ADMIN', 'STAFF'].includes(auth.userType))

const { malls, floors, zones, loadMalls, loadFloors, loadZones } =
  useMallData()

// 车位类型/状态下拉数据来自后端字典（space_type / space_status）
const { options: dictOptions, label: dictLabel } = useDicts([
  DICT_TYPES.SPACE_TYPE,
  DICT_TYPES.SPACE_STATUS,
])
const spaceTypeOptions = computed(() => dictOptions(DICT_TYPES.SPACE_TYPE))
const spaceStatusOptions = computed(() => dictOptions(DICT_TYPES.SPACE_STATUS))

const loading = ref(false)
const saving = ref(false)
const savingGeo = ref(false)
const records = ref<ParkingSpace[]>([])
const total = ref(0)
const pageNum = ref(1)
const pageSize = ref(10)
const keyword = ref('')
const searchMode = ref(false)
const searchResults = ref<ParkingSpace[]>([])

const filters = reactive<{ mallId?: number; floorId?: number; status?: SpaceStatus | '' }>({
  mallId: undefined,
  floorId: undefined,
  status: '',
})

const tableData = computed(() => (searchMode.value ? searchResults.value : records.value))

async function load() {
  loading.value = true
  try {
    const data = await spaceQuery({
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
  if (searchMode.value) {
    clearSearch()
  } else {
    load()
  }
}

/** 楼层/状态下拉变动：若处于车位号搜索模式先退出，再按新筛选条件查询 */
function onFilterChange() {
  if (searchMode.value) {
    clearSearch()
  } else {
    load()
  }
}

function onSizeChange() {
  pageNum.value = 1
  load()
}

async function onSearch() {
  const kw = keyword.value.trim()
  if (!kw) {
    clearSearch()
    return
  }
  if (!filters.mallId) {
    ElMessage.warning('搜索车位号请先选择商场')
    return
  }
  loading.value = true
  try {
    searchResults.value = await spaceSearch({ mallId: filters.mallId, keyword: kw, limit: 50 })
    searchMode.value = true
  } finally {
    loading.value = false
  }
}
function clearSearch() {
  searchMode.value = false
  keyword.value = ''
  load()
}

/* ---------- CRUD ---------- */
const dialogVisible = ref(false)
const editingId = ref<number | null>(null)
const formRef = ref<FormInstance>()

const emptyForm = () => ({
  mallId: undefined as number | undefined,
  floorId: undefined as number | undefined,
  zoneId: undefined as number | undefined,
  spaceNo: '',
  spaceType: 'NORMAL' as SpaceType,
  status: 'FREE' as SpaceStatus,
  sortOrder: 0,
  remark: '',
})
const form = reactive(emptyForm())

const rules: FormRules = {
  mallId: [{ required: true, message: '请选择商场', trigger: 'change' }],
  floorId: [{ required: true, message: '请选择楼层', trigger: 'change' }],
  spaceNo: [{ required: true, message: '请输入车位号', trigger: 'blur' }],
  spaceType: [{ required: true, message: '请选择类型', trigger: 'change' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }],
}

function onMallFormChange() {
  form.floorId = undefined
  form.zoneId = undefined
  loadFloors(form.mallId)
  loadZones(undefined)
}
function onFloorFormChange() {
  form.zoneId = undefined
  loadZones(form.floorId)
}

function openCreate() {
  editingId.value = null
  Object.assign(form, emptyForm())
  dialogVisible.value = true
}
function openEdit(row: unknown) {
  const r = row as ParkingSpace
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
      await spaceUpdate({ ...form, id: editingId.value })
      ElMessage.success('修改成功')
    } else {
      await spaceCreate({ ...form })
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
  const r = row as ParkingSpace
  await ElMessageBox.confirm(
    `确定删除车位「${r.spaceNo}」吗？`,
    '删除确认',
    { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' },
  ).catch(() => null)
  await spaceDelete(r.id)
  ElMessage.success('删除成功')
  await load()
}

/* ---------- 占用 / 释放 ---------- */
async function onOccupy(row: unknown) {
  const r = row as ParkingSpace
  await ElMessageBox.confirm(
    `手动占用车位「${r.spaceNo}」？`,
    '占用确认',
    { type: 'warning', confirmButtonText: '占用', cancelButtonText: '取消' },
  ).catch(() => null)
  await spaceOccupy({ id: r.id, source: 'MANUAL' })
  ElMessage.success('已占用')
  await load()
}
async function onRelease(row: unknown) {
  const r = row as ParkingSpace
  await ElMessageBox.confirm(
    `释放车位「${r.spaceNo}」？`,
    '释放确认',
    { type: 'warning', confirmButtonText: '释放', cancelButtonText: '取消' },
  ).catch(() => null)
  await spaceRelease(r.id)
  ElMessage.success('已释放')
  await load()
}

/* ---------- 几何 ---------- */
const geometryVisible = ref(false)
const geometryId = ref<number | null>(null)
const polyDraft = ref<GeoJsonGeometry | null>(null)
const entranceDraft = ref<GeoJsonGeometry | null>(null)

async function openGeometry(row: unknown) {
  const r = row as ParkingSpace
  geometryId.value = r.id
  polyDraft.value = null
  entranceDraft.value = null
  geometryVisible.value = true
  try {
    const g = await spaceGetGeometry(r.id)
    if (g.geomGeojson) polyDraft.value = JSON.parse(g.geomGeojson) as GeoJsonGeometry
    if (g.entranceGeojson) entranceDraft.value = JSON.parse(g.entranceGeojson) as GeoJsonGeometry
  } catch {
    // 未设置几何时接口可能报错，忽略（以空草稿开始）
  }
}

async function onSaveGeometry() {
  if (geometryId.value == null) return
  if (!polyDraft.value) {
    ElMessage.warning('请先绘制车位轮廓（至少 3 个点）')
    return
  }
  savingGeo.value = true
  try {
    await spaceUpdateGeometry({
      id: geometryId.value,
      geomGeoJson: JSON.stringify(polyDraft.value),
      // 入口点未绘制时传空串（后端 CASE 分支置 NULL；传 null 会触发 PG 类型推断错误）
      entranceGeoJson: entranceDraft.value
        ? JSON.stringify(entranceDraft.value)
        : '',
    })
    ElMessage.success('几何已保存')
    geometryVisible.value = false
    await load()
  } catch {
    // 拦截器已提示
  } finally {
    savingGeo.value = false
  }
}

/* ---------- 字典取值 ---------- */
function spaceTypeLabel(t?: SpaceType) {
  return dictLabel(DICT_TYPES.SPACE_TYPE, t)
}
function spaceStatusLabel(s?: SpaceStatus) {
  return dictLabel(DICT_TYPES.SPACE_STATUS, s)
}
function spaceStatusTag(s?: SpaceStatus) {
  if (s === 'FREE') return 'success'
  if (s === 'OCCUPIED') return 'danger'
  if (s === 'LOCKED') return 'warning'
  if (s === 'FAULT') return 'info'
  return 'info'
}
function floorName(id?: number) {
  return floors.value.find((f) => f.id === id)?.name ?? id ?? '-'
}
function zoneName(id?: number) {
  return zones.value.find((z) => z.id === id)?.name ?? id ?? '-'
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

<style scoped>
.search-tip {
  margin-bottom: 12px;
}

.geo-label {
  margin: 0 0 6px;
  color: #606266;
  font-size: 13px;
  font-weight: 600;
}
</style>
