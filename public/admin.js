
// ==========================================================================
// CUSTOM CONFIRM MODAL (UI ยืนยันการลบข้อมูล)
// ==========================================================================
function showConfirmDialog({
  title = 'ยืนยันการลบข้อมูล',
  message = 'คุณต้องการลบรายการนี้ใช่หรือไม่?',
  confirmText = 'ลบข้อมูล'
} = {}) {
  return new Promise((resolve) => {
    const modal = document.getElementById('confirmDeleteModal');
    const titleEl = document.getElementById('confirmDeleteTitle');
    const msgEl = document.getElementById('confirmDeleteMessage');
    const confirmBtn = document.getElementById('btnApproveConfirm');
    const cancelBtn = document.getElementById('btnCancelConfirm');
    const btnTextEl = document.getElementById('confirmDeleteBtnText');

    if (!modal) {
      resolve(confirm(message.replace(/<[^>]+>/g, '')));
      return;
    }

    if (titleEl) titleEl.textContent = title;
    if (msgEl) msgEl.innerHTML = message;
    if (btnTextEl) btnTextEl.textContent = confirmText;

    let resolved = false;

    function cleanup() {
      modal.classList.remove('active');
      confirmBtn.removeEventListener('click', onConfirm);
      cancelBtn.removeEventListener('click', onCancel);
      modal.removeEventListener('click', onBackdrop);
      window.removeEventListener('keydown', onKeydown);
    }

    function onConfirm() {
      if (resolved) return;
      resolved = true;
      cleanup();
      resolve(true);
    }

    function onCancel() {
      if (resolved) return;
      resolved = true;
      cleanup();
      resolve(false);
    }

    function onBackdrop(e) {
      if (e.target === modal) {
        onCancel();
      }
    }

    function onKeydown(e) {
      if (e.key === 'Escape') {
        onCancel();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        onConfirm();
      }
    }

    confirmBtn.addEventListener('click', onConfirm);
    cancelBtn.addEventListener('click', onCancel);
    modal.addEventListener('click', onBackdrop);
    window.addEventListener('keydown', onKeydown);

    modal.classList.add('active');
    if (cancelBtn) cancelBtn.focus();
  });
}

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

  const backToHomeBtn = document.getElementById('btnBackToHome');
  if (backToHomeBtn) {
    backToHomeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      window.location.replace('/');
    });
  }

  logoutBtn.addEventListener('click', () => {
    sessionStorage.removeItem('adminToken');
    sessionStorage.clear();
    adminToken = '';
    showToast('ออกจากระบบเรียบร้อยแล้ว กำลังกลับหน้าหลัก...');
    setTimeout(() => {
      window.location.replace('/');
    }, 350);
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

// ==================== IMAGE COMPRESSION & UPLOAD UTILITIES ====================
let currentGalleryImages = [];

function compressImageFile(file, maxDimension = 1600, quality = 0.85) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      return reject(new Error('ไฟล์ที่เลือกไม่ใช่รูปภาพ'));
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('ไม่สามารถอ่านไฟล์ได้'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('ไม่สามารถประมวลผลรูปภาพได้'));
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        let dataUrl = canvas.toDataURL('image/webp', quality);
        if (!dataUrl || !dataUrl.startsWith('data:image/webp')) {
          dataUrl = canvas.toDataURL('image/jpeg', quality);
        }
        resolve(dataUrl);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

function renderGalleryPreviews() {
  const container = document.getElementById('galleryPreviewsContainer');
  const countTag = document.getElementById('galleryCountTag');
  const textarea = document.getElementById('projGallery');

  if (countTag) {
    countTag.textContent = `${currentGalleryImages.length} รูป`;
  }

  if (textarea) {
    textarea.value = currentGalleryImages.join('\n');
  }

  if (!container) return;

  if (currentGalleryImages.length === 0) {
    container.style.display = 'none';
    container.innerHTML = '';
    return;
  }

  container.style.display = 'grid';
  container.innerHTML = currentGalleryImages.map((src, idx) => `
    <div class="gallery-preview-item" data-idx="${idx}" draggable="true" title="คลิกลากเพื่อสลับลำดับรูปภาพ">
      <img src="${escapeHtml(src)}" alt="รูปที่ ${idx + 1}" class="gallery-preview-img" loading="lazy" draggable="false">
      <div class="gallery-drag-handle" title="คลิกลากเพื่อสลับลำดับ">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <circle cx="9" cy="6" r="1.5" fill="currentColor"/>
          <circle cx="15" cy="6" r="1.5" fill="currentColor"/>
          <circle cx="9" cy="12" r="1.5" fill="currentColor"/>
          <circle cx="15" cy="12" r="1.5" fill="currentColor"/>
          <circle cx="9" cy="18" r="1.5" fill="currentColor"/>
          <circle cx="15" cy="18" r="1.5" fill="currentColor"/>
        </svg>
      </div>
      <span class="gallery-preview-index">${idx + 1}</span>
      <button type="button" class="btn-remove-gallery-img" data-idx="${idx}" title="ลบรูปนี้">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
      </button>
    </div>
  `).join('');

  let draggedIdx = null;
  const items = container.querySelectorAll('.gallery-preview-item');

  items.forEach(item => {
    // Delete button click
    const btnRemove = item.querySelector('.btn-remove-gallery-img');
    if (btnRemove) {
      btnRemove.addEventListener('mousedown', (e) => e.stopPropagation());
      btnRemove.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = parseInt(btnRemove.getAttribute('data-idx'), 10);
        if (!isNaN(idx) && idx >= 0 && idx < currentGalleryImages.length) {
          currentGalleryImages.splice(idx, 1);
          renderGalleryPreviews();
        }
      });
    }

    // Drag & Drop event handlers for reordering
    item.addEventListener('dragstart', (e) => {
      draggedIdx = parseInt(item.getAttribute('data-idx'), 10);
      item.classList.add('is-dragging');
      if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', String(draggedIdx));
      }
    });

    item.addEventListener('dragenter', (e) => {
      e.preventDefault();
      const targetIdx = parseInt(item.getAttribute('data-idx'), 10);
      if (draggedIdx !== null && targetIdx !== draggedIdx) {
        item.classList.add('drag-over');
      }
    });

    item.addEventListener('dragover', (e) => {
      e.preventDefault();
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = 'move';
      }
      const targetIdx = parseInt(item.getAttribute('data-idx'), 10);
      if (draggedIdx !== null && targetIdx !== draggedIdx) {
        item.classList.add('drag-over');
      }
    });

    item.addEventListener('dragleave', (e) => {
      if (!item.contains(e.relatedTarget)) {
        item.classList.remove('drag-over');
      }
    });

    item.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();
      item.classList.remove('drag-over');
      const targetIdx = parseInt(item.getAttribute('data-idx'), 10);
      if (draggedIdx !== null && !isNaN(targetIdx) && draggedIdx !== targetIdx) {
        const [movedItem] = currentGalleryImages.splice(draggedIdx, 1);
        currentGalleryImages.splice(targetIdx, 0, movedItem);
        draggedIdx = null;
        renderGalleryPreviews();
      }
    });

    item.addEventListener('dragend', () => {
      item.classList.remove('is-dragging');
      items.forEach(el => el.classList.remove('drag-over', 'is-dragging'));
      draggedIdx = null;
    });
  });
}

async function handleGalleryFiles(files) {
  if (!files || files.length === 0) return;
  const validFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
  if (validFiles.length === 0) {
    alert('กรุณาเลือกไฟล์ที่เป็นรูปภาพเท่านั้น (JPG, PNG, WebP)');
    return;
  }

  const chooseBtn = document.getElementById('btnChooseGalleryFiles');
  if (chooseBtn) {
    chooseBtn.disabled = true;
    chooseBtn.innerHTML = `<span>กำลังประมวลผล ${validFiles.length} รูป...</span>`;
  }

  try {
    for (const file of validFiles) {
      try {
        const compressedBase64 = await compressImageFile(file);
        currentGalleryImages.push(compressedBase64);
      } catch (err) {
        console.warn('Compress failed for file:', file.name, err);
      }
    }
    renderGalleryPreviews();
    showToast(`เพิ่มรูปภาพเรียบร้อยแล้ว (${validFiles.length} รูป)`);
  } catch (err) {
    alert(`เกิดข้อผิดพลาดในการโหลดรูป: ${err.message}`);
  } finally {
    if (chooseBtn) {
      chooseBtn.disabled = false;
      chooseBtn.innerHTML = `
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
        <span>เลือกรูปภาพจากเครื่อง</span>
      `;
    }
  }
}

function updateCoverPreview(src) {
  const box = document.getElementById('coverImagePreviewBox');
  const img = document.getElementById('coverPreviewImg');
  if (!box || !img) return;

  if (src && src.trim()) {
    img.src = src.trim();
    box.style.display = 'flex';
  } else {
    img.src = '';
    box.style.display = 'none';
  }
}

// ==================== TOOLS DROPDOWN LIST HANDLER ====================
const AVAILABLE_TOOLS = [
  { name: 'Figma', category: 'UI/UX Design', icon: '/assets/figma.svg' },
  { name: 'FigJam', category: 'Whiteboard & Diagram', icon: '/assets/figma.svg' },
  { name: 'VS Code', category: 'Code Editor', icon: 'vscode' },
  { name: 'Android Studio', category: 'Android Development', icon: 'android' },
  { name: 'Vibe Coding', category: 'AI & Rapid Dev', icon: '/assets/antigravity.png' },
  { name: 'Adobe After Effects', category: 'Motion Graphics & VFX', icon: '/assets/Adobe_After_Effects_CC_icon.svg.webp' },
  { name: 'Premiere Pro', category: 'Video Editing', icon: 'premiere' },
  { name: 'Photoshop', category: 'Graphic Design', icon: 'photoshop' },
  { name: 'Illustrator', category: 'Vector Illustration', icon: 'illustrator' },
  { name: 'Excel', category: 'Spreadsheet & Analytics', icon: 'excel' }
];

function getToolIconHtml(icon) {
  if (!icon) {
    return `<svg class="chip-logo-icon" viewBox="0 0 24 24" fill="none" stroke="#FFA259" stroke-width="2.5"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>`;
  }
  if (icon.startsWith('/') || icon.endsWith('.png') || icon.endsWith('.webp') || icon.endsWith('.svg')) {
    return `<img src="${icon}" alt="" class="chip-logo-icon">`;
  }
  if (icon === 'vscode') {
    return `<svg class="chip-logo-icon" viewBox="0 0 24 24" fill="#007ACC"><path d="M17.5 1.5L8.5 9.5 4 6 2 7.5l5 4.5-5 4.5 2 1.5 4.5-3.5 9 8 4.5-2.5V4l-4.5-2.5zm0 5v11l-7-5.5 7-5.5z"/></svg>`;
  }
  if (icon === 'android') {
    return `<svg class="chip-logo-icon" viewBox="0 0 24 24" fill="#3DDC84"><path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.551 0 .9993.4482.9993.9993.0001.5511-.4483.9997-.9993.9997m-11.046 0c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9993.4482.9993.9993 0 .5511-.4482.9997-.9993.9997m11.4045-6.02l1.9973-3.4592a.416.416 0 00-.1521-.5676.416.416 0 00-.5676.1521l-2.0223 3.503C15.5902 8.4116 13.8533 8.1 12 8.1s-3.5902.3116-5.1367.8497L4.841 5.4467a.4161.4161 0 00-.5677-.1521.4157.4157 0 00-.152.5676l1.9972 3.4592C2.6889 11.1867.3432 14.6589 0 18.761h24c-.3432-4.1021-2.6889-7.5743-6.1185-9.4396"/></svg>`;
  }
  if (icon === 'powerbi') {
    return `<svg class="chip-logo-icon" viewBox="0 0 24 24" fill="#F2C811"><rect x="3" y="13" width="4" height="8" rx="1"/><rect x="10" y="8" width="4" height="13" rx="1"/><rect x="17" y="3" width="4" height="18" rx="1"/></svg>`;
  }
  if (icon === 'excel') {
    return `<svg class="chip-logo-icon" viewBox="0 0 24 24" fill="#107C41"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M8.5 7.5l2.8 4.5-2.8 4.5h2l1.8-3.2 1.8 3.2h2l-2.8-4.5 2.8-4.5h-2l-1.8 3.1-1.8-3.1h-2z" fill="#FFF"/></svg>`;
  }
  if (icon === 'photoshop') {
    return `<svg class="chip-logo-icon" viewBox="0 0 24 24" fill="#31A8FF"><rect width="24" height="24" rx="4" fill="#001E36"/><path d="M6 7h4c1.8 0 3 1 3 2.7 0 1.6-1.1 2.8-3 2.8H8v4.5H6V7zm2 3.8h2c.8 0 1.2-.4 1.2-1.1 0-.7-.4-1.1-1.2-1.1H8v2.2zm7.2 2.7c.6-.3 1.3-.5 2-.5 1 0 1.6.4 1.6 1.1v.2c-.5-.1-1.1-.1-1.8 0-1.5.2-2.3.9-2.3 2 0 1 1 1.7 2.1 1.7 1 0 1.7-.5 2-1.2v1.1H21v-4.5c0-1.8-1.2-2.7-3-2.7-1 0-1.9.3-2.6.8l.8 2zm3.8 2.3c0 .8-.6 1.4-1.5 1.4-.7 0-1.1-.4-1.1-.9 0-.6.5-1 1.3-1.1.4 0 .9 0 1.3.1v.5z" fill="#31A8FF"/></svg>`;
  }
  if (icon === 'premiere') {
    return `<svg class="chip-logo-icon" viewBox="0 0 24 24" fill="#EA77FF"><rect width="24" height="24" rx="4" fill="#00005B"/><path d="M5 6h4.5c2 0 3.5 1.2 3.5 3.2 0 1.9-1.4 3.3-3.5 3.3H7.5v5.5H5V6zm2.5 4.5H9c.9 0 1.5-.5 1.5-1.3 0-.8-.6-1.3-1.5-1.3H7.5v2.6zm7.2 4.2h2v.8c.4-.6 1.2-1 2-1v2.3c-.3-.1-.7-.1-1-.1-1.2 0-2 .6-2 2V21h-2v-6.3z" fill="#EA77FF"/></svg>`;
  }
  if (icon === 'illustrator') {
    return `<svg class="chip-logo-icon" viewBox="0 0 24 24" fill="#FF9A00"><rect width="24" height="24" rx="4" fill="#330000"/><path d="M6 18l3.6-11h1.8l3.6 11h-1.8l-.9-2.8H8.7l-.9 2.8H6zm3.2-4.3h2.6l-1.3-4.1-1.3 4.1zm8.3-6.7h1.6v11h-1.6V7z" fill="#FF9A00"/></svg>`;
  }
  return `<svg class="chip-logo-icon" viewBox="0 0 24 24" fill="none" stroke="#FFA259" stroke-width="2.5"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>`;
}

function findToolDef(name) {
  const norm = String(name || '').trim().toLowerCase();
  return AVAILABLE_TOOLS.find(t => t.name.toLowerCase() === norm) || {
    name: name,
    category: 'เครื่องมือเพิ่มเติม',
    icon: ''
  };
}

let selectedToolsSet = new Set();

function setupToolsDropdown() {
  const container = document.getElementById('toolsDropdownContainer');
  const trigger = document.getElementById('toolsDropdownTrigger');
  const optionsGrid = document.getElementById('toolsListOptions');
  const chipsContainer = document.getElementById('toolsSelectedChips');
  const countBadge = document.getElementById('toolsCountBadge');
  const hiddenInput = document.getElementById('projTools');
  const clearBtn = document.getElementById('toolsClearBtn');
  const customInput = document.getElementById('customToolInput');
  const addCustomBtn = document.getElementById('btnAddCustomTool');

  if (!container || !trigger || !optionsGrid) return;

  function renderOptions() {
    optionsGrid.innerHTML = AVAILABLE_TOOLS.map(t => {
      const isSelected = selectedToolsSet.has(t.name);
      return `
        <div class="tool-option-row ${isSelected ? 'selected' : ''}" data-tool="${escapeHtml(t.name)}">
          <div class="tool-option-left">
            <div class="tool-option-icon">
              ${getToolIconHtml(t.icon)}
            </div>
            <div class="tool-option-info">
              <span class="tool-option-name">${escapeHtml(t.name)}</span>
              <span class="tool-option-category">${escapeHtml(t.category)}</span>
            </div>
          </div>
          <div class="tool-option-check">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
        </div>
      `;
    }).join('');
  }

  function renderChips() {
    const arr = Array.from(selectedToolsSet);
    if (hiddenInput) hiddenInput.value = arr.join(', ');

    if (countBadge) {
      countBadge.textContent = `เลือกแล้ว ${arr.length} รายการ`;
    }

    if (arr.length === 0) {
      chipsContainer.innerHTML = `<span class="tools-placeholder">คลิกเพื่อเลือกเครื่องมือที่ใช้จาก Dropdown...</span>`;
      return;
    }

    chipsContainer.innerHTML = arr.map(name => {
      const def = findToolDef(name);
      return `
        <span class="tool-chip-item" data-tool="${escapeHtml(name)}">
          ${getToolIconHtml(def.icon)}
          <span>${escapeHtml(name)}</span>
          <button type="button" class="chip-remove-btn" title="ลบ ${escapeHtml(name)}" data-remove="${escapeHtml(name)}">&times;</button>
        </span>
      `;
    }).join('');
  }

  function updateAll() {
    renderOptions();
    renderChips();
  }

  // Toggle dropdown open/close
  trigger.addEventListener('click', (e) => {
    // If clicked on chip remove button, don't toggle dropdown
    if (e.target.closest('.chip-remove-btn')) return;
    const isActive = container.classList.toggle('active');
    trigger.setAttribute('aria-expanded', isActive ? 'true' : 'false');
  });

  // Clicking an option in dropdown
  optionsGrid.addEventListener('click', (e) => {
    const row = e.target.closest('.tool-option-row');
    if (!row) return;
    const toolName = row.getAttribute('data-tool');
    if (selectedToolsSet.has(toolName)) {
      selectedToolsSet.delete(toolName);
    } else {
      selectedToolsSet.add(toolName);
    }
    updateAll();
  });

  // Chip remove click
  chipsContainer.addEventListener('click', (e) => {
    const removeBtn = e.target.closest('.chip-remove-btn');
    if (!removeBtn) return;
    e.stopPropagation();
    const toolName = removeBtn.getAttribute('data-remove');
    if (toolName) {
      selectedToolsSet.delete(toolName);
      updateAll();
    }
  });

  // Clear all button
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      selectedToolsSet.clear();
      updateAll();
    });
  }

  // Add custom tool
  function addCustomTool() {
    if (!customInput) return;
    const val = customInput.value.trim();
    if (!val) return;
    if (!selectedToolsSet.has(val)) {
      selectedToolsSet.add(val);
      if (!AVAILABLE_TOOLS.some(t => t.name.toLowerCase() === val.toLowerCase())) {
        AVAILABLE_TOOLS.push({
          name: val,
          category: 'เครื่องมือเพิ่มเติม',
          icon: ''
        });
      }
      updateAll();
    }
    customInput.value = '';
  }

  if (addCustomBtn) {
    addCustomBtn.addEventListener('click', addCustomTool);
  }
  if (customInput) {
    customInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        addCustomTool();
      }
    });
  }

  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!container.contains(e.target)) {
      container.classList.remove('active');
      trigger.setAttribute('aria-expanded', 'false');
    }
  });

  // Global sync function for edit & reset
  window.syncToolsDropdownFromValue = function(toolsVal) {
    selectedToolsSet.clear();
    let toolsArr = [];
    if (Array.isArray(toolsVal)) {
      toolsArr = toolsVal;
    } else if (typeof toolsVal === 'string' && toolsVal.trim()) {
      toolsArr = toolsVal.split(/[,]+/).map(s => s.trim()).filter(Boolean);
    }
    toolsArr.forEach(t => {
      if (t) selectedToolsSet.add(t);
    });
    updateAll();
    container.classList.remove('active');
    trigger.setAttribute('aria-expanded', 'false');
  };

  // Initial render
  updateAll();
}

function setupProjectModal() {
  const modal = document.getElementById('projectModal');
  const btnOpen = document.getElementById('btnOpenAddProjectModal');
  const btnClose = document.getElementById('btnCloseProjectModal');
  const btnCancel = document.getElementById('btnCancelProjectModal');
  const form = document.getElementById('projectForm');

  // Initialize Tools Dropdown
  setupToolsDropdown();

  // ==================== DURATION DATE PICKER SETUP ====================
  const durationInput = document.getElementById('projDuration');
  const btnDurationCalendar = document.getElementById('btnDurationCalendarTrigger');
  const nativeDatePicker = document.getElementById('projDurationDatePicker');
  const btnDurationToday = document.getElementById('btnDurationToday');
  const btnDurationThisMonth = document.getElementById('btnDurationThisMonth');
  const btnDurationRangeToggle = document.getElementById('btnDurationRangeToggle');
  const durationRangeDrawer = document.getElementById('durationRangeDrawer');
  const startDateInput = document.getElementById('projDurationStartDate');
  const endDateInput = document.getElementById('projDurationEndDate');
  const btnApplyRange = document.getElementById('btnApplyDurationRange');
  const btnCancelRange = document.getElementById('btnCancelDurationRange');

  const THAI_MONTHS_SHORT = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

  function formatThaiDate(isoStr) {
    if (!isoStr) return '';
    const parts = isoStr.split('-');
    if (parts.length < 3) return isoStr;
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    const d = parseInt(parts[2], 10);
    if (isNaN(y) || isNaN(m) || isNaN(d) || m < 1 || m > 12) return isoStr;
    return `${d} ${THAI_MONTHS_SHORT[m - 1]} ${y}`;
  }

  function formatThaiDateRange(startIso, endIso) {
    if (!startIso && !endIso) return '';
    if (!endIso) return formatThaiDate(startIso);
    if (!startIso) return formatThaiDate(endIso);

    const [y1, m1, d1] = startIso.split('-').map(Number);
    const [y2, m2, d2] = endIso.split('-').map(Number);

    if (y1 === y2 && m1 === m2) {
      if (d1 === d2) return `${d1} ${THAI_MONTHS_SHORT[m1 - 1]} ${y1}`;
      return `${d1} - ${d2} ${THAI_MONTHS_SHORT[m1 - 1]} ${y1}`;
    } else if (y1 === y2) {
      return `${d1} ${THAI_MONTHS_SHORT[m1 - 1]} - ${d2} ${THAI_MONTHS_SHORT[m2 - 1]} ${y1}`;
    } else {
      return `${d1} ${THAI_MONTHS_SHORT[m1 - 1]} ${y1} - ${d2} ${THAI_MONTHS_SHORT[m2 - 1]} ${y2}`;
    }
  }

  function applyDurationValue(val) {
    if (!durationInput) return;
    durationInput.value = val;
    durationInput.classList.add('paste-active');
    setTimeout(() => durationInput.classList.remove('paste-active'), 500);
    showToast(`กำหนดระยะเวลา: ${val}`);
  }

  if (btnDurationCalendar && nativeDatePicker) {
    btnDurationCalendar.addEventListener('click', () => {
      if (typeof nativeDatePicker.showPicker === 'function') {
        try {
          nativeDatePicker.showPicker();
          return;
        } catch (e) {
          console.warn('showPicker error:', e);
        }
      }
      nativeDatePicker.focus();
      nativeDatePicker.click();
    });

    nativeDatePicker.addEventListener('change', (e) => {
      if (e.target.value) {
        applyDurationValue(formatThaiDate(e.target.value));
      }
    });
  }

  // Quick preset: วันนี้
  if (btnDurationToday) {
    btnDurationToday.addEventListener('click', () => {
      const now = new Date();
      const d = now.getDate();
      const m = now.getMonth();
      const y = now.getFullYear();
      applyDurationValue(`${d} ${THAI_MONTHS_SHORT[m]} ${y}`);
    });
  }

  // Quick preset: เดือนนี้
  if (btnDurationThisMonth) {
    btnDurationThisMonth.addEventListener('click', () => {
      const now = new Date();
      const m = now.getMonth();
      const y = now.getFullYear();
      applyDurationValue(`${THAI_MONTHS_SHORT[m]} ${y}`);
    });
  }

  // Range drawer toggle
  if (btnDurationRangeToggle && durationRangeDrawer) {
    btnDurationRangeToggle.addEventListener('click', () => {
      const isVisible = durationRangeDrawer.style.display !== 'none';
      durationRangeDrawer.style.display = isVisible ? 'none' : 'block';
      if (!isVisible) {
        const todayStr = new Date().toISOString().split('T')[0];
        if (startDateInput && !startDateInput.value) startDateInput.value = todayStr;
        if (endDateInput && !endDateInput.value) endDateInput.value = todayStr;
      }
    });
  }

  if (btnCancelRange && durationRangeDrawer) {
    btnCancelRange.addEventListener('click', () => {
      durationRangeDrawer.style.display = 'none';
    });
  }

  if (btnApplyRange && durationRangeDrawer) {
    btnApplyRange.addEventListener('click', () => {
      const startVal = startDateInput?.value;
      const endVal = endDateInput?.value;
      if (startVal || endVal) {
        const rangeText = formatThaiDateRange(startVal, endVal);
        applyDurationValue(rangeText);
        durationRangeDrawer.style.display = 'none';
      }
    });
  }

  // Helper: Extract images from clipboard items or files
  function extractImagesFromClipboard(e) {
    const images = [];
    const cd = e.clipboardData || window.clipboardData;
    if (!cd) return images;

    if (cd.items && cd.items.length > 0) {
      for (let i = 0; i < cd.items.length; i++) {
        const item = cd.items[i];
        if (item && item.type && item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) images.push(file);
        }
      }
    }

    if (images.length === 0 && cd.files && cd.files.length > 0) {
      for (let i = 0; i < cd.files.length; i++) {
        const file = cd.files[i];
        if (file && file.type && file.type.startsWith('image/')) {
          images.push(file);
        }
      }
    }

    return images;
  }

  // Cover image local file upload & paste setup
  const btnUploadCover = document.getElementById('btnUploadCoverTrigger');
  const coverFileInput = document.getElementById('projCoverFileInput');
  const coverInput = document.getElementById('projImageUrl');
  const btnClearCover = document.getElementById('btnClearCoverPreview');
  const coverPreviewBox = document.getElementById('coverImagePreviewBox');
  const coverPickerCombo = document.getElementById('coverPickerCombo') || (coverInput && coverInput.closest('.file-picker-input-combo'));

  async function handleCoverFile(file) {
    if (!file || !file.type.startsWith('image/')) return;
    try {
      const compressed = await compressImageFile(file, 1600, 0.88);
      if (coverInput) {
        coverInput.value = compressed;
        updateCoverPreview(compressed);

        if (coverPickerCombo) coverPickerCombo.classList.add('paste-active');
        coverInput.classList.add('paste-active');
        if (coverPreviewBox) coverPreviewBox.classList.add('paste-active');
        setTimeout(() => {
          if (coverPickerCombo) coverPickerCombo.classList.remove('paste-active');
          coverInput.classList.remove('paste-active');
          if (coverPreviewBox) coverPreviewBox.classList.remove('paste-active');
        }, 600);
      }
      showToast('วางรูปภาพหน้าปกเรียบร้อย (Ctrl+V)');
    } catch (err) {
      alert(`ไม่สามารถโหลดรูปหน้าปกได้: ${err.message}`);
    }
  }

  if (btnUploadCover && coverFileInput) {
    btnUploadCover.addEventListener('click', () => coverFileInput.click());
    coverFileInput.addEventListener('change', async (e) => {
      const file = e.target.files && e.target.files[0];
      if (file) {
        await handleCoverFile(file);
      }
      e.target.value = '';
    });
  }

  if (coverInput) {
    coverInput.addEventListener('input', () => {
      updateCoverPreview(coverInput.value);
    });

    // Paste directly inside coverInput
    coverInput.addEventListener('paste', async (e) => {
      const images = extractImagesFromClipboard(e);
      if (images && images.length > 0) {
        e.preventDefault();
        e.stopPropagation();
        await handleCoverFile(images[0]);
      } else {
        setTimeout(() => {
          updateCoverPreview(coverInput.value);
        }, 20);
      }
    });
  }

  if (coverPreviewBox) {
    coverPreviewBox.addEventListener('paste', async (e) => {
      const images = extractImagesFromClipboard(e);
      if (images && images.length > 0) {
        e.preventDefault();
        e.stopPropagation();
        await handleCoverFile(images[0]);
      }
    });
  }

  if (btnClearCover) {
    btnClearCover.addEventListener('click', () => {
      if (coverInput) coverInput.value = '';
      updateCoverPreview('');
    });
  }

  // Drag & drop onto Cover Image picker area
  const coverDropTargets = [coverInput, btnUploadCover, coverPreviewBox, coverPickerCombo].filter(Boolean);
  coverDropTargets.forEach(el => {
    el.addEventListener('dragover', (e) => {
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
      if (coverPickerCombo) coverPickerCombo.classList.add('drag-active');
    });
    el.addEventListener('dragleave', (e) => {
      if (!coverPickerCombo || !coverPickerCombo.contains(e.relatedTarget)) {
        if (coverPickerCombo) coverPickerCombo.classList.remove('drag-active');
      }
    });
    el.addEventListener('drop', async (e) => {
      e.preventDefault();
      if (coverPickerCombo) coverPickerCombo.classList.remove('drag-active');
      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) {
        const file = e.dataTransfer.files[0];
        if (file.type && file.type.startsWith('image/')) {
          await handleCoverFile(file);
        }
      }
    });
  });

  // File dropzone & file picker setup (Gallery)
  const dropzone = document.getElementById('galleryDropzone');
  const galleryFileInput = document.getElementById('projGalleryFileInput');
  const btnChooseFiles = document.getElementById('btnChooseGalleryFiles');

  if (dropzone && galleryFileInput) {
    dropzone.addEventListener('click', (e) => {
      if (e.target.closest('#btnChooseGalleryFiles') || e.target === dropzone || e.target.closest('.dropzone-center-content')) {
        galleryFileInput.click();
      }
    });

    galleryFileInput.addEventListener('change', (e) => {
      handleGalleryFiles(e.target.files);
      e.target.value = '';
    });

    ['dragenter', 'dragover'].forEach(eventName => {
      dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.add('drag-active');
      });
    });

    ['dragleave', 'dragend', 'drop'].forEach(eventName => {
      dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.remove('drag-active');
      });
    });

    dropzone.addEventListener('drop', (e) => {
      if (e.dataTransfer && e.dataTransfer.files) {
        handleGalleryFiles(e.dataTransfer.files);
      }
    });

    // Paste event directly on the gallery dropzone
    dropzone.addEventListener('paste', async (e) => {
      const images = extractImagesFromClipboard(e);
      if (images.length > 0) {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.add('paste-active');
        setTimeout(() => dropzone.classList.remove('paste-active'), 500);
        await handleGalleryFiles(images);
      }
    });

    // Global paste event when Project Modal is active
    window.addEventListener('paste', async (e) => {
      const projectModal = document.getElementById('projectModal');
      if (!projectModal || !projectModal.classList.contains('active')) return;

      const images = extractImagesFromClipboard(e);
      if (!images || images.length === 0) return;

      const activeEl = document.activeElement;

      // 1. If user is targeting Cover Image (focused cover input, button, or preview box)
      const isCoverTarget = activeEl && (
        activeEl === coverInput ||
        activeEl === btnUploadCover ||
        activeEl.id === 'btnUploadCoverTrigger' ||
        activeEl.closest('.file-picker-input-combo') ||
        activeEl.closest('#coverImagePreviewBox')
      );

      if (isCoverTarget) {
        e.preventDefault();
        e.stopPropagation();
        await handleCoverFile(images[0]);
        return;
      }

      // 2. Allow default text paste if user is typing text in any other input/textarea
      const isTextInput = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA');
      const hasText = e.clipboardData && e.clipboardData.getData('text/plain');

      if (isTextInput && hasText && !activeEl.closest('#galleryDropzone')) {
        return;
      }

      // 3. Otherwise paste to Gallery dropzone
      e.preventDefault();
      e.stopPropagation();

      dropzone.classList.add('paste-active');
      setTimeout(() => dropzone.classList.remove('paste-active'), 500);
      dropzone.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

      await handleGalleryFiles(images);
    });
  }

  // Direct URL Add button
  const btnAddUrls = document.getElementById('btnAddUrlsToGallery');
  const textareaGallery = document.getElementById('projGallery');
  if (btnAddUrls && textareaGallery) {
    btnAddUrls.addEventListener('click', () => {
      const urls = textareaGallery.value.split(/[\r\n,]+/).map(s => s.trim()).filter(Boolean);
      let added = 0;
      urls.forEach(u => {
        if (!currentGalleryImages.includes(u)) {
          currentGalleryImages.push(u);
          added++;
        }
      });
      renderGalleryPreviews();
      if (added > 0) {
        showToast(`เพิ่ม URL รูปภาพสำเร็จ (${added} รายการ)`);
      }
    });
  }

  btnOpen.addEventListener('click', () => {
    document.getElementById('modalProjectTitle').textContent = 'เพิ่มผลงานใหม่';
    form.reset();
    document.getElementById('projId').value = '';
    document.getElementById('projOrder').value = loadedProjects.length + 1;
    document.getElementById('projRole').value = '';
    document.getElementById('projDuration').value = '';
    if (durationRangeDrawer) durationRangeDrawer.style.display = 'none';
    document.getElementById('projTools').value = '';
    if (window.syncToolsDropdownFromValue) {
      window.syncToolsDropdownFromValue('');
    }
    document.getElementById('projProblem').value = '';
    document.getElementById('projSolution').value = '';
    document.getElementById('projVideoUrl').value = '';
    document.getElementById('projGallery').value = '';
    currentGalleryImages = [];
    renderGalleryPreviews();
    updateCoverPreview('');
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
      summary: document.getElementById('projSummary').value,
      role: document.getElementById('projRole').value,
      duration: document.getElementById('projDuration').value,
      tools: document.getElementById('projTools').value,
      problem: document.getElementById('projProblem').value,
      solution: document.getElementById('projSolution').value,
      videoUrl: document.getElementById('projVideoUrl').value,
      gallery: currentGalleryImages
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
  document.getElementById('projRole').value = item.role || '';
  document.getElementById('projDuration').value = item.duration || '';
  document.getElementById('projTools').value = Array.isArray(item.tools) ? item.tools.join(', ') : (item.tools || '');
  if (window.syncToolsDropdownFromValue) {
    window.syncToolsDropdownFromValue(item.tools || '');
  }
  document.getElementById('projProblem').value = item.problem || '';
  document.getElementById('projSolution').value = item.solution || '';
  document.getElementById('projVideoUrl').value = item.videoUrl || '';

  const rawGallery = item.gallery;
  if (Array.isArray(rawGallery)) {
    currentGalleryImages = [...rawGallery];
  } else if (typeof rawGallery === 'string' && rawGallery.trim()) {
    currentGalleryImages = rawGallery.split(/[\r\n,]+/).map(s => s.trim()).filter(Boolean);
  } else {
    currentGalleryImages = [];
  }
  renderGalleryPreviews();
  updateCoverPreview(item.imageUrl || '');

  modal.classList.add('active');
};

window.deleteProject = async function(id, title) {
  const confirmed = await showConfirmDialog({
    title: 'ยืนยันการลบผลงาน',
    message: `คุณต้องการลบผลงาน <strong>"${escapeHtml(title)}"</strong> ใช่หรือไม่?<br><span style="font-size:0.85em;color:#94a3b8;display:inline-block;margin-top:4px;">ผลงานนี้จะถูกลบออกจากเว็บไซต์อย่างถาวร</span>`,
    confirmText: 'ลบผลงาน'
  });
  if (!confirmed) return;

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
      showToast(data.error || 'ไม่สามารถลบผลงานได้', 'error');
    }
  } catch (err) {
    showToast(`ข้อผิดพลาด: ${err.message}`, 'error');
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

function formatAttachmentBytes(bytes) {
  if (!bytes || isNaN(bytes)) return '';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

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

        ${msg.attachment && msg.attachment.data ? `
          <div class="contact-msg-attachment">
            <span class="attachment-label">ไฟล์แนบ:</span>
            ${msg.attachment.type === 'application/pdf' ? `
              <a href="${msg.attachment.data}" target="_blank" download="${escapeHtml(msg.attachment.name || 'document.pdf')}" class="attachment-file-pill pdf">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
                <span class="attachment-file-name">${escapeHtml(msg.attachment.name || 'เอกสาร PDF')}</span>
                <span class="attachment-file-size">(${formatAttachmentBytes(msg.attachment.size)})</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              </a>
            ` : `
              <div class="attachment-image-box">
                <a href="${msg.attachment.data}" target="_blank" class="attachment-img-link" title="คลิกเพื่อดูรูปภาพขนาดเต็ม">
                  <img src="${msg.attachment.data}" alt="${escapeHtml(msg.attachment.name || 'รูปภาพแนบ')}" class="attachment-img-preview" loading="lazy">
                </a>
                <span class="attachment-file-name">${escapeHtml(msg.attachment.name || 'รูปภาพ')} (${formatAttachmentBytes(msg.attachment.size)})</span>
              </div>
            `}
          </div>
        ` : ''}

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
  const confirmed = await showConfirmDialog({
    title: 'ยืนยันการลบข้อความ',
    message: `คุณต้องการลบข้อความจาก <strong>"${escapeHtml(name)}"</strong> ใช่หรือไม่?<br><span style="font-size:0.85em;color:#94a3b8;display:inline-block;margin-top:4px;">การกระทำนี้จะลบข้อมูลออกจากระบบอย่างถาวร</span>`,
    confirmText: 'ลบข้อความ'
  });
  if (!confirmed) return;

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
      showToast(data.error || 'ไม่สามารถลบข้อความได้', 'error');
    }
  } catch (err) {
    showToast(`ข้อผิดพลาด: ${err.message}`, 'error');
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
