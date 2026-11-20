import { previousCatalogNumber } from '../lib/catalog';

const form = document.querySelector<HTMLFormElement>('#lead-form')!;
const canSend = form.dataset.enabled === 'true';
const topic = form.querySelector<HTMLSelectElement>('#lead-topic')!;
const typology = form.querySelector<HTMLSelectElement>('select[name="tipologia"]')!;
const message = form.querySelector<HTMLTextAreaElement>('#lead-message')!;
const picker = form.querySelector<HTMLSelectElement>('#lead-house');
const selectedList = form.querySelector<HTMLUListElement>('#selected');
const status = form.querySelector<HTMLParagraphElement>('#lead-status')!;
const submit = form.querySelector<HTMLButtonElement>('button[type="submit"]')!;
const whatsapp = document.querySelector<HTMLAnchorElement>('#whatsapp');
const phone = document.getElementById('contact')!.dataset.wa?.replace(/\D/g, '');

const prompts: Record<string, string> = {
  contacto: 'Diga-nos em que podemos ajudar e como prefere que entremos em contacto.',
  preco: 'Diga-nos se quer saber o preço, a disponibilidade ou ambos.',
  visita: 'Indique as datas que lhe dariam jeito e o que gostaria de ver.',
  transporte: 'Indique a localidade de destino e conte-nos o que precisa de esclarecer.',
  ficha: 'Diga-nos que características gostaria de confirmar.',
  escolha: 'Conte-nos quantos quartos procura e o que mais importa na escolha.',
};
const options = new Map(
  Array.from(picker?.options ?? [])
    .filter((option) => option.value)
    .map((option) => [option.value, option]),
);
const params = new URLSearchParams(location.search);
const previousOptions = new Map([...options.values()]
  .filter((option) => option.dataset.previousNumber)
  .map((option) => [option.dataset.previousNumber, option.value]));
const requested = (params.get('casas') || '').split(',');
const selected = new Set(
  requested.map((id) => options.has(id) ? id : previousOptions.get(previousCatalogNumber(id)))
    .filter((id): id is string => id !== undefined),
);
if (requested.some((id) => previousOptions.has(previousCatalogNumber(id)))) {
  params.set('casas', [...selected].join(','));
  history.replaceState(history.state, '', `${location.pathname}?${params}${location.hash}`);
}
if (Array.from(topic.options).some((option) => option.value === params.get('motivo'))) {
  topic.value = params.get('motivo')!;
}

const selectedOptions = () => [...selected].map((id) => options.get(id)!);
const topicLabel = () => topic.value ? topic.selectedOptions[0].text.trim() : 'Pedido de contacto';
const houseLink = (option: HTMLOptionElement) => new URL(option.dataset.url!, location.href).href;
const houseList = (values: string[]) => values.length > 1
  ? values.map((value, index) => `${index + 1}. ${value}`).join('\n')
  : values.join('');

function updateTopic() {
  message.placeholder = prompts[topic.value] ?? 'Diga-nos o que gostaria de saber.';
  if (whatsapp && phone) {
    const details = [topicLabel(), ...selectedOptions().map((option) =>
      `${option.text.trim()} · ${houseLink(option)}`,
    )];
    whatsapp.href = `https://wa.me/${phone}?text=${encodeURIComponent(details.join('\n'))}`;
  }
}

function renderSelection() {
  if (!picker || !selectedList) return;
  selectedList.replaceChildren(...selectedOptions().map((option) => {
    const item = document.createElement('li');
    const link = document.createElement('a');
    link.href = option.dataset.url!;
    link.textContent = option.text.trim();
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.textContent = '×';
    remove.setAttribute('aria-label', `Remover ${option.text.trim()}`);
    remove.onclick = () => {
      selected.delete(option.value);
      renderSelection();
      picker.focus();
    };
    item.append(link, remove);
    return item;
  }));
  options.forEach((option, id) => { option.disabled = selected.has(id); });
  picker.value = '';
  updateTopic();
}

picker?.addEventListener('change', () => {
  if (options.has(picker.value)) selected.add(picker.value);
  renderSelection();
});
topic.addEventListener('change', updateTopic);
renderSelection();
updateTopic();

submit.disabled = !canSend;
let requestReference: string | undefined;
form.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!canSend || submit.disabled || !form.reportValidity()) return;
  const data = new FormData(form);
  if (data.get('_gotcha')) return;

  const houseNames = selectedOptions().map((option) => option.text.trim());
  const summary = houseNames.length <= 2
    ? houseNames.join(', ')
    : `${houseNames[0]} e mais ${houseNames.length - 1} casas`;
  const field = (name: string) => String(data.get(name) ?? '').trim();
  const preference = field('tipologia');
  const context = summary || preference || 'Pedido geral';
  requestReference ??= `AZ-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  const reference = requestReference;
  const notification = new FormData();
  for (const [label, value] of Object.entries({
    subject: `[Azmora Homes] ${topicLabel()} — ${context} · ${reference}`,
    Nome: field('nome'),
    email: field('email'),
    Telefone: field('telefone') || 'Não indicado',
    'Motivo do pedido': topicLabel(),
    Mensagem: field('message'),
    'Casas de interesse': houseList(houseNames) || 'Sem casa selecionada',
    'Tipologia pretendida': typology.selectedOptions[0].text.trim(),
    'Localidade de destino': field('localidade') || 'Não indicada',
    'Referência do pedido': reference,
    'Ligações para as fichas': houseList(selectedOptions().map(houseLink)),
  })) {
    if (value) notification.append(label, value);
  }

  submit.disabled = true;
  form.setAttribute('aria-busy', 'true');
  status.textContent = 'A enviar o pedido…';
  status.dataset.state = 'sending';
  try {
    const response = await fetch(form.action, {
      method: 'POST',
      body: notification,
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok || (await response.json()).ok !== true) throw new Error('Submission rejected');
    status.textContent = `Pedido recebido. Guarde a referência ${reference}. A equipa responderá para o email que indicou.`;
    status.dataset.state = 'success';
    message.value = '';
    requestReference = undefined;
  } catch {
    status.textContent = `Não foi possível confirmar a receção do pedido ${reference}. Os seus dados continuam no formulário. Tente novamente.`;
    status.dataset.state = 'error';
  } finally {
    submit.disabled = false;
    form.removeAttribute('aria-busy');
    status.focus();
  }
});
