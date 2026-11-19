export interface House {
  id: string;
  brand: string;
  model: string | null;
  name_for_site: string;
  typology: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  dimensions_m: { length: number | null; width: number | null };
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
export const clean = (t: unknown) =>
  String(t ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['’]/g, '')
    .toLowerCase()
    .trim();
export const num = (n: number) => n.toLocaleString('pt-PT');
export const price = (h: House) =>
  h.public_price_eur == null
    ? 'Preço sob consulta'
    : num(h.public_price_eur) + ' €';
export const status = (h: House) =>
  ({
    disponivel: 'Disponível',
    reservado: 'Reservada',
    vendido: 'Vendida',
    em_breve: 'Em breve',
  })[h.availability] || 'Disponibilidade a confirmar';
export const name = (h: House) =>
  !h.model
    ? h.name_for_site
    : h.model.toLowerCase().startsWith(h.brand.toLowerCase())
      ? h.model
      : h.brand + ' ' + h.model;
export const specs = (h: House): Record<string, string> => ({
  Marca: h.brand,
  Tipologia: h.typology || 'A confirmar',
  Quartos: String(h.bedrooms ?? 'A confirmar'),
  'Casas de banho': String(h.bathrooms ?? 'A confirmar'),
  Área: h.area_m2 ? num(h.area_m2) + ' m²' : 'A confirmar',
  Comprimento: h.dimensions_m.length
    ? num(h.dimensions_m.length) + ' m'
    : 'A confirmar',
  Largura: h.dimensions_m.width
    ? num(h.dimensions_m.width) + ' m'
    : 'A confirmar',
  Ano: String(h.year ?? 'A confirmar'),
  Condição: h.condition || 'A confirmar',
  Disponibilidade: status(h),
  Preço: price(h),
});
export function matches(h: House, p: URLSearchParams) {
  const full = clean(
    [
      h.name_for_site,
      h.model,
      h.brand,
      h.typology,
      h.id,
      h.reference_azmora,
      'Exposul',
      ...h.equipment_summary,
    ].join(' '),
  );
  return (
    clean(p.get('q'))
      .split(/\s+/)
      .every((w) => full.includes(w)) &&
    (
      ['brand', 'typology', 'bedrooms', 'availability', 'condition'] as const
    ).every((k) => !p.get(k) || String(h[k]) === p.get(k)) &&
    (!p.get('area') ||
      (h.area_m2 != null && h.area_m2 >= Number(p.get('area')))) &&
    (!p.get('price') ||
      (h.public_price_eur != null &&
        h.public_price_eur <= Number(p.get('price'))))
  );
}
export function sorted(items: House[], sort: string) {
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
    return a.id.localeCompare(b.id);
  });
}
export function toggle(ids: string[], id: string, max = Infinity) {
  return ids.includes(id)
    ? ids.filter((i) => i !== id)
    : ids.length >= max
      ? ids
      : [...ids, id];
}
