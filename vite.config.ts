import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 9876,
    strictPort: true, // 如果端口被占用，不要尝试其他端口
    host: true
  }
})
