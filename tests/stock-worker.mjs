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
  .setExpirationTime('15m') // Local-only JWT covers the extended visual browser suite.
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
  // Deliberately mark only two local fixtures available; production is never touched.
  await db.prepare("UPDATE inventory SET data=json_set(data,'$.availability','disponivel','$.inventory_group','Modelo visual sintético') WHERE slug IN ('ohara-734-com-terraco-t2','irm-super-mercure-t2')").run();
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


  let all=(await json(await admin('dados'))).units;
  const source=all.find(u=>u.state==='live' && u.data.media.length);
  assert.equal((await call('admin/adicionar-unidades/',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'})).status,403);
  for (const quantity of [0,-1,1.5,51,'3']) assert.equal((await admin('adicionar-unidades',{id:source.id,revision:source.revision,quantity,availability:'por_confirmar'})).status,400);
  await json(await admin('adicionar-unidades',{id:source.id,revision:source.revision,quantity:3,availability:'por_confirmar'}));
  let after=(await json(await admin('dados'))).units;
  const added=after.filter(u=>!all.some(x=>x.id===u.id));
  assert.equal(added.length,3);
  for(const u of added){assert.equal(u.state,source.state);assert.equal(u.data.availability,'por_confirmar');assert.deepEqual(u.data.media,source.data.media);assert.equal(u.data.reference_azmora,null);}
  assert.equal(new Set(added.map(u=>u.data.inventory_group)).size,1);
  assert.equal((await admin('adicionar-unidades',{id:source.id,revision:source.revision,quantity:3,availability:'por_confirmar'})).status,409);
  assert.equal((await json(await admin('dados'))).units.length,all.length+3);
  const catalog=await json(await call('api/casas/'));
  assert.ok(added.every(u=>!catalog.some(h=>h.id===u.slug)));
  const photo=source.data.media[0].src;
  await db.prepare('INSERT OR IGNORE INTO uploads VALUES(?,?,?)').bind(photo,800,600).run();
  for(const path of new Set(source.data.media.flatMap(m=>[m.src,m.small,m.cover].filter(Boolean)))) await db.prepare('INSERT OR IGNORE INTO uploads VALUES(?,?,?)').bind(path,800,600).run();
  await json(await admin('guardar',{id:added[0].id,revision:added[0].revision,state:'live',data:{...added[0].data,availability:'disponivel'}}));
  const models=await json(await call('api/casas/'));
  assert.equal(models.length,catalog.length);
  assert.equal((await call('casas/'+added[0].slug+'/',{redirect:'manual'})).status,302);
  assert.ok(!JSON.stringify(models).includes('inventory_group'));
  const current=(await json(await admin('dados'))).units.find(u=>u.id===source.id);
  const before=(await json(await admin('dados'))).units.length;
  const racing=await Promise.all([1,2].map(()=>admin('adicionar-unidades',{id:current.id,revision:current.revision,quantity:2,availability:'por_confirmar'})));
  assert.deepEqual(racing.map(r=>r.status).sort(),[200,409]);
  assert.equal((await json(await admin('dados'))).units.length,before+2);
  const {chromium}=await import('playwright-core');
  const browser=await chromium.launch({channel:'chrome'});
  try {
    const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.route('**/*',async route=>{
      const r=route.request();if(!r.url().startsWith(origin))return route.abort();
      const assetPath=new URL(r.url()).pathname;
      if(assetPath.startsWith('/_astro/')){
        const file='dist-cloudflare/client'+assetPath;
        return route.fulfill({body:fs.readFileSync(file),contentType:assetPath.endsWith('.js')?'application/javascript':assetPath.endsWith('.css')?'text/css':'application/octet-stream'});
      }
      const response=await mf.dispatchFetch(r.url(),{method:r.method(),headers:{...r.headers(),'Cf-Access-Jwt-Assertion':token},body:r.postDataBuffer()||undefined});
      const headers=Object.fromEntries(response.headers);delete headers['content-encoding'];delete headers['transfer-encoding'];
      await route.fulfill({status:response.status,headers,body:Buffer.from(await response.arrayBuffer())});
    });
    await page.goto(base+'admin/');await page.locator('#list article').first().waitFor();
    for(const width of [360,390,768,1024,1440,1920]){
      await page.setViewportSize({width,height:900});
      for(const view of ['models','units']){
        await page.locator('#view-'+view).click();
        assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
      }
    }
    const row=page.locator('#list article').filter({hasText:added[1].data.name_for_site}).filter({hasText:'Publicada'}).last();
    page.once('dialog',d=>d.accept());await row.getByRole('button',{name:'Retirar do inventário'}).click();
    await page.getByText('Unidade arquivada. Pode eliminá-la no cartão ou recuperá-la na ficha.',{exact:true}).waitFor();
    const archived=page.locator('#list article').filter({hasText:added[1].data.name_for_site}).filter({hasText:'Arquivada'}).first();
    page.once('dialog',d=>d.accept('ELIMINAR'));await archived.getByRole('button',{name:'Eliminar cópia'}).click();
    await page.getByText('Unidade eliminada.',{exact:true}).waitFor();
    await page.locator('#view-models').click();
    const groupLabel=source.data.inventory_group || source.data.name_for_site;
    const card=page.locator('#groups article').filter({has:page.getByRole('heading',{name:groupLabel,exact:true})});
    await card.getByRole('button',{name:'Adicionar stock',exact:true}).click();
    await page.locator('.unit-option').first().click();
    await page.getByLabel('Quantidade de casas físicas a adicionar').fill('2');
    await page.getByLabel('Situação das novas unidades').selectOption('disponivel');
    const countBefore=(await json(await admin('dados'))).units.length;
    await page.getByRole('button',{name:'Adicionar ao stock',exact:true}).click();
    await page.getByText('Stock adicionado. Quantidades atualizadas. Mantém-se a publicação do modelo e um único anúncio público.',{exact:true}).waitFor();
    assert.equal((await json(await admin('dados'))).units.length,countBefore+2);
    assert.equal((await json(await call('api/casas/'))).length,catalog.length);
    // Real mixed-stock journey: sell one, reserve another, keep one available.
    const groupUnits=(await json(await admin('dados'))).units.filter(u=>u.state==='live' && u.data.inventory_group===groupLabel);
    assert.ok(groupUnits.length>=3);
    for(const [i,availability] of ['disponivel','reservado','vendido'].entries()){
      const u=groupUnits[i];
      await json(await admin('guardar',{id:u.id,revision:u.revision,state:'live',data:{...u.data,availability}}));
    }
    for(const category of ['disponivel','reservado','vendido']){
      const listed=await json(await call('api/casas/?estado='+category));
      const matches=listed.filter(h=>groupUnits.some(u=>u.slug===h.id));
      assert.equal(matches.length,1);assert.equal(matches[0].availability,category);
      assert.ok(!JSON.stringify(matches).includes('inventory_group'));
      assert.ok(!JSON.stringify(matches).includes('quantity'));
      await page.goto(base+'casas/?estado='+category);
      await page.locator('[data-view="grid"][aria-pressed="true"]').waitFor();
      const cards=page.locator('#results [data-card="'+matches[0].id+'"]');
      assert.equal(await cards.count(),1);assert.ok(await cards.isVisible());
      await page.locator('[name=q]').fill('ZZZ_MODELO_INEXISTENTE');
      await cards.waitFor({state:'hidden'});
      await page.locator('[name=q]').fill('');
      await cards.waitFor({state:'visible'});
      const embedded=JSON.parse(await page.locator('#catalog-data').textContent());
      assert.equal(embedded.find(h=>h.id===matches[0].id).availability,category);
    }
    const sitemap=await (await call('sitemap.xml')).text();
    assert.equal(sitemap.split('/casas/'+groupUnits[0].slug+'/').length-1,1);
    const homepage=await (await call('')).text();
    const sales=homepage.split('<h2>Casas vendidas</h2>')[1]?.split('</section>')[0];
    assert.ok(sales && sales.includes(groupUnits[0].slug));
    await page.goto(base+'admin/');await page.locator('#list article').first().waitFor();
    await page.locator('#list article').filter({hasText:source.data.name_for_site}).first().getByRole('button',{name:'Abrir ficha',exact:true}).click();
    page.once('dialog',d=>d.dismiss());await page.getByRole('button',{name:'Duplicar ficha',exact:true}).click();
    assert.equal(await page.locator('#heading').textContent(),'Editar casa');
    page.once('dialog',d=>d.accept());await page.getByRole('button',{name:'Duplicar ficha',exact:true}).click();
    assert.equal(await page.getByLabel('Grupo de modelo (interno)').inputValue(),'');
    await page.getByLabel('Nome da casa',{exact:true}).fill('Casa independente QA');
    await page.getByLabel('Marca',{exact:true}).fill('Outra marca');
    await page.getByLabel('Modelo',{exact:true}).fill('Outro modelo');
    await page.locator('#fields').getByLabel('Situação comercial').selectOption('disponivel');
    await page.getByRole('button',{name:'Publicar alterações',exact:true}).click();
    await page.getByText('Alterações guardadas.',{exact:true}).waitFor();
    const independent=(await json(await admin('dados'))).units.find(u=>u.data.name_for_site==='Casa independente QA');
    assert.ok(!independent.data.inventory_group);
    assert.ok((await json(await call('api/casas/'))).some(h=>h.id===independent.slug));
    assert.equal((await call('casas/'+independent.slug+'/')).status,200);
    const original=(await json(await admin('dados'))).units.find(u=>u.id===source.id);
    const forbidden=await admin('guardar',{state:'draft',source:{id:original.id,revision:original.revision,mode:'same-model'},data:{...original.data,brand:'Different'}});
    assert.equal(forbidden.status,400);
    await page.getByRole('button',{name:'Adicionar casa',exact:true}).click();
    assert.equal(await page.getByLabel('Nome da casa',{exact:true}).inputValue(),'');
    assert.match(await page.getByLabel('Nome da casa',{exact:true}).getAttribute('placeholder'),/Ex\.:/);
    assert.deepEqual(errors,[]);
  } finally {await browser.close();}
  console.log('OK: stock por quantidade, autenticação, validação, concorrência, agrupamento público, privacidade, cartões em seis larguras e remoção/eliminação pelo browser.');
} finally {await mf.dispose();}
