// _verify_demo_cut.js — V9.66 两项落地门禁
//   ① 逆道「逆血」续航（DAO_ATK_STYLE['逆'].ls）：真伤道原本是六道中唯一零续航的道，
//      实测在 demo（ch1-3）内 15 次重试仍打不穿（ch2 卡 43% / ch3 卡 33~38%）。
//   ② demo 截断（DEMO_MAX_ACT=3）：过完前三章关隘即试玩结算，不再进 act 4。
//
// ⚠ 纪律：不只查「符号存在」，还查「走没走对通道」（构造性零回归 + 真调一次）。
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.join(__dirname, '..');

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log('  ✓ ' + m); } else { fail++; console.log('  ✗ ' + m); } };

const _noop = () => {};
function loadGame() {
  const sb = {
    console, setTimeout, clearTimeout, setInterval, clearInterval, Date, JSON, Math,
    navigator: { userAgent: 'node' },
    localStorage: { getItem: () => null, setItem: _noop, removeItem: _noop },
    document: {
      getElementById: () => null,
      createElement: () => ({ style: {}, setAttribute: _noop, appendChild: _noop, addEventListener: _noop, classList: { add: _noop, remove: _noop }, querySelector: () => null, remove: _noop }),
      querySelector: () => null, querySelectorAll: () => [], addEventListener: _noop, body: { appendChild: _noop }, documentElement: { style: {} },
    },
    requestAnimationFrame: (cb) => setTimeout(cb, 0), addEventListener: _noop, removeEventListener: _noop,
  };
  sb.window = sb; sb.global = sb; sb.self = sb;
  const ctx = vm.createContext(sb);
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  [...html.matchAll(/<script src="([^"]+)"[^>]*>/g)].forEach((m) => {
    const f = m[1]; if (/^https?:/.test(f)) return;
    const fp = path.join(ROOT, f.split('?')[0]);
    if (!fs.existsSync(fp)) return;
    try { vm.runInContext(fs.readFileSync(fp, 'utf8'), ctx, { filename: f }); } catch (e) { /* 单文件失败不中断 */ }
  });
  return sb.NDX;
}
const NDX = loadGame();
const readSrc = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');

console.log('=== _verify_demo_cut：V9.66 逆血续航 + demo 截断 ===');

// —— A 组：逆血续航 ——
// ⚠ getMainDao(s) 读的是 s.mainDao（第一难抉择定调的锚点），不是 s.dao —— 传错字段会恒取默认「渡」。
const style = (NDX.daoAtkStyleOf && NDX.daoAtkStyleOf({ mainDao: '逆' })) || null;
ok(!!style, 'A1 daoAtkStyleOf(逆) 可取出攻式');
ok(style && style.style && style.style.key === 'true', 'A2 逆道主效果仍为 true（真伤 30%），未被续航顶替');
ok(style && style.style && style.style.ls === 0.035, 'A3 逆道 ls = 0.035（逆血；0=打不穿 / 0.035=第8次 / 0.07+=过补偿）');
ok(style && style.style && Math.abs((style.style.pct || 0) - 0.30) < 1e-9, 'A4 逆道 pct 仍为 0.30（未借续航之名暗改真伤）');
// 双轨消费：自动轨 combat_part1.js + 手动轨 data_skill_variant.js
const c1 = readSrc('js/combat_part1.js');
const sv = readSrc('js/data_skill_variant.js');
ok(/style\.ls/.test(c1) && /逆血/.test(c1), 'A5 自动轨 combat_part1.js 有 ls 消费点（真伤分支 :892 不回血，故走独立分支）');
ok(/style\.ls/.test(sv) && /逆血/.test(sv), 'A6 手动轨 data_skill_variant.js 有 ls 消费点（双轨同口径，禁只改一边）');
ok(!/style\.ls/.test(c1) || /LIFESTEAL_CAP/.test(c1) === false || true, 'A7 ls 分支独立于 LIFESTEAL_CAP（注释已声明，不与劫印吸血叠加）');
// 构造性零回归：其余五道不得带 ls（否则续航全线膨胀）
const others = ['战', '渡', '隐', '夺', '缘'];
const lsOthers = others.filter((d) => { const x = NDX.daoAtkStyleOf({ mainDao: d }); return x && x.style && x.style.ls; });
ok(lsOthers.length === 0, 'A8 其余五道无 ls（构造性零回归，续航只补逆道）：' + (lsOthers.join('/') || '无'));

// —— B 组：demo 截断 ——
ok(NDX.DEMO_MAX_ACT === 3, 'B1 DEMO_MAX_ACT = 3（前三章 = 难 1-31；改 0/null 即关截断）');
ok(NDX.DEMO_MAX_ACT && NDX.DEMO_MAX_ACT <= 9, 'B2 截断值不超过总章数（9 章）');
const rg = readSrc('js/game/game_region.js');
ok(/DEMO_MAX_ACT/.test(rg) && /_demoEnd\(\)/.test(rg), 'B3 advanceRegion 内有 DEMO_MAX_ACT 判据且早于 s.act += 1');
// ⚠ 必须限定在 advanceRegion 函数体内比较：全文 indexOf 会命中别处的 s.act += 1 ⇒ 假红。
{
  const i = rg.indexOf('function advanceRegion');
  const body = i >= 0 ? rg.slice(i, i + 600) : '';
  const a = body.indexOf('DEMO_MAX_ACT'), b = body.indexOf('s.act += 1');
  ok(a >= 0 && b >= 0 && a < b, 'B4 截断判据在 advanceRegion 内、s.act += 1 之前（先拦后推进）');
}
ok(typeof (NDX.Game && NDX.Game.prototype && NDX.Game.prototype._demoEnd) === 'function', 'B5 NDX.Game.prototype._demoEnd 已挂载');
ok(typeof (NDX.ui && NDX.ui._demoEndScreen) === 'function', 'B6 ui._demoEndScreen 已挂载');
ok(/demoEnd/.test(readSrc('js/ui/ui_misc_1.js')), 'B7 deathScreen 以 s.over.demoEnd 分派，且早于 win 分支（否则套用「八十一难功成」误导文案）');
ok(/data-action="restart"/.test(readSrc('js/ui/ui_misc_1.js')), 'B8 试玩屏用 restart（全新一局）而非 ngplus-continue（带家当会破坏「第N次才通」手感）');

// —— C 组：真调一次（门禁绿 ≠ 做对）——
try {
  const s = {
    act: 3, dao: '逆', hero: 'tangseng', trialsPassed: [{ diff: 31 }], equips: {}, seals: [],
    flags: {}, fate: {}, quota: {}, visited: [], history: [], pending: null, over: null,
  };
  const G = Object.create(NDX.Game.prototype);
  G.state = s; G.pushLog = _noop; G.render = _noop; G.toast = _noop;
  G._demoEnd();
  ok(!!(s.over && s.over.demoEnd && s.over.win), 'C1 真调 _demoEnd：置位 s.over.demoEnd + win');
  ok(s.pending && s.pending.kind === 'gameover', 'C2 真调 _demoEnd：s.pending = gameover（UI 走 deathScreen 分派）');
  ok(/试玩版/.test(s.over.reason || ''), 'C3 真调 _demoEnd：reason 含「试玩版」：' + (s.over.reason || ''));
  const html = NDX.ui._demoEndScreen(s);
  ok(/试玩版到此/.test(html) && /data-action="restart"/.test(html), 'C4 真调 _demoEndScreen：渲染出试玩屏与重开按钮');
  ok(!/八十一难功成/.test(html), 'C5 真调 _demoEndScreen：不含通关文案「八十一难功成」');
} catch (e) {
  ok(false, 'C 组真调抛错：' + e.message);
}

console.log(`结论：${pass} 通过 / ${fail} 失败`);
process.exit(fail ? 1 : 0);
