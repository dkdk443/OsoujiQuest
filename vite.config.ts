import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // /api/* は `npm run dev:api`（wrangler pages dev, 8788）の Pages Functions に流す
    proxy: { '/api': 'http://localhost:8788' },
  },
})
