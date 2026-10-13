"""The river.json `how` block (water reaches and banks) and the slope things' `moves` (S2 Run 2, boats agent)."""
import json

PLAN = "gen/sections/canal/river_plan.json"
SM = json.load(open("slope_moves.json"))
how = {
    "S2.water.bian_river_w": {"how": "ground", "why": f"one flat strip at the frame's water H -0.7 (kit_boats.water_strip) between its shores as built ({PLAN}): the north shore moved south with the north bank (dD 0 on the S3 seam, -2.0 to -2.9 east of u 20700) so the strip before the shops is a 3 m walk (the strip is painted 0.5-1.5 m deep at about half of life; build_rules: room to walk from recorded moves, not frame changes), taken to 1.0 m (in D) south of the built bank top where the mapped est shore lies north of it (the lead's rule: water only to the bank top); on the seam the shore meets the bank top at (149.37, 24.68); the south shore as mapped"},
    "S2.water.bian_river_w2": {"how": "ground", "why": f"one flat strip at the water's H between its shores as built ({PLAN}): the north shore moved south with the north bank (-1.1 to -2.9: the trackers' 4 m haul west, the long house's front on the mapped bank top, the terrace and steps), the mapped bulge at u 22250-22400 kept where it lies further south; the south shore (the mound, the flat, the spit) as mapped; it closes straight from the south shore's end on the silk's bottom edge to the north shore's end at u 23300"},
    "S2.water.bian_river_m": {"how": "ground", "why": f"one flat strip at the water's H south of its north shore as built ({PLAN}): moved south with the north bank (-0.5 to -3.3: the eatery, the scaffold house, the open shop, 沿河雅座 and the warehouse stand on the mapped bank top) and taken 1.0-1.3 m south of the built bank top (the mapped est shores lie north of it); no south shore: the silk's bottom edge cuts the water (mist beyond)"},
    "S2.water.bian_river_e": {"how": "ground", "why": f"one flat strip at the water's H south of its north shore as built ({PLAN}): moved south with the north bank only in its west part (u 26000-26700: the white-wall house, -1.9 to -3.2); east of that the painted bank is a broad wash slope and the shore stays as mapped (the moved bank top narrows the slope to 2-3.5 m); unchanged from u 28160 (the east wharf); no south shore (the silk's bottom edge)"},
    "S2.grd.north_bank_20500": {"how": "ground", "why": f"the ground falls from the built bank top (H 0) to the built shore at the water's H ({PLAN}): both moved south along the receding direction by the plan's shift (0 on the S3 seam, -2.3 by u 20700, -2.0 to -2.9 before the shops and the tiled wall) for a 3.0 m walk in front of the slatted fence, the shop row, the open shop and the wall (painted 0.5-1.5 m deep at about half of life); the bank 1.0 m wide (0 on the seam, where the shore meets S3's at the bank top)"},
    "S2.grd.north_bank_22550": {"how": "ground", "why": f"the trackers' bank and the strip before the houses and the terrace, as built ({PLAN}): moved south -1.1 to -2.9 (the trackers' 4 m haul on the flat, the white wall, gateway and long house fronts on the mapped bank top: a 3.0 m walk); the bank 1.0-2.1 m (in D) so it stays at least 0.8 m across where it runs aslant; the landing steps go with it (moves)"},
    "S2.grd.bank_n_23300": {"how": "ground", "why": f"the north bank before the terrace, the eatery, the yard, the scaffold house and the halls, as built ({PLAN}): moved south -0.5 to -3.3 for a 3.0 m walk (the halls and the warehouse plinth stand on the mapped bank top; the strip is painted 0.2-1.2 m deep); the bank 1.0-1.3 m"},
    "S2.grd.north_bank_26000": {"how": "ground", "why": f"the north bank at the east wharves, as built ({PLAN}): the bank top moved south -1.9 to -3.2 at the white-wall house, the wattle fence, the great willow and the jetty, easing to 0 by u 28160 (the east wharf is 6-9 m wide); its shore moved only in the west (u 26000-26700), east of that the broad painted wash slope narrows instead (2-3.5 m) and the shore stays as mapped"},
}
for sid in ("S2.grd.south_bank_20500", "S2.grd.mound_south_bank_21420", "S2.grd.south_bank_flat_21850", "S2.grd.south_bank_spit_22400"):
    how[sid] = {"how": "ground", "why": f"the ground falls from its mapped bank top (H 0) to its mapped shore at the water's H; lines as mapped ({PLAN} banks)"}

WHY = {
    "S2.str.landing_steps_22950": "goes with the north bank (river_plan.json shift at its u, -2.72 along the receding direction): the rough steps run from the built bank top down into the water at the terrace's west end, as painted (unmoved, they would end on the new flat 2.7 m short of the water)",
    "S2.prop.mooring_post_23126": "a post standing in the water off the terrace: moved with the north shore (-2.69 at its u) so it stands as far out in the water as painted, with 豪华客船 moored to it",
    "S2.prop.mooring_post_25207": "the moored boat's post on the bank slope (support bank slope, H -0.35): moved with the bank to half way down the built slope at its u (-4.0; the bank top moves -3.4 here), so it stands at the water's edge as painted and not in the middle of the new walk",
    "S2.fig.man_with_sticks_bank_24390": "stands on the bank slope by the cargo boat's ladder (support bank slope): moved with the bank to half way down the built slope at his u",
    "S2.fig.sack_porter_bank_edge_24467": "the porter on the bank slope carrying a sack to the cargo boat (support bank slope): moved with the bank to half way down the built slope at his u",
}
moves = {}
TERRACE = {"dX": 1.19, "dD": -1.99}
L = json.load(open("layout_premoves.json"))
on = [k for k, e in L["entities"].items() if "river_terrace_23250" in str(e.get("support", ""))]
on += [f["map_id"] for f in L["figures"] if "river_terrace_23250" in str(f.get("support", ""))]
moves["S2.bld.river_terrace_23250"] = dict(TERRACE, why=(
    "the riverside dining terrace goes with the north bank (the area agent's call; river_plan.json): painted with its "
    "front floor on stilts over the bank slope and its diners over the water, and the bank moves south -1.7 to -2.6 "
    "under it for the walk; moved as one group with everything on its floor by the bank's mean displacement along its "
    "front (u 22980-23500), so its front stands 0.7 m down the built slope with the stilts' feet at the water, and the "
    "ground between it and the hall behind (2.7-2.8 m) and its floor are the walk"))
for mid in on:
    moves[mid] = dict(TERRACE, why="on the dining terrace's floor: goes with the terrace (S2.bld.river_terrace_23250, "
                                   "moved with the north bank as one group), so its painted place on the floor holds")
for mid, why in WHY.items():
    m = SM[mid]
    moves[mid] = {"dX": m["dX"], "dD": m["dD"], "why": why}
json.dump({"how": how, "moves": moves}, open("river_how.json", "w"), indent=1, ensure_ascii=False)
print(len(how), "how,", len(moves), "moves")
