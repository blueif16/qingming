# Paired differences of an in-page A/B (inpage_ab.mjs / crowd_pass.mjs output): per round B - A, median and the share
# of rounds where B was lower. python3 paired.py <file.json>...
import json, sys, statistics as st
for f in sys.argv[1:]:
    r = json.load(open(f))
    print(f)
    for v, x in r['views'].items():
        A, B = x['raw']['A'], x['raw']['B']
        out = []
        for k in ('cpuMs', 'gpuMs', 'fps', 'tris', 'renderMs', 'updateMs', 'shadowMs'):
            if A[0].get(k) is None or not A[0][k]: continue
            d = [b[k] / a[k] - 1 for a, b in zip(A, B)]
            out.append(f"{k} {100 * st.median(d):+.1f}% (B lower {sum(1 for y in d if y < 0)}/{len(d)})")
        print(f"  {v:12s} " + ' | '.join(out))
