"""Copy the clip round's spots (gen/interact/slots.json) into the page's data (web/public/assets/interact.json): the
moat rails' standing lines and free ranges per character and the root's height, the Rainbow Bridge's two player
slots, the drum's strike (clip, length, hit time, prop) and its stand spots per character. Re-runnable.
    python3 gen/interact/tools/to_interact.py
"""
import json, os, collections
QM = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
S = json.load(open(os.path.join(QM, 'gen/interact/slots.json')))
f = os.path.join(QM, 'web/public/assets/interact.json')
D = json.load(open(f), object_pairs_hook=collections.OrderedDict)
join = {j['id']: j for j in D['join']}

m = S['moat_bridge']
moat = join['moat_rail']
moat['clips'] = {'child': m['child']}
moat['rails'] = [{'id': r['id'], 'facing_deg': r['facing_deg'], 'clip': r['clip'], 'H': m['H'], 'line': r['line'], 'free': r['free'],
                  'lines': r['lines'], 'free_by': r['free_by_character']} for r in m['rails']]
moat['rails_src'] = 'gen/interact/slots.json moat_bridge (H: the root held there, not grounded; lines/free_by per character)'

c = S['crown']
crown = join['crown_rail']
crown['slots'] = [{'id': s['id'], 'X': s['X'], 'D': s['D'], 'H': s['H'], 'facing_deg': s['facing_deg'], 'clip': s['clip'], 'child': s['child']} for s in c['slots']]
crown['slots_src'] = 'gen/interact/slots.json crown (the rail crowd leaves no gap at the crown: a 4.75 m down the NE ramp, b 5.6 m down the SW ramp; H the lower tread, under the walked ramp)'

d = S['drum']
dr = D['drum']
dr['strike'] = {'clip': d['clip'], 'length': d['length_s'], 'hit_s': d['hit_s'], 'hit_by': d['hit_s_by_character'], 'prop': d['prop']}
for st in dr['stands']:
    side = d['sides'][st['side']]
    st['facing_deg'] = side['facing_deg']
    st['spots'] = side['spots']
dr['stands_src'] = 'gen/interact/slots.json drum (a spot per character: the stick tip meets the face at hit_s)'
open(f, 'w').write(json.dumps(D, ensure_ascii=False, indent=2) + '\n')
print('interact.json: moat rails', [r['id'] for r in moat['rails']], 'crown slots', [s['id'] for s in crown['slots']], 'drum stands', [s['side'] for s in dr['stands']])
