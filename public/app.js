/**
 * Web Profile Frontend Script (ref4 Architecture & Figma Project Cards)
 * Strictly Thai Headings, Category Filters (ทั้งหมด, Figma, AE, BI), No Emojis
 */

let allProjects = [];
let currentCategory = 'all';

document.addEventListener('DOMContentLoaded', () => {
  fetchProjects();
  setupFilterTabs();
  setupContactForm();
});

// ================= Tool Icons SVG/IMG =================
function getToolIcon(type) {
  if (type === 'Figma') {
    return `
      <svg width="14" height="20" viewBox="0 0 38 57" fill="none" style="flex-shrink: 0;">
        <path d="M19 28.5C19 23.2533 23.2533 19 28.5 19C33.7467 19 38 23.2533 38 28.5C38 33.7467 33.7467 38 28.5 38C23.2533 38 19 33.7467 19 28.5Z" fill="#1ABCFE"/>
        <path d="M0 47.5C0 42.2533 4.25329 38 9.5 38H19V47.5C19 52.7467 14.7467 57 9.5 57C4.25329 57 0 52.7467 0 47.5Z" fill="#0ACF83"/>
        <path d="M19 0V19H28.5C33.7467 19 38 14.7467 38 9.5C38 4.25329 33.7467 0 28.5 0H19Z" fill="#FF7262"/>
        <path d="M0 9.5C0 14.7467 4.25329 19 9.5 19H19V0H9.5C4.25329 0 0 4.25329 0 9.5Z" fill="#F24E1E"/>
        <path d="M0 28.5C0 33.7467 4.25329 38 9.5 38H19V19H9.5C4.25329 19 0 23.2533 0 28.5Z" fill="#A259FF"/>
      </svg>
    `;
  } else if (type === 'AE') {
    return `
      <img src="/assets/Adobe_After_Effects_CC_icon.svg.webp" width="18" height="18" alt="After Effects" style="border-radius: 4px; flex-shrink: 0; object-fit: contain;">
    `;
  } else if (type === 'BI') {
    return `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style="flex-shrink: 0;">
        <rect x="3" y="13" width="4" height="8" rx="1" fill="#F2C811"/>
        <rect x="10" y="8" width="4" height="13" rx="1" fill="#F2C811"/>
        <rect x="17" y="3" width="4" height="18" rx="1" fill="#F2C811"/>
      </svg>
    `;
  }
  return '';
}

// ================= Fetch Projects from MongoDB =================
async function fetchProjects() {
  const container = document.getElementById('worksFeed');
  try {
    const res = await fetch('/api/projects');
    const json = await res.json();
    if (json.success && json.data) {
      allProjects = json.data;
      renderProjects();
    }
  } catch (err) {
    if (container) {
      container.innerHTML = `<p style="text-align: center; color: var(--text-muted); padding: 30px;">ไม่สามารถโหลดข้อมูลผลงานได้ในขณะนี้</p>`;
    }
  }
}

// ================= Filter Tab Handler =================
function setupFilterTabs() {
  const filterBtns = document.querySelectorAll('.filter-tab-btn');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentCategory = btn.getAttribute('data-category');
      renderProjects();
    });
  });
}

// ================= Render Projects (Figma Project Card Style) =================
function renderProjects() {
  const container = document.getElementById('worksFeed');
  const countSubtitle = document.getElementById('worksCountSubtitle');
  if (!container) return;

  const filtered = currentCategory === 'all'
    ? allProjects
    : allProjects.filter(item => item.type === currentCategory);

  if (countSubtitle) {
    const label = currentCategory === 'all' ? 'ทั้งหมด' : currentCategory;
    countSubtitle.textContent = `${label} ${filtered.length} โปรเจกต์`;
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="padding: 40px; text-align: center; color: var(--text-muted); background: #FFFFFF; border-radius: var(--radius-lg); border: 1px solid var(--border-color);">
        ยังไม่มีผลงานในหมวดหมู่นี้
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(item => {
    const toolIcon = getToolIcon(item.type);

    return `
      <article class="figma-project-card" data-category="${item.type}">
        <!-- Top Preview Container (Figma Canvas Preview) -->
        <div class="card-figma-preview-box">
          <img src="${item.imageUrl || '/assets/project_figma_clock.png'}" alt="${item.title}" class="figma-preview-img" loading="lazy">
          
          <a href="${item.link}" target="_blank" rel="noopener noreferrer" class="figma-expand-icon" title="เปิดดูผลงาน">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
            </svg>
          </a>
        </div>

        <!-- Card Body -->
        <div class="card-figma-body">
          <!-- Figma File Meta Header -->
          <div class="figma-file-meta-row">
            <div class="figma-file-title">
              ${toolIcon}
              <span>${item.figmaHeader || (item.type + ' Project')}</span>
            </div>
            <div class="figma-edit-time">${item.timeEdited || 'แก้ไขล่าสุด'}</div>
          </div>

          <!-- Category Tag -->
          <div class="figma-category-tag">${item.categoryTag || item.type}</div>

          <!-- Title -->
          <h3 class="figma-project-title">${item.title}</h3>

          <!-- Description -->
          <p class="figma-project-desc">${item.summary}</p>

          <!-- Action Link -->
          <a href="${item.link}" target="_blank" rel="noopener noreferrer" class="btn-view-project-link">
            <span>${item.linkText || 'ดูโปรเจกต์'}</span>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M7 17L17 7M17 7H7M17 7V17"/>
            </svg>
          </a>
        </div>
      </article>
    `;
  }).join('');
}

// ================= Contact Form (Submits to MongoDB Atlas) =================
function setupContactForm() {
  const form = document.getElementById('contactForm');
  const feedback = document.getElementById('formFeedback');
  const submitBtn = document.getElementById('submitBtn');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    submitBtn.disabled = true;
    submitBtn.innerHTML = `กำลังส่งข้อมูล...`;

    const formData = {
      name: document.getElementById('contactName').value,
      email: document.getElementById('contactEmail').value,
      phone: document.getElementById('contactPhone').value,
      subject: document.getElementById('contactSubject').value,
      message: document.getElementById('contactMessage').value
    };

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();

      if (data.success) {
        feedback.className = 'form-result-banner success';
        feedback.innerHTML = `
          <strong>บันทึกข้อมูลเรียบร้อยแล้ว</strong> ขอขอบคุณสำหรับการติดต่อ ระบบได้บันทึกข้อมูลเข้าสู่ฐานข้อมูล MongoDB เรียบร้อยแล้ว
          <div style="font-size:0.75rem; font-family:monospace; margin-top:3px; opacity:0.8;">รหัสอ้างอิง: ${data.id}</div>
        `;
        form.reset();
      } else {
        feedback.className = 'form-result-banner error';
        feedback.textContent = data.error || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง';
      }
    } catch (err) {
      feedback.className = 'form-result-banner error';
      feedback.textContent = `ไม่สามารถเชื่อมต่อกับระบบได้: ${err.message}`;
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `ส่งข้อความ`;
    }
  });
}
