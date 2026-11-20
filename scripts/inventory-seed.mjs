import fs from 'node:fs';
const houses = JSON.parse(fs.readFileSync('src/data/houses.json', 'utf8'));
const quote = (value) => "'" + value.replaceAll("'", "''") + "'";
for (const house of houses) {
  const values = [
    house.id,
    house.media_slug,
    JSON.stringify(house),
    house.publish ? 'live' : 'draft',
    'ImportaÃ§Ã£o inicial',
  ];
  console.log(
    'INSERT INTO inventory(id,slug,data,state,actor) VALUES (' +
      values.map(quote).join(',') +
      ') ON CONFLICT(id) DO NOTHING;',
  );
}
for (const house of houses)
  for (const m of house.media)
    for (const key of new Set([m.src, m.small, m.cover].filter(Boolean))) {
      console.log(
        'INSERT INTO uploads(path,width,height) VALUES (' +
          quote(key) +
          ',' +
          m.width +
          ',' +
          m.height +
          ') ON CONFLICT(path) DO NOTHING;',
      );
    }
