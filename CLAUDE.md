# CLAUDE.md — AI Codebase Guide

This file is for AI coding assistants (Claude Code, Codex, Cursor, etc.) being asked to modify or understand the Paranoia game tracker. Read it before touching code.

If you're using a tool that prefers `AGENTS.md`, this file works the same — symlink or copy it.

---

## What this codebase is

A static, single-page game tracker for Brooks School's annual senior assassination game. Five tracked files. Vanilla HTML/CSS/JS. No build step. No framework. No npm. No backend the codebase owns — it pulls JSON from a Google Apps Script Web App.

Pushing a change is `git push`. Vercel auto-deploys on push to `master`.

---

## Files (everything tracked in git)

```
index.html          247 lines   — main page
submission.html      90 lines   — kill-report iframe page
css/styles.css     1599 lines   — all styling, sectioned by /* ========== HEADER ========== */
js/app.js           633 lines   — all logic
.gitignore                      — keeps Claude/Vercel/local artifacts out
```

That's it. Anything else under the working directory (`.claude/`, `.superpowers/`, `docs/superpowers/`, `graphify-out/`, `.vercel/`, `*.bak`, `assets/` if empty) is local-only.

---

## Architecture in one paragraph

`index.html` is the markup. It has empty `<div id="leaderboard-list">` and `<div id="killfeed-list">` containers that JavaScript fills. `js/app.js` runs on `DOMContentLoaded`, fetches JSON from the Apps Script `API_URL` (line 7), and renders into those containers. It also runs three independent loops: a 60-second data refetch, a 60-second game-active checker that toggles `body.game-inactive`, and a `requestAnimationFrame` loop that animates the sun/moon across the hero. CSS does all the styling and the inactive-state desaturation.

---

## Data contract

`fetchGameData()` (app.js:16) expects this JSON shape from `API_URL`:

```ts
{
  leaderboard: { name: string, kills: number, active: boolean }[],
  eliminations: { killer: string, victim: string, day: string }[],  // day is "Day N" string
  lastUpdated: string  // ISO-8601
}
```

`day` is a string like `"Day 5"` because the original Sheet stored it that way. `app.js` parses the integer out with `match(/\d+/)` whenever it needs to sort or compute "current day". If you change the Sheet to use real numbers, fix `sortEliminationsChronological` (app.js:33) and `renderStats` (app.js:41).

---

## The render pipeline

```
init()                  app.js:578
  ├─ showRuleChange()        — one-time popup, gated on localStorage
  ├─ startGameStateChecker() — sets body.game-inactive class, runs every 60s
  ├─ initDayNightCycle()     — sun/moon RAF loop
  └─ fetchGameData() ─▶ renderAll(data)   app.js:262
                          ├─ renderStats         app.js:41
                          ├─ renderLeaderboard   app.js:96
                          │     └─ renderLeaderboardSlice  app.js:130
                          ├─ renderKillFeed      app.js:189
                          │     └─ renderKillfeedSlice     app.js:206
                          └─ renderLastUpdated   app.js:242
       setInterval(fetch + renderAll, 60000)
```

`renderLeaderboard` and `renderKillFeed` both follow the same pattern:
1. Sort the full data set into a module-level array (`leaderboardData`, `killfeedData`).
2. Reset the `*shown` counter.
3. Call the `*Slice()` function which slices `[0, shown)` and renders.
4. Inline `<button onclick="showMoreX()">` handlers re-call the slice function with a bigger window.

Pagination size is `LEADERBOARD_PAGE = 10` (app.js:63) and `KILLFEED_PAGE = 10` (app.js:173).

---

## Reusable functions you'll be asked to call

These were intentionally left behind for future gamemasters to use without code changes.

### `showOffDay(heading, message, reason)`  —  app.js:508

Shows a fullscreen overlay popup *and* a yellow banner strip below the stats bar. Use for snow days, revisit days, or anything that pauses the game.

```js
showOffDay("GAME PAUSED", "NO PARANOIA TODAY", "Snow day — game resumes tomorrow.");
```

Calling it again removes any existing off-day elements first, so it's idempotent. Inputs are HTML-escaped via `escapeHtml()`.

To make it persist across page loads, call it from `init()` instead of from the console.

### `showRuleChange()`  —  app.js:549

One-time-per-visitor popup announcing rule updates. Gated by a `localStorage` key (`STORAGE_KEY` on app.js:550). To push a new announcement: edit the rule items inside the function, **change the storage key** to a new string (otherwise visitors who saw the old one won't see the new one), and redeploy.

### The "winner modal" pattern  —  index.html:221–245

A reusable one-shot announcement: a hidden `<div>` with a `data-update-key` attribute, plus a 12-line inline script that shows it once per visitor based on `localStorage.getItem('paranoia-seen-' + key)`. To repurpose: copy the block, change the inner text, change `data-update-key` to a new string, and the next visit will show it once.

This is intentionally inline (not in `app.js`) so it's easy for the next gamemaster to find and edit without scrolling through the JS file.

---

## The day/night sky

`initDayNightCycle()` (app.js:295) runs in a `requestAnimationFrame` loop. The sky element is positioned absolute behind the hero text. The sun is shown 6 AM – 6 PM, the moon 6 PM – 6 AM, with 40 randomly-positioned twinkling stars at night.

**Two arc shapes** depending on viewport width (the boundary is checked by `sky.offsetWidth <= 768`):

- **Mobile** uses `y = peakY + (baseY - peakY) * |2p - 1|^7` — a power curve with a flat top and steep sides, sized to clear all the hero text. The exponent 7 is empirical; lower exponents collide with the title.
- **Desktop** uses a simple circular arc parameterized by `angle = π(1 - progress)`.

The sky reads time from `getDemoDate()` if `DEMO_MODE` is true, else `new Date()`. Even in demo mode, the sky uses 6 AM / 6 PM as its sunrise/sunset constants — it's intentionally decoupled from the game-active schedule.

If you change the desaturation effect (`body.game-inactive`), note that the sky is *not* desaturated by default — it stays vivid because `.winner-banner` and the sky are explicitly preserved.

---

## Game-active scheduling

`isGameActive(date)` (app.js:428) checks two things: the day-of-week from `GAME_SCHEDULE` (app.js:396) and a `[hour, minute]` window. Returns true only if both pass.

`updateGameState()` (app.js:439) toggles `body.classList.toggle('game-inactive', !active)`, which CSS uses to desaturate the page (`css/styles.css` around line 393). It also toggles the `#game-status` chip.

The schedule is hardcoded — class hours, sleep-in days. If next year's schedule changes (different blocks, different early-release days), edit `GAME_SCHEDULE` directly. There's no remote config.

### Demo mode

Setting `DEMO_MODE = true` (app.js:392) compresses each weekday into 30 seconds (`DEMO_DAY_MS`) and renders a demo-clock chip in the corner so you can preview the inactive transitions and sky cycle without waiting. Always ship with `DEMO_MODE = false`.

---

## CSS conventions

`css/styles.css` is a single file split by `/* ========== SECTION ========== */` comment headers. Search for the heading to find the section. Order: variables → reset → nav → off-day overlay → rule-change popup → winner banner → game-inactive overlay → demo clock → hero/sky → stats → main grid (leaderboard + killfeed) → rules → winners → submission page → footer → responsive (`@media (max-width: 900px)` and `768px`).

Color tokens live in `:root` (line 12). The palette is intentionally five reds plus four grays plus background tiers — don't introduce new color variables, reuse the existing ones.

Mobile breakpoints are 900px (rules grid drops from 3 → 2 columns) and 768px (full mobile layout). The kill CTA button (`.mobile-kill-cta`) is `display: none` on desktop and `display: block` on mobile.

### Mobile gotchas baked in

- The mobile menu open/close is a one-line inline `onclick` on `index.html:28` — `classList.toggle('open')` on `.nav-links`. Keep this; do not move it inside `<nav>` if you ever add `backdrop-filter` to the nav (causes WebKit compositing bug).
- The Google Form is hidden on mobile (`<768px`) and replaced with a direct-link button, because Google logins fail inside iframes on iOS.

---

## Common changes and where to make them

| Task | Where |
|---|---|
| Update hunting hours | `index.html` rules card (around line 124) **and** `GAME_SCHEDULE` in `js/app.js:396` |
| Add a rule | `index.html` rules grid (around line 120). Add `<span class="rule-updated-badge">UPDATED</span>` if it's new mid-season |
| Remove a rule | Wrap the card with `class="rule-card shield-removed"` and the text in `<span class="strikethrough">` — see the SHIELD card at `index.html:171` for the pattern |
| Push a one-time announcement to all visitors | Edit `showRuleChange()` items in `app.js:549` and **change the `STORAGE_KEY`** |
| Show a snow-day banner | Open browser DevTools console and call `showOffDay(...)` — or add it to `init()` for persistence |
| Add a winner | `index.html` Hall of Assassins (line 193) plus the `.winner-banner` block (line 32) plus the winner modal (line 221) plus a `localStorage` key bump |
| Change refresh interval | `REFRESH_INTERVAL` constant at `app.js:10` |
| Change pagination size | `LEADERBOARD_PAGE` or `KILLFEED_PAGE` constants |

---

## Things to leave alone

- `escapeHtml()` (app.js:493) is the only XSS protection — every player name and day string passes through it. Don't bypass it.
- The chronological-elimination tiebreaker on the leaderboard (`firstKillIndex` in `renderLeaderboard`, app.js:103) is **the** rule for ties. Players will argue if it changes.
- The `data-update-key` / `localStorage.getItem('paranoia-seen-' + key)` pattern. Don't refactor it into something fancier — its whole point is being copy-pasteable for non-coders.
- Inline `onclick=` handlers. They're intentional — easy to read for a non-coder coming back to update the site.

---

## How to verify a change

There's no test suite. Sanity-check by:

1. Open `index.html` directly in a browser (no server needed for static assets, but `fetch()` will fail on `file://` due to CORS — use VS Code Live Server or `python -m http.server` for local dev).
2. Toggle `DEMO_MODE = true` in `app.js` to fast-forward through schedule transitions.
3. Resize the window across the 768px / 900px breakpoints.
4. Test on a real iPhone if you change anything mobile-related — the Safari iOS quirks (iframe Google login, `backdrop-filter` compositing) don't reproduce in Chrome DevTools mobile emulation.

---

## Easter eggs (don't accidentally remove)

Two hidden tributes live at the bottom of `js/app.js` under the `// EASTER EGGS` header:

1. A styled console signature on page load.
2. A Konami-code listener (↑ ↑ ↓ ↓ ← → ← → B A) that reveals a "Class of 2026" overlay; click to dismiss.

If you're refactoring, keep them. They're tradition.

---

## When in doubt

- **Don't add a framework.** The whole point is that next year's gamemaster (probably not a coder) can open `index.html` in a text editor and change a date.
- **Don't add a build step.** Same reason.
- **Don't move JS into modules.** Single file. Search-friendly.
- **Don't break the 5-file footprint** without a very good reason. The clarity of "5 files, that's everything" is itself a feature.
