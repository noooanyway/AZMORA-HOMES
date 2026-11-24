import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import {
  submitContact,
  notifyContact,
  adminContacts,
  validate,
  csvCell,
  emailPayload,
} from '../cloudflare/contacts.mjs';

function fixture() {
  const sql = new DatabaseSync(':memory:');
  for (const file of fs.readdirSync('migrations').sort())
    sql.exec(fs.readFileSync('migrations/' + file, 'utf8'));
  const db = {
    prepare(query) {
      let args = [];
      return {
        bind(...values) {
          args = values;
          return this;
        },
        async first() {
          return sql.prepare(query).get(...args) || null;
        },
        async all() {
          return { results: sql.prepare(query).all(...args) };
        },
        async run() {
          const r = sql.prepare(query).run(...args);
          return { meta: { changes: Number(r.changes) } };
        },
      };
    },
    async batch(statements) {
      return Promise.all(statements.map((s) => s.all()));
    },
  };
  const env = {
    DB: db,
    SITE_URL: 'https://www.azmorahomes.pt',
    TURNSTILE_SECRET_KEY: 'test-secret',
    RESEND_API_KEY: 'test-resend',
    CONTACT_FROM_EMAIL: 'notificacoes@send.azmorahomes.pt',
    CONTACT_TO_EMAIL: 'team@example.test',
  };
  let mode = 'ok',
    calls = [],
    verification = {};
  const send = async (url, options) => {
    if (url.includes('siteverify'))
      return Response.json({
        success: true,
        hostname: 'www.azmorahomes.pt',
        action: 'contact',
        challenge_ts: new Date().toISOString(),
        ...verification,
      });
    calls.push(options);
    assert.equal(
      sql.prepare('SELECT count(*) n FROM contact_requests').get().n,
      1,
      'D1 precede o email',
    );
    if (mode === 'throw') throw Error('network');
    return mode === 'ok'
      ? Response.json({ id: 'email-test' })
      : Response.json(
          { message: 'ignored-private-detail' },
          { status: Number(mode), headers: { 'Retry-After': '120' } },
        );
  };
  const input = () => ({
    id: crypto.randomUUID(),
    name: 'Cliente de teste',
    email: 'client@example.test',
    phone: '+351912345678',
    island: 'São Miguel',
    locality: 'Ponta Delgada',
    typology: 'T2',
    request_type: 'preco',
    message: 'Pedido sintético',
    houses: ['ohara-734-com-terraco-t2'],
    consent: true,
    token: crypto.randomUUID(),
  });
  const request = (data, headers = {}) =>
    new Request(env.SITE_URL + '/api/contactos/', {
      method: 'POST',
      headers: {
        Origin: env.SITE_URL,
        'Content-Type': 'application/json',
        'CF-Connecting-IP': '192.0.2.1',
        ...headers,
      },
      body: JSON.stringify(data),
    });
  const submit = (data) => submitContact(request(data), env, send);
  const row = () => sql.prepare('SELECT * FROM contact_requests').get();
  const retry = () => {
    sql.exec(
      'UPDATE contact_requests SET next_attempt=0,lease_until=0; DELETE FROM contact_limits;',
    );
    return notifyContact(db, row().id, env, send);
  };
  return {
    sql,
    db,
    env,
    input,
    request,
    submit,
    row,
    retry,
    calls,
    mode: (v) => (mode = v),
    verification: (v) => (verification = v),
  };
}

test('contacto válido: valida Turnstile, persiste primeiro e envia apenas à equipa', async () => {
  const f = fixture();
  const response = await f.submit(f.input());
  assert.equal(response.status, 201);
  assert.equal(f.row().notification_status, 'sent');
  assert.equal(f.row().resend_id, 'email-test');
  const mail = JSON.parse(f.calls[0].body);
  assert.deepEqual(mail.to, ['team@example.test']);
  assert.equal(mail.reply_to, 'client@example.test');
  assert.match(mail.html, /\/admin\//);
  assert.match(mail.text, /O’Hara/);
  assert.equal(f.calls.length, 1);
  f.sql.close();
});
test('validação rejeita email, consentimento, campos excessivos, tipos e casas desconhecidas', async () => {
  const f = fixture();
  for (const change of [
    { email: 'a\r\nBcc:b@test.com' },
    { consent: false },
    { name: 'x'.repeat(121) },
    { message: '' },
    { request_type: 'bad' },
    { island: 'bad' },
    { houses: ['../../etc'] },
    { houses: 'not-array' },
    { phone: 'javascript:foo' },
  ])
    assert.throws(() => validate({ ...f.input(), ...change }));
  assert.equal(
    (await f.submit({ ...f.input(), houses: ['inexistente'] })).status,
    400,
  );
  assert.equal(f.row(), undefined);
  assert.equal(
    (
      await submitContact(
        f.request(f.input(), { Origin: 'https://evil.test' }),
        f.env,
      )
    ).status,
    403,
  );
  assert.equal(
    (
      await submitContact(
        f.request({ ...f.input(), message: 'x'.repeat(25000) }),
        f.env,
      )
    ).status,
    400,
  );
  f.sql.close();
});
test('Turnstile: inválido, expirado, action, hostname e reutilização', async () => {
  const f = fixture();
  for (const verification of [
    { success: false },
    { hostname: 'evil.test' },
    { action: 'other' },
    { challenge_ts: 'invalid' },
    { challenge_ts: new Date(Date.now() - 301000).toISOString() },
  ]) {
    f.verification(verification);
    assert.equal((await f.submit(f.input())).status, 400);
    assert.equal(f.row(), undefined);
  }
  f.verification({});
  const input = f.input();
  assert.equal((await f.submit(input)).status, 201);
  assert.equal(
    (await f.submit(input)).status,
    400,
    'mesmo token rejeitado mesmo se Siteverify aceitar',
  );
  assert.equal(f.calls.length, 1);
  f.sql.close();
});
test('repetição com novo token e corrida de submissões não duplica pedidos ou notificações', async () => {
  const f = fixture(),
    data = f.input();
  const responses = await Promise.all([
    f.submit(data),
    f.submit({ ...data, token: crypto.randomUUID() }),
  ]);
  assert.ok(responses.every((r) => [200, 201].includes(r.status)));
  const replay = await f.submit({
    ...data,
    id: crypto.randomUUID(),
    token: crypto.randomUUID(),
  });
  assert.equal(replay.status, 200);
  assert.equal((await replay.json()).id, data.id);
  assert.equal(
    (
      await f.submit({
        ...data,
        message: 'Alterada',
        token: crypto.randomUUID(),
      })
    ).status,
    409,
  );
  assert.equal(
    f.sql.prepare('SELECT count(*) n FROM contact_requests').get().n,
    1,
  );
  assert.equal(f.calls.length, 1);
  f.sql.close();
});
test('rate limit partilhado em D1', async () => {
  const f = fixture();
  f.verification({ success: false });
  for (let i = 0; i < 10; i++)
    assert.equal((await f.submit(f.input())).status, 400);
  assert.equal((await f.submit(f.input())).status, 429);
  assert.equal(f.row(), undefined);
  f.sql.close();
});
test('Resend 429/500/timeout: nenhum pedido perdido; retry guarda payload e chave, limita concorrência', async () => {
  for (const mode of ['429', '500', 'throw']) {
    const f = fixture();
    f.mode(mode);
    assert.equal((await f.submit(f.input())).status, 201);
    assert.equal(f.row().notification_status, 'failed');
    assert.equal(
      (await notifyContact(f.db, f.row().id, f.env, f.calls)).ok,
      false,
      'cooldown',
    );
    f.env.CONTACT_TO_EMAIL = 'changed@example.test';
    f.mode('ok');
    await Promise.all([
      f.retry(),
      notifyContact(f.db, f.row().id, f.env, () => {
        throw Error('must not race');
      }),
    ]);
    assert.equal(f.row().notification_status, 'sent');
    assert.equal(f.calls.length, 2);
    assert.equal(f.calls[0].body, f.calls[1].body);
    assert.equal(
      f.calls[0].headers['Idempotency-Key'],
      f.calls[1].headers['Idempotency-Key'],
    );
    assert.equal((await f.retry()).ok, true);
    assert.equal(f.calls.length, 2);
    f.sql.close();
  }
});
test('não repete depois do prazo seguro; ausência de Resend preserva pendente', async () => {
  const f = fixture();
  delete f.env.RESEND_API_KEY;
  await f.submit(f.input());
  assert.equal(f.row().notification_status, 'pending');
  f.env.RESEND_API_KEY = 'test';
  f.mode('throw');
  await f.retry();
  f.sql.exec('UPDATE contact_requests SET first_attempt=1');
  assert.equal((await f.retry()).ok, false);
  assert.equal(f.row().notification_status, 'uncertain');
  assert.equal(f.calls.length, 1);
  f.sql.close();
});
test('template escapa HTML, destinatário temporário configurável e CSV seguro', () => {
  const f = fixture();
  const mail = emailPayload(
    {
      id: 'test',
      name: '<img src=x onerror=alert(1)>',
      email: 'client@example.test',
      houses: '[]',
      message: '<script>alert(1)</script>',
    },
    { ...f.env, CONTACT_TEST_TO_EMAIL: 'temporary@example.test' },
  );
  assert.deepEqual(mail.to, ['temporary@example.test']);
  assert.ok(!mail.html.includes('<script>'));
  assert.ok(!mail.html.includes('<img'));
  for (const s of ['=1+1', '+cmd', '-1', '@SUM(1)', ' \t=1', '\tfoo', '\nfoo'])
    assert.ok(csvCell(s).startsWith('"\''));
  assert.equal(csvCell('Olá "teste"'), '"Olá ""teste"""');
  f.sql.close();
});
test('admin pesquisa, filtros, detalhe, estados, concorrência, exportação e eliminação', async () => {
  const f = fixture();
  await f.submit(f.input());
  const id = f.row().id;
  const get = (action, query = '') =>
    adminContacts(
      new Request(f.env.SITE_URL + '/admin/' + action + '/?' + query),
      f.env,
      action,
    );
  const post = (action, body) =>
    adminContacts(
      new Request(f.env.SITE_URL + '/admin/' + action + '/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }),
      f.env,
      action,
    );
  let list = await (
    await get(
      'contactos',
      'q=Cliente&estado=new&ilha=S%C3%A3o+Miguel&desde=2020-01-01&ate=2099-01-01&casa=ohara-734-com-terraco-t2',
    )
  ).json();
  assert.equal(list.total, 1);
  assert.equal(list.newCount, 1);
  assert.equal(
    (await (await get('contactos', 'q=inexistente')).json()).total,
    0,
  );
  const detail = await (await get('contacto', 'id=' + id)).json();
  assert.equal(detail.email_payload, undefined);
  assert.equal(
    (
      await post('contactos-guardar', {
        id,
        revision: 1,
        status: 'working',
        notes: '=HYPERLINK("evil")',
      })
    ).status,
    200,
  );
  assert.equal(
    (
      await post('contactos-guardar', {
        id,
        revision: 1,
        status: 'answered',
        notes: '',
      })
    ).status,
    409,
  );
  const csv = await (await get('contactos-exportar')).text();
  assert.ok(csv.includes('"\'=HYPERLINK'));
  assert.equal(
    (await post('contactos-eliminar', { id, revision: 2, confirm: id })).status,
    409,
  );
  await post('contactos-guardar', {
    id,
    revision: 2,
    status: 'archived',
    notes: '',
  });
  assert.equal(
    (await post('contactos-eliminar', { id, revision: 3, confirm: 'wrong' }))
      .status,
    400,
  );
  assert.equal(
    (await post('contactos-eliminar', { id, revision: 3, confirm: id })).status,
    200,
  );
  assert.equal(f.row(), undefined);
  f.sql.close();
});
