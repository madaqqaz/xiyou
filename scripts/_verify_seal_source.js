// _verify_seal_source.js — 「劫印来源真源」实证探针（V9.6 收口 data_seal_source 死模块）
// 目的：证明原先散落在 5 个文件 6 处调用点上的 tier / 阵营判定已收敛到单一真源，
//       且口径与迁移前**逐位等价**（同随机序、同短路、同掷骰次数），零回归。
// 断言：A 逐位等价（内联迁移前原式作参照实现）；B 各来源档位规则（含"不掷骰"）；
//       C 阵营真源（表 + offerSealsAligned 运行时池）；D 主道契合度；E 源码守卫；F 真源连通。
// 运行：node scripts/_verify_seal_source.js
const path = require('path'), fs = require('fs');
const ROOT = path.join(__dirname, '..');
Object.defineProperty(global, 'window', { value: global, writable: true, configurable: true });
global.location = { href: 'http://client', search: '' };
Object.defineProperty(global, 'navigator', { value: { userAgent: 'node', platform: 'linux' }, writable: true, configurable: true });
const _ls = {};
global.localStorage = {
  get length() { return Object.keys(_ls).length; },
  key(i) { const k = Object.keys(_ls); return k[i] != null ? k[i] : null; },
  getItem(k) { return Object.prototype.hasOwnProperty.call(_ls, k) ? _ls[k] : null; },
  setItem(k, v) { _ls[k] = String(v); }, removeItem(k) { delete _ls[k]; },
  clear() { for (const k of Object.keys(_ls)) delete _ls[k]; },
};
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const SKIP = new Set(['sound.js', 'ui.js', 'main.js']);
[...html.matchAll(/js\/([\w\/-]+\.js)/g)].map((m) => m[1])
  .filter((f, i, a) => a.indexOf(f) === i)
  .filter((f) => !SKIP.has(f) && !f.startsWith('ui/'))
  .forEach((f) => { try { require(path.join(ROOT, 'js', f)); } catch (e) {} });
const NDX = global.NDX;

let pass = 0, fail = 0;
const ck = (name, cond, extra) => { if (cond) { pass++; } else { fail++; console.log('  ✗ ' + name + (extra ? ' — ' + extra : '')); } };
const DAOS = ['战', '渡', '缘', '隐', '夺', '逆'];
const rel = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');

// ============================================================
// 随机流接管：固定序列 + 掷骰计数（等价性必须比对"次数"，不能只比结果）
// ============================================================
const _origRandom = Math.random;
let _seq = [], _i = 0;
function setSeq(seed) {
  _seq = []; let x = seed >>> 0;
  for (let k = 0; k < 512; k++) { x = (x * 1664525 + 1013904223) >>> 0; _seq.push(x / 4294967296); }
  _i = 0;
  Math.random = function () { const v = _seq[_i % _seq.length]; _i++; return v; };
}
function restore() { Math.random = _origRandom; }

// 迁移前 game_combat_2.js 的原式（逐字复制，作为等价性参照实现）
function refTrial(s, isBoss) {
  let sealTier = isBoss ? 'red' : 'white';
  if (sealTier === 'white') {
    const bP = Math.min(0.5, 0.04 + 0.02 * (s.act - 1));
    if (Math.random() < bP) sealTier = 'blue';
  }
  if (sealTier === 'white' && (s.flags.sealUp || 0) > 0 && Math.random() < Math.min(0.6, 0.2 * s.flags.sealUp)) {
    sealTier = 'blue';
  }
  return sealTier;
}

// ============ A 逐位等价：战斗 tier（结果 + 掷骰次数 双比对） ============
ck('A NDX.rollSealTier 已定义', typeof NDX.rollSealTier === 'function');
const eqBad = []; let eqN = 0;
for (let act = 1; act <= 9; act++) {
  for (const isBoss of [false, true]) {
    for (const su of [0, 1, 3, 5]) {
      for (const seed of [1, 7, 99, 20260912]) {
        const s = { act: act, flags: { sealUp: su } };
        setSeq(seed); const a = refTrial(s, isBoss); const na = _i; restore();
        setSeq(seed); const b = NDX.rollSealTier('trial', s, { isBoss: isBoss }); const nb = _i; restore();
        eqN++;
        if (a !== b || na !== nb) {
          eqBad.push('act' + act + '/boss' + isBoss + '/su' + su + '/seed' + seed
            + ' ref=' + a + '(' + na + '掷) src=' + b + '(' + nb + '掷)');
        }
      }
    }
  }
}
ck('A 战斗 tier 逐位等价（' + eqN + ' 组，结果 + 掷骰次数）', eqBad.length === 0, eqBad.slice(0, 3).join(' | '));

// 边界：s.act 缺失 → 旧式 NaN 比较恒 false（保持白）；真源同口径
setSeq(5); const _ra = refTrial({ flags: {} }, false); const _na = _i; restore();
setSeq(5); const _rb = NDX.rollSealTier('trial', { flags: {} }, {}); const _nb = _i; restore();
ck('A act 缺失边界同口径（NaN 比较 → 白）', _ra === _rb && _na === _nb, 'ref=' + _ra + '(' + _na + ') src=' + _rb + '(' + _nb + ')');

// ============ B 各来源档位规则（固定档位路径必须"不掷骰"） ============
const s0 = { act: 3, flags: {} };
function rolls(fn) { setSeq(1); const before = _i; const r = fn(); const used = _i - before; restore(); return { r: r, used: used }; }
let b = rolls(() => NDX.rollSealTier('elite', s0));
ck('B 精英 → blue 且不掷骰', b.r === 'blue' && b.used === 0, 'r=' + b.r + ' rolls=' + b.used);
b = rolls(() => NDX.rollSealTier('good', s0));
ck('B 非战斗 → white 且不掷骰', b.r === 'white' && b.used === 0, 'r=' + b.r + ' rolls=' + b.used);
b = rolls(() => NDX.rollSealTier('xinmo', s0));
ck('B 心魔 → blue 且不掷骰', b.r === 'blue' && b.used === 0, 'r=' + b.r + ' rolls=' + b.used);
b = rolls(() => NDX.rollSealTier('trial', s0, { isBoss: true }));
ck('B 关隘 Boss → red 且不掷骰', b.r === 'red' && b.used === 0, 'r=' + b.r + ' rolls=' + b.used);
b = rolls(() => NDX.rollSealTier('fusion', s0, { fusionN: 1 }));
ck('B 融合 1 难 → white', b.r === 'white' && b.used === 0, 'r=' + b.r);
b = rolls(() => NDX.rollSealTier('fusion', s0, { fusionN: 2 }));
ck('B 融合 2 难 → blue', b.r === 'blue' && b.used === 0, 'r=' + b.r);
b = rolls(() => NDX.rollSealTier('fusion', s0, { fusionN: 3 }));
ck('B 融合 3 难 → 红劫（三难全战·保底不掷骰）', b.r === 'red' && b.used === 0, 'r=' + b.r + ' rolls=' + b.used);
b = rolls(() => NDX.rollSealTier('fusion', s0, { fusionN: 9 }));
ck('B 融合 9 难 → 红劫（上界仍红·不掷骰）', b.r === 'red' && b.used === 0, 'r=' + b.r + ' rolls=' + b.used);
// 融合 0 难（无子难）→ 白，且不掷骰
b = rolls(() => NDX.rollSealTier('fusion', s0, { fusionN: 0 }));
ck('B 融合 0 难 → white 且不掷骰', b.r === 'white' && b.used === 0, 'r=' + b.r + ' rolls=' + b.used);

// ============ B2 红劫（red）= 融合≥3 与 Boss 双源保底（金劫仅三红合金） ============
// 契约：红劫唯二产出源 = (a) 融合节点子难 >= 3（保底，不掷骰）；(b) 关隘 Boss（trial 带 isBoss）。
//   金劫（gold）任何来源/参数恒不直给，仅由 NDX.combineRedSeals 三红合金产出。
function rolls2(fn) { setSeq(1); const before = _i; const r = fn(); const used = _i - before; restore(); return { r: r, used: used }; }
b = rolls2(() => NDX.rollSealTier('fusion', s0, { fusionN: 3 }));
ck('B2 融合 3 难 → 红劫（保底·不掷骰）', b.r === 'red' && b.used === 0, 'r=' + b.r + ' rolls=' + b.used);
b = rolls2(() => NDX.rollSealTier('fusion', s0, { fusionN: 9 }));
ck('B2 融合 9 难 → 红劫（上界仍红·不掷骰）', b.r === 'red' && b.used === 0, 'r=' + b.r + ' rolls=' + b.used);
b = rolls2(() => NDX.rollSealTier('trial', s0, { isBoss: true }));
ck('B2 关隘 Boss → 红劫（不掷骰）', b.r === 'red' && b.used === 0, 'r=' + b.r + ' rolls=' + b.used);
// 融合 1/2 难 → 不产红劫（白/蓝），金劫来源唯一
b = rolls2(() => NDX.rollSealTier('fusion', s0, { fusionN: 1 }));
ck('B2 融合 1 难 → 白劫（不产红）', b.r === 'white' && b.r !== 'red', 'r=' + b.r);
b = rolls2(() => NDX.rollSealTier('fusion', s0, { fusionN: 2 }));
ck('B2 融合 2 难 → 蓝劫（不产红）', b.r === 'blue' && b.r !== 'red', 'r=' + b.r);
// 金劫来源唯一：任何来源（含全部参数组合）恒不产 gold
let goldLeak = false;
['trial', 'elite', 'fusion', 'good', 'xinmo'].forEach((src) => {
  for (let act = 1; act <= 9; act++) {
    for (const boss of [false, true]) {
      for (const n of [0, 1, 2, 3, 9]) {
        const t = NDX.rollSealTier(src, { act: act, flags: {} }, { isBoss: boss, fusionN: n });
        if (t === 'gold') goldLeak = true;
      }
    }
  }
});
ck('B2 金劫来源唯一（rollSealTier 任何来源/参数恒不产 gold）', !goldLeak);
// 红劫来源隔离：非 Boss 的 trial / elite / good / xinmo 及 融合<3 恒不产 red/gold
const _leak = [];
['elite', 'good', 'xinmo'].forEach((src) => {
  for (let act = 1; act <= 9; act++) {
    for (let k = 0; k < 48; k++) {
      const t = NDX.rollSealTier(src, { act: act, flags: { sealUp: 9 } }, {});
      if (t === 'red' || t === 'gold') _leak.push(src + '/act' + act + '=' + t);
    }
  }
});
for (let act = 1; act <= 9; act++) {
  for (let k = 0; k < 48; k++) {
    const t = NDX.rollSealTier('trial', { act: act, flags: { sealUp: 9 } }, { isBoss: false });
    if (t === 'red' || t === 'gold') _leak.push('trial/bossfalse/act' + act + '=' + t);
  }
}
for (const n of [0, 1, 2]) {
  const t = NDX.rollSealTier('fusion', { act: 3, flags: {} }, { fusionN: n });
  if (t === 'red' || t === 'gold') _leak.push('fusion' + n + '=' + t);
}
ck('B2 红劫隔离（trial非boss·elite·good·xinmo·fusion<3 恒不产 red/gold）', _leak.length === 0, _leak.slice(0, 3).join(' | '));
// 红劫数值完备（可被 UI 消费）：词表数值 + label + 配色类 + 弃印定价
ck('B2 红劫词表数值完备（全部词条 tiers.red 有值）',
  Object.keys(NDX.SEAL_WORDS).every((k) => NDX.SEAL_WORDS[k].tiers && NDX.SEAL_WORDS[k].tiers.red != null));
ck('B2 红劫 label/配色/定价齐备',
  NDX.SEAL_TIER_LABEL.red === '红劫' && NDX.SEAL_TIER_CLS.red === 'tier-red' && NDX.SEAL_TIER_GOLD.red > 0);
ck('B2 红劫计 2 层（tier 计数等价）', NDX.sealLayerVal('red') === 2);
ck('B2 红劫样式已落地（.seal-opt.tier-red / .seal-chip.tier-red）',
  fs.readFileSync(path.join(ROOT, 'css/style.css'), 'utf8').indexOf('.seal-opt.tier-red') >= 0);
b = rolls(() => NDX.rollSealTier('nosuch', s0));
ck('B 未知来源 → white（兜底不抛错）', b.r === 'white', 'r=' + b.r);
ck('B 来源表覆盖 5 类来源', ['trial', 'elite', 'fusion', 'good', 'xinmo'].every((k) => !!NDX.SEAL_SOURCE_TIER[k]));

// ============ C 阵营真源 ============
ck('C SEAL_SOURCE_ALIGN.evil = 战/夺/逆', (NDX.SEAL_SOURCE_ALIGN.evil || []).join('') === '战夺逆');
ck('C SEAL_SOURCE_ALIGN.good = 渡/隐/缘', (NDX.SEAL_SOURCE_ALIGN.good || []).join('') === '渡隐缘');
ck('C 来源表 trial.align = evil', NDX.SEAL_SOURCE_TIER.trial.align === 'evil');
ck('C 来源表 good.align = good', NDX.SEAL_SOURCE_TIER.good.align === 'good');
const _ev = NDX.offerSealsAligned('wukong', 'blue', { seals: [], fate: {} }, 'evil');
ck('C offerSealsAligned(evil) 池仅含 战/夺/逆', _ev.length > 0 && _ev.every((o) => ['战', '夺', '逆'].indexOf(o.dao) >= 0),
  _ev.map((o) => o.dao).join(','));
const _gd = NDX.offerSealsAligned('tangseng', 'white', { seals: [], fate: {} }, 'good');
ck('C offerSealsAligned(good) 池仅含 渡/隐/缘', _gd.length > 0 && _gd.every((o) => ['渡', '隐', '缘'].indexOf(o.dao) >= 0),
  _gd.map((o) => o.dao).join(','));

// ============ D 主道契合度 ============
ck('D 主道契合 = 1.0', NDX.sealDaoAlignment('渡', '渡') === 1.0);
ck('D 相关道 = 0.6（渡↔缘）', NDX.sealDaoAlignment('缘', '渡') === 0.6);
ck('D 相关道 = 0.6（渡↔隐）', NDX.sealDaoAlignment('隐', '渡') === 0.6);
ck('D 跨界 = 0.2（战 vs 渡）', NDX.sealDaoAlignment('战', '渡') === 0.2);
ck('D 无 dao → 0.2', NDX.sealDaoAlignment(null, '渡') === 0.2);
ck('D 无主道 → 0.3', NDX.sealDaoAlignment('渡', null) === 0.3);
ck('D 相关关系严格对称', DAOS.every((a) => DAOS.every((x) => {
  const ab = (NDX.SEAL_DAO_RELATED[a] || []).indexOf(x) >= 0;
  const ba = (NDX.SEAL_DAO_RELATED[x] || []).indexOf(a) >= 0;
  return ab === ba;
})));
ck('D 每道恰 2 条相关道（三三成组，不相关 1/6 均匀）', DAOS.every((d) => (NDX.SEAL_DAO_RELATED[d] || []).length === 2));
ck('D 相关道不含自身', DAOS.every((d) => (NDX.SEAL_DAO_RELATED[d] || []).indexOf(d) < 0));
ck('D label 文本三档', NDX.sealAlignmentLabel('渡', '渡').text === '主道契合'
  && NDX.sealAlignmentLabel('缘', '渡').text === '相关道'
  && NDX.sealAlignmentLabel('战', '渡').text === '跨界');
ck('D label tier 三档', NDX.sealAlignmentLabel('渡', '渡').tier === 'main'
  && NDX.sealAlignmentLabel('缘', '渡').tier === 'related'
  && NDX.sealAlignmentLabel('战', '渡').tier === 'off');

// ============ E 源码守卫（死模块零残留） ============
function allJs(dir) {
  let out = [];
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) out = out.concat(allJs(p));
    else if (f.endsWith('.js')) out.push(p);
  }
  return out;
}
const jsFiles = allJs(path.join(ROOT, 'js'));
// 守卫口径：检测**代码引用**，不误伤注释——历史说明（如 jieseals.js 记录该模块的由来）是正当的。
const stripLineComments = (src) => src.replace(/\/\/[^\n]*/g, '');
const residue = jsFiles.filter((p) => /NDX\.SealSource\b|SEAL_SOURCE_WEIGHTS/.test(stripLineComments(fs.readFileSync(p, 'utf8'))));
ck('E 全仓无 NDX.SealSource / SEAL_SOURCE_WEIGHTS 代码残留', residue.length === 0,
  residue.map((p) => path.relative(ROOT, p)).join(','));
ck('E 死模块文件已删除', !fs.existsSync(path.join(ROOT, 'js', 'data_seal_source.js')));
ck('E index.html 无死模块加载行', html.indexOf('data_seal_source') < 0);

// ============ F 真源连通（6 处调用点 + UI） ============
const g2 = rel('js/game/game_combat_2.js');
ck('F 战斗入口消费真源', /rollSealTier\(\s*'trial'/.test(g2));
ck('F 精英入口消费真源', /rollSealTier\(\s*'elite'/.test(g2));
ck('F 战斗入口已无遗留硬编码蓝率公式', g2.indexOf('0.04 + 0.02 * (s.act - 1)') < 0);
ck('F 战斗入口已无遗留逆道进阶硬编码', g2.indexOf('0.2 * s.flags.sealUp') < 0);
ck('F 融合入口消费真源', /rollSealTier\(\s*'fusion'/.test(rel('js/game/game_compound.js')));
ck('F 非战斗入口消费真源', /rollSealTier\(\s*'good'/.test(rel('js/game/game_event_2.js')));
ck('F 心魔入口消费真源', /rollSealTier\(\s*'xinmo'/.test(rel('js/game/game_event_3.js')));
ck('F UI 消费契合度真源', /sealAlignmentLabel/.test(rel('js/ui/ui_panel_2.js')));
ck('F offerSealsAligned 消费阵营真源', /SEAL_SOURCE_ALIGN/.test(rel('js/jieseals.js')));
ck('F 契合度样式已落地', fs.readFileSync(path.join(ROOT, 'css/style.css'), 'utf8').indexOf('seal-align-main') >= 0);

restore();
console.log('\n结论：' + pass + ' 通过 / ' + fail + ' 失败');
process.exit(fail ? 1 : 0);
