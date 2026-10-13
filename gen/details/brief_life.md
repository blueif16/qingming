# Brief: more life (details pass, agent "life"): plot lines, chatter, deeper talk

The user (2026-10-13): "add even more plot lines and interactions with characters. You don't even need to speak to
some character, like they can just automatically be saying something (feels natural). ... the dialogues and stuff
are going to be more fun and have more depth."

## What exists (read it all first)

- **Design:** `gen/life/design.md`, three distances:
  - far: intent marks;
  - earshot: a scene's beats loop on their own;
  - close: they speak to you.

  `gen/life/vignettes_S4_S6.md` holds 34 painted scenes with readings and draft lines.
- **UI standard:** `gen/ui/STYLE.md`, with §5 for the prompt, name tag, speech and thought bubbles, plus "Earshot
  chatter" and "intent marks" already specified; also §8 language, §11 performance, §12 data, §13 checks.
- **Built so far:** only the close tier, as six press-E conversations in `sections/{gate,inner_city,outer_road}/talk.json`.
  - Code: `web/src/ui/talk.js` (prompt, name tags, bubbles, 2 open at most), `components.js` (`speech`, `prompt`).
  - Data: bundled by `node tools/ui_data.mjs build|check` into `web/public/assets/ui/talk.json`.
  - Fonts: subset to the glyphs used, so rebuild after adding strings (`tools/font_subset.py`, STYLE §3).
- **Records:** `gen/ui/progress.md`, `gen/ui/r2_lore.md` (places.json lore, the 圖志 journal), `gen/ui/brief.md` (the
  standing rules).
- **The world:** eight joined sections, 754 figures. Every painted figure and what it does is in `map/text/<S>.md`,
  and its group (`S4.grp.*`) is a natural scene. Section folders are in `map/sections.json`. Casting is in
  `sections/<folder>/people.json` (figure slug → character, clips).

## The user's standing rules for words (memory)

- **Loyal to the painting.**
  - Only painted figures speak, and a line explains what that painted body is doing.
  - No invented personal names: a role in period words (賣卦先生, 稅吏, 腳夫).
  - Every beat cites its reading (`src`). Sources include 东京梦华录, 名画记, 余辉 2014, the map's own description,
    or "our proposal".
- **Language:**
  - short Song-flavoured vernacular in 繁體 (not modern slang, not classical prose), in the ink UI's 古代繁体 look;
  - Chinese bubbles; text only (voices wait for a provider: ElevenLabs Chinese voices were rejected);
  - no numbers anywhere in the UI (STYLE §9).
- **Phones first:** it must cost nothing visible on the low tier. The user's bar: pass the checks, then the user looks.

## Do

1. **Earshot chatter, automatic.** Groups talk among themselves on a loop whether or not you're there, with natural
   timing:
   - staggered starts, pauses, turn-taking, replies, the occasional thought bubble;
   - a witness reacting;
   - lines varied so a loop doesn't feel canned: two or three alternatives per beat, picked without repeating the
     last one.

   Bubbles are drawn only near the player (≤ ~10 m, on screen, nearest first), sharing the two-bubble cap with near
   talk (near talk wins).
   - Lone figures get a single bark now and then, from what they are doing (a hawker's cry, a porter's grunt-line, a
     sleeper's Zzz thought). Keep them rare: "calm by subtraction".
   - A speaking figure should not be playing a clip that contradicts its words; pick lines that fit its `do` cycle.
2. **Close talk with depth.** Many more press-E scenes, at the main figures of every section. The player's character
   changes the lines (the "You" panel; `design.md`: the beggar boys ask the official for a coin, carters bow to him).
   Keep 2–6 beats.
3. **Plot lines across the street.** A few threads that run through several scenes along the scroll, each step
   grounded in painted figures. Possible kinds:
   - news or a rumour passed from group to group;
   - a cargo followed from the wharf to the market;
   - the quarrel at the gate that others talk about further on.

   Overhearing a step ticks it into the journal (圖志) in ink: no counters, no quest log (STYLE §9, §15).
4. **Intent marks** (far tier, STYLE §5): small painted pictograms over the heads of figures at their scene's peak,
   at most about 6, nearest first. Do them only if the chatter and talk are solid first; otherwise leave them for
   later and note it.
5. **All eight sections.** Pilot one section end to end first (S4 outer_road or the gate) and check it. Then scale,
   one content subagent per section if you like, reading `map/text/<S>.md`. Every section gets a `talk.json` (scenes
   + chatter + barks).

## Checks (numbers, not looks)

Extend `tools/ui_data.mjs check`, or add a talk check:
- every speaker is a figure in that section's people.json and the map;
- every line has a `src`;
- line lengths stay within the bubble's limit, and no glyph is missing from the font subset;
- no two bubbles overlap on screen in the standard views;
- at most two are open at once;
- the chatter scheduler's cost per frame on the phone proxy (low tier) is within noise of before.

Measure that cost with the existing tools (`tools/bench_page.mjs`, `gen/perf/probe.mjs`) at the storyteller and
crown views. Then run the regression: `tools/chrome_slot.sh bash gen/expand/round2/page_qa/regress.sh <tag>` must
pass as before. Make a few screenshots of chatter in place for the lead's final look.

## Rules

- **Ownership.**
  - `web/src/ui/` (talk.js, components, journal) and `sections/*/talk.json` are yours. The ink-UI session that owned
    them is finished.
  - `web/src/world.js`, `people.js` and the other engine files belong to the performance session (3d-director-04).
    Read them freely. If you need a hook there, keep it to a few lines, re-read the file right before the edit, and
    message 3d-director-04 (SendMessage) saying what you added. Don't reformat others' blocks.
- Pages only through `tools/chrome_slot.sh` against `tools/check_server.sh` (5190). `tools/machine.sh status` before
  heavy work. Never deploy: the lead hands deploys to the performance session.
- No paid calls: no voice generation. Text only.
- Record as you go in `gen/life/progress.md` (new), and fold the lasting rules into `gen/life/design.md` and
  `gen/ui/STYLE.md` at the end.
- Finish with:
  - per section: scenes, chatter groups, barks, plot-line steps;
  - the check results and the perf numbers before and after;
  - screenshots;
  - open questions for the user.
