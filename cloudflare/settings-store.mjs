import { validateContactSettings } from './settings-validation.mjs';

// Foundation only: not connected to routes, ADMIN, or public rendering.
// Atomic revision checks prevent stale editors from silently overwriting changes.
export async function readSettings(db) {
  const row = await db.prepare('SELECT draft,published,revision,published_revision,updated_at,published_at FROM site_settings WHERE id=1').first();
  if (!row) throw new Error('Migração de configurações em falta.');
  return { ...row, draft: JSON.parse(row.draft), published: JSON.parse(row.published) };
}
function validRevision(value) { return Number.isSafeInteger(value) && value >= 0; }
export async function saveContactDraft(db, revision, contacts, actor) {
  if (!validRevision(revision) || !validateContactSettings(contacts) || typeof actor !== 'string' || !actor || actor.length > 254) throw new Error('Dados de configurações inválidos.');
  const current = await readSettings(db);
  if (current.revision !== revision) return false;
  const draft = JSON.stringify({ ...current.draft, contacts });
  if (draft.length > 100000) throw new Error('Conteúdo excede o limite.');
  const result = await db.prepare('UPDATE site_settings SET draft=?, revision=revision+1, updated_by=?, updated_at=CURRENT_TIMESTAMP WHERE id=1 AND revision=?').bind(draft, actor, revision).run();
  return result.meta.changes > 0;
}
// No publish endpoint is provided: only a fully validated document may become public.

export async function publishSettings(db, revision, actor) {
  if (!validRevision(revision) || typeof actor !== 'string' || !actor) throw Error('Revisão inválida.');
  const row = await readSettings(db);
  if (row.revision !== revision) return false;
  if (!validateContactSettings(row.draft.contacts)) throw Error('Guarde primeiro um rascunho válido.');
  const result = await db.prepare('UPDATE site_settings SET published=draft, published_revision=published_revision+1, published_by=?, published_at=CURRENT_TIMESTAMP, revision=revision+1 WHERE id=1 AND revision=?').bind(actor, revision).run();
  return result.meta.changes > 0;
}
export async function restoreSettings(db, revision, historyId, actor) {
  if (!validRevision(revision) || !Number.isSafeInteger(historyId) || historyId < 1 || typeof actor !== 'string' || !actor) throw Error('Dados inválidos.');
  const old = await db.prepare('SELECT data FROM site_settings_history WHERE id=?').bind(historyId).first();
  if (!old) throw Error('Versão inexistente.');
  const data = JSON.parse(old.data);
  if (Object.keys(data).length && !validateContactSettings(data.contacts)) throw Error('Versão inválida.');
  const r = await db.prepare('UPDATE site_settings SET draft=?, published=?, revision=revision+1, published_revision=published_revision+1, published_by=?, published_at=CURRENT_TIMESTAMP WHERE id=1 AND revision=?').bind(old.data, old.data, actor, revision).run();
  return r.meta.changes > 0;
}
