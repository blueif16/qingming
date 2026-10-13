import json
R = []
def add(label, start, via=(), push=(), expect=None, why=None):
    w = {'label': label, 'start': list(start), 'via': [list(v) for v in via], 'push': [list(p) for p in push], 'expect': expect or {}}
    if why: w['why'] = why
    R.append(w)
SB = 'S3.veh.boat_moored_south_bank_19745'
add("board the boat moored along the south bank past the arch over its bow end, from the bank", (148.5, 6.0), via=[(148.5, 9.2)],
    expect={'X': [148.0, 149.0], 'D': [8.7, 9.7], 'H': [-0.1, 0.45]},
    why=f"{SB} touches the bank along its whole south side (5 bank bridges); its middle lies under its arched mat awning (crown 1.0 m above the bank), so you step aboard at its open bow and stern ends")
add("board the south-bank boat over its stern end, by the S2 seam", (155.8, 6.2), via=[(155.8, 9.2)],
    expect={'X': [155.2, 156.4], 'D': [8.6, 10.8], 'H': [-0.1, 0.45]})
add("aboard the south-bank boat's stern, walk east: its rails keep you aboard past the S2 seam (nothing to step off onto)", (155.8, 6.2), via=[(155.8, 9.2)], push=[[0, 4]],
    expect={'X': [155.6, 160.0], 'D': [8.2, 11.0], 'H': [-0.1, 0.45]},
    why="its stern runs about 3 m past the seam (S2 side) as painted; run 3 removed the strip of ground past the seam across the river (the builder's wet() past the seams), which its stern bridges had opened onto")
add("aboard the south-bank boat: it rides the water and you ride with it (20 s against its north rail at the bow)", (148.5, 6.0), via=[(148.5, 9.2)], push=[[90, 20]],
    expect={'X': [147.6, 150.0], 'D': [8.7, 11.0], 'H': [-0.1, 0.45]})
add("off the south-bank boat's bow back onto the bank", (148.5, 6.0), via=[(148.5, 9.2)], push=[[270, 3]],
    expect={'X': [148.0, 149.0], 'D': [2.5, 7.8], 'H': [-0.5, 0.15]})
BB = 'S3.veh.boat_mast_lowering_19518'
add("board the big boat under the arch (大船抢险) from the south bank, where its side touches the bank", (138.3, 9.3), push=[[90, 4]],
    expect={'X': [138.2, 139.6], 'D': [13.4, 15.0], 'H': [0.05, 0.6]},
    why=f"{BB}: its rim piece 6 touches the bank under the arch (bridge foot (137.98, 10.16)); it rests at its painted spot (pause_s [3600, 3]) while its mast goes down and up, so its bridge stays open")
add("aboard the big boat: 20 s on its deck while its mast goes down, and you are still aboard", (138.3, 9.3), push=[[90, 4], [80, 20]],
    expect={'X': [138.2, 140.0], 'D': [13.4, 15.2], 'H': [0.05, 0.6]})
add("off the big boat back onto the south bank under the arch", (138.3, 9.3), via=[(138.0, 13.6), (138.0, 9.6)],
    expect={'X': [137.6, 139.6], 'D': [7.0, 10.6], 'H': [-0.6, 0.1]})
json.dump(R, open('walks/routes_boats.json', 'w'), indent=1)
print(len(R), 'boat routes')
