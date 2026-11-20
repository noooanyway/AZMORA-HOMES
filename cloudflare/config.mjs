import { fileURLToPath } from 'node:url';
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
const entry = (name) => fileURLToPath(new URL(name, import.meta.url));
if (!process.env.SITE_URL)
  throw Error('Defina SITE_URL com o endereço público da Azmora.');
export default defineConfig({
  site: process.env.SITE_URL,
  base: process.env.BASE_PATH || '/AZMORA-HOMES',
  trailingSlash: 'always',
  output: 'server',
  outDir: './dist-cloudflare',
  publicDir: './.astro/empty-public',
  adapter: cloudflare({
    platformProxy: { enabled: true },
    imageService: 'compile',
  }),
  integrations: [
    {
      name: 'inventario',
      hooks: {
        'astro:config:setup': ({ injectRoute, addMiddleware }) => {
          addMiddleware({
            entrypoint: entry('./middleware.mjs'),
            order: 'pre',
          });
          for (const [pattern, file] of [
            ['/admin/[...action]', 'admin.mjs'],
            ['/api/casas', 'public.mjs'],
            ['/images/[...key]', 'media.mjs'],
          ])
            injectRoute({
              pattern,
              entrypoint: entry('./' + file),
              prerender: false,
            });
        },
      },
    },
  ],
  vite: {
    define: {
      'import.meta.env.CATALOG_PREVIEW': 'false',
      'import.meta.env.INVENTORY_LIVE': 'true',
    },
  },
});
