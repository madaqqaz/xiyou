// =============================================================
// data_pet.js — 《逆道西行》宠物（灵宠）真源（V9.51）
// 全局命名空间 NDX（同时挂到 window，兼容其他文件以 window.NDX 引用）
//
// 设计要旨（用户拍板 2026-09-24，见《三键技能·经文变体综合设计（v1.0）》§三）：
//   ① 宠物 = 装备化 + 完整成长线：占装备槽，但**不计入套装件数**（沿用 data_audit.js:79 口径）
//   ② 槽位：初始 2 → 普通成长线满 4 → **召唤师（隐藏职）6**
//   ③ 宠物加成走**独立层**，不依赖经文 kind（缘道 8 经现借用 ward-mantra×7/zen-heal×1，
//      不 remap，避免 34 经平衡震荡）；bond-mantra 仅作待用 kind 登记在 SUTRA_VARIANT_TMPL
//   ④ 齐击边际递减：n=1 ×1.00 / 2 ×1.70 / 3 ×2.20 / 4 ×2.50 / 5 ×2.75 / 6 ×2.90
//      → 召唤师 6 格收益落在「组合多样性」而非数值碾压
//   ⑤ 强化：逐个替换 combat_part2.js:747 CFX_PET_SYN=12 平值（不随成长缩放）
// =============================================================
window.NDX = window.NDX || {};
var NDX = window.NDX;

// ============================================================
// 一、槽位
// ============================================================
NDX.PET_SLOT_BASE = 2;        // 初始
NDX.PET_SLOT_MAX = 4;         // 普通成长线满
NDX.PET_SLOT_SUMMONER = 6;    // 召唤师（隐藏职）

// 召唤师判定：隐藏职业走「召唤流」流派标签（JOB_STYLE==='summon'，data_skill_variant.js）
//   现网已有：驯兽师·百兽归心 / 逆兽师·百逆归心 / 女儿国·双随从
//   新增隐藏职只需在 JOB_STYLE 标 'summon' 即可自动获得 6 格，无需改本文件
NDX.PET_SUMMONER_JOBS = ['驯兽师·百兽归心', '逆兽师·百逆归心', '女儿国·双随从'];

// ✅ 死锁已修（A2 · 2026-09-25 用户拍板「开工」）：
//   原门槛 `cond: '夺 + 出阵灵兽≥3'`（data_trials.js:163/168）与「初始槽位仅 2」构成**循环依赖**
//   （要先觉醒才有 6 格，而觉醒又要求出阵 3 只）——已改为「**随从≥3 + 御兽套**」（累计收服，
//   不要求出阵）。逆兽师路径同步走 `NDX.evalHiddenCond`，杜绝两处漂移（game_event_2.js 难64 段）。

// 当前槽位上限（s = 存档状态）
//   ⚠ 槽位**唯一真源**是 `NDX.petSlotCapFor(ctx)`（equipment_part3.js，V9.10：base 2 + 逆道 1 +
//    逆兽师 1 + 成就 1，封顶 6）；本函数只做「存档状态 → 真源函数」的适配 + 成长线兜底。
//    残留常量 `NDX.petSlotCap = 2` 已于 B2 删除（曾被 ui_bag/ui_map/ui_modals_1 误读）。
NDX.petSlotCapOf = function (s) {
  const st = s || {};
  const unlocked = Number(st.petSlotUnlocked) || 0;
  // A2-3 **流派驱动**（用户 2026-09-25 拍板）：当前路线 = summon（召唤流）⇒ 直接给满 6 格，
  //   不再看隐藏职。与英雄底色模型统一 —— 「路线 = 玩家的选择」，配出召唤流就配得起召唤流。
  //   副作用可控：非召唤流零变化；召唤流本就该有 6 格（此前只有转职成隐藏职才给）。
  if (typeof NDX.currentStyle === 'function') {
    try { if (NDX.currentStyle(st) === 'summon') return NDX.PET_SLOT_SUMMONER; } catch (e) {}
  }
  if (NDX.petSlotCapFor) {
    let cap = NDX.PET_SLOT_BASE;
    try { cap = NDX.petSlotCapFor(st); } catch (e) { cap = NDX.PET_SLOT_BASE; }
    // 成长线解锁兜底：真源函数未感知 petSlotUnlocked 时，取两者较大值
    cap = Math.max(cap, Math.min(NDX.PET_SLOT_MAX, NDX.PET_SLOT_BASE + unlocked));
    return Math.min(NDX.PET_SLOT_SUMMONER, cap);
  }
  const job = NDX.currentJob ? NDX.currentJob(st) : ((st.flags && st.flags.jobConfirm) || st.jobConfirm || null);
  const style = (NDX.JOB_STYLE && NDX.JOB_STYLE[job]) || null;
  if (style === 'summon' || (NDX.PET_SUMMONER_JOBS.indexOf(job) >= 0)) return NDX.PET_SLOT_SUMMONER;
  return Math.max(NDX.PET_SLOT_BASE, Math.min(NDX.PET_SLOT_MAX, NDX.PET_SLOT_BASE + unlocked));
};

// 上阵宠物数（受槽位上限钳制）
//   ⚠ 口径对齐：现网实装以「装备槽 slot==='pet' 的件数」计（data_trials.js:369 驯兽师门槛、
//     equipment.js activeEquipsFor），故优先取该口径，st.pets 仅作兜底，避免两套计数脱节。
NDX.petDeployCount = function (s) {
  const st = s || {};
  let n = 0;
  try {
    const act = (NDX.activeEquipsFor) ? NDX.activeEquipsFor(st) : (st.equips || []);
    n = (act || []).filter((e) => e && e.slot === 'pet').length;
  } catch (e) { n = 0; }
  if (!n) n = ((st.pets || []).filter(Boolean)).length;
  // 🔴 V9.51 修复（A1 门禁捕获）：原写 `NDX.petSlotCap(st)` —— 但 petSlotCap 是
  //   equipment_part3.js:139 的**常量 2**（非函数）→ 每次调用抛 TypeError →
  //   petDeployCount / petSynergyTrueDmg 全线失效，且 game_core_3.js 连击暴击路径（s.pet 存在时）
  //   会直接被异常打断。改走本文件自己的适配函数 petSlotCapOf（内部 = petSlotCapFor + 成长线兜底）。
  return Math.min(n, NDX.petSlotCapOf(st));
};

// ============================================================
// 二、宠物库（真源 · 出处均来自 81 难骨架 v1.6）
//   dao  : 六道（战/渡/缘/夺/隐/逆）
//   lv   : 成长线等级（1 起）
//   passive: 常驻被动（进属性/战斗）
// =============================================================
// 🔴 B2（2026-09-25）删掉孤儿表 `NDX.PET_LIB`：它登记了 6 只宠物（tiger_cub / renshen_tong / …），
//   但**没有任何一只存在于 EQUIP_POOL / CRAFT_POOL** —— 玩家永远拿不到，于是 petById() 对真实
//   可获得的宠物 100% 返回 null（当时 67/67 全部不可解析）。这就是「宠物系统没有真源」的根因：
//   宠物真正的载体是**装备体系**，不是这张手抄表。
//   ⇒ 真源改为「装备池 + 合成池」并**惰性建索引**（本文件加载早于 equipment_part1.js，
//     模块求值期拿不到池）。门禁 `_verify_pet.js` A2 锁死「池中每只都必须可解析」。
NDX._petIndex = null;
NDX._buildPetIndex = function () {
  if (NDX._petIndex) return NDX._petIndex;
  const idx = Object.create(null);
  // 基础形态在 EQUIP_POOL，**进化形态在 CRAFT_POOL**（equipment_part1.js:485 起）
  [].concat(NDX.EQUIP_POOL || [], NDX.CRAFT_POOL || []).forEach(function (e) {
    if (e && e.slot === 'pet') idx[e.id] = e;
  });
  NDX._petIndex = idx;
  return idx;
};

NDX.petById = function (id) {
  if (!id) return null;
  try {
    return NDX._buildPetIndex()[id] || null;
  } catch (e) {
    return null;
  }
};

// ============================================================
// 二·附 获取路线（ABC · 用户 2026-09-25 裁定「宠物采用 abc 都有路线」）
//
//   🔴 重要发现：ABC **本就存在于现有数据的 `src` 字段里**，只是从未被命名：
//        A 说动反出（逆道）27 只 —— src 含「逆道」，全部 q2，章节 ch1–ch8
//        B 地区偶遇       11 只 —— src 含「第N地区」，q0×8 + q2×3，ch1–ch6
//        C 事件进化       12 只 —— src 为「XX·动作」，q1×11 + q2×1，ch2–ch9
//        X 初始/未标      17 只 —— src 空（含 2 只 q3 传说 taigu_shanling/taiyin_xinghu）
//   ⇒ 「三条路线都要有」= 正名 + 补元数据 + 做数值设计，不是新造内容。
//
//   路线定位（数值见设计文档 §1.1）：
//     A = **量**：数量最多、品质锁死 q2、**不可进化**，价值靠「齐击边际 + 羁绊」兑现
//     B = **基**：提供 C 路的进化原料
//     C = **质**：唯一品质跃迁出口（q0 基础 → q1 精英 → q3 传说）
//
//   ⚠ 判定读的是池条目的 `src` 文本，所以必须在索引建好之后惰性求值（加载顺序约束同 _buildPetIndex）。
// ============================================================
NDX.PET_ROUTES = {
  A: { key: 'A', name: '说动反出', line: '逆道', desc: '探索中说动妖怪反出。数量最多，品质锁 q2、不可进化，价值靠齐击与羁绊兑现。' },
  B: { key: 'B', name: '地区偶遇', line: '缘遇', desc: '探索中拾得/遇遇。散落各章，是 C 路进化的原料层。' },
  C: { key: 'C', name: '事件进化', line: '点化', desc: '劫难事件链中做出选择，升为精英/传说。全系统唯一的品质跃迁出口。' },
  X: { key: 'X', name: '初始未标', line: '—', desc: '早期基础宠物，src 未标注路线（含 2 只 q3 传说）。' },
};
NDX.PET_ROUTE_ORDER = ['A', 'B', 'C', 'X'];

NDX._petRouteCache = null;
NDX.petRouteOf = function (id) {
  if (!NDX._petRouteCache) {
    const map = Object.create(null);
    const pool = [].concat(NDX.EQUIP_POOL || [], NDX.CRAFT_POOL || []);
    pool.forEach(function (p) {
      if (!p || p.slot !== 'pet') return;
      const s = String(p.src || '');
      let r = 'X';
      if (s.indexOf('逆道') >= 0) r = 'A';
      // ⚠ `evolveFrom` 才是进化关系的**可靠字段**，src 会漏填：
      //   实测 21 只带 evolveFrom，其中 9 只 src=undefined（含 q3 传说 taigu_shanling /
      //   taiyin_xinghu）——只看 src 会把这两只误判成 X 路，C 路就丢了品质跃迁的终点。
      else if (p.evolveFrom) r = 'C';
      else if (/第\s*.\s*地区/.test(s)) r = 'B';
      else if (s) r = 'C';
      map[p.id] = r;
    });
    NDX._petRouteCache = map;
  }
  return NDX._petRouteCache[id] || 'X';
};

NDX.petRouteList = function () {
  const out = [];
  const ids = Object.keys(NDX._petRouteCache || {});
  NDX.PET_ROUTE_ORDER.forEach(function (r) {
    out.push({ route: r, name: NDX.PET_ROUTES[r].name, n: ids.filter((i) => NDX._petRouteCache[i] === r).length });
  });
  return out;
};

// ============================================================
// 三、成长线
//   level 1..10；每级提供等级系数（用于协同真伤缩放）
//   消耗：缘系素材 + 残片（复用 data_materials 池，不新建货币）
// =============================================================
NDX.PET_LV_CAP = 10;
// 🔴 旧值 `1+(L-1)*0.15` 纯线性，且 `st.petLv` 全仓无写入点 ⇒ 整条线空转。
// 改**三段临界递减**（skill「属性模块」模板：先易后难、超临界后趋缓）：
//   Lv1-3 : 1.00 + (L-1)*0.20  → 1.00 1.20 1.40
//   Lv4-7 : 1.40 + (L-3)*0.15  → 1.55 1.70 1.85 2.00
//   Lv8-10: 2.00 + (L-7)*0.10  → 2.10 2.20 2.30
// Lv10 由 2.35→2.30（满配温和放缩），Lv3/Lv5 由 1.30/1.60→1.40/1.70（中期温和补强），最大偏差 +7.7%。
NDX.PET_LV_SEGMENTS = [
  { until: 3, base: 1.00, step: 0.20 },   // Lv 1..3
  { until: 7, base: 1.40, step: 0.15 },   // Lv 4..7
  { until: 10, base: 2.00, step: 0.10 },  // Lv 8..10
];
NDX.PET_LV_SCALE = function (lv) {
  const L = Math.max(1, Math.min(NDX.PET_LV_CAP, Number(lv) || 1));
  if (L - 1 <= 2) return NDX.PET_LV_SEGMENTS[0].base + (L - 1) * NDX.PET_LV_SEGMENTS[0].step;
  if (L <= 6) return NDX.PET_LV_SEGMENTS[1].base + (L - 3) * NDX.PET_LV_SEGMENTS[1].step;
  return NDX.PET_LV_SEGMENTS[2].base + (L - 7) * NDX.PET_LV_SEGMENTS[2].step;
};

// ---------- 宠物等级：按「个体」记录（修死路④） ----------
//   🔴 旧设计写 `s.petLv` 单值，但全仓**没有任何写入点** ⇒ PET_LV_SCALE 恒取 1.00，
//      Lv1→Lv10 的 2.35 倍完全空转。且单值口径本身不对：每只宠物养成进度不同，
//      「重点培养一只」与「平均培养六只」会退化成同一件事。
//   ⇒ 改为 `s.petLvOf{petId:lv}`；旧 `s.petLv` 仅作总览兜底，不再单独决定战斗计算。
NDX.petLevelOf = function (s, petId) {
  const st = s || {};
  if (petId && st.petLvOf && st.petLvOf[petId]) {
    return Math.max(1, Math.min(NDX.PET_LV_CAP, Number(st.petLvOf[petId]) || 1));
  }
  return Math.max(1, Math.min(NDX.PET_LV_CAP, Number(st.petLv) || 1));
};

// 升到 Lv 所需的养成消耗（等比数列，skill「数组/数列」工具）
//   cost(L) = 30 × 1.6^(L-1) ⇒ Lv2=30 / Lv5=123 / Lv10=794
//   ⚠ 只出价格、不扣钱：货币投放点属资源线，留「全局汇总定稿」处理。
NDX.petUpgradeCost = function (lv) {
  const L = Math.max(1, Math.min(NDX.PET_LV_CAP, Number(lv) || 1));
  return Math.round(30 * Math.pow(1.6, L - 1));
};

// 等级提升（幂等写入；供事件链/养成调用）
//   返回 {ok, lv, delta}；副产品：同步维护旧字段 s.petLv（取所有宠物的最高等级），
//   让总览/调试口径不因本次改造而丢失。
NDX.petRaiseLevel = function (s, petId, by) {
  const st = s || {};
  if (!petId) return { ok: false, lv: 1, delta: 0 };
  st.petLvOf = st.petLvOf || Object.create(null);
  const cur = Math.max(1, Math.min(NDX.PET_LV_CAP, Number(st.petLvOf[petId]) || 1));
  const next = Math.min(NDX.PET_LV_CAP, cur + (Math.max(0, Number(by) || 0)));
  if (next <= cur) return { ok: false, lv: cur, delta: 0 };
  st.petLvOf[petId] = next;
  let top = Number(st.petLv) || 1;
  Object.keys(st.petLvOf).forEach(function (k) { top = Math.max(top, Number(st.petLvOf[k]) || 1); });
  st.petLv = top;
  return { ok: true, lv: next, delta: next - cur };
};

// ---------- 星阶（冒险日记式「多重升级组合链」· v1.1 新增） ----------
//   定位：与进化链（品质跃迁轴）、等级（Lv1-10）**正交**的第三条成长轴。
//   ⚠ 不做成第二套 evolveTo：星阶只管「机制解锁 + 温和数值」，否则就是第二真源。
//
//   🔴 三重叠加爆炸风险（实测，见设计文档 §1.1）：
//      进化 ×1.13(atk)/×1.58(hp) × 等级Lv10 ×2.30 × 星阶★满
//      ├ 冒险日记原值 ×2.5  → ×6.51(atk) / ×9.11(hp)  ❌ 宠物取代装备
//      └ 本表定稿  ×1.35    → ×3.51(atk) / ×4.91(hp)  ✅ 压降 25%~32%
//   冒险日记的 ×1.8/×2.5 是给「随从」的（单成长轴）；宠物有三条轴，直接套 = 三倍成长。
NDX.PET_STAR_CAP = 5;
// 🔴 v1.4：**星阶的数值轴撤销**，改为纯机制轴。
//   原因（三重叠加爆炸律）：宠物数值已由「阶 × 等级」两条承担；若 ★5 再乘 ×1.35，
//   则 阶(×1.50) × Lv10(×2.30) × ★(×1.35) = **×4.66**，越过 v1.1 设定的 ×3.60 护栏
//   ⇒ 宠物取代装备。而 v1.1 起就已定调「**星阶主要收益是机制，不是倍率**」（见 `PET_STAR_UNLOCK`），
//   本次把这条定调**贯彻到底**：★ 的收益 100% 落在机制（★2/★3/★5），不再给数值。
//   ⇒ 分工：**阶给数值，星给机制**。两条轴正交且互不叠乘。
NDX.PET_STAR_MUL = [1.00, 1.00, 1.00, 1.00, 1.00, 1.00];  // 索引 = 星阶（已归 1，保留表形便于回滚）
NDX.petStarMul = function (star) {
  const n = Math.max(0, Math.min(NDX.PET_STAR_CAP, Number(star) || 0));
  return NDX.PET_STAR_MUL[n];
};
// 🔴 v1.3 删除「合成消耗」与「异名替代」两条表（`PET_STAR_COST`/`petStarCost`/`PET_STAR_MIX_LOSS`）。
//   删除原因（设计文档 v1.3 §1.1）：那是**资源驱动**升星——攒够 N 只就能在任意时刻升任意宠，
//   与用户定调「升星只采用宠物在**独有的事件**中升级，或生成**专属升级 Boss**」结构性冲突。
//   资源驱动必然滑向「挂机刷材料」，而「纯刷数值」正是《冒险日记》被吐槽最多的点（本项目已引为反面）。
//   ⇒ 升星改为**内容驱动**：唯一入口是下面两条通道，入口本身由 `PET_STAR_CHANNELS` 白名单钉死。
NDX.PET_STAR_CHANNELS = ['event', 'boss'];

// 升星的**专属升级 Boss**（第 2 条通道）。
//   定位：万兽之宗，非敌非友——「你带的这些小家伙，根骨如何，我一试便知」。
//   分工：`event` = **单宠定向**升星（叙事绑定，写某只宠自己的故事）；
//         `boss`  = **全队齐升**（rare、每局一次，绑在地区 5~9 的奇遇节点）。
//   ⚠ 它不是一个「面板」——面板是资源驱动的外壳；它是一个**事件节点里的可遇之敌**。
NDX.PET_STAR_BOSS = {
  id: 'baishou_xingjun',
  name: '百兽星君',
  region: [5, 9],
  desc: '万兽之宗，于深山试你灵宠根骨',
  // 战胜后效果：全队已上阵灵宠各 +1 星（上限 ★5）
  starGain: 1,
};

// 星阶的机制解锁表——**主要收益是机制，不是倍率**（沿用冒险日记原结构）
//   🔴 v1.2 修订：v1.1 原表有两格是**空头支票**，已换掉（见设计文档 v1.2 §1.3）——
//      ├ ★2 原「解锁被动槽 2」：全仓**没有 `petPassive2` 字段** ⇒ 无槽可解
//      ├ ★3 原「羁绊触发门槛 −1」：羁绊是 {a,b} **二元**结构，没有「门槛」这个量，减无可减
//      └ ★5 原「额外被动槽 3」：同 ★2
//   换成的两项都指向**已存在**的读取端，不新开概念：
//      ├ ★2/★5 →「被动档数」：`aggregatePetPassive` 里 `pp[key] = 同型只数` 是既有语义，
//      │          ★2 语义 = 「这只宠物顶两只同型」
//      └ ★3 →「羁绊效果 +20%」：羁绊是宠物唯一的「组合」出口，星阶提升它
//               = 升级链咬合组合链，正是「多重升级**组合链**」的字面义
NDX.PET_STAR_UNLOCK = [
  null,
  '数值 ×1.15',
  '被动档数 +1（该宠物被动顶两只同型）',
  // ⚠ v1.4：消费点由「角色羁绊」改指 **兽印共鸣**（`NDX.petEchoEffects`）——
  //   角色羁绊已被类共鸣取代（§三），若仍指旧表会变成又一处死声明。
  '兽印共鸣 +20%（该宠物参与的组合）',
  '数值 ×1.33',
  '觉醒：被动档数再 +1（共 +2）',
];
// 星阶的机制阈值（写入端与读取端**共用同一组常量**，防「两边各写一个 2/3」）
NDX.PET_STAR_PASSIVE_AT = 2;   // ★≥2 ⇒ 被动档数 +1
NDX.PET_STAR_PASSIVE_AT2 = 5;  // ★≥5 ⇒ 再 +1（共 +2）
NDX.PET_STAR_FETTER_AT = 3;    // ★≥3 ⇒ 参与的羁绊 +20%
NDX.PET_STAR_FETTER_BOOST = 1.20;

// ---------- 星阶 · 读写闭环（v1.2 接线；v1.1 只有表、零消费点 = 死数据） ----------
//   存档：`s.petStarOf{petId: star}`（与 petLvOf 同构，**按个体**）。
//   ⚠ 不能用 `s.petStar` 单值——那是 petLv 的老坑（无写入点 ⇒ 成长线空转）。
NDX.petStarOf = function (s, petId) {
  const st = s || {};
  const raw = (petId && st.petStarOf) ? st.petStarOf[petId] : 0;
  return Math.max(0, Math.min(NDX.PET_STAR_CAP, Number(raw) || 0));
};

// 升星（幂等写入）。🔴 v1.3：**唯一入口是内容** —— `via` 必填且 ∈ `PET_STAR_CHANNELS`。
//   via: 'event' 宠物独有事件 / 'boss' 百兽星君
//   🔴 `via` 缺失或非法 ⇒ **拒绝且不写存档**（返回 reason）。这条不是防御式编程，
//      是**把「通用入口」这个概念从 API 上铲掉**：没有合法 via，任何 UI 都调不动升星。
//      门禁 R6 用「不带 via 必须失败」的反向断言把它钉死。
//   gain: 一次升几星（事件通常 1；Boss 也是 1，但作用于全队）
//   返回 { ok, star, via, reason? }
NDX.petStarUp = function (s, petId, via, gain) {
  const st = s || {};
  if (!via || NDX.PET_STAR_CHANNELS.indexOf(via) < 0) {
    return { ok: false, star: petId ? NDX.petStarOf(st, petId) : 0, via: null, reason: 'event-or-boss-only' };
  }
  if (!petId) return { ok: false, star: 0, via: via, reason: 'no-pet' };
  const cur = NDX.petStarOf(st, petId);
  if (cur >= NDX.PET_STAR_CAP) return { ok: false, star: cur, via: via, reason: 'capped' };
  const up = Math.max(1, Number(gain) || 1);
  const next = Math.min(NDX.PET_STAR_CAP, cur + up);
  st.petStarOf = st.petStarOf || Object.create(null);
  st.petStarOf[petId] = next;
  // 兼容旧口径：维护一个总览最高星阶（只读用，不参与战斗计算）
  let top = 0;
  Object.keys(st.petStarOf).forEach(function (k) { top = Math.max(top, Number(st.petStarOf[k]) || 0); });
  st.petStar = top;
  return { ok: true, star: next, via: via };
};

// 百兽星君通道：全队**已上阵**灵宠各 +1 星（`via:'boss'`）。
//   ⚠ 作用于 `s.equips` 中 `slot==='pet'` 的条目，不是整个背包——「带你上场的这些」。
NDX.petStarUpAll = function (s, via, gain) {
  const st = s || {};
  if (!via || NDX.PET_STAR_CHANNELS.indexOf(via) < 0) return { ok: false, via: null, up: [], reason: 'event-or-boss-only' };
  const pets = (st.equips || []).filter(function (e) { return e && e.slot === 'pet' && e.id; });
  const up = [];
  pets.forEach(function (p) {
    const r = NDX.petStarUp(st, p.id, via, gain);
    if (r.ok) up.push(p.id);
  });
  return { ok: up.length > 0, via: via, up: up };
};

// 主动退回（幂等）：让玩家敢试，属「组合链」的逆向通道
NDX.petStarDown = function (s, petId) {
  const st = s || {};
  const cur = NDX.petStarOf(st, petId);
  if (cur <= 0) return { ok: false, star: 0 };
  if (st.petStarOf) st.petStarOf[petId] = cur - 1;
  st.petStar = cur - 1;
  return { ok: true, star: cur - 1 };
};

// 🔴 数值乘子**白名单**：只乘不封顶的平铺数值。
//   百分比属性（dr/eva/cri/mdef/hit）有硬封顶（dr≤0.60/eva≤0.6/mdef≤0.50），
//   封顶后边际收益 = 0 ⇒ 若也乘星阶，玩家堆到顶再升星会「收益被静默吞掉」。
//   把星阶收益 100% 放在不封顶的轴上 ⇒ 收益永远可见。
//   增删此项须同步门禁 Q3。
NDX.PET_STAR_SCALE_FIELDS = [];   // v1.4：清空（星阶不再乘任何数值属性；见上「数值轴撤销」）

// 某属性字段在本星阶下的乘子（非白名单字段恒 1.00 ⇒ 构造性零副作用）
NDX.petStarFieldMul = function (star, field) {
  if (NDX.PET_STAR_SCALE_FIELDS.indexOf(field) < 0) return 1;
  return NDX.petStarMul(star);
};
// 便捷：取「这只宠物在此字段上」的乘子
NDX.petStarScaleFor = function (s, petId, field) {
  return NDX.petStarFieldMul(NDX.petStarOf(s, petId), field);
};

// ★2/★5 机制解锁：该宠物的 petPassive 额外计几档（0/1/2）
//   消费点：equipment_part3.js `aggregatePetPassive`
NDX.petStarPassiveExtra = function (s, petId) {
  const star = NDX.petStarOf(s, petId);
  let extra = 0;
  if (star >= NDX.PET_STAR_PASSIVE_AT) extra += 1;
  if (star >= NDX.PET_STAR_PASSIVE_AT2) extra += 1;
  return extra;
};

// ★3 机制解锁：羁绊加成倍率。
//   🔴 **取 max 不取乘积**：双方都 ★3 时是 ×1.20 而非 ×1.44。
//      否则「两边都堆星阶」成为唯一解；取 max 让第二只的 ★3 收益必须转移到
//      它自己参与的**另一条**羁绊上 ⇒ 鼓励铺开，而非叠一头。
//   入参 starA/starB = 羁绊双方的星阶；返回 1.00 或 1.20
NDX.petFetterBoost = function (starA, starB) {
  const a = Number(starA) || 0, b = Number(starB) || 0;
  return (a >= NDX.PET_STAR_FETTER_AT || b >= NDX.PET_STAR_FETTER_AT)
    ? NDX.PET_STAR_FETTER_BOOST : 1;
};

// ============================================================
// 三·附 宠物机制层（Field · 数据驱动）
//
//   定位（设计文档 §一）：**宠物 = 场域改写者**——它不替你打，它让「本来打不到的」
//   变成能打到、「本来会死的」变成不会死。区别与其他层的判据：**不出手、改规则**。
//
//   口径：`player.petPassive[key]` = **档数**（同型多只叠加，见 combat_part1.js `_pp/_ppN`）。
//   本表是**参数真源**；触发条件与结算逻辑归战斗内核（不属于数据层），
//   故本表只描述「每个机制的量」，不改战斗内核的分支结构 ⇒ 既有 8 被动行为逐字节不变。
//
//   ── 既有 8 项（行为保留，仅把魔数提到表里 ──────────────────────────
//   cleanse  雪羽·净化   每回合始 清 1 条 DOT + 清空 Boss 招牌 debuff
//   regen    人参·回春   每回合始 回血 12×档
//   poison   蛊虫·蛊毒   每回合始 对敌 max(8, 敌最大血×4%×档)
//   whisk    踏雪·轻身   开战起 N 回合免疫 Boss 招牌 debuff（N = 档数）
//   rend     破势        敌 HP≤40% 时玩家增伤 10%/档
//   berserk  狂暴        玩家 HP≤50% 时玩家增伤 20%/档
//   firstStrike 羁绊·先手 第 1 回合玩家先手
//   stoneheart 灵岩·石心 首次致命伤保命（每场一次）
//
//   ── 新增 5 项（用户点名，设计文档 §2.2）────────────────────────────
// ============================================================
NDX.PET_PASSIVES = {
  // ===== 既有 8 项 =====
  cleanse:     { key: 'cleanse',     name: '雪羽·净化',  tier: 'legacy', desc: '每回合净去负面。',        params: { perTurn: 1 } },
  regen:       { key: 'regen',       name: '人参·回春',  tier: 'legacy', desc: '每回合回复气血。',        params: { flat: 12 } },
  poison:      { key: 'poison',      name: '蛊虫·蛊毒',  tier: 'legacy', desc: '每回合始侵蚀敌方。',      params: { pct: 0.04, min: 8 } },
  whisk:       { key: 'whisk',       name: '踏雪·轻身',  tier: 'legacy', desc: '开场数回合免疫招牌 debuff。', params: { asRounds: true } },
  rend:        { key: 'rend',        name: '破势',      tier: 'legacy', desc: '敌方残血时增伤。',        params: { step: 0.10, atHpPct: 0.40 } },
  berserk:     { key: 'berserk',     name: '狂暴',      tier: 'legacy', desc: '自身半血时增伤。',        params: { step: 0.20, atHpPct: 0.50 } },
  firstStrike: { key: 'firstStrike', name: '羁绊·先手', tier: 'legacy', desc: '首回合抢先出手。',        params: {} },
  stoneheart:  { key: 'stoneheart',  name: '灵岩·石心', tier: 'legacy', desc: '首次致命伤保命。',        params: {}, once: true },

  // ===== 新增 5 项（用户点名 2026-09-25）=====
  // 灵盾·护主：定「每场一次」而非周期——护盾是**开局的容错**，周期性会失去稀缺感。
  aegis: {
    key: 'aegis', name: '灵盾·护主', tier: 'field',
    desc: '每场战斗一次，开战为玩家罩上护盾。',
    params: { pctOfMaxHp: 0.06, oncePerBattle: true },
  },
  // 涤秽：与 cleanse 并存不合并——前者是每回合小额防（Boss 招牌 debuff），
  //       后者是 5 回合一次大清（玩家攒的负面）。合并会让「雪羽·净化」白养。
  purify5: {
    key: 'purify5', name: '涤秽', tier: 'field',
    desc: '每五回合为患者涤去一切异常。',
    params: { everyRounds: 5, clearAll: true },
  },
  // 血噬：Field 的**边缘案例**——有出手、无节奏、不可预期（用户原话「带老虎五回合攻击一次」）。
  //   裁定：它走「周期出手」通道，但结算归宠物计数，不并入随从层。
  bloodLoss: {
    key: 'bloodLoss', name: '血噬', tier: 'field',
    desc: '每五回合噬血一击，概率造成失血。',
    params: { everyRounds: 5, dmgPct: 0.35, bleedChance: 0.40, bleedPct: 0.10, bleedRounds: 2 },
  },
  // 鼓舞/灵犀：唯一允许「改概率与标签」而不改伤害基数的宠物项。
  //   🔴 v1.4 接线补记：本两项 v1.0 建表起就**没有任何内核读取点**
  //      （`grep comboUp|magicUp js/combat_part*.js` 曾为 0 命中），而用户点名的
  //      「宠物装狼 → 增加连击率」正是 comboUp。v1.4 已接到 combat_part1.js 真实消费点。
  comboUp: { key: 'comboUp', name: '裂·连击', tier: 'axis', desc: '提高连击概率。', params: { pct: 0.06, cap: 0.30 } },
  magicUp: { key: 'magicUp', name: '灵·法伤', tier: 'axis', desc: '增强法术伤害。', params: { pct: 0.05, cap: 0.25 } },
  // 暴·暴击（v1.4 新增）：与 comboUp 同构的「改概率」项，唯二允许改概率的宠物机制。
  //   消费点 = combat_part1.js computeStats 的 `cri +=`（加性，天然受 cri 封顶保护）。
  critHit: { key: 'critHit', name: '暴·暴击', tier: 'axis', desc: '提高暴击概率。', params: { pct: 0.05, cap: 0.25 } },
};

NDX.PET_PASSIVE_ORDER = ['cleanse', 'regen', 'poison', 'whisk', 'rend', 'berserk', 'firstStrike',
  'stoneheart', 'aegis', 'purify5', 'bloodLoss', 'comboUp', 'magicUp', 'critHit'];

// 机制参数读取（战斗内核读表，避免魔数散落）
//   spec(key).params[keyPath] —— 缺省回落到 combat 内核的既有硬编码值，保证零回归
NDX.petPassiveSpec = function (key) { return NDX.PET_PASSIVES[key] || null; };

// ============================================================
// 三·附二 宠物「属系」中文标签（v1.2 提到数据层 · 单源）
//   🔴 起因：本表原本内联在 `ui/ui_misc_3.js` 的图鉴渲染函数里，是**字面量局部变量**。
//      ⇒ 数据层新增分支键时，没人会记得同步它，图鉴就渲染英文原文（`_branchName[b] || b` 的
//      兜底不友好，表现为「tiger · 3 形态」）。v1.1 新增 24 只时**真实发生**了 11 处。
//   ⇒ 移到数据层 + 门禁 Q9 断言「池内每个 branch 键都有标签」，从制度上堵住。
//   ⚠ 新增任何 `branch:` 值必须同时在此登记，否则 Q9 变红。
// ============================================================
NDX.PET_BRANCH_NAME = {
  // —— 洪荒系（v1.0 既有）——
  rock: '顽岩系', fox: '狐月系', deer: '瑞鹿系', wolf: '狼荒系', marten: '风狸系',
  firefly: '萤火系', ape: '猿石系', listen: '谛听系', bird: '佛雀系', crane: '仙鹤系',
  dragon: '龙系', jinchan: '金蟾系', qilin: '麒麟系', gu: '蛊虫系', renshen: '人参系',
  water: '水系', fire: '火系', light: '光系',
  // —— v1.1 原著原型批次引入（v1.2 补标签，此前 11 项在渲染端是英文原文）——
  tiger: '虎妖系', bear: '熊罴系', ox: '牛犀系', sheep: '羚羊系', fish: '游鱼系',
  lion: '狮猊系', centipede: '虫毒系', spider: '蛛丝系', ghost: '幽冥系',
  elephant: '象魔族', leopard: '豹雾系',
  // —— v1.2 第二批引入 ——
  snake: '蛇蟒系', demon: '魔道系', tree: '木魅系', rat: '鼠妖系',
  // —— A 路（逆道说动反出的妖王）——
  ni: '逆兽系',
  // —— v1.4 兽印轴（族 = 机制轴，二者合一；见下「三·附三」）——
  //   ⚠ 活跃池只会有这 8 个键（其余 20 个键随 91 只宠一并归档），
  //     但**不删旧键**：储备池仍会在图鉴/素材工具里被检索到。
  combo: '裂·连击系', crit: '暴·暴击系', ward: '御·减伤系', evade: '隐·闪避系',
  drain: '噬·吸血系', rend: '破·破势系', purify: '净·涤秽系', reverse: '逆·逆血系',
};

// ============================================================
// 三·附三 兽印轴（v1.4 · 用户 2026-09-25：
//   「在仅有两个宠物格的情况下，你塞 54 个的意义在哪里呢？例如宠物装狼，可以增加连击率，
//     装备老虎，增加暴击，装备乌龟增加防御，但你也要设计升级线、组合线，进行统一设计」）
// ------------------------------------------------------------
//   诊断（真源文档 v1.4 §1.2）：活跃 61 只里 **25 只 `petPassive` 为空（纯数值）**、
//     3 只机制键内核不读、2 个表条目无宠挂载 ⇒ **61 个条目只提供 15 个可感知机制差异**。
//     根因：`branch`（20 个角色族）与「机制键」两套分类**互不对应**（rock 族里混着 3 种机制，
//     fox 族 5 只里 3 只全空）⇒ 玩家在 2 格里根本读不出「换一只会发生什么」。
//   ⇒ **修复 = 让「族」与「机制轴」合一**：一族 = 一个机制，族内 3 阶 = 该机制的升级序列。
//
//   为什么轴名直接用**英雄流派名**（`JOBSPEC` 的键）：
//     `NDX.HERO_STYLE_BASE` 已把五英雄底色写成流派权重
//     （悟空 combo1/crit0.7、沙僧 ward1/reflect1、小白龙 evade1、八戒 drain1、唐僧 purify1）。
//     轴用同一套键 ⇒ 「宠物与英雄路线互补」不再是形容词，而是**同名键**
//     （悟空带「裂」= 放大器；唐僧带「暴」= 补位器）⇒ 这就是「互补」的两条正解。
//   ⚠ 8 轴**不含 `reflect`**：反震属劫印层（装备=基础数值／劫印=反震·护盾·吸血·反伤／
//     法宝=钩子／随从=出手／宠物=改规则），宠物不得侵入。
// ============================================================
NDX.PET_AXIS_CLASS = {
  combo: '锐', crit: '锐',      // 锐 = 兽性：打得更多、更痛
  ward: '固', evade: '固',      // 固 = 道心：站得住、躲得开
  drain: '噬', rend: '噬',      // 噬 = 蚀骨：磨对手的命
  purify: '转', reverse: '转',  // 转 = 回天：转危为安 / 置之死地
};
NDX.PET_AXIS_ORDER = ['combo', 'crit', 'ward', 'evade', 'drain', 'rend', 'purify', 'reverse'];
NDX.PET_AXES = {
  combo: { key: 'combo', name: '裂·连击', cls: '锐', mech: 'comboUp', mechanic: '连击率 +6%/档（上限 30%）', hero: 'wukong', style: 'combo', family: '猿', desc: '多打一段。刀快的人不需要更大的刀。' },
  crit: { key: 'crit', name: '暴·暴击', cls: '锐', mech: 'critHit', mechanic: '暴击率 +5%/档（上限 25%）', hero: 'wukong', style: 'crit', family: '虎', desc: '一击见血。走运也是一种实力。' },
  ward: { key: 'ward', name: '御·减伤', cls: '固', mech: 'guard', mechanic: '减伤 +2%/档', hero: 'shaseng', style: 'ward', family: '岩', desc: '挨得住，才轮得到你出手。' },
  evade: { key: 'evade', name: '隐·闪避', cls: '固', mech: 'whisk', mechanic: '开场免控 N 回合（N = 档数），并补闪避', hero: 'xiaobailong', style: 'evade', family: '狐', desc: '打不着的，就等于不存在。' },
  drain: { key: 'drain', name: '噬·吸血', cls: '噬', mech: 'bloodLoss', mechanic: '每 5 回合噬血一击', hero: 'bajie', style: 'drain', family: '蛛', desc: '它的命，养你的命。' },
  rend: { key: 'rend', name: '破·破势', cls: '噬', mech: 'rend', mechanic: '敌残血时增伤 10%/档', hero: 'wukong', style: 'reverse', family: '狼', desc: '伤口张开的时候，才最像伤口。' },
  purify: { key: 'purify', name: '净·涤秽', cls: '转', mech: 'regen', mechanic: '每回合回血 12×档', hero: 'tangseng', style: 'purify', family: '参', desc: '干净的身体，走得更远。' },
  reverse: { key: 'reverse', name: '逆·逆血', cls: '转', mech: 'berserk', mechanic: '己半血时增伤 20%/档', hero: 'wukong', style: 'reverse', family: '龙', desc: '越是快要死，越不肯死。' },
};

// 宠物 → 轴：读池条目自身的 `axis` 字段（由 equipment_part1.js 的兽印块统一打标）
NDX.petAxisOf = function (id) {
  if (!id) return null;
  try {
    const p = NDX.petById(id);
    return (p && p.axis) ? p.axis : null;
  } catch (e) { return null; }
};
NDX.petAxisName = function (ax) {
  const a = NDX.PET_AXES[ax];
  return a ? a.name : '';
};

// ---------- 阶（与随从 FOLLOWER_TIERS 同一套词汇，全系统统一） ----------
//   🔴 关键设计决策：**阶不引入数值乘子**。
//     理由（三重叠加爆炸律）：宠物已有 等级 Lv10 ×2.30 与 星阶 ×1.35；
//     若阶再套随从的 ×1.8/×2.5，叠乘 = ×5.59 ~ ×7.76 ⇒ 宠物取代装备（v1.1 已踩过并压降）。
//   ⇒ 阶的差异 100% 落在**机制档数**上；数值沿用条目自身。
NDX.PET_TIER_NAMES = [null, '本相', '显形', '证道'];
// 档数权重（索引 = 阶）。本相 1 档 / 显形 2 档 / 证道 3 档。
//   消费点：equipment_part3.js `aggregatePetPassive`（`pp[key] += 档数`）
//   ⚠ 与 `petStarPassiveExtra`（★2/★5 +1/+2）**加性**叠加，不乘。
NDX.PET_TIER_PASSIVE_W = [0, 1, 2, 3];
NDX.petTierWeight = function (tier) {
  const t = Math.max(0, Math.min(3, Number(tier) || 0));
  return NDX.PET_TIER_PASSIVE_W[t];
};
NDX.petTierName = function (tier) { return NDX.PET_TIER_NAMES[Math.max(0, Math.min(3, Number(tier) || 0))] || ''; };

// ---------- 兽印数值真源（v1.4 · 「统一设计」的落点） ----------
//   🔴 为什么必须重推：收敛出的 24 只**直接沿用了旧条目数值**，实测毫无递进 ——
//      本相→证道的 atk 在 8 个轴里 **4 个是负增长**（combo 60→88→80、crit 62→55→49），
//      且存在 atk=0 的条目（清月灵狐 atk0/hp40、人参果仔 atk0/hp210）。
//      这是历史遗留噪声，不是设计。门禁 P2 实测叠乘终值 5.58（护栏 3.60）。
//   ⇒ 公式（skill「数值设定流程：假设→模型→方向→调整→验证」）：
//       条目值 = **轴基数**（该轴的形状） × **阶乘子**（等差 ×1.00/×1.25/×1.50）
//     ├ 轴基数：锐系偏攻、固系偏守、转系偏生 —— 让 8 个轴彼此**可辨认**
//     └ 阶乘子：等差、增量恒 +0.25（skill「等差」工具）——最平直、最易向玩家解释
//   ⚠ 预算核算：证道/本相 = 1.50；× Lv10(2.30) = **3.45 ≤ 3.60**（P2 护栏）✅
//     这是**先算叠乘终值、再反推单层幅度**（三重叠加爆炸律）的执行，不是事后调参。
NDX.PET_TIER_STAT_MUL = [0, 1.00, 1.25, 1.50];
NDX.PET_AXIS_STAT = {
  combo:   { atk: 46, hp: 120 },              // 锐·攻
  crit:    { atk: 50, hp: 105, cri: 0.04 },   // 锐·暴
  ward:    { atk: 26, hp: 165, dr: 0.03 },    // 固·守
  evade:   { atk: 34, hp: 115, eva: 0.05 },   // 固·隐
  drain:   { atk: 42, hp: 135 },              // 噬·耗
  rend:    { atk: 52, hp: 110 },              // 噬·破
  purify:  { atk: 28, hp: 175, hpRegen: 6 },  // 转·生
  reverse: { atk: 44, hp: 140, cri: 0.02 },   // 转·逆
};
// 百分比类字段（乘后要保留小数），其余取整
NDX.PET_STAT_PCT_FIELDS = ['cri', 'dr', 'eva', 'mdef', 'hit'];
NDX.petSealStatOf = function (axis, tier) {
  const base = NDX.PET_AXIS_STAT[axis];
  if (!base) return null;
  const t = Math.max(1, Math.min(3, Number(tier) || 1));
  const m = NDX.PET_TIER_STAT_MUL[t];
  const out = {};
  Object.keys(base).forEach(function (k) {
    out[k] = (NDX.PET_STAT_PCT_FIELDS.indexOf(k) >= 0)
      ? +(base[k] * m).toFixed(3)
      : Math.round(base[k] * m);
  });
  return out;
};
// 兽印条目的属性字段全集（写入端据此先清空旧值，防历史字段残留 ⇒ 门禁 S2b）
NDX.PET_STAT_CORE_FIELDS = ['atk', 'hp', 'matk', 'dr', 'eva', 'cri', 'mdef', 'hpRegen'];

// ---------- 组合线：兽印共鸣（4 类 × 10 条，覆盖全部 36 种轴对） ----------
//   🔴 为什么按「类」而不按「轴对」手写：
//     v1.2 的 18 条角色羁绊有 15 条引用了储备宠 = **永久激活不了的死羁绊**；
//     收敛到 24 只后，按具体宠 id 手写必然再次大面积失效。
//     轴对共 C(8,2)+8 = 36 种，手写 36 条必烂尾；按类只写 10 条，**覆盖全部**。
//   ⚠ 纪律（沿用 v1.2 §三）：**扩可达性，不抬天花板**——每条共鸣值 ≤ 单轴满配的 60%。
//   消费点：combat_part1.js computeStats（字段限于 hpPct/atkPct/matkPct/eva/cri/dr）。
NDX.PET_ECHO = [
  { id: '锐锐·兽性贯通', a: '锐', b: '锐', cri: 0.03, combo: 0.04, desc: '兽性贯通：暴击 +3%、连击 +4%——两只都在教你「再打一下」' },
  { id: '锐固·锋守相济', a: '锐', b: '固', atkPct: 0.08, dr: 0.02, desc: '锋守相济：攻击 +8%、减伤 +2%——一只逼你上前，一只替你挡着' },
  { id: '锐噬·钝刀割肉', a: '锐', b: '噬', atkPct: 0.06, cri: 0.02, desc: '钝刀割肉：攻击 +6%、暴击 +2%——快刀与慢刀，一起磨' },
  { id: '锐转·死中求活', a: '锐', b: '转', cri: 0.05, hpPct: 0.03, desc: '死中求活：暴击 +5%、气血 +3%——越是拼命，越有命拼' },
  { id: '固固·不动如岳', a: '固', b: '固', dr: 0.03, eva: 0.03, desc: '不动如岳：减伤 +3%、闪避 +3%——打不穿，也打不着' },
  { id: '固噬·甲中藏刺', a: '固', b: '噬', dr: 0.02, atkPct: 0.05, desc: '甲中藏刺：减伤 +2%、攻击 +5%——盔甲里伸出来的那一截' },
  { id: '固转·破而后立', a: '固', b: '转', hpPct: 0.08, dr: 0.02, desc: '破而后立：气血 +8%、减伤 +2%——碎了才知道有多硬' },
  { id: '噬噬·蚀骨同源', a: '噬', b: '噬', atkPct: 0.07, desc: '蚀骨同源：攻击 +7%——两条路都通向同一块骨头' },
  { id: '噬转·生生相噬', a: '噬', b: '转', hpPct: 0.06, atkPct: 0.04, desc: '生生相噬：气血 +6%、攻击 +4%——吞下去的，都是自己的' },
  { id: '转转·回天同契', a: '转', b: '转', hpPct: 0.08, matkPct: 0.06, desc: '回天同契：气血 +8%、愿伤 +6%——命是自己的，法也是' },
];
NDX.PET_ECHO_CAP = 2;   // 6 格召唤流最多同时吃 2 条，防组合叠加型 power creep

// 命中判定：取全部上阵兽印的「类」，两两配对，返回命中的共鸣（去重 + 封顶）
//   ⚠ 2 格槽位下 pairs 恒为 1 对 ⇒ **任何 2 只兽印必然命中 1 条共鸣**（门禁 S7 正向）。
//   ⚠ 空装备 ⇒ 返回 []（门禁 S7 反向，防「恒真」假绿）。
NDX.petEchoEffects = function (equips) {
  const cls = [];
  (equips || []).forEach(function (e) {
    if (!e || e.slot !== 'pet') return;
    const ax = NDX.petAxisOf(e.id);
    const c = ax ? NDX.PET_AXIS_CLASS[ax] : null;
    if (c) cls.push(c);
  });
  if (cls.length < 2) return [];
  const hit = [];
  const seen = Object.create(null);
  for (let i = 0; i < cls.length; i++) {
    for (let j = i + 1; j < cls.length; j++) {
      (NDX.PET_ECHO || []).forEach(function (ec) {
        const ok = (cls[i] === ec.a && cls[j] === ec.b) || (cls[i] === ec.b && cls[j] === ec.a);
        if (ok && !seen[ec.id]) { seen[ec.id] = 1; hit.push(ec); }
      });
    }
  }
  return hit.slice(0, NDX.PET_ECHO_CAP);
};

// ============================================================
// 四、战斗协同（独立加成层 · 替换 CFX_PET_SYN 平值）
//   连招协同：玩家连击暴击时，灵宠追加真伤
//     = 基础伤害 × PET_SYN_PCT × 等级系数 × 齐击系数(n)
// =============================================================
// 🔴 占比**已定稿**（用户 2026-09-25：「你说占比定不了，你现在就定稿」），不再是待定项：
//   0.12 → 0.09。旧组合（0.12 / cap 0.50 / soft 0.50）实算占本体 **63.4%**，护栏形同虚设；
//   新组合（0.09 / cap 0.50 / soft 0.25）收敛到 **51.9%**，即终局宠物协同最多给本体**半条腿**。
//   详见《随从与宠物 · 机制层设计（v1.0）》§4。
NDX.PET_SYN_PCT = 0.09;
NDX.PET_SYN_CAP_RATIO = 0.50;   // 护栏：真伤 ≤ 本体 × 0.50（宠物不得成为输出主源）
NDX.PET_SYN_CAP_SOFT = 0.25;    // 溢出部分只计 25%（收紧自 0.50，让曲线真正收敛到护栏）

// 🔴 旧表 [0,1.00,1.70,2.20,2.50,2.75,2.90] 的递减量是 −0.20/−0.20/−0.05/−0.10：
//    n=5→6 只减 0.05，比 n=4→5 的 −0.10 还小 ⇒ 破坏「边际递减」的单调手感（第 6 只突然变香）。
// 改**等比递减**（skill「数组/数列」工具）：解 a + ar + … + ar⁵ = 1.90 ⇒ a≈0.68, r≈0.67。
//   增量 0.680/0.456/0.305/0.205/0.137/0.092 ⇒ 递减量 −0.22/−0.15/−0.10/−0.07/−0.05（平滑单调）
//   终值 n=6 由 2.90→2.78（−4.1%，满配温和放缩，不震荡）。
NDX.PET_SWARM = [0, 1.00, 1.68, 2.14, 2.44, 2.65, 2.78]; // 索引 = 上阵数 n

NDX.petSwarmMult = function (n) {
  const i = Math.max(0, Math.min(NDX.PET_SWARM.length - 1, Number(n) || 0));
  return NDX.PET_SWARM[i];
};

// ---------- 协同真伤软饱和（skill「属性模块·临界值」模板） ----------
//   ⚠ 上一版 soft=0.50 是错的：raw 60%+ 时 `cap + (raw-cap)*0.5` 实算仍达本体 **63.4%**，
//      护栏只压了 12 个百分点，形同虚设。已随 PET_SYN_PCT 一并定稿（见上方）：soft 收紧到 0.25。
//   CAP_RATIO / CAP_SOFT 的真源就在 PET_SYN_PCT 旁边，勿在此重复赋值。

// 连招协同真伤（combat_part2.js:cfxPetSynergy 改调此函数）
//   🔴 旧版只按 `st.petLv` 取单只宠物的等级；改为**按个体**取（上阵宠物各自的 petLvOf），
//      取「已装备宠物中最高等级」作为本轮协同的等级口径（战斗内无逐个结算的接线点）。
NDX.petSynergyTrueDmg = function (s, baseDmg) {
  const st = s || {};
  const n = NDX.petDeployCount(st);
  if (n <= 0) return 0;
  const base = Number(baseDmg) || 0;
  if (base <= 0) return 0;
  let lvScale = NDX.PET_LV_SCALE(1);
  try {
    const act = (NDX.activeEquipsFor) ? NDX.activeEquipsFor(st) : (st.equips || []);
    let best = 0;
    (act || []).forEach(function (e) {
      if (!e || e.slot !== 'pet') return;
      best = Math.max(best, NDX.petLevelOf(st, e.id));
    });
    lvScale = NDX.PET_LV_SCALE(best || st.petLv || 1);
  } catch (e) { lvScale = NDX.PET_LV_SCALE(st.petLv || 1); }

  const raw = base * NDX.PET_SYN_PCT * lvScale * NDX.petSwarmMult(n);
  const cap = base * NDX.PET_SYN_CAP_RATIO;
  const eff = raw <= cap ? raw : cap + (raw - cap) * NDX.PET_SYN_CAP_SOFT;
  return Math.max(1, Math.round(eff));
};

// ============================================================
// 五、缘系大招「齐击」
//   上阵宠物/随从齐击：按出战数取边际递减系数，非伤害部分（治疗/护盾）同理
// =============================================================
NDX.petSwarmStrike = function (s, baseVal) {
  const n = NDX.petDeployCount(s);
  return Math.round((Number(baseVal) || 0) * NDX.petSwarmMult(n));
};
