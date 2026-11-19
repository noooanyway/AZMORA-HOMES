import raw from '../data/houses.json';
import business from '../data/company.json';
import type { House } from './catalog';
export const preview = import.meta.env.CATALOG_PREVIEW;
export const houses = (raw as House[]).filter(
  (h) => h.publish || (preview && h.catalogue_preview_allowed),
);
export const url = (path = '') =>
  import.meta.env.BASE_URL.replace(/\/$/, '') + '/' + path.replace(/^\//, '');
export const detail = (h: House) => url('casas/' + h.id + '/');
export const priceRequest = (h: House) =>
  url(`contactos/?${new URLSearchParams({ casas: h.id, motivo: 'preco' })}`);
export const brands = [...new Set(houses.map((h) => h.brand))].sort();
export const company = business;
export const contacts = {
  email: import.meta.env.PUBLIC_CONTACT_EMAIL || '',
  whatsapp: import.meta.env.PUBLIC_WHATSAPP || '',
  form: import.meta.env.PUBLIC_FORM_ENDPOINT || '',
};
