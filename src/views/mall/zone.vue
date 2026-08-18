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

      <el-table v-loading="loading" :data="paged" border stripe>
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
import { computed, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Plus } from '@element-plus/icons-vue'
import {
  ElMessage,
  ElMessageBox,
  type FormInstance,
  type FormRules,
} from 'element-plus'

import {
  floorGet,
  mallGet,
  zoneCreate,
  zoneDelete,
  zonePage,
  zoneUpdate,
} from '@/api/mall'
import { useLocalPaging } from '@/composables/useLocalPaging'
import type { MallZone, MallZoneForm } from '@/types/mall'
import { eqId } from '@/utils/id'

const route = useRoute()
const router = useRouter()
const mallId = Number(route.params.mallId)
const floorId = Number(route.params.floorId)

const loading = ref(false)
const saving = ref(false)
const contextName = ref('分区管理')
const allZones = ref<MallZone[]>([])
const dialogVisible = ref(false)
const editingId = ref<number | null>(null)
const formRef = ref<FormInstance>()

const emptyForm = (): MallZoneForm => ({
  mallId,
  floorId,
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

// 后端 zone/page 为无条件全量分页，按当前楼层本地过滤（雪花 ID 跨表示比较用 eqId）
const floorZones = computed(() =>
  allZones.value.filter((z) => eqId(z.floorId, floorId)),
)
const { pageNum, pageSize, total, paged } = useLocalPaging(
  () => floorZones.value,
)

async function load() {
  loading.value = true
  try {
    const mall = await mallGet(mallId).catch(() => null)
    const floor = await floorGet(floorId).catch(() => null)
    const parts = [
      mall?.mallName ?? `商场 #${mallId}`,
      floor?.floorName ?? `楼层 #${floorId}`,
    ]
    contextName.value = parts.join(' / ')
    const data = await zonePage({ pageNum: 1, pageSize: 1000 })
    allZones.value = data.records
  } finally {
    loading.value = false
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
  router.push(`/mall/${mallId}/floors`)
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

.color-dot {
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 2px;
  vertical-align: middle;
  margin-right: 4px;
}
</style>
