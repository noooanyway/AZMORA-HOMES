import type { APIRoute } from 'astro';
import { houses, url, detail, preview } from '../lib/site';
export const GET: APIRoute = ({ site }) => {
  const routes = preview
    ? []
    : [
        ...[
          '',
          'casas/',
          'sobre/',
          'contactos/',
          'privacidade/',
          'termos/',
        ].map((p) => url(p)),
        ...houses.map(detail),
      ];
  return new Response(
    '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' +
      routes
        .map((p) => '<url><loc>' + new URL(p, site).href + '</loc></url>')
        .join('') +
      '</urlset>',
    { headers: { 'Content-Type': 'application/xml' } },
  );
};
