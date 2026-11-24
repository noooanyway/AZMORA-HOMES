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
  el('contact-detail').setAttribute('aria-busy','true');
  try {
    await fn();
  } catch (e) {
    el('contact-feedback').textContent = e.message;
    msg(e.message);
  } finally {
    contactBusy = false;
    el('contact-edit').inert = false;
    el('contact-detail').removeAttribute('aria-busy');
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
  el('copy-email').onclick = () => navigator.clipboard.writeText(r.email).then(() => { el('contact-feedback').textContent = 'Email copiado.'; }).catch(() => { el('contact-feedback').textContent = 'Não foi possível copiar. Selecione o email e copie-o manualmente.'; });
  el('copy-subject').onclick = () => navigator.clipboard.writeText('Azmora Homes · Pedido ' + r.id).then(() => { el('contact-feedback').textContent = 'Assunto copiado.'; }).catch(() => { el('contact-feedback').textContent = 'Não foi possível copiar. Copie a referência manualmente.'; });
  let phone = r.phone.replace(/[^\d+]/g, '').replace(/^00/, '+');
  if (/^9\d{8}$/.test(phone)) phone = '+351' + phone;
  const valid = /^\+[1-9]\d{7,14}$/.test(phone);
  el('contact-whatsapp').hidden = !valid;
  if (valid) el('contact-whatsapp').href = 'https://wa.me/' + phone.slice(1);
  el('contact-status').value = r.status;
  el('contact-notes').value = '';
  el('contact-legacy-note').textContent = r.notes ? 'Nota existente, sem data ou autor identificados: ' + r.notes : 'Sem notas anteriores.';
  const labels = {received:'Pedido recebido',status:'Estado alterado',note:'Nota adicionada',notification:'Notificação interna',retry:'Reenvio solicitado',zoho:'Zoho aberto',whatsapp:'WhatsApp aberto'};
  el('contact-history').replaceChildren(...r.history.map(h => node('li', [new Date(h.at.replace(' ','T')+'Z').toLocaleString('pt-PT',{timeZone:'Atlantic/Azores'}), h.actor || (['received','notification'].includes(h.event) ? 'Sistema' : 'Autor não registado'), labels[h.event] || h.event, h.event === 'status' ? `${contactStates[h.old_value] || h.old_value} → ${contactStates[h.new_value] || h.new_value}` : h.event === 'notification' ? (emailStates[h.new_value] || h.new_value) : '', h.note || ''].filter(Boolean).join(' · '))));
  if (!r.history.length) el('contact-history').append(node('li','Sem eventos registados desde a ativação do histórico.'));
  el('contact-feedback').textContent = '';
  el('contact-notification').textContent =
    'Notificação: ' +
    emailStates[r.notification_status] +
    (r.resend_id ? ' · ' + r.resend_id : '') +
    (r.notification_error ? ' · ' + r.notification_error : '');
  el('contact-notification').textContent += ({sent:' A aceitação pelo Resend não confirma a entrega.',uncertain:' Confirme no Resend antes de tentar novamente; poderá já ter sido enviada.',pending:' Ainda não existe confirmação de envio.',sending:' Existe uma tentativa em curso ou interrompida. Aguarde um minuto e tente reenviar; o mesmo identificador protege contra duplicação.',failed:' O pedido está guardado. Pode tentar reenviar quando o prazo de espera terminar.'})[r.notification_status] || '';
  if (r.attempts >= 5 && r.notification_status !== 'sent') el('contact-notification').textContent += ' Foi atingido o limite de cinco tentativas. Consulte o Resend antes de tomar outra ação.';
  el('contact-retry').disabled = ['sent', 'uncertain'].includes(
    r.notification_status,
  );
  el('contact-delete').disabled =
    r.status !== 'archived' || r.notification_status === 'sending';
  el('contact-delete-reason').textContent = r.status !== 'archived' ? 'Para eliminar, selecione Arquivado e guarde o acompanhamento.' : r.notification_status === 'sending' ? 'Aguarde o envio terminar; se permanecer neste estado, tente reenviar para reconciliar.' : '';
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
let contactBackdropStart = false;
el('contact-detail').addEventListener('pointerdown', e => { contactBackdropStart = e.target === el('contact-detail'); });
el('contact-detail').addEventListener('click', e => { if (contactBackdropStart && e.target === el('contact-detail')) closeContact(); contactBackdropStart = false; });
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
    if (contactDirty) { el('contact-feedback').textContent = 'Guarde as alterações antes de reenviar.'; return; }
    try {
      await api('contactos-reenviar/', { id: contactCurrent.id });
    } finally {
      await openContact(contactCurrent.id);
      await loadContacts();
    }
  });
function confirmContactDeletion() {
  const dialog = el('delete-confirmation');
  el('delete-description').textContent = `Pedido de ${contactCurrent.name} (${contactCurrent.email}). Esta ação não pode ser desfeita neste painel.`;
  return new Promise(resolve => {
    let accepted = false, outside = false;
    const done = () => { dialog.removeEventListener('close',done); resolve(accepted); };
    el('delete-cancel').onclick = () => dialog.close();
    el('delete-accept').onclick = () => { accepted = true; dialog.close(); };
    dialog.onpointerdown = e => { outside = e.target === dialog; };
    dialog.onclick = e => { if(outside && e.target === dialog) dialog.close(); outside = false; };
    dialog.addEventListener('close',done);
    dialog.showModal();
  });
}
el('contact-delete').onclick = () =>
  contactTask(async () => {
    if (contactDirty) { el('contact-feedback').textContent = 'Guarde ou descarte as alterações antes de eliminar.'; return; }
    if (!await confirmContactDeletion()) return;
    await api('contactos-eliminar/', {
      id: contactCurrent.id,
      revision: contactCurrent.revision,
      confirm: contactCurrent.id,
    });
    contactDirty = false;
    el('contact-detail').close();
    contactOffset = 0;
    await loadContacts();
    msg('Pedido eliminado do painel. Reveja também emails e backups.');
  });
for (const [id,kind] of [['contact-email','zoho'],['contact-whatsapp','whatsapp']]) el(id).addEventListener('click',()=>{
  if (contactCurrent) api('contactos-acao/',{id:contactCurrent.id,kind}).catch(()=>{ el('contact-feedback').textContent='Não foi possível registar a abertura no histórico.'; });
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
