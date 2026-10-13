#!/usr/bin/env bash
# Rebuild a section headless only to get its per-owner geometry (gen/sections/<name>/owners.{json,bin}, written by
# blender/owners_dump.py from blender/build_web_scene.py), leaving everything else as it was: the builder's own outputs
# (sections/<name>/placed.json, gen/sections/<name>/*.json such as seats.json or solids.json, and the raw GLB in
# web_build/) are copied aside first and put back after, and any that the rebuild changed is reported as DRIFT (the
# builder differs from what built the shipped section). Nothing is exported or shipped. gen/details/brief_contacts.md.
#   tools/owners_build.sh <name> [<name> ...]     (each build takes a Blender slot through tools/build_scene.sh)
set -euo pipefail
QM="$(cd "$(dirname "$0")/.." && pwd)"
LOGDIR="$QM/gen/details/contacts/build"
mkdir -p "$LOGDIR"
for name in "$@"; do
  sec="$QM/sections/$name" gen="$QM/gen/sections/$name"
  bak="$LOGDIR/$name.bak"; rm -rf "$bak"; mkdir -p "$bak/sec" "$bak/gen" "$bak/web_build"
  cp -p "$sec"/*.json "$bak/sec/" 2>/dev/null || true
  cp -p "$gen"/*.json "$bak/gen/" 2>/dev/null || true
  cp -p "$gen/web_build/${name}_raw.glb" "$gen/web_build/build.log" "$bak/web_build/" 2>/dev/null || true
  marker="$LOGDIR/$name.marker"; touch "$marker"
  t0=$(date +%s)
  status=ok
  "$QM/tools/build_scene.sh" "$name" > "$LOGDIR/$name.out" 2>&1 || status=failed
  cp "$gen/web_build/build.log" "$LOGDIR/$name.build.log" 2>/dev/null || true
  # put back every file the rebuild touched, noting the ones whose content changed
  drift=()
  for pair in "sec:$sec" "gen:$gen" "web_build:$gen/web_build"; do
    k="${pair%%:*}" d="${pair#*:}"
    while IFS= read -r f; do
      [ -n "$f" ] || continue
      b="$bak/$k/$(basename "$f")"
      if [ "$k" = web_build ]; then
        if [ -e "$b" ]; then cp -p "$b" "$f"; else rm -f "$f"; fi
        continue
      fi
      [ "$(basename "$f")" = owners.json ] && continue
      # only what a builder writes; anything else newer than the marker is someone else's edit: leave it, say so
      case "$k/$(basename "$f")" in
        sec/placed.json|gen/seats.json|gen/solids.json|gen/ground_at.json|gen/river_plan.json) ;;
        *) drift+=("untouched(other writer?):$k/$(basename "$f")"); continue ;;
      esac
      if [ -e "$b" ]; then
        if ! cmp -s "$b" "$f"; then
          if python3 -c "import json,sys; a,b=(json.load(open(p)) for p in sys.argv[1:3]); [x.pop(k, None) for x in (a,b) for k in ('date','seconds')]; sys.exit(0 if a==b else 1)" "$b" "$f" 2>/dev/null; then :; else
            cp -p "$f" "$LOGDIR/$name.drift.$(basename "$f")"; drift+=("$k/$(basename "$f")"); fi
        fi
        cp -p "$b" "$f"
      else
        drift+=("new:$k/$(basename "$f")"); mv "$f" "$LOGDIR/$name.drift.$(basename "$f")"
      fi
    done < <(find "$d" -maxdepth 1 -type f -newer "$marker" ! -name owners.bin)
  done
  rm -f "$marker"
  echo "$name: build $status in $(( $(date +%s) - t0 )) s; $(grep -o '"owners_tris": [0-9]*' "$LOGDIR/$name.out" | head -1); drift: ${drift[*]:-none}"
done
