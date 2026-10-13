"""Add English glosses (_en siblings) to a talk.json from a zh -> en table (gen/life/en/<name>.json).
   python3 gen/life/en/add_en.py sections/outer_road/talk.json gen/life/en/outer_road.json
Every say/think/name/title/lead/note string (or list) gets key_en; every `as` gets `as_en`. Missing glosses are listed
and left out (tools/ui_data.mjs check then fails on them)."""
import json, sys
src, table = sys.argv[1], sys.argv[2]
d = json.load(open(src, encoding='utf-8'))
T = json.load(open(table, encoding='utf-8'))
missing = set()
def tr(v):
    if isinstance(v, list): return [tr(x) for x in v]
    if v in T: return T[v]
    missing.add(v); return None
def walk(o):
    if isinstance(o, dict):
        for k in list(o.keys()):
            v = o[k]
            if k in ('say', 'think', 'name', 'title', 'lead', 'note') and (isinstance(v, str) or isinstance(v, list)) and v:
                e = tr(v)
                if e is not None and (not isinstance(e, list) or all(x is not None for x in e)): o[k + '_en'] = e
            elif k == 'as' and isinstance(v, dict):
                ae = {kk: tr(vv) for kk, vv in v.items()}
                if all(x is not None and (not isinstance(x, list) or all(y is not None for y in x)) for x in ae.values()): o['as_en'] = ae
            if k not in ('kinds',): walk(v)
    elif isinstance(o, list):
        for x in o: walk(x)
walk(d)
# keep the _en key right after its Chinese key
def order(o):
    if isinstance(o, dict):
        out = {}
        for k, v in o.items():
            if k.endswith('_en') and k[:-3] in o: continue
            out[k] = order(v)
            if k + '_en' in o: out[k + '_en'] = o[k + '_en']
        return out
    if isinstance(o, list): return [order(x) for x in o]
    return o
d = order(d)
json.dump(d, open(src, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
open(src, 'a', encoding='utf-8').write('\n')
print(f'{src}: {len(missing)} missing' + (': ' + ' | '.join(sorted(missing)) if missing else ''))
