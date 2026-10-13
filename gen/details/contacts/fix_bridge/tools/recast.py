#!/usr/bin/env python3
"""Record a recast in sections/<s>/contact_fixes.json (fix_standard.md rule 1): the figure's do (and character), with
the reason (cast_why):  python3 recast.py <section> <figure> '<do json>' '<why>' [character]"""
import json, os, sys
QM = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../../..'))
sec, fig, do, why = sys.argv[1:5]
p = os.path.join(QM, f'sections/{sec}/contact_fixes.json')
fx = json.load(open(p, encoding='utf-8'))
e = fx['figures'].setdefault(fig, {})
e['do'] = json.loads(do)
if len(sys.argv) > 5:
    e['character'] = sys.argv[5]
e['class'] = 'recast'
e['why'] = 'recast (fix_standard rule 1): ' + why
json.dump(fx, open(p, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
open(p, 'a').write('\n')
print(fig, e['do'])
