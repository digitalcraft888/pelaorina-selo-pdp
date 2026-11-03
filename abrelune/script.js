/* Abrelune PDP — offer config & interactions. Edit CONFIG to change offers. */
const CONFIG = {
  base: 69.90, compare: 233.90,
  tiers: { 1: 0, 2: 0.10, 3: 0.15 },     // quantity discount
  bf: 0.10,                               // Black Friday extra discount
  bfEnds: new Date('2026-11-30T23:59:59'),// Cyber Monday end
  stock: 23
};
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const eur = n => '€' + n.toFixed(2);
let qty = 2, cartCount = 0;

function calc(q) {
  const sub = CONFIG.base * q;
  const qd = sub * CONFIG.tiers[q];
  const bf = (sub - qd) * CONFIG.bf;
  const total = sub - qd - bf;
  return { sub, qd, bf, total, unit: total / q };
}

/* offers */
function render() {
  $$('.tier').forEach(t => {
    const q = +t.dataset.qty, c = calc(q);
    $('[data-tp]', t).textContent = eur(c.unit);
    $('[data-ts]', t).textContent = eur(CONFIG.base);
    t.classList.toggle('on', q === qty);
    $('input', t).checked = q === qty;
  });
  const c = calc(qty);
  $('[data-price]').textContent = eur(c.unit);
  $('[data-save]').textContent = 'You save ' + eur(CONFIG.compare - c.unit) + ' each';
  $$('[data-total]').forEach(e => e.textContent = eur(c.total));
  $('[data-c-sub]').textContent = eur(c.sub);
  $('[data-c-qd]').textContent = '−' + eur(c.qd);
  $('[data-c-bf]').textContent = '−' + eur(c.bf);
  $('[data-cl-qty]').textContent = qty + ' ×';
  $$('.drawer .sum.g')[0].style.display = c.qd ? '' : 'none';
}
$$('.tier').forEach(t => t.addEventListener('click', () => { qty = +t.dataset.qty; render(); }));

/* countdown */
function tick() {
  let ms = Math.max(0, CONFIG.bfEnds - new Date());
  const d = Math.floor(ms / 864e5), h = Math.floor(ms % 864e5 / 36e5), m = Math.floor(ms % 36e5 / 6e4), s = Math.floor(ms % 6e4 / 1e3);
  const p = n => String(n).padStart(2, '0');
  $$('[data-countdown]').forEach(c => { $('[data-d]', c).textContent = p(d); $('[data-h]', c).textContent = p(h); $('[data-m]', c).textContent = p(m); $('[data-s]', c).textContent = p(s); });
}
tick(); setInterval(tick, 1000);

/* delivery estimate (2–3 working days) */
(function () {
  const addWd = n => { const d = new Date(); let a = 0; while (a < n) { d.setDate(d.getDate() + 1); if (d.getDay() % 6) a++; } return d; };
  const f = d => d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }).replace(/\.$/, '');
  $('[data-eta]').textContent = f(addWd(2)) + ' – ' + f(addWd(3));
})();

/* gallery */
const track = $('#gTrack'), thumbs = $$('#gThumbs button'), dots = $$('#gDots i');
const go = i => { i = (i + thumbs.length) % thumbs.length; track.scrollTo({ left: i * track.clientWidth, behavior: 'smooth' }); };
let cur = 0;
track.addEventListener('scroll', () => {
  const i = Math.round(track.scrollLeft / track.clientWidth);
  if (i === cur) return; cur = i;
  thumbs.forEach((t, k) => t.classList.toggle('on', k === i));
  dots.forEach((t, k) => t.classList.toggle('on', k === i));
}, { passive: true });
thumbs.forEach((t, i) => t.addEventListener('click', () => go(i)));
$('.g-prev').addEventListener('click', () => go(cur - 1));
$('.g-next').addEventListener('click', () => go(cur + 1));

/* cart */
const open = () => document.body.classList.add('cart-open');
$$('[data-close-cart]').forEach(b => b.addEventListener('click', () => document.body.classList.remove('cart-open')));
$$('[data-open-cart]').forEach(b => b.addEventListener('click', open));
$('[data-add]').addEventListener('click', () => { cartCount = qty; $('[data-cart-count]').textContent = cartCount; open(); });

/* sticky ATC after buy box */
const sticky = $('#sticky'), buyBtn = $('[data-add]');
new IntersectionObserver(([e]) => sticky.classList.toggle('show', !e.isIntersecting && e.boundingClientRect.top < 0), { threshold: 0 }).observe(buyBtn);

/* social-proof toasts */
const people = [['Daniel', 'Stockholm'], ['Emma', 'Gothenburg'], ['Mikael', 'Malmö'], ['Sofia', 'Uppsala'], ['Oliver', 'London'], ['Hanna', 'Oslo'], ['Lars', 'Copenhagen'], ['Anna', 'Dublin']];
let pi = 0;
function toast() {
  const [n, c] = people[pi++ % people.length], t = $('#toast');
  $('[data-t1]').textContent = n + ' from ' + c;
  $('[data-t2]').textContent = 'just bought the Abrelune · ' + (2 + Math.floor(Math.random() * 14)) + ' min ago';
  t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 5000);
}
setTimeout(() => { toast(); setInterval(toast, 22000); }, 9000);

/* reveal on scroll */
const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .12 });
$$('.rv-in').forEach(el => io.observe(el));

render();
