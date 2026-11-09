/**
 * Portafolio de Business Intelligence & Finanzas - Franco Guerrero
 * Controlador de Diapositivas (Slide Deck Engine 100vh), Magic UI e Interactividad.
 */

// 5 Diapositivas oficiales del portafolio (100vh por pantalla)
const SLIDES = ['inicio', 'experiencia', 'dashboard-powerbi', 'proyectos', 'contacto'];
let currentSlideIndex = 0;
let currentAct = 1;
let isAnimating = false;
let wheelDeltaAccumulator = 0;
let wheelCooldownTimeout = null;

document.addEventListener('DOMContentLoaded', () => {
  initSlideEngine();
  initActNavigation();
  initProjectInspector();
  initProjectFilters();
  initNumberTicker();
  initAnchorIntercept();
});

/**
 * 1. Slide Deck Engine (Navegación Magnética por Pantallas de 100vh)
 * Garantiza transiciones exactas sin recortes ni paradas intermedias.
 */
function goToSlide(targetIndex) {
  if (targetIndex < 0 || targetIndex >= SLIDES.length) return;
  if (isAnimating && targetIndex === currentSlideIndex) return;

  isAnimating = true;
  currentSlideIndex = targetIndex;
  const slideId = SLIDES[targetIndex];

  // Desplazar el riel verticalmente
  const wrapper = document.getElementById('slides-wrapper');
  if (wrapper) {
    wrapper.style.transform = `translateY(-${targetIndex * 100}vh)`;
  }

  // Sincronizar indicador lateral de puntos
  document.querySelectorAll('.scrolly-nav-dot').forEach((dot, idx) => {
    dot.classList.toggle('active', idx === targetIndex);
  });

  // Sincronizar diapositiva activa
  document.querySelectorAll('.slide-section').forEach((sec, idx) => {
    sec.classList.toggle('active', idx === targetIndex);
  });

  // Actualizar URL sin saltos bruscos
  if (window.history && window.history.replaceState) {
    window.history.replaceState(null, '', '#' + slideId);
  }

  // Si se regresa a inicio, reiniciar conteo de métricas
  if (targetIndex === 0) {
    triggerNumberTicker();
  }

  // Liberar bloqueo de animación tras la transición CSS (650ms)
  setTimeout(() => {
    isAnimating = false;
  }, 680);
}

// Alias público para compatibilidad con botones inline
function scrollToChapter(chapterId) {
  const index = SLIDES.indexOf(chapterId);
  if (index !== -1) {
    goToSlide(index);
  }
}

function initSlideEngine() {
  const wrapper = document.getElementById('slides-wrapper');
  if (!wrapper) return;

  // Interceptar la rueda del ratón (Wheel)
  window.addEventListener('wheel', (e) => {
    // Si el usuario está sobre la lista interna de proyectos (slide 4) y hace scroll
    const projectsNarrative = document.querySelector('.projects-narrative');
    if (currentSlideIndex === 3 && projectsNarrative && projectsNarrative.contains(e.target)) {
      const isScrollingDown = e.deltaY > 0;
      const canScrollDown = projectsNarrative.scrollTop + projectsNarrative.clientHeight < projectsNarrative.scrollHeight - 5;
      const canScrollUp = projectsNarrative.scrollTop > 5;
      if ((isScrollingDown && canScrollDown) || (!isScrollingDown && canScrollUp)) {
        return; // Permitir scroll interno en la lista de proyectos
      }
    }

    e.preventDefault();

    if (isAnimating) return;

    wheelDeltaAccumulator += e.deltaY;
    clearTimeout(wheelCooldownTimeout);
    wheelCooldownTimeout = setTimeout(() => {
      wheelDeltaAccumulator = 0;
    }, 180);

    const THRESHOLD = 35;

    if (wheelDeltaAccumulator > THRESHOLD) {
      // Scroll hacia abajo
      wheelDeltaAccumulator = 0;
      if (currentSlideIndex === 1) {
        // En la diapositiva de Experiencia: avanzar de acto sin mover la pantalla
        if (currentAct < 3) {
          switchAct(currentAct + 1);
        } else {
          goToSlide(2); // Pasar a Power BI
        }
      } else if (currentSlideIndex < SLIDES.length - 1) {
        goToSlide(currentSlideIndex + 1);
      }
    } else if (wheelDeltaAccumulator < -THRESHOLD) {
      // Scroll hacia arriba
      wheelDeltaAccumulator = 0;
      if (currentSlideIndex === 1) {
        // En la diapositiva de Experiencia: retroceder de acto sin mover la pantalla
        if (currentAct > 1) {
          switchAct(currentAct - 1);
        } else {
          goToSlide(0); // Volver a Inicio
        }
      } else if (currentSlideIndex > 0) {
        goToSlide(currentSlideIndex - 1);
      }
    }
  }, { passive: false });

  // Navegación por teclado (Flechas, RePág, AvPág, Inicio, Fin)
  window.addEventListener('keydown', (e) => {
    if (['ArrowDown', 'PageDown', ' '].includes(e.key)) {
      e.preventDefault();
      if (currentSlideIndex === 1 && currentAct < 3) {
        switchAct(currentAct + 1);
      } else if (currentSlideIndex < SLIDES.length - 1) {
        goToSlide(currentSlideIndex + 1);
      }
    } else if (['ArrowUp', 'PageUp'].includes(e.key)) {
      e.preventDefault();
      if (currentSlideIndex === 1 && currentAct > 1) {
        switchAct(currentAct - 1);
      } else if (currentSlideIndex > 0) {
        goToSlide(currentSlideIndex - 1);
      }
    } else if (e.key === 'Home') {
      e.preventDefault();
      goToSlide(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      goToSlide(SLIDES.length - 1);
    }
  });

  // Soporte para gestos táctiles (Swipe en dispositivos móviles/tablets)
  let touchStartY = 0;
  window.addEventListener('touchstart', (e) => {
    if (e.touches && e.touches.length > 0) {
      touchStartY = e.touches[0].clientY;
    }
  }, { passive: true });

  window.addEventListener('touchend', (e) => {
    if (e.changedTouches && e.changedTouches.length > 0) {
      const touchEndY = e.changedTouches[0].clientY;
      const diffY = touchStartY - touchEndY;
      if (Math.abs(diffY) > 50) {
        if (diffY > 0) {
          // Deslizar arriba (avanzar)
          if (currentSlideIndex === 1 && currentAct < 3) {
            switchAct(currentAct + 1);
          } else if (currentSlideIndex < SLIDES.length - 1) {
            goToSlide(currentSlideIndex + 1);
          }
        } else {
          // Deslizar abajo (retroceder)
          if (currentSlideIndex === 1 && currentAct > 1) {
            switchAct(currentAct - 1);
          } else if (currentSlideIndex > 0) {
            goToSlide(currentSlideIndex - 1);
          }
        }
      }
    }
  }, { passive: true });

  // Leer hash inicial al cargar
  const initialHash = window.location.hash.replace('#', '');
  const initialIdx = SLIDES.indexOf(initialHash);
  if (initialIdx > 0) {
    goToSlide(initialIdx);
  } else {
    goToSlide(0);
  }
}

/**
 * 2. Diapositiva 2: Historias en Tres Actos ("Que los objetos se muevan y la pantalla quede fija")
 */
const ACT_TO_TAB = {
  1: 'quvo',
  2: 'sunat',
  3: 'cxp'
};

function initActNavigation() {
  switchAct(1);
}

function switchAct(actNum, clickedBtn) {
  currentAct = actNum;

  // Actualizar botones de pastilla superiores
  document.querySelectorAll('.act-nav-pills .tab-btn').forEach(btn => {
    const act = parseInt(btn.getAttribute('data-act'), 10);
    btn.classList.toggle('active', act === actNum);
  });

  // Mostrar el paso narrativo correspondiente en la columna izquierda
  document.querySelectorAll('.scrolly-narrative .scrolly-step').forEach(step => {
    const stepNum = parseInt(step.getAttribute('data-step'), 10);
    step.classList.toggle('active', stepNum === actNum);
  });

  // Actualizar la pestaña activa en el tablero derecho
  const targetTab = ACT_TO_TAB[actNum];
  if (targetTab) {
    displayTab(targetTab);
  }
}

function displayTab(tabId) {
  document.querySelectorAll('.showcase-header .tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
  });
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.toggle('active', content.id === 'tab-' + tabId);
  });
}

function manualSwitchTab(tabId, element) {
  const tabToAct = { 'quvo': 1, 'sunat': 2, 'cxp': 3 };
  const act = tabToAct[tabId];
  if (act) {
    switchAct(act);
  } else {
    displayTab(tabId);
  }
}

/**
 * 3. Diapositiva 4: Inspector de Proyectos y Casos
 */
const projectsData = {
  '1': {
    badge: '8 empresas',
    subtitle: 'Unificación de flujos de caja.',
    kpiTitle: 'Reducción de tiempo',
    kpiValue: '87% menos horas',
    kpiDesc: 'Consolidación de cuentas 10 a 59 en un solo modelo automatizado.',
    chartHtml: `
      <div class="chart-header">
        <span class="chart-label">Tiempo de consolidación mensual</span>
        <span class="chart-metric">87% reducción</span>
      </div>
      <div class="bar-row">
        <span class="bar-title">Antes (manual)</span>
        <div class="bar-track"><div class="bar-fill gray" style="width: 100%;"></div></div>
        <span class="bar-value">32h</span>
      </div>
      <div class="bar-row">
        <span class="bar-title">Con modelo</span>
        <div class="bar-track"><div class="bar-fill blue" style="width: 13%;"></div></div>
        <span class="bar-value">4h</span>
      </div>
    `,
    tags: ['Excel avanzado', 'Flujo de caja', 'Cuentas 10 a 59'],
    env: 'Grupo QUVO',
    status: 'En producción'
  },
  '2': {
    badge: '0 reparos',
    subtitle: 'Conciliación fiscal preventiva.',
    kpiTitle: 'Comprobantes auditados',
    kpiValue: '4,120 facturas',
    kpiDesc: '100% cotejadas contra el ERP Flowdesk sin contingencias tributarias.',
    chartHtml: `
      <div class="chart-header">
        <span class="chart-label">Cruce fiscal: compras declaradas vs registros ERP</span>
        <span class="chart-metric">100% auditado</span>
      </div>
      <div class="bar-row">
        <span class="bar-title">Facturas SUNAT</span>
        <div class="bar-track"><div class="bar-fill blue" style="width: 100%;"></div></div>
        <span class="bar-value">4,120</span>
      </div>
      <div class="bar-row">
        <span class="bar-title">Cruzadas ERP</span>
        <div class="bar-track"><div class="bar-fill green" style="width: 100%;"></div></div>
        <span class="bar-value">4,120</span>
      </div>
    `,
    tags: ['Cruce SUNAT ERP', 'Cuentas por pagar', 'Auditoría'],
    env: 'Flowdesk ERP',
    status: 'En producción'
  },
  '3': {
    badge: '-25h al mes',
    subtitle: 'Automatización de compras y ventas.',
    kpiTitle: 'Ahorro mensual',
    kpiValue: '~25h de trabajo',
    kpiDesc: 'Consultas en Power Query arman archivos planos TXT automáticamente.',
    chartHtml: `
      <div class="chart-header">
        <span class="chart-label">Curva de eficiencia en generación de TXT</span>
        <span class="chart-metric" style="color: var(--success);">Rápido</span>
      </div>
      <svg class="sparkline-svg" viewBox="0 0 200 40" style="margin-top: 6px;">
        <path d="M0,35 Q50,30 90,12 T160,8 L200,6" fill="none" stroke="#34A853" stroke-width="2.5"/>
        <circle cx="200" cy="6" r="3.5" fill="#34A853"/>
      </svg>
    `,
    tags: ['Power Query', 'Power Pivot', 'Archivos TXT'],
    env: 'Kreston Perú',
    status: 'En producción'
  },
  '4': {
    badge: 'En pruebas',
    subtitle: 'Conexión con plataforma SIRE.',
    kpiTitle: 'Avance funcional',
    kpiValue: 'Fase UI lista',
    kpiDesc: 'Descarga masiva de comprobantes sin caídas del portal fiscal.',
    chartHtml: `
      <div class="chart-header">
        <span class="chart-label">Avance de módulos funcionales</span>
        <span class="chart-metric">80% completado</span>
      </div>
      <div class="bar-track" style="margin-top: 6px;">
        <div class="bar-fill blue" style="width: 80%;"></div>
      </div>
    `,
    tags: ['SIRE SUNAT', 'Comprobantes', 'Banca web'],
    env: 'SUNAT SIRE',
    status: 'En validación'
  },
  '5': {
    badge: '160h al mes',
    subtitle: 'Dispersión masiva de haberes y facturas.',
    kpiTitle: 'Puntualidad operativa',
    kpiValue: '100% a tiempo',
    kpiDesc: 'Telecrédito BCP y detracciones pagadas sin multas ni observaciones.',
    chartHtml: `
      <div class="chart-header">
        <span class="chart-label">Distribución de desembolsos por tipo</span>
        <span class="chart-metric">100% al día</span>
      </div>
      <div class="bar-row">
        <span class="bar-title">Proveedores</span>
        <div class="bar-track"><div class="bar-fill blue" style="width: 60%;"></div></div>
        <span class="bar-value">60%</span>
      </div>
      <div class="bar-row">
        <span class="bar-title">Planillas</span>
        <div class="bar-track"><div class="bar-fill green" style="width: 25%;"></div></div>
        <span class="bar-value">25%</span>
      </div>
    `,
    tags: ['Telecrédito BCP', 'Planillas', 'Detracciones'],
    env: 'Telecrédito BCP',
    status: 'En producción'
  },
  '6': {
    badge: 'Formalizado',
    subtitle: 'Protocolo de pagos y autorizaciones.',
    kpiTitle: 'Control interno',
    kpiValue: 'Flujo en 3 pasos',
    kpiDesc: 'Validar, aprobar y transferir con filtros de revisión previa.',
    chartHtml: `
      <div class="chart-header">
        <span class="chart-label">Flujo de pago seguro</span>
        <span class="chart-metric" style="color: var(--mute);">3 pasos</span>
      </div>
      <div style="font-size: 11px; display: flex; justify-content: space-between; margin-top: 8px; color: var(--body);">
        <span>1. Validar</span>
        <span>→</span>
        <span>2. Aprobar</span>
        <span>→</span>
        <span>3. Dispersar</span>
      </div>
    `,
    tags: ['Manual de pagos', 'Flujogramas', 'Control interno'],
    env: 'Auditoría interna',
    status: 'Formalizado'
  }
};

function updateProjectInspector(projectId) {
  const data = projectsData[projectId];
  if (!data) return;

  const badgeEl = document.getElementById('inspector-badge');
  const subtitleEl = document.getElementById('inspector-subtitle');
  const kpiTitleEl = document.getElementById('inspector-kpi-title');
  const kpiValueEl = document.getElementById('inspector-kpi-value');
  const kpiDescEl = document.getElementById('inspector-kpi-desc');
  const chartBoxEl = document.getElementById('inspector-chart-container');
  const tagsBoxEl = document.getElementById('inspector-tags-container');
  const envEl = document.getElementById('inspector-env');
  const statusEl = document.getElementById('inspector-status');

  if (badgeEl) badgeEl.textContent = data.badge;
  if (subtitleEl) subtitleEl.textContent = data.subtitle;
  if (kpiTitleEl) kpiTitleEl.textContent = data.kpiTitle;
  if (kpiValueEl) kpiValueEl.textContent = data.kpiValue;
  if (kpiDescEl) kpiDescEl.textContent = data.kpiDesc;
  if (chartBoxEl) chartBoxEl.innerHTML = data.chartHtml;
  if (tagsBoxEl) {
    tagsBoxEl.innerHTML = data.tags.map(t => `<span class="tag">${t}</span>`).join('');
  }
  if (envEl) envEl.textContent = data.env;
  if (statusEl) statusEl.textContent = data.status;
}

function initProjectInspector() {
  const projectCards = document.querySelectorAll('.project-step');
  if (projectCards.length === 0) return;

  projectCards.forEach(card => {
    card.addEventListener('click', () => {
      const projectId = card.getAttribute('data-project');
      projectCards.forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      updateProjectInspector(projectId);
    });
  });

  updateProjectInspector('1');
}

/**
 * 4. Filtro de Proyectos
 */
function filterProjects(category, buttonElement) {
  document.querySelectorAll('.filter-pill').forEach(btn => btn.classList.remove('active'));
  if (buttonElement) buttonElement.classList.add('active');

  const cards = document.querySelectorAll('.project-step');
  let firstVisibleProject = null;

  cards.forEach(card => {
    const itemCategories = card.getAttribute('data-category') || '';
    if (category === 'all' || itemCategories.includes(category)) {
      card.style.display = 'flex';
      card.style.opacity = '0.7';
      if (!firstVisibleProject) {
        firstVisibleProject = card;
      }
    } else {
      card.style.display = 'none';
    }
  });

  if (firstVisibleProject) {
    cards.forEach(c => c.classList.remove('active'));
    firstVisibleProject.classList.add('active');
    const projectId = firstVisibleProject.getAttribute('data-project');
    updateProjectInspector(projectId);
  }
}

function initProjectFilters() {
  const defaultBtn = document.querySelector('.filter-pill[data-filter="all"]');
  if (defaultBtn) {
    defaultBtn.classList.add('active');
  }
}

/**
 * 5. Magic UI: Number Ticker para Métricas de Inicio
 */
let tickerHasRun = false;

function initNumberTicker() {
  triggerNumberTicker();
}

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
    // Curva de desaceleración suave (ease-out-cubic)
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
 * 6. Interceptación de Enlaces de Ancla (#) para Navegación por Diapositivas
 */
function initAnchorIntercept() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const targetId = this.getAttribute('href').replace('#', '');
      if (!targetId) return;
      const index = SLIDES.indexOf(targetId);
      if (index !== -1) {
        e.preventDefault();
        goToSlide(index);
      }
    });
  });
}
