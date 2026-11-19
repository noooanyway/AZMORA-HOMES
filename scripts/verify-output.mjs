import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const dist = path.resolve(process.argv[2] || 'dist');
const site = new URL(process.env.SITE_URL || 'https://noooanyway.github.io');
const base = new URL(process.env.BASE_PATH || '/AZMORA-HOMES/', site);
if (!base.pathname.endsWith('/')) base.pathname += '/';

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((entry) => {
      const absolute = path.join(directory, entry.name);
      return entry.isDirectory()
        ? walk(absolute)
        : path.relative(dist, absolute).split(path.sep).join('/');
    }),
  );
  return nested.flat();
}

const files = new Set(await walk(dist));
const pages = [...files].filter((file) => file.endsWith('.html'));
for (const route of [
  '',
  'casas/',
  'comparar/',
  'favoritos/',
  'sobre/',
  'contactos/',
  'termos/',
  'privacidade/',
]) {
  assert(files.has(route + 'index.html'), 'Página ausente: ' + route);
}
const houses = JSON.parse(await readFile('src/data/houses.json', 'utf8'));
const mode = process.env.CATALOG_MODE || 'preview';
assert(['production', 'preview'].includes(mode), 'Modo desconhecido');
const allowed = houses.filter(
  (house) =>
    house.publish || (mode === 'preview' && house.catalogue_preview_allowed),
);
const details = pages.filter((file) =>
  /^casas\/[^/]+\/index\.html$/.test(file),
);
assert.equal(
  details.length,
  allowed.length,
  'Número de fichas difere dos registos autorizados para este modo',
);

const errors = new Set();
const anchors = new Map();
let references = 0;
function checkReference(file, value) {
  const current = new URL(file.replace(/index\.html$/, ''), base);
  let url;
  try {
    url = new URL(value.replace(/&(?:amp|#38|#x26);/gi, '&'), current);
  } catch {
    errors.add(file + ' → URL inválido ' + value);
    return;
  }
  if (url.origin !== base.origin) return;
  references++;
  if (!url.pathname.startsWith(base.pathname)) {
    errors.add(file + ' → fora do caminho do projeto: ' + url.pathname);
    return;
  }
  const name = decodeURIComponent(url.pathname.slice(base.pathname.length));
  const destination = files.has(name)
    ? name
    : path.posix.join(name, 'index.html');
  if (!files.has(destination))
    errors.add(file + ' → ficheiro em falta: ' + value);
  else if (
    url.hash &&
    destination.endsWith('.html') &&
    !anchors.get(destination)?.has(decodeURIComponent(url.hash.slice(1)))
  ) {
    errors.add(file + ' → âncora em falta: ' + value);
  }
}

const markup = new Map();
for (const page of pages) {
  const html = await readFile(path.join(dist, page), 'utf8');
  markup.set(page, html);
  anchors.set(
    page,
    new Set(
      [...html.matchAll(/\sid=["']([^"']+)["']/gi)].map((match) => match[1]),
    ),
  );
  assert.match(
    html,
    /<html\b[^>]*lang=["']pt(?:-PT)?["']/i,
    page + ' sem idioma português',
  );
  if (mode === 'preview')
    assert.match(html, /<meta\b[^>]*\bnoindex\b/i, page + ' sem noindex');
}
for (const [page, html] of markup) {
  for (const tag of html.matchAll(
    /<(?:a|link|script|img|source|form)\b[^>]*>/gi,
  )) {
    for (const attr of tag[0].matchAll(
      /\s(?:href|src|action)=["']([^"']*)["']/gi,
    ))
      checkReference(page, attr[1]);
    const srcset = tag[0].match(/\ssrcset=["']([^"']*)["']/i)?.[1];
    if (srcset)
      for (const candidate of srcset.split(','))
        checkReference(page, candidate.trim().split(/\s+/)[0]);
  }
}
for (const file of files) {
  if (!file.endsWith('.css')) continue;
  const css = await readFile(path.join(dist, file), 'utf8');
  for (const reference of css.matchAll(/url\(\s*["']?([^)'"]+?)["']?\s*\)/gi)) {
    if (!reference[1].startsWith('#')) checkReference(file, reference[1]);
  }
}
if (mode === 'production') {
  const withheld = houses.filter((house) => !house.publish);
  for (const file of files) {
    if (!/\.(html|js|json|xml)$/.test(file)) continue;
    const output =
      markup.get(file) ?? (await readFile(path.join(dist, file), 'utf8'));
    for (const house of withheld) {
      if (output.includes(house.id))
        errors.add(file + ' → unidade não aprovada: ' + house.id);
    }
  }
}
assert.equal(errors.size, 0, [...errors].join('\n'));
console.log(
  `OK · ${mode} · ${pages.length} páginas · ${details.length} fichas · ${references} ligações e recursos locais em ${base.pathname}`,
);
