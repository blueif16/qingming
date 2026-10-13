#!/usr/bin/env python3
"""Merge the fix-boats IK specs into characters/ik_variants.json and their clip sources into characters/<name>.json.
Run under the flock: flock /tmp/qingming_charbuild.lock python3 gen/details/contacts/fix_boats/tools/merge_variants.py"""
import json, os
QM = '/home/ran/3d_director/qingming'
specs = json.load(open(f'{QM}/gen/details/contacts/fix_boats/variants.json'))
p = f'{QM}/characters/ik_variants.json'
raw = open(p, encoding='utf-8').read()
v = json.loads(raw)
v.update(specs)
json.dump(v, open(p, 'w', encoding='utf-8'), ensure_ascii=False, indent=1 if raw.startswith('{\n "') else 2)
SRC = {'boatman': {'work_sweep~bar': 'ik:work_sweep@sweep_bar', 'pole_boat~hold': 'ik:pole_boat@pole_hold_boatman',
                   'fend_pole~up': 'ik:fend_pole@fend_up', 'fend_pole~out': 'ik:fend_pole@fend_out'},
       'inspector': {'work_sweep~bar': 'ik:work_sweep@sweep_bar'},
       'straw_hat': {'pole_boat~hold': 'ik:pole_boat@pole_hold_straw_hat'}}
for name, clips in SRC.items():
    cp = f'{QM}/characters/{name}.json'
    raw = open(cp, encoding='utf-8').read()
    c = json.loads(raw)
    c['clips'].update(clips)
    with open(cp, 'w', encoding='utf-8') as f:
        json.dump(c, f, ensure_ascii=False, indent=1 if raw.startswith('{\n "') else 2)
        if raw.endswith('\n'):
            f.write('\n')
    print(name, len(c['clips']), 'clips')
print('specs', list(specs))
