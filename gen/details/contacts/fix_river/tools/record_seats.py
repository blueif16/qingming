#!/usr/bin/env python3
"""Record seat fits (gen/details/contacts/fix_river/tools/seat_fit.mjs --json) into sections/<s>/contact_fixes.json
"seats", keyed by the sitter's map ID: a stool or folding seat the figure owns gets its centre X, D (under the seat
point), its top top_H and the floor under it base_H; a mapped bench, stool or sack pile ("fit_owner") gets only its top.
  python3 record_seats.py <section> <seat_fit.json> [slug=fit_owner ...]
The casting script (gen/sections/canal/make_people.py) copies them into seats.json; the builder fits them."""
import json
import os
import sys

QM = '/home/ran/3d_director/qingming'
sec, src = sys.argv[1], sys.argv[2]
owners = dict(a.split('=', 1) for a in sys.argv[3:])
path = os.path.join(QM, f'sections/{sec}/contact_fixes.json')
fx = json.load(open(path, encoding='utf-8')) if os.path.exists(path) else {'figures': {}}
seats = fx.setdefault('seats', {})
for r in json.load(open(os.path.join(QM, src), encoding='utf-8')):
    mid = f"S{'2' if sec == 'canal' else '1'}.fig.{r['id']}"
    f = r['fit']
    e = {'top_H': f['top_H'], 'why': ''}
    if r['id'] in owners:
        e['fit_owner'] = owners[r['id']]
        e['why'] = (f"fit (fix_standard.md rule 3): {owners[r['id']]}'s top at {r['model']} {r['clip']}'s seat point on the "
                    f"page ({r['seat_point'][2]} m, median over the cycle, {r['H_range'][0]}..{r['H_range'][1]}) less 0.008 m"
                    f" (top {f['top_H']} m map H, {f['share']:.0%} of the cycle in the rule's window); the mapped seat stays "
                    f"where it is, its height is the builder's choice")
    else:
        e.update({'X': f['X'], 'D': f['D'], 'base_H': f['base_H']})
        e['why'] = (f"fit (fix_standard.md rule 3): his own seat centred under {r['model']} {r['clip']}'s seat point on the "
                    f"page ({f['X']}, {f['D']}), its top at the seat point ({r['seat_point'][2]} m, median over the cycle, "
                    f"{r['H_range'][0]}..{r['H_range'][1]}) less 0.008 m: top {f['top_H']} m map H, on {r['support'].split('|')[-1]} at "
                    f"{f['base_H']} m ({f['seat_h']} m high; {f['share']:.0%} of the cycle in the rule's window)")
    seats[mid] = e
    print(mid, e.get('fit_owner', ''), e['top_H'])
json.dump(fx, open(path, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
open(path, 'a').write('\n')
