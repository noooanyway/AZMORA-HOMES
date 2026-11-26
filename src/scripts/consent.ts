export {};
type Consent = { version: 1; preferences: boolean; analytics: boolean };
const key = 'azmora:consent-v1';
const panel = document.querySelector<HTMLElement>('#consent-panel')!;
const options = document.querySelector<HTMLElement>('#consent-options')!;
const preferences = document.querySelector<HTMLInputElement>('#consent-preferences')!;
const consentStatus = document.querySelector<HTMLElement>('#consent-status')!;
const dismiss = panel.querySelector<HTMLButtonElement>('[data-consent="dismiss"]')!;
const customize = panel.querySelector<HTMLButtonElement>('[data-consent="customize"]')!;
let current: Consent | null = null;
try {
  const value: unknown = JSON.parse(localStorage.getItem(key) || 'null');
  if (value && typeof value === 'object' && 'version' in value && value.version === 1 && 'preferences' in value && typeof value.preferences === 'boolean' && 'analytics' in value && typeof value.analytics === 'boolean') current = value as Consent;
} catch {}
function show() {
  panel.hidden = false;
  options.hidden = true;
  customize.setAttribute('aria-expanded', 'false');
  preferences.checked = current?.preferences ?? false;
  consentStatus.textContent = '';
  dismiss.hidden = true;
}
function store(next: Consent) {
  current = next;
  let persistent = true;
  try {
    localStorage.setItem(key, JSON.stringify(next));
    if (!next.preferences) for (const k of ['azmora:theme', 'azmora:favoritos', 'azmora:comparar']) localStorage.removeItem(k);
  } catch { persistent = false; }
  window.dispatchEvent(new Event('azmora-consent'));
  if (persistent) { panel.hidden = true; }
  else { consentStatus.textContent = 'Não foi possível guardar a escolha neste navegador. Terá de escolher novamente na próxima página.'; dismiss.hidden = false; }
}
panel.addEventListener('click', (event) => {
  const button = (event.target as Element).closest<HTMLButtonElement>('[data-consent]');
  if (!button) return;
  const action = button.dataset.consent;
  if (action === 'dismiss') { panel.hidden = true; return; }
  if (action === 'customize') {
    options.hidden = !options.hidden;
    button.setAttribute('aria-expanded', String(!options.hidden));
    return;
  }
  if (action === 'accept') store({ version: 1, preferences: true, analytics: false });
  if (action === 'reject') store({ version: 1, preferences: false, analytics: false });
  if (action === 'save') store({ version: 1, preferences: preferences.checked, analytics: false });
});
document.querySelector<HTMLButtonElement>('[data-consent-open]')?.addEventListener('click', () => { show(); panel.querySelector<HTMLButtonElement>('button')?.focus(); });
window.addEventListener('storage', (event) => {
  if (event.key !== key) return;
  // Reinitialise in all tabs; never trust a stale grant in another tab.
  location.reload();
});
if (!current) show();
