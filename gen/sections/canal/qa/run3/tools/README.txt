S2 finisher's route tools (restart run, 2026-10-12), rebuilt from the dead S2 QA agent's transcript and extended.
Run page tools only through tools/chrome_slot.sh against http://127.0.0.1:5190.
- grid.mjs <url> <out.json> x0 x1 d0 d1 step [--wait ms]: every collider surface under a ray from H 9 per cell, the
  floors the page's capsule stands on unmoved, the boats and the people's bodies (S2 alone at 0.25 m: about 12 s).
- render.mjs <grid.json> <out.png> [scale] [x0 x1]: plan picture (green ground, orange raised floors, red blocked,
  black void, blue river bed; bank tops white, shores cyan, the route yellow, people red circles).
- planner.py <grid.json> "X,D;X,D;..." [--cl m] [--level lo,hi]: A* legs for walk_page ([facing, seconds] at 2.2 m/s).
  Env GEOM=1 takes each cell's floor from the surfaces (head room 1.9 m), CAPS=1 blocks cells whose capsule test fails
  with two failing neighbours (walls; a lone failure is a slope's false negative), WALKERS=1 blocks walkers' paths and
  the trackers' runs. Use --level -1.25,0.35 for ground routes, or table tops count as floors.
- q.py X,D ... | q.py line X0,D0 X1,D1: the surfaces and capsule floors at points (reads grid25.json beside it).
- contacts.mjs <url>: each boat's open rim pieces (onto the bank, a neighbour or its plank) at rest.
- hud_shots.mjs <url> <out_dir> <spots.json>: Space-HUD screenshots (from the S1 finisher's script).
