/**
 * Landing Page de Finanzas, Reportes & Automatización - Franco Guerrero
 * Desplazamiento libre continuo, barra lateral de porcentaje (0% a 100%) y cotización directa.
 */

let sections = [];
let tickerHasRun = false;
const HEADER_HEIGHT = 56;
const BANNER_STORAGE_KEY = 'rotation_hint_dismissed';

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

function initApp() {
  sections = Array.from(document.querySelectorAll('.slide-section'));
  initScrollTracking();
  initProgressRailClick();
  initAnchorIntercept();
  initRotationBanner();
  triggerNumberTicker();
  updateScrollProgress();
}

/**
 * 1. Seguimiento de Avance (0% a 100%) y Sección Activa en Menú Superior
 */
function initScrollTracking() {
  let ticking = false;
  const onScrollOrResize = () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        updateScrollProgress();
        updateActiveMenuFromScroll();
        ticking = false;
      });
      ticking = true;
    }
  };

  window.addEventListener('scroll', onScrollOrResize, { passive: true });
  window.addEventListener('resize', onScrollOrResize, { passive: true });
}

function updateScrollProgress() {
  const pctEl = document.getElementById('scroll-progress-pct');
  const fillEl = document.getElementById('scroll-progress-fill');
  const railEl = document.getElementById('scroll-progress-rail');
  if (!pctEl || !fillEl) return;

  const scrollTop = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;

  let pct = 0;
  if (maxScroll > 0) {
    pct = Math.round((scrollTop / maxScroll) * 100);
  }
  if (scrollTop <= 1) pct = 0;
  if (maxScroll > 0 && scrollTop >= maxScroll - 2) pct = 100;
  pct = Math.max(0, Math.min(100, pct));

  pctEl.textContent = `${pct}%`;
  fillEl.style.height = `${pct}%`;
  if (railEl) {
    railEl.classList.toggle('is-complete', pct === 100);
  }
}

function initProgressRailClick() {
  const track = document.getElementById('scroll-progress-track');
  if (!track) return;

  track.addEventListener('click', (e) => {
    const rect = track.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    window.scrollTo({
      top: Math.round(ratio * Math.max(0, maxScroll)),
      behavior: 'smooth'
    });
  });
}

function getHeaderOffset() {
  const headerEl = document.querySelector('.sticky-header-bar');
  return headerEl ? headerEl.offsetHeight : HEADER_HEIGHT;
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
  const headerOffset = getHeaderOffset();
  const targetTop = targetIndex === 0 ? 0 : Math.max(0, targetEl.offsetTop - headerOffset);

  window.scrollTo({
    top: targetTop,
    behavior: 'smooth'
  });

  syncHeaderMenuLinks(targetIndex);
  if (window.history && window.history.replaceState && targetEl.id) {
    window.history.replaceState(null, '', '#' + targetEl.id);
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
  }, 450);
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
 * 4. Animación de Métricas Cuantitativas (Number Ticker)
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
 * 5. Interceptación de Enlaces de Ancla Internos (#)
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
 * 6. Control del Banner de Sugerencia de Rotación en Celular
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
      // Almacenamiento restringido
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
          // Almacenamiento restringido
        }
      }
    });
  }
}

window.goToSlide = goToSlide;
window.selectServiceTier = selectServiceTier;
window.quoteSpecificService = quoteSpecificService;
window.handleQuoteSubmit = handleQuoteSubmit;
