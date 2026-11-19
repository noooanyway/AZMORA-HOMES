import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  matches,
  name,
  price,
  status,
  sorted,
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
