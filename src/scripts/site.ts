import {
  matches,
  sorted,
  specs,
  name,
  houseReference,
  toggle,
  type House,
} from '../lib/catalog';

const $ = <T extends HTMLElement = HTMLElement>(s: string) =>
  document.querySelector<T>(s);
const all = <T extends HTMLElement = HTMLElement>(s: string) =>
  Array.from(document.querySelectorAll<T>(s));
const houses: House[] = JSON.parse($('#units')!.textContent || '[]');
const units = new Map(houses.map((h) => [h.id, h]));
const base = document.body.dataset.base!;
const keys = { fav: 'azmora:favoritos', compare: 'azmora:comparar' };
function read(key: keyof typeof keys): string[] {
  try {
    const a: unknown = JSON.parse(localStorage.getItem(keys[key]) || '[]');
    return Array.isArray(a)
      ? [
          ...new Set(
            a.filter(
              (id): id is string => typeof id === 'string' && units.has(id),
            ),
          ),
        ].slice(0, key === 'compare' ? 3 : Infinity)
      : [];
  } catch {
    return [];
  }
}
const state = { fav: read('fav'), compare: read('compare') };
function save(key: keyof typeof keys, ids: string[]) {
  state[key] = ids;
  try {
    localStorage.setItem(keys[key], JSON.stringify(ids));
  } catch {}
  render();
}
function announce(s: string) {
  $('#notice')!.textContent = s;
  clearTimeout(timer);
  timer = window.setTimeout(() => {
    $('#notice')!.textContent = '';
  }, 3200);
}
let timer = 0;
function contact(ids: string[]) {
  return base + 'contactos/?casas=' + encodeURIComponent(ids.join(','));
}
function textEl(tag: string, s: string) {
  const el = document.createElement(tag);
  el.textContent = s;
  return el;
}
function removeButton(id: string) {
  const b = document.createElement('button');
  b.dataset.compare = id;
  b.textContent = '×';
  b.setAttribute(
    'aria-label',
    'Retirar ' + units.get(id)!.name_for_site + ' da comparação',
  );
  return b;
}
function render() {
  for (const key of ['fav', 'compare'] as const) {
    all('button[data-' + key + ']').forEach((b) =>
      b.setAttribute(
        'aria-pressed',
        String(state[key].includes(b.dataset[key]!)),
      ),
    );
  }
  const counter = $('[data-fav-count]')!;
  counter.textContent = String(state.fav.length);
  counter.hidden = !state.fav.length;
  const favhost = $('#saved');
  if (favhost) {
    favhost.hidden = false;
    all('#saved [data-card]').forEach(
      (el) => (el.hidden = !state.fav.includes(el.dataset.card!)),
    );
    $('#favempty')!.hidden = !!state.fav.length;
    const a = $<HTMLAnchorElement>('#favcontact')!;
    a.hidden = !state.fav.length;
    a.href = contact(state.fav);
  }
  const ids = state.compare;
  $('#tray')!.hidden = !ids.length || !!$('#comparison');
  document.body.classList.toggle('has-tray', !$('#tray')!.hidden);
  $('#traynames')!.replaceChildren(
    ...ids.map((id) => {
      const chip = textEl('span', name(units.get(id)!));
      chip.append(removeButton(id));
      return chip;
    }),
  );
  const link = $<HTMLAnchorElement>('#compareLink')!;
  link.textContent = 'Comparar (' + ids.length + '/3)';
  link.setAttribute('aria-disabled', String(ids.length < 2));
  const host = $('#tablehost');
  if (!host) return;
  host.replaceChildren();
  $('#cmpempty')!.hidden = ids.length >= 2;
  const a = $<HTMLAnchorElement>('#cmpcontact')!;
  a.href = contact(ids);
  a.hidden = ids.length < 2;
  if (ids.length < 2) return;
  const items = ids.map((id) => units.get(id)!);
  const table = document.createElement('table');
  const head = table.createTHead().insertRow();
  head.append(textEl('th', 'Característica'));
  items.forEach((h) => {
    const th = document.createElement('th');
    const a = document.createElement('a');
    a.href = base + 'casas/' + h.id + '/';
    a.textContent = h.name_for_site + ' · ' + houseReference(h);
    th.append(a, removeButton(h.id));
    head.append(th);
  });
  const body = table.createTBody();
  for (const k of Object.keys(specs(items[0]))) {
    const row = body.insertRow();
    row.append(textEl('th', k));
    const values = items.map((h) => specs(h)[k]);
    row.classList.toggle('different', new Set(values).size > 1);
    values.forEach((v) => row.append(textEl('td', v)));
  }
  host.append(table);
}
document.addEventListener('click', (e) => {
  const b = (e.target as Element).closest<HTMLElement>('button,a');
  if (!b) return;
  if (b.id === 'compareLink' && state.compare.length < 2) {
    e.preventDefault();
    announce('Escolha pelo menos duas casas para comparar.');
  }
  if (b.dataset.open) {
    const d = $<HTMLDialogElement>('#' + b.dataset.open);
    d?.showModal();
  }
  if (b.hasAttribute('data-close')) b.closest('dialog')?.close();
  if (b.hasAttribute('data-clear')) save('compare', []);
  for (const key of ['fav', 'compare'] as const) {
    const id = b.dataset[key];
    if (!id) continue;
    const next = toggle(state[key], id, key === 'compare' ? 3 : Infinity);
    if (next === state[key])
      announce('Pode comparar até três casas. Retire uma para continuar.');
    else save(key, next);
  }
});
window.addEventListener('pageshow', () => render());
window.addEventListener('storage', () => {
  state.fav = read('fav');
  state.compare = read('compare');
  render();
});
render();
type Control = HTMLInputElement | HTMLSelectElement;
const filterForm = $<HTMLFormElement>('#filterform');
const params = new URLSearchParams(location.search);
const keysFilter = [
  'brand',
  'typology',
  'bedrooms',
  'availability',
  'condition',
  'area',
  'price',
];
function syncFilters() {
  all<Control>('#filterform [name]').forEach(
    (el) => (el.value = params.get(el.name) || ''),
  );
}
if (filterForm) {
  const filterPanel = $('#filters')!;
  const filterToggle = $('#filter-toggle')!;
  function setFiltersOpen(open: boolean) {
    filterPanel.hidden = !open;
    filterToggle.setAttribute('aria-expanded', String(open));
  }
  filterToggle.onclick = () => setFiltersOpen(filterPanel.hidden);
  filterPanel.onkeydown = (event) => {
    if (event.key !== 'Escape') return;
    setFiltersOpen(false);
    filterToggle.focus();
  };
  const q = $<HTMLInputElement>('[name=q]')!,
    sort = $<HTMLSelectElement>('[name=sort]')!,
    results = $('#results')!;
  const cards = new Map(
    all('#results [data-card]').map((el) => [el.dataset.card!, el]),
  );
  function update(write = true) {
    for (const [k, v] of [...params]) if (!v) params.delete(k);
    if (write)
      history.replaceState(
        null,
        '',
        location.pathname + (params.size ? '?' + params : ''),
      );
    q.value = params.get('q') || '';
    sort.value = params.get('sort') || '';
    const list = sorted(
      houses.filter((h) => matches(h, params)),
      sort.value,
    );
    const visible = new Set(list.map((h) => h.id));
    cards.forEach((el, id) => (el.hidden = !visible.has(id)));
    list.forEach((h) => results.append(cards.get(h.id)!));
    $('#count')!.textContent =
      list.length + (list.length === 1 ? ' casa' : ' casas');
    $('#empty')!.hidden = !!list.length;
    const chips = $('#chips')!;
    chips.replaceChildren();
    for (const k of ['q', ...keysFilter]) {
      const v = params.get(k);
      if (!v) continue;
      const b = document.createElement('button');
      const control = filterForm?.elements.namedItem(k);
      const label =
        control instanceof HTMLSelectElement
          ? [...control.options].find((o) => o.value === v)?.textContent
          : null;
      b.textContent =
        ({ area: 'Área ≥ ', price: 'Preço ≤ ', bedrooms: 'Quartos: ' }[k] ||
          '') +
        (label || v) +
        ' ×';
      b.onclick = () => {
        params.delete(k);
        syncFilters();
        update();
      };
      chips.append(b);
    }
    const listView = params.get('view') === 'list';
    results.classList.toggle('list', listView);
    all('[data-view]').forEach((b) =>
      b.setAttribute(
        'aria-pressed',
        String(b.dataset.view === (listView ? 'list' : 'grid')),
      ),
    );
  }
  q.oninput = () => {
    params.set('q', q.value);
    update();
  };
  sort.onchange = () => {
    params.set('sort', sort.value);
    update();
  };
  function applyFilters() {
    if (!filterForm?.checkValidity()) return;
    new FormData(filterForm).forEach((v, k) => params.set(k, String(v)));
    update();
  }
  filterForm.onchange = applyFilters;
  filterForm.onsubmit = (e) => {
    e.preventDefault();
    applyFilters();
  };
  all('[data-reset]').forEach(
    (b) =>
      (b.onclick = () => {
        for (const k of [...keysFilter, 'q']) params.delete(k);
        syncFilters();
        update();
      }),
  );
  all('[data-view]').forEach(
    (b) =>
      (b.onclick = () => {
        params.set('view', b.dataset.view!);
        update();
      }),
  );
  syncFilters();
  setFiltersOpen(keysFilter.some((key) => Boolean(params.get(key))));
  update(false);
}
const light = $<HTMLDialogElement>('#lightbox');
if (light) {
  const unit = units.get(light.dataset.unit!)!;
  const { media } = unit;
  let ix = 0;
  const show = (i: number) => {
    ix = (i + media.length) % media.length;
    const img = $<HTMLImageElement>('#enlarged')!;
    img.src = base + media[ix].src;
    img.alt = media[ix].alt;
    $('#position')!.textContent = `${unit.name_for_site} · ${ix + 1} / ${media.length}`;
  };
  all('[data-photo]').forEach(
    (b) =>
      (b.onclick = () => {
        show(Number(b.dataset.photo));
        light.showModal();
      }),
  );
  $('#prev')!.onclick = () => show(ix - 1);
  $('#next')!.onclick = () => show(ix + 1);
  light.onkeydown = (e) => {
    if (e.key === 'ArrowLeft') show(ix - 1);
    if (e.key === 'ArrowRight') show(ix + 1);
  };
}
