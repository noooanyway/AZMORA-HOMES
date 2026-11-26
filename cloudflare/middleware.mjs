import { publicModels } from './public-models.mjs';
import { env as bindings } from 'cloudflare:workers';
import { defineMiddleware } from 'astro:middleware';
export const onRequest = defineMiddleware(async (ctx, next) => {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const path = new URL(ctx.request.url).pathname.slice(base.length);
  ctx.locals.contactBackend = true;
  ctx.locals.turnstileSiteKey = bindings.TURNSTILE_SITE_KEY || '';
  if (!/^\/(admin|images|api\/contactos)(\/|$)/.test(path)) {
    let results;
    try {
      ({ results } = await bindings.DB.prepare(
        "SELECT i.data, (SELECT seq FROM inventory_commercial_history h WHERE h.inventory_id=i.id AND h.new_state='vendido' ORDER BY seq DESC LIMIT 1) sale_order FROM inventory i WHERE i.state='live' ORDER BY i.rowid",
      ).all());
    } catch (error) {
      if (!String(error?.message || '').includes('no such table: inventory_commercial_history')) throw error;
      ({ results } = await bindings.DB.prepare("SELECT data FROM inventory WHERE state='live' ORDER BY rowid").all());
    }
    const catalog = publicModels(results.map((row) => ({ ...JSON.parse(row.data), sale_order: row.sale_order ?? null })));
    ctx.locals.houses = catalog.houses;
    const requestedSlug = /^\/casas\/([^/]+)\/?$/.exec(path)?.[1];
    if (requestedSlug && catalog.aliases.has(requestedSlug)) {
      return new Response(null, {status:302,headers:{Location:base + '/casas/' + catalog.aliases.get(requestedSlug) + '/', 'Cache-Control':'no-store'}});
    }
    // During rollout older databases have no settings table; use the built-in values.
    try {
      const settings = await bindings.DB.prepare('SELECT published FROM site_settings WHERE id=1').first();
      if (settings) ctx.locals.siteSettings = JSON.parse(settings.published);
    } catch { ctx.locals.siteSettings = {}; }
  }
  let response = await next();
  response.headers.set('Cache-Control', 'private, no-store');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()',
  );
  if (path.startsWith('/admin'))
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  if (
    !path.startsWith('/admin') &&
    response.headers.get('Content-Type')?.includes('text/html')
  ) {
    const nonce = crypto.randomUUID();
    response = new HTMLRewriter()
      .on('script', {
        element(element) {
          element.setAttribute('nonce', nonce);
        },
      })
      .transform(response);
    response.headers.set(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'nonce-" +
        nonce +
        "' https://challenges.cloudflare.com; frame-src https://challenges.cloudflare.com; connect-src 'self' https://challenges.cloudflare.com; img-src 'self' data:; style-src 'self' 'unsafe-inline'; font-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'",
    );
  }
  return response;
});
