// =============================================================
// data_negotiate.js — 《逆道西行》谈判系统 · NEGOTIATE/FOLLOWERS
// 从 data.js 拆分（2026-08-31）：独立维护谈判系统
// 全局命名空间 NDX（同时挂到 window，兼容其他文件以 window.NDX 引用）
// =============================================================
window.NDX = window.NDX || {};
var NDX = window.NDX;

NDX.NEGOTIATE = {
  fragThreshold: 5,      // 散件门槛：全本≥1 或 散件≥5 才可谈判
  perFull: 0.08,         // 佛经全本 ×8%
  perFrag: 0.005,        // 佛经散件 ×0.5%
  perXinmo: 0.03,        // 心魔 +3%/层
  perNi: 0.05,           // 逆道经文 +5%/部
  perEvil: 0.01,         // 恶值 +1%/10
  eliteMult: 1.0,        // 精英 ×1.0
  bossMult: 0.6,         // Boss ×0.6
  cap: 0.85,             // 封顶 85%
  baiguBonus: 0.20,      // 白骨令牌 Boss 谈判 +20%
  followerCap: 3,        // 随从上限 3，满需替换
  xinmoSuccess: 0,       // 谈判成功心魔 +0
  xinmoFail: 8,          // 谈判失败心魔 +8（低于逆道抉择 +15）
  angerAtkBonus: 0.10,   // 谈判失败妖王激怒：本场战斗 atk/matk +10%
};

// 随从效果表：id → 定义（战斗助战平铺属性，见 combat.js computeStats）
NDX.FOLLOWERS = {
  huangfeng: { id: 'huangfeng', name: '黄风大圣', desc: '黄风岭貂鼠，三昧神风助战', atk: 16, matk: 12, hp: 110, dr: 0.02, mdef: 0.02 },
  baigu:     { id: 'baigu', name: '白骨夫人', desc: '白虎岭尸魔，白骨化盾', atk: 10, matk: 18, hp: 90, dr: 0.03, mdef: 0.03 },
  honghaier: { id: 'honghaier', name: '红孩儿', desc: '火云洞圣婴，三昧真火助阵', atk: 14, matk: 22, hp: 80, dr: 0.01, mdef: 0.02 },
  jinyu:     { id: 'jinyu', name: '灵感大王', desc: '通天河金鱼精，水势护体', atk: 8, matk: 16, hp: 150, dr: 0.02, mdef: 0.02 },
  xiezi:     { id: 'xiezi', name: '蝎子精', desc: '女儿国毒蝎，倒马毒桩', atk: 18, matk: 10, hp: 70, dr: 0.02, mdef: 0.01 },
  liuer:     { id: 'liuer', name: '六耳猕猴', desc: '真假猴王，混世幻身', atk: 20, matk: 14, hp: 90, dr: 0.02, mdef: 0.02 },
  niumo:     { id: 'niumo', name: '牛魔王', desc: '火焰山大力王，蛮力助战', atk: 26, matk: 6, hp: 180, dr: 0.03, mdef: 0.01 },
  jiutou:    { id: 'jiutou', name: '九头虫', desc: '碧波潭九头怪，毒涎蚀甲', atk: 12, matk: 20, hp: 100, dr: 0.02, mdef: 0.03 },
  dapeng:    { id: 'dapeng', name: '大鹏金翅雕', desc: '狮驼岭金翅大鹏，云程万里', atk: 22, matk: 10, hp: 120, dr: 0.02, mdef: 0.02 },
  yutu:      { id: 'yutu', name: '玉兔精', desc: '天竺假公主，捣药月华', atk: 8, matk: 24, hp: 130, dr: 0.02, mdef: 0.04 },
  qingniu:   { id: 'qingniu', name: '青牛精', desc: '金兜洞独角兕，金刚琢护主', atk: 20, matk: 8, hp: 140, dr: 0.03, mdef: 0.02 },
  huangpao:  { id: 'huangpao', name: '黄袍怪', desc: '碗子山黄袍郎，奎木狼星力', atk: 16, matk: 12, hp: 100, dr: 0.02, mdef: 0.02 },
};

// 妖王映射：Boss 节点名（NDX.bossNameForAct）+ 精英妖王名（ELITE_TABLE 键）→ 随从 id
// V8.58 扩充：原仅9/17地区可谈判，增加车迟三妖、黄狮精等，提高覆盖度
NDX.NEGOTIABLE = {
  '五行归墟': 'baigu',
  '黄风大圣': 'huangfeng',
  '红孩儿·三昧真火': 'honghaier',
  '金鱼精·灵感大王': 'jinyu',
  '女儿国·蝎子精': 'xiezi',
  '六耳猕猴': 'liuer',
  '牛魔王': 'niumo',
  '九头虫·碧波潭': 'jiutou',
  '大鹏金翅雕': 'dapeng',
  '假公主·玉兔': 'yutu',
  '黄风卷岭': 'huangfeng',
  '白虎岭·白骨精': 'baigu',
  '毒敌山·蝎子精': 'xiezi',
  '祭赛国·九头虫': 'jiutou',
  '金兜洞·青牛精': 'qingniu',
  '碗子山·黄袍怪': 'huangpao',
  // V8.58 新增可谈判Boss
  '车迟三妖·虎鹿羊': 'huangpao',   // 车迟国三妖，映射黄袍怪（同为天庭星宿下凡）
  '黄狮精·玉华州': 'jiutou',        // 黄狮精，映射九头虫（同为狮猁怪类）
};

// 逆道全锁（反转 V8.16）：通关任意英雄一次后解锁逆道（劫印/命痕候选池 + 谈判）
// 【2026-09-14 P1 整改·逆道首周目开缝】「暗黑西游」是本作的题眼，但旧规则下首周目玩家
//   （未通关过）完全见不到逆道内容——第一次玩到的是一个「不暗黑」的版本。
//   现保留「通关一次」作为逆道**完全体**门槛，另开一条首周目通道：本局「逆」命数累积到
//   NIDAO_FIRST_CYCLE_GATE 次即提前开缝，让主动走恶线的玩家当周目就能摸到逆道。
//   副作用可控：逆命数 6 意味着玩家已经主动选了 6 次逆，属于「自己选的黑」，不是白送。
NDX.NIDAO_FIRST_CYCLE_GATE = 6;
NDX.niDaoUnlocked = function (s) {
  if (NDX.hasClearedAny && NDX.hasClearedAny()) return true;
  // 首周目旁路：本局「逆」命数达阈值（s.fate 为六道命数字典；无 state 时不开缝）
  const f = (s && s.fate && typeof s.fate === 'object') ? s.fate : null;
  return !!f && (+f['逆'] || 0) >= NDX.NIDAO_FIRST_CYCLE_GATE;
};

// 妖王判定：Boss/精英名精确匹配 NEGOTIABLE
NDX.followerForEnemy = function (node) {
  if (!node || !node.name) return null;
  const id = NDX.NEGOTIABLE[node.name];
  return (id && NDX.FOLLOWERS[id]) || null;
};

// 谈判触发判定：逆道解锁 + 主攻道=逆 + 妖王精英/Boss + 本局未谈判过 + 佛经门槛（全本≥1 或 散件≥3）
// V8.58 调整：原佛经门槛散件≥5过高，降低为散件≥3，增加谈判系统可达性
NDX.canNegotiate = function (s, node) {
  if (!s || !node) return false;
  if (!NDX.niDaoUnlocked(s)) return false;      // 2026-09-14：首周目逆命数达标亦可开缝
  if (NDX.mainDaoOf(s) !== '逆') return false;
  if (!NDX.followerForEnemy(node)) return false;
  if ((s.negotiated || []).some((r) => r && r.node === node.name)) return false;
  const N = NDX.NEGOTIATE || {};
  const full = (s.sutras || []).length;
  const frag = Object.keys(s.sutraFrags || {}).reduce((a, k) => a + (s.sutraFrags[k] || 0), 0);
  // V8.58 降低门槛：散件≥5 → 散件≥3
  if (full < 1 && frag < (N.fragThreshold || 3)) return false;
  return true;
};

// 谈判成功率（《竞品借鉴》§3 公式）：全本×8% + 散件×0.5% + 心魔层×3% + 逆经×5% + 恶值/10×1%，
//   精英×1.0 / Boss×0.6，封顶 85%；白骨令牌 Boss 谈判 +20%
NDX.negotiateChance = function (s, node) {
  const N = NDX.NEGOTIATE || {};
  const full = (s.sutras || []).length;
  const frag = Object.keys(s.sutraFrags || {}).reduce((a, k) => a + (s.sutraFrags[k] || 0), 0);
  const xinmoLayers = Math.floor((s.xinmo || 0) / 10);
  const ni = (s.niSutras || []).length;
  const evilTens = Math.floor((s.evil || 0) / 10);
  let chance = full * (N.perFull || 0.08)
    + frag * (N.perFrag || 0.005)
    + xinmoLayers * (N.perXinmo || 0.03)
    + ni * (N.perNi || 0.05)
    + evilTens * (N.perEvil || 0.01);
  const isBoss = !!(node && node.type === 'boss');
  chance *= isBoss ? (N.bossMult || 0.6) : (N.eliteMult || 1.0);
  if (isBoss && s.baiguToken) chance += (N.baiguBonus || 0.20);
  return Math.max(0.05, Math.min(N.cap || 0.85, chance));
};

// 随从助战结算：已收服妖王随从平铺属性并入（攻/血/减伤/法伤/法防）
NDX.followerBonus = function (followerIds) {
  const out = { atk: 0, hp: 0, dr: 0, matk: 0, mdef: 0 };
  (followerIds || []).forEach((id) => {
    const f = NDX.FOLLOWERS[id];
    if (!f) return;
    out.atk += f.atk || 0;
    out.hp += f.hp || 0;
    out.dr += f.dr || 0;
    out.matk += f.matk || 0;
    out.mdef += f.mdef || 0;
  });
  return out;
};

NDX.applyAccessibility();

