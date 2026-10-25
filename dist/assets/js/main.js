const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#navegacao');

if (menuButton && navigation) {
  menuButton.hidden = false;
  const setMenu = (expanded, returnFocus = false) => {
    menuButton.setAttribute('aria-expanded', String(expanded));
    menuButton.setAttribute('aria-label', expanded ? 'Fechar menu' : 'Abrir menu');
    navigation.classList.toggle('collapsed', !expanded);
    if (returnFocus) menuButton.focus();
  };
  setMenu(false);
  menuButton.addEventListener('click', () => setMenu(menuButton.getAttribute('aria-expanded') !== 'true'));
  navigation.addEventListener('click', (event) => {
    if (event.target.closest('a')) setMenu(false);
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') setMenu(false, true);
  });
  const mobileMedia = window.matchMedia('(max-width: 600px)');
  mobileMedia.addEventListener('change', () => setMenu(false));
}

const filterGroup = document.querySelector('.project-filters');
if (filterGroup) {
  filterGroup.hidden = false;
  const cards = [...document.querySelectorAll('.project-card')];
  const projectResult = document.querySelector('#project-result');
  filterGroup.addEventListener('click', (event) => {
    const button = event.target.closest('[data-filter]');
    if (!button) return;
    for (const filter of filterGroup.querySelectorAll('[data-filter]')) {
      const selected = filter === button;
      filter.classList.toggle('active', selected);
      filter.setAttribute('aria-pressed', String(selected));
    }
    let count = 0;
    for (const card of cards) {
      card.hidden = button.dataset.filter !== 'all' && card.dataset.category !== button.dataset.filter;
      if (!card.hidden) count += 1;
    }
    if (projectResult) projectResult.textContent = `${count} ${count === 1 ? 'projeto para explorar' : 'projetos para explorar'}`;
  });
}

const copyButton = document.querySelector('[data-copy-email]');
if (copyButton && navigator.clipboard?.writeText) {
  copyButton.hidden = false;
  copyButton.addEventListener('click', async () => {
    const status = document.querySelector('#copy-status');
    let timeout;
    copyButton.disabled = true;
    if (status) status.textContent = 'Copiando e-mail…';
    try {
      await Promise.race([
        navigator.clipboard.writeText(copyButton.dataset.copyEmail),
        new Promise((_, reject) => { timeout = setTimeout(() => reject(new Error('Clipboard indisponível')), 3000); })
      ]);
      if (status) status.textContent = 'E-mail copiado. Até logo na sua caixa de entrada!';
    } catch {
      if (status) status.textContent = 'Não foi possível copiar. Selecione o endereço acima ou clique para abrir seu e-mail.';
    } finally {
      clearTimeout(timeout);
      copyButton.disabled = false;
    }
  });
}

for (const year of document.querySelectorAll('[data-year]')) year.textContent = String(new Date().getFullYear());

// A narrativa permanece legível sem JavaScript. O movimento só sincroniza a prévia.
const story = document.querySelector('[data-story]');
const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
if (story && 'IntersectionObserver' in window) {
  const steps = [...story.querySelectorAll('[data-story-step]')];
  const frames = [...story.querySelectorAll('[data-story-frame]')];
  const markers = [...story.querySelectorAll('[data-story-marker]')];
  const position = story.querySelector('[data-story-position]');
  const stage = story.querySelector('.story-stage');
  let activeIndex = -1;
  let visible = false;
  let scheduledFrame = 0;

  const activate = (index) => {
    if (index === activeIndex || index < 0 || index >= steps.length) return;
    activeIndex = index;
    const id = steps[index].dataset.storyStep;
    for (const step of steps) {
      const active = step.dataset.storyStep === id;
      step.classList.toggle('is-active', active);
      if (active) step.setAttribute('aria-current', 'step');
      else step.removeAttribute('aria-current');
    }
    for (const frame of frames) {
      const active = frame.dataset.storyFrame === id;
      frame.classList.toggle('is-active', active);
      frame.setAttribute('aria-hidden', String(!active));
    }
    for (const marker of markers) marker.classList.toggle('is-active', marker.dataset.storyMarker === id);
    if (position) position.textContent = `${String(index + 1).padStart(2, '0')} / ${String(steps.length).padStart(2, '0')}`;
  };
  const update = () => {
    scheduledFrame = 0;
    if (!visible || motionPreference.matches) return;
    const mobile = window.matchMedia('(max-width: 600px)').matches;
    const sticky = getComputedStyle(stage).position === 'sticky';
    const readingLine = mobile && sticky
      ? Math.min(window.innerHeight - 60, stage.getBoundingClientRect().bottom + 110)
      : window.innerHeight * 0.55;
    let next = 0;
    for (let index = 0; index < steps.length; index += 1) {
      if (steps[index].getBoundingClientRect().top <= readingLine) next = index;
    }
    activate(next);
  };
  const schedule = () => {
    if (visible && !motionPreference.matches && !scheduledFrame) scheduledFrame = requestAnimationFrame(update);
  };
  const setMotion = () => {
    story.classList.toggle('story-enhanced', !motionPreference.matches);
    if (motionPreference.matches) {
      if (scheduledFrame) cancelAnimationFrame(scheduledFrame);
      scheduledFrame = 0;
      activate(0);
    } else schedule();
  };
  const observer = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    schedule();
  }, { rootMargin: '100px 0px' });
  observer.observe(story);
  story.addEventListener('focusin', (event) => {
    if (motionPreference.matches) return;
    const focusedStep = event.target.closest('[data-story-step]');
    if (focusedStep) activate(steps.indexOf(focusedStep));
  });
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule, { passive: true });
  motionPreference.addEventListener('change', setMotion);
  activate(0);
  setMotion();
}

if ('IntersectionObserver' in window) {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    }
  }, { threshold: 0.12 });
  document.documentElement.classList.add('reveal-ready');
  for (const section of document.querySelectorAll('[data-reveal]')) revealObserver.observe(section);
}
