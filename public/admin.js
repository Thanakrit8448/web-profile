/**
 * Web Profile Admin Dashboard Script
 * Manages Projects, Profile/Bio, and Contact Messages
 */

let adminToken = sessionStorage.getItem('adminToken') || '';
let loadedProjects = [];

document.addEventListener('DOMContentLoaded', () => {
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

function getAuthHeaders() {
  return {
    'Content-Type': 'application/json',
    'x-admin-token': adminToken
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
    const res = await fetch('/api/projects');
    const json = await res.json();
    if (json.success && json.data) {
      loadedProjects = json.data;
      counter.textContent = loadedProjects.length;
      renderAdminProjects(loadedProjects);
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
    return `
      <div class="project-admin-card" data-id="${item.id}">
        <div class="proj-admin-thumb-box">
          <img src="${item.imageUrl || '/assets/project_figma_clock.png'}" alt="${item.title}" class="proj-admin-thumb-img">
          <span class="proj-admin-type-pill">${item.type}</span>
          <span class="proj-admin-order-badge">ลำดับ: ${item.order || 1}</span>
        </div>

        <div class="proj-admin-body">
          <div class="proj-admin-meta">${item.categoryTag || item.type} • ${item.figmaHeader || ''}</div>
          <h3 class="proj-admin-title">${item.title}</h3>
          <p class="proj-admin-desc">${item.summary || 'ไม่มีคำอธิบาย'}</p>

          <div class="proj-admin-card-actions">
            <button type="button" class="btn-card-edit" onclick="openEditProjectModal('${item.id}')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
              <span>แก้ไข</span>
            </button>
            <button type="button" class="btn-card-delete" onclick="deleteProject('${item.id}', '${item.title.replace(/'/g, "\\'")}')">
              ลบ
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
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

  const closeModal = () => modal.classList.remove('active');
  btnClose.addEventListener('click', closeModal);
  btnCancel.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
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
        fetchAdminProjects();
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
  const item = loadedProjects.find(p => p.id === id);
  if (!item) return;

  const modal = document.getElementById('projectModal');
  document.getElementById('modalProjectTitle').textContent = 'แก้ไขผลงาน';
  document.getElementById('projId').value = item.id;
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
    const res = await fetch('/api/profile');
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
  const btnTop = document.getElementById('btnSaveProfileTop');

  const saveProfile = async () => {
    const btnBottom = document.getElementById('btnSaveProfileBottom');
    btnTop.disabled = true;
    btnBottom.disabled = true;
    btnTop.textContent = 'กำลังบันทึก...';
    btnBottom.textContent = 'กำลังบันทึก...';

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
        showToast('บันทึกข้อมูลส่วนตัวและ BIO เรียบร้อยแล้ว');
      } else {
        alert(data.error || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
      }
    } catch (err) {
      alert(`ข้อผิดพลาด: ${err.message}`);
    } finally {
      btnTop.disabled = false;
      btnBottom.disabled = false;
      btnTop.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
          <polyline points="17 21 17 13 7 13 7 21"></polyline>
          <polyline points="7 3 7 8 15 8"></polyline>
        </svg>
        <span>บันทึกข้อมูลส่วนตัว</span>
      `;
      btnBottom.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
          <polyline points="17 21 17 13 7 13 7 21"></polyline>
          <polyline points="7 3 7 8 15 8"></polyline>
        </svg>
        <span>บันทึกข้อมูลส่วนตัวทั้งหมด</span>
      `;
    }
  };

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    saveProfile();
  });

  btnTop.addEventListener('click', saveProfile);
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
    const res = await fetch('/api/contacts');
    const json = await res.json();
    if (json.success && json.data) {
      counter.textContent = json.data.length;
      renderAdminContacts(json.data);
    }
  } catch (err) {
    container.innerHTML = `<div class="loading-state-card">ไม่สามารถโหลดข้อความติดต่อได้: ${err.message}</div>`;
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
    const dateStr = msg.createdAt ? new Date(msg.createdAt).toLocaleString('th-TH') : 'ไม่ระบุเวลา';
    const id = msg._id || '';

    return `
      <div class="contact-msg-card" id="msg-${id}">
        <div class="contact-msg-header">
          <div class="contact-sender-info">
            <div class="contact-sender-name">${msg.name}</div>
            <div class="contact-subject-tag">${msg.subject || 'ติดต่องาน'}</div>
          </div>
          <div class="contact-time-badge">${dateStr}</div>
        </div>

        <div class="contact-reach-links">
          <a href="mailto:${msg.email}" class="contact-reach-item">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
              <polyline points="22,6 12,13 2,6"></polyline>
            </svg>
            <span>${msg.email}</span>
          </a>
          ${msg.phone ? `
            <a href="tel:${msg.phone.replace(/[^0-9]/g, '')}" class="contact-reach-item">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
              </svg>
              <span>${msg.phone}</span>
            </a>
          ` : ''}
        </div>

        <div class="contact-msg-body">${msg.message}</div>

        <div class="contact-msg-footer">
          <button type="button" class="btn-card-delete" onclick="deleteContactMsg('${id}', '${msg.name.replace(/'/g, "\\'")}')">
            ลบข้อความนี้
          </button>
        </div>
      </div>
    `;
  }).join('');
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
