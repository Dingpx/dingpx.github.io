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
