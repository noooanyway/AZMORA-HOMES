export const GET = async ({ locals, params }) => {
  const key = 'images/' + params.key.replace(/\/$/,'');
  const { DB, PHOTOS } = locals.runtime.env;
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
          'Content-Type': key.endsWith('.avif') ? 'image/avif' : 'image/webp',
        },
      })
    : new Response(null, { status: 404 });
};
