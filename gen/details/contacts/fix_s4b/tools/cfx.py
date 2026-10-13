#!/usr/bin/env python3
"""Set fields of one figure's entry in sections/<section>/contact_fixes.json (fix-s4b; the standard:
gen/details/contacts/fix_standard.md). Values are JSON; a field set to null is removed.
    python3 cfx.py <section> <figure> key=<json> [key=<json> ...]
e.g. cfx.py outer_road_2 counter_man_leaning_13325 class='"recast"' do='[["lean_over",14],["idle",4]]' why='"..."'
Then rerun the section's casting script (people.json is never edited by hand)."""
import json
import os
import sys

QM = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../../..'))
sec, fig = sys.argv[1], sys.argv[2]
p = os.path.join(QM, f'sections/{sec}/contact_fixes.json')
d = json.load(open(p, encoding='utf-8')) if os.path.exists(p) else {'figures': {}}
e = d.setdefault('figures', {}).setdefault(fig, {})
for kv in sys.argv[3:]:
    k, v = kv.split('=', 1)
    v = json.loads(v)
    if v is None:
        e.pop(k, None)
    else:
        e[k] = v
json.dump(d, open(p, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
open(p, 'a').write('\n')
print(fig, json.dumps(e, ensure_ascii=False)[:600])
