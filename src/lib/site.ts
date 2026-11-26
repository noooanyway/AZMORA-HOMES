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
export const getContacts = (locals: App.Locals) => {
  const c = locals.siteSettings?.contacts ?? { ...company, timezone: 'Europe/Lisbon' };
  const phone = c.phone.trim(), dial = phone.replace(/[^\d+]/g, '').replace(/^00/, '+');
  const whatsapp = c.whatsapp.replace(/\D/g, '');
  const visible = (key: string) => !('visibility' in c) || !c.visibility || c.visibility[key] !== false;
  return { ...c, visible, phone: visible('phone') ? phone : '', phoneHref: visible('phone') && /^\+?\d{9,15}$/.test(dial) ? 'tel:' + dial : '', phoneCaption: /^(?:\+351)?9\d{8}$/.test(dial) ? 'Chamada para a rede móvel nacional' : '', whatsapp: visible('whatsapp') ? whatsapp : '', whatsappHref: visible('whatsapp') && /^\d{9,15}$/.test(whatsapp) ? 'https://wa.me/' + whatsapp : '', form: '' };
};
export const contacts = getContacts({});
export const houseWhatsApp = (houseName: string, c = contacts) =>
  `${c.whatsappHref}?${new URLSearchParams({ text: `Olá! Gostaria de obter mais informações sobre a casa ${houseName}.` })}`;
