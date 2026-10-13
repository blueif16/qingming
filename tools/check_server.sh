#!/usr/bin/env bash
# The one dev server every agent checks against: http://127.0.0.1:5190 (web/vite.check.config.js, HMR off).
# A dev server holds about 0.6 GB and re-reads web/ on every write, so agents share this one instead of starting
# their own; the user's 5180 keeps HMR.   tools/check_server.sh start | stop | status
set -euo pipefail
QM="$(cd "$(dirname "$0")/.." && pwd)"
PORT=5190
up() { curl -s --max-time 2 -o /dev/null "http://127.0.0.1:$PORT/world.html"; }
case "${1:-status}" in
  start)
    if up; then echo "check server up on $PORT"; exit 0; fi
    cd "$QM/web" && nohup npx vite --config vite.check.config.js --port $PORT --strictPort > /tmp/qingming_check_server.log 2>&1 &
    for _ in $(seq 60); do up && { echo "check server up on $PORT"; exit 0; }; sleep 0.5; done
    echo "check server did not start (/tmp/qingming_check_server.log)" >&2; exit 1 ;;
  stop) ps -eo pid,args | awk -v p="--port $PORT" '/[v]ite/ && index($0, p) {print $1}' | xargs -r kill; echo stopped ;;
  status) up && echo "up on $PORT" || echo "not running" ;;
esac
