import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { validateContactSettings, validateContent } from '../cloudflare/settings-validation.mjs';
import { saveContactDraft, readSettings, publishSettings, restoreSettings } from '../cloudflare/settings-store.mjs';
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


test('conteúdos recusam XSS, aviso inseguro e referências duplicadas', () => {
  const base=JSON.parse(readFileSync('src/data/site-content.json','utf8'));
  assert.equal(validateContent(base),true);
  const attack=structuredClone(base);attack.home.title='<img src=x onerror=alert(1)>';assert.equal(validateContent(attack),false);
  const badUrl=structuredClone(base);badUrl.notice.url='javascript:alert(1)';assert.equal(validateContent(badUrl),false);
  const badDate=structuredClone(base);badDate.notice.start='2026-02-31';assert.equal(validateContent(badDate),false);
  const repeated=structuredClone(base);repeated.home.featured=['casa-1','casa-1'];assert.equal(validateContent(repeated),false);
  const wrong=structuredClone(base);wrong.faq[0].visible='true';assert.equal(validateContent(wrong),false);
});


test('cada campo de conteúdo percorre rascunho privado, publicação e recuperação', async () => {
  const sql=new DatabaseSync(':memory:'); sql.exec(readFileSync('migrations/0005_site_settings.sql','utf8'));
  const db={prepare(query){let args=[];return {bind(...v){args=v;return this},async first(){return sql.prepare(query).get(...args)||null},async run(){return {meta:{changes:Number(sql.prepare(query).run(...args).changes)}}}}}};
  const base=JSON.parse(readFileSync('src/data/site-content.json','utf8'));
  const cases=[];
  for(const group of ['home','about','commercial']) for(const key of Object.keys(base[group])) cases.push([`${group}.${key}`, c=>{c[group][key]=key==='featured'?['casa-teste']:`Teste ${group} ${key}`}]);
  for(const key of ['question','answer','visible']) cases.push([`faq.${key}`,c=>{c.faq[0][key]=key==='visible'?false:`Teste FAQ ${key}`}]);
  for(const key of Object.keys(base.notice)) cases.push([`notice.${key}`,c=>{c.notice={title:'Aviso',message:'Mensagem',active:false,start:'2026-01-01',end:'',url:''};c.notice[key]=({title:'Outro aviso',message:'Outra mensagem',active:true,start:'2026-01-02',end:'2026-01-03',url:'/contactos/'})[key]}]);
  for(const page of Object.keys(base.seo)) for(const key of Object.keys(base.seo[page])) cases.push([`seo.${page}.${key}`,c=>{c.seo[page][key]=`Teste ${page} ${key}`}]);
  for(const [label,change] of cases){
    const c=structuredClone(base);change(c);assert.equal(validateContent(c),true,label);
    let row=await readSettings(db);const previous=JSON.stringify(row.published);
    assert.equal(await saveContactDraft(db,row.revision,valid,'owner',c),true,label);
    row=await readSettings(db);assert.equal(JSON.stringify(row.published),previous,label);assert.deepEqual(row.draft.content,c,label);
    assert.equal(await publishSettings(db,row.revision,'owner'),true,label);
    row=await readSettings(db);assert.deepEqual(row.published.content,c,label);
    const old=sql.prepare('SELECT id FROM site_settings_history ORDER BY id DESC LIMIT 1 OFFSET 1').get();
    assert.equal(await restoreSettings(db,row.revision,old.id,'owner'),true,label);
    row=await readSettings(db);assert.equal(JSON.stringify(row.published),previous,label);
  }
  sql.close();
});


test('avisos aceitam intervalos válidos e rejeitam estado ativo incompleto ou datas invertidas', () => {
  const base=JSON.parse(readFileSync('src/data/site-content.json','utf8'));
  for(const notice of [
    {title:'',message:'',active:false,start:'',end:'',url:''},
    {title:'Aviso',message:'Mensagem',active:true,start:'2026-01-01',end:'',url:'/contactos/'},
    {title:'Aviso',message:'Mensagem',active:true,start:'2026-01-01',end:'2026-01-01',url:'https://example.test/'},
  ]) assert.equal(validateContent({...base,notice}),true);
  for(const notice of [
    {title:'',message:'Mensagem',active:true,start:'2026-01-01',end:'',url:''},
    {title:'Aviso',message:'Mensagem',active:true,start:'2026-02-02',end:'2026-02-01',url:''},
    {title:'Aviso',message:'Mensagem',active:true,start:'2026-01-01',end:'',url:'javascript:alert(1)'},
  ]) assert.equal(validateContent({...base,notice}),false);
});


test('FAQ explicitamente personalizada preserva resposta original', async () => {
  const {faqAnswer} = await import('../src/lib/commercial.ts');
  const base=JSON.parse(readFileSync('src/data/site-content.json','utf8'));
  const original=base.faq.find(f=>f.source==='visits');
  assert.equal(faqAnswer({...original,source:'custom'},{...base.commercial,visits:'VISITA ALTERADA'}),original.answer);
  assert.equal(validateContent({...base,faq:[{...original,source:'custom'}]}),true);
});
