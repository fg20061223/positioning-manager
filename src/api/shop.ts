import { http } from '@/utils/request'
import type { IdRequest, OptionQuery, OptionVO, PageQuery, PageResult } from '@/types/result'
import type {
  Shop,
  ShopCategory,
  ShopGeometryRequest,
  ShopGeometryVO,
  ShopQuery,
  ShopSearchVO,
} from '@/types/shop'

/* ---------------- 商铺 shop ---------------- */
export function shopQuery(query?: ShopQuery) {
  return http.post<PageResult<Shop>>('/business/shop/query', query ?? {})
}
export function shopPage(query?: PageQuery) {
  return http.post<PageResult<Shop>>('/business/shop/page', query ?? {})
}
export function shopSearch(mallId: number, keyword: string, limit = 20) {
  return http.post<ShopSearchVO[]>('/business/shop/search', { mallId, keyword, limit })
}
export function shopGet(id: number) {
  return http.post<Shop>('/business/shop/get', { id } satisfies IdRequest)
}
export function shopCreate(data: Partial<Shop>) {
  return http.post<Shop>('/business/shop/create', data)
}
export function shopUpdate(data: Partial<Shop>) {
  return http.post<Shop>('/business/shop/update', data)
}
export function shopDelete(id: number) {
  return http.post<void>('/business/shop/delete', { id } satisfies IdRequest)
}
export function shopGetGeometry(id: number) {
  return http.post<ShopGeometryVO>('/business/shop/get-geometry', { id } satisfies IdRequest)
}
/** geomGeoJson / entranceGeoJson 必须传 JSON 字符串 */
export function shopUpdateGeometry(req: ShopGeometryRequest) {
  return http.post<void>('/business/shop/update-geometry', req)
}

/* ---------------- 商铺分类 shop-category ---------------- */
export function shopCategoryPage(query?: PageQuery) {
  return http.post<PageResult<ShopCategory>>('/business/shop-category/page', query ?? {})
}
export function shopCategoryGet(id: number) {
  return http.post<ShopCategory>('/business/shop-category/get', { id } satisfies IdRequest)
}
export function shopCategoryCreate(data: Partial<ShopCategory>) {
  return http.post<ShopCategory>('/business/shop-category/create', data)
}
export function shopCategoryUpdate(data: Partial<ShopCategory>) {
  return http.post<ShopCategory>('/business/shop-category/update', data)
}
export function shopCategoryDelete(id: number) {
  return http.post<void>('/business/shop-category/delete', { id } satisfies IdRequest)
}
/** 商铺分类下拉数据（仅 id + name，可按商场过滤） */
export function shopCategoryOptions(query?: OptionQuery) {
  return http.post<OptionVO[]>('/business/shop-category/options', query ?? {})
}
