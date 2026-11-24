import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const site = new URL(process.env.SITE_URL);
assert.equal(site.protocol, 'https:');
assert.equal(site.pathname, '/', 'SITE_URL deve conter apenas a origem');
assert.equal(site.search, '');
assert.equal(site.hash, '');
const base = (process.env.BASE_PATH || '/').replace(/\/$/, '');
const edge = await fs.readFile(
  'dist-cloudflare/client/_worker.js/index.js',
  'utf8',
);
assert.ok(
  edge.includes(JSON.stringify(site.origin)),
  'Origem do Worker difere de SITE_URL',
);
assert.ok(
  edge.includes('base = ' + JSON.stringify(base)),
  'BASE_PATH incorreto',
);
await fs.access('dist-cloudflare/client/_worker.js/entry.mjs');
const routes = JSON.parse(
  await fs.readFile('dist-cloudflare/client/_routes.json'),
);
assert.deepEqual(routes.include, ['/*']);
assert.deepEqual(routes.exclude, [base + '/_astro/*',base + '/assets/azmora-logo.png']);
assert.deepEqual(await fs.readFile('dist-cloudflare/client/assets/azmora-logo.png'),await fs.readFile('public/assets/azmora-logo.png'));
const files = await fs.readdir('dist-cloudflare/client', { recursive: true });
assert.ok(
  !files.some((f) => /\.map$|\.env|\.dev\.vars/.test(f)),
  'Ficheiro privado no artefacto',
);
console.log(
  'OK · Pages advanced mode · origem ' +
    site.origin +
    ' · base ' +
    (base || '/') +
    ' · output dist-cloudflare/client',
);
