#!/usr/bin/env bash
# Rebuild carriers of the carried children under the shared build lock, keeping a copy of each shipped GLB and the
# registry from just before the build (for the diff), then KTX2 encode + check.
#   gen/details/children/build_carriers.sh idler,woman,woman_pale
set -euo pipefail
cd "$(dirname "$0")/../../.."
list="$1"
W=gen/details/children/work
mkdir -p "$W"
flock /tmp/qingming_charbuild.lock bash -c "
  set -e
  cp -p web/public/assets/chars/characters.json $W/pre_characters.json
  for c in \$(echo $list | tr ',' ' '); do cp -p web/public/assets/chars/\$c.glb $W/pre_\$c.glb; done
  node tools/character.mjs $list build
  node tools/ktx2.mjs encode
  node tools/ktx2.mjs check
"
