import { defineConfig } from 'astro/config';
import { approvedMedia } from './scripts/approved-media.mjs';
const commercial = process.env.CATALOG_MODE === 'production';
export default defineConfig({
  publicDir: commercial ? './.astro/empty-public' : './public',
  integrations: commercial ? [approvedMedia()] : [],
  site: process.env.SITE_URL || 'https://noooanyway.github.io',
  base: process.env.BASE_PATH ?? '/AZMORA-HOMES',
  trailingSlash: 'always',
  output: 'static',
  vite: {
    define: {
      'import.meta.env.CATALOG_PREVIEW': JSON.stringify(
        process.env.CATALOG_MODE !== 'production',
      ),
    },
  },
});
