#!/usr/bin/env python3
"""Merge crew entries into sections/<section>/contact_fixes.json (fix-boats). Run it under the shared lock:
    flock /tmp/qingming_contact_fixes.lock python3 gen/details/contacts/fix_boats/tools/cf_set.py <section> <entries.json>
entries.json: {"figures": {slug: {fields...}}, "boats": {...}} -- each figure's fields replace those keys of its entry
(other keys kept); "boats" entries are merged the same way (tools/contact_fixes.py applies them)."""
import json
import os
import sys

QM = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../../..'))
sec, src = sys.argv[1], sys.argv[2]
p = os.path.join(QM, f'sections/{sec}/contact_fixes.json')
fx = json.load(open(p, encoding='utf-8')) if os.path.exists(p) else {'figures': {}}
new = json.load(open(src, encoding='utf-8'))
for slug, f in (new.get('figures') or {}).items():
    fx.setdefault('figures', {}).setdefault(slug, {}).update(f)
    for k in [k for k, v in f.items() if v is None]:
        fx['figures'][slug].pop(k, None)
for bslug, b in (new.get('boats') or {}).items():
    cur = fx.setdefault('boats', {}).setdefault(bslug, {})
    for k, v in b.items():
        if isinstance(v, dict) and isinstance(cur.get(k), dict):
            for kk, vv in v.items():
                if isinstance(vv, dict) and isinstance(cur[k].get(kk), dict):
                    cur[k][kk].update(vv)
                else:
                    cur[k][kk] = vv
        else:
            cur[k] = v
with open(p, 'w', encoding='utf-8') as f:
    json.dump(fx, f, ensure_ascii=False, indent=1)
    f.write('\n')
print(f'{sec}: {len(new.get("figures") or {})} figure entries, {len(new.get("boats") or {})} boat entries merged -> {os.path.relpath(p, QM)}')
