
// ═══════════════════════════════
//  API CONFIG
// ═══════════════════════════════
const API_URL = "https://monicore1.onrender.com";

function getToken() {
  return localStorage.getItem("token");
}

async function apiFetch(endpoint, method = "GET", body = null, isFormData = false) {
  const headers = { "Authorization": `Bearer ${getToken()}` };
  if (!isFormData) headers["Content-Type"] = "application/json";

  const options = { method, headers };
  if (body) options.body = isFormData ? body : JSON.stringify(body);

  const res = await fetch(API_URL + endpoint, options);
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.detail || `Request failed with status ${res.status}`);
  }

  return data;
}

let currentUser = null;

const concernTypes = ['Plumbing', 'Electrical', 'Noise Complaint', 'Elevator', 'Security', 'Cleanliness', 'Structural', 'Internet/Cable', 'Pest Control', 'Other'];

const roles = ['resident', 'admin', 'superadmin'];

const clusterLabel = { 
  C1: 'Cluster 1', C2: 'Cluster 2', C3: 'Cluster 3', C4: 'Cluster 4',
  charis: 'Cluster 1', ugie: 'Cluster 2', tali: 'Cluster 3', c2: 'Cluster 4'
};
function towerName(name) { return clusterLabel[name] || name; }


const navConfig = {
  resident: [
    { label: 'My Concerns', section: 'Main', icon: iconList, page: 'resident-track' },
    { label: 'Submit Concern', section: 'Main', icon: iconPlus, page: 'resident-submit' },
    { label: 'Announcements', section: 'Main', icon: iconBell, page: 'announcements' },
    { label: 'Change Password', section: 'Account', icon: iconKey, page: 'change-password' },
  ],
  admin: [
    { label: 'Dashboard', section: 'Main', icon: iconGrid, page: 'admin-dashboard' },
    { label: 'Manage Concerns', section: 'Concerns', icon: iconList, page: 'admin-concerns' },
    { label: 'Announcements', section: 'Concerns', icon: iconBell, page: 'announcements' },
    { label: 'User Management', section: 'Admin', icon: iconUsers, page: 'super-users' },
    { label: 'Reports', section: 'Reports', icon: iconChart, page: 'admin-reports' },
    { label: 'Change Password', section: 'Account', icon: iconKey, page: 'change-password' },
  ],
  superadmin: [
    { label: 'Dashboard', section: 'Main', icon: iconGrid, page: 'super-dashboard' },
    { label: 'All Concerns', section: 'Concerns', icon: iconList, page: 'admin-concerns' },
    { label: 'Announcements', section: 'Concerns', icon: iconBell, page: 'announcements' },
    { label: 'User Management', section: 'Admin', icon: iconUsers, page: 'super-users' },
    { label: 'Reports', section: 'Reports', icon: iconChart, page: 'super-reports' },
    { label: 'Change Password', section: 'Account', icon: iconKey, page: 'change-password' },
  ],
};

// ═══════════════════════════════
//  NOTIFICATIONS
// ═══════════════════════════════
let notifications = [];
let notifOpen = false;

function addNotification(message, type = 'info') {
  notifications.unshift({ message, type, time: new Date(), read: false });
  if (notifications.length > 20) notifications.pop();
  updateNotifBadge();
  toast(message, type);
}

function updateNotifBadge() {
  const unread = notifications.filter(n => !n.read).length;
  const badge = document.getElementById('notif-badge');
  if (badge) {
    badge.textContent = unread;
    badge.style.display = unread > 0 ? 'flex' : 'none';
  }
}

function toggleNotifPanel() {
  notifOpen = !notifOpen;
  const panel = document.getElementById('notif-panel');
  if (!panel) return;
  panel.style.display = notifOpen ? 'block' : 'none';
  if (notifOpen) {
    notifications.forEach(n => n.read = true);
    updateNotifBadge();
    renderNotifPanel();
  }
}

function renderNotifPanel() {
  const panel = document.getElementById('notif-panel');
  if (!panel) return;
  const items = notifications.length ? notifications.map(n => `
    <div style="padding:12px 16px;border-bottom:1px solid #eef0f7;display:flex;gap:10px;align-items:flex-start">
      <div style="width:8px;height:8px;border-radius:50%;margin-top:5px;flex-shrink:0;background:${n.type==='success'?'#22c55e':n.type==='error'?'#ef4444':'#4f8ef7'}"></div>
      <div>
        <div style="font-size:13px;color:#1a2035">${n.message}</div>
        <div style="font-size:11px;color:#8b95b0;margin-top:2px">${n.time.toLocaleTimeString()}</div>
      </div>
    </div>`).join('')
    : `<div style="padding:32px;text-align:center;color:#8b95b0;font-size:13px">No notifications yet</div>`;

  panel.innerHTML = `
    <div style="padding:14px 16px;border-bottom:1px solid #eef0f7;display:flex;justify-content:space-between;align-items:center">
      <div style="font-size:14px;font-weight:600;color:#1a2035">Notifications</div>
      <div style="font-size:11px;color:#4f8ef7;cursor:pointer" onclick="notifications=[];renderNotifPanel();updateNotifBadge()">Clear all</div>
    </div>
    <div style="max-height:320px;overflow-y:auto">${items}</div>`;
}

function initNotifButton() {
  const right = document.getElementById('topbar-right-global');
  if (!right) return;
  right.innerHTML = `
    <div style="position:relative;display:inline-block">
      <button onclick="toggleNotifPanel()" style="background:#f0f2f7;border:1px solid #d0d5e8;border-radius:8px;padding:7px 10px;cursor:pointer;display:flex;align-items:center;gap:6px;font-size:13px;color:#4a5270">
        ${iconBell()} Notifications
        <span id="notif-badge" style="display:none;background:#ef4444;color:#fff;border-radius:99px;font-size:10px;font-weight:700;padding:1px 6px;min-width:18px;text-align:center"></span>
      </button>
      <div id="notif-panel" style="display:none;position:absolute;right:0;top:calc(100% + 8px);width:320px;background:#fff;border:1px solid #e0e4f0;border-radius:10px;box-shadow:0 8px 24px rgba(0,0,0,0.12);z-index:999"></div>
    </div>`;
}

document.addEventListener('click', function(e) {
  const panel = document.getElementById('notif-panel');
  const btn = e.target.closest('[onclick="toggleNotifPanel()"]');
  if (!btn && panel && notifOpen) {
    notifOpen = false;
    panel.style.display = 'none';
  }
});

// ═══════════════════════════════
//  ICONS (inline SVG strings)
// ═══════════════════════════════
function iconGrid() { return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>`; }
function iconList() { return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>`; }
function iconPlus() { return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`; }
function iconUsers() { return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`; }
function iconChart() { return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`; }
function iconKey() { return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>`; }
function iconBell() { return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>`; }

// ═══════════════════════════════
//  AUTH
// ═══════════════════════════════
function showForgotPassword() {
  const card = document.querySelector('.login-card');
  const existing = document.getElementById('forgot-pw-form');
  if (existing) { existing.remove(); return; }

  const form = document.createElement('div');
  form.id = 'forgot-pw-form';
  form.style.cssText = 'margin-top:16px;background:rgba(79,142,247,0.1);border:1px solid rgba(79,142,247,0.2);border-radius:10px;padding:16px;';
  form.innerHTML = `
    <div style="color:#4f8ef7;font-weight:600;margin-bottom:8px;font-size:13px">Forgot Password?</div>
    <div style="font-size:12px;color:rgba(255,255,255,0.6);line-height:1.7">
      Please contact your <strong style="color:#fff">Superadmin</strong> to reset your password.<br>
      Your temporary password will be set to <strong style="color:#4f8ef7">Newtown@123</strong><br>
      Please change it immediately after logging in.
    </div>
    <button onclick="document.getElementById('forgot-pw-form').remove()"
      style="margin-top:12px;background:rgba(255,255,255,0.06);color:rgba(255,255,255,0.5);border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:8px 14px;font-size:12px;cursor:pointer;font-family:'DM Sans',sans-serif">
      Close
    </button>
  `;
  card.appendChild(form);
}

async function doLogin() {
  const email = document.getElementById('login-email').value;
  const pw = document.getElementById('login-pw').value;

  if (!email || !pw) { toast('Please fill in all fields', 'error'); return; }

  try {
    const data = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: pw })
    }).then(r => r.json());

    if (!data.access_token) { toast(data.message || 'Login failed', 'error'); return; }

    localStorage.setItem("token", data.access_token);

    const me = await apiFetch("/users/me");
    currentUser = {
      id: me.id,
      name: me.name,
      email: me.email,
      role: me.role,
      unit_id: me.unit_id
    };

    document.getElementById('login-page').style.display = 'none';
    const app = document.getElementById('app');
    app.classList.add('active');

    document.getElementById('sidebar-avatar').textContent = currentUser.name[0];
    document.getElementById('sidebar-name').textContent = currentUser.name;
    document.getElementById('sidebar-role').textContent = currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1);

    buildNav();
    const firstPage = navConfig[currentUser.role][0].page;
    navigate(firstPage);
    toast(`Welcome back, ${currentUser.name.split(' ')[0]}!`, 'success');

  } catch (err) {
    toast('Connection error. Is the server running?', 'error');
  }
}

function logout() {
  currentUser = null;
  localStorage.removeItem("token");
  document.getElementById('login-page').style.display = 'flex';
  document.getElementById('app').classList.remove('active');
}
// ═══════════════════════════════
//  NAVIGATION
// ═══════════════════════════════
function buildNav() {
  const nav = document.getElementById('sidebar-nav');
  nav.innerHTML = '';
  const items = navConfig[currentUser.role];
  const sections = {};
  items.forEach(item => {
    if (!sections[item.section]) sections[item.section] = [];
    sections[item.section].push(item);
  });

  for (const [sec, its] of Object.entries(sections)) {
    const div = document.createElement('div');
    div.className = 'nav-section';
    div.innerHTML = `<div class="nav-section-label">${sec}</div>`;
    its.forEach(item => {
      const el = document.createElement('div');
      el.className = 'nav-item';
      el.id = 'nav-' + item.page;
      el.innerHTML = item.icon() + item.label;
      el.onclick = () => navigate(item.page);
      div.appendChild(el);
    });
    nav.appendChild(div);
  }
}

let currentPage = '';
function navigate(page) {
  currentPage = page;
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
  const navEl = document.getElementById('nav-' + page);
  if (navEl) navEl.classList.add('active');

  const pages = {
    'resident-track': renderResidentTrack,
    'resident-submit': renderResidentSubmit,
    'admin-dashboard': renderAdminDashboard,
    'admin-concerns': renderAdminConcerns,
    'admin-reports': () => renderReports('admin'),
    'super-dashboard': renderSuperDashboard,
    'super-users': renderUserManagement,
    'super-reports': () => renderReports('super'),
    'announcements': renderAnnouncements,
    'change-password': renderChangePassword,
  };

  if (pages[page]) pages[page]();
}

// ═══════════════════════════════
//  HELPERS
// ═══════════════════════════════
function setPage(title, sub, rightHtml, bodyHtml) {
  document.getElementById('topbar-title').textContent = title;
  document.getElementById('topbar-sub').textContent = sub || '8 Newtown Blvd Condominium';
  document.getElementById('topbar-right').innerHTML = (rightHtml || '') + `<div id="topbar-right-global" style="display:inline-block"></div>`;
  document.getElementById('content-area').innerHTML = bodyHtml;
  initNotifButton();
}
function badgeHtml(status) {
  const map = { pending: 'pending', ongoing: 'ongoing', resolved: 'resolved', rejected: 'rejected' };
  return `<span class="badge ${map[status] || ''}">${status}</span>`;
}

function roleBadgeHtml(role) {
  return `<span class="badge role-${role}">${role}</span>`;
}

function priorityBadgeHtml(priority) {
  const map = {
    high: { color: '#ef4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.3)', label: 'High' },
    medium: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)', label: 'Medium' },
    low: { color: '#22c55e', bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.3)', label: 'Low' },
  };
  const p = map[priority] || map.low;
  return `<span style="background:${p.bg};color:${p.color};border:1px solid ${p.border};padding:2px 10px;border-radius:4px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em">${p.label}</span>`;
}

function getStats() {
  const all = concerns;
  return {
    total: all.length,
    pending: all.filter(c => c.status === 'pending').length,
    ongoing: all.filter(c => c.status === 'ongoing').length,
    resolved: all.filter(c => c.status === 'resolved').length,
    rejected: all.filter(c => c.status === 'rejected').length,
  };
}

function getUserName(id) {
  const u = users.find(u => u.id === id);
  return u ? u.name : 'Unknown';
}

function getUnit(id) {
  const u = users.find(u => u.id === id);
  return u ? u.unit : '—';
}

// ═══════════════════════════════
//  RESIDENT — TRACK
// ═══════════════════════════════
async function renderResidentTrack() {
  setPage('My Concerns', '', `<button class="btn btn-blue" onclick="navigate('resident-submit')">+ Submit New Concern</button>`, `<div style="padding:40px;text-align:center;color:var(--text3)">Loading...</div>`);

  try {
    const myConcerns = await apiFetch("/concerns/my");

    const stats = {
      total: myConcerns.length,
      pending: myConcerns.filter(c => c.status === 'pending').length,
      ongoing: myConcerns.filter(c => c.status === 'in_progress').length,
      resolved: myConcerns.filter(c => c.status === 'resolved').length,
    };

    const rows = myConcerns.length ? myConcerns.map(c => `
      <tr>
        <td><div class="concern-id">#${c.id}</div></td>
        <td><div class="concern-title">${c.title}</div></td>
        <td>${new Date(c.submitted_at).toLocaleDateString()}</td>
        <td>${badgeHtml(c.status)}</td>
        <td><button class="btn btn-ghost btn-sm" onclick="viewConcernDetail(${c.id})">View</button></td>
      </tr>`).join('')
      : `<tr><td colspan="5"><div class="empty-state"><div class="e-icon">•</div><div class="e-title">No concerns submitted yet</div>></div></td></tr>`;

    setPage('My Concerns', `Unit ID: ${currentUser.unit_id}`,
      `<button class="btn btn-blue" onclick="navigate('resident-submit')">+ Submit New Concern</button>`,
      `<div class="stats-grid" style="grid-template-columns:repeat(4,1fr)">
        <div class="stat-card primary"><div class="stat-label">Total</div><div class="stat-value">${stats.total}</div></div>
        <div class="stat-card yellow"><div class="stat-label">Pending</div><div class="stat-value">${stats.pending}</div></div>
        <div class="stat-card primary"><div class="stat-label">Ongoing</div><div class="stat-value">${stats.ongoing}</div></div>
        <div class="stat-card green"><div class="stat-label">Resolved</div><div class="stat-value">${stats.resolved}</div></div>
      </div>
      <div class="card">
        <div class="card-header"><div><div class="card-title">Submitted Concerns</div></div></div>
        <table><thead><tr><th>ID</th><th>Concern</th><th>Date</th><th>Status</th><th></th></tr></thead>
        <tbody>${rows}</tbody></table>
      </div>`);
  } catch (err) {
    toast('Failed to load concerns', 'error');
  }
}

// ═══════════════════════════════
//  RESIDENT — SUBMIT
// ═══════════════════════════════
async function renderResidentSubmit() {
  const me = await apiFetch("/users/me");
  const locationValue = me.unit && me.tower
    ? `${towerName(me.tower.name)} · Unit ${me.unit.unit_number} · Floor ${me.unit.floor}`
    : 'No unit assigned';

  const typeOpts = concernTypes.map(t => `<option>${t}</option>`).join('');
  const today = new Date().toISOString().split('T')[0];

  setPage('Submit a Concern', 'Describe your concern in detail',
    '',
    `<div class="form-card">
      <div class="card-title" style="margin-bottom:4px">New Concern</div>
      <div class="card-sub" style="margin-bottom:20px">Fill out all required fields. Your concern will be reviewed by the admin team.</div>
      <hr class="form-divider">
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Concern Type *</label>
          <select class="form-input" id="s-type"><option value="">Select type…</option>${typeOpts}</select>
        </div>
        <div class="form-group">
          <label class="form-label">Location</label>
          <input class="form-input" value="${locationValue}" readonly
            style="background:var(--surface2);color:var(--text3);cursor:not-allowed">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Title / Short Description *</label>
        <input class="form-input" id="s-title" placeholder="Brief summary of the concern">
      </div>
      <div class="form-group">
        <label class="form-label">Detailed Description *</label>
        <textarea class="form-input" id="s-desc" placeholder="Provide as much detail as possible…"></textarea>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Available Date for Fixing</label>
          <input class="form-input" id="s-avail-date" type="date" min="${today}" value="${today}">
          <div style="font-size:11px;color:var(--text3);margin-top:5px">When can maintenance visit your unit?</div>
        </div>
        <div class="form-group">
          <label class="form-label">Available Time</label>
          <select class="form-input" id="s-avail-time">
            <option value="">Any time</option>
            <option>Morning (8:00 AM – 12:00 PM)</option>
            <option>Afternoon (12:00 PM – 5:00 PM)</option>
            <option>Evening (5:00 PM – 8:00 PM)</option>
          </select>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Attach Photo <span style="color:var(--text3);font-weight:400;text-transform:none">(optional)</span></label>
        <div id="photo-drop-zone" onclick="document.getElementById('s-photo').click()"
          style="border:2px dashed var(--border2);border-radius:10px;padding:24px;text-align:center;cursor:pointer;transition:border-color 0.2s,background 0.2s;"
          ondragover="event.preventDefault();this.style.borderColor='var(--primary)';this.style.background='var(--primary-dim)'"
          ondragleave="this.style.borderColor='var(--border2)';this.style.background=''"
          ondrop="handlePhotoDrop(event)">
          <div id="photo-placeholder">
            <div style="font-size:24px;margin-bottom:6px;color:var(--primary);font-weight:700">•</div>
            <div style="font-size:13px;color:var(--text2);font-weight:500">Click to upload or drag &amp; drop</div>
            <div style="font-size:11px;color:var(--text3);margin-top:3px">JPG, PNG, WEBP — max 5MB</div>
          </div>
          <div id="photo-preview" style="display:none">
            <img id="photo-preview-img" style="max-width:100%;max-height:200px;border-radius:8px;object-fit:cover;" src="" alt="Preview">
            <div id="photo-preview-name" style="font-size:11px;color:var(--text3);margin-top:6px"></div>
            <button type="button" class="btn btn-ghost btn-sm" style="margin-top:8px" onclick="clearPhoto(event)">Remove</button>
          </div>
        </div>
        <input type="file" id="s-photo" accept="image/*" style="display:none" onchange="handlePhotoSelect(this)">
      </div>
      <div style="display:flex;gap:10px;margin-top:8px">
        <button class="btn btn-blue" onclick="submitConcern()">Submit Concern</button>
        <button class="btn btn-ghost" onclick="navigate('resident-track')">Cancel</button>
      </div>
    </div>`);
}

function handlePhotoSelect(input) {
  if (input.files && input.files[0]) readPhoto(input.files[0]);
}

function handlePhotoDrop(event) {
  event.preventDefault();
  document.getElementById('photo-drop-zone').style.borderColor = 'var(--border2)';
  document.getElementById('photo-drop-zone').style.background = '';
  const file = event.dataTransfer.files[0];
  if (file && file.type.startsWith('image/')) readPhoto(file);
  else toast('Please drop an image file', 'error');
}

function readPhoto(file) {
  if (file.size > 5 * 1024 * 1024) { toast('Image must be under 5MB', 'error'); return; }
  const reader = new FileReader();
  reader.onload = e => {
    document.getElementById('photo-placeholder').style.display = 'none';
    document.getElementById('photo-preview').style.display = 'block';
    document.getElementById('photo-preview-img').src = e.target.result;
    document.getElementById('photo-preview-name').textContent = file.name;
    window._photoData = e.target.result;
    window._photoName = file.name;
  };
  reader.readAsDataURL(file);
}

function clearPhoto(e) {
  e.stopPropagation();
  document.getElementById('photo-placeholder').style.display = 'block';
  document.getElementById('photo-preview').style.display = 'none';
  document.getElementById('s-photo').value = '';
  window._photoData = null;
  window._photoName = null;
}

async function submitConcern() {
  const type = document.getElementById('s-type').value;
  const title = document.getElementById('s-title').value.trim();
  const desc = document.getElementById('s-desc').value.trim();

  if (!type || !title || !desc) { toast('Please fill in all required fields', 'error'); return; }

  try {
    const formData = new FormData();
    formData.append("title", `[${type}] ${title}`);
    formData.append("description", desc);

    const photoInput = document.getElementById('s-photo');
    if (photoInput && photoInput.files[0]) formData.append("photo", photoInput.files[0]);

    const res = await fetch(`${API_URL}/concerns`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${getToken()}` },
      body: formData
    });

    const data = await res.json();

    if (data.id) {
      addNotification('New concern submitted successfully!', 'success');
      navigate('resident-track');
    } else {
      toast(data.detail || 'Failed to submit concern', 'error');
    }
  } catch (err) {
    console.error(err);
    toast('Connection error', 'error');
  }
}

// ═══════════════════════════════
//  VIEW CONCERN DETAIL (modal)
// ═══════════════════════════════
async function viewConcernDetail(id) {
  try {
    const c = await apiFetch(`/concerns/${id}`);
    if (!c || !c.id) { toast('Concern not found', 'error'); return; }

    const isAdmin = currentUser.role === 'admin' || currentUser.role === 'superadmin';
    const statusOpts = ['pending', 'in_progress', 'resolved', 'rejected']
      .map(s => `<option value="${s}" ${c.status === s ? 'selected' : ''}>${s.replace('_',' ')}</option>`).join('');

    const priorityLine = (isAdmin && c.priority)
      ? `<div class="detail-row"><span class="detail-label">Priority</span><span class="detail-value">${priorityBadgeHtml(c.priority)}</span></div>`
      : '';

    const unitLine = c.unit && c.tower
      ? `<div class="detail-row"><span class="detail-label">Location</span><span class="detail-value">${towerName(c.tower.name)} · Unit ${c.unit.unit_number} · Floor ${c.unit.floor}</span></div>`
      : '';

    const adminActions = isAdmin ? `
      <hr class="form-divider">
      <div class="form-group">
        <label class="form-label">Update Status</label>
        <select class="form-input" id="modal-status">${statusOpts}</select>
      </div>
      <div class="form-group">
        <label class="form-label">Remarks</label>
        <textarea class="form-input" id="modal-remarks" placeholder="Add remarks or update notes…" style="min-height:80px">${c.remarks || ''}</textarea>
      </div>` : 
      c.remarks ? `<hr class="form-divider"><div class="form-group"><label class="form-label">Remarks</label><div style="font-size:13px;color:var(--text2);line-height:1.6;padding:10px 12px;background:var(--surface2);border-radius:8px;border:1px solid var(--border)">${c.remarks}</div></div>` : '';

    const footer = isAdmin
      ? `<button class="btn btn-ghost" onclick="closeModal()">Close</button>
         <button class="btn btn-blue" onclick="updateConcern(${c.id})">Save Changes</button>`
      : `<button class="btn btn-ghost" onclick="closeModal()">Close</button>`;

    openModal(`
      <div class="modal-title">${c.title}</div>
      <div class="modal-sub">#${c.id} · Submitted by ${c.resident_name}</div>
      <div>
        <div class="detail-row"><span class="detail-label">Status</span><span class="detail-value">${badgeHtml(c.status)}</span></div>
        ${priorityLine}
        <div class="detail-row"><span class="detail-label">Date Submitted</span><span class="detail-value">${new Date(c.submitted_at).toLocaleString()}</span></div>
        ${unitLine}
        <div class="detail-row"><span class="detail-label">Description</span><span class="detail-value" style="line-height:1.6">${c.description}</span></div>
        ${c.photo_url ? `
        <div class="detail-row" style="flex-direction:column;gap:8px">
          <span class="detail-label">Attached Photo</span>
          <img src="${c.photo_url}"
              style="max-width:100%;max-height:220px;border-radius:8px;object-fit:cover;border:1px solid var(--border);cursor:pointer"
              onclick="window.open('${c.photo_url}','_blank')">
        </div>` : ''}
      </div>
      ${adminActions}
      <div class="modal-footer">${footer}</div>
    `);

  } catch (err) {
    toast('Failed to load concern details', 'error');
  }
}

async function updateConcern(id) {
  try {
    const status = document.getElementById('modal-status').value;
    const remarks = document.getElementById('modal-remarks').value;
    const data = await apiFetch(`/concerns/${id}?status=${status}&remarks=${encodeURIComponent(remarks)}`, "PUT");

    if (data.id) {
      closeModal();
      addNotification(`Concern #${id} status updated to ${document.getElementById('modal-status').value.replace('_',' ')}`, 'success');
      navigate(currentPage);
    } else {
      toast('Failed to update concern', 'error');
    }
  } catch (err) {
    toast('Connection error', 'error');
  }
}

// ═══════════════════════════════
//  ADMIN — DASHBOARD
// ═══════════════════════════════
async function renderAdminDashboard() {
  setPage('Dashboard', 'Overview of all concerns', '', `<div style="padding:40px;text-align:center;color:var(--text3)">Loading...</div>`);

  try {
    const dashboard = await apiFetch("/dashboard");
    const allConcerns = await apiFetch("/concerns");

    const s = {
      total: allConcerns.length,
      pending: allConcerns.filter(c => c.status === 'pending').length,
      ongoing: allConcerns.filter(c => c.status === 'in_progress').length,
      resolved: allConcerns.filter(c => c.status === 'resolved').length,
      rejected: allConcerns.filter(c => c.status === 'rejected').length,
    };

    const recentRows = allConcerns.slice(0, 5).map(c => `
      <tr>
        <td><span class="concern-id">#${c.id}</span></td>
        <td><div class="concern-title">${c.title}</div></td>
        <td>${badgeHtml(c.status)}</td>
        <td><button class="btn btn-ghost btn-sm" onclick="viewConcernDetail(${c.id})">Manage</button></td>
      </tr>`).join('') || `<tr><td colspan="4"><div class="empty-state">
      <div class="e-icon">•</div><div class="e-title">No concerns yet</div></td></tr>`;

    const clusterLabel = { 
        C1: 'Cluster 1', C2: 'Cluster 2', C3: 'Cluster 3', C4: 'Cluster 4',
        charis: 'Cluster 1', ugie: 'Cluster 2', tali: 'Cluster 3', c2: 'Cluster 4'
        };
        function towerName(name) { return clusterLabel[name] || name; }

    const towerCards = dashboard.map(tower => `
    <div class="stat-card">
        <div class="stat-label">${clusterLabel[tower.name] || tower.name}</div>
        <div class="stat-value" style="font-size:22px">${tower.units.length}</div>
        <div class="stat-sub">${tower.units.length} unit${tower.units.length !== 1 ? 's' : ''} · ${tower.status}</div>
    </div>`).join('');

    setPage('Dashboard', 'Overview of all concerns', '', `
      <div class="stats-grid">
        <div class="stat-card primary"><div class="stat-label">Total Concerns</div><div class="stat-value">${s.total}</div></div>
        <div class="stat-card yellow"><div class="stat-label">Pending</div><div class="stat-value">${s.pending}</div></div>
        <div class="stat-card primary"><div class="stat-label">Ongoing</div><div class="stat-value">${s.ongoing}</div></div>
        <div class="stat-card green"><div class="stat-label">Resolved</div><div class="stat-value">${s.resolved}</div></div>
      </div>

      <div class="two-col">
        <div class="card">
          <div class="card-header">
            <div><div class="card-title">Recent Concerns</div><div class="card-sub">Latest submissions</div></div>
            <button class="btn btn-ghost btn-sm" onclick="navigate('admin-concerns')">View All</button>
          </div>
          <table><thead><tr><th>ID</th><th>Concern</th><th>Status</th><th></th></tr></thead>
          <tbody>${recentRows}</tbody></table>
        </div>

        <div class="card">
          <div class="card-header"><div class="card-title">Towers Overview</div></div>
          <div style="padding:16px 20px;display:grid;gap:10px">${towerCards || '<div style="color:var(--text3);font-size:13px">No towers added yet</div>'}</div>
        </div>
      </div>`);

  } catch (err) {
    console.error(err);
    toast('Failed to load dashboard', 'error');
  }
}

// ═══════════════════════════════
//  ADMIN — MANAGE CONCERNS
// ═══════════════════════════════
async function renderAdminConcerns(filterStatus='', search='') {
  setPage('Manage Concerns', '', `<button class="btn btn-blue" onclick="exportCSV()">Export CSV</button>`, `<div style="padding:40px;text-align:center;color:var(--text3)">Loading...</div>`);

  try {
    let allConcerns = await apiFetch("/concerns");

    if (filterStatus) allConcerns = allConcerns.filter(c => c.status === filterStatus);
    if (search) {
      const q = search.toLowerCase();
      allConcerns = allConcerns.filter(c =>
        c.title.toLowerCase().includes(q) ||
        String(c.id).includes(q)
      );
    }

    const statusOpts = ['', 'pending', 'in_progress', 'resolved', 'rejected']
      .map(s => `<option value="${s}" ${filterStatus===s?'selected':''}>${s ? s.replace('_',' ') : 'All Status'}</option>`).join('');

    const rows = allConcerns.length ? allConcerns.map(c => {
  const type = c.title.includes(']') ? c.title.split(']')[0].replace('[','') : 'Other';
  const clusterUnit = c.tower && c.unit
    ? `${towerName(c.tower.name)} · Unit ${c.unit.unit_number}`
    : '—';
  return `
      <tr>
        <td><span class="concern-id">#${c.id}</span></td>
        <td><div class="concern-title">${c.title}</div></td>
        <td>${c.resident_name || '—'}</td>
        <td>${clusterUnit}</td>
        <td>${type}</td>
        <td>${badgeHtml(c.status)}</td>
        <td>${priorityBadgeHtml(c.priority)}</td>
        <td>${new Date(c.submitted_at).toLocaleDateString()}</td>
        <td>
          <div style="display:flex;gap:6px">
            <button class="btn btn-ghost btn-sm" onclick="viewConcernDetail(${c.id})">Manage</button>
            <button class="btn btn-sm" onclick="deleteConcernApi(${c.id})" style="background:rgba(239,68,68,0.08);color:#ef4444;border:1px solid rgba(239,68,68,0.3);border-radius:6px;padding:4px 10px;cursor:pointer;font-size:12px">Delete</button>
          </div>
        </td>
      </tr>`;}).join('')
      : `<tr><td colspan="9"><div class="empty-state"><div class="e-icon">•</div><div class="e-title">No concerns found</div></td></tr>`;
    setPage('Manage Concerns', `${allConcerns.length} concern${allConcerns.length !== 1 ? 's' : ''}`,
      `<button class="btn btn-ghost" onclick="clearResolvedConcerns()" style="color:#ef4444;border-color:rgba(239,68,68,0.3)">🗑 Clear Resolved</button>
       <button class="btn btn-blue" onclick="exportCSV()">Export CSV</button>`,
      `<div class="card">
        <div class="card-header">
          <div><div class="card-title">All Concerns</div></div>
          <div class="filters">
            <input class="search-input" id="concern-search" placeholder="Search…" value="${search}"
              oninput="renderAdminConcerns(document.getElementById('s-filter').value, this.value)">
            <select class="filter-select" id="s-filter"
              onchange="renderAdminConcerns(this.value, document.getElementById('concern-search').value)">
              ${statusOpts}
            </select>
          </div>
        </div>
        <table>
          <thead><tr><th>ID</th><th>Concern</th><th>Resident</th><th>Cluster · Unit</th><th>Type</th><th>Status</th><th>Priority</th><th>Date Submitted</th><th>Actions</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`);

  } catch (err) {
    console.error(err);
    toast('Failed to load concerns', 'error');
  }
}

async function deleteConcernApi(id) {
  if (!confirm(`Delete concern #${id}? This cannot be undone.`)) return;
  try {
    const data = await apiFetch(`/concerns/${id}`, 'DELETE');
    toast(`Concern #${id} deleted`, 'info');
    renderAdminConcerns();
  } catch (err) {
    toast(err.message || 'Failed to delete concern', 'error');
  }
}

async function clearResolvedConcerns() {
  if (!confirm('Delete ALL resolved concerns? This cannot be undone.')) return;
  try {
    const data = await apiFetch('/concerns/resolved/all', 'DELETE');
    if (data.message) {
      toast(data.message, 'success');
      renderAdminConcerns();
    } else {
      toast(data.detail || 'Failed to clear resolved concerns', 'error');
    }
  } catch (err) {
    toast('Connection error', 'error');
  }
}

async function exportCSV() {
  try {
    const allConcerns = await apiFetch("/concerns");
    const headers = ['ID', 'Title', 'Status', 'Date Submitted'];
    const rows = allConcerns.map(c => [
      c.id,
      `"${c.title}"`,
      c.status,
      new Date(c.submitted_at).toLocaleDateString()
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'monicore_concerns.csv';
    a.click();
    toast('CSV exported', 'success');
  } catch (err) {
    toast('Failed to export', 'error');
  }
}

// ═══════════════════════════════
//  REPORTS
// ═══════════════════════════════
async function renderReports() {
  setPage('Reports & Analytics', 'Performance overview', `<button class="btn btn-blue" onclick="exportCSV()">Export Data</button>`, `<div style="padding:40px;text-align:center;color:var(--text3)">Loading...</div>`);

  try {
    const allConcerns = await apiFetch("/concerns");

    const s = {
      total: allConcerns.length,
      pending: allConcerns.filter(c => c.status === 'pending').length,
      ongoing: allConcerns.filter(c => c.status === 'in_progress').length,
      resolved: allConcerns.filter(c => c.status === 'resolved').length,
      rejected: allConcerns.filter(c => c.status === 'rejected').length,
    };

    const resolutionRate = s.total > 0 ? Math.round((s.resolved / s.total) * 100) : 0;
    const pendingRate = s.total > 0 ? Math.round((s.pending / s.total) * 100) : 0;

    const typeBreakdown = {};
    allConcerns.forEach(c => {
      const type = c.title.includes(']') ? c.title.split(']')[0].replace('[','') : 'Other';
      typeBreakdown[type] = (typeBreakdown[type] || 0) + 1;
    });
    const sortedTypes = Object.entries(typeBreakdown).sort((a,b) => b[1]-a[1]);
    const maxType = Math.max(...sortedTypes.map(d => d[1]), 1);
    const typeBars = sortedTypes.map(([type, cnt]) => `
      <div class="cluster-row">
        <div class="cluster-name" style="width:120px">${type}</div>
        <div class="bar-track"><div class="bar-fill" style="width:${(cnt/maxType)*100}%"></div></div>
        <div class="cluster-count">${cnt}</div>
      </div>`).join('') || '<div style="color:var(--text3);padding:16px">No data yet</div>';

    setPage('Reports & Analytics', 'Performance overview',
      `<button class="btn btn-blue" onclick="exportCSV()">Export Data</button>`,
      `<div class="stats-grid">
        <div class="stat-card primary"><div class="stat-label">Total Concerns</div><div class="stat-value">${s.total}</div></div>
        <div class="stat-card green"><div class="stat-label">Resolution Rate</div><div class="stat-value">${resolutionRate}%</div></div>
        <div class="stat-card yellow"><div class="stat-label">Pending Rate</div><div class="stat-value">${pendingRate}%</div></div>
        <div class="stat-card red"><div class="stat-label">Rejected</div><div class="stat-value">${s.rejected}</div></div>
      </div>

      <div class="two-col">
        <div class="card">
          <div class="card-header"><div class="card-title">By Concern Type</div></div>
          <div class="cluster-bar-wrap">${typeBars}</div>
        </div>
        <div class="card">
          <div class="card-header"><div class="card-title">Status Breakdown</div></div>
          <div style="padding:20px">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
              <div style="background:var(--yellow-dim);border:1px solid rgba(245,158,11,0.2);border-radius:8px;padding:14px;text-align:center">
                <div style="font-size:24px;font-weight:700;color:var(--yellow);font-family:'DM Mono',monospace">${s.pending}</div>
                <div style="font-size:11px;color:var(--text3);text-transform:uppercase;letter-spacing:0.06em;margin-top:4px">Pending</div>
              </div>
              <div style="background:var(--primary-dim);border:1px solid rgba(79,142,247,0.2);border-radius:8px;padding:14px;text-align:center">
                <div style="font-size:24px;font-weight:700;color:var(--primary);font-family:'DM Mono',monospace">${s.ongoing}</div>
                <div style="font-size:11px;color:var(--text3);text-transform:uppercase;letter-spacing:0.06em;margin-top:4px">Ongoing</div>
              </div>
              <div style="background:var(--green-dim);border:1px solid rgba(34,197,94,0.2);border-radius:8px;padding:14px;text-align:center">
                <div style="font-size:24px;font-weight:700;color:var(--green);font-family:'DM Mono',monospace">${s.resolved}</div>
                <div style="font-size:11px;color:var(--text3);text-transform:uppercase;letter-spacing:0.06em;margin-top:4px">Resolved</div>
              </div>
              <div style="background:var(--red-dim);border:1px solid rgba(239,68,68,0.2);border-radius:8px;padding:14px;text-align:center">
                <div style="font-size:24px;font-weight:700;color:var(--red);font-family:'DM Mono',monospace">${s.rejected}</div>
                <div style="font-size:11px;color:var(--text3);text-transform:uppercase;letter-spacing:0.06em;margin-top:4px">Rejected</div>
              </div>
            </div>
          </div>
        </div>
      </div>`);

  } catch (err) {
    console.error(err);
    toast('Failed to load reports', 'error');
  }
}

// ═══════════════════════════════
//  SUPER — DASHBOARD
// ═══════════════════════════════
async function renderSuperDashboard() {
  setPage('System Overview', 'Superadmin Dashboard', '', `<div style="padding:40px;text-align:center;color:var(--text3)">Loading...</div>`);

  try {
    const dashboard = await apiFetch("/dashboard");
    const allConcerns = await apiFetch("/concerns");
    const allUsers = await apiFetch("/users");

    const s = {
      total: allConcerns.length,
      pending: allConcerns.filter(c => c.status === 'pending').length,
      resolved: allConcerns.filter(c => c.status === 'resolved').length,
    };

    const totalResidents = allUsers.filter(u => u.role === 'resident').length;
    const totalAdmins = allUsers.filter(u => u.role === 'admin').length;

    const recentRows = allConcerns.slice(0, 6).map(c => `
      <tr>
        <td><span class="concern-id">#${c.id}</span></td>
        <td><div class="concern-title">${c.title}</div></td>
        <td>${badgeHtml(c.status)}</td>
        <td><button class="btn btn-ghost btn-sm" onclick="viewConcernDetail(${c.id})">Manage</button></td>
      </tr>`).join('') || `<tr><td colspan="4"><div class="empty-state"><div class="e-icon">📋</div><div class="e-title">No concerns yet</div></div></td></tr>`;

    setPage('System Overview', 'Superadmin Dashboard', '', `
      <div class="stats-grid">
        <div class="stat-card primary"><div class="stat-label">Total Concerns</div><div class="stat-value">${s.total}</div></div>
        <div class="stat-card yellow"><div class="stat-label">Pending</div><div class="stat-value">${s.pending}</div></div>
        <div class="stat-card green"><div class="stat-label">Resolved</div><div class="stat-value">${s.resolved}</div></div>
        <div class="stat-card" style="border-color:rgba(168,85,247,0.3)">
          <div class="stat-label">Residents</div>
          <div class="stat-value" style="color:#a855f7">${totalResidents}</div>
          <div class="stat-sub">${totalAdmins} admins</div>
        </div>
      </div>

      <div class="two-col">
        <div class="card">
          <div class="card-header">
            <div><div class="card-title">Recent Concerns</div></div>
            <button class="btn btn-ghost btn-sm" onclick="navigate('admin-concerns')">View All</button>
          </div>
          <table><thead><tr><th>ID</th><th>Concern</th><th>Status</th><th></th></tr></thead>
          <tbody>${recentRows}</tbody></table>
        </div>
       <div class="card">
          <div class="card-header"><div class="card-title">Quick Actions</div></div>
          <div class="quick-action-grid">
            <div class="qa-item" onclick="navigate('admin-concerns')"><div class="qa-icon">•</div><div class="qa-title">Manage Concerns</div><div class="qa-sub">Review all submissions</div></div>
            <div class="qa-item" onclick="navigate('super-users')"><div class="qa-icon">•</div><div class="qa-title">User Management</div><div class="qa-sub">Add or edit users</div></div>
            <div class="qa-item" onclick="navigate('super-reports')"><div class="qa-icon">•</div><div class="qa-title">View Reports</div><div class="qa-sub">Analytics & data</div></div>
            <div class="qa-item" onclick="exportCSV()"><div class="qa-icon">•</div><div class="qa-title">Export Data</div><div class="qa-sub">Download CSV</div></div>
          </div>
        </div>
      </div>`);

  } catch (err) {
    console.error(err);
    toast('Failed to load dashboard', 'error');
  }
}
// ═══════════════════════════════
//  SUPER — USER MANAGEMENT
// ═══════════════════════════════
async function renderUserManagement(filterRole='', search='') {
  setPage('User Management', 'Manage system users and permissions',
    currentUser.role === 'superadmin' ? `<button class="btn btn-blue" onclick="addUserModal()">+ Add New User</button>` : '',
    `<div style="padding:40px;text-align:center;color:var(--text3)">Loading...</div>`);

  try {
    let allUsers = await apiFetch("/users");
    window._cachedUsers = allUsers;

    if (filterRole) allUsers = allUsers.filter(u => u.role === filterRole);
    if (search) {
      const q = search.toLowerCase();
      allUsers = allUsers.filter(u =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
      );
    }

    const roleOpts = ['', 'resident', 'admin', 'superadmin']
      .map(r => `<option value="${r}" ${filterRole===r?'selected':''}>${r ? r.charAt(0).toUpperCase()+r.slice(1) : 'All Roles'}</option>`).join('');

    const statusOpts = `
      <option value="">All Status</option>
      <option value="active">Active</option>
      <option value="inactive">Inactive</option>`;

    const rows = allUsers.length ? allUsers.map(u => {
      const clusterUnit = u.tower && u.unit
        ? `${towerName(u.tower.name)}-${u.unit.floor}${u.unit.unit_number}`
        : '—';
      const dateJoined = u.created_at ? new Date(u.created_at).toLocaleDateString('en-US', {year:'numeric',month:'short',day:'numeric'}) : '—';
      const isActive = u.is_active !== false;
      const statusBadge = isActive
        ? `<span style="background:rgba(34,197,94,0.1);color:#16a34a;border:1px solid rgba(34,197,94,0.3);padding:2px 10px;border-radius:4px;font-size:11px;font-weight:600">Active</span>`
        : `<span style="background:rgba(239,68,68,0.1);color:#dc2626;border:1px solid rgba(239,68,68,0.3);padding:2px 10px;border-radius:4px;font-size:11px;font-weight:600">Inactive</span>`;
      return `
      <tr>
        <td>${u.id}</td>
        <td><div style="font-weight:500;color:#1a2035">${u.name}</div></td>
        <td>${u.email}</td>
        <td>${roleBadgeHtml(u.role)}</td>
        <td>${clusterUnit}</td>
        <td>${statusBadge}</td>
        <td>${dateJoined}</td>
        <td>
          <button title="Actions" onclick="viewUserModal(${u.id})" style="background:#f0f2f7;border:1px solid #d0d5e8;border-radius:7px;padding:6px 8px;cursor:pointer;display:inline-flex;align-items:center;color:#4a5270;transition:all 0.15s" onmouseover="this.style.background='#e8ebf4'" onmouseout="this.style.background='#f0f2f7'">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></svg>
          </button>
        </td>

      </tr>`;
    }).join('')
    : `<tr><td colspan="8"><div class="empty-state"><div class="e-icon">•</div><div class="e-title">No users found</div></div></td></tr>`;

    setPage('User Management', 'Manage system users and permissions',
      currentUser.role === 'superadmin' ? `<button class="btn btn-blue" onclick="addUserModal()">+ Add New User</button>` : '',
      `<div class="card">
        <div class="card-header">
          <div><div class="card-title">All Users</div></div>
          <div class="filters">
            <input class="search-input" id="user-search" placeholder="Search by name, email, or unit…" value="${search}"
              oninput="renderUserManagement(document.getElementById('role-filter').value, this.value)">
            <select class="filter-select" id="role-filter"
              onchange="renderUserManagement(this.value, document.getElementById('user-search').value)">
              ${roleOpts}
            </select>
            <select class="filter-select" id="status-filter">${statusOpts}</select>
          </div>
        </div>
        <table>
          <thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Role</th><th>Cluster - Unit</th><th>Status</th><th>Date Joined</th><th>Actions</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
        <div style="padding:12px 20px;font-size:12px;color:#8b95b0;border-top:1px solid #eef0f7">
          Showing ${allUsers.length} of ${allUsers.length} users
        </div>
      </div>`);

  } catch (err) {
    console.error(err);
    toast('Failed to load users', 'error');
  }
}


function toggleUserStatus(id) {
  const u = users.find(x => x.id === id);
  if (!u) return;
  u.status = u.status === 'active' ? 'inactive' : 'active';
  toast(`${u.name} ${u.status === 'active' ? 'activated' : 'deactivated'}`, 'info');
  navigate(currentPage);
}

function editUser(id) {
  const u = users.find(x => x.id === id);
  if (!u) return;
  const roleOpts = roles.map(r => `<option value="${r}" ${u.role===r?'selected':''}>${r.charAt(0).toUpperCase()+r.slice(1)}</option>`).join('');
  const clusterOpts = clusters.map(cl => `<option value="${cl}" ${u.cluster===cl?'selected':''}>${cl}</option>`).join('');

  openModal(`
    <div class="modal-title">Edit User</div>
    <div class="modal-sub">${u.email}</div>
    <div class="form-group"><label class="form-label">Full Name</label><input class="form-input" id="eu-name" value="${u.name}"></div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Unit</label><input class="form-input" id="eu-unit" value="${u.unit}"></div>
      <div class="form-group"><label class="form-label">Cluster</label><select class="form-input" id="eu-cluster">${clusterOpts}</select></div>
    </div>
    <div class="form-group"><label class="form-label">Role</label><select class="form-input" id="eu-role">${roleOpts}</select></div>
    <div class="modal-footer">
      <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
      <button class="btn btn-blue" onclick="saveEditUser(${id})">Save</button>
    </div>`);
}

function saveEditUser(id) {
  const u = users.find(x => x.id === id);
  if (!u) return;
  u.name = document.getElementById('eu-name').value.trim() || u.name;
  u.unit = document.getElementById('eu-unit').value.trim() || u.unit;
  u.cluster = document.getElementById('eu-cluster').value;
  u.role = document.getElementById('eu-role').value;
  closeModal();
  toast(`User ${u.name} updated`, 'success');
  navigate(currentPage);
}

function addUserModal() {
  const roleOpts = ['resident', 'admin', 'superadmin']
    .map(r => `<option value="${r}">${r.charAt(0).toUpperCase()+r.slice(1)}</option>`).join('');

  const clusterOpts = ['C1', 'C2', 'C3', 'C4']
    .map(c => `<option value="${c}">${c}</option>`).join('');

  openModal(`
    <div class="modal-title">Add New User</div>
    <div class="modal-sub">Create a new user account</div>
    <div class="form-group">
      <label class="form-label">Full Name *</label>
      <input class="form-input" id="nu-name" placeholder="Full name">
    </div>
    <div class="form-group">
      <label class="form-label">Email *</label>
      <input class="form-input" id="nu-email" type="email" placeholder="email@newtown.com">
    </div>
    <div class="form-group">
      <label class="form-label">Password *</label>
      <input class="form-input" id="nu-password" type="password" placeholder="At least 8 characters">
    </div>
    <div class="form-group">
      <label class="form-label">Role *</label>
      <select class="form-input" id="nu-role" onchange="toggleUnitField(this.value)">${roleOpts}</select>
    </div>
    <div id="unit-field">
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Cluster *</label>
          <select class="form-input" id="nu-cluster">${clusterOpts}</select>
        </div>
        <div class="form-group">
          <label class="form-label">Floor *</label>
          <input class="form-input" id="nu-floor" type="number" placeholder="e.g. 6" min="1">
        </div>
        <div class="form-group">
          <label class="form-label">Unit *</label>
          <input class="form-input" id="nu-unit" placeholder="e.g. A, B, C">
        </div>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
      <button class="btn btn-blue" onclick="saveNewUser()">Add User</button>
    </div>`);

  toggleUnitField('resident');
}

async function loadUnitsDropdown() {
  try {
    const dashboard = await apiFetch("/dashboard");
    const select = document.getElementById('nu-unit-select');
    if (!select) return;

    select.innerHTML = '<option value="">-- Select a unit --</option>';

    dashboard.forEach(tower => {
      // Add a disabled group label per tower
      const group = document.createElement('optgroup');
      group.label = `🏢 ${towerName(tower.name)}`;

      tower.units.forEach(unit => {
        const option = document.createElement('option');
        option.value = unit.id;
        option.textContent = `Unit ${unit.unit_number} · Floor ${unit.floor}`;
        group.appendChild(option);
      });

      select.appendChild(group);
    });

  } catch (err) {
    console.error('Failed to load units', err);
    const select = document.getElementById('nu-unit-select');
    if (select) select.innerHTML = '<option value="">Failed to load units</option>';
  }
}

function toggleUnitField(role) {
  const unitField = document.getElementById('unit-field');
  if (role === 'resident') {
    unitField.style.display = 'block';
  } else {
    unitField.style.display = 'none';
  }
}

async function saveNewUser() {
  const name = document.getElementById('nu-name').value.trim();
  const email = document.getElementById('nu-email').value.trim();
  const password = document.getElementById('nu-password').value;
  const role = document.getElementById('nu-role').value;

  if (!name || !email || !password) { toast('Name, email and password are required', 'error'); return; }
  if (password.length < 8) { toast('Password must be at least 8 characters', 'error'); return; }

  try {
    let data;

    if (role === 'resident') {
      const cluster = document.getElementById('nu-cluster').value;
      const floor = document.getElementById('nu-floor').value.trim();
      const unit = document.getElementById('nu-unit').value.trim();

      if (!floor || !unit) { toast('Please fill in floor and unit', 'error'); return; }

      data = await apiFetch("/users/resident", "POST", {
        name, email, password,
        cluster, floor, unit
      });

    } else {
      data = await apiFetch("/users", "POST", { name, email, password, role, unit_id: null });
    }

    if (data.id) {
      closeModal();
      addNotification(`New user ${name} added successfully`, 'success');
      navigate(currentPage);
    } else {
      toast(data.detail || 'Failed to add user', 'error');
    }

  } catch (err) {
    toast('Connection error', 'error');
  }
}

async function resetUserPassword(id, name) {
  if (!confirm(`Reset password for "${name}"? Their new password will be: Newtown@123`)) return;

  try {
    const data = await apiFetch(`/users/${id}/reset-password`, "PUT");
    if (data.message === 'Password reset successfully') {
      toast(`Password for ${name} reset to Newtown@123`, 'success');
    } else {
      toast(data.detail || 'Failed to reset password', 'error');
    }
  } catch (err) {
    toast('Connection error', 'error');
  }
}

async function deleteUser(id, name) {
  if (!confirm(`Remove user "${name}"? This cannot be undone.`)) return;

  try {
    const data = await apiFetch(`/users/${id}`, "DELETE");
    if (data.message === 'User deleted successfully') {
      addNotification(`User ${name} has been removed`, 'info');
      navigate(currentPage);
    } else {
      toast(data.detail || 'Failed to remove user', 'error');
    }
  } catch (err) {
    toast('Connection error', 'error');
  }
}

function viewUserModal(id) {
  const u = (window._cachedUsers || []).find(x => x.id === id);
  if (!u || !u.id) { toast('User not found', 'error'); return; }

  const clusterUnit = u.tower && u.unit
    ? `${towerName(u.tower.name)} · Floor ${u.unit.floor} · Unit ${u.unit.unit_number}`
    : '—';
  const dateJoined = u.created_at
    ? new Date(u.created_at).toLocaleDateString('en-US', {year:'numeric', month:'long', day:'numeric'})
    : '—';
  const isActive = u.is_active !== false;

  openModal(`
    <div class="modal-title">User Details</div>
    <div class="modal-sub">ID #${u.id}</div>
    <div style="display:flex;align-items:center;gap:14px;margin-bottom:20px;padding:16px;background:#f8f9fc;border-radius:10px;border:1px solid #e0e4f0">
      <div style="width:48px;height:48px;border-radius:50%;background:var(--primary-dim);border:2px solid var(--primary);display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:700;color:var(--primary);flex-shrink:0">${u.name[0].toUpperCase()}</div>
      <div>
        <div style="font-size:15px;font-weight:700;color:#1a2035">${u.name}</div>
        <div style="font-size:12px;color:#8b95b0;margin-top:2px">${u.email}</div>
      </div>
      <div style="margin-left:auto">${roleBadgeHtml(u.role)}</div>
    </div>
    <div class="detail-row"><span class="detail-label">Status</span><span class="detail-value">${isActive
      ? '<span style="background:rgba(34,197,94,0.1);color:#16a34a;border:1px solid rgba(34,197,94,0.3);padding:2px 10px;border-radius:4px;font-size:11px;font-weight:600">Active</span>'
      : '<span style="background:rgba(239,68,68,0.1);color:#dc2626;border:1px solid rgba(239,68,68,0.3);padding:2px 10px;border-radius:4px;font-size:11px;font-weight:600">Inactive</span>'
    }</span></div>
    <div class="detail-row"><span class="detail-label">Unit</span><span class="detail-value">${clusterUnit}</span></div>
    <div class="detail-row"><span class="detail-label">Date Joined</span><span class="detail-value">${dateJoined}</span></div>
    <div class="modal-footer">
      <button class="btn btn-ghost" onclick="closeModal()">Close</button>
      ${currentUser.role === 'superadmin' ? `
      <button class="btn btn-ghost" onclick="closeModal();resetUserPassword(${u.id},'${u.name}')">Reset PW</button>
      <button class="btn btn-yellow" onclick="closeModal();toggleUserStatusApi(${u.id},'${u.name}',${isActive})">
        ${isActive ? 'Deactivate' : 'Activate'}
      </button>
      <button class="btn btn-red" onclick="closeModal();deleteUser(${u.id},'${u.name}')">Remove</button>
      ` : ''}
    </div>
  `);
}

async function toggleUserStatusApi(id, name, currentlyActive) {
  if (!confirm(`${currentlyActive ? 'Deactivate' : 'Activate'} user "${name}"?`)) return;
  try {
    const data = await apiFetch(`/users/${id}/toggle-status`, 'PUT');
    if (data && data.message === 'Status updated') {
      addNotification(`${name} has been ${data.is_active ? 'activated' : 'deactivated'}`, data.is_active ? 'success' : 'info');
      renderUserManagement();
    } else {
      toast(data.detail || 'Failed to update status', 'error');
    }
  } catch (err) {
    toast('Connection error', 'error');
  }
}

// ═══════════════════════════════
//  CHANGE PASSWORD
// ═══════════════════════════════
function renderChangePassword() {
  setPage('Change Password', 'Update your account password', '', `
    <div class="form-card">
      <div style="display:flex;align-items:center;gap:14px;margin-bottom:20px">
        <div style="width:48px;height:48px;background:var(--primary-dim);border:1px solid rgba(79,142,247,0.3);border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:700;color:var(--primary)">•</div>
        <div>
          <div class="card-title">Change Password</div>
          <div class="card-sub">Signed in as <strong style="color:var(--text2)">${currentUser.email}</strong></div>
        </div>
      </div>
      <hr class="form-divider">
      <div class="form-group">
        <label class="form-label">Current Password *</label>
        <div style="position:relative">
          <input class="form-input" id="cp-current" type="password" placeholder="Enter your current password" style="padding-right:40px">
          <span onclick="togglePwVis('cp-current',this)" style="position:absolute;right:12px;top:50%;transform:translateY(-50%);cursor:pointer;color:var(--text3);font-size:13px;user-select:none">👁</span>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">New Password *</label>
        <div style="position:relative">
          <input class="form-input" id="cp-new" type="password" placeholder="At least 8 characters" style="padding-right:40px" oninput="checkPwStrength(this.value)">
          <span onclick="togglePwVis('cp-new',this)" style="position:absolute;right:12px;top:50%;transform:translateY(-50%);cursor:pointer;color:var(--text3);font-size:13px;user-select:none">👁</span>
        </div>
        <div id="pw-strength-bar" style="margin-top:8px;display:none">
          <div style="height:4px;border-radius:99px;background:var(--surface3);overflow:hidden">
            <div id="pw-strength-fill" style="height:100%;border-radius:99px;width:0%;transition:width 0.3s,background 0.3s"></div>
          </div>
          <div id="pw-strength-label" style="font-size:11px;color:var(--text3);margin-top:4px"></div>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Confirm New Password *</label>
        <div style="position:relative">
          <input class="form-input" id="cp-confirm" type="password" placeholder="Re-enter new password" style="padding-right:40px">
          <span onclick="togglePwVis('cp-confirm',this)" style="position:absolute;right:12px;top:50%;transform:translateY(-50%);cursor:pointer;color:var(--text3);font-size:13px;user-select:none">👁</span>
        </div>
      </div>
      <div style="display:flex;gap:10px;margin-top:8px">
        <button class="btn btn-blue" onclick="saveNewPassword()">Update Password</button>
        <button class="btn btn-ghost" onclick="history.go(-1) || navigate(navConfig[currentUser.role][0].page)">Cancel</button>
      </div>
    </div>
  `);
}

function togglePwVis(inputId, icon) {
  const inp = document.getElementById(inputId);
  if (inp.type === 'password') { inp.type = 'text'; icon.textContent = '🙈'; }
  else { inp.type = 'password'; icon.textContent = '👁'; }
}

function checkPwStrength(pw) {
  const bar = document.getElementById('pw-strength-bar');
  const fill = document.getElementById('pw-strength-fill');
  const label = document.getElementById('pw-strength-label');
  if (!pw) { bar.style.display = 'none'; return; }
  bar.style.display = 'block';
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const levels = [
    { pct: '20%', color: '#ef4444', text: 'Very weak' },
    { pct: '40%', color: '#f97316', text: 'Weak' },
    { pct: '60%', color: '#f59e0b', text: 'Fair' },
    { pct: '80%', color: '#22c55e', text: 'Strong' },
    { pct: '100%', color: '#4f8ef7', text: 'Very strong' },
  ];
  const lvl = levels[Math.min(score - 1, 4)] || levels[0];
  fill.style.width = lvl.pct;
  fill.style.background = lvl.color;
  label.textContent = lvl.text;
  label.style.color = lvl.color;
}

async function saveNewPassword() {
  const current = document.getElementById('cp-current').value;
  const newPw = document.getElementById('cp-new').value;
  const confirm = document.getElementById('cp-confirm').value;

  if (!current || !newPw || !confirm) { toast('Please fill in all fields', 'error'); return; }
  if (newPw.length < 8) { toast('New password must be at least 8 characters', 'error'); return; }
  if (newPw !== confirm) { toast('New passwords do not match', 'error'); return; }

  try {
    const data = await apiFetch("/users/change-password", "PUT", {
      old_password: current,
      new_password: newPw
    });

    if (data.message === 'Password changed successfully') {
      toast('Password updated successfully!', 'success');
      ['cp-current','cp-new','cp-confirm'].forEach(id => { const el = document.getElementById(id); if(el) el.value = ''; });
      document.getElementById('pw-strength-bar').style.display = 'none';
    } else {
      toast(data.detail || 'Failed to update password', 'error');
    }
  } catch (err) {
    toast('Connection error', 'error');
  }
}

// ═══════════════════════════════
//  MODAL
// ═══════════════════════════════
function openModal(html) {
  document.getElementById('modal-content').innerHTML = html;
  document.getElementById('modal-overlay').classList.add('active');
}

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('active');
}

document.getElementById('modal-overlay').addEventListener('click', function(e) {
  if (e.target === this) closeModal();
});

// ═══════════════════════════════
//  TOAST
// ═══════════════════════════════
function toast(msg, type = 'info') {
  const container = document.getElementById('toast-container');
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = msg;
  container.appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity 0.3s'; setTimeout(() => el.remove(), 300); }, 3000);
}

// ═══════════════════════════════
//  AUTO LOGIN ON REFRESH
// ═══════════════════════════════
async function renderAnnouncements() {
  const isAdmin = currentUser.role === 'admin' || currentUser.role === 'superadmin';
  setPage('Announcements', 'Community notices and updates',
    isAdmin ? `<button class="btn btn-blue" onclick="postAnnouncementModal()">+ Post Announcement</button>` : '',
    `<div style="padding:40px;text-align:center;color:var(--text3)">Loading...</div>`);

  try {
    const announcements = await apiFetch("/announcements");

    const cards = announcements.length ? announcements.map(a => `
      <div class="card" style="margin-bottom:12px">
        <div class="card-header">
          <div>
            <div class="card-title">${a.title}</div>
            <div class="card-sub">Posted by ${a.posted_by} · ${new Date(a.created_at).toLocaleDateString('en-US', {year:'numeric',month:'short',day:'numeric'})}</div>
          </div>
          ${isAdmin ? `<button class="btn btn-red btn-sm" onclick="deleteAnnouncement(${a.id})">Delete</button>` : ''}
        </div>
        <div style="padding:0 20px 16px;font-size:13px;color:var(--text2);line-height:1.7">${a.content}</div>
      </div>`).join('')
    : `<div class="card"><div style="padding:40px;text-align:center;color:var(--text3)">No announcements yet</div></div>`;

    setPage('Announcements', 'Community notices and updates',
      isAdmin ? `<button class="btn btn-blue" onclick="postAnnouncementModal()">+ Post Announcement</button>` : '',
      cards);

  } catch (err) {
    toast('Failed to load announcements', 'error');
  }
}
// Step 1.1: Add this function to the bottom of app.js
async function deleteUserApi(id) {
  if (!confirm(`Are you sure you want to delete user #${id}? This action cannot be undone.`)) return;
  try {
    const data = await apiFetch(`/users/${id}`, 'DELETE');
    if (data.message) {
      toast(`User #${id} successfully deleted`, 'info');
      renderUserManagement(); // Automatically refreshes the UI list view
    } else {
      toast(data.detail || 'Failed to delete user', 'error');
    }
  } catch (err) {
    toast('Connection error', 'error');
  }
}

function postAnnouncementModal() {
  openModal(`
    <div class="modal-title">Post Announcement</div>
    <div class="modal-sub">This will be visible to all residents</div>
    <div class="form-group">
      <label class="form-label">Title *</label>
      <input class="form-input" id="ann-title" placeholder="Announcement title">
    </div>
    <div class="form-group">
      <label class="form-label">Content *</label>
      <textarea class="form-input" id="ann-content" placeholder="Write your announcement here…" style="min-height:100px"></textarea>
    </div>
    <div class="modal-footer">
      <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
      <button class="btn btn-blue" onclick="saveAnnouncement()">Post</button>
    </div>`);
}

async function saveAnnouncement() {
  const title = document.getElementById('ann-title').value.trim();
  const content = document.getElementById('ann-content').value.trim();
  if (!title || !content) { toast('Please fill in all fields', 'error'); return; }

  try {
    const data = await apiFetch(`/announcements?title=${encodeURIComponent(title)}&content=${encodeURIComponent(content)}`, 'POST');
    if (data.id) {
      closeModal();
      addNotification('Announcement posted!', 'success');
      renderAnnouncements();
    } else {
      toast(data.detail || 'Failed to post', 'error');
    }
  } catch (err) {
    toast('Connection error', 'error');
  }
}

async function deleteAnnouncement(id) {
  if (!confirm('Delete this announcement?')) return;
  try {
    const data = await apiFetch(`/announcements/${id}`, 'DELETE');
    if (data.message === 'Announcement deleted') {
      toast('Announcement deleted', 'info');
      renderAnnouncements();
    } else {
      toast('Failed to delete', 'error');
    }
  } catch (err) {
    toast('Connection error', 'error');
  }
}

async function autoLogin() {
  const token = getToken();
  if (!token) return;

  try {
    const me = await apiFetch("/users/me");
    if (!me || !me.id) { logout(); return; }

    currentUser = {
      id: me.id,
      name: me.name,
      email: me.email,
      role: me.role,
      unit_id: me.unit_id
    };

    document.getElementById('login-page').style.display = 'none';
    const app = document.getElementById('app');
    app.classList.add('active');

    document.getElementById('sidebar-avatar').textContent = currentUser.name[0];
    document.getElementById('sidebar-name').textContent = currentUser.name;
    document.getElementById('sidebar-role').textContent = currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1);

    buildNav();
    const firstPage = navConfig[currentUser.role][0].page;
    navigate(firstPage);

  } catch (err) {
    logout();
  }
}

autoLogin();
