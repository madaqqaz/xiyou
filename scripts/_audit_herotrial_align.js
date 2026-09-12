// 英雄专属文本 vs 当前 TRIAL_LIB 语义对齐抽查（层 10-25）
'use strict';
const path = require('path'), fs = require('fs');
const ROOT = path.join(__dirname, '..');
global.window = global;
global.location = { href: 'http://client', search: '' };
Object.defineProperty(global, 'navigator', { value: { userAgent: 'node', platform: 'linux' }, configurable: true, writable: true });
const _s = {};
global.localStorage = { get length() { return Object.keys(_s).length; }, key(i) { return Object.keys(_s)[i] || null; }, getItem(k) { return Object.prototype.hasOwnProperty.call(_s, k) ? _s[k] : null; }, setItem(k, v) { _s[k] = String(v); }, removeItem(k) { delete _s[k]; }, clear() { for (const k of Object.keys(_s)) delete _s[k]; } };
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const SKIP = new Set(['sound.js', 'ui.js', 'main.js']);
[...html.matchAll(/js\/([\w\/-]+\.js)/g)].map(m => m[1]).filter((f, i, a) => a.indexOf(f) === i)
  .filter(f => !SKIP.has(f) && !f.startsWith('ui/')).forEach(f => { try { require(path.join(ROOT, 'js', f)); } catch (e) {} });
const N = global.NDX;
const out = [];
const heroes = Object.keys(N.HERO_TRIALS || {});
for (let l = 1; l <= 81; l++) {
  const base = (N.TRIAL_LIB[l] || {}).name || '（缺）';
  const line = '难' + l + ' 主线[' + base + ']  ' + heroes.map(h => {
    const e = (N.HERO_TRIALS[h] || {})[l];
    return h.slice(0, 4) + ':' + (e && e.name ? e.name : (e ? '(仅dark/options)' : '—'));
  }).join(' | ');
  out.push(line);
}
// 关键语义核对：八戒是否为可玩英雄（若是，则"收八戒"不应作为主线节点出现）
out.push('\nHEROES: ' + JSON.stringify(Object.keys(N.HEROES || {})));
out.push('FOLLOWERS 数: ' + Object.keys(N.FOLLOWERS || {}).length);
fs.writeFileSync(path.join(ROOT, 'scripts', '_herotrial_align_out.txt'), out.join('\n'), 'utf8');
console.log('ok');
