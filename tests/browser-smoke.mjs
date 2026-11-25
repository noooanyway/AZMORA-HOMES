import { chromium } from 'playwright-core';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const data = JSON.parse(readFileSync('src/data/houses.json', 'utf8'));
const [firstHouse, secondHouse, thirdHouse] = data;
const housePath = (house) => 'casas/' + house.media_slug + '/';
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
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const house of [firstHouse, secondHouse]) {
      await page.goto(root + housePath(house));
      const wa = page.getByRole('link', { name: 'Contactar por WhatsApp' });
      const destination = new URL(await wa.getAttribute('href'));
      assert.equal(destination.origin + destination.pathname, 'https://wa.me/351913667365');
      assert.equal(destination.searchParams.get('text'), `Olá! Gostaria de obter mais informações sobre a casa ${house.name_for_site}.`);
      assert.ok(await wa.isVisible());
      assert.ok(await page.locator('a[href="tel:+351913667365"]').count());
      assert.ok(await page.locator('a[href="mailto:geral@azmorahomes.pt"]').count());
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    }
    await page.goto(root + 'contactos/');
    assert.ok(await page.locator('#whatsapp').isVisible());
  }
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto(root);
  const theme = page.locator('html');
  const themeSwitch = page.getByRole('button', { name: 'Tema do site' });
  const themeMenu = page.locator('#theme-menu');
  assert.equal(await theme.getAttribute('data-theme'), 'dark');
  await themeSwitch.click();
  assert.equal(await themeSwitch.getAttribute('aria-expanded'), 'true');
  await page.mouse.click(1, 1);
  await themeMenu.waitFor({ state: 'hidden' });
  await page.waitForFunction(() => document.querySelector('[data-open="theme-menu"]').getAttribute('aria-expanded') === 'false');
  assert.equal(await themeSwitch.getAttribute('aria-expanded'), 'false');
  assert.ok(await themeSwitch.evaluate((el) => el === document.activeElement));
  await themeSwitch.click();
  await themeMenu.getByRole('button', { name: 'Dourado e verde' }).click();
  assert.equal(await theme.getAttribute('data-theme'), 'gold');
  await page.reload();
  assert.equal(await theme.getAttribute('data-theme'), 'gold');
  await themeSwitch.click();
  assert.equal(await themeMenu.getByRole('button', { name: 'Dourado e verde' }).getAttribute('aria-pressed'), 'true');
  await themeMenu.getByRole('button', { name: 'Claro', exact: true }).click();
  assert.equal(await theme.getAttribute('data-theme'), 'light');
  const badAssets = await page
    .locator('img')
    .evaluateAll((images) =>
      images
        .filter((i) => i.complete && !i.naturalWidth)
        .map((i) => i.currentSrc),
    );
  assert.deepEqual(badAssets, []);
  await page.evaluate((id) => localStorage.setItem('azmora:favoritos', JSON.stringify([id])), firstHouse.id);
  await page.goto(root + 'favoritos/');
  assert.ok(await page.locator(`#saved [data-card="${firstHouse.media_slug}"]`).isVisible());
  await page.evaluate(() => localStorage.removeItem('azmora:favoritos'));
  await page.goto(root + 'casas/' + firstHouse.id + '/', { waitUntil: 'commit' });
  await page.waitForURL(root + housePath(firstHouse));
  await page.goto(root + 'contactos/?casas=' + firstHouse.id);
  assert.equal(await page.locator('#selected a').innerText(), firstHouse.name_for_site);
  assert.equal(new URL(page.url()).searchParams.get('casas'), firstHouse.media_slug);
  await page.goto(root + 'casas/');
  const cards = page.locator('#results [data-card]:visible');
  assert.equal(await cards.count(), 16);
  await page.locator('[name=q]').fill('ohara');
  await page.waitForFunction(() =>
    document.getElementById('count')?.textContent.startsWith('5'),
  );
  assert.equal(await cards.count(), 5);
  await page.locator('#filter-toggle').click();
  assert.equal(await page.locator('#filterform [name=availability]').count(), 0);
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
    data.find((h) => h.media_slug === first).area_m2,
    Math.max(...data.map((h) => h.area_m2 ?? 0)),
  );
  await page.locator(`[data-fav="${firstHouse.media_slug}"]`).click();
  await page.goto(root + 'favoritos/');
  await page.reload();
  assert.equal(await page.locator('#saved [data-card]:visible').count(), 1);
  await page.locator('#favcontact').click();
  assert.equal(new URL(page.url()).searchParams.get('casas'), firstHouse.media_slug);
  const form = page.locator('#lead-form');
  assert.equal(await form.getAttribute('action'), null);
  assert.ok(await form.locator('button[type=submit]').isDisabled());
  await page.goto(root + 'casas/');
  for (const house of data.slice(0, 4))
    await page.locator(`#results [data-compare="${house.media_slug}"]`).click();
  assert.equal(
    await page.locator('[data-compare][aria-pressed=true]').count(),
    3,
  );
  await page.locator('#compareLink').click();
  await page.locator('#tablehost table').waitFor();
  await page.locator('#cmpcontact').click();
  assert.deepEqual(
    new URL(page.url()).searchParams.get('casas').split(',').sort(),
    [firstHouse, secondHouse, thirdHouse].map((house) => house.media_slug).sort(),
  );
  await page.goto(root + housePath(firstHouse));
  await page.reload();
  assert.ok((await page.title()).includes(data[0].name_for_site));
  assert.ok(!(await page.title()).includes(data[0].id));
  await page.locator('.summary a.btn').filter({ hasText: 'Pedir preço e disponibilidade' }).click();
  assert.equal(await page.locator('#lead-topic').inputValue(), 'preco');
  assert.equal(await page.locator('#selected a').innerText(), data[0].name_for_site);
  await page.locator('#lead-house').selectOption(secondHouse.media_slug);
  assert.equal(await page.locator('#selected li').count(), 2);
  await page.getByRole('button', { name: `Remover ${data[1].name_for_site}`, exact: true }).click();
  assert.equal(await page.locator('#selected li').count(), 1);
  await page.goto(root + housePath(firstHouse));
  if (await page.locator('#gallery [data-photo]').count()) {
    const openGallery = page.locator('#gallery [data-photo]');
    const lightbox = page.locator('#lightbox');
    const thumbnail = await page.locator('.thumbs button').first().boundingBox();
    assert.ok(thumbnail.width >= 110);
    await openGallery.click();
    await page.locator('#lightbox[open]').waitFor();
    await page.locator('#enlarged').click();
    assert.ok(await lightbox.isVisible());
    if (data[0].media.length > 1) {
      const before = await page.locator('#enlarged').getAttribute('src');
      await page.keyboard.press('ArrowRight');
      assert.notEqual(
        await page.locator('#enlarged').getAttribute('src'),
        before,
      );
    }
    const position = await page.evaluate(() => scrollY);
    await page.mouse.click(1, 1);
    await lightbox.waitFor({ state: 'hidden' });
    assert.equal(await page.evaluate(() => scrollY), position);
    assert.ok(await openGallery.evaluate((el) => el === document.activeElement));
    await openGallery.click();
    await page.keyboard.press('Escape');
    await lightbox.waitFor({ state: 'hidden' });
    assert.ok(await openGallery.evaluate((el) => el === document.activeElement));
  }
  await page.setViewportSize({ width: 360, height: 780 });
  for (const route of [
    '',
    'casas/',
    'comparar/',
    'favoritos/',
    'contactos/',
    housePath(firstHouse),
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
  const openMenu = page.locator('[data-open=menu]');
  const mobileMenu = page.locator('#menu');
  await openMenu.click();
  await page.mouse.click(1, 1);
  await mobileMenu.waitFor({ state: 'hidden' });
  assert.ok(await openMenu.evaluate((el) => el === document.activeElement));
  await openMenu.click();
  await mobileMenu.getByRole('link', { name: 'Sobre' }).click();
  assert.equal(new URL(page.url()).pathname, new URL('sobre/', root).pathname);
  await page.goto(root + 'comparar/');
  await page.locator(`#tablehost button[data-compare="${thirdHouse.media_slug}"]`).click();
  assert.equal(await page.locator('#tablehost thead th').count(), 3);
  await page.goto(root + 'casas/');
  await page.locator('#tray [data-clear]').click();
  assert.ok(await page.locator('#tray').isHidden());
  await page.goto(root + 'favoritos/');
  await page.locator(`#saved [data-fav="${firstHouse.media_slug}"]`).click();
  assert.ok(await page.locator('#favempty').isVisible());
  await page.goto(root + 'contactos/?casas=' + [firstHouse.media_slug, secondHouse.media_slug].join(',') + '&motivo=preco');
  assert.ok(await page.locator('a[href="mailto:geral@azmorahomes.pt"]').first().isVisible());
  assert.equal(await page.locator('#selected li').count(), 2);
  assert.ok(await page.locator('#lead-form button[type=submit]').isDisabled());
  assert.ok(await page.locator('#lead-unavailable').isVisible());
  assert.deepEqual(errors, []);
  console.log(
    'OK browser · desktop/mobile 360 px, filtros partilháveis, lista, ordenação, favoritos persistentes, comparação 2–3, contacto, ficha, galeria quando disponível, navegação e teclado.',
  );
} finally {
  await browser.close();
}
