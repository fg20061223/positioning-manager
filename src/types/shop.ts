/** 商铺 / 商铺分类相关类型（对齐 openapi-business.json） */

/** 商铺状态: OPEN=营业 DECORATING=装修 CLOSED=关闭 */
export type ShopStatus = 'OPEN' | 'DECORATING' | 'CLOSED'

/** 商铺 Shop */
export interface Shop {
  id: number
  mallId: number
  floorId: number
  zoneId?: number
  shopNo: string
  shopName: string
  shortName?: string
  categoryId?: number
  brand?: string
  phone?: string
  logoUrl?: string
  description?: string
  /** 搜索关键词，逗号分隔 */
  keywords?: string
  geom?: string
  centerPoint?: string
  entrancePoint?: string
  status: ShopStatus
  sortOrder?: number
  createdAt?: string
  updatedAt?: string
  deleted?: number
}

/** 商铺条件分页入参 */
export interface ShopQuery {
  pageNum?: number
  pageSize?: number
  mallId?: number
  floorId?: number
  categoryId?: number
  status?: ShopStatus | ''
  /** 搜索关键词（名称/关键词模糊匹配，服务端 trgm） */
  keyword?: string
}

/** 商铺几何更新入参（JSON 字符串） */
export interface ShopGeometryRequest {
  id: number
  geomGeoJson?: string
  entranceGeoJson?: string
}

/** 商铺几何查询结果 */
export interface ShopGeometryVO {
  id: number
  geomGeojson: string
  centerGeojson: string
  entranceGeojson: string
}

/** 商铺搜索 VO */
export interface ShopSearchVO {
  id: number
  shopNo: string
  shopName: string
  shortName?: string
  floorId: number
  zoneId?: number
  categoryId?: number
  brand?: string
  phone?: string
  status: ShopStatus
}

/** 商铺分类 ShopCategory */
export interface ShopCategory {
  id: number
  /** 所属商场ID（空=平台通用分类） */
  mallId?: number
  /** 父分类ID，0=根分类 */
  parentId: number
  catName: string
  sortOrder?: number
  /** 状态: 1=启用 0=停用 */
  status: number
  createdAt?: string
  updatedAt?: string
  deleted?: number
}

/** 商铺分类条件分页入参（/business/shop-category/query） */
export interface ShopCategoryQuery {
  pageNum?: number
  pageSize?: number
  /** 分类名称（模糊） */
  catName?: string
  /** 所属商场ID（空=平台通用分类） */
  mallId?: number
  /** 父分类ID（0=根分类） */
  parentId?: number
}
