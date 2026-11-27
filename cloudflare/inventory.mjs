import { z } from 'astro/zod';
const short = z.string().trim().max(250);
const note = z.string().trim().max(5000).nullable();
const number = z.number().min(0).max(1e8).nullable();
const count = z.number().int().min(0).max(100).nullable();
const path = z
  .string()
  .max(220)
  .regex(/^images\/(?:casas\/[a-z0-9-]+|uploads)\/[a-z0-9-]+\.(?:webp|avif|jpg)$/);
const picture = z.object({
  src: path,
  small: path,
  cover: path.optional(),
  width: z.number().int().positive().max(12000),
  height: z.number().int().positive().max(12000),
  alt: short.min(1),
});
export const fields = z.object({
  name_for_site: short.min(1),
  brand: short.min(1),
  model: short.nullable(),
  reference_azmora: short.nullable(),
  inventory_group: z.string().trim().max(120).nullable().optional(),
  description_azmora: note,
  typology: short.nullable(),
  year: z.number().int().min(1900).max(2100).nullable(),
  area_m2: number,
  dimensions_m: z.object({ length: number, width: number }),
  bedrooms: count,
  bathrooms: count,
  bathroom_count_minimum: count.optional(),
  bathroom_layout: note.optional(),
  bedroom_sleeping_places: count.optional(),
  model_measure_reference: z
    .object({
      length: short.optional(),
      width: short.optional(),
      area: short.optional(),
      note: note.optional(),
    })
    .optional(),
  equipment_summary: z.array(short.min(1)).max(80),
  condition: short.nullable(),
  // Unknown legacy values may only be preserved unchanged by the admin endpoint.
  availability: z.string().trim().max(100).nullable(),
  public_price_eur: number,
  featured: z.boolean().optional(),
  seo_title: short.optional(),
  seo_description: short.optional(),
  media: z.array(picture).max(40),
});
export async function limited(request, max) {
  const reader = request.body?.getReader();
  if (!reader) throw Error('Pedido vazio.');
  const chunks = [];
  let length = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    length += value.length;
    if (length > max) {
      await reader.cancel();
      throw Error('Ficheiro ou pedido demasiado grande.');
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  return bytes;
}
export function dimensions(bytes) {
  const v = new DataView(bytes.buffer, bytes.byteOffset, bytes.length),
    tag = (i) => String.fromCharCode(...bytes.slice(i, i + 4));
  if (
    bytes.length < 30 ||
    tag(0) !== 'RIFF' ||
    tag(8) !== 'WEBP' ||
    v.getUint32(4, true) + 8 !== bytes.length
  )
    throw Error('Imagem WebP inválida.');
  const size = v.getUint32(16, true);
  if (20 + size + (size % 2) !== bytes.length)
    throw Error('Utilize uma fotografia simples.');
  let width, height;
  if (
    tag(12) === 'VP8 ' &&
    bytes[23] === 157 &&
    bytes[24] === 1 &&
    bytes[25] === 42
  ) {
    width = v.getUint16(26, true) & 16383;
    height = v.getUint16(28, true) & 16383;
  } else if (tag(12) === 'VP8L' && bytes[20] === 47) {
    const bits = v.getUint32(21, true);
    width = 1 + (bits & 16383);
    height = 1 + ((bits >>> 14) & 16383);
  }
  if (!width || !height || Math.max(width, height) > 1800)
    throw Error('Dimensões inválidas.');
  return { width, height };
}

export function stripMetadata(bytes) {
 const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.length);
 const tag = i => String.fromCharCode(...bytes.slice(i,i+4));
 if (bytes.length < 20 || tag(0)!=='RIFF' || tag(8)!=='WEBP' || view.getUint32(4,true)+8!==bytes.length) throw Error('Imagem inválida.');
 let frame;
 for(let pos=12;pos<bytes.length;){
   if(pos+8>bytes.length)throw Error('Imagem incompleta.');
   const kind=tag(pos), size=view.getUint32(pos+4,true),end=pos+8+size+(size%2);
   if(end>bytes.length)throw Error('Imagem incompleta.');
   if(['VP8 ','VP8L'].includes(kind)){
     if(frame)throw Error('Escolha uma imagem fixa.');
     frame=bytes.subarray(pos,end);
   }else if(!['VP8X','ICCP','EXIF','XMP '].includes(kind))throw Error('Formato de fotografia inválido.');
   pos=end;
 }
 if(!frame)throw Error('Fotografia sem imagem.');
 const clean=new Uint8Array(12+frame.length);
 clean.set(bytes.subarray(0,12));clean.set(frame,12);
 new DataView(clean.buffer).setUint32(4,clean.length-8,true);
 return clean;
}
