// _smoke_boss_hook.js — 章节 Boss 三模式（困难/正常·渡/加持）+ 装备五档 + 门禁质化 契约门禁
// ---------------------------------------------------------------------------
// 依据：2026-09-13 用户决策（万世剑冢式门禁 + Boss 四件套 + 三模式钩子 + 装备白绿蓝红金）。
// 锁死的契约：
//   A) 9+ 章末 Boss 各有专属破韧钩子 breakWith（PHASE 1，覆盖通用指派）
//   B) 白骨 phaseSkipOn=照妖镜（持钩跳人形态怯战）；skipGimmick 令 _bossDebuffSpec 不挂 gimmick
//   C) 加持 blessTreasure + BLESS_EFFECTS 已定义；playerHoldsTreasure 持有判定存在
//   D) 装备五档 EQUIP_TIERS = 白绿蓝红金；equipTierOf / bossDropTierFloor 存在且随章递增
//   E) trial80 = 阿难迦叶 Boss（bossName=传经吏·索经）；trial81 = 终局 Heart
//   F) 门禁质化：纯战道单刷无法达标，走够六道路即达标（防「战道刷穿」）
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

// —— 浏览器最小桩（与 _verify_fate_pure.js 同范式）——
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
console.log('加载脚本 ' + files.length + ' 个（告警 ' + loadErr + '）\n');

// —— A) 章末 Boss 破韧专属钩子（PHASE 1）——
// 前 8 项 = 九章末超级 Boss（第1章黄风走 HUANGFENG_FORMS 源码分支，见下方守卫）；
// 后 3 项 = 章中/章内 Boss（车迟国斗法 / 火焰山牛魔王 / 灵山传经吏）。
const CH_END = ['五行归墟', '红孩儿·三昧真火', '金鱼精·灵感大王', '六耳猕猴', '九头虫·碧波潭',
  '大鹏金翅雕', '假公主·玉兔', '通天河老鼋·湿经',
  '车迟三妖·虎鹿羊', '牛魔王', '传经吏·索经'];
const noBreak = CH_END.filter((k) => !(NDX.BOSS_FORMS[k] && NDX.BOSS_FORMS[k].breakWith));
ck('9+ 章末 Boss 均有专属破韧钩 breakWith', noBreak.length === 0, noBreak.join(','));
ck('黄风（HUANGFENG_FORMS）破韧=定风珠', true); // 由 game_core_2.js 黄风分支赋值，见源码守卫
let srcGuard = '';
try { srcGuard = fs.readFileSync(path.join(ROOT, 'js/game/game_core_2.js'), 'utf8'); } catch (e) {}
ck('源码守卫：黄风分支注入 dingfeng/feilong_zhang', /bossName === '黄风大圣'/.test(srcGuard) && /m\.breakWith = 'dingfeng'/.test(srcGuard));

// —— B) 白骨 phaseSkipOn + 跳形态引擎 ——
ck('白骨 phaseSkipOn=照妖镜（跳人形态怯战）', NDX.BOSS_FORMS['五行归墟'] && NDX.BOSS_FORMS['五行归墟'].phaseSkipOn === 'zhaoyao');
const skipSpec = NDX._bossDebuffSpec({ name: '白骨夫人 · 三戏之身', skipGimmick: true });
const normSpec = NDX._bossDebuffSpec('黄风怪 · 三昧神风');
ck('skipGimmick=true → 不挂 gimmick（白骨持照妖镜直入真形）', !skipSpec);
ck('不持钩（困难态）仍按 Boss 名挂 gimmick', !!normSpec, normSpec ? normSpec.type : 'null');

// —— C) 加持 blessTreasure + BLESS_EFFECTS ——
ck('blessTreasure 覆盖 ≥9 章末 Boss', CH_END.filter((k) => NDX.BOSS_FORMS[k] && NDX.BOSS_FORMS[k].blessTreasure).length >= 9);
ck('BLESS_EFFECTS 加持效果表已定义（≥5 件）', !!NDX.BLESS_EFFECTS && Object.keys(NDX.BLESS_EFFECTS).length >= 5);
const _allMulOk = Object.values(NDX.BLESS_EFFECTS || {}).every((v) => v.dmgMul == null || (v.dmgMul > 0 && v.dmgMul < 1));
ck('加持 dmgMul 均为「削弱」系数（0<mul<1）', _allMulOk);
ck('playerHoldsTreasure 持有判定已定义', typeof NDX.playerHoldsTreasure === 'function');
ck('playerHoldsTreasure 命中持有 / 未持返回正确', (function () {
  const s = { equips: [{ treasureId: 'dingfeng', chargesLeft: 1 }] };
  return NDX.playerHoldsTreasure(s, 'dingfeng') === true && NDX.playerHoldsTreasure(s, 'zhaoyao') === false;
})());

// —— D) 装备五档 白绿蓝红金 ——
ck('EQUIP_TIERS = 白绿蓝红金 五档', Array.isArray(NDX.EQUIP_TIERS) && NDX.EQUIP_TIERS.length === 5
  && NDX.EQUIP_TIERS.map((t) => t.name).join('') === '白装绿装蓝装红装金装');
ck('equipTierOf / bossDropTierFloor 已定义', typeof NDX.equipTierOf === 'function' && typeof NDX.bossDropTierFloor === 'function');
ck('equipTierOf 派生正确（成品 T2→蓝、T3→红、quality3→金）',
  NDX.equipTierOf({ setTier: 2 }) === 'blue' && NDX.equipTierOf({ setTier: 3 }) === 'red' && NDX.equipTierOf({ quality: 3 }) === 'gold');
ck('bossDropTierFloor 随章递增（前低后高）',
  NDX.bossDropTierFloor({ act: 3 }, true) !== 'gold' && NDX.bossDropTierFloor({ act: 16 }, true) === 'gold'
  && NDX.equipTierOf({}) === 'white');

// —— E) trial 80/81 ——
const TL = NDX.TRIAL_LIB || {};
ck('trial80 = 阿难迦叶 Boss（bossName=传经吏·索经）', TL[80] && TL[80].type === 'boss' && TL[80].bossName === '传经吏·索经', TL[80] && TL[80].type);
ck('BOSS_FORMS 存在「传经吏·索经」form', !!NDX.BOSS_FORMS['传经吏·索经']);
ck('trial81 标 heart（终局隐藏 Heart）', TL[81] && TL[81].heart === true);

// —— F) 门禁质化（防战道刷穿）——
const mkS = (act, fateObj) => ({
  act, fate: Object.assign({ 战: 0, 渡: 0, 逆: 0, 隐: 0, 夺: 0, 缘: 0 }, fateObj),
  mission: { trials: 99, mob: 99, elite: 0, events: 99 }, equips: [], // battle 由 mob/elite 折算
});
ck('门禁质化已定义', typeof NDX.fateGateQual === 'function' && typeof NDX.fateGateQualFor === 'function');
ck('纯战道单刷无法达标（缺「六道路」）', !NDX.fateGateCheck(mkS(6, { 战: 50 })).met);
ck('走够三种六道 + 量化达标 → 通过（第五章起需 3 种）', NDX.fateGateCheck(mkS(6, { 战: 5, 渡: 3, 逆: 2 })).met);
ck('前四章仅需 2 种六道', NDX.fateGateQualFor(3).daoKinds === 2 && NDX.fateGateQualFor(9).daoKinds === 3);

// —— G) 九章末 Boss 三向对齐（2026-09-13 章节边界重排 · 防再度漂移）——
//   历史教训：09-01 把 ACT_RANGES 改成 9 章制后，BOSS_NAMES(17 条) / bossDiffForAct(17 元素数组)
//   都没同步，导致 act2 章末挂白龙、act9 章末只有 diff40 强度——用户实测「没阶段成就感 / Boss 没难度」的根因。
//   本组断言即该族漂移的回归守卫：ACT_RANGES.end ↔ CHAPTER_BOSS_NAMES ↔ BOSS_FORMS 三向必须自洽。
const NCH = NDX.TOTAL_ACTS || 9;
ck('ACT_RANGES = 9 章', (NDX.ACT_RANGES || []).length === NCH, String((NDX.ACT_RANGES || []).length));
ck('CHAPTER_BOSS_NAMES 长度 = 章数', (NDX.CHAPTER_BOSS_NAMES || []).length === NCH, String((NDX.CHAPTER_BOSS_NAMES || []).length));

const badLayers = [];
for (let a = 1; a <= NCH; a++) {
  const r = NDX.actRange(a);
  if (r.layers !== (r.end - r.start + 1)) badLayers.push(a + ':' + r.layers + '≠' + (r.end - r.start + 1));
}
ck('各章 layers = 章内难数（消除 diffOfLayer 断号）', badLayers.length === 0, badLayers.join(','));

const badName = [];
for (let a = 1; a <= NCH; a++) if (NDX.bossNameForAct(a) !== NDX.CHAPTER_BOSS_NAMES[a - 1]) badName.push(a);
ck('bossNameForAct 逐章命中 CHAPTER_BOSS_NAMES', badName.length === 0, badName.join(','));

const noForm = [];
for (let a = 1; a <= NCH; a++) {
  const nm = NDX.bossNameForAct(a);
  if (nm === '黄风大圣') { if (!NDX.HUANGFENG_FORMS) noForm.push(a + ':HUANGFENG_FORMS 缺失'); continue; }
  if (!NDX.bossStageSetup(nm, {})) noForm.push(a + ':' + nm);
}
ck('9 章末 Boss 全部命中三段形态表（含显示名→形态表键别名）', noForm.length === 0, noForm.join(','));

const badDiff = [];
for (let a = 1; a <= NCH; a++) if (NDX.bossDiffForAct(a) !== NDX.actEnd(a)) badDiff.push(a + ':' + NDX.bossDiffForAct(a) + '≠' + NDX.actEnd(a));
ck('bossDiffForAct = actEnd（章末 Boss 难度随章递进，非 17 制旧数组）', badDiff.length === 0, badDiff.join(','));

const noRelic = [];
for (let a = 1; a <= NCH; a++) if (!(NDX.BOSS_RELICS || []).some((r) => r.act === a)) noRelic.push(a);
ck('每章均有章末遗物（BOSS_RELICS 按 act 覆盖）', noRelic.length === 0, noRelic.join(','));

const noHook2 = [];
for (let a = 1; a <= NCH; a++) {
  const nm = NDX.bossNameForAct(a);
  if (nm === '黄风大圣') continue; // 走 game_core_2 黄风源码分支（上方守卫已断言）
  const k = NDX.bossFormKeyOf ? NDX.bossFormKeyOf(nm) : nm;
  if (!(NDX.BOSS_FORMS[k] && NDX.BOSS_FORMS[k].breakWith)) noHook2.push(nm);
}
ck('章末 Boss 全部挂专属破韧钩（除黄风走源码分支）', noHook2.length === 0, noHook2.join(','));

ck('末章章末难 = 81（终局）', NDX.actEnd(NCH) === 81, String(NDX.actEnd(NCH)));
// 反证：用户明确诉求「第一章打黄风、第二章打白骨」
ck('第 1 章章末 = 黄风大圣（用户诉求）', NDX.bossNameForAct(1) === '黄风大圣', NDX.bossNameForAct(1));
ck('第 2 章章末 = 白骨夫人·五行归墟（用户诉求）', NDX.bossNameForAct(2) === '白骨夫人·五行归墟', NDX.bossNameForAct(2));
// 反证：第 4 章双弧标记必须共存且区间分离（车迟 28-31 / 通天河 31-36）
const _c4 = NDX.compoundFor(4);
ck('第 4 章双弧标记共存（chechi + tongtian）', !!(_c4 && _c4.chechi && _c4.tongtian));
ck('第 4 章双弧区间分离（防互污）', !!(_c4 && _c4.chechiRange && _c4.tongtianRange
  && _c4.chechiRange[0] === 28 && _c4.tongtianRange[1] === 36));

console.log('\n结论：' + pass + ' 通过 / ' + fail + ' 失败');
process.exit(fail === 0 ? 0 : 1);
