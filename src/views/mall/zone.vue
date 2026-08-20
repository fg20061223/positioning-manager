<template>
  <div class="page">
    <el-card shadow="never">
      <template #header>
        <div class="page-header">
          <div class="page-title">
            <el-button link type="primary" :icon="ArrowLeft" @click="back">返回</el-button>
            <span>{{ contextName }} · 分区管理</span>
          </div>
          <el-button type="primary" :icon="Plus" @click="openCreate">新建分区</el-button>
        </div>
      </template>

      <!-- 查询条件：楼层下拉（切换楼层）+ 分区编码/名称（后端模糊） -->
      <div class="toolbar">
        <el-select
          :model-value="floorId"
          placeholder="楼层"
          style="width: 140px"
          @change="onFloorSwitch"
        >
          <el-option v-for="f in floorOptionsList" :key="f.id" :label="f.name" :value="f.id" />
        </el-select>
        <el-input
          v-model="filters.zoneCode"
          placeholder="分区编码"
          clearable
          style="width: 140px"
          @keyup.enter="onSearch"
          @clear="onSearch"
        />
        <el-input
          v-model="filters.zoneName"
          placeholder="分区名称"
          clearable
          style="width: 160px"
          @keyup.enter="onSearch"
          @clear="onSearch"
        />
        <el-button type="primary" :icon="Search" @click="onSearch">查询</el-button>
      </div>

      <el-table v-loading="loading" :data="records" border stripe>
        <el-table-column prop="id" label="ID" width="170" />
        <el-table-column prop="zoneCode" label="分区编码" width="110" />
        <el-table-column prop="zoneName" label="分区名称" min-width="140" />
        <el-table-column label="颜色" width="90">
          <template #default="{ row }">
            <span class="color-dot" :style="{ backgroundColor: row.color || '#409eff' }" />
            {{ row.color || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="sortOrder" label="排序号" width="80" />
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
          @current-change="load"
          @size-change="onSizeChange"
        />
      </div>
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="editingId ? '编辑分区' : '新建分区'"
      width="500px"
      destroy-on-close
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="90px"
        style="padding-right: 16px"
      >
        <el-form-item label="分区编码" prop="zoneCode">
          <el-input v-model="form.zoneCode" placeholder="如 B区 / A区" />
        </el-form-item>
        <el-form-item label="分区名称" prop="zoneName">
          <el-input v-model="form.zoneName" />
        </el-form-item>
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="颜色">
              <el-color-picker v-model="form.color" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="排序号">
              <el-input-number
                v-model="form.sortOrder"
                :min="0"
                controls-position="right"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" :rows="2" />
        </el-form-item>
        <el-alert
          type="info"
          :closable="false"
          title="分区轮廓（geom）由导航图编辑器/空间接口维护，此处不编辑"
        />
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="onSubmit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Plus, Search } from '@element-plus/icons-vue'
import {
  ElMessage,
  ElMessageBox,
  type FormInstance,
  type FormRules,
} from 'element-plus'

import {
  floorGet,
  floorOptions,
  mallGet,
  mallOptions,
  zoneCreate,
  zoneDelete,
  zoneQuery,
  zoneUpdate,
} from '@/api/mall'
import type { MallZone, MallZoneForm } from '@/types/mall'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const saving = ref(false)
const contextName = ref('分区管理')
const records = ref<MallZone[]>([])
const total = ref(0)
const pageNum = ref(1)
const pageSize = ref(10)
const dialogVisible = ref(false)
const editingId = ref<number | null>(null)
const formRef = ref<FormInstance>()

/** 当前商场/楼层ID：来自路由；从菜单 /zones 进入时为空，加载时定位默认商场+楼层 */
const mallId = ref<number | null>(Number(route.params.mallId) || null)
const floorId = ref<number | null>(Number(route.params.floorId) || null)

// 该商场楼层下拉（切换楼层跳转）
const floorOptionsList = ref<{ id: number; name: string }[]>([])

const emptyForm = (): MallZoneForm => ({
  mallId: mallId.value ?? 0,
  floorId: floorId.value ?? 0,
  zoneCode: '',
  zoneName: '',
  color: '#409eff',
  sortOrder: 0,
  remark: '',
})
const form = reactive<MallZoneForm>(emptyForm())

const rules: FormRules = {
  zoneCode: [{ required: true, message: '请输入分区编码', trigger: 'blur' }],
  zoneName: [{ required: true, message: '请输入分区名称', trigger: 'blur' }],
}

// 查询条件（分区编码/名称，后端模糊；mallId/floorId 固定来自路由）
const filters = reactive<{ zoneCode?: string; zoneName?: string }>({
  zoneCode: undefined,
  zoneName: undefined,
})

/** 确认当前商场/楼层：无参数（从菜单 /zones 进入）时取第一个商场的第一个楼层并修正 URL */
async function ensureContext(): Promise<boolean> {
  if (mallId.value && floorId.value) return true
  const malls = await mallOptions().catch(() => [])
  if (!malls.length) return false
  const mid = Number(malls[0].id)
  const floors = await floorOptions({ mallId: mid }).catch(() => [])
  const fid = floors.length ? Number(floors[0].id) : 0
  mallId.value = mid
  floorId.value = fid
  router.replace(`/mall/${mid}/floor/${fid}/zones`)
  return true
}

/** 服务端条件分页：zone/query */
async function load() {
  loading.value = true
  try {
    if (!(await ensureContext())) {
      contextName.value = '暂无数据'
      records.value = []
      total.value = 0
      return
    }
    const data = await zoneQuery({
      pageNum: pageNum.value,
      pageSize: pageSize.value,
      mallId: mallId.value ?? undefined,
      floorId: floorId.value ?? undefined,
      zoneCode: filters.zoneCode?.trim() || undefined,
      zoneName: filters.zoneName?.trim() || undefined,
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

/** 切换楼层 -> 跳转到该楼层分区页 */
function onFloorSwitch(id: number) {
  if (id && id !== floorId.value) {
    router.push(`/mall/${mallId.value}/floor/${id}/zones`)
  }
}

function openCreate() {
  editingId.value = null
  Object.assign(form, emptyForm())
  dialogVisible.value = true
}

function openEdit(row: unknown) {
  const r = row as MallZone
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
      await zoneUpdate({ ...form, id: editingId.value })
      ElMessage.success('修改成功')
    } else {
      await zoneCreate({ ...form })
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
  const r = row as MallZone
  await ElMessageBox.confirm(
    `确定删除分区「${r.zoneName}」吗？`,
    '删除确认',
    { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' },
  ).catch(() => null)
  await zoneDelete(r.id)
  ElMessage.success('删除成功')
  await load()
}

function back() {
  router.push(`/mall/${mallId.value}/floors`)
}

/** 初始化：上下文名称（商场/楼层）+ 楼层下拉选项 */
async function init() {
  const [mall, floor, opts] = await Promise.all([
    mallGet(mallId.value ?? 0).catch(() => null),
    floorGet(floorId.value ?? 0).catch(() => null),
    floorOptions({ mallId: mallId.value ?? undefined }),
  ])
  const parts = [
    mall?.mallName ?? `商场 #${mallId.value ?? '-'}`,
    floor?.floorName ?? `楼层 #${floorId.value ?? '-'}`,
  ]
  contextName.value = parts.join(' / ')
  floorOptionsList.value = opts
}

// 路由参数变化（含 /zones 无参进入时自动修正）时刷新上下文与列表
watch(
  () => [route.params.mallId, route.params.floorId],
  () => {
    const m = Number(route.params.mallId)
    const f = Number(route.params.floorId)
    mallId.value = Number.isFinite(m) && m > 0 ? m : null
    floorId.value = Number.isFinite(f) && f > 0 ? f : null
    init()
    load()
  },
  { immediate: true },
)
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

.color-dot {
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 2px;
  vertical-align: middle;
  margin-right: 4px;
}
</style>
