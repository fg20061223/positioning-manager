import { http } from '@/utils/request'
import type { UploadResult } from '@/types/file'

/** POST /business/file/upload（multipart/form-data，字段名 file）→ {"url":"/uploads/xxx"} */
export function uploadFile(file: File) {
  const formData = new FormData()
  formData.append('file', file)
  // axios 对 FormData 自动设置 multipart boundary
  return http.post<UploadResult>('/business/file/upload', formData)
}
