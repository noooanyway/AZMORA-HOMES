import { env as bindings } from 'cloudflare:workers';
import { authorize } from './access.mjs';
import { fields, limited, dimensions, stripMetadata } from './inventory.mjs';
import html from './panel.html?raw';
const reply = (message, status) => Response.json({ message }, { status });
export const ALL = async ({ request, params }) => {
  const env = bindings,
    actor = await authorize(request, env);
  if (!actor) return reply('Acesso reservado à administração.', 403);
  const action = params.action?.replace(/\/$/, '') || '',
    db = env.DB;
  if (request.method === 'GET') {
    if (!action) {
      const nonce = crypto.randomUUID();
      return new Response(
        html.replace(
          '<script type="module">',
          '<script nonce="' + nonce + '" type="module">',
        ),
        {
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'X-Frame-Options': 'DENY',
            'Referrer-Policy': 'no-referrer',
            'Content-Security-Policy':
              "default-src 'none'; script-src 'nonce-" +
              nonce +
              "'; style-src 'unsafe-inline'; img-src 'self'; connect-src 'self'; form-action 'none'; frame-ancestors 'none'; base-uri 'none'",
          },
        },
      );
    }
    if (action === 'dados') {
      const [units, events] = await db.batch([
        db.prepare('SELECT * FROM inventory ORDER BY rowid'),
        db.prepare('SELECT * FROM activity ORDER BY seq DESC LIMIT 20'),
      ]);
      return Response.json({
        units: units.results.map((r) => ({ ...r, data: JSON.parse(r.data) })),
        events: events.results,
      });
    }
    if (action === 'foto') {
      const key = new URL(request.url).searchParams.get('key') || '';
      if (!/^images\/[a-z0-9/-]+\.(webp|avif)$/.test(key))
        return reply('Fotografia inválida.', 400);
      const file = await env.PHOTOS.get(key);
      return file
        ? new Response(file.body, {
            headers: {
              'Content-Type': key.endsWith('avif')
                ? 'image/avif'
                : 'image/webp',
            },
          })
        : reply('Fotografia em falta.', 404);
    }
    return reply('Página inexistente.', 404);
  }
  if (request.method !== 'POST') return reply('Método inválido.', 405);
  if (action === 'upload') {
    if (request.headers.get('Content-Type') !== 'image/webp')
      return reply('Formato inválido.', 415);
    let bytes, dim;
    try {
      bytes = stripMetadata(await limited(request, 3 * 1024 * 1024));
      dim = dimensions(bytes);
    } catch (e) {
      return reply(e.message, 400);
    }
    const path = 'images/uploads/' + crypto.randomUUID() + '.webp';
    await env.PHOTOS.put(path, bytes, {
      httpMetadata: { contentType: 'image/webp' },
    });
    await db
      .prepare('INSERT INTO uploads VALUES(?,?,?)')
      .bind(path, dim.width, dim.height)
      .run();
    return Response.json({ src: path, small: path, ...dim, alt: '' });
  }
  if (request.headers.get('Content-Type') !== 'application/json')
    return reply('Formato inválido.', 415);
  let input;
  try {
    input = JSON.parse(
      new TextDecoder().decode(await limited(request, 100000)),
    );
    if (!input || typeof input !== 'object') throw Error();
  } catch {
    return reply('Pedido inválido.', 400);
  }
  const existing =
    typeof input.id === 'string'
      ? await db
          .prepare('SELECT * FROM inventory WHERE id=?')
          .bind(input.id)
          .first()
      : null;
  if (input.id && !existing) return reply('Casa inexistente.', 404);
  if (existing && existing.revision !== input.revision)
    return reply('A ficha foi alterada. Reabra-a antes de guardar.', 409);
  if (action === 'eliminar') {
    if (
      !existing ||
      existing.state !== 'archived' ||
      input.confirm !== existing.slug
    )
      return reply('Confirme a referência da casa arquivada.', 400);
    const [, removed] = await db.batch([
      db
        .prepare(
          "INSERT INTO activity(unit,action,actor) SELECT slug,'eliminada',? FROM inventory WHERE id=? AND revision=? AND state='archived'",
        )
        .bind(actor, existing.id, existing.revision),
      db
        .prepare(
          "DELETE FROM inventory WHERE id=? AND revision=? AND state='archived'",
        )
        .bind(existing.id, existing.revision),
    ]);
    return removed.meta.changes
      ? Response.json({ ok: true })
      : reply('A ficha foi alterada.', 409);
  }
  if (action !== 'guardar') return reply('Operação inexistente.', 404);
  const parsed = fields.safeParse(input.data);
  if (!parsed.success)
    return reply(
      'Reveja os campos da ficha e as legendas das fotografias.',
      400,
    );
  const state = input.state;
  if (
    !['draft', 'live', 'archived'].includes(state) ||
    (state === 'live' && !parsed.data.media.length)
  )
    return reply(
      'Escolha um estado válido e adicione uma fotografia antes de publicar.',
      400,
    );
  const id = existing?.id || crypto.randomUUID(),
    slug =
      existing?.slug ||
      parsed.data.name_for_site
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 64) +
        '-' +
        id.slice(0, 8);
  const old = existing ? JSON.parse(existing.data) : {};
  for (const field of Object.keys(fields.shape)) delete old[field];
  const paths = [
    ...new Set(
      parsed.data.media.flatMap((m) =>
        [m.src, m.small, m.cover].filter(Boolean),
      ),
    ),
  ];
  const missing = await db
    .prepare(
      'SELECT value FROM json_each(?) WHERE value NOT IN (SELECT path FROM uploads) LIMIT 1',
    )
    .bind(JSON.stringify(paths))
    .first();
  if (missing) return reply('Uma fotografia não pertence ao inventário.', 400);
  const data = {
    ...old,
    ...parsed.data,
    id,
    media_slug: slug,
    publish: state === 'live',
    catalogue_preview_allowed: false,
  };
  const result = existing
    ? await db
        .prepare(
          'UPDATE inventory SET data=?,state=?,actor=?,revision=revision+1,updated=CURRENT_TIMESTAMP WHERE id=? AND revision=?',
        )
        .bind(JSON.stringify(data), state, actor, id, existing.revision)
        .run()
    : await db
        .prepare(
          'INSERT INTO inventory(id,slug,data,state,actor) VALUES(?,?,?,?,?)',
        )
        .bind(id, slug, JSON.stringify(data), state, actor)
        .run();
  return result.meta.changes
    ? Response.json({ ok: true, id })
    : reply('A ficha foi alterada. Reabra-a.', 409);
};
