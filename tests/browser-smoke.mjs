import { chromium } from 'playwright-core';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const data = JSON.parse(readFileSync('src/data/houses.json', 'utf8'));
const company = JSON.parse(readFileSync('src/data/company.json', 'utf8'));
const exe = process.env.CHROME_BIN;
const browser = await chromium.launch({
  channel: exe ? undefined : 'chrome',
  executablePath: exe,
  headless: true,
  args: ['--disable-background-networking'],
});
const root = process.env.TEST_URL || 'http://127.0.0.1:4321/AZMORA-HOMES/';
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.setDefaultTimeout(10000);
page.setDefaultNavigationTimeout(60000);
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
try {
  await page.goto(root);
  const badAssets = await page
    .locator('img')
    .evaluateAll((images) =>
      images
        .filter((i) => i.complete && !i.naturalWidth)
        .map((i) => i.currentSrc),
    );
  assert.deepEqual(badAssets, []);
  await page.goto(root + 'casas/');
  const cards = page.locator('#results [data-card]:visible');
  assert.equal(await cards.count(), 16);
  await page.locator('[name=q]').fill('ohara');
  await page.waitForFunction(() =>
    document.getElementById('count')?.textContent.startsWith('5'),
  );
  assert.equal(await cards.count(), 5);
  await page.locator('#filter-toggle').click();
  await page.locator('select[name=typology]').selectOption('T2');
  assert.ok(await page.locator('#filters').isVisible());
  assert.equal(await page.locator('dialog[open]').count(), 0);
  assert.equal(
    await cards.count(),
    data.filter((h) => h.brand.startsWith('O') && h.typology === 'T2').length,
  );
  assert.ok(new URL(page.url()).searchParams.has('typology'));
  await page.reload();
  assert.equal(
    await cards.count(),
    data.filter((h) => h.brand.startsWith('O') && h.typology === 'T2').length,
  );
  await page.locator('[name=q]').fill('inexistente');
  await page.locator('#empty').waitFor();
  await page.locator('#empty [data-reset]').click();
  assert.equal(await cards.count(), 16);
  await page.locator('[data-view=list]').click();
  assert.equal(
    await page.locator('[data-view=list]').getAttribute('aria-pressed'),
    'true',
  );
  await page.locator('select[name=sort]').selectOption('area');
  const first = await cards.first().getAttribute('data-card');
  assert.equal(
    data.find((h) => h.id === first).area_m2,
    Math.max(...data.map((h) => h.area_m2 ?? 0)),
  );
  await page.locator('[data-fav="exposul-001"]').click();
  await page.goto(root + 'favoritos/');
  await page.reload();
  assert.equal(await page.locator('#saved [data-card]:visible').count(), 1);
  await page.locator('#favcontact').click();
  assert.equal(new URL(page.url()).searchParams.get('casas'), 'exposul-001');
  const form = page.locator('#lead-form');
  const endpoint = process.env.PUBLIC_FORM_ENDPOINT || company.formEndpoint;
  assert.equal(await form.getAttribute('action'), endpoint);
  assert.ok(await form.locator('button[type=submit]').isEnabled());
  await page.goto(root + 'casas/');
  for (let i = 1; i <= 4; i++)
    await page.locator('#results [data-compare="exposul-00' + i + '"]').click();
  assert.equal(
    await page.locator('[data-compare][aria-pressed=true]').count(),
    3,
  );
  await page.locator('#compareLink').click();
  await page.locator('#tablehost table').waitFor();
  await page.locator('#cmpcontact').click();
  assert.deepEqual(
    new URL(page.url()).searchParams.get('casas').split(',').sort(),
    ['exposul-001', 'exposul-002', 'exposul-003'],
  );
  await page.goto(root + 'casas/exposul-001/');
  await page.reload();
  assert.ok((await page.title()).includes(data[0].name_for_site));
  assert.ok(!(await page.title()).includes(data[0].id));
  await page.locator('.summary a.btn').filter({ hasText: 'Pedir preço e disponibilidade' }).click();
  assert.equal(await page.locator('#lead-topic').inputValue(), 'preco');
  assert.equal(await page.locator('#selected a').innerText(), data[0].name_for_site);
  await page.locator('#lead-house').selectOption(data[1].id);
  assert.equal(await page.locator('#selected li').count(), 2);
  await page.getByRole('button', { name: `Remover ${data[1].name_for_site}`, exact: true }).click();
  assert.equal(await page.locator('#selected li').count(), 1);
  await page.goto(root + 'casas/exposul-001/');
  if (await page.locator('#gallery [data-photo]').count()) {
    await page.locator('#gallery [data-photo]').click();
    await page.locator('#lightbox[open]').waitFor();
    if (data[0].media.length > 1) {
      const before = await page.locator('#enlarged').getAttribute('src');
      await page.keyboard.press('ArrowRight');
      assert.notEqual(
        await page.locator('#enlarged').getAttribute('src'),
        before,
      );
    }
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#lightbox[open]').count(), 0);
  }
  await page.setViewportSize({ width: 360, height: 780 });
  for (const route of [
    '',
    'casas/',
    'comparar/',
    'favoritos/',
    'contactos/',
    'casas/exposul-001/',
    'sobre/',
  ]) {
    await page.goto(root + route);
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
      'overflow at ' + route,
    );
  }
  await page.goto(root + 'casas/');
  await page.locator('#filter-toggle').click();
  await page.locator('#filterform select').first().focus();
  await page.keyboard.press('Escape');
  assert.ok(await page.locator('#filters').isHidden());
  assert.ok(
    await page
      .locator('#filter-toggle')
      .evaluate((el) => document.activeElement === el),
  );
  await page.locator('[data-open=menu]').click();
  await page.locator('#menu a').filter({ hasText: 'Sobre' }).click();
  assert.equal(new URL(page.url()).pathname, '/AZMORA-HOMES/sobre/');
  await page.goto(root + 'comparar/');
  await page.locator('#tablehost button[data-compare="exposul-003"]').click();
  assert.equal(await page.locator('#tablehost thead th').count(), 3);
  await page.goto(root + 'casas/');
  await page.locator('#tray [data-clear]').click();
  assert.ok(await page.locator('#tray').isHidden());
  await page.goto(root + 'favoritos/');
  await page.locator('#saved [data-fav="exposul-001"]').click();
  assert.ok(await page.locator('#favempty').isVisible());
  let notification;
  await page.route(endpoint, async (route) => {
    const request = route.request();
    notification = await new Response(request.postDataBuffer(), {
      headers: { 'Content-Type': request.headers()['content-type'] },
    }).formData();
    await route.fulfill({ json: { ok: true } });
  });
  await page.goto(root + 'contactos/?casas=' + data[0].id + '&motivo=preco');
  assert.ok(await page.locator('a[href="mailto:azmorahomes@gmail.com"]').first().isVisible());
  await page.locator('[name=nome]').fill('Teste Azmora');
  await page.locator('[name=email]').fill('teste@example.com');
  await page.locator('[name=localidade]').fill('Ponta Delgada');
  await page.locator('[name=message]').fill('Teste de preço e disponibilidade. Pode ignorar.');
  await page.locator('#lead-form button[type=submit]').click();
  assert.equal(notification, undefined);
  await page.locator('[name=privacidade]').check();
  await page.locator('#lead-form button[type=submit]').click();
  await page.locator('#lead-status[data-state=success]').waitFor();
  assert.equal(notification.get('subject'), '[Azmora Homes] Preço e disponibilidade — ' + data[0].name_for_site);
  assert.equal(notification.get('email'), 'teste@example.com');
  assert.equal(notification.get('nome'), 'Teste Azmora');
  assert.equal(notification.get('motivo'), 'Preço e disponibilidade');
  assert.equal(notification.get('localidade'), 'Ponta Delgada');
  assert.equal(notification.get('message'), 'Teste de preço e disponibilidade. Pode ignorar.');
  assert.equal(notification.get('casas'), data[0].name_for_site + ' · ' + root + 'casas/' + data[0].id + '/');
  assert.deepEqual(errors, []);
  console.log(
    'OK browser · desktop/mobile 360 px, filtros partilháveis, lista, ordenação, favoritos persistentes, comparação 2–3, contacto, ficha, galeria quando disponível, navegação e teclado.',
  );
} finally {
  await browser.close();
}
