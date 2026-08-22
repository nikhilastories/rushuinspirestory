import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// @ts-expect-error -- plain ESM helper, shared with the standalone `npm run validate:categories`
import { validateCategoriesPlugin } from './scripts/validate-categories.mjs'

export default defineConfig({
  // Story categories are validated against categories.json before the bundle is
  // emitted, so an unlisted category fails the build instead of shipping.
  plugins: [react(), validateCategoriesPlugin()],
  server: {
    proxy: {
      '/api': 'http://localhost:8889',
    },
  },
})
