import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import saveTripPlugin from './vite-plugin-save-trip.ts'

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages serves the site from https://<user>.github.io/thailand-trip/
  base: '/thailand-trip/',
  plugins: [react(), saveTripPlugin()],
})
