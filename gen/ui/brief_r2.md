# Ink UI round 2: brief (lead, 2026-10-12 late)

Round 1 is live (https://qingming-delta.vercel.app). Its record is `gen/ui/progress.md`, `ui_progress.md` and
`STYLE.md`. The standing rules in `gen/ui/brief.md` still hold: true colours, no numbers, loyal to the painting,
any-device reach, shyfai only, study-only references, the machine slots, surgical edits to shared files, report only
at the end.

## What the user said (2026-10-12, after seeing round 1 live)

- "we can set ink as default now". **Done by the lead:** `daylight.js` `Sky.INK` is on unless `?sky=plain`.
- "make all the complicated settings much sparse and leave only the time related setting + first/third person switch
  on direct hud, can have a right arrow and place else stuff there, settings be space and not in row form like this,
  think [Battlefield's advanced settings screen], we have more spacings and we keep the exact ink style"
  - The Battlefield reference has a dark panel on the left with one spacious row per setting: a label on the left, and
    on the right the value with ‹ › arrows or a toggle. The highlighted row has a frame. A panel on the right
    describes the highlighted setting ("what it does, what it affects"). "ESC BACK" is drawn as a keycap. The
    category title sits at the top. We take the layout and the generous spacing, not its dark military look. Ours is
    paper and ink.
- "for the few settings we point out, like 1/3 person, we can have icon/container based switch so they just click"
- "also is about time, think of a cool design that match our style that user can drag time around"; then: "I'm not
  really satisfied with the current time clock UI, we can change that to be more clear and follow our style to be
  better, think of redesign and how it can support us to tune time"
- "at the initial loading screen, there's always a frame after the loading has done game is stucked at huge text
  (maybe a bug at loading something)"
- "for the 說明 make sure it stays a bit longer or we always give a shortcut to bring it back, the same with each
  landmark, we can have a longer description for each under their current description (or merge together and have
  name and description separate), and this can be changed in settings whether the description is auto expanded or
  not, we are trying to give the game some more info and more depth so open up your creativity"

## Shared contracts (set by the lead; don't change them without the lead)

- **UI preferences:** `web/src/ui/prefs.js` (`prefs.get/set/on`, saved in localStorage, safe without it).
  `expandDescriptions` (default false) is read by the landmark toasts and edited by the settings screen. Add new UI
  prefs to `PREF_DEFAULTS` with a comment.
- **World settings** stay in world.js's object `s` (`settings.js`, saved per page) and change only through world.js's
  `onSettingChange(key)`:
  - `s.view` ('first' | 'third')
  - `s.hour` (0–24 solar)
  - `s.localTime` (follow the viewer's clock)
  - `s.timeFlow` (minutes per second)
  - `s.daylight`
  - `s.camDistance`
  - and the rest of the tuning
  
  Whoever needs to set one from the UI gets a small setter passed into `createUI`. Don't reach into world.js
  internals.
- **The time instrument's host is `#dial`** (top left, in `world.html`). The **time** agent owns everything inside
  `#dial`. The **settings** agent owns where `#dial` sits and everything around it.
- **Keys** (check world.js, scroll_hud.js and ui/index.js before adding one):
  - existing: WASD/arrows, Shift, V (view), E (talk), Esc, Space (scroll HUD), M (sound), `?` (help)
  - new: **H** = 說明 help (H used to hide the tuning panel inside the scroll HUD; that panel goes away)
  - new: **J** = 圖志, the journal of places; **O** = settings (and the › button)
  - the time agent may take **T** (focus the time instrument, or scrub it with the arrow keys) if it needs a key
  
  Every key also has a tap target on touch.
- **CSS:** each agent writes its own stylesheet next to its module (`settings.css`, `time.css`, `journal.css`),
  imported by that module. `ui.css` and the tokens in `ink.js` are shared. Change them surgically.
- **Fonts:** strings change, so re-run `uv run tools/font_subset.py` (config `gen/ui/fonts/roles.json`). Long texts go in
  a **separate, lazily fetched subset**: same family, split with `unicode-range` or a second face, so the first
  load doesn't grow. Report the KB.
- **Shared files** (surgical edits only; re-read the region before every edit; another session may also be editing):
  `web/src/world.js`, `web/world.html`, `web/src/ui/index.js`, `ui.css`, `words.js`, `components.js`,
  `scroll_hud.js`, `sound.js`, `sundial.js`, `daylight.js`, `settings.js`, `people.js`.

## The three agents

| agent | does | owns (writes) |
|---|---|---|
| **settings** | the direct HUD (time host position, the view switch as two clickable icon tiles, a › that opens the rest); the settings screen (spacious ink rows, a description panel, categories, keyboard and touch); moves every current setting (the lil-gui tuning panel, bell and volume, help) behind it, or behind `?tune=1` for dev tuning; the help (stays longer, H brings it back, a 說明 entry in the settings); the `expandDescriptions` toggle | `web/src/ui/hud.js`, `settings_screen.js`, `settings.css` (new); the help in `components.js`; the panel code in world.js; the lil-gui exposure in `scroll_hud.js`; the bell and volume DOM in `sound.js`; `words.js` entries for its strings |
| **time** | redesigns the time instrument (clearer, in our style, a period object, no digits) so it can be dragged to set the hour and supports tuning time (return to the local clock, how fast time flows), sky and light following live; the loading-stall bug | everything inside `#dial`: `web/src/sundial.js`, `sundial_glyphs.js`, `web/src/ui/time.js` and `time.css` (new); time hooks in world.js (applyLight, the clock tick); `loading.js` and the world.js init order for the stall |
| **lore** | longer descriptions for all 30 landmarks and the 7 regions (name and description apart; short line and long text); toasts stay longer and can be recalled; the 圖志 journal (J) of discovered places with the painting's crop for each; discovered marks on the scroll HUD; more depth where it serves | `sections/*/places.json` (text fields), `tools/ui_data.mjs`, `web/src/ui/places.js`, `journal.js`, `journal.css` (new), `web/public/assets/ui/places/**` (crops), the visited-marks hook in `scroll_hud.js`, `words.js` entries for its strings |

The lead's record is `gen/ui/progress.md`. Each agent keeps its own: `gen/ui/r2_settings.md`, `r2_time.md`,
`r2_lore.md`.

## Done means

- Shots at desktop (1920×1080) and phone (390×844 touch), day and night, looked at by the agent itself
  (`gen/ui/shots/r2_<agent>/`). The shots tool is `gen/ui/shots/ui_shots.mjs` with a plan JSON; it runs inside
  `tools/chrome_slot.sh` against the check server (`tools/check_server.sh start`, 5190).
- `node tools/ui_data.mjs check` PASS.
- Fonts re-subset, with the KB reported.
- No console errors.
- The regression (`tools/chrome_slot.sh bash gen/expand/round2/page_qa/regress.sh r2_<agent>`) no worse than round 1's
  ui1/ui2 (world 209–210/211 with the known S2 walks, boats 12/12, rides 5/5, people with the 2 known stands).
- The UI cost measured as round 1 did (`gen/ui/shots/ui_cost.mjs`): phone viewport with 4× throttle, ms per frame,
  and KB at first load.

Don't deploy; the lead deploys at the end.
