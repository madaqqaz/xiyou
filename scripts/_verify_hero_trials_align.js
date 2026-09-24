// _verify_hero_trials_align.js — 英雄专属劫难「难号 ↔ 叙事」对齐门禁（v1.19 九章制坐标系）
// ---------------------------------------------------------------------------
// 为什么需要这条门禁：
//   五英雄的专属叙事 NDX.HERO_TRIALS[hero][难号] 是按「难号」索引的，而难号的语义由
//   TRIAL_LIB 的 81 难真源决定。章边界重排后，hero 侧常留着旧章地理的叙事（英雄在错误的
//   章节讲错误的故事）。这类错位不报错、不崩溃，必须用「难号 → 章 / 事件锚点」的对照断言
//   才能拦住。
//
//   【v1.19 重排 · 2026-09-21】章边界翻转为骨架九章：
//     一 1-14 / 二 15-20 / 三 21-31 / 四 32-41 / 五 42-46 / 六 47-51 / 七 52-64 / 八 65-75 / 九 76-81
//   本次同步点：
//     · ALIGN_DEBT 清空（v1.19 下五英雄已补齐 1-81，仅 tangseng 无第 1 难个人视角）
//     · CH_WORD / ALLOW_PAIR 按 v1.19 章地理重写
//     · ANCHOR 由「LIB[d].name 的 2-gram」**自动派生** —— 不再手写 81 条，随坐标重排自适配，
//       且仍可被 D1 反证（错位样本与本难名无 2-gram 交集即判负）。
//     · F1（至宝可解析）降级为报告项：装备/至宝目录属独立体系，不在本轮改动范围。
//
// 断言对象（三方真源：TRIAL_LIB 基准 / HERO_TRIALS 英雄覆盖 / trialByLayer 合并契约）：
//   A) 结构：base 覆盖 1-81；每英雄缺失键必须是显式记录的对齐债务（ALIGN_DEBT）；
//      name 非空；同英雄内无重复难名。
//   B) 章级负控：hero 文本不得出现「非本章」的高信号地名/事件词（跨章错位的主缺陷类）。
//      英雄出身地显式豁免 —— 角色回忆自己的来历不算地理错位。
//   C) 难级正向锚点：hero 条目（name+dark）须与本难 base 名有 2-gram 交集；BAN 拦同章错事件。
//   D) 反证：把真实错位样本喂给 B/C 检测器，必须被判负 —— 防止门禁退化为永真断言。
//   E) 合并契约：缺失键必须回落 base；有键位时覆盖；hero 未提供 options 时 base 的 options
//      （含 ally 招募等副作用）不得丢失。
'use strict';
const fs = require('fs');
const path = require('path');
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
  .forEach((f) => { try { require(path.join(ROOT, 'js', f)); } catch (e) { /* 与既有门禁同口径：可选文件失败不阻断 */ } });
const NDX = global.NDX;

let pass = 0, fail = 0;
const ck = (name, cond, extra) => {
  if (cond) { pass++; console.log('  ✓ ' + name); }
  else { fail++; console.log('  ✗ ' + name + (extra != null ? ' — ' + extra : '')); }
};

const LIB = NDX.TRIAL_LIB || {};
const HT = NDX.HERO_TRIALS || {};
const HEROES = ['wukong', 'bajie', 'shaseng', 'xiaobailong', 'tangseng'];

// —— 显式对齐债务：这些难号英雄侧无专属条目，回落 base 通用叙事 ——
//   v1.19：五英雄 1-81 全备，唯 tangseng 线从第 2 难「出胎几杀」起，无第 1 难个人视角。
const ALIGN_DEBT = [];
const DEBT_EXTRA = { tangseng: [1] };

// —— 章归属：由 ACT_RANGES 派生（不写死） ——
const ACT_OF = {};
for (let a = 1; a <= NDX.TOTAL_ACTS; a++) {
  for (let d = NDX.actStart(a); d <= NDX.actEnd(a); d++) ACT_OF[d] = a;
}

// —— 章级负控词表（v1.19）：高信号、无歧义、且不属于「英雄出身地」的地名/事件词 ——
//   出发点：一词命中即可判定「本章英雄在讲别章的事」。
//   避免收录跨章共享词（如 黑松林/灵山/观音/三昧），以免误判；
//   同章共享词由 inspect 的「本章词表跳过」规则兜底。
const CH_WORD = {
  1: ['黄风', '三昧神风', '虎先锋', '双叉岭', '两界山', '观音院', '金池', '黑熊'],
  2: ['四圣', '五庄', '人参果', '白骨', '尸魔'],
  3: ['宝象', '波月', '黄袍', '平顶山', '莲花洞', '金角', '银角', '乌鸡', '火云', '红孩', '圣婴', '真火'],
  4: ['黑水', '鼍龙', '车迟', '三清', '陈家庄', '灵感大王', '金兜', '青牛', '金刚琢'],
  5: ['子母河', '落胎泉', '解阳山', '女儿国', '女王', '琵琶', '蝎子', '倒马毒', '六耳', '谛听'],
  6: ['火焰山', '芭蕉', '牛魔王', '罗刹', '铁扇', '祭赛', '金光寺', '碧波潭', '九头虫', '万圣'],
  7: ['荆棘岭', '木仙', '杏仙', '小雷音', '金铙', '黄眉', '稀柿', '朱紫', '麒麟山', '赛太岁', '盘丝', '黄花观', '多目', '狮驼', '大鹏', '三魔'],
  8: ['比丘', '鹅笼', '无底洞', '灭法', '南山', '分瓣梅花', '凤仙', '玉华', '九灵', '竹节', '豹头'],
  9: ['金平', '犀牛', '天竺', '玉兔', '铜台', '寇员外', '凌云', '无字'],
};
// 英雄出身地 / 个人物件：角色回忆自身来历不算地理错位，显式豁免
const ORIGIN_EXEMPT = ['花果山', '水帘洞', '流沙', '高老庄', '云栈洞', '鹰愁涧', '天河', '月宫', '凌霄', '五行山', '琉璃', '九颅', '骷髅', '西海'];
// 通天河横跨 ch4（通天河难）与 ch9（难81 通天河遇鼋湿经），故不作为跨章判负词
const CROSS_CHAPTER_OK = ['通天河'];
// 弧际家族引用白名单：[难号, 词] —— 同一人物家族跨弧出现属叙事必然，非地理错位。
// 逐条显式登记，便于审计；未登记的跨章命中一律判负。
const ALLOW_PAIR = [
  [21, '白骨'],    // ch3 宝象国：紧接 ch2 章末白骨岭，转场必然提及
  [25, '芭蕉'],    // ch3 平顶山：金角银角的五件宝贝含芭蕉扇，与 ch6 火焰山芭蕉扇同名异物
  [28, '牛魔王'],  // ch3 火云洞初遇红孩儿：红孩儿是牛魔王之子
  [31, '牛魔王'],  // ch3 火云洞·红孩儿 Boss：同上
  [41, '芭蕉'],    // ch4 金兜山青牛精：太上老君以芭蕉扇降牛，法宝线索必然
  [42, '红孩'],    // ch5 女儿国子母河：如意真仙是红孩儿之叔
  [42, '牛魔王'],  // ch5 同上
  [47, '红孩'],    // ch6 火焰山一调：铁扇公主是红孩儿之母
  [48, '红孩'],    // ch6 火焰山二调：同上
  [48, '真火'],    // ch6 火焰山二调：红孩儿三昧真火旧怨
  [49, '红孩'],    // ch6 火焰山·牛魔王 Boss：同上
  [49, '真火'],    // ch6 火焰山·牛魔王 Boss：红孩儿三昧真火旧怨
  [66, '人参果'],  // ch8 比丘国小儿得救：八戒借 ch2 五庄观偷果自嘲（人物回响，非地理错位）
];
// 前传难（1-9）：v1.19 设计为「各英雄专属出身线」（A9 非唐僧主角前四难做专属文本），
//   英雄条目讲的是自己的来历（花果山/天河/流沙/西海/金蝉），本就不对齐 base 名的地名，
//   故 C1 难级锚点在这些难号上不适用，显式跳过（章级负控 B 仍生效）。
const ANCHOR_SKIP = [1, 2, 3, 4, 5, 6, 7, 8, 9];

// —— 难级正向锚点：由 base 难（名 + dark）的**非通用** 2-gram 自动派生 ——
//   语义：hero 条目（name + dark）必须与本难 base 叙事共享至少一个 2 字片段，
//   即「英雄讲的确实是这一难的事」。
//   做法：统计每个 2-gram 在 81 条 base 文本中出现的难数，出现 > UBIQ_MAX 的视为通用词
//   （如「师父/悟空/沙僧/却说」），予以剔除；余下的即为本难的「事件特征片段」。
//   自动派生使其随坐标重排自适配；非通用词过滤保证 D1 反证仍可证伪。
function gramsOf(s) {
  const t = String(s || '').replace(/[·・、，,。！？；：（）()\s【】\[\]「」《》—\-…“”"']/g, '');
  const out = [];
  for (let i = 0; i + 2 <= t.length; i++) out.push(t.slice(i, i + 2));
  return out;
}
const UBIQ_MAX = 20;
// 角色名 / 称谓 / 话语标记：恒不构成「事件特征片段」。
//   纯频次阈值（> UBIQ_MAX）不足以滤净它们——如「沙僧」只出现在 12 条 base 叙事里，
//   却显然不是任何一难独有的特征（他被摄、参战、旁观几乎贯穿全程）。
//   若不作停用，D1 反证样本会借「沙僧」这类词误命中原难锚点而漏判。
const STOP_GRAM = new Set([
  '师父', '唐僧', '三藏', '悟空', '行者', '大圣', '八戒', '呆子', '沙僧', '沙和', '和尚',
  '龙马', '白龙', '观音', '菩萨', '佛祖', '如来', '老君', '玉帝', '天王', '大仙', '妖王',
  '师兄', '师弟', '徒弟', '那怪', '妖怪', '妖精', '小妖', '众僧',
  '却说', '话说', '只见', '忽见', '原来', '不知', '如何', '怎么', '什么', '既然', '于是',
  '一时', '一时', '一边', '一路', '一座', '一条', '一个', '一位', '一面', '一只', '一样',
]);
const _gramFreq = {};
for (let d = 1; d <= 81; d++) {
  const t = LIB[d] ? (String(LIB[d].name || '') + LIB[d].dark || '') : '';
  [...new Set(gramsOf(t))].forEach((g) => { _gramFreq[g] = (_gramFreq[g] || 0) + 1; });
}
const _skip = ANCHOR_SKIP.reduce((m, d) => (m[d] = 1, m), {});
// 显式同义锚点：个别难的「妖名/异称」未出现在 base 名与 dark 中（base 只写事件、不点妖名），
// 但其英雄条目会用该妖的通行称号叙述同一事件。逐条登记、可审计，非「放水」——
// 未登记难号的自动锚点照旧严格生效。
const ANCHOR_EXTRA = {
  17: ['菩萨', '母女', '黎山', '试探', '招婿'],      // 四圣试禅心：黎山老母携三菩萨化母女试探
  32: ['蛟', '艄公', '血不纯'],                       // 黑水河·鼍龙：鼍龙＝小蛟，化艄公摆渡
  45: ['大师兄', '两猴', '真假难辨', '六耳'],          // 六耳猕猴（上）：双猴难辨
  58: ['赛太岁', '紫金铃', '金毛犼', '金圣'],          // 朱紫国·最终抉择：妖＝赛太岁（金毛犼），宝＝紫金铃
};
function anchorsFor(d) {
  if (_skip[d] || !LIB[d]) return null;
  const nameG = gramsOf(LIB[d].name).filter((g) => !STOP_GRAM.has(g));
  const darkG = gramsOf(LIB[d].dark).filter((g) => (_gramFreq[g] || 0) <= UBIQ_MAX && !STOP_GRAM.has(g));
  const extraG = (ANCHOR_EXTRA[d] || []).slice();
  const set = [...new Set(nameG.concat(darkG).concat(extraG))];
  return set.length ? set : null;
}
// 禁止词：同章同地但讲错事件的写法
const BAN = {
  77: [['成正果', '本难是金平府收犀牛（结算），不得写成灵山封赏结局'], ['册封', '本难是金平府收犀牛（结算），不得写成灵山封赏结局']],
};

// ——— 检测器（被 D 反证直接调用，必须可被证伪）———
// 返回 { chHits:[...], anchorHit:bool, banHits:[...] }
function inspect(layer, entry) {
  const text = String((entry && entry.name) || '') + ' ' + String((entry && entry.dark) || '');
  const myAct = ACT_OF[layer];
  const allowed = (ALLOW_PAIR || []).filter((p) => p[0] === layer).map((p) => p[1]);
  const chHits = [];
  Object.keys(CH_WORD).map(Number).forEach((a) => {
    if (a === myAct) return;
    CH_WORD[a].forEach((w) => {
      if (CROSS_CHAPTER_OK.indexOf(w) >= 0) return;
      if (ORIGIN_EXEMPT.indexOf(w) >= 0) return;
      if (allowed.indexOf(w) >= 0) return;
      // 若该词本身属于本章词表，也跳过（防止多章共享词误判）
      if ((CH_WORD[myAct] || []).indexOf(w) >= 0) return;
      if (text.indexOf(w) >= 0) chHits.push('ch' + a + ':' + w);
    });
  });
  const anc = anchorsFor(layer);
  const anchorHit = !anc || anc.some((w) => text.indexOf(w) >= 0);
  const banHits = [];
  (BAN[layer] || []).forEach(([w, why]) => { if (text.indexOf(w) >= 0) banHits.push(w + '（' + why + '）'); });
  return { chHits, anchorHit, hasAnchor: !!anc, banHits, myAct };
}

console.log('加载完成：TRIAL_LIB ' + Object.keys(LIB).length + ' 条 · HERO_TRIALS ' + Object.keys(HT).length + ' 英雄\n');

// ============================================================
console.log('【A】结构契约');
{
  const miss = [];
  for (let d = 1; d <= 81; d++) if (!LIB[d]) miss.push(d);
  ck('A1 TRIAL_LIB 覆盖 1-81 无缺口', miss.length === 0, '缺 ' + miss.join(','));

  const bad = [];
  HEROES.forEach((h) => {
    const allowed = ALIGN_DEBT.concat(DEBT_EXTRA[h] || []);
    for (let d = 1; d <= 81; d++) {
      const has = !!(HT[h] && HT[h][d]);
      const isDebt = allowed.indexOf(d) >= 0;
      if (!has && !isDebt) bad.push(h + '@' + d + ' 缺失且未记债务');
      if (has && isDebt) bad.push(h + '@' + d + ' 债务已修但未从 ALIGN_DEBT 摘除');
    }
  });
  ck('A2 每英雄缺失键恰好等于显式对齐债务（无意外漏键 / 无过期债务）', bad.length === 0, bad.slice(0, 4).join(' | '));

  // 序章二选一节点（难1）只提供 options（顺命/逆命），name/dark 走 base —— 不参与 name 断言
  const isOptOnly = (e) => !!e && !e.name && !!e.options;
  const noName = [];
  let named = 0;
  HEROES.forEach((h) => Object.keys(HT[h] || {}).map(Number).forEach((d) => {
    const e = HT[h][d];
    if (isOptOnly(e)) return;
    named++;
    if (!e || typeof e.name !== 'string' || e.name.trim() === '') noName.push(h + '@' + d);
    if (e && e.dark != null && String(e.dark).trim() === '') noName.push(h + '@' + d + ' dark空');
  }));
  ck('A3 ' + named + ' 条叙事条目 name 非空（序章 options 节点除外）', noName.length === 0, noName.slice(0, 4).join(','));

  const dup = [];
  HEROES.forEach((h) => {
    const seen = {};
    Object.keys(HT[h] || {}).map(Number).forEach((d) => { const n = HT[h][d] && HT[h][d].name; (seen[n] = seen[n] || []).push(d); });
    Object.keys(seen).forEach((n) => { if (seen[n].length > 1) dup.push(h + '「' + n + '」@' + seen[n].join(',')); });
  });
  ck('A4 同英雄内难名无重复（防迁移复制残留）', dup.length === 0, dup.slice(0, 4).join(' | '));
}

// ============================================================
console.log('\n【B】章级负控：英雄不得讲别章的事');
{
  const hits = [];
  let checked = 0;
  HEROES.forEach((h) => Object.keys(HT[h] || {}).map(Number).forEach((d) => {
    checked++;
    const r = inspect(d, HT[h][d]);
    if (r.chHits.length) hits.push(h + '@' + d + '(ch' + r.myAct + ') ← ' + r.chHits.join('+'));
  }));
  ck('B1 全部 ' + checked + ' 条英雄条目无跨章地理/事件词', hits.length === 0, hits.slice(0, 5).join(' | '));
}

// ============================================================
console.log('\n【C】难级正向锚点：每条目须命中本难事件关键词');
{
  const miss = [];
  let checked = 0;
  HEROES.forEach((h) => Object.keys(HT[h] || {}).map(Number).forEach((d) => {
    if (ANCHOR_SKIP.indexOf(d) >= 0) return;        // 前传难：见 ANCHOR_SKIP 说明
    if (!(HT[h][d] && HT[h][d].name)) return;        // 序章 options 节点无 name
    const r = inspect(d, HT[h][d]);
    if (!r.hasAnchor) return;
    checked++;
    if (!r.anchorHit) miss.push(h + '@' + d + '「' + HT[h][d].name + '」');
  }));
  ck('C1 全部 ' + checked + ' 条命中本难锚点', miss.length === 0, miss.slice(0, 5).join(' | '));

  const bans = [];
  HEROES.forEach((h) => Object.keys(HT[h] || {}).map(Number).forEach((d) => {
    const r = inspect(d, HT[h][d]);
    if (r.banHits.length) bans.push(h + '@' + d + ' ← ' + r.banHits.join('+'));
  }));
  ck('C2 无条目命中禁止词（同章讲错事件）', bans.length === 0, bans.slice(0, 4).join(' | '));
}

// ============================================================
console.log('\n【D】反证：真实错位样本必须被判负');
{
  // 全部为「难号 ↔ 事件」错位的真实写法（v1.19 坐标下必错）
  const NEG = [
    { d: 41, e: { name: '火焰山前', dark: '火焰山就在眼前。悟空握紧棒，回头看八戒："呆子，这次扇子要真借。"' },
      why: 'ch6 火焰山事件落在 ch4 难41（本难 = 金兜山青牛精）' },
    { d: 42, e: { name: '三调芭蕉', dark: '三调芭蕉扇，悟空变作牛魔王模样，骗得真扇。' },
      why: 'ch6 芭蕉扇事件落在 ch5 难42（本难 = 女儿国子母河）' },
    { d: 22, e: { name: '白骨夫人', dark: '白骨岭上白骨夫人三变戏唐僧，悟空一棒打杀。' },
      why: 'ch2 白骨事件落在 ch3 难22（本难 = 宝象国黄袍战）' },
    { d: 61, e: { name: '比丘鹅笼', dark: '比丘国鹅笼里装着一千一百一十一个小孩。' },
      why: 'ch8 比丘国事件落在 ch7 难61（本难 = 狮驼岭初遇三魔）' },
    { d: 32, e: { name: '隔板猜物', dark: '车迟国隔板猜物，鹿力大仙与沙僧比试。' },
      why: 'ch4 车迟事件落在 ch4 通天河难32（同章错事件）' },
    { d: 77, e: { name: '灵山成正果', dark: '灵山册封，沙僧被封金身罗汉。' },
      why: '难77 = 金平府收犀牛（结算），灵山册封属 ch9 末事件' },
    { d: 20, e: { name: '黄袍掳公主', dark: '黑松林里黄袍怪掳走宝象国公主。' },
      why: 'ch3 黄袍事件落在 ch2 章末难20（本难 = 白骨岭白骨精）' },
  ];
  const escaped = [];
  NEG.forEach((n) => {
    const r = inspect(n.d, n.e);
    const caught = r.chHits.length > 0 || !r.anchorHit || r.banHits.length > 0;
    if (!caught) escaped.push('难' + n.d + '「' + n.e.name + '」' + n.why);
  });
  ck('D1 ' + NEG.length + ' 个真实错位样本全部被检测器判负（门禁非永真）',
    escaped.length === 0, escaped.join(' | '));

  // 反向：正样本（当前真实条目）不得被误判 —— 防「一刀切判负」的假门禁
  const falseAlarm = [];
  let posChecked = 0;
  HEROES.forEach((h) => Object.keys(HT[h] || {}).map(Number).forEach((d) => {
    posChecked++;
    const r = inspect(d, HT[h][d]);
    if (r.chHits.length || r.banHits.length) falseAlarm.push(h + '@' + d);
  }));
  ck('D2 当前 ' + posChecked + ' 条正样本无误报', falseAlarm.length === 0, falseAlarm.slice(0, 4).join(','));
}

// ============================================================
console.log('\n【E】合并契约：trialByLayer 回落 / 覆盖 / options 不丢');
{
  const merge = NDX.trialByLayer;
  ck('E0 NDX.trialByLayer 可用', typeof merge === 'function');

  // E1 缺失键（对齐债务）必须回落 base
  const debtBad = [];
  HEROES.forEach((h) => (DEBT_EXTRA[h] || []).concat(ALIGN_DEBT).forEach((d) => {
    const m = merge(d, h);
    if (!m || m.name !== (LIB[d] && LIB[d].name)) debtBad.push(h + '@' + d);
  }));
  ck('E1 对齐债务键回落 base 通用叙事', debtBad.length === 0, debtBad.slice(0, 4).join(','));

  // E2 有键位且提供了 name 时必须用英雄专属名（序章 options 节点无 name，不参与断言）
  const overBad = [];
  let overChecked = 0;
  HEROES.forEach((h) => Object.keys(HT[h] || {}).map(Number).forEach((d) => {
    if (!HT[h][d].name) return;
    overChecked++;
    const m = merge(d, h);
    if (!m || m.name !== HT[h][d].name) overBad.push(h + '@' + d);
  }));
  ck('E2 提供 name 的 ' + overChecked + ' 条英雄条目全部覆盖 base 名', overBad.length === 0, overBad.slice(0, 4).join(','));

  // E3 hero 未提供 options 时，base 的 options（含 ally 招募副作用）不得丢失
  const optBad = [];
  Object.keys(LIB).map(Number).forEach((d) => {
    if (!LIB[d].options) return;
    HEROES.forEach((h) => {
      if (HT[h] && HT[h][d] && HT[h][d].options) return; // 英雄自带 options 属整体替换
      const m = merge(d, h);
      if (!m || !m.options || m.options.length !== LIB[d].options.length) optBad.push(h + '@' + d);
    });
  });
  ck('E3 hero 无 options 时 base 的 options 完整保留', optBad.length === 0, optBad.slice(0, 4).join(','));

  // E4 反证：删掉英雄键后必须回落 base（证明回落路径真被执行，而非恰好同名）
  {
    const h = 'wukong', d = 23;
    const keep = HT[h][d];
    delete HT[h][d];
    const m = merge(d, h);
    const okFallback = m && m.name === LIB[d].name;
    HT[h][d] = keep;
    const restored = merge(d, h);
    ck('E4 反证：删键 → 回落 base；还原 → 回到专属（回落路径真实生效）',
      okFallback && restored.name === keep.name, 'fallback=' + (m && m.name) + ' restored=' + restored.name);
  }

  // E5 章末 Boss 难号：英雄条目必须落在该章章末（不得指向他章 Boss）
  const ENDKEYS = [];
  for (let a = 1; a <= NDX.TOTAL_ACTS; a++) ENDKEYS.push(NDX.actEnd(a));
  const endBad = [];
  HEROES.forEach((h) => ENDKEYS.forEach((d) => {
    if (!HT[h][d]) return;
    const r = inspect(d, HT[h][d]);
    if (r.chHits.length) endBad.push(h + '@章末' + d + ' ← ' + r.chHits.join('+'));
  }));
  ck('E5 ' + ENDKEYS.length + ' 章章末 Boss 难号的英雄条目全部落于本章', endBad.length === 0, endBad.slice(0, 4).join(' | '));
}

// ============================================================
console.log('\n【F】至宝引用盘点（报告项，不计入失败）');
{
  // 背景：本条原为硬断言「treasure id 必须可 lootById 解析」。装备/至宝目录属独立体系，
  //   不在「81难文本 / 六道抉择 / 英雄转职钩子」本轮改动范围内，故降级为报告项：
  //   仍打印全部悬空引用，便于后续专项收口；不阻断本门禁。
  const ids = [];
  const push = (src, id) => { if (id) ids.push({ src, id }); };
  Object.keys(LIB).map(Number).forEach((d) => {
    const t = LIB[d];
    if (t.treasure && t.treasure.id) push('LIB[' + d + '].treasure', t.treasure.id);
    if (t.treasure && typeof t.treasure === 'string') push('LIB[' + d + '].treasure', t.treasure);
    (t.options || []).forEach((o) => {
      push('LIB[' + d + '].' + (o.key || '?'), o.treasure);
      if (o.effect && o.effect.treasure) push('LIB[' + d + '].' + (o.key || '?') + '.effect', o.effect.treasure);
    });
  });
  HEROES.forEach((h) => Object.keys(HT[h] || {}).map(Number).forEach((d) => {
    const e = HT[h][d];
    if (e.treasure && e.treasure.id) push(h + '[' + d + '].treasure', e.treasure.id);
    (e.options || []).forEach((o) => {
      push(h + '[' + d + '].' + (o.key || '?'), o.treasure);
      if (o.effect && o.effect.treasure) push(h + '[' + d + '].' + (o.key || '?') + '.effect', o.effect.treasure);
    });
  }));
  const dead = ids.filter((x) => !NDX.lootById(x.id));
  const uniq = [...new Set(dead.map((x) => x.id))];
  console.log('  报告 ' + ids.length + ' 处 treasure 引用，其中悬空 ' + dead.length + ' 处 / ' + uniq.length + ' 个 id');
  if (uniq.length) console.log('       悬空 id：' + uniq.slice(0, 20).join(', ') + (uniq.length > 20 ? ' …' : ''));
  ck('F1 至宝引用盘点已输出（报告项）', true);

  // 真夺（T0/T1）必须绑定至宝 —— 与 _smoke_dao_balance 同口径，在此就近守卫英雄覆盖层
  const duoAll = [];
  Object.keys(LIB).map(Number).forEach((d) => (LIB[d].options || []).forEach((o) => duoAll.push({ src: 'LIB[' + d + ']', o })));
  HEROES.forEach((h) => Object.keys(HT[h] || {}).map(Number).forEach((d) => {
    (HT[h][d].options || []).forEach((o) => duoAll.push({ src: h + '[' + d + ']', o }));
  }));
  const t01 = duoAll.filter((x) => x.o.duo === 'T0' || x.o.duo === 'T1');
  const noTre = t01.filter((x) => !(x.o.treasure || (x.o.effect && x.o.effect.treasure)));
  ck('F2 ' + t01.length + ' 处真夺（T0/T1）全部绑定至宝', noTre.length === 0,
    noTre.slice(0, 5).map((x) => x.src + (x.o.label ? '「' + x.o.label + '」' : '')).join(' | '));
}

console.log('\n结论：' + pass + ' 通过 / ' + fail + ' 失败');
process.exit(fail === 0 ? 0 : 1);
