// Контакты менеджеров: вписать, когда появятся (пустые = кнопки ведут к блоку контактов)
const CONTACTS = { wa: '', tg: '', max: '' };

// огромное название ровно по ширине колонки
const heroName = document.querySelector('.hero__name');
function fitName() {
  heroName.style.fontSize = '';
  const range = document.createRange();
  range.selectNodeContents(heroName);
  const textW = range.getBoundingClientRect().width;
  const boxW = heroName.parentElement.clientWidth;
  const cs = getComputedStyle(heroName);
  const fs = parseFloat(cs.fontSize);
  // отрицательная разрядка после последней буквы съедает ширину, а сама буква остаётся целой
  const tail = Math.max(0, -parseFloat(cs.letterSpacing) || 0);
  heroName.style.fontSize = (fs * boxW / (textW + tail)).toFixed(2) + 'px';
}
document.fonts.ready.then(fitName);
addEventListener('resize', fitName);

// появление блоков при прокрутке
const io = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
  });
}, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
document.querySelectorAll('.reveal').forEach((el) => io.observe(el));

// цифры в «о компании» набегают от нуля, когда блок показался
const nums = document.querySelector('.about__nums');
if (nums && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const countIo = new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting) return;
    countIo.disconnect();
    nums.querySelectorAll('[data-n]').forEach((b) => {
      const n = +b.dataset.n, t0 = performance.now();
      (function step(t) {
        const p = Math.min((t - t0) / 1400, 1);
        b.textContent = Math.round(n * (1 - Math.pow(1 - p, 3))) + '+';
        if (p < 1) requestAnimationFrame(step);
      })(t0);
    });
  }), { threshold: .4 });
  countIo.observe(nums);
}

// вкладки «Как работаем» подсвечивают свою карточку
const tabs = document.querySelectorAll('.tab');
const steps = document.querySelectorAll('.step');
tabs.forEach((tab) => tab.addEventListener('click', () => {
  tabs.forEach((t) => t.classList.toggle('is-on', t === tab));
  steps.forEach((s) => s.classList.toggle('is-on', s.dataset.step === tab.dataset.tab));
}));
steps.forEach((step) => step.addEventListener('mouseenter', () => {
  if (!matchMedia('(hover: hover)').matches) return;
  tabs.forEach((t) => t.classList.toggle('is-on', t.dataset.tab === step.dataset.step));
  steps.forEach((s) => s.classList.toggle('is-on', s === step));
}));

// мессенджеры
const MSG = 'Здравствуйте! Хочу рассчитать перевозку сотрудников.';
document.querySelectorAll('[data-msg]').forEach((a) => {
  const id = CONTACTS[a.dataset.msg];
  if (!id) { a.href = '#kontakty'; return; }
  if (a.dataset.msg === 'wa') a.href = `https://wa.me/${id}?text=${encodeURIComponent(MSG)}`;
  if (a.dataset.msg === 'tg') a.href = `https://t.me/${id}`;
  if (a.dataset.msg === 'max') a.href = id;
  a.target = '_blank'; a.rel = 'noopener';
});
