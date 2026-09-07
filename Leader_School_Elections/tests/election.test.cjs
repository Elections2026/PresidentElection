'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const Core = require('../dist/election-core.js');
const box = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(root, 'dist/config.js'), 'utf8'), box);
const C = box.window.ELECTION_CONFIG;
const opens = Date.parse(C.opensAt), closes = Date.parse(C.closesAt);

test('Before opening the target is September 14 at 12:00 Tashkent', () => {
  assert.equal(new Date(opens).toISOString(), '2026-09-14T07:00:00.000Z');
  const timer = Core.timer(opens - 86400000, C.opensAt, C.closesAt);
  assert.equal(timer.phase, 'before'); assert.equal(timer.target, C.opensAt);
  assert.deepEqual(timer.clock, { days: 1, hours: 0, minutes: 0, seconds: 0 });
  assert.equal(Core.timer(opens - 1, C.opensAt, C.closesAt).clock.seconds, 1);
});
test('At opening target automatically switches to closing, with 24 hours left', () => {
  const timer = Core.timer(opens, C.opensAt, C.closesAt);
  assert.equal(timer.phase, 'open'); assert.equal(timer.target, C.closesAt);
  assert.deepEqual(timer.clock, { days: 1, hours: 0, minutes: 0, seconds: 0 });
});
test('At closing status changes and timer stays at zero', () => {
  assert.equal(Core.timer(closes - 1, C.opensAt, C.closesAt).phase, 'open');
  for (const time of [closes, closes + 86400000]) {
    const timer = Core.timer(time, C.opensAt, C.closesAt);
    assert.equal(timer.phase, 'closed');
    assert.deepEqual(timer.clock, { days: 0, hours: 0, minutes: 0, seconds: 0 });
  }
});
test('Manual count is validated and percent follows each change', () => {
  for (const count of [0, 120, 212, 350, 423]) assert.equal(Core.validateManual(count, 423), true);
  for (const count of [-1, 424, 2.5, '120', NaN, undefined]) assert.equal(Core.validateManual(count, 423), false);
  assert.equal(Core.percent(0, 423), 0); assert.equal(Core.percent(423, 423), 100);
  assert.equal(Core.percent(120, 423).toFixed(1), '28.4');
  assert.ok(Core.percent(350, 423) > Core.percent(212, 423));
});
test('Assets and DOM targets exist; Google Sheets adapter is completely absent', () => {
  const html = fs.readFileSync(path.join(root, 'dist/index.html'), 'utf8');
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
  assert.equal(new Set(ids).size, ids.length);
  for (const m of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
    const ref = m[1];
    if (ref.startsWith('#') && ref.length > 1) assert.ok(ids.includes(ref.slice(1)), ref);
    else if (!/^(?:https?:|#)/.test(ref)) assert.ok(fs.existsSync(path.join(root, 'dist', ref)), ref);
  }
  const app = fs.readFileSync(path.join(root, 'dist/app.js'), 'utf8');
  for (const m of app.matchAll(/\$\('([^']+)'\)/g)) assert.ok(ids.includes(m[1]), m[1]);
  assert.ok(!/jsonp|statsEndpoint|refreshStats|script\.google\.com|lastStats|\boffset\b/.test(app));
  assert.ok(!('statsEndpoint' in C)); assert.ok(!fs.existsSync(path.join(root, 'apps-script')));
  assert.equal(C.manualVotes, 0); assert.equal(C.totalVoters, 423); assert.equal(C.candidates.length, 4);
});
