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
  initFigmaCarousel();
  syncFigmaSelectionBox();
  setupProjectDetailModal();
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
  } else if (type === 'App' || type === 'Android') {
    return `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="#3DDC84" style="flex-shrink: 0;">
        <path d="M6 18c0 .55.45 1 1 1h1v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h2v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h1c.55 0 1-.45 1-1V8H6v10zM3.5 8C2.67 8 2 8.67 2 9.5v7c0 .83.67 1.5 1.5 1.5S5 17.33 5 16.5v-7C5 8.67 4.33 8 3.5 8zm17 0c-.83 0-1.5.67-1.5 1.5v7c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5v-7c0-.83-.67-1.5-1.5-1.5zm-4.97-4.84l1.3-1.3c.2-.2.2-.51 0-.71-.2-.2-.51-.2-.71 0l-1.48 1.48C13.85 2.23 12.95 2 12 2c-.96 0-1.86.23-2.66.63L7.85 1.15c-.2-.2-.51-.2-.71 0-.2.2-.2.51 0 .71l1.31 1.31C6.72 4.29 5.5 6.01 5.18 8h13.64c-.32-1.99-1.54-3.71-3.25-4.84zM9 6c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm6 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"/>
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
        document.title = 'Profile - Thanakrit';
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

          let introParts = parts;
          if (parts.length > 1) {
            const lastPart = parts[parts.length - 1];
            if (lastPart.includes('ร่วมงาน') || lastPart.includes('ผลงาน') || lastPart.includes('ด้านล่าง') || lastPart.length < 90) {
              introParts = parts.slice(0, parts.length - 1);
            }
          }

          const introContainer = bioBlock.querySelector('.bio-intro-paragraphs');
          if (introContainer) {
            introContainer.innerHTML = introParts.map(part => `<p>${part.replace(/\n/g, '<br>')}</p>`).join('');
          }
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
      updateFigmaCarouselCards(allProjects);
    }
  } catch (err) {
    if (container) {
      container.innerHTML = `<p style="text-align: center; color: var(--text-muted); padding: 30px;">ไม่สามารถโหลดข้อมูลผลงานได้ในขณะนี้</p>`;
    }
  }
}

// ================= State Variables for Works & Category Filtering =================
let isAllWorksExpanded = false;
const MAX_INITIAL_WORKS = 3;

function matchesCategory(itemType, filterCategory) {
  if (filterCategory === 'all') return true;
  if (filterCategory === 'Figma' || filterCategory === 'UX/UI design' || filterCategory === 'UX/UI Design') {
    return itemType === 'Figma' || itemType === 'UX/UI design' || itemType === 'UX/UI Design';
  }
  if (filterCategory === 'AE' || filterCategory === 'video editing' || filterCategory === 'Video Editing') {
    return itemType === 'AE' || itemType === 'video editing' || itemType === 'Video Editing';
  }
  if (filterCategory === 'BI' || filterCategory === 'Power BI') {
    return itemType === 'BI' || itemType === 'Power BI';
  }
  return itemType === filterCategory;
}

function getCategoryDisplayName(type) {
  if (type === 'Figma' || type === 'UX/UI design' || type === 'UX/UI Design') return 'UX/UI design';
  if (type === 'AE' || type === 'video editing' || type === 'Video Editing') return 'video editing';
  if (type === 'BI' || type === 'Power BI') return 'Power BI';
  if (type === 'App') return 'App';
  if (type === 'all') return 'ทั้งหมด';
  return type || '';
}

// ================= Filter Tab Handler =================
function setupFilterTabs() {
  const tabsContainer = document.querySelector('.category-filter-tabs');
  if (!tabsContainer) return;

  function updateCategoryGlider() {
    const glider = tabsContainer.querySelector('.category-glider');
    if (!glider) return;

    const checkedInput = tabsContainer.querySelector('input[name="filter-category"]:checked');
    if (!checkedInput) return;

    const activeLabel = tabsContainer.querySelector(`label[for="${checkedInput.id}"]`);
    if (!activeLabel || activeLabel.offsetWidth === 0) return;

    glider.style.width = `${activeLabel.offsetWidth}px`;
    glider.style.transform = `translateX(${activeLabel.offsetLeft}px)`;
    glider.style.opacity = '1';
  }

  const radioInputs = tabsContainer.querySelectorAll('input[name="filter-category"]');
  radioInputs.forEach(input => {
    input.addEventListener('change', () => {
      currentCategory = input.value;
      isAllWorksExpanded = false;
      updateCategoryGlider();
      renderProjects();
    });
  });

  const labels = tabsContainer.querySelectorAll('.filter-tab-btn');
  labels.forEach(label => {
    label.addEventListener('click', () => {
      const cat = label.getAttribute('data-category');
      if (cat) {
        currentCategory = cat;
        isAllWorksExpanded = false;
        const targetRadio = tabsContainer.querySelector(`input[value="${cat}"]`);
        if (targetRadio && !targetRadio.checked) {
          targetRadio.checked = true;
        }
        updateCategoryGlider();
        renderProjects();
        label.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    });
  });

  // Responsive & font loaded updates
  updateCategoryGlider();
  window.addEventListener('resize', updateCategoryGlider);
  window.addEventListener('load', updateCategoryGlider);
  if (document.fonts?.ready) {
    document.fonts.ready.then(updateCategoryGlider);
  }
}

// ================= Works Feed Horizontal Scroll & Vertical Wheel =================
function setupWorksHorizontalScroll() {
  const container = document.getElementById('worksFeedContainer');
  const feed = document.getElementById('worksFeed');
  const prevBtn = document.getElementById('worksNavPrev');
  const nextBtn = document.getElementById('worksNavNext');

  if (!feed) return;

  function updateNavButtons() {
    const maxScroll = feed.scrollWidth - feed.clientWidth;
    const scrollLeft = feed.scrollLeft;

    // If no scroll is needed (all cards fit comfortably)
    if (maxScroll <= 8) {
      if (prevBtn) prevBtn.classList.add('hidden');
      if (nextBtn) nextBtn.classList.add('hidden');
      if (container) container.setAttribute('data-feather', 'none');
      return;
    }

    const hasLeftMore = scrollLeft > 12;
    const hasRightMore = scrollLeft < maxScroll - 12;

    // Previous Button Visibility
    if (prevBtn) {
      if (hasLeftMore) {
        prevBtn.classList.remove('hidden');
      } else {
        prevBtn.classList.add('hidden');
      }
    }

    // Next Button Visibility
    if (nextBtn) {
      if (hasRightMore) {
        nextBtn.classList.remove('hidden');
      } else {
        nextBtn.classList.add('hidden');
      }
    }

    // Dynamic Edge Feather & Opacity State
    if (container) {
      if (hasLeftMore && hasRightMore) {
        container.setAttribute('data-feather', 'both');
      } else if (hasRightMore) {
        container.setAttribute('data-feather', 'right');
      } else if (hasLeftMore) {
        container.setAttribute('data-feather', 'left');
      } else {
        container.setAttribute('data-feather', 'none');
      }
    }
  }

  // Scroll listeners
  if (!feed._hasScrollListener) {
    feed._hasScrollListener = true;
    feed.addEventListener('scroll', updateNavButtons, { passive: true });
    window.addEventListener('resize', updateNavButtons, { passive: true });
  }

  // Next Button Click: smooth scroll to next card
  if (nextBtn) {
    nextBtn.onclick = (e) => {
      e.preventDefault();
      const card = feed.querySelector('.figma-project-card');
      const step = card ? (card.offsetWidth + 24) : 480;
      feed.scrollBy({ left: step, behavior: 'smooth' });
    };
  }

  // Prev Button Click: smooth scroll to prev card
  if (prevBtn) {
    prevBtn.onclick = (e) => {
      e.preventDefault();
      const card = feed.querySelector('.figma-project-card');
      const step = card ? (card.offsetWidth + 24) : 480;
      feed.scrollBy({ left: -step, behavior: 'smooth' });
    };
  }

  // Click & Drag to Scroll (Grab & Drag horizontal carousel)
  if (!feed._hasDragListener) {
    feed._hasDragListener = true;

    let isDown = false;
    let startX = 0;
    let scrollStart = 0;
    let hasDragged = false;
    let dragDistance = 0;

    feed.addEventListener('mousedown', (e) => {
      // Only left mouse button
      if (e.button !== 0) return;

      isDown = true;
      hasDragged = false;
      dragDistance = 0;
      startX = e.pageX - feed.offsetLeft;
      scrollStart = feed.scrollLeft;

      // Temporarily disable scroll-snap and smooth behavior for 1:1 real-time mouse tracking
      feed.style.scrollSnapType = 'none';
      feed.style.scrollBehavior = 'auto';
      feed.classList.add('is-dragging');
    });

    window.addEventListener('mousemove', (e) => {
      if (!isDown) return;
      const x = e.pageX - feed.offsetLeft;
      const walk = (x - startX) * 1.25;
      dragDistance = Math.abs(walk);

      if (dragDistance > 5) {
        hasDragged = true;
      }

      feed.scrollLeft = scrollStart - walk;
      updateNavButtons();
    });

    const stopDragging = () => {
      if (!isDown) return;
      isDown = false;
      feed.classList.remove('is-dragging');

      // Re-enable smooth snapping to nearest card
      feed.style.scrollSnapType = 'x mandatory';
      feed.style.scrollBehavior = 'smooth';
      updateNavButtons();

      // Clear hasDragged after click event fires
      setTimeout(() => {
        hasDragged = false;
        dragDistance = 0;
      }, 80);
    };

    window.addEventListener('mouseup', stopDragging);

    // Prevent following links/buttons if the user was dragging
    feed.addEventListener('click', (e) => {
      if (hasDragged || dragDistance > 5) {
        e.preventDefault();
        e.stopPropagation();
      }
    }, true);

    // Prevent browser native ghost image dragging
    feed.addEventListener('dragstart', (e) => {
      e.preventDefault();
    });
  }

  // Initial update
  updateNavButtons();
  requestAnimationFrame(updateNavButtons);
  setTimeout(updateNavButtons, 120);
  setTimeout(updateNavButtons, 350);
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function parseVideoSource(url) {
  if (!url || typeof url !== 'string') return null;
  const cleanUrl = url.trim();
  if (!cleanUrl || cleanUrl === '#') return null;

  // YouTube standard, embed, or youtu.be shortlink
  const ytMatch = cleanUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
  if (ytMatch && ytMatch[1]) {
    return {
      type: 'youtube',
      src: `https://www.youtube-nocookie.com/embed/${ytMatch[1]}?autoplay=0&rel=0`
    };
  }

  // Google Drive video preview
  const driveMatch = cleanUrl.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/i);
  if (driveMatch && driveMatch[1]) {
    return {
      type: 'drive',
      src: `https://drive.google.com/file/d/${driveMatch[1]}/preview`
    };
  }

  // Direct MP4 / WebM video files
  if (cleanUrl.match(/\.(mp4|webm|ogg)($|\?)/i)) {
    return {
      type: 'video',
      src: cleanUrl
    };
  }

  return {
    type: 'link',
    src: cleanUrl
  };
}

// ================= Project Case Study Detail Modal (ข้อ 1, 2, 3) =================
let modalActiveProjectsList = [];
let modalCurrentProjectIndex = 0;

function setupProjectDetailModal() {
  const modal = document.getElementById('projectDetailModal');
  const btnClose = document.getElementById('btnCloseProjectDetail');
  const btnPrevTop = document.getElementById('btnPrevProjectTop');
  const btnNextTop = document.getElementById('btnNextProjectTop');
  if (!modal) return;

  if (btnClose) {
    btnClose.addEventListener('click', closeProjectDetailModal);
  }

  if (btnPrevTop) {
    btnPrevTop.addEventListener('click', (e) => {
      e.stopPropagation();
      switchProjectDetail(-1);
    });
  }

  if (btnNextTop) {
    btnNextTop.addEventListener('click', (e) => {
      e.stopPropagation();
      switchProjectDetail(1);
    });
  }

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeProjectDetailModal();
    }
  });

  window.addEventListener('keydown', (e) => {
    if (!modal.classList.contains('active')) return;
    if (e.key === 'Escape') {
      closeProjectDetailModal();
    } else if ((e.key === 'ArrowLeft' && e.shiftKey) || e.key === '[' || e.key === 'PageUp') {
      e.preventDefault();
      switchProjectDetail(-1);
    } else if ((e.key === 'ArrowRight' && e.shiftKey) || e.key === ']' || e.key === 'PageDown') {
      e.preventDefault();
      switchProjectDetail(1);
    } else if (e.key === 'ArrowLeft') {
      const prevBtn = modal.querySelector('#btnPrevGalleryImage');
      if (prevBtn) {
        prevBtn.click();
      } else {
        switchProjectDetail(-1);
      }
    } else if (e.key === 'ArrowRight') {
      const nextBtn = modal.querySelector('#btnNextGalleryImage');
      if (nextBtn) {
        nextBtn.click();
      } else {
        switchProjectDetail(1);
      }
    }
  });
}

function closeProjectDetailModal() {
  const modal = document.getElementById('projectDetailModal');
  if (!modal) return;
  modal.classList.remove('active');
  modal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';

  const iframe = modal.querySelector('iframe');
  if (iframe) {
    iframe.src = '';
  }
}

function switchProjectDetail(direction) {
  if (!modalActiveProjectsList || modalActiveProjectsList.length <= 1) return;
  modalCurrentProjectIndex = (modalCurrentProjectIndex + direction + modalActiveProjectsList.length) % modalActiveProjectsList.length;
  const newItem = modalActiveProjectsList[modalCurrentProjectIndex];
  if (!newItem) return;

  const content = document.getElementById('detailModalContent');
  if (content) {
    content.style.opacity = '0';
    content.style.transform = 'scale(0.98)';
    content.style.transition = 'opacity 0.18s ease, transform 0.18s ease';
    setTimeout(() => {
      renderProjectDetailBody(newItem);
      content.style.opacity = '1';
      content.style.transform = 'scale(1)';
    }, 180);
  }
}

function renderProjectDetailBody(item) {
  const content = document.getElementById('detailModalContent');
  if (!content || !item) return;

  const total = modalActiveProjectsList.length;
  const prevIdx = (modalCurrentProjectIndex - 1 + total) % total;
  const nextIdx = (modalCurrentProjectIndex + 1) % total;
  const prevItem = modalActiveProjectsList[prevIdx] || item;
  const nextItem = modalActiveProjectsList[nextIdx] || item;

  // Update Top Floating Switcher Pill
  const topPill = document.getElementById('modalProjectSwitcherPill');
  const stepBadge = document.getElementById('modalProjectStepBadge');
  if (topPill && stepBadge) {
    if (total > 1) {
      topPill.style.display = 'flex';
      stepBadge.textContent = `${modalCurrentProjectIndex + 1} / ${total}`;
    } else {
      topPill.style.display = 'none';
    }
  }

  const toolIcon = getToolIcon(item.type);
  const categoryName = getCategoryDisplayName(item.categoryTag || item.type);

  // Parse Video & Gallery
  const videoSource = parseVideoSource(item.videoUrl);
  let galleryImages = Array.isArray(item.gallery) && item.gallery.length > 0 ? [...item.gallery] : [];
  if (item.imageUrl && !galleryImages.includes(item.imageUrl)) {
    galleryImages.unshift(item.imageUrl);
  }
  if (galleryImages.length === 0 && item.imageUrl) {
    galleryImages = [item.imageUrl];
  }

  const hasVideo = !!videoSource;
  const hasGallery = galleryImages.length > 0;

  const toolsList = Array.isArray(item.tools)
    ? item.tools
    : (typeof item.tools === 'string' && item.tools.trim() ? item.tools.split(',').map(s => s.trim()).filter(Boolean) : []);

  content.innerHTML = `
    <div class="detail-split-layout">
      <!-- LEFT COLUMN: Media Showcase (Images / Video) -->
      <div class="detail-split-left" id="modalMediaSection">
        ${hasVideo && hasGallery ? `
          <div class="modal-media-tabs">
            <button type="button" class="btn-media-tab active" data-view="video">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              <span>วิดีโอเดโม</span>
            </button>
            <button type="button" class="btn-media-tab" data-view="gallery">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
              <span>รูปภาพผลงาน (${galleryImages.length})</span>
            </button>
          </div>
        ` : ''}

        <div class="modal-split-media-container" id="modalMediaMainBox">
          ${hasVideo ? `
            <div id="modalVideoView" class="modal-split-video-wrapper">
              ${videoSource.type === 'youtube' || videoSource.type === 'drive' ? `
                <iframe class="modal-media-video-frame" src="${videoSource.src}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
              ` : videoSource.type === 'video' ? `
                <video class="modal-media-video-frame" src="${videoSource.src}" controls playsinline></video>
              ` : `
                <div class="modal-video-fallback-box">
                  <p class="modal-video-fallback-text">คลิปวิดีโอผลงานสามารถเปิดดูได้จากลิงก์ต้นฉบับ</p>
                  <a href="${videoSource.src}" target="_blank" rel="noopener noreferrer" class="btn-detail-primary-cta">
                    <span>เปิดดูวิดีโอคลิป</span>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M7 17L17 7M17 7H7M17 7V17"/></svg>
                  </a>
                </div>
              `}
            </div>
          ` : ''}

          <div id="modalGalleryView" class="modal-split-gallery-view" style="${hasVideo ? 'display: none;' : ''}">
            ${galleryImages.length > 1 ? `
              <button type="button" class="gallery-nav-arrow prev" id="btnPrevGalleryImage" aria-label="รูปก่อนหน้า">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
              </button>
            ` : ''}

            <img id="modalMainImage" src="${galleryImages[0] || '/assets/project_figma_clock.png'}" alt="${escapeHtml(item.title)}" class="modal-split-main-img">

            ${galleryImages.length > 1 ? `
              <button type="button" class="gallery-nav-arrow next" id="btnNextGalleryImage" aria-label="รูปถัดไป">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            ` : ''}
          </div>
        </div>

        ${hasGallery && galleryImages.length > 1 ? `
          <div class="modal-split-gallery-strip" id="modalGalleryStrip" style="${hasVideo ? 'display: none;' : ''}">
            ${galleryImages.map((imgUrl, idx) => `
              <div class="gallery-thumbnail-item ${idx === 0 ? 'active' : ''}" data-idx="${idx}" data-img="${imgUrl}">
                <img src="${imgUrl}" alt="ภาพที่ ${idx + 1}" class="gallery-thumbnail-img" loading="lazy">
              </div>
            `).join('')}
          </div>
        ` : ''}
      </div>

      <!-- RIGHT COLUMN: Details & Case Study Story -->
      <div class="detail-split-right">
        <div class="detail-right-content">
          <!-- Header Block: Title -->
          <div class="detail-header-block">
            <h2 class="detail-modal-title">${escapeHtml(item.title)}</h2>
          </div>

          <!-- ข้อมูลภาพรวม -->
          <div class="detail-section-group">
            <h3 class="modal-content-heading">
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#FFA259" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              <span>ข้อมูลภาพรวม</span>
            </h3>
            <div class="detail-overview-grid">
              <div class="detail-overview-card">
                <span class="detail-overview-card-label">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  <span>บทบาทในงาน</span>
                </span>
                <span class="detail-overview-card-value">${escapeHtml(item.role || 'UX/UI Designer')}</span>
              </div>
              <div class="detail-overview-card">
                <span class="detail-overview-card-label">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  <span>ระยะเวลา</span>
                </span>
                <span class="detail-overview-card-value">${escapeHtml(item.duration || 'ปี 2025')}</span>
              </div>
              <div class="detail-overview-card">
                <span class="detail-overview-card-label">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
                  <span>เครื่องมือที่ใช้</span>
                </span>
                <div class="tools-chip-list">
                  ${toolsList.length > 0 ? toolsList.map(t => `<span class="tool-chip-badge">${escapeHtml(t)}</span>`).join('') : `<span class="tool-chip-badge">${item.type}</span>`}
                </div>
              </div>
            </div>
          </div>

          <!-- โจทย์และการแก้ปัญหา -->
          <div class="detail-section-group">
            <h3 class="modal-content-heading">
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#FFA259" stroke-width="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
              <span>โจทย์และการแก้ปัญหา</span>
            </h3>
            <div class="detail-prob-sol-grid">
              <div class="detail-problem-card">
                <h4>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><path d="m4.93 4.93 4.24 4.24M14.83 9.17l4.24-4.24M14.83 14.83l4.24 4.24M9.17 14.83l-4.24 4.24"/></svg>
                  <span>โจทย์และปัญหาที่พบ</span>
                </h4>
                <p>${escapeHtml(item.problem || 'ศึกษาปัญหาและ Pain Points ของผู้ใช้งานเพื่อนำมาออกแบบพัฒนาประสบการณ์ที่ดีขึ้น')}</p>
              </div>
              <div class="detail-solution-card">
                <h4>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
                  <span>ทางออกและการออกแบบ</span>
                </h4>
                <p>${escapeHtml(item.solution || item.summary || 'ออกแบบอินเทอร์เฟซและฟังก์ชันการใช้งานที่ตอบโจทย์ความต้องการของผู้ใช้อย่างลงตัว')}</p>
              </div>
            </div>
          </div>

          <!-- รายละเอียดและแนวคิดการทำงาน -->
          <div class="detail-section-group">
            <h3 class="modal-content-heading">
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#FFA259" stroke-width="2.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              <span>รายละเอียดและแนวคิดการทำงาน</span>
            </h3>
            <div class="detail-summary-card">
              <p>${escapeHtml(item.summary || 'ไม่มีคำอธิบายเพิ่มเติม')}</p>
            </div>
          </div>

          <!-- Explore Other Projects Banner -->
          ${total > 1 ? `
            <div class="modal-project-browse-strip">
              <button type="button" class="btn-browse-project prev" onclick="switchProjectDetail(-1)" title="ดูผลงานก่อนหน้า: ${escapeHtml(prevItem.title)}">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
                <div class="browse-project-info">
                  <span class="browse-tag">ก่อนหน้า</span>
                  <span class="browse-name">${escapeHtml(prevItem.title)}</span>
                </div>
              </button>

              <div class="browse-project-separator"></div>

              <button type="button" class="btn-browse-project next" onclick="switchProjectDetail(1)" title="ดูผลงานถัดไป: ${escapeHtml(nextItem.title)}">
                <div class="browse-project-info next-info">
                  <span class="browse-tag">ถัดไป</span>
                  <span class="browse-name">${escapeHtml(nextItem.title)}</span>
                </div>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            </div>
          ` : ''}

          <!-- Actions Footer -->
          <div class="detail-actions-footer">
            <button type="button" class="btn-detail-close-btn" onclick="closeProjectDetailModal()">ปิดหน้าต่าง</button>
            ${item.link && item.link !== '#' ? `
              <a href="${item.link}" target="_blank" rel="noopener noreferrer" class="btn-detail-primary-cta">
                <span>${escapeHtml(item.linkText || 'ดูโปรเจกต์ต้นฉบับ')}</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M7 17L17 7M17 7H7M17 7V17"/></svg>
              </a>
            ` : ''}
          </div>
        </div>
      </div>
    </div>
  `;

  // Attach Media View Switchers & Gallery Navigation
  const mediaSection = content.querySelector('#modalMediaSection');
  if (mediaSection) {
    const tabs = mediaSection.querySelectorAll('.btn-media-tab');
    const videoView = mediaSection.querySelector('#modalVideoView');
    const galleryView = mediaSection.querySelector('#modalGalleryView');
    const galleryStrip = mediaSection.querySelector('#modalGalleryStrip');
    const thumbnails = mediaSection.querySelectorAll('.gallery-thumbnail-item');
    const mainImg = mediaSection.querySelector('#modalMainImage');
    const prevBtn = mediaSection.querySelector('#btnPrevGalleryImage');
    const nextBtn = mediaSection.querySelector('#btnNextGalleryImage');

    let currentImgIdx = 0;

    const updateGalleryView = (newIdx) => {
      if (galleryImages.length === 0) return;
      currentImgIdx = (newIdx + galleryImages.length) % galleryImages.length;
      if (mainImg) {
        mainImg.style.opacity = '0';
        setTimeout(() => {
          mainImg.src = galleryImages[currentImgIdx];
          mainImg.style.opacity = '1';
        }, 120);
      }
      thumbnails.forEach((t, i) => {
        t.classList.toggle('active', i === currentImgIdx);
      });
      // ONLY scroll the horizontal gallery strip itself, NEVER scroll parent container!
      if (galleryStrip && thumbnails[currentImgIdx]) {
        const thumb = thumbnails[currentImgIdx];
        const stripCenter = galleryStrip.clientWidth / 2;
        const thumbCenter = thumb.offsetLeft + thumb.offsetWidth / 2;
        galleryStrip.scrollTo({
          left: thumbCenter - stripCenter,
          behavior: 'smooth'
        });
      }
      // Ensure left column stays pinned at top with 0 vertical scroll
      const leftCol = content.querySelector('.detail-split-left');
      if (leftCol) leftCol.scrollTop = 0;
    };

    if (prevBtn) {
      prevBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        updateGalleryView(currentImgIdx - 1);
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        updateGalleryView(currentImgIdx + 1);
      });
    }

    thumbnails.forEach(thumb => {
      thumb.addEventListener('click', () => {
        const idx = parseInt(thumb.getAttribute('data-idx'), 10);
        updateGalleryView(idx);
      });
    });

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const view = tab.getAttribute('data-view');
        if (view === 'video') {
          if (videoView) videoView.style.display = 'flex';
          if (galleryView) galleryView.style.display = 'none';
          if (galleryStrip) galleryStrip.style.display = 'none';
        } else {
          if (videoView) videoView.style.display = 'none';
          if (galleryView) galleryView.style.display = 'flex';
          if (galleryStrip) galleryStrip.style.display = 'flex';
        }
      });
    });
  }

  const rightCol = content.querySelector('.detail-split-right');
  if (rightCol) {
    rightCol.scrollTop = 0;
  }
  const leftCol = content.querySelector('.detail-split-left');
  if (leftCol) {
    leftCol.scrollTop = 0;
  }
}

function openProjectDetailModal(projectId, event, card) {
  const modal = document.getElementById('projectDetailModal');
  const content = document.getElementById('detailModalContent');
  if (!modal || !content) return;

  const item = allProjects.find(p => p.id === projectId || String(p._id) === String(projectId));
  if (!item) return;

  // Initialize active projects list based on current active category
  const activeList = allProjects.filter(p => matchesCategory(p.type, currentCategory));
  modalActiveProjectsList = activeList.length > 0 ? activeList : allProjects;
  modalCurrentProjectIndex = modalActiveProjectsList.findIndex(p => p.id === projectId || String(p._id) === String(projectId));
  if (modalCurrentProjectIndex < 0) {
    modalActiveProjectsList = allProjects;
    modalCurrentProjectIndex = allProjects.findIndex(p => p.id === projectId || String(p._id) === String(projectId));
  }
  if (modalCurrentProjectIndex < 0) modalCurrentProjectIndex = 0;

  // Calculate coordinates for the circular expansion animation originating from card
  let clickX = window.innerWidth / 2;
  let clickY = window.innerHeight / 2;

  if (event && typeof event.clientX === 'number' && event.clientX > 0) {
    clickX = event.clientX;
    clickY = event.clientY;
  } else if (card) {
    const rect = card.getBoundingClientRect();
    clickX = rect.left + rect.width / 2;
    clickY = rect.top + rect.height / 2;
  }

  // Calculate maximum radius to screen corners
  const maxRadius = Math.ceil(Math.hypot(
    Math.max(clickX, window.innerWidth - clickX),
    Math.max(clickY, window.innerHeight - clickY)
  ));

  modal.style.setProperty('--reveal-x', `${clickX}px`);
  modal.style.setProperty('--reveal-y', `${clickY}px`);
  modal.style.setProperty('--reveal-r', `${maxRadius}px`);

  // Trigger tactile circular expand wave on the clicked card
  if (card) {
    const rect = card.getBoundingClientRect();
    const rippleX = (event && event.clientX ? event.clientX : rect.left + rect.width / 2) - rect.left;
    const rippleY = (event && event.clientY ? event.clientY : rect.top + rect.height / 2) - rect.top;
    const ripple = document.createElement('span');
    ripple.className = 'card-circular-expand-wave';
    ripple.style.left = `${rippleX}px`;
    ripple.style.top = `${rippleY}px`;
    card.appendChild(ripple);
    setTimeout(() => {
      if (ripple.parentNode) ripple.parentNode.removeChild(ripple);
    }, 700);
  }

  // Render project content body
  renderProjectDetailBody(item);

  // Force reflow so initial circle(0px) at card position is registered before expansion
  void modal.offsetWidth;

  modal.classList.add('active');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}
  document.body.style.overflow = 'hidden';
}

// ================= Render Projects (Horizontal Scroll + Click to View Case Study) =================
function renderProjects() {
  const container = document.getElementById('worksFeed');
  const countSubtitle = document.getElementById('worksCountSubtitle');
  if (!container) return;

  const filtered = allProjects.filter(item => matchesCategory(item.type, currentCategory));

  if (countSubtitle) {
    const label = getCategoryDisplayName(currentCategory);
    countSubtitle.textContent = `${label} ${filtered.length} โปรเจกต์`;
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="padding: 40px; text-align: center; color: var(--text-muted); background: #FFFFFF; border-radius: var(--radius-lg); border: 1px solid var(--border-color); width: 100%;">
        ยังไม่มีผลงานในหมวดหมู่นี้
      </div>
    `;
    setupWorksHorizontalScroll();
    return;
  }

  const cardsHtml = filtered.map(item => {
    const toolIcon = getToolIcon(item.type);
    const categoryName = getCategoryDisplayName(item.categoryTag || item.type);
    const projId = item.id || item._id;

    return `
      <article class="figma-project-card" data-category="${item.type}" data-id="${projId}">
        <!-- Top Preview Container (Figma Canvas Preview) -->
        <div class="card-figma-preview-box">
          <img src="${item.imageUrl || '/assets/project_figma_clock.png'}" alt="${escapeHtml(item.title)}" class="figma-preview-img" loading="lazy">
          
          <a href="${item.link}" target="_blank" rel="noopener noreferrer" class="figma-expand-icon" title="เปิดดูผลงานต้นฉบับ" onclick="event.stopPropagation()">
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
              <span>${escapeHtml(item.figmaHeader || (categoryName + ' Project'))}</span>
            </div>
            <div class="figma-edit-time">${item.timeEdited || 'แก้ไขล่าสุด'}</div>
          </div>

          <!-- Category Tag -->
          <div class="figma-category-tag">${categoryName}</div>

          <!-- Title -->
          <h3 class="figma-project-title">${escapeHtml(item.title)}</h3>

          <!-- Description -->
          <p class="figma-project-desc">${escapeHtml(item.summary)}</p>

          <!-- Action Link: ดูโปรเจกต์ ↗ -->
          <a href="${item.link}" target="_blank" rel="noopener noreferrer" class="btn-view-project-link" onclick="event.stopPropagation()">
            <span>${escapeHtml(item.linkText || 'ดูโปรเจกต์')}</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M7 17L17 7M17 7H7M17 7V17"/>
            </svg>
          </a>
        </div>
      </article>
    `;
  }).join('');

  container.innerHTML = cardsHtml;
  container.scrollLeft = 0;

  // Click on card to open Project Detail Modal
  container.querySelectorAll('.figma-project-card').forEach(card => {
    card.addEventListener('click', (e) => {
      // Don't open if clicked direct external links
      if (e.target.closest('.btn-view-project-link') || e.target.closest('.figma-expand-icon')) {
        return;
      }
      const projId = card.getAttribute('data-id');
      if (projId) {
        openProjectDetailModal(projId, e, card);
      }
    });
  });

  setupWorksHorizontalScroll();
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

// ================= Sync Figma Selection Box & Handles =================
function syncFigmaSelectionBox() {
  const box = document.getElementById('figny9-box');
  const h1 = document.getElementById('figny9-adjust-1');
  const h2 = document.getElementById('figny9-adjust-2');
  const h3 = document.getElementById('figny9-adjust-3');
  const h4 = document.getElementById('figny9-adjust-4');
  const whiteBox = document.querySelector('.figma-white-box');

  if (box) {
    box.setAttribute('x', '20');
    box.setAttribute('y', '16');
    box.setAttribute('width', '574');
    box.setAttribute('height', '334');
    box.setAttribute('rx', '16');
  }
  if (whiteBox) {
    whiteBox.setAttribute('x', '20');
    whiteBox.setAttribute('y', '16');
    whiteBox.setAttribute('width', '574');
    whiteBox.setAttribute('height', '334');
    whiteBox.setAttribute('rx', '16');
  }
  if (h1) { h1.setAttribute('x', '15'); h1.setAttribute('y', '11'); }
  if (h2) { h2.setAttribute('x', '589'); h2.setAttribute('y', '11'); }
  if (h3) { h3.setAttribute('x', '15'); h3.setAttribute('y', '345'); }
  if (h4) { h4.setAttribute('x', '589'); h4.setAttribute('y', '345'); }
}

// ================= Figma Bio Featured Works 3D Card Carousel =================
let figmaCarouselTimer = null;
let figmaCarouselIndex = 0;

function initFigmaCarousel() {
  syncFigmaSelectionBox();
  const wrapper = document.getElementById('figmaCarouselWrapper');
  const track = document.getElementById('figmaCarouselTrack');
  const dotsContainer = document.getElementById('figmaCarouselDots');
  if (!wrapper || !track) return;

  const slides = track.querySelectorAll('.figma-carousel-slide');
  if (slides.length === 0) return;

  let isHovered = false;

  const updateDots = (idx) => {
    if (!dotsContainer) return;
    const dots = dotsContainer.querySelectorAll('.figma-carousel-dot');
    dots.forEach((dot, i) => {
      dot.classList.toggle('active', i === idx);
    });
  };

  const goToSlide = (idx) => {
    figmaCarouselIndex = (idx + slides.length) % slides.length;
    track.style.transform = `translateX(-${figmaCarouselIndex * 100}%)`;
    updateDots(figmaCarouselIndex);
  };

  // Click on dots
  if (dotsContainer) {
    dotsContainer.querySelectorAll('.figma-carousel-dot').forEach((dot, idx) => {
      dot.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        goToSlide(idx);
        restartAutoPlay();
      };
    });
  }

  // Auto-play sliding transition (left to right)
  const startAutoPlay = () => {
    stopAutoPlay();
    figmaCarouselTimer = setInterval(() => {
      if (!isHovered) {
        goToSlide(figmaCarouselIndex + 1);
      }
    }, 4500);
  };

  const stopAutoPlay = () => {
    if (figmaCarouselTimer) {
      clearInterval(figmaCarouselTimer);
      figmaCarouselTimer = null;
    }
  };

  const restartAutoPlay = () => {
    stopAutoPlay();
    startAutoPlay();
  };

  wrapper.onmouseenter = () => { isHovered = true; };
  wrapper.onmouseleave = () => { isHovered = false; };

  // Touch swipe support for mobile
  let touchStartX = 0;
  wrapper.ontouchstart = (e) => {
    touchStartX = e.changedTouches[0].screenX;
  };
  wrapper.ontouchend = (e) => {
    const diff = touchStartX - e.changedTouches[0].screenX;
    if (Math.abs(diff) > 35) {
      if (diff > 0) {
        goToSlide(figmaCarouselIndex + 1);
      } else {
        goToSlide(figmaCarouselIndex - 1);
      }
      restartAutoPlay();
    }
  };

  // Card click: open link if clicking CTA button, otherwise smooth scroll to works section
  slides.forEach(slide => {
    const card = slide.querySelector('.card');
    if (card) {
      card.onclick = (e) => {
        const link = card.getAttribute('data-project-link');
        if (e.target.closest('.card__cta') && link) {
          window.open(link, '_blank', 'noopener,noreferrer');
          return;
        }
        e.preventDefault();
        const worksSec = document.getElementById('works');
        if (worksSec) {
          const navHeight = document.querySelector('.site-nav-ref4')?.offsetHeight || 68;
          const targetTop = worksSec.getBoundingClientRect().top + window.scrollY - navHeight - 16;
          window.scrollTo({
            top: Math.max(0, targetTop),
            behavior: 'smooth'
          });
        }
      };
    }
  });

  goToSlide(figmaCarouselIndex);
  startAutoPlay();
}

function updateFigmaCarouselCards(projects) {
  if (!projects || !Array.isArray(projects) || projects.length === 0) return;
  const track = document.getElementById('figmaCarouselTrack');
  const dotsContainer = document.getElementById('figmaCarouselDots');
  if (!track || !dotsContainer) return;

  const featured = projects.slice(0, 5);
  track.innerHTML = featured.map(p => `
    <div class="figma-carousel-slide">
      <div class="card" data-project-id="${p.id}" data-project-link="${p.link || ''}" role="button" tabindex="0" title="คลิกเพื่อดูผลงานนี้">
        <img src="${p.imageUrl || '/assets/project_figma_clock.png'}" alt="${p.title}" class="card__img" loading="lazy">
        <span class="card__badge">${p.categoryTag || p.type}</span>
        <div class="card__content">
          <p class="card__title">${p.title}</p>
          <p class="card__description">${p.summary || ''}</p>
          <div class="card__cta">
            <span class="card__cta-content">
              <span>ดูโปรเจกต์</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M7 17L17 7M17 7H7M17 7V17"/></svg>
            </span>
          </div>
        </div>
      </div>
    </div>
  `).join('');

  dotsContainer.innerHTML = featured.map((_, i) => `
    <button type="button" class="figma-carousel-dot ${i === 0 ? 'active' : ''}" data-index="${i}" aria-label="Slide ${i + 1}"></button>
  `).join('');

  figmaCarouselIndex = 0;
  initFigmaCarousel();
}

function createFigmaBioCardHtml() {
  const cardEl = document.getElementById('figmaCanvasCard');
  return cardEl ? cardEl.outerHTML : '';
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
    e.preventDefault();
    const aboutLink = document.querySelector('.nav-link-item[href="#about"]');
    if (aboutLink) {
      aboutLink.click();
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
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
    { id: 'about', el: document.getElementById('about') || document.getElementById('profile') },
    { id: 'works', el: document.getElementById('works') },
    { id: 'contact', el: document.getElementById('contact') }
  ];

  window.addEventListener('scroll', () => {
    if (isClickScrolling) return;

    const navHeight = document.querySelector('.site-nav-ref4')?.offsetHeight || 68;
    const scrollPos = window.scrollY + navHeight + 80;

    let activeId = 'about';

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



