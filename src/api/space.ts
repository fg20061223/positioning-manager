import { http } from '@/utils/request'
import type { IdRequest, PageQuery, PageResult } from '@/types/result'
import type {
  NearbySpaceVO,
  OccupyRequest,
  ParkingSpace,
  SpaceGeometryRequest,
  SpaceGeometryVO,
  SpaceQuery,
  SpaceSearchRequest,
} from '@/types/space'

export function spaceQuery(query?: SpaceQuery) {
  return http.post<PageResult<ParkingSpace>>('/business/space/query', query ?? {})
}
export function spacePage(query?: PageQuery) {
  return http.post<PageResult<ParkingSpace>>('/business/space/page', query ?? {})
}
export function spaceSearch(req: SpaceSearchRequest) {
  return http.post<ParkingSpace[]>('/business/space/search', req)
}
export function spaceGet(id: number) {
  return http.post<ParkingSpace>('/business/space/get', { id } satisfies IdRequest)
}
export function spaceCreate(data: Partial<ParkingSpace>) {
  return http.post<ParkingSpace>('/business/space/create', data)
}
export function spaceUpdate(data: Partial<ParkingSpace>) {
  return http.post<ParkingSpace>('/business/space/update', data)
}
export function spaceDelete(id: number) {
  return http.post<void>('/business/space/delete', { id } satisfies IdRequest)
}
export function spaceGetGeometry(id: number) {
  return http.post<SpaceGeometryVO>('/business/space/get-geometry', { id } satisfies IdRequest)
}
/** geomGeoJson / entranceGeoJson 必须传 JSON 字符串 */
export function spaceUpdateGeometry(req: SpaceGeometryRequest) {
  return http.post<void>('/business/space/update-geometry', req)
}
export function spaceOccupy(req: OccupyRequest) {
  return http.post<void>('/business/space/occupy', req)
}
export function spaceRelease(id: number) {
  return http.post<void>('/business/space/release', { id } satisfies IdRequest)
}
export function spaceNearby(mallId: number, x: number, y: number, limit = 10) {
  return http.post<NearbySpaceVO[]>('/business/space/nearby', { mallId, x, y, limit })
}
