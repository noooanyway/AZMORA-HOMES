import fs from 'node:fs/promises';
const dir = 'dist-cloudflare/_worker.js/';
const src = await fs.readFile('cloudflare/edge.mjs', 'utf8');
const origin = new URL(process.env.SITE_URL).origin;
if (!origin.startsWith('https://')) throw Error('SITE_URL deve usar HTTPS.');
const base = (process.env.BASE_PATH || '/AZMORA-HOMES').replace(/\/$/, '');
await fs.rename(dir + 'index.js', dir + 'astro-entry.js');
await fs.writeFile(
  dir + 'index.js',
  src
    .replace('BASE_PATH_FOR_BUILD', JSON.stringify(base))
    .replace('PUBLIC_ORIGIN_FOR_BUILD', JSON.stringify(origin)),
);
