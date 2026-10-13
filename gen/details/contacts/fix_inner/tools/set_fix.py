#!/usr/bin/env python3
"""Write or merge one figure's entry in sections/<section>/contact_fixes.json (fix-inner, details pass).
  python3 set_fix.py <section> <slug> '<json fields>' [--clipmap a=b,c=d]
--clipmap rewrites the figure's do (from the entry's do, else people.json's) clip by clip; 'why' is appended to an
existing why with '; ' unless --replace-why."""
import json, os, sys
QM = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../../..'))
sec, slug, fields = sys.argv[1], sys.argv[2], json.loads(sys.argv[3])
args = sys.argv[4:]
ff = os.path.join(QM, f'sections/{sec}/contact_fixes.json')
fx = json.load(open(ff, encoding='utf-8')) if os.path.exists(ff) else {'figures': {}}
e = fx['figures'].setdefault(slug, {})
pj = json.load(open(os.path.join(QM, f'sections/{sec}/people.json'), encoding='utf-8'))['figures'][slug]
if '--clipmap' in args:
    cm = dict(x.split('=') for x in args[args.index('--clipmap') + 1].split(','))
    e['do'] = [[cm.get(c, c), s] for c, s in (e.get('do') or fields.get('do') or pj['do'])]
why = fields.pop('why', None)
for k, v in fields.items():
    if v is None:
        e.pop(k, None)
    else:
        e[k] = v
if why:
    e['why'] = why if ('--replace-why' in args or not e.get('why')) else (e['why'] + '; ' + why if why not in e['why'] else e['why'])
json.dump(fx, open(ff, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
open(ff, 'a').write('\n')
print(slug, json.dumps(e, ensure_ascii=False)[:400])
