#!/usr/bin/env python3
"""Apply a section's contact fixes (sections/<name>/contact_fixes.json) to its people.json (the details pass's contact
standard, gen/details/contacts/fix_standard.md).

contact_fixes.json "walkers": {id: {path, why}} (a shorter path for a walker whose painted one runs through a built thing),
"figures": {slug: {class, why (a recast's or fit's reason: cast_why), nudge_why (the placement's,
written by tools/contact_solve.mjs --write), and any of: nudge [dX, dD], facing_deg, do [[clip, s], ...], character,
stand_in, props, root_h (the root's height for a figure seated up on a vehicle with its feet hanging: the proposed
people.js root_h, gen/details/contacts/fix_s4/engine_patches.md)}}, and "boats": {<boat slug>: {crew, haul, ..., why}}
(fix-boats: crew jobs and haul clips merged into people.json boats). Each entry is the last word on those fields for that figure:
  - class "solve": nudge / facing_deg solved by tools/contact_solve.mjs (base_nudge / base_facing: the casting's own,
    which the solve starts from), the reason in nudge_why;
  - class "recast": do (and character) changed because the painting shows no contact for the old clip, the reason in
    cast_why;
  - class "fit" / "ik" / "seat": a fitted object, an IK clip variant (do names "<clip>~<variant>") or a built seat,
    with the nudge that goes with it.
The casting script calls apply() just before it writes people.json, so a rerun of the casting keeps the fixes:
    from contact_fixes import apply as apply_contact_fixes   (sys.path: qingming/tools)
    apply_contact_fixes(people, 'outer_road')
A section without a casting script (the gate) is fixed in place, idempotently:
    python3 tools/contact_fixes.py <section>
"""
import json
import os
import sys

QM = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))


def load(section):
    p = os.path.join(QM, f'sections/{section}/contact_fixes.json')
    return json.load(open(p, encoding='utf-8')) if os.path.exists(p) else {'figures': {}}


def apply(people, section, quiet=False):
    fx = load(section).get('figures', {})
    n = 0
    for slug, f in fx.items():
        spec = people['figures'].get(slug)
        if spec is None:
            print(f'contact_fixes: {slug} is not a figure of {section} (skipped)')
            continue
        why = f.get('why', '')
        moved = False
        for k in ('nudge', 'facing_deg'):
            if k in f:
                moved = moved or spec.get(k) != f[k]
                spec[k] = f[k]
        if 'nudge' in f or 'facing_deg' in f:
            nw = f.get('nudge_why') or why
            base = people.setdefault('nudge_why', {}).get(slug)
            base = base.split(' || casting: ', 1)[-1] if base and base.startswith(('solved', 'fit', 'ik', 'seat', 'contact')) else base
            people['nudge_why'][slug] = nw + (f' || casting: {base}' if base and base != nw else '')
            if 'facing_deg' in f:
                people.setdefault('facing_why', {})[slug] = nw
        for k in ('do', 'character', 'stand_in', 'props', 'root_h'):
            if k in f:
                spec[k] = f[k]
        if any(k in f for k in ('do', 'character', 'stand_in', 'props')) and f.get('class') in ('recast', 'ik', 'fit', 'seat'):
            people.setdefault('cast_why', {})[slug] = why
        n += 1
    # boats (fix-boats): contact_fixes.json "boats": {<boat slug>: {"crew": {fig: {...}}, "haul": {fig: {...}}, other
    # keys, "why": reason}}: merged into people.json boats.<slug> (crew and haul entries field by field), the reason in
    # boats_fix_why; applied last, after the casting's boats block (its crew jobs, its haul clips)
    nb = 0
    for bslug, bf in (load(section).get('boats') or {}).items():
        cur = people.setdefault('boats', {}).setdefault(bslug, {})
        for k, v in bf.items():
            if k == 'why':
                continue
            if k in ('crew', 'haul') and isinstance(v, dict):
                tgt = cur.setdefault(k, {})
                for fig, job in v.items():
                    if job is None:
                        tgt.pop(fig, None)
                    else:
                        tgt.setdefault(fig, {}).update(job)
            else:
                cur[k] = v
        if bf.get('why'):
            people.setdefault('boats_fix_why', {})[bslug] = bf['why']
        nb += 1
    # walkers (fix-gate, 2026-10-13): a walker whose painted path runs through a built thing (a trunk, a barrow) gets a
    # shorter path, "walkers": {id: {path, why}}; the reason goes to walkers_why
    for wid, f in load(section).get('walkers', {}).items():
        w = next((w for w in people.get('walkers', []) if w.get('id') == wid), None)
        if w is None:
            print(f'contact_fixes: walker {wid} is not a walker of {section} (skipped)')
            continue
        if 'path' in f:
            w['path'] = f['path']
        people.setdefault('walkers_why', {})[wid] = f.get('why', '')
        n += 1
    people.setdefault('contact_fixes_why', {})['about'] = (
        f'{n} figures carry a contact fix from sections/{section}/contact_fixes.json (tools/contact_fixes.py; the standard: '
        'gen/details/contacts/fix_standard.md): their nudge / facing_deg / do say why in nudge_why or cast_why')
    if not quiet:
        print(f'contact_fixes: {n} fixes applied to {section}' + (f', {nb} boats' if nb else ''))
    return people


if __name__ == '__main__':
    sec = sys.argv[1]
    p = os.path.join(QM, f'sections/{sec}/people.json')
    people = json.load(open(p, encoding='utf-8'))
    apply(people, sec)
    json.dump(people, open(p, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
