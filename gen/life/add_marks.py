"""Give chatter groups their intent marks (web/src/ui/marks.js PICTOS) from the table in gen/life/marks.json.
   python3 gen/life/add_marks.py      (every section's talk.json; a group not in the table keeps what it has)"""
import json, glob, os
Q = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
T = json.load(open(os.path.join(Q, 'gen/life/marks.json'), encoding='utf-8'))
for p in sorted(glob.glob(os.path.join(Q, 'sections/*/talk.json'))):
    d = json.load(open(p, encoding='utf-8'))
    if not d.get('chatter'): continue
    n = 0
    out = []
    for g in d['chatter']:
        m = T.get(g['id'])
        if m and g.get('mark') != m:
            ng = {}
            for k, v in g.items():
                if k == 'mark': continue
                ng[k] = v
                if k == 'title_en': ng['mark'] = m
            if 'mark' not in ng: ng['mark'] = m
            g = ng; n += 1
        out.append(g)
    d['chatter'] = out
    if n:
        json.dump(d, open(p, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
        open(p, 'a', encoding='utf-8').write('\n')
    print(os.path.relpath(p, Q), n, 'marks set')
