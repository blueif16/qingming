S3 QA tools (run 3), rebuilt from the lost run-2 QA agent's transcript, then extended. Run from a copy of this folder
with node_modules -> qingming/tools/node_modules and package.json -> qingming/tools/package.json, every page step
through tools/chrome_slot.sh against http://127.0.0.1:5190.
- probe.mjs <url> probe/hits.js '{"cx":125,"cd":12,"x0":78,"x1":164,"d0":-8,"d1":36,"step":0.1}' > probe/hits2.json
  (collider heights, 5 MB) and probe/people.js '{"cx":125,"cd":12}' > probe/people.json; probe/boats.js: boats and contacts.
- planner.py: free-space grid and A* over those probes (CL = clearance). gen_routes.py <out.json>: the 34 alone routes
  (waypoints). routes_boats.py: the 8 boat routes. calib_walk.mjs <url> <routes.json> <out.json>: walks each route's
  waypoints in the page and writes walk_page legs. Then tools/walk_page.mjs checks the result as it is.
- hud_shots.mjs <url> <out_dir> hud_spots.json: Space HUD screenshots at landmarks, with hud.you() and the boxes drawn.
