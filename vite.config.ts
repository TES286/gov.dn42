import { copyFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import { defineConfig, type Plugin } from 'vite'

/**
 * 构建后复制 index.html 为 404.html，
 * 以支持 GitHub Pages 等静态托管的 SPA 路由回退。
 */
function spaFallback(): Plugin {
  return {
    name: 'spa-fallback-404',
    apply: 'build',
    closeBundle() {
      const distDir = resolve(import.meta.dirname, 'dist')
      const source = resolve(distDir, 'index.html')
      if (existsSync(source)) {
        copyFileSync(source, resolve(distDir, '404.html'))
      }
    },
  }
}

/**
 * 后端 API 插件：dev 模式下将 /api/v1 转发到生产后端（server/server.ts）。
 * 数据存储在 PostgreSQL（生产）或 pglite（开发，零安装）。
 * 生产构建不含此插件；后端独立部署由 systemd 管理。
 */
function backendApi(): Plugin {
  return {
    name: 'backend-api',
    apply: 'serve',
    configureServer(server) {
      let handlerPromise: Promise<(req: import('node:http').IncomingMessage, res: import('node:http').ServerResponse) => Promise<void>> | null = null

      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/v1')) {
          next()
          return
        }
        try {
          if (!handlerPromise) {
            handlerPromise = import('./server/server.js').then((m) => m.createApp()).then((app) => app.handler)
          }
          const handler = await handlerPromise
          await handler(req, res)
        } catch (err) {
          console.error('[vite] backend plugin error:', err)
          res.writeHead(500, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: { code: 'INTERNAL_ERROR', message: 'backend plugin failed' } }))
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), babel({ presets: [reactCompilerPreset()] }), backendApi(), spaFallback()],
})
