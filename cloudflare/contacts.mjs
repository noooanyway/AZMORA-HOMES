import { limited } from './inventory.mjs';

export const islands = [
  'São Miguel',
  'Santa Maria',
  'Terceira',
  'Graciosa',
  'São Jorge',
  'Pico',
  'Faial',
  'Flores',
  'Corvo',
  'Madeira',
  'Porto Santo',
  'Outro',
];
const types = [
  'contacto',
  'preco',
  'orcamento',
  'visita',
  'transporte',
  'ficha',
  'escolha',
  'outro',
];
export const statuses = ['new', 'working', 'answered', 'archived'];
const uuid =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const validEmail = (s) =>
  typeof s === 'string' &&
  s.length <= 254 &&
  /^[^\s<>@,;]+@[^\s<>@,;]+\.[^\s<>@,;]+$/.test(s);
const reply = (message, status = 400) => Response.json({ message }, { status });
const now = () => Math.floor(Date.now() / 1000);
const digest = async (value) =>
  Array.from(
    new Uint8Array(
      await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)),
    ),
    (b) => b.toString(16).padStart(2, '0'),
  ).join('');
export function validate(input) {
  if (
    !input ||
    typeof input !== 'object' ||
    !uuid.test(input.id || '') ||
    input.consent !== true ||
    input.honeypot
  )
    throw Error('Reveja os campos obrigatórios e a política de privacidade.');
  const text = (key, max, required = false) => {
    const value = input[key] ?? '';
    if (
      typeof value !== 'string' ||
      value.length > max ||
      /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value) ||
      (required && !value.trim())
    )
      throw Error('Reveja o campo ' + key + '.');
    return value.trim();
  };
  const data = {
    name: text('name', 120, true),
    email: text('email', 254, true).toLowerCase(),
    phone: text('phone', 32),
    island: text('island', 30),
    locality: text('locality', 100),
    typology: text('typology', 20),
    request_type: text('request_type', 20, true),
    message: text('message', 4000, true),
  };
  if (
    !validEmail(data.email) ||
    /[\r\n]/.test(data.name) ||
    (data.phone && !/^[+()\d\s.-]{6,32}$/.test(data.phone)) ||
    (data.island && !islands.includes(data.island)) ||
    !types.includes(data.request_type)
  )
    throw Error('Verifique o email, telefone e motivo do pedido.');
  if (
    !Array.isArray(input.houses) ||
    input.houses.length > 16 ||
    input.houses.some(
      (s) => typeof s !== 'string' || !/^[a-z0-9-]{1,150}$/.test(s),
    )
  )
    throw Error('Seleção de casas inválida.');
  data.houses = [...new Set(input.houses)].sort();
  return data;
}
export async function jsonBody(request, size = 24000) {
  if (request.headers.get('Content-Type')?.split(';')[0] !== 'application/json')
    throw Error('Formato de pedido inválido.');
  return JSON.parse(new TextDecoder().decode(await limited(request, size)));
}
async function budget(db, key, limit, seconds) {
  const time = now(),
    bucket = key + ':' + Math.floor(time / seconds);
  const result = await db
    .prepare(
      'INSERT INTO contact_limits(key,count,expires) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1 WHERE count < ? RETURNING count',
    )
    .bind(bucket, time + seconds, limit)
    .first();
  return !!result;
}
export async function submitContact(request, env, send = fetch) {
  if (request.method !== 'POST') return reply('Método inválido.', 405);
  const origin = new URL(request.url).origin;
  if (request.headers.get('Origin') !== origin || origin !== env.SITE_URL)
    return reply('Origem do pedido inválida.', 403);
  if (!env.DB || !env.TURNSTILE_SECRET_KEY)
    return reply('O envio está temporariamente indisponível.', 503);
  let input, data;
  try {
    input = await jsonBody(request);
    data = validate(input);
  } catch (e) {
    return reply(e instanceof SyntaxError ? 'Pedido inválido.' : e.message);
  }
  if (
    typeof input.token !== 'string' ||
    !input.token ||
    input.token.length > 2048
  )
    return reply('Conclua a verificação de segurança.');
  const db = env.DB;
  // HMAC with the server-only secret; no raw IP is stored. Daily rotation limits linkability.
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(env.TURNSTILE_SECRET_KEY),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signed = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(
      Math.floor(now() / 86400) +
        ':' +
        (request.headers.get('CF-Connecting-IP') || 'unknown'),
    ),
  );
  const ip = Array.from(new Uint8Array(signed), (b) =>
    b.toString(16).padStart(2, '0'),
  ).join('');
  await db.batch([
    db.prepare('DELETE FROM contact_limits WHERE expires < ?').bind(now()),
    db.prepare('DELETE FROM contact_tokens WHERE expires < ?').bind(now()),
  ]);
  if (
    !(await budget(db, 'ip:' + ip, 10, 600)) ||
    !(await budget(db, 'public', 500, 86400))
  )
    return reply('Recebemos demasiados pedidos. Aguarde alguns minutos.', 429);
  let result;
  try {
    const response = await send(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          secret: env.TURNSTILE_SECRET_KEY,
          response: input.token,
          remoteip: request.headers.get('CF-Connecting-IP') || undefined,
        }),
        signal: AbortSignal.timeout(8000),
      },
    );
    result = await response.json();
    if (!response.ok) throw Error();
  } catch {
    return reply(
      'Não foi possível verificar a segurança. Tente novamente.',
      503,
    );
  }
  if (
    !result.success ||
    result.hostname !== new URL(origin).hostname ||
    result.action !== 'contact' ||
    !Number.isFinite(Date.parse(result.challenge_ts)) ||
    Date.now() - Date.parse(result.challenge_ts) > 300000 ||
    Date.parse(result.challenge_ts) > Date.now() + 30000
  )
    return reply('A verificação expirou ou é inválida. Tente novamente.');
  // Siteverify replay detection is eventually consistent; D1 enforces single use atomically.
  const used = await db
    .prepare(
      'INSERT INTO contact_tokens(hash,expires) VALUES(?,?) ON CONFLICT DO NOTHING',
    )
    .bind(await digest(input.token), now() + 600)
    .run();
  if (!used.meta.changes)
    return reply('A verificação já foi utilizada. Tente novamente.');
  const hash = await digest(JSON.stringify(data));
  const existing = await db
    .prepare(
      'SELECT id,payload_hash FROM contact_requests WHERE id=? OR dedupe_key=?',
    )
    .bind(input.id, Math.floor(now() / 86400) + ':' + hash)
    .first();
  if (existing)
    return existing.payload_hash === hash
      ? Response.json({ ok: true, id: existing.id })
      : reply('O pedido foi alterado. Atualize a página antes de enviar.', 409);
  const houses = [];
  for (const slug of data.houses) {
    const house = await db
      .prepare("SELECT data FROM inventory WHERE slug=? AND state='live'")
      .bind(slug)
      .first();
    if (!house)
      return reply(
        'Uma casa selecionada já não está disponível. Atualize a seleção.',
      );
    houses.push({ slug, name: JSON.parse(house.data).name_for_site });
  }
  const saved = await db
    .prepare(
      'INSERT INTO contact_requests(id,payload_hash,dedupe_key,name,email,phone,island,locality,houses,typology,request_type,message) VALUES(?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT DO NOTHING',
    )
    .bind(
      input.id,
      hash,
      Math.floor(now() / 86400) + ':' + hash,
      data.name,
      data.email,
      data.phone,
      data.island,
      data.locality,
      JSON.stringify(houses),
      data.typology,
      data.request_type,
      data.message,
    )
    .run();
  if (!saved.meta.changes) {
    const row = await db
      .prepare(
        'SELECT id,payload_hash FROM contact_requests WHERE id=? OR dedupe_key=?',
      )
      .bind(input.id, Math.floor(now() / 86400) + ':' + hash)
      .first();
    return row?.payload_hash === hash
      ? Response.json({ ok: true, id: row.id })
      : reply('O pedido foi alterado. Atualize a página.', 409);
  }
  // The durable request exists before any attempt to notify. Email failure cannot undo it.
  try {
    await notifyContact(db, input.id, env, send);
  } catch {
    /* Durable pending/sending row remains available to the administrator. */
  }
  return Response.json({ ok: true, id: input.id }, { status: 201 });
}
const escape = (s) =>
  String(s ?? '').replace(
    /[&<>"']/g,
    (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[
        c
      ],
  );
export function emailPayload(row, env) {
  const recipient = env.CONTACT_TEST_TO_EMAIL || env.CONTACT_TO_EMAIL;
  if (
    !validEmail(recipient) ||
    !validEmail(env.CONTACT_FROM_EMAIL) ||
    !validEmail(row.email)
  )
    throw Error('configuration');
  const admin = new URL('/admin/', env.SITE_URL).href;
  const houses = JSON.parse(row.houses)
    .map(
      (h) =>
        h.name + ' — ' + new URL('/casas/' + h.slug + '/', env.SITE_URL).href,
    )
    .join('\n');
  const fields = {
    Referência: row.id,
    Nome: row.name,
    Email: row.email,
    Telefone: row.phone,
    Ilha: row.island,
    Localidade: row.locality,
    Motivo:
      {
        contacto: 'Pedido de contacto',
        preco: 'Preço e disponibilidade',
        orcamento: 'Pedido de orçamento',
        visita: 'Informações sobre visitas',
        transporte: 'Transporte e instalação',
        ficha: 'Características de uma casa',
        escolha: 'Ajuda a escolher uma casa',
        outro: 'Outro assunto',
      }[row.request_type] || row.request_type,
    Casas: houses,
    Tipologia: row.typology,
    Mensagem: row.message,
    'Recebido em (UTC)': row.created_at,
  };
  return {
    from: `Azmora Homes <${env.CONTACT_FROM_EMAIL}>`,
    to: [recipient],
    reply_to: row.email,
    subject: '[Azmora Homes] Novo pedido · ' + row.id,
    text:
      Object.entries(fields)
        .map(([k, v]) => k + ': ' + (v || 'Não indicado'))
        .join('\n\n') +
      '\n\nPainel: ' +
      admin,
    html:
      '<!doctype html><html lang="pt-PT"><meta name="viewport" content="width=device-width,initial-scale=1"><body style="font:16px/1.6 Arial,sans-serif;color:#234237;margin:0;padding:20px"><main style="max-width:600px;margin:auto"><h1>Azmora Homes</h1><h2>Novo pedido de contacto</h2>' +
      Object.entries(fields)
        .map(
          ([k, v]) =>
            '<p><strong>' +
            escape(k) +
            '</strong><br><span style="white-space:pre-wrap;overflow-wrap:anywhere">' +
            escape(v || 'Não indicado') +
            '</span></p>',
        )
        .join('') +
      '<p><a href="' +
      escape(admin) +
      '">Consultar pedidos no painel</a></p></main></body></html>',
  };
}
export async function notifyContact(db, id, env, send = fetch) {
  let row = await db
    .prepare('SELECT * FROM contact_requests WHERE id=?')
    .bind(id)
    .first();
  if (!row || row.notification_status === 'sent') return { ok: true };
  const time = now();
  if (row.first_attempt && time - row.first_attempt >= 23 * 3600) {
    await db
      .prepare(
        "UPDATE contact_requests SET notification_status='uncertain',notification_error='Verificar no Resend antes de qualquer novo envio.' WHERE id=? AND notification_status!='sent'",
      )
      .bind(id)
      .run();
    return {
      ok: false,
      message:
        'O prazo de reenvio seguro terminou. Confirme o envio no Resend.',
    };
  }
  if (
    row.attempts >= 5 ||
    row.next_attempt > time ||
    row.lease_until > time ||
    row.notification_status === 'uncertain'
  )
    return {
      ok: false,
      message: 'Aguarde antes de reenviar ou verifique o estado no Resend.',
    };
  if (!env.RESEND_API_KEY)
    return {
      ok: false,
      message: 'Configure o serviço de email. O pedido está guardado.',
    };
  let payload;
  try {
    payload = row.email_payload || JSON.stringify(emailPayload(row, env));
  } catch {
    return { ok: false, message: 'Configure os endereços de notificação.' };
  }
  if (
    !(await budget(db, 'email-day', 80, 86400)) ||
    !(await budget(db, 'email-second', 1, 1))
  )
    return {
      ok: false,
      message: 'Limite de notificações atingido. O pedido continua guardado.',
    };
  row = await db
    .prepare(
      "UPDATE contact_requests SET notification_status='sending',email_payload=COALESCE(email_payload,?),first_attempt=COALESCE(first_attempt,?),lease_until=?,attempts=attempts+1,next_attempt=? WHERE id=? AND notification_status IN ('pending','failed','sending') AND lease_until<=? AND next_attempt<=? AND attempts<5 RETURNING *",
    )
    .bind(
      payload,
      time,
      time + 60,
      time + Math.min(3600, 60 * 2 ** row.attempts),
      id,
      time,
      time,
    )
    .first();
  if (!row) return { ok: false, message: 'Já existe um envio em curso.' };
  try {
    const response = await send('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + env.RESEND_API_KEY,
        'Content-Type': 'application/json',
        'Idempotency-Key': 'contact/' + id,
      },
      body: row.email_payload,
      signal: AbortSignal.timeout(10000),
    });
    const body = await response.json().catch(() => ({}));
    if (response.ok && typeof body.id === 'string') {
      await db
        .prepare(
          "UPDATE contact_requests SET notification_status='sent',resend_id=?,lease_until=0,notification_error=NULL WHERE id=?",
        )
        .bind(body.id, id)
        .run();
      return { ok: true };
    }
    const retryAfter = Number(response.headers.get('Retry-After'));
    await db
      .prepare(
        "UPDATE contact_requests SET notification_status='failed',lease_until=0,notification_error=?,next_attempt=MAX(next_attempt,?) WHERE id=?",
      )
      .bind(
        'HTTP ' + response.status,
        time +
          (Number.isFinite(retryAfter)
            ? Math.min(86400, Math.max(0, retryAfter))
            : 60),
        id,
      )
      .run();
  } catch {
    await db
      .prepare(
        "UPDATE contact_requests SET notification_status='failed',lease_until=0,notification_error='Sem confirmação do serviço' WHERE id=?",
      )
      .bind(id)
      .run();
  }
  return {
    ok: false,
    message: 'A notificação não foi confirmada. O pedido está guardado.',
  };
}
export function csvCell(value) {
  let s = String(value ?? '');
  if (/^[\s\uFEFF]*[=+@-]/.test(s) || /^[\t\r\n]/.test(s)) s = "'" + s;
  return '"' + s.replace(/"/g, '""') + '"';
}
export async function adminContacts(request, env, action, actor = null) {
  const db = env.DB,
    params = new URL(request.url).searchParams;
  if (request.method === 'GET') {
    if (action === 'contacto') {
      const row = await db
        .prepare('SELECT * FROM contact_requests WHERE id=?')
        .bind(params.get('id') || '')
        .first();
      if (!row) return reply('Pedido inexistente.', 404);
      delete row.email_payload;
      delete row.payload_hash;
      delete row.dedupe_key;
      row.history = (await db.prepare('SELECT event,at,actor,old_value,new_value,note FROM contact_history WHERE contact_id=? ORDER BY id DESC LIMIT 500').bind(row.id).all()).results;
      return Response.json(row);
    }
    const filters = [],
      values = [];
    if (params.get('expirados') === '1')
      filters.push("updated_at < datetime('now','-12 months')");
    for (const [param, column] of [
      ['estado', 'status'],
      ['ilha', 'island'],
    ])
      if (params.get(param)) {
        filters.push(column + '=?');
        values.push(params.get(param).slice(0, 100));
      }
    if (params.get('q')) {
      filters.push(
        '(name LIKE ? OR email LIKE ? OR phone LIKE ? OR houses LIKE ?)',
      );
      const q = '%' + params.get('q').slice(0, 120) + '%';
      values.push(q, q, q, q);
    }
    if (params.get('casa')) {
      filters.push(
        "EXISTS(SELECT 1 FROM json_each(houses) WHERE value->>'slug'=?)",
      );
      values.push(params.get('casa').slice(0, 150));
    }
    for (const [param, op, suffix] of [
      ['desde', '>=', ' 00:00:00'],
      ['ate', '<=', ' 23:59:59'],
    ])
      if (params.get(param)) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(params.get(param)))
          return reply('Data inválida.');
        filters.push('created_at ' + op + ' ?');
        values.push(params.get(param) + suffix);
      }
    const where = filters.length ? ' WHERE ' + filters.join(' AND ') : '';
    const offset = Math.max(
      0,
      Math.min(1000000, Number(params.get('offset')) || 0),
    );
    if (action === 'contactos-exportar') {
      const count = await db
        .prepare('SELECT count(*) n FROM contact_requests' + where)
        .bind(...values)
        .first();
      if (count.n > 500)
        return reply('Use filtros para exportar até 500 pedidos de cada vez.');
      const { results } = await db
        .prepare(
          'SELECT id,name,email,phone,island,locality,houses,typology,request_type,message,created_at,status,notes,notification_status,resend_id,updated_at FROM contact_requests' +
            where +
            ' ORDER BY created_at DESC LIMIT 500',
        )
        .bind(...values)
        .all();
      const keys = [
        'id',
        'name',
        'email',
        'phone',
        'island',
        'locality',
        'houses',
        'typology',
        'request_type',
        'message',
        'created_at',
        'status',
        'notes',
        'notification_status',
        'resend_id',
        'updated_at',
      ];
      return new Response(
        '\uFEFF' +
          [
            keys.map(csvCell).join(','),
            ...results.map((r) => keys.map((k) => csvCell(r[k])).join(',')),
          ].join('\r\n'),
        {
          headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition':
              'attachment; filename="pedidos-contacto.csv"',
          },
        },
      );
    }
    if (action !== 'contactos') return reply('Operação inexistente.', 404);
    const [list, count, newCount, choices] = await db.batch([
      db
        .prepare(
          'SELECT id,name,email,phone,island,houses,request_type,created_at,status,notification_status FROM contact_requests' +
            where +
            ' ORDER BY created_at DESC,id DESC LIMIT 50 OFFSET ?',
        )
        .bind(...values, offset),
      db
        .prepare('SELECT count(*) n FROM contact_requests' + where)
        .bind(...values),
      db.prepare("SELECT count(*) n FROM contact_requests WHERE status='new'"),
      db.prepare(
        "SELECT DISTINCT value->>'slug' slug,value->>'name' name FROM contact_requests,json_each(houses) ORDER BY name",
      ),
    ]);
    return Response.json({
      rows: list.results,
      total: count.results[0].n,
      newCount: newCount.results[0].n,
      houses: choices.results,
    });
  }
  if (request.method !== 'POST') return reply('Método inválido.', 405);
  let input;
  try {
    input = await jsonBody(request);
    if (!input || !uuid.test(input.id || '')) throw Error();
  } catch {
    return reply('Pedido inválido.');
  }
  if (action === 'contactos-reenviar') {
    const exists = await db
      .prepare('SELECT id FROM contact_requests WHERE id=?')
      .bind(input.id)
      .first();
    if (!exists) return reply('Pedido inexistente.', 404);
    await db.prepare("INSERT INTO contact_history(contact_id,event,actor) SELECT id,'retry',? FROM contact_requests WHERE id=?").bind(actor,input.id).run();
    const result = await notifyContact(db, input.id, env);
    return Response.json(result, { status: result.ok ? 200 : 409 });
  }
  if (action === 'contactos-acao') {
    if (!['zoho','whatsapp'].includes(input.kind)) return reply('Ação inválida.');
    const result = await db.prepare("INSERT INTO contact_history(contact_id,event,actor) SELECT id,?,? FROM contact_requests WHERE id=?").bind(input.kind,actor,input.id).run();
    return result.meta.changes ? Response.json({ok:true}) : reply('Pedido inexistente.',404);
  }
  if (!Number.isInteger(input.revision))
    return reply('Reabra o pedido antes de guardar.');
  if (action === 'contactos-guardar') {
    if (
      !statuses.includes(input.status) ||
      typeof input.notes !== 'string' ||
      input.notes.length > 5000
    )
      return reply('Estado ou notas inválidos.');
    const result = await db
      .prepare(
        'UPDATE contact_requests SET history_actor=?,status=?,new_note=?,revision=revision+1,updated_at=CURRENT_TIMESTAMP WHERE id=? AND revision=?',
      )
      .bind(actor, input.status, input.notes.trim(), input.id, input.revision)
      .run();
    return result.meta.changes
      ? Response.json({ ok: true })
      : reply('O pedido foi alterado. Reabra-o.', 409);
  }
  if (action === 'contactos-eliminar') {
    if (input.confirm !== input.id)
      return reply('Confirme a referência completa para eliminar.');
    const result = await db
      .prepare(
        "DELETE FROM contact_requests WHERE id=? AND revision=? AND status='archived' AND notification_status!='sending'",
      )
      .bind(input.id, input.revision)
      .run();
    return result.meta.changes
      ? Response.json({ ok: true })
      : reply(
          'Arquive o pedido e confirme que não existe um envio em curso.',
          409,
        );
  }
  return reply('Operação inexistente.', 404);
}
