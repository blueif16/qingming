"""Mean of the interleaved A/B bench runs (gen/details/trees/tools/ab_trees.sh): per tier, view and side (A cards,
B 3D trees): fps, CPU ms, GPU ms, draw calls, triangles (all passes). Usage: python3 ab_summary.py <run_dir>"""
import json, sys, glob, os, statistics as st
d = sys.argv[1]
rows = {}
for f in glob.glob(os.path.join(d, '*_[AB]_[0-9]', 'bench.json')):
    kind, side, rep = os.path.basename(os.path.dirname(f)).split('_')
    for r in json.load(open(f))['rows']:
        if str(r.get('label', '')).startswith('warm'):
            continue
        rows.setdefault((kind, r['view'], side), []).append(r)
out = []
for (kind, view, side) in sorted(rows):
    rs = rows[(kind, view, side)]
    m = lambda k: st.mean([x[k] for x in rs if x.get(k) is not None]) if any(x.get(k) is not None for x in rs) else float('nan')
    out.append((kind, view, side, len(rs), m('fps'), m('cpuMs'), m('gpuMs'), m('calls'), m('tris') / 1000))
print(f"{'tier':6} {'view':12} side  n    fps   CPU ms  GPU ms  calls  ktris")
for o in out:
    print(f"{o[0]:6} {o[1]:12} {('cards' if o[2]=='A' else '3D'):5} {o[3]:2} {o[4]:6.1f} {o[5]:7.2f} {o[6]:7.2f} {o[7]:6.0f} {o[8]:6.0f}")
