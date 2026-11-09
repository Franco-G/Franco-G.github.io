/**
 * Portafolio de Business Intelligence & Finanzas - Franco Guerrero
 * Lógica interactiva: Scrollytelling Total, Navegación de Capítulos, Magic UI y Desplazamiento Suave.
 */

document.addEventListener('DOMContentLoaded', () => {
  initSmoothScroll();
  initChapterNavigation();
  initScrollytelling();
  initProjectsScrollytelling();
  initProjectFilters();
});

/**
 * 1. Desplazamiento Suave y Leve (Gentle Smooth Scroll)
 * Garantiza una transición de cámara elegante sin saltos bruscos.
 */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#' || !targetId) return;

      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        e.preventDefault();
        gentleScrollTo(targetElement, 700);
      }
    });
  });
}

function gentleScrollTo(element, duration = 700) {
  const headerOffset = 76;
  const targetPosition = element.getBoundingClientRect().top + window.pageYOffset - headerOffset;
  const startPosition = window.pageYOffset;
  const distance = targetPosition - startPosition;
  let startTime = null;

  function animation(currentTime) {
    if (startTime === null) startTime = currentTime;
    const timeElapsed = currentTime - startTime;
    const progress = Math.min(timeElapsed / duration, 1);
    
    // Función de desaceleración suave (ease-out-cubic)
    const ease = 1 - Math.pow(1 - progress, 3);
    window.scrollTo(0, startPosition + distance * ease);

    if (timeElapsed < duration) {
      requestAnimationFrame(animation);
    }
  }

  requestAnimationFrame(animation);
}

/**
 * 2. Navegador de Capítulos Global (Scrollytelling Total)
 * Observa las 4 secciones principales y actualiza los puntos de la barra lateral.
 */
function scrollToChapter(chapterId) {
  const target = document.getElementById(chapterId);
  if (target) {
    document.querySelectorAll('.scrolly-nav-dot').forEach(dot => {
      dot.classList.toggle('active', dot.getAttribute('data-chapter') === chapterId);
    });
    gentleScrollTo(target, 700);
  }
}

function initChapterNavigation() {
  const chapters = ['inicio', 'experiencia', 'proyectos', 'contacto'];
  const navDots = document.querySelectorAll('.scrolly-nav-dot');

  if (navDots.length === 0) return;

  function setActiveDot(chapterId) {
    navDots.forEach(dot => {
      dot.classList.toggle('active', dot.getAttribute('data-chapter') === chapterId);
    });
  }

  function updateActiveChapter() {
    // Al final del documento, activar siempre Contacto
    if (window.innerHeight + window.pageYOffset >= document.documentElement.scrollHeight - 60) {
      setActiveDot('contacto');
      return;
    }

    const scrollPos = window.pageYOffset + 140; // Línea de lectura debajo de la cabecera
    let currentChapter = 'inicio';

    for (const id of chapters) {
      const el = document.getElementById(id);
      if (el) {
        const top = el.offsetTop;
        if (scrollPos >= top) {
          currentChapter = id;
        }
      }
    }

    setActiveDot(currentChapter);
  }

  window.addEventListener('scroll', updateActiveChapter, { passive: true });
  updateActiveChapter();
}

/**
 * 3. Scrollytelling Capítulo 2: Tablero Interactivo en Tres Actos
 */
const stepToTab = {
  '1': 'quvo',
  '2': 'sunat',
  '3': 'cxp'
};

function displayTab(tabId) {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
  });
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.toggle('active', content.id === 'tab-' + tabId);
  });
}

function manualSwitchTab(tabId, element) {
  displayTab(tabId);
}

function scrollToStep(stepNumber) {
  const stepElement = document.querySelector(`.scrolly-step[data-step="${stepNumber}"]`);
  if (stepElement) {
    gentleScrollTo(stepElement, 600);
  }
}

function initScrollytelling() {
  const scrollySteps = document.querySelectorAll('.scrolly-step');
  if (scrollySteps.length === 0) return;

  const stepObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const stepNumber = entry.target.getAttribute('data-step');

        scrollySteps.forEach(s => s.classList.remove('active'));
        entry.target.classList.add('active');

        const targetTab = stepToTab[stepNumber];
        if (targetTab) {
          displayTab(targetTab);
        }
      }
    });
  }, {
    threshold: 0.35,
    rootMargin: '-10% 0px -20% 0px'
  });

  scrollySteps.forEach(step => stepObserver.observe(step));
}

/**
 * 4. Scrollytelling Capítulo 3: Visor Inspector de Entregables
 * Información detallada sincronizada dinámicamente con las tarjetas al scrollear.
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

let isManualProjectSelecting = false;

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

function initProjectsScrollytelling() {
  const projectCards = document.querySelectorAll('.project-step');
  if (projectCards.length === 0) return;

  const projectObserver = new IntersectionObserver((entries) => {
    if (isManualProjectSelecting) return;

    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const projectId = entry.target.getAttribute('data-project');
        projectCards.forEach(c => c.classList.remove('active'));
        entry.target.classList.add('active');
        updateProjectInspector(projectId);
      }
    });
  }, {
    threshold: 0.25,
    rootMargin: '-10% 0px -25% 0px'
  });

  projectCards.forEach(card => {
    projectObserver.observe(card);

    // Permite al usuario hacer clic en cualquier tarjeta para seleccionarla suavemente
    card.addEventListener('click', () => {
      isManualProjectSelecting = true;
      const projectId = card.getAttribute('data-project');
      projectCards.forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      updateProjectInspector(projectId);
      gentleScrollTo(card, 500);
      setTimeout(() => {
        isManualProjectSelecting = false;
      }, 650);
    });
  });

  // Inicializar con el primer proyecto
  updateProjectInspector('1');
}

/**
 * 5. Filtro Interactivo de Entregables
 * Segmentación dinámica con actualización sincronizada del visor inspector.
 */
function filterProjects(category, buttonElement) {
  document.querySelectorAll('.filter-pill').forEach(btn => btn.classList.remove('active'));
  buttonElement.classList.add('active');

  const cards = document.querySelectorAll('.project-step');
  let firstVisibleProject = null;

  cards.forEach(card => {
    const itemCategories = card.getAttribute('data-category') || '';
    if (category === 'all' || itemCategories.includes(category)) {
      card.style.display = 'flex';
      card.style.opacity = '1';
      if (!firstVisibleProject) {
        firstVisibleProject = card;
      }
    } else {
      card.style.display = 'none';
    }
  });

  // Sincronizar el visor con el primer proyecto visible tras filtrar
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
