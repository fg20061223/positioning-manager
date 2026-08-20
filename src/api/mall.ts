import { http } from '@/utils/request'
import type { IdRequest, OptionQuery, OptionVO, PageQuery, PageResult } from '@/types/result'
import type {
  FloorByMallQuery,
  Mall,
  MallFloor,
  MallQuery,
  MallZone,
  ZoneQuery,
} from '@/types/mall'

/* ---------------- 商场 mall ---------------- */
export function mallPage(query?: PageQuery) {
  return http.post<PageResult<Mall>>('/business/mall/page', query ?? {})
}
/** 商场条件分页：编码/名称/地址（模糊）+ 状态 */
export function mallQuery(query?: MallQuery) {
  return http.post<PageResult<Mall>>('/business/mall/query', query ?? {})
}
/** 商场下拉数据（仅 id + name，供下拉框） */
export function mallOptions(query?: OptionQuery) {
  return http.post<OptionVO[]>('/business/mall/options', query ?? {})
}
export function mallGet(id: number) {
  return http.post<Mall>('/business/mall/get', { id } satisfies IdRequest)
}
export function mallCreate(data: Partial<Mall>) {
  return http.post<Mall>('/business/mall/create', data)
}
export function mallUpdate(data: Partial<Mall>) {
  return http.post<Mall>('/business/mall/update', data)
}
export function mallDelete(id: number) {
  return http.post<void>('/business/mall/delete', { id } satisfies IdRequest)
}

/* ---------------- 楼层 floor ---------------- */
/** 按商场查询楼层列表（支持 编码/名称 模糊过滤，兼容旧入参 {"id":商场ID}） */
export function floorByMall(query: FloorByMallQuery) {
  return http.post<MallFloor[]>('/business/floor/by-mall', query)
}
/** 楼层下拉数据（仅 id + name，可按商场过滤） */
export function floorOptions(query?: OptionQuery) {
  return http.post<OptionVO[]>('/business/floor/options', query ?? {})
}
export function floorPage(query?: PageQuery) {
  return http.post<PageResult<MallFloor>>('/business/floor/page', query ?? {})
}
export function floorGet(id: number) {
  return http.post<MallFloor>('/business/floor/get', { id } satisfies IdRequest)
}
export function floorCreate(data: Partial<MallFloor>) {
  return http.post<MallFloor>('/business/floor/create', data)
}
export function floorUpdate(data: Partial<MallFloor>) {
  return http.post<MallFloor>('/business/floor/update', data)
}
export function floorDelete(id: number) {
  return http.post<void>('/business/floor/delete', { id } satisfies IdRequest)
}

/* ---------------- 分区 zone ---------------- */
/**
 * 分区分页。注意：后端 /page 为无条件全量分页（BaseCrudController emptyWrapper），
 * 前端按 floorId 本地过滤（见 views/mall/zone.vue）。分区暂无独立 options 接口。
 */
export function zonePage(query?: PageQuery) {
  return http.post<PageResult<MallZone>>('/business/zone/page', query ?? {})
}
/** 分区条件分页：商场/楼层 + 分区编码/名称（模糊） */
export function zoneQuery(query?: ZoneQuery) {
  return http.post<PageResult<MallZone>>('/business/zone/query', query ?? {})
}
/** 分区下拉数据（仅 id + name，可按商场/楼层过滤） */
export function zoneOptions(query?: OptionQuery) {
  return http.post<OptionVO[]>('/business/zone/options', query ?? {})
}
export function zoneGet(id: number) {
  return http.post<MallZone>('/business/zone/get', { id } satisfies IdRequest)
}
export function zoneCreate(data: Partial<MallZone>) {
  return http.post<MallZone>('/business/zone/create', data)
}
export function zoneUpdate(data: Partial<MallZone>) {
  return http.post<MallZone>('/business/zone/update', data)
}
export function zoneDelete(id: number) {
  return http.post<void>('/business/zone/delete', { id } satisfies IdRequest)
}
