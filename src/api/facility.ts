import { http } from '@/utils/request'
import type { IdRequest, OptionQuery, OptionVO, PageQuery, PageResult } from '@/types/result'
import type { Beacon, BeaconQuery, Poi } from '@/types/facility'

/* ---------------- 设施 poi ---------------- */
/** poi/page 为无条件全量分页（BaseCrudController），前端按 mall/floor 本地过滤 */
export function poiPage(query?: PageQuery) {
  return http.post<PageResult<Poi>>('/business/poi/page', query ?? {})
}
/** 设施下拉数据（仅 id + name，可按商场/楼层过滤） */
export function poiOptions(query?: OptionQuery) {
  return http.post<OptionVO[]>('/business/poi/options', query ?? {})
}
export function poiGet(id: number) {
  return http.post<Poi>('/business/poi/get', { id } satisfies IdRequest)
}
export function poiCreate(data: Partial<Poi>) {
  return http.post<Poi>('/business/poi/create', data)
}
export function poiUpdate(data: Partial<Poi>) {
  return http.post<Poi>('/business/poi/update', data)
}
export function poiDelete(id: number) {
  return http.post<void>('/business/poi/delete', { id } satisfies IdRequest)
}

/* ---------------- 蓝牙信标 beacon ---------------- */
export function beaconQuery(query?: BeaconQuery) {
  return http.post<PageResult<Beacon>>('/business/beacon/query', query ?? {})
}
export function beaconPage(query?: PageQuery) {
  return http.post<PageResult<Beacon>>('/business/beacon/page', query ?? {})
}
/** 按楼层查询正常信标（定位扫描用） */
export function beaconByFloor(floorId: number) {
  return http.post<Beacon[]>('/business/beacon/by-floor', { id: floorId } satisfies IdRequest)
}
export function beaconGet(id: number) {
  return http.post<Beacon>('/business/beacon/get', { id } satisfies IdRequest)
}
export function beaconCreate(data: Partial<Beacon>) {
  return http.post<Beacon>('/business/beacon/create', data)
}
export function beaconUpdate(data: Partial<Beacon>) {
  return http.post<Beacon>('/business/beacon/update', data)
}
export function beaconDelete(id: number) {
  return http.post<void>('/business/beacon/delete', { id } satisfies IdRequest)
}
