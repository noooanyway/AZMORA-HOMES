export interface House {
  id: string;
  media_slug: string;
  featured?: boolean;
  seo_title?: string;
  seo_description?: string;
  brand: string;
  model: string | null;
  name_for_site: string;
  typology: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  bathroom_count_minimum?: number;
  bathroom_layout?: string;
  bedroom_sleeping_places?: number;
  dimensions_m: { length: number | null; width: number | null };
  model_measure_reference?: {
    length?: string;
    width?: string;
    area?: string;
    note?: string;
  };
  area_m2: number | null;
  year: number | null;
  equipment_summary: string[];
  condition: string | null;
  availability: string;
  public_price_eur: number | null;
  description_azmora: string | null;
  publish: boolean;
  catalogue_preview_allowed: boolean;
  media: {
    src: string;
    small: string; cover?: string;
    alt: string;
    width: number;
    height: number;
  }[];
  source: { url: string };
  reference_azmora?: string | null;
}
// Public fields needed to filter, sort and compare an individual listing.
export function catalogRecord(h: House) {
  const { brand, model, name_for_site, typology, bedrooms, bathrooms, bathroom_count_minimum,
    dimensions_m, model_measure_reference, area_m2, equipment_summary, condition, availability, public_price_eur } = h;
  return { id: h.media_slug, brand, model, name_for_site, typology, bedrooms, bathrooms, bathroom_count_minimum,
    dimensions_m, model_measure_reference, area_m2, equipment_summary, condition, availability, public_price_eur };
}
export type CatalogRecord = Pick<House, keyof ReturnType<typeof catalogRecord>>;
export const previousCatalogNumber = (id: string) => /^[a-z]+-(\d{3})$/.exec(id)?.[1];

export const clean = (t: unknown) =>
  String(t ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['’]/g, '')
    .toLowerCase()
    .trim();
export const num = (n: number) => n.toLocaleString('pt-PT');
export function houseMeasure(h: CatalogRecord, field: 'area' | 'length' | 'width') {
  const announced = field === 'area' ? h.area_m2 : h.dimensions_m[field];
  if (announced != null) {
    return { value: `${num(announced)} ${field === 'area' ? 'm²' : 'm'}`, source: 'announced' } as const;
  }
  const reference = h.model_measure_reference?.[field];
  return reference
    ? { value: reference, source: 'reference' } as const
    : { value: null, source: 'unknown' } as const;
}
export const bathroomCount = (h: CatalogRecord) =>
  h.bathrooms != null
    ? String(h.bathrooms)
    : h.bathroom_count_minimum != null
      ? String(h.bathroom_count_minimum)
      : null;
export const price = (h: CatalogRecord) =>
  h.public_price_eur == null
    ? 'Preço sob consulta'
    : num(h.public_price_eur) + ' €';
export const status = (h: CatalogRecord) =>
  ({
    disponivel: 'Disponível',
    reservado: 'Reservada',
    vendido: 'Vendida',
    em_breve: 'Em breve',
  })[h.availability] || 'Disponibilidade a confirmar';
export const name = (h: CatalogRecord) =>
  !h.model
    ? h.name_for_site
    : h.model.toLowerCase().startsWith(h.brand.toLowerCase())
      ? h.model
      : h.brand + ' ' + h.model;
function comparisonMeasure(h: CatalogRecord, field: 'area' | 'length' | 'width') {
  const { value, source } = houseMeasure(h, field);
  if (!value) return 'A confirmar';
  return source === 'reference' ? value + ' (de referência)' : value + ' (no anúncio)';
}
export const specs = (h: CatalogRecord): Record<string, string> => ({
  Marca: h.brand,
  Tipologia: h.typology || 'A confirmar',
  Quartos: String(h.bedrooms ?? 'A confirmar'),
  'Casas de banho': bathroomCount(h) ?? 'A confirmar',
  Área: comparisonMeasure(h, 'area'),
  Comprimento: comparisonMeasure(h, 'length'),
  Largura: comparisonMeasure(h, 'width'),
  Condição: h.condition || 'A confirmar',
  Disponibilidade: status(h),
  Preço: price(h),
});
export function matches(h: CatalogRecord, p: URLSearchParams) {
  const query = clean(p.get('q'));
  const full = clean(
    [
      h.name_for_site,
      h.model,
      h.brand,
      h.typology,
      ...h.equipment_summary,
    ].join(' '),
  );
  return (
    query.split(/\s+/).every((w) => full.includes(w)) &&
    (
      ['brand', 'typology', 'bedrooms', 'condition'] as const
    ).every((k) => !p.get(k) || String(h[k]) === p.get(k)) &&
    (!p.get('area') ||
      (h.area_m2 != null && h.area_m2 >= Number(p.get('area')))) &&
    (!p.get('price') ||
      (h.public_price_eur != null &&
        h.public_price_eur <= Number(p.get('price'))))
  );
}
export function sorted<T extends CatalogRecord>(items: T[], sort: string) {
  return [...items].sort((a, b) => {
    if (sort === 'nome') return name(a).localeCompare(name(b), 'pt');
    if (sort === 'area' || sort.startsWith('preco')) {
      const av = sort === 'area' ? a.area_m2 : a.public_price_eur,
        bv = sort === 'area' ? b.area_m2 : b.public_price_eur;
      return av == null
        ? Number(bv != null)
        : bv == null
          ? -1
          : (av - bv) * (sort === 'preco-asc' ? 1 : -1);
    }
    return 0;
  });
}
export function toggle(ids: string[], id: string, max = Infinity) {
  return ids.includes(id)
    ? ids.filter((i) => i !== id)
    : ids.length >= max
      ? ids
      : [...ids, id];
}
