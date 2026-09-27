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
  followerCap: 4,        // 随从上限 4（V9.10 槽位真源 NDX.SLOT_CAP.companion = 4，对齐 NDX.companionSlotCap），满需替换
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
  // ── 人形态随从（2026-09-25 机制层设计 §3 · 用户点名「羁绊牛魔王加铁扇公主人形态」）──
  //   ⚠ 铁扇公主此前**只存在为敌人**（enemies_part2.js:161 '火焰山·铁扇公主' 芭蕉扇法术型），
  //     不在随从册内 ⇒ 与牛魔王的羁绊永远触发不了。此处补为**可收服人形态随从**（罗刹）。
  tieshan:   { id: 'tieshan', name: '铁扇公主', desc: '火焰山罗刹，芭蕉扇可扇风灭火', atk: 12, matk: 24, hp: 150, dr: 0.03, mdef: 0.04, human: true },
  // ── X7 接线（2026-09-27 · 用户拍板「妖形态归宠物，人形态归随从」）——
  //   原 13 个候选里属**妖形**的 10 个（人参果童子/金毛犼/蜘蛛精/多目怪/三犀/鼍龙/
  //   车迟三仙/老鼠精/南山大王/九灵元圣）**已从本册撤回**：按 §4 硬规则「人形=随从，妖形=宠物」，
  //   它们本就该在**宠物真源**（`EQUIP_POOL`/`CRAFT_POOL` 的 `slot:'pet'`）里，
  //   且在多数情况下**宠物册里早已存在同名同水体的条目**（如蜘蛛精 `zhizhujing`、多目怪 `duomuguai`、
  //   九灵元圣 `ni_jiuling`、捣药玉兔 `ni_yutu`）⇒ 按 R9「一身一 id」**改指既有宠物 id**，不新建第二载体。
  //   事件侧改由 `applyEffectCore` 的 `eff.follower` **宠物侧 fallback** 消费（详见 game_event_3.js）。
  //   ⚠ 撤回的 10 个 id **不是孤儿**：每个都在宠物真源里有对应真源 id（映射见 `_verify_batch0_wiring.js` J 组）。
  //   ⚠ R9「一身一 id」：`yutu_yaomo`→既有 `yutu`、`honghai_jiban`→既有 `honghaier`，不另建第二 id。
  //   以下仅留**人形态** 3 位（文案本就写「成随从」），数值口径沿用上表（atk/matk 4~26、hp 90~150）。
  kouqi_ren:  { id: 'kouqi_ren', name: '寇妻', desc: '铜台府寇妻，斋饭济众', atk: 4, matk: 12, hp: 90, dr: 0.03, mdef: 0.03, human: true },
  jieyin_ren: { id: 'jieyin_ren', name: '接引佛祖', desc: '灵山接引，渡船引路', atk: 6, matk: 26, hp: 150, dr: 0.03, mdef: 0.04, human: true },
  anuo_ren:   { id: 'anuo_ren', name: '阿傩迦叶', desc: '灵山二尊者，传经授业', atk: 10, matk: 22, hp: 130, dr: 0.03, mdef: 0.04, human: true },
  // 🩸 X7 附带（2026-09-27）：车迟三仙（虎力/鹿力/羊力大仙）——**人形态**，故入随从册而非宠物册。
  //   ⚠ 此前 trials_ch4.js:92「点化三妖，许以正果」用的是我早先建的妖形 id `chechi_sanyao_yuan`，
  //     那是重复建设；同章逆选项（ch4:90）用的是既有 `ally:'chechi_sanyao_ren'`。
  //     按 R9「一身一 id」+ 人形态归随从 ⇒ 统一到 `chechi_sanyao_ren`，本册只此一份。
  chechi_sanyao_ren: { id: 'chechi_sanyao_ren', name: '车迟三仙', desc: '车迟国虎鹿羊，仙法助阵', atk: 22, matk: 14, hp: 150, dr: 0.02, mdef: 0.02, human: true },
};

// —— 随从授予唯一入口（事件侧）——
//   `applyEffectCore` 的 `eff.follower`（6 个 trials 文件共 17 处）此前**零消费**：选了
//   「点化玉兔，随行西天」却什么都拿不到。本函数是事件侧写 `s.followers` 的唯一入口
//   （谈判侧另走 game_meta.js，两者共享本真源与 NEGOTIATE.followerCap 上限）。
//   ⚠ 构造性零回归：已有 id 的谈判/融合路径一行不改，本函数只服务事件侧。
//   @returns {{ok:boolean, def?:object, reason?:string}} reason ∈ unknown|dup|full
NDX.grantFollower = function (s, id) {
  try {
    const def = (NDX.FOLLOWERS && NDX.FOLLOWERS[id]) || null;
    if (!def) return { ok: false, reason: 'unknown' };
    const st = s || {};
    if (!st.followers) st.followers = [];
    if (st.followers.indexOf(id) >= 0) return { ok: false, reason: 'dup' };
    const cap = (NDX.NEGOTIATE && NDX.NEGOTIATE.followerCap) || 4;
    if (st.followers.length >= cap) return { ok: false, reason: 'full' };
    st.followers.push(id);
    return { ok: true, def: def };
  } catch (e) { return { ok: false, reason: 'error' }; }
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
  '火焰山·铁扇公主': 'tieshan',   // 人形态随从（补 2026-09-25 机制层设计：风火连天羁绊的一半）
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
//   A2（2026-09-25）：第二参 s 用于读**三阶炼化倍率**（data_follower_fuse.js）。
//   第二参可传存档 s，也可传 computeStats 的 bonus 对象（只要含 followerTiers 即可）；
//   缺省 → 全部按「凡」阶 ×1.0，与旧行为逐字节一致。
NDX.followerBonus = function (followerIds, s) {
  const out = { atk: 0, hp: 0, dr: 0, matk: 0, mdef: 0 };
  (followerIds || []).forEach((id) => {
    const f = NDX.FOLLOWERS[id];
    if (!f) return;
    const m = (s && NDX.followerMultOf) ? NDX.followerMultOf(s, id) : 1.0;
    out.atk += (f.atk || 0) * m;
    out.hp += (f.hp || 0) * m;
    out.dr += (f.dr || 0) * m;
    out.matk += (f.matk || 0) * m;
    out.mdef += (f.mdef || 0) * m;
  });
  return out;
};

NDX.applyAccessibility();

