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
  document.querySelectorAll('.nav-menu-link, .mobile-quick-link').forEach(link => {
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

function goToDiagnostic() {
  const diagEl = document.getElementById('diagnostico-card');
  if (!MOBILE_RAIL_MQ.matches || !diagEl) {
    goToSlide(4);
    return;
  }
  const headerOffset = syncHeaderHeightVar();
  const targetTop = Math.max(0, Math.round(window.scrollY + diagEl.getBoundingClientRect().top - headerOffset - 10));
  window.scrollTo({
    top: targetTop,
    behavior: REDUCED_MOTION_MQ.matches ? 'auto' : 'smooth'
  });
  syncHeaderMenuLinks(4);
}

/**
 * 3. Selección de Solución y Envío de Mensaje Directo (Formspree)
 */
const CONTACT_EMAIL = 'guerrerofranco1429@gmail.com';
const FORM_ENDPOINT = 'https://formspree.io/f/xgakqpok';
const SERVICE_PLACEHOLDERS = {
  'Flujo de caja': 'Ej. Armar nuestro flujo de caja mensual y anual con Power Query y Power Pivot.',
  'Unificar Excels': 'Ej. Conectar una carpeta con nuestros Excels para sacar un consolidado de golpe.',
  'Cobros y registros': 'Ej. Ordenar extractos bancarios y pasarelas de pago para acelerar el registro en sistema.',
  'Otro tema': 'Ej. Cuéntame brevemente qué archivo o reporte quieres ordenar y lo revisamos.'
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
  'Unificar Excels': 'Ref. desde S/ 200 · Entrega 2 a 4 días',
  'Cobros y registros': 'Ref. desde S/ 250 · Entrega 3 a 5 días',
  'Otro tema': 'Cotización cerrada tras revisar muestra'
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
    hint: SERVICE_HINTS[service] || SERVICE_HINTS['Otro tema']
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
  goToDiagnostic();
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

    if (REDUCED_MOTION_MQ.matches || target <= 5) {
      el.textContent = `${prefix}${target}${suffix}`;
      if (onDone) onDone();
    } else {
      animateValue(el, 0, target, 450, prefix, suffix, onDone);
    }
  });
}

function animateValue(obj, start, end, duration, prefix, suffix, onComplete) {
  let startTimestamp = null;
  const step = (timestamp) => {
    if (!startTimestamp) startTimestamp = timestamp;
    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3);
    const current = Math.round(ease * (end - start) + start);
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
    '.flow-diagram-card, .flow-compare-card, .service-bento-card, .promo-bonus-card, .contact-card'
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
    n1Title: 'Movimientos conciliados',
    n1Desc: 'Información real de cuentas contables ya cuadrada.',
    n2Title: 'Limpieza en Power Query',
    n2Desc: 'Separa entradas y salidas reales de efectivo por concepto.',
    n3Title: 'Modelo en Power Pivot',
    n3Desc: 'Calcula flujo mensual y anual consolidado por moneda o saldo neto.',
    n4Title: 'Flujo de caja real',
    n4Desc: 'Listo en la moneda que uses para decidir sin esperar cierre.',
    cat: 'Flujo de caja',
    badge: 'En tu moneda',
    kpi: 'Mensual y anual',
    beforeHtml: '<strong>Movimientos dispersos</strong> difíciles de resumir para ver el efectivo real.',
    afterHtml: '<strong>Flujo automático en Excel</strong> consolidado por moneda y saldo neto.',
    afterScale: '0.08',
    rawTitle: 'Reporte exportado sin clasificar para caja (crudo)',
    rawIssues: ['Fechas mixtas', 'Entradas mezcladas', 'Sin resumen'],
    rawHeaders: ['Tipo', 'Fecha', 'Descripción', 'Mon.', 'Monto'],
    rawRows: [
      ['Banco S/', '03-oct-26', 'ABONO CLIENTE FACT 412', 'PEN', '4820.00', false],
      ['Banco US$', '2026/10/04', 'INGRESO EXTERIOR REXT-11', 'USD', '1250.00', true],
      ['Egreso', '05/10/2026', 'PAGO PROV LOGISTICO', 'PEN', '-1980.00', true],
      ['Pasarela', '06.10.26', 'DEPOSITO PASARELA LOTE 04', 'PEN', '8129.51', false]
    ],
    src: 'muestras/muestra-flujo-cuenta10.png',
    title: 'Flujo de caja real (ejemplo editable)',
    caption: 'Plantilla propia con datos de ejemplo. Puedes descargarla gratis y adaptarla a la moneda de tu empresa.',
    service: 'Flujo de caja',
    isCloud: false
  },
  {
    n1Title: 'Carpeta con reportes',
    n1Desc: 'Cualquier cantidad de Excels guardados por mes o periodo.',
    n2Title: 'Conexión Power Query',
    n2Desc: 'Presionas Actualizar y lee todos los archivos nuevos solo.',
    n3Title: 'Un solo consolidado',
    n3Desc: 'Junta todos los registros sin duplicados ni copiado manual.',
    n4Title: 'Carga masiva lista',
    n4Desc: 'Sube todo de golpe sin crear archivo por archivo cada vez.',
    cat: 'Consolidado automático',
    badge: '+25 h/mes ahorradas',
    kpi: 'Un solo consolidado',
    beforeHtml: '<strong>Crear un archivo por cada Excel</strong> copiando columnas a mano cada periodo.',
    afterHtml: '<strong>Actualizas una sola carpeta</strong> y sale todo consolidado (24 periodos o los que agregues).',
    afterScale: '0.10',
    rawTitle: 'Excels mensuales con formatos distintos (crudo)',
    rawIssues: ['Columnas movidas', 'Filas duplicadas', 'Armado 1 por 1'],
    rawHeaders: ['Periodo', 'Comprobante', 'Fecha', 'Importe', 'Problema'],
    rawRows: [
      ['Ene-26', '20541120911', '12/01/26', '84520.00', 'Encabezado en fila 5', true],
      ['2026-02', 'F001-00214', '14-feb', '1240.00', 'Fila repetida', true],
      ['Mar 26', '20601988210', '2026.03.19', '96400.00', 'Fecha como texto', true],
      ['2026-04', 'B002-01822', '08/04/2026', '91250.00', 'Orden distinto', true]
    ],
    src: 'muestras/muestra-consolidacion-libros.png',
    title: 'Consolidado automático de Excels por carpeta (Power Query)',
    caption: 'Carpeta conectada en Power Query: agregas los archivos que necesites, actualizas y queda listo para subir al sistema.',
    service: 'Unificar Excels',
    isCloud: false
  },
  {
    n1Title: 'Extractos atrasados',
    n1Desc: 'Cuatro meses sueltos de bancos, tarjetas y pasarelas de pago.',
    n2Title: 'Consolidado bancario',
    n2Desc: 'Ordena abonos, comisiones y pendientes en una sola base.',
    n3Title: 'Registro en el sistema',
    n3Desc: 'Automatiza el ingreso al ERP sin digitar movimiento a movimiento.',
    n4Title: 'Al día en 2 semanas',
    n4Desc: 'Cuatro meses acumulados ordenados y cargados al sistema.',
    cat: 'Conciliación bancaria',
    badge: 'Consolidado + ERP',
    kpi: '4 meses en 2 semanas',
    beforeHtml: '<strong>4 meses acumulados</strong> digitando movimiento por movimiento en el sistema.',
    afterHtml: '<strong>Consolidado claro y carga automatizada</strong> en el ERP en ~2 semanas.',
    afterScale: '0.14',
    rawTitle: 'Extractos bancarios y pasarelas sin ordenar (crudo)',
    rawIssues: ['Comisión aparte', 'Lotes dispersos', 'Carga manual'],
    rawHeaders: ['Fecha', 'Canal', 'Comprobante', 'Bruto', 'Pendiente'],
    rawRows: [
      ['03/11/26', 'Tarjeta POS', 'B001-04169', '6940.00', 'Falta comisión', true],
      ['04/11/26', 'Billetera', 'B001-04216', '3510.00', 'Sin cruzar banco', true],
      ['05/11/26', 'Pasarela Web', 'B001-04261', '8420.00', 'Abono parcial', true],
      ['13/11/26', 'Transferencia', 'B001-04585', '1240.00', 'Sin registrar', true]
    ],
    src: 'muestras/muestra-conciliacion-pasarelas.png',
    title: 'Conciliación bancaria y cobros digitales para registro en sistema',
    caption: 'Base ordenada con abonos, comisiones y pendientes lista para acelerar el registro automatizado.',
    service: 'Cobros y registros',
    isCloud: false
  },
  {
    n1Title: 'Datos del sistema',
    n1Desc: 'Información mensual que antes demoraba 32 horas armar a mano.',
    n2Title: 'Conexión automática',
    n2Desc: 'Actualiza los resultados financieros directo hacia la nube.',
    n3Title: 'Vistas en Google Sheets',
    n3Desc: 'Cada área o empresa consulta su reporte con permiso privado.',
    n4Title: 'Cierre en 4 horas',
    n4Desc: '87% menos tiempo y reportes siempre al día sin archivos pesados.',
    cat: 'Reportes en línea',
    badge: 'Google Sheets',
    kpi: 'De 32 h a 4 h',
    beforeHtml: '<strong>32 horas cada cierre</strong> enviando Excels pesados que quedaban desactualizados.',
    afterHtml: '<strong>4 horas en Google Sheets</strong> con actualización automática y acceso ordenado.',
    afterScale: '0.12',
    rawTitle: 'Tabla plana pesada difícil de consultar (crudo)',
    rawIssues: ['Sin filtro rápido', 'Archivo pesado', 'Envío por correo'],
    rawHeaders: ['Código', 'Área / Empresa', 'Periodo', 'Saldo S/', 'Problema'],
    rawRows: [
      ['E-01', 'Empresa Demo A', 'Ene - Dic', '148002.00', 'Archivo lento', true],
      ['E-02', 'Empresa Demo B', 'Ene - Dic', '92450.00', 'Versión repetida', true],
      ['E-03', 'Empresa Demo C', 'Ene - Dic', '215890.00', 'Copia manual', true],
      ['E-04', 'Empresa Demo D', 'Ene - Dic', '64120.00', 'Sin enlace nube', true]
    ],
    src: 'muestras/muestra-reporte-en-linea.png',
    title: 'Reporte financiero en línea (Estados Financieros y ratios)',
    caption: 'Estados Financieros, evolución comparativa y ratios de liquidez y rentabilidad actualizados en línea en Google Sheets.',
    service: 'Otro tema',
    isCloud: false
  }
];

let excelSlideIndex = 0;
let heroSlideIndex = 0;
let heroAutoTimer = null;
let flowStepTimer = null;
let flowStepIndex = 0;
let heroPaused = false;
let flowPaused = false;
let flowPauseUntil = 0;
let kitchenViewMode = 'clean';
let currentGalleryIndex = 0;
let lastModalTrigger = null;

const HERO_SAMPLE_META = [
  { label: 'Flujo de fondos · Muestra propia', caption: 'Plantilla propia de flujo de caja lista para descargar gratis.' },
  { label: 'Consolidado automático · Muestra propia', caption: 'Carpeta conectada en Power Query lista para carga masiva.' },
  { label: 'Conciliación bancaria · Muestra propia', caption: 'Control automático de abonos, comisiones y duplicados.' },
  { label: 'Reportes en línea · Muestra propia', caption: 'Estados Financieros y ratios actualizados en Google Sheets.' }
];

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
}

function setWorkflowCase(index, userInitiated) {
  const showcase = document.getElementById('excel-showcase');
  if (!showcase) return;
  const slides = showcase.querySelectorAll('.hero-showcase-slide');
  const tabs = document.querySelectorAll('.flow-tabs .flow-tab-btn');
  const cloudPreview = document.getElementById('kitchen-cloud-preview');
  const zoomBtn = document.getElementById('kitchen-zoom-btn');

  if (userInitiated) {
    flowPauseUntil = Date.now() + 14000;
    highlightFlowStep(0);
  }

  excelSlideIndex = ((index % GALLERY_SAMPLES.length) + GALLERY_SAMPLES.length) % GALLERY_SAMPLES.length;
  const info = GALLERY_SAMPLES[excelSlideIndex];

  tabs.forEach((tab, i) => {
    const active = i === excelSlideIndex;
    tab.classList.toggle('is-active', active);
    tab.setAttribute('aria-selected', active ? 'true' : 'false');
  });

  slides.forEach((slide, i) => {
    const isMatch = !info.isCloud && i === excelSlideIndex;
    slide.hidden = info.isCloud;
    slide.classList.toggle('is-active', isMatch);
  });

  if (cloudPreview) cloudPreview.hidden = !info.isCloud;
  if (zoomBtn) zoomBtn.textContent = info.isCloud ? 'Cotizar similar' : 'Ampliar';

  const nodeIds = [
    ['flow-n1-title', info.n1Title], ['flow-n1-desc', info.n1Desc],
    ['flow-n2-title', info.n2Title], ['flow-n2-desc', info.n2Desc],
    ['flow-n3-title', info.n3Title], ['flow-n3-desc', info.n3Desc],
    ['flow-n4-title', info.n4Title], ['flow-n4-desc', info.n4Desc]
  ];
  nodeIds.forEach(([id, txt]) => {
    const el = document.getElementById(id);
    if (el) el.textContent = txt;
  });

  if (!REDUCED_MOTION_MQ.matches) {
    document.querySelectorAll('#workflow-diagram .flow-node').forEach((node, i) => {
      node.classList.remove('is-step-entering');
      node.style.animationDelay = `${i * 55}ms`;
      void node.offsetWidth;
      node.classList.add('is-step-entering');
    });
  }

  const evCat = document.getElementById('flow-ev-cat');
  const evBadge = document.getElementById('flow-ev-badge');
  const evKpi = document.getElementById('flow-ev-kpi');
  const evBefore = document.getElementById('flow-ev-before');
  const evAfter = document.getElementById('flow-ev-after');
  const evMeter = document.getElementById('flow-ev-meter');

  if (evCat) evCat.textContent = info.cat;
  if (evBadge) evBadge.textContent = info.badge;
  if (evKpi) evKpi.textContent = info.kpi;
  if (evBefore) evBefore.innerHTML = info.beforeHtml;
  if (evAfter) evAfter.innerHTML = info.afterHtml;
  if (evMeter) evMeter.style.setProperty('--meter-scale', info.afterScale);

  if (kitchenViewMode === 'raw') {
    renderKitchenRawPanel(info);
  }
}

function setHeroSampleSlide(index) {
  const card = document.getElementById('hero-sample-card');
  if (!card) return;
  const slides = card.querySelectorAll('.hero-showcase-slide');
  if (!slides.length) return;
  heroSlideIndex = ((index % slides.length) + slides.length) % slides.length;
  slides.forEach((img, i) => {
    img.classList.toggle('is-active', i === heroSlideIndex);
  });
  const meta = HERO_SAMPLE_META[heroSlideIndex] || HERO_SAMPLE_META[0];
  const lbl = document.getElementById('hero-sample-label');
  const cap = document.getElementById('hero-sample-caption');
  if (lbl) lbl.textContent = meta.label;
  if (cap) cap.textContent = meta.caption;
}

function openHeroSampleModal() {
  const sample = GALLERY_SAMPLES[heroSlideIndex] || GALLERY_SAMPLES[0];
  openSampleModal(sample.src, sample.title, sample.caption, sample.service);
}

function isAnyModalOpen() {
  const lb = document.getElementById('sample-lightbox');
  const faq = document.getElementById('faq-modal');
  return (lb && !lb.hidden) || (faq && !faq.hidden);
}

function highlightFlowStep(stepIdx) {
  const nodes = document.querySelectorAll('#workflow-diagram .flow-node');
  if (!nodes.length) return;
  flowStepIndex = ((stepIdx % nodes.length) + nodes.length) % nodes.length;
  nodes.forEach((node, i) => {
    node.classList.toggle('is-step-active', i === flowStepIndex);
  });
}

function scheduleNextFlowTick(delayMs) {
  if (flowStepTimer) clearTimeout(flowStepTimer);
  flowStepTimer = setTimeout(() => {
    if (REDUCED_MOTION_MQ.matches) return;
    if (document.hidden || flowPaused || isAnyModalOpen() || kitchenViewMode !== 'clean' || Date.now() < flowPauseUntil) {
      scheduleNextFlowTick(800);
      return;
    }

    const nodes = document.querySelectorAll('#workflow-diagram .flow-node');
    const totalSteps = nodes.length || 4;

    if (flowStepIndex < totalSteps - 1) {
      highlightFlowStep(flowStepIndex + 1);
      const nextDelay = flowStepIndex === totalSteps - 1 ? 2100 : 1450;
      scheduleNextFlowTick(nextDelay);
    } else {
      setWorkflowCase(excelSlideIndex + 1, false);
      highlightFlowStep(0);
      scheduleNextFlowTick(1450);
    }
  }, delayMs);
}

function initExcelShowcase() {
  const showcase = document.getElementById('excel-showcase');
  const heroCard = document.getElementById('hero-sample-card');
  const flowSec = document.getElementById('flujo-trabajo');

  if (showcase) {
    setWorkflowCase(0, false);
  }
  if (heroCard) {
    setHeroSampleSlide(0);
    heroCard.addEventListener('mouseenter', () => { heroPaused = true; });
    heroCard.addEventListener('mouseleave', () => { heroPaused = false; });
    heroCard.addEventListener('focusin', () => { heroPaused = true; });
    heroCard.addEventListener('focusout', () => { heroPaused = false; });
  }
  if (flowSec) {
    flowSec.addEventListener('mouseenter', () => { flowPaused = true; });
    flowSec.addEventListener('mouseleave', () => { flowPaused = false; });
    flowSec.addEventListener('focusin', () => { flowPaused = true; });
    flowSec.addEventListener('focusout', () => { flowPaused = false; });
  }

  if (!REDUCED_MOTION_MQ.matches) {
    if (heroAutoTimer) clearInterval(heroAutoTimer);
    heroAutoTimer = setInterval(() => {
      if (document.hidden || heroPaused || isAnyModalOpen()) return;
      setHeroSampleSlide(heroSlideIndex + 1);
    }, 4500);

    if (showcase) {
      highlightFlowStep(0);
      scheduleNextFlowTick(1450);
    }
  }
}

function openCurrentExcelSample() {
  const sample = GALLERY_SAMPLES[excelSlideIndex] || GALLERY_SAMPLES[0];
  if (sample.isCloud) {
    quoteSpecificService(sample.service || 'Otro tema');
    return;
  }
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

  const imageSamples = GALLERY_SAMPLES.filter(s => !s.isCloud);
  if (counterEl) {
    const imgIdx = Math.max(0, imageSamples.findIndex(s => s.src === sample.src));
    counterEl.textContent = `${imgIdx + 1} / ${imageSamples.length}`;
  }
  if (ctaBtn) {
    ctaBtn.textContent = 'Consultar →';
    ctaBtn.onclick = () => {
      closeSampleModal();
      quoteSpecificService(sample.service || 'Otro tema');
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
    ctaBtn.textContent = 'Consultar →';
    ctaBtn.onclick = () => {
      closeSampleModal();
      const contactIdx = sections.findIndex(sec => sec.id === 'contacto');
      goToSlide(contactIdx !== -1 ? contactIdx : 4);
    };
  }

  modal.hidden = false;
  document.documentElement.style.overflow = 'hidden';
  trackEvent('certificado-visto');
  if (closeBtn) closeBtn.focus();
}

function openSampleModal(imgSrc, title, caption, serviceValue) {
  const modal = document.getElementById('sample-lightbox');
  const closeBtn = document.getElementById('sample-lightbox-close');
  if (!modal) return;

  lastModalTrigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  const imageSamples = GALLERY_SAMPLES.filter(s => !s.isCloud);
  const foundIdx = imageSamples.findIndex(s => s.src === imgSrc);
  currentGalleryIndex = foundIdx !== -1 ? foundIdx : 0;

  const activeSample = foundIdx !== -1
    ? imageSamples[foundIdx]
    : { src: imgSrc, title, caption, service: serviceValue };

  renderModalSample({
    src: imgSrc || activeSample.src,
    title: title || activeSample.title,
    caption: caption || activeSample.caption,
    service: serviceValue || activeSample.service
  });

  modal.hidden = false;
  document.documentElement.style.overflow = 'hidden';
  if (closeBtn) closeBtn.focus();
}

function stepSampleModal(delta) {
  const modal = document.getElementById('sample-lightbox');
  const navEl = document.getElementById('sample-lightbox-nav');
  if (!modal || modal.hidden || (navEl && navEl.hidden)) return;
  const imageSamples = GALLERY_SAMPLES.filter(s => !s.isCloud);
  currentGalleryIndex = (currentGalleryIndex + delta + imageSamples.length) % imageSamples.length;
  renderModalSample(imageSamples[currentGalleryIndex]);
}

function closeSampleModal() {
  const modal = document.getElementById('sample-lightbox');
  const imgEl = document.getElementById('sample-lightbox-img');
  if (!modal || modal.hidden) return;

  modal.hidden = true;
  document.documentElement.style.overflow = '';
  if (imgEl) imgEl.removeAttribute('src');
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
window.goToDiagnostic = goToDiagnostic;
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
window.setWorkflowCase = setWorkflowCase;
window.setKitchenViewMode = setKitchenViewMode;
window.openCurrentExcelSample = openCurrentExcelSample;
window.openSampleModal = openSampleModal;
window.openCertificateModal = openCertificateModal;
window.stepSampleModal = stepSampleModal;
window.closeSampleModal = closeSampleModal;
