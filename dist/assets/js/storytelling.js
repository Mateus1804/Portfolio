// A rolagem só sincroniza a prévia; o conteúdo permanece no HTML.
export function initStorytelling() {
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
      for (const marker of markers)
        marker.classList.toggle('is-active', marker.dataset.storyMarker === id);
      if (position)
        position.textContent = `${String(index + 1).padStart(2, '0')} / ${String(steps.length).padStart(2, '0')}`;
    };
    const update = () => {
      scheduledFrame = 0;
      if (!visible || motionPreference.matches) return;
      const mobile = window.matchMedia('(max-width: 600px)').matches;
      const sticky = getComputedStyle(stage).position === 'sticky';
      const readingLine =
        mobile && sticky
          ? Math.min(window.innerHeight - 60, stage.getBoundingClientRect().bottom + 110)
          : window.innerHeight * 0.55;
      let next = 0;
      for (let index = 0; index < steps.length; index += 1) {
        if (steps[index].getBoundingClientRect().top <= readingLine) next = index;
      }
      activate(next);
    };
    const schedule = () => {
      if (visible && !motionPreference.matches && !scheduledFrame)
        scheduledFrame = requestAnimationFrame(update);
    };
    const setMotion = () => {
      story.classList.toggle('story-enhanced', !motionPreference.matches);
      if (motionPreference.matches) {
        if (scheduledFrame) cancelAnimationFrame(scheduledFrame);
        scheduledFrame = 0;
        activate(0);
      } else schedule();
    };
    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        schedule();
      },
      { rootMargin: '100px 0px' }
    );
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
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.12 }
    );
    document.documentElement.classList.add('reveal-ready');
    for (const section of document.querySelectorAll('[data-reveal]'))
      revealObserver.observe(section);
  }
}
