import { env as bindings } from 'cloudflare:workers';
export const GET = async ({ params }) => {
  const key = 'images/' + params.key.replace(/\/$/,'');
  const { DB, PHOTOS } = bindings;
  const row = await DB.prepare(
    "SELECT 1 FROM inventory i,json_each(i.data,'$.media') m WHERE i.state='live' AND ? IN (m.value->>'src',m.value->>'small',m.value->>'cover') LIMIT 1",
  )
    .bind(key)
    .first();
  if (!row) return new Response(null, { status: 404 });
  const photo = await PHOTOS.get(key);
  return photo
    ? new Response(photo.body, {
        headers: {
          'Content-Type': key.endsWith('.avif') ? 'image/avif' : key.endsWith('.jpg') ? 'image/jpeg' : 'image/webp',
        },
      })
    : new Response(null, { status: 404 });
};
