/** 业务服务：商场/楼层/分区实体类型（对齐 openapi-business.json） */

/** 商场 Mall */
export interface Mall {
  /** 商场ID（雪花ID，应用层生成） */
  id: number
  /** 商场编码（全局唯一） */
  mallCode: string
  mallName: string
  province?: string
  city?: string
  district?: string
  address?: string
  /** 经度（WGS84） */
  lng?: number
  /** 纬度（WGS84） */
  lat?: number
  /** 状态: 1=营业 0=停用 */
  status: number
  remark?: string
  createdAt?: string
  updatedAt?: string
  /** 逻辑删除: 0=正常 1=已删除 */
  deleted?: number
}

/** 楼层 MallFloor */
export interface MallFloor {
  id: number
  /** 所属商场ID */
  mallId: number
  /** 楼层编码，如 B3/B2/B1/1F/2F */
  floorCode: string
  floorName: string
  /** 楼层排序号（地下到地上递增） */
  sortOrder: number
  /** 状态: 1=开放 0=关闭 */
  status: number
  /** 平面图宽度（米） */
  widthM?: number
  /** 平面图高度（米） */
  heightM?: number
  /** 平面图URL（上传后返回，导航图编辑器底图） */
  imageUrl?: string
  remark?: string
  createdAt?: string
  updatedAt?: string
  deleted?: number
}

/** 分区 MallZone */
export interface MallZone {
  id: number
  /** 所属商场ID */
  mallId: number
  /** 所属楼层ID */
  floorId: number
  /** 分区编码，如 B区/A区 */
  zoneCode: string
  zoneName: string
  /** 分区轮廓 GeoJSON（通用 CRUD 不读写，走专门空间接口） */
  geom?: string
  /** 分区在地图上的展示颜色 */
  color?: string
  sortOrder: number
  remark?: string
  createdAt?: string
  updatedAt?: string
  deleted?: number
}

/** 商场/楼层/分区写操作的提交类型：去掉后端自动生成的字段，避免误传 */
export type MallForm = Omit<Mall, 'id' | 'createdAt' | 'updatedAt' | 'deleted'>
export type MallFloorForm = Omit<MallFloor, 'id' | 'createdAt' | 'updatedAt' | 'deleted'>
export type MallZoneForm = Omit<MallZone, 'id' | 'createdAt' | 'updatedAt' | 'deleted'>
