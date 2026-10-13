#!/usr/bin/env python3
"""Ship only the boat crews' entries of sections/<s>/people.json into web/public/assets/<s>/people.json (fix-boats; the
lead's rule: a fixer ships only its own changes). Crew = figures whose layout support starts with "boat" plus the
trackers in any boats.<slug>.haul; copied: their figures entries, their nudge_why / cast_why / facing_why /
props_why entries, and the whole `boats` block (the boats agent's, now fix-boats'). Run under the lock:
    flock /tmp/qingming_contact_fixes.lock python3 gen/details/contacts/fix_boats/tools/ship_crew.py <section> [--dry]"""
import json
import os
import sys

QM = '/home/ran/3d_director/qingming'
sec = sys.argv[1]
dry = '--dry' in sys.argv
src = json.load(open(f'{QM}/sections/{sec}/people.json', encoding='utf-8'))
dst_p = f'{QM}/web/public/assets/{sec}/people.json'
raw = open(dst_p, encoding='utf-8').read()
dst = json.loads(raw)
lay = json.load(open(f'{QM}/sections/{sec}/layout.json', encoding='utf-8'))
crew = {f['id'] for f in lay.get('figures', []) if (f.get('support') or '').startswith('boat')}
for b in (src.get('boats') or {}).values():
    crew |= set((b.get('haul') or {}).keys()) | set((b.get('crew') or {}).keys())
changed = []
for fid in sorted(crew):
    if fid not in src.get('figures', {}):
        continue
    if dst.get('figures', {}).get(fid) != src['figures'][fid]:
        changed.append(fid)
        dst.setdefault('figures', {})[fid] = src['figures'][fid]
    for k in ('nudge_why', 'cast_why', 'facing_why', 'props_why'):
        if fid in (src.get(k) or {}):
            dst.setdefault(k, {})[fid] = src[k][fid]
        elif fid in (dst.get(k) or {}) and k in src:
            dst[k].pop(fid, None)
if dst.get('boats') != src.get('boats'):
    changed.append('boats')
    dst['boats'] = src.get('boats') or {}
if src.get('boats_fix_why'):
    dst['boats_fix_why'] = src['boats_fix_why']
print(f'{sec}: {len(crew)} crew, {len(changed)} entries differ: {changed[:30]}')
if not dry and changed:
    with open(dst_p, 'w', encoding='utf-8') as f:
        json.dump(dst, f, ensure_ascii=False, indent=1 if raw.startswith('{\n "') else None)
    print(f'  -> {os.path.relpath(dst_p, QM)}')
