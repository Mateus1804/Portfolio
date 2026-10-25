import { initStorytelling } from './storytelling.js';

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
  menuButton.addEventListener('click', () =>
    setMenu(menuButton.getAttribute('aria-expanded') !== 'true')
  );
  navigation.addEventListener('click', (event) => {
    if (event.target.closest('a')) setMenu(false);
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true')
      setMenu(false, true);
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
      card.hidden =
        button.dataset.filter !== 'all' && card.dataset.category !== button.dataset.filter;
      if (!card.hidden) count += 1;
    }
    if (projectResult)
      projectResult.textContent = `${count} ${count === 1 ? 'projeto para explorar' : 'projetos para explorar'}`;
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
        new Promise((_, reject) => {
          timeout = setTimeout(() => reject(new Error('Clipboard indisponível')), 3000);
        })
      ]);
      if (status) status.textContent = 'E-mail copiado. Até logo na sua caixa de entrada!';
    } catch {
      if (status)
        status.textContent =
          'Não foi possível copiar. Selecione o endereço acima ou clique para abrir seu e-mail.';
    } finally {
      clearTimeout(timeout);
      copyButton.disabled = false;
    }
  });
}

for (const year of document.querySelectorAll('[data-year]'))
  year.textContent = String(new Date().getFullYear());

initStorytelling();
