#!/usr/bin/env python3
"""Add a clip source to characters/<name>.json (read-modify-write; run under flock /tmp/qingming_charbuild.lock):
    python3 add_clip.py <character> <clip> <source>"""
import json, sys, os
QM = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../../..'))
name, clip, src = sys.argv[1:4]
p = os.path.join(QM, f'characters/{name}.json')
raw = open(p, encoding='utf-8').read()
d = json.loads(raw)
if d['clips'].get(clip) == src:
    print(f'{name}: {clip} already {src}')
else:
    d['clips'][clip] = src
    open(p, 'w', encoding='utf-8').write(json.dumps(d, ensure_ascii=False, indent=2 if raw.startswith('{\n  "') else 1) + '\n')
    print(f'{name}: {clip} = {src}')
