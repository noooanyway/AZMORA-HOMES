import test from 'node:test';
import assert from 'node:assert/strict';
import { houseSeo } from '../src/lib/seo.ts';

test('metadados usam os dados reais e respeitam os valores manuais', () => {
  const house = { name_for_site: 'Modelo Alfa', typology: 'T2', bedrooms: 2 };
  const result = houseSeo(house);
  assert.match(result.title, /Modelo Alfa T2/);
  assert.match(result.description, /2 quartos/);
  assert.doesNotMatch(result.description, /disponível|€|entrega incluída/i);
  assert.deepEqual(houseSeo({ ...house, seo_title: 'Título próprio', seo_description: 'Resumo próprio' }), { title: 'Título próprio', description: 'Resumo próprio' });
  assert.doesNotMatch(houseSeo({ name_for_site: 'Modelo T2', typology: 'T2', bedrooms: null }).title, /T2 T2/);
});
