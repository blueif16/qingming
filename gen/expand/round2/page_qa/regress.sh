#!/usr/bin/env bash
# The page agent's regression run (restart brief, "Page agent"): the world's 42 walks, boats.html's 12 walks and
# 5 rides, and a quick people_check on the default world, all in one Chrome slot against the check server (5190).
#   gen/expand/round2/page_qa/regress.sh <tag> [world|boats|rides|people|contacts ...]   (no list: all five)
# contacts (gen/details/brief_contacts.md): the people dump (tools/people_dump.mjs, one page load) then
# tools/contact_check.mjs all; a reported line only (REPORT, never FAIL) until the contact fixes land.
# Logs: gen/expand/round2/page_qa/<tag>/<check>.log, and one PASS/FAIL line per check in <tag>/summary.txt.
set -uo pipefail
QM=/home/ran/3d_director/qingming
tag=${1:?tag}; shift
which=("$@"); [ ${#which[@]} -gt 0 ] || which=(world boats rides people contacts)
out=$QM/gen/expand/round2/page_qa/$tag
mkdir -p "$out"
"$QM/tools/check_server.sh" start >/dev/null
cd "$QM"
B=http://127.0.0.1:5190
WORLD_URL=${WORLD_URL:-$B/world.html}
BOATS_URL=${BOATS_URL:-$B/boats.html} # e.g. with ?tier=low
run() { # name, command...
  local name=$1; shift
  "$@" > "$out/$name.log" 2>&1; local rc=$?
  local line="$name: $( [ $rc -eq 0 ] && echo PASS || echo "FAIL (exit $rc)" )"
  case $name in
    world|boats) line="$line  $(grep -c '^PASS' "$out/$name.log") pass, $(grep -c '^FAIL' "$out/$name.log") fail" ;;
    rides) line="$line  $(grep -c '^PASS' "$out/$name.log") pass, $(grep -c '^FAIL' "$out/$name.log") fail" ;;
    contacts) line="contacts: REPORT $( [ $rc -eq 0 ] || echo "(exit $rc) ")$(grep '^contact_check:' "$out/$name.log" | tail -1 | cut -c16-)" ;;
  esac
  echo "$line" | tee -a "$out/summary.txt"
}
export -f run 2>/dev/null
: > "$out/summary.txt"
echo "$(date '+%F %T') regress $tag: ${which[*]}  (world url $WORLD_URL)" >> "$out/summary.txt"
for w in "${which[@]}"; do
  case $w in
    world)  run world  node tools/walk_page.mjs "$WORLD_URL" sections/world/walks.json ;;
    boats)  run boats  node tools/walk_page.mjs "$BOATS_URL" gen/boats/page_test/walks.json ;;
    rides)  run rides  node gen/expand/round2/page_qa/ride_test.mjs "$BOATS_URL" ;;
    people) run people node tools/people_check.mjs "$WORLD_URL" ;;
    contacts) run contacts sh -c "node tools/people_dump.mjs --url $B && node tools/contact_check.mjs all --quiet" ;;
  esac
done
