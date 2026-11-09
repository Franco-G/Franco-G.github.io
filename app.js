/**
 * Portafolio de Business Intelligence & Finanzas - Franco Guerrero
 * Controlador de Diapositivas 100vh, Navegación Asistida y Magic UI.
 * Código Vanilla JS puro, sin librerías externas ni código huérfano.
 */

let slides = [];
let currentSlideIndex = 0;
let isAnimating = false;
let wheelDeltaAccumulator = 0;
let wheelCooldownTimeout = null;
let lastSlideTransitionTime = 0;
let lastDeckMode = null;
let resizeDebounceTimer = null;

const SLIDE_TRANSITION_MS = 650;
const WHEEL_COOLDOWN_MS = 750;
const WHEEL_THRESHOLD = 45;
const BANNER_STORAGE_KEY = 'rotation_hint_dismissed';

/**
 * Determina si la aplicación opera en Modo Presentación (Deck 100vh)
 * o en Modo Reporte Continuo (Scroll vertical nativo en celular vertical).
 */
function isDeckMode() {
  const isLandscape = window.matchMedia && window.matchMedia('(orientation: landscape)').matches;
  const isWideScreen = window.innerWidth > 900;
  return Boolean(isWideScreen || isLandscape);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

function initApp() {
  initSlideEngine();
  initNavControls();
  initAnchorIntercept();
  initOrientationSync();
  initRotationBanner();
}

/**
 * 1. Inicialización e Indexación Dinámica de Diapositivas
 */
function initSlideEngine() {
  const wrapper = document.getElementById('slides-wrapper');
  if (!wrapper) return;

  const slideElements = document.querySelectorAll('.slide-section');
  slides = Array.from(slideElements).map(el => el.id);
  if (slides.length === 0) return;

  // Intercepción de Rueda de Ratón / Touchpad con protección anti-inercia (750ms)
  window.addEventListener('wheel', (e) => {
    if (!isDeckMode()) {
      return; // Permite el desplazamiento nativo en celular vertical
    }
    e.preventDefault();
    const now = Date.now();

    if (isAnimating || (now - lastSlideTransitionTime < WHEEL_COOLDOWN_MS)) {
      wheelDeltaAccumulator = 0;
      return;
    }

    wheelDeltaAccumulator += e.deltaY;
    clearTimeout(wheelCooldownTimeout);
    wheelCooldownTimeout = setTimeout(() => {
      wheelDeltaAccumulator = 0;
    }, 150);

    if (wheelDeltaAccumulator >= WHEEL_THRESHOLD) {
      wheelDeltaAccumulator = 0;
      if (currentSlideIndex < slides.length - 1) {
        goToSlide(currentSlideIndex + 1);
      }
    } else if (wheelDeltaAccumulator <= -WHEEL_THRESHOLD) {
      wheelDeltaAccumulator = 0;
      if (currentSlideIndex > 0) {
        goToSlide(currentSlideIndex - 1);
      }
    }
  }, { passive: false });

  // Navegación asistida por teclado
  window.addEventListener('keydown', (e) => {
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;
    if (!isDeckMode()) return; // Permite la navegación nativa por teclado en celular vertical

    if (['ArrowDown', 'PageDown', ' '].includes(e.key) || e.code === 'Space') {
      e.preventDefault();
      if (!isAnimating && currentSlideIndex < slides.length - 1) {
        goToSlide(currentSlideIndex + 1);
      }
    } else if (['ArrowUp', 'PageUp'].includes(e.key)) {
      e.preventDefault();
      if (!isAnimating && currentSlideIndex > 0) {
        goToSlide(currentSlideIndex - 1);
      }
    } else if (e.key === 'Home') {
      e.preventDefault();
      if (!isAnimating) {
        goToSlide(0);
      }
    } else if (e.key === 'End') {
      e.preventDefault();
      if (!isAnimating) {
        goToSlide(slides.length - 1);
      }
    }
  });

  // Soporte para gestos táctiles (Swipe)
  let touchStartY = 0;
  let touchStartX = 0;
  window.addEventListener('touchstart', (e) => {
    if (e.touches && e.touches.length > 0) {
      touchStartY = e.touches[0].clientY;
      touchStartX = e.touches[0].clientX;
    }
  }, { passive: true });

  window.addEventListener('touchend', (e) => {
    if (!isDeckMode()) return; // Permite desplazamiento libre con el pulgar en celular vertical
    if (isAnimating) return;
    if (e.changedTouches && e.changedTouches.length > 0) {
      const diffY = touchStartY - e.changedTouches[0].clientY;
      const diffX = touchStartX - e.changedTouches[0].clientX;

      if (Math.abs(diffY) > 50 && Math.abs(diffY) > Math.abs(diffX)) {
        if (diffY > 0 && currentSlideIndex < slides.length - 1) {
          goToSlide(currentSlideIndex + 1);
        } else if (diffY < 0 && currentSlideIndex > 0) {
          goToSlide(currentSlideIndex - 1);
        }
      }
    }
  }, { passive: true });

  // Sincronización de hash URL al cargar
  const initialHash = window.location.hash.replace('#', '');
  const initialIdx = slides.indexOf(initialHash);
  if (initialIdx > 0) {
    goToSlide(initialIdx);
  } else {
    goToSlide(0);
  }
}

/**
 * 2. Transición Asistida entre Diapositivas (100vh Exactos)
 */
function goToSlide(targetIndex) {
  if (targetIndex < 0 || targetIndex >= slides.length) return;

  // En celular vertical, realizar desplazamiento suave nativo
  if (!isDeckMode()) {
    currentSlideIndex = targetIndex;
    const slideId = slides[targetIndex];
    const targetElement = document.getElementById(slideId);

    if (targetIndex === 0) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth' });
    }

    if (window.history && window.history.replaceState && slideId) {
      window.history.replaceState(null, '', '#' + slideId);
    }

    document.querySelectorAll('.slide-section').forEach((sec, idx) => {
      const isActive = idx === targetIndex;
      sec.classList.toggle('active', isActive);
      sec.setAttribute('aria-hidden', isActive ? 'false' : 'true');
    });

    if (targetIndex === 0) {
      triggerNumberTicker();
    }
    return;
  }

  // En Modo Deck (Escritorio y Celular Apaisado 100vh)
  if (isAnimating) return;

  const wrapper = document.getElementById('slides-wrapper');
  if (targetIndex === currentSlideIndex && wrapper && wrapper.style.transform) {
    if (targetIndex === 0) {
      triggerNumberTicker();
    }
    return;
  }

  isAnimating = true;
  lastSlideTransitionTime = Date.now();
  currentSlideIndex = targetIndex;
  const slideId = slides[targetIndex];

  // Desplazar contenedor maestro
  if (wrapper) {
    wrapper.style.transform = `translateY(-${targetIndex * 100}vh)`;
  }

  // Sincronizar clases activas y accesibilidad en diapositivas
  document.querySelectorAll('.slide-section').forEach((sec, idx) => {
    const isActive = idx === targetIndex;
    sec.classList.toggle('active', isActive);
    sec.setAttribute('aria-hidden', isActive ? 'false' : 'true');
  });

  // Sincronizar indicador de puntos laterales
  document.querySelectorAll('.scrolly-nav-dot').forEach((dot, idx) => {
    const isActive = idx === targetIndex;
    dot.classList.toggle('active', isActive);
    dot.setAttribute('aria-current', isActive ? 'true' : 'false');
  });

  // Sincronizar botones de control visible y contador
  updateNavControlsState();

  // Actualizar URL sin recargar la página
  if (window.history && window.history.replaceState && slideId) {
    window.history.replaceState(null, '', '#' + slideId);
  }

  // Disparar animación de métricas en diapositiva de inicio
  if (targetIndex === 0) {
    triggerNumberTicker();
  }

  // Liberar bloqueo de animación tras la transición CSS (650ms + 30ms margen)
  setTimeout(() => {
    isAnimating = false;
  }, SLIDE_TRANSITION_MS + 30);
}

/**
 * 3. Controles Visibles de Navegación (Dock Flotante)
 */
function initNavControls() {
  const prevBtn = document.getElementById('slide-nav-prev');
  const nextBtn = document.getElementById('slide-nav-next');

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      if (!isAnimating && currentSlideIndex > 0) {
        goToSlide(currentSlideIndex - 1);
      }
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      if (!isAnimating && currentSlideIndex < slides.length - 1) {
        goToSlide(currentSlideIndex + 1);
      }
    });
  }

  updateNavControlsState();
}

function updateNavControlsState() {
  const prevBtn = document.getElementById('slide-nav-prev');
  const nextBtn = document.getElementById('slide-nav-next');
  const counterCurrent = document.querySelector('.slide-nav-current');
  const counterTotal = document.querySelector('.slide-nav-total');

  if (prevBtn) {
    const isFirst = currentSlideIndex === 0;
    prevBtn.disabled = isFirst;
    prevBtn.classList.toggle('disabled', isFirst);
    prevBtn.setAttribute('aria-disabled', isFirst ? 'true' : 'false');
  }

  if (nextBtn) {
    const isLast = currentSlideIndex === slides.length - 1;
    nextBtn.disabled = isLast;
    nextBtn.classList.toggle('disabled', isLast);
    nextBtn.setAttribute('aria-disabled', isLast ? 'true' : 'false');
  }

  if (counterCurrent) {
    counterCurrent.textContent = String(currentSlideIndex + 1).padStart(2, '0');
  }
  if (counterTotal) {
    counterTotal.textContent = String(slides.length).padStart(2, '0');
  }
}

/**
 * 4. Pestañas Interactivas en Diapositiva 2 (Experiencia)
 */
function manualSwitchTab(tabId) {
  document.querySelectorAll('.tab-group .tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
  });
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.toggle('active', content.id === 'tab-' + tabId);
  });
}

/**
 * 5. Animación de Métricas Cuantitativas (Number Ticker)
 */
function triggerNumberTicker() {
  const metricElements = document.querySelectorAll('.metric-num[data-ticker-target]');
  if (metricElements.length === 0) return;

  metricElements.forEach(el => {
    const target = parseInt(el.getAttribute('data-ticker-target'), 10);
    const prefix = el.getAttribute('data-ticker-prefix') || '';
    const suffix = el.getAttribute('data-ticker-suffix') || '';
    animateValue(el, 0, target, 1100, prefix, suffix);
  });
}

function animateValue(obj, start, end, duration, prefix, suffix) {
  let startTimestamp = null;
  const step = (timestamp) => {
    if (!startTimestamp) startTimestamp = timestamp;
    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3);
    const current = Math.floor(ease * (end - start) + start);
    obj.textContent = `${prefix}${current}${suffix}`;
    if (progress < 1) {
      window.requestAnimationFrame(step);
    } else {
      obj.textContent = `${prefix}${end}${suffix}`;
    }
  };
  window.requestAnimationFrame(step);
}

/**
 * 6. Interceptación de Enlaces de Ancla Internos (#)
 */
function initAnchorIntercept() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const targetId = this.getAttribute('href').replace('#', '');
      if (!targetId) return;
      const index = slides.indexOf(targetId);
      if (index !== -1) {
        e.preventDefault();
        goToSlide(index);
      }
    });
  });
}

/**
 * 7. Sincronización Dinámica de Orientación y Modo de Visualización
 */
function findCurrentVisibleSlideIndex() {
  const sections = document.querySelectorAll('.slide-section');
  if (sections.length === 0) return 0;

  const viewportMiddle = window.innerHeight / 2;
  let closestIndex = 0;
  let minDistance = Infinity;

  sections.forEach((sec, idx) => {
    const rect = sec.getBoundingClientRect();
    const secMiddle = rect.top + rect.height / 2;
    const distance = Math.abs(secMiddle - viewportMiddle);
    if (distance < minDistance) {
      minDistance = distance;
      closestIndex = idx;
    }
  });

  return closestIndex;
}

function handleViewportModeChange() {
  clearTimeout(resizeDebounceTimer);
  resizeDebounceTimer = setTimeout(() => {
    const currentlyDeck = isDeckMode();

    if (currentlyDeck !== lastDeckMode) {
      const wrapper = document.getElementById('slides-wrapper');

      if (currentlyDeck) {
        // Conmutación a Modo Deck (Horizontal / Escritorio)
        const targetIndex = currentSlideIndex;
        currentSlideIndex = -1;
        window.scrollTo(0, 0);
        if (wrapper) {
          wrapper.style.transform = `translateY(-${targetIndex * 100}vh)`;
        }
        goToSlide(targetIndex);
      } else {
        // Conmutación a Modo Reporte Continuo (Celular Vertical)
        if (wrapper) {
          wrapper.style.transform = '';
        }
        const targetSec = document.getElementById(slides[currentSlideIndex]);
        if (targetSec) {
          targetSec.scrollIntoView({ behavior: 'instant', block: 'start' });
        }
      }

      lastDeckMode = currentlyDeck;
    }
  }, 120);
}

function initOrientationSync() {
  lastDeckMode = isDeckMode();

  // Rastrear la diapositiva visible durante el desplazamiento vertical en celular
  let portraitScrollDebounce = null;
  window.addEventListener('scroll', () => {
    if (isDeckMode() || isDeckMode() !== lastDeckMode) return;
    clearTimeout(portraitScrollDebounce);
    portraitScrollDebounce = setTimeout(() => {
      if (isDeckMode() || isDeckMode() !== lastDeckMode) return;
      currentSlideIndex = findCurrentVisibleSlideIndex();
    }, 50);
  }, { passive: true });

  const orientationQuery = window.matchMedia('(orientation: landscape)');
  if (orientationQuery.addEventListener) {
    orientationQuery.addEventListener('change', handleViewportModeChange);
  } else if (orientationQuery.addListener) {
    orientationQuery.addListener(handleViewportModeChange);
  }

  window.addEventListener('resize', handleViewportModeChange);

  if ('onorientationchange' in window) {
    window.addEventListener('orientationchange', handleViewportModeChange);
  }
}

/**
 * 8. Control del Banner de Sugerencia de Rotación y Persistencia en Sesión
 */
function initRotationBanner() {
  const banner = document.getElementById('rotation-hint-banner');
  const dismissBtn = document.getElementById('btn-dismiss-banner');
  if (!banner) return;

  if (typeof sessionStorage !== 'undefined') {
    try {
      const isDismissed = sessionStorage.getItem(BANNER_STORAGE_KEY);
      if (isDismissed === 'true') {
        banner.classList.add('is-dismissed');
        banner.style.display = 'none';
        return;
      }
    } catch (e) {
      // Entorno con almacenamiento restringido
    }
  }

  if (dismissBtn) {
    dismissBtn.addEventListener('click', () => {
      banner.classList.add('is-dismissed');
      banner.style.display = 'none';
      if (typeof sessionStorage !== 'undefined') {
        try {
          sessionStorage.setItem(BANNER_STORAGE_KEY, 'true');
        } catch (e) {
          // Entorno con almacenamiento restringido
        }
      }
    });
  }
}

// Exportar funciones globales para llamadas inline en HTML y suite de pruebas
window.goToSlide = goToSlide;
window.manualSwitchTab = manualSwitchTab;
window.isDeckMode = isDeckMode;
