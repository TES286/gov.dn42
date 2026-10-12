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

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), babel({ presets: [reactCompilerPreset()] }), spaFallback()],
})
