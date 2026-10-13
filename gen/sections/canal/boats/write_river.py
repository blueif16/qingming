"""Compose gen/sections/canal/choices/river.json (the boats agent's fragment) from river_how.json (how, slope and
terrace moves) and boats_choices.json (boats and their crews' moves, when present)."""
import json
import os
QM = "/home/ran/3d_director/qingming"
H = json.load(open("river_how.json"))
B = json.load(open("boats_choices.json")) if os.path.exists("boats_choices.json") else {"boats": {}, "moves": {}}
moves = dict(H["moves"])
for k, v in B.get("moves", {}).items():
    assert k not in moves, k
    moves[k] = v
frag = {"owner": "river", "about": "the boats agent's fragment (S2 Run 2): the river as built (gen/sections/canal/river_plan.json), its boats' kit options, and the moves of everything that goes with the river (gen/sections/canal/boats/)",
        "moves": dict(sorted(moves.items())), "how": dict(sorted(H["how"].items())), "unbuilt": B.get("unbuilt", {}),
        "edges": {}, "boats": dict(sorted(B.get("boats", {}).items()))}
json.dump(frag, open(f"{QM}/gen/sections/canal/choices/river.json", "w"), indent=1, ensure_ascii=False)
print("river.json:", {k: len(v) for k, v in frag.items() if isinstance(v, dict)})
