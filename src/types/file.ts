/** 文件上传相关类型 */

/** POST /business/file/upload 响应 data: {"url":"/uploads/xxx.png"} */
export interface UploadResult {
  url: string
}

/** 楼层平面图标定参数（像素坐标 <-> 米制坐标 的仿射换算） */
export interface Calibration {
  /** X 方向比例：米/像素 */
  scaleX: number
  /** Y 方向比例：米/像素 */
  scaleY: number
  /** X 偏移：像素 0 处对应的米制 X */
  offsetX: number
  /** Y 偏移：像素 0 处对应的米制 Y */
  offsetY: number
  /** 标定锚点（像素 -> 米制），供回显 */
  anchors: {
    px: number
    py: number
    mx: number
    my: number
  }[]
}

/** GeoJSON 几何（点/线/面），与后端几何接口一致 */
export interface GeoJsonGeometry {
  type: 'Point' | 'LineString' | 'Polygon'
  coordinates: number[] | number[][] | number[][][]
}
