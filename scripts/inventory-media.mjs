import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const cli = path.join(
  path.dirname(require.resolve('wrangler/package.json')),
  'bin/wrangler.js',
);
const [bucket, mode] = process.argv.slice(2);
if (
  !/^[a-z0-9][a-z0-9-]+$/.test(bucket || '') ||
  !['--local', '--remote'].includes(mode)
)
  throw Error('Indique bucket e --local ou --remote.');
const houses = JSON.parse(fs.readFileSync('src/data/houses.json', 'utf8'));
for (const h of houses)
  for (const m of h.media)
    for (const key of new Set([m.src, m.small, m.cover].filter(Boolean))) {
      const result = spawnSync(
        process.execPath,
        [
          cli,
          'r2',
          'object',
          'put',
          bucket + '/' + key,
          mode,
          '--file',
          path.resolve('public', key),
          '--content-type',
          key.endsWith('.avif') ? 'image/avif' : 'image/webp',
        ],
        { stdio: 'inherit' },
      );
      if (result.status !== 0) throw Error('Importação interrompida em ' + key);
    }
