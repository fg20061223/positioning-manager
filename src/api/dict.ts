import { http } from '@/utils/request'
import type { DictQuery, DictItemVO } from '@/types/dict'

/** POST /business/dict/list 按类型分组查询字典（dictType 单查 / dictTypes 批量） */
export function dictList(query?: DictQuery) {
  return http.post<Record<string, DictItemVO[]>>('/business/dict/list', query ?? {})
}

/** 便捷：批量查询多个字典类型 */
export function dictListByTypes(types: string[]) {
  return dictList({ dictTypes: types })
}
