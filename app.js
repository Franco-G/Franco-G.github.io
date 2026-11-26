/**
 * Landing Page de Finanzas, Reportes & Automatización - Franco Guerrero
 * Desplazamiento libre continuo, barra de progreso dual (escritorio y encabezado móvil),
 * interacciones táctiles seguras y animaciones livianas por compositor.
 */

let sections = [];
let tickerHasRun = false;
const HEADER_HEIGHT = 56;
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
  initContactForm();
  initExcelShowcase();
  syncHeaderHeightVar();
  initScrollTracking();
  initProgressRailClick();
  initAnchorIntercept();
  initCompareBoxHighlight();
  initViewportPauseObserver();
  initRevealObserver();
  initCardSpotlight();
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
  document.querySelectorAll('.nav-menu-link').forEach(link => {
    const linkIdx = parseInt(link.getAttribute('data-slide-index'), 10);
    link.classList.toggle('active', linkIdx === targetIndex);
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
}

/**
 * 3. Selección de Solución y Envío de Mensaje Directo (Formspree)
 */
const CONTACT_EMAIL = 'guerrerofranco1429@gmail.com';
const FORM_ENDPOINT = 'https://formspree.io/f/xgakqpok';
const SERVICE_PLACEHOLDERS = {
  'Flujo de caja': 'Ej. Ordenar flujo de caja en Soles y Dólares desde nuestro Libro Mayor CSV.',
  'Limpieza de libros': 'Ej. Unificar Excels mensuales de compras o ventas y preparar archivo para carga masiva.',
  'Conciliación digital': 'Ej. Cruzar extractos bancarios con reportes de Yape, Plin o Culqi y comisiones.',
  'Consulta general': 'Ej. Cuéntame brevemente qué archivo o reporte quieres ordenar y lo revisamos.'
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

function clearEmailValidation() {
  const emailInput = document.getElementById('quote-email');
  const emailError = document.getElementById('quote-email-error');
  if (emailInput) {
    emailInput.classList.remove('is-invalid');
    emailInput.removeAttribute('aria-invalid');
  }
  if (emailError) {
    emailError.hidden = true;
  }
}

function initContactForm() {
  const nameInput = document.getElementById('quote-name');
  const emailInput = document.getElementById('quote-email');
  if (nameInput) {
    nameInput.addEventListener('input', clearNameValidation);
  }
  if (emailInput) {
    emailInput.addEventListener('input', clearEmailValidation);
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

  updateDiagnosticEstimate();

  if (activePill && !triggerEl && !REDUCED_MOTION_MQ.matches) {
    activePill.classList.remove('is-flashing');
    void activePill.offsetWidth;
    activePill.classList.add('is-flashing');
    const clearFlash = () => activePill.classList.remove('is-flashing');
    activePill.addEventListener('animationend', clearFlash, { once: true });
    setTimeout(clearFlash, 750);
  }

  if (shouldFocus) {
    goToDiagStep(1);
  }
}

const SERVICE_HINTS = {
  'Flujo de caja': 'Ref. desde S/ 250 · Entrega 3 a 5 días',
  'Limpieza de libros': 'Ref. desde S/ 200 · Entrega 2 a 4 días',
  'Conciliación digital': 'Ref. desde S/ 250 · Entrega 3 a 5 días',
  'Consulta general': 'Cotización cerrada tras revisar muestra'
};

function trackEvent(eventName) {
  try {
    if (window.goatcounter && typeof window.goatcounter.count === 'function') {
      window.goatcounter.count({
        path: `evento/${eventName}`,
        title: eventName,
        event: true
      });
    }
  } catch (e) {
    // Analítica opcional: nunca interrumpe la navegación
  }
}

function getDiagnosticState() {
  const serviceInput = document.getElementById('quote-service');
  const volumeEl = document.getElementById('diag-volume');
  const hoursEl = document.getElementById('diag-hours');
  const sourceEl = document.getElementById('diag-source');

  const service = (serviceInput && serviceInput.value) ? serviceInput.value : 'Flujo de caja';
  const volume = volumeEl ? volumeEl.value : '6 a 20 archivos';
  const hoursRaw = hoursEl ? parseInt(hoursEl.value, 10) : 15;
  const hoursLabel = (hoursEl && hoursEl.selectedOptions[0]) ? hoursEl.selectedOptions[0].textContent : '10 a 20 horas';
  const source = sourceEl ? sourceEl.value : 'Excel o archivo exportado';
  const volumeFactor = volume.startsWith('1 a 5') ? 0.65 : (volume.startsWith('Más') ? 0.78 : 0.72);
  const savedHours = Math.max(3, Math.round((Number.isFinite(hoursRaw) ? hoursRaw : 15) * volumeFactor));

  return {
    service,
    volume,
    hoursRaw,
    hoursLabel,
    source,
    savedHours,
    hint: SERVICE_HINTS[service] || SERVICE_HINTS['Consulta general']
  };
}

function updateDiagnosticEstimate() {
  const state = getDiagnosticState();
  const savedEl = document.getElementById('diag-hours-saved');
  const hintEl = document.getElementById('diag-scope-hint');
  const summaryEl = document.getElementById('diag-summary-text');

  if (savedEl) {
    const nextText = `~${state.savedHours} horas/mes`;
    if (savedEl.textContent !== nextText) {
      savedEl.textContent = nextText;
      if (!REDUCED_MOTION_MQ.matches) {
        savedEl.classList.remove('is-updated');
        void savedEl.offsetWidth;
        savedEl.classList.add('is-updated');
      }
    }
  }
  if (hintEl) hintEl.textContent = state.hint;
  if (summaryEl) {
    summaryEl.textContent = `${state.service} · ${state.volume} · ~${state.savedHours} h/mes ahorradas`;
  }
}

function goToDiagStep(step) {
  const step1 = document.getElementById('diag-step-1');
  const step2 = document.getElementById('diag-step-2');
  const badge = document.getElementById('diag-step-badge');
  if (!step1 || !step2) return;

  updateDiagnosticEstimate();
  const isStep2 = step === 2;
  step1.hidden = isStep2;
  step2.hidden = !isStep2;

  if (badge) {
    badge.textContent = isStep2
      ? 'Paso 2 de 2 · Envía tu resumen'
      : 'Paso 1 de 2 · Calcula tu ahorro';
  }

  if (isStep2) {
    trackEvent('diagnostico-calculado');
    const nameInput = document.getElementById('quote-name');
    if (nameInput && !nameInput.value.trim()) {
      nameInput.focus();
    }
  }
}

function openDiagnosticWhatsApp() {
  const state = getDiagnosticState();
  const nameInput = document.getElementById('quote-name');
  const goalInput = document.getElementById('quote-goal');
  const name = nameInput && nameInput.value.trim() ? `Soy ${nameInput.value.trim()}. ` : '';
  const extra = goalInput && goalInput.value.trim() ? ` Detalle: ${goalInput.value.trim()}` : '';

  const text = `Hola Franco, ${name}hice el diagnóstico en tu web: necesito ordenar "${state.service}" (${state.volume}, hoy pierdo ${state.hoursLabel}/mes, origen: ${state.source}, ahorro estimado ~${state.savedHours} h/mes).${extra}`;
  trackEvent('consulta-whatsapp-click');
  window.open(`https://wa.me/51921689711?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
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

function showQuoteFeedback(message, allowCopyEmail, isError = false) {
  const feedbackEl = document.getElementById('quote-feedback');
  const feedbackTextEl = document.getElementById('quote-feedback-text');
  const copyBtn = document.getElementById('copy-email-btn');
  if (!feedbackEl || !feedbackTextEl) return;

  feedbackTextEl.textContent = message;
  feedbackEl.classList.toggle('is-error', isError);
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

async function handleQuoteSubmit() {
  const nameInput = document.getElementById('quote-name');
  const nameError = document.getElementById('quote-name-error');
  const emailInput = document.getElementById('quote-email');
  const emailError = document.getElementById('quote-email-error');
  const serviceInput = document.getElementById('quote-service');
  const goalInput = document.getElementById('quote-goal');
  const submitBtn = document.getElementById('quote-submit-btn');

  const rawName = nameInput ? nameInput.value.trim() : '';
  const rawEmail = emailInput ? emailInput.value.trim() : '';
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawEmail);

  let hasError = false;
  if (!rawName) {
    if (nameInput) {
      nameInput.classList.add('is-invalid');
      nameInput.setAttribute('aria-invalid', 'true');
      nameInput.focus();
    }
    if (nameError) nameError.hidden = false;
    hasError = true;
  } else {
    clearNameValidation();
  }

  if (!emailValid) {
    if (emailInput) {
      emailInput.classList.add('is-invalid');
      emailInput.setAttribute('aria-invalid', 'true');
      if (!hasError) emailInput.focus();
    }
    if (emailError) emailError.hidden = false;
    hasError = true;
  } else {
    clearEmailValidation();
  }

  if (hasError) return;

  const diag = getDiagnosticState();
  const service = (serviceInput && serviceInput.value) ? serviceInput.value : diag.service;
  const goal = (goalInput && goalInput.value.trim()) ? goalInput.value.trim() : 'Sin detalle adicional.';

  const originalBtnText = submitBtn ? submitBtn.textContent : '';
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Enviando...';
  }

  try {
    const response = await fetch(FORM_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        nombre_o_empresa: rawName,
        email: rawEmail,
        modalidad: service,
        volumen_mensual: diag.volume,
        horas_actuales: diag.hoursLabel,
        origen_datos: diag.source,
        ahorro_estimado: `~${diag.savedHours} horas/mes`,
        mensaje: goal,
        _subject: `Diagnóstico web: ${service} (~${diag.savedHours}h/mes) - ${rawName}`
      })
    });

    const result = await response.json().catch(() => ({}));
    if (!response.ok || result.errors) {
      throw new Error('send-failed');
    }

    if (nameInput) nameInput.value = '';
    if (emailInput) emailInput.value = '';
    if (goalInput) goalInput.value = '';
    trackEvent('consulta-formspree-enviada');
    showQuoteFeedback(`¡Listo! Tu diagnóstico llegó directo a mi correo. Te responderé en menos de 24 horas a ${rawEmail}.`, false, false);
  } catch (err) {
    showQuoteFeedback(`No se pudo enviar automáticamente ahora. Escríbeme por WhatsApp o copia mi correo (${CONTACT_EMAIL}):`, true, true);
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = originalBtnText || 'Enviar por correo';
    }
  }
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

  const targets = document.querySelectorAll('.metric-card, .border-beam-card, .card');
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
  const revealTargets = Array.from(document.querySelectorAll(
    '.result-compare-card, .service-bento-card, .case-real-card, .workflow-strip-card, .promo-bonus-card, .contact-card'
  ));
  if (revealTargets.length === 0) return;

  const markRevealed = (el) => {
    el.classList.add('is-revealed');
    window.setTimeout(() => {
      el.style.transitionDelay = '0ms';
    }, 550);
  };

  if (REDUCED_MOTION_MQ.matches || !('IntersectionObserver' in window)) {
    revealTargets.forEach(markRevealed);
    return;
  }

  revealTargets.forEach((el) => {
    const parent = el.parentElement;
    if (!parent) return;
    const siblings = Array.from(parent.children).filter(child => revealTargets.includes(child));
    const siblingIndex = siblings.indexOf(el);
    if (siblingIndex > 0) {
      el.style.transitionDelay = `${Math.min(siblingIndex, 3) * 65}ms`;
    }
  });

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        markRevealed(entry.target);
        io.unobserve(entry.target);
      }
    });
  }, { rootMargin: '0px 0px -6% 0px', threshold: 0.06 });

  revealTargets.forEach(el => io.observe(el));
}

function initCardSpotlight() {
  if (REDUCED_MOTION_MQ.matches) return;
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  document.querySelectorAll('.card').forEach(card => {
    let rafId = 0;
    card.addEventListener('pointermove', (e) => {
      if (rafId) return;
      rafId = window.requestAnimationFrame(() => {
        const rect = card.getBoundingClientRect();
        card.style.setProperty('--spot-x', `${Math.round(e.clientX - rect.left)}px`);
        card.style.setProperty('--spot-y', `${Math.round(e.clientY - rect.top)}px`);
        rafId = 0;
      });
    }, { passive: true });
  });
}

/**
 * 8. Interceptación de Enlaces de Ancla Internos (#)
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
 * 9. Vitrina Grande de Plantillas en Excel y Visor Ampliado
 */

const GALLERY_SAMPLES = [
  {
    cat: 'Flujo Cuenta 10',
    badge: 'Soles y Dólares',
    showcaseTitle: 'Flujo en caja',
    desc: 'De un Libro Mayor plano a flujo real PEN y USD sin cambiar tu sistema.',
    flowIn: 'Libro Mayor exportado',
    flowProc: 'Filtro Cuenta 10 + TC editable',
    flowOut: 'Flujo real en PEN y USD',
    rawTitle: 'Exportación típica de Libro Mayor (crudo)',
    rawIssues: ['Fechas mixtas', 'Cuentas mezcladas', 'Sin tipo de cambio'],
    rawHeaders: ['Cuenta', 'Fecha', 'Glosa sistema', 'Mon', 'Importe'],
    rawRows: [
      ['104101', '03-oct-26', 'TRF CLI-09 FACT 412', 'PEN', '4820.00', false],
      ['104201', '2026/10/04', 'ABONO USD REXT-11', 'USD', '1250.00', true],
      ['421200', '05/10/2026', 'PROV SERV LOGISTICO', 'PEN', '-1980.00', true],
      ['104102', '06.10.26', 'LIQ CULQI LOTE 04', 'PEN', '8129.51', false]
    ],
    src: 'muestras/muestra-flujo-cuenta10.png',
    title: 'Flujo de Caja Cuenta 10 (Soles y Dólares)',
    caption: 'Modelo propio creado desde cero con datos ficticios de ejemplo. Puedes descargarlo gratis y probarlo en tu Excel.',
    service: 'Flujo de caja'
  },
  {
    cat: 'Pasarelas y Bancos',
    badge: 'En Soles (S/)',
    showcaseTitle: 'Cruce de pasarelas',
    desc: 'Boletas de Yape, Plin y Culqi cruzadas contra extractos bancarios separando comisiones.',
    flowIn: 'Boletas pasarelas + extracto',
    flowProc: 'Cruce neto y cálculo de comisión',
    flowOut: 'Cuadre diario con alertas claras',
    rawTitle: 'Reportes sueltos de pasarela vs. banco (crudo)',
    rawIssues: ['Comisión oculta', 'Sin cruzar abono', 'Lotes sin estado'],
    rawHeaders: ['Fecha', 'Canal', 'Boleta', 'Bruto S/', 'Observación'],
    rawRows: [
      ['03/11/26', 'Culqi POS', 'B001-04169', '6940.00', 'Falta comisión', true],
      ['04/11/26', 'Plin', 'B001-04216', '3510.00', 'Sin conciliar BCP', true],
      ['05/11/26', 'Culqi Web', 'B001-04261', '8420.00', 'Abono parcial', true],
      ['13/11/26', 'Culqi POS', 'B001-04585', '1240.00', 'Pendiente abono', true]
    ],
    src: 'muestras/muestra-conciliacion-pasarelas.png',
    title: 'Conciliación de Yape, Plin y Culqi vs. Extracto Bancario',
    caption: 'Muestra propia en Soles (datos ficticios) cruzando lotes de boletas, comisiones y abonos bancarios.',
    service: 'Conciliación digital'
  },
  {
    cat: 'Consolidación Mensual',
    badge: 'Carga masiva',
    showcaseTitle: 'Consolidado de libros',
    desc: 'Unificación de Excels mensuales dispares en una sola salida depurada lista para cargar.',
    flowIn: 'Excels mensuales dispares',
    flowProc: 'Limpieza, depuración y formato único',
    flowOut: 'Archivo validado para carga masiva',
    rawTitle: 'Excels mensuales con formatos distintos (crudo)',
    rawIssues: ['Columnas movidas', 'Filas duplicadas', 'IGV sin validar'],
    rawHeaders: ['Mes', 'Doc / RUC', 'Fecha', 'Importe', 'Alerta'],
    rawRows: [
      ['Ene-26', '20541120911', '12/01/26', '84520.00', 'Encabezado fila 5', true],
      ['2026-02', 'F001-00214', '14-feb', '1240.00', 'Fila duplicada', true],
      ['Mar 26', '20601988210', '2026.03.19', '96400.00', 'Formato texto', true],
      ['2026-04', 'B002-01822', '08/04/2026', '91250.00', 'IGV desfasado', true]
    ],
    src: 'muestras/muestra-consolidacion-libros.png',
    title: 'Control de Unificación y Carga Masiva de Libros',
    caption: 'Muestra propia en Soles (datos ficticios) estandarizando periodos mensuales listos para carga masiva.',
    service: 'Limpieza de libros'
  }
];

let excelSlideIndex = 0;
let excelShowcaseTimer = null;
let excelShowcasePaused = false;
let kitchenViewMode = 'clean';
let currentGalleryIndex = 0;
let lastModalTrigger = null;

function renderKitchenRawPanel(sample) {
  const panel = document.getElementById('kitchen-raw-panel');
  if (!panel || !sample) return;
  panel.textContent = '';

  const head = document.createElement('div');
  head.className = 'raw-sheet-head';
  const title = document.createElement('span');
  title.className = 'raw-sheet-title';
  title.textContent = sample.rawTitle;
  const issuesWrap = document.createElement('div');
  issuesWrap.className = 'raw-issues-row';
  sample.rawIssues.forEach(issue => {
    const pill = document.createElement('span');
    pill.className = 'raw-issue-pill';
    pill.textContent = issue;
    issuesWrap.appendChild(pill);
  });
  head.appendChild(title);
  head.appendChild(issuesWrap);
  panel.appendChild(head);

  const table = document.createElement('table');
  table.className = 'raw-sheet-table';
  const thead = document.createElement('thead');
  const headRow = document.createElement('tr');
  sample.rawHeaders.forEach(h => {
    const th = document.createElement('th');
    th.textContent = h;
    headRow.appendChild(th);
  });
  thead.appendChild(headRow);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  sample.rawRows.forEach(row => {
    const tr = document.createElement('tr');
    const isMessy = row[row.length - 1] === true;
    row.slice(0, -1).forEach((val, idx) => {
      const td = document.createElement('td');
      td.textContent = val;
      if (isMessy && idx === row.length - 2) {
        td.className = 'is-messy';
      }
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  panel.appendChild(table);
}

function setKitchenViewMode(mode) {
  kitchenViewMode = mode === 'raw' ? 'raw' : 'clean';
  const cleanBtn = document.getElementById('kitchen-clean-btn');
  const rawPanel = document.getElementById('kitchen-raw-panel');
  const modeBtns = document.querySelectorAll('.kitchen-mode-btn');

  modeBtns.forEach(btn => {
    const active = btn.getAttribute('data-kitchen-mode') === kitchenViewMode;
    btn.classList.toggle('is-active', active);
    btn.setAttribute('aria-pressed', active ? 'true' : 'false');
  });

  if (cleanBtn) cleanBtn.hidden = kitchenViewMode === 'raw';
  if (rawPanel) {
    rawPanel.hidden = kitchenViewMode !== 'raw';
    if (kitchenViewMode === 'raw') {
      renderKitchenRawPanel(GALLERY_SAMPLES[excelSlideIndex] || GALLERY_SAMPLES[0]);
    }
  }
  scheduleExcelShowcase();
}

function restartExcelProgress() {
  const fill = document.getElementById('excel-stage-progress-fill');
  if (!fill) return;
  fill.classList.remove('is-animating');
  if (REDUCED_MOTION_MQ.matches) return;
  void fill.offsetWidth;
  fill.classList.add('is-animating');
}

function setExcelSlide(index) {
  const showcase = document.getElementById('excel-showcase');
  if (!showcase) return;
  const slides = showcase.querySelectorAll('.hero-showcase-slide');
  const tabs = document.querySelectorAll('.excel-stage-tabs .hero-tab-btn');
  if (slides.length === 0) return;

  excelSlideIndex = ((index % slides.length) + slides.length) % slides.length;
  slides.forEach((slide, i) => {
    slide.classList.toggle('is-active', i === excelSlideIndex);
  });
  tabs.forEach((tab, i) => {
    const active = i === excelSlideIndex;
    tab.classList.toggle('is-active', active);
    tab.setAttribute('aria-selected', active ? 'true' : 'false');
  });

  const info = GALLERY_SAMPLES[excelSlideIndex];
  if (info) {
    const catEl = document.getElementById('excel-stage-cat');
    const badgeEl = document.getElementById('excel-stage-badge');
    const titleEl = document.getElementById('excel-stage-title');
    const descEl = document.getElementById('excel-stage-desc');
    const inEl = document.getElementById('excel-stage-in');
    const procEl = document.getElementById('excel-stage-proc');
    const outEl = document.getElementById('excel-stage-out');

    if (catEl && info.cat) catEl.textContent = info.cat;
    if (badgeEl && info.badge) badgeEl.textContent = info.badge;
    if (titleEl && info.showcaseTitle) titleEl.textContent = info.showcaseTitle;
    if (descEl && info.desc) descEl.textContent = info.desc;
    if (inEl && info.flowIn) inEl.textContent = info.flowIn;
    if (procEl && info.flowProc) procEl.textContent = info.flowProc;
    if (outEl && info.flowOut) outEl.textContent = info.flowOut;
    if (kitchenViewMode === 'raw') {
      renderKitchenRawPanel(info);
    }
  }

  restartExcelProgress();
  scheduleExcelShowcase();
}

function scheduleExcelShowcase() {
  if (excelShowcaseTimer) {
    clearTimeout(excelShowcaseTimer);
    excelShowcaseTimer = null;
  }
  if (REDUCED_MOTION_MQ.matches || excelShowcasePaused || kitchenViewMode === 'raw' || document.hidden) return;
  const modal = document.getElementById('sample-lightbox');
  if (modal && !modal.hidden) return;

  excelShowcaseTimer = setTimeout(() => {
    setExcelSlide(excelSlideIndex + 1);
  }, 4000);
}

function initExcelShowcase() {
  const showcase = document.getElementById('excel-showcase');
  if (!showcase) return;

  const parentSection = showcase.closest('.slide-section') || showcase;
  parentSection.addEventListener('mouseenter', () => {
    excelShowcasePaused = true;
    scheduleExcelShowcase();
  });
  parentSection.addEventListener('mouseleave', () => {
    excelShowcasePaused = false;
    scheduleExcelShowcase();
  });
  parentSection.addEventListener('focusin', () => {
    excelShowcasePaused = true;
    scheduleExcelShowcase();
  });
  parentSection.addEventListener('focusout', (e) => {
    if (!parentSection.contains(e.relatedTarget)) {
      excelShowcasePaused = false;
      scheduleExcelShowcase();
    }
  });
  document.addEventListener('visibilitychange', () => {
    scheduleExcelShowcase();
  });

  setExcelSlide(0);
}

function openCurrentExcelSample() {
  const sample = GALLERY_SAMPLES[excelSlideIndex] || GALLERY_SAMPLES[0];
  openSampleModal(sample.src, sample.title, sample.caption, sample.service);
}

function renderModalSample(sample) {
  const imgEl = document.getElementById('sample-lightbox-img');
  const navEl = document.getElementById('sample-lightbox-nav');
  const kickerEl = document.getElementById('sample-lightbox-kicker');
  const titleEl = document.getElementById('sample-lightbox-title');
  const captionEl = document.getElementById('sample-lightbox-caption');
  const counterEl = document.getElementById('sample-lightbox-counter');
  const ctaBtn = document.getElementById('sample-lightbox-cta');
  if (!imgEl || !titleEl || !captionEl) return;

  imgEl.hidden = false;
  if (navEl) navEl.hidden = false;
  if (kickerEl) kickerEl.textContent = 'Muestra real en Excel';

  imgEl.src = sample.src;
  imgEl.alt = sample.title || 'Captura real en Microsoft Excel';
  titleEl.textContent = sample.title || 'Muestra real en Excel';
  captionEl.textContent = sample.caption || '';

  if (counterEl) {
    counterEl.textContent = `${currentGalleryIndex + 1} / ${GALLERY_SAMPLES.length}`;
  }
  if (ctaBtn) {
    ctaBtn.textContent = 'Consultar por esto →';
    ctaBtn.onclick = () => {
      closeSampleModal();
      quoteSpecificService(sample.service || 'Consulta general');
    };
  }
}

function openCertificateModal(imgSrc, title, caption) {
  const modal = document.getElementById('sample-lightbox');
  const navEl = document.getElementById('sample-lightbox-nav');
  const kickerEl = document.getElementById('sample-lightbox-kicker');
  const imgEl = document.getElementById('sample-lightbox-img');
  const titleEl = document.getElementById('sample-lightbox-title');
  const captionEl = document.getElementById('sample-lightbox-caption');
  const ctaBtn = document.getElementById('sample-lightbox-cta');
  const closeBtn = document.getElementById('sample-lightbox-close');
  if (!modal || !imgEl || !titleEl || !captionEl) return;

  lastModalTrigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  if (navEl) navEl.hidden = true;
  if (kickerEl) kickerEl.textContent = 'Certificado oficial verificable';
  imgEl.hidden = false;
  imgEl.src = imgSrc;
  imgEl.alt = title;
  titleEl.textContent = title;
  captionEl.textContent = caption;

  if (ctaBtn) {
    ctaBtn.textContent = 'Ir al diagnóstico →';
    ctaBtn.onclick = () => {
      closeSampleModal();
      goToSlide(6);
    };
  }

  modal.hidden = false;
  document.documentElement.style.overflow = 'hidden';
  scheduleExcelShowcase();
  trackEvent('certificado-visto');
  if (closeBtn) closeBtn.focus();
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
  scheduleExcelShowcase();
  if (closeBtn) closeBtn.focus();
}

function stepSampleModal(delta) {
  const modal = document.getElementById('sample-lightbox');
  const navEl = document.getElementById('sample-lightbox-nav');
  if (!modal || modal.hidden || (navEl && navEl.hidden)) return;
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
  scheduleExcelShowcase();
  if (lastModalTrigger && typeof lastModalTrigger.focus === 'function') {
    lastModalTrigger.focus();
  }
  lastModalTrigger = null;
}

let lastFaqTrigger = null;

function openFaqModal() {
  const modal = document.getElementById('faq-modal');
  const closeBtn = document.getElementById('faq-modal-close');
  if (!modal) return;

  lastFaqTrigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  modal.hidden = false;
  document.documentElement.style.overflow = 'hidden';
  trackEvent('preguntas-frecuentes-abiertas');
  if (closeBtn) closeBtn.focus();
}

function closeFaqModal() {
  const modal = document.getElementById('faq-modal');
  if (!modal || modal.hidden) return;

  modal.hidden = true;
  document.documentElement.style.overflow = '';
  if (lastFaqTrigger && typeof lastFaqTrigger.focus === 'function') {
    lastFaqTrigger.focus();
  }
  lastFaqTrigger = null;
}

document.addEventListener('keydown', (e) => {
  const faqModal = document.getElementById('faq-modal');
  if (faqModal && !faqModal.hidden && e.key === 'Escape') {
    closeFaqModal();
    return;
  }

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
window.updateDiagnosticEstimate = updateDiagnosticEstimate;
window.goToDiagStep = goToDiagStep;
window.openDiagnosticWhatsApp = openDiagnosticWhatsApp;
window.openFaqModal = openFaqModal;
window.closeFaqModal = closeFaqModal;
window.trackEvent = trackEvent;
window.setExcelSlide = setExcelSlide;
window.setKitchenViewMode = setKitchenViewMode;
window.openCurrentExcelSample = openCurrentExcelSample;
window.openSampleModal = openSampleModal;
window.openCertificateModal = openCertificateModal;
window.stepSampleModal = stepSampleModal;
window.closeSampleModal = closeSampleModal;
