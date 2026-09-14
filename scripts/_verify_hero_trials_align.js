// _verify_hero_trials_align.js — 英雄专属劫难「难号 ↔ 叙事」对齐门禁（九章制坐标系）
// ---------------------------------------------------------------------------
// 为什么需要这条门禁：
//   五英雄的专属叙事 NDX.HERO_TRIALS[hero][难号] 是按「难号」索引的，而难号的语义由
//   TRIAL_LIB 的 81 难真源决定。09-01 地理重排 + 09-13 九章边界重排后，hero 侧有 19 个
//   难号仍留着旧地理的叙事（如难 22 = ch2 章末白骨，hero 却写「黄袍掳公主」= ch3 内容；
//   难 32-34 = 通天河，hero 却写「隔板猜物/云梯显圣/车迟除妖」= 车迟内容）。
//   这类错位不报错、不崩溃，只是英雄在错误的章节讲错误的故事 —— 静态看代码看不出来，
//   必须用「难号 → 章 / 事件锚点」的对照断言才能拦住。
//
// 断言对象（三方真源：TRIAL_LIB 基准 / HERO_TRIALS 英雄覆盖 / trialByLayer 合并契约）：
//   A) 结构：base 覆盖 1-81；每英雄缺失键必须是显式记录的对齐债务（ALIGN_DEBT）；
//      name 非空；同英雄内无重复难名。
//   B) 章级负控：hero 文本不得出现「非本章」的高信号地名/事件词（跨章错位的主缺陷类）。
//      英雄出身地（花果山/流沙河/高老庄/云栈洞/鹰愁涧/天河/月宫/凌霄/五行山）显式豁免 ——
//      角色回忆自己的来历不算地理错位。
//   C) 难级正向锚点：每个难号配置一组事件关键词，hero 条目（name+dark）必须命中至少一个；
//      另配 BAN 禁止词表，拦住「同章同地但讲错事件」的写法（如难 77 是 Boss 大圣残躯，
//      不得写成「灵山成正果」封赏结局）。
//   D) 反证：把 09-13 重排前的真实错位样本喂给 B/C 检测器，必须被判负 —— 防止门禁退化为永真断言。
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
//   28 旧「黑水擒龙」（黑水河 = ch3 事件，落在 ch4 车迟求雨位）
//   59 旧「祭赛金光」（ch6 事件，落在 ch8 比丘白鹿位）
//   70 旧「铜台府案」（同章但非本难事件，本难 = 捣药杵）
//   71 旧「灵山前望」（ch9 事件，落在 ch8 玉兔遁月位）
//   80 旧「真经晒干」（ch9 的 79 晒经石事件，本难 = 灵山索经·阿难迦叶）
//   tangseng 另缺 1（取经人线从第 2 难「金蝉蒙冤」起，无第 1 难个人视角）
const ALIGN_DEBT = [28, 59, 70, 71, 80];
const DEBT_EXTRA = { tangseng: [1] };

// —— 章归属：由 ACT_RANGES 派生（不写死） ——
const ACT_OF = {};
for (let a = 1; a <= NDX.TOTAL_ACTS; a++) {
  for (let d = NDX.actStart(a); d <= NDX.actEnd(a); d++) ACT_OF[d] = a;
}

// —— 章级负控词表：高信号、无歧义、且不属于「英雄出身地」的地名/事件词 ——
//   出发点：一词命中即可判定「本章英雄在讲别章的事」。
const CH_WORD = {
  1: ['黄风', '三昧神风', '虎先锋', '双叉岭', '两界山'],
  2: ['白骨', '五庄观', '四圣', '贬退'],
  3: ['黄袍', '黑松林', '平顶山', '莲花洞', '乌鸡', '鼍龙', '红孩', '火云洞'],
  4: ['车迟', '三清观', '隔板猜物', '云梯显圣', '灵感大王', '陈家庄', '金兜'],
  5: ['落胎泉', '解阳山', '蝎子', '六耳', '谛听'],
  6: ['火焰山', '芭蕉', '牛魔王', '罗刹', '祭赛', '金光寺', '碧波潭', '九头虫', '万圣'],
  7: ['荆棘岭', '木仙', '小雷音', '朱紫', '狮驼', '大鹏'],
  8: ['比丘', '灭法', '隐雾', '凤仙', '玉华', '竹节', '金平', '给孤', '铜台', '天竺'],
  9: ['凌云渡', '晒经', '无字', '鼋'],
};
// 英雄出身地 / 个人物件：角色回忆自身来历不算地理错位，显式豁免
const ORIGIN_EXEMPT = ['花果山', '水帘洞', '流沙', '高老庄', '云栈洞', '鹰愁涧', '天河', '月宫', '凌霄', '五行山', '琉璃', '九颅', '骷髅'];
// 通天河横跨 ch4（通天河难）与 ch9（难81 通天河遇鼋湿经），故不作为跨章判负词
const CROSS_CHAPTER_OK = ['通天河'];
// 弧际家族引用白名单：[难号, 词] —— 同一人物家族跨弧出现属叙事必然，非地理错位。
// 逐条显式登记，便于审计；未登记的跨章命中一律判负。
const ALLOW_PAIR = [
  [27, '牛魔王'],  // ch3 红孩真火：红孩儿是牛魔王之子，提父属必然
  [46, '红孩'],    // ch6 火焰借扇：罗刹女是红孩之母，借扇必提旧怨
  [54, '大鹏'],    // ch6 九头虫·碧波潭：白龙线以「龙鹏旧怨」入题，非 ch7 狮驼大鹏
];

// —— 难级正向锚点：hero 条目（name + dark）须命中该难号事件关键词之一 ——
//   缺项即「本难不做难级断言」（仅 1 与 ALIGN_DEBT 中的难号）。
const ANCHOR = {
  2: ['灵石', '谪', '琉璃', '焚', '蒙冤'],
  3: ['水帘', '云栈', '流沙', '鹰愁', '江流', '漂'],
  4: ['称王', '高老庄', '九世', '索珠', '金山寺'],
  5: ['虎'], 6: ['双叉岭', '猎户', '坑'], 7: ['双叉岭'],
  8: ['灵台', '云栈', '流沙', '鹰愁', '五行山'],
  9: ['心猿', '别妻', '骷髅', '换马', '收心猿'],
  10: ['虎'], 11: ['风'], 12: ['风'], 13: ['风', '黄风'],
  14: ['高老庄'], 15: ['云栈'], 16: ['颅', '流沙'], 17: ['流沙'],
  18: ['四圣', '禅心', '庄'], 19: ['五庄', '果', '树'], 20: ['白骨', '骨'],
  21: ['贬', '心猿', '梦回', '独行', '孤鸣'], 22: ['骨', '墟'],
  23: ['黑松林', '黄袍'], 24: ['平顶'], 25: ['乌鸡', '井', '尸', '冤'],
  26: ['黑水', '鼍', '钓', '家事'], 27: ['火'],
  29: ['车迟', '三清', '求雨', '高台'], 30: ['车迟', '三清'], 31: ['车迟', '高台', '求雨'],
  32: ['渔', '庙', '祭', '渡', '水脉', '娃', '童'],
  33: ['冰', '杖', '鲤', '水', '阵', '庙', '童'], 34: ['冰'],
  35: ['金兜'], 36: ['通天', '冰', '河', '网', '天光'],
  37: ['女儿国', '女', '泉', '河'], 38: ['泉'], 39: ['女王', '娶亲', '戏', '拒婚', '照镜'],
  40: ['蝎'],
  41: ['六耳', '照面', '双棒', '九颅', '双影', '难分'], 42: ['辨', '假', '镜', '杖', '咒', '驮'],
  43: ['谛听', '幽冥', '殿', '地府', '碑', '声'], 44: ['如来', '判', '雷音', '佛', '散'], 45: ['真假'],
  46: ['扇', '火', '焰'], 47: ['罗刹', '扇', '泪'], 48: ['牛魔王', '牛'], 49: ['火焰山', '火', '扇', '过'],
  50: ['祭赛'], 51: ['金光寺', '冤僧', '寻珠', '祭赛'], 52: ['碧波', '盗宝', '擒', '探'],
  53: ['万圣', '盗草'], 54: ['祭赛', '九头', '龙鹏', '厄', '碧波'],
  55: ['木仙', '诗'], 56: ['小雷音', '假佛', '诈'], 57: ['朱紫'],
  58: ['狮驼', '鹏', '尸山', '经压', '翅', '齿', '垒'],
  60: ['灭法', '剃'], 61: ['隐雾', '梅花'], 62: ['凤仙'], 63: ['玉华'], 64: ['竹节'],
  65: ['金平', '灯', '犀'], 66: ['给孤'], 67: ['铜台'],
  68: ['天竺', '兔', '公主', '国前'], 69: ['兔', '月', '桂'],
  72: ['杵', '兔', '药', '凤', '月影'],
  73: ['化电', '归真'], 74: ['雷音', '传经', '经'], 75: ['无字', '经', '如来', '佛'],
  76: ['问佛', '佛', '根源'], 77: ['灵山', '残躯', '碑', '归一', '归墟', '照心', '碎碑', '无字'],
  78: ['凌云'], 79: ['晒经', '真经晒干'], 81: ['通天', '鼋', '无字碑'],
};
// 禁止词：同章同地但讲错事件的写法
const BAN = {
  77: [['成正果', '本难是 Boss「灵山无字·大圣残躯」，不得写成封赏结局'], ['册封', '本难是 Boss「灵山无字·大圣残躯」，不得写成封赏结局']],
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
  const anc = ANCHOR[layer];
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
console.log('\n【D】反证：重排前的真实错位样本必须被判负');
{
  // 全部取自 09-13 重排前的 hero_trials.js 真实文本
  const NEG = [
    { d: 41, e: { name: '火焰山前', dark: '火焰山就在眼前。悟空握紧棒，回头看八戒："呆子，这次扇子要真借。"' },
      why: 'ch6 火焰山事件落在 ch5 难41' },
    { d: 42, e: { name: '三调芭蕉', dark: '三调芭蕉扇，悟空变作牛魔王模样，骗得真扇。' },
      why: 'ch6 芭蕉扇事件落在 ch5 难42' },
    { d: 22, e: { name: '黄袍掳公主', dark: '黑松林里黄袍怪掳走宝象国公主，悟空化作公主模样等那妖来。' },
      why: 'ch3 黄袍怪事件落在 ch2 章末难22（本难 = 白骨夫人 Boss）' },
    { d: 59, e: { name: '祭赛金光', dark: '祭赛国金光寺，万圣龙王盗走舍利子。' },
      why: 'ch6 祭赛国事件落在 ch8 难59（本难 = 比丘白鹿）' },
    { d: 32, e: { name: '隔板猜物', dark: '车迟国隔板猜物，鹿力大仙与沙僧比试。柜中放的是山河社稷袄。' },
      why: 'ch4 车迟事件落在 ch4 通天河难32（同章错事件）' },
    { d: 34, e: { name: '车迟除妖', dark: '车迟国三妖现原形，虎力、鹿力、羊力跪地求饶。' },
      why: 'ch4 车迟事件落在 ch4 通天河难34（同章错事件）' },
    { d: 77, e: { name: '灵山成正果', dark: '灵山册封，沙僧被封金身罗汉。他摸了摸颈间——那里空了。' },
      why: '难77 是 Boss「大圣残躯」，封赏结局属讲错事件' },
  ];
  const escaped = [];
  NEG.forEach((n) => {
    const r = inspect(n.d, n.e);
    const caught = r.chHits.length > 0 || !r.anchorHit || r.banHits.length > 0;
    if (!caught) escaped.push('难' + n.d + '「' + n.e.name + '」' + n.why);
  });
  ck('D1 ' + NEG.length + ' 个真实错位样本全部被检测器判负（门禁非永真）',
    escaped.length === 0, escaped.join(' | '));

  // 反向：正样本（重排后的真实条目）不得被误判 —— 防「一刀切判负」的假门禁
  const falseAlarm = [];
  let posChecked = 0;
  HEROES.forEach((h) => Object.keys(HT[h] || {}).map(Number).forEach((d) => {
    posChecked++;
    const r = inspect(d, HT[h][d]);
    if (r.chHits.length || r.banHits.length) falseAlarm.push(h + '@' + d);
  }));
  ck('D2 重排后 ' + posChecked + ' 条正样本无误报', falseAlarm.length === 0, falseAlarm.slice(0, 4).join(','));
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
  ck('E5 9 章章末 Boss 难号的英雄条目全部落于本章', endBad.length === 0, endBad.slice(0, 4).join(' | '));
}

// ============================================================
console.log('\n【F】至宝引用完整性：劫难/英雄条目的 treasure id 必须可解析');
{
  // 背景：2026-09-13 PHASE 4 新增第 15 难（收八戒）与第 22 难（章末白骨）的真夺抉择时，
  //   两处都带 duo:'T1' 却漏了 treasure，而 T1 池恰好无 15/22 号条目 —— 破坏「真夺必须绑至宝」
  //   契约且奖励会静默消失。本条把「id 可解析」写成断言，防同类问题再次静默通过。
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
  ck('F1 ' + ids.length + ' 处 treasure 引用全部可经 lootById 解析（无 dead-ref）',
    dead.length === 0, dead.slice(0, 5).map((x) => x.src + '→' + x.id).join(' | '));

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

  // 反证：伪造一个不存在的 id，F1 检测器必须判负（防永真）
  ck('F3 反证：不存在的 treasure id 被判负', !NDX.lootById('tre__nonexistent__probe'));
}

console.log('\n结论：' + pass + ' 通过 / ' + fail + ' 失败');
process.exit(fail === 0 ? 0 : 1);
