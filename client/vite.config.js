import path from 'node:path'
import os from 'node:os'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Keep Vite's cache off OneDrive — rename of deps_temp → deps fails with EPERM when synced.
const cacheDir = path.join(
  process.env.LOCALAPPDATA || os.tmpdir(),
  'vite-cache',
  'PMS-client',
)

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  cacheDir,
})
