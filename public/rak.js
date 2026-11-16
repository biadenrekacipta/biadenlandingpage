// Rak jurnal 3D: satu skrip eksternal 'self' (Keputusan 2026-11-16). Peningkatan progresif:
// tanpa skrip ini, markup statis dari Rak.astro tetap utuh. Tanpa inline style di HTML: semua lewat CSSOM.
// Rumus: docs/design-reference.md ("Motion engine"). Satu loop rAF + Web Animations API, tanpa fade opacity.
const rak = document.querySelector('.rak');
if (rak) init(rak);

function init(rak) {
  const shelf = rak.querySelector('.shelf');
  const stage = rak.querySelector('.stage');
  const orig = [...stage.querySelectorAll('.tape')];
  const n = orig.length;
  if (!shelf || !stage || n === 0) return;

  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const fine = matchMedia('(pointer: fine)').matches;
  const mod = (a, m) => ((a % m) + m) % m;
  const sstep = (x) => x * x * (3 - 2 * x);
  const EASE = 'cubic-bezier(.2,.8,.2,1)';

  // Data dari markup (GR-11: tidak ada teks baru).
  const films = orig.map((el) => ({
    id: el.dataset.id,
    judul: el.querySelector('.sp-nama')?.textContent ?? '',
    sub: el.querySelector('.cv-bidang')?.textContent ?? '',
  }));

  // Ukuran dari --H yang sebenarnya (probe di luar layar).
  const probe = document.createElement('div');
  probe.style.position = 'absolute';
  probe.style.visibility = 'hidden';
  probe.style.width = '0';
  probe.style.height = 'var(--H)';
  rak.append(probe);
  let H = 0, ws = 0, d = 0, gap = 0, W = 0;
  function measure() {
    H = probe.getBoundingClientRect().height;
    ws = (H * 142) / 840;
    d = (H * 474) / 900;
    gap = H * 0.03;
    W = shelf.clientWidth;
  }

  // Rak tanpa ujung: salin n jurnal sampai layar penuh. total = jumlah salinan * n.
  let tapes = [];
  let total = 0;
  let s = 0, T = 0;
  const aktifAwal = Math.max(0, orig.findIndex((el) => el.getAttribute('data-r') === '0')); // dibaca sebelum data-r dibuang
  function build() {
    const butuh = (W + 3 * d) / (ws + gap) + 2;
    const copies = Math.max(3, Math.ceil(butuh / n));
    if (copies * n === total) return;
    const lama = total;
    stage.querySelectorAll('.tape[data-clone]').forEach((e) => e.remove());
    total = copies * n;
    tapes = [];
    for (let v = 0; v < total; v++) {
      let el;
      if (v < n) el = orig[v];
      else {
        el = orig[v % n].cloneNode(true);
        el.dataset.clone = '';
        el.setAttribute('aria-hidden', 'true');
        el.querySelector('.sr')?.remove();
        stage.append(el);
      }
      el.removeAttribute('data-r'); // posisi statis tahap 1 diganti transform dari JS
      el.dataset.v = String(v);
      tapes.push({ el, v, lift: 0, vis: true });
    }
    const awal = Math.floor(copies / 2) * n;
    if (lama === 0) {
      s = T = awal + aktifAwal;
    } else {
      const baru = awal + mod(Math.round(s), n);
      const geser = baru - s;
      s += geser;
      T += geser;
    }
  }
  measure();
  build();

  // ---- State ----
  let active = mod(Math.round(s), n);
  let hover = -1;
  let tiltX = 0, tiltY = 0;
  let onCover = false;
  let isOpen = false; // diisi tahap 3 (sheet detail)
  let mx = 0, my = 0, havePointer = false, mouseInside = false;
  let cx = 0, cy = 0;
  let overBtn = false;
  let dragging = false, dragStartX = 0, dragT0 = 0, dragId = -1, suppress = false;
  let wheelTimer = 0;
  let dirLast = 1;
  let visible = true;
  let raf = 0, last = 0;

  // ---- Tab, caption ----
  const tabs = [...rak.querySelectorAll('.tabs button')];
  const tabsNav = rak.querySelector('.tabs');
  const ind = document.createElement('span');
  ind.className = 'tab-ind';
  ind.setAttribute('aria-hidden', 'true');
  tabsNav?.prepend(ind);
  function moveIndicator() {
    const t = tabs.find((b) => b.getAttribute('aria-current') === 'true');
    if (!t) {
      ind.style.width = '0px';
      return;
    }
    ind.style.width = t.offsetWidth + 'px';
    ind.style.transform = `translateX(${t.offsetLeft}px)`;
  }
  function setActiveTab() {
    for (const b of tabs) {
      if (b.dataset.tab === films[active].id) b.setAttribute('aria-current', 'true');
      else b.removeAttribute('aria-current'); // "Semua" tidak pernah menyala
    }
    moveIndicator();
  }

  const masks = [...rak.querySelectorAll('.cap-m')];
  const kelas = masks.map((m) => m.firstElementChild?.className ?? '');
  function swap(a, dir) {
    const teks = [films[a].judul, films[a].sub];
    masks.forEach((mask, i) => {
      const lama = [...mask.children];
      const span = document.createElement('span');
      span.className = kelas[i];
      span.textContent = teks[i];
      if (reduce.matches) {
        lama.forEach((o) => o.remove());
        mask.append(span);
        return;
      }
      for (const o of lama) {
        if (o._pergi) continue;
        o._pergi = true;
        const cur = getComputedStyle(o).transform;
        o.animate(
          [{ transform: cur === 'none' ? 'translateY(0)' : cur }, { transform: `translateY(${-dir * 105}%)` }],
          { duration: 650, easing: EASE, fill: 'both' },
        ).onfinish = () => o.remove();
      }
      mask.append(span);
      span.animate([{ transform: `translateY(${dir * 105}%)` }, { transform: 'translateY(0)' }], {
        duration: 650,
        easing: EASE,
        fill: 'both',
      });
    });
  }

  // ---- Kursor kustom (pointer:fine, hanya di atas rak) ----
  let cur = null;
  if (fine) {
    rak.dataset.cursor = '';
    cur = document.createElement('div');
    cur.className = 'rak-cursor';
    cur.dataset.st = 'default';
    cur.setAttribute('aria-hidden', 'true');
    cur.innerHTML = '<span class="rc-ring"></span><span class="rc-dot"></span><span class="rc-lbl lbl">Buka</span>';
    document.body.append(cur);
  }

  // ---- Detail: stub, diisi tahap 3 ----
  function openDetail() {
    rak.dispatchEvent(new CustomEvent('rak:open', { detail: { index: active } }));
  }
  function closeDetail() {
    rak.dispatchEvent(new CustomEvent('rak:close'));
  }

  // ---- Frame ----
  const F = (r) => {
    const b = Math.abs(r) < 1 ? (r + Math.sin(Math.PI * r) / Math.PI) / 2 : Math.sign(r) * 0.5;
    return r * (ws + gap) + (d - ws + 1.6 * gap) * b;
  };
  const play = rak.querySelector('.play');

  function frame(t) {
    raf = 0;
    if (!visible) {
      last = 0;
      return;
    }
    const dt = last ? Math.min((t - last) / 1000, 0.05) : 1 / 60;
    last = t;
    const rm = reduce.matches;
    const f = (k) => (rm ? 1 : 1 - Math.exp(-k * dt));

    s += (T - s) * f(dragging ? 18 : 5.2);
    if (Math.abs(T - s) < 1e-4) s = T;
    if (Math.abs(s) > total * 4) {
      const g = Math.round(s / total) * total;
      s -= g;
      T -= g;
    }
    if (T - s) dirLast = Math.sign(T - s);

    const a = mod(Math.round(s), n);
    if (a !== active) {
      active = a;
      swap(a, dirLast);
      setActiveTab();
    }

    const rect = shelf.getBoundingClientRect();
    W = rect.width;
    const ccx = rect.left + W / 2;
    const ccy = rect.top + rect.height / 2;
    onCover =
      havePointer && !isOpen && Math.abs(mx - ccx) < 0.55 * d && Math.abs(my - ccy) < 0.55 * H && Math.abs(T - s) < 0.3;
    let ty = 0, tx = 0;
    if (havePointer) {
      ty = onCover ? ((mx - ccx) / (0.55 * d)) * 9 : ((mx - ccx) / W) * 5;
      tx = onCover ? (-(my - ccy) / (H / 2)) * 6 : 0;
    }
    tiltY += (ty - tiltY) * f(7);
    tiltX += (tx - tiltX) * f(7);

    for (const p of tapes) {
      const r = mod(p.v - s + total / 2, total) - total / 2;
      const ar = Math.abs(r);
      const x = F(r);
      if (Math.abs(x) > W / 2 + 1.5 * d) {
        if (p.vis) {
          p.el.style.visibility = 'hidden';
          p.vis = false;
        }
        continue;
      }
      if (!p.vis) {
        p.el.style.visibility = '';
        p.vis = true;
      }
      const o = sstep(Math.max(0, 1 - ar));
      p.lift += ((hover === p.v && ar > 0.5 ? 1 : 0) - p.lift) * f(12);
      const y = -o * 0.025 * H - p.lift * 0.045 * H;
      p.el.style.transform = `translate3d(${x}px,${y}px,${o * 0.2 * H}px) rotateZ(${-4.5 * o}deg) rotateX(${tiltX * o}deg) rotateY(${-90 * o + tiltY * o}deg)`;
      p.el.style.zIndex = String(Math.round(100 - ar * 4));
      p.el.style.setProperty('--o', String(o));
    }

    if (play) {
      const k = sstep(Math.max(0, 1 - Math.abs(T - s) * 3));
      play.style.transform = `scale(${k})`;
      play.style.visibility = k < 0.01 ? 'hidden' : '';
    }

    if (cur) {
      if (mouseInside) {
        cx += (mx - cx) * f(16);
        cy += (my - cy) * f(16);
        cur.style.transform = `translate3d(${cx}px,${cy}px,0)`;
        const sp = hover >= 0 && Math.abs(mod(hover - s + total / 2, total) - total / 2) > 0.5;
        cur.dataset.st = overBtn ? 'btn' : onCover ? 'open' : sp ? 'spine' : 'default';
      }
      cur.style.visibility = mouseInside ? 'visible' : 'hidden';
    }

    raf = requestAnimationFrame(frame);
  }
  function kick() {
    if (!raf && visible) raf = requestAnimationFrame(frame);
  }

  // ---- Input ----
  const go = (v) => {
    T = Math.round(T) + v;
  };
  rak.querySelector('.panah-k')?.addEventListener('click', () => go(-1));
  rak.querySelector('.panah-b')?.addEventListener('click', () => go(1));
  play?.addEventListener('click', openDetail);
  for (const b of tabs) {
    b.addEventListener('click', () => {
      const idx = b.dataset.tab === 'semua' ? 0 : films.findIndex((x) => x.id === b.dataset.tab);
      if (idx < 0) return;
      const base = Math.round(T);
      let dd = mod(idx - mod(base, n), n);
      if (dd > n / 2) dd -= n; // jalan terpendek
      T = base + dd;
    });
  }

  stage.addEventListener('pointerover', (e) => {
    const el = e.target.closest?.('.tape');
    hover = el ? +el.dataset.v : -1;
  });
  stage.addEventListener('pointerleave', () => {
    hover = -1;
  });

  shelf.addEventListener('click', (e) => {
    if (suppress || e.target.closest('.play')) return;
    // Wajah sampul pada kaset terbuka tidak selalu kena hit-test 3D: pakai geometri yang sama dengan kursor "BUKA".
    const rect = shelf.getBoundingClientRect();
    if (
      Math.abs(e.clientX - (rect.left + rect.width / 2)) < 0.55 * d &&
      Math.abs(e.clientY - (rect.top + rect.height / 2)) < 0.55 * H &&
      Math.abs(T - s) < 0.3
    ) {
      openDetail();
      return;
    }
    const el = e.target.closest('.tape');
    if (!el) return;
    const r = mod(+el.dataset.v - s + total / 2, total) - total / 2;
    if (Math.abs(r) < 0.5) openDetail();
    else T = Math.round(T + r);
  });

  // Wheel: hanya sumbu horizontal (geser trackpad atau Shift+roda). Gulir vertikal tetap menggulir halaman.
  shelf.addEventListener(
    'wheel',
    (e) => {
      if (isOpen || Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      e.preventDefault();
      T += (e.deltaX / (ws + gap)) * 0.5;
      clearTimeout(wheelTimer);
      wheelTimer = setTimeout(() => {
        T = Math.round(T);
      }, 160);
    },
    { passive: false },
  );

  shelf.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 || e.target.closest('.play')) return;
    suppress = false;
    dragStartX = e.clientX;
    dragT0 = T;
    dragId = e.pointerId;
  });
  shelf.addEventListener('pointermove', (e) => {
    if (e.pointerId !== dragId) return;
    const dx = e.clientX - dragStartX;
    if (!dragging && Math.abs(dx) > 5) {
      dragging = true;
      shelf.setPointerCapture(e.pointerId);
    }
    if (dragging) T = dragT0 - dx / (ws + gap);
  });
  const up = (e) => {
    if (e.pointerId !== dragId) return;
    dragId = -1;
    if (dragging) {
      dragging = false;
      suppress = true; // seret tidak boleh menjadi klik pada tape di bawah pointer
      T = Math.round(T);
    }
  };
  shelf.addEventListener('pointerup', up);
  shelf.addEventListener('pointercancel', up);

  rak.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    mx = e.clientX;
    my = e.clientY;
    havePointer = true;
  });
  rak.addEventListener('pointerover', (e) => {
    if (e.pointerType !== 'mouse') return;
    overBtn = !!e.target.closest('button, a');
    if (!mouseInside) {
      mouseInside = true;
      mx = cx = e.clientX;
      my = cy = e.clientY;
      havePointer = true;
    }
  });
  rak.addEventListener('pointerleave', (e) => {
    if (e.pointerType !== 'mouse') return;
    mouseInside = false;
    havePointer = false;
    overBtn = false;
    hover = -1;
  });

  document.addEventListener('keydown', (e) => {
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
    const el = e.target;
    if (el instanceof HTMLElement && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))) return;
    if (e.key === 'Escape') {
      if (isOpen) closeDetail();
      return;
    }
    if (!visible && !rak.contains(document.activeElement)) return; // jangan membajak tombol saat rak di luar layar
    if (e.key === 'ArrowLeft') go(-1);
    else if (e.key === 'ArrowRight') go(1);
    else if (e.key === 'Enter' && !document.activeElement?.closest('button, a, input, select, textarea, summary, dialog')) openDetail();
  });

  // ---- Siklus ----
  new ResizeObserver(() => {
    measure();
    build();
    moveIndicator();
  }).observe(shelf);
  new IntersectionObserver(([en]) => {
    visible = en.isIntersecting;
    kick();
  }).observe(rak);
  reduce.addEventListener?.('change', moveIndicator);
  document.fonts?.ready.then(moveIndicator);

  rak.dataset.js = '';
  setActiveTab();
  kick();
}
