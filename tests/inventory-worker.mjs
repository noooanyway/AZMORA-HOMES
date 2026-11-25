import { Miniflare, convertV4MiniflareOptions } from 'miniflare';
import { generateKeyPair, exportJWK, SignJWT } from 'jose';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { build } from 'esbuild';
const origin = process.env.TEST_ORIGIN || 'https://www.azmorahomes.pt',
  base = origin + (process.env.TEST_BASE_PATH || '/AZMORA-HOMES/'),
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
  entryPoints: ['dist-cloudflare/client/_worker.js/index.js'],
  bundle: true,
  format: 'esm',
  platform: 'neutral',
  external: ['cloudflare:*', 'node:*'],
  write: false,
});
const mf = new Miniflare(
  convertV4MiniflareOptions({
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
      SITE_URL: origin,
      TURNSTILE_SITE_KEY: 'test-site-key',
      TURNSTILE_SECRET_KEY: 'test-secret',
      RESEND_API_KEY: 'test-resend',
      CONTACT_FROM_EMAIL: 'notificacoes@send.azmorahomes.pt',
      CONTACT_TO_EMAIL: 'team@example.test',
    },
    serviceBindings: { ASSETS: () => new Response(null, { status: 404 }) },
    outboundService: (request) =>
      request.url.includes('challenges.cloudflare.com/turnstile/v0/siteverify')
        ? Response.json({
            success: true,
            hostname: new URL(origin).hostname,
            action: 'contact',
            challenge_ts: new Date().toISOString(),
          })
        : request.url.includes('api.resend.com/emails')
          ? Response.json({ id: 'mock-email' })
          : new URL(request.url).origin === issuer
            ? Response.json({ keys: [jwk] })
            : new Response(null, { status: 403 }),
  }),
);
try {
  const db = await mf.getD1Database('DB');
  // D1 exec takes one complete statement per line.
  for (const f of fs.readdirSync('migrations').sort()) {
    const sql = fs.readFileSync('migrations/' + f, 'utf8');
    const statements = sql.match(
      /CREATE TRIGGER[\s\S]*?END;|(?:CREATE TABLE|CREATE INDEX|ALTER TABLE|INSERT INTO)[^]*?;(?=\s*(?:CREATE|ALTER|INSERT|$))/gi,
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

  for (const [route, expected] of [
    ['', 'Outra forma'],
    ['casas/', 'Explore as'],
    ['sobre/', 'Azmora'],
    ['inexistente/', null],
  ]) {
    const response = await call(route);
    const html = await response.text();
    assert.equal(
      response.status,
      expected ? 200 : 404,
      route + ' ' + html.slice(0, 1000),
    );
    if (expected)
      assert.ok(html.includes(expected), route + ' ' + html.slice(0, 1000));
    if (expected) {
      assert.match(html, /<meta name="description" content="[^"]+/);
      assert.match(html, new RegExp('rel="canonical" href="'+origin.replaceAll('.','\\.')+'/'));
      assert.match(html, /property="og:title"/);
    }
  }

  const catalogue = await (await call('casas/')).text();
  assert.match(catalogue, /16 casas/);
  const firstImage = JSON.parse(
    (
      await db
        .prepare("SELECT data FROM inventory WHERE state='live' LIMIT 1")
        .first()
    ).data,
  ).media[0].src;
  const bucket = await mf.getR2Bucket('PHOTOS');
  for (const unit of (
    await db.prepare("SELECT data FROM inventory WHERE state='live'").all()
  ).results) {
    const house = JSON.parse(unit.data);
    assert.equal(
      (await call('casas/' + house.media_slug + '/')).status,
      200,
      house.media_slug,
    );
    for (const picture of house.media)
      for (const path of new Set(
        [picture.src, picture.small, picture.cover].filter(Boolean),
      )) {
        await bucket.put(path, fs.readFileSync('public/' + path));
        assert.equal((await call(path)).status, 200, path);
      }
  }
  assert.equal((await call(firstImage)).status, 200);
  for (const path of [
    'admin/',
    'admin/dados/',
    'admin/foto/',
    'admin/guardar/',
    'admin/upload/',
    'admin/eliminar/',
    'admin/contactos/',
    'admin/contacto/',
    'admin/contactos-exportar/',
    'admin/contactos-guardar/',
    'admin/contactos-reenviar/',
    'admin/contactos-eliminar/',
    'admin/contactos-acao/',
  ]) {
    assert.equal((await call(path)).status, 403, path);
    assert.equal(
      (
        await call(path, {
          method: 'POST',
          headers: { Origin: origin, 'Content-Type': 'application/json' },
          body: '{}',
        })
      ).status,
      403,
      path + ' POST',
    );
  }

  assert.equal(
    (await call('admin', { headers: { 'Cf-Access-Jwt-Assertion': token } }))
      .status,
    200,
    'acesso direto sem barra',
  );
  const denied = await call('admin/contactos-guardar/', {
    method: 'POST',
    headers: {
      Origin: 'https://evil.test',
      'Cf-Access-Jwt-Assertion': token,
      'Content-Type': 'application/json',
    },
    body: '{}',
  });
  assert.equal(denied.status, 403, 'CSRF');
  assert.equal(
    (
      await mf.dispatchFetch('https://preview.azmora-homes.pages.dev/admin/', {
        headers: { 'Cf-Access-Jwt-Assertion': token },
      })
    ).status,
    404,
  );
  if (origin === 'https://www.azmorahomes.pt') {
    const redirect = await mf.dispatchFetch(
      'https://azmorahomes.pt/casas/?q=teste',
      { redirect: 'manual' },
    );
    assert.equal(redirect.status, 308);
    assert.equal(
      redirect.headers.get('Location'),
      'https://www.azmorahomes.pt/casas/?q=teste',
    );
  }
  assert.match(await (await call('robots.txt')).text(), /Disallow: \/admin/);
  assert.ok((await (await call('sitemap.xml')).text()).includes(origin));
  const contactInput = {
    id: crypto.randomUUID(),
    name: 'Cliente sintético',
    email: 'client@example.test',
    phone: '+351912345678',
    island: 'São Miguel',
    locality: 'Teste',
    typology: 'T2',
    request_type: 'orcamento',
    message: 'Mensagem de ensaio',
    houses: [],
    consent: true,
    token: crypto.randomUUID(),
  };
  const submitted = await call('api/contactos/', {
    method: 'POST',
    headers: { Origin: origin, 'Content-Type': 'application/json' },
    body: JSON.stringify(contactInput),
  });
  assert.equal(submitted.status, 201, await submitted.clone().text());
  assert.equal((await json(await admin('contactos'))).total, 1);

  assert.equal((await admin('')).status, 200);
  assert.equal((await json(await call('api/casas/'))).length, 16);
  const dashboard = await json(await admin('dados'));
  assert.equal(dashboard.units.length, 16);
  const unit = dashboard.units[0],
    data = { ...unit.data, name_for_site: 'Teste de inventário' };

  const original = unit.data.name_for_site;
  const changed = {
    ...unit.data,
    name_for_site: 'Casa alterada no inventário',
  };
  await json(
    await admin('guardar', {
      id: unit.id,
      revision: unit.revision,
      data: changed,
      state: 'live',
    }),
  );
  assert.ok(
    (await (await call('casas/')).text()).includes(changed.name_for_site),
  );
  const refreshed = (await json(await admin('dados'))).units.find(
    (item) => item.id === unit.id,
  );
  await json(
    await admin('guardar', {
      id: unit.id,
      revision: refreshed.revision,
      data: { ...refreshed.data, name_for_site: original },
      state: 'live',
    }),
  );
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
  assert.ok(!(await (await call('sitemap.xml')).text()).includes('/casas/'+u.slug+'/'));
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
      await page.route('https://challenges.cloudflare.com/**', (route) =>
        route.fulfill({
          contentType: 'application/javascript',
          body: `window.turnstile={render:(selector,options)=>{window.testChallenge=options;options.callback(crypto.randomUUID());document.querySelector(selector).textContent='Verificação de teste';return 'widget';},reset:()=>window.testChallenge.callback(crypto.randomUUID())};`,
        }),
      );
      await page.route(origin + '/**', async (route) => {
        const r = route.request(),
          headers = { ...r.headers(), 'Cf-Access-Jwt-Assertion': token };
        if (new URL(r.url()).pathname.startsWith('/_astro/')) {
          const file = 'dist-cloudflare/client' + new URL(r.url()).pathname;
          const ext = file.split('.').pop();
          return route.fulfill({
            body: fs.readFileSync(file),
            contentType:
              {
                js: 'application/javascript',
                css: 'text/css',
                woff2: 'font/woff2',
                png: 'image/png',
              }[ext] || 'application/octet-stream',
          });
        }
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
      fs.mkdirSync('.qa', { recursive: true });
      for (const path of ['', 'casas/', 'casas/' + unit.slug + '/']) {
        await page.goto(base + path);
        await page.locator('h1').waitFor();
        await page.locator('img[src]').evaluateAll((images) =>
          Promise.all(
            images.map((i) => {
              i.loading = 'eager';
              return i.decode().catch(() => {});
            }),
          ),
        );
        assert.deepEqual(
          await page
            .locator('img[src]')
            .evaluateAll((images) =>
              images.filter((i) => !i.naturalWidth).map((i) => i.src),
            ),
          [],
          path + ' fotografias',
        );
        assert.equal(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
          true,
          path + ' mobile',
        );
      }
      await page.goto(base + 'contactos/?casas=' + unit.slug + '&motivo=preco');
      await page.locator('[name=nome]').fill('Cliente navegador');
      await page.locator('[name=email]').fill('browser@example.test');
      await page.locator('#lead-message').fill('Pedido sintético no navegador');
      await page.locator('[name=privacidade]').check();
      await page.getByText('Verificação de teste', { exact: true }).waitFor();
      await page.locator('button[type=submit]').click();
      await page.locator('#lead-status[data-state=success]').waitFor();
      assert.equal(
        (await db.prepare('SELECT count(*) n FROM contact_requests').first()).n,
        2,
      );
      await page.screenshot({
        path: '.qa/contactos-mobile.png',
        fullPage: true,
      });
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        true,
        'contactos mobile',
      );
      await page.goto(base + 'admin/');
      await db.prepare('UPDATE contact_requests SET notes=? WHERE id=?').bind('Nota anterior de teste',contactInput.id).run();
      await page.locator('#list .unit').first().waitFor();
      await page.reload();
      await page.getByRole('button', { name: /Pedidos de contacto/ }).click();
      assert.equal(await page.locator('#show-contacts').getAttribute('aria-pressed'),'true');
      await page
        .locator('#contact-list article')
        .filter({ hasText: 'Cliente sintético' })
        .getByRole('button', { name: 'Consultar pedido' })
        .click();
      await page.locator('#contact-detail:not([aria-busy])').waitFor();
      assert.match(await page.locator('#contact-legacy-note').innerText(),/Nota anterior de teste/);
      await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined }));
      await page.locator('#copy-email').click();
      assert.match(await page.locator('#contact-feedback').innerText(),/Não foi possível copiar/);
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('#contact-detail').evaluate(d => d.open),false);
      await page.locator('#contact-list article').filter({hasText:'Cliente sintético'}).getByRole('button',{name:'Consultar pedido'}).click();
      await page.locator('#contact-detail:not([aria-busy])').waitFor();
      const contactBox = await page.locator('#contact-detail').boundingBox();
      await page.mouse.move(contactBox.x + contactBox.width / 2, contactBox.y + 35);
      await page.mouse.down();
      await page.mouse.move(1,1);
      await page.mouse.up();
      assert.equal(await page.locator('#contact-detail').evaluate(d => d.open),true);
      await page.mouse.click(1,1);
      assert.equal(await page.locator('#contact-detail').evaluate(d => d.open),false);
      await page.locator('#contact-list article').filter({hasText:'Cliente sintético'}).getByRole('button',{name:'Consultar pedido'}).click();
      await page.locator('#contact-notes').fill('Nota de ensaio');
      page.once('dialog', dialog => dialog.dismiss());
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('#contact-detail').evaluate(d => d.open),true);
      await page.locator('#contact-status').selectOption('working');
      await page
        .getByRole('button', { name: 'Guardar acompanhamento' })
        .click();
      await page
        .getByText('Acompanhamento guardado.', { exact: true })
        .waitFor();
      assert.ok(await page.locator('#contact-history').innerText().then(s=>s.includes('Nota de ensaio')));
      assert.equal(await page.locator('#contact-email').getAttribute('href'),'https://mail.zoho.eu/');
      await page.locator('#contact-status').selectOption('archived');
      await page.getByRole('button', { name: 'Guardar acompanhamento' }).click();
      await page.getByText('Acompanhamento guardado.', { exact: true }).waitFor();
      await page.locator('#contact-detail:not([aria-busy])').waitFor();
      await page.locator('summary').filter({hasText:'Eliminar dados pessoais'}).click();
      await page.locator('#contact-delete').click();
      await page.locator('#delete-confirmation[open]').waitFor();
      await page.locator('#delete-cancel').click();
      assert.ok(await db.prepare('SELECT id FROM contact_requests WHERE id=?').bind(contactInput.id).first());
      await page.locator('#contact-detail').evaluate((dialog) => {
        dialog.scrollTop = 0;
      });
      await page.screenshot({ path: '.qa/admin-contacto-mobile.png' });
      await page.locator('#contact-close').click();
      assert.equal(
        (
          await db
            .prepare("SELECT note FROM contact_history WHERE contact_id=? AND event='note'")
            .bind(contactInput.id)
            .first()
        ).note,
        'Nota de ensaio',
      );
      await page.locator('#show-inventory').click();
      assert.equal(await page.locator('#show-inventory').getAttribute('aria-pressed'),'true');
      await page.getByRole('button', { name: 'Adicionar casa' }).click();
      await page
        .getByLabel('Nome da casa', { exact: true })
        .fill('Casa de ensaio');
      page.once('dialog', dialog => dialog.dismiss());
      await page.locator('#show-inventory').click();
      assert.equal(await page.locator('#edit').isVisible(),true);
      assert.equal(await page.locator('#dash').isVisible(),false);
      await page.getByLabel('Marca', { exact: true }).fill('Azmora');
      await page
        .locator('#files')
        .setInputFiles('public/' + unit.data.media[0].small);
      await page
        .locator('.photo img')
        .waitFor({ timeout: 5000 })
        .catch(async (e) => {
          throw Error(
            e.message + ' / ' + (await page.locator('#notice').innerText()),
          );
        });
      await page.getByRole('button', { name: 'Pré-visualizar' }).click();
      await page.locator('dialog[open]').waitFor();
      assert.equal(await page.getByRole('dialog', {name:'Pré-visualização da casa'}).isVisible(), true);
      await page.locator('#closePreview').click();
      assert.equal(await page.locator('#peek').evaluate(e => document.activeElement === e),true);
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
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.locator('#show-contacts').click();
      await page.locator('#contact-list article').first().waitFor();
      await page.screenshot({
        path: '.qa/admin-contactos-desktop.png',
        fullPage: true,
      });
      for (const width of [360,390,768,1024,1440,1920]) {
        await page.setViewportSize({width,height:900});
        for (const route of ['', 'casas/', 'casas/'+unit.slug+'/', 'contactos/', 'sobre/', 'favoritos/', 'comparar/', 'privacidade/', 'termos/', 'admin/']) {
          await page.goto(base+route);
          await page.locator('h1:visible').first().waitFor();
          assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`${width}px ${route}`);
        }
        if(width<768){
          await page.goto(base);
          await page.getByRole('button',{name:'Abrir menu'}).click();
          assert.equal(await page.locator('#menu').evaluate(d=>d.open),true);
          await page.keyboard.press('Escape');
          assert.equal(await page.locator('#menu').evaluate(d=>d.open),false);
        }
      }
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
