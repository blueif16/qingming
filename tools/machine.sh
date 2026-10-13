#!/usr/bin/env bash
# The machine is one pool: WSL (node, python, dev servers) and Windows (headless Blender, check Chromes, the live GUI)
# share 32 GB, and WSL alone may take 24 GB of it (.wslconfig). Skill scroll-section, "Machine resources".
#   tools/machine.sh status   memory on both sides, load, and every Blender, check Chrome and dev server running
#   tools/machine.sh wait     block until there is headroom to start one more heavy job (the slot scripts call it)
#   tools/machine.sh sweep    stop leftover check Chromes and dev servers (keeps the user's 5180 and the bench Chrome)
# Windows free memory is the binding number: WSL's file cache counts as "available" inside WSL but as used on Windows.
# Thresholds: QM_MIN_WIN_MB (default 3000), QM_MIN_WSL_MB (2000), QM_MAX_LOAD (nproc), QM_WAIT_MAX seconds (1800).
set -euo pipefail
QM="$(cd "$(dirname "$0")/.." && pwd)"
PS=/mnt/c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe

win_free_mb() { "$PS" -NoProfile -Command "[int]((Get-CimInstance Win32_OperatingSystem).FreePhysicalMemory/1KB)" | tr -d '\r'; }
wsl_avail_mb() { awk '/^MemAvailable:/ {print int($2/1024)}' /proc/meminfo; }
load1() { cut -d' ' -f1 /proc/loadavg; }

case "${1:-status}" in
  status)
    echo "windows free  $(win_free_mb) MB"
    echo "wsl available $(wsl_avail_mb) MB   load $(cut -d' ' -f1-3 /proc/loadavg) on $(nproc) cores"
    # WSL counts its file cache as available, but Windows counts the same pages as used by vmmemWSL
    echo "wsl cache     $(awk '/^(Buffers|Cached|SReclaimable):/ {s+=$2} END {print int(s/1024)}' /proc/meminfo) MB (Windows sees it as used; only root's drop_caches frees it)"
    "$PS" -NoProfile -Command "
      \$b = Get-Process blender -ErrorAction SilentlyContinue
      'blender.exe   {0} running, {1:N0} MB' -f @(\$b).Count, ((\$b | Measure-Object WorkingSet64 -Sum).Sum/1MB)
      \$c = Get-CimInstance Win32_Process -Filter \"Name='chrome.exe'\" | Where-Object { \$_.CommandLine -like '*qm-*-profile*' -or \$_.CommandLine -like '*qm-check-*' }
      \$c | Group-Object { if (\$_.CommandLine -match 'qm-[a-z0-9-]+') { \$matches[0] } } | ForEach-Object {
        'chrome        {0}: {1:N0} MB' -f \$_.Name, ((\$_.Group | Measure-Object WorkingSetSize -Sum).Sum/1MB) }" | tr -d '\r'
    ps -eo pid,rss,args | awk '/[n]ode .*vite.*--port/ && !/npm/ { match($0, /--port[ =]?[0-9]+/); print "dev server    pid " $1 ", " int($2/1024) " MB, " substr($0, RSTART, RLENGTH) }'
    for i in 1 2 3 4; do
      for kind in blender chrome; do
        f="/tmp/qingming_${kind}_slot_$i.lock"
        [ -e "$f" ] && ! flock -n "$f" true 2>/dev/null && echo "slot          $kind $i taken"
      done
    done
    true ;;
  wait)
    need_win="${QM_MIN_WIN_MB:-3000}"; need_wsl="${QM_MIN_WSL_MB:-2000}"; max_load="${QM_MAX_LOAD:-$(nproc)}"
    deadline=$(( $(date +%s) + ${QM_WAIT_MAX:-1800} )); said=0
    while :; do
      w=$(win_free_mb); l=$(wsl_avail_mb); ld=$(load1)
      if [ "$w" -ge "$need_win" ] && [ "$l" -ge "$need_wsl" ] && awk "BEGIN {exit !($ld < $max_load)}"; then exit 0; fi
      if [ "$(date +%s)" -ge "$deadline" ]; then
        echo "machine.sh wait: no headroom after ${QM_WAIT_MAX:-1800} s (windows free $w MB, wsl $l MB, load $ld)" >&2
        "$0" status >&2; exit 1
      fi
      if [ $(( $(date +%s) - said )) -ge 60 ]; then
        echo "machine.sh wait: windows free $w MB (need $need_win), wsl $l MB (need $need_wsl), load $ld (max $max_load)" >&2
        said=$(date +%s)
      fi
      sleep 10
    done ;;
  sweep)
    # check Chromes whose slot is free (left behind by a killed job) and every per-agent profile Chrome
    for i in 1 2 3 4; do
      f="/tmp/qingming_chrome_slot_$i.lock"
      if [ ! -e "$f" ] || flock -n "$f" true 2>/dev/null; then "$QM/tools/chrome_slot.sh" --stop "$i"; fi
    done
    "$PS" -NoProfile -Command "Get-CimInstance Win32_Process -Filter \"Name='chrome.exe'\" | Where-Object { \$_.CommandLine -like '*qm-*-profile*' -and \$_.CommandLine -notlike '*qm-bench-profile*' } | ForEach-Object { Stop-Process -Id \$_.ProcessId -Force -ErrorAction SilentlyContinue }" >/dev/null 2>&1 || true
    # dev servers other than the user's 5180 and the shared check server 5190
    ps -eo pid,args | awk '/[v]ite/ && /--port/ && !/--port[ =]?51(80|90)/ {print $1}' | xargs -r kill
    "$0" status ;;
  *) echo "usage: machine.sh status | wait | sweep" >&2; exit 2 ;;
esac
