import { readFile, copyFile, mkdir } from 'node:fs/promises';
import { dirname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
// In commercial builds only explicitly approved pictures enter the Pages artifact.
export function approvedMedia() {
  return {
    name: 'approved-media',
    hooks: {
      'astro:build:done': async ({ dir }) => {
        const houses = JSON.parse(
          await readFile('src/data/houses.json', 'utf8'),
        );
        for (const media of houses
          .filter((h) => h.publish)
          .flatMap((h) => h.media)) {
          for (const src of new Set([media.src, media.small, media.cover].filter(Boolean))) {
            const root = resolve('public'),
              original = resolve(root, src),
              target = resolve(fileURLToPath(dir), src);
            if (!original.startsWith(root + sep))
              throw Error('Caminho de imagem inválido');
            await mkdir(dirname(target), { recursive: true });
            await copyFile(original, target);
          }
        }
      },
    },
  };
}
