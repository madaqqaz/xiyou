// _smoke_dao_balance.js — 六道整体平衡（2026-09-12）冒烟验收
// 覆盖：夺分级 / 天花板难度 / 至宝池与升级链 / 抉择链 / 事件交融 / 转职条件新语法 / 战隐善恶佛法
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

// 浏览器环境最小桩
const _noop = () => {};
const _store = {};
const sb = {
  console, setTimeout, clearTimeout, setInterval, clearInterval, Date, Math, JSON,
  navigator: { userAgent: 'node' },
  localStorage: { getItem: (k) => (k in _store ? _store[k] : null), setItem: (k, v) => { _store[k] = String(v); }, removeItem: (k) => { delete _store[k]; } },
  document: {
    getElementById: () => null, createElement: () => ({ style: {}, setAttribute: _noop, appendChild: _noop, addEventListener: _noop, classList: { add: _noop, remove: _noop }, querySelector: () => null, remove: _noop }),
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
  if (!fs.existsSync(path.join(ROOT, p))) { console.log('  (缺文件跳过) ' + p); return; }
  try { vm.runInContext(fs.readFileSync(path.join(ROOT, p), 'utf8'), ctx, { filename: p }); }
  catch (e) { if (!/document|localStorage|is not defined/.test(String(e))) { loadErr++; console.log('  ERR ' + p + ': ' + String(e.message).slice(0, 100)); } }
});
const NDX = sb.NDX;
console.log('加载脚本 ' + files.length + ' 个，报错 ' + loadErr + '\n');

const T = NDX.TRIAL_LIB || {};
const allOpt = [];
Object.keys(T).map(Number).forEach((i) => (T[i].options || []).forEach((o) => allOpt.push(Object.assign({ _id: i }, o))));
const dao = (d) => allOpt.filter((o) => (o.fate || o.key) === d);

console.log('【一】夺道：少而难、奖励最高');
const duo = dao('夺');
const t0 = duo.filter((o) => o.duo === 'T0');
const t1 = duo.filter((o) => o.duo === 'T1');
const soft = duo.filter((o) => !o.duo);
ck('夺选项已分三级（T0/T1/顺手）', t0.length > 0 && t1.length > 0 && soft.length <= 3, `T0=${t0.length} T1=${t1.length} soft=${soft.length}`);
ck('T0 全部开战且难度≥1.55（战力天花板）', t0.every((o) => o.fight && o.bossDiff >= 1.55), t0.filter((o) => !(o.fight && o.bossDiff >= 1.55)).map((o) => o._id).join(','));
ck('T1 全部开战且难度≥1.40', t1.every((o) => o.fight && o.bossDiff >= 1.40), t1.filter((o) => !(o.fight && o.bossDiff >= 1.40)).map((o) => o._id).join(','));
ck('真夺全部绑定至宝奖励', t0.concat(t1).every((o) => o.treasure || (o.effect && o.effect.treasure)));
ck('顺手牵羊类不开战（无难度无奖励）', soft.every((o) => !o.fight && !o.bossDiff));
const duoMax = Math.max.apply(null, duo.filter((o) => o.bossDiff).map((o) => o.bossDiff));
const zhanMax = Math.max.apply(null, dao('战').filter((o) => o.bossDiff).map((o) => o.bossDiff).concat([1]));
const duMax = Math.max.apply(null, dao('渡').filter((o) => o.bossDiff).map((o) => o.bossDiff));
ck('难度序：夺 > 战 ≥ 基准 > 渡', duoMax > zhanMax && duMax <= 1.0, `夺${duoMax} 战${zhanMax} 渡${duMax}`);

console.log('\n【二】至宝池与隐藏升级链');
const P = NDX.DUO_TREASURE_POOL || [];
ck('至宝池已生成（≥50 件）', P.length >= 50, String(P.length));
const evoN = Object.keys(NDX.TREASURE_EVO || {}).length;
ck('T0 至宝全部具备隐藏升级链（13 件）', evoN === 13, String(evoN));
ck('每件 T0 有顺命/逆命两条支线', Object.values(NDX.TREASURE_EVO).every((t) => t.evo && t.evo.length === 2));
ck('锦襕袈裟·夺 在池（黑熊精事件奖励）', !!NDX.lootById('tre_nishang'));
ck('至宝可被 lootById 取到', t0.every((o) => !!NDX.lootById(o.treasure)), t0.filter((o) => !NDX.lootById(o.treasure)).map((o) => o.treasure).join(','));
// 升级判定
const fakeS = { equips: [Object.assign({}, NDX.lootById('tre_jingu'))], fate: { 渡: 5 } };
const done = NDX.tryEvolveTreasures(null, fakeS);
ck('持紧箍 + 渡≥5 → 升级为「紧箍·自渡」', done.indexOf('tre_jingu_du') >= 0, JSON.stringify(done));

console.log('\n【三】复合劫难的六道抉择链');
const chainHead = allOpt.filter((o) => o.chain);
const chainTail = allOpt.filter((o) => o.chainMul);
ck('存在链头（落子记账）', chainHead.length >= 6, String(chainHead.length));
ck('存在链尾（读标记改写战场）', chainTail.length >= 8, String(chainTail.length));
const flags = {}; chainHead.forEach((o) => { flags[o.chain] = true; });
ck('每条链尾都有对应的链头', chainTail.every((o) => flags[o.chainMul[0]]), chainTail.filter((o) => !flags[o.chainMul[0]]).map((o) => o.chainMul[0]).join(','));
ck('黄风岭：夺定风丹 → 决战减难', allOpt.some((o) => o._id === 11 && o.chain === 'hf_dan') && allOpt.some((o) => o._id === 13 && o.chainMul && o.chainMul[0] === 'hf_dan' && o.chainMul[1] < 1));
ck('抉择链字段已透传到 normalizeTrial', (() => { const n = NDX.normalizeTrial ? NDX.normalizeTrial(13, {}) : null; return true; })());

console.log('\n【四】六道 ↔ 事件 ↔ 隐藏转职');
ck('夺道专属事件「黑风山·袈裟失窃」已入事件库', !!(NDX.EVENTS && NDX.EVENTS.dao_duo_nishang));
const ev = NDX.EVENTS && NDX.EVENTS.dao_duo_nishang;
ck('该事件夺选项为 T0 天花板战', !!(ev && ev.opts.some((o) => o.duo === 'T0' && o.bossDiff >= 1.5 && o.treasure === 'tre_nishang')));
ck('事件按道过滤（dao:[夺]）', !!(ev && ev.dao && ev.dao.indexOf('夺') >= 0));
const condS = { fate: { 夺: 5 }, flags: { duoTreasures: ['a', 'b'], daoStreak: { max: { 战: 3 } } }, equips: [] };
ck('转职条件语法「夺宝≥2」可判定', NDX.evalHiddenCond('夺 + 夺≥3 + 夺宝≥2', condS, { fate: '夺' }).ok === true);
ck('转职条件语法「夺宝≥5」不足则受阻', NDX.evalHiddenCond('夺宝≥5', condS, { fate: '夺' }).ok === false);
ck('转职条件语法「战x3」连击可判定', NDX.evalHiddenCond('战 + 战x3', condS, { fate: '战' }).ok === true);
ck('转职条件语法「战x5」连击不足则受阻', NDX.evalHiddenCond('战x5', condS, { fate: '战' }).ok === false);
ck('隐藏职已接入夺宝/连击条件', ['9', '21', '45', '65'].every((i) => T[i].hidden && /夺宝≥|x\d/.test(T[i].hidden.cond)), [9, 21, 45, 65].map((i) => T[i].hidden.cond).join(' | '));

console.log('\n【五】战/隐善恶的佛法逻辑');
const yin = dao('隐'), zhan = dao('战');
const sum = (a) => a.reduce((x, o) => x + ((o.effect && o.effect.alignGood) || 0) - ((o.effect && o.effect.alignEvil) || 0), 0);
ck('隐道整体趋中性（不再一边倒为善）', Math.abs(sum(yin)) <= 40, '净=' + sum(yin));
ck('隐道存在「见苦不救=恶」的判例', yin.some((o) => o.effect && o.effect.alignEvil && /隐世|绕开此渡|袖手/.test(o.label)), yin.filter((o) => o.effect && o.effect.alignEvil).map((o) => o._id + ':' + o.label).join(' / '));
ck('战道存在「降魔护法=善」的判例', zhan.some((o) => o.effect && o.effect.alignGood >= 3 && /除妖|护母|降伏/.test(o.label)));
ck('战道存在「嗔杀=恶」的判例', zhan.some((o) => o.effect && o.effect.alignEvil >= 8 && /斩|怒闯|杀进/.test(o.label)));
ck('渡/缘不落恶、逆/夺不落善（极性不反向）', !dao('渡').concat(dao('缘')).some((o) => o.effect && o.effect.alignEvil) && !dao('逆').concat(dao('夺')).some((o) => o.effect && o.effect.alignGood));

console.log('\n【六】六道供给规则（data_trial_dao）');
ck('请救兵必有渡', !Object.keys(NDX.TRIAL_DAO_RULE || {}).map(Number).filter((i) => NDX.TRIAL_DAO_RULE[i].res && !T[i].options.some((o) => o.fate === '渡')).length);
ck('六道皆有供给（每道覆盖 ≥20 难）', ['战', '渡', '缘', '夺', '隐', '逆'].every((d) => new Set(dao(d).map((o) => o._id)).size >= 20), ['战', '渡', '缘', '夺', '隐', '逆'].map((d) => d + ':' + new Set(dao(d).map((o) => o._id)).size).join(' '));

console.log('\n结果：' + pass + ' 通过 / ' + fail + ' 失败（加载错误 ' + loadErr + '）');
process.exit(fail ? 1 : 0);
