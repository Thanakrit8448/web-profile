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
  setupNotificationGlow();
  initBrandAnimation();
  initNavGlider();
  initRetroMusicPlayer();
  initThemeToggle();
  initMobileNav();
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
    const res = await fetch(`/api/profile?_t=${Date.now()}`, { cache: 'no-store' });
    const json = await res.json();
    if (json.success && json.data) {
      const p = json.data;

      // Update Names, Role, and Subtitle
      if (p.name) {
        document.querySelectorAll('.profile-name-ref4').forEach(el => el.textContent = p.name);
      }
      if (p.nickname) {
        document.querySelectorAll('.profile-nickname-pill-ref4').forEach(el => {
          const textSpan = el.querySelector('.nickname-text');
          if (textSpan) {
            textSpan.textContent = p.nickname;
          } else {
            el.textContent = p.nickname;
          }
        });
      }
      if (p.role) {
        document.querySelectorAll('.profile-role-ref4').forEach(el => el.textContent = p.role);
        const footerRole = document.querySelector('.footer-role-text');
        if (footerRole) footerRole.textContent = p.role;
        if (p.name) {
          document.title = `${p.name} (${p.nickname || 'ไอซ์'}) | ${p.role}`;
        }
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
          const normalizedBio = p.bio.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
          let parts = normalizedBio.split(/\n{2,}/).map(s => s.trim()).filter(Boolean);
          if (parts.length <= 1) {
            const singleLines = normalizedBio.split('\n').map(s => s.trim()).filter(Boolean);
            if (singleLines.length > 1) {
              parts = singleLines;
            }
          }

          let closingText = 'ก่อนที่จะร่วมงานกัน สามารถดูผลงานผ่านปุ่มด้านล่างได้เลย';
          let introParts = parts;

          if (parts.length > 1) {
            const lastPart = parts[parts.length - 1];
            if (lastPart.includes('ร่วมงาน') || lastPart.includes('ผลงาน') || lastPart.includes('ด้านล่าง') || lastPart.length < 90) {
              closingText = lastPart;
              introParts = parts.slice(0, parts.length - 1);
            }
          }

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

      // Update Education (Uiverse Glow Notification Card)
      if (p.education && Array.isArray(p.education) && p.education.length > 0) {
        const notiBody = document.querySelector('.notification .notibody');
        if (notiBody) {
          notiBody.textContent = p.education.join(' ');
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
    const res = await fetch(`/api/projects?_t=${Date.now()}`, { cache: 'no-store' });
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
  const tabsContainer = document.querySelector('.category-filter-tabs');
  if (!tabsContainer) return;

  const radioInputs = tabsContainer.querySelectorAll('input[name="filter-category"]');
  radioInputs.forEach(input => {
    input.addEventListener('change', () => {
      currentCategory = input.value;
      renderProjects();
    });
  });

  const labels = tabsContainer.querySelectorAll('.filter-tab-btn');
  labels.forEach(label => {
    label.addEventListener('click', () => {
      const cat = label.getAttribute('data-category');
      if (cat) {
        currentCategory = cat;
        const targetRadio = tabsContainer.querySelector(`input[value="${cat}"]`);
        if (targetRadio && !targetRadio.checked) {
          targetRadio.checked = true;
        }
        renderProjects();
      }
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
          <div class="card">
            <svg class="wave" viewBox="0 0 1440 320" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M0,256L11.4,240C22.9,224,46,192,69,192C91.4,192,114,224,137,234.7C160,245,183,235,206,213.3C228.6,192,251,160,274,149.3C297.1,139,320,149,343,181.3C365.7,213,389,267,411,282.7C434.3,299,457,277,480,250.7C502.9,224,526,192,549,181.3C571.4,171,594,181,617,208C640,235,663,277,686,256C708.6,235,731,149,754,122.7C777.1,96,800,128,823,165.3C845.7,203,869,245,891,224C914.3,203,937,117,960,112C982.9,107,1006,181,1029,197.3C1051.4,213,1074,171,1097,144C1120,117,1143,107,1166,133.3C1188.6,160,1211,224,1234,218.7C1257.1,213,1280,139,1303,133.3C1325.7,128,1349,192,1371,192C1394.3,192,1417,128,1429,96L1440,64L1440,320L1428.6,320C1417.1,320,1394,320,1371,320C1348.6,320,1326,320,1303,320C1280,320,1257,320,1234,320C1211.4,320,1189,320,1166,320C1142.9,320,1120,320,1097,320C1074.3,320,1051,320,1029,320C1005.7,320,983,320,960,320C937.1,320,914,320,891,320C868.6,320,846,320,823,320C800,320,777,320,754,320C731.4,320,709,320,686,320C662.9,320,640,320,617,320C594.3,320,571,320,549,320C525.7,320,503,320,480,320C457.1,320,434,320,411,320C388.6,320,366,320,343,320C320,320,297,320,274,320C251.4,320,229,320,206,320C182.9,320,160,320,137,320C114.3,320,91,320,69,320C45.7,320,23,320,11,320L0,320Z"
                fill-opacity="1"
              ></path>
            </svg>

            <div class="icon-container">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 512 512"
                stroke-width="0"
                fill="currentColor"
                stroke="currentColor"
                class="icon"
              >
                <path
                  d="M256 48a208 208 0 1 1 0 416 208 208 0 1 1 0-416zm0 464A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM369 209c9.4-9.4 9.4-24.6 0-33.9s-24.6-9.4-33.9 0l-111 111-47-47c-9.4-9.4-24.6-9.4-33.9 0s-9.4 24.6 0 33.9l64 64c9.4 9.4 24.6 9.4 33.9 0L369 209z"
                ></path>
              </svg>
            </div>
            <div class="message-text-container">
              <p class="message-text">ขอบคุณสำหรับการติดต่อเข้ามาครับ</p>
              <p class="sub-text">ทางเราจะเร่งตอบกลับให้เร็วที่สุด</p>
            </div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 15 15"
              stroke-width="0"
              fill="none"
              stroke="currentColor"
              class="cross-icon"
              title="ปิด"
            >
              <path
                fill="currentColor"
                d="M11.7816 4.03157C12.0062 3.80702 12.0062 3.44295 11.7816 3.2184C11.5571 2.99385 11.193 2.99385 10.9685 3.2184L7.50005 6.68682L4.03164 3.2184C3.80708 2.99385 3.44301 2.99385 3.21846 3.2184C2.99391 3.44295 2.99391 3.80702 3.21846 4.03157L6.68688 7.49999L3.21846 10.9684C2.99391 11.193 2.99391 11.557 3.21846 11.7816C3.44301 12.0061 3.80708 12.0061 4.03164 11.7816L7.50005 8.31316L10.9685 11.7816C11.193 12.0061 11.5571 12.0061 11.7816 11.7816C12.0062 11.557 12.0062 11.193 11.7816 10.9684L8.31322 7.49999L11.7816 4.03157Z"
                clip-rule="evenodd"
                fill-rule="evenodd"
              ></path>
            </svg>
          </div>
        `;

        const crossBtn = feedback.querySelector('.cross-icon');
        if (crossBtn) {
          crossBtn.addEventListener('click', () => {
            feedback.innerHTML = '';
            feedback.className = 'form-result-banner';
          });
        }

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

  // Sidebar Contact Button Click Handler
  const sidebarContactBtn = document.querySelector('.btn-sidebar-contact');
  if (sidebarContactBtn) {
    sidebarContactBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const contactNav = document.querySelector('.nav-link-item[href="#contact"]');
      if (contactNav) {
        contactNav.click();
      } else {
        const contactSection = document.getElementById('contact');
        if (contactSection) {
          contactSection.scrollIntoView({ behavior: 'smooth' });
        }
      }
    });
  }
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
            </g>
          </g>
        </svg>

        <!-- Animated File Explorer Folder CTA Button (Uiverse.io by simontheonlyone) -->
        <div class="folder-btn-wrapper">
          <div class="folder-btn">
            <div class="folder-icon-box">
              <div class="folder folder_one"></div>
              <div class="folder folder_two"></div>
              <div class="folder folder_three"></div>
              <div class="folder folder_four"></div>
            </div>
            <div class="active_line"></div>
            <span class="folder-tooltip">File Explorer</span>
          </div>
        </div>

        <!-- Animated Figma Cursor Overlay (Positioned ABOVE the Folder Button) -->
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 614 390"
          class="figma-cursor-overlay-svg"
        >
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
        </svg>
      </div>
    </a>
  `;
}

// ================= Notification Card Glow Cursor Tracking =================
function setupNotificationGlow() {
  const notifCard = document.querySelector('.notification');
  if (!notifCard) return;

  notifCard.addEventListener('mousemove', (e) => {
    const rect = notifCard.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const glow = notifCard.querySelector('.notiglow');
    const borderGlow = notifCard.querySelector('.notiborderglow');
    if (glow) {
      glow.style.left = `${x}px`;
      glow.style.top = `${y}px`;
    }
    if (borderGlow) {
      borderGlow.style.left = `${x}px`;
      borderGlow.style.top = `${y}px`;
    }
  });

  notifCard.addEventListener('mouseleave', () => {
    const glow = notifCard.querySelector('.notiglow');
    const borderGlow = notifCard.querySelector('.notiborderglow');
    if (glow) {
      glow.style.left = '50%';
      glow.style.top = '50%';
    }
    if (borderGlow) {
      borderGlow.style.left = '50%';
      borderGlow.style.top = '50%';
    }
  });
}

// ================= Brand Name Bouncy Squeeze Hover Animation =================
function initBrandAnimation() {
  const brand = document.querySelector('.brand-ref4');
  if (!brand) return;

  const brandText = brand.querySelector('.brand-text') || brand.querySelector('span:first-child');
  if (!brandText) return;

  brand.addEventListener('mouseenter', () => {
    brandText.classList.remove('squeeze-anim');
    void brandText.offsetWidth; // Force DOM reflow to restart CSS animation every time
    brandText.classList.add('squeeze-anim');
  });

  brand.addEventListener('click', (e) => {
    const profileSec = document.getElementById('profile');
    if (profileSec) {
      e.preventDefault();
      const firstLink = document.querySelector('.nav-link-item[href="#profile"]');
      if (firstLink) {
        firstLink.click();
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  });
}

// ================= Navbar Sliding Glider Underline & Scroll Spy =================
function initNavGlider() {
  const navList = document.querySelector('.nav-links-ref4');
  const glider = document.querySelector('.nav-active-glider');
  if (!navList || !glider) return;

  const links = navList.querySelectorAll('.nav-link-item');
  if (links.length === 0) return;

  let isClickScrolling = false;

  const updateGlider = (targetLink, smooth = true) => {
    if (!targetLink) return;
    const parentRect = navList.getBoundingClientRect();
    const linkRect = targetLink.getBoundingClientRect();
    const left = linkRect.left - parentRect.left;
    const width = linkRect.width;

    if (!smooth) {
      glider.style.transition = 'none';
      glider.style.transform = `translateX(${left}px)`;
      glider.style.width = `${width}px`;
      void glider.offsetWidth;
      glider.style.transition = 'transform 0.38s cubic-bezier(0.34, 1.56, 0.64, 1), width 0.38s cubic-bezier(0.34, 1.56, 0.64, 1)';
    } else {
      glider.style.transition = 'transform 0.38s cubic-bezier(0.34, 1.56, 0.64, 1), width 0.38s cubic-bezier(0.34, 1.56, 0.64, 1)';
      glider.style.transform = `translateX(${left}px)`;
      glider.style.width = `${width}px`;
    }
  };

  // Position immediately on load
  const activeLink = navList.querySelector('.nav-link-item.active') || links[0];
  if (activeLink) {
    updateGlider(activeLink, false);
  }

  // Recalculate accurately once webfonts finish loading
  if (document.fonts) {
    document.fonts.ready.then(() => {
      const current = navList.querySelector('.nav-link-item.active') || links[0];
      if (current) updateGlider(current, false);
    });
  }

  // Handle window resize
  window.addEventListener('resize', () => {
    const current = navList.querySelector('.nav-link-item.active') || links[0];
    if (current) updateGlider(current, false);
  });

  // Handle click on nav link
  links.forEach(link => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (href && href.startsWith('#')) {
        e.preventDefault();
        const targetId = href.substring(1);
        const targetEl = document.getElementById(targetId);

        links.forEach(l => l.classList.remove('active'));
        link.classList.add('active');
        updateGlider(link, true);

        if (targetEl) {
          isClickScrolling = true;
          const navHeight = document.querySelector('.site-nav-ref4')?.offsetHeight || 68;
          const targetTop = targetEl.getBoundingClientRect().top + window.scrollY - navHeight - 16;
          window.scrollTo({
            top: Math.max(0, targetTop),
            behavior: 'smooth'
          });

          setTimeout(() => {
            isClickScrolling = false;
          }, 800);
        }
      }
    });
  });

  // Scroll spy to move glider as user scrolls through sections
  const sections = [
    { id: 'profile', el: document.getElementById('profile') },
    { id: 'about', el: document.getElementById('about') },
    { id: 'works', el: document.getElementById('works') },
    { id: 'contact', el: document.getElementById('contact') }
  ];

  window.addEventListener('scroll', () => {
    if (isClickScrolling) return;

    const navHeight = document.querySelector('.site-nav-ref4')?.offsetHeight || 68;
    const scrollPos = window.scrollY + navHeight + 80;

    let activeId = 'profile';

    for (const sec of sections) {
      if (sec.el) {
        const top = sec.el.offsetTop;
        const height = sec.el.offsetHeight;
        if (scrollPos >= top && scrollPos < top + height) {
          activeId = sec.id;
          break;
        } else if (scrollPos >= top) {
          activeId = sec.id;
        }
      }
    }

    // Bottom of page: activate contact
    if ((window.innerHeight + window.scrollY) >= (document.body.offsetHeight - 90)) {
      activeId = 'contact';
    }

    const targetLink = navList.querySelector(`.nav-link-item[href="#${activeId}"]`);
    if (targetLink && !targetLink.classList.contains('active')) {
      links.forEach(l => l.classList.remove('active'));
      targetLink.classList.add('active');
      updateGlider(targetLink, true);
    }
  }, { passive: true });
}

// ================= Retro Lo-Fi Music Player (lukrembo - biscuit) =================
function initRetroMusicPlayer() {
  const audio = document.getElementById('bgMusicAudio');
  const toggleBtn = document.getElementById('playerToggleBtn');
  const icon = document.getElementById('btnStateIcon');
  const text = document.getElementById('btnStateText');
  const slider = document.getElementById('playerVolumeRange');
  const volumeLabel = document.getElementById('playerVolumeVal');

  if (!audio || !toggleBtn) return;

  // Set default volume (30%) & enable looping
  audio.volume = 0.3;
  audio.loop = true;

  // Extra loop listener as a robust backup
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
      }).catch(() => {
        // Still waiting for eligible user interaction
      });
    }
  };

  const attemptAutoplay = () => {
    const p = audio.play();
    if (p !== undefined) {
      p.then(() => {
        updateUI(true);
        removeGestureListeners();
      }).catch(() => {
        // Browser policy blocked unmuted autoplay before interaction.
        // Attach persistent capture listeners until playback starts.
        gestureEvents.forEach(evt => {
          window.addEventListener(evt, handleGesturePlay, { capture: true, passive: true });
          document.addEventListener(evt, handleGesturePlay, { capture: true, passive: true });
        });
      });
    }
  };

  // Attempt autoplay immediately
  attemptAutoplay();

  // Retry after full window load if still paused
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

// ================= Theme Toggle Handler (Dark / Light Mode) =================
function initThemeToggle() {
  const toggleBtns = document.querySelectorAll('#themeToggleBtn, #mobileThemeToggleBtn');
  if (!toggleBtns.length) return;

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

  toggleBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const current = document.documentElement.getAttribute('data-theme') || getPreferredTheme();
      const next = current === 'dark' ? 'light' : 'dark';
      applyTheme(next);
    });
  });

  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!localStorage.getItem('theme')) {
        applyTheme(e.matches ? 'dark' : 'light');
      }
    });
  }
}

// ================= Mobile Navigation Drawer Handler =================
function initMobileNav() {
  const toggleBtn = document.getElementById('mobileNavToggleBtn');
  const drawer = document.getElementById('mobileNavDrawer');
  if (!toggleBtn || !drawer) return;

  const toggle = (forceOpen) => {
    const isOpen = forceOpen !== undefined ? forceOpen : !drawer.classList.contains('open');
    drawer.classList.toggle('open', isOpen);
    toggleBtn.classList.toggle('active', isOpen);
    document.body.classList.toggle('mobile-nav-open', isOpen);
  };

  toggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggle();
  });

  drawer.querySelectorAll('.mobile-nav-link').forEach(link => {
    link.addEventListener('click', () => toggle(false));
  });

  document.addEventListener('click', (e) => {
    if (drawer.classList.contains('open') && !drawer.contains(e.target) && !toggleBtn.contains(e.target)) {
      toggle(false);
    }
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth >= 768 && drawer.classList.contains('open')) {
      toggle(false);
    }
  });
}



