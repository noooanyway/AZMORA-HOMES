import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { generateKeyPair, SignJWT } from 'jose';
import { authorize } from '../cloudflare/access.mjs';
import { fields, dimensions } from '../cloudflare/inventory.mjs';
const records = JSON.parse(fs.readFileSync('src/data/houses.json', 'utf8'));
test('migração preserva campos, identidade e fotografias das 16 unidades', () => {
  const db = new DatabaseSync(':memory:');
  for (const file of fs.readdirSync('migrations').sort())
    db.exec(fs.readFileSync('migrations/' + file, 'utf8'));
  for (const row of db
    .prepare('SELECT * FROM inventory ORDER BY rowid')
    .all()) {
    const h = records.find((h) => h.id === row.id);
    assert.deepEqual(JSON.parse(row.data), h);
    assert.ok(fields.safeParse(h).success, h.id);
  }
  assert.equal(db.prepare('SELECT count(*) n FROM inventory').get().n, 16);
  db.close();
});
test('Access valida token, administrador, origem e prazo', async () => {
  const env = {
    ADMIN_ORIGIN: 'https://admin.example',
    ACCESS_ISSUER: 'https://team.cloudflareaccess.com',
    ACCESS_AUD: 'unit-test',
    ADMIN_EMAILS: 'owner@example.test',
  };
  const { publicKey, privateKey } = await generateKeyPair('RS256');
  async function sign(overrides = {}) {
    return new SignJWT({
      email: 'owner@example.test',
      type: 'app',
      aud: env.ACCESS_AUD,
      iss: env.ACCESS_ISSUER,
      sub: 'owner',
      exp: Math.floor(Date.now() / 1000) + 90,
      ...overrides,
    })
      .setIssuedAt()
      .setProtectedHeader({ alg: 'RS256' })
      .sign(privateKey);
  }
  function req(token, origin = env.ADMIN_ORIGIN, host = env.ADMIN_ORIGIN) {
    return new Request(host + '/admin/', {
      method: 'POST',
      headers: { Origin: origin, 'Cf-Access-Jwt-Assertion': token },
    });
  }
  const token = await sign();
  assert.equal(
    await authorize(req(token), env, publicKey),
    'owner@example.test',
  );
  for (const r of [
    req(''),
    req(token, 'https://example.org'),
    req(token, env.ADMIN_ORIGIN, 'https://demo.pages.dev'),
    ...(await Promise.all(
      [
        { aud: 'other' },
        { iss: 'https://other.example' },
        { exp: 1 },
        { email: 'other@example.test' },
      ].map(async (o) => req(await sign(o))),
    )),
  ])
    assert.equal(await authorize(r, env, publicKey), null);
  assert.equal(
    await authorize(
      req(token),
      env,
      (await generateKeyPair('RS256')).publicKey,
    ),
    null,
  );
});
test('validação rejeita preço negativo, caminho externo e conteúdo alheio a WebP', () => {
  assert.equal(
    fields.safeParse({ ...records[0], public_price_eur: -1 }).success,
    false,
  );
  assert.equal(
    fields.safeParse({
      ...records[0],
      media: [{ ...records[0].media[0], src: 'https://example.org/photo' }],
    }).success,
    false,
  );
  assert.throws(() => dimensions(new Uint8Array(50)));
});
