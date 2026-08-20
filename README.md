# positioning-manager

商场可视化智能车位/商铺导航系统 — **PC 管理后台前端**（Vue 3 + TypeScript + Vite + Element Plus + Pinia + Vue Router + Axios）。

> 交接背景与接口契约见 `docs/PROJECT_CONTEXT.md`、`docs/API_CONTRACT/openapi-*.json`、`docs/管理后台前端规划.md`。
> 后端网关 `http://127.0.0.1:8081`（全部接口 POST + JSON，请求头 `satoken`）。

## 当前进度（M1 + M2 + M3）

- 脚手架：Vite 6 + Vue 3.5 + TS 5.7 + Element Plus + Pinia + Vue Router + Axios
- 登录/登出（`/auth/login|logout|me`）、token 持久化、401 自动跳登录
- 布局（侧边栏 + 顶栏 + 用户信息）、RBAC 路由守卫（按 `userType` 过滤菜单/路由）、`v-permission` 指令
- 商场管理（`/mall`）、楼层管理（`/mall/:mallId/floors`）、分区管理（`/mall/:mallId/floor/:floorId/zones`）CRUD
- 车位管理（`/space`）：条件分页/车位号搜索/CRUD/占用·释放/几何读写
- 商铺管理（`/shop`，支持名称关键词搜索）+ 商铺分类（`/shop-category`）
- 设施管理（`/poi`）、信标管理（`/beacon`）
- 系统字典：枚举型下拉（车位类型/状态、商铺状态、设施类型、信标协议/状态等）
  统一由后端 `POST /business/dict/list` 动态拉取（`src/composables/useDicts.ts`，
  带模块级缓存），不再前端硬编码
- GeoJSON 组件：`GeoPreview`（只读预览）、`GeoDraw`（点/线/面绘制与顶点拖拽）
- 平面图上传与标定：`FloorImageUpload`（`POST /business/file/upload` 上传 + 两点标定，
  标定参数随 `mall_floor.remark` JSON 保存，楼层列表显示"已标定"）
- 导航图编辑器（`/nav-editor/:mallId/:floorId`，从楼层管理进入）：
  MapLibre 分层画布（平面图底图 + 导航节点/边/跨层），工具条（选择/新建节点/连边/跨层/
  删除/路径预览）、节点拖拽即时保存、属性面板编辑；节点类型/边类型/跨层方式走字典；
  对接 nav-node/nav-edge/floor-connect/nav-route，边距离前端欧氏计算、跨层路径预览
- 与后端真实联调通过（经 dev 代理）：登录、各模块 CRUD、几何读写、文件上传、
  楼层标定闭环、导航节点/边/跨层/跨层路径规划全链路

## 重要：雪花 ID 精度处理

后端主键为雪花 ID（19 位，超出 JS `Number.MAX_SAFE_INTEGER`）。前端在
`src/utils/request.ts` 用 **json-bigint**（`useNativeBigInt`）解析响应，大整数保持为
`BigInt` 精确值；请求序列化时自动转字符串（后端 Long 可接受）。跨表示比较（路由参数
vs 接口返回值）统一用 `src/utils/id.ts` 的 `eqId`。注意：直接 `JSON.parse` 会丢精度，
导致"新建后再编辑/删除"静默失败。

## 快速开始

```bash
pnpm install
pnpm dev        # http://127.0.0.1:5173
pnpm typecheck  # vue-tsc --noEmit
pnpm build      # 生产构建
```

测试账号（密码均 `123456`）：`admin`（平台管理员）/ `operator`（商场运营）。

## 开发说明

- **接口代理**：前端统一以 `/api` 前缀请求；开发期由 `vite.config.ts` 中的自研中间件代理
  （`pm-api-proxy`）剥掉 `/api` 后转发到网关 `http://127.0.0.1:8081`。
  > 为什么不用 Vite 内置 http-proxy：Node 24 的 http-parser 与 Spring Cloud Gateway 的
  > 响应帧存在兼容问题（`Parse Error: Data after Connection: close`），自研代理强制
  > `connection: close` 逐请求独立建连并剥离 hop-by-hop 头，实测稳定。
- **后端 /page 为无条件全量分页**（无查询过滤），M1 采用「全量拉取 + 前端过滤 + 前端分页」
  （见 `src/composables/useLocalPaging.ts`），待后端支持过滤后再切服务端分页。
- **联调坑（Windows）**：从 PowerShell 直接调 `curl.exe` 传 `-d '{"a":1}'` 会被 PS 吞掉
  双引号，导致后端收到无引号字段的非法 JSON（报 `Unexpected character ('a')`）。
  改用 `Invoke-RestMethod`、Node，或 `curl --data-binary @file.json`。

## 目录结构

```text
src/
├── api/          # 接口封装（auth / mall / space / shop / facility / file）
├── types/        # 对齐后端实体/DTO/Result/PageResult 的 TS 类型
├── router/       # 路由 + RBAC 守卫
├── stores/       # auth（token/用户/角色）、权限码
├── views/        # login / layout / dashboard / mall / space / shop / poi / beacon / error
├── components/   # GeoPreview / GeoDraw / FloorImageUpload
├── composables/  # useLocalPaging / useMallData
├── directives/   # permission（按钮级权限）
└── utils/        # request.ts（axios 封装，json-bigint）/ storage / id(eqId) / geo / resolveStaticUrl
```

## 待办（后续里程碑）

- M3：导航图编辑器（MapLibre + nav-node/nav-edge/floor-connect/nav-route + 标定联动）
- M4：停车记录、用户绑定、操作日志、按钮级权限码（`sys_permission.perm_code`）接入
