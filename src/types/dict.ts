/** 系统字典相关类型（对齐 openapi-business.json） */

/** 字典项（下拉用） */
export interface DictItemVO {
  /** 字典项编码（对应字段存储值） */
  code: string
  /** 字典项名称（中文展示文案） */
  label: string
  /** 排序号（类型内升序） */
  sortOrder: number
}

/** 字典查询入参：dictType 单查 / dictTypes 批量 / 均空=全部 */
export interface DictQuery {
  dictType?: string
  dictTypes?: string[]
}

/** 字典实体 SysDict（管理端 CRUD 用） */
export interface SysDict {
  id: number
  /** 字典类型编码，如 space_type/space_status/shop_status */
  dictType: string
  /** 字典项编码（对应字段存储值） */
  dictCode: string
  /** 字典项名称（中文展示文案） */
  dictLabel: string
  sortOrder?: number
  /** 状态: 1=启用 0=停用 */
  status?: number
  remark?: string
  createdAt?: string
  updatedAt?: string
  deleted?: number
}

/** 前端硬编码枚举 -> 后端字典类型 的映射（集中声明，便于检索） */
export const DICT_TYPES = {
  SPACE_TYPE: 'space_type',
  SPACE_STATUS: 'space_status',
  OCCUPY_SOURCE: 'occupy_source',
  SHOP_STATUS: 'shop_status',
  POI_TYPE: 'poi_type',
  BEACON_TYPE: 'beacon_type',
  BEACON_STATUS: 'beacon_status',
  MALL_STATUS: 'mall_status',
  FLOOR_STATUS: 'floor_status',
  NAV_NODE_TYPE: 'nav_node_type',
  NAV_EDGE_TYPE: 'nav_edge_type',
  CONNECT_TYPE: 'connect_type',
} as const
