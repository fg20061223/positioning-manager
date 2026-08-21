/** 导航图相关类型（对齐 openapi-business.json） */

/** 节点类型: WAYPOINT=通道点 JUNCTION=岔路口 DOOR=门 ELEVATOR=电梯口 ESCALATOR=扶梯口 STAIR=楼梯口 SPACE_ENTRY=车位入口 SHOP_ENTRY=商铺入口 POI_ENTRY=设施入口 */
export type NavNodeType =
  | 'WAYPOINT'
  | 'JUNCTION'
  | 'DOOR'
  | 'ELEVATOR'
  | 'ESCALATOR'
  | 'STAIR'
  | 'SPACE_ENTRY'
  | 'SHOP_ENTRY'
  | 'POI_ENTRY'

/** 导航节点 NavNode */
export interface NavNode {
  id: number
  mallId: number
  floorId: number
  nodeType: NavNodeType
  name?: string
  /** 节点坐标 GeoJSON（Point, 楼层本地米制坐标, SRID=0） */
  geom?: string
  /** 是否可通行: true=可通行 false=通道封闭 */
  isAccessible: boolean
  sortOrder?: number
  remark?: string
  createdAt?: string
  updatedAt?: string
  deleted?: number
}

/** 节点几何 VO（/business/nav-node/query-geometry 返回，含 GeoJSON 坐标） */
export interface NavNodeGeoVO {
  id: number
  mallId: number
  floorId: number
  nodeType: NavNodeType
  name?: string
  /** 节点坐标 GeoJSON（ST_AsGeoJSON 输出） */
  geomGeoJson: string
  isAccessible: boolean
  sortOrder?: number
  remark?: string
}

/** 带几何创建节点入参 */
export interface NavNodeCreateRequest {
  mallId: number
  floorId: number
  nodeType: NavNodeType
  name?: string
  /** 节点坐标 GeoJSON 字符串（Point） */
  geomGeoJson: string
  isAccessible?: boolean
  sortOrder?: number
  remark?: string
}

/** 节点几何更新入参 */
export interface NavNodeGeometryRequest {
  id: number
  geomGeoJson: string
}

/** 边类型: WALK=步行 ELEVATOR=电梯 ESCALATOR=扶梯 STAIR=楼梯 */
export type NavEdgeType = 'WALK' | 'ELEVATOR' | 'ESCALATOR' | 'STAIR'

/** 导航边 NavEdge */
export interface NavEdge {
  id: number
  mallId: number
  fromNodeId: number
  toNodeId: number
  edgeType: NavEdgeType
  /** 边长（米），路径规划直接使用；前端按两节点欧氏距离计算 */
  distanceM: number
  /** 通行成本系数（默认1） */
  weight?: number
  /** 边几何 GeoJSON（后端通用 CRUD 不读写） */
  geom?: string
  /** 是否双向通行: true=双向 false=单向 */
  bidirectional: boolean
  /** 状态: 1=可用 0=不可用 */
  status: number
  createdAt?: string
  updatedAt?: string
  deleted?: number
}

/** 跨层连接方式 */
export type ConnectType = 'ELEVATOR' | 'ESCALATOR' | 'STAIR'

/** 跨层连接 FloorConnect */
export interface FloorConnect {
  id: number
  mallId: number
  fromFloorId: number
  toFloorId: number
  connectType: ConnectType
  fromNodeId: number
  toNodeId: number
  /** 跨层折算成本（米） */
  costM?: number
  geom?: string
  /** 状态: 1=可用 0=不可用 */
  status: number
  createdAt?: string
  updatedAt?: string
  deleted?: number
}

/** 路径规划请求 */
export interface NavRouteRequest {
  mallId: number
  fromNodeId: number
  toNodeId: number
}

/** 路径段 */
export interface RouteSegment {
  fromNodeId: number
  toNodeId: number
  /** 边ID（跨层时为 floor_connect ID） */
  edgeId: number
  edgeType: string
  crossFloor: boolean
  distanceM: number
}

/** 路径规划结果 */
export interface RouteVO {
  nodeIds: number[]
  segments: RouteSegment[]
  totalDistanceM: number
}
