// _tmp_dump_boss.js — 临时检查：dump 9 章末 Boss 真实面板 + monsterAt 各档位
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.join(__dirname, '..');
const _noop = () => {};
function makeCtx() {
  const sb = {
    console, setTimeout, clearTimeout, Date, JSON, Math,
    navigator: { userAgent: 'node' },
    localStorage: { getItem: () => null, setItem: _noop, removeItem: _noop },
    document: { getElementById: () => null, querySelector: () => null, querySelectorAll: () => [], addEventListener: _noop, createElement: () => ({ style: {} }), body: { appendChild: _noop } },
    requestAnimationFrame: () => 0, addEventListener: _noop,
  };
  sb.window = sb; sb.global = sb; sb.self = sb;
  return sb;
}
function load() {
  const ctx = vm.createContext(makeCtx());
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  [...html.matchAll(/<script src="([^"]+)"[^>]*>/g)].forEach((m) => {
    if (/^https?:/.test(m[1])) return;
    const fp = path.join(ROOT, m[1].split('?')[0]);
    if (fs.existsSync(fp)) { try { vm.runInContext(fs.readFileSync(fp, 'utf8'), ctx, { filename: m[1] }); } catch (e) {} }
  });
  return ctx.NDX;
}
let NDX = load();
const bosses = (NDX.CHAPTER_BOSS_NAMES || []).filter(Boolean);
console.log('== 9 章末 Boss 面板（bossStageSetup）==');
console.log('章\tBoss\tstages\tp1.hp\tp1.atk\tp1.matk\tp1.dr');
bosses.forEach((n, ai) => {
  try {
    const s = NDX.bossStageSetup(n, {});
    const st = (s && s.stages) ? s.stages.join('/') : 'null';
    console.log(`${ai + 1}\t${n}\t${st}\t${s && s.p1 ? s.p1.hp : '-'}\t${s && s.p1 ? s.p1.atk : '-'}\t${s && s.p1 ? s.p1.matk : '-'}\t${s && s.p1 ? s.p1.dr : '-'}`);
  } catch (e) { console.log(`${ai + 1}\t${n}\tERR ${e.message}`); }
});
console.log('\n== monsterAt 各档位（差分基准怪）==');
for (const d of [4, 8, 12, 16, 20, 33, 45, 58, 80, 100, 121]) {
  try {
    const m = NDX.monsterAt(d) || {};
    console.log(`diff=${d}\thp=${m.hp}\tatk=${m.atk}\tmatk=${m.matk}\tdr=${m.dr}\tmdef=${m.mdef}`);
  } catch (e) { console.log(`diff=${d} ERR ${e.message}`); }
}
console.log('\n== 英雄 playerBaseAt（取经人）随 diff ==');
for (const d of [4, 16, 20, 33, 45, 58, 121]) {
  const b = NDX.playerBaseAt(d, NDX.HEROES.tangseng);
  console.log(`diff=${d}\tatk=${b.atk}\thp=${b.hp}\tmatk=${b.matk}\tdr=${b.dr}\tmdef=${b.mdef}`);
}
process.exit(0);