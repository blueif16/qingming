#!/usr/bin/env bash
# Run headless Blender (tools/blender_wsl.sh) inside one of the machine's three Blender slots, the same slot locks
# tools/build_scene.sh takes, so no more than three Blenders run at once however many agents build.
#   qingming/tools/blender_slot.sh -b --factory-startup --python blender/<script>.py -- <args>
set -euo pipefail
QM="$(cd "$(dirname "$0")/.." && pwd)"
slots="${QINGMING_BLENDER_SLOTS:-3}"
while :; do
  for i in $(seq 1 "$slots"); do
    exec {lockfd}>"/tmp/qingming_blender_slot_$i.lock"
    if flock -n "$lockfd"; then break 2; fi
    exec {lockfd}>&-
  done
  sleep 5
done
"$QM/tools/machine.sh" wait   # memory headroom on both sides first (skill scroll-section, Machine resources)
exec "$QM/tools/blender_wsl.sh" "$@"
