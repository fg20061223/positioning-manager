import { http } from '@/utils/request'
import type { IdRequest, PageQuery, PageResult } from '@/types/result'
import type { DictQuery, DictItemVO, SysDict } from '@/types/dict'

/** POST /business/dict/list 按类型分组查询字典（dictType 单查 / dictTypes 批量 / 空=全部） */
export function dictList(query?: DictQuery) {
  return http.post<Record<string, DictItemVO[]>>('/business/dict/list', query ?? {})
}

/** 便捷：批量查询多个字典类型 */
export function dictListByTypes(types: string[]) {
  return dictList({ dictTypes: types })
}

/** POST /business/dict/page 字典分页（BaseCrud 无条件分页，前端本地过滤） */
export function dictPage(query?: PageQuery) {
  return http.post<PageResult<SysDict>>('/business/dict/page', query ?? {})
}

export function dictGet(id: number) {
  return http.post<SysDict>('/business/dict/get', { id } satisfies IdRequest)
}

/** 新增字典（dictType/dictCode/dictLabel 必填，同类型编码不可重复） */
export function dictCreate(data: Partial<SysDict>) {
  return http.post<SysDict>('/business/dict/create', data)
}

export function dictUpdate(data: Partial<SysDict>) {
  return http.post<SysDict>('/business/dict/update', data)
}

export function dictDelete(id: number) {
  return http.post<void>('/business/dict/delete', { id } satisfies IdRequest)
}
