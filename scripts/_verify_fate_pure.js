// _verify_fate_pure.js — 「六道 = 纯概率主干」契约门禁（GDD §2.1 收口 · 2026-09-12）
// ---------------------------------------------------------------------------
// 依据：2026-09-01 用户决策（§十 v=351 定调「六道选择不加任何属性，只加善恶」+ v=352 最终拍板
//       「六道选项纯善恶、不带任何属性或奖励」）+ GDD §2.1「取消六道直接给属性 / 取消六道当硬门槛」。
// 锁死的契约：
//   A) 六道抉择不改任何属性（bonusTi/bonusYuan 逐位不变）—— 属性不再由六道直接给
//   A-neg) 负控：检测器必须能发现"泄漏"，防止门禁变成永真断言
//   B) 六道抉择仍累加 s.fate[dao]（概率主干信号不丢）
//   C) 属性责任已移交劫印（六道对齐：战atk/渡maxhp/缘dr/夺reflect/隐eva/逆反伤为主·全加）
//   D) _gainFate 的其他副作用未被误删（恶道折寿 / 心魔 / 道途连击）
//   E) §2.1 硬门槛软化：法宝进化进度 = 命数 OR 劫印道数（旧行为保留 + 新路径可用 + 反例不误放）
//   F) 源码守卫：_gainFate 函数体内无 bonusTi/bonusYuan 写点（防回流）
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.join(__dirname, '..');
Object.defineProperty(global, 'navigator', { value: { userAgent: 'node' }, configurable: true });

let pass = 0, fail = 0;
const ck = (name, cond, extra) => {
  if (cond) { pass++; console.log('  ✓ ' + name); }
  else { fail++; console.log('  ✗ ' + name + (extra ? ' — ' + extra : '')); }
};

// —— 浏览器最小桩（与 _smoke_dao_balance.js 同范式）——
const _noop = () => {};
const _store = {};
const sb = {
  console, setTimeout, clearTimeout, setInterval, clearInterval, Date, Math, JSON,
  navigator: { userAgent: 'node' },
  localStorage: { getItem: (k) => (k in _store ? _store[k] : null), setItem: (k, v) => { _store[k] = String(v); }, removeItem: (k) => { delete _store[k]; } },
  document: {
    getElementById: () => null,
    createElement: () => ({ style: {}, setAttribute: _noop, appendChild: _noop, addEventListener: _noop, classList: { add: _noop, remove: _noop }, querySelector: () => null, remove: _noop }),
    querySelector: () => null, querySelectorAll: () => [], addEventListener: _noop, body: { appendChild: _noop }, documentElement: { style: {} },
  },
  requestAnimationFrame: (cb) => setTimeout(cb, 0), addEventListener: _noop, removeEventListener: _noop,
  XMLHttpRequest: function () { return { open: _noop, send: _noop, setRequestHeader: _noop, addEventListener: _noop }; },
};
sb.window = sb; sb.global = sb; sb.self = sb;
const ctx = vm.createContext(sb);
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const files = [...html.matchAll(/<script src="([^"]+)"[^>]*>/g)].map((m) => m[1]);
let loadErr = 0;
files.forEach((f) => {
  if (/^https?:/.test(f)) return;
  const p = f.split('?')[0];
  if (!fs.existsSync(path.join(ROOT, p))) return;
  try { vm.runInContext(fs.readFileSync(path.join(ROOT, p), 'utf8'), ctx, { filename: p }); }
  catch (e) { if (!/document|localStorage|is not defined/.test(String(e))) { loadErr++; console.log('  (加载告警) ' + p + ': ' + String(e.message).slice(0, 80)); } }
});
const NDX = sb.NDX;
const DAOS = ['战', '渡', '缘', '夺', '隐', '逆'];
console.log('加载脚本 ' + files.length + ' 个（告警 ' + loadErr + '）\n');

// —— 隔离上下文：只走 _gainFate，观测它对 state 的写入 ——
function mkState() {
  const fate = {}; DAOS.forEach((d) => (fate[d] = 0));
  return {
    hero: 'wukong', heroName: '悟空', act: 5, layer: 3, diff: 1,
    fate, flags: {}, life: 100, lifeMax: 100, hp: 100,
    xinmo: 0, xinmoChGain: 0, good: 0, evil: 0, seals: [], pending: {},
    done: {}, used: {},
    bonusTi: { atk: 0, hp: 0, dr: 0, eva: 0, maxHp: 0, cri: 0, criMult: 0, lifesteal: 0, matk: 0, reflect: 0 },
    bonusYuan: { matk: 0, mdef: 0 },
  };
}
function mkCtx(s) {
  const g = Object.create(NDX.Game.prototype);
  g.state = s; g.pushLog = _noop; g.toast = _noop;
  return g;
}
const snapAttr = (s) => JSON.stringify([s.bonusTi, s.bonusYuan]);
// 通用「属性泄漏检测器」：执行 fn 后比对属性快照，返回 {before, after, leaked}
function detectAttrLeak(s, fn) {
  const before = snapAttr(s);
  let err = null;
  try { fn(); } catch (e) { err = e; }
  const after = snapAttr(s);
  return { before, after, leaked: before !== after, err };
}
function gainFateOnce(dao) {
  const s = mkState();
  const r = detectAttrLeak(s, () => NDX.Game.prototype._gainFate.call(mkCtx(s), dao));
  return { s, r };
}

// ============================================================
console.log('【A】六道抉择不给任何属性（核心契约）');
DAOS.forEach((dao) => {
  const { s, r } = gainFateOnce(dao);
  ck('A·' + dao + ' 抉择不改 bonusTi/bonusYuan', !r.leaked, r.err ? ('异常:' + r.err.message) : (r.before + ' → ' + r.after));
});

console.log('\n【A-neg】负控：泄漏检测器必须能发现注入的泄漏（防门禁永真）');
{
  const s = mkState();
  const r = detectAttrLeak(s, () => { s.bonusTi.atk += 3; }); // 模拟旧 DAO_STAT_BONUS 泄漏
  ck('A-neg 检测器捕获 bonusTi 泄漏', r.leaked === true, 'leaked=' + r.leaked);
  const s2 = mkState();
  const r2 = detectAttrLeak(s2, () => { s2.bonusYuan.mdef += 0.005; });
  ck('A-neg 检测器捕获 bonusYuan 泄漏', r2.leaked === true, 'leaked=' + r2.leaked);
  const s3 = mkState();
  const r3 = detectAttrLeak(s3, () => { s3.fate['战'] = 1; });
  ck('A-neg 检测器不误报命运累加', r3.leaked === false, 'leaked=' + r3.leaked);
}

// ============================================================
console.log('\n【B】六道抉择仍累加命运（概率主干信号不丢）');
DAOS.forEach((dao) => {
  const { s } = gainFateOnce(dao);
  ck('B·' + dao + ' 抉择后 s.fate.' + dao + ' === 1', s.fate[dao] === 1, 'fate=' + s.fate[dao]);
});
{
  const s = mkState();
  const g = mkCtx(s);
  NDX.Game.prototype._gainFate.call(g, '渡');
  NDX.Game.prototype._gainFate.call(g, '渡');
  ck('B 同道两次累加（可复现增长）', s.fate['渡'] === 2, 'fate=' + s.fate['渡']);
  ck('B 道途连击按道记数', s.flags.daoStreak && s.flags.daoStreak.dao === '渡' && s.flags.daoStreak.n === 2, JSON.stringify(s.flags.daoStreak));
}

// ============================================================
console.log('\n【C】属性责任已移交劫印（六道对齐）');
{
  const EXPECT = { 战: 'atk', 渡: 'maxhp', 缘: 'dr', 夺: 'reflect', 隐: 'eva', 逆: 'reflect' };
  const byDao = {};
  Object.keys(NDX.SEAL_WORDS).forEach((w) => {
    const wd = NDX.SEAL_WORDS[w];
    if (!wd || !wd.dao) return;
    (byDao[wd.dao] = byDao[wd.dao] || []).push(wd);
  });
  DAOS.forEach((dao) => {
    const words = byDao[dao] || [];
    const primary = words.filter((w) => w.stat === EXPECT[dao]).length;
    ck('C·' + dao + ' 劫印主属性 = ' + EXPECT[dao] + '（多数词条）', words.length > 0 && primary * 2 > words.length, '主' + primary + '/' + words.length);
  });
  // 六道总计 6 道皆有词条
  ck('C 六道皆有劫印词条（属性承担方完备）', DAOS.every((d) => (byDao[d] || []).length > 0), DAOS.filter((d) => !(byDao[d] || []).length).join(','));
  // 逆道「反伤为主·全属性小幅增益」：存在多属性词条
  const niMulti = (byDao['逆'] || []).filter((w) => w.maxhp || w.crit || w.lifesteal || w.evaOnDodge).length;
  ck('C 逆道含「全属性小幅增益」多属性词条', niMulti >= 1, 'multi=' + niMulti);
}

// ============================================================
console.log('\n【D】_gainFate 的其他副作用未被误删（防「一刀切删干净」）');
{
  const war = gainFateOnce('战').s;
  const zen = gainFateOnce('渡').s;
  ck('D 战道抉择耗日程（战 → life 下降 1 天）', war.life < 100, 'life=' + war.life);
  // V9.7 天数制：善恶与寿命解绑，「折寿」改为「六道日程」——渡请仙真降莅临耗 10 天，战拔刀 1 天。
  // 故渡不再「不折寿」，而是「最费时日」；断言改为：渡耗 > 战耗（战快渡慢）
  ck('D 六道日程：渡（10 天）贵于战（1 天）——战快渡慢', zen.life < war.life,
    '渡=' + zen.life + ' 战=' + war.life);
  // 【2026-09-14 修正】原写死 9/360（渡10-战1），调 DAO_DAYS 即误报。改为从真源算差值。
  const _daoGap = ((NDX.LIFE && NDX.LIFE.DAO_DAYS ? NDX.LIFE.DAO_DAYS['渡'] : 10) - (NDX.LIFE && NDX.LIFE.DAO_DAYS ? NDX.LIFE.DAO_DAYS['战'] : 1)) / 360;
  ck('D 日程量与 DAO_DAYS 真源一致（差 = (渡-战)/360 年，现 ' + (_daoGap * 360) + ' 天）',
    Math.abs((war.life - zen.life) - _daoGap) < 1e-9, 'diff=' + (war.life - zen.life));
  const nb = NDX.XINMO && NDX.XINMO.BY_FATE ? (NDX.XINMO.BY_FATE['战'] || 0) : 0;
  const zn = NDX.XINMO && NDX.XINMO.BY_FATE ? (NDX.XINMO.BY_FATE['渡'] || 0) : 0;
  ck('D 心魔：叛道涨心魔（战）', nb > 0 ? war.xinmo > 0 : true, 'inc=' + nb + ' xinmo=' + war.xinmo);
  ck('D 心魔：顺命不涨心魔（渡）', zn === 0 ? zen.xinmo === 0 : true, 'inc=' + zn + ' xinmo=' + zen.xinmo);
}

// ============================================================
console.log('\n【E】§2.1 硬门槛软化：法宝进化进度 = 命数 OR 劫印道数');
{
  const mkEq = () => Object.assign({}, NDX.lootById('tre_jingu'));
  const mkSeals = (dao, n) => { const a = []; for (let i = 0; i < n; i++) a.push({ id: 's' + i, name: 'x', dao, tier: 'white' }); return a; };
  // E1 旧行为保留：持宝 + 命数足 → 升级（零回归）
  const s1 = { equips: [mkEq()], fate: { 渡: 5 }, seals: [] };
  const d1 = NDX.tryEvolveTreasures(null, s1);
  ck('E1 命数达标仍可升级（旧行为保留）', d1.indexOf('tre_jingu_du') >= 0, JSON.stringify(d1));
  // E2 新路径：命数不足但劫印道数足 → 升级（由装备达成）
  const s2 = { equips: [mkEq()], fate: { 渡: 0 }, seals: mkSeals('渡', 5) };
  const d2 = NDX.tryEvolveTreasures(null, s2);
  ck('E2 劫印道数达标亦可升级（由装备+行为达成）', d2.indexOf('tre_jingu_du') >= 0, JSON.stringify(d2));
  // E3 反例：两者皆不足 → 不升级
  const s3 = { equips: [mkEq()], fate: { 渡: 0 }, seals: mkSeals('渡', 2) };
  const d3 = NDX.tryEvolveTreasures(null, s3);
  ck('E3 命数与道数皆不足则不升级', d3.length === 0, JSON.stringify(d3));
}

// ============================================================
console.log('\n【F】源码守卫：_gainFate 体内无属性写点（防回流）');
{
  const src = fs.readFileSync(path.join(ROOT, 'js/game/game_event_3.js'), 'utf8');
  const start = src.indexOf('NDX.Game.prototype._gainFate = function');
  const next = src.indexOf('\nNDX.Game.prototype.', start + 10);
  const body = start >= 0 ? src.slice(start, next > 0 ? next : src.length) : '';
  ck('F 能定位 _gainFate 函数体', body.length > 100, 'len=' + body.length);
  ck('F 函数体内无 bonusTi 写点', body.indexOf('bonusTi') < 0, 'found at ' + body.indexOf('bonusTi'));
  ck('F 函数体内无 bonusYuan 写点', body.indexOf('bonusYuan') < 0, 'found at ' + body.indexOf('bonusYuan'));
  ck('F 函数体内无 DAO_STAT_BONUS 使用', body.indexOf('DAO_STAT_BONUS[') < 0, 'found');
}

console.log('\n结论：' + pass + ' 通过 / ' + fail + ' 失败');
process.exit(fail ? 1 : 0);
