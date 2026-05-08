# PARANOIA — Brooks School Live Game Tracker

> **Every man for himself.** A live leaderboard, kill feed, and rule book for Brooks School's annual senior assassination game.

🌐 Live site: [brooksparanoia.live](https://brooksparanoia.live)
🏆 2026 Champion: **Mia Macklin-Dib**

---

## What this is

A static website (HTML + CSS + vanilla JS) that pulls game data from a Google Sheet via a Google Apps Script Web App and renders a real-time scoreboard. No backend to host, no database to manage — just a Google Sheet, a script, and Vercel-style static hosting.

It was built for the Class of 2026 game and is now passed forward to whichever class wants to run Paranoia next.

## Features at a glance

### Live data
- **Live leaderboard** with kills per player, automatic re-ranking, and smart tie-breaker (whoever got their first kill earliest wins ties)
- **Live kill feed** — every elimination, newest first, paginated 10 at a time
- **Stats bar** — alive / eliminated / current day / total kills, computed from the data
- **Auto-refresh** every 60 seconds
- **"Last updated"** timestamp showing how stale the data is

### Toggles & filters
- **Alive-only filter** on the leaderboard (toggle to see eliminated players)
- **Show 10 more / Show all / Collapse** pagination on both feeds

### Atmospheric UI
- **Day / night sky animation** — a sun arcs across the hero from 6 AM to 6 PM, then a moon and 40 twinkling stars take over from 6 PM to 6 AM. Mobile uses a hand-drawn-style power-curve dome; desktop uses a circular arc.
- **Game-active / inactive desaturation** — when the game is paused (after-hours, weekend, sleep-in), the whole page goes grayscale and a small `GAME INACTIVE` chip appears.
- **Rules cards** with `UPDATED` and `REMOVED` badges so changes are obvious
- **Past winners** wall going back to 2012

### Game-master tools (callable from the browser console)
These are the reusable functions Julian wired in for future gamemasters:

- `showOffDay(heading, message, reason)` — Shows a full-screen popup *and* a banner strip below the stats. Use for snow days, revisit days, or any pause. Calling it again replaces the previous one.
- `showRuleChange()` — One-time popup announcing a rule update (keyed by `localStorage` so each visitor sees it once). The storage key is hardcoded inside the function — bump it for each new announcement so returning visitors see the next one.
- The **winner modal** at the bottom of `index.html` is a one-shot pattern: a hidden `<div id="update-modal">` plus a 12-line inline `<script>` that shows it once per visitor based on a `data-update-key` attribute. Copy-paste this block, change the key, and you have a new one-time announcement.

### Mobile-first details
- Sticky nav with hamburger menu
- Full-width "SUBMIT A KILL" CTA pinned below the nav
- `submission.html` shows the Google Form in an iframe on desktop and a big direct-link button on mobile (Google logins don't work inside iframes on iOS)

---

## How it works (architecture)

```
┌──────────────────┐      ┌────────────────────┐      ┌──────────────────┐
│  Kill Report     │      │   Google Sheet     │      │   Apps Script    │
│  Google Form     │ ───▶ │   (game data)      │ ───▶ │   Web App (JSON) │
└──────────────────┘      └────────────────────┘      └────────┬─────────┘
                                                                │
                                                                ▼
                                                      ┌──────────────────┐
                                                      │  index.html      │
                                                      │  + js/app.js     │
                                                      │  fetch every 60s │
                                                      └──────────────────┘
```

The Apps Script returns JSON shaped like this:

```json
{
  "leaderboard": [
    { "name": "Player Name", "kills": 3, "active": true }
  ],
  "eliminations": [
    { "killer": "A", "victim": "B", "day": "Day 5" }
  ],
  "lastUpdated": "2026-04-23T12:34:56.000Z"
}
```

That shape is the contract. As long as your Apps Script returns this, the site works.

---

## File layout

```
.
├── index.html         # Main page — nav, hero, stats, panels, rules, winners, footer
├── submission.html    # /submission — embedded Google Form for kill reports
├── css/styles.css     # All styling. Single file, sectioned with /* ========== */ headers
├── js/app.js          # All logic. Data fetch, render, sky animation, schedule, popups
└── assets/            # (Empty — drop images here if you add any)
```

Five tracked files. That's the whole thing.

For an AI agent walking the codebase, see [`CLAUDE.md`](CLAUDE.md).

---

## Setup for next year's gamemaster

You'll need ~30 minutes and a Brooks School Google account.

### 1. Fork or clone this repo

```bash
git clone https://github.com/jweivy/paranoia.git paranoia-2027
cd paranoia-2027
```

### 2. Make your own Google Sheet + Apps Script

a. Make a copy of the Sheet (ask Julian or the previous gamemaster for the template, or recreate it: a `Players` tab with `name | kills | active` columns, an `Eliminations` tab with `killer | victim | day` columns).

b. Open **Extensions → Apps Script** in the Sheet.

c. Paste a `doGet()` that returns the JSON shape shown above. Something like:

```js
function doGet() {
  const ss = SpreadsheetApp.getActive();
  const players = ss.getSheetByName('Players').getDataRange().getValues();
  const elims = ss.getSheetByName('Eliminations').getDataRange().getValues();
  // ... map rows to the JSON shape ...
  return ContentService.createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
```

d. **Deploy → New deployment → Web app**, set "Who has access" to **Anyone**, and copy the URL.

### 3. Wire up your URL

Open `js/app.js`, line 7. Replace `API_URL` with your new Apps Script URL.

### 4. Update the year-specific stuff

Search the codebase for `2026`, `MIA MACKLIN-DIB`, and `paranoia-2026-winner` and replace them with your year:

- `index.html` — winner banner (lines ~32–36), winner modal (lines ~221–245), Hall of Assassins (lines ~193–209), and the `2026` text in the footer
- `js/app.js` — `localStorage` keys inside `showRuleChange()` so returning visitors see your updates
- `package.json` / Vercel project name — your choice

### 5. Update the Kill Report form

The kill-report Google Form URL is hardcoded in `index.html` (3 places) and `submission.html` (3 places). Search for `docs.google.com/forms/d/e/` and replace with your own form's URL.

### 6. Deploy

Static hosting works on **Vercel**, **Netlify**, **GitHub Pages**, or anywhere that serves files. Julian used Vercel + a custom domain (`brooksparanoia.live`).

```bash
npm i -g vercel
vercel deploy
```

That's it. No build step. No framework. No npm install (unless you're using the Vercel CLI to deploy).

---

## Easter eggs hidden in the site

A few have been left behind for the curious. **No spoilers in the README** — go find them. Hints:

- 🎮 The classics still work
- 🖥️ Open the browser console (F12). Say hi.
- 🌙 Watch the sky long enough

If you're handing the site forward, please leave at least one in. It's a tradition now.

> *More Easter egg ideas to consider adding:*
> *• Click the 😈 logo seven times to reveal something*
> *• A `?ghost=<name>` URL parameter that overlays a tribute*
> *• Hidden total-kills counter showing every kill in the school's history*
> *• A "Class of '26" signature wall that fades in if you scroll to the very bottom and wait 10 seconds*
> *• Right-click the winner's name in the Hall of Assassins to play a tiny crown animation*

---

## Credits

Built by **Julian Wei '26** during the spring of 2026, mostly between classes and right after rowing practice.

The **Matt Mulvey '21 Rule** is named after a Brooks alum who saved his own life by giving a Chapel Talk and then promptly being eliminated outside the chapel. The rule is in honor of his sacrifice.

Designed for the seniors of Brooks School. Hand it down.

---

## License

Use it, fork it, run your own school's Paranoia with it. Just keep the *Built by Julian Wei '26* credit at the bottom. That's the only ask.
