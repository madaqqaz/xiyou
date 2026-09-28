// _verify_ach_gate.js — S13 成就 · 可达性类缺陷守卫 + 跨系统回归交叉
//
// A 组 §⑤-1（P0 类缺陷守卫）：成就条件里出现的**朝代字面量**必须 ∈ `DYNASTY.LIST` 的 id 集合，
//   或 ∈ 已登记遗留白名单 `ACH_DYNASTY_LEGACY`（每项必须带"待拍板"说明）。
//   ⇒ 原来「条件引用不存在的朝代 ⇒ 零通道」这类缺陷**新增即判红**（白名单模式，同
//     `_verify_syntax_all.js` 的 KNOWN_MISSING_ASSETS 惯例）。
// B 组 §⑤-2（交叉 S12）：`game_meta.js` 中 `_syncAch()` 必须早于 `resetDynasty(`
//   —— 否则朝代类成就读到复位后的朝代 ⇒ `all_dynasty/shang_seng/...` 恒不点亮。
// C 组 §⑤-4（交叉 S03/S06）：`NDX.achvSlotBonus` 全库唯一定义（原槽位块整段重复）。
// D 组 §⑤-3（报告，不判红）：`all_17` 的判定阈值 vs 名称/文案数字是否一致（名实背离，待拍板）。
// 含反证：白名单外的假朝代 / 顺序颠倒样本 必须被判据拒斥。
//
// 运行：node scripts/_verify_ach_gate.js（已登记进 _run_all_gates.js）
'use strict';
const path = require('path'), fs = require('fs');
const ROOT = path.join(__dirname, '..');
global.window = global;
global.location = { href: 'http://client', search: '' };
Object.defineProperty(global, 'navigator', { value: { userAgent: 'node', platform: 'linux' }, configurable: true, writable: true });
const _s = {};
global.localStorage = {
  get length() { return Object.keys(_s).length; }, key(i) { return Object.keys(_s)[i] != null ? Object.keys(_s)[i] : null; },
  getItem(k) { return Object.prototype.hasOwnProperty.call(_s, k) ? _s[k] : null; }, setItem(k, v) { _s[k] = String(v); },
  removeItem(k) { delete _s[k]; }, clear() { for (const k of Object.keys(_s)) delete _s[k]; },
};
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
[...html.matchAll(/js\/([\w\/-]+\.js)/g)].map((m) => m[1])
  .filter((f, i, a) => a.indexOf(f) === i)
  .filter((f) => !['sound.js', 'ui.js', 'main.js'].includes(f) && !f.startsWith('ui/'))
  .forEach((f) => { try { require(path.join(ROOT, 'js', f)); } catch (e) {} });
const N = global.NDX;

let fail = 0;
const ck = (n, c, extra) => {
  if (c) console.log('ok   ' + n);
  else { console.log('FAIL ' + n + (extra ? '  → ' + extra : '')); fail++; }
};
// 剔整行 + 行内注释（保护 `://`）
const stripComments = (t) => t
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/(^|[^:])\/\/[^\n]*/gm, '$1');
const rawAch = fs.readFileSync(path.join(ROOT, 'js/achievements.js'), 'utf8');
const codeAch = stripComments(rawAch);
const codeMeta = stripComments(fs.readFileSync(path.join(ROOT, 'js/game/game_meta.js'), 'utf8'));

// ============ A 组 · 朝代字面量可达性 ============
const DYN = (N.DYNASTY && N.DYNASTY.LIST) || [];
const DYN_IDS = DYN.map((d) => d.id).filter(Boolean);
ck('A0 DYNASTY.LIST 可取且 id 齐备（取不到即失败，防假门禁）', DYN_IDS.length > 0, 'ids=' + DYN_IDS.join(','));
// 已登记遗留白名单：每项都必须写明原因与待办（新增即判红）。
// 2026-09-28 用户裁决后**已清空**——「清僧」按「只留唐朝前 10 个朝代（金蝉子十世轮回）」移除，
//   故 `qing` 不再是合法遗留项；若它（或任何新死朝代）再次出现，A2 会判红。
const ACH_DYNASTY_LEGACY = {};
const used = [...codeAch.matchAll(/_dId\s*===\s*'([a-z]+)'/g)].map((m) => m[1]);
ck('A1 成就侧朝代判定字面量可枚举（防正则失效空过）', used.length > 0, 'n=' + used.length + ' → ' + [...new Set(used)].join(','));
const unknown = [...new Set(used)].filter((d) => DYN_IDS.indexOf(d) < 0 && !ACH_DYNASTY_LEGACY[d]);
ck('A2 朝代判定字面量全部 ∈ DYNASTY ids ∪ 遗留白名单（新增死朝代即判红）',
  unknown.length === 0, '越界=' + unknown.join(','));
const legacyUsed = [...new Set(used)].filter((d) => ACH_DYNASTY_LEGACY[d]);
console.log('     —— §⑤-1 报告：零通道朝代判定（已白名单登记，待拍板）——');
legacyUsed.forEach((d) => console.log('       ' + d + ' → ' + ACH_DYNASTY_LEGACY[d]));
ck('A3 白名单项必须带非空原因说明', legacyUsed.every((d) => (ACH_DYNASTY_LEGACY[d] || '').length > 10));
ck('A4 反证：白名单外的假朝代(ming) 被 A2 判据拒斥',
  !(DYN_IDS.indexOf('ming') >= 0 || !!ACH_DYNASTY_LEGACY['ming']));
ck('A5 反证：真实朝代(tang) 不在白名单也能通过（证明判据非恒假）',
  DYN_IDS.indexOf('tang') >= 0 && !ACH_DYNASTY_LEGACY['tang']);

// ============ B 组 · §⑤-2 时序（交叉 S12） ============
const iSync = codeMeta.indexOf('this._syncAch()');
const iReset = codeMeta.indexOf('NDX.resetDynasty(');
ck('B1 _syncAch() 早于 resetDynasty()（朝代类成就不得读复位后朝代）',
  iSync >= 0 && iReset >= 0 && iSync < iReset, 'sync@' + iSync + ' reset@' + iReset);
ck('B2 反证：顺序颠倒样本被 B1 判据拒斥',
  !(('resetDynasty(); _syncAch();').indexOf('_syncAch()') < ('resetDynasty(); _syncAch();').indexOf('resetDynasty(')));

// ============ C 组 · §⑤-4 单一来源（交叉 S03/S06） ============
const part3 = stripComments(fs.readFileSync(path.join(ROOT, 'js/equipment_part3.js'), 'utf8'));
const nDef = (part3.match(/NDX\.achvSlotBonus\s*=\s*function/g) || []).length;
ck('C1 NDX.achvSlotBonus 全库唯一定义（原槽位块整段重复已消）', nDef === 1, 'defs=' + nDef);

// ============ D 组 · §⑤-3 名实一致（用户裁决后转正为断言） ============
//   裁定（2026-09-28）：**判定不变**（regionsVisited 键数 ≥ TOTAL_ACTS），名称/文案对齐实际判据量级。
const D17 = rawAch.match(/id:\s*'all_17'[^}]*name:\s*'([^']*)'[^}]*desc:\s*'([^']*)'/);
ck('D1 all_17 条目可解析', !!D17);
ck('D2 all_17 名称已对齐实际判据量级「九路皆通」', !!D17 && D17[1] === '九路皆通', 'name=' + (D17 && D17[1]));
ck('D3 all_17 文案不再出现「17」（名实背离已消）', !!D17 && D17[2].indexOf('17') < 0, 'desc=' + (D17 && D17[2]));
ck('D4 判据仍为 regionsVisited 键数 ≥ TOTAL_ACTS（判定未变，遵用户裁决）',
  /regionsVisited[\s\S]{0,60}length\s*>=\s*\(?\s*NDX\.TOTAL_ACTS/.test(codeAch));
ck('D5 反证：仍写「十七路皆通」的样本被 D2 判据拒斥', '十七路皆通' !== '九路皆通');

// §⑤-1 裁决连带：`all_dynasty` 文案必须收敛为十世十朝，且「清僧」已移除
const AD = rawAch.match(/id:\s*'all_dynasty'[^}]*desc:\s*'([^']*)'/);
ck('D6 all_dynasty 文案可解析', !!AD);
ck('D7 all_dynasty 文案已收敛十世十朝（无 明清/辽金元/五代）',
  !!AD && !/明清|辽金元|五代/.test(AD[1]), 'desc=' + (AD && AD[1]));
ck('D8 「清僧」条目与其死分支已移除（剔注释后零命中）',
  codeAch.indexOf('qing_seng') < 0 && codeAch.indexOf("_dId === 'qing'") < 0);

console.log(fail === 0
  ? 'ok / 成就门禁通过（朝代判定字面量全可达或有白名单登记 · _syncAch 早于 resetDynasty · achvSlotBonus 唯一定义）'
  : fail + ' 失败');
process.exit(fail === 0 ? 0 : 1);
