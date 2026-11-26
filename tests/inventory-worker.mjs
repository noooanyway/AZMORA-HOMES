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

  // Draft remains private until publish; restores original public defaults.
  assert.equal((await call('admin/configuracoes/')).status,403);
  const cfg = await json(await admin('configuracoes'));
  assert.equal(cfg.revision,0);
  const c = { ...cfg.defaults, phone:'+351 911 222 333', secondPhone:'+351 911 444 555', whatsapp:'351911222333', email:'loja@example.test', openingHours:'Terça a sábado', languages:'Português e inglês', timezone:'Atlantic/Azores', social:{instagram:'https://www.instagram.com/teste/',facebook:'https://www.facebook.com/teste'} };
  const content=structuredClone(cfg.contentDefaults);
  content.home.title='Título inicial sintético';content.home.featured=['ohara-734-com-terraco-t2'];
  content.about.title='Sobre sintético';content.about.experience='Experiência sintética';
  content.faq.unshift({question:'Pergunta sintética?',answer:'Resposta sintética',visible:true});
  content.faq.push({question:'Pergunta oculta?',answer:'Resposta oculta',visible:false});
  content.commercial.transport='Transporte sintético';
  content.notice={title:'Aviso sintético',message:'Mensagem sintética',active:true,start:'2020-01-01',end:'',url:'/contactos/'};
  content.seo.home={title:'SEO sintético',description:'Descrição SEO sintética',socialTitle:'Partilha sintética',socialDescription:'Resumo de partilha sintético'};
  assert.equal((await admin('configuracoes-guardar',{revision:0,contacts:c,content})).status,200);
  let htmlBefore = await (await call('contactos/')).text();
  assert.doesNotMatch(htmlBefore,/\+351 911 222 333/);
  assert.doesNotMatch(await (await call('')).text(),/Título inicial sintético/);
  assert.equal((await admin('configuracoes-publicar',{revision:0})).status,409);
  assert.equal((await admin('configuracoes-publicar',{revision:1})).status,200);
  let htmlAfter = await (await call('contactos/')).text();
  assert.match(htmlAfter,/\+351 911 222 333/);
  assert.match(htmlAfter,/tel:\+351911222333/);
  const homepage=await (await call('')).text();
  for(const value of ['Título inicial sintético','Pergunta sintética?','Transporte sintético','Aviso sintético','SEO sintético','Partilha sintética']) assert.ok(homepage.includes(value),value);
  assert.ok(homepage.indexOf('Pergunta sintética?') < homepage.indexOf('Como confirmo o preço'));
  assert.doesNotMatch(homepage,/Pergunta oculta\?/);
  assert.match(await (await call('casas-moveis-acores/')).text(), /Transporte sintético/);
  const oldUnit=await db.prepare("SELECT state FROM inventory WHERE slug=?").bind('ohara-734-com-terraco-t2').first();
  await db.prepare("UPDATE inventory SET state='archived' WHERE slug=?").bind('ohara-734-com-terraco-t2').run();
  assert.doesNotMatch(await (await call('')).text(), /casas\/ohara-734-com-terraco-t2\//);
  await db.prepare('UPDATE inventory SET state=? WHERE slug=?').bind(oldUnit.state,'ohara-734-com-terraco-t2').run();
  const about=await (await call('sobre/')).text();assert.match(about,/Sobre sintético/);assert.match(about,/Experiência sintética/);
  assert.equal((await admin('configuracoes-guardar',{revision:2,contacts:c,content:{...content,notice:{...content.notice,url:'javascript:alert(1)'}}})).status,400);
  for (const text of ['911 444 555','loja@example.test','Terça a sábado','Português e inglês','instagram.com/teste','facebook.com/teste']) assert.ok(htmlAfter.includes(text),text);
  assert.equal((await admin('configuracoes-guardar',{revision:2,contacts:{...c,email:'<script>'}})).status,400);
  const hiddenContacts={...c,visibility:{phone:false,secondPhone:true,whatsapp:false,email:true,instagram:false,facebook:true,openingHours:true,languages:true}};
  assert.equal((await admin('configuracoes-guardar',{revision:2,contacts:hiddenContacts,content})).status,200);
  assert.equal((await admin('configuracoes-publicar',{revision:3})).status,200);
  const hiddenHtml=await (await call('contactos/')).text();
  assert.doesNotMatch(hiddenHtml,/tel:\+351911222333/);assert.doesNotMatch(hiddenHtml,/instagram.com\/teste/);assert.doesNotMatch(hiddenHtml,/wa.me\/351911222333/);
  const now = await json(await admin('configuracoes'));
  assert.equal((await admin('configuracoes-recuperar',{revision:now.revision,historyId:cfg.history[0].id})).status,200);
  const htmlRestore = await (await call('contactos/')).text();
  assert.doesNotMatch(htmlRestore,/\+351 911 222 333/);
  assert.doesNotMatch(await (await call('')).text(),/Título inicial sintético/);
  // Each institutional route receives only the published SEO values.
  const seoRoutes={home:'',about:'sobre/',contacts:'contactos/',acores:'casas-moveis-acores/',madeira:'casas-moveis-madeira/',guide:'guias/como-escolher-casa-movel-usada/'};
  const seoTags=html=>['title','description','og:title','og:description','canonical'].map(key=>key==='title'?html.match(/<title>[^<]*<\/title>/)?.[0]:key==='canonical'?html.match(/<link rel="canonical"[^>]*>/)?.[0]:html.match(new RegExp('<meta (?:name|property)="'+key+'"[^>]*>'))?.[0]);
  const originalSeo={};for(const [key,route] of Object.entries(seoRoutes))originalSeo[key]=seoTags(await (await call(route)).text());
  const seoContent=structuredClone(cfg.contentDefaults);
  for (const key of Object.keys(seoRoutes)) seoContent.seo[key]={title:`SEO ${key}`,description:`Descrição ${key}`,socialTitle:`Partilha ${key}`,socialDescription:`Resumo ${key}`};
  let revision=(await json(await admin('configuracoes'))).revision;
  assert.equal((await admin('configuracoes-guardar',{revision,contacts:c,content:seoContent})).status,200);
  for(const [key,route] of Object.entries(seoRoutes)) assert.ok(!(await (await call(route)).text()).includes(`SEO ${key}`));
  assert.equal((await admin('configuracoes-publicar',{revision:revision+1})).status,200);
  for(const [key,route] of Object.entries(seoRoutes)) {
    const html=await (await call(route)).text();
    for(const value of [`SEO ${key}`,`Descrição ${key}`,`Partilha ${key}`,`Resumo ${key}`]) assert.ok(html.includes(value),`${route}: ${value}`);
    assert.match(html, /rel="canonical"/);
  }
  revision=(await json(await admin('configuracoes'))).revision;
  assert.equal((await admin('configuracoes-recuperar',{revision,historyId:cfg.history[0].id})).status,200);
  assert.ok(!(await (await call('')).text()).includes('SEO home'));
  for(const [key,route] of Object.entries(seoRoutes)) assert.deepEqual(seoTags(await (await call(route)).text()),originalSeo[key],`Fallback SEO: ${route}`);
  // Synthetic values exercise each commercial source and every page that consumes it.
  const commercialTest=structuredClone(cfg.contentDefaults);
  for(const key of Object.keys(commercialTest.commercial)) commercialTest.commercial[key]=`VALOR_COMERCIAL_${key.toUpperCase()}_SINTETICO`;
  for(const group of ['home','about']) for(const key of Object.keys(commercialTest[group])) if(key!=='featured') commercialTest[group][key]=`VALOR_${group.toUpperCase()}_${key.toUpperCase()}_SINTETICO`;
  commercialTest.faq.push({question:'Questão livre sintética?',answer:'Resposta livre sintética.',visible:true});
  const legalBody=html=>html.match(/<main id="conteudo">[\s\S]*?<\/main>/)[0].replace(/<dl class="business-details[\s\S]*?<\/dl>/,'');
  const legalBefore=legalBody(await (await call('termos/')).text());
  revision=(await json(await admin('configuracoes'))).revision;
  assert.equal((await admin('configuracoes-guardar',{revision,contacts:c,content:commercialTest})).status,200);
  const draftHome=await (await call('')).text();assert.doesNotMatch(draftHome,/VALOR_COMERCIAL_/);
  assert.equal((await admin('configuracoes-publicar',{revision:revision+1})).status,200);
  const routesByField={process:[''],transport:['','casas-moveis-acores/','casas-moveis-madeira/','casas/ohara-734-com-terraco-t2/'],delivery:['','casas-moveis-acores/','casas-moveis-madeira/','casas/ohara-734-com-terraco-t2/'],islands:['','casas-moveis-acores/','casas-moveis-madeira/'],included:['','casas-moveis-acores/','casas-moveis-madeira/','casas/ohara-734-com-terraco-t2/'],excluded:['','casas-moveis-acores/','casas-moveis-madeira/','casas/ohara-734-com-terraco-t2/'],visits:[''],inspection:['']};
  for(const [key,routes] of Object.entries(routesByField)) for(const route of routes){const html=await (await call(route)).text();assert.ok(html.includes(commercialTest.commercial[key]),`${key}: ${route}`);assert.ok(!html.includes(cfg.contentDefaults.commercial[key]),`Valor anterior ${key}: ${route}`)}
  const testHome=await (await call('')).text();for(const [key,value] of Object.entries(commercialTest.home))if(key!=='featured')assert.ok(testHome.includes(value),`home.${key}`);const testAbout=await (await call('sobre/')).text();for(const [key,value] of Object.entries(commercialTest.about))assert.ok(testAbout.includes(value),`about.${key}`);assert.ok(testHome.includes('Resposta livre sintética.'));assert.ok(testHome.includes('VALOR_COMERCIAL_VISITS_SINTETICO'));
  assert.equal(legalBody(await (await call('termos/')).text()),legalBefore);
  revision=(await json(await admin('configuracoes'))).revision;
  assert.equal((await admin('configuracoes-recuperar',{revision,historyId:cfg.history[0].id})).status,200);
  assert.doesNotMatch(await (await call('')).text(),/VALOR_COMERCIAL_/);
  for(const zone of ['Pacific/Kiritimati','America/Adak']) {
    const date=new Intl.DateTimeFormat('en-CA',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
    for(const [label,active,start,end,expected] of [['inactive',false,'2000-01-01','',false],['active',true,'2000-01-01','',true],['future',true,'2999-01-01','',false],['expired',true,'2000-01-01','2000-01-02',false],['today',true,date,date,true]]) {
      const input=structuredClone(cfg.contentDefaults);input.notice={title:`AVISO_${label}`,message:'Aviso de teste',active,start,end,url:''};
      revision=(await json(await admin('configuracoes'))).revision;
      assert.equal((await admin('configuracoes-guardar',{revision,contacts:{...c,timezone:zone},content:input})).status,200);
      assert.equal((await admin('configuracoes-publicar',{revision:revision+1})).status,200);
      assert.equal((await (await call('')).text()).includes(`AVISO_${label}`),expected,`${label} ${zone}`);
    }
  }
  revision=(await json(await admin('configuracoes'))).revision;
  assert.equal((await admin('configuracoes-recuperar',{revision,historyId:cfg.history[0].id})).status,200);
  // Independently publish and recover each FAQ operation.
  const faqBase=structuredClone(cfg.contentDefaults);
  faqBase.faq=[{question:'FAQ A?',answer:'Resposta A',visible:true},{question:'FAQ B?',answer:'Resposta B',visible:true}];
  revision=(await json(await admin('configuracoes'))).revision;
  assert.equal((await admin('configuracoes-guardar',{revision,contacts:c,content:faqBase})).status,200);
  assert.equal((await admin('configuracoes-publicar',{revision:revision+1})).status,200);
  const faqBaseline=await json(await admin('configuracoes'));const faqHistory=faqBaseline.history[0].id;
  for(const operation of ['add','edit','delete','order','hide','show']) {
    const changed=structuredClone(faqBase);
    if(operation==='add')changed.faq.push({question:'FAQ C?',answer:'Resposta C',visible:true});
    if(operation==='edit')changed.faq[0].answer='Resposta editada';
    if(operation==='delete')changed.faq.shift();
    if(operation==='order')changed.faq.reverse();
    if(operation==='hide')changed.faq[0].visible=false;
    if(operation==='show'){changed.faq[0].visible=false;revision=(await json(await admin('configuracoes'))).revision;assert.equal((await admin('configuracoes-guardar',{revision,contacts:c,content:changed})).status,200);assert.equal((await admin('configuracoes-publicar',{revision:revision+1})).status,200);changed.faq[0].visible=true;}
    revision=(await json(await admin('configuracoes'))).revision;
    assert.equal((await admin('configuracoes-guardar',{revision,contacts:c,content:changed})).status,200);
    assert.equal((await admin('configuracoes-publicar',{revision:revision+1})).status,200);
    const html=await (await call('')).text();
    if(operation==='add')assert.ok(html.includes('FAQ C?'));if(operation==='edit')assert.ok(html.includes('Resposta editada'));
    if(operation==='delete'||operation==='hide')assert.ok(!html.includes('FAQ A?'));
    if(operation==='order')assert.ok(html.indexOf('FAQ B?')<html.indexOf('FAQ A?'));
    if(operation==='show')assert.ok(html.includes('FAQ A?'));
    revision=(await json(await admin('configuracoes'))).revision;
    assert.equal((await admin('configuracoes-recuperar',{revision,historyId:faqHistory})).status,200);
    const restored=await (await call('')).text();assert.ok(restored.includes('FAQ A?')&&restored.includes('FAQ B?'));assert.ok(!restored.includes('FAQ C?')&&!restored.includes('Resposta editada'));assert.ok(restored.indexOf('FAQ A?')<restored.indexOf('FAQ B?'));
  }
  revision=(await json(await admin('configuracoes'))).revision;
  assert.equal((await admin('configuracoes-recuperar',{revision,historyId:cfg.history[0].id})).status,200);
  const featureTest=structuredClone(cfg.contentDefaults);
  featureTest.home.featured=['irm-super-mercure-t2','ohara-734-com-terraco-t2','casa-eliminada'];
  revision=(await json(await admin('configuracoes'))).revision;
  assert.equal((await admin('configuracoes-guardar',{revision,contacts:c,content:featureTest})).status,200);
  assert.equal((await admin('configuracoes-publicar',{revision:revision+1})).status,200);
  let featuredHtml=(await (await call('')).text()).split('<div class="cards">')[1].split('</section>')[0];
  assert.ok(featuredHtml.indexOf('irm-super-mercure-t2') < featuredHtml.indexOf('ohara-734-com-terraco-t2'));assert.ok(!featuredHtml.includes('casa-eliminada'));
  const selectedState=await db.prepare('SELECT state FROM inventory WHERE slug=?').bind('irm-super-mercure-t2').first();
  await db.prepare('UPDATE inventory SET state=? WHERE slug=?').bind('draft','irm-super-mercure-t2').run();
  featuredHtml=(await (await call('')).text()).split('<div class="cards">')[1].split('</section>')[0];assert.ok(!featuredHtml.includes('irm-super-mercure-t2'));
  await db.prepare('UPDATE inventory SET state=? WHERE slug=?').bind(selectedState.state,'irm-super-mercure-t2').run();
  const deletedUnit=await db.prepare('SELECT * FROM inventory WHERE slug=?').bind('irm-super-mercure-t2').first();
  await db.prepare('DELETE FROM inventory WHERE slug=?').bind('irm-super-mercure-t2').run();
  featuredHtml=(await (await call('')).text()).split('<div class="cards">')[1].split('</section>')[0];assert.ok(!featuredHtml.includes('irm-super-mercure-t2'));
  await db.prepare('INSERT INTO inventory(id,slug,data,state,revision,actor,updated) VALUES (?,?,?,?,?,?,?)').bind(deletedUnit.id,deletedUnit.slug,deletedUnit.data,deletedUnit.state,deletedUnit.revision,deletedUnit.actor,deletedUnit.updated).run();

  revision=(await json(await admin('configuracoes'))).revision;
  assert.equal((await admin('configuracoes-recuperar',{revision,historyId:cfg.history[0].id})).status,200);
  for (const [route, expected] of [
    ['', 'Outra forma'],
    ['casas/', 'Explore as'],
    ['casas-moveis-acores/', 'Casas móveis usadas nos Açores'],
    ['casas-moveis-madeira/', 'Casas móveis usadas na Madeira'],
    ['guias/como-escolher-casa-movel-usada/', 'Como escolher uma casa móvel usada'],
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

  const regionalPages = [
    ['casas-moveis-acores/', 'Casas móveis usadas nos Açores'],
    ['casas-moveis-madeira/', 'Casas móveis usadas na Madeira'],
    ['guias/como-escolher-casa-movel-usada/', 'Como escolher uma casa móvel usada'],
  ];
  const observed = { title: new Set(), description: new Set(), h1: new Set(), canonical: new Set() };
  for (const [route, heading] of regionalPages) {
    const html = await (await call(route)).text();
    const read = (pattern) => { const match = html.match(pattern); assert.ok(match, route + ' ' + pattern); return match[1].trim(); };
    const title = read(/<title>\s*([^<]+)\s*<\/title>/);
    const description = read(/<meta name="description" content="([^"]+)"/);
    const h1 = read(/<h1>\s*([^<]+)\s*<\/h1>/);
    const canonical = read(/<link rel="canonical" href="([^"]+)"/);
    assert.equal(h1, heading);
    assert.equal(canonical, base + route);
    assert.match(html, /<meta name="robots" content="index,follow"/);
    for (const [key, value] of Object.entries({ title, description, h1, canonical })) observed[key].add(value);
  }
  for (const values of Object.values(observed)) assert.equal(values.size, regionalPages.length);

  const sitemap = await (await call('sitemap.xml')).text();
  for (const route of ['casas-moveis-acores/', 'casas-moveis-madeira/', 'guias/como-escolher-casa-movel-usada/']) assert.ok(sitemap.includes(route));
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
    'admin/configuracoes/',
    'admin/configuracoes-guardar/',
    'admin/configuracoes-publicar/',
    'admin/configuracoes-recuperar/',
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
      let failSettingsLoad = false;
      await page.route('https://challenges.cloudflare.com/**', (route) =>
        route.fulfill({
          contentType: 'application/javascript',
          body: `window.turnstile={render:(selector,options)=>{window.testChallenge=options;options.callback(crypto.randomUUID());document.querySelector(selector).textContent='Verificação de teste';return 'widget';},reset:()=>window.testChallenge.callback(crypto.randomUUID())};`,
        }),
      );
      await page.route(origin + '/**', async (route) => {
        const r = route.request(),
          headers = { ...r.headers(), 'Cf-Access-Jwt-Assertion': token };
        if (failSettingsLoad && new URL(r.url()).pathname.endsWith('/admin/configuracoes/')) return route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({message:'Erro de carregamento simulado.'})});
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
      // Legacy identifiers and slugs remain in storage but must not appear in the ADMIN.
      const legacyData={...unit.data,name_for_site:'Casa legada sintética'};
      await db.prepare('INSERT INTO inventory(id,slug,data,state,revision,actor,updated) VALUES (?,?,?,?,?,?,?)')
        .bind('exposul-teste','exposul-teste',JSON.stringify(legacyData),'archived',1,'teste',new Date().toISOString()).run();
      await page.goto(base + 'admin/');
      await page.locator('#list .unit').filter({hasText:'Casa legada sintética'}).getByRole('button',{name:'Abrir ficha'}).click();
      assert.equal(await page.locator('#ref').innerText(),'Estado: Arquivada');
      assert.doesNotMatch(await page.locator('#edit').innerText(),/exposul/i);
      page.once('dialog',d=>{assert.doesNotMatch(d.message(),/exposul/i);return d.accept('ELIMINAR');});
      await page.getByRole('button',{name:'Eliminar definitivamente'}).click();
      await page.getByText('Casa eliminada.').waitFor();
      assert.equal(await db.prepare('SELECT id FROM inventory WHERE id=?').bind('exposul-teste').first(),null);
      assert.doesNotMatch(await page.locator('#events').innerText(),/exposul/i);
      await db.prepare('UPDATE contact_requests SET notes=? WHERE id=?').bind('Nota anterior de teste',contactInput.id).run();
      await page.locator('#list .unit').first().waitFor();
      failSettingsLoad = true;
      await page.getByRole('button',{name:'Configurações do website'}).click();
      await page.getByText('Erro de carregamento simulado.').waitFor();
      assert.equal(await page.locator('#settings-form').evaluate(form => form.inert), true);
      assert.equal(await page.locator('#settings-retry').isVisible(), true);
      failSettingsLoad = false;
      await page.locator('#settings-retry').click();
      await page.getByText('Configurações carregadas.').waitFor();
      assert.equal(await page.locator('#settings-form').evaluate(form => form.inert), false);
      await page.locator('#settings-form input[name="phone"]').waitFor();
      await page.locator('#settings-form input[name="phone"]').fill('+351 919 222 333');
      const linkedPrice=page.locator('.settings-faq-row').nth(3);
      assert.equal(await linkedPrice.locator('[name=source]').inputValue(),'price');
      assert.equal(await linkedPrice.locator('[name=answer]').isVisible(),false);
      await linkedPrice.locator('[name=question]').fill('Custos associados visual?');
      await linkedPrice.locator('[name=source]').selectOption('');
      assert.equal(await linkedPrice.locator('[name=answer]').isVisible(),true);
      await linkedPrice.locator('[name=answer]').fill('Resposta comercial personalizada de teste');
      await linkedPrice.locator('[name=source]').selectOption('price');
      assert.equal(await linkedPrice.locator('[name=answer]').isVisible(),false);
      await page.locator('[name="home.title"]').fill('Casa de teste visual');
      await page.locator('[name="about.title"]').fill('Sobre de teste visual');
      await page.locator('[name="commercial.transport"]').fill('Transporte de teste visual');
      await page.getByRole('button',{name:'Adicionar pergunta'}).click();
      const lastFaq=page.locator('.settings-faq-row').last(); await lastFaq.locator('[name=question]').fill('Pergunta visual?');await lastFaq.locator('[name=answer]').fill('Resposta visual');
      await lastFaq.locator('[name=answer]').fill('Resposta visual editada');
      await lastFaq.locator('[name=visible]').uncheck();assert.equal(await lastFaq.locator('[name=visible]').isChecked(),false);
      await lastFaq.locator('[name=visible]').check();
      await page.getByRole('button',{name:'Adicionar pergunta'}).click();
      const extra=page.locator('.settings-faq-row').last();await extra.locator('[name=question]').fill('Pergunta temporária?');await extra.locator('[name=answer]').fill('Resposta temporária');
      await extra.getByRole('button',{name:'Subir'}).click();
      assert.equal(await page.locator('.settings-faq-row').nth((await page.locator('.settings-faq-row').count())-2).locator('[name=question]').inputValue(),'Pergunta temporária?');
      page.once('dialog',d=>d.accept());await page.locator('.settings-faq-row').nth((await page.locator('.settings-faq-row').count())-2).getByRole('button',{name:'Eliminar pergunta'}).click();
      assert.equal(await page.locator('.settings-faq-row [name=question]').evaluateAll(inputs=>inputs.some(input=>input.value==='Pergunta temporária?')),false);

      await page.locator('[name="notice.title"]').fill('Aviso visual');await page.locator('[name="notice.message"]').fill('Texto visual');
      await page.locator('[name="notice.start"]').fill('2020-01-01');await page.locator('[name="notice.active"]').check();
      await page.locator('#settings-featured input').first().check();
      await page.locator('[name="visibility.instagram"]').uncheck();
      await page.locator('details').filter({has:page.getByText('Página inicial',{exact:true})}).first().locator('summary').click();
      await page.locator('[name="seo.home.title"]').fill('Título SEO visual');
      await page.getByRole('button',{name:'Pré-visualizar',exact:true}).click();
      assert.match(await page.locator('#settings-preview-content').innerText(),/919 222 333/);
      await page.locator('#settings-preview-close').click();
      await page.getByRole('button',{name:'Guardar rascunho'}).click();
      await page.getByText('Rascunho guardado.').waitFor();
      page.once('dialog',d=>d.accept()); await page.getByRole('button',{name:'Publicar alterações',exact:true}).click();
      await page.getByText('Alterações publicadas.').waitFor();
      assert.match(await (await call('contactos/')).text(), /919 222 333/);
      const homeVisual=await (await call('')).text(); for(const x of ['Casa de teste visual','Pergunta visual?','Transporte de teste visual','Título SEO visual','Aviso visual']) assert.ok(homeVisual.includes(x),x);assert.ok(homeVisual.includes('Custos associados visual?'));
      assert.match(await (await call('sobre/')).text(),/Sobre de teste visual/);
      assert.doesNotMatch(await (await call('contactos/')).text(),/instagram.com\/azmorahomes/);
      page.once('dialog',d=>{assert.match(d.message(),/Diferenças por secção/);assert.match(d.message(),/rascunho/);assert.match(d.message(),/histórico/);return d.accept();}); await page.locator('#settings-history button').last().click();
      await page.getByText('Versão recuperada.').waitFor();
      assert.doesNotMatch(await (await call('contactos/')).text(), /919 222 333/);
      await page.getByRole('button',{name:'Inventário',exact:true}).click();
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
      // The picker must not imply that an unsupported file was uploaded, and the
      // same file can be selected again after a failure.
      const invalidPhoto={name:'fotografia.pdf',mimeType:'application/pdf',buffer:Buffer.from('not an image')};
      for(let attempt=0;attempt<2;attempt++){
        await page.locator('#files').setInputFiles(invalidPhoto);
        await page.getByText(/não é JPEG, PNG, WebP ou HEIC/).first().waitFor();
        await page.waitForFunction(()=>document.querySelector('#files').value==='');
        assert.equal(await page.locator('#photos img').count(),0);
      }
      // Exercise the browser image-element fallback when createImageBitmap fails.
      await page.evaluate(() => { window.createImageBitmap = () => Promise.reject(new Error('falha simulada')); });
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
  // Local-only fault injection: missing settings table is surfaced to ADMIN.
  await db.prepare('DROP TABLE site_settings').run();
  const missingSettings=await admin('configuracoes'); assert.equal(missingSettings.status, 503); assert.match((await missingSettings.json()).message,/migração 0005/i);
  assert.equal((await call('')).status, 200);
  console.log(
    'OK · Worker local, acesso, 16 unidades, rascunho, criação, publicação, concorrência, arquivo, recuperação e eliminação.',
  );
} finally {
  await mf.dispose();
}
