// This first integrated category covers contacts and social networks only.
let settingsRevision = 0, settingsDirty = false;
const settingLabels = {phone:'Telefone principal', secondPhone:'Telefone secundário', whatsapp:'Número WhatsApp', email:'Email comercial público', openingHours:'Horário de atendimento', timezone:'Fuso horário', languages:'Idiomas de atendimento', instagram:'Instagram', facebook:'Facebook'};
const settingsInputs = {};
for (const [key,label] of Object.entries(settingLabels)) {
  const wrap=node('label',label), input=document.createElement('input'); input.name=key;
  input.type=key==='email'?'email':key==='instagram'||key==='facebook'?'url':'text'; input.maxLength=key==='instagram'||key==='facebook'?500:254;
  wrap.append(input); el('settings-fields').append(wrap); settingsInputs[key]=input;
}
function settingsFill(c) { for(const k of Object.keys(settingLabels)) settingsInputs[k].value = (k==='instagram'||k==='facebook' ? c.social[k] : c[k]) || ''; settingsDirty=false; }
function settingsRead() { const c={}; for(const k of Object.keys(settingLabels)) if(k!=='instagram'&&k!=='facebook') c[k]=settingsInputs[k].value.trim(); c.social={instagram:settingsInputs.instagram.value.trim(),facebook:settingsInputs.facebook.value.trim()}; return c; }
async function settingsLoad() {
  const r=await api('configuracoes/'); settingsRevision=r.revision; settingsFill(r.draft.contacts || r.published.contacts || r.defaults);
  const host=el('settings-history'); host.replaceChildren();
  for(const v of r.history){ const row=node('p',`Versão ${v.published_revision} · ${v.created_at} `); row.append(button('Recuperar esta versão',()=>settingsTask(async()=>{ if(!confirm('Publicar esta versão anterior e substituir o rascunho?'))return; await api('configuracoes-recuperar/',{revision:settingsRevision,historyId:v.id}); await settingsLoad(); el('settings-feedback').textContent='Versão recuperada.'; })));host.append(row); }
}
async function settingsTask(fn){ if(busy||contactBusy)return;busy=true;el('settings').inert=true;try{await fn()}catch(e){el('settings-feedback').textContent=e.message}finally{el('settings').inert=false;busy=false} }
el('show-settings').onclick=()=>{if(busy||contactBusy)return;if(dirty&&!confirm('Sair sem guardar a ficha de inventário?'))return; dirty=false;el('dash').hidden=true;el('edit').hidden=true;el('contacts').hidden=true;el('settings').hidden=false;for(const id of ['show-inventory','show-contacts'])el(id).setAttribute('aria-pressed','false');el('show-settings').setAttribute('aria-pressed','true');settingsTask(settingsLoad)};
for(const id of ['show-inventory','show-contacts']) {const original=el(id).onclick;el(id).onclick=(event)=>{if(!el('settings').hidden && settingsDirty && !confirm('Sair sem guardar as alterações?'))return;el('settings').hidden=true;el('show-settings').setAttribute('aria-pressed','false');original(event)};}
el('settings-form').oninput=()=>{settingsDirty=true;el('settings-feedback').textContent='Tem alterações por guardar.'};
el('settings-form').onsubmit=e=>{e.preventDefault();settingsTask(async()=>{await api('configuracoes-guardar/',{revision:settingsRevision,contacts:settingsRead()});await settingsLoad();el('settings-feedback').textContent='Rascunho guardado.'})};
el('settings-publish').onclick=()=>settingsTask(async()=>{if(settingsDirty)throw Error('Guarde o rascunho antes de publicar.');if(!confirm('Publicar os contactos guardados?'))return;await api('configuracoes-publicar/',{revision:settingsRevision});await settingsLoad();el('settings-feedback').textContent='Alterações publicadas.'});
el('settings-cancel').onclick=()=>{if(!settingsDirty||confirm('Descartar as alterações não guardadas?'))settingsTask(settingsLoad)};
el('settings-preview').onclick=()=>{const box=el('settings-preview-content');box.replaceChildren();const c=settingsRead();for(const [key,label] of Object.entries(settingLabels)){const v=key==='instagram'||key==='facebook'?c.social[key]:c[key];box.append(node('p',label+': '+v))}el('settings-preview-dialog').showModal()};
el('settings-preview-close').onclick=()=>el('settings-preview-dialog').close();
window.addEventListener('beforeunload',e=>{if(settingsDirty){e.preventDefault();e.returnValue=''}});
