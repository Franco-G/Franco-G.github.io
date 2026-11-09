/**
 * Portafolio de Business Intelligence & Finanzas - Franco Guerrero
 * Lógica interactiva: Scrollytelling, Magic UI, filtrado y deslizamiento suave leve.
 */

document.addEventListener('DOMContentLoaded', () => {
  initSmoothScroll();
  initScrollytelling();
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
        gentleScrollTo(targetElement, 750);
      }
    });
  });
}

function gentleScrollTo(element, duration = 750) {
  const targetPosition = element.getBoundingClientRect().top + window.pageYOffset - 76;
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
 * 2. Scrollytelling y Tablero Interactivo
 * Conexión entre los pasos de narrativa y las capas del escenario fijo.
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
  const scrollyDots = document.querySelectorAll('.scrolly-dot');
  const scrollyContainer = document.querySelector('.scrolly-section');
  const scrollyDotsContainer = document.querySelector('.scrolly-dots');

  if (scrollySteps.length > 0) {
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

          scrollyDots.forEach(dot => {
            dot.classList.toggle('active', dot.getAttribute('data-act') === stepNumber);
          });
        }
      });
    }, {
      threshold: 0.45,
      rootMargin: '-10% 0px -20% 0px'
    });

    scrollySteps.forEach(step => stepObserver.observe(step));
  }

  if (scrollyContainer && scrollyDotsContainer) {
    const containerObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        scrollyDotsContainer.classList.toggle('visible', entry.isIntersecting);
      });
    }, { threshold: 0.05 });

    containerObserver.observe(scrollyContainer);
  }
}

/**
 * 3. Filtro Interactivo de Entregables
 * Segmentación dinámica en un clic.
 */
function filterProjects(category, buttonElement) {
  document.querySelectorAll('.filter-pill').forEach(btn => btn.classList.remove('active'));
  buttonElement.classList.add('active');

  const cards = document.querySelectorAll('#proyectos .card');
  cards.forEach(card => {
    const itemCategories = card.getAttribute('data-category') || '';
    if (category === 'all' || itemCategories.includes(category)) {
      card.style.display = 'flex';
      card.style.opacity = '1';
    } else {
      card.style.display = 'none';
    }
  });
}

function initProjectFilters() {
  // Asegura el estado inicial
  const defaultBtn = document.querySelector('.filter-pill[data-filter="all"]');
  if (defaultBtn) {
    defaultBtn.classList.add('active');
  }
}
