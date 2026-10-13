"""Merge S3's build-choice fragments into sections/rainbow_bridge/build_choices.json.

Run 2 of round 2 builds S3 with several subagents at once (the builder, the bridge fit, the river, the tavern kit, the
props, the casting). Each writes only its own fragment, gen/sections/rainbow_bridge/choices/<agent>.json, with the
keys of build_choices.json (`moves`, `how`, `unbuilt`, `edges`, `boats`; every entry with its `why`), and this script
joins them. Two fragments may not set the same key of the same table (the script stops and names both), except
`moves`: moves of one entity from several fragments add up (dX and dD summed, the reasons joined with each agent's
name), so a strip moved by one agent and a small spread inside it by another compose.

    python3 gen/sections/rainbow_bridge/merge_choices.py          # writes build_choices.json, prints the counts
    python3 gen/sections/rainbow_bridge/merge_choices.py --check  # only checks (no write)

Then run `node tools/map_layout.mjs S3` (moves are applied there).
"""
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
QM = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
OUT = os.path.join(QM, "sections", "rainbow_bridge", "build_choices.json")
TABLES = ("moves", "how", "unbuilt", "edges", "boats")
ABOUT = ("Where the build of S3 (the Rainbow Bridge, u 15500-20500) departs from the scroll map, and why "
         "(map/BUILDING.md). moves: positions (metres, X east, D north), applied by tools/map_layout.mjs on top of "
         "map/world/S3.json when it writes layout.json. how: an entity built differently from its kind's default. "
         "unbuilt: mapped entities not built yet, with the reason. edges: the walkable area's invisible walls. boats: "
         "the boat kit's options per boat (blender/kit_boats.py). Merged by gen/sections/rainbow_bridge/merge_choices.py "
         "from the fragments in gen/sections/rainbow_bridge/choices/ (one per Run 2 agent: never edit this file by hand).")


def main():
    check = "--check" in sys.argv
    out = {"about": ABOUT}
    src = {}
    frags = sorted(f for f in os.listdir(os.path.join(HERE, "choices")) if f.endswith(".json"))
    errors = []
    for f in frags:
        d = json.load(open(os.path.join(HERE, "choices", f), encoding="utf-8"))
        for t in TABLES:
            for k, v in (d.get(t) or {}).items():
                if t == "moves" and k in out.setdefault(t, {}):
                    a = out[t][k]
                    tag = f[:-5]
                    out[t][k] = {"dX": round(a.get("dX", 0) + v.get("dX", 0), 3),
                                 "dD": round(a.get("dD", 0) + v.get("dD", 0), 3),
                                 "why": f"{a.get('why', '')} + [{tag}] {v.get('why', '')}"}
                    if not a.get("why", "").startswith("["):
                        out[t][k]["why"] = f"[{src[(t, k)][:-5]}] " + out[t][k]["why"]
                    src[(t, k)] += "+" + f
                    continue
                if k in out.setdefault(t, {}):
                    errors.append(f"{t}.{k}: set by both {src[(t, k)]} and {f}")
                    continue
                if isinstance(v, dict) and not v.get("why") and t != "boats":
                    errors.append(f"{t}.{k} in {f}: no 'why'")
                if t == "boats" and not (v.get("why")):
                    errors.append(f"boats.{k} in {f}: no 'why'")
                out[t][k] = v
                src[(t, k)] = f
        extra = set(d) - set(TABLES) - {"about", "agent"}
        if extra:
            errors.append(f"{f}: unknown keys {sorted(extra)}")
    for t in TABLES:
        out.setdefault(t, {})
    print("fragments: " + ", ".join(frags))
    print("  " + "  ".join(f"{t} {len(out[t])}" for t in TABLES))
    if errors:
        print("ERRORS:\n  " + "\n  ".join(errors))
        sys.exit(1)
    if not check:
        with open(OUT, "w", encoding="utf-8") as fh:
            json.dump(out, fh, indent=1, ensure_ascii=False)
            fh.write("\n")
        print(f"wrote {os.path.relpath(OUT, QM)}")


if __name__ == "__main__":
    main()
