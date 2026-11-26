// Settings are validated on the server; content is plain text, never HTML.
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
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).some(k => !Object.hasOwn(stringKeys, k) && k !== 'social' && k !== 'visibility')) return false;
  for (const [key, max] of Object.entries(stringKeys)) if (!plain(value[key], max)) return false;
  if (!phone(value.phone) || !phone(value.secondPhone) || !phone(value.whatsapp) || !email(value.email)) return false;
  try { new Intl.DateTimeFormat('pt-PT', { timeZone: value.timezone }); } catch { return false; }
  if (!value.social || typeof value.social !== 'object' || Array.isArray(value.social) || Object.keys(value.social).some(k => !Object.hasOwn(domains, k))) return false;
  if (value.visibility !== undefined && (!value.visibility || typeof value.visibility !== 'object' || Array.isArray(value.visibility) || Object.keys(value.visibility).some(k => !['phone','secondPhone','whatsapp','email','instagram','facebook','openingHours','languages'].includes(k) || typeof value.visibility[k] !== 'boolean'))) return false;
  return Object.keys(domains).every(k => plain(value.social[k], 500) && social(k, value.social[k]));
}

const exact = (v, keys) => v && typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length === keys.length && keys.every(k => Object.hasOwn(v,k));
const textGroup = (v,keys,max=4000) => exact(v,keys) && keys.every(k=>plain(v[k],max));
export function validateContent(v) {
  if (!exact(v,['home','about','faq','commercial','notice','seo'])) return false;
  const h=v.home;
  if (!exact(h,['title','subtitle','description','selectionTitle','regionText','featured']) || !['title','subtitle','description','selectionTitle','regionText'].every(k=>plain(h[k],2000)) || !Array.isArray(h.featured) || h.featured.length>3 || h.featured.some(x=>typeof x!=='string'||!/^[a-z0-9-]{1,150}$/.test(x)) || new Set(h.featured).size!==h.featured.length) return false;
  if (!textGroup(v.about,['title','description','history','experience','advantages','inspection'])) return false;
  if (!Array.isArray(v.faq) || v.faq.length>40 || v.faq.some(f=>!exact(f,['question','answer','visible']) || !plain(f.question,240) || !f.question.trim() || !plain(f.answer,4000) || !f.answer.trim() || typeof f.visible!=='boolean')) return false;
  if (!textGroup(v.commercial,['process','transport','delivery','islands','included','excluded','visits','inspection'])) return false;
  const n=v.notice;
  if (!exact(n,['title','message','active','start','end','url']) || !plain(n.title,160) || !plain(n.message,1000) || typeof n.active!=='boolean' || !plain(n.url,500)) return false;
  const dateValid = x => x === '' || /^\d{4}-\d{2}-\d{2}$/.test(x) && !Number.isNaN(Date.parse(x+'T00:00:00Z')) && new Date(x+'T00:00:00Z').toISOString().slice(0,10)===x;
  if (!dateValid(n.start) || !dateValid(n.end) || n.end && n.start && n.end<n.start || n.active && (!n.title.trim()||!n.message.trim()||!n.start)) return false;
  if (n.url) { try { const u=new URL(n.url,'https://www.azmorahomes.pt'); if (!(n.url.startsWith('/') && !n.url.startsWith('//') || u.protocol==='https:') || u.username || u.password) return false; } catch { return false; } }
  const pages=['home','about','contacts','acores','madeira','guide'];
  if (!exact(v.seo,pages) || pages.some(k=>!textGroup(v.seo[k],['title','description','socialTitle','socialDescription'],320))) return false;
  return true;
}
