import { defineMiddleware } from 'astro:middleware';
export const onRequest = defineMiddleware(async (ctx, next) => {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const path = new URL(ctx.request.url).pathname.slice(base.length);
  if (!/^\/(admin|images)(\/|$)/.test(path)) {
    const { results } = await ctx.locals.runtime.env.DB.prepare(
      "SELECT data FROM inventory WHERE state='live' ORDER BY rowid",
    ).all();
    ctx.locals.houses = results.map((row) => JSON.parse(row.data));
  }
  const response = await next();
  response.headers.set('Cache-Control', 'private, no-store');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  return response;
});
