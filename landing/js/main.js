/* Saphron Sua - launch site behavior (dependency-free) */

/* 1) "Sign in" -> your live app. Change to your Render URL, or
   http://localhost:5050 while testing locally. */
const APP_URL = 'https://saphron-sua.onrender.com';
document.querySelectorAll('.js-signin').forEach((a) => { a.href = APP_URL; });

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* 2) 3D intro: the words "Saphron Sua" zoom toward you and break into
   the page as you scroll the first screen. */
const intro = document.getElementById('intro');
const introInner = document.getElementById('introInner');
if (intro) intro.style.pointerEvents = 'none';
function introScroll() {
  if (!intro || !introInner) return;
  const vh = window.innerHeight || 800;
  const p = Math.min(Math.max(window.scrollY / (vh * 1.05), 0), 1);
  if (reduce) { intro.classList.toggle('done', window.scrollY > 40); return; }
  const scale = 1 + p * 2.4;      // zoom in
  const tz = p * 340;             // push toward viewer (3D)
  const rx = p * 24;              // tip forward
  introInner.style.transform = `translateZ(${tz}px) scale(${scale}) rotateX(${rx}deg)`;
  intro.style.opacity = String(Math.max(0, 1 - p * 1.08));
  intro.classList.toggle('done', p >= 1);
}
introScroll();
window.addEventListener('scroll', introScroll, { passive: true });
window.addEventListener('resize', introScroll);

/* 3) Sticky-nav hairline once scrolled. */
const nav = document.getElementById('nav');
const navScroll = () => nav && nav.classList.toggle('scrolled', window.scrollY > 8);
navScroll();
window.addEventListener('scroll', navScroll, { passive: true });

/* 4) Reveal-on-scroll. */
const io = new IntersectionObserver((entries) => {
  entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
document.querySelectorAll('.reveal').forEach((el, i) => {
  el.style.transitionDelay = `${Math.min(i % 4, 3) * 60}ms`;
  io.observe(el);
});

/* 5) Cursor tilt on EVERY screenshot - follows the pointer in any direction. */
if (!reduce) {
  document.querySelectorAll('.frame').forEach((f) => {
    f.addEventListener('pointermove', (e) => {
      const r = f.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;   // -0.5 .. 0.5
      const py = (e.clientY - r.top) / r.height - 0.5;
      const ry = (px * 18).toFixed(2);
      const rx = (-py * 15).toFixed(2);
      f.style.transform = `perspective(1200px) rotateY(${ry}deg) rotateX(${rx}deg) translateY(-4px)`;
    });
    f.addEventListener('pointerleave', () => { f.style.transform = 'perspective(1200px)'; });
  });
}
