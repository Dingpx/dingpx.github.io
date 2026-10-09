(() => {
  // Preserve links to individual papers, including papers inside closed archives.
  function revealLinkedPaper() {
    let id;
    try { id = decodeURIComponent(window.location.hash.slice(1)); } catch { return; }
    if (!id) return;
    const target = document.getElementById(id);
    if (!target) return;
    let ancestor = target.parentElement;
    let revealed = false;
    while (ancestor) {
      if (ancestor instanceof HTMLDetailsElement && !ancestor.open) {
        ancestor.open = true;
        revealed = true;
      }
      ancestor = ancestor.parentElement;
    }
    if (revealed) requestAnimationFrame(() => target.scrollIntoView({block: 'start', behavior: 'instant'}));
  }
  revealLinkedPaper();
  window.addEventListener('hashchange', revealLinkedPaper);
  document.addEventListener('click', event => {
    const link = event.target.closest('a[href^="#"]');
    if (link && link.hash === window.location.hash) revealLinkedPaper();
  });

  const navLinks = [...document.querySelectorAll('.site-nav a')];
  const sections = navLinks.map(link => document.querySelector(link.hash));
  let pending = false;
  function updateNavigation() {
    const offset = document.querySelector('.site-header').getBoundingClientRect().bottom + 40;
    let current = 0;
    sections.forEach((section, index) => {
      if (section.getBoundingClientRect().top <= offset) current = index;
    });
    navLinks.forEach((link, index) => {
      if (index === current) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
    pending = false;
  }
  function scheduleNavigation() {
    if (!pending) { pending = true; requestAnimationFrame(updateNavigation); }
  }
  window.addEventListener('scroll', scheduleNavigation, {passive: true});
  window.addEventListener('resize', scheduleNavigation, {passive: true});
  document.addEventListener('toggle', scheduleNavigation, true);
  updateNavigation();

  const imageDialog = document.querySelector('.publication-lightbox');
  if (imageDialog && typeof imageDialog.showModal === 'function') {
    let imageTrigger = null;
    document.querySelectorAll('[data-publication-image]').forEach(link => {
      link.setAttribute('aria-haspopup', 'dialog');
      link.addEventListener('click', event => {
        if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        imageTrigger = link;
        const image = imageDialog.querySelector('.lightbox-image');
        const thumbnail = link.querySelector('img');
        image.alt = thumbnail.alt;
        image.width = Number(thumbnail.getAttribute('width'));
        image.height = Number(thumbnail.getAttribute('height'));
        image.src = link.href;
        imageDialog.querySelector('#lightbox-title').textContent = link.dataset.title;
        imageDialog.querySelector('#lightbox-caption').textContent = link.dataset.caption;
        const source = imageDialog.querySelector('.lightbox-source');
        source.href = link.dataset.source;
        source.textContent = link.dataset.sourceLabel + ' ↗';
        imageDialog.showModal();
        document.body.classList.add('image-viewer-open');
      });
    });
    imageDialog.addEventListener('click', event => {
      const bounds = imageDialog.getBoundingClientRect();
      if (event.target === imageDialog && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) imageDialog.close();
    });
    imageDialog.addEventListener('close', () => {
      document.body.classList.remove('image-viewer-open');
      if (imageTrigger) imageTrigger.focus({preventScroll: true});
    });
  }

  // Print the full publication record; restore the reader's choices afterwards.
  let printState = [];
  window.addEventListener('beforeprint', () => {
    printState = [...document.querySelectorAll('.publication-archive')].map(details => [details, details.open]);
    printState.forEach(([details]) => { details.open = true; });
  });
  window.addEventListener('afterprint', () => {
    printState.forEach(([details, open]) => { details.open = open; });
    printState = [];
  });
})();
