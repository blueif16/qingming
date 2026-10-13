#!/usr/bin/env bash
# Headless build of a section's web scene (skill web-scene): blender/<name>_scene.py -> build -> raw GLB in
# gen/sections/<name>/web_build/, placed.json in sections/<name>/. Runs the Windows Blender in the background with
# factory settings, so it never touches the live GUI session; up to three sections build at once (slot locks).
#   qingming/tools/build_scene.sh <name>        e.g. gate, outer_road, inner_city
set -euo pipefail
QM="$(cd "$(dirname "$0")/.." && pwd)"
name="${1:?usage: build_scene.sh <name>}"
out="$QM/gen/sections/$name/web_build"
mkdir -p "$out"
log="$out/build.log"
# at most 3 headless Blenders at once on this machine (16 cores; Windows and WSL share 32 GB): take one of three slot locks, waiting if
# all are taken (many agents build at the same time; QINGMING_BLENDER_SLOTS overrides the count)
slots="${QINGMING_BLENDER_SLOTS:-3}"
while :; do
  for i in $(seq 1 "$slots"); do
    exec {lockfd}>"/tmp/qingming_blender_slot_$i.lock"
    if flock -n "$lockfd"; then got=$i; break 2; fi
    exec {lockfd}>&-
  done
  sleep 5
done
"$QM/tools/machine.sh" wait   # memory headroom on both sides first (skill scroll-section, Machine resources)
"$QM/tools/blender_wsl.sh" -b --factory-startup --python "$QM/blender/build_web_scene.py" -- "${name}_scene" "$(wslpath -w "$out")" > "$log" 2>&1 || { tail -30 "$log"; exit 1; }
grep -E "^BUILD_STATS|Error|Traceback" "$log" | tail -5
