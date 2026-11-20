import renderer from './entry.mjs';

// Only the project's public routes and protected inventory reach the SSR renderer.
export default {
  async fetch(request, env, ctx) {
    const u = new URL(request.url),
      base = BASE_PATH_FOR_BUILD;
    if (u.origin !== PUBLIC_ORIGIN_FOR_BUILD && u.origin !== env.ADMIN_ORIGIN)
      return new Response(null, { status: 404 });
    if (base && u.pathname === '/')
      return Response.redirect(u.origin + base + '/', 302);
    if (base && ['/admin', '/admin/'].includes(u.pathname))
      return Response.redirect(u.origin + base + '/admin/', 302);
    const path = u.pathname.slice(base.length);
    if (
      !u.pathname.startsWith(base + '/') ||
      !/^\/(?:|(?:casas(?:\/[a-z0-9-]+)?|contactos|comparar|favoritos|sobre|privacidade|termos|404|api\/casas|admin(?:\/(?:dados|foto|upload|guardar|eliminar))?)\/?|sitemap\.xml|images\/(?:uploads|casas\/[a-z0-9-]+)\/[a-z0-9-]+\.(?:webp|avif)\/?)$/.test(
        path,
      )
    )
      return new Response(null, { status: 404 });
    if (!path.startsWith('/admin') && !['GET', 'HEAD'].includes(request.method))
      return new Response(null, { status: 405 });
    if(path.startsWith('/images/') && !path.endsWith('/')){
      u.pathname += '/';
      return renderer.fetch(new Request(u,request),env,ctx);
    }
    return renderer.fetch(request, env, ctx);
  },
};
