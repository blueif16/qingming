#!/usr/bin/env bash
# Meshy account switch: the key in use is line 1 of ${MESHY_KEYS_FILE:-~/.meshy_keys} (~/.zshrc exports it).
# `meshy_key.sh [status]` lists the keys (masked) with credit balances; `meshy_key.sh retire` deletes line 1
# (a spent key) so the next one is in use. New shells pick it up; never prints a full key.
F="${MESHY_KEYS_FILE:-$HOME/.meshy_keys}"
mask() { echo "${1:0:8}…${1: -4}"; }
bal() { curl -s -H "Authorization: Bearer $1" https://api.meshy.ai/openapi/v1/balance | sed -n 's/.*"balance":\s*\([0-9.-]*\).*/\1/p'; }
status() {
  local n=0 k
  while IFS= read -r k; do
    [ -z "$k" ] && continue
    n=$((n+1))
    echo "$(mask "$k")$([ $n = 1 ] && echo ' (in use)')  credits: $(bal "$k")"
  done < "$F"
  [ $n = 0 ] && echo "no keys left in $F"
}
case "${1:-status}" in
  status) status ;;
  retire)
    k=$(head -n1 "$F")
    [ -z "$k" ] && { echo "no keys left in $F"; exit 0; }
    echo "retired $(mask "$k")"
    sed -i 1d "$F"; chmod 600 "$F"
    k=$(head -n1 "$F")
    if [ -z "$k" ]; then echo "no keys left in $F"; else echo "in use: $(mask "$k")  credits: $(bal "$k")"; fi ;;
  *) echo "usage: meshy_key.sh [status|retire]"; exit 1 ;;
esac
