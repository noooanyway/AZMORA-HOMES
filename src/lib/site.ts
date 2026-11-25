import raw from '../data/houses.json';
import business from '../data/company.json';
import type { House } from './catalog';
export const preview = import.meta.env.CATALOG_PREVIEW;
export const houses = (raw as House[]).filter(
  (h) => h.publish || (preview && h.catalogue_preview_allowed),
);
export const url = (path = '') =>
  import.meta.env.BASE_URL.replace(/\/$/, '') + '/' + path.replace(/^\//, '');
export const detail = (h: House) => url('casas/' + h.media_slug + '/');
export const priceRequest = (h: House) =>
  url(`contactos/?${new URLSearchParams({ casas: h.media_slug, motivo: 'preco' })}`);
export const pageHouses = (locals: App.Locals): House[] => import.meta.env.INVENTORY_LIVE ? (locals.houses ?? []) : houses;
export const company = business;
export const complaintsUrl = company.complaintsUrl || 'https://www.livroreclamacoes.pt/Inicio/';
const phone = company.phone.trim();
const dial = phone.replace(/[^\d+]/g, '').replace(/^00/, '+');
export const contacts = {
  email: company.email,
  phone,
  phoneHref: /^\+?\d{9,15}$/.test(dial) ? 'tel:' + dial : '',
  phoneCaption: /^(?:\+351)?9\d{8}$/.test(dial) ? 'Chamada para a rede móvel nacional' : '',
  whatsapp: company.whatsapp,
  whatsappHref: `https://wa.me/${company.whatsapp}`,
  form: '',
};

export const houseWhatsApp = (houseName: string) =>
  `${contacts.whatsappHref}?${new URLSearchParams({ text: `Olá! Gostaria de obter mais informações sobre a casa ${houseName}.` })}`;
