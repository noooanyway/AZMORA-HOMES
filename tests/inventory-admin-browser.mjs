import assert from 'node:assert/strict';
import fs from 'node:fs';

// Exercises the actual protected Worker and UI. All fixtures live in ephemeral Miniflare D1/R2.
export async function testInventoryAdmin({
  page,
  db,
  admin,
  json,
  call,
  base,
  template,
  getUnit,
}) {
  const group = 'MODELO QA — gestão rápida';
  const evidence = [];
  const record = (test) => {
    evidence.push(test);
    console.log('OK · Inventário ADMIN · ' + test);
  };
  const ids = [];
  async function create(name, availability, state = 'live', overrides = {}) {
    const result = await json(
      await admin('guardar', {
        state,
        data: {
          ...template,
          name_for_site: name,
          inventory_group: group,
          typology: 'T2',
          availability,
          public_price_eur: 34567,
          reference_azmora: 'QA ' + name,
          featured: false,
          ...overrides,
        },
      }),
    );
    ids.push(result.id);
    return getUnit(result.id);
  }
  const a = await create('QA unidade Alfa', 'disponivel');
  const b = await create('QA unidade Beta', 'disponivel');
  await create('QA unidade por confirmar', 'por_confirmar', 'draft', {
    media: [],
    public_price_eur: null,
  });
  await create('QA unidade arquivada', 'reservado', 'archived');
  const card = () =>
    page
      .locator('#groups .unit')
      .filter({ has: page.getByRole('heading', { name: group, exact: true }) });
  const rows = () => page.locator('#list .unit');
  async function ready() {
    await page.waitForFunction(
      () =>
        !document.querySelector('#dash').inert &&
        document.querySelector('#list .unit'),
    );
  }
  async function reload() {
    await page.goto(base + 'admin/');
    await ready();
  }
  async function model() {
    await page.locator('#view-models').click();
    await card().waitFor();
  }
  async function counts(available, reserved, sold, unconfirmed) {
    const content = await card().innerText();
    for (const text of [
      `Disponíveis: ${available}`,
      `Reservadas: ${reserved}`,
      `Vendidas: ${sold}`,
      `Por confirmar / em breve: ${unconfirmed}`,
      `Stock comercial: ${available + reserved}`,
    ])
      assert.ok(content.includes(text), text + ' in ' + content);
  }
  async function publicState(u, state) {
    const units = (await json(await admin('dados'))).units.filter(x => x.state === 'live' && x.data.inventory_group === group);
    const first = units[0];
    const states = units.map(x => x.data.availability);
    state = ['disponivel','reservado','por_confirmar','em_breve','vendido'].find(x => states.includes(x));
    u = {...u,slug:first.slug};
    const data = await json(await call('api/casas/'));
    assert.equal(data.filter(x => units.some(unit => unit.slug === x.id)).length,1, 'Apenas um anúncio público por modelo');
    const publicUnit = data.find((x) => x.id === u.slug);
    assert.ok(publicUnit, 'Published unit must remain public');
    assert.equal(publicUnit.availability, state);
    const detail = await (await call('casas/' + u.slug + '/')).text();
    assert.ok(
      detail.includes(
        {
          disponivel: 'Disponível',
          reservado: 'Reservada',
          vendido: 'Vendida',
        }[state],
      ),
      'Public HTML state',
    );
    for (const category of ['disponivel', 'reservado', 'vendido']) {
      const html = await (await call('casas/?estado=' + category)).text();
      assert.equal(
        html.includes('data-card="' + u.slug + '"'),
        category === state,
        'Public category ' + category,
      );
    }
  }
  async function action(label, name, status = 200) {
    const response = page.waitForResponse(
      (r) =>
        r.url().endsWith('/admin/guardar/') && r.request().method() === 'POST',
    );
    page.once('dialog', async (d) => {
      assert.equal(d.type(), 'confirm');
      await d.accept();
    });
    await card().getByRole('button', { name: label, exact: true }).click();
    if (name) {
      await page.locator('#unit-choice[open]').waitFor();
      const option = page.locator('.unit-option').filter({ hasText: name });
      assert.equal(await option.locator('img').count(), 1);
      assert.match(await option.innerText(), /34.*567/);
      await option.click();
    } else
      assert.equal(
        await page.locator('#unit-choice').evaluate((d) => d.open),
        false,
        'Single eligible unit skips selector',
      );
    assert.equal((await response).status(), status);
    await ready();
    await page.waitForFunction(
      () => document.querySelector('#notice').textContent.length > 0,
    );
  }
  await reload();
  assert.equal(
    await rows()
      .filter({ hasText: 'QA unidade por confirmar' })
      .locator('.photo-placeholder')
      .innerText(),
    'Sem fotografia',
  );
  assert.match(
    await rows().filter({ hasText: 'QA unidade por confirmar' }).innerText(),
    /Preço sob consulta/,
  );
  await model();
  await counts(2, 0, 0, 1);
  assert.match(await card().innerText(), /1 unidade\(s\) arquivada/);
  await action('Reservar', 'QA unidade Alfa');
  await counts(1, 1, 0, 1);
  await publicState(a, 'reservado');
  assert.equal((await getUnit(b.id)).data.availability, 'disponivel');
  record(
    'Seletor visual identifica unidade; reserva altera apenas Alfa e atualiza API/HTML público e contagens',
  );
  await action('Cancelar reserva');
  await counts(2, 0, 0, 1);
  await publicState(a, 'disponivel');
  record('Cancelamento de reserva com unidade única dispensa seletor');

  const beforeCancel = await getUnit(a.id);
  await card().getByRole('button', { name: 'Reservar', exact: true }).click();
  await page.locator('#unit-choice-cancel').click();
  assert.equal(
    await page.locator('#unit-choice').evaluate((d) => d.open),
    false,
  );
  assert.equal(
    await card()
      .getByRole('button', { name: 'Reservar', exact: true })
      .evaluate((e) => document.activeElement === e),
    true,
  );
  await card().getByRole('button', { name: 'Reservar', exact: true }).click();
  await page.keyboard.press('Escape');
  assert.equal(
    await page.locator('#unit-choice').evaluate((d) => d.open),
    false,
  );
  assert.equal((await getUnit(a.id)).revision, beforeCancel.revision);
  record('Cancelar/Escape e devolução do foco não gravam alterações');

  await action('Registar venda', 'QA unidade Alfa');
  await counts(1, 0, 1, 1);
  await publicState(a, 'vendido');
  record('Venda direta preserva publicação, características e fotografia');
  await action('Reservar');
  await counts(0, 1, 1, 1);
  await publicState(b, 'reservado');
  assert.equal(
    await card()
      .getByRole('button', { name: 'Reservar', exact: true })
      .isDisabled(),
    true,
  );
  record(
    'Reserva da última disponível zera disponibilidade e desativa nova reserva',
  );
  await action('Registar venda');
  await counts(0, 0, 2, 1);
  await publicState(b, 'vendido');
  assert.equal(
    await card()
      .getByRole('button', { name: 'Registar venda', exact: true })
      .isDisabled(),
    true,
  );
  record('Venda da unidade reservada zera stock comercial');
  for (const source of [a, b]) {
    const current = await getUnit(source.id);
    for (const key of Object.keys(source.data).filter(
      (k) => k !== 'availability',
    ))
      assert.deepEqual(
        current.data[key],
        source.data[key],
        'Quick actions preserve ' + key,
      );
    const history = (
      await db
        .prepare(
          'SELECT old_state,new_state,actor FROM inventory_commercial_history WHERE inventory_id=? ORDER BY seq',
        )
        .bind(source.id)
        .all()
    ).results;
    assert.deepEqual(
      history.map((h) => [h.old_state, h.new_state]),
      source.id === a.id
        ? [
            ['disponivel', 'reservado'],
            ['reservado', 'disponivel'],
            ['disponivel', 'vendido'],
          ]
        : [
            ['disponivel', 'reservado'],
            ['reservado', 'vendido'],
          ],
    );
    assert.ok(history.every((h) => h.actor === 'owner@example.test'));
  }
  record(
    'Todos os campos originais e media preservados; histórico comercial contém transições e autor exatos',
  );

  // Add from the chosen source, explicitly review and save the new independent unit.
  await card()
    .getByRole('button', { name: 'Adicionar unidade', exact: true })
    .click();
  await page
    .locator('.unit-option')
    .filter({ hasText: 'QA unidade Alfa' })
    .click();
  assert.equal(
    await page.locator('#fields').getByLabel('Situação comercial').inputValue(),
    'por_confirmar',
  );
  assert.equal(
    await page.getByLabel('Referência interna', { exact: true }).inputValue(),
    '',
  );
  assert.equal(await page.locator('#photos img').count(), a.data.media.length);
  assert.equal(
    await page.getByLabel('Grupo de modelo (interno)').inputValue(),
    group,
  );
  await page
    .getByLabel('Nome da casa', { exact: true })
    .fill('QA unidade adicionada');
  await page
    .locator('#fields')
    .getByLabel('Situação comercial')
    .selectOption('disponivel');
  await page
    .locator('#form')
    .getByRole('button', { name: 'Guardar rascunho' })
    .click();
  await page.getByText('Alterações guardadas.', { exact: true }).waitFor();
  await ready();
  const added = (await json(await admin('dados'))).units.find(
    (u) => u.data.name_for_site === 'QA unidade adicionada',
  );
  ids.push(added.id);
  assert.equal(added.state, 'draft');
  assert.deepEqual(added.data.media, a.data.media);
  for (const key of [
    'dimensions_m',
    'equipment_summary',
    'bedrooms',
    'bathrooms',
    'typology',
    'brand',
    'model',
    'public_price_eur',
    'description_azmora',
  ])
    assert.deepEqual(added.data[key], a.data[key], key);
  assert.equal((await getUnit(a.id)).data.availability, 'vendido');
  assert.equal((await call('casas/' + added.slug + '/')).status, 404);
  assert.equal(
    (await json(await call('api/casas/'))).some((u) => u.id === added.slug),
    false,
  );
  await counts(1, 0, 2, 1);
  await action('Reservar');
  await counts(0, 1, 2, 1);
  assert.equal((await getUnit(added.id)).state, 'draft');
  assert.equal((await call('casas/' + added.slug + '/')).status, 404);
  await action('Cancelar reserva');
  await card()
    .getByRole('button', { name: 'Consultar unidades', exact: true })
    .click();
  await page
    .locator('.unit-option')
    .filter({ hasText: 'QA unidade adicionada' })
    .click();
  await page
    .locator('#form')
    .getByRole('button', { name: 'Publicar alterações' })
    .click();
  await page.getByText('Alterações guardadas.', { exact: true }).waitFor();
  await ready();
  await publicState(added, 'disponivel');
  record(
    'Adicionar por cópia, guardar rascunho, reservar sem o publicar, consultar e publicar; original intacto',
  );

  // Stale card in this tab versus a real concurrent save to the Worker.
  const current = await getUnit(added.id);
  await json(
    await admin('guardar', {
      id: current.id,
      revision: current.revision,
      state: current.state,
      data: {
        ...current.data,
        availability: 'reservado',
        description_azmora: 'Alteração concorrente preservada',
      },
    }),
  );
  await action('Reservar', null, 409);
  assert.match(
    await page.locator('#notice').innerText(),
    /ficha foi alterada/i,
  );
  await counts(0, 1, 2, 1);
  assert.equal(
    (await getUnit(added.id)).data.description_azmora,
    'Alteração concorrente preservada',
  );
  assert.equal((await getUnit(added.id)).revision, current.revision + 1);
  await action('Cancelar reserva');
  await counts(1, 0, 2, 1);
  record(
    'Concorrência: cartão desatualizado recebe 409, não sobrescreve, recarrega quantidades e permite nova ação',
  );
  const valid = await getUnit(added.id);
  assert.equal(
    (
      await admin('guardar', {
        id: valid.id,
        revision: valid.revision,
        state: 'live',
        data: { ...valid.data, availability: 'inválido' },
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await call('admin/guardar/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: valid.id,
          revision: valid.revision,
          state: 'live',
          data: valid.data,
        }),
      })
    ).status,
    403,
  );
  assert.equal((await getUnit(added.id)).revision, valid.revision);
  record(
    'Estado inválido (400) e gravação sem autenticação (403) rejeitados pelo servidor',
  );

  // Filters choose a model without turning totals into counts of just the matches.
  await page.locator('#commercial-filter').selectOption('vendido');
  await counts(1, 0, 2, 1);
  await page.locator('#search').fill('QA unidade Alfa');
  await counts(1, 0, 2, 1);
  await page
    .locator('#stats')
    .getByRole('button', { name: 'Disponíveis', exact: false })
    .click();
  assert.equal(await page.locator('#list').isVisible(), true);
  assert.equal(await page.locator('#search').inputValue(), '');
  const all = (await json(await admin('dados'))).units;
  assert.equal(
    await rows().count(),
    all.filter(
      (u) => u.state !== 'archived' && u.data.availability === 'disponivel',
    ).length,
  );
  for (const [label, state] of [
    ['Reservadas', 'reservado'],
    ['Vendidas', 'vendido'],
    ['Por confirmar / em breve', 'pending'],
    ['Stock comercial', 'stock'],
    ['Arquivadas', 'archived'],
    ['Publicadas', 'live'],
    ['Rascunhos', 'draft'],
  ]) {
    await page
      .locator('#stats')
      .getByRole('button', { name: new RegExp(label) })
      .click();
    const expected = all.filter((u) =>
      ['archived', 'live', 'draft'].includes(state)
        ? u.state === state
        : u.state !== 'archived' &&
          (state === 'pending'
            ? !['disponivel', 'reservado', 'vendido'].includes(
                u.data.availability,
              )
            : state === 'stock'
              ? ['disponivel', 'reservado'].includes(u.data.availability)
              : u.data.availability === state),
    );
    assert.equal(await rows().count(), expected.length, label);
  }
  await page.locator('#filter').selectOption('');
  await page.locator('#model-filter').selectOption(group);
  await page.locator('#type-filter').selectOption('T2');
  assert.equal(await rows().count(), 5);
  await page.locator('#search').fill('QA unidade Beta');
  assert.equal(await rows().count(), 1);
  await page.locator('#search').fill('inexistente-qa');
  assert.equal(await rows().count(), 0);
  await page.locator('#search').fill('');
  for (const sort of ['Nome', 'Alterações recentes', 'Preço crescente']) {
    await page.locator('#sort').selectOption({ label: sort });
    assert.equal(await rows().count(), 5);
    const matches = all.filter(
      (u) => u.data.inventory_group === group && u.data.typology === 'T2',
    );
    const expected = matches.sort((a, b) =>
      sort === 'Nome'
        ? a.data.name_for_site.localeCompare(b.data.name_for_site, 'pt')
        : sort === 'Alterações recentes'
          ? b.updated.localeCompare(a.updated)
          : (a.data.public_price_eur ?? Infinity) -
            (b.data.public_price_eur ?? Infinity),
    );
    assert.deepEqual(
      await rows()
        .locator('h3')
        .evaluateAll((nodes) => nodes.map((n) => n.firstChild.textContent)),
      expected.map((u) => u.data.name_for_site),
    );
  }
  await model();
  await card().getByRole('button', { name: 'Consultar unidades' }).click();
  await page
    .locator('.unit-option')
    .filter({ hasText: 'QA unidade arquivada' })
    .click();
  assert.equal(await page.locator('#ref').innerText(), 'Estado: Arquivada');
  await page.locator('#back').click();
  assert.equal(await page.locator('#groups').isVisible(), true);
  record(
    'Pesquisa, filtros combinados, todos os indicadores clicáveis, ordenações e ida/volta às fichas arquivadas',
  );

  const single = await create(
    'QA unidade sem grupo',
    'por_confirmar',
    'draft',
    { inventory_group: null, media: [], public_price_eur: null },
  );
  await reload();
  await model();
  const singleCard = page.locator('#groups .unit').filter({
    has: page.getByRole('heading', {
      name: single.data.name_for_site,
      exact: true,
    }),
  });
  assert.match(await singleCard.innerText(), /Sem grupo de modelo/);
  assert.match(await singleCard.innerText(), /Por confirmar \/ em breve: 1/);
  await singleCard.getByRole('button', { name: 'Consultar unidades' }).click();
  assert.equal(
    await page.locator('#unit-choice').evaluate((d) => d.open),
    false,
  );
  assert.equal(
    await page.getByLabel('Nome da casa', { exact: true }).inputValue(),
    single.data.name_for_site,
  );
  await page.locator('#back').click();
  await singleCard.getByRole('button', { name: 'Adicionar unidade' }).click();
  assert.equal(
    await page.locator('#unit-choice').evaluate((d) => d.open),
    false,
  );
  assert.equal(
    await page.getByLabel('Nome da casa', { exact: true }).inputValue(),
    single.data.name_for_site + ' (cópia)',
  );
  page.once('dialog', (d) => d.accept());
  await page.locator('#back').click();
  assert.equal((await getUnit(single.id)).revision, single.revision);
  record(
    'Unidade sem grupo permanece separada; consultar/adicionar sem seletor e abandonar cópia não grava',
  );

  // Real layout and image checks at all requested sizes, both views and both layouts.
  await reload();
  for (const width of [360, 390, 768, 1024, 1440, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    for (const view of ['units', 'models']) {
      await page.locator('#view-' + view).click();
      const container = page.locator(view === 'units' ? '#list' : '#groups');
      for (const layout of ['cards', 'list']) {
        await page.locator('#layout-' + layout).click();
        assert.equal(
          await container.evaluate((e) => e.classList.contains('cards-view')),
          layout === 'cards',
        );
        await container.locator('img').evaluateAll((images) =>
          Promise.all(
            images.map((i) => {
              i.loading = 'eager';
              return i.decode();
            }),
          ),
        );
        const problems = await container.evaluate((root) => {
          const issues = [];
          if (document.documentElement.scrollWidth > innerWidth)
            issues.push('horizontal overflow');
          for (const article of root.querySelectorAll('.unit')) {
            const r = article.getBoundingClientRect();
            if (article.scrollWidth > article.clientWidth + 1)
              issues.push('card overflow');
            const photo = article
              .querySelector('.inventory-photo')
              .getBoundingClientRect();
            if (Math.abs(photo.width / photo.height - 4 / 3) > 0.03)
              issues.push('photo ratio');
            for (const child of article.querySelectorAll('button,.unit-body')) {
              const c = child.getBoundingClientRect();
              if (
                c.left < r.left - 1 ||
                c.right > r.right + 1 ||
                c.bottom > r.bottom + 1
              )
                issues.push('content outside card');
            }
          }
          const rectangles = [...root.querySelectorAll('.unit')].map((e) =>
            e.getBoundingClientRect(),
          );
          if (root.classList.contains('cards-view'))
            for (const r of rectangles)
              for (const other of rectangles.filter(
                (o) => Math.abs(o.top - r.top) < 1,
              ))
                if (
                  Math.abs(other.height - r.height) > 1 ||
                  Math.abs(other.width - r.width) > 1
                )
                  issues.push('unequal cards in row');
          const stats = [...document.querySelectorAll('#stats button')].map(
            (e) => e.getBoundingClientRect(),
          );
          for (const r of stats)
            for (const other of stats.filter(
              (o) => Math.abs(o.top - r.top) < 1,
            ))
              if (Math.abs(other.height - r.height) > 1)
                issues.push('stats misaligned');
          return issues;
        });
        assert.deepEqual(problems, [], `${width} ${view} ${layout}`);
        await page.screenshot({
          path: `.qa/inventory-${width}-${view}-${layout}.png`,
          fullPage: true,
        });
        if (layout === 'cards') {
          await container.locator('.unit').first().scrollIntoViewIfNeeded();
          await page.screenshot({
            path: `.qa/inventory-${width}-${view}-preview.png`,
          });
        }
      }
    }
    await page.locator('#layout-cards').click();
    await card().getByRole('button', { name: 'Consultar unidades' }).click();
    await page.locator('#unit-choice[open]').waitFor();
    await page
      .locator('#unit-options img')
      .evaluateAll((imgs) => Promise.all(imgs.map((i) => i.decode())));
    assert.equal(
      await page
        .locator('#unit-choice')
        .evaluate(
          (e) =>
            e.scrollWidth <= e.clientWidth &&
            e.getBoundingClientRect().left >= 0 &&
            e.getBoundingClientRect().right <= innerWidth,
        ),
      true,
    );
    assert.equal(
      await page.locator('#unit-choice-cancel').evaluate((e) => {
        const r = e.getBoundingClientRect();
        return r.top >= 0 && r.bottom <= innerHeight;
      }),
      true,
      'Cancel remains visible without scrolling',
    );
    assert.deepEqual(
      await page.locator('.unit-option').evaluateAll((options) =>
        options.flatMap((option) => {
          const r = option.getBoundingClientRect();
          return [...option.children]
            .filter((child) => {
              const c = child.getBoundingClientRect();
              return (
                c.top < r.top - 1 ||
                c.bottom > r.bottom + 1 ||
                c.left < r.left - 1 ||
                c.right > r.right + 1
              );
            })
            .map(() => 'Selector content overlaps option');
        }),
      ),
      [],
      'Selector rows fit their content at ' + width,
    );
    await page.screenshot({ path: `.qa/inventory-${width}-selector.png` });
    await page.keyboard.press('Escape');
    record(
      `${width}px: unidades/modelos × cartões/lista, imagens 4:3, limites dos cartões, alinhamento dos indicadores, seletor e captura`,
    );
  }
  // Clean only this isolated test's new fixtures; never delete production records.
  for (const id of ids) {
    let u = await getUnit(id);
    if (u.state !== 'archived') {
      await json(
        await admin('guardar', {
          id,
          revision: u.revision,
          state: 'archived',
          data: u.data,
        }),
      );
      u = await getUnit(id);
    }
    await json(
      await admin('eliminar', { id, revision: u.revision, confirm: u.slug }),
    );
  }
  fs.writeFileSync(
    '.qa/inventory-admin-evidence.json',
    JSON.stringify(
      {
        tests: evidence,
        resolutions: [360, 390, 768, 1024, 1440, 1920],
        environment: 'Chrome + ephemeral Miniflare D1/R2; no production writes',
      },
      null,
      2,
    ),
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await reload();
}
