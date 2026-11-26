import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { DatabaseSync } from 'node:sqlite';

test('migração 0006 preserva dados anteriores e regista apenas mudanças comerciais futuras', () => {
  const db = new DatabaseSync(':memory:');
  for (const file of fs.readdirSync('migrations').sort().filter(x => x < '0006'))
    db.exec(fs.readFileSync('migrations/' + file, 'utf8'));
  db.exec(`UPDATE inventory SET data=json_set(data,'$.availability','vendido') WHERE id='exposul-001';
           UPDATE inventory SET data=json_set(data,'$.availability','estado-antigo') WHERE id='exposul-002';
           UPDATE inventory SET state='archived' WHERE id='exposul-003';`);
  const tables=['inventory','activity','uploads','contact_requests','contact_history','site_settings','site_settings_history'];
  const snapshot=Object.fromEntries(tables.map(t=>[t,db.prepare('SELECT * FROM '+t).all()]));
  db.exec(fs.readFileSync('migrations/0006_commercial_history.sql','utf8'));
  for(const table of tables) assert.deepEqual(db.prepare('SELECT * FROM '+table).all(),snapshot[table],table);
  assert.equal(db.prepare('SELECT COUNT(*) n FROM inventory_commercial_history').get().n,0,'não inventa datas para vendas antigas');
  db.prepare("UPDATE inventory SET data=json_set(data,'$.availability',?), revision=revision+1 WHERE id=? AND revision=?").run('reservado','exposul-002',1);
  const first=db.prepare("SELECT old_state,new_state FROM inventory_commercial_history WHERE inventory_id=?").get('exposul-002');
  assert.equal(first.old_state,'estado-antigo'); assert.equal(first.new_state,'reservado');
  const stale=db.prepare("UPDATE inventory SET data=json_set(data,'$.availability',?), revision=revision+1 WHERE id=? AND revision=?").run('vendido','exposul-002',1);
  assert.equal(stale.changes,0);
  db.prepare("UPDATE inventory SET data=json_set(data,'$.availability',?), revision=revision+1 WHERE id=?").run('vendido','exposul-002');
  db.prepare("UPDATE inventory SET data=json_set(data,'$.availability',?), revision=revision+1 WHERE id=?").run('disponivel','exposul-002');
  const history=db.prepare("SELECT old_state,new_state,changed_at FROM inventory_commercial_history WHERE inventory_id=? ORDER BY seq").all('exposul-002');
  assert.deepEqual(history.map(x=>x.new_state),['reservado','vendido','disponivel']);
  assert.ok(history.every(x=>/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(x.changed_at)));
  assert.equal(db.prepare("SELECT json_extract(data,'$.availability') v FROM inventory WHERE id='exposul-001'").get().v,'vendido');
  db.close();
});
