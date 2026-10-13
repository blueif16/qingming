# The before/after check table (markdown) from carry_check.mjs --json outputs:
#   python3 gen/details/children/check_table.py check_before.json check_after.json
import json, sys
B = {(r['prop'], r['carrier']): r for r in json.load(open(sys.argv[1]))}
A = {(r['prop'], r['carrier']): r for r in json.load(open(sys.argv[2]))}
cm = lambda x: f'{x * 100:.1f}'
print('| prop · carrier | contact | before: bind / max / float (cm) | after: bind / max / float (cm) |')
print('|---|---|---|---|')
for k in A:
    a, b = A[k], B.get(k)
    for i, c in enumerate(a['contacts']):
        bc = next((x for x in (b or {}).get('contacts', []) if x['name'] == c['name']), None)
        bs = f"{cm(bc['bind'])} / {cm(bc['max'])} / {cm(bc['float'])}{'' if bc['pass'] else ' FAIL'}" if bc else 'n/a'
        print(f"| {k[0]} · {k[1]} | {c['name']} | {bs} | {cm(c['bind'])} / {cm(c['max'])} / {cm(c['float'])}{'' if c['pass'] else ' FAIL'} |")
    pb = f"{cm(b['pen'])}{' FAIL' if b['pen'] > 0.01 else ''}" if b else 'n/a'
    print(f"| {k[0]} · {k[1]} | **penetration over the cycle** | {pb} | {cm(a['pen'])}{' FAIL' if a['pen'] > 0.01 else ''} |")
    print(f"| {k[0]} · {k[1]} | **verdict** (departure from rigid, stretch) | {'PASS' if b and b['pass'] else 'FAIL'} | {'PASS' if a['pass'] else 'FAIL'} ({cm(a['deform'])} cm, {a.get('stretch', 0) * 100:.0f}%) |")
