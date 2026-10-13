#!/usr/bin/env python3
"""Compose sections/canal/build_choices.json from the area agents' fragments (S2, round 2 Run 2).

Each agent of the S2 area owns one fragment in gen/sections/canal/choices/ and never edits build_choices.json by hand:
  river.json  the boats agent: `boats` (kit options per boat), `moves` for everything that moves with the river plan
              (boats, their crews, figures and props on the bank slope or in the water), `how` for the water reaches
              and the banks it rebuilds (the shifted north shore), `edges` it decides (shore walls, rails)
  build.json  the builder: `how`, `unbuilt`, `edges`, and `moves` of land things (a tree or prop out of a wall)
  cast.json   the casting agent: `moves` only where a figure or animal must move as a recorded choice (rare: nudges in
              people.json are the usual tool)
A key (map ID, edge name) may appear in only one fragment per block: the merge fails and names both owners otherwise.

    python3 gen/sections/canal/merge_choices.py          # writes sections/canal/build_choices.json
    node tools/map_layout.mjs S2                         # then the layout picks the moves up

Deterministic: the same fragments always give the same file, so two agents running it at once write the same thing.
"""
import json
import os
import sys

QM = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
FRAG = os.path.join(QM, "gen", "sections", "canal", "choices")
OUT = os.path.join(QM, "sections", "canal", "build_choices.json")
BLOCKS = ("moves", "how", "unbuilt", "edges", "boats")
ABOUT = ("Where the build of S2 (the canal wharves, u 20500-29050) departs from the scroll map, and why "
         "(map/BUILDING.md). Composed by gen/sections/canal/merge_choices.py from the agents' fragments in "
         "gen/sections/canal/choices/ (river.json: the boats agent; build.json: the builder; cast.json: the casting "
         "agent); never edit by hand. moves: positions (metres, X east, D north), applied by tools/map_layout.mjs on "
         "top of map/world/S2.json when it writes layout.json. how: an entity built differently from its kind's "
         "default. unbuilt: mapped things not built yet, with the reason and who decided. edges: the walkable "
         "area's walls. boats: kit options per boat (blender/build_boats.py), each with its reason.")


def main():
    out = {"about": ABOUT}
    owner = {b: {} for b in BLOCKS}
    for b in BLOCKS:
        out[b] = {}
    names = sorted(f for f in os.listdir(FRAG) if f.endswith(".json")) if os.path.isdir(FRAG) else []
    bad = []
    for fn in names:
        frag = json.load(open(os.path.join(FRAG, fn), encoding="utf-8"))
        for b in BLOCKS:
            for k, v in (frag.get(b) or {}).items():
                if k in owner[b]:
                    bad.append(f"{b}.{k}: in {owner[b][k]} and {fn}")
                    continue
                owner[b][k] = fn
                out[b][k] = v
    if bad:
        print("MERGE FAILED, a key in two fragments:\n  " + "\n  ".join(bad), file=sys.stderr)
        sys.exit(1)
    for b in BLOCKS:
        out[b] = dict(sorted(out[b].items()))
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(out, f, indent=1, ensure_ascii=False)
        f.write("\n")
    print("build_choices.json: " + ", ".join(f"{b} {len(out[b])}" for b in BLOCKS) + f" (from {', '.join(names)})")


if __name__ == "__main__":
    main()
