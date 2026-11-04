/* Abrelune PDP — offer config & interactions. Edit CONFIG to change the offer. */
const CONFIG = {
  base: 69.90,                              // regular unit price
  compare: 233.90,                          // crossed-out "was" price
  unit: { 1: 62.90, 2: 56.90, 3: 53.90 },   // Black Friday unit price per tier (3+ uses the last tier)
  defaultQty: 1,                            // preselected quantity (test 2 as an A/B variant)
  maxQty: 10,
  bfEnds: new Date('2026-11-30T23:59:59'),  // Black Friday week ends (Cyber Monday)
  stock: null,                              // set a real number from Shopify inventory to show "only N left"
  liveProof: false                          // purchase pop-ups: enable ONLY when fed by real orders
};
const L = {
  locale: 'en-GB', dec: '.', from: ' from ', bought: 'just bought the Abrelune',
  save: p => 'Save ' + p + '%', saveEach: x => 'You save ' + x + ' each',
  totSave: x => 'You save ' + x + ' in total vs. the regular price',
  units: q => q === 1 ? '1 unit' : q + ' units', each: x => x + ' each',
  nudge: (n, extra, pct) => 'Add one more: unit #' + n + ' costs only <b>' + extra + '</b> (now ' + pct + '% off each). <button type="button">+ Add 1</button>',
  best: pct => '<b>Best price unlocked:</b> ' + pct + '% off each.'
};
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const cents = n => Math.round(n * 100);
const eur = c => '€' + (c / 100).toFixed(2).replace('.', L.dec);
const tierOf = q => Math.min(q, Math.max(...Object.keys(CONFIG.unit).map(Number)));
let qty = CONFIG.defaultQty, cartCount = 0;

/* all maths in whole cents so unit × qty always equals the total */
function calc(q) {
  const unit = cents(CONFIG.unit[tierOf(q)]), base = cents(CONFIG.base);
  const total = unit * q, regular = base * q;
  return { unit, total, regular, saved: regular - total, pct: Math.round((1 - unit / base) * 100), vsCompare: cents(CONFIG.compare) * q - total };
}

function render() {
  $$('.tier').forEach(t => {
    const q = +t.dataset.qty, c = calc(q);
    $('[data-tp]', t).textContent = eur(c.unit);
    $('[data-ts]', t).textContent = eur(cents(CONFIG.base));
    $('[data-tt]', t).textContent = eur(c.total);
    $('[data-tsave]', t).textContent = L.save(c.pct);
    t.classList.toggle('on', q === qty);
    $('input', t).checked = q === qty;
  });
  const c = calc(qty);
  $('[data-price]').textContent = eur(c.unit);
  $('[data-save]').textContent = L.saveEach(eur(cents(CONFIG.compare) - c.unit));
  $('[data-totsave]').textContent = L.totSave(eur(c.vsCompare));
  $$('[data-total]').forEach(e => e.textContent = eur(c.total));
  $$('[data-add-qty]').forEach(e => e.textContent = L.units(qty));
  $('[data-c-sub]').textContent = eur(c.regular);
  $('[data-c-save]').textContent = '−' + eur(c.saved);
  $('[data-cl-qty]').textContent = qty;
  $('[data-cl-price]').textContent = eur(c.total);
  $('[data-cl-each]').textContent = L.each(eur(c.unit));
  $('[data-cart-count]').textContent = cartCount;
  /* nudge: what does one more unit cost? */
  const nudge = $('[data-nudge]'), nextTier = CONFIG.unit[qty + 1] !== undefined;
  if (nextTier && qty < CONFIG.maxQty) {
    const n = calc(qty + 1), extra = n.total - c.total;
    nudge.innerHTML = L.nudge(qty + 1, eur(extra), n.pct);
    nudge.hidden = false;
  } else if (qty >= 3) { nudge.innerHTML = L.best(c.pct); nudge.hidden = false; }
  else nudge.hidden = true;
}
const setQty = q => { qty = Math.max(1, Math.min(CONFIG.maxQty, q)); if (cartCount) cartCount = qty; render(); };
$$('.tier').forEach(t => { t.addEventListener('click', () => setQty(+t.dataset.qty)); $('input', t).addEventListener('change', () => setQty(+t.dataset.qty)); });
$('[data-minus]').addEventListener('click', () => setQty(qty - 1));
$('[data-plus]').addEventListener('click', () => setQty(qty + 1));
$('[data-nudge]').addEventListener('click', e => { if (e.target.closest('button')) setQty(qty + 1); });

/* countdown + end date */
function tick() {
  const ms = Math.max(0, CONFIG.bfEnds - new Date());
  const d = Math.floor(ms / 864e5), h = Math.floor(ms % 864e5 / 36e5), m = Math.floor(ms % 36e5 / 6e4), s = Math.floor(ms % 6e4 / 1e3);
  const p = n => String(n).padStart(2, '0');
  $$('[data-countdown]').forEach(c => { $('[data-d]', c).textContent = p(d); $('[data-h]', c).textContent = p(h); $('[data-m]', c).textContent = p(m); $('[data-s]', c).textContent = p(s); });
}
tick(); setInterval(tick, 1000);
$$('[data-ends]').forEach(e => e.textContent = CONFIG.bfEnds.toLocaleDateString(L.locale, { weekday: 'short', day: 'numeric', month: 'short' }).replace(/\.$/, ''));

/* delivery estimate (2–3 working days) */
(function () {
  const addWd = n => { const d = new Date(); let a = 0; while (a < n) { d.setDate(d.getDate() + 1); if (d.getDay() % 6) a++; } return d; };
  const f = d => d.toLocaleDateString(L.locale, { weekday: 'short', day: 'numeric', month: 'short' }).replace(/\.$/, '');
  $('[data-eta]').textContent = f(addWd(2)) + ' – ' + f(addWd(3));
})();

/* honest stock line: only show a number when CONFIG.stock is a real value */
(function () {
  const n = $('[data-stock-n]'), bar = $('.stock + .bar');
  if (CONFIG.stock == null) { if (n) n.hidden = true; if (bar) bar.hidden = true; }
  else if (n) { $('b', n).textContent = CONFIG.stock; }
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
const close = () => document.body.classList.remove('cart-open');
$$('[data-close-cart]').forEach(b => b.addEventListener('click', close));
document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
$$('[data-open-cart]').forEach(b => b.addEventListener('click', () => { if (!cartCount) cartCount = 0; open(); }));
const addToCart = () => { cartCount = qty; render(); open(); };
$('[data-add]').addEventListener('click', addToCart);
$('[data-sticky-add]').addEventListener('click', addToCart);

/* sticky ATC after buy box */
const sticky = $('#sticky'), buyBtn = $('[data-add]');
new IntersectionObserver(([e]) => sticky.classList.toggle('show', !e.isIntersecting && e.boundingClientRect.top < 0), { threshold: 0 }).observe(buyBtn);

/* purchase pop-ups: OFF by default. Only enable with a real order feed (fabricated proof is unlawful in the EU/DE). */
if (CONFIG.liveProof) {
  const people = [['Daniel', 'Stockholm'], ['Emma', 'Gothenburg'], ['Mikael', 'Malmö']];
  let pi = 0;
  const toast = () => {
    const [n, c] = people[pi++ % people.length], t = $('#toast');
    $('[data-t1]').textContent = n + L.from + c;
    $('[data-t2]').textContent = L.bought;
    t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 5000);
  };
  setTimeout(() => { toast(); setInterval(toast, 22000); }, 9000);
}

/* reveal on scroll */
const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .12 });
$$('.rv-in').forEach(el => io.observe(el));

render();
