<template>
  <div class="page">
    <el-card shadow="never">
      <!-- 筛选（poi/page 为全量分页，前端本地过滤） -->
      <div class="toolbar">
        <el-select
          v-model="filters.mallId"
          placeholder="商场"
          clearable
          style="width: 160px"
          @change="onMallFilterChange"
        >
          <el-option v-for="m in malls" :key="m.id" :label="m.mallName" :value="m.id" />
        </el-select>
        <el-select
          v-model="filters.floorId"
          placeholder="楼层"
          clearable
          style="width: 130px"
        >
          <el-option v-for="f in floors" :key="f.id" :label="f.floorName" :value="f.id" />
        </el-select>
        <el-select v-model="filters.poiType" placeholder="类型" clearable style="width: 150px">
          <el-option v-for="t in POI_TYPE_OPTIONS" :key="t.value" :label="t.label" :value="t.value" />
        </el-select>
        <el-input
          v-model="keyword"
          placeholder="设施名称"
          clearable
          style="width: 180px"
          @input="resetPage"
        />
        <div class="spacer" />
        <el-button type="primary" :icon="Plus" @click="openCreate">新建设施</el-button>
      </div>

      <el-table v-loading="loading" :data="paged" border stripe>
        <el-table-column prop="id" label="ID" width="170" />
        <el-table-column prop="poiName" label="设施名称" min-width="140" />
        <el-table-column label="类型" width="110">
          <template #default="{ row }">
            <el-tag size="small">{{ poiTypeLabel(row.poiType) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="楼层" width="90">
          <template #default="{ row }">{{ floorName(row.floorId) }}</template>
        </el-table-column>
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag size="small" :type="row.status === 1 ? 'success' : 'info'">
              {{ row.status === 1 ? '可用' : '不可用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="120" show-overflow-tooltip />
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
        />
      </div>
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="editingId ? '编辑设施' : '新建设施'"
      width="520px"
      destroy-on-close
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px" style="padding-right: 16px">
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="商场" prop="mallId">
              <el-select v-model="form.mallId" style="width: 100%" @change="onMallFormChange">
                <el-option v-for="m in malls" :key="m.id" :label="m.mallName" :value="m.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="楼层" prop="floorId">
              <el-select v-model="form.floorId" style="width: 100%">
                <el-option v-for="f in floors" :key="f.id" :label="f.floorName" :value="f.id" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="类型" prop="poiType">
              <el-select v-model="form.poiType" style="width: 100%">
                <el-option v-for="t in POI_TYPE_OPTIONS" :key="t.value" :label="t.label" :value="t.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="名称" prop="poiName">
              <el-input v-model="form.poiName" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="状态">
          <el-radio-group v-model="form.status">
            <el-radio :value="1">可用</el-radio>
            <el-radio :value="0">不可用</el-radio>
          </el-radio-group>
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
import { computed, reactive, ref, watch } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import {
  ElMessage,
  ElMessageBox,
  type FormInstance,
  type FormRules,
} from 'element-plus'

import { poiCreate, poiDelete, poiPage, poiUpdate } from '@/api/facility'
import { useLocalPaging } from '@/composables/useLocalPaging'
import { useMallData } from '@/composables/useMallData'
import {
  POI_TYPE_OPTIONS,
  type Poi,
  type PoiType,
} from '@/types/facility'

const { malls, floors, loadMalls, loadFloors } = useMallData()

const loading = ref(false)
const saving = ref(false)
const allPois = ref<Poi[]>([])
const keyword = ref('')
const filters = reactive<{ mallId?: number; floorId?: number; poiType?: PoiType | '' }>({
  mallId: undefined,
  floorId: undefined,
  poiType: '',
})

const filtered = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  return allPois.value.filter((p) => {
    if (filters.mallId && p.mallId !== filters.mallId) return false
    if (filters.floorId && p.floorId !== filters.floorId) return false
    if (filters.poiType && p.poiType !== filters.poiType) return false
    if (kw && !p.poiName.toLowerCase().includes(kw)) return false
    return true
  })
})

const { pageNum, pageSize, total, paged, resetPage } = useLocalPaging(
  () => filtered.value,
)

watch(keyword, () => resetPage())

async function load() {
  loading.value = true
  try {
    const data = await poiPage({ pageNum: 1, pageSize: 1000 })
    allPois.value = data.records
  } finally {
    loading.value = false
  }
}

function onMallFilterChange() {
  filters.floorId = undefined
  loadFloors(filters.mallId)
}

/* ---------- CRUD ---------- */
const dialogVisible = ref(false)
const editingId = ref<number | null>(null)
const formRef = ref<FormInstance>()

const emptyForm = () => ({
  mallId: undefined as number | undefined,
  floorId: undefined as number | undefined,
  poiType: 'ELEVATOR' as PoiType,
  poiName: '',
  status: 1,
  remark: '',
})
const form = reactive(emptyForm())

const rules: FormRules = {
  mallId: [{ required: true, message: '请选择商场', trigger: 'change' }],
  floorId: [{ required: true, message: '请选择楼层', trigger: 'change' }],
  poiType: [{ required: true, message: '请选择类型', trigger: 'change' }],
  poiName: [{ required: true, message: '请输入设施名称', trigger: 'blur' }],
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
  const r = row as Poi
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
      await poiUpdate({ ...form, id: editingId.value })
      ElMessage.success('修改成功')
    } else {
      await poiCreate({ ...form })
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
  const r = row as Poi
  await ElMessageBox.confirm(
    `确定删除设施「${r.poiName}」吗？`,
    '删除确认',
    { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' },
  ).catch(() => null)
  await poiDelete(r.id)
  ElMessage.success('删除成功')
  await load()
}

function poiTypeLabel(t?: PoiType) {
  return POI_TYPE_OPTIONS.find((o) => o.value === t)?.label ?? t ?? '-'
}
function floorName(id?: number) {
  return floors.value.find((f) => f.id === id)?.floorName ?? id ?? '-'
}

loadMalls()
load()
</script>
