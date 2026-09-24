// _smoke_squad_ui.js — 编队条渲染冒烟（V9.38）
// 目的：确认「敌方编队」条真能渲染出「按序依次行动」提示与每怪行动序徽章（非仅语法通过）。
// 手法：vm 载入 combat_squad.js（SQUAD_*/SEC_STATUS）+ data_squad.js + ui_panel_2.js，
//       以最小战斗态 state 调 NDX.ui.panelHtml(s, g, hero)，断言输出含 fb-squad-ord。
// 由 scripts/_run_all_gates.js 的 /^(_smoke_|test_|_verify_).*\.js$/ 正则自动收录。
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const _noop = () => {};
const _store = {};
const sb = {
  console, setTimeout, clearTimeout, setInterval, clearInterval, Date, Math, JSON,
  navigator: { userAgent: 'node' },
  localStorage: { getItem: (k) => (k in _store ? _store[k] : null), setItem: (k, v) => { _store[k] = String(v); }, removeItem: (k) => { delete _store[k]; } },
  document: {
    getElementById: () => null,
    createElement: () => ({ style: {}, setAttribute: _noop, appendChild: _noop, addEventListener: _noop, classList: { add: _noop, remove: _noop }, querySelector: () => null, remove: _noop }),
    querySelector: () => null, querySelectorAll: () => [], addEventListener: _noop,
    body: { appendChild: _noop }, documentElement: { style: {} },
  },
  requestAnimationFrame: (cb) => setTimeout(cb, 0), addEventListener: _noop, removeEventListener: _noop,
};
sb.window = sb; sb.global = sb; sb.self = sb; sb.globalThis = sb;
vm.createContext(sb);

const R = (rel) => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');
// 全量加载（同 _verify_squad.js 口径）：calcCombatSquad 依赖真实战斗内核 calcCombat
const htmlSrc = R('index.html');
const files = [...htmlSrc.matchAll(/<script src="([^"]+)"[^>]*>/g)].map((m) => m[1]);
files.forEach((f) => {
  if (/^https?:/.test(f)) return;
  const p = f.split('?')[0];
  if (!fs.existsSync(path.join(__dirname, '..', p))) return;
  try { vm.runInContext(R(p), sb, { filename: p }); } catch (e) { }
});
const NDX = sb.NDX;
sb.NDX = NDX;

if (!NDX.getCycle) NDX.getCycle = function () { return 1; };
sb.esc = (x) => String(x == null ? '' : x);
NDX.HEROES = NDX.HEROES || { tangseng: { name: '唐僧', form: '', symbol: '杖' } };
NDX.game = NDX.game || { state: { heroId: 'tangseng' }, getHeroPortrait: () => '' };
// 面板内部工具桩（真实运行时由同域 UI 模块提供；此处只需不抛错）
NDX.ui = NDX.ui || {};
if (typeof NDX.ui._srcTips !== 'function') NDX.ui._srcTips = (x) => String(x == null ? '' : x);
if (typeof NDX.ui._warmPortrait !== 'function') NDX.ui._warmPortrait = () => { };
const panelHtml = NDX.ui && NDX.ui.panelHtml;
if (typeof panelHtml !== 'function') { console.log('FAIL 未导出 NDX.ui.panelHtml'); process.exit(1); }

let fail = 0;
const ok = (c, m) => { if (!c) { console.log('FAIL ' + m); fail++; } };

// 真实编队结果（由 calcCombatSquad 产出，含 ord 字段）
const mkPlayer = () => ({
  heroId: 'tangseng', good: 0, spd: 12,
  ti: { atk: 160, atkB: 0, fixAtk: 0, maxHp: 4000, curHp: 4000, hp: 4000, dr: 0.05, mdef: 40, cri: 0 },
  yuan: { matk: 60, matkB: 0, fixMatk: 0, mdef: 60 },
  reflect: 0, shieldPct: 0, armorPen: 0, fateFlags: {}, coll: {}, battleFlags: {},
  jingSlots: { atk: null, chant: null },
});
const front = { name: '厚主', hp: 3000, atk: 40, matk: 20, dr: 0.1, mdef: 0.1, spd: 7, type: 'mob', diff: 1 };
const addA = { name: '从一', hp: 99999, atk: 40, matk: 5, dr: 0.2, mdef: 0.2, spd: 7, type: 'mob', diff: 1, _counterMul: 0.3 };
const addB = { name: '从二', hp: 99999, atk: 30, matk: 5, dr: 0.2, mdef: 0.2, spd: 7, type: 'mob', diff: 1, _counterMul: 0.3 };

const _r = Math.random;
Math.random = () => 0;
const res = NDX.calcCombatSquad(mkPlayer(), [front, addA, addB], { stanceSeq: ['ATK'] });
Math.random = _r;

ok(res.squad && res.squad.length === 3, '编队结果应为 3 个单位');
ok(res.squad.every((x) => typeof x.ord === 'number'), 'squad[] 每项应带 ord');

function mkState() {
  const s = {
    hero: 'tangseng', act: 1, good: 0, evil: 0, fate: {},
    equips: [], seals: [], sutras: [], niSutras: [], pets: [], seals2: [],
    jingSlots: { atk: null, chant: null },
    over: null,
    pending: null,
  };
  const p = {
    kind: 'fight', roundIdx: 0, pHp: 3200, mHp: 2400, awaitStageBreak: 0, awaitOp: 0,
    monster: { name: '厚主', hp: 3000, atk: 40, matk: 20, dr: 0.1, mdef: 0.1, portrait: '', stages: null, breakMax: 0 },
    monsterHp: 3000,
    res: res,
    _battleFlags: {},
  };
  s.pending = p;
  return s;
}

let html = '';
try {
  const s = mkState();
  html = panelHtml.call(NDX.ui, s, { state: s, stats: () => ({ ti: { maxHp: 4000, atk: 160 }, yuan: { matk: 60 }, dr: 0.05 }) }, NDX.HEROES.tangseng);
} catch (e) {
  console.log('FAIL 编队条渲染抛错: ' + (e && e.message));
  process.exit(1);
}

ok(html.indexOf('fb-squad') >= 0, '应渲染敌方编队条 fb-squad');
ok(html.indexOf('按序依次行动') >= 0, '应渲染「按序依次行动」提示');
ok(html.indexOf('fb-squad-ord') >= 0, '应渲染每怪行动序徽章 fb-squad-ord');
ok(html.indexOf('fb-squad-ord-tip') >= 0, '应渲染提示元素 fb-squad-ord-tip');
// 行动序 1/2/3 均出现
['>1<', '>2<', '>3<'].forEach((t) => ok(html.indexOf(t) >= 0, '应出现行动序 ' + t));
ok(html.indexOf('从一') >= 0 && html.indexOf('从二') >= 0, '应列出从怪名');

// V9.41 状态标签：secTags 输出「键×N」（如 poison×2）→ UI 必须映射为中文名（蚀毒×2），不得直出原名
res.squad[1].st = ['poison×2'];
let html2 = '';
try {
  const s2 = mkState();
  html2 = panelHtml.call(NDX.ui, s2, { state: s2, stats: () => ({ ti: { maxHp: 4000, atk: 160 }, yuan: { matk: 60 }, dr: 0.05 }) }, NDX.HEROES.tangseng);
} catch (e) { console.log('FAIL 带层数标签渲染抛错: ' + (e && e.message)); fail++; }
ok(html2.indexOf('蚀毒×2') >= 0, '带层数状态标签应映射中文名（蚀毒×2）');
ok(html2.indexOf('poison×2') < 0, '不应把状态原始键 poison×2 直出到 UI');

if (fail === 0) console.log('ok / 编队条渲染冒烟（按序依次行动 · 行动序徽章）通过');
else console.log(fail + ' 失败');
process.exit(fail === 0 ? 0 : 1);
