import { fileURLToPath, URL } from 'node:url'
import http from 'node:http'

import vue from '@vitejs/plugin-vue'
import { defineConfig, type Plugin } from 'vite'

/** 后端网关 */
const GATEWAY = { host: '127.0.0.1', port: 8081 }

/**
 * /api -> 网关 的自研反向代理中间件。
 *
 * 为什么不用 Vite 内置 http-proxy：Node 24 的 http-parser 与 Spring Cloud Gateway
 * 的响应帧存在兼容问题（`Parse Error: Data after Connection: close`，逐请求复现）。
 * 这里用 Node 原生 http.request 直连网关（已实测稳定），强制 `connection: close`
 * 逐请求独立建连，并剥离 hop-by-hop 头，从根上规避问题。
 *
 * 约定：前端统一以 /api 前缀请求，本中间件剥掉前缀后转发，例如
 *   POST /api/business/mall/page -> http://127.0.0.1:8081/business/mall/page
 */
function apiProxyPlugin(): Plugin {
  return {
    name: 'pm-api-proxy',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url ?? ''
        if (!url.startsWith('/api')) {
          next()
          return
        }

        const targetPath = url.replace(/^\/api/, '') || '/'

        // 组装转发请求头：保留业务头（satoken/content-type 等），
        // 剥离 hop-by-hop 头与会影响目标路由的头
        const headers: http.OutgoingHttpHeaders = { ...req.headers }
        delete headers.host
        delete headers.connection
        delete headers.expect
        delete headers['proxy-connection']
        delete headers.keepalive
        delete headers['keep-alive']
        delete headers['transfer-encoding']
        delete headers.te
        delete headers.trailer
        delete headers.upgrade
        headers.host = `${GATEWAY.host}:${GATEWAY.port}`
        headers.connection = 'close'

        const proxyReq = http.request(
          {
            host: GATEWAY.host,
            port: GATEWAY.port,
            path: targetPath,
            method: req.method,
            headers,
          },
          (proxyRes) => {
            // 理论上不会有 100-continue（已移除 expect），防御性跳过
            if (proxyRes.statusCode === 100) {
              proxyRes.resume()
              return
            }
            const resHeaders: http.OutgoingHttpHeaders = { ...proxyRes.headers }
            // 客户端侧连接管理交给 Node，避免与转发头的 connection 冲突
            delete resHeaders.connection
            res.writeHead(proxyRes.statusCode ?? 502, resHeaders)
            proxyRes.pipe(res)
          },
        )

        proxyReq.on('error', (err) => {
          server.config.logger.error(`[api-proxy] ${err.message}`)
          if (!res.headersSent) {
            res.writeHead(502, { 'Content-Type': 'text/plain; charset=utf-8' })
          }
          res.end(`网关代理错误: ${err.message}`)
        })

        req.pipe(proxyReq)
      })
    },
  }
}

export default defineConfig({
  plugins: [vue(), apiProxyPlugin()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    host: '127.0.0.1',
    port: 5173,
    // 不用内置 proxy（见 apiProxyPlugin 注释）
  },
})
