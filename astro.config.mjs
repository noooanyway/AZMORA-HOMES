import { defineConfig } from 'astro/config';
import { approvedMedia } from './scripts/approved-media.mjs';
import { fileURLToPath } from 'node:url';
const localLegal = { name: 'legal-local', hooks: { 'astro:config:setup': ({ command, injectRoute }) => {
  if (command !== 'dev') return;
  for (const route of ['cookies', 'aviso-legal']) injectRoute({ pattern: '/' + route, entrypoint: fileURLToPath(new URL('./src/legal-local/' + route + '.astro', import.meta.url)) });
} } };
const commercial = process.env.CATALOG_MODE === 'production';
export default defineConfig({
  publicDir: commercial ? './.astro/empty-public' : './public',
  integrations: commercial ? [approvedMedia(), localLegal] : [localLegal],
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
