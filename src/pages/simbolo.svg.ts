import type { APIRoute } from 'astro';
export const GET: APIRoute = () =>
  new Response(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect width="48" height="48" rx="6" fill="#173e32"/><path d="M5 37 22 6h4l17 31h-6L24 13 11 37zm11 0 8-15 8 15h-5l-3-6-3 6z" fill="#f1eedf"/></svg>',
    { headers: { 'Content-Type': 'image/svg+xml' } },
  );
