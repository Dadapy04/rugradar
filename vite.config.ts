import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages serves the site at https://dadapy04.github.io/rugradar/
  base: '/rugradar/',
  plugins: [react()],
})
