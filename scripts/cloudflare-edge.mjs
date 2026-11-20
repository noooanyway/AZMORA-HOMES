import fs from 'node:fs/promises';
import path from 'node:path';
const root = 'dist-cloudflare';
const client = path.join(root, 'client');
const worker = path.join(client, '_worker.js');
const origin = new URL(process.env.SITE_URL).origin;
if (!origin.startsWith('https://')) throw Error('SITE_URL deve usar HTTPS.');
const base = (process.env.BASE_PATH || '/AZMORA-HOMES').replace(/\/$/, '');
await fs.mkdir(worker, { recursive: true });
await fs.cp(path.join(root, 'server'), worker, {
  recursive: true,
  filter: file => !file.endsWith('.map') && !file.endsWith('wrangler.json'),
});
const edge = await fs.readFile('cloudflare/edge.mjs', 'utf8');
await fs.writeFile(path.join(worker, 'index.js'), edge
  .replace('BASE_PATH_FOR_BUILD', JSON.stringify(base))
  .replace('PUBLIC_ORIGIN_FOR_BUILD', JSON.stringify(origin)));
await fs.writeFile(path.join(client, '_routes.json'), JSON.stringify({
  version: 1, include: ['/*'], exclude: [base + '/_astro/*'],
}));
