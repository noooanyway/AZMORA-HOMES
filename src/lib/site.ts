import raw from '../data/houses.json';
import type { House } from './catalog';
export const preview = import.meta.env.CATALOG_PREVIEW;
export const houses = (raw as House[]).filter(
  (h) => h.publish || (preview && h.catalogue_preview_allowed),
);
export const url = (path = '') =>
  import.meta.env.BASE_URL.replace(/\/$/, '') + '/' + path.replace(/^\//, '');
export const detail = (h: House) => url('casas/' + h.id + '/');
export const brands = [...new Set(houses.map((h) => h.brand))].sort();
export const contacts = {
  email: import.meta.env.PUBLIC_CONTACT_EMAIL || '',
  whatsapp: import.meta.env.PUBLIC_WHATSAPP || '',
  form: import.meta.env.PUBLIC_FORM_ENDPOINT || '',
};
