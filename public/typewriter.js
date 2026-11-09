/**
 * Smooth Grapheme-Aware Fast Typewriter for Profile Bio Section
 * Accurately clusters Thai vowels and tone marks so they type cleanly
 */
(function() {
  function getGraphemes(text) {
    if (typeof Intl !== 'undefined' && Intl.Segmenter) {
      const segmenter = new Intl.Segmenter('th', { granularity: 'grapheme' });
      return Array.from(segmenter.segment(text), s => s.segment);
    }
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

    const rawTitle = titleEl.getAttribute('data-raw') || 'ยินดีที่ได้รู้จักครับ';
    const rawSub = subEl.getAttribute('data-raw') || 'ผมสนใจงาน UX/UI designer และสนใจงาน Video Editing สามารถชมผลงานได้ด้านล่างเลยครับ';

    // Respect prefers-reduced-motion: instantly display text without animation
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      titleEl.textContent = rawTitle;
      subEl.textContent = rawSub;
      if (titleCursor) titleCursor.style.display = 'none';
      if (subCursor) subCursor.style.display = 'none';
      return;
    }

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
      titleEl.textContent = '';
      subEl.textContent = '';
      if (titleCursor) titleCursor.style.display = 'inline-block';
      if (subCursor) subCursor.style.display = 'none';

      let currentStep = 0;

      // 1. Fast Type Title (~28ms per character)
      titleGraphemes.forEach((char, index) => {
        const delay = 200 + index * 28;
        const t = setTimeout(() => {
          titleEl.textContent += char;
        }, delay);
        timeouts.push(t);
        currentStep = delay;
      });

      // 2. Short pause between title and subtitle (~160ms)
      currentStep += 160;
      const pauseT = setTimeout(() => {
        if (titleCursor) titleCursor.style.display = 'none';
        if (subCursor) subCursor.style.display = 'inline-block';
      }, currentStep);
      timeouts.push(pauseT);

      // 3. Fast Type Subtitle (~16ms per character, very brisk & snappy)
      subGraphemes.forEach((char, index) => {
        const delay = currentStep + (index + 1) * 16;
        const t = setTimeout(() => {
          subEl.textContent += char;
        }, delay);
        timeouts.push(t);
        if (index === subGraphemes.length - 1) {
          currentStep = delay;
        }
      });

      // 4. On finish: keep plain text and remove cursor | completely
      const finishT = setTimeout(() => {
        subEl.textContent = rawSub;
        if (subCursor) subCursor.style.display = 'none';
        if (titleCursor) titleCursor.style.display = 'none';
        isTyping = false;
      }, currentStep + 60);
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

    // Expose programmatic update for dynamic profile fetching
    window.reinitBioTypewriter = function(newTitle, newSub) {
      if (newTitle) {
        titleEl.setAttribute('data-raw', newTitle);
      }
      if (newSub) {
        subEl.setAttribute('data-raw', newSub);
      }
      if (!isTyping) {
        if (newTitle) titleEl.textContent = newTitle;
        if (newSub) subEl.textContent = newSub;
      }
    };

    // Start typing on initial load
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      setTimeout(startTyping, 250);
    } else {
      window.addEventListener('DOMContentLoaded', () => {
        setTimeout(startTyping, 250);
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTypewriter);
  } else {
    initTypewriter();
  }
})();
