"""Prepare a full private restore; never print rows or SQL from a real backup."""
import sys,json,sqlite3,hashlib
from pathlib import Path
from backup_manual_verify import inspect

backup,out,migration=map(Path,sys.argv[1:])
try:
    checked=inspect(backup)
    expected=json.loads((backup/'manifest.json').read_text(encoding='utf-8-sig'))
    if checked!=expected: raise ValueError('Manifesto divergente')
    out.mkdir(parents=True,exist_ok=False)
    db=sqlite3.connect(out/'restored-before.sqlite')
    db.executescript((backup/'database.sql').read_text(encoding='utf-8-sig'))
    def integrity(c):
        if c.execute('PRAGMA integrity_check').fetchone()[0]!='ok' or c.execute('PRAGMA foreign_key_check').fetchall(): raise ValueError('Integridade falhou')
    integrity(db)
    schema=[dict(zip(['type','name','sql'],r)) for r in db.execute("SELECT type,name,sql FROM sqlite_master WHERE sql IS NOT NULL AND name NOT LIKE 'sqlite_%' ORDER BY type,name")]
    tables={}
    for name, in db.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE '_cf_%'"):
        escaped='"'+name.replace('"','""')+'"'
        rows=db.execute('SELECT * FROM '+escaped)
        tables[name]={'columns':[d[0] for d in rows.description],'rows':rows.fetchall()}
    payload={'schema':schema,'tables':tables}
    (out/'restore-input.json').write_text(json.dumps(payload),encoding='utf-8')
    names=[r[0] for r in db.execute('SELECT name FROM d1_migrations')]
    if any(n.startswith('0006') for n in names): raise ValueError('0006 já presente')
    after=sqlite3.connect(out/'restored-after-0006.sqlite');db.backup(after)
    after.executescript(migration.read_text(encoding='utf-8-sig'));integrity(after)
    for name,t in tables.items():
        current=after.execute('SELECT * FROM "'+name.replace('"','""')+'"').fetchall()
        if sorted(current,key=repr)!=sorted(map(tuple,t['rows']),key=repr): raise ValueError('Dados alterados')
    if after.execute('SELECT count(*) FROM inventory_commercial_history').fetchone()[0]!=0: raise ValueError('Histórico retroativo')
    summary={'backup_objects':checked['r2_objects'],'photo_references':checked['references'],'tables':{n:len(t['rows']) for n,t in tables.items()},'migrations_before':names,'integrity_before':'ok','integrity_after':'ok','all_original_rows_unchanged':True,'retroactive_history_rows':0,'backup_manifest_sha256':hashlib.sha256((backup/'manifest.json').read_bytes()).hexdigest()}
    (out/'restore-summary.json').write_text(json.dumps(summary,indent=2),encoding='utf-8')
    after.close();db.close()
    print('OK: restauro SQLite integral, integridade e preservação de todas as linhas após 0006.')
except Exception:
    print('Falha na preparação/restauro isolado; detalhes privados omitidos.',file=sys.stderr);sys.exit(1)
