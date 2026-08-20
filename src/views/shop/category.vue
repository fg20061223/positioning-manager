<template>
  <div class="page">
    <el-card shadow="never">
      <!-- 第一行：所属商场/父分类下拉 + 分类名称 + 查询 + 新建分类 -->
      <div class="toolbar">
        <el-select
          v-model="filters.mallId"
          placeholder="所属商场"
          clearable
          style="width: 150px"
          @change="onSearch"
        >
          <el-option v-for="m in malls" :key="m.id" :label="m.name" :value="m.id" />
        </el-select>
        <el-select
          v-model="filters.parentId"
          placeholder="父分类"
          clearable
          style="width: 150px"
          @change="onSearch"
        >
          <el-option v-for="c in allCategories" :key="c.id" :label="c.catName" :value="c.id" />
        </el-select>
        <el-input
          v-model="filters.catName"
          placeholder="分类名称"
          clearable
          style="width: 160px"
          @keyup.enter="onSearch"
          @clear="onSearch"
        />
        <el-button type="primary" :icon="Search" @click="onSearch">查询</el-button>
        <div class="spacer" />
        <el-button type="primary" :icon="Plus" @click="openCreate">新建分类</el-button>
      </div>

      <el-table v-loading="loading" :data="records" border stripe>
        <el-table-column prop="id" label="ID" width="170" />
        <el-table-column prop="catName" label="分类名称" min-width="150" />
        <el-table-column label="所属商场" width="160">
          <template #default="{ row }">
            <el-tag v-if="!row.mallId" size="small" type="info">平台通用</el-tag>
            <span v-else>{{ mallName(row.mallId) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="父分类" width="130">
          <template #default="{ row }">
            <el-tag v-if="row.parentId === 0" size="small" type="info">根分类</el-tag>
            <span v-else>{{ parentName(row.parentId) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="sortOrder" label="排序号" width="90" />
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag size="small" :type="row.status === 1 ? 'success' : 'info'">
              {{ row.status === 1 ? '启用' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
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
      :title="editingId ? '编辑分类' : '新建分类'"
      width="480px"
      destroy-on-close
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px" style="padding-right: 16px">
        <el-form-item label="分类名称" prop="catName">
          <el-input v-model="form.catName" />
        </el-form-item>
        <el-form-item label="所属商场">
          <el-select v-model="form.mallId" clearable placeholder="留空 = 平台通用" style="width: 100%">
            <el-option v-for="m in malls" :key="m.id" :label="m.name" :value="m.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="父分类">
          <el-select v-model="form.parentId" style="width: 100%">
            <el-option :value="0" label="根分类" />
            <el-option v-for="c in parentOptions" :key="c.id" :label="c.catName" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="排序号">
              <el-input-number v-model="form.sortOrder" :min="0" controls-position="right" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态">
              <el-radio-group v-model="form.status">
                <el-radio :value="1">启用</el-radio>
                <el-radio :value="0">停用</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>
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
import { Plus, Search } from '@element-plus/icons-vue'
import {
  ElMessage,
  ElMessageBox,
  type FormInstance,
  type FormRules,
} from 'element-plus'

import { mallOptions } from '@/api/mall'
import {
  shopCategoryCreate,
  shopCategoryDelete,
  shopCategoryPage,
  shopCategoryQuery,
  shopCategoryUpdate,
} from '@/api/shop'
import type { OptionVO } from '@/types/result'
import type { ShopCategory } from '@/types/shop'

const loading = ref(false)
const saving = ref(false)
const records = ref<ShopCategory[]>([])
const total = ref(0)
const pageNum = ref(1)
const pageSize = ref(10)
const malls = ref<OptionVO[]>([])
/** 全量分类（父分类下拉选项） */
const allCategories = ref<ShopCategory[]>([])

// 查询条件（分类名称模糊 + 所属商场 + 父分类）
const filters = reactive<{ catName?: string; mallId?: number; parentId?: number }>({
  catName: undefined,
  mallId: undefined,
  parentId: undefined,
})

async function load() {
  loading.value = true
  try {
    const data = await shopCategoryQuery({
      pageNum: pageNum.value,
      pageSize: pageSize.value,
      catName: filters.catName?.trim() || undefined,
      mallId: filters.mallId,
      parentId: filters.parentId,
    })
    records.value = data.records
    total.value = data.total
  } finally {
    loading.value = false
  }
}
function onSearch() {
  pageNum.value = 1
  load()
}
function onSizeChange() {
  pageNum.value = 1
  load()
}

const parentOptions = computed(() =>
  records.value.filter((c) => c.parentId === 0 || c.id !== editingId.value),
)

function mallName(id?: number) {
  return malls.value.find((m) => m.id === id)?.name ?? id
}
function parentName(id?: number) {
  return records.value.find((c) => c.id === id)?.catName ?? id
}

/* ---------- CRUD ---------- */
const dialogVisible = ref(false)
const editingId = ref<number | null>(null)
const formRef = ref<FormInstance>()

const emptyForm = () => ({
  mallId: undefined as number | undefined,
  parentId: 0,
  catName: '',
  sortOrder: 0,
  status: 1,
})
const form = reactive(emptyForm())

const rules: FormRules = {
  catName: [{ required: true, message: '请输入分类名称', trigger: 'blur' }],
}

function openCreate() {
  editingId.value = null
  Object.assign(form, emptyForm())
  dialogVisible.value = true
}
function openEdit(row: unknown) {
  const r = row as ShopCategory
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
      await shopCategoryUpdate({ ...form, id: editingId.value })
      ElMessage.success('修改成功')
    } else {
      await shopCategoryCreate({ ...form })
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
  const r = row as ShopCategory
  await ElMessageBox.confirm(
    `确定删除分类「${r.catName}」吗？`,
    '删除确认',
    { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' },
  ).catch(() => null)
  await shopCategoryDelete(r.id)
  ElMessage.success('删除成功')
  await load()
}

mallOptions().then((options) => (malls.value = options))
// 全量分类用于父分类下拉（父分类为 0 的根分类也保留在选项中，查询时后端按 parentId 精确匹配）
shopCategoryPage({ pageNum: 1, pageSize: 1000 }).then((d) => (allCategories.value = d.records))
load()
</script>

<style scoped></style>
