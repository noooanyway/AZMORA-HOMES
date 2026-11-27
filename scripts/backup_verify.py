"""Validate a D1 SQL export and its referenced photo files in an isolated database."""
import argparse
import json
import re
import sqlite3
import sys
from pathlib import Path

PHOTO = re.compile(r'^images/(?:uploads|casas/[a-z0-9-]+)/[a-z0-9-]+\.(?:webp|avif|jpg)$')

def verify(sql_file, photos):
    root = Path(photos).resolve(strict=True)
    db = sqlite3.connect(':memory:')
    try:
        db.executescript(Path(sql_file).read_text(encoding='utf-8-sig'))
        if db.execute('PRAGMA integrity_check').fetchone()[0] != 'ok':
            raise ValueError('Integridade da base de dados falhou.')
        required = {'inventory', 'uploads', 'activity', 'contact_requests', 'contact_history', 'contact_limits', 'contact_tokens'}
        tables = {name for (name,) in db.execute("SELECT name FROM sqlite_master WHERE type='table'")}
        if not required <= tables:
            raise ValueError('Tabelas essenciais em falta.')
        # Legacy exports predate website settings; new exports must include both tables.
        settings_tables = {'site_settings', 'site_settings_history'}
        present = settings_tables & tables
        if present and present != settings_tables:
            raise ValueError('Configurações incompletas no backup.')
        if present:
            row = db.execute('SELECT draft,published,revision,published_revision FROM site_settings WHERE id=1').fetchone()
            if not row or not isinstance(json.loads(row[0]), dict) or not isinstance(json.loads(row[1]), dict) or row[2] < 0 or row[3] < 0:
                raise ValueError('Configurações inválidas no backup.')
            snapshot = db.execute('SELECT data FROM site_settings_history WHERE published_revision=? ORDER BY id DESC LIMIT 1', (row[3],)).fetchone()
            if not snapshot or json.loads(snapshot[0]) != json.loads(row[1]):
                raise ValueError('Histórico publicado não corresponde às configurações.')
            for (data,) in db.execute('SELECT data FROM site_settings_history'):
                if not isinstance(json.loads(data), dict):
                    raise ValueError('Histórico de configurações inválido.')
        references = set()
        for (raw,) in db.execute('SELECT data FROM inventory'):
            for photo in json.loads(raw).get('media', []):
                references.update(photo.get(k) for k in ('src', 'small', 'cover') if photo.get(k))
        for key in references:
            if not isinstance(key, str) or not PHOTO.fullmatch(key):
                raise ValueError('Referência de fotografia inválida.')
            target = (root / key).resolve()
            if not target.is_relative_to(root) or not target.is_file() or target.stat().st_size == 0:
                raise ValueError('Fotografia referenciada em falta ou vazia.')
        return len(references)
    finally:
        db.close()

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('database_sql')
    parser.add_argument('photos_directory')
    args = parser.parse_args()
    try:
        print(f'OK: base restaurada em memória; {verify(args.database_sql, args.photos_directory)} fotografias referenciadas verificadas.')
    except (OSError, ValueError, sqlite3.Error, json.JSONDecodeError):
        print('Falha de verificação da cópia; não publicar nem aplicar retenção.', file=sys.stderr)
        sys.exit(1)
