/**
 * Interactive 3D Cursor Tilt for Profile Card
 * Seamlessly tracks mouse cursor anywhere across the window and over the card
 */
(function() {
  function initCardTilt() {
    const card = document.getElementById('profileCardInteractive');
    const glare = document.getElementById('profileCardGlare');
    if (!card) return;

    // Check prefers-reduced-motion
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    let targetRotateX = 0;
    let targetRotateY = 0;
    let currentRotateX = 0;
    let currentRotateY = 0;
    let targetScale = 1;
    let currentScale = 1;
    let rafId = null;
    let lastPointer = null;

    function render() {
      const diffX = targetRotateX - currentRotateX;
      const diffY = targetRotateY - currentRotateY;
      const diffScale = targetScale - currentScale;

      // Stop loop when close to rest to save CPU
      if (Math.abs(diffX) < 0.01 && Math.abs(diffY) < 0.01 && Math.abs(diffScale) < 0.001) {
        currentRotateX = targetRotateX;
        currentRotateY = targetRotateY;
        currentScale = targetScale;
        rafId = null;
      } else {
        currentRotateX += diffX * 0.12;
        currentRotateY += diffY * 0.12;
        currentScale += diffScale * 0.12;
        rafId = requestAnimationFrame(render);
      }

      card.style.transform = `perspective(1100px) rotateX(${currentRotateX.toFixed(2)}deg) rotateY(${currentRotateY.toFixed(2)}deg) scale3d(${currentScale.toFixed(3)}, ${currentScale.toFixed(3)}, 1)`;

      // Dynamic 3D directional drop shadow
      const shadowX = (-currentRotateY * 1.3).toFixed(1);
      const shadowY = Math.max(6, (currentRotateX * 1.3 + 18)).toFixed(1);
      const shadowBlur = (26 + Math.abs(currentRotateX) * 0.5 + Math.abs(currentRotateY) * 0.5).toFixed(1);
      card.style.boxShadow = `${shadowX}px ${shadowY}px ${shadowBlur}px rgba(0, 0, 0, 0.09), 0 2px 8px rgba(0, 0, 0, 0.04)`;
    }

    function requestRender() {
      if (!rafId) {
        rafId = requestAnimationFrame(render);
      }
    }

    function updateFromPointer(clientX, clientY) {
      if (window.innerWidth <= 860) return; // Disable tilt on mobile touch screens for natural tap scrolling

      const rect = card.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const isInside = (
        clientX >= rect.left &&
        clientX <= rect.right &&
        clientY >= rect.top &&
        clientY <= rect.bottom
      );

      if (isInside) {
        targetScale = 1.018;
        // Direct local hover tilt (intense & responsive)
        const localX = (clientX - rect.left) / rect.width;
        const localY = (clientY - rect.top) / rect.height;
        targetRotateY = (localX - 0.5) * 22; // -11deg to +11deg
        targetRotateX = -(localY - 0.5) * 22; // -11deg to +11deg

        if (glare) {
          glare.style.opacity = '1';
          glare.style.background = `radial-gradient(circle 320px at ${localX * 100}% ${localY * 100}%, rgba(255, 255, 255, 0.28) 0%, rgba(255, 255, 255, 0) 70%)`;
        }
      } else {
        targetScale = 1;
        // Global screen-wide cursor tracking (card gracefully looks toward cursor)
        const deltaX = (clientX - centerX) / (window.innerWidth / 2);
        const deltaY = (clientY - centerY) / (window.innerHeight / 2);

        const clampedX = Math.max(-1.3, Math.min(1.3, deltaX));
        const clampedY = Math.max(-1.3, Math.min(1.3, deltaY));

        targetRotateY = clampedX * 9.5;
        targetRotateX = -clampedY * 8.5;

        if (glare) {
          glare.style.opacity = '0.35';
          const glareX = 50 + clampedX * 35;
          const glareY = 50 + clampedY * 35;
          glare.style.background = `radial-gradient(circle 280px at ${glareX}% ${glareY}%, rgba(255, 255, 255, 0.16) 0%, rgba(255, 255, 255, 0) 70%)`;
        }
      }

      requestRender();
    }

    // Global pointer move listener
    window.addEventListener('pointermove', (e) => {
      lastPointer = { clientX: e.clientX, clientY: e.clientY };
      updateFromPointer(e.clientX, e.clientY);
    }, { passive: true });

    // Track when scrolling so card rect updates in real-time
    window.addEventListener('scroll', () => {
      if (lastPointer) {
        updateFromPointer(lastPointer.clientX, lastPointer.clientY);
      }
    }, { passive: true });

    // Reset smoothly when mouse leaves window
    document.addEventListener('mouseleave', () => {
      targetRotateX = 0;
      targetRotateY = 0;
      targetScale = 1;
      if (glare) glare.style.opacity = '0';
      requestRender();
    });

    // Touch support for interactive mobile preview
    card.addEventListener('touchmove', (e) => {
      if (e.touches && e.touches.length === 1) {
        const touch = e.touches[0];
        const rect = card.getBoundingClientRect();
        const localX = (touch.clientX - rect.left) / rect.width;
        const localY = (touch.clientY - rect.top) / rect.height;
        targetRotateY = (localX - 0.5) * 16;
        targetRotateX = -(localY - 0.5) * 16;
        targetScale = 1.015;
        requestRender();
      }
    }, { passive: true });

    card.addEventListener('touchend', () => {
      targetRotateX = 0;
      targetRotateY = 0;
      targetScale = 1;
      if (glare) glare.style.opacity = '0';
      requestRender();
    }, { passive: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCardTilt);
  } else {
    initCardTilt();
  }
})();
