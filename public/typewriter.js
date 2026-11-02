/**
 * Smooth Grapheme-Aware Typewriter for Profile Bio Section
 * Accurately clusters Thai vowels, tone marks and emojis so they type without clipping
 */
(function() {
  function getGraphemes(text) {
    if (typeof Intl !== 'undefined' && Intl.Segmenter) {
      const segmenter = new Intl.Segmenter('th', { granularity: 'grapheme' });
      return Array.from(segmenter.segment(text), s => s.segment);
    }
    // Fallback regex matching Thai consonants with attached combining marks
    const matches = text.match(/[\u0E00-\u0E7F][\u0E31\u0E34-\u0E3A\u0E47-\u0E4E]*|[^\u0E00-\u0E7F]/g);
    return matches || Array.from(text);
  }

  function initTypewriter() {
    const titleEl = document.getElementById('bioTypedTitle');
    const subEl = document.getElementById('bioTypedSub');
    const titleCursor = document.getElementById('bioTitleCursor');
    const subCursor = document.getElementById('bioSubCursor');
    const container = document.getElementById('bioTypingContainer');

    if (!titleEl || !subEl) return;

    const rawTitle = titleEl.getAttribute('data-raw') || 'ไงครับ ผมไอซ์ 👋';
    const rawSub = subEl.getAttribute('data-raw') || 'ผมสนใจงาน UX/UI designer และสนใจงาน Video Editing สามารถชมผลงานได้ด้านล่างเลยครับ';

    const titleGraphemes = getGraphemes(rawTitle);
    const subGraphemes = getGraphemes(rawSub);

    let isTyping = false;
    let timeouts = [];

    function clearAllTimeouts() {
      timeouts.forEach(t => clearTimeout(t));
      timeouts = [];
    }

    function startTyping() {
      if (isTyping) return;
      isTyping = true;
      clearAllTimeouts();

      // Reset
      titleEl.innerHTML = '';
      subEl.innerHTML = '';
      if (titleCursor) titleCursor.style.display = 'inline-block';
      if (subCursor) subCursor.style.display = 'none';

      let currentStep = 0;

      // 1. Type Title
      titleGraphemes.forEach((char, index) => {
        const delay = 350 + index * 65;
        const t = setTimeout(() => {
          if (char === '👋') {
            titleEl.innerHTML += '<span class="wave-emoji">👋</span>';
          } else {
            titleEl.textContent += char;
          }
        }, delay);
        timeouts.push(t);
        currentStep = delay;
      });

      // 2. Pause between title and subtitle
      currentStep += 400;
      const pauseT = setTimeout(() => {
        if (titleCursor) titleCursor.style.display = 'none';
        if (subCursor) subCursor.style.display = 'inline-block';
      }, currentStep);
      timeouts.push(pauseT);

      // 3. Type Subtitle
      subGraphemes.forEach((char, index) => {
        const delay = currentStep + (index + 1) * 32;
        const t = setTimeout(() => {
          subEl.textContent += char;
        }, delay);
        timeouts.push(t);
        if (index === subGraphemes.length - 1) {
          currentStep = delay;
        }
      });

      // 4. On finish, enrich subtitle with nice keyword highlights
      const finishT = setTimeout(() => {
        subEl.innerHTML = `ผมสนใจงาน <span class="bio-text-highlight">UX/UI designer</span> และสนใจงาน <span class="bio-text-highlight">Video Editing</span> สามารถชมผลงานได้ด้านล่างเลยครับ`;
        isTyping = false;
      }, currentStep + 100);
      timeouts.push(finishT);
    }

    // Replay on click
    if (container) {
      container.addEventListener('click', () => {
        if (!isTyping) {
          startTyping();
        }
      });
    }

    // Start typing on initial load
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      setTimeout(startTyping, 400);
    } else {
      window.addEventListener('DOMContentLoaded', () => {
        setTimeout(startTyping, 400);
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTypewriter);
  } else {
    initTypewriter();
  }
})();
