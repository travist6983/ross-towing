// Mobile menu toggle, shared by every page.
const D = document;
(function menu() {
  const btn = D.querySelector('.menu-btn'), nav = D.getElementById('site-nav');
  if (!btn || !nav) return;
  btn.addEventListener('click', () => {
    const open = btn.getAttribute('aria-expanded') !== 'true';
    btn.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('open', open);
    btn.textContent = open ? 'Close' : 'Menu';
  });
  nav.addEventListener('click', (e) => {
    if (e.target.closest('a') && nav.classList.contains('open')) { btn.click(); }
  });
})();
