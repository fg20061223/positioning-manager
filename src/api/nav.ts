import { http } from '@/utils/request'
import type { IdRequest, PageQuery, PageResult } from '@/types/result'
import type {
  FloorConnect,
  NavEdge,
  NavNode,
  NavNodeCreateRequest,
  NavNodeGeoVO,
  NavNodeGeometryRequest,
  NavRouteRequest,
  RouteVO,
} from '@/types/nav'

/* ---------------- 导航节点 nav-node ---------------- */
export function navNodeQuery(mallId: number, floorId: number) {
  return http.post<PageResult<NavNode>>('/business/nav-node/query', {
    pageNum: 1,
    pageSize: 1000,
    mallId,
    floorId,
  })
}
/**
 * 按商场/楼层查询节点几何（GeoJSON）。
 * 注意：通用 /query 的 geom 字段不返回（实体 select=false），
 * 编辑器加载节点必须走本接口。
 */
export function navNodeQueryGeometry(mallId: number, floorId: number) {
  return http.post<NavNodeGeoVO[]>('/business/nav-node/query-geometry', {
    mallId,
    floorId,
  })
}
/** 带几何创建节点（geom 为 NOT NULL 列，必须走本接口） */
export function navNodeCreate(req: NavNodeCreateRequest) {
  return http.post<number>('/business/nav-node/with-geometry', req)
}
export function navNodeUpdate(data: Partial<NavNode>) {
  return http.post<NavNode>('/business/nav-node/update', data)
}
export function navNodeDelete(id: number) {
  return http.post<void>('/business/nav-node/delete', { id } satisfies IdRequest)
}
/** 拖拽移动节点后更新坐标 */
export function navNodeUpdateGeometry(req: NavNodeGeometryRequest) {
  return http.post<void>('/business/nav-node/update-geometry', req)
}

/* ---------------- 导航边 nav-edge ---------------- */
export function navEdgeQuery(mallId: number) {
  return http.post<PageResult<NavEdge>>('/business/nav-edge/query', {
    pageNum: 1,
    pageSize: 1000,
    mallId,
  })
}
export function navEdgeCreate(data: Partial<NavEdge>) {
  return http.post<NavEdge>('/business/nav-edge/create', data)
}
export function navEdgeUpdate(data: Partial<NavEdge>) {
  return http.post<NavEdge>('/business/nav-edge/update', data)
}
export function navEdgeDelete(id: number) {
  return http.post<void>('/business/nav-edge/delete', { id } satisfies IdRequest)
}

/* ---------------- 跨层连接 floor-connect ---------------- */
/** 跨层连接为无条件分页，拉全量后前端按 mallId 过滤 */
export function floorConnectPage(query?: PageQuery) {
  return http.post<PageResult<FloorConnect>>('/business/floor-connect/page', query ?? {})
}
export function floorConnectCreate(data: Partial<FloorConnect>) {
  return http.post<FloorConnect>('/business/floor-connect/create', data)
}
export function floorConnectUpdate(data: Partial<FloorConnect>) {
  return http.post<FloorConnect>('/business/floor-connect/update', data)
}
export function floorConnectDelete(id: number) {
  return http.post<void>('/business/floor-connect/delete', { id } satisfies IdRequest)
}

/* ---------------- 路径规划 nav/route ---------------- */
export function navRoute(req: NavRouteRequest) {
  return http.post<RouteVO>('/business/nav/route', req)
}
