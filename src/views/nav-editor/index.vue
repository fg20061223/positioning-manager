<template>
  <div class="page nav-editor">
    <!-- 工具条 -->
    <el-card shadow="never" class="nav-editor__toolbar">
      <div class="toolbar">
        <el-button link type="primary" :icon="ArrowLeft" @click="back">返回</el-button>
        <span class="title">{{ mallName }} · {{ floorName }}</span>
        <el-select
          :model-value="floorId"
          placeholder="切换楼层"
          style="width: 150px"
          @change="onFloorSwitch"
        >
          <el-option v-for="f in floors" :key="f.id" :label="f.name" :value="f.id" />
        </el-select>
        <el-divider direction="vertical" />
        <el-radio-group v-model="tool" size="small">
          <el-radio-button value="select">选择</el-radio-button>
          <el-radio-button value="create-node">新建节点</el-radio-button>
          <el-radio-button value="create-edge">连边</el-radio-button>
          <el-radio-button value="connect-floor">跨层</el-radio-button>
          <el-radio-button value="delete">删除</el-radio-button>
          <el-radio-button value="route">路径预览</el-radio-button>
        </el-radio-group>
        <span class="tool-hint">{{ toolHint }}</span>
        <div class="spacer" />
        <el-button size="small" @click="clearSelection">清空选择</el-button>
        <el-button size="small" type="primary" @click="reload">刷新</el-button>
      </div>
    </el-card>

    <!-- 画布 + 属性面板 -->
    <div class="nav-editor__body">
      <el-card shadow="never" class="nav-editor__canvas-wrap">
        <NavCanvas
          :nodes="nodes"
          :edges="edges"
          :connects="connects"
          :floor-image="floorImage"
          :tool="tool"
          :selected="selected"
          :route="route"
          :focus="focusPoint"
          height="640px"
          @canvas-click="onCanvasClick"
          @node-click="onNodeClick"
          @edge-click="onEdgeClick"
          @node-drag="onNodeDrag"
        />
      </el-card>

      <el-card shadow="never" class="nav-editor__panel">
        <template #header>
          <span>属性 / 详情</span>
        </template>
        <el-empty v-if="!selected" description="未选中对象" :image-size="60" />
        <template v-else>
          <!-- 节点属性 -->
          <template v-if="selected.type === 'node'">
            <el-form label-width="72px" size="small">
              <el-form-item label="类型">
                <el-tag size="small">{{ nodeTypeLabel(selNode?.nodeType) }}</el-tag>
              </el-form-item>
              <el-form-item label="名称">
                <el-input v-model="selNodeForm.name" />
              </el-form-item>
              <el-form-item label="可通行">
                <el-switch v-model="selNodeForm.isAccessible" />
              </el-form-item>
              <el-form-item label="排序号">
                <el-input-number v-model="selNodeForm.sortOrder" :min="0" controls-position="right" style="width: 100%" />
              </el-form-item>
              <el-form-item label="备注">
                <el-input v-model="selNodeForm.remark" type="textarea" :rows="2" />
              </el-form-item>
            </el-form>
            <div class="panel-actions">
              <el-button size="small" type="primary" @click="saveNode">保存节点</el-button>
              <el-button size="small" type="danger" @click="deleteNode(selNode?.id)">删除节点</el-button>
            </div>
          </template>
          <!-- 边属性 -->
          <template v-else-if="selected.type === 'edge'">
            <el-form label-width="72px" size="small">
              <el-form-item label="连接">
                <span class="mono">{{ selEdge ? `${nodeName(selEdge.fromNodeId)} → ${nodeName(selEdge.toNodeId)}` : '-' }}</span>
              </el-form-item>
              <el-form-item label="类型">
                <el-select v-model="selEdgeForm.edgeType" style="width: 100%">
                  <el-option v-for="t in edgeTypeOptions" :key="t.code" :label="t.label" :value="t.code" />
                </el-select>
              </el-form-item>
              <el-form-item label="距离(米)">
                <span class="mono">{{ selEdge?.distanceM?.toFixed(2) }}</span>
              </el-form-item>
              <el-form-item label="权重">
                <el-input-number v-model="selEdgeForm.weight" :min="0.1" :step="0.1" controls-position="right" style="width: 100%" />
              </el-form-item>
              <el-form-item label="双向">
                <el-switch v-model="selEdgeForm.bidirectional" />
              </el-form-item>
              <el-form-item label="可用">
                <el-switch :model-value="selEdgeForm.status === 1" @change="(v: boolean | string | number) => (selEdgeForm.status = v ? 1 : 0)" />
              </el-form-item>
            </el-form>
            <div class="panel-actions">
              <el-button size="small" type="primary" @click="saveEdge">保存边</el-button>
              <el-button size="small" type="danger" @click="deleteEdge(selEdge?.id)">删除边</el-button>
            </div>
          </template>
          <!-- 跨层属性 -->
          <template v-else>
            <el-form label-width="72px" size="small">
              <el-form-item label="连接方式">
                <el-select v-model="selConnectForm.connectType" style="width: 100%">
                  <el-option v-for="t in connectTypeOptions" :key="t.code" :label="t.label" :value="t.code" />
                </el-select>
              </el-form-item>
              <el-form-item label="起→止">
                <span class="mono">{{ nodeName(selConnect?.fromNodeId ?? 0) }} → {{ nodeName(selConnect?.toNodeId ?? 0) }}</span>
              </el-form-item>
              <el-form-item label="成本(米)">
                <el-input-number v-model="selConnectForm.costM" :min="0" :step="1" controls-position="right" style="width: 100%" />
              </el-form-item>
              <el-form-item label="可用">
                <el-switch :model-value="selConnectForm.status === 1" @change="(v: boolean | string | number) => (selConnectForm.status = v ? 1 : 0)" />
              </el-form-item>
            </el-form>
            <div class="panel-actions">
              <el-button size="small" type="primary" @click="saveConnect">保存跨层</el-button>
              <el-button size="small" type="danger" @click="deleteConnect(selConnect?.id)">删除跨层</el-button>
            </div>
          </template>
        </template>
      </el-card>
    </div>

    <!-- 路径预览结果 -->
    <el-card v-if="route" shadow="never" class="nav-editor__route">
      <div class="route-bar">
        <span>路径总长：<b>{{ route.totalDistanceM.toFixed(2) }} 米</b>（{{ route.segments.length }} 段）</span>
        <el-button link type="primary" @click="route = null">清除路径</el-button>
      </div>
      <el-table :data="route.segments" size="small" border max-height="160">
        <el-table-column label="起点 → 终点" min-width="160">
          <template #default="{ row }">{{ nodeName(row.fromNodeId) }} → {{ nodeName(row.toNodeId) }}</template>
        </el-table-column>
        <el-table-column label="方式" width="100">
          <template #default="{ row }">{{ edgeTypeLabel(row.edgeType) }}</template>
        </el-table-column>
        <el-table-column label="跨层" width="70">
          <template #default="{ row }">
            <el-tag v-if="row.crossFloor" size="small" type="warning">跨层</el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="距离(米)" width="100">
          <template #default="{ row }">{{ row.distanceM.toFixed(2) }}</template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新建节点 -->
    <el-dialog v-model="nodeDialog" title="新建节点" width="420px" destroy-on-close>
      <el-form ref="nodeFormRef" :model="nodeForm" :rules="nodeRules" label-width="80px">
        <el-form-item label="类型" prop="nodeType">
          <el-select v-model="nodeForm.nodeType" style="width: 100%">
            <el-option v-for="t in nodeTypeOptions" :key="t.code" :label="t.label" :value="t.code" />
          </el-select>
        </el-form-item>
        <el-form-item label="名称">
          <el-input v-model="nodeForm.name" placeholder="如 电梯A / B3-012 入口" />
        </el-form-item>
        <el-form-item label="可通行">
          <el-switch v-model="nodeForm.isAccessible" />
        </el-form-item>
        <el-form-item label="排序号">
          <el-input-number v-model="nodeForm.sortOrder" :min="0" controls-position="right" style="width: 100%" />
        </el-form-item>
        <el-form-item label="坐标">
          <span class="mono">({{ nodeDraft?.x?.toFixed(2) }}, {{ nodeDraft?.y?.toFixed(2) }})</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="nodeDialog = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="submitNode">保存</el-button>
      </template>
    </el-dialog>

    <!-- 新建边 -->
    <el-dialog v-model="edgeDialog" title="新建边" width="420px" destroy-on-close>
      <el-form ref="edgeFormRef" :model="edgeForm" :rules="edgeRules" label-width="80px">
        <el-form-item label="起点">
          <span class="mono">{{ nodeName(edgeDraft?.from ?? 0) }}</span>
        </el-form-item>
        <el-form-item label="终点">
          <span class="mono">{{ nodeName(edgeDraft?.to ?? 0) }}</span>
        </el-form-item>
        <el-form-item label="距离(米)">
          <span class="mono">{{ edgeDistance.toFixed(2) }}（自动计算）</span>
        </el-form-item>
        <el-form-item label="类型" prop="edgeType">
          <el-select v-model="edgeForm.edgeType" style="width: 100%">
            <el-option v-for="t in edgeTypeOptions" :key="t.code" :label="t.label" :value="t.code" />
          </el-select>
        </el-form-item>
        <el-form-item label="双向">
          <el-switch v-model="edgeForm.bidirectional" />
        </el-form-item>
        <el-form-item label="权重">
          <el-input-number v-model="edgeForm.weight" :min="0.1" :step="0.1" controls-position="right" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="edgeDialog = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="submitEdge">保存</el-button>
      </template>
    </el-dialog>

    <!-- 跨层连接 -->
    <el-dialog v-model="connectDialog" title="创建跨层连接" width="440px" destroy-on-close>
      <el-form ref="connectFormRef" :model="connectForm" :rules="connectRules" label-width="90px">
        <el-form-item label="本层节点">
          <span class="mono">{{ nodeName(connectDraft ?? 0) }}</span>
        </el-form-item>
        <el-form-item label="目标楼层" prop="targetFloorId">
          <el-select v-model="connectForm.targetFloorId" style="width: 100%" @change="onTargetFloorChange">
            <el-option v-for="f in otherFloors" :key="f.id" :label="f.name" :value="f.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="目标节点" prop="toNodeId">
          <el-select v-model="connectForm.toNodeId" style="width: 100%">
            <el-option v-for="n in targetFloorNodes" :key="n.id" :label="nodeLabel(n)" :value="n.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="方式" prop="connectType">
          <el-select v-model="connectForm.connectType" style="width: 100%">
            <el-option v-for="t in connectTypeOptions" :key="t.code" :label="t.label" :value="t.code" />
          </el-select>
        </el-form-item>
        <el-form-item label="成本(米)">
          <el-input-number v-model="connectForm.costM" :min="0" :step="1" controls-position="right" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="connectDialog = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="submitConnect">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft } from '@element-plus/icons-vue'
import {
  ElMessage,
  ElMessageBox,
  type FormInstance,
  type FormRules,
} from 'element-plus'

import { floorByMall, floorGet, mallGet } from '@/api/mall'
import {
  floorConnectCreate,
  floorConnectDelete,
  floorConnectPage,
  floorConnectUpdate,
  navEdgeCreate,
  navEdgeDelete,
  navEdgeQuery,
  navEdgeUpdate,
  navNodeCreate,
  navNodeDelete,
  navNodeQuery,
  navNodeQueryGeometry,
  navNodeUpdate,
  navNodeUpdateGeometry,
  navRoute,
} from '@/api/nav'
import NavCanvas from '@/components/NavCanvas.vue'
import { useDicts } from '@/composables/useDicts'
import { DICT_TYPES } from '@/types/dict'
import type { Calibration } from '@/types/file'
import type {
  ConnectType,
  FloorConnect,
  NavEdge,
  NavEdgeType,
  NavNode,
  NavNodeType,
  RouteVO,
} from '@/types/nav'

const routeObj = useRoute()
const router = useRouter()
// 响应式路由参数：切换楼层时路由复用同一组件实例，必须用 computed 才能感知变化
const mallId = computed(() => Number(routeObj.params.mallId))
const floorId = computed(() => Number(routeObj.params.floorId))

const loading = ref(false)
const saving = ref(false)
const mallName = ref('')
const floorName = ref('')
const floors = ref<{ id: number; name: string }[]>([])
const floorImage = ref<{ url: string; calibration?: Calibration | null } | undefined>(undefined)

const nodes = ref<NavNode[]>([])
const edges = ref<NavEdge[]>([])
const connects = ref<FloorConnect[]>([])
const route = ref<RouteVO | null>(null)
/** 新建节点后请求画布视野跟随到该点 */
const focusPoint = ref<{ x: number; y: number } | null>(null)

const tool = ref<'select' | 'create-node' | 'create-edge' | 'connect-floor' | 'delete' | 'route'>('select')
const selected = ref<{ type: 'node' | 'edge' | 'connect'; id: number } | null>(null)

// 字典：节点类型/边类型/跨层方式
const { options: dictOptions, label: dictLabel } = useDicts([
  DICT_TYPES.NAV_NODE_TYPE,
  DICT_TYPES.NAV_EDGE_TYPE,
  DICT_TYPES.CONNECT_TYPE,
])
const nodeTypeOptions = computed(() => dictOptions(DICT_TYPES.NAV_NODE_TYPE))
const edgeTypeOptions = computed(() => dictOptions(DICT_TYPES.NAV_EDGE_TYPE))
const connectTypeOptions = computed(() => dictOptions(DICT_TYPES.CONNECT_TYPE))

const toolHint = computed(() => {
  const map = {
    select: '点击节点/边选中；拖拽节点可移动',
    'create-node': '点击画布空白处放置节点',
    'create-edge': '依次点击起点节点、终点节点',
    'connect-floor': '点击本层节点作为起点，再选目标楼层与节点',
    delete: '点击节点或边进行删除',
    route: '依次点击起点节点、终点节点预览路径',
  } as const
  return map[tool.value]
})

/* ---------- 数据加载 ---------- */
function parseCalibration(remark?: string): Calibration | null {
  if (!remark) return null
  try {
    const o = JSON.parse(remark)
    if (o?.calibration) return o.calibration as Calibration
  } catch {
    // 普通备注
  }
  return null
}

async function load() {
  loading.value = true
  try {
    const [mall, floor, nodesData, edgesData, connectsData] = await Promise.all([
      mallGet(mallId.value).catch(() => null),
      floorGet(floorId.value).catch(() => null),
      navNodeQueryGeometry(mallId.value, floorId.value),
      navEdgeQuery(mallId.value),
      floorConnectPage({ pageNum: 1, pageSize: 1000 }),
    ])
    mallName.value = mall?.mallName ?? `商场 #${mallId.value}`
    floorName.value = floor?.floorName ?? `楼层 #${floorId.value}`
    floorImage.value = floor?.imageUrl
      ? { url: floor.imageUrl, calibration: parseCalibration(floor.remark) }
      : undefined

    // query-geometry 返回 geomGeoJson（GeoJSON），转成节点渲染结构
    nodes.value = nodesData.map((g) => ({
      id: g.id,
      mallId: g.mallId,
      floorId: g.floorId,
      nodeType: g.nodeType,
      name: g.name,
      geom: g.geomGeoJson,
      isAccessible: g.isAccessible,
      sortOrder: g.sortOrder,
      remark: g.remark,
    }))
    // 当前楼层的边 = 两端节点都在本层
    const nodeIds = new Set(nodes.value.map((n) => n.id))
    edges.value = edgesData.records.filter(
      (e) => nodeIds.has(e.fromNodeId) && nodeIds.has(e.toNodeId),
    )
    // 本层出发的跨层连接
    connects.value = connectsData.records.filter(
      (c) => c.mallId === mallId.value && c.fromFloorId === floorId.value,
    )
    route.value = null
    selected.value = null
  } finally {
    loading.value = false
  }
}

async function loadFloors() {
  const list = await floorByMall({ mallId: mallId.value })
  floors.value = list.map((f) => ({ id: f.id, name: f.floorName }))
}

function onFloorSwitch(id: number) {
  if (id && id !== floorId.value) {
    router.push(`/nav-editor/${mallId.value}/${id}`)
  }
}

/** 路由参数变化（含楼层切换）时重载数据并复位本地状态 */
watch(
  () => [mallId.value, floorId.value],
  async () => {
    nodes.value = []
    edges.value = []
    connects.value = []
    route.value = null
    selected.value = null
    edgeDraft.value = null
    routeDraft.value = null
    focusPoint.value = null
    nodeDialog.value = false
    edgeDialog.value = false
    connectDialog.value = false
    tool.value = 'select'
    await loadFloors()
    await load()
  },
)

function reload() {
  load()
}

function back() {
  router.push(`/mall/${mallId.value}/floors`)
}

/* ---------- 辅助 ---------- */
function nodeCoord(n: NavNode | undefined): [number, number] | null {
  if (!n?.geom) return null
  try {
    const g = JSON.parse(n.geom)
    if (g.type === 'Point') return [g.coordinates[0], g.coordinates[1]]
  } catch {
    return null
  }
  return null
}
function nodeName(id: number): string {
  const n = nodes.value.find((x) => x.id === id)
  if (!n) return `#${id}`
  return n.name ? `${n.name}(#${id})` : `#${id}`
}
function nodeLabel(n: NavNode): string {
  return n.name ? `${n.name}(#${n.id})` : `#${n.id}`
}
function nodeTypeLabel(t?: string) {
  return dictLabel(DICT_TYPES.NAV_NODE_TYPE, t)
}
function edgeTypeLabel(t?: string) {
  return dictLabel(DICT_TYPES.NAV_EDGE_TYPE, t)
}

const otherFloors = computed(() => floors.value.filter((f) => f.id !== floorId.value))

/* ---------- 画布事件 ---------- */
const nodeDraft = ref<{ x: number; y: number } | null>(null)
const nodeDialog = ref(false)
const nodeForm = reactive<{
  nodeType: NavNodeType
  name: string
  isAccessible: boolean
  sortOrder: number
}>({ nodeType: 'WAYPOINT', name: '', isAccessible: true, sortOrder: 0 })
const nodeFormRef = ref<FormInstance>()
const nodeRules: FormRules = {
  nodeType: [{ required: true, message: '请选择节点类型', trigger: 'change' }],
}

function onCanvasClick(pos: { x: number; y: number }) {
  if (tool.value !== 'create-node') return
  nodeDraft.value = pos
  Object.assign(nodeForm, { nodeType: 'WAYPOINT', name: '', isAccessible: true, sortOrder: 0 })
  nodeDialog.value = true
}

async function submitNode() {
  if (!nodeFormRef.value) return
  const valid = await nodeFormRef.value.validate().catch(() => false)
  if (!valid || !nodeDraft.value) return
  saving.value = true
  try {
    await navNodeCreate({
      mallId: mallId.value,
      floorId: floorId.value,
      nodeType: nodeForm.nodeType,
      name: nodeForm.name || undefined,
      geomGeoJson: JSON.stringify({
        type: 'Point',
        coordinates: [nodeDraft.value.x, nodeDraft.value.y],
      }),
      isAccessible: nodeForm.isAccessible,
      sortOrder: nodeForm.sortOrder,
    })
    ElMessage.success('节点已创建')
    nodeDialog.value = false
    await load()
    // 视野跟随到新节点，避免"不知道新节点在哪"
    if (nodeDraft.value) {
      focusPoint.value = { x: nodeDraft.value.x, y: nodeDraft.value.y }
    }
  } catch {
    // 拦截器已提示
  } finally {
    saving.value = false
  }
}

/* ---------- 连边 ---------- */
const edgeDraft = ref<{ from: number; to: number } | null>(null)
const edgeDialog = ref(false)
const edgeForm = reactive<{ edgeType: NavEdgeType; bidirectional: boolean; weight: number }>({
  edgeType: 'WALK',
  bidirectional: true,
  weight: 1,
})
const edgeFormRef = ref<FormInstance>()
const edgeRules: FormRules = {
  edgeType: [{ required: true, message: '请选择边类型', trigger: 'change' }],
}
const edgeDistance = computed(() => {
  if (!edgeDraft.value) return 0
  const a = nodeCoord(nodes.value.find((n) => n.id === edgeDraft.value!.from))
  const b = nodeCoord(nodes.value.find((n) => n.id === edgeDraft.value!.to))
  if (!a || !b) return 0
  return Math.hypot(a[0] - b[0], a[1] - b[1])
})

async function submitEdge() {
  if (!edgeFormRef.value) return
  const valid = await edgeFormRef.value.validate().catch(() => false)
  if (!valid || !edgeDraft.value) return
  saving.value = true
  try {
    await navEdgeCreate({
      mallId: mallId.value,
      fromNodeId: edgeDraft.value.from,
      toNodeId: edgeDraft.value.to,
      edgeType: edgeForm.edgeType,
      distanceM: Number(edgeDistance.value.toFixed(2)),
      weight: edgeForm.weight,
      bidirectional: edgeForm.bidirectional,
      status: 1,
    })
    ElMessage.success('边已创建')
    edgeDialog.value = false
    await load()
  } catch {
    // 拦截器已提示
  } finally {
    saving.value = false
  }
}

/* ---------- 跨层 ---------- */
const connectDraft = ref<number | null>(null)
const connectDialog = ref(false)
const targetFloorNodes = ref<NavNode[]>([])
const connectForm = reactive<{
  targetFloorId?: number
  toNodeId?: number
  connectType: ConnectType
  costM: number
}>({ targetFloorId: undefined, toNodeId: undefined, connectType: 'ELEVATOR', costM: 10 })
const connectFormRef = ref<FormInstance>()
const connectRules: FormRules = {
  targetFloorId: [{ required: true, message: '请选择目标楼层', trigger: 'change' }],
  toNodeId: [{ required: true, message: '请选择目标节点', trigger: 'change' }],
  connectType: [{ required: true, message: '请选择连接方式', trigger: 'change' }],
}

async function onTargetFloorChange(id: number) {
  connectForm.toNodeId = undefined
  targetFloorNodes.value = []
  if (!id) return
  try {
    const data = await navNodeQuery(mallId.value, id)
    targetFloorNodes.value = data.records
  } catch {
    // 忽略
  }
}

async function submitConnect() {
  if (!connectFormRef.value) return
  const valid = await connectFormRef.value.validate().catch(() => false)
  if (!valid || connectDraft.value == null || connectForm.toNodeId == null || !connectForm.targetFloorId) {
    return
  }
  saving.value = true
  try {
    await floorConnectCreate({
      mallId: mallId.value,
      fromFloorId: floorId.value,
      toFloorId: connectForm.targetFloorId,
      connectType: connectForm.connectType,
      fromNodeId: connectDraft.value,
      toNodeId: connectForm.toNodeId,
      costM: connectForm.costM,
      status: 1,
    })
    ElMessage.success('跨层连接已创建')
    connectDialog.value = false
    await load()
  } catch {
    // 拦截器已提示
  } finally {
    saving.value = false
  }
}

/* ---------- 点击分发 ---------- */
async function onNodeClick(id: number) {
  switch (tool.value) {
    case 'select':
      selected.value = { type: 'node', id }
      syncPanelForms()
      break
    case 'create-edge':
      if (!edgeDraft.value) {
        edgeDraft.value = { from: id, to: 0 }
        ElMessage.info('已选起点，请再点击终点节点')
      } else if (edgeDraft.value.from !== id) {
        edgeDraft.value = { from: edgeDraft.value.from, to: id }
        Object.assign(edgeForm, { edgeType: 'WALK', bidirectional: true, weight: 1 })
        edgeDialog.value = true
      }
      break
    case 'connect-floor':
      connectDraft.value = id
      Object.assign(connectForm, { targetFloorId: undefined, toNodeId: undefined, connectType: 'ELEVATOR', costM: 10 })
      targetFloorNodes.value = []
      connectDialog.value = true
      break
    case 'delete':
      await deleteNode(id)
      break
    case 'route':
      await pickRouteNode(id)
      break
    default:
      break
  }
}

async function onEdgeClick(id: number) {
  if (tool.value === 'select') {
    selected.value = { type: 'edge', id }
    syncPanelForms()
  } else if (tool.value === 'delete') {
    await deleteEdge(id)
  }
}

/* ---------- 路径预览 ---------- */
const routeDraft = ref<number | null>(null)
async function pickRouteNode(id: number) {
  if (!routeDraft.value) {
    routeDraft.value = id
    ElMessage.info('已选起点，请再点击终点节点')
    return
  }
  const from = routeDraft.value
  routeDraft.value = null
  if (from === id) return
  loading.value = true
  try {
    const r = await navRoute({ mallId: mallId.value, fromNodeId: from, toNodeId: id })
    route.value = r
  } catch {
    // 拦截器已提示（如无连通路径）
  } finally {
    loading.value = false
  }
}

/* ---------- 删除（先删引用边/跨层，再删节点） ---------- */
async function deleteNode(id?: number) {
  if (id == null) return
  await ElMessageBox.confirm('删除节点将同时删除引用它的边与跨层连接，确定？', '删除确认', {
    type: 'warning',
    confirmButtonText: '删除',
    cancelButtonText: '取消',
  }).catch(() => null)
  saving.value = true
  try {
    const refEdges = edges.value.filter((e) => e.fromNodeId === id || e.toNodeId === id)
    for (const e of refEdges) {
      await navEdgeDelete(e.id)
    }
    const refConnects = connects.value.filter((c) => c.fromNodeId === id || c.toNodeId === id)
    for (const c of refConnects) {
      await floorConnectDelete(c.id)
    }
    await navNodeDelete(id)
    ElMessage.success('节点已删除')
    if (selected.value?.type === 'node' && selected.value.id === id) selected.value = null
    await load()
  } catch {
    // 拦截器已提示
  } finally {
    saving.value = false
  }
}

async function deleteEdge(id?: number) {
  if (id == null) return
  await ElMessageBox.confirm('确定删除该边？', '删除确认', {
    type: 'warning',
    confirmButtonText: '删除',
    cancelButtonText: '取消',
  }).catch(() => null)
  await navEdgeDelete(id)
  ElMessage.success('边已删除')
  if (selected.value?.type === 'edge' && selected.value.id === id) selected.value = null
  await load()
}

async function deleteConnect(id?: number) {
  if (id == null) return
  await ElMessageBox.confirm('确定删除该跨层连接？', '删除确认', {
    type: 'warning',
    confirmButtonText: '删除',
    cancelButtonText: '取消',
  }).catch(() => null)
  await floorConnectDelete(id)
  ElMessage.success('跨层连接已删除')
  if (selected.value?.type === 'connect' && selected.value.id === id) selected.value = null
  await load()
}

/* ---------- 节点拖拽 ---------- */
async function onNodeDrag(payload: { id: number; x: number; y: number }) {
  try {
    await navNodeUpdateGeometry({
      id: payload.id,
      geomGeoJson: JSON.stringify({ type: 'Point', coordinates: [payload.x, payload.y] }),
    })
    // 更新本地节点坐标，避免整体刷新跳动
    const n = nodes.value.find((x) => x.id === payload.id)
    if (n) {
      n.geom = JSON.stringify({ type: 'Point', coordinates: [payload.x, payload.y] })
      edges.value = [...edges.value]
    }
  } catch {
    await load()
  }
}

/* ---------- 选中对象与表单 ---------- */
const selNode = computed(() =>
  selected.value?.type === 'node' ? nodes.value.find((n) => n.id === selected.value!.id) : undefined,
)
const selNodeForm = reactive({ name: '', isAccessible: true, sortOrder: 0, remark: '' })
const selEdge = computed(() =>
  selected.value?.type === 'edge' ? edges.value.find((e) => e.id === selected.value!.id) : undefined,
)
const selEdgeForm = reactive<{ edgeType: NavEdgeType; weight: number; bidirectional: boolean; status: number }>({
  edgeType: 'WALK',
  weight: 1,
  bidirectional: true,
  status: 1,
})
const selConnect = computed(() =>
  selected.value?.type === 'connect' ? connects.value.find((c) => c.id === selected.value!.id) : undefined,
)
const selConnectForm = reactive<{ connectType: ConnectType; costM: number; status: number }>({
  connectType: 'ELEVATOR',
  costM: 10,
  status: 1,
})

function syncPanelForms() {
  if (selected.value?.type === 'node' && selNode.value) {
    Object.assign(selNodeForm, {
      name: selNode.value.name ?? '',
      isAccessible: selNode.value.isAccessible,
      sortOrder: selNode.value.sortOrder ?? 0,
      remark: selNode.value.remark ?? '',
    })
  } else if (selected.value?.type === 'edge' && selEdge.value) {
    Object.assign(selEdgeForm, {
      edgeType: selEdge.value.edgeType,
      weight: selEdge.value.weight ?? 1,
      bidirectional: selEdge.value.bidirectional,
      status: selEdge.value.status,
    })
  } else if (selected.value?.type === 'connect' && selConnect.value) {
    Object.assign(selConnectForm, {
      connectType: selConnect.value.connectType,
      costM: selConnect.value.costM ?? 10,
      status: selConnect.value.status,
    })
  }
}

watch(selected, () => syncPanelForms(), { deep: true })

async function saveNode() {
  if (!selNode.value) return
  await navNodeUpdate({
    id: selNode.value.id,
    name: selNodeForm.name || undefined,
    isAccessible: selNodeForm.isAccessible,
    sortOrder: selNodeForm.sortOrder,
    remark: selNodeForm.remark || undefined,
  })
  ElMessage.success('节点已保存')
  await load()
  syncPanelForms()
}

async function saveEdge() {
  if (!selEdge.value) return
  await navEdgeUpdate({
    id: selEdge.value.id,
    edgeType: selEdgeForm.edgeType,
    weight: selEdgeForm.weight,
    bidirectional: selEdgeForm.bidirectional,
    status: selEdgeForm.status,
  })
  ElMessage.success('边已保存')
  await load()
  syncPanelForms()
}

async function saveConnect() {
  if (!selConnect.value) return
  await floorConnectUpdate({
    id: selConnect.value.id,
    connectType: selConnectForm.connectType,
    costM: selConnectForm.costM,
    status: selConnectForm.status,
  })
  ElMessage.success('跨层连接已保存')
  await load()
  syncPanelForms()
}

function clearSelection() {
  selected.value = null
  edgeDraft.value = null
  routeDraft.value = null
  route.value = null
}

loadFloors()
load()
</script>

<style scoped>
.nav-editor {
  gap: 12px;
}

.nav-editor__toolbar .title {
  font-weight: 600;
  margin-right: 8px;
}

.tool-hint {
  color: #909399;
  font-size: 12px;
  margin-left: 12px;
}

.nav-editor__body {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.nav-editor__canvas-wrap {
  flex: 1;
  min-width: 0;
}

.nav-editor__panel {
  width: 300px;
  flex-shrink: 0;
}

.panel-actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.mono {
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  font-size: 12px;
  color: #606266;
}

.route-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}
</style>
