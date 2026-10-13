# UI fonts: how to subset

The UI typefaces are subset to the characters the product actually shows and shipped as woff2 in
`web/public/assets/ui/fonts/`. After you add or change strings, run from `qingming/`:
`uv run tools/font_subset.py` (about 2 s; `uv` fetches fonttools and brotli on first use; `--check` only counts,
`--role text` redoes one role). The tool reads `gen/ui/fonts/roles.json`. For each role (display, text, seal) that
file names the source font in `gen/ui/fonts/src/`, a CSS family (`QM Display`, `QM Text`, `QM Seal`) and the sources
of its characters: globs of JSON files (a `#name,say,…` suffix limits a JSON file to the strings under those keys, so
`src`, `about` and `reading` notes never add glyphs), JS, HTML and text files (every non-ASCII character), literal
`extra` text, and the `always` punctuation 「」『』，。？！、…·. A role with `core` text is split in two: `<role>-core.woff2`
holds only those characters (for the loading screen) and `<role>.woff2` holds the rest. The `unicode-range` in the
generated `fonts.css` makes a browser fetch the second file only when a page shows one of its characters. Pages link
`assets/ui/fonts/fonts.css` and use the `stack` given per role in `fonts.json` (which also lists sizes and any
characters a font lacks; those fall back down the CSS stack). The report goes to `gen/ui/fonts/subset_report.md`.
Other per-role keys: `latin` (add printable ASCII), `no_always` (skip the shared punctuation), `size_adjust` (the CSS
descriptor), and `licence_file` (copied beside the font as `<role>.LICENSE.txt`).
The ui agent may add globs to `sources` and characters to `extra` or `core` in `roles.json`. The choice of fonts and
their licences is in `CHOICE.md`. Every output font is renamed ("QM …"), as the OFL Reserved Font Names and the IPA
licence require of modified versions, and keeps its copyright and licence fields.

Other files here: `test_strings.txt` + `coverage.py` (`uv run gen/ui/fonts/coverage.py` → `coverage.md`, the
traditional-coverage check of every candidate), `specimen.html` (+ `specimen_roles.json`, `specimen_text.txt`,
`specimen_fonts/`; screenshot with `tools/chrome_slot.sh node gen/ui/fonts/specimen_shot.mjs` → `specimen.png`,
`specimen_phone.png`), `logo/` (`build_logo.py`: the 清明上河圖 lockups `assets/ui/logo_{h,v,col}[_light].svg` traced
from Huizong's 1104 千字文; `sources.md` holds the scans, boxes and colophons), `seal/` (`build_seal.py`:
`assets/ui/seal.svg`, `seal_small.svg`, `seal_oval.svg`), `src/` (every source font with its licence), and
`notes.md` (the log).
