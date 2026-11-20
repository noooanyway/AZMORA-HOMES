import { Miniflare } from 'miniflare';
import { generateKeyPair, exportJWK, SignJWT } from 'jose';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { build } from 'esbuild';
const origin = 'https://azmora.example',
  base = origin + '/AZMORA-HOMES/',
  issuer = 'https://test.cloudflareaccess.com';
const { privateKey, publicKey } = await generateKeyPair('RS256', {
  extractable: true,
});
const jwk = { ...(await exportJWK(publicKey)), alg: 'RS256', kid: 'local' };
const token = await new SignJWT({ type: 'app', email: 'owner@example.test' })
  .setIssuedAt()
  .setSubject('owner')
  .setExpirationTime('5m')
  .setIssuer(issuer)
  .setAudience('local')
  .setProtectedHeader({ kid: 'local', alg: 'RS256' })
  .sign(privateKey);
const bundle = await build({
  entryPoints: ['dist-cloudflare/_worker.js/index.js'],
  bundle: true,
  format: 'esm',
  platform: 'neutral',
  external: ['cloudflare:*', 'node:*'],
  write: false,
});
const mf = new Miniflare({
  modules: [
    {
      type: 'ESModule',
      path: 'index.mjs',
      contents: bundle.outputFiles[0].text,
    },
  ],
  compatibilityDate: '2025-11-01',
  compatibilityFlags: ['nodejs_compat', 'disable_nodejs_process_v2'],
  d1Databases: ['DB'],
  r2Buckets: ['PHOTOS'],
  bindings: {
    ADMIN_ORIGIN: origin,
    ACCESS_AUD: 'local',
    ACCESS_ISSUER: issuer,
    ADMIN_EMAILS: 'owner@example.test',
  },
  serviceBindings: { ASSETS: () => new Response(null, { status: 404 }) },
  outboundService: (request) =>
    new URL(request.url).origin === issuer
      ? Response.json({ keys: [jwk] })
      : new Response(null, { status: 403 }),
});
try {
  const db = await mf.getD1Database('DB');
  // D1 exec takes one complete statement per line.
  for (const f of fs.readdirSync('migrations').sort()) {
    const sql = fs.readFileSync('migrations/' + f, 'utf8');
    const statements = sql.match(
      /CREATE TRIGGER[\s\S]*?END;|(?:CREATE TABLE|INSERT INTO)[^]*?;(?=\s*(?:CREATE|INSERT|$))/gi,
    );
    assert.ok(statements?.length);
    for (const stmt of statements) await db.prepare(stmt).run();
  }
  const call = (path, opts = {}) => mf.dispatchFetch(base + path, opts);
  const admin = (action, body) =>
    call('admin/' + (action ? action + '/' : ''), {
      method: body ? 'POST' : 'GET',
      headers: {
        Origin: origin,
        'Cf-Access-Jwt-Assertion': token,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  const json = async (response) => {
    const text = await response.text();
    assert.equal(response.status, 200, text.slice(0, 600));
    return JSON.parse(text);
  };
  assert.equal((await call('admin/')).status, 403);
  assert.equal((await admin('')).status, 200);
  assert.equal((await json(await call('api/casas/'))).length, 16);
  const dashboard = await json(await admin('dados'));
  assert.equal(dashboard.units.length, 16);
  const unit = dashboard.units[0],
    data = { ...unit.data, name_for_site: 'Teste de inventário' };
  const { id } = await json(await admin('guardar', { data, state: 'draft' }));
  const get = async () =>
    (await json(await admin('dados'))).units.find((u) => u.id === id);
  let u = await get();
  assert.equal((await call('casas/' + u.slug + '/')).status, 404);
  const change = (u, state) =>
    admin('guardar', { id, revision: u.revision, data: u.data, state });
  await json(await change(u, 'live'));
  assert.equal((await change(u, 'draft')).status, 409);
  const detail = await call('casas/' + u.slug + '/');
  assert.equal(detail.status, 200);
  const markup = await detail.text();
  assert.ok(markup.includes(data.name_for_site), markup.slice(0, 1800));
  assert.equal((await json(await call('api/casas/'))).length, 17);
  await json(await change(await get(), 'archived'));
  assert.equal((await call('casas/' + u.slug + '/')).status, 404);
  await json(await change(await get(), 'draft'));
  await json(await change(await get(), 'archived'));
  u = await get();
  assert.equal(
    (
      await admin('eliminar', {
        id,
        revision: u.revision,
        confirm: 'incorreta',
      })
    ).status,
    400,
  );
  await json(
    await admin('eliminar', { id, revision: u.revision, confirm: u.slug }),
  );
  assert.equal(await get(), undefined);
  if (process.env.TEST_ADMIN_BROWSER === '1') {
    const { chromium } = await import('playwright-core');
    const browser = await chromium.launch({ channel: 'chrome' });
    try {
      const page = await browser.newPage({
        viewport: { width: 390, height: 844 },
      });
      const errors = [];
      page.on('pageerror', (e) => errors.push(e.message));
      await page.route(origin + '/**', async (route) => {
        const r = route.request(),
          headers = { ...r.headers(), 'Cf-Access-Jwt-Assertion': token };
        const response = await mf.dispatchFetch(r.url(), {
          method: r.method(),
          headers,
          body: r.postDataBuffer() || undefined,
        });
        const resultHeaders = Object.fromEntries(response.headers);
        delete resultHeaders['content-encoding'];
        delete resultHeaders['transfer-encoding'];
        await route.fulfill({
          status: response.status,
          headers: resultHeaders,
          body: Buffer.from(await response.arrayBuffer()),
        });
      });
      await page.goto(base + 'admin/');
      await page.locator('.unit').first().waitFor();
      await page.getByRole('button', { name: 'Adicionar casa' }).click();
      await page
        .getByLabel('Nome da casa', { exact: true })
        .fill('Casa de ensaio');
      await page.getByLabel('Marca', { exact: true }).fill('Azmora');
      await page
        .locator('#files')
        .setInputFiles('public/' + unit.data.media[0].small);
      await page.locator('.photo img').waitFor({timeout:5000}).catch(async e=>{throw Error(e.message+' / '+await page.locator('#notice').innerText())});
      await page.getByRole('button', { name: 'Pré-visualizar' }).click();
      await page.locator('dialog[open]').waitFor();
      await page.locator('#closePreview').click();
      await page.getByRole('button', { name: 'Guardar rascunho' }).click();
      await page
        .locator('.unit')
        .filter({ hasText: 'Casa de ensaio' })
        .waitFor();
      const draft = (await json(await admin('dados'))).units.find(
        (x) => x.data.name_for_site === 'Casa de ensaio',
      );
      const imagePath = draft.data.media[0].src;
      assert.equal((await call(imagePath)).status, 404);
      await json(
        await admin('guardar', {
          id: draft.id,
          revision: draft.revision,
          data: draft.data,
          state: 'live',
        }),
      );
      const image = await call(imagePath);
      assert.equal(image.status, 200);
      assert.equal(image.headers.get('Content-Type'), 'image/webp');
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        true,
      );
      assert.deepEqual(errors, []);
      console.log(
        'OK · Chrome mobile, criação por formulário, upload convertido, pré-visualização, rascunho e visibilidade pública da fotografia.',
      );
    } finally {
      await browser.close();
    }
  }
  console.log(
    'OK · Worker local, acesso, 16 unidades, rascunho, criação, publicação, concorrência, arquivo, recuperação e eliminação.',
  );
} finally {
  await mf.dispose();
}
