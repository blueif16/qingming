#!/usr/bin/env bash
# Headless Chrome on Windows with remote debugging on 127.0.0.1:9223, for measuring pages on the real GPU
# (the WSL Chrome in check_page.mjs renders with SwiftShader, so its frame rates mean nothing).
# vsync and the frame-rate limit are off, so requestAnimationFrame runs uncapped.
# Usage: tools/win_chrome.sh start | stop | status
set -euo pipefail
CHROME="/mnt/c/Program Files/Google/Chrome/Application/chrome.exe"
PROFILE='C:\Temp\qm-bench-profile'
case "${1:-status}" in
  start)
    if curl -s --max-time 2 http://127.0.0.1:9223/json/version >/dev/null; then echo "already running"; exit 0; fi
    mkdir -p /mnt/c/Temp/qm-bench-profile
    (cd /mnt/c/Temp && "$CHROME" --headless=new --remote-debugging-port=9223 --user-data-dir="$PROFILE" \
      --no-first-run --no-default-browser-check --disable-gpu-vsync --disable-frame-rate-limit \
      --ignore-gpu-blocklist about:blank >/dev/null 2>&1 &)
    for _ in $(seq 20); do curl -s --max-time 1 http://127.0.0.1:9223/json/version >/dev/null && { echo "started"; exit 0; }; sleep 0.5; done
    echo "Chrome did not answer on 9223" >&2; exit 1 ;;
  stop)
    powershell.exe -NoProfile -Command "Get-CimInstance Win32_Process -Filter \"Name='chrome.exe'\" | Where-Object { \$_.CommandLine -like '*qm-bench-profile*' } | ForEach-Object { Stop-Process -Id \$_.ProcessId -Force -ErrorAction SilentlyContinue }" >/dev/null 2>&1 || true
    echo "stopped" ;;
  status)
    curl -s --max-time 2 http://127.0.0.1:9223/json/version | grep -E '"Browser"' || echo "not running" ;;
esac
