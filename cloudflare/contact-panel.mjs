// Runs inside the inventory panel's existing nonce-protected module.
const contactStates = {
  new: 'Novo',
  working: 'Em tratamento',
  answered: 'Respondido',
  archived: 'Arquivado',
};
const emailStates = {
  pending: 'A aguardar envio',
  sending: 'Envio em curso',
  sent: 'Aceite pelo serviço de email',
  failed: 'Envio não confirmado',
  uncertain: 'Requer verificação no Resend',
};
let contactOffset = 0,
  contactCurrent = null,
  contactBusy = false,
  contactDirty = false;
const contactQuery = () =>
  new URLSearchParams(
    [...new FormData(el('contact-filters'))].map(([k, v]) => [k, String(v)]),
  );
for (const island of [
  'São Miguel',
  'Santa Maria',
  'Terceira',
  'Graciosa',
  'São Jorge',
  'Pico',
  'Faial',
  'Flores',
  'Corvo',
  'Madeira',
  'Porto Santo',
  'Outro',
])
  el('contact-island').append(new Option(island, island));
async function contactTask(fn) {
  if (contactBusy) return;
  contactBusy = true;
  el('contact-edit').inert = true;
  try {
    await fn();
  } catch (e) {
    el('contact-feedback').textContent = e.message;
    msg(e.message);
  } finally {
    contactBusy = false;
    el('contact-edit').inert = false;
  }
}
async function loadContacts() {
  const query = contactQuery();
  query.set('offset', contactOffset);
  const data = await api('contactos/?' + query);
  el('new-contacts').textContent =
    `(${data.newCount} ${data.newCount === 1 ? 'novo' : 'novos'})`;
  el('contact-count').textContent =
    `${data.total} pedidos · ${data.total ? contactOffset + 1 : 0}–${Math.min(contactOffset + 50, data.total)}`;
  el('contact-export').href = base + 'contactos-exportar/?' + contactQuery();
  el('contacts-prev').disabled = contactOffset === 0;
  el('contacts-next').disabled = contactOffset + 50 >= data.total;
  const chosen = el('contact-house').value;
  el('contact-house').replaceChildren(
    new Option('Todas', ''),
    ...data.houses.map((h) => new Option(h.name, h.slug)),
  );
  el('contact-house').value = chosen;
  el('contact-list').replaceChildren(
    ...data.rows.map((r) => {
      const item = node('article', '');
      item.className = 'unit';
      const summary = node('div', '');
      summary.append(
        node('strong', r.name),
        node('small', r.email + ' · ' + (r.phone || 'Sem telefone')),
        node(
          'small',
          JSON.parse(r.houses)
            .map((h) => h.name)
            .join(', '),
        ),
        node(
          'small',
          `${new Date(r.created_at.replace(' ', 'T') + 'Z').toLocaleString('pt-PT')} · ${contactStates[r.status]} · ${emailStates[r.notification_status]}`,
        ),
      );
      item.append(
        summary,
        button('Consultar pedido', () => contactTask(() => openContact(r.id))),
      );
      return item;
    }),
  );
  if (!data.rows.length)
    el('contact-list').append(
      node('p', 'Não existem pedidos para estes filtros.'),
    );
}
async function openContact(id) {
  const r = await api('contacto/?id=' + encodeURIComponent(id));
  contactCurrent = r;
  contactDirty = false;
  el('contact-title').textContent = 'Pedido de ' + r.name;
  el('contact-info').replaceChildren(
    ...Object.entries({
      Referência: r.id,
      Email: r.email,
      Telefone: r.phone,
      Ilha: r.island,
      Localidade: r.locality,
      Motivo:
        {
          contacto: 'Pedido de contacto',
          preco: 'Preço e disponibilidade',
          orcamento: 'Pedido de orçamento',
          visita: 'Informações sobre visitas',
          transporte: 'Transporte e instalação',
          ficha: 'Características de uma casa',
          escolha: 'Ajuda a escolher uma casa',
          outro: 'Outro assunto',
        }[r.request_type] || r.request_type,
      Tipologia: r.typology,
      Casas: JSON.parse(r.houses)
        .map((h) => h.name)
        .join('\n'),
      Mensagem: r.message,
      'Recebido (UTC)': r.created_at,
      'Atualizado (UTC)': r.updated_at,
    }).map(([k, v]) => node('p', k + ': ' + (v || 'Não indicado'))),
  );
  el('contact-email').href =
    'mailto:' +
    encodeURIComponent(r.email) +
    '?subject=' +
    encodeURIComponent('Azmora Homes · Pedido ' + r.id);
  let phone = r.phone.replace(/[^\d+]/g, '').replace(/^00/, '+');
  if (/^9\d{8}$/.test(phone)) phone = '+351' + phone;
  const valid = /^\+[1-9]\d{7,14}$/.test(phone);
  el('contact-whatsapp').hidden = !valid;
  if (valid) el('contact-whatsapp').href = 'https://wa.me/' + phone.slice(1);
  el('contact-status').value = r.status;
  el('contact-notes').value = r.notes;
  el('contact-confirm').value = '';
  el('contact-feedback').textContent = '';
  el('contact-notification').textContent =
    'Notificação: ' +
    emailStates[r.notification_status] +
    (r.resend_id ? ' · ' + r.resend_id : '') +
    (r.notification_error ? ' · ' + r.notification_error : '');
  el('contact-retry').disabled = ['sent', 'uncertain'].includes(
    r.notification_status,
  );
  el('contact-delete').disabled =
    r.status !== 'archived' || r.notification_status === 'sending';
  if (!el('contact-detail').open) el('contact-detail').showModal();
}
function closeContact() {
  if (contactBusy) return;
  if (contactDirty && !confirm('Sair sem guardar as notas e o estado?')) return;
  contactDirty = false;
  el('contact-detail').close();
}
el('contact-close').onclick = closeContact;
el('contact-detail').addEventListener('cancel', (e) => {
  e.preventDefault();
  closeContact();
});
el('contact-edit').oninput = () => {
  contactDirty = true;
};
el('show-contacts').onclick = () => {
  if (dirty && !confirm('Sair sem guardar a ficha de inventário?')) return;
  dirty = false;
  el('dash').hidden = true;
  el('edit').hidden = true;
  el('contacts').hidden = false;
  contactTask(loadContacts);
};
el('show-inventory').onclick = () => {
  el('contacts').hidden = true;
  el('dash').hidden = false;
};
el('contact-filters').onsubmit = (e) => {
  e.preventDefault();
  contactOffset = 0;
  contactTask(loadContacts);
};
el('contact-filters').onreset = () => {
  setTimeout(() => {
    contactOffset = 0;
    contactTask(loadContacts);
  }, 0);
};
el('contacts-prev').onclick = () => {
  contactOffset = Math.max(0, contactOffset - 50);
  contactTask(loadContacts);
};
el('contacts-next').onclick = () => {
  contactOffset += 50;
  contactTask(loadContacts);
};
el('contact-edit').onsubmit = (e) => {
  e.preventDefault();
  contactTask(async () => {
    await api('contactos-guardar/', {
      id: contactCurrent.id,
      revision: contactCurrent.revision,
      status: el('contact-status').value,
      notes: el('contact-notes').value,
    });
    await openContact(contactCurrent.id);
    await loadContacts();
    el('contact-feedback').textContent = 'Acompanhamento guardado.';
  });
};
el('contact-retry').onclick = () =>
  contactTask(async () => {
    try {
      await api('contactos-reenviar/', { id: contactCurrent.id });
    } finally {
      await openContact(contactCurrent.id);
      await loadContacts();
    }
  });
el('contact-delete').onclick = () =>
  contactTask(async () => {
    if (!confirm('Eliminar definitivamente os dados deste pedido?')) return;
    await api('contactos-eliminar/', {
      id: contactCurrent.id,
      revision: contactCurrent.revision,
      confirm: el('contact-confirm').value,
    });
    contactDirty = false;
    el('contact-detail').close();
    contactOffset = 0;
    await loadContacts();
    msg('Pedido eliminado do painel. Reveja também emails e backups.');
  });
window.addEventListener('beforeunload', (e) => {
  if (contactDirty || contactBusy) {
    e.preventDefault();
    e.returnValue = '';
  }
});
loadContacts().catch(() => {
  el('new-contacts').textContent = '(indisponível)';
});
