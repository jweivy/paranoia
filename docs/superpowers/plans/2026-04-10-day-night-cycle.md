# Day-Night Cycle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a cosmetic day/night sky animation to the hero section — red sun by day, crescent moon and stars by night, drifting clouds — all behind the "PARANOIA" title text.

**Architecture:** Pure CSS + JS addition to the existing static site. A new `.sky` container div inside `.hero` holds all celestial elements (sun, moon, stars, clouds). JS calculates arc positions via `requestAnimationFrame`. Reuses the existing `DEMO_MODE` flag pattern for 10-second test cycles.

**Tech Stack:** Vanilla HTML/CSS/JS (no dependencies)

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `index.html:32` | Modify | Add `.sky` container div inside `.hero`, before text elements |
| `css/styles.css:328` | Modify | Add sky layer styles after the HERO section header comment |
| `js/app.js:267` | Modify | Add day-night cycle system before the GAME SCHEDULE section |

---

### Task 1: Add Sky Container HTML

**Files:**
- Modify: `index.html:32-33` (inside `.hero`, before `.hero-sub`)

- [ ] **Step 1: Insert the sky container div**

Add the `.sky` wrapper with sun, moon, stars container, and clouds as the first child of `.hero`:

```html
<!-- Hero -->
<header class="hero">
  <!-- Day/Night Sky -->
  <div class="sky" id="sky">
    <div class="sun" id="sky-sun"></div>
    <div class="moon" id="sky-moon"></div>
    <div class="stars" id="sky-stars"></div>
    <div class="clouds">
      <div class="cloud cloud-1"></div>
      <div class="cloud cloud-2"></div>
      <div class="cloud cloud-3"></div>
    </div>
  </div>

  <div class="hero-sub">BROOKS SCHOOL • SPRING 2026</div>
```

Insert lines between `<header class="hero">` (line 32) and `<div class="hero-sub">` (line 33). Everything else in the hero stays exactly as-is.

- [ ] **Step 2: Verify page still renders**

Run: Open `index.html` in browser or start local dev server.
Expected: Page looks identical — no visible change yet since there's no CSS for the new elements.

---

### Task 2: Add Sky CSS Styles

**Files:**
- Modify: `css/styles.css` — insert new section after the `/* ========== HERO ========== */` block (after line 354, before `.hero-sub`)

- [ ] **Step 1: Add sky container and celestial body styles**

Insert this CSS block after line 354 (after the `hero-pulse` keyframe) and before the `.hero-sub` rule (line 356):

```css
/* ========== DAY/NIGHT SKY ========== */

.sky {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 100%;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
}

/* Sun — big red circle */
.sun {
  position: absolute;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: var(--red);
  box-shadow: 0 0 40px rgba(255, 26, 26, 0.6), 0 0 80px rgba(255, 26, 26, 0.3);
  opacity: 0;
  transition: opacity 0.5s ease;
}

/* Moon — crescent via overlapping circles */
.moon {
  position: absolute;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #e8e8e8;
  box-shadow: 0 0 20px rgba(255, 255, 255, 0.3), 0 0 40px rgba(255, 255, 255, 0.1);
  opacity: 0;
  transition: opacity 0.5s ease;
}

.moon::after {
  content: '';
  position: absolute;
  top: -5px;
  left: 10px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--bg);
}

/* Stars — twinkling dots */
.stars {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  opacity: 0;
  transition: opacity 1s ease;
}

.star {
  position: absolute;
  width: 2px;
  height: 2px;
  background: #fff;
  border-radius: 50%;
  animation: twinkle 2s ease-in-out infinite alternate;
}

@keyframes twinkle {
  0% { opacity: 0.2; }
  100% { opacity: 1; }
}

/* Clouds — translucent drifting shapes */
.clouds {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  opacity: 0;
  transition: opacity 1s ease;
}

.cloud {
  position: absolute;
  background: rgba(255, 255, 255, 0.04);
  border-radius: 50px;
  height: 20px;
}

.cloud-1 {
  width: 120px;
  top: 30%;
  animation: cloud-drift-1 18s linear infinite;
}

.cloud-2 {
  width: 80px;
  top: 50%;
  animation: cloud-drift-2 24s linear infinite;
}

.cloud-3 {
  width: 150px;
  top: 20%;
  animation: cloud-drift-3 30s linear infinite;
}

@keyframes cloud-drift-1 {
  0% { left: -130px; }
  100% { left: 110%; }
}

@keyframes cloud-drift-2 {
  0% { left: 110%; }
  100% { left: -100px; }
}

@keyframes cloud-drift-3 {
  0% { left: -160px; }
  100% { left: 110%; }
}
```

- [ ] **Step 2: Ensure hero text sits above the sky layer**

Add `position: relative;` and `z-index: 2;` to the hero text elements. Modify these existing rules:

`.hero-sub` (line 356): add `position: relative; z-index: 2;`
`.hero-title` (line 363): already has `position: relative;` — add `z-index: 2;`
`.hero-tagline` (line 373): add `position: relative; z-index: 2;`
`.stats-bar` (line 382): add `position: relative; z-index: 2;`
`.last-updated` (line 554): add `position: relative; z-index: 2;`

- [ ] **Step 3: Add reduced-motion support for sky animations**

Add to the existing `@media (prefers-reduced-motion: reduce)` block (around line 1122):

```css
  .sky { display: none; }
```

This completely hides the sky for users who prefer reduced motion, since the entire feature is decorative animation.

- [ ] **Step 4: Verify sky container is invisible but present**

Run: Open page in browser, inspect `.sky` element.
Expected: `.sky` div exists, positioned absolute inside `.hero`, but no celestial bodies visible (all start at `opacity: 0`). Hero text unchanged.

---

### Task 3: Add Day-Night Cycle JavaScript

**Files:**
- Modify: `js/app.js` — insert new section before the `// GAME SCHEDULE & INACTIVE STATE` comment (line 266)

- [ ] **Step 1: Add the day-night cycle module**

Insert this block before line 266 (`// ========================================` above `// GAME SCHEDULE & INACTIVE STATE`):

```javascript
// ========================================
// DAY/NIGHT SKY CYCLE
// ========================================
// Cosmetic sky animation in the hero. Independent from game active/inactive state.
// Uses DEMO_MODE flag: when true, full 24h cycle in 10 seconds.
// When false, positions based on real user clock time.

const SKY_SUNRISE = 6;  // 6 AM
const SKY_SUNSET = 18;  // 6 PM
const SKY_CYCLE_MS = 10000; // 10s per full day in demo mode
const SKY_STAR_COUNT = 40;

function initDayNightCycle() {
  const sky = document.getElementById('sky');
  if (!sky) return;

  const sunEl = document.getElementById('sky-sun');
  const moonEl = document.getElementById('sky-moon');
  const starsEl = document.getElementById('sky-stars');
  const cloudsEl = sky.querySelector('.clouds');

  // Generate stars
  for (let i = 0; i < SKY_STAR_COUNT; i++) {
    const star = document.createElement('div');
    star.className = 'star';
    star.style.left = Math.random() * 100 + '%';
    star.style.top = Math.random() * 100 + '%';
    star.style.animationDelay = (Math.random() * 2) + 's';
    star.style.animationDuration = (1.5 + Math.random() * 2) + 's';
    const size = 1 + Math.random() * 2;
    star.style.width = size + 'px';
    star.style.height = size + 'px';
    starsEl.appendChild(star);
  }

  function getSkyHour() {
    if (DEMO_MODE) {
      const progress = (Date.now() % SKY_CYCLE_MS) / SKY_CYCLE_MS;
      return progress * 24;
    }
    const now = new Date();
    return now.getHours() + now.getMinutes() / 60;
  }

  function getArcPosition(progress) {
    const skyWidth = sky.offsetWidth;
    const angle = Math.PI * (1 - progress); // PI to 0 = left to right
    const arcWidth = skyWidth * 0.55;
    const centerX = skyWidth / 2;
    const arcHeight = 180;
    const baseY = 200;

    return {
      x: centerX + (arcWidth / 2) * Math.cos(angle),
      y: baseY - arcHeight * Math.sin(angle)
    };
  }

  function updateSky() {
    const hour = getSkyHour();
    const isDay = hour >= SKY_SUNRISE && hour < SKY_SUNSET;

    if (isDay) {
      const dayProgress = (hour - SKY_SUNRISE) / (SKY_SUNSET - SKY_SUNRISE);
      const pos = getArcPosition(dayProgress);

      sunEl.style.left = (pos.x - 25) + 'px';
      sunEl.style.top = (pos.y - 25) + 'px';
      sunEl.style.opacity = '1';
      moonEl.style.opacity = '0';
      starsEl.style.opacity = '0';
      cloudsEl.style.opacity = '1';
    } else {
      let nightHours = hour >= SKY_SUNSET ? hour - SKY_SUNSET : (24 - SKY_SUNSET) + hour;
      const totalNight = 24 - (SKY_SUNSET - SKY_SUNRISE);
      const nightProgress = nightHours / totalNight;
      const pos = getArcPosition(nightProgress);

      moonEl.style.left = (pos.x - 20) + 'px';
      moonEl.style.top = (pos.y - 20) + 'px';
      moonEl.style.opacity = '1';
      sunEl.style.opacity = '0';
      starsEl.style.opacity = '1';
      cloudsEl.style.opacity = '0.15';
    }

    requestAnimationFrame(updateSky);
  }

  requestAnimationFrame(updateSky);
}
```

- [ ] **Step 2: Hook into init()**

Add `initDayNightCycle();` call inside the existing `init()` function (line 461), right after the `startGameStateChecker()` call (line 466). Insert on a new line after line 466:

```javascript
  // Start day/night sky cycle
  initDayNightCycle();
```

- [ ] **Step 3: Set DEMO_MODE to true for testing**

Change line 272 from:
```javascript
const DEMO_MODE = false;
```
to:
```javascript
const DEMO_MODE = true;
```

This enables the 10-second cycle for both the game state checker AND the sky cycle.

- [ ] **Step 4: Visual verification — demo mode**

Run: Open page in browser.
Expected:
- Red sun arcs left-to-right over the title during simulated daytime (5s)
- Sun fades out at sunset, crescent moon fades in and arcs left-to-right during night (5s)
- ~40 stars twinkle behind title during nighttime, fade away at sunrise
- 3 translucent clouds drift during daytime, dim to 15% at night
- All elements stay behind "PARANOIA" text — never blocking any content
- Full cycle repeats every 10 seconds
- Existing game active/inactive desaturation still works independently

---

### Task 4: Final Cleanup

- [ ] **Step 1: Set DEMO_MODE back to false**

Julian will give the go-ahead to flip this. Change line 272 back to:
```javascript
const DEMO_MODE = false;
```

**Note:** Only do this step when Julian confirms the feature looks good and is ready for production behavior (real clock time).

- [ ] **Step 2: Commit all changes**

```bash
git add index.html css/styles.css js/app.js
git commit -m "feat: add day/night sky cycle to hero section"
```

Wait for Julian's explicit approval before committing.
