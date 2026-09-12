// _verify_seal_rites.js — 篝火仪典「数据 → 分发 → 执行」三段接线门禁
// 背景：V9.6 审计发现 BONFIRE_RITES 四项仪典中 life/xinmo/incense 仅有数据与 UI 按钮，
//   main.js 无 case、game_camp.js 无执行分支 → 玩家点击完全无响应（内容落空）。
//   本次改为「声明式数据 + 统一执行器 NDX.doRite」，本门禁锁死三段连通，防止回归。
// 断言：A 数据结构完备 · B 三段接线连通 · C 执行结算正确 · D 资源门控 · E 结构性守卫（无"有数据无执行"）
//       F 旧接口兼容 · G 文案无幽灵字段
// 运行：node scripts/_verify_seal_rites.js
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
const rel = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');

const RITES = NDX.BONFIRE_RITES || {};
const IDS = ['blood', 'life', 'xinmo', 'incense'];

// ============ A 数据结构完备 ============
ck('A BONFIRE_RITES 定义 4 项仪典', IDS.every((k) => !!RITES[k]), Object.keys(RITES).join(','));
IDS.forEach((id) => {
  const r = RITES[id];
  if (!r) { ck('A ' + id + ' 存在', false); return; }
  ck('A ' + id + ' 具备执行契约（costOk/costFn/pay/gain/gainText）',
    typeof r.costOk === 'function' && typeof r.costFn === 'function'
    && typeof r.pay === 'function' && !!r.gain && typeof r.gainText === 'string' && r.gainText.length > 0);
  ck('A ' + id + ' 具备展示契约（name/icon/desc/cost/costText/why）',
    !!r.name && !!r.icon && typeof r.desc === 'string' && !!r.cost && !!r.costText && typeof r.costWhy === 'string');
  ck('A ' + id + ' 增益字段均在真源可结算白名单（atk/hp/dr/eva/cri/matk/mdef）',
    Object.keys(r.gain || {}).every((k) => ['atk', 'hp', 'dr', 'eva', 'cri', 'matk', 'mdef', 'lifesteal'].indexOf(k) >= 0),
    Object.keys(r.gain || {}).join(','));
});
ck('A 统一执行器 NDX.doRite 已定义', typeof NDX.doRite === 'function');
ck('A 列表接口 NDX.riteList 已定义', typeof NDX.riteList === 'function');

// ============ B 三段接线连通（源码守卫） ============
const mainSrc = rel('js/main.js');
const campSrc = rel('js/game/game_camp.js');
const panelSrc = rel('js/ui/ui_panel_2.js');
IDS.forEach((id) => {
  ck('B main.js 分发 case rite-' + id, new RegExp("case\\s+'rite-" + id + "'").test(mainSrc));
});
ck('B main.js 分发为前缀统一路由（切出仪典 id）', /action\.slice\(5\)/.test(mainSrc));
ck('B game_camp.js 经 NDX.doRite 统一执行', /NDX\.doRite\s*\(/.test(campSrc));
ck('B game_camp.js 已无「仅 blood 分支」硬编码', !/rite\s*===\s*'blood'/.test(campSrc));
ck('B UI 按数据表动态生成按钮（rite- + r.id）', /'rite-'\s*\+\s*r\.id/.test(panelSrc));
ck('B UI 已渲染 disabled 态与原因', /r\.disabled/.test(panelSrc) && /r\.why/.test(panelSrc));

// ============ C 执行结算正确 ============
const mk = (over) => Object.assign({
  hp: 5000, hpMax: 5000, life: 5, xinmo: 20, gold: 500, act: 3,
  bonusTi: { atk: 0, hp: 0, dr: 0, eva: 0, maxHp: 0, cri: 0, criMult: 0, lifesteal: 0, matk: 0, mdef: 0 },
}, over || {});
// blood：pay = min(200, hp-1)
let s = mk();
let r = NDX.doRite(s, 'blood');
ck('C blood 执行成功', r.ok === true);
ck('C blood 付 200 血（5000→4800）', s.hp === 4800, 'hp=' + s.hp);
ck('C blood 增益落地（atk+1/hp+8/cri+0.02）',
  s.bonusTi.atk === 1 && s.bonusTi.hp === 8 && Math.abs(s.bonusTi.cri - 0.02) < 1e-9, JSON.stringify(s.bonusTi));
ck('C blood 返回 pay/gain/gainText', r.pay === 200 && r.gainText === RITES.blood.gainText);
// life：付 1 寿
s = mk();
r = NDX.doRite(s, 'life');
ck('C life 执行成功且寿数 -1', r.ok === true && s.life === 4, 'life=' + s.life);
ck('C life 增益落地（matk+2/mdef+2/cri+0.02）',
  s.bonusTi.matk === 2 && s.bonusTi.mdef === 2 && Math.abs(s.bonusTi.cri - 0.02) < 1e-9, JSON.stringify(s.bonusTi));
// xinmo：付 10 心魔
s = mk();
r = NDX.doRite(s, 'xinmo');
ck('C xinmo 执行成功且心魔 -10', r.ok === true && s.xinmo === 10, 'xinmo=' + s.xinmo);
ck('C xinmo 增益落地（atk+3/cri+0.02）', s.bonusTi.atk === 3 && Math.abs(s.bonusTi.cri - 0.02) < 1e-9);
// incense：付 50 金
s = mk();
r = NDX.doRite(s, 'incense');
ck('C incense 执行成功且金 -50', r.ok === true && s.gold === 450, 'gold=' + s.gold);
ck('C incense 增益落地（hp+15/dr+0.01/eva+0.01）',
  s.bonusTi.hp === 15 && Math.abs(s.bonusTi.dr - 0.01) < 1e-9 && Math.abs(s.bonusTi.eva - 0.01) < 1e-9);
// 累计叠加（可重复献祭）
s = mk();
NDX.doRite(s, 'xinmo'); NDX.doRite(s, 'xinmo');
ck('C 重复献祭累计（心魔 20→0，atk +6）', s.xinmo === 0 && s.bonusTi.atk === 6, 'x=' + s.xinmo + ' atk=' + s.bonusTi.atk);
// 未知名不抛错
s = mk();
r = NDX.doRite(s, 'nosuch');
ck('C 未知仪典 → ok:false 且不抛错', r.ok === false && r.reason === 'no-rite');
// 资源不足时不得改动状态
s = mk({ hp: 1 });
const _before = JSON.stringify([s.hp, s.life, s.xinmo, s.gold, s.bonusTi]);
NDX.doRite(s, 'blood');
ck('C 代价不足时状态零改动（blood hp=1）', JSON.stringify([s.hp, s.life, s.xinmo, s.gold, s.bonusTi]) === _before);

// ============ D 资源门控 ============
const cases = [
  ['blood', { hp: 1 }, false], ['blood', { hp: 2 }, true],
  ['life', { life: 0 }, false], ['life', { life: 1 }, true],
  ['xinmo', { xinmo: 9 }, false], ['xinmo', { xinmo: 10 }, true],
  ['incense', { gold: 49 }, false], ['incense', { gold: 50 }, true],
];
let dBad = [];
cases.forEach(([id, over, want]) => {
  const st = mk(over);
  const got = NDX.doRite(st, id).ok;
  if (got !== want) dBad.push(id + '/' + JSON.stringify(over) + ' want=' + want + ' got=' + got);
});
ck('D 代价门控 8 组（含边界）', dBad.length === 0, dBad.join(' | '));
// riteList 点亮/置灰与 why 文案
const list = NDX.riteList(mk({ hp: 1, life: 0, xinmo: 0, gold: 0 }));
ck('D riteList 返回 4 项', list.length === 4, 'n=' + list.length);
ck('D 资源枯竭全部置灰且各带原因', list.every((x) => x.disabled === true && !!x.why), JSON.stringify(list.map((x) => x.why)));
const list2 = NDX.riteList(mk({ hp: 5000, life: 5, xinmo: 50, gold: 500 }));
ck('D 资源充足全部点亮且无原因文案', list2.every((x) => x.disabled === false && x.why === ''));
ck('D 每项 why 文案非通用占位（各不相同）', new Set(list.map((x) => x.why)).size === 4);
ck('D riteList 每项含 costText（UI 展示用）', list.every((x) => !!x.costText));

// ============ E 结构性守卫：不存在「有数据无执行」 ============
ck('E 数据项数 == 可执行项数（无一落空）',
  IDS.every((id) => !!RITES[id] && typeof RITES[id].pay === 'function' && typeof RITES[id].costOk === 'function')
  && Object.keys(RITES).length === IDS.length,
  'data=' + Object.keys(RITES).length + ' ids=' + IDS.length);
ck('E 每个 id 在 main.js 均有分发 case',
  Object.keys(RITES).every((id) => new RegExp("case\\s+'rite-" + id + "'").test(mainSrc)));

// ============ F 旧接口兼容 ============
ck('F NDX.doRiteBlood 仍存在（兼容旧调用/门禁）', typeof NDX.doRiteBlood === 'function');
s = mk();
const rb = NDX.doRiteBlood(s);
ck('F doRiteBlood 返回旧字段（cost/atk/hp/cri）',
  rb.ok === true && rb.cost === 200 && rb.atk === 1 && rb.hp === 8 && rb.cri === 0.02, JSON.stringify(rb));
s = mk({ hp: 1 });
ck('F doRiteBlood 气血不足 → ok:false', NDX.doRiteBlood(s).ok === false);
ck('F doRiteBlood 与 doRite 同源（非复制实现）', /NDX\.doRite\(s,\s*'blood'\)/.test(rel('js/jieseals.js')));

// ============ G 文案无幽灵字段 ============
const jsRites = rel('js/jieseals.js');
const descs = IDS.map((id) => (RITES[id] && RITES[id].desc) || '').join('\n');
ck('G 文案已无「诵经伤害」幽灵字段（无结算字段承载）', descs.indexOf('诵经伤害') < 0);
ck('G 文案已无「心魔上限」幽灵字段（需改心魔内核常量）', descs.indexOf('心魔上限') < 0);
ck('G 无遗留旧文案「+3% 诵经伤害」', jsRites.indexOf('+3% 诵经伤害') < 0);
ck('G 各仪典 desc 均声明代价与增益', IDS.every((id) => /献祭/.test(RITES[id].desc)));

console.log('\n结论：' + pass + ' 通过 / ' + fail + ' 失败');
process.exit(fail ? 1 : 0);
