#!/usr/bin/env bash
# fix-river: build characters one at a time, each under the charbuild lock with its after-build steps (brief: clip_ground
# --add-missing --write-meta; joint_tracks <name>). clip_ground writes old + the residual it measures on the joint tracks,
# so every write must run on fresh tracks: build -> clip_ground (adds the new clips' entries) -> joint_tracks <name> ->
# clip_ground (the new clips' sole_m from their fresh tracks) -> joint_tracks <name>. NEVER two clip_ground writes without
# joint_tracks in between (2026-10-13: that doubled every residual and diverged clip_meta; see notes.md). ktx2 encode runs
# once at the end.
#   gen/details/contacts/fix_river/tools/build_chars.sh <name ...>
set -u
QM=/home/ran/3d_director/qingming
LOG=$QM/gen/details/contacts/fix_river/build_logs
mkdir -p "$LOG"
cd "$QM"
for c in "$@"; do
  t0=$(date +%s)
  flock /tmp/qingming_charbuild.lock sh -c "node tools/character.mjs $c build > $LOG/$c.build.log 2>&1 && node tools/clip_ground.mjs --add-missing --write-meta > $LOG/$c.cg.log 2>&1 && node tools/joint_tracks.mjs $c > $LOG/$c.jt.log 2>&1 && node tools/clip_ground.mjs --add-missing --write-meta >> $LOG/$c.cg.log 2>&1 && node tools/joint_tracks.mjs $c >> $LOG/$c.jt.log 2>&1"
  echo "$c rc=$? $(( $(date +%s) - t0 )) s: $(grep -E '^[a-z_]+: web/public' $LOG/$c.build.log | cut -c1-80)"
done
