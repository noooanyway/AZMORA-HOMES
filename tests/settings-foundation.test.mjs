import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { validateContactSettings } from '../cloudflare/settings-validation.mjs';
import { saveContactDraft, readSettings } from '../cloudflare/settings-store.mjs';
const valid = { phone: '+351 913 667 365', secondPhone: '+351 961 533 260', whatsapp: '+351 913 667 365', email: 'geral@azmorahomes.pt', openingHours: 'Segunda a sexta', timezone: 'Europe/Lisbon', languages: 'Português, inglês e francês', social: { instagram: 'https://www.instagram.com/azmorahomes/', facebook: 'https://www.facebook.com/azmorahomes' } };
test('contactos rejeitam dados maliciosos, destinos indevidos e campos não suportados', () => {
  assert.equal(validateContactSettings(valid), true);
  for (const patch of [{phone: 'abc'}, {email:'x@exemplo.pt\nBcc:a@b.pt'}, {timezone:'Invalid/Zone'}, {openingHours:'<script>alert(1)</script>'}, {social: {...valid.social, instagram:'https://instagram.com.evil.test/a'}}, {social: {...valid.social, facebook:'javascript:alert(1)'}}, {notification_to:'private@example.test'}]) assert.equal(validateContactSettings({...valid,...patch}), false);
});
test('D1 guarda versões publicadas e rejeita um segundo editor com revisão antiga', () => {
  const db = new DatabaseSync(':memory:');
  db.exec(readFileSync('migrations/0005_site_settings.sql','utf8'));
  const save=db.prepare('UPDATE site_settings SET draft=?, revision=revision+1, updated_by=? WHERE id=1 AND revision=?');
  assert.equal(Number(save.run(JSON.stringify(valid),'owner-a',0).changes),1);
  assert.equal(Number(save.run('{}','owner-b',0).changes),0);
  const publish=db.prepare('UPDATE site_settings SET published=draft, published_revision=published_revision+1, published_by=?, published_at=CURRENT_TIMESTAMP, revision=revision+1 WHERE id=1 AND revision=?');
  assert.equal(Number(publish.run('owner-a',1).changes),1);
  assert.equal(Number(publish.run('owner-b',1).changes),0);
  const row=db.prepare('SELECT draft,published,revision,published_revision FROM site_settings').get();
  assert.equal(row.draft,row.published);assert.equal(row.revision,2);assert.equal(row.published_revision,1);
  assert.deepEqual(JSON.parse(db.prepare('SELECT data FROM site_settings_history ORDER BY id DESC LIMIT 1').get().data), valid);
  db.close();
});


test('guardar rascunho valida e impede gravação concorrente sem alterar a versão pública', async () => {
  const sql = new DatabaseSync(':memory:'); sql.exec(readFileSync('migrations/0005_site_settings.sql','utf8'));
  const db = { prepare(query) { let args=[]; return { bind(...values) {args=values; return this}, async first() {return sql.prepare(query).get(...args) || null}, async run() {return {meta:{changes:Number(sql.prepare(query).run(...args).changes)}}} }; } };
  assert.equal(await saveContactDraft(db,0,valid,'owner-a'),true);
  assert.equal(await saveContactDraft(db,0,{...valid,phone:'+351 912 000 000'},'owner-b'),false);
  const row = await readSettings(db); assert.equal(row.revision,1); assert.deepEqual(row.draft.contacts,valid); assert.deepEqual(row.published,{});
  await assert.rejects(() => saveContactDraft(db,1,{...valid,email:'invalid'},'owner-a'));
  sql.close();
});
