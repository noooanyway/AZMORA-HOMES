"""Create or check a local backup manifest without logging personal data."""
import argparse
import hashlib
import json
import sys
from pathlib import Path
from backup_verify import verify

def digest(path):
    h = hashlib.sha256()
    with path.open('rb') as file:
        for chunk in iter(lambda: file.read(1024 * 1024), b''):
            h.update(chunk)
    return h.hexdigest()

def inspect(folder):
    root = folder.resolve(strict=True)
    if not (root / 'database.sql').is_file() or not (root / 'r2-metadata.json').is_file():
        raise ValueError('Cópia incompleta.')
    photo_dir = root / 'photos'
    if not photo_dir.is_dir():
        raise ValueError('Pasta de fotografias em falta.')
    files = {}
    for p in root.rglob('*'):
        if p.is_symlink():
            raise ValueError('A cópia contém uma ligação simbólica.')
        if p.is_file() and p != root / 'manifest.json':
            name = p.relative_to(root).as_posix()
            files[name] = {'size': p.stat().st_size, 'sha256': digest(p)}
    metadata = json.loads((root / 'r2-metadata.json').read_text(encoding='utf-8-sig'))
    if not isinstance(metadata, list):
        raise ValueError('Lista de objetos inválida.')
    keys = {str(item['key']) for item in metadata}
    actual = {name[len('photos/'):] for name in files if name.startswith('photos/')}
    if len(keys) != len(metadata) or keys != actual:
        raise ValueError('A lista de objetos e os ficheiros locais diferem.')
    for item in metadata:
        if files['photos/' + item['key']]['size'] != item['size']:
            raise ValueError('Tamanho de objeto diferente.')
    references = verify(root / 'database.sql', photo_dir)
    return {'version': 1, 'files': files, 'r2_objects': len(metadata), 'references': references}

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--criar', action='store_true')
    parser.add_argument('folder', type=Path)
    args = parser.parse_args()
    try:
        manifest_path = args.folder / 'manifest.json'
        if args.criar and manifest_path.exists():
            raise ValueError('O manifesto já existe.')
        current = inspect(args.folder)
        if args.criar:
            manifest_path.write_text(json.dumps(current, indent=2, ensure_ascii=False), encoding='utf-8')
        else:
            expected = json.loads(manifest_path.read_text(encoding='utf-8-sig'))
            if current != expected:
                raise ValueError('Hashes ou ficheiros divergentes.')
        print(f"Cópia verificada: {current['r2_objects']} objetos R2; {current['references']} referências a fotografias.")
    except Exception:
        # Do not print SQL, contact data, tokens, object keys or provider responses.
        print('Verificação falhou: a cópia está incompleta ou foi alterada.', file=sys.stderr)
        return 1
    return 0

if __name__ == '__main__':
    sys.exit(main())
