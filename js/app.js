// ========================================
// PARANOIA — Live Data Engine
// ========================================
//
// INSTRUCTIONS: Replace this URL with the gamemaster's Google Apps Script URL
// It should look like: https://script.google.com/macros/s/XXXXX/exec
const API_URL = 'https://script.google.com/a/macros/brooksschool.org/s/AKfycbzBOmy_oECQzpYqS969wKXSVefH3d4kYjh2e6iShHA83WLPZ5DSkYiXF1XU0mZuZGjQ/exec';

// How often to refresh data (in milliseconds) — every 60 seconds
const REFRESH_INTERVAL = 60000;

// ========================================
// DATA FETCHING
// ========================================

async function fetchGameData() {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    return data;
  } catch (err) {
    console.error('Failed to fetch game data:', err);
    return null;
  }
}

// ========================================
// RENDERING
// ========================================

// Sort eliminations chronologically (Day 1 before Day 2, etc.)
function sortEliminationsChronological(eliminations) {
  return [...eliminations].sort((a, b) => {
    const dayA = parseInt((a.day || '').match(/\d+/)?.[0]) || 0;
    const dayB = parseInt((b.day || '').match(/\d+/)?.[0]) || 0;
    return dayA - dayB;
  });
}

function renderStats(data) {
  const leaderboard = data.leaderboard || [];
  const eliminations = data.eliminations || [];

  const alive = leaderboard.filter(p => p.active).length;
  const eliminated = leaderboard.filter(p => !p.active).length;
  const totalKills = eliminations.length;

  // Figure out the current day from eliminations
  const days = eliminations.map(e => e.day).filter(Boolean);
  const dayNumbers = days.map(d => {
    const match = d.match(/\d+/);
    return match ? parseInt(match[0]) : 0;
  });
  const currentDay = dayNumbers.length > 0 ? Math.max(...dayNumbers) : 0;

  document.getElementById('stat-alive').textContent = alive;
  document.getElementById('stat-eliminated').textContent = eliminated;
  document.getElementById('stat-day').textContent = currentDay > 0 ? `DAY ${currentDay}` : 'PRE-GAME';
  document.getElementById('stat-kills').textContent = totalKills;
}

const LEADERBOARD_PAGE = 10;
let leaderboardShown = LEADERBOARD_PAGE;
let leaderboardData = [];

function renderPlayer(player, i) {
  const rank = i + 1;
  const isTop3 = rank <= 3;
  const isFirst = rank === 1;
  const isEliminated = !player.active;
  const statusClass = isEliminated ? ' leader-eliminated' : '';
  const topClass = isFirst ? ' leader-1' : (isTop3 ? ' leader-top3' : '');

  return `
    <div class="leader${topClass}${statusClass}">
      <div class="leader-info">
        <span class="leader-rank">#${rank}</span>
        <span class="leader-name">${escapeHtml(player.name)}${isEliminated ? ' <span class="leader-status">ELIMINATED</span>' : ''}</span>
      </div>
      <div class="leader-kills">${player.kills} kill${player.kills !== 1 ? 's' : ''}</div>
    </div>`;
}

function renderLeaderboard(data) {
  const container = document.getElementById('leaderboard-list');
  const leaderboard = data.leaderboard || [];
  const eliminations = sortEliminationsChronological(data.eliminations || []);

  // Build map: killer name → index of their first kill (lower = earlier)
  const firstKillIndex = {};
  eliminations.forEach((e, i) => {
    if (!(e.killer in firstKillIndex)) firstKillIndex[e.killer] = i;
  });

  leaderboardData = [...leaderboard]
    .filter(p => p.kills > 0 || p.active)
    .sort((a, b) => {
      // Primary: most kills first
      if (b.kills !== a.kills) return b.kills - a.kills;
      // Tiebreaker: who got their first kill earlier
      const aFirst = firstKillIndex[a.name] ?? Infinity;
      const bFirst = firstKillIndex[b.name] ?? Infinity;
      return aFirst - bFirst;
    });

  if (leaderboardData.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">⚔</div>
        <div class="empty-text">No eliminations yet. The hunt begins soon.</div>
      </div>`;
    return;
  }

  renderLeaderboardSlice();
}

function renderLeaderboardSlice() {
  const container = document.getElementById('leaderboard-list');
  const total = leaderboardData.length;
  const showing = Math.min(leaderboardShown, total);
  const visible = leaderboardData.slice(0, showing);

  let html = visible.map(renderPlayer).join('');

  if (showing < total) {
    const remaining = total - showing;
    html += `<div class="leader-btn-row">`;
    html += `<button class="leader-show-more" onclick="showMoreLeaderboard()">SHOW 10 MORE</button>`;
    html += `<button class="leader-show-all" onclick="showAllLeaderboard()">SHOW ALL ${total}</button>`;
    html += `</div>`;
  } else if (total > LEADERBOARD_PAGE) {
    html += `<button class="leader-show-all" onclick="collapseLeaderboard()">SHOW TOP 10</button>`;
  }

  container.innerHTML = html;
}

function showMoreLeaderboard() {
  leaderboardShown += LEADERBOARD_PAGE;
  renderLeaderboardSlice();
}

function showAllLeaderboard() {
  leaderboardShown = leaderboardData.length;
  renderLeaderboardSlice();
}

function collapseLeaderboard() {
  leaderboardShown = LEADERBOARD_PAGE;
  renderLeaderboardSlice();
  document.getElementById('standings').scrollIntoView({ behavior: 'smooth' });
}

const KILLFEED_PAGE = 10;
let killfeedShown = KILLFEED_PAGE;
let killfeedData = [];

function renderKillEntry(kill) {
  return `
    <div class="kill-entry">
      <div class="kill-time">${escapeHtml(kill.day || '')}</div>
      <div class="kill-detail">
        <span class="killer">${escapeHtml(kill.killer)}</span>
        <span class="kill-verb">eliminated</span>
        <span class="victim">${escapeHtml(kill.victim)}</span>
      </div>
    </div>`;
}

function renderKillFeed(data) {
  const container = document.getElementById('killfeed-list');
  const eliminations = data.eliminations || [];

  if (eliminations.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🔪</div>
        <div class="empty-text">No kills reported yet. Stay alert.</div>
      </div>`;
    return;
  }

  killfeedData = sortEliminationsChronological(eliminations).reverse();
  renderKillfeedSlice();
}

function renderKillfeedSlice() {
  const container = document.getElementById('killfeed-list');
  const total = killfeedData.length;
  const showing = Math.min(killfeedShown, total);
  const visible = killfeedData.slice(0, showing);

  let html = visible.map(renderKillEntry).join('');

  if (showing < total) {
    html += `<div class="leader-btn-row">`;
    html += `<button class="leader-show-more" onclick="showMoreKillfeed()">SHOW 10 MORE</button>`;
    html += `<button class="leader-show-all" onclick="showAllKillfeed()">SHOW ALL ${total}</button>`;
    html += `</div>`;
  } else if (total > KILLFEED_PAGE) {
    html += `<button class="leader-show-all" onclick="collapseKillfeed()">SHOW LATEST 10</button>`;
  }

  container.innerHTML = html;
}

function showMoreKillfeed() {
  killfeedShown += KILLFEED_PAGE;
  renderKillfeedSlice();
}

function showAllKillfeed() {
  killfeedShown = killfeedData.length;
  renderKillfeedSlice();
}

function collapseKillfeed() {
  killfeedShown = KILLFEED_PAGE;
  renderKillfeedSlice();
  document.getElementById('killfeed').scrollIntoView({ behavior: 'smooth' });
}

function renderLastUpdated(data) {
  const el = document.getElementById('last-updated');
  if (!el) return;

  if (data.lastUpdated) {
    const date = new Date(data.lastUpdated);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);

    let timeAgo;
    if (diffMins < 1) timeAgo = 'just now';
    else if (diffMins < 60) timeAgo = `${diffMins}m ago`;
    else if (diffMins < 1440) timeAgo = `${Math.floor(diffMins / 60)}h ago`;
    else timeAgo = date.toLocaleDateString();

    el.textContent = `Last updated: ${timeAgo}`;
  }
}

function renderAll(data) {
  renderStats(data);
  renderLeaderboard(data);
  renderKillFeed(data);
  renderLastUpdated(data);

  // Hide loading state, show content
  document.querySelectorAll('.loading-state').forEach(el => el.style.display = 'none');
  document.querySelectorAll('.loaded-content').forEach(el => el.style.display = '');
}

function showError() {
  document.querySelectorAll('.loading-state').forEach(el => {
    el.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">⚠</div>
        <div class="empty-text">Could not connect to game data. Retrying...</div>
      </div>`;
  });
}

// ========================================
// GAME SCHEDULE & INACTIVE STATE
// ========================================

// Demo mode: compresses each day into 10 seconds to preview transitions
// Set to false for production
const DEMO_MODE = false;
const DEMO_DAY_MS = 10000; // 10 seconds per simulated day

// Schedule: day of week (0=Sun) → { start: [h,m], end: [h,m] } or null (off)
const GAME_SCHEDULE = {
  0: null,                                    // Sunday — off
  1: { start: [8, 0],  end: [15, 15] },      // Monday
  2: { start: [8, 0],  end: [15, 15] },      // Tuesday
  3: { start: [9, 0],  end: [12, 0]  },      // Wednesday
  4: { start: [8, 0],  end: [15, 15] },      // Thursday
  5: { start: [8, 0],  end: [15, 15] },      // Friday
  6: { start: [9, 0],  end: [12, 0]  },      // Saturday
};

const DAY_NAMES = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

let demoStart = null;

function getDemoDate() {
  if (!demoStart) demoStart = Date.now();
  const elapsed = Date.now() - demoStart;
  const dayIndex = Math.floor(elapsed / DEMO_DAY_MS) % 7;
  const dayProgress = (elapsed % DEMO_DAY_MS) / DEMO_DAY_MS;

  const totalMinutes = Math.floor(dayProgress * 24 * 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  const date = new Date();
  // Shift to the correct day of the week
  const offset = dayIndex - date.getDay();
  date.setDate(date.getDate() + offset);
  date.setHours(hours, minutes, 0, 0);
  return date;
}

function isGameActive(date) {
  const schedule = GAME_SCHEDULE[date.getDay()];
  if (!schedule) return false;

  const current = date.getHours() * 60 + date.getMinutes();
  const start = schedule.start[0] * 60 + schedule.start[1];
  const end = schedule.end[0] * 60 + schedule.end[1];

  return current >= start && current < end;
}

function updateGameState() {
  const now = DEMO_MODE ? getDemoDate() : new Date();
  const active = isGameActive(now);

  document.body.classList.toggle('game-inactive', !active);

  const indicator = document.getElementById('game-status');
  if (indicator) {
    indicator.style.display = active ? 'none' : 'block';
  }

  // Update demo clock if present
  if (DEMO_MODE) {
    updateDemoClock(now, active);
  }
}

function updateDemoClock(date, active) {
  let clock = document.getElementById('demo-clock');
  if (!clock) {
    clock = document.createElement('div');
    clock.id = 'demo-clock';
    clock.className = 'demo-clock';
    document.body.appendChild(clock);
  }

  const h = date.getHours();
  const m = date.getMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  const timeStr = h12 + ':' + String(m).padStart(2, '0') + ' ' + ampm;

  clock.innerHTML =
    '<div class="demo-day">' + DAY_NAMES[date.getDay()] + '</div>' +
    '<div class="demo-time">' + timeStr + '</div>' +
    '<div class="demo-state ' + (active ? 'active' : 'inactive') + '">' +
    (active ? 'GAME ACTIVE' : 'GAME INACTIVE') + '</div>';
}

function startGameStateChecker() {
  updateGameState();
  if (DEMO_MODE) {
    // Update rapidly in demo mode for smooth time display
    setInterval(updateGameState, 100);
  } else {
    // Check every 60 seconds in production
    setInterval(updateGameState, 60000);
  }
}

// ========================================
// UTILITIES
// ========================================

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ========================================
// OFF-DAY NOTICE (reusable, for future use)
// ========================================
// Call showOffDay() in init() or from the browser console whenever the game
// needs to be paused (snow day, revisit day, etc.). Remove the call to resume.
//
// Example:
//   showOffDay("GAME PAUSED", "NO PARANOIA TODAY", "Snow day — game resumes tomorrow.");

function showOffDay(heading, message, reason) {
  // Remove any existing off-day elements so multiple calls don't stack
  document.querySelectorAll('.off-day-overlay, .off-day-strip').forEach(el => el.remove());

  // Sanitize inputs
  heading = escapeHtml(heading);
  message = escapeHtml(message);
  reason = escapeHtml(reason);

  // Popup overlay
  const overlay = document.createElement('div');
  overlay.className = 'off-day-overlay';
  overlay.innerHTML = `
    <div class="off-day-popup">
      <div class="off-day-icon">⚠</div>
      <h2 class="off-day-heading">${heading}</h2>
      <p class="off-day-message">${message}</p>
      <p class="off-day-reason">${reason}</p>
      <button class="off-day-close">GOT IT</button>
    </div>`;
  document.body.prepend(overlay);
  overlay.querySelector('.off-day-close').addEventListener('click', () => {
    overlay.remove();
  });

  // Banner strip below stats bar
  const strip = document.createElement('div');
  strip.className = 'off-day-strip';
  strip.textContent = `⚠ ${message} ⚠`;
  const lastUpdated = document.getElementById('last-updated');
  if (lastUpdated) {
    lastUpdated.parentNode.insertBefore(strip, lastUpdated);
  }
}

// ========================================
// INITIALIZATION
// ========================================

async function init() {
  // Start game active/inactive state checker
  startGameStateChecker();

  // Don't fetch if URL hasn't been set
  if (API_URL === 'PASTE_GAMEMASTER_URL_HERE') {
    console.log('API URL not configured — showing demo data');
    showDemoData();
    return;
  }

  const data = await fetchGameData();
  if (data) {
    renderAll(data);
  } else {
    showError();
  }

  // Auto-refresh
  setInterval(async () => {
    const freshData = await fetchGameData();
    if (freshData) renderAll(freshData);
  }, REFRESH_INTERVAL);
}

function showDemoData() {
  // Show a "not connected" banner instead of mock data
  document.getElementById('stat-alive').textContent = '—';
  document.getElementById('stat-eliminated').textContent = '—';
  document.getElementById('stat-day').textContent = 'SOON';
  document.getElementById('stat-kills').textContent = '—';

  document.getElementById('leaderboard-list').innerHTML = `
    <div class="empty-state">
      <div class="empty-icon">⏳</div>
      <div class="empty-text">Waiting for game data. The hunt begins Monday.</div>
    </div>`;

  document.getElementById('killfeed-list').innerHTML = `
    <div class="empty-state">
      <div class="empty-icon">🔪</div>
      <div class="empty-text">No kills yet. Check back when the game starts.</div>
    </div>`;
}

// Start when DOM is ready
document.addEventListener('DOMContentLoaded', init);
