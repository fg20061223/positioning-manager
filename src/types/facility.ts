/** 设施(POI) / 蓝牙信标相关类型（对齐 openapi-business.json） */

/** 设施类型: ELEVATOR=电梯 ESCALATOR=扶梯 STAIR=楼梯 TOILET=卫生间 ENTRANCE=商场出入口 EXIT=车库出口 SERVICE_DESK=服务台 NURSING_ROOM=母婴室 ATM=取款机 */
export type PoiType =
  | 'ELEVATOR'
  | 'ESCALATOR'
  | 'STAIR'
  | 'TOILET'
  | 'ENTRANCE'
  | 'EXIT'
  | 'SERVICE_DESK'
  | 'NURSING_ROOM'
  | 'ATM'

/** 设施 Poi */
export interface Poi {
  id: number
  mallId: number
  floorId: number
  poiType: PoiType
  poiName: string
  geom?: string
  centerPoint?: string
  entrancePoint?: string
  /** 状态: 1=可用 0=不可用 */
  status: number
  remark?: string
  createdAt?: string
  updatedAt?: string
  deleted?: number
}

/** 信标协议类型 */
export type BeaconType = 'IBEACON' | 'EDDYSTONE'

/** 信标状态: ACTIVE=正常 INACTIVE=停用 FAULT=故障 */
export type BeaconStatus = 'ACTIVE' | 'INACTIVE' | 'FAULT'

/** 蓝牙信标 Beacon */
export interface Beacon {
  id: number
  mallId: number
  floorId: number
  /** iBeacon 广播 UUID */
  uuid: string
  major: number
  minor: number
  mac?: string
  beaconType: BeaconType
  /** 布点坐标 GeoJSON（通用 CRUD 不读写） */
  positionGeom?: string
  /** 1米处 RSSI 参考值 */
  txPower?: number
  /** 电量百分比 */
  battery?: number
  status: BeaconStatus
  lastReportAt?: string
  remark?: string
  createdAt?: string
  updatedAt?: string
  deleted?: number
}

/** 信标条件分页入参 */
export interface BeaconQuery {
  pageNum?: number
  pageSize?: number
  mallId?: number
  floorId?: number
  status?: BeaconStatus | ''
}
