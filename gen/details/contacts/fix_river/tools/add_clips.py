#!/usr/bin/env python3
"""Add clip sources to a character (characters/<name>.json "clips"), read-modify-write; run it under the charbuild lock:
  flock /tmp/qingming_charbuild.lock python3 add_clips.py <character> <clip>=<source> ...
e.g. listen~soles=ik:listen@soles, stand_sleeves=from:farmer/stand_sleeves. Keeps the file's key order and indent."""
import json
import sys

QM = '/home/ran/3d_director/qingming'
name = sys.argv[1]
p = f'{QM}/characters/{name}.json'
raw = open(p, encoding='utf-8').read()
d = json.loads(raw)
indent = 2 if '\n  "' in raw[:200] else 1
for a in sys.argv[2:]:
    k, v = a.split('=', 1)
    old = d['clips'].get(k)
    if old == v:
        print(f'{name}: {k} already {v}')
        continue
    d['clips'][k] = v
    print(f'{name}: {k} = {v}' + (f' (was {old})' if old else ''))
open(p, 'w', encoding='utf-8').write(json.dumps(d, ensure_ascii=False, indent=indent) + ('\n' if raw.endswith('\n') else ''))
