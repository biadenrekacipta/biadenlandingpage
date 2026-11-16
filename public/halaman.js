// Peningkatan progresif seluruh halaman (docs/design-reference.md): reveal mask saat scroll dan kursor cincin.
// Tanpa JS, semua konten tetap tampil. Reduced motion: tanpa reveal dan tanpa kursor kustom.
(() => {
  const d = document.documentElement;
  const rm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(pointer: fine)').matches;

  if (!rm && 'IntersectionObserver' in window) {
    d.classList.add('rv-on');
    const io = new IntersectionObserver(
      (es) => {
        for (const e of es) {
          if (!e.isIntersecting) continue;
          e.target.setAttribute('data-in', '');
          io.unobserve(e.target);
        }
      },
      { rootMargin: '0px 0px -6% 0px' },
    );
    const mulai = () => document.querySelectorAll('[data-rv]').forEach((el) => io.observe(el));
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mulai);
    else mulai();
  }

  if (!fine || rm) return;
  const siap = () => {
    const c = document.createElement('div');
    c.className = 'pg-cursor';
    c.setAttribute('aria-hidden', 'true');
    c.innerHTML = '<span class="pc-ring"></span><span class="pc-dot"></span>';
    document.body.append(c);
    let mx = 0, my = 0, x = 0, y = 0, raf = 0, ada = false;
    const tik = () => {
      x += (mx - x) * 0.25;
      y += (my - y) * 0.25;
      c.style.transform = `translate3d(${x}px,${y}px,0)`;
      raf = Math.abs(mx - x) + Math.abs(my - y) > 0.5 ? requestAnimationFrame(tik) : 0;
    };
    addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      const t = e.target instanceof Element ? e.target : null;
      // Rak punya kursor sendiri (rak.js); kolom isian memakai kursor teks bawaan.
      const pakai = !!t && !t.closest('.rak, .detail, input, textarea, select');
      d.classList.toggle('pg-cur', pakai);
      c.dataset.st = pakai && t.closest('a, button, summary, label') ? 'btn' : 'default';
      c.style.visibility = pakai ? 'visible' : 'hidden';
      mx = e.clientX;
      my = e.clientY;
      if (!ada) { x = mx; y = my; ada = true; }
      if (!raf) raf = requestAnimationFrame(tik);
    }, { passive: true });
    document.addEventListener('pointerleave', () => { c.style.visibility = 'hidden'; d.classList.remove('pg-cur'); });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', siap);
  else siap();
})();
