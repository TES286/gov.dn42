import { copyFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import { defineConfig, type Plugin } from 'vite'
import { mockApiHandler } from './server/mockApi.js'

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
 * Mock API 插件：dev 模式下将 /api/v1 请求转发到 mock 后端。
 * 生产构建不含此插件；mock 数据存储在内存，重启即重置。
 */
function mockApi(): Plugin {
  return {
    name: 'mock-api',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url?.startsWith('/api/v1')) {
          next()
          return
        }
        // 转换为 node:http 风格的 req/res（Vite middlewares 已是 http 的实例）
        void mockApiHandler(req, res)
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), babel({ presets: [reactCompilerPreset()] }), mockApi(), spaFallback()],
})
