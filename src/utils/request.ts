import axios, { type AxiosRequestConfig } from 'axios'
import { ElMessage } from 'element-plus'

import { storage } from '@/utils/storage'

/** 后端统一响应包装 */
export interface ApiResult<T = unknown> {
  code: number
  message: string
  data: T
}

const service = axios.create({
  // 开发默认 /api（Vite 代理剥前缀转发网关）；生产可用 VITE_API_BASE 指向网关
  baseURL: import.meta.env.VITE_API_BASE || '/api',
  timeout: 15000,
})

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
