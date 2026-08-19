/**
 * 后端统一响应/分页约定（全后端统一，见 docs/PROJECT_CONTEXT.md 第三节）：
 * 全部 POST + JSON；响应 {code, message, data}；code=200 成功；
 * 分页响应 data: {total, records}。
 */

/** 统一响应包装 */
export interface Result<T = unknown> {
  code: number
  message: string
  data: T
}

/** 分页响应数据 */
export interface PageResult<T> {
  total: number
  records: T[]
}

/** 通用分页入参 */
export interface PageQuery {
  pageNum?: number
  pageSize?: number
}

/** 按 ID 操作入参 */
export interface IdRequest {
  id: number
}

/** 通用下拉（options）入参：可按商场/楼层过滤接口通用 */
export interface OptionQuery {
  mallId?: number
  floorId?: number
}

/** 通用下拉选项：id + name（用于下拉框，对应后端 OptionVO） */
export interface OptionVO {
  /** 选项ID（雪花接口可能为大整数，用原生 BigInt） */
  id: number
  /** 选项名称 */
  name: string
}
