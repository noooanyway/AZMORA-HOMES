import assert from 'node:assert/strict';
import { existsSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const file = 'src/data/houses.json';
const read = name => readFileSync(name, 'utf8').replace(/^\uFEFF/, '');
const records = JSON.parse(read(file));
const numeric = ['bedrooms', 'bathrooms', 'year', 'area_m2'];
const text = ['brand', 'model', 'name_for_site', 'typology', 'description_azmora'];
const availability = ['por_confirmar', 'disponivel', 'reservado', 'vendido', 'em_breve'];
function positive(value, key) {
  assert(value === null || (Number.isFinite(value) && value > 0), key + ': número inválido');
}
function validate(items) {
  const ids = new Set();
  const mediaSlugs = new Set();
  for (const row of items) {
    assert(/^([a-z0-9]+-)*[a-z0-9]+$/.test(row.id) && !ids.has(row.id), 'ID inválido/repetido: ' + row.id);
    ids.add(row.id);
    const url = new URL(row.source.url);
    assert(url.protocol === 'https:' && ['www.exposul.pt','exposul.pt'].includes(url.host) && url.pathname.startsWith('/shop/'), 'Origem inválida');
    assert(row.name_for_site?.trim() && row.brand?.trim(), 'Falta título ou marca');
    assert(row.typology === null || /^T\d+$/.test(row.typology), 'Tipologia inválida');
    for (const key of [...numeric,'public_price_eur']) positive(row[key],key);
    for (const key of ['length','width']) positive(row.dimensions_m[key],key);
    assert(availability.includes(row.availability), 'Disponibilidade inválida');
    assert(typeof row.publish === 'boolean' && typeof row.catalogue_preview_allowed === 'boolean', 'Publicação inválida');
    assert(Array.isArray(row.equipment_summary) && row.equipment_summary.every(s => typeof s === 'string'), 'Equipamentos inválidos');
    assert(Array.isArray(row.media), 'Galeria inválida');
    if (row.media.length) {
      assert(typeof row.media_slug === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(row.media_slug) && !mediaSlugs.has(row.media_slug), 'Pasta de fotografias inválida ou repetida: ' + row.id);
      mediaSlugs.add(row.media_slug);
    }
    for (const photo of row.media) {
      assert(photo.alt?.trim(), 'Falta descrição de imagem');
      for (const img of [photo.src,photo.small,...(photo.cover?[photo.cover]:[])]) {
        const prefix = `images/casas/${row.media_slug}/${row.media_slug}-`;
        assert(typeof img === 'string' && img.startsWith(prefix) && /^\d+(?:-(?:small|cover))?\.(?:webp|avif)$/.test(img.slice(prefix.length)) && existsSync(path.join('public', img)), 'Imagem inválida: ' + img);
      }
    }
  }
}
// CSV do kit usa RFC 4180: aspas duplicadas, vírgulas e quebras dentro de campos.
function parseCSV(input) {
  const rows=[]; let row=[], field='', quoted=false;
  for(let i=0;i<input.length;i++){
    const c=input[i];
    if(c==='"' && quoted && input[i+1]==='"'){field+='"';i++;continue;}
    if(c==='"'){quoted=!quoted;continue;}
    if(!quoted && c===','){row.push(field);field='';continue;}
    if(!quoted && (c==='\r'||c==='\n')){
      if(c==='\r' && input[i+1]==='\n')i++;
      row.push(field);if(row.some(Boolean)) rows.push(row); row=[];field='';continue;
    }
    field+=c;
  }
  assert(!quoted,'CSV inválido: aspas por fechar');
  if(row.length||field)rows.push([...row,field]);
  const columns=rows.shift();
  assert(columns?.includes('id'),'O CSV precisa de cabeçalho com id');
  return rows.map(values=>{
    assert(values.length===columns.length,'Linha CSV com número de campos incorreto');
    return Object.fromEntries(columns.map((key,i)=>[key,values[i]]));
  });
}
function importDraft(input) {
  assert(Array.isArray(input),'Esperada uma lista de unidades');
  const updated=structuredClone(records);
  const seen=new Set();
  for(const source of input){
    assert(typeof source.id==='string' && !seen.has(source.id),'ID ausente ou repetido no ficheiro');
    seen.add(source.id);
    const existing=updated.find(h=>h.id===source.id);
    const data=existing || {
      id:source.id,source:{supplier:'Exposul'},reference_azmora:null,model:null,typology:null,description_azmora:null,
      bedrooms:null,bathrooms:null,year:null,area_m2:null,dimensions_m:{length:null,width:null},
      equipment_summary:[],condition:null,media:[],public_price_eur:null,availability:'por_confirmar',publish:false,catalogue_preview_allowed:true
    };
    const before=structuredClone(data);
    const url=source.source?.url || source.source_url;
    if(url){assert(!existing || existing.source.url===url,'Mudança da fonte requer revisão manual: '+source.id);data.source.url=url;}
    for(const key of text){
      const value=source[key] || (key==='name_for_site' ? source.original_title : undefined);
      if(value!=null && value!=='') data[key]=String(value);
    }
    for(const key of numeric) if(source[key]!=null && source[key]!=='') data[key]=Number(source[key]);
    for(const key of ['length','width']){
      const value=source.dimensions_m?.[key] ?? source[key+'_m'];
      if(value!=null && value!=='') data.dimensions_m[key]=Number(value);
    }
    if(Array.isArray(source.equipment_summary) && source.equipment_summary.length) data.equipment_summary=source.equipment_summary;
    if(!existing)updated.push(data);
    const changes=Object.keys(data).filter(k=>JSON.stringify(before[k])!==JSON.stringify(data[k]));
    if(changes.length)console.log(source.id,existing?'atualização':'nova unidade',changes.join(', '));
  }
  validate(updated);
  return updated;
}
validate(records);
if(process.argv.includes('--import')){
  const filename=process.argv[process.argv.indexOf('--import')+1];
  assert(filename && !filename.startsWith('--'),'Usa npm run catalog:import -- ficheiro.json [--apply]');
  const raw=read(filename);
  const result=importDraft(filename.toLowerCase().endsWith('.csv')?parseCSV(raw):JSON.parse(raw));
  if(process.argv.includes('--apply')){
    writeFileSync(file+'.tmp',JSON.stringify(result,null,2)+'\n',{flag:'wx'});
    renameSync(file+'.tmp',file);
    console.log('Importação concluída.');
  }else console.log('Simulação concluída. Acrescenta --apply para guardar.');
}else console.log(records.length+' unidades verificadas.');
