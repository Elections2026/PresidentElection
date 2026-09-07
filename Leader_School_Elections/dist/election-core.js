/* Чистая логика времени и ручной статистики. */
(function (root) {
  'use strict';
  const api = {
    phase(now, opensAt, closesAt) {
      return now < Date.parse(opensAt) ? 'before' : now < Date.parse(closesAt) ? 'open' : 'closed';
    },
    countdown(now, closesAt) {
      const s = Math.max(0, Math.ceil((Date.parse(closesAt) - now) / 1000));
      return { days: Math.floor(s / 86400), hours: Math.floor(s / 3600) % 24, minutes: Math.floor(s / 60) % 60, seconds: s % 60 };
    },
    timer(now, opensAt, closesAt) {
      const phase = this.phase(now, opensAt, closesAt);
      return { phase, target: phase === 'before' ? opensAt : closesAt,
        clock: this.countdown(now, phase === 'before' ? opensAt : closesAt) };
    },
    validateManual(count, total) {
      return Number.isInteger(total) && total > 0 && Number.isInteger(count) && count >= 0 && count <= total;
    },
    percent(count, total) { return total > 0 ? count / total * 100 : 0; }
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.ElectionCore = api;
})(typeof window !== 'undefined' ? window : globalThis);
