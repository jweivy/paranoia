# Day-Night Cycle — Design Spec

## Overview

A cosmetic sky animation in the hero section of the Paranoia website. A red sun arcs across the hero during daytime; a crescent moon does the same at night. Stars twinkle behind the title at night, translucent clouds drift during the day. Everything sits behind the text — never blocking "PARANOIA" or any other content.

## Visual Elements

### Sun (Daytime)
- Big red circle, `#ff1a1a`
- `box-shadow` glow: `0 0 40px rgba(255,26,26,0.6), 0 0 80px rgba(255,26,26,0.3)`
- 50px diameter
- Matches the existing red accent color scheme

### Moon (Nighttime)
- Crescent shape: white circle (`#e8e8e8`) with a dark `#0a0a0a` circle overlaid to create the crescent
- Subtle white glow: `0 0 20px rgba(255,255,255,0.3)`
- 40px diameter

### Stars (Nighttime)
- ~40 small dots (1-3px), randomized positions within the hero section
- Randomized twinkle animation (opacity oscillates 0.2 to 1.0, varying durations 1.5-3.5s)
- Fade in over 1s at sunset, fade out at sunrise

### Clouds (Daytime)
- 3 translucent shapes (`rgba(255,255,255,0.04)`) with rounded borders
- Each drifts at a different speed (18s, 24s, 30s) in alternating directions
- Mostly invisible — atmospheric texture only
- Reduced to 15% opacity at night (not fully hidden)

## Arc Motion

### Path
- Semicircular arc, left to right
- Width: 55% of the hero container width (narrower, centered over title)
- Height: 180px above baseline (tall enough to clear all text comfortably)
- Baseline: 200px from top of sky container
- The arc path itself is invisible — no dashed line or visual indicator

### Timing
- **Production mode:** Based on real user clock time. Sunrise at 6:00 AM, sunset at 6:00 PM local time.
- **Demo mode:** Full 24-hour cycle compressed to 10 seconds. Toggled by a `DEMO_MODE` flag (consistent with the existing demo mode pattern in `app.js`).
- Sun position at any moment corresponds to progress through daytime hours (6 AM = left horizon, noon = peak, 6 PM = right horizon).
- Moon position corresponds to progress through nighttime hours (6 PM = left, midnight = peak, 6 AM = right).

### Transitions
- Sun and moon fade in/out over 0.5s at sunrise/sunset
- Stars fade over 1s
- Background glow shifts between warm red (day) and cool blue-purple (night) over 1s

## Layering (Z-Index)

All sky elements sit behind the hero text content:

| Layer | Z-Index | Elements |
|-------|---------|----------|
| Sky background | 0 | Sun, moon, stars, clouds, background glow |
| Hero text | 2 | `.hero-sub`, `.hero-title`, `.hero-tagline`, `.stats-bar` |
| Navigation | 100 | Sticky nav (existing) |

All sky elements use `pointer-events: none` so they never interfere with clicks.

## Integration with Existing Systems

### Game Active/Inactive
- **Fully independent.** The day/night sky cycle runs on real clock time regardless of game state.
- The existing `game-inactive` class continues to desaturate the page during off-hours. The sky elements will also be affected by this desaturation filter since they're inside `.hero`.
- No changes to `GAME_SCHEDULE`, `isGameActive()`, or `updateGameState()`.

### Existing Hero Styles
- The hero `::before` pseudo-element (pulsing red glow) remains. The sky container sits alongside it.
- The sky is a new `div.sky` inserted as the first child of `.hero`, positioned absolute to fill the hero area.

### Demo Mode
- Reuse the existing `DEMO_MODE` flag pattern from `app.js`. When enabled, `CYCLE_DURATION = 10000` (10s). When disabled, positions are calculated from `new Date()`.

## Scope

- **Hero section only.** Stars, clouds, sun, and moon are all clipped to the hero area.
- **No changes** to leaderboard, kill feed, rules, hall of assassins, submission page, or footer.
- **No new dependencies.** Pure CSS animations + JS `requestAnimationFrame`.

## Files Modified

- `css/styles.css` — New styles for `.sky`, `.sun`, `.moon`, `.star`, `.cloud`, background glow transitions
- `js/app.js` — New `initDayNightCycle()` function, star generation, arc position calculation, `requestAnimationFrame` loop
- `index.html` — New `.sky` container div inside `.hero`, before text elements

## Mobile Considerations

- Arc width uses percentage of container, so it scales naturally on smaller screens
- Sun/moon sizes are fixed (50px/40px) which works at mobile scale given the `clamp()` title sizing
- Clouds use CSS animations with percentage-based positioning
- Stars are percentage-positioned, so they redistribute on resize
- `pointer-events: none` prevents any tap interference on mobile
