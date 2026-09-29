import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config'

// `npx pwa-assets-generator` で public/icon.svg から PWA アイコンを作る
export default defineConfig({
  preset: {
    ...minimal2023Preset,
    maskable: { ...minimal2023Preset.maskable, resizeOptions: { background: '#1e1c29' } },
    apple: { ...minimal2023Preset.apple, resizeOptions: { background: '#1e1c29' } },
  },
  images: ['public/icon.svg'],
})
