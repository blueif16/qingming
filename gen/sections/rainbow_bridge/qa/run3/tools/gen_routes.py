# S3 QA: the alone routes (waypoints from planner.py), for calib_walk.mjs -> walks.json
import json, math, os, sys
os.environ.setdefault('CL', '0.36')
import planner as P
AX = 48.69  # the bridge's axis, deg from east
def wall_stop(p0, hd, wall, r=0.3):
    a, b = wall; x, d = p0; h = math.radians(hd)
    for i in range(4000):
        if P.seg_d(x, d, a, b) <= r: return (x, d)
        x += 0.01 * math.cos(h); d += 0.01 * math.sin(h)
    return None
def box(pt, tol=0.35): return {'X': [round(pt[0] - tol, 2), round(pt[0] + tol, 2)], 'D': [round(pt[1] - tol, 2), round(pt[1] + tol, 2)]}
def via(a, b):
    r, msg = P.plan_path(a, b)
    if not r: raise SystemExit(f'no path {a} -> {b}: {msg}')
    return r['pts'][1:]
def free_near(x, d, rad=1.0):
    best = None
    for i in range(-10, 11):
        for j in range(-10, 11):
            X, D = x + i * rad / 10, d + j * rad / 10
            f = P.floor(X, D)
            if f[2] and (best is None or math.hypot(X - x, D - d) < best[0]): best = (math.hypot(X - x, D - d), (round(X, 2), round(D, 2)))
    return best[1] if best else None
W_WEST = [(95.98, -4.39), (88.39, 14.11)]; W_EAST_S = [(160.85, -4.39), (156.16, 7.49)]; W_EAST_N = [(149.37, 24.68), (147.06, 30.54)]
W_SOUTH = [(95.98, -4.39), (160.85, -4.39)]; W_NORTH = [(81.65, 30.54), (138.479, 30.54)]; W_NORTH_E = [(144.907, 30.54), (147.06, 30.54)]
EN = [tuple(p) for p in P.plan['edge_north']['polyline']]
R = []
def add(label, start, vias=(), push=(), expect=None, why=None):
    w = {'label': label, 'start': list(start), 'via': [list(v) for v in vias], 'push': [list(p) for p in push], 'expect': expect or {}}
    if why: w['why'] = why
    R.append(w)
G = {'H': [-0.12, 0.25]}
# --- the bridge
SF, NS = (124.8, 8.0), (145.5, 28.0)
add('across the bridge, south foot -> crown -> north foot, onto the north bank (through the painted deck crowd)', SF, via(SF, NS),
    expect={'X': [144.6, 146.4], 'D': [27.1, 28.9], **G}, why='the trace passes the crown at H ~5.3; waypoints threaded round the deck figures (bodies 0.26 m) and the sedan')
add('across the bridge, north bank -> north foot -> crown -> south foot', NS, via(NS, SF), expect={'X': [123.9, 125.7], 'D': [7.1, 8.9], **G})
CR = P.xy(13.1, -1.95)
add('up the south ramp onto the crown', SF, via(SF, CR), expect={**box(CR, 0.5), 'H': [5.05, 5.45]})
# railings (in the gaps of the painted railing figures)
for s, o, side, hd in [(18.25, -1.0, 'near (east)', AX - 90), (22.5, -1.0, 'near (east)', AX - 90), (17.0, 1.0, 'far (west)', AX + 90), (9.0, 1.0, 'far (west)', AX + 90), (3.5, 0.5, 'far (west)', AX + 90)]:
    st = P.xy(s, o); H = P.deckH(s)
    lo, hi = sorted([P.xy(s - 0.7, 3.83 if o > 0 else -3.83), P.xy(s + 0.3, 3.83 if o > 0 else -3.83)])
    xs = sorted([lo[0], hi[0]]); ds = sorted([lo[1], hi[1]])
    add(f'the {side} railing stops you on the deck (station {s} m, deck H {H:.2f})', [round(v, 2) for v in st], push=[[round(hd % 360, 1), 2.5]],
        expect={'X': [round(xs[0] - 0.3, 2), round(xs[1] + 0.3, 2)], 'D': [round(ds[0] - 0.3, 2), round(ds[1] + 0.3, 2)], 'H': [round(P.deckH(s + 0.3) - 0.3, 2), round(P.deckH(s - 0.7) + 0.3, 2)] if s > 12.4 else [round(P.deckH(s - 0.7) - 0.3, 2), round(P.deckH(s + 0.3) + 0.3, 2)]},
        why='the railing collider at the deck edge (bridge_plan.json walk.railing); the walker may slide a little down the slope along it; picked where the painted railing figures leave a gap')
# the ramps' sides from the ground: nobody walks under or onto a ramp from its side
for st in [(134.0, 10.0), (130.6, 7.3)]:
    st = free_near(*st, 0.6); so = P.so(*st)
    a, b = P.xy(so[0] - 0.8, -4.3), P.xy(so[0] + 0.8, -5.3)
    add(f"the south ramp's near (east) side stops you on the ground (station {so[0]:.1f} m, deck H {P.deckH(so[0]):.2f})", st, push=[[round((AX + 90) % 360, 1), 2.5]],
        expect={'X': sorted([round(a[0], 2), round(b[0], 2)]), 'D': sorted([round(a[1] - 0.3, 2), round(b[1] + 0.3, 2)]), 'H': [-0.7, 0.25]}, why='nobody walks under a ramp or steps onto it over its railing (ends on the ground or the bank below it, outside the deck edge)')
for st in [(145.6, 24.6), (146.0, 25.4)]:
    st = free_near(*st, 0.8)
    if not st: continue
    so = P.so(*st); a, b = P.xy(so[0] - 0.8, -4.3), P.xy(so[0] + 0.8, -5.3)
    add(f"the north ramp's near (east) side stops you on the north bank (station {so[0]:.1f} m, deck H {P.deckH(so[0]):.2f})", st, push=[[round((AX + 90) % 360, 1), 2.5]],
        expect={'X': sorted([round(a[0], 2), round(b[0], 2)]), 'D': [round(min(a[1], b[1]) - 0.3, 2), round(max(a[1], b[1]) + 0.3, 2)], **G})
# --- banks
S4 = (93.0, 6.0)
add('the south bank road from the S4b seam east to the bridge\'s south foot', S4, via(S4, SF), expect={**box(SF, 0.6), **G})
add('the south bank road from the bridge\'s south foot west to the S4b seam (its wall stops you, alone)', SF, via(SF, S4), push=[[202.3, 2]],
    expect={**box(wall_stop(S4, 202.3, W_WEST), 0.35), **G})
UA, OS = (140.0, 7.5), (152.0, 5.0)
add('from the south foot east under the arch, past the open shop to the S2 seam (its wall stops you)', SF, via(SF, (134.0, 8.2)) + via((134.0, 8.2), UA) + via(UA, OS), push=[[21.5, 3]],
    expect={'X': [155.6, 157.3], 'D': [4.6, 7.0], **G}, why='the S2 seam runs at 111.5 deg: the stop lies 0.3 m inside it; kept north of the painted walk of the porters and the donkey (D 4.3, X 127-135.5)')
NF = (142.8, 28.8)
add('the north bank from the north foot east to the S2 seam (its wall stops you)', NF, via(NF, (145.0, 27.3)) + via((145.0, 27.3), (146.2, 27.4)), push=[[21.5, 2.5]],
    expect={'X': [147.2, 148.4], 'D': [27.0, 29.0], **G}, why='the seam runs at 111.5 deg: the stop lies 0.3 m inside it')
add('the far bank is closed: west from the north foot you climb the north ramp and stop at its far railing', (142.3, 30.6), push=[[180, 3]],
    expect={'X': [137.4, 138.6], 'D': [28.8, 30.0], 'H': [0.7, 1.3]}, why='the far railing runs to the foot; beyond it the far bank lies past the water (closed)')
add('the far bank is closed: north-west off the north foot\'s run-out', (141.6, 30.8), push=[[150, 3]],
    expect={'X': [138.9, 141.0], 'D': [30.4, 32.6], **G})
# --- edges
add('west edge (alone): the S4b seam stops you on the south bank road', (94.5, 3.0), push=[[202.3, 3]], expect={**box(wall_stop((94.5, 3.0), 202.3, W_WEST)), **G})
add('west edge (alone): the S4b seam stops you near the shore', (91.5, 10.5), push=[[202.3, 2]], expect={**box(wall_stop((91.5, 10.5), 202.3, W_WEST)), **G})
add('east edge (alone): the S2 seam stops you on the south bank', (154.5, 5.0), push=[[21.5, 3]], expect={**box(wall_stop((154.5, 5.0), 21.5, W_EAST_S)), **G})
add('east edge (alone): the S2 seam stops you east of the open shop, by the street', (158.0, -2.5), push=[[21.5, 3]], expect={**box(wall_stop((158.0, -2.5), 21.5, W_EAST_S)), **G})
add('east edge (alone): the S2 seam stops you on the north bank', (146.0, 27.6), push=[[21.5, 3]], expect={**box(wall_stop((146.0, 27.6), 21.5, W_EAST_N)), **G})
add('north edge: the silk\'s top edge stops you on the north bank, by the painted figures at the edge', (145.5, 28.5), push=[[90, 2.5]], expect={'X': [144.9, 145.9], 'D': [29.5, 30.3], **G},
    why='figure_topedge_19925 stands 0.15 m inside the top edge (145.29, 30.39): you stop at its body or the wall')
add('north edge: the wall round the north foot stops you north-east of the run-out', (142.6, 31.0), push=[[45, 2.5]], expect={'X': [142.6, 143.8], 'D': [31.3, 32.5], **G})
add('north edge: the wall round the north foot\'s run-out stops you past the top edge', (141.3, 31.0), push=[[90, 2.5]],
    expect={'X': [140.9, 141.7], 'D': [32.8, 33.6], **G}, why='build_choices edges.north_detour')
for x in (113.0, 124.0, 144.0):
    add(f'south edge: the silk\'s bottom edge stops you (X {x})', (x, -2.0 if x != 113 else -2.5), push=[[270, 2]], expect={**box(wall_stop((x, -2.0), 270, W_SOUTH)), **G})
for (x, d), hd, what in [((92.0, 10.0), 90, 'the west reach near the S4b seam'), ((105.0, 8.0), 90, 'the west reach by the riverside hall'),
                         ((116.0, 9.5), 90, 'the west reach by the unloading boat\'s bank'), ((140.0, 7.5), 90, 'under the arch, south bank'),
                         ((147.5, 27.6), 270, 'the north bank east of the bridge')]:
    add(f'shore: the water\'s edge stops you ({what})', (x, d), push=[[hd, 3]], expect={'X': [x - 0.3, x + 0.3], 'H': [-0.7, 0.1]},
        why='edge:shore; the stop D is read from the trace (the shore line from river_plan.json)')
R[-1]['expect']['X'] = [147.0, 148.4]
json.dump(R, open(sys.argv[1], 'w'), indent=1)
print(len(R), 'routes')
