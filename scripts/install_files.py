#!/usr/bin/env python3
"""Validate a release manifest, back up changed files, and install only its files."""
import hashlib
import json
import shutil
import sys
from datetime import datetime, timezone
from pathlib import Path, PurePosixPath

source, destination, backup_root, list_file = map(Path, sys.argv[1:5])
source, destination, backup_root = source.resolve(), destination.resolve(), backup_root.resolve()
manifest_path = source / 'release-manifest.json'
manifest = json.loads(manifest_path.read_text(encoding='utf-8'))
paths = []
for name, expected in manifest['files'].items():
    rel = PurePosixPath(name)
    if rel.is_absolute() or '..' in rel.parts or '.git' in rel.parts:
        raise SystemExit('ERROR: unsafe package path: ' + name)
    src = source / name
    if not src.is_file() or src.is_symlink() or hashlib.sha256(src.read_bytes()).hexdigest() != expected:
        raise SystemExit('ERROR: release checksum failed: ' + name)
    paths.append(name)
paths.append('release-manifest.json')

stamp = datetime.now(timezone.utc).strftime('%Y%m%d-%H%M%S-%fZ')
backup = backup_root / (destination.name + '-' + stamp)
changed = []
# Validate every destination before copying any file.
for name in paths:
    target = destination / name
    current = destination
    for part in PurePosixPath(name).parts:
        current /= part
        if current.is_symlink():
            raise SystemExit('ERROR: refusing to replace a symlink: ' + str(current))
    if target.exists() and not target.is_file():
        raise SystemExit('ERROR: destination is not a file: ' + str(target))
    if target.is_file() and target.read_bytes() == (source / name).read_bytes():
        continue
    changed.append(name)

for name in changed:
    target = destination / name
    if target.exists():
        copy = backup / name
        copy.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(target, copy)

for name in changed:
    target = destination / name
    target.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(source / name, target)

list_file.write_text('\n'.join(paths) + '\n', encoding='utf-8')
print('Changed files:')
for name in changed:
    print('  ' + str(destination / name))
if not changed:
    print('  None; this release is already installed.')
if backup.exists():
    print('Timestamped backup: ' + str(backup))
