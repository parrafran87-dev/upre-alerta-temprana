import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// If you publish to https://<USER>.github.io/<REPO>/ keep base as '/upre-alerta-temprana/'.
// If you publish to https://<USER>.github.io/ (root), change base to '/'.
export default defineConfig({
  plugins: [react()],
  base: '/upre-alerta-temprana/'
})
