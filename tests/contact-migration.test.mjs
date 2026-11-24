import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';

test('migração preserva pedidos antigos, autores, revisões e elimina dados associados', () => {
  const db = new DatabaseSync(':memory:');
  try {
    db.exec(readFileSync('migrations/0003_contacts.sql','utf8'));
    db.prepare("INSERT INTO contact_requests(id,payload_hash,dedupe_key,name,email,request_type,message,created_at,notes,email_payload) VALUES(?,?,?,?,?,?,?,?,?,?)").run('old','hash','dedupe','Cliente fictício','client@example.test','contacto','Mensagem fictícia','2025-01-02 03:04:05','Nota antiga','conteúdo fictício');
    db.exec(readFileSync('migrations/0004_contact_history.sql','utf8'));
    let history = db.prepare('SELECT * FROM contact_history ORDER BY id').all();
    assert.equal(history.length,1);
    assert.equal(history[0].event,'received');
    assert.equal(history[0].at,'2025-01-02 03:04:05');
    assert.equal(history[0].actor,null);
    assert.equal(db.prepare('SELECT notes FROM contact_requests WHERE id=?').get('old').notes,'Nota antiga');

    // SQL utilizado pela versão anterior em produção após a migração.
    const legacyUpdate = db.prepare('UPDATE contact_requests SET status=?,notes=?,revision=revision+1,updated_at=CURRENT_TIMESTAMP WHERE id=? AND revision=?');
    assert.equal(legacyUpdate.run('working','Nota anterior atualizada','old',1).changes,1);
    assert.equal(db.prepare('SELECT notes FROM contact_requests WHERE id=?').get('old').notes,'Nota anterior atualizada');
    const update = db.prepare('UPDATE contact_requests SET history_actor=?,status=?,new_note=?,revision=revision+1,updated_at=CURRENT_TIMESTAMP WHERE id=? AND revision=?');
    assert.equal(update.run('admin@example.test','answered','Nova nota','old',2).changes,1);
    assert.equal(update.run('other@example.test','archived','Não guardar','old',2).changes,0);
    let row=db.prepare('SELECT * FROM contact_requests WHERE id=?').get('old');
    assert.equal(row.revision,3);
    assert.equal(row.history_actor,null);
    assert.equal(row.new_note,'');
    history=db.prepare('SELECT * FROM contact_history ORDER BY id').all();
    assert.equal(history.filter(h=>h.event==='note').length,1);
    assert.equal(history.find(h=>h.event==='note').actor,'admin@example.test');
    assert.equal(history.find(h=>h.event==='status' && h.new_value==='answered').actor,'admin@example.test');
    assert.equal(history.find(h=>h.event==='status' && h.new_value==='working').actor,null);

    // A mesma nota submetida em revisões diferentes é um novo evento, sem duplicação na limpeza.
    assert.equal(update.run('admin@example.test','answered','Nova nota','old',3).changes,1);
    assert.equal(db.prepare("SELECT count(*) n FROM contact_history WHERE event='note'").get().n,2);
    assert.equal(db.prepare('SELECT revision FROM contact_requests WHERE id=?').get('old').revision,4);

    // Resultado automático não herda o último administrador, mesmo depois de novo estado.
    db.prepare("UPDATE contact_requests SET notification_status='sent' WHERE id=?").run('old');
    assert.equal(db.prepare("SELECT actor FROM contact_history WHERE event='notification' ORDER BY id DESC").get().actor,null);
    assert.equal(update.run('admin2@example.test','archived','','old',4).changes,1);
    row=db.prepare('SELECT * FROM contact_requests WHERE id=?').get('old');
    assert.equal(row.revision,5);
    assert.equal(row.history_actor,null);
    assert.equal(legacyUpdate.run('working','Nota do código anterior','old',5).changes,1);
    assert.equal(db.prepare("SELECT actor FROM contact_history WHERE event='status' AND new_value='working' ORDER BY id DESC").get().actor,null);
    assert.equal(legacyUpdate.run('archived','Nota antiga','old',6).changes,1);
    assert.equal(db.prepare("DELETE FROM contact_requests WHERE id=? AND revision=? AND status='archived' AND notification_status!='sending'").run('old',7).changes,1);
    assert.equal(db.prepare('SELECT count(*) n FROM contact_requests').get().n,0);
    assert.equal(db.prepare('SELECT count(*) n FROM contact_history').get().n,0);
  } finally { db.close(); }
});
