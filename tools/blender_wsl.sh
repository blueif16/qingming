#!/usr/bin/env bash
# Call Windows blender.exe from WSL, translating Linux path arguments to Windows paths.
# Used as BLENDER_PATH for the MCP server's *_for_cli tools and for our own headless renders.
# Paths *inside* Python code are not translated: in bpy code use Windows/UNC paths
# (see `wslpath -w`) or blend-relative "//" paths.
set -euo pipefail

BLENDER_EXE="${BLENDER_EXE:-/mnt/c/Program Files/Blender Foundation/Blender 5.2/blender.exe}"

args=()
for a in "$@"; do
  if [[ "$a" == /* && ( -e "$a" || -d "$(dirname "$a")" ) ]]; then
    args+=("$(wslpath -w "$a")")
  else
    args+=("$a")
  fi
done

exec "$BLENDER_EXE" "${args[@]}"
