import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

test('verificador aceita cópia coerente e rejeita fotografia em falta ou caminho externo', () => {
  const root=mkdtempSync(path.join(tmpdir(),'azmora-backup-test-'));
  try {
    const photos=path.join(root,'photos'), sql=path.join(root,'backup.sql');
    mkdirSync(path.join(photos,'images','uploads'),{recursive:true});
    writeFileSync(path.join(photos,'images','uploads','fixture.webp'),'synthetic');
    const make=(src)=>writeFileSync(sql,`CREATE TABLE inventory(data TEXT); INSERT INTO inventory VALUES('${JSON.stringify({media:[{src}]})}'); CREATE TABLE uploads(id); CREATE TABLE activity(id); CREATE TABLE contact_requests(id); CREATE TABLE contact_history(id); CREATE TABLE contact_limits(id); CREATE TABLE contact_tokens(id);`);
    const run=()=>spawnSync('python',['scripts/backup_verify.py',sql,photos],{encoding:'utf8'});
    make('images/uploads/fixture.webp');assert.equal(run().status,0);
    make('images/uploads/missing.webp');assert.equal(run().status,1);
    make('../../outside');assert.equal(run().status,1);
    writeFileSync(sql,'not SQL');assert.equal(run().status,1);
  } finally { rmSync(root,{recursive:true,force:true}); }
});

test('restauro isolado recupera inventário, pedidos, histórico e referência de fotografia', () => {
  const root=mkdtempSync(path.join(tmpdir(),'azmora-restore-test-'));
  try {
    const photos=path.join(root,'photos'), sql=path.join(root,'backup.sql');
    mkdirSync(path.join(photos,'images','uploads'),{recursive:true});
    writeFileSync(path.join(photos,'images','uploads','test.webp'),'fotografia sintética');
    writeFileSync(sql,`CREATE TABLE inventory(id TEXT,data TEXT); INSERT INTO inventory VALUES('casa-teste','{"media":[{"src":"images/uploads/test.webp"}]}'); CREATE TABLE contact_requests(id TEXT,message TEXT); INSERT INTO contact_requests VALUES('pedido-teste','mensagem sintética'); CREATE TABLE contact_history(contact_id TEXT,note TEXT); INSERT INTO contact_history VALUES('pedido-teste','nota sintética'); CREATE TABLE uploads(id); CREATE TABLE activity(id); CREATE TABLE contact_limits(id); CREATE TABLE contact_tokens(id);`);
    const run=spawnSync('python',['scripts/backup_verify.py',sql,photos],{encoding:'utf8'});
    assert.equal(run.status,0,run.stderr);
    const restore=spawnSync('python',['-c',"import sqlite3,sys; d=sqlite3.connect(':memory:'); d.executescript(open(sys.argv[1],encoding='utf-8').read()); assert d.execute('select count(*) from inventory').fetchone()[0]==1; assert d.execute('select count(*) from contact_requests').fetchone()[0]==1; assert d.execute('select count(*) from contact_history').fetchone()[0]==1",sql],{encoding:'utf8'});
    assert.equal(restore.status,0,restore.stderr);
  } finally { rmSync(root,{recursive:true,force:true}); }
});


test('restauro isolado valida rascunho, publicado e histórico de configurações', () => {
  const root=mkdtempSync(path.join(tmpdir(),'azmora-settings-restore-'));
  try {
    const photos=path.join(root,'photos'), sql=path.join(root,'backup.sql');mkdirSync(photos);
    const core=`CREATE TABLE inventory(data TEXT); CREATE TABLE uploads(id); CREATE TABLE activity(id); CREATE TABLE contact_requests(id); CREATE TABLE contact_history(id); CREATE TABLE contact_limits(id); CREATE TABLE contact_tokens(id);`;
    const settings=`CREATE TABLE site_settings(id INTEGER,draft TEXT,published TEXT,revision INTEGER,published_revision INTEGER); INSERT INTO site_settings VALUES(1,'{"contacts":{"phone":"+351 919 222 333"}}','{"contacts":{"phone":"+351 913 667 365"}}',2,1); CREATE TABLE site_settings_history(published_revision INTEGER,data TEXT,id INTEGER); INSERT INTO site_settings_history VALUES(1,'{"contacts":{"phone":"+351 913 667 365"}}',1);`;
    writeFileSync(sql,core+settings);const run=()=>spawnSync('python',['scripts/backup_verify.py',sql,photos],{encoding:'utf8'});assert.equal(run().status,0);
    writeFileSync(sql,core+settings+` UPDATE site_settings SET published='{}';`);assert.equal(run().status,1);
    writeFileSync(sql,core+` CREATE TABLE site_settings(id INTEGER);`);assert.equal(run().status,1);
  } finally {rmSync(root,{recursive:true,force:true});}
});


test('cópia sintética preserva conteúdos e histórico após restauro SQLite isolado', () => {
 const root=mkdtempSync(path.join(tmpdir(),'azmora-content-restore-'));
 try {const photos=path.join(root,'photos'),sql=path.join(root,'backup.sql');mkdirSync(photos);
 const core=`CREATE TABLE inventory(data TEXT); CREATE TABLE uploads(id); CREATE TABLE activity(id); CREATE TABLE contact_requests(id); CREATE TABLE contact_history(id); CREATE TABLE contact_limits(id); CREATE TABLE contact_tokens(id);`;
 const migrate=readFileSync('migrations/0005_site_settings.sql','utf8');
 const content=JSON.parse(readFileSync('src/data/site-content.json','utf8'));const payload=JSON.stringify({content}).replaceAll("'","''");
 writeFileSync(sql,core+migrate+` UPDATE site_settings SET draft='${payload}',published='${payload}',revision=1,published_revision=1,published_by='editor';`);
 const run=spawnSync('python',['scripts/backup_verify.py',sql,photos],{encoding:'utf8'});assert.equal(run.status,0,run.stderr);
 const read=spawnSync('python',['-c',"import sqlite3,sys,json; d=sqlite3.connect(':memory:');d.executescript(open(sys.argv[1],encoding='utf-8').read());a,b=d.execute('select draft,published from site_settings').fetchone();assert json.loads(a)==json.loads(b);assert len(json.loads(a)['content']['faq'])==7;assert d.execute('select count(*) from site_settings_history').fetchone()[0]==2",sql],{encoding:'utf8'});assert.equal(read.status,0,read.stderr);
 }finally{rmSync(root,{recursive:true,force:true})}
});
