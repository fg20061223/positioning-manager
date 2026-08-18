import JSONbig from 'json-bigint'
import axios, { type AxiosRequestConfig } from 'axios'
import { ElMessage } from 'element-plus'

import { storage } from '@/utils/storage'

/** 后端统一响应包装 */
export interface ApiResult<T = unknown> {
  code: number
  message: string
  data: T
}

// 大整数（雪花 ID）解析为原生 BigInt，避免 JSON.parse 丢精度
const JSONBigInt = JSONbig({ useNativeBigInt: true })

/** BigInt -> 字符串，保证 JSON.stringify 可序列化 */
function bigintReplacer(_key: string, value: unknown) {
  return typeof value === 'bigint' ? value.toString() : value
}

const service = axios.create({
  // 开发默认 /api（代理剥前缀转发网关）；生产可用 VITE_API_BASE 指向网关
  baseURL: import.meta.env.VITE_API_BASE || '/api',
  timeout: 15000,
})

// 响应解析：默认 JSON.parse 改为 json-bigint（雪花 ID 精度无损）
service.defaults.transformResponse = [
  (data) => {
    if (typeof data !== 'string' || !data) return data
    try {
      return JSONBigInt.parse(data)
    } catch {
      return data
    }
  },
]

// 请求序列化：FormData 原样透传（上传），对象用大整数安全序列化
service.defaults.transformRequest = [
  (data, headers) => {
    if (data instanceof FormData) return data
    if (data == null || typeof data === 'string') return data
    headers.setContentType('application/json')
    return JSON.stringify(data, bigintReplacer)
  },
]

/** 登录失效后的统一处理（清除本地态并回登录页） */
function handleUnauthorized(message: string) {
  storage.clearAuth()
  ElMessage.error(message || '登录已过期，请重新登录')
  // 不 import router，避免循环依赖；SPA 内跳转足够
  if (!window.location.pathname.startsWith('/login')) {
    const redirect = encodeURIComponent(window.location.pathname + window.location.search)
    window.location.href = `/login?redirect=${redirect}`
  }
}

// 请求拦截：注入 satoken
service.interceptors.request.use((config) => {
  const token = storage.getToken()
  if (token) {
    config.headers.set('satoken', token)
  }
  return config
})

// 响应拦截：统一解包 {code,message,data}
service.interceptors.response.use(
  (response) => {
    const res = response.data as ApiResult
    if (res.code === 200) {
      return response
    }
    if (res.code === 401) {
      handleUnauthorized(res.message)
    } else {
      ElMessage.error(res.message || '操作失败')
    }
    return Promise.reject(new Error(res.message || `请求失败(code=${res.code})`))
  },
  (error: unknown) => {
    const axiosError = error as {
      response?: { status?: number; data?: { message?: string } }
      message?: string
    }
    const status = axiosError.response?.status
    if (status === 401) {
      handleUnauthorized(axiosError.response?.data?.message || '未登录或登录已过期')
    } else {
      const msg =
        axiosError.response?.data?.message ||
        axiosError.message ||
        '网络错误，请稍后重试'
      ElMessage.error(msg)
    }
    return Promise.reject(error)
  },
)

/** 请求并直接返回 data（已解包统一响应） */
export function request<T>(config: AxiosRequestConfig): Promise<T> {
  return service.request<ApiResult<T>>(config).then((res) => res.data.data as T)
}

export const http = {
  post<T>(url: string, data?: unknown): Promise<T> {
    return request<T>({ url, method: 'post', data })
  },
  get<T>(url: string, params?: unknown): Promise<T> {
    return request<T>({ url, method: 'get', params })
  },
}
