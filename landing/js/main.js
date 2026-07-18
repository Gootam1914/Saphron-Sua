/* Saphron Sua — launch site behavior (dependency-free) */

/* 1) Where "Sign in" sends people = your live app.
   Change this to your deployed app URL (e.g. your Render URL), or
   http://localhost:5050 while testing locally. */
const APP_URL = 'https://saphron-sua.onrender.com';

document.querySelectorAll('.js-signin').forEach((a) => { a.href = APP_URL; });

/* 2) Sticky nav gets a hairline border once you scroll. */
const nav = document.getElementById('nav');
const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 8);
onScroll();
window.addEventListener('scroll', onScroll, { passive: true });

/* 3) Reveal-on-scroll (taste-skill motion, no library). */
const io = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    });
  },
  { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
);
document.querySelectorAll('.reveal').forEach((el, i) => {
  el.style.transitionDelay = `${Math.min(i % 4, 3) * 60}ms`;
  io.observe(el);
});

/* 4) Subtle parallax on the hero dashed accent. */
const hero = document.querySelector('.hero');
if (hero && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    if (y < 700) hero.style.setProperty('--psh', `${y * 0.06}px`);
  }, { passive: true });
}
