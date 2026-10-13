# Ink UI round: brief (lead, 2026-10-12 evening)

## What the user asked (2026-10-12, with three 江南百景图 screenshots)

The user showed three screenshots of 江南百景图 (`reference/jiangnan/`): the pink-sky key art, the bridge scene with
the poem and seals, and an in-game isometric view. They want this look as the **overall language of the qingming
product**:

- **UI and text first.** "Redesign our entire UI according to this style." The fonts are **古代繁体** (period
  traditional Chinese): the art style, the text style, and the ink style of the text bubbles.
- **Palette and textures later.** Move the colour palette and the 3D textures "a bit toward this style": ink
  paintings, textures, palette. Performance must not suffer ("we have used compressions for better performance and a
  smaller size … we don't want to hurt performance too much").
- **The sky.** In one screenshot the sky is "not … just a single color. It's just these small blocks of ink … pretty
  poetic", "a bit like the original Messenger".
- **A comparison study.** A subagent compares Messenger with this style and with everything we learned and built from
  Messenger (current settings, current mechanisms): how compatible they are, and what has to change.
- **Later, same style:** an entry/opening animation with our logo, like Messenger's (fairly 3D, looks very good).
- **Now:** Steam-style notifications. Reaching a landmark on the map, or a new setting (section), shows its name, the
  way normal games do.
- **Now, a few:** character interactions. To interact with a figure you get chat bubbles and the figure's name.
  "Clearly understand the current situation and the desired effect."

## Standing rules (from memory and `qingming/CLAUDE.md`; don't re-ask the user)

- **True colours, not aged yellow.** The world is the real Song town in real daylight. No sepia grade, no paper-stain
  colour cast over the 3D world. The painting's *style* (brush, ink lines) stays. UI chrome (paper slips, panels) may
  be paper-coloured; the world behind it may not turn yellow. Where 江南百景图's cream paper conflicts with this, write
  the conflict down for the user. Don't decide it silently.
- **No numbers on screen** for in-world state. Time is the Song sundial (`web/src/sundial.js`). For any new HUD
  element, first ask what a person in Northern Song Kaifeng would have used.
- **Loyal to the painting** (`map/BUILDING.md`). Words and names come from the painting and the readings of scholars:
  the painted shop signs (孫羊正店, 十千腳店, 趙太丞家 …), the map's IDs, and `gen/life/vignettes_S4_S6.md`. Nothing
  invented without a recorded reason. Use period terms (a barber is 待詔, not 剃頭匠).
- **Any-device reach.** Phones and integrated GPUs, not the 4070. Measure the cost of UI and look changes under a phone
  viewport and a 4× CPU throttle (`gen/perf/proposal.md` holds the perf study). Keep downloads small. Messenger's
  budget is 5.7 MB initial and 17.5 MB total, and we are already at about 26 MB per window.
- **Images only through `python3 -I tools/shyfai_image.py`** (run `--help` first). Outputs go under `gen/`.
- **Third-party references are study-only.** `reference/jiangnan/` (江南百景图) and `reference/messenger_study/`
  never ship and are never copied into assets. We take the language, not the pixels.
- **Machine:** page checks only through `tools/chrome_slot.sh … ` against the check server
  (`tools/check_server.sh start`, port 5190). Never start your own Chrome or dev server. 5180 is the user's dev server;
  benches use `tools/win_chrome.sh` (9223) alone. Run `tools/machine.sh status` before heavy steps. Results, notes and
  shots go in the repo (`gen/ui/...`), never `/tmp`: `/tmp` is wiped at reboot.
- **Other sessions are editing this repo right now.** `world.js`, `people.js` and `sound.js` changed in the last hour
  (sound v2, perf). Before every edit to a shared file (`web/src/world.js`, `world.html`, `people.js`, `sound.js`,
  `scroll_hud.js`, `sundial.js`, `daylight.js`, `settings.js`), re-read the region and edit it surgically with the
  Edit tool. Never rewrite a whole shared file, and never revert lines you didn't write. List every edit to a shared
  file in your progress file.
- **Ignore Pyright/IDE diagnostics noise.** Fix real failures only.
- **Report only at the end.** Work autonomously. Record decisions in your files. Put questions that truly belong to the
  user in a "Questions for the user" list, and keep going with the reasonable default.

## The three agents and what each owns

| agent | owns (may write) | reads |
|---|---|---|
| **look** (Messenger × 江南百景图 study, sky) | `gen/ui/look/**`; `web/src/daylight.js` **only** the `Sky` class, behind a `?sky=ink` URL flag (the default stays byte-for-byte the same in behaviour) | everything |
| **type** (fonts, logo, seal) | `gen/ui/fonts/**`, `tools/font_subset.*`, `web/public/assets/ui/fonts/**`, `web/public/assets/ui/logo*`, `web/public/assets/ui/seal*` | everything |
| **ui** (UI standard, kit page, notifications, names and bubbles) | `gen/ui/STYLE.md`, `gen/ui/current_ui.md`, `gen/ui/ui_progress.md`, `gen/ui/shots/**`, `web/src/ui/**` (new), `web/ui.html` (new), `web/public/assets/ui/**` except fonts/logo/seal, `sections/*/talk.json`, `sections/*/places.json` (new); surgical hooks in `world.html`, `world.js`, `scroll_hud.js` (CSS and markup), `sundial.js` (frame only), `sound.js` (bell and volume DOM only), `people.js` (read-only hooks) | everything |

The lead's record is `gen/ui/progress.md`.
