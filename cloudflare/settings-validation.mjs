// Validation is intentionally independent of the ADMIN and public renderer until
// the complete publishing flow is ready. Content is plain text, never HTML.
const plain = (v, max) => typeof v === 'string' && v.length <= max && !/[\u0000-\u0008\u000b\u000c\u000e-\u001f<>]/.test(v);
const phone = (s) => !s || /^\+?[0-9 ()-]{9,24}$/.test(s) && /^\+?[0-9]{9,15}$/.test(s.replace(/[ ()-]/g, ''));
const email = (s) => !s || !/[?&]/.test(s) && /^[A-Za-z0-9.!#$%&'*+/=^_`{|}~-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(s);
const domains = { instagram: 'instagram.com', facebook: 'facebook.com' };
function social(platform, value) {
  if (!value) return true;
  try {
    const u = new URL(value), host = u.hostname.toLowerCase();
    return u.protocol === 'https:' && !u.username && !u.password && !u.port && (host === domains[platform] || host === 'www.' + domains[platform]);
  } catch { return false; }
}
const stringKeys = { phone: 32, secondPhone: 32, whatsapp: 32, email: 254, openingHours: 160, timezone: 64, languages: 160 };
export function validateContactSettings(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).some(k => !Object.hasOwn(stringKeys, k) && k !== 'social')) return false;
  for (const [key, max] of Object.entries(stringKeys)) if (!plain(value[key], max)) return false;
  if (!phone(value.phone) || !phone(value.secondPhone) || !phone(value.whatsapp) || !email(value.email)) return false;
  try { new Intl.DateTimeFormat('pt-PT', { timeZone: value.timezone }); } catch { return false; }
  if (!value.social || typeof value.social !== 'object' || Array.isArray(value.social) || Object.keys(value.social).some(k => !Object.hasOwn(domains, k))) return false;
  return Object.keys(domains).every(k => plain(value.social[k], 500) && social(k, value.social[k]));
}
