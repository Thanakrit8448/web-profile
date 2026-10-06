/**
 * Web Profile Frontend Script (ref4 Architecture & Figma Project Cards)
 * Strictly Thai Headings, Category Filters (ทั้งหมด, Figma, AE, BI), No Emojis
 * Dynamically loads Profile and Projects from MongoDB Atlas
 */

let allProjects = [];
let currentCategory = 'all';

document.addEventListener('DOMContentLoaded', () => {
  initPageLoader();
  fetchProfile();
  fetchProjects();
  setupFilterTabs();
  setupContactForm();
  setupHamburgerMenu();
});

// ================= Page Preloader Handler =================
function initPageLoader() {
  const loader = document.getElementById('page-loader');
  if (!loader) return;

  let isHidden = false;
  const hideLoader = () => {
    if (isHidden) return;
    isHidden = true;
    loader.classList.add('fade-out');
    setTimeout(() => {
      if (loader.parentNode) loader.parentNode.removeChild(loader);
    }, 600);
  };

  const minDisplayTime = 700; // Allow user to enjoy the smooth yellow-white ripple animation
  const startTime = Date.now();

  const handleFinish = () => {
    const elapsed = Date.now() - startTime;
    const remaining = Math.max(0, minDisplayTime - elapsed);
    setTimeout(hideLoader, remaining);
  };

  if (document.readyState === 'complete') {
    handleFinish();
  } else {
    window.addEventListener('load', handleFinish);
    // Safety fallback: maximum 2500ms
    setTimeout(hideLoader, 2500);
  }
}

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
          const introParts = parts.length > 1 ? parts.slice(0, parts.length - 1) : parts;
          const closingText = parts.length > 1 ? parts[parts.length - 1] : 'ก่อนที่จะร่วมงานกัน สามารถดูผลงานผ่านปุ่มด้านล่างได้เลย';
          
          bioBlock.innerHTML = `
            ${introParts.map(part => `<p>${part.replace(/\n/g, '<br>')}</p>`).join('')}
            ${createFigmaBioCardHtml(closingText)}
          `;
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

// ================= Figma Bio Selection Card Template =================
function createFigmaBioCardHtml(closingText) {
  let line1 = 'ก่อนที่จะร่วมงานกัน';
  let line2 = 'สามารถดูผลงานผ่านปุ่มด้านล่างได้เลย';
  
  if (closingText && typeof closingText === 'string') {
    const text = closingText.trim();
    if (text.includes('ก่อนที่จะร่วมงานกัน') || text.includes('คุณสามารถดูผลงาน')) {
      line1 = 'ก่อนที่จะร่วมงานกัน';
      line2 = 'สามารถดูผลงานผ่านปุ่มด้านล่างได้เลย';
    } else if (text.length > 25) {
      const mid = Math.floor(text.length / 2);
      const splitIdx = text.indexOf(' ', mid);
      if (splitIdx !== -1) {
        line1 = text.substring(0, splitIdx);
        line2 = text.substring(splitIdx + 1);
      } else {
        line1 = text;
        line2 = '';
      }
    } else {
      line1 = text;
      line2 = '';
    }
  }

  return `
    <a href="#works" class="figma-canvas-card-link" title="คลิกเพื่อเลื่อนไปดูผลงาน">
      <div class="figma-canvas-card-container">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 614 390"
          class="figma-selection-svg"
        >
          <defs>
            <linearGradient id="figmaCtaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#FFCB56" />
              <stop offset="100%" stop-color="#FFA259" />
            </linearGradient>
            <filter id="cardShadow" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="4" stdDeviation="8" flood-opacity="0.06"/>
            </filter>
          </defs>

          <g id="Frame">
            <g id="box-figma">
              <g id="text">
                <rect x="28" y="20" width="559" height="286" rx="16" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1.5" filter="url(#cardShadow)"></rect>

                <rect x="44" y="36" width="146" height="26" rx="6" fill="#EFF6FF" stroke="#BFDBFE" stroke-width="1"></rect>
                <path d="M56 44h10M56 50h10M59 41v12M63 41v12" stroke="#2563EB" stroke-width="1.5" stroke-linecap="round"></path>
                <text x="73" y="53" fill="#2563EB" font-size="12" font-weight="700" font-family="'Plus Jakarta Sans', sans-serif">Frame 1 · Portfolio</text>

                <text x="307" y="118" text-anchor="middle" fill="#0F172A" font-size="19" font-weight="700" font-family="'Prompt', sans-serif">
                  ${line1}
                </text>
                ${line2 ? `<text x="307" y="152" text-anchor="middle" fill="#0F172A" font-size="19" font-weight="700" font-family="'Prompt', sans-serif">${line2}</text>` : ''}

                <g class="figma-cta-btn">
                  <rect x="222" y="196" width="170" height="46" rx="23" fill="url(#figmaCtaGrad)"></rect>
                  <text x="301" y="225" text-anchor="middle" fill="#111827" font-size="15" font-weight="700" font-family="'Prompt', sans-serif">
                    ดูผลงาน
                  </text>
                  <path d="M336 220l4 4-4 4" stroke="#111827" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
                </g>

                <text x="307" y="272" text-anchor="middle" fill="#94A3B8" font-size="12" font-weight="500" font-family="'Plus Jakarta Sans', 'Prompt', sans-serif">
                  Figma Design · Explore Projects
                </text>
              </g>

              <g id="box">
                <path
                  stroke-width="2"
                  stroke="#2563EB"
                  fill-opacity="0.04"
                  fill="#2563EB"
                  d="M587 20H28V306H587V20Z"
                  id="figny9-box"
                ></path>
                <path stroke-width="2" stroke="#2563EB" fill="white" d="M33 15H23V25H33V15Z" id="figny9-adjust-1"></path>
                <path stroke-width="2" stroke="#2563EB" fill="white" d="M33 301H23V311H33V301Z" id="figny9-adjust-3"></path>
                <path stroke-width="2" stroke="#2563EB" fill="white" d="M592 301H582V311H592V301Z" id="figny9-adjust-4"></path>
                <path stroke-width="2" stroke="#2563EB" fill="white" d="M592 15H582V25H592V15Z" id="figny9-adjust-2"></path>
              </g>

              <g id="cursor">
                <path
                  stroke-width="2"
                  stroke="white"
                  fill="#2563EB"
                  d="M453.383 343L448 317L471 331L459.745 333.5L453.383 343Z"
                  id="Vector 273"
                ></path>
                <rect x="468" y="343" width="119" height="33" rx="6" fill="#2563EB" id="Rectangle 786"></rect>
                <text x="527" y="364" text-anchor="middle" fill="white" font-size="13" font-weight="700" font-family="'Plus Jakarta Sans', sans-serif">Thanakrit</text>
              </g>
            </g>
          </g>
        </svg>
      </div>
    </a>
  `;
}
