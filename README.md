# positioning-manager

商场可视化智能车位/商铺导航系统 — **PC 管理后台前端**（Vue 3 + TypeScript + Vite + Element Plus + Pinia + Vue Router + Axios）。

> 交接背景与接口契约见 `docs/PROJECT_CONTEXT.md`、`docs/API_CONTRACT/openapi-*.json`、`docs/管理后台前端规划.md`。
> 后端网关 `http://127.0.0.1:8081`（全部接口 POST + JSON，请求头 `satoken`）。

## 当前进度（M1）

- 脚手架：Vite 6 + Vue 3.5 + TS 5.7 + Element Plus + Pinia + Vue Router + Axios
- 登录/登出（`/auth/login|logout|me`）、token 持久化、401 自动跳登录
- 布局（侧边栏 + 顶栏 + 用户信息）、RBAC 路由守卫（按 `userType` 过滤菜单/路由）、`v-permission` 指令
- 商场管理（`/mall`）、楼层管理（`/mall/:mallId/floors`）、分区管理（`/mall/:mallId/floor/:floorId/zones`）CRUD
- 与后端真实联调通过：登录、mall/floor/zone 的增删改查、分页、逻辑删除

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
├── api/          # 接口封装（auth.ts / mall.ts：mall·floor·zone）
├── types/        # 对齐后端实体/DTO/Result/PageResult 的 TS 类型
├── router/       # 路由 + RBAC 守卫
├── stores/       # auth（token/用户/角色）、权限码
├── views/        # login / layout / dashboard / mall(商场·楼层·分区) / error
├── components/   # （M2 起：GeoPreview/GeoDraw/FloorImageUpload）
├── composables/  # useLocalPaging（本地分页）
├── directives/   # permission（按钮级权限）
└── utils/        # request.ts（axios 封装）/ storage.ts
```

## 待办（后续里程碑）

- M2：车位/商铺/分类/POI/信标 + GeoJSON 预览绘制 + 平面图上传标定（`/business/file/upload`）
- M3：导航图编辑器（MapLibre + nav-node/nav-edge/floor-connect/nav-route）
- M4：停车记录、用户绑定、操作日志、按钮级权限码（`sys_permission.perm_code`）接入
