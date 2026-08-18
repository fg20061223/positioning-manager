import type { GeoJsonGeometry } from '@/types/file'

/** 解析 GeoJSON（兼容对象或 JSON 字符串），非法输入返回 null */
export function parseGeometry(input: unknown): GeoJsonGeometry | null {
  if (!input) return null
  let obj: GeoJsonGeometry | null = null
  if (typeof input === 'string') {
    try {
      obj = JSON.parse(input)
    } catch {
      return null
    }
  } else {
    obj = input as GeoJsonGeometry
  }
  if (!obj || typeof obj.type !== 'string') return null
  return obj
}

/** 把几何转为顶点数组（多边形去掉闭合重复点） */
export function geometryToPoints(
  g: GeoJsonGeometry | null,
): { x: number; y: number }[] {
  if (!g) return []
  if (g.type === 'Point') {
    const c = g.coordinates as number[]
    return [{ x: c[0], y: c[1] }]
  }
  if (g.type === 'LineString') {
    return (g.coordinates as number[][]).map((c) => ({ x: c[0], y: c[1] }))
  }
  if (g.type === 'Polygon') {
    const ring = (g.coordinates as number[][][])[0] ?? []
    const pts = ring.map((c) => ({ x: c[0], y: c[1] }))
    if (
      pts.length > 1 &&
      pts[0].x === pts[pts.length - 1].x &&
      pts[0].y === pts[pts.length - 1].y
    ) {
      pts.pop()
    }
    return pts
  }
  return []
}

/** 顶点数组转几何（多边形自动闭合；点数不足返回 null） */
export function pointsToGeometry(
  type: 'point' | 'line' | 'polygon',
  pts: { x: number; y: number }[],
): GeoJsonGeometry | null {
  if (!pts.length) return null
  if (type === 'point') {
    return { type: 'Point', coordinates: [pts[0].x, pts[0].y] }
  }
  const coords = pts.map((p) => [p.x, p.y])
  if (type === 'line') {
    return { type: 'LineString', coordinates: coords }
  }
  if (type === 'polygon') {
    if (pts.length < 3) return null
    return { type: 'Polygon', coordinates: [[...coords, coords[0]]] }
  }
  return null
}

export interface Bounds {
  minX: number
  minY: number
  maxX: number
  maxY: number
}

/** 计算顶点包围盒（空数据给默认 0..100 范围） */
export function pointsBounds(pts: { x: number; y: number }[]): Bounds {
  if (!pts.length) return { minX: 0, minY: 0, maxX: 100, maxY: 100 }
  const xs = pts.map((p) => p.x)
  const ys = pts.map((p) => p.y)
  let minX = Math.min(...xs)
  let minY = Math.min(...ys)
  let maxX = Math.max(...xs)
  let maxY = Math.max(...ys)
  if (minX === maxX) {
    minX -= 5
    maxX += 5
  }
  if (minY === maxY) {
    minY -= 5
    maxY += 5
  }
  return { minX, minY, maxX, maxY }
}

/** 米制坐标 -> 画布坐标 的均匀缩放/居中变换 */
export function fitTransform(
  bounds: Bounds,
  width: number,
  height: number,
  padding = 40,
): { s: number; ox: number; oy: number } {
  const rangeX = bounds.maxX - bounds.minX || 1
  const rangeY = bounds.maxY - bounds.minY || 1
  const s = Math.min(
    Math.max((width - padding * 2) / rangeX, 0.01),
    Math.max((height - padding * 2) / rangeY, 0.01),
  )
  const ox = (width - rangeX * s) / 2
  const oy = (height - rangeY * s) / 2
  return { s, ox, oy }
}
