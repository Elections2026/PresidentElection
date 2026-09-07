(function () {
  'use strict';
  const C = window.ELECTION_CONFIG, Core = window.ElectionCore;
  const $ = id => document.getElementById(id);
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  let motion = !reduced.matches, previousPhase = '';
  let lastManualValue = null, lastManualStamp = null, currentCount = null, numberFrame = 0;
  let particleFrame = 0, particles = [], canvasWidth = 0, canvasHeight = 0;
  const pad = n => String(n).padStart(2, '0');
  const dateLabel = iso => new Intl.DateTimeFormat('ru-RU', { timeZone: C.timeZone, day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }).format(new Date(iso));
  const timeLabel = iso => new Intl.DateTimeFormat('ru-RU', { timeZone: C.timeZone, day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }).format(new Date(iso));
  const safeUrl = (input, relative = false) => {
    if (!input) return '';
    try { const u = new URL(input, location.href); return u.protocol === 'https:' || (relative && (u.protocol === 'file:' || (u.protocol === 'http:' && u.origin === location.origin))) ? u.href : ''; } catch (_) { return ''; }
  };
  const formUrl = safeUrl(C.formUrl);
  function node(tag, className, text) { const n = document.createElement(tag); if (className) n.className = className; if (text !== undefined) n.textContent = text; return n; }
  document.querySelectorAll('[data-total]').forEach(n => { n.textContent = C.totalVoters; });
  $('window-label').textContent = `${dateLabel(C.opensAt)} → ${dateLabel(C.closesAt)} · Ташкент`;
  const grid = $('candidate-grid');
  C.candidates.forEach(candidate => {
    const registered = Boolean(candidate.registered && candidate.name.trim());
    const card = node('article', 'candidate-card');
    const portrait = node('div', 'candidate-image');
    portrait.append(node('span', 'placeholder-number', pad(candidate.grade)));
    portrait.append(node('span', 'candidate-tag', `${candidate.grade} КЛАССЫ`));
    const imageLabel = node('span', 'candidate-image-label', registered ? 'ПРЕДСТАВИТЕЛЬ ПАРАЛЛЕЛИ' : 'СКОРО ЗДЕСЬ БУДЕТ КАНДИДАТ');
    portrait.append(imageLabel);
    const photo = safeUrl(candidate.photo, true);
    if (registered && photo) {
      const img = node('img'); img.src = photo; img.alt = candidate.name; img.loading = 'lazy'; img.width = 600; img.height = 600;
      img.addEventListener('error', () => { img.remove(); }); portrait.append(img);
    }
    const body = node('div', 'candidate-body');
    body.append(node('h3', '', registered ? candidate.name : 'Имя скоро появится'));
    body.append(node('p', 'candidate-subtitle', registered ? (candidate.className ? `Класс ${candidate.className}` : `${candidate.grade} класс`) : 'Ожидаем регистрацию'));
    if (registered && candidate.tagline) body.append(node('p', 'candidate-bio', candidate.tagline));
    body.append(node('p', 'candidate-bio', registered ? (candidate.bio || 'Программа будет опубликована после согласования.') : 'Здесь будут фотография, история и идеи представителя параллели.'));
    if (registered && candidate.ideas.length) {
      const list = node('ul', 'candidate-ideas'); candidate.ideas.forEach(idea => list.append(node('li', '', idea))); body.append(list);
    }
    body.append(node('div', 'candidate-spacer'));
    const vote = node('a', 'button button-secondary candidate-vote', 'Голосовать ↗');
    vote.dataset.registered = String(registered);
    vote.setAttribute('aria-label', registered ? `Открыть форму голосования: ${candidate.name}` : `Голосование за представителя ${candidate.grade} классов пока недоступно`);
    body.append(vote); card.append(portrait, body); grid.append(card);
  });
  function setVoteLink(el, allowed, text) {
    el.textContent = text;
    el.setAttribute('aria-disabled', String(!allowed));
    if (allowed && formUrl) { el.href = formUrl; el.target = '_blank'; el.rel = 'noopener noreferrer'; el.removeAttribute('tabindex'); }
    else { el.removeAttribute('href'); el.setAttribute('tabindex', '-1'); }
  }
  function tick() {
    const now = Date.now();
    const { phase, clock } = Core.timer(now, C.opensAt, C.closesAt);
    Object.entries(clock).forEach(([key, value]) => { const str = pad(value); if ($(key).textContent !== str) $(key).textContent = str; });
    if (phase !== previousPhase) {
      previousPhase = phase;
      $('phase-badge').textContent = phase === 'before' ? 'Скоро голосование' : phase === 'open' ? 'Голосование открыто' : 'Голосование закрыто';
      $('phase-badge').className = `status-badge is-${phase}`;
      $('turnout').dataset.phase = phase;
      $('countdown-title').textContent = phase === 'before' ? 'ДО ОТКРЫТИЯ ГОЛОСОВАНИЯ' : phase === 'open' ? 'ДО ЗАКРЫТИЯ ГОЛОСОВАНИЯ' : 'ПРИЁМ ГОЛОСОВ ЗАВЕРШЁН';
      $('countdown').setAttribute('aria-label', phase === 'before' ? 'До открытия голосования' : phase === 'open' ? 'До закрытия голосования' : 'Приём голосов завершён');
      $('vote-callout-title').textContent = phase === 'before' ? `Открытие — ${dateLabel(C.opensAt)}` : phase === 'open' ? 'Голосование идёт. Время выбрать.' : 'Голосование завершено';
      $('vote-callout-note').textContent = phase === 'before' ? 'Время Ташкента. Пока можно изучить правила и программы.' : phase === 'open' ? `Отправь ответ до ${dateLabel(C.closesAt)} по Ташкенту. Голосуй вне уроков.` : 'Комиссия проверяет ответы. Окончательные итоги будут опубликованы после проверки.';
      setVoteLink($('main-vote'), phase === 'open', phase === 'before' ? 'Голосование ещё не открыто' : phase === 'open' ? 'Открыть форму голосования ↗' : 'Приём голосов завершён');
      document.querySelectorAll('.candidate-vote').forEach(el => setVoteLink(el, phase === 'open' && el.dataset.registered === 'true', phase === 'closed' ? 'Голосование завершено' : 'Голосовать ↗'));
    }
    refreshManualStats();
  }
  document.addEventListener('click', e => {
    const anchor = e.target.closest('[aria-disabled="true"]'); if (anchor) e.preventDefault();
    const vote = e.target.closest('#main-vote, .candidate-vote');
    if (vote && Core.phase(Date.now(), C.opensAt, C.closesAt) !== 'open') { e.preventDefault(); tick(); }
  });
  const regulationsUrl = safeUrl(C.regulationsUrl, true);
  if (regulationsUrl) { $('regulations-link').href = regulationsUrl; $('regulations-link').hidden = false; }
  if (C.contact.label) $('contact-text').textContent = `По вопросам выборов: ${C.contact.label}.`;
  const contactUrl = safeUrl(C.contact.url);
  if (contactUrl) { $('contact-link').href = contactUrl; $('contact-link').hidden = false; }
  function animateNumber(target) {
    cancelAnimationFrame(numberFrame);
    const start = currentCount === null ? 0 : currentCount, started = performance.now();
    const draw = t => {
      const k = motion ? Math.min(1, (t - started) / 1300) : 1;
      const value = start + (target - start) * (1 - Math.pow(1 - k, 3));
      currentCount = value; $('voter-count').textContent = Math.round(value).toLocaleString('ru-RU');
      $('turnout-percent').textContent = `${Core.percent(value, C.totalVoters).toLocaleString('ru-RU', { maximumFractionDigits: 1 })} %`;
      if (k < 1) numberFrame = requestAnimationFrame(draw);
    };
    numberFrame = requestAnimationFrame(draw);
    $('ring-progress').style.strokeDashoffset = String(100 - Math.min(100, Core.percent(target, C.totalVoters)));
    $('turnout').setAttribute('aria-label', `Предварительно проголосовали ${target} из ${C.totalVoters} учеников`);
  }
  function refreshManualStats() {
    const count = C.manualVotes, stamp = C.manualUpdatedAt || '';
    if (count === lastManualValue && stamp === lastManualStamp) return;
    lastManualValue = count; lastManualStamp = stamp;
    if (!Core.validateManual(count, C.totalVoters)) {
      cancelAnimationFrame(numberFrame); currentCount = null;
      $('voter-count').textContent = '—'; $('turnout-percent').textContent = '— %';
      $('ring-progress').style.strokeDashoffset = '100';
      $('stats-status').textContent = 'Явка уточняется организаторами';
      $('connection-dot').className = 'connection-dot stale';
      $('turnout').setAttribute('aria-label', 'Предварительная явка уточняется');
      return;
    }
    animateNumber(count);
    const validStamp = stamp && Number.isFinite(Date.parse(stamp));
    $('stats-status').textContent = validStamp ? `Проверено ${timeLabel(stamp)} · Ташкент` : 'Явку обновляют организаторы';
    $('connection-dot').className = 'connection-dot connected';
  }
  const canvas = $('particles'), ctx = canvas.getContext('2d');
  function resizeCanvas() {
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvasWidth = window.innerWidth; canvasHeight = window.innerHeight;
    canvas.width = canvasWidth * dpr; canvas.height = canvasHeight * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    particles = Array.from({ length: canvasWidth < 600 ? 19 : 45 }, () => ({ x: Math.random() * canvasWidth, y: Math.random() * canvasHeight, r: .5 + Math.random() * 1.3, speed: .12 + Math.random() * .24, alpha: .15 + Math.random() * .4 }));
  }
  let lastParticleTime = 0;
  function drawParticles(t) {
    if (!motion || document.hidden || !ctx) { particleFrame = 0; return; }
    const delta = Math.min(2, (t - lastParticleTime) / 16.67 || 1); lastParticleTime = t;
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    particles.forEach((p, i) => { p.y -= p.speed * delta; p.x += Math.sin(t / 5000 + i) * .08 * delta; if (p.y < -3) p.y = canvasHeight + 3;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fillStyle = i % 4 === 0 ? `rgba(5,198,238,${p.alpha})` : `rgba(184,137,255,${p.alpha})`; ctx.fill(); });
    particleFrame = requestAnimationFrame(drawParticles);
  }
  function syncMotion() {
    document.body.classList.toggle('motion-off', !motion); $('motion-toggle').setAttribute('aria-pressed', String(motion));
    $('motion-toggle').setAttribute('aria-label', motion ? 'Выключить анимацию' : 'Включить анимацию');
    cancelAnimationFrame(particleFrame); particleFrame = 0;
    if (motion && !document.hidden) particleFrame = requestAnimationFrame(drawParticles);
    if (!motion && Core.validateManual(C.manualVotes, C.totalVoters)) animateNumber(C.manualVotes);
  }
  $('motion-toggle').addEventListener('click', () => { motion = !motion; syncMotion(); });
  reduced.addEventListener('change', e => { motion = !e.matches; syncMotion(); });
  window.addEventListener('resize', resizeCanvas, { passive: true });
  document.addEventListener('visibilitychange', () => { syncMotion(); if (!document.hidden) { tick(); } });
  resizeCanvas(); syncMotion(); tick();
  setInterval(tick, 1000);
})();
