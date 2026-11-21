/**
 * Landing Page de Finanzas, Reportes & Automatización - Franco Guerrero
 * Desplazamiento libre continuo, barra de progreso dual (escritorio y encabezado móvil),
 * interacciones táctiles seguras y animaciones livianas por compositor.
 */

let sections = [];
let tickerHasRun = false;
const HEADER_HEIGHT = 56;
const BANNER_STORAGE_KEY = 'rotation_hint_dismissed';
const REDUCED_MOTION_MQ = window.matchMedia('(prefers-reduced-motion: reduce)');
const MOBILE_RAIL_MQ = window.matchMedia('(max-width: 900px)');

let headerEl = null;
let pctEl = null;
let fillEl = null;
let railEl = null;
let mobilePctEl = null;
let mobileFillEl = null;
let mobileProgressEl = null;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

function initApp() {
  sections = Array.from(document.querySelectorAll('.slide-section'));
  headerEl = document.querySelector('.sticky-header-bar');
  pctEl = document.getElementById('scroll-progress-pct');
  fillEl = document.getElementById('scroll-progress-fill');
  railEl = document.getElementById('scroll-progress-rail');
  mobilePctEl = document.getElementById('mobile-scroll-progress-pct');
  mobileFillEl = document.getElementById('mobile-scroll-progress-fill');
  mobileProgressEl = document.getElementById('header-scroll-progress');

  initTouchGuard();
  initRotationBanner();
  syncHeaderHeightVar();
  initScrollTracking();
  initProgressRailClick();
  initAnchorIntercept();
  initCompareBoxHighlight();
  initViewportPauseObserver();
  initRevealObserver();
  initPowerBiSkeletons();
  initHeroEntrance();
  triggerNumberTicker();
  updateScrollProgress();
  alignInitialHash();
}

function initTouchGuard() {
  const isTouch = window.matchMedia('(hover: none), (pointer: coarse)').matches || navigator.maxTouchPoints > 0;
  if (isTouch) {
    document.documentElement.classList.add('is-touch');
  }
  window.addEventListener('touchstart', () => {
    document.documentElement.classList.add('is-touch');
  }, { passive: true, once: true });
}

function getHeaderOffset() {
  return headerEl ? headerEl.offsetHeight : HEADER_HEIGHT;
}

function syncHeaderHeightVar() {
  const h = getHeaderOffset();
  document.documentElement.style.setProperty('--header-height', `${h}px`);
  return h;
}

function alignInitialHash() {
  const hashId = window.location.hash ? window.location.hash.slice(1) : '';
  if (!hashId) return;
  const idx = sections.findIndex(sec => sec.id === hashId);
  if (idx > 0) {
    const targetTop = Math.max(0, Math.round(window.scrollY + sections[idx].getBoundingClientRect().top - getHeaderOffset()));
    window.scrollTo({ top: targetTop, behavior: 'auto' });
    syncHeaderMenuLinks(idx);
    updateScrollProgress();
  }
}

/**
 * 1. Seguimiento de Avance (0% a 100%) y Sección Activa en Menú Superior
 */
function initScrollTracking() {
  let ticking = false;
  const onScroll = () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        updateScrollProgress();
        updateActiveMenuFromScroll();
        ticking = false;
      });
      ticking = true;
    }
  };

  const onResizeOrOrient = () => {
    syncHeaderHeightVar();
    onScroll();
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onResizeOrOrient, { passive: true });
  window.addEventListener('orientationchange', () => {
    setTimeout(onResizeOrOrient, 80);
  });

  if (typeof MOBILE_RAIL_MQ.addEventListener === 'function') {
    MOBILE_RAIL_MQ.addEventListener('change', onResizeOrOrient);
  }
}

function updateScrollProgress() {
  const scrollTop = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;
  const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);

  let ratio = maxScroll > 0 ? Math.max(0, Math.min(1, scrollTop / maxScroll)) : 0;
  if (scrollTop <= 1) ratio = 0;
  if (maxScroll > 0 && scrollTop >= maxScroll - 2) ratio = 1;

  const pct = Math.max(0, Math.min(100, Math.round(ratio * 100)));
  const isComplete = pct === 100;

  if (headerEl) {
    headerEl.classList.toggle('is-scrolled', scrollTop > 12);
  }

  if (pctEl && fillEl) {
    pctEl.textContent = `${pct}%`;
    fillEl.style.transform = `scaleY(${ratio})`;
  }
  if (railEl) {
    railEl.classList.toggle('is-complete', isComplete);
  }

  if (mobilePctEl && mobileFillEl) {
    mobilePctEl.textContent = `${pct}%`;
    mobileFillEl.style.transform = `scaleX(${ratio})`;
  }
  if (mobileProgressEl) {
    mobileProgressEl.classList.toggle('is-complete', isComplete);
  }
}

function initProgressRailClick() {
  const desktopTrack = document.getElementById('scroll-progress-track');
  if (desktopTrack) {
    desktopTrack.addEventListener('click', (e) => {
      const rect = desktopTrack.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
      scrollToProgressRatio(ratio);
    });
  }

  const mobileTrack = document.getElementById('mobile-scroll-progress-track');
  if (mobileTrack) {
    mobileTrack.addEventListener('click', (e) => {
      const rect = mobileTrack.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      scrollToProgressRatio(ratio);
    });
  }
}

function scrollToProgressRatio(ratio) {
  const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
  window.scrollTo({
    top: Math.round(ratio * maxScroll),
    behavior: REDUCED_MOTION_MQ.matches ? 'auto' : 'smooth'
  });
}

function updateActiveMenuFromScroll() {
  if (sections.length === 0) return;

  const scrollTop = window.scrollY || window.pageYOffset || 0;
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;

  let activeIndex = 0;
  if (maxScroll > 0 && scrollTop >= maxScroll - 20) {
    activeIndex = sections.length - 1;
  } else {
    const focusY = scrollTop + getHeaderOffset() + window.innerHeight * 0.35;
    sections.forEach((sec, idx) => {
      if (sec.offsetTop <= focusY) {
        activeIndex = idx;
      }
    });
  }

  syncHeaderMenuLinks(activeIndex);
}

function syncHeaderMenuLinks(targetIndex) {
  const mappedIndex = (targetIndex >= 3 && targetIndex <= 4) ? 3 : targetIndex;
  document.querySelectorAll('.nav-menu-link').forEach(link => {
    const linkIdx = parseInt(link.getAttribute('data-slide-index'), 10);
    link.classList.toggle('active', linkIdx === mappedIndex);
  });
}

/**
 * 2. Desplazamiento Suave a Secciones por Índice
 */
function goToSlide(targetIndex) {
  if (sections.length === 0) {
    sections = Array.from(document.querySelectorAll('.slide-section'));
  }
  if (targetIndex < 0 || targetIndex >= sections.length) return;

  const targetEl = sections[targetIndex];
  const headerOffset = syncHeaderHeightVar();
  const targetTop = targetIndex === 0
    ? 0
    : Math.max(0, Math.round(window.scrollY + targetEl.getBoundingClientRect().top - headerOffset));

  window.scrollTo({
    top: targetTop,
    behavior: REDUCED_MOTION_MQ.matches ? 'auto' : 'smooth'
  });

  syncHeaderMenuLinks(targetIndex);
  if (window.history && window.history.replaceState && targetEl.id) {
    window.history.replaceState(null, '', '#' + targetEl.id);
  }

  if (targetEl.classList.contains('powerbi-slide') && !REDUCED_MOTION_MQ.matches) {
    const infoCard = targetEl.querySelector('.powerbi-info-card');
    if (infoCard) {
      infoCard.classList.remove('is-arriving');
      void infoCard.offsetWidth;
      infoCard.classList.add('is-arriving');
      const clearArrive = () => infoCard.classList.remove('is-arriving');
      infoCard.addEventListener('animationend', clearArrive, { once: true });
      setTimeout(clearArrive, 700);
    }
  }
}

/**
 * 3. Selección de Paquetes Freelance y Envío de Mensaje Directo
 */
function selectServiceTier(tierValue, triggerEl) {
  document.querySelectorAll('.pricing-tier-item').forEach(item => {
    const isSelected = triggerEl ? item === triggerEl : item.getAttribute('data-tier') === tierValue;
    item.classList.toggle('active', isSelected);
  });

  const serviceSelect = document.getElementById('quote-service');
  if (serviceSelect && tierValue) {
    serviceSelect.value = tierValue;
    if (!REDUCED_MOTION_MQ.matches) {
      serviceSelect.classList.remove('is-flashing');
      void serviceSelect.offsetWidth;
      serviceSelect.classList.add('is-flashing');
      const clearFlash = () => serviceSelect.classList.remove('is-flashing');
      serviceSelect.addEventListener('animationend', clearFlash, { once: true });
      setTimeout(clearFlash, 750);
    }
  }

  const nameInput = document.getElementById('quote-name');
  const goalInput = document.getElementById('quote-goal');
  if (nameInput && !nameInput.value.trim()) {
    nameInput.focus();
  } else if (goalInput) {
    goalInput.focus();
  }
}

function quoteSpecificService(tierValue) {
  const contactIdx = sections.findIndex(sec => sec.id === 'contacto');
  if (contactIdx !== -1) {
    goToSlide(contactIdx);
  }
  setTimeout(() => {
    selectServiceTier(tierValue, null);
  }, REDUCED_MOTION_MQ.matches ? 50 : 450);
}

function handleQuoteSubmit(channel) {
  const nameInput = document.getElementById('quote-name');
  const serviceSelect = document.getElementById('quote-service');
  const goalInput = document.getElementById('quote-goal');

  const name = (nameInput && nameInput.value.trim()) ? nameInput.value.trim() : 'Cliente interesado';
  const service = (serviceSelect && serviceSelect.value) ? serviceSelect.value : 'Automatización Financiera & BI';
  const goal = (goalInput && goalInput.value.trim()) ? goalInput.value.trim() : 'Me gustaría conversar sobre este servicio y conocer el alcance.';

  if (channel === 'email') {
    const subject = encodeURIComponent(`Consulta: ${service} - ${name}`);
    const body = encodeURIComponent(
      `Hola Franco,\n\nSoy ${name}.\n\nEstoy interesado en: ${service}.\nDetalle o proceso a resolver: ${goal}\n\nQuedo atento para coordinar una breve reunión.`
    );
    window.location.href = `mailto:guerrerofranco1429@gmail.com?subject=${subject}&body=${body}`;
    return;
  }

  const waMessage = encodeURIComponent(
    `Hola Franco, soy *${name}*. Vi tu portafolio y me interesa consultar por: *${service}*.\n\nProceso o consulta: ${goal}`
  );
  window.open(`https://wa.me/51960748142?text=${waMessage}`, '_blank', 'noopener,noreferrer');
}

/**
 * 4. Animación de Métricas Cuantitativas (Number Ticker + Incremento en Vivo)
 */
function triggerNumberTicker() {
  if (tickerHasRun) return;
  const metricElements = document.querySelectorAll('.metric-num[data-ticker-target]');
  if (metricElements.length === 0) return;

  tickerHasRun = true;
  metricElements.forEach(el => {
    const target = parseInt(el.getAttribute('data-ticker-target'), 10);
    const prefix = el.getAttribute('data-ticker-prefix') || '';
    const suffix = el.getAttribute('data-ticker-suffix') || '';
    const liveStepMs = parseInt(el.getAttribute('data-live-increment'), 10);
    const onDone = liveStepMs > 0 ? () => startLiveMetricIncrement(el, target, prefix, suffix, liveStepMs) : null;

    if (REDUCED_MOTION_MQ.matches) {
      el.textContent = `${prefix}${target}${suffix}`;
      if (onDone) onDone();
    } else {
      animateValue(el, 0, target, 1100, prefix, suffix, onDone);
    }
  });
}

function animateValue(obj, start, end, duration, prefix, suffix, onComplete) {
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
      if (typeof onComplete === 'function') onComplete();
    }
  };
  window.requestAnimationFrame(step);
}

function startLiveMetricIncrement(el, startValue, prefix, suffix, intervalMs) {
  let count = startValue;
  let isVisible = true;
  let timerId = null;

  const syncTimer = () => {
    const shouldRun = isVisible && !document.hidden && !REDUCED_MOTION_MQ.matches;
    if (shouldRun && !timerId) {
      timerId = window.setInterval(() => {
        count += 1;
        el.textContent = `${prefix}${count}${suffix}`;
      }, intervalMs);
    } else if (!shouldRun && timerId) {
      window.clearInterval(timerId);
      timerId = null;
    }
  };

  const cardEl = el.closest('.metric-card') || el;
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        isVisible = entry.isIntersecting;
        syncTimer();
      });
    }, { threshold: 0.05 });
    io.observe(cardEl);
  }

  document.addEventListener('visibilitychange', syncTimer);
  if (typeof REDUCED_MOTION_MQ.addEventListener === 'function') {
    REDUCED_MOTION_MQ.addEventListener('change', syncTimer);
  }

  syncTimer();
}

/**
 * 5. Resaltado Interactivo Antes/Después (Mouse, Táctil y Teclado)
 */
function initCompareBoxHighlight() {
  const boxes = Array.from(document.querySelectorAll('.compare-box'));
  if (boxes.length === 0) return;

  const toggleBox = (box) => {
    const stack = box.closest('.compare-stack');
    if (!stack) return;
    const siblingBoxes = Array.from(stack.querySelectorAll('.compare-box'));
    const willHighlight = !box.classList.contains('is-highlighted');

    siblingBoxes.forEach(item => {
      if (item === box) {
        item.classList.toggle('is-highlighted', willHighlight);
        item.classList.remove('is-dimmed');
        item.setAttribute('aria-pressed', String(willHighlight));
      } else {
        item.classList.remove('is-highlighted');
        item.classList.toggle('is-dimmed', willHighlight);
        item.setAttribute('aria-pressed', 'false');
      }
    });
  };

  boxes.forEach(box => {
    box.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleBox(box);
    });
    box.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleBox(box);
      }
    });
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.compare-stack')) {
      boxes.forEach(item => {
        item.classList.remove('is-highlighted', 'is-dimmed');
        item.setAttribute('aria-pressed', 'false');
      });
    }
  });
}

/**
 * 6. Pausa Automática Fuera de Pantalla y Pestaña Oculta
 */
function initViewportPauseObserver() {
  const syncTabState = () => {
    document.body.classList.toggle('is-tab-hidden', document.hidden);
  };
  document.addEventListener('visibilitychange', syncTabState);
  syncTabState();

  const targets = document.querySelectorAll('.metric-card, .border-beam-card, .card, .powerbi-slide');
  if (!('IntersectionObserver' in window)) {
    targets.forEach(el => el.classList.add('is-in-view'));
    return;
  }

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      entry.target.classList.toggle('is-in-view', entry.isIntersecting);
    });
  }, { rootMargin: '50px 0px', threshold: 0.01 });

  targets.forEach(el => io.observe(el));
}

/**
 * 7. Entradas Escalonadas (Hero < 0.8s y Resultados / Medidores)
 */
function initHeroEntrance() {
  if (REDUCED_MOTION_MQ.matches) {
    document.documentElement.classList.add('hero-ready');
    return;
  }
  window.setTimeout(() => {
    document.documentElement.classList.add('hero-ready');
  }, 780);
}

function initRevealObserver() {
  const revealTargets = Array.from(document.querySelectorAll('.result-compare-card, #respaldo .service-bento-card'));
  if (revealTargets.length === 0) return;

  const markRevealed = (el) => {
    el.classList.add('is-revealed');
    if (el.classList.contains('result-compare-card')) {
      window.setTimeout(() => {
        el.style.transitionDelay = '0ms';
      }, 600);
    }
  };

  if (REDUCED_MOTION_MQ.matches || !('IntersectionObserver' in window)) {
    revealTargets.forEach(markRevealed);
    return;
  }

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        markRevealed(entry.target);
        io.unobserve(entry.target);
      }
    });
  }, { rootMargin: '0px 0px -6% 0px', threshold: 0.08 });

  revealTargets.forEach(el => io.observe(el));
}

/**
 * 8. Skeleton de Carga en Tableros Power BI
 */
function initPowerBiSkeletons() {
  const frames = document.querySelectorAll('.powerbi-frame-card');
  frames.forEach(card => {
    const iframe = card.querySelector('iframe');
    if (!iframe) {
      card.classList.add('is-loaded');
      return;
    }

    const markLoaded = () => card.classList.add('is-loaded');
    iframe.addEventListener('load', markLoaded, { once: true });
    window.setTimeout(markLoaded, 4500);
  });
}

/**
 * 9. Interceptación de Enlaces de Ancla Internos (#)
 */
function initAnchorIntercept() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const targetId = this.getAttribute('href').replace('#', '');
      if (!targetId) return;
      const index = sections.findIndex(sec => sec.id === targetId);
      if (index !== -1) {
        e.preventDefault();
        goToSlide(index);
      }
    });
  });
}

/**
 * 10. Control del Banner de Sugerencia de Rotación en Celular
 */
function initRotationBanner() {
  const banner = document.getElementById('rotation-hint-banner');
  const dismissBtn = document.getElementById('btn-dismiss-banner');
  if (!banner) return;

  if (typeof sessionStorage !== 'undefined') {
    try {
      if (sessionStorage.getItem(BANNER_STORAGE_KEY) === 'true') {
        banner.classList.add('is-dismissed');
        return;
      }
    } catch (err) {
      banner.dataset.storageRestricted = 'true';
    }
  }

  if (dismissBtn) {
    dismissBtn.addEventListener('click', () => {
      banner.classList.add('is-dismissed');
      syncHeaderHeightVar();
      if (typeof sessionStorage !== 'undefined') {
        try {
          sessionStorage.setItem(BANNER_STORAGE_KEY, 'true');
        } catch (err) {
          banner.dataset.storageRestricted = 'true';
        }
      }
    });
  }
}

window.goToSlide = goToSlide;
window.selectServiceTier = selectServiceTier;
window.quoteSpecificService = quoteSpecificService;
window.handleQuoteSubmit = handleQuoteSubmit;
