
const btn = document.querySelector('.mobileMenuButton');
const panel = document.querySelector('.mobilePanel');
if (btn && panel) {
  btn.addEventListener('click', () => {
    const open = btn.getAttribute('aria-expanded') === 'true';
    btn.setAttribute('aria-expanded', String(!open));
    panel.classList.toggle('open', !open);
    document.body.style.overflow = !open ? 'hidden' : '';
  });
  panel.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    btn.setAttribute('aria-expanded','false'); panel.classList.remove('open'); document.body.style.overflow='';
  }));
  window.addEventListener('resize', () => { if (window.innerWidth > 980) { btn.setAttribute('aria-expanded','false'); panel.classList.remove('open'); document.body.style.overflow=''; }});
}
