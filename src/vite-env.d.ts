/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 后端 API 基址；开发默认 /api（经 Vite 代理剥前缀），生产可配完整网关地址 */
  readonly VITE_API_BASE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
