import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';

test('migração 0005 preserva dados e triggers de uma base sintética até 0004', () => {
  const db = new DatabaseSync(':memory:');
  for (const file of ['0001_inventory.sql','0002_catalog.sql','0003_contacts.sql','0004_contact_history.sql']) db.exec(readFileSync('migrations/'+file,'utf8'));
  db.prepare("INSERT INTO contact_requests(id,payload_hash,dedupe_key,name,email,request_type,message) VALUES(?,?,?,?,?,?,?)").run('test-request','hash','dedupe','Pessoa','test@example.test','info','Mensagem');
  db.prepare("UPDATE contact_requests SET status='working',history_actor='editor@example.test' WHERE id='test-request'").run();
  const tables=['inventory','activity','uploads','contact_requests','contact_history','contact_limits','contact_tokens'];
  const before=Object.fromEntries(tables.map(name=>[name,db.prepare(`SELECT * FROM ${name} ORDER BY rowid`).all()]));
  db.exec(readFileSync('migrations/0005_site_settings.sql','utf8'));
  for(const name of tables) assert.deepEqual(db.prepare(`SELECT * FROM ${name} ORDER BY rowid`).all(),before[name],name);
  assert.equal(db.prepare('PRAGMA integrity_check').get().integrity_check,'ok');
  assert.deepEqual(JSON.parse(db.prepare('SELECT published FROM site_settings').get().published),{});
  db.prepare("UPDATE contact_requests SET status='answered',history_actor='editor@example.test' WHERE id='test-request'").run();
  assert.equal(db.prepare("SELECT count(*) AS n FROM contact_history WHERE contact_id='test-request'").get().n,3);
  db.prepare("UPDATE site_settings SET published='{}',published_revision=1,published_by='editor' WHERE id=1").run();
  assert.equal(db.prepare('SELECT count(*) AS n FROM site_settings_history').get().n,2);
  db.close();
});
