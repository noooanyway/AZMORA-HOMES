// Collapse only explicitly linked units; never infer equivalence from a brand/model name.
export function publicModels(units) {
  const groups = new Map();
  const key = h => h.inventory_group?.trim().normalize('NFKC').toLocaleLowerCase('pt-PT') || 'unit:' + h.id;
  for (const h of units) {
    if (!h.publish) continue;
    const k = key(h);
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(h);
  }
  const rank = {disponivel:0,reservado:1,por_confirmar:2,em_breve:3,vendido:4};
  const houses = [], aliases = new Map();
  for (const group of groups.values()) {
    // Stable URL and content: the first published record remains the public listing.
    const representative = group[0];
    const selected = [...group].sort((a,b) => (rank[a.availability] ?? 2) - (rank[b.availability] ?? 2))[0];
    const {inventory_group, reference_azmora, ...publicHouse} = selected;
    houses.push({...publicHouse, name_for_site:representative.name_for_site.replace(/(?:\s*\(cópia\))+$/u,''), id:representative.id, media_slug:representative.media_slug});
    for (const unit of group.slice(1)) aliases.set(unit.media_slug, representative.media_slug);
  }
  return {houses, aliases};
}
