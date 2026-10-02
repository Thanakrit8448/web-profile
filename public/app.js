/**
 * Web Profile Frontend Script (ref4 Architecture & Figma Project Cards)
 * Strictly Thai Headings, Category Filters (ทั้งหมด, Figma, AE, BI), No Emojis
 * Dynamically loads Profile and Projects from MongoDB Atlas
 */

let allProjects = [];
let currentCategory = 'all';

document.addEventListener('DOMContentLoaded', () => {
  fetchProfile();
  fetchProjects();
  setupFilterTabs();
  setupContactForm();
  setupHamburgerMenu();
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

// ================= Fetch Dynamic Profile from MongoDB =================
async function fetchProfile() {
  try {
    const res = await fetch('/api/profile');
    const json = await res.json();
    if (json.success && json.data) {
      const p = json.data;

      // Update Names, Role, and Subtitle
      if (p.name) {
        document.querySelectorAll('.profile-name-ref4').forEach(el => el.textContent = p.name);
      }
      if (p.nickname) {
        document.querySelectorAll('.profile-nickname-pill-ref4').forEach(el => el.textContent = `${p.nickname} (${p.nickname === 'ไอซ์' ? 'Ice' : ''})`);
      }
      if (p.role) {
        document.querySelectorAll('.profile-role-ref4').forEach(el => el.textContent = p.role);
      }
      if (p.subtitle) {
        const sub = document.querySelector('.profile-location-ref4 span');
        if (sub) sub.textContent = p.subtitle;
      }

      // Update Contact Links
      if (p.phone) {
        const phoneRow = document.querySelector('a[href^="tel:"]');
        if (phoneRow) {
          phoneRow.href = `tel:${p.phone.replace(/[^0-9]/g, '')}`;
          const span = phoneRow.querySelector('span');
          if (span) span.textContent = p.phone;
        }
      }
      if (p.email) {
        const emailRow = document.querySelector('a[href^="mailto:"]');
        if (emailRow) {
          emailRow.href = `mailto:${p.email}`;
          const span = emailRow.querySelector('span');
          if (span) span.textContent = p.email;
        }
      }

      // Update Bio Text
      if (p.bio) {
        const bioBlock = document.querySelector('.overview-bio-block');
        if (bioBlock) {
          const parts = p.bio.split('\n\n').filter(Boolean);
          bioBlock.innerHTML = parts.map((part, index) => {
            const isClosing = index === parts.length - 1;
            return `<p class="${isClosing ? 'bio-closing' : ''}">${part.replace(/\n/g, '<br>')}</p>`;
          }).join('');
        }
      }

      // Update Skills
      if (p.skills && Array.isArray(p.skills) && p.skills.length > 0) {
        const skillsWrap = document.querySelector('.skills-tags-grid');
        if (skillsWrap) {
          skillsWrap.innerHTML = p.skills.map(s => `<span class="skill-tag-chip">${s}</span>`).join('');
        }
      }

      // Update Experience
      if (p.experience && Array.isArray(p.experience) && p.experience.length > 0) {
        const timeline = document.querySelector('.timeline-container');
        if (timeline) {
          timeline.innerHTML = p.experience.map(exp => `
            <div class="timeline-row">
              <div class="timeline-dot-pin"></div>
              <div class="timeline-info">
                <div class="timeline-headline">${exp}</div>
              </div>
            </div>
          `).join('');
        }
      }

      // Update Education
      if (p.education && Array.isArray(p.education) && p.education.length > 0) {
        const eduBox = document.querySelector('.edu-info-card');
        if (eduBox) {
          eduBox.innerHTML = `
            <div class="edu-badge-tag">การศึกษา</div>
            ${p.education.map(ed => `<div class="edu-university-name" style="margin-top: 6px;">${ed}</div>`).join('')}
          `;
        }
      }
    }
  } catch (err) {
    console.warn("Could not load dynamic profile:", err.message);
  }
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

// ================= Hamburger Menu with Admin Link =================
function setupHamburgerMenu() {
  const btn = document.querySelector('.btn-banner-hamburger');
  if (!btn) return;

  let dropdown = document.getElementById('bannerMenuDropdown');
  if (!dropdown) {
    dropdown = document.createElement('div');
    dropdown.id = 'bannerMenuDropdown';
    dropdown.className = 'banner-dropdown-menu';
    dropdown.innerHTML = `
      <a href="/admin" class="banner-menu-link admin-highlight">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <circle cx="12" cy="12" r="3"></circle>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
        </svg>
        <span>ระบบจัดการหลังบ้าน (Admin)</span>
      </a>
    `;
    btn.parentElement.appendChild(dropdown);
  }

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown.classList.toggle('show');
  });

  document.addEventListener('click', () => {
    dropdown.classList.remove('show');
  });
}
