#!/usr/bin/env python3
"""Add clip sources to characters/<name>.json only where the clip is missing (interactions round, 2026-10-13).
Run under flock /tmp/qingming_charbuild.lock:
  python3 gen/interact/tools/add_clips.py <name,name> <clip>=<source> [<clip>=<source> ...]
Keeps the file's indent; never changes an existing clip."""
import json, os, sys
QM = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../..'))
names = sys.argv[1].split(',')
pairs = [a.split('=', 1) for a in sys.argv[2:]]
for n in names:
    f = os.path.join(QM, 'characters', f'{n}.json')
    raw = open(f).read()
    d = json.loads(raw)
    added = []
    for clip, src in pairs:
        if clip in d['clips']:
            continue
        if '~' in clip:  # an IK variant needs its base clip
            base = clip.split('~')[0]
            if base not in d['clips']:
                print(f'{n}: no base {base} for {clip}: skipped'); continue
        d['clips'][clip] = src
        added.append(clip)
    if added:
        open(f, 'w').write(json.dumps(d, indent=2 if raw.startswith('{\n  "') else 1, ensure_ascii=False) + '\n')
    print(f'{n}: added {added or "nothing"}')
