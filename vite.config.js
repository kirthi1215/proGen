import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    proxy: {
      '/api/stability': {
        target: 'https://api.stability.ai',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/stability/, ''),
      },
      '/api/huggingface': {
        target: 'https://api-inference.huggingface.co',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/huggingface/, ''),
      },
      '/api/gtts': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/gtts/, '/api/gtts'),
      },
    },
    // NOTE: local gTTS server restored for TTS functionality
  },
})
