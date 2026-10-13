# Ink UI round: lead's record

Brief: `gen/ui/brief.md`. References: `reference/jiangnan/` (three 江南百景图 screenshots from the user, study-only).

## 2026-10-12 ~20:55: start

- I read the current UI: `world.html` has an English loading line, a help box and a stats box in system-ui; the
  sundial is drawn as SVG; `scroll_hud.js` uses Latin serifs, paper `#efe4cc`, cinnabar `#b5321e` and mount `#4e4033`;
  `sound.js` has a bell and a volume bar. There are no speech bubbles, name tags or place notifications yet. The design
  for talk is `gen/life/design.md`: talk.js waits on a voice provider, and bubbles are in Chinese.
- Peer session `3d-director-04` is busy on the same repo (perf/sound edits to world.js, people.js and sound.js in the
  last hour). The agents are told to make surgical edits only.
- Three agents started: **look**, **type** and **ui**. Their roles and file ownership are in the brief.

## ~21:40: the reference mix-up, corrected

- The three files on disk (jn1–3) are not what the user pasted. They are frames of a Bilibili video (反向弯曲) showing
  a 江南百景图-style 清明上河圖 map: vertical name plaques on landmarks, region titles in mist blocks with seals, and a
  poem in a corner. The three pasted images (official 江南百景图 art, with the pink-wash sky, the ink-streak sky and
  the isometric town) are now saved as jn4–6. `reference/jiangnan/README.md` describes both sets.
- **look** finished round 1: ranked changes, sky v3 behind `?sky=ink`, concept frames. It never saw the real sky refs
  and built the sky from mist blocks and Messenger's clouds. It is resumed to make sky v4 from jn4/jn5.
- **ui** was told to use jn1–3's plaques and mist titles for the place notifications. **type** was told to use jn4/jn5's
  logo and seals.

## ~22:05: look done (v4 sky)

- `gen/ui/look/compatibility.md` (matrix, ranks), `jiangnan_look.md` (§9 sky, §10 place-name language),
  `messenger_sky.md`, `sky_design.md`, `concepts/`.
- Sky v4 behind `?sky=ink`: jn5's strokes laid as a deeper wash over the true blue; dawn and dusk take jn4's pink and
  flat red sun; night is indigo. It costs 0 bytes and ±0.05 ms. The default sky is unchanged (md5 check).
- My view of `sky_shots/jn5_jn4_vs_ink_v4.jpg`: the day strokes read thinner and more swooping than jn5's broad combed
  blocks. That is good enough for the user to judge. The pale vertical column at sunrise is the existing post.js mist
  bug (rank 4), and it shows in the base too.

## ~22:30: type done

- `gen/ui/fonts/CHOICE.md`:
  - display: 莫大毛筆 Bakudai, 49 KB (licence caveat: the base font's terms);
  - text: 霞鶩文楷 TC Medium, 110 KB plus a 17 KB core for the loading screen;
  - seal: LXGW Seal, 3 KB.
  
  Subset with `uv run tools/font_subset.py` (config `gen/ui/fonts/roles.json`). Total 179 KB of the 250 KB budget.
- Logo: Huizong's own 瘦金 千字文卷 (1104), traced from the public-domain Commons scan: 清 (溫清), 明 (承明, written
  眀), 上, 河, 圖. Lockups `logo_h`, `logo_v` and `logo_col`, plus `_light` twins. I checked the crop by eye: it is
  authentic and reads well. The sharper museum-photo trace is not shipped (museum terms).
- Seals: 「上河」 白文 square, 「清朙」 oval 閑章, and a small seal.

## ~23:10: ui done; the lead's fix; round closed (not deployed)

- **ui:**
  - in the world: the title screen, region banners (vertical name in a mist block with a seal), 30 landmarks (hanging
    plaques plus an arrival toast), and 6 conversations (E or the 談 seal; name tags, speech and thought bubbles);
  - restyled: help (繁體, English gloss, folds into 說明), the sundial ring, the bell and volume, and the HUD chrome;
  - stats only with `?stats=1`, and `?ui=0` turns the new UI off;
  - kit page `ui.html`; data in `sections/*/places.json` and `talk.json` (`node tools/ui_data.mjs build|check`);
  - the standard is `gen/ui/STYLE.md`, the record `gen/ui/ui_progress.md`.
- **Cost:** about 0.5 ms a frame on a phone viewport with 4× throttle while bubbles and a toast are open (2.5%);
  about 40 KB before the world shows, about 210 KB in all.
- **Regression:** ui1 is the known state (210/211, boats 12/12, rides 5/5, people with the 2 known stands). ui2 is
  209/211: the two S2 north-bank walks were blocked by porters, and the boat-flow session's run failed the same two.
- **Lead:** the title screen used plain text, because the logo wasn't ready when ui built it. It now shows
  `assets/ui/logo_v.svg` (Huizong's 瘦金 with the seal), checked at desktop and phone
  (`gen/ui/shots/after/*_loading_logo.png`; no console errors).
- **Not deployed:** peer session 3d-director-04 is still busy on the same page files, so a production build now would
  ship its half-done work. Deploy once the user has looked and that session is idle (skill `deploy-web`, with the
  regression first).

## ~23:30: deployed (user: "push to actual vercel")

- Files changed since the ui agent's checks: only my logo swap and ui's last edit to `index.js`; the other session
  made no page edits after 21:27. `ktx2.mjs check` PASS.
- `PORT=5186 tools/deploy_web.sh`: the first try failed its local check because something held 5182 for a moment,
  and nothing was deployed. On the retry: 952 files, 101.5 MB; the local load check PASS (8 sections, 34 boats, 250
  requests, 44.4 MB, 47 s).
- Live at https://qingming-delta.vercel.app (deployment qingming-aqudipafd, inspect 38XidHncjcCQyyKQfoo5jWqCwQea). The
  live world.html carries the logo; the logo, fonts, places.json and talk.json all return 200.

## Round 2 starts (user, after round 1 went live)

- The user asked for: the ink sky as default (done by the lead: `?sky=plain` gives the old dome); a sparse direct HUD
  (time and view only, › for the rest); a spacious ink settings screen like Battlefield's
  (`reference/settings_battlefield_ref.png`); icon tiles for the view; time you can drag, and a clearer time
  instrument; a fix for the loading stall at "huge text"; help that stays longer or comes back on a key; long landmark
  descriptions with an auto-expand setting; "more info and more depth".
- Brief: `gen/ui/brief_r2.md`. The lead added `web/src/ui/prefs.js` (shared UI prefs). Agents: settings, time, lore.

## Round 2: lore done

- 37 long texts (30 landmarks and 7 regions) with their sources saved in `gen/ui/lore/sources/`. The toast holds 9 s
  folded and 16–45 s open; R, a click or a tap unfolds it. J opens the 圖志 journal (painting crops, 題跋 and 見聞
  leaves). Seals on the scroll HUD.
- Checks: ui_data PASS, lore_check 19/19, regression r2_lore 211/211, boats and rides pass. About +5 KB at first
  load; the long-text font (207 KB) loads only on the first unfold.
- I looked at the toast and the journal (desktop and phone): clean and readable. I saw the time agent's instrument
  too: its big 巳 reads like 已, and the time agent was told.
- Flag: a console error `endOp … reading 't0'` from world.js streaming (another session's code) may fail the
  deploy's load check. Look before deploying.

## Round 2: time done

- 晝夜卷 + 時牌 (`web/src/ui/time.js`): the 時辰 named on an ivory tablet in the 楷 face (Bakudai left 巳 open, so it
  read as 已, and 戌 as 戍), and a painted day-sky handscroll you drag; 歸今, double-tap or Home goes back to your
  clock; the pace cycles 緩/常/疾/靜 (1/4/15/0 game min/s); T takes the keys. No digits even on hover. The three
  options not chosen are live in `ui.html?frame&scene=time`.
- The loading stall: the "huge text" was the logo. `done()` took the id off `#loading` and every rule was keyed on it,
  so the logo painted at full size for ~0.7 s and the wipe never ran. The first frame then froze for 650–790 ms
  (shader links, the crowd's first bake). Fixed: CSS keyed on `.ld`, the wipe moved to a compositor transform, and
  warmUp() runs the first frames under the paper. Worst gap after the wipe: 85 ms.
- Also fixed: applyLight was forcing a shadow redraw every frame while time ran (+4–8 ms on phones).
- Checks: time_check 12/12, regression r2_time 211/211, boats and rides pass.
- Lead: every visit now starts on the viewer's clock (world.js sets `s.localTime = true; s.timeFlow = 0` at load,
  before `?hour=`), per the standing rule. CLAUDE.md and the memory now name `ui/time.js`.

## Round 2: settings done; final checks

- Walking HUD: the time instrument, the view tiles (eye or figure, the chosen one sealed) and ›. The settings screen
  (O or ›): six category seals, spacious rows, a description slip with its cost, Esc 返回. lil-gui only with
  `?tune=1` or 進階 → 完整調校面板. Help stays until 25 s and 12 m walked (or 75 s); H brings it back. Keys table in
  STYLE.md §14.
- Checks: settings_interact 40/40, hud_interact PASS in both modes, regression 209/211 (the known S2 walks).
- I looked at the settings shots (desktop time page, phone interface page). The 巳 in the settings is the text face
  and reads right; the display subset has no 巳 or 戌, so they fall back to QM Text everywhere.
- Final: ui_data PASS (586 glyphs at first load, 621 lazy), ktx2 PASS. Combined regression `r2_final` is running
  (log `gen/ui/r2_final_regress.log`); 3d-director-04 is still busy.

## Round 2 deployed (before 23:55 by the machine clock; my earlier "~01:00" was wrong)

- Regression `r2_final` on the combined tree: world 211/211, boats 12/12, rides 5/5. people FAIL only on the 2 known
  road stands (X 7 / X -8; the same as r2_settings).
- `PORT=5186 tools/deploy_web.sh`: the local load check passed and it deployed to https://qingming-delta.vercel.app
  (deployment qingming-llkxx7jhn, inspect 2BuzWhyEnSLyZFkrS2vyi2L6YqKB, 1006 files). Live: the settings and lore fonts,
  lore.json and the place crops all return 200.

## Questions for the user (round 2, plus round 1's still open)

1. Time: keep 晝夜卷 + 時牌, or one of the three in the kit (`ui.html?frame&scene=time`, dev server only)? Are the
   paces right (緩 1, 常 4, 疾 15 game min/s)?
2. Settings: pause the world behind the screen? Show 進階 to players or hide it? Keep the English glosses?
3. Journal: west to east (now), or the painting's right-to-left reading order? Unreached places as 未至, or with
   their names faint? Keep the 題跋 leaf?
4. Scholarly calls: the gate as 東角子門, the 解 sign as an exam office, the wine depot as a fire post.
5. Round 1 still open: palette and texture changes (`gen/ui/look/compatibility.md`), night look, Bakudai licence
   caveat, seal text 「上河」, plaques and toasts both.

## After the deploy: the Quality row; deploys go through the lead session

- Lead session 3d-director-04 (whose engine agent made the device tiers in `web/src/tiers.js`) asked for a Quality row,
  and asked that **qingming deploys go through it** from now on.
- Added: a 畫工 row first on the 畫面 page (`quality`: 隨宜/簡筆/兼工/工筆 = auto/low/mid/high, through
  `setSetting`; disabled with a note when `?tier=` is in the URL). Fonts re-subset; settings_interact 40/40; shot
  `gen/ui/shots/r2_settings/desktop_set_display_quality.png`. **Not deployed:** handed to 3d-director-04 for its next
  deploy, with the list of this round's files.
- The Quality row is live: 3d-director-04 deployed it (1005 files, all 8 sections loaded in its check). Future
  deploys: ask 3d-director-04 first.
