// ========================================
// PARANOIA — Live Data Engine
// ========================================
// INSTRUCTIONS: Replace this URL with the gamemaster's Google Apps Script URL
// It should look like: https://script.google.com/macros/s/XXXXX/exec
const API_URL = 'PASTE_GAMEMASTER_URL_HERE';

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

function renderLeaderboard(data) {
  const container = document.getElementById('leaderboard-list');
  const leaderboard = data.leaderboard || [];

  // Sort by kills descending, then by name
  const sorted = [...leaderboard]
    .filter(p => p.kills > 0 || p.active)
    .sort((a, b) => b.kills - a.kills || a.name.localeCompare(b.name));

  if (sorted.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">⚔</div>
        <div class="empty-text">No eliminations yet. The hunt begins soon.</div>
      </div>`;
    return;
  }

  container.innerHTML = sorted.map((player, i) => {
    const rank = i + 1;
    const isFirst = rank === 1;
    const isEliminated = !player.active;
    const statusClass = isEliminated ? ' leader-eliminated' : '';

    return `
      <div class="leader${isFirst ? ' leader-1' : ''}${statusClass}">
        <div class="leader-info">
          <span class="leader-rank">#${rank}</span>
          <span class="leader-name">${escapeHtml(player.name)}${isEliminated ? ' <span class="leader-status">ELIMINATED</span>' : ''}</span>
        </div>
        <div class="leader-kills">${player.kills} kill${player.kills !== 1 ? 's' : ''}</div>
      </div>`;
  }).join('');
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

  // Show most recent first
  const reversed = [...eliminations].reverse();

  container.innerHTML = reversed.map(kill => {
    return `
      <div class="kill-entry">
        <div class="kill-time">${escapeHtml(kill.day || '')}</div>
        <div class="kill-detail">
          <span class="killer">${escapeHtml(kill.killer)}</span>
          <span class="kill-verb">eliminated</span>
          <span class="victim">${escapeHtml(kill.victim)}</span>
        </div>
      </div>`;
  }).join('');
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
// UTILITIES
// ========================================

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ========================================
// INITIALIZATION
// ========================================

async function init() {
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
