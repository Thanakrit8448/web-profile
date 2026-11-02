/**
 * Interactive 3D Cursor Tilt for Profile Card
 * Gentle, refined micro-tilt tracking mouse cursor anywhere across the window and over the card
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
      if (Math.abs(diffX) < 0.005 && Math.abs(diffY) < 0.005 && Math.abs(diffScale) < 0.0005) {
        currentRotateX = targetRotateX;
        currentRotateY = targetRotateY;
        currentScale = targetScale;
        rafId = null;
      } else {
        currentRotateX += diffX * 0.08;
        currentRotateY += diffY * 0.08;
        currentScale += diffScale * 0.08;
        rafId = requestAnimationFrame(render);
      }

      card.style.transform = `perspective(1400px) rotateX(${currentRotateX.toFixed(2)}deg) rotateY(${currentRotateY.toFixed(2)}deg) scale3d(${currentScale.toFixed(3)}, ${currentScale.toFixed(3)}, 1)`;

      // Gentle dynamic 3D directional drop shadow
      const shadowX = (-currentRotateY * 0.8).toFixed(1);
      const shadowY = Math.max(6, (currentRotateX * 0.8 + 14)).toFixed(1);
      const shadowBlur = (20 + Math.abs(currentRotateX) * 0.3 + Math.abs(currentRotateY) * 0.3).toFixed(1);
      card.style.boxShadow = `${shadowX}px ${shadowY}px ${shadowBlur}px rgba(0, 0, 0, 0.08), 0 2px 6px rgba(0, 0, 0, 0.04)`;
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
        targetScale = 1.006;
        // Direct local hover tilt (subtle & elegant: max ±4 deg)
        const localX = (clientX - rect.left) / rect.width;
        const localY = (clientY - rect.top) / rect.height;
        targetRotateY = (localX - 0.5) * 8.0; // -4.0deg to +4.0deg
        targetRotateX = -(localY - 0.5) * 7.0; // -3.5deg to +3.5deg

        if (glare) {
          glare.style.opacity = '0.75';
          glare.style.background = `radial-gradient(circle 300px at ${localX * 100}% ${localY * 100}%, rgba(255, 255, 255, 0.22) 0%, rgba(255, 255, 255, 0) 70%)`;
        }
      } else {
        targetScale = 1;
        // Global screen-wide cursor tracking (delicate micro-angle: max ±3 deg)
        const deltaX = (clientX - centerX) / (window.innerWidth / 2);
        const deltaY = (clientY - centerY) / (window.innerHeight / 2);

        const clampedX = Math.max(-1.2, Math.min(1.2, deltaX));
        const clampedY = Math.max(-1.2, Math.min(1.2, deltaY));

        targetRotateY = clampedX * 3.2; // -3.8deg to +3.8deg
        targetRotateX = -clampedY * 2.8; // -3.3deg to +3.3deg

        if (glare) {
          glare.style.opacity = '0.2';
          const glareX = 50 + clampedX * 25;
          const glareY = 50 + clampedY * 25;
          glare.style.background = `radial-gradient(circle 260px at ${glareX}% ${glareY}%, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0) 70%)`;
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

    // Touch support for interactive mobile preview (very gentle)
    card.addEventListener('touchmove', (e) => {
      if (e.touches && e.touches.length === 1) {
        const touch = e.touches[0];
        const rect = card.getBoundingClientRect();
        const localX = (touch.clientX - rect.left) / rect.width;
        const localY = (touch.clientY - rect.top) / rect.height;
        targetRotateY = (localX - 0.5) * 6;
        targetRotateX = -(localY - 0.5) * 6;
        targetScale = 1.005;
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
