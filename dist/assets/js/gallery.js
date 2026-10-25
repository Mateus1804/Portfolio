// Links para as imagens continuam utilizáveis sem JavaScript.
export function initGallery() {
  const links = [
    ...document.querySelectorAll(
      '.interface-gallery a[href$=".png"], .interface-gallery a[href$=".jpg"]'
    )
  ];
  if (!links.length || typeof HTMLDialogElement === 'undefined') return;
  const dialog = document.createElement('dialog');
  dialog.className = 'image-dialog';
  const title = document.createElement('h2');
  title.id = 'image-dialog-title';
  title.textContent = 'Captura do projeto';
  dialog.setAttribute('aria-labelledby', title.id);
  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'button button-dark';
  close.textContent = 'Fechar imagem';
  const image = document.createElement('img');
  const caption = document.createElement('p');
  dialog.append(title, close, image, caption);
  document.body.append(dialog);
  close.addEventListener('click', () => dialog.close());
  for (const link of links)
    link.addEventListener('click', (event) => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0)
        return;
      event.preventDefault();
      image.src = link.href;
      image.alt = link.querySelector('img')?.alt || 'Captura do projeto';
      caption.textContent = image.alt;
      dialog.showModal();
    });
  dialog.addEventListener('close', () => {
    image.removeAttribute('src');
  });
}
