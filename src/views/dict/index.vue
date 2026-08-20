<template>
  <div class="page">
    <el-card shadow="never">
      <!-- 查询条件：字典类型下拉 + 编码/名称关键词（dict/page 为全量分页，前端过滤） -->
      <div class="toolbar">
        <el-select
          v-model="filters.dictType"
          placeholder="字典类型"
          clearable
          filterable
          style="width: 200px"
          @change="resetPage"
        >
          <el-option v-for="t in dictTypes" :key="t" :label="t" :value="t" />
        </el-select>
        <el-input
          v-model="keyword"
          placeholder="编码 / 名称"
          clearable
          style="width: 180px"
          @input="resetPage"
        />
        <el-button type="primary" :icon="Search" @click="resetPage">查询</el-button>
        <div class="spacer" />
        <el-button type="primary" :icon="Plus" @click="openCreate">新增字典</el-button>
      </div>

      <el-table v-loading="loading" :data="paged" border stripe>
        <el-table-column prop="id" label="ID" width="170" />
        <el-table-column prop="dictType" label="字典类型" width="180" show-overflow-tooltip />
        <el-table-column prop="dictCode" label="编码" width="180" />
        <el-table-column prop="dictLabel" label="名称" min-width="120" />
        <el-table-column prop="sortOrder" label="排序号" width="90" />
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag size="small" :type="row.status === 1 ? 'success' : 'info'">
              {{ row.status === 1 ? '启用' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="140" show-overflow-tooltip />
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

    <!-- 新增 / 编辑 -->
    <el-dialog
      v-model="dialogVisible"
      :title="editingId ? '编辑字典' : '新增字典'"
      width="520px"
      destroy-on-close
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px" style="padding-right: 16px">
        <el-form-item label="字典类型" prop="dictType">
          <el-select
            v-model="form.dictType"
            filterable
            allow-create
            default-first-option
            placeholder="选择或输入新类型"
            style="width: 100%"
          >
            <el-option v-for="t in dictTypes" :key="t" :label="t" :value="t" />
          </el-select>
        </el-form-item>
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="编码" prop="dictCode">
              <el-input v-model="form.dictCode" placeholder="如 NORMAL" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="名称" prop="dictLabel">
              <el-input v-model="form.dictLabel" placeholder="中文展示文案" />
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
            <el-form-item label="状态">
              <el-radio-group v-model="form.status">
                <el-radio :value="1">启用</el-radio>
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
import { Plus, Search } from '@element-plus/icons-vue'
import {
  ElMessage,
  ElMessageBox,
  type FormInstance,
  type FormRules,
} from 'element-plus'

import {
  dictCreate,
  dictDelete,
  dictPage,
  dictUpdate,
} from '@/api/dict'
import { useLocalPaging } from '@/composables/useLocalPaging'
import type { SysDict } from '@/types/dict'

const loading = ref(false)
const saving = ref(false)
const records = ref<SysDict[]>([])
const keyword = ref('')
const filters = reactive<{ dictType?: string }>({ dictType: undefined })

/** 字典类型列表（去重，供下拉与筛选） */
const dictTypes = computed(() => {
  const set = new Set<string>()
  for (const r of records.value) {
    if (r.dictType) set.add(r.dictType)
  }
  return Array.from(set).sort()
})

const filtered = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  return records.value.filter((r) => {
    if (filters.dictType && r.dictType !== filters.dictType) return false
    if (kw) {
      return (
        r.dictCode.toLowerCase().includes(kw) ||
        r.dictLabel.toLowerCase().includes(kw)
      )
    }
    return true
  })
})

const { pageNum, pageSize, total, paged, resetPage } = useLocalPaging(
  () => filtered.value,
)

async function load() {
  loading.value = true
  try {
    // dict/page 为无条件全量分页，拉全量后前端过滤
    const data = await dictPage({ pageNum: 1, pageSize: 1000 })
    records.value = data.records
  } finally {
    loading.value = false
  }
}

/* ---------- CRUD ---------- */
const dialogVisible = ref(false)
const editingId = ref<number | null>(null)
const formRef = ref<FormInstance>()

const emptyForm = () => ({
  dictType: '',
  dictCode: '',
  dictLabel: '',
  sortOrder: 0,
  status: 1,
  remark: '',
})
const form = reactive(emptyForm())

const rules: FormRules = {
  dictType: [{ required: true, message: '请输入字典类型', trigger: 'blur' }],
  dictCode: [{ required: true, message: '请输入编码', trigger: 'blur' }],
  dictLabel: [{ required: true, message: '请输入名称', trigger: 'blur' }],
}

function openCreate() {
  editingId.value = null
  Object.assign(form, emptyForm())
  dialogVisible.value = true
}

function openEdit(row: unknown) {
  const r = row as SysDict
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
      await dictUpdate({ ...form, id: editingId.value })
      ElMessage.success('修改成功')
    } else {
      await dictCreate({ ...form })
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
  const r = row as SysDict
  await ElMessageBox.confirm(
    `确定删除字典「${r.dictType}/${r.dictCode}」吗？`,
    '删除确认',
    { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' },
  ).catch(() => null)
  await dictDelete(r.id)
  ElMessage.success('删除成功')
  await load()
}

load()
</script>
