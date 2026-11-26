import { env as bindings } from 'cloudflare:workers';
import { defineMiddleware } from 'astro:middleware';
export const onRequest = defineMiddleware(async (ctx, next) => {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const path = new URL(ctx.request.url).pathname.slice(base.length);
  ctx.locals.contactBackend = true;
  ctx.locals.turnstileSiteKey = bindings.TURNSTILE_SITE_KEY || '';
  if (!/^\/(admin|images|api\/contactos)(\/|$)/.test(path)) {
    const { results } = await bindings.DB.prepare(
      "SELECT data FROM inventory WHERE state='live' ORDER BY rowid",
    ).all();
    ctx.locals.houses = results.map((row) => JSON.parse(row.data));
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
