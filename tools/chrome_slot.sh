#!/usr/bin/env bash
# Run a page check (walk_page, people_check, shots_page, film_page, clip_sheet, animal frames ...) inside one of the
# machine's check-Chrome slots: at most QINGMING_CHROME_SLOTS (default 3) headless Windows Chromes at once, however
# many agents check. One Chrome with the whole world loaded holds about 1.6 GB on Windows. The slot's Chrome starts
# fresh for the command (CDP_PORT is set for it) and is stopped after, so every check batch gives its memory back.
#   qingming/tools/chrome_slot.sh node tools/walk_page.mjs "http://127.0.0.1:5190/world.html?sections=canal" walks.json
#   qingming/tools/chrome_slot.sh --stop <slot>     (used by tools/machine.sh sweep)
# Benches still use tools/win_chrome.sh (9223) alone: numbers from a shared machine mean nothing.
set -euo pipefail
QM="$(cd "$(dirname "$0")/.." && pwd)"
CHROME="/mnt/c/Program Files/Google/Chrome/Application/chrome.exe"
PS=/mnt/c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe

stop_slot() {
  "$PS" -NoProfile -Command "Get-CimInstance Win32_Process -Filter \"Name='chrome.exe'\" | Where-Object { \$_.CommandLine -like '*qm-check-$1-profile*' } | ForEach-Object { Stop-Process -Id \$_.ProcessId -Force -ErrorAction SilentlyContinue }" >/dev/null 2>&1 || true
}
if [ "${1:-}" = "--stop" ]; then stop_slot "${2:?slot}"; exit 0; fi
[ $# -gt 0 ] || { echo "usage: chrome_slot.sh <command ...>" >&2; exit 2; }

slots="${QINGMING_CHROME_SLOTS:-3}"
while :; do
  for i in $(seq 1 "$slots"); do
    exec {lockfd}>"/tmp/qingming_chrome_slot_$i.lock"
    if flock -n "$lockfd"; then slot=$i; break 2; fi
    exec {lockfd}>&-
  done
  sleep 5
done
port=$((9230 + slot))
trap 'stop_slot "$slot"' EXIT
stop_slot "$slot"   # a Chrome left on this slot by a killed job
"$QM/tools/machine.sh" wait
mkdir -p "/mnt/c/Temp/qm-check-$slot-profile"
(cd /mnt/c/Temp && "$CHROME" --headless=new --remote-debugging-port=$port --user-data-dir="C:\\Temp\\qm-check-$slot-profile" \
  --no-first-run --no-default-browser-check --disable-gpu-vsync --disable-frame-rate-limit \
  --ignore-gpu-blocklist about:blank >/dev/null 2>&1 &)
for _ in $(seq 40); do curl -s --max-time 1 "http://127.0.0.1:$port/json/version" >/dev/null && break; sleep 0.5; done
curl -s --max-time 2 "http://127.0.0.1:$port/json/version" >/dev/null || { echo "chrome_slot: Chrome did not answer on $port" >&2; exit 1; }
echo "chrome_slot: slot $slot, CDP_PORT=$port" >&2
CDP_PORT=$port "$@"
