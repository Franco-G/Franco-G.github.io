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
  initContactForm();
  initHeroShowcase();
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
 * 3. Selección de Solución y Envío de Mensaje Directo
 */
const CONTACT_EMAIL = 'guerrerofranco1429@gmail.com';
const SERVICE_PLACEHOLDERS = {
  'Estados financieros automatizados': 'Ej. Automatizar balance general, ERI y cuentas sin destino desde mi reporte contable.',
  'Macros y plantillas en Excel': 'Ej. Macro para carga masiva de compras, ventas o planillas sin digitar a mano.',
  'Tableros en Power BI y Excel': 'Ej. Conciliación bancaria automática, cruces SUNAT o tablero de caja y cobranzas.',
  'Pack 62 plantillas en Excel': 'Ej. Quiero cotizar un servicio a medida y llevarme gratis el Pack de 62 plantillas en Excel.',
  'Consulta general / Otro proyecto': 'Ej. Cuéntame qué archivo, reporte o flujo mensual te quita más horas.'
};

function clearNameValidation() {
  const nameInput = document.getElementById('quote-name');
  const nameError = document.getElementById('quote-name-error');
  if (nameInput) {
    nameInput.classList.remove('is-invalid');
    nameInput.removeAttribute('aria-invalid');
  }
  if (nameError) {
    nameError.hidden = true;
  }
}

function initContactForm() {
  const nameInput = document.getElementById('quote-name');
  if (nameInput) {
    nameInput.addEventListener('input', clearNameValidation);
  }

  const pills = Array.from(document.querySelectorAll('.service-pill-btn'));
  pills.forEach((pill, index) => {
    pill.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowDown' && e.key !== 'ArrowLeft' && e.key !== 'ArrowUp') return;
      e.preventDefault();
      const step = (e.key === 'ArrowRight' || e.key === 'ArrowDown') ? 1 : -1;
      const nextPill = pills[(index + step + pills.length) % pills.length];
      if (nextPill) {
        selectServiceTier(nextPill.getAttribute('data-service'), nextPill, false);
        nextPill.focus();
      }
    });
  });
}

function selectServiceTier(tierValue, triggerEl, shouldFocus = false) {
  let activePill = null;
  document.querySelectorAll('.service-pill-btn').forEach(item => {
    const isSelected = triggerEl ? item === triggerEl : item.getAttribute('data-service') === tierValue;
    item.classList.toggle('active', isSelected);
    item.setAttribute('aria-checked', isSelected ? 'true' : 'false');
    if (isSelected) activePill = item;
  });

  const resolvedValue = tierValue || (activePill ? activePill.getAttribute('data-service') : '');
  const serviceInput = document.getElementById('quote-service');
  if (serviceInput && resolvedValue) {
    serviceInput.value = resolvedValue;
  }

  const goalInput = document.getElementById('quote-goal');
  if (goalInput && SERVICE_PLACEHOLDERS[resolvedValue]) {
    goalInput.placeholder = SERVICE_PLACEHOLDERS[resolvedValue];
  }

  if (activePill && !triggerEl && !REDUCED_MOTION_MQ.matches) {
    activePill.classList.remove('is-flashing');
    void activePill.offsetWidth;
    activePill.classList.add('is-flashing');
    const clearFlash = () => activePill.classList.remove('is-flashing');
    activePill.addEventListener('animationend', clearFlash, { once: true });
    setTimeout(clearFlash, 750);
  }

  if (shouldFocus) {
    const nameInput = document.getElementById('quote-name');
    if (nameInput && !nameInput.value.trim()) {
      nameInput.focus();
    } else if (goalInput) {
      goalInput.focus();
    }
  }
}

function quoteSpecificService(tierValue) {
  const contactIdx = sections.findIndex(sec => sec.id === 'contacto');
  if (contactIdx !== -1) {
    goToSlide(contactIdx);
  }
  setTimeout(() => {
    selectServiceTier(tierValue, null, true);
  }, REDUCED_MOTION_MQ.matches ? 50 : 450);
}

function showQuoteFeedback(message, allowCopyEmail) {
  const feedbackEl = document.getElementById('quote-feedback');
  const feedbackTextEl = document.getElementById('quote-feedback-text');
  const copyBtn = document.getElementById('copy-email-btn');
  if (!feedbackEl || !feedbackTextEl) return;

  feedbackTextEl.textContent = message;
  if (copyBtn) {
    copyBtn.textContent = 'Copiar correo';
    copyBtn.hidden = !allowCopyEmail;
  }
  feedbackEl.hidden = false;
}

function copyContactEmail() {
  const copyBtn = document.getElementById('copy-email-btn');
  const feedbackTextEl = document.getElementById('quote-feedback-text');
  const confirmCopied = () => {
    if (copyBtn) copyBtn.textContent = 'Correo copiado';
    if (feedbackTextEl) feedbackTextEl.textContent = `Dirección copiada: ${CONTACT_EMAIL}`;
  };
  const showManualCopy = () => {
    if (feedbackTextEl) feedbackTextEl.textContent = `Escríbeme directo a ${CONTACT_EMAIL}`;
  };

  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(CONTACT_EMAIL).then(confirmCopied, showManualCopy);
    return;
  }

  const tempInput = document.createElement('input');
  tempInput.value = CONTACT_EMAIL;
  tempInput.setAttribute('readonly', '');
  tempInput.style.position = 'absolute';
  tempInput.style.left = '-9999px';
  document.body.appendChild(tempInput);
  tempInput.select();
  const copied = document.execCommand('copy');
  document.body.removeChild(tempInput);
  if (copied) {
    confirmCopied();
  } else {
    showManualCopy();
  }
}

function handleQuoteSubmit(channel) {
  const nameInput = document.getElementById('quote-name');
  const nameError = document.getElementById('quote-name-error');
  const serviceInput = document.getElementById('quote-service');
  const goalInput = document.getElementById('quote-goal');

  const rawName = nameInput ? nameInput.value.trim() : '';
  if (!rawName) {
    if (nameInput) {
      nameInput.classList.add('is-invalid');
      nameInput.setAttribute('aria-invalid', 'true');
      nameInput.focus();
    }
    if (nameError) {
      nameError.hidden = false;
    }
    return;
  }

  clearNameValidation();
  const service = (serviceInput && serviceInput.value) ? serviceInput.value : 'Automatización Financiera & BI';
  const goal = (goalInput && goalInput.value.trim()) ? goalInput.value.trim() : 'Me gustaría conversar sobre este servicio y conocer el alcance.';

  if (channel === 'email') {
    const subject = encodeURIComponent(`Consulta: ${service} - ${rawName}`);
    const body = encodeURIComponent(
      `Hola Franco,\n\nSoy ${rawName}.\n\nEstoy interesado en: ${service}.\nDetalle o proceso a resolver: ${goal}\n\nQuedo atento para coordinar una breve reunión.`
    );
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
    showQuoteFeedback('Se abrió tu aplicación de correo con el mensaje listo.', true);
    return;
  }

  const waMessage = encodeURIComponent(
    `Hola Franco, soy *${rawName}*. Vi tu portafolio y me interesa consultar por: *${service}*.\n\nProceso o consulta: ${goal}`
  );
  window.open(`https://wa.me/51960748142?text=${waMessage}`, '_blank', 'noopener,noreferrer');
  showQuoteFeedback('Se abrió WhatsApp con tu consulta lista para enviar.', false);
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

/**
 * 11. Vitrina Rotativa en Portada y Visor Galería de Muestras en Excel
 */
const GALLERY_SAMPLES = [
  {
    src: 'muestras/muestra-balances-pcge.png',
    shortLabel: 'Estado de Flujos de Efectivo (PCGE)',
    title: 'Estado de Flujos de Efectivo (PCGE / SMV)',
    caption: 'Modelo real estructurado en Excel con cuentas contables peruanas en Soles.',
    service: 'Estados financieros automatizados'
  },
  {
    src: 'muestras/muestra-transacciones-pcge.png',
    shortLabel: 'Registro de Transacciones (PCGE 2019)',
    title: 'Registro de Transacciones Contables (PCGE)',
    caption: 'Vista real en Excel con validaciones, totales en Soles y clasificación por cuenta.',
    service: 'Macros y plantillas en Excel'
  },
  {
    src: 'muestras/muestra-tablero-financiero.png',
    shortLabel: 'Dashboard Económico Financiero (S/)',
    title: 'Dashboard Económico Financiero en Excel',
    caption: 'Tablero real en Soles con Ganancias y Pérdidas, Balance General, TIR y WACC.',
    service: 'Tableros en Power BI y Excel'
  },
  {
    src: 'muestras/muestra-conciliacion-bancaria.png',
    shortLabel: 'Conciliación Bancaria Mensual',
    title: 'Conciliación Bancaria y Validación en Excel',
    caption: 'Control de depósitos, saldos y estado de conciliación con filtros dinámicos.',
    service: 'Tableros en Power BI y Excel'
  },
  {
    src: 'muestras/muestra-pack-62.png',
    shortLabel: 'Pack 62 Plantillas en Excel',
    title: 'Pack 62 Plantillas en Excel',
    caption: 'Muestra real de 3 plantillas incluidas gratis al concretar cualquier servicio pagado.',
    service: 'Pack 62 plantillas en Excel'
  }
];

let heroSlideIndex = 0;
let heroShowcaseTimer = null;
let heroShowcasePaused = false;
let currentGalleryIndex = 0;
let lastModalTrigger = null;

function restartHeroProgress() {
  const fill = document.getElementById('hero-showcase-progress-fill');
  if (!fill) return;
  fill.classList.remove('is-animating');
  if (REDUCED_MOTION_MQ.matches) return;
  void fill.offsetWidth;
  fill.classList.add('is-animating');
}

function setHeroSlide(index) {
  const slides = document.querySelectorAll('.hero-showcase-slide');
  const tabs = document.querySelectorAll('.hero-tab-btn');
  const labelEl = document.getElementById('hero-showcase-label');
  if (slides.length === 0) return;

  heroSlideIndex = ((index % slides.length) + slides.length) % slides.length;
  slides.forEach((slide, i) => {
    slide.classList.toggle('is-active', i === heroSlideIndex);
  });
  tabs.forEach((tab, i) => {
    const active = i === heroSlideIndex;
    tab.classList.toggle('is-active', active);
    tab.setAttribute('aria-selected', active ? 'true' : 'false');
  });

  const info = GALLERY_SAMPLES[heroSlideIndex];
  if (labelEl && info) {
    labelEl.textContent = info.shortLabel;
  }
  restartHeroProgress();
  scheduleHeroShowcase();
}

function scheduleHeroShowcase() {
  if (heroShowcaseTimer) {
    clearTimeout(heroShowcaseTimer);
    heroShowcaseTimer = null;
  }
  if (REDUCED_MOTION_MQ.matches || heroShowcasePaused || document.hidden) return;
  const modal = document.getElementById('sample-lightbox');
  if (modal && !modal.hidden) return;

  heroShowcaseTimer = setTimeout(() => {
    setHeroSlide(heroSlideIndex + 1);
  }, 4000);
}

function initHeroShowcase() {
  const showcase = document.getElementById('hero-showcase');
  if (!showcase) return;

  showcase.addEventListener('mouseenter', () => {
    heroShowcasePaused = true;
    scheduleHeroShowcase();
  });
  showcase.addEventListener('mouseleave', () => {
    heroShowcasePaused = false;
    scheduleHeroShowcase();
  });
  showcase.addEventListener('focusin', () => {
    heroShowcasePaused = true;
    scheduleHeroShowcase();
  });
  showcase.addEventListener('focusout', (e) => {
    if (!showcase.contains(e.relatedTarget)) {
      heroShowcasePaused = false;
      scheduleHeroShowcase();
    }
  });
  document.addEventListener('visibilitychange', () => {
    scheduleHeroShowcase();
  });

  setHeroSlide(0);
}

function openCurrentHeroSample() {
  const sample = GALLERY_SAMPLES[heroSlideIndex] || GALLERY_SAMPLES[0];
  openSampleModal(sample.src, sample.title, sample.caption, sample.service);
}

function renderModalSample(sample) {
  const imgEl = document.getElementById('sample-lightbox-img');
  const titleEl = document.getElementById('sample-lightbox-title');
  const captionEl = document.getElementById('sample-lightbox-caption');
  const counterEl = document.getElementById('sample-lightbox-counter');
  const ctaBtn = document.getElementById('sample-lightbox-cta');
  if (!imgEl || !titleEl || !captionEl) return;

  imgEl.src = sample.src;
  imgEl.alt = sample.title || 'Captura real en Microsoft Excel';
  titleEl.textContent = sample.title || 'Muestra real en Excel';
  captionEl.textContent = sample.caption || '';

  if (counterEl) {
    counterEl.textContent = `${currentGalleryIndex + 1} / ${GALLERY_SAMPLES.length}`;
  }
  if (ctaBtn) {
    ctaBtn.onclick = () => {
      closeSampleModal();
      quoteSpecificService(sample.service || 'Consulta general / Otro proyecto');
    };
  }
}

function openSampleModal(imgSrc, title, caption, serviceValue) {
  const modal = document.getElementById('sample-lightbox');
  const closeBtn = document.getElementById('sample-lightbox-close');
  if (!modal) return;

  lastModalTrigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  const foundIdx = GALLERY_SAMPLES.findIndex(s => s.src === imgSrc);
  currentGalleryIndex = foundIdx !== -1 ? foundIdx : 0;

  const activeSample = foundIdx !== -1
    ? GALLERY_SAMPLES[foundIdx]
    : { src: imgSrc, title, caption, service: serviceValue };

  renderModalSample({
    src: imgSrc || activeSample.src,
    title: title || activeSample.title,
    caption: caption || activeSample.caption,
    service: serviceValue || activeSample.service
  });

  modal.hidden = false;
  document.documentElement.style.overflow = 'hidden';
  scheduleHeroShowcase();
  if (closeBtn) closeBtn.focus();
}

function stepSampleModal(delta) {
  const modal = document.getElementById('sample-lightbox');
  if (!modal || modal.hidden) return;
  currentGalleryIndex = (currentGalleryIndex + delta + GALLERY_SAMPLES.length) % GALLERY_SAMPLES.length;
  renderModalSample(GALLERY_SAMPLES[currentGalleryIndex]);
}

function closeSampleModal() {
  const modal = document.getElementById('sample-lightbox');
  const imgEl = document.getElementById('sample-lightbox-img');
  if (!modal || modal.hidden) return;

  modal.hidden = true;
  document.documentElement.style.overflow = '';
  if (imgEl) imgEl.removeAttribute('src');
  scheduleHeroShowcase();
  if (lastModalTrigger && typeof lastModalTrigger.focus === 'function') {
    lastModalTrigger.focus();
  }
  lastModalTrigger = null;
}

document.addEventListener('keydown', (e) => {
  const modal = document.getElementById('sample-lightbox');
  if (!modal || modal.hidden) return;
  if (e.key === 'Escape') {
    closeSampleModal();
  } else if (e.key === 'ArrowLeft') {
    e.preventDefault();
    stepSampleModal(-1);
  } else if (e.key === 'ArrowRight') {
    e.preventDefault();
    stepSampleModal(1);
  }
});

window.goToSlide = goToSlide;
window.selectServiceTier = selectServiceTier;
window.quoteSpecificService = quoteSpecificService;
window.handleQuoteSubmit = handleQuoteSubmit;
window.copyContactEmail = copyContactEmail;
window.setHeroSlide = setHeroSlide;
window.openCurrentHeroSample = openCurrentHeroSample;
window.openSampleModal = openSampleModal;
window.stepSampleModal = stepSampleModal;
window.closeSampleModal = closeSampleModal;
