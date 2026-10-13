#!/usr/bin/env python3
"""Summarise gen/perf bench runs (probe.mjs bench): per view, the base frame split, then each experiment's A/B
change in CPU and GPU ms (against the bases measured right beside it). Usage: python3 summarize.py <run_dir> ..."""
import json, sys

for d in sys.argv[1:]:
    b = json.load(open(f'{d}/bench.json'))
    print(f"\n### {d}  viewport {b['viewport']}  throttle {b.get('throttle')}")
    for v, r in b['views'].items():
        base = r['runs'].get('base', {})
        cpu = base.get('cpu', {})
        calls = base.get('calls', {})
        tris = base.get('tris', {})
        q = r.get('quiet', {})
        print(f"\n{v}: people {base.get('people')}  fps {base.get('fps')}  cpu {cpu.get('frame')} ms (p95 {base.get('cpuP95')}, max {base.get('cpuMax')})  gpu {base.get('gpuFrame')}  quiet={q.get('quiet')} waited {q.get('waitedS')}s")
        print('  cpu split: ' + ', '.join(f"{k} {cpu[k]:.2f}" for k in ['color', 'shadow', 'normal', 'overlay', 'post', 'people', 'crowd', 'boats', 'player', 'other'] if k in cpu))
        print('  calls: ' + ', '.join(f"{k} {v2:.0f}" for k, v2 in calls.items()) + f"  (total {sum(calls.values()):.0f})")
        print('  tris k: ' + ', '.join(f"{k} {v2 / 1000:.0f}" for k, v2 in tris.items()) + f"  (total {sum(tris.values()) / 1000:.0f})")
        print(f"  upload KB/frame {base.get('uploadKB')}  bake ms {base.get('bakeMs')}")
        inv = r.get('inventory', {})
        if 'peopleInView' in inv: print(f"  people in view by distance: {inv['peopleInView']}")
        for k, x in (r.get('ab') or {}).items():
            c, g = x['cpu'], x['gpu']
            extra = f"  info {x['info']}" if x.get('info') else ''
            print(f"  {k:20s} cpu {c['base']:6.2f} -> {c['exp']:6.2f} ({100 * (c['ratio'] - 1):+4.0f}%)  gpu {g['base']:6.2f} -> {g['exp']:6.2f} ({100 * (g['ratio'] - 1):+4.0f}%)"
                  f"  calls {x['calls']['base']:.0f}->{x['calls']['exp']:.0f}  color {x['color']['delta']:+.2f} shadow {x['shadow']['delta']:+.2f} normal {x['normal']['delta']:+.2f} people {x['people']['delta']:+.2f}{extra}")
        for k, x in r['runs'].items():
            if k.startswith('base_throttle'):
                print(f"  {k}: fps {x['fps']} cpu {x['cpu']['frame']} (people {x['cpu'].get('people', 0):.2f} color {x['cpu'].get('color', 0):.2f} shadow {x['cpu'].get('shadow', 0):.2f} normal {x['cpu'].get('normal', 0) + x['cpu'].get('overlay', 0):.2f}) p95 {x.get('cpuP95')} max {x.get('cpuMax')}")
        if r.get('overdraw'): print(f"  overdraw {r['overdraw']}  frustum {r.get('frustum')}")
