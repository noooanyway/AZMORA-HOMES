import { chromium } from 'playwright-core';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import assert from 'node:assert/strict';
const dist = resolve('dist');
let pendingRequests = 0;
const server = createServer(async (req, res) => {
  try {
    if (req.url === '/fake-rum') { pendingRequests++; res.end('ok'); return; }
    let path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname).replace(/^\/AZMORA-HOMES\/?/, '');
    if (!path || path.endsWith('/')) path += 'index.html';
    const file = resolve(dist, path);
    if (!file.startsWith(dist + sep)) throw Error('path');
    const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2':'font/woff2', '.svg':'image/svg+xml', '.json':'application/json' };
    res.setHeader('Content-Type', mime[extname(file)] || 'application/octet-stream');
    res.end(await readFile(file));
  } catch { res.statusCode=404; res.end(); }
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const root = `http://127.0.0.1:${server.address().port}/AZMORA-HOMES/`;
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
 for (const width of [390,768,1440]) {
  const ctx=await browser.newContext({viewport:{width,height:900}});const page=await ctx.newPage();let requests=0;
  page.on('request',r=>{if (/cloudflareinsights|\/cdn-cgi\/rum/.test(r.url())) requests++;});
  await page.goto(root); await page.locator('#consent-panel').waitFor(); assert.equal(requests,0);
  await page.getByRole('button',{name:'Personalizar preferências'}).click();
  assert.equal(await page.locator('#consent-preferences').isChecked(),false);
  await page.getByRole('button',{name:'Guardar escolha'}).click();
  await page.locator('button[data-fav]').first().click();
  const favName = await page.locator('button[data-fav]').first().getAttribute('data-fav');
  await page.locator('.favlink').click();
  await page.locator(`#saved [data-card="${favName}"]`).waitFor({state:"visible"});
  assert.equal(await page.evaluate(()=>localStorage.getItem('azmora:favoritos')),null);
  await page.reload();assert.equal(await page.locator(`#saved [data-card="${favName}"]`).isVisible(),true);
  await page.goto(root+'casas/');await page.locator('button[data-compare]').nth(0).click();await page.locator('button[data-compare]').nth(1).click();
  await page.locator('#compareLink').click();assert.equal(await page.locator('#tablehost table').count(),1);
  assert.equal(await page.evaluate(()=>localStorage.getItem('azmora:comparar')),null);
  await page.reload();assert.equal(await page.locator('#tablehost table').count(),1);
  await page.getByRole('button',{name:'Tema do site'}).click();await page.getByRole('button',{name:'Escuro',exact:true}).click();assert.equal(await page.locator('html').getAttribute('data-theme'),'dark');
  assert.equal(await page.evaluate(()=>localStorage.getItem('azmora:theme')),null);
  await page.goto(root);await page.locator('[data-consent-open]').click();await page.getByRole('button',{name:'Aceitar todos'}).click();
  await page.locator('button[data-fav]').first().click();assert.ok(await page.evaluate(()=>localStorage.getItem('azmora:favoritos')));
  await page.reload();assert.equal(await page.locator('button[data-fav]').first().getAttribute('aria-pressed'),'true');
  const other=await ctx.newPage();await other.goto(root);assert.equal(await other.locator('button[data-fav]').first().getAttribute('aria-pressed'),'true');
  await page.locator('[data-consent-open]').click();await page.getByRole('button',{name:'Recusar opcionais'}).click();
  await page.waitForTimeout(600);assert.equal(await page.evaluate(()=>localStorage.getItem('azmora:favoritos')),null);
  await other.waitForFunction(() => document.querySelector('button[data-fav]')?.getAttribute('aria-pressed') === 'false');
  assert.equal(requests,0);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await page.goto(root+'contactos/');for(const label of ['Instagram','Facebook']) assert.ok(await page.getByRole('link',{name:label}).count());
  await ctx.close();
 }
 const ctx=await browser.newContext();await ctx.addInitScript(()=>Object.defineProperty(window,'localStorage',{get(){throw new Error('blocked')}}));const page=await ctx.newPage();await page.goto(root);await page.getByRole('button',{name:'Recusar opcionais'}).click();assert.match(await page.locator('#consent-status').innerText(),/Não foi possível/);await page.getByRole('button',{name:'Continuar nesta página'}).click();assert.ok(await page.locator('#consent-panel').isHidden());await ctx.close();
 console.log('OK consentimento: 390/768/1440, escolha, recusa, aceitação, retirada, redes, seleção temporária e armazenamento bloqueado');
} finally {await browser.close();await new Promise(r=>server.close(r));}
