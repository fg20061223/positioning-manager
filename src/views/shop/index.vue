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
          @change="load"
        >
          <el-option v-for="f in floors" :key="f.id" :label="f.name" :value="f.id" />
        </el-select>
        <el-select
          v-model="filters.categoryId"
          placeholder="分类"
          clearable
          style="width: 140px"
        >
          <el-option v-for="c in categories" :key="c.id" :label="c.name" :value="c.id" />
        </el-select>
        <el-select v-model="filters.status" placeholder="状态" clearable style="width: 110px">
          <el-option v-for="s in SHOP_STATUS_OPTIONS" :key="s.value" :label="s.label" :value="s.value" />
        </el-select>
        <el-input
          v-model="filters.keyword"
          placeholder="名称/关键词"
          clearable
          style="width: 180px"
          @keyup.enter="load"
          @clear="load"
        />
        <el-button type="primary" @click="load">查询</el-button>
        <div class="spacer" />
        <el-button link type="primary" @click="router.push('/shop-category')">分类管理</el-button>
        <el-button v-if="canEdit" type="primary" :icon="Plus" @click="openCreate">新建商铺</el-button>
      </div>

      <el-table v-loading="loading" :data="records" border stripe>
        <el-table-column prop="id" label="ID" width="170" />
        <el-table-column prop="shopNo" label="商铺编号" width="110" />
        <el-table-column prop="shopName" label="商铺名称" min-width="130" show-overflow-tooltip />
        <el-table-column prop="shortName" label="简称" width="90" />
        <el-table-column prop="brand" label="品牌" width="100" />
        <el-table-column label="分类" width="110">
          <template #default="{ row }">{{ categoryName(row.categoryId) }}</template>
        </el-table-column>
        <el-table-column label="楼层" width="80">
          <template #default="{ row }">{{ floorName(row.floorId) }}</template>
        </el-table-column>
        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-tag size="small" :type="shopStatusTag(row.status)">{{ shopStatusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="phone" label="电话" width="120" />
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openGeometry(row)">几何</el-button>
            <el-button v-if="canEdit" link type="primary" @click="openEdit(row)">编辑</el-button>
            <el-button v-if="canEdit" link type="danger" @click="onDelete(row)">删除</el-button>
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

    <!-- 新建 / 编辑 -->
    <el-dialog
      v-model="dialogVisible"
      :title="editingId ? '编辑商铺' : '新建商铺'"
      width="600px"
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
            <el-form-item label="商铺编号" prop="shopNo">
              <el-input v-model="form.shopNo" placeholder="如 1F-101" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="商铺名称" prop="shopName">
              <el-input v-model="form.shopName" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="简称">
              <el-input v-model="form.shortName" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="分类">
              <el-select v-model="form.categoryId" clearable placeholder="可选" style="width: 100%">
                <el-option v-for="c in categories" :key="c.id" :label="c.name" :value="c.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态" prop="status">
              <el-select v-model="form.status" style="width: 100%">
                <el-option v-for="s in SHOP_STATUS_OPTIONS" :key="s.value" :label="s.label" :value="s.value" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="品牌">
              <el-input v-model="form.brand" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系电话">
              <el-input v-model="form.phone" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="关键词">
          <el-input v-model="form.keywords" placeholder="逗号分隔，用于搜索" />
        </el-form-item>
        <el-form-item label="简介">
          <el-input v-model="form.description" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="排序号">
          <el-input-number v-model="form.sortOrder" :min="0" controls-position="right" style="width: 160px" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="onSubmit">保存</el-button>
      </template>
    </el-dialog>

    <!-- 几何编辑 -->
    <el-dialog v-model="geometryVisible" title="商铺几何（本地米制坐标）" width="760px" destroy-on-close>
      <el-row :gutter="16">
        <el-col :span="18">
          <p class="geo-label">商铺轮廓（面）</p>
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
import { useRouter } from 'vue-router'
import { Plus } from '@element-plus/icons-vue'
import {
  ElMessage,
  ElMessageBox,
  type FormInstance,
  type FormRules,
} from 'element-plus'

import {
  shopCreate,
  shopDelete,
  shopGetGeometry,
  shopQuery,
  shopUpdate,
  shopUpdateGeometry,
} from '@/api/shop'
import GeoDraw from '@/components/GeoDraw.vue'
import { useMallData } from '@/composables/useMallData'
import { useAuthStore } from '@/stores/auth'
import type { GeoJsonGeometry } from '@/types/file'
import {
  SHOP_STATUS_OPTIONS,
  type Shop,
  type ShopQuery,
  type ShopStatus,
} from '@/types/shop'

const router = useRouter()
const auth = useAuthStore()
const canEdit = computed(() => ['ADMIN', 'STAFF'].includes(auth.userType))

const {
  malls,
  floors,
  zones,
  categories,
  loadMalls,
  loadFloors,
  loadZones,
  loadCategories,
} = useMallData()

const loading = ref(false)
const saving = ref(false)
const savingGeo = ref(false)
const records = ref<Shop[]>([])
const total = ref(0)
const pageNum = ref(1)
const pageSize = ref(10)

const filters = reactive<ShopQuery>({
  mallId: undefined,
  floorId: undefined,
  categoryId: undefined,
  status: '',
  keyword: '',
})

async function load() {
  loading.value = true
  try {
    const data = await shopQuery({
      pageNum: pageNum.value,
      pageSize: pageSize.value,
      mallId: filters.mallId,
      floorId: filters.floorId,
      categoryId: filters.categoryId,
      status: filters.status || undefined,
      keyword: filters.keyword?.trim() || undefined,
    })
    records.value = data.records
    total.value = data.total
  } finally {
    loading.value = false
  }
}
function onMallFilterChange() {
  filters.floorId = undefined
  filters.categoryId = undefined
  loadFloors(filters.mallId)
  loadCategories(filters.mallId)
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
  zoneId: undefined as number | undefined,
  shopNo: '',
  shopName: '',
  shortName: '',
  categoryId: undefined as number | undefined,
  brand: '',
  phone: '',
  keywords: '',
  description: '',
  status: 'OPEN' as ShopStatus,
  sortOrder: 0,
})
const form = reactive(emptyForm())

const rules: FormRules = {
  mallId: [{ required: true, message: '请选择商场', trigger: 'change' }],
  floorId: [{ required: true, message: '请选择楼层', trigger: 'change' }],
  shopNo: [{ required: true, message: '请输入商铺编号', trigger: 'blur' }],
  shopName: [{ required: true, message: '请输入商铺名称', trigger: 'blur' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }],
}

function onMallFormChange() {
  form.floorId = undefined
  form.zoneId = undefined
  form.categoryId = undefined
  loadFloors(form.mallId)
  loadZones(undefined)
  loadCategories(form.mallId)
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
  const r = row as Shop
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
      await shopUpdate({ ...form, id: editingId.value })
      ElMessage.success('修改成功')
    } else {
      await shopCreate({ ...form })
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
  const r = row as Shop
  await ElMessageBox.confirm(
    `确定删除商铺「${r.shopName}」吗？`,
    '删除确认',
    { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' },
  ).catch(() => null)
  await shopDelete(r.id)
  ElMessage.success('删除成功')
  await load()
}

/* ---------- 几何 ---------- */
const geometryVisible = ref(false)
const geometryId = ref<number | null>(null)
const polyDraft = ref<GeoJsonGeometry | null>(null)
const entranceDraft = ref<GeoJsonGeometry | null>(null)

async function openGeometry(row: unknown) {
  const r = row as Shop
  geometryId.value = r.id
  polyDraft.value = null
  entranceDraft.value = null
  geometryVisible.value = true
  try {
    const g = await shopGetGeometry(r.id)
    if (g.geomGeojson) polyDraft.value = JSON.parse(g.geomGeojson) as GeoJsonGeometry
    if (g.entranceGeojson) entranceDraft.value = JSON.parse(g.entranceGeojson) as GeoJsonGeometry
  } catch {
    // 未设置几何时忽略
  }
}

async function onSaveGeometry() {
  if (geometryId.value == null) return
  if (!polyDraft.value) {
    ElMessage.warning('请先绘制商铺轮廓（至少 3 个点）')
    return
  }
  savingGeo.value = true
  try {
    await shopUpdateGeometry({
      id: geometryId.value,
      geomGeoJson: JSON.stringify(polyDraft.value),
      // 入口点未绘制时传空串（后端 CASE 分支置 NULL；传 null 会触发 PG 类型推断错误）
      entranceGeoJson: entranceDraft.value
        ? JSON.stringify(entranceDraft.value)
        : '',
    })
    ElMessage.success('几何已保存')
    geometryVisible.value = false
  } catch {
    // 拦截器已提示
  } finally {
    savingGeo.value = false
  }
}

/* ---------- 字典取值 ---------- */
function categoryName(id?: number) {
  return categories.value.find((c) => c.id === id)?.name ?? id ?? '-'
}
function floorName(id?: number) {
  return floors.value.find((f) => f.id === id)?.name ?? id ?? '-'
}
function shopStatusLabel(s?: ShopStatus) {
  return SHOP_STATUS_OPTIONS.find((o) => o.value === s)?.label ?? s ?? '-'
}
function shopStatusTag(s?: ShopStatus) {
  if (s === 'OPEN') return 'success'
  if (s === 'DECORATING') return 'warning'
  return 'info'
}

watch(
  () => filters.mallId,
  (v) => {
    if (!v) {
      filters.floorId = undefined
      filters.categoryId = undefined
      floors.value = []
    }
  },
)

loadMalls()
loadCategories()
load()
</script>

<style scoped>
.geo-label {
  margin: 0 0 6px;
  color: #606266;
  font-size: 13px;
  font-weight: 600;
}
</style>
