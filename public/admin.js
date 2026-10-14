/**
 * Web Profile Admin Dashboard Script
 * Manages Projects, Profile/Bio, and Contact Messages
 */

let adminToken = sessionStorage.getItem('adminToken') || '';
let loadedProjects = [];

document.addEventListener('DOMContentLoaded', () => {
  initThemeToggle();
  initRetroMusicPlayer();
  initAuth();
  setupTabs();
  setupProjectModal();
  setupProfileForm();
  setupSkillsLivePreview();
});

// ==========================================================================
// AUTHENTICATION
// ==========================================================================
function initAuth() {
  const overlay = document.getElementById('loginOverlay');
  const app = document.getElementById('adminApp');
  const loginForm = document.getElementById('loginForm');
  const logoutBtn = document.getElementById('btnLogout');
  const errorMsg = document.getElementById('loginErrorMsg');

  if (adminToken) {
    overlay.style.display = 'none';
    app.style.display = 'block';
    loadDashboardData();
  } else {
    overlay.style.display = 'flex';
    app.style.display = 'none';
  }

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const password = document.getElementById('adminPassInput').value;
    const submitBtn = document.getElementById('btnLoginSubmit');

    submitBtn.disabled = true;
    submitBtn.textContent = 'กำลังตรวจสอบ...';
    errorMsg.style.display = 'none';

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      const data = await res.json();

      if (data.success && data.token) {
        adminToken = data.token;
        sessionStorage.setItem('adminToken', adminToken);
        overlay.style.display = 'none';
        app.style.display = 'block';
        showToast('เข้าสู่ระบบสำเร็จ ยินดีต้อนรับครับ');
        loadDashboardData();
      } else {
        errorMsg.textContent = data.error || 'รหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง';
        errorMsg.style.display = 'block';
      }
    } catch (err) {
      errorMsg.textContent = `ไม่สามารถเชื่อมต่อระบบได้: ${err.message}`;
      errorMsg.style.display = 'block';
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'เข้าสู่ระบบจัดการ';
    }
  });

  logoutBtn.addEventListener('click', () => {
    sessionStorage.removeItem('adminToken');
    adminToken = '';
    overlay.style.display = 'flex';
    app.style.display = 'none';
    document.getElementById('adminPassInput').value = '';
    showToast('ออกจากระบบเรียบร้อยแล้ว');
  });
}

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getAuthHeaders() {
  const token = adminToken || sessionStorage.getItem('adminToken') || '';
  return {
    'Content-Type': 'application/json',
    'x-admin-token': token
  };
}

function loadDashboardData() {
  fetchAdminProjects();
  fetchAdminProfile();
  fetchAdminContacts();
}

// ==========================================================================
// TABS NAVIGATION
// ==========================================================================
function setupTabs() {
  const tabs = document.querySelectorAll('.admin-tab-item');
  const contents = document.querySelectorAll('.admin-tab-content');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetId = tab.getAttribute('data-tab');
      tabs.forEach(t => t.classList.remove('active'));
      contents.forEach(c => c.classList.remove('active'));

      tab.classList.add('active');
      const targetContent = document.getElementById(targetId);
      if (targetContent) targetContent.classList.add('active');

      if (targetId === 'tabContacts') {
        fetchAdminContacts();
      }
    });
  });
}

// ==========================================================================
// PROJECTS MANAGEMENT
// ==========================================================================
async function fetchAdminProjects() {
  const container = document.getElementById('projectsListContainer');
  const counter = document.getElementById('projectsCountBadge');

  try {
    const res = await fetch(`/api/projects?_t=${Date.now()}`, { cache: 'no-store' });
    const json = await res.json();
    if (json.success && Array.isArray(json.data)) {
      loadedProjects = json.data;
      counter.textContent = loadedProjects.length;
      renderAdminProjects(loadedProjects);
    } else {
      container.innerHTML = `<div class="loading-state-card">${json.error || 'ไม่พบรายการผลงานในระบบ'}</div>`;
    }
  } catch (err) {
    container.innerHTML = `<div class="loading-state-card">ไม่สามารถโหลดรายการผลงานได้: ${err.message}</div>`;
  }
}

function renderAdminProjects(projects) {
  const container = document.getElementById('projectsListContainer');
  if (!container) return;

  if (projects.length === 0) {
    container.innerHTML = `<div class="loading-state-card">ยังไม่มีผลงานในระบบ กดปุ่ม "เพิ่มผลงานใหม่" เพื่อเริ่มต้น</div>`;
    return;
  }

  container.innerHTML = projects.map(item => {
    const id = escapeHtml(item.id || '');
    const title = escapeHtml(item.title || '');
    const type = escapeHtml(item.type || '');
    const order = escapeHtml(item.order || 1);
    const categoryTag = escapeHtml(item.categoryTag || item.type || '');
    const figmaHeader = escapeHtml(item.figmaHeader || '');
    const summary = escapeHtml(item.summary || 'ไม่มีคำอธิบาย');
    const imageUrl = escapeHtml(item.imageUrl || '/assets/project_figma_clock.png');

    return `
      <div class="project-admin-card" data-id="${id}">
        <div class="proj-admin-thumb-box">
          <img src="${imageUrl}" alt="${title}" class="proj-admin-thumb-img">
          <span class="proj-admin-type-pill">${type}</span>
          <span class="proj-admin-order-badge">ลำดับ: ${order}</span>
        </div>

        <div class="proj-admin-body">
          <div class="proj-admin-meta">${categoryTag}${figmaHeader ? ' • ' + figmaHeader : ''}</div>
          <h3 class="proj-admin-title">${title}</h3>
          <p class="proj-admin-desc">${summary}</p>

          <div class="proj-admin-card-actions">
            <button type="button" class="btn-card-edit" data-id="${id}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
              <span>แก้ไข</span>
            </button>
            <button type="button" class="btn-card-delete" data-id="${id}" data-title="${title}">
              ลบ
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  container.querySelectorAll('.btn-card-edit').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      if (id) openEditProjectModal(id);
    });
  });

  container.querySelectorAll('.btn-card-delete').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const title = btn.getAttribute('data-title');
      if (id) deleteProject(id, title);
    });
  });
}

function setupProjectModal() {
  const modal = document.getElementById('projectModal');
  const btnOpen = document.getElementById('btnOpenAddProjectModal');
  const btnClose = document.getElementById('btnCloseProjectModal');
  const btnCancel = document.getElementById('btnCancelProjectModal');
  const form = document.getElementById('projectForm');

  btnOpen.addEventListener('click', () => {
    document.getElementById('modalProjectTitle').textContent = 'เพิ่มผลงานใหม่';
    form.reset();
    document.getElementById('projId').value = '';
    document.getElementById('projOrder').value = loadedProjects.length + 1;
    modal.classList.add('active');
  });

  const closeModal = () => {
    modal.classList.remove('active');
    const dialog = modal.querySelector('.project-modal-dialog');
    if (dialog) dialog.classList.remove('modal-static-bounce');
  };
  btnClose.addEventListener('click', closeModal);
  btnCancel.addEventListener('click', closeModal);

  // Prevent closing when clicking outside the modal box (protects unsaved typing)
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      const dialog = modal.querySelector('.project-modal-dialog');
      if (dialog) {
        dialog.classList.remove('modal-static-bounce');
        void dialog.offsetWidth; // Trigger reflow for re-animation
        dialog.classList.add('modal-static-bounce');
      }
    }
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('projId').value;
    const saveBtn = document.getElementById('btnSaveProject');
    saveBtn.disabled = true;
    saveBtn.textContent = 'กำลังบันทึก...';

    const payload = {
      title: document.getElementById('projTitle').value,
      type: document.getElementById('projType').value,
      categoryTag: document.getElementById('projCategoryTag').value,
      figmaHeader: document.getElementById('projFigmaHeader').value,
      imageUrl: document.getElementById('projImageUrl').value,
      order: parseInt(document.getElementById('projOrder').value, 10) || 1,
      link: document.getElementById('projLink').value,
      linkText: document.getElementById('projLinkText').value,
      summary: document.getElementById('projSummary').value
    };

    try {
      const url = id ? `/api/admin/projects/${id}` : '/api/admin/projects';
      const method = id ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.success) {
        showToast(data.message || 'บันทึกข้อมูลเรียบร้อยแล้ว');
        closeModal();
        if (data.data && data.data.id) {
          const idx = loadedProjects.findIndex(p => p.id === data.data.id || String(p._id) === String(data.data.id));
          if (idx !== -1) {
            loadedProjects[idx] = { ...loadedProjects[idx], ...data.data };
            renderAdminProjects(loadedProjects);
          }
        }
        await fetchAdminProjects();
      } else {
        alert(data.error || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
      }
    } catch (err) {
      alert(`ไม่สามารถเชื่อมต่อได้: ${err.message}`);
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = 'บันทึกข้อมูลผลงาน';
    }
  });
}

window.openEditProjectModal = function(id) {
  const item = loadedProjects.find(p => p.id === id || String(p._id) === String(id));
  if (!item) return;

  const modal = document.getElementById('projectModal');
  document.getElementById('modalProjectTitle').textContent = 'แก้ไขผลงาน';
  document.getElementById('projId').value = item.id || item._id;
  document.getElementById('projTitle').value = item.title || '';
  document.getElementById('projType').value = item.type || 'Figma';
  document.getElementById('projCategoryTag').value = item.categoryTag || '';
  document.getElementById('projFigmaHeader').value = item.figmaHeader || '';
  document.getElementById('projImageUrl').value = item.imageUrl || '';
  document.getElementById('projOrder').value = item.order || 1;
  document.getElementById('projLink').value = item.link || '';
  document.getElementById('projLinkText').value = item.linkText || 'ดูโปรเจกต์';
  document.getElementById('projSummary').value = item.summary || '';

  modal.classList.add('active');
};

window.deleteProject = async function(id, title) {
  if (!confirm(`คุณต้องการลบผลงาน "${title}" ใช่หรือไม่?`)) return;

  try {
    const res = await fetch(`/api/admin/projects/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    const data = await res.json();
    if (data.success) {
      showToast(data.message || 'ลบผลงานเรียบร้อยแล้ว');
      fetchAdminProjects();
    } else {
      alert(data.error || 'ไม่สามารถลบผลงานได้');
    }
  } catch (err) {
    alert(`ข้อผิดพลาด: ${err.message}`);
  }
};

// ==========================================================================
// PROFILE & BIO MANAGEMENT
// ==========================================================================
async function fetchAdminProfile() {
  try {
    const res = await fetch(`/api/profile?_t=${Date.now()}`, { cache: 'no-store' });
    const json = await res.json();
    if (json.success && json.data) {
      const p = json.data;
      document.getElementById('profName').value = p.name || '';
      document.getElementById('profNickname').value = p.nickname || '';
      document.getElementById('profRole').value = p.role || '';
      document.getElementById('profSubtitle').value = p.subtitle || '';
      document.getElementById('profPhone').value = p.phone || '';
      document.getElementById('profEmail').value = p.email || '';
      document.getElementById('profBio').value = p.bio || '';
      
      const skillsStr = Array.isArray(p.skills) ? p.skills.join(', ') : (p.skills || '');
      document.getElementById('profSkills').value = skillsStr;
      updateSkillsPreview(skillsStr);

      const expStr = Array.isArray(p.experience) ? p.experience.join('\n') : (p.experience || '');
      document.getElementById('profExperience').value = expStr;

      const eduStr = Array.isArray(p.education) ? p.education.join('\n') : (p.education || '');
      document.getElementById('profEducation').value = eduStr;
    }
  } catch (err) {
    console.error("Failed to load profile:", err.message);
  }
}

function setupSkillsLivePreview() {
  const input = document.getElementById('profSkills');
  input.addEventListener('input', () => {
    updateSkillsPreview(input.value);
  });
}

function updateSkillsPreview(str) {
  const container = document.getElementById('skillsPreviewChips');
  if (!container) return;
  const list = str.split(',').map(s => s.trim()).filter(Boolean);
  container.innerHTML = list.map(s => `<span class="skill-preview-pill">${s}</span>`).join('');
}

function setupProfileForm() {
  const form = document.getElementById('profileForm');
  const btnSave = document.getElementById('btnSaveProfile');
  if (!form) return;

  const saveProfile = async () => {
    if (btnSave) {
      btnSave.disabled = true;
      btnSave.innerHTML = `
        <svg class="spin-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="animation: spin 0.8s linear infinite;">
          <circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle>
          <path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"></path>
        </svg>
        <span>กำลังบันทึกข้อมูล...</span>
      `;
    }

    const payload = {
      name: document.getElementById('profName').value,
      nickname: document.getElementById('profNickname').value,
      role: document.getElementById('profRole').value,
      subtitle: document.getElementById('profSubtitle').value,
      phone: document.getElementById('profPhone').value,
      email: document.getElementById('profEmail').value,
      bio: document.getElementById('profBio').value,
      skills: document.getElementById('profSkills').value,
      experience: document.getElementById('profExperience').value,
      education: document.getElementById('profEducation').value
    };

    try {
      const res = await fetch('/api/admin/profile', {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        showToast('บันทึกข้อมูลส่วนตัวและ BIO เรียบร้อยแล้ว (หน้าบ้านอัปเดตทันที)');
        if (btnSave) {
          btnSave.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="3">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            <span style="color:#22c55e;">บันทึกสำเร็จเรียบร้อย!</span>
          `;
          setTimeout(() => {
            btnSave.disabled = false;
            btnSave.innerHTML = `
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                <polyline points="17 21 17 13 7 13 7 21"></polyline>
                <polyline points="7 3 7 8 15 8"></polyline>
              </svg>
              <span>บันทึกข้อมูลส่วนตัวทั้งหมด</span>
            `;
          }, 2000);
        }
      } else {
        alert(data.error || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
        if (btnSave) {
          btnSave.disabled = false;
          btnSave.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
              <polyline points="17 21 17 13 7 13 7 21"></polyline>
              <polyline points="7 3 7 8 15 8"></polyline>
            </svg>
            <span>บันทึกข้อมูลส่วนตัวทั้งหมด</span>
          `;
        }
      }
    } catch (err) {
      alert(`ข้อผิดพลาด: ${err.message}`);
      if (btnSave) {
        btnSave.disabled = false;
        btnSave.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
            <polyline points="17 21 17 13 7 13 7 21"></polyline>
            <polyline points="7 3 7 8 15 8"></polyline>
          </svg>
          <span>บันทึกข้อมูลส่วนตัวทั้งหมด</span>
        `;
      }
    }
  };

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    saveProfile();
  });
}

// ==========================================================================
// CONTACT MESSAGES INBOX
// ==========================================================================
async function fetchAdminContacts() {
  const container = document.getElementById('contactsListContainer');
  const counter = document.getElementById('contactsCountBadge');
  const refreshBtn = document.getElementById('btnRefreshContacts');

  if (refreshBtn) refreshBtn.classList.add('loading');

  try {
    const res = await fetch('/api/contacts', {
      headers: getAuthHeaders()
    });
    const json = await res.json();
    if (json.success && json.data) {
      counter.textContent = json.data.length;
      renderAdminContacts(json.data);
    } else if (res.status === 401) {
      container.innerHTML = `<div class="loading-state-card">เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่</div>`;
    }
  } catch (err) {
    container.innerHTML = `<div class="loading-state-card">ไม่สามารถโหลดข้อความติดต่อได้: ${escapeHtml(err.message)}</div>`;
  } finally {
    if (refreshBtn) refreshBtn.classList.remove('loading');
  }
}

document.getElementById('btnRefreshContacts').addEventListener('click', fetchAdminContacts);

function renderAdminContacts(messages) {
  const container = document.getElementById('contactsListContainer');
  if (!container) return;

  if (messages.length === 0) {
    container.innerHTML = `<div class="loading-state-card">ยังไม่มีข้อความติดต่อเข้ามาในขณะนี้</div>`;
    return;
  }

  container.innerHTML = messages.map(msg => {
    const dateStr = msg.createdAt ? escapeHtml(new Date(msg.createdAt).toLocaleString('th-TH')) : 'ไม่ระบุเวลา';
    const id = escapeHtml(msg._id || '');
    const safeName = escapeHtml(msg.name || 'ไม่ระบุชื่อ');
    const safeSubject = escapeHtml(msg.subject || 'ติดต่องาน');
    const safeEmail = escapeHtml(msg.email || '');
    const safePhone = escapeHtml(msg.phone || '');
    const cleanPhoneDigits = safePhone.replace(/[^0-9]/g, '');
    const safeMessage = escapeHtml(msg.message || '');

    return `
      <div class="contact-msg-card" id="msg-${id}">
        <div class="contact-msg-header">
          <div class="contact-sender-info">
            <div class="contact-sender-name">${safeName}</div>
            <div class="contact-subject-tag">${safeSubject}</div>
          </div>
          <div class="contact-time-badge">${dateStr}</div>
        </div>

        <div class="contact-reach-links">
          <a href="mailto:${safeEmail}" class="contact-reach-item">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
              <polyline points="22,6 12,13 2,6"></polyline>
            </svg>
            <span>${safeEmail}</span>
          </a>
          ${safePhone ? `
            <a href="tel:${cleanPhoneDigits}" class="contact-reach-item">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
              </svg>
              <span>${safePhone}</span>
            </a>
          ` : ''}
        </div>

        <div class="contact-msg-body">${safeMessage}</div>

        <div class="contact-msg-footer">
          <button type="button" class="btn-card-delete" data-id="${id}" data-name="${safeName}">
            ลบข้อความนี้
          </button>
        </div>
      </div>
    `;
  }).join('');

  container.querySelectorAll('.btn-card-delete').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const name = btn.getAttribute('data-name');
      if (id) deleteContactMsg(id, name);
    });
  });
}

window.deleteContactMsg = async function(id, name) {
  if (!confirm(`คุณต้องการลบข้อความจาก "${name}" ใช่หรือไม่?`)) return;

  try {
    const res = await fetch(`/api/admin/contacts/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    const data = await res.json();
    if (data.success) {
      showToast('ลบข้อความเรียบร้อยแล้ว');
      fetchAdminContacts();
    } else {
      alert(data.error || 'ไม่สามารถลบข้อความได้');
    }
  } catch (err) {
    alert(`ข้อผิดพลาด: ${err.message}`);
  }
};

// ==========================================================================
// TOAST NOTIFICATIONS
// ==========================================================================
function showToast(message, type = 'success') {
  const toast = document.getElementById('adminToast');
  if (!toast) return;

  toast.textContent = message;
  toast.className = `admin-toast-bar show ${type}`;

  setTimeout(() => {
    toast.className = 'admin-toast-bar';
  }, 3200);
}

// ==========================================================================
// RETRO MUSIC PLAYER (lukrembo - biscuit)
// ==========================================================================
function initRetroMusicPlayer() {
  const audio = document.getElementById('bgMusicAudio');
  const toggleBtn = document.getElementById('playerToggleBtn');
  const icon = document.getElementById('btnStateIcon');
  const text = document.getElementById('btnStateText');
  const slider = document.getElementById('playerVolumeRange');
  const volumeLabel = document.getElementById('playerVolumeVal');

  if (!audio || !toggleBtn) return;

  // Default volume 30% and looping
  audio.volume = 0.3;
  audio.loop = true;

  audio.addEventListener('ended', () => {
    audio.currentTime = 0;
    audio.play().catch(() => {});
  });

  const updateUI = (isPlaying) => {
    if (isPlaying) {
      toggleBtn.classList.add('playing');
      if (icon) icon.textContent = '||';
      if (text) text.textContent = 'PAUSE';
    } else {
      toggleBtn.classList.remove('playing');
      if (icon) icon.textContent = '▶';
      if (text) text.textContent = 'PLAY';
    }
  };

  const gestureEvents = ['pointerdown', 'mousedown', 'touchstart', 'click', 'keydown'];

  const removeGestureListeners = () => {
    gestureEvents.forEach(evt => {
      window.removeEventListener(evt, handleGesturePlay, true);
      document.removeEventListener(evt, handleGesturePlay, true);
    });
  };

  const handleGesturePlay = () => {
    if (!audio.paused) {
      removeGestureListeners();
      return;
    }
    const p = audio.play();
    if (p !== undefined) {
      p.then(() => {
        updateUI(true);
        removeGestureListeners();
      }).catch(() => {});
    }
  };

  const attemptAutoplay = () => {
    const p = audio.play();
    if (p !== undefined) {
      p.then(() => {
        updateUI(true);
        removeGestureListeners();
      }).catch(() => {
        gestureEvents.forEach(evt => {
          window.addEventListener(evt, handleGesturePlay, { capture: true, passive: true });
          document.addEventListener(evt, handleGesturePlay, { capture: true, passive: true });
        });
      });
    }
  };

  attemptAutoplay();

  window.addEventListener('load', () => {
    if (audio.paused) {
      attemptAutoplay();
    }
  }, { once: true });

  toggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (audio.paused) {
      audio.play().then(() => {
        updateUI(true);
        removeGestureListeners();
      }).catch(err => {
        console.warn("Audio play prevented:", err.message);
      });
    } else {
      audio.pause();
      updateUI(false);
    }
  });

  audio.addEventListener('play', () => updateUI(true));
  audio.addEventListener('pause', () => updateUI(false));

  if (slider) {
    slider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      audio.volume = Math.max(0, Math.min(1, val / 100));
      if (volumeLabel) {
        volumeLabel.textContent = `${val}%`;
      }
    });
  }
}

// ==========================================================================
// DARK / LIGHT THEME TOGGLE
// ==========================================================================
function initThemeToggle() {
  const toggleBtn = document.getElementById('themeToggleBtn');
  if (!toggleBtn) return;

  const getPreferredTheme = () => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved;
    return (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
  };

  const applyTheme = (theme) => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('theme', theme);
    } catch (e) {}
  };

  // Sync theme immediately on init
  applyTheme(getPreferredTheme());

  toggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const current = document.documentElement.getAttribute('data-theme') || getPreferredTheme();
    const next = current === 'dark' ? 'light' : 'dark';
    applyTheme(next);
  });

  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!localStorage.getItem('theme')) {
        applyTheme(e.matches ? 'dark' : 'light');
      }
    });
  }
}
