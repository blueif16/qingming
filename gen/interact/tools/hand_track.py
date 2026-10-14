#!/usr/bin/env python3
"""Print a clip's right-hand track from the joint tracks (gen/details/joints/<name>.json), to judge a strike.
  python3 gen/interact/tools/hand_track.py <character> <clip>"""
import json, os, sys
QM = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../..'))
j = json.load(open(os.path.join(QM, f'gen/details/joints/{sys.argv[1]}.json')))
c = j['clips'][sys.argv[2]]; S = c['sites']
print({k: v for k, v in c.items() if k not in ('sites', 't')})
for i, t in enumerate(c['t']):
    g = lambda s: S[s][i * 3:i * 3 + 3]
    p, e, pl, sl, sr = g('palm_R'), g('elbow_R'), g('palm_L'), g('sole_L'), g('sole_R')
    print(f"{t:4.1f} palmR x{p[0]:6.3f} y{p[1]:6.3f} z{p[2]:6.3f}  elbR y{e[1]:5.2f} z{e[2]:5.2f}  palmL {pl[0]:5.2f} {pl[1]:5.2f} {pl[2]:5.2f}  soles {sl[0]:5.2f},{sl[1]:5.2f},{sl[2]:5.2f} {sr[0]:5.2f},{sr[1]:5.2f},{sr[2]:5.2f}")
