<template>
  <div class="page">
    <el-card shadow="never">
      <div class="toolbar">
        <el-select
          v-model="filters.status"
          placeholder="状态"
          clearable
          style="width: 110px"
          @change="load"
        >
          <el-option v-for="s in mallStatusOptions" :key="s.code" :label="s.label" :value="Number(s.code)" />
        </el-select>
        <el-input
          v-model="filters.mallName"
          placeholder="商场名称"
          clearable
          style="width: 140px"
          @keyup.enter="onSearch"
          @clear="load"
        />
        <el-input
          v-model="filters.mallCode"
          placeholder="商场编码"
          clearable
          style="width: 120px"
          @keyup.enter="onSearch"
          @clear="load"
        />
        <el-input
          v-model="filters.province"
          placeholder="省份"
          clearable
          style="width: 110px"
          @keyup.enter="onSearch"
          @clear="load"
        />
        <el-input
          v-model="filters.city"
          placeholder="城市"
          clearable
          style="width: 110px"
          @keyup.enter="onSearch"
          @clear="load"
        />
        <el-input
          v-model="filters.district"
          placeholder="区县"
          clearable
          style="width: 110px"
          @keyup.enter="onSearch"
          @clear="load"
        />
        <el-input
          v-model="filters.address"
          placeholder="详细地址"
          clearable
          style="width: 140px"
          @keyup.enter="onSearch"
          @clear="load"
        />
        <el-button type="primary" :icon="Search" @click="onSearch">查询</el-button>
        <div class="spacer" />
        <el-button type="primary" :icon="Plus" @click="openCreate">新建商场</el-button>
      </div>

      <el-table v-loading="loading" :data="records" border stripe>
        <el-table-column prop="id" label="ID" width="170" />
        <el-table-column prop="mallCode" label="商场编码" width="110" />
        <el-table-column prop="mallName" label="商场名称" min-width="150" show-overflow-tooltip />
        <el-table-column label="所在地区" min-width="150">
          <template #default="{ row }">
            {{ [row.province, row.city, row.district].filter(Boolean).join(' ') || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'">
              {{ row.status === 1 ? '营业' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="120" show-overflow-tooltip />
        <el-table-column label="操作" width="230" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="goFloors(row)">楼层管理</el-button>
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
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @current-change="load"
          @size-change="onSizeChange"
        />
      </div>
    </el-card>

    <!-- 新建 / 编辑弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="editingId ? '编辑商场' : '新建商场'"
      width="600px"
      destroy-on-close
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="90px"
        style="padding-right: 16px"
      >
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="商场编码" prop="mallCode">
              <el-input v-model="form.mallCode" placeholder="全局唯一" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="商场名称" prop="mallName">
              <el-input v-model="form.mallName" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="12">
          <el-col :span="8">
            <el-form-item label="省份"><el-input v-model="form.province" /></el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="城市"><el-input v-model="form.city" /></el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="区县"><el-input v-model="form.district" /></el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="详细地址"><el-input v-model="form.address" /></el-form-item>
        <el-row :gutter="12">
          <el-col :span="8">
            <el-form-item label="经度">
              <el-input-number
                v-model="form.lng"
                :precision="6"
                :step="0.01"
                controls-position="right"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="纬度">
              <el-input-number
                v-model="form.lat"
                :precision="6"
                :step="0.01"
                controls-position="right"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="状态">
              <el-radio-group v-model="form.status">
                <el-radio :value="1">营业</el-radio>
                <el-radio :value="0">停用</el-radio>
              </el-radio-group>
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
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Plus, Search } from '@element-plus/icons-vue'
import {
  ElMessage,
  ElMessageBox,
  type FormInstance,
  type FormRules,
} from 'element-plus'

import {
  mallCreate,
  mallDelete,
  mallGet,
  mallQuery,
  mallUpdate,
} from '@/api/mall'
import { useDicts } from '@/composables/useDicts'
import { DICT_TYPES } from '@/types/dict'
import type { Mall, MallForm } from '@/types/mall'

const router = useRouter()

const loading = ref(false)
const saving = ref(false)
const records = ref<Mall[]>([])
const total = ref(0)
const pageNum = ref(1)
const pageSize = ref(10)
const dialogVisible = ref(false)
const editingId = ref<number | null>(null)
const formRef = ref<FormInstance>()

// 商场状态下拉来自后端字典（mall_status: 1=营业 0=停用）
const { options: dictOptions } = useDicts([DICT_TYPES.MALL_STATUS])
const mallStatusOptions = computed(() => dictOptions(DICT_TYPES.MALL_STATUS))

// 查询条件（对应 /business/mall/query：编码/名称/地址模糊 + 省份/城市/区县精确 + 状态）
const filters = reactive<{
  mallName?: string
  mallCode?: string
  province?: string
  city?: string
  district?: string
  address?: string
  status?: number
}>({
  mallName: undefined,
  mallCode: undefined,
  province: undefined,
  city: undefined,
  district: undefined,
  address: undefined,
  status: undefined,
})

const emptyForm = (): MallForm => ({
  mallCode: '',
  mallName: '',
  province: '',
  city: '',
  district: '',
  address: '',
  lng: undefined,
  lat: undefined,
  status: 1,
  remark: '',
})
const form = reactive<MallForm>(emptyForm())

const rules: FormRules = {
  mallCode: [{ required: true, message: '请输入商场编码', trigger: 'blur' }],
  mallName: [{ required: true, message: '请输入商场名称', trigger: 'blur' }],
}

/** 条件分页：pageSize 默认 10（与页面渲染条数一致），支持 名称/编码/状态 筛选 */
async function load() {
  loading.value = true
  try {
    const data = await mallQuery({
      pageNum: pageNum.value,
      pageSize: pageSize.value,
      mallName: filters.mallName?.trim() || undefined,
      mallCode: filters.mallCode?.trim() || undefined,
      province: filters.province?.trim() || undefined,
      city: filters.city?.trim() || undefined,
      district: filters.district?.trim() || undefined,
      address: filters.address?.trim() || undefined,
      status: filters.status,
    })
    records.value = data.records
    total.value = data.total
  } finally {
    loading.value = false
  }
}
/** 查询按钮：回到第一页再查询 */
function onSearch() {
  pageNum.value = 1
  load()
}
function onSizeChange() {
  pageNum.value = 1
  load()
}

function openCreate() {
  editingId.value = null
  Object.assign(form, emptyForm())
  dialogVisible.value = true
}

/** 编辑时通过 /business/mall/get 拉取最新商场信息（不依赖分页列表数据） */
async function openEdit(row: unknown) {
  const r = row as Mall
  editingId.value = r.id
  const detail = await mallGet(r.id)
  Object.assign(form, emptyForm(), detail)
  dialogVisible.value = true
}

async function onSubmit() {
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  saving.value = true
  try {
    if (editingId.value) {
      await mallUpdate({ ...form, id: editingId.value })
      ElMessage.success('修改成功')
    } else {
      await mallCreate({ ...form })
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
  const r = row as Mall
  await ElMessageBox.confirm(
    `确定删除商场「${r.mallName}」吗？`,
    '删除确认',
    { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' },
  ).catch(() => null)
  await mallDelete(r.id)
  ElMessage.success('删除成功')
  await load()
}

function goFloors(row: unknown) {
  const r = row as Mall
  router.push(`/mall/${r.id}/floors`)
}

load()
</script>
