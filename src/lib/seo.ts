import type { House } from './catalog';

export function houseSeo(h: House) {
  const title = h.seo_title?.trim() || `${h.name_for_site}${h.typology && !h.name_for_site.toLowerCase().includes(h.typology.toLowerCase()) ? ` ${h.typology}` : ''} | Casa móvel`;
  const facts = [h.typology, h.bedrooms != null ? `${h.bedrooms} ${h.bedrooms === 1 ? 'quarto' : 'quartos'}` : ''].filter(Boolean).join(', ');
  const description = h.seo_description?.trim() || `Conheça ${h.name_for_site}${facts ? ` (${facts})` : ''}. Consulte fotografias e detalhes e peça informações para os Açores ou a Madeira.`;
  return { title, description };
}
