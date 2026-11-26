// Full rehearsal against a private, persistent Miniflare D1/R2 restore. No production network.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { Miniflare, convertV4MiniflareOptions, Log, LogLevel } from 'miniflare';
import { build } from 'esbuild';
import { generateKeyPair, exportJWK, SignJWT } from 'jose';
import { chromium } from 'playwright-core';

const [backupArg, outArg, rollbackRef = 'a6af0e2'] = process.argv.slice(2);
let stage = 'Preparação',
  mf,
  browser;
const check = (ok, message) => {
  if (!ok) { const error=Error(message); error.safeRehearsal=true; throw error; }
};
const canon = (v) =>
  JSON.stringify(v, (_, x) =>
    x && typeof x === 'object' && !Array.isArray(x) && !(x instanceof Date)
      ? Object.fromEntries(
          Object.entries(x).sort(([a], [b]) => a.localeCompare(b)),
        )
      : x,
  );
const hash = (b) => crypto.createHash('sha256').update(b).digest('hex');
const quote = (n) => '"' + n.replaceAll('"', '""') + '"';
try {
  check(backupArg && outArg, 'Argumentos em falta');
  const backup = path.resolve(backupArg),
    out = path.resolve(outArg);
  check(!fs.existsSync(out), 'O destino deve ser novo');
  check(
    !out.startsWith(process.cwd() + path.sep),
    'O restauro deve ficar fora do repositório',
  );
  const prep = spawnSync(
    'python',
    [
      'scripts/restore-rehearsal.py',
      backup,
      out,
      'migrations/0006_commercial_history.sql',
    ],
    { encoding: 'utf8', windowsHide: true },
  );
  check(prep.status === 0, 'Preparação privada falhou');
  const input = JSON.parse(
    fs.readFileSync(path.join(out, 'restore-input.json'), 'utf8'),
  );
  const summary = JSON.parse(
    fs.readFileSync(path.join(out, 'restore-summary.json'), 'utf8'),
  );
  const originalManifest = hash(
    fs.readFileSync(path.join(backup, 'manifest.json')),
  );
  const metadata = JSON.parse(
    fs
      .readFileSync(path.join(backup, 'r2-metadata.json'), 'utf8')
      .replace(/^\uFEFF/, ''),
  );
  const origin = 'https://azmora-restore.invalid',
    issuer = 'https://restore-test.cloudflareaccess.com';
  const { privateKey, publicKey } = await generateKeyPair('RS256', {
    extractable: true,
  });
  const jwk = { ...(await exportJWK(publicKey)), kid: 'restore', alg: 'RS256' };
  const token = await new SignJWT({
    type: 'app',
    email: 'restore@example.test',
  })
    .setSubject('restore')
    .setIssuedAt()
    .setExpirationTime('1h')
    .setIssuer(issuer)
    .setAudience('isolated')
    .setProtectedHeader({ kid: 'restore', alg: 'RS256' })
    .sign(privateKey);
  const bundle = await build({
    entryPoints: ['dist-cloudflare/client/_worker.js/index.js'],
    bundle: true,
    format: 'esm',
    platform: 'neutral',
    external: ['cloudflare:*', 'node:*'],
    write: false,
    logLevel: 'silent',
  });
  const currentCode = bundle.outputFiles[0].text;
  // The only application-code change since the rollback ref is the ADMIN HTML.
  const diff = spawnSync(
    'git',
    ['diff', rollbackRef, 'HEAD', '--name-only', '--', 'src', 'cloudflare'],
    { encoding: 'utf8', windowsHide: true },
  );
  check(
    diff.status === 0 && diff.stdout.trim() === 'cloudflare/panel.html',
    'Versão anterior requer build separado: código além do painel mudou',
  );
  const oldPanel = spawnSync(
    'git',
    ['show', rollbackRef + ':cloudflare/panel.html'],
    { encoding: 'utf8', windowsHide: true },
  );
  check(oldPanel.status === 0, 'Painel anterior indisponível');
  const oldBundle = await build({
    stdin: {
      contents:
        "import {ALL} from './cloudflare/admin.mjs';export default {fetch(request){return ALL({request,params:{action:new URL(request.url).pathname.replace(/^\\/admin\\/?/,'')}})}}",
      resolveDir: process.cwd(),
      sourcefile: 'restore-previous-entry.mjs',
    },
    bundle: true,
    format: 'esm',
    platform: 'neutral',
    external: ['cloudflare:*', 'node:*'],
    write: false,
    logLevel: 'silent',
    plugins: [
      {
        name: 'previous-raw',
        setup(b) {
          b.onResolve({ filter: /\?raw$/ }, (args) => ({
            path: path.resolve(args.resolveDir, args.path.slice(0, -4)),
            namespace: 'raw',
          }));
          b.onLoad({ filter: /.*/, namespace: 'raw' }, (args) => ({
            contents: args.path.endsWith('panel.html')
              ? oldPanel.stdout
              : fs.readFileSync(args.path, 'utf8'),
            loader: 'text',
          }));
        },
      },
    ],
  });
  let externalRequests = 0;
  const opts = (code) =>
    convertV4MiniflareOptions({
      modules: [{ type: 'ESModule', path: 'index.mjs', contents: code }],
      compatibilityDate: '2025-11-01',
      compatibilityFlags: ['nodejs_compat', 'disable_nodejs_process_v2'],
      d1Databases: ['DB'],
      r2Buckets: ['PHOTOS'],
      resourcePersistencePath: path.join(out, 'miniflare-storage'),
      isolatedResourcePersistencePath: path.join(out, 'miniflare-storage'),
      log: new Log(LogLevel.NONE),
      bindings: {
        ADMIN_ORIGIN: origin,
        ACCESS_AUD: 'isolated',
        ACCESS_ISSUER: issuer,
        ADMIN_EMAILS: 'restore@example.test',
        SITE_URL: origin,
        TURNSTILE_SITE_KEY: 'fixture',
        TURNSTILE_SECRET_KEY: 'fixture',
        RESEND_API_KEY: 'fixture',
        CONTACT_FROM_EMAIL: 'restore@example.test',
        CONTACT_TO_EMAIL: 'sink@example.test',
      },
      serviceBindings: { ASSETS: () => new Response(null, { status: 404 }) },
      outboundService: (req) => {
        if (new URL(req.url).origin === issuer)
          return Response.json({ keys: [jwk] });
        externalRequests++;
        return new Response(null, { status: 403 });
      },
    });
  mf = new Miniflare(opts(currentCode));
  let db = await mf.getD1Database('DB');
  let bucket = await mf.getR2Bucket('PHOTOS');
  stage = 'Restauro integral D1 no Worker local';
  for (const entry of input.schema.filter((x) => x.type === 'table')) {
    stage='Restauro D1: criar tabela '+entry.name;
    await db.prepare(entry.sql).run();
  }
  for (const [name, table] of Object.entries(input.tables)) {
    stage='Restauro D1: importar tabela '+name;
    if (name === 'sqlite_sequence')
      await db.prepare('DELETE FROM sqlite_sequence').run();
    for (const row of table.rows)
      await db
        .prepare(
          `INSERT INTO ${quote(name)} (${table.columns.map(quote).join(',')}) VALUES (${row.map(() => '?').join(',')})`,
        )
        .bind(...row)
        .run();
  }
  for (const entry of input.schema.filter((x) => x.type !== 'table')) {
    stage='Restauro D1: criar '+entry.type+' '+entry.name;
    await db.prepare(entry.sql).run();
  }
  stage='Comparação integral das linhas restauradas';
  const snapshot = async () => {
    const result = {};
    for (const [name, t] of Object.entries(input.tables)) {
      const r = await db
        .prepare(`SELECT ${t.columns.map(quote).join(',')} FROM ${quote(name)}`)
        .all();
      result[name] = r.results
        .map((row) => t.columns.map((c) => row[c]))
        .map(canon)
        .sort();
    }
    return result;
  };
  const source = Object.fromEntries(
    Object.entries(input.tables).map(([name, t]) => [
      name,
      t.rows.map(canon).sort(),
    ]),
  );
  check(
    canon(await snapshot()) === canon(source),
    'Dados restaurados divergem da origem',
  );
  const integrity = async () => {
    const audit = spawnSync('python', ['-c', `import sqlite3,pathlib,sys
found=False
for f in pathlib.Path(sys.argv[1]).rglob('*.sqlite'):
 c=sqlite3.connect('file:'+f.as_posix()+'?mode=ro',uri=True)
 if c.execute("SELECT count(*) FROM sqlite_master WHERE name='inventory'").fetchone()[0]:
  found=True
  assert c.execute('PRAGMA integrity_check').fetchone()[0]=='ok'
  assert not c.execute('PRAGMA foreign_key_check').fetchall()
 c.close()
assert found
`,path.join(out,'miniflare-storage')], {encoding:'utf8',windowsHide:true});
    check(audit.status===0,'Integridade SQLite persistida falhou');
  };
  await integrity();
  stage = 'Restauro integral R2';
  for (const item of metadata) {
    const data = fs.readFileSync(
      path.join(backup, 'photos', ...item.key.split('/')),
    );
    check(data.length === item.size, 'Tamanho fonte R2 divergente');
    const http = { ...item.http_metadata };
    if (http.cacheExpiry) http.cacheExpiry = new Date(http.cacheExpiry);
    await bucket.put(item.key, data, {
      httpMetadata: http,
      customMetadata: item.custom_metadata || {},
      storageClass: item.storage_class || 'Standard',
    });
  }
  const verifyR2 = async () => {
    let cursor,
      count = 0;
    do {
      const page = await bucket.list({ limit: 1000, cursor });
      count += page.objects.length;
      cursor = page.truncated ? page.cursor : undefined;
    } while (cursor);
    check(count === metadata.length, 'Contagem R2 divergente');
    for (const item of metadata) {
      const stored = await bucket.get(item.key);
      check(
        stored &&
          hash(Buffer.from(await stored.arrayBuffer())) ===
            hash(
              fs.readFileSync(
                path.join(backup, 'photos', ...item.key.split('/')),
              ),
            ),
        'Bytes R2 divergentes',
      );
      check(
        canon(stored.httpMetadata) === canon(item.http_metadata || {}),
        'Metadados HTTP divergentes',
      );
      check(
        canon(stored.customMetadata) === canon(item.custom_metadata || {}),
        'Metadados personalizados divergentes',
      );
      if (stored.storageClass) check(stored.storageClass === (item.storage_class || 'Standard'), 'Classe R2 divergente');
      else { check((item.storage_class || 'Standard') === 'Standard','Classe R2 não suportada pelo simulador'); summary.r2_storage_class_not_exposed_by_emulator=true; }

    }
  };
  await verifyR2();
  fs.copyFileSync(path.join(backup,'r2-metadata.json'),path.join(out,'r2-source-metadata.json'));
  summary.r2_restored_and_verified = metadata.length;
  summary.r2_metadata_preserved = true;
  console.log(
    'OK · Restauro D1/R2 completo; todas as linhas e todos os bytes/metadados verificados.',
  );
  const request = (route, body) =>
    mf.dispatchFetch(origin + '/' + route, {
      method: body ? 'POST' : 'GET',
      headers: {
        Origin: origin,
        'Cf-Access-Jwt-Assertion': token,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  const json = async (r) => {
    check(r.status === 200, 'Endpoint devolveu HTTP '+r.status);
    return r.json();
  };
  stage = 'Migração 0006 exclusivamente na D1 restaurada';
  const before = await snapshot();
  const sql = fs.readFileSync('migrations/0006_commercial_history.sql', 'utf8');
  const statements = sql.match(
    /CREATE TRIGGER[\s\S]*?END;|(?:CREATE TABLE|CREATE INDEX)[\s\S]*?;/g,
  );
  check(statements?.length === 4, 'Formato de migração inesperado');
  await db.batch(statements.map((s) => db.prepare(s)));
  await integrity();
  check(
    canon(before) === canon(await snapshot()),
    '0006 alterou registos existentes',
  );
  check(
    (
      await db
        .prepare('SELECT count(*) n FROM inventory_commercial_history')
        .first()
    ).n === 0,
    '0006 criou datas retroativas',
  );
  await db
    .prepare('INSERT INTO d1_migrations(name) VALUES (?)')
    .bind('0006_commercial_history.sql')
    .run();
  summary.miniflare_migration_preserved_all_original_rows = true;
  fs.writeFileSync(
    path.join(out, 'before-operations-digests.json'),
    JSON.stringify(
      Object.fromEntries(
        Object.entries(before).map(([name, rows]) => [
          name,
          { rows: rows.length, sha256: hash(canon(rows)) },
        ]),
      ),
      null,
      2,
    ),
  );
  const data = await json(await request('admin/dados/'));
  check(data.units.length === 17, 'Número inventário inesperado');
  const initialUnits = data.units;
  await json(await request('admin/contactos/'));
  let config = await json(await request('admin/configuracoes/'));
  const initialConfig = structuredClone(config);
  const publicCatalog = await json(await request('api/casas/'));
  check(
    publicCatalog.length ===
      initialUnits.filter((u) => u.state === 'live').length,
    'Publicação divergente',
  );
  for (const u of initialUnits) {
    const found = publicCatalog.find((x) => x.id === u.slug);
    check(
      !!found === (u.state === 'live'),
      'Privacidade/publicação divergente',
    );
    if (found)
      check(
        found.availability === u.data.availability,
        'Estado público divergente',
      );
  }
  summary.publication_states_verified = true;
  const readBaseline = await snapshot();
  stage = 'Browser ADMIN atual restaurado';
  browser = await chromium.launch({ channel: 'chrome' });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  page.setDefaultTimeout(15000);
  let browserErrors = 0;
  page.on('pageerror', () => browserErrors++);
  await page.route('**/*', async (route) => {
    try {
      const req = route.request(),
        url = new URL(req.url());
      if (url.origin !== origin) return route.abort();
      if (url.pathname.startsWith('/_astro/')) {
        const file = path.resolve('dist-cloudflare/client' + url.pathname);
        if (!file.startsWith(path.resolve('dist-cloudflare/client') + path.sep))
          return route.abort();
        return route.fulfill({
          body: fs.readFileSync(file),
          contentType: file.endsWith('.js')
            ? 'application/javascript'
            : file.endsWith('.css')
              ? 'text/css'
              : 'application/octet-stream',
        });
      }
      const r = await mf.dispatchFetch(req.url(), {
        method: req.method(),
        headers: { ...req.headers(), 'Cf-Access-Jwt-Assertion': token },
        body: req.postDataBuffer() || undefined,
      });
      const headers = Object.fromEntries(r.headers);
      delete headers['content-encoding'];
      delete headers['transfer-encoding'];
      await route.fulfill({
        status: r.status,
        headers,
        body: Buffer.from(await r.arrayBuffer()),
      });
    } catch {
      return route.abort();
    }
  });
  const ready = async () =>
    page.waitForFunction(
      () =>
        document.querySelector('#list .unit') &&
        !document.querySelector('#dash').inert,
    );
  await page.goto(origin + '/admin/');
  await ready();
  check(
    (await page.locator('#list .unit').count()) === initialUnits.length,
    'Cartões em falta',
  );
  await page.locator('#list img').evaluateAll((imgs) =>
    Promise.all(
      imgs.map((i) => {
        i.loading = 'eager';
        return i.decode();
      }),
    ),
  );
  await page.locator('#view-models').click();
  check((await page.locator('#groups .unit').count()) > 0, 'Modelos em falta');
  for (const width of [360, 390, 768, 1024, 1440, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    for (const view of ['units', 'models']) {
      await page.locator('#view-' + view).click();
      for (const layout of ['cards', 'list']) {
        await page.locator('#layout-' + layout).click();
        check(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
          'Overflow no inventário restaurado',
        );
      }
    }
  }
  // Decode every backed-up photograph through the protected endpoint, without screenshots or logging names.
  await page.evaluate(
    async (keys) => {
      for (const key of keys) {
        const img = new Image();
        img.src = '/admin/foto/?key=' + encodeURIComponent(key);
        await img.decode();
      }
    },
    metadata.map((x) => x.key),
  );
  await page.locator('#show-contacts').click();
  await page.locator('#contact-list article').first().waitFor();
  await page
    .locator('#contact-list article')
    .first()
    .getByRole('button')
    .first()
    .click();
  await page.locator('#contact-detail[open]').waitFor();
  await page.locator('#contact-close').click();
  await page.locator('#show-settings').click();
  await page.waitForFunction(
    () => !document.querySelector('#settings-form').inert,
  );
  check(
    await page.locator('#settings-form').isVisible(),
    'Configurações indisponíveis',
  );
  // Read-only browsing must leave all original rows unchanged, apart from migration bookkeeping.
  const unchanged = await snapshot();
  check(canon(unchanged) === canon(readBaseline), 'Leitura ADMIN alterou dados');
  summary.browser_current = {
    viewports: [360, 390, 768, 1024, 1440, 1920],
    images_decoded: metadata.length,
    crm_opened: true,
    settings_opened: true,
  };
  console.log('OK · Browser: inventário, modelos, seis resoluções, 146 imagens, CRM e configurações; leituras sem mudanças.');
  stage = 'Operações ADMIN na cópia restaurada';
  await page.locator('#show-inventory').click();
  await page.locator('#view-units').click();
  const selected = initialUnits.find(
    (u) => u.state === 'live' && u.data.availability === 'disponivel',
  );
  check(selected, 'Sem unidade disponível para ensaio');
  const row = page.locator('#list .unit').filter({hasText:selected.data.name_for_site});
  check(await row.count()===1,'A ficha de ensaio não é única');
  await row.getByRole('button', { name: 'Abrir ficha' }).click();
  await page
    .locator('#fields')
    .getByLabel('Situação comercial')
    .selectOption('reservado');
  await page
    .locator('#form')
    .getByRole('button', { name: 'Publicar alterações' })
    .click();
  await page.getByText('Alterações guardadas.', { exact: true }).waitFor();
  await ready();
  let saved = (await json(await request('admin/dados/'))).units.find(
    (u) => u.id === selected.id,
  );
  check(
    saved.data.availability === 'reservado',
    'Reserva pelo browser não persistiu',
  );
  check(
    (await json(await request('api/casas/'))).find(
      (u) => u.id === selected.slug,
    ).availability === 'reservado',
    'Reserva pública não atualizada',
  );
  let history = (
    await db
      .prepare(
        'SELECT * FROM inventory_commercial_history WHERE inventory_id=?',
      )
      .bind(selected.id)
      .all()
  ).results;
  check(
    history.length === 1 && history[0].new_state === 'reservado',
    'Histórico comercial não registado',
  );
  const synthetic = await json(
    await request('admin/guardar/', {
      state: 'draft',
      data: {
        ...saved.data,
        name_for_site: 'ENSAIO ISOLADO — não publicar',
        availability: 'por_confirmar',
        reference_azmora: 'LOCAL-QA',
        featured: false,
      },
    }),
  );
  check(
    !(await json(await request('api/casas/'))).some(
      (u) => u.name_for_site === 'ENSAIO ISOLADO — não publicar',
    ),
    'Rascunho exposto',
  );
  config = await json(await request('admin/configuracoes/'));
  const contacts = {
    ...config.defaults,
    ...config.draft.contacts,
    openingHours: 'HORÁRIO EXCLUSIVO DE ENSAIO',
  };
  await json(
    await request('admin/configuracoes-guardar/', {
      revision: config.revision,
      contacts,
      content: config.draft.content || config.contentDefaults,
    }),
  );
  check(
    !(await (await request('contactos/')).text()).includes(
      contacts.openingHours,
    ),
    'Rascunho configurações exposto',
  );
  config = await json(await request('admin/configuracoes/'));
  await json(
    await request('admin/configuracoes-publicar/', {
      revision: config.revision,
    }),
  );
  check(
    (await (await request('contactos/')).text()).includes(
      contacts.openingHours,
    ),
    'Configurações publicadas não refletidas',
  );
  const crmRow = await db
    .prepare('SELECT id,revision,status FROM contact_requests LIMIT 1')
    .first();
  await json(
    await request('admin/contactos-guardar/', {
      ...crmRow,
      notes: 'NOTA DE ENSAIO LOCAL; NÃO CONTACTAR CLIENTE',
    }),
  );
  check(
    (await db.prepare('SELECT count(*) n FROM contact_history').first()).n >
      source.contact_history.length,
    'Histórico CRM não aumentou',
  );
  summary.current_write_cycle = {
    reservation: true,
    private_draft: true,
    settings_publish: true,
    crm_history: true,
  };
  check(browserErrors === 0, 'Erro JavaScript no ADMIN');
  await browser.close();
  browser = null;
  const postWrites = await snapshot();
  const historyBeforeRollback = (await db.prepare('SELECT * FROM inventory_commercial_history ORDER BY seq').all()).results;
  stage = 'Rollback de código mantendo dados posteriores';
  await mf.dispose();
  mf = new Miniflare(opts(oldBundle.outputFiles[0].text));
  db = await mf.getD1Database('DB');
  bucket = await mf.getR2Bucket('PHOTOS');
  check(
    canon(await snapshot()) === canon(postWrites),
    'Rollback perdeu dados posteriores',
  );
  await integrity();
  check(canon((await db.prepare('SELECT * FROM inventory_commercial_history ORDER BY seq').all()).results) === canon(historyBeforeRollback), 'Rollback perdeu histórico comercial');
  const oldData = await json(await request('admin/dados/'));
  check(
    oldData.units.some((u) => u.id === synthetic.id),
    'Versão anterior não vê nova unidade',
  );
  const oldConfig = await json(await request('admin/configuracoes/'));
  check(
    oldConfig.published.contacts.openingHours === contacts.openingHours,
    'Versão anterior perdeu configuração',
  );
  await json(await request('admin/contactos/'));
  const oldSaved = oldData.units.find((u) => u.id === selected.id);
  await json(
    await request('admin/guardar/', {
      id: oldSaved.id,
      revision: oldSaved.revision,
      state: oldSaved.state,
      data: { ...oldSaved.data, availability: 'disponivel' },
    }),
  );
  check(
    (
      await request('admin/guardar/', {
        id: oldSaved.id,
        revision: oldSaved.revision,
        state: oldSaved.state,
        data: oldSaved.data,
      })
    ).status === 409,
    'Concorrência anterior não funciona',
  );
  history = (
    await db
      .prepare(
        'SELECT * FROM inventory_commercial_history WHERE inventory_id=? ORDER BY seq',
      )
      .bind(selected.id)
      .all()
  ).results;
  check(
    history.length === 2 && history[1].new_state === 'disponivel',
    'Gatilho 0006 não funciona com versão anterior',
  );
  browser = await chromium.launch({ channel: 'chrome' });
  const oldPage = await browser.newPage();
  await oldPage.route('**/*', async (route) => {
    const req = route.request();
    if (new URL(req.url()).origin !== origin) return route.abort();
    const r = await mf.dispatchFetch(req.url(), {
      headers: { ...req.headers(), 'Cf-Access-Jwt-Assertion': token },
    });
    await route.fulfill({
      status: r.status,
      headers: Object.fromEntries(r.headers),
      body: Buffer.from(await r.arrayBuffer()),
    });
  });
  await oldPage.goto(origin + '/admin/');
  await oldPage.locator('#list .unit').first().waitFor();
  check(
    (await oldPage.locator('#list .unit').count()) === 18,
    'ADMIN anterior não abre inventário restaurado',
  );
  await oldPage.locator('#show-settings').click();
  await oldPage.waitForFunction(
    () => !document.querySelector('#settings-form').inert,
  );
  await oldPage.locator('#show-contacts').click();
  await oldPage.locator('#contact-list article').first().waitFor();
  await browser.close();
  browser = null;
  summary.rollback = {
    reference: rollbackRef,
    all_post_migration_writes_preserved: true,
    old_admin_read_write: true,
    old_browser_inventory_settings_crm: true,
    commercial_trigger_works: true,
    stale_write_rejected: true,
    public_application_code_unchanged: true,
  };
  stage = 'Regresso ao código novo e verificação final';
  await mf.dispose();
  mf = new Miniflare(opts(currentCode));
  db = await mf.getD1Database('DB');
  bucket = await mf.getR2Bucket('PHOTOS');
  const finalData = await json(await request('admin/dados/'));
  check(
    finalData.units.some((u) => u.id === synthetic.id),
    'Regresso perdeu unidade nova',
  );
  config = await json(await request('admin/configuracoes/'));
  await json(
    await request('admin/configuracoes-recuperar/', {
      revision: config.revision,
      historyId: initialConfig.history[0].id,
    }),
  );
  config = await json(await request('admin/configuracoes/'));
  check(
    canon(config.published) === canon(initialConfig.published),
    'Recuperação configurações diverge',
  );
  await integrity();
  await verifyR2();
  check(externalRequests === 0, 'Pedido externo inesperado');
  const verify = spawnSync(
    'python',
    ['scripts/backup_manual_verify.py', backup],
    { encoding: 'utf8', windowsHide: true },
  );
  check(
    verify.status === 0 &&
      hash(fs.readFileSync(path.join(backup, 'manifest.json'))) ===
        originalManifest,
    'Backup original alterado',
  );
  summary.original_backup_unchanged = true;
  summary.external_service_calls = 0;
  summary.integrity_final = 'ok';
  summary.settings_restore_passed = true;
  summary.r2_final_unchanged = true;
  summary.result = 'PASS';
  fs.writeFileSync(
    path.join(out, 'restore-summary.json'),
    JSON.stringify(summary, null, 2),
  );
  console.log(
    'OK · 0006 sem alterações retroativas; ADMIN atual e anterior, concorrência, CRM, configurações, fotos e rollback validados.',
  );
  console.log(
    'OK · Backup original inalterado; nenhum pedido externo ou escrita em produção.',
  );
} catch (error) {
  if(error.safeRehearsal) console.error('Diagnóstico: '+error.message);
  const known = String(error?.message||'').match(/not authorized|already exists|UNIQUE constraint failed|FOREIGN KEY constraint failed|Dados restaurados divergem da origem|no such table|SQLITE_AUTH/i)?.[0];
  if(known) console.error('Diagnóstico seguro: '+known);
  console.error('FALHA · ' + stage + '; detalhes privados omitidos.');
  process.exitCode = 1;
} finally {
  if (browser) await browser.close();
  if (mf) await mf.dispose();
}
