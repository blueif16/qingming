#!/usr/bin/env bash
# Put the web world on Vercel, production: build web/ -> guard what goes up -> load world.html headless -> deploy
# -> check the live URL. Usage: tools/deploy_web.sh [--no-check]. Skill: .claude/skills/deploy-web/SKILL.md
# Only deploy/.vercel/output goes up (the Vite build of web/ plus the routes), never the project tree.
set -euo pipefail
Q="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)" # qingming/
WEB="$Q/web" DEP="$Q/deploy"
OUT="$DEP/.vercel/output" STATIC="$DEP/.vercel/output/static"
SCOPE=blueif16s-projects PROJECT=qingming PROD=https://qingming-delta.vercel.app PORT="${PORT:-5182}"
CHECK=1; [ "${1:-}" = "--no-check" ] && CHECK=0
die() { echo "deploy_web: $*" >&2; exit 1; }

# The one Vercel CLI install (Windows npm, on PATH). Run from WSL, it uses the Windows login unless WSL has its own.
command -v vercel >/dev/null || die "no Vercel CLI (npm i -g vercel)"
WINCFG="${VERCEL_WIN_CONFIG:-/mnt/c/Users/$USER/AppData/Roaming/com.vercel.cli/Data}"
VC=(vercel --scope "$SCOPE")
if ! grep -qs '"token"' "$HOME/.local/share/com.vercel.cli/auth.json" && [ -f "$WINCFG/auth.json" ]; then VC+=(-Q "$WINCFG"); fi

echo "== build (web/ -> deploy/.vercel/output/static; outside web/, so the dev server never sees it)"
cd "$WEB"
./node_modules/.bin/vite build --outDir "$STATIC" --emptyOutDir --logLevel warn
# the routes: web/vercel.json's (headers only: hashed files cached for a year, immutable; a --prebuilt deploy reads no
# vercel.json, so its routes are carried into the build's config), then / -> world.html, then the files
node -e 'const fs = require("fs"); let r = [];
  try { r = (JSON.parse(fs.readFileSync(process.argv[1], "utf8")).routes || []).map((x) => ({ ...x, continue: true })); } catch (e) { if (fs.existsSync(process.argv[1])) throw e; }
  fs.writeFileSync(process.argv[2], JSON.stringify({ version: 3, routes: [...r, { src: "^/$", dest: "/world.html" }, { handle: "filesystem" }] }, null, 1));' "$WEB/vercel.json" "$OUT/config.json"

echo "== guard (only the build goes up)"
bad=$(cd "$STATIC" && find . | grep -Ei '(^|/)(reference|gen|messenger[^/]*|\.env[^/]*|\.meshy_keys|[^/]*\.(pem|key))(/|$)' || true)
[ -z "$bad" ] || die "forbidden paths in the build: $bad"
hashes() { find "$1" -type f -exec sha256sum {} + | cut -c1-64 | sort -u; }
if [ -d "$Q/reference/messenger_study" ]; then
  n=$(comm -12 <(hashes "$Q/reference/messenger_study") <(hashes "$STATIC") | wc -l)
  [ "$n" -eq 0 ] || die "$n file(s) in the build are copies of reference/messenger_study (third-party, never shipped)"
fi
keys=$({ cat "$HOME/.meshy_keys" 2>/dev/null; grep -oE 'sk-[0-9a-f]{32,}' "$Q/tools/shyfai_image.py" 2>/dev/null
  printenv MESHY_API_KEY SHYFAI_API_KEY; } | awk 'length($0) >= 20' || true)
if [ -n "$keys" ] && leaks=$(grep -rlF -f <(printf '%s\n' "$keys") "$STATIC"); then die "an API key is in: $leaks"; fi
find "$STATIC" -type f -printf '%s\n' | awk '{s += $1} END {printf "  %d files, %.1f MB\n", NR, s / 1e6}'

if [ "$CHECK" = 1 ]; then
  echo "== check (world.html headless on 127.0.0.1:$PORT: no 404s, no console errors, every section in)"
  ./node_modules/.bin/vite preview --outDir "$STATIC" --port "$PORT" --strictPort --host 127.0.0.1 >/dev/null 2>&1 &
  PREVIEW=$!
  trap 'kill $PREVIEW 2>/dev/null || true' EXIT
  for _ in $(seq 50); do curl -sf -o /dev/null "http://127.0.0.1:$PORT/world.html" && break; sleep 0.2; done
  node "$Q/tools/check_deploy.mjs" "http://127.0.0.1:$PORT/world.html" || die "local check failed; nothing was deployed"
  kill $PREVIEW 2>/dev/null || true
fi

echo "== deploy ($SCOPE/$PROJECT, production)"
cd "$DEP"
[ -f .vercel/project.json ] || "${VC[@]}" link --yes --project "$PROJECT"
out=$("${VC[@]}" deploy --prebuilt --prod --yes) || die "vercel deploy failed"
# the CLI prints JSON when piped: the stable production URL, and this deployment's own (behind Vercel login) URL
mapfile -t d < <(node -e 'let j; try { j = JSON.parse(require("fs").readFileSync(0, "utf8")).deployment } catch { process.exit() }
  console.log(j.productionUrl || ""); console.log(j.url || ""); console.log(j.inspectorUrl || "")' <<<"$out")
PROD="${d[0]:-$PROD}"
echo "  deployment ${d[1]:-$out}"
[ -n "${d[2]:-}" ] && echo "  inspect ${d[2]}"

echo "== live"
for p in / /world.html /assets/chars/characters.json /assets/gate.glb; do
  code=$(curl -s -o /dev/null -w '%{http_code}' "$PROD$p")
  echo "  $code $p"
  [ "$code" = 200 ] || die "$PROD$p returned $code"
done
echo "Live: $PROD"
