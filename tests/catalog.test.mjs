import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  matches,
  name,
  price,
  status,
  sorted,
  specs,
  toggle,
} from '../src/lib/catalog.ts';
const all = JSON.parse(
  readFileSync(new URL('../src/data/houses.json', import.meta.url)),
);
test('Pesquisa normalizada e facetas combinadas', () => {
  const results = all.filter((h) =>
    matches(
      h,
      new URLSearchParams({
        brand: 'O’Hara',
        typology: 'T2',
        q: "o'hara terraco",
      }),
    ),
  );
  assert.ok(results.some((h) => h.id === 'exposul-001'));
  assert.ok(results.every((h) => h.typology === 'T2' && h.brand === 'O’Hara'));
  assert.equal(
    all.filter((h) => matches(h, new URLSearchParams({ q: 'zzzzzz' }))).length,
    0,
  );
});
test('Preço e estado sem confirmação', () => {
  const h = {
    ...all[0],
    public_price_eur: null,
    availability: 'por_confirmar',
  };
  assert.equal(price(h), 'Preço sob consulta');
  assert.equal(status(h), 'Disponibilidade a confirmar');
  for (const sort of ['preco-asc', 'preco-desc'])
    assert.equal(
      sorted([h, { ...h, public_price_eur: 12000 }], sort).at(-1)
        .public_price_eur,
      null,
    );
  assert.ok(!matches(h, new URLSearchParams({ price: '20000' })));
});
test('Seleção limitada sem perder a terceira casa', () => {
  const selection = ['a', 'b', 'c'];
  assert.deepEqual(toggle(selection, 'd', 3), selection);
  assert.deepEqual(toggle(selection, 'b', 3), ['a', 'c']);
  assert.deepEqual(toggle(['a'], 'b', 3), ['a', 'b']);
});
test('Cada unidade tem identidade e título utilizável', () => {
  assert.equal(new Set(all.map((h) => h.id)).size, all.length);
  for (const h of all) assert.ok(name(h).length > 0);
});

test('A comparação distingue medidas anunciadas, referências e campos desconhecidos', () => {
  const sample = { ...all[0], area_m2: null, model_measure_reference: { area: '29–30 m²' } };
  assert.equal(specs(sample).Área, '29–30 m² (de referência)');
  assert.equal(specs({ ...sample, area_m2: 30 }).Área, '30 m² (no anúncio)');
  assert.equal(specs({ ...sample, model_measure_reference: undefined }).Área, 'A confirmar');
  assert.equal(matches(sample, new URLSearchParams({ area: '20' })), false);
});

test('Cada fotografia e a sua miniatura pertencem à ficha documentada', () => {
  const manifest = JSON.parse(readFileSync(new URL('../docs/media-manifest.json', import.meta.url)));
  for (const house of all) {
    const records = manifest.filter((entry) => entry.unit_id === house.id).sort((a, b) => a.order - b.order);
    assert.equal(records.length, house.media.length);
    house.media.forEach((photo, i) => {
      assert.equal(records[i].source_page_url, house.source.url);
      assert.equal(records[i].local_image_path, photo.src);
      assert.equal(records[i].small_image_path, photo.small);
      assert.ok(photo.alt.trim());
    });
  }
});
