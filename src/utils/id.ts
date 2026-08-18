/**
 * ID 比较工具。
 *
 * 后端主键为雪花 ID（可达 2^53 以上），前端使用 json-bigint 解析为大整数
 * （BigInt），而小 ID（演示数据 1/101/...）与路由参数（字符串/数字）仍是
 * number/string。跨表示比较一律用 eqId 转字符串比较，避免精度与类型不一致。
 */

export type Id = number | bigint | string

/** 跨表示 ID 比较（number/bigint/string 均转字符串比较） */
export function eqId(a: unknown, b: unknown): boolean {
  if (a == null || b == null) return false
  return String(a) === String(b)
}

/** 把任意 ID 表示为字符串（用于接口入参、路由拼接等） */
export function idStr(v: unknown): string {
  return v == null ? '' : String(v)
}
