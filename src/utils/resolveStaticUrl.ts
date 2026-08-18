/**
 * 把后端返回的静态资源 URL 转为前端可访问地址：
 * - 已是完整地址（http/https/data:）→ 原样返回
 * - 以 / 开头（如 /uploads/xxx.png）→ 拼上 API 基址（开发期 /api，经代理转发到网关）
 * - 其它 → 原样返回
 */
export function resolveStaticUrl(url?: string | null): string {
  if (!url) return ''
  if (/^(https?:)?\/\//.test(url) || url.startsWith('data:')) return url
  if (url.startsWith('/')) {
    const base = import.meta.env.VITE_API_BASE || '/api'
    return `${base}${url}`
  }
  return url
}
