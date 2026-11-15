import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

const sourceName = ${esc.json(project.sourceName)}
const nodeEnv = process.env.NODE_ENV || 'production'

export default defineConfig({
  base: './',
  plugins: [vue()],
  define: {
    'process.env.NODE_ENV': JSON.stringify(nodeEnv),
  },
  server: {
    cors: true,
    host: '0.0.0.0',
    port: Number(process.env.port || process.env.npm_config_port || 8081),
  },
  build: {
    cssCodeSplit: false,
    emptyOutDir: true,
    lib: {
      entry: 'src/index.js',
      name: sourceName,
      formats: ['umd'],
      fileName: () => 'static/js/library.js',
    },
    outDir: 'dist',
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => assetInfo.name?.endsWith('.css') ? 'static/css/library.css' : 'static/[name][extname]',
      },
    },
  },
})
