/** 车位管理相关类型（对齐 openapi-business.json） */

/** 车位类型: NORMAL=普通 DISABLED=无障碍 CHARGING=充电 COMPACT=微型 MECHANICAL=机械 MOTHER_CHILD=母婴 */
export type SpaceType =
  | 'NORMAL'
  | 'DISABLED'
  | 'CHARGING'
  | 'COMPACT'
  | 'MECHANICAL'
  | 'MOTHER_CHILD'

/** 车位状态: FREE=空闲 OCCUPIED=占用 LOCKED=锁定 FAULT=故障 */
export type SpaceStatus = 'FREE' | 'OCCUPIED' | 'LOCKED' | 'FAULT'

/** 占用来源: APP/CAMERA/MAGNET/GATE/MANUAL */
export type OccupySource = 'APP' | 'CAMERA' | 'MAGNET' | 'GATE' | 'MANUAL'

/** 车位 ParkingSpace */
export interface ParkingSpace {
  id: number
  mallId: number
  floorId: number
  zoneId?: number
  spaceNo: string
  spaceType: SpaceType
  status: SpaceStatus
  occupySource?: OccupySource
  /** 车位轮廓 GeoJSON（通用 CRUD 不读写，走专门空间接口） */
  geom?: string
  centerPoint?: string
  entrancePoint?: string
  sortOrder?: number
  remark?: string
  createdAt?: string
  updatedAt?: string
  deleted?: number
}

/** 车位条件分页入参 */
export interface SpaceQuery {
  pageNum?: number
  pageSize?: number
  mallId?: number
  floorId?: number
  status?: SpaceStatus | ''
}

/** 车位号模糊搜索入参 */
export interface SpaceSearchRequest {
  mallId: number
  keyword?: string
  limit?: number
}

/** 手动占用入参 */
export interface OccupyRequest {
  id: number
  source?: OccupySource
}

/** 车位几何更新入参（geomGeoJson/entranceGeoJson 为 JSON 字符串！） */
export interface SpaceGeometryRequest {
  id: number
  geomGeoJson?: string
  entranceGeoJson?: string
}

/** 车位几何查询结果 */
export interface SpaceGeometryVO {
  id: number
  /** 轮廓 GeoJSON 字符串 */
  geomGeojson: string
  /** 中心点 GeoJSON 字符串（后端 ST_Centroid 计算） */
  centerGeojson: string
  /** 入口点 GeoJSON 字符串 */
  entranceGeojson: string
}

/** 附近空闲车位 */
export interface NearbySpaceVO {
  id: number
  spaceNo: string
  spaceType: SpaceType
  status: SpaceStatus
  occupySource?: OccupySource
  floorId: number
  zoneId?: number
  distanceM: number
}
