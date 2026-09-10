// =============================================================
// data_equip_core.js — 装备/法宝/合成核心数据与逻辑
// SET_SYS/BASIC_EQUIPS/FABAO_POOL/rollEquips/rollSetEquips/合成配方
// 从 data.js 拆分（2026-08-31，Node 锚点拆分）
// 全局命名空间 NDX
// =============================================================
window.NDX = window.NDX || {};
var NDX = window.NDX;

// -------------------------------------------------------------
// 装备池（T0 散件 + 白字；demo 简化：无合成树，直接穿/存）
// slot: weapon / armor / treasure / pet
// -------------------------------------------------------------
// =============================================================
// 章节-装备映射（基于81难冒险日记与设计文档）
//   ch1 = 第一章·初程·蒙昧（难1-20）: 教学+初始套装+通用散件  ch2 = 第二章·中程·迷障（难21-40）
//   ch3 = 第三章·乱程·分裂（难41-60）                       ch4 = 第四章·终程·脱局（难61-81）
// =============================================================

// T1 合成件（由"劫难固定宝物 + 材料"合成；带 stackable:true 可独立于槽位叠加）

// 装备体系标注（体/愿切割）：每个装备归属 ti(体) 或 yuan(愿)
// 规则：套装件按 SET_SYS 映射；非套装件若含 matk/mdef → yuan，否则 ti
NDX.SET_SYS = { 破军: 'ti', 玄武: 'ti', 贪狼: 'yuan', 取经人: 'yuan', 悟空: 'ti', 八戒: 'ti', 龙马: 'ti', 沙僧: 'yuan', 黑风: 'ti', 狮驼: 'ti', 凌云: 'yuan', 影遁: 'ti', 逆命: 'yuan' };
// 套装 → 六道归属（统一词汇：套装 / 劫印 / 隐藏职 / 宠物 共用「战渡缘夺隐逆」一套语言，降低学习成本）
// · 破军/悟空/黑风=战，狮驼/沙僧=夺，取经人/玄武/凌云=渡，八戒/贪狼=缘，龙马/影遁=隐，逆命=逆（V8.42 幽行空壳已删，逆道归逆命）
NDX.SET_DAO = { 破军: '战', 悟空: '战', 黑风: '战', 狮驼: '夺', 沙僧: '夺', 取经人: '渡', 玄武: '渡', 凌云: '渡', 八戒: '缘', 贪狼: '缘', 龙马: '隐', 影遁: '隐', 逆命: '逆', 饕餮: '夺', 御兽: null, 盘缠: null, 天命: null, 渡厄: null, 镇妖: null, 幽冥: null, 涅槃: null, 降魔: null, 封神: null, 轮回: null };
NDX.setDao = function (set) { return (set && NDX.SET_DAO[set] != null) ? NDX.SET_DAO[set] : null; };
NDX._tagSys = function (pool) {
  // 兼容数组或对象（如 BOSS_REWARDS 已对象化：{ 1:[items], 2:[items], ... } 按章节）
  const arr = Array.isArray(pool)
    ? pool
    : Object.values(pool).reduce((a, b) => a.concat(Array.isArray(b) ? b : [b]), []);
  arr.forEach((e) => {
    if (e.sys) return;
    if (e.set) e.sys = NDX.SET_SYS[e.set] || 'ti';
    else if (e.matk || e.mdef) e.sys = 'yuan';
    else e.sys = 'ti';
  });
};

// 材料增减（materials 为 id->数量 的映射）
NDX.addMaterial = function (s, id, n) {
  s.materials = s.materials || {};
  s.materials[id] = (s.materials[id] || 0) + n;
  if (s.materials[id] <= 0) delete s.materials[id];
};
// 【已拆分】COMMON_MATS / COMMON_MATS_BY_CHAPTER / commonMatsForLayer
//           已移至 data_materials.js（2026-08-31）

// —— 分章节 BASIC_EQUIPS（小怪可掉落基座池）—— 
// V8.23 散件已取消，改为八套合成套装基座 + 通用三套基座 + 灵宠
NDX.BASIC_EQUIPS = [
  'set_weapon_base', 'set_armor_base', 'set_treasure_base',
  'tm_w_base', 'tm_a_base', 'tm_t_base',  // 天命套基座（Ch1）
  'de_w_base', 'de_a_base', 'de_t_base',  // 渡厄套基座（Ch1）
  'zy_w_base', 'zy_a_base', 'zy_t_base',  // 镇妖套基座（Ch2）
  'ym_w_base', 'ym_a_base', 'ym_t_base',  // 幽冥套基座（Ch2）
  'np_w_base', 'np_a_base', 'np_t_base',  // 涅槃套基座（Ch3）
  'jm_w_base', 'jm_a_base', 'jm_t_base',  // 降魔套基座（Ch3）
  'fs_w_base', 'fs_a_base', 'fs_t_base',  // 封神套基座（Ch4）
  'lh_w_base', 'lh_a_base', 'lh_t_base',  // 轮回套基座（Ch4）
  'xiaoheilong', 'xiaoshihou', 'xiaohuli', 'jinchan', 'zhihe', 'younianqilin', 'guchong', 'renshanguozi',  // 灵宠
];
// 各章节递增的小怪装备池（覆盖/扩展 BASIC_EQUIPS）
// 注意：通用三套基座（破军/玄武/贪狼）仅第一章基础套件，第 2 章起由本章专属套件替代，故 2/3/4 章不含这三件。
NDX.BASIC_EQUIPS_BY_CHAPTER = {
  1: ['tm_w_base', 'tm_a_base', 'tm_t_base', 'de_w_base', 'de_a_base', 'de_t_base', 'xiaoheilong', 'xiaoshihou', 'xiaohuli', 'jinchan', 'zhihe', 'lingyan', 'yanlin', 'pc_w1', 'pc_a1', 'pc_t1', 'pc_w1m', 'pc_a1m', 'pc_t1m', 'pc_w1h', 'pc_a1h', 'pc_t1h', 'set_weapon_base', 'set_armor_base', 'set_treasure_base'],
  2: ['zy_w_base', 'zy_a_base', 'zy_t_base', 'ym_w_base', 'ym_a_base', 'ym_t_base', 'younianqilin', 'guchong', 'renshanguozi', 'qingyuehu', 'taxue', 'langyajia', 'sanmei', 'jingangying', 'guixi', 'luotaishi', 'xieweizhen', 'pc_w2', 'pc_a2', 'pc_t2', 'pc_w2m', 'pc_a2m', 'pc_t2m', 'pc_w2h', 'pc_a2h', 'pc_t2h'],
  3: ['np_w_base', 'np_a_base', 'np_t_base', 'jm_w_base', 'jm_a_base', 'jm_t_base', 'jiutouji', 'mangzhu', 'gongwu', 'zhusi', 'pengyu', 'huangzhonghu', 'shilang', 'pc_w3', 'pc_a3', 'pc_t3', 'pc_w3m', 'pc_a3m', 'pc_t3m', 'pc_w3h', 'pc_a3h', 'pc_t3h'],
  4: ['fs_w_base', 'fs_a_base', 'fs_t_base', 'lh_w_base', 'lh_a_base', 'lh_t_base', 'meiban', 'xijiao', 'yuehua', 'shajingshi', 'wudichuan', 'xunzhen', 'qingzhang', 'pc_w4', 'pc_a4', 'pc_t4', 'pc_w4m', 'pc_a4m', 'pc_t4m', 'pc_w4h', 'pc_a4h', 'pc_t4h'],
};

// —— 章节辅助函数 ——
// 返回指定章节可掉落的所有装备 id 数组
NDX.equipsByChapter = function (ch) {
  return NDX.EQUIP_POOL.filter(function (e) { return !e.chapter || e.chapter <= ch; })
    .map(function (e) { return e.id; });
};
// 返回指定章节可合成的所有配方
NDX.recipesByChapter = function (ch) {
  return NDX.RECIPES.filter(function (r) { return !r.chapter || r.chapter <= ch; });
};

NDX.hasMat = function (s, id, n) {
  return (s.materials && s.materials[id] || 0) >= (n || 1);
};

// Boss 专属三选一（按主角英雄分发，保证「取经人当主角只拿取经人的装备」）
// 每件都是该英雄在原著里的标志性神装，且随体系侧重（ti=物伤 / yuan=愿伤）给对应属性。
// 注意：奖励 id 全局唯一、不可叠加，避免跨英雄串味；取经人的武器装备给愿伤(matk)而非物攻(atk)。
// =============================================================
// 关隘通关·强力法宝（每章 Boss 发不同的法宝，三选一）
// 设计意图：修复"每章最终 Boss 掉落相同"——改为按章节发放契合该章叙事的强力法宝；
//   法宝走 treasure 槽位、可临阵祭出、具主动战技，与兵刃/甲胄/灵宠等装备彻底区分。
//   法宝的主动战技（effect）定义在下方 NDX.TREASURES 的 boss 法宝条目。
// =============================================================
// =============================================================

// =============================================================
// Boss 遗物（每击败一个 Act Boss 获得，跨 Act 永久持有，作为全局被动增益）
// 设计意图：对应杀戮尖塔「每层顶部击败 Boss → 进入下一 Act 并获得特有 Boss 遗物」。
// 每个 Act 的 Boss 遗物唯一；遗物效果在 heroStats 结算时并入（见 heroStats 的 relics 处理）。
// =============================================================

// 宝窟（treasure）掉落的大量金币基数（随层数浮动）
NDX.TREASURE_GOLD = function (layer) { return 80 + layer * 6; };

// —— 主动操作点 · 时机提示文案 ——
// calcCombat 在关键时刻为回合打标 operationPoint（enrage / lowhp / routine），
// 战斗演出到该回合会暂停，提示玩家"此刻祭宝"的战术意义。索引即 operationPoint 取值。
NDX.OP_POINT_TIP = {
  enrage: '⚠ 妖敌即将狂暴，攻势将暴涨 ×1.5！此刻祭出伤敌法宝（芭蕉扇·紫金红葫芦·定海神针等）可抢在其发作前将其重创，或祭续命宝稳住自身——时机一旦错失，后续回合将寸步难行。',
  lowhp: '⚠ 你已命悬一线（气血不足三成）！此刻正是续命珠（定风珠·金蝉舍利·净坛宝盂等）发威之机——一念回春，便能从死门拉回；错失则下一拍恐遭斩落。',
  routine: '⏳ 战局胶着，这是一个常规择机窗口。若怀有伤敌/增益法宝，此刻祭出可滚雪球拉开差距；亦可按兵不动，静待下一处更好时机。',
  telegraph: '⚡ 妖物正在蓄力重击（伤害 ×1.6）！此刻正是识破之机——祭出伤敌法宝可打断其攻势；若按兵不动，则须硬吃这一击。',
};

// 两相劫·阶段破韧窗口限时（毫秒）：Boss 韧性破碎瞬间，AI 暂停 2 秒，
// 限时使用「克制该 Boss 韧性的特定法宝」方能破韧击败并领取厚赏；仅手动可领取。
// 超时/跳过仅得挂机兜底（Boss 韧性恢复，本阶段无法击破）——区分挂机与手动收益。默认 2 秒。
NDX.STAGE_BREAK_MS = 2000;

// 主动操作点限时（毫秒）：战斗演出暂停于 operationPoint 回合时，AI 限时 2.5 秒等待玩家抉择；
// 超时自动"按兵不动·静观其变"继续回放——保证无操作也能推进，不拉长单节点战斗时长。
// 2.5s 兼顾"紧迫感"与"看清选项/点按"的容错。
NDX.OP_COUNTDOWN_MS = 2500;
// V8.4x 破爆发节奏·QTE 窗口分层：普通战（mob/非Boss）收窄到 2.0s，强化"走神就错过"的急促感；
// 精英/Boss（多阶段破韧+气势蓄放决策密集）保留 2.5s，给足看清弹性条与叠气势的容错。
// driveFight 建 opInfo 时按 p.monster.boss 取对应窗口（见 main.js）。ui 百分比按该拍 ms 归一，无需改 UI。
NDX.OP_COUNTDOWN_MS_MOB = 2000;
NDX.OP_COUNTDOWN_MS_BOSS = 2500;

NDX.equipById = function (id) {
  // BOSS_REWARDS 现已按章节组织 { 1:[...], 2:[...], ... }，需拍平后查找
  const bossList = Object.values(NDX.BOSS_REWARDS || {}).reduce((a, b) => a.concat(b), []);
  return NDX.EQUIP_POOL.concat(bossList).concat(NDX.CRAFT_POOL).find((e) => e.id === id);
};

// 统一"可掉落的战利品"查询：同时覆盖装备池(EQUIP_POOL/BOSS/CRAFT) 与 法宝字典(TREASURES)。
// 法宝字典里的条目（如定风珠/紫金红葫芦/芭蕉扇）不在装备池，但也是劫难应掉落的战利品，
// 故在此转为带 treasure:true / treasureId 的装备对象，供 grantEquip 按法宝入库。
// —— 修复「劫难战斗不掉装备」：原 equipById 只认装备池，导致法宝类战利品被当材料且 50% 才掉 ——
NDX.lootById = function (id) {
  if (!id) return null;
  // 1) 优先按 id 精确匹配装备池 / 法宝字典
  const eq = NDX.equipById(id);
  if (eq) return eq;
  const T = NDX.TREASURES && NDX.TREASURES[id];
  if (T) return { id, name: T.name, desc: T.desc || T.name, slot: 'treasure', treasure: true, treasureId: id, charges: T.charges, noRecharge: T.noRecharge || undefined };
  // 2) 历史数据里部分 treasure 用"中文名"作 id（如 檀木鱼/龙筋鞭/避火罩/定风珠/紫金红葫芦/芭蕉扇），
  //    按 name 兜底匹配装备池与法宝字典，确保这些劫难战利品也能正常掉落。
  // BOSS_REWARDS 现已按章节 { 1:[...], 2:[...], ... } 组织，需拍平后再按名匹配
  const bossList2 = Object.values(NDX.BOSS_REWARDS || {}).reduce((a, b) => a.concat(Array.isArray(b) ? b : [b]), []);
  const byNameEq = NDX.EQUIP_POOL.concat(bossList2).concat(NDX.CRAFT_POOL).find((e) => e.name === id);
  if (byNameEq) return byNameEq;
  const byNameT = NDX.TREASURES && Object.keys(NDX.TREASURES).find((k) => NDX.TREASURES[k].name === id);
  if (byNameT) {
    const TT = NDX.TREASURES[byNameT];
    return { id: byNameT, name: TT.name, desc: TT.desc || TT.name, slot: 'treasure', treasure: true, treasureId: byNameT, charges: TT.charges, noRecharge: TT.noRecharge || undefined };
  }
  return null;
};

// =============================================================
// 宝窟（宝节点）法宝池：宝窟只产法宝、不产兵甲，与装备彻底区分。
// 按章节解锁：act1基础池(贪狼套+紧箍+特殊)→act2+关隘Ch1/Ch2→act3+关隘Ch3/特殊→act4+关隘Ch4/逆道/新增
// 复用既有的可祭出法宝，按"未持有"去重发奖，越往后章节充能越丰沛。
// V8.54 扩展为9章分池：第1-4章基础/关隘/散宝，第5-8章本命成长链梯度解锁，第9章逆道真器+终极
NDX.FABAO_POOL = {
  1: ['baojiao','dingfeng','zijinhu','zhaoyao','jinchan','jingu','liuer','wuzi','jingangzhuo',
      'tm_jing','de_zhong'],
  2: ['baojiao','dingfeng','zijinhu','zhaoyao','jinchan','jingu','liuer','wuzi','jingangzhuo',
      'bf_dinghai','bf_jingangzhuo','bf_zijinling',
      'jiuming','tm_jing','de_zhong','zy_ling','ym_deng'],
  3: ['baojiao','dingfeng','zijinhu','zhaoyao','jinchan','jingu','liuer','wuzi','jingangzhuo',
      'bf_dinghai','bf_jingangzhuo','bf_zijinling','bf_baojiao_zhen','bf_sanmei','bf_bihuo',
      'jiuming','tm_jing','de_zhong','zy_ling','ym_deng','np_lian','xm_yin'],
  4: ['baojiao','dingfeng','zijinhu','zhaoyao','jinchan','jingu','liuer','wuzi','jingangzhuo',
      'bf_dinghai','bf_jingangzhuo','bf_zijinling','bf_baojiao_zhen','bf_sanmei','bf_bihuo',
      'bf_yinerping','bf_renzhongdai','bf_jinnao',
      'jiuming','tm_jing','de_zhong','zy_ling','ym_deng','np_lian','xm_yin',
      'duanshanfu','huijinzao','zhuosui'],
  5: ['baojiao','dingfeng','zijinhu','zhaoyao','jinchan','jingu','liuer','wuzi','jingangzhuo',
      'bf_dinghai','bf_jingangzhuo','bf_zijinling','bf_baojiao_zhen','bf_sanmei','bf_bihuo',
      'bf_yinerping','bf_renzhongdai','bf_jinnao','bf_wuzizhenjing','bf_lunhui','bf_puti',
      'jiuming','tm_jing','de_zhong','zy_ling','ym_deng','np_lian','xm_yin',
      'duanshanfu','huijinzao','zhuosui',
      'ts_bowl','bj_bowl','ss_bowl'],
  6: ['baojiao','dingfeng','zijinhu','zhaoyao','jinchan','jingu','liuer','wuzi','jingangzhuo',
      'bf_dinghai','bf_jingangzhuo','bf_zijinling','bf_baojiao_zhen','bf_sanmei','bf_bihuo',
      'bf_yinerping','bf_renzhongdai','bf_jinnao','bf_wuzizhenjing','bf_lunhui','bf_puti',
      'jiuming','tm_jing','de_zhong','zy_ling','ym_deng','np_lian','xm_yin',
      'duanshanfu','huijinzao','zhuosui','fs_juan','lh_pan',
      'ts_bowl','bj_bowl','ss_bowl','lm_bowl',
      'ts_bowl_ci','bj_bowl_man','ss_bowl_jing'],
  7: ['baojiao','dingfeng','zijinhu','zhaoyao','jinchan','jingu','liuer','wuzi','jingangzhuo',
      'bf_dinghai','bf_jingangzhuo','bf_zijinling','bf_baojiao_zhen','bf_sanmei','bf_bihuo',
      'bf_yinerping','bf_renzhongdai','bf_jinnao','bf_wuzizhenjing','bf_lunhui','bf_puti',
      'jiuming','tm_jing','de_zhong','zy_ling','ym_deng','np_lian','xm_yin',
      'duanshanfu','huijinzao','zhuosui','fs_juan','lh_pan',
      'ts_bowl','bj_bowl','ss_bowl','lm_bowl',
      'ts_bowl_ci','bj_bowl_man','ss_bowl_jing',
      'ts_bowl_bei','bj_bowl_ying','ss_bowl_fanyin',
      'bis_an','bis_qian','jingu_shu','jingu_zhen'],
  8: ['baojiao','dingfeng','zijinhu','zhaoyao','jinchan','jingu','liuer','wuzi','jingangzhuo',
      'bf_dinghai','bf_jingangzhuo','bf_zijinling','bf_baojiao_zhen','bf_sanmei','bf_bihuo',
      'bf_yinerping','bf_renzhongdai','bf_jinnao','bf_wuzizhenjing','bf_lunhui','bf_puti',
      'jiuming','tm_jing','de_zhong','zy_ling','ym_deng','np_lian','xm_yin',
      'duanshanfu','huijinzao','zhuosui','fs_juan','lh_pan',
      'ts_bowl','bj_bowl','ss_bowl','lm_bowl',
      'ts_bowl_ci','bj_bowl_man','ss_bowl_jing',
      'ts_bowl_bei','bj_bowl_ying','ss_bowl_fanyin',
      'ts_bowl_wl','bj_bowl_wl','ss_bowl_wl',
      'bis_an','bis_qian','bis_fen','bis_shui_hua',
      'jingu_shu','jingu_zhen','jingu_po'],
  9: ['baojiao','dingfeng','zijinhu','zhaoyao','jinchan','jingu','liuer','wuzi','jingangzhuo',
      'bf_dinghai','bf_jingangzhuo','bf_zijinling','bf_baojiao_zhen','bf_sanmei','bf_bihuo',
      'bf_yinerping','bf_renzhongdai','bf_jinnao','bf_wuzizhenjing','bf_lunhui','bf_puti',
      'bf_ni_lian',
      'jiuming','tm_jing','de_zhong','zy_ling','ym_deng','np_lian','xm_yin',
      'duanshanfu','huijinzao','zhuosui','fs_juan','lh_pan',
      'ts_bowl','bj_bowl','ss_bowl','lm_bowl',
      'ts_bowl_ci','bj_bowl_man','ss_bowl_jing',
      'ts_bowl_bei','bj_bowl_ying','ss_bowl_fanyin',
      'ts_bowl_wl','bj_bowl_wl','ss_bowl_wl',
      'bis_an','bis_qian','bis_fen','bis_shui_hua','bis_ding',
      'jingu_shu','jingu_zhen','jingu_po','jingu_gui']
};
NDX.rollFabao = function (n, state, act) {
  const owned = new Set(((state && state.equips) || []).filter((e) => e.treasureId).map((e) => e.treasureId));
  // 按章节选取对应池：act参数决定可用法宝范围，越高章节池越大
  const actKey = Math.min(act || 1, 9);
  const poolSrc = Array.isArray(NDX.FABAO_POOL) ? NDX.FABAO_POOL : (NDX.FABAO_POOL[actKey] || NDX.FABAO_POOL[1] || []);
  const pool = poolSrc.slice();
  const out = [];
  // 越往后章节，宝窟所温养之法宝充能越丰沛（每过一章 +1 次），体现"宝随劫深"
  const bonus = Math.max(0, (act || 1) - 1);
  while (out.length < n && pool.length) {
    const idx = Math.floor(NDX.runRandom() * pool.length); // P1 Seed：候选抽取走整局播种流
    const tid = pool.splice(idx, 1)[0];
    if (owned.has(tid)) continue; // 同名法宝已持有则不再出，避免重复
    const eq = NDX.lootById(tid);
    if (!eq || !eq.treasure) continue; // 只取真正的法宝（避开同名散宝基座）
    const item = Object.assign({}, eq, { chargesLeft: (eq.charges || 0) + bonus });
    out.push(item);
  }
  return out;
};

// 玩家当前可合成（持有 base 宝物 + 足够材料）的配方列表
// 配方支持：
//  - 类型A（单材料）：base + material×count
//  - 类型B（多材料/套装）：base + materials{id:count}
//  - 类型C（基座拼图）：持有 comps 列出的全部 T1 基座
// 统一计算配方实际材料需求（含多周目门槛减免）。
// 三周目起：红色高阶装备（setTier>=3，即凌云/天庭级成品）合成材料需求减半，降低后期红色装备门槛，
// 属多周目差异化解锁——不是单纯数值膨胀，而是让老玩家更快成型稀缺外观/机制。
NDX.recipeReqFor = function (r, s) {
  const req = r.materials || (r.material ? { [r.material]: r.count || 1 } : {});
  const cycle = NDX.getCycle ? NDX.getCycle() : 1;
  const out = NDX.craftById(r.out);
  const isRed = out && NDX.isRedEquip(out);
  if (cycle >= 3 && isRed) {
    const half = {};
    Object.keys(req).forEach((m) => { half[m] = Math.max(1, Math.floor(req[m] / 2)); });
    return half;
  }
  return req;
};

NDX.availableRecipes = function (s) {
  const owned = (s.equips || []).map((e) => e.id);
  const countOwned = (id) => owned.filter((x) => x === id).length;
  const mats = s.materials || {};
  const reqOf = (r) => r.materials || (r.material ? { [r.material]: r.count || 1 } : {});

  // 专属法宝隔离：合成产物 owner 与该英雄不符者，其配方不可见、不可合成
  const hero = s && s.hero;
  const ownerOk = (outId) => {
    const o = NDX.craftById(outId);
    return !o || !o.owner || o.owner === hero;
  };
  return NDX.RECIPES.filter((r) => {
    if (!ownerOk(r.out)) return false;
    const out = NDX.craftById(r.out);
    if (out && !out.treasure && owned.includes(out.id)) return false;
    // 合成劫难前置：八戒隐藏套 / 章节套成品需历经对应关键劫难，否则不可合成。
    // 必须与 chooseCraft 的前置校验保持一致——否则 availableRecipes 返回“可合成”但
    // chooseCraft 因未历劫难而 return 不消耗，_autoCraft 的 while 会无限循环（已验证死循环 bug）。
    const reqTrials = NDX._recipeReqTrials(r);
    if (reqTrials && (Array.isArray(reqTrials) ? reqTrials.length : reqTrials.req.length)) {
      const passed = new Set((s.trialsPassed || []).map((t) => t.diff));
      const ok = Array.isArray(reqTrials)
        ? reqTrials.every((d) => passed.has(d))
        : reqTrials.req.some((d) => passed.has(d)); // 章节套：本章任一劫难即可
      if (!ok) return false;
    }
    if (r.comps) {
      const need = {};
      r.comps.forEach((c) => { need[c] = (need[c] || 0) + 1; });
      if (!Object.keys(need).every((c) => countOwned(c) >= need[c])) return false;
      // 六道专职 L5：需唯一专属遗物材料（与 chooseCraft 前置保一致，避免 _autoCraft 死循环）
      if (r.relicId && !((mats[r.relicId] || 0) >= 1)) return false;
      return true;
    }
    if (r.base && !owned.includes(r.base)) return false;
    const req = NDX.recipeReqFor(r, s);
    return Object.keys(req).every((m) => (mats[m] || 0) >= req[m]);
  });
};

// 套装"还差什么"提示（用于歇脚/坊市的合成提示）
NDX.setProgressHint = function (s) {
  const owned = (s.equips || []).map((e) => e.id);
  const mats = s.materials || {};
  const reqOf = (r) => r.materials || (r.material ? { [r.material]: r.count || 1 } : {});
  // 专属法宝隔离：不可合成的产物不进入"还差什么"提示
  const hero = s && s.hero;
  const ownerOk = (outId) => {
    const o = NDX.craftById(outId);
    return !o || !o.owner || o.owner === hero;
  };
  const tips = [];
  NDX.RECIPES.forEach((r) => {
    if (!ownerOk(r.out)) return; // 非本英雄专属法宝：跳过提示
    const miss = [];
    if (r.base && !owned.includes(r.base)) miss.push(`${NDX.equipById(r.base) ? NDX.equipById(r.base).name : r.base}(基座)`);
    // 六道专职 L5：缺专属遗物材料也计入"还差什么"（残片为材料，走主线/坊市确定获取）
    if (r.relicId && !((mats[r.relicId] || 0) >= 1)) {
      const rl = NDX.ZHUANJIE ? NDX.ZHUANJIE.relicById(r.relicId) : null;
      miss.push(`${rl ? rl.name : r.relicId}(专属遗物)`);
    }
    const req = NDX.recipeReqFor(r, s);
    Object.keys(req).forEach((m) => {
      const have = mats[m] || 0;
      if (have < req[m]) miss.push(`${m} ${have}/${req[m]}`);
    });
    if (miss.length) {
      const top = NDX.craftById(r.out);
      tips.push(`【${top ? top.name : r.out}】尚缺：${miss.join('，')}`);
    }
  });
  return tips;
};

// 装备是否已被同 set+slot 的高阶(T2+)装备替代：
// 例如已有【玄武甲】后，再掉落【玄武胚】即属无效，应降级为材料/盘缠奖励。
NDX.isSupersededByHigherTier = function (state, eq) {
  if (!eq || !eq.set || !eq.slot || (eq.setTier || 0) >= 2) return false;
  return (state && state.equips || []).some((e) =>
    e.set === eq.set && e.slot === eq.slot && (e.setTier || 0) >= 2
  );
};

// 从池中随机抽 n 件：
//  - 排除玩家「已拥有」与「曾出现」的装备，杜绝重复出现
//  - preferSlot 给定时只在该槽位内抽取（如"灵宠"只出宠物），该槽位不足则如实返回更少
//  - state 提供时，会把本次抽到的装备记入 state.shownEquips，供后续抽取去重
// V8.48 装备 soft-pity（运营数据 P0）：连续 NDX.EQUIP_PITY_THRESHOLD 次 rollEquips 未掉落
//   「套装基座/成品」（e.set && e.setTier>=1，合成线入口）时，下次强制保底一件基座，
//   避免玩家长期只拿散件、凑不齐套装。计数存 state._equipPity，由本函数自维护。
NDX.EQUIP_PITY_THRESHOLD = 6;
// 方案X2·六道加权掉落：同道（当前主要道途）装备在三选一掉落池中权重倍数
NDX.DAO_EQUIP_W = 4;
NDX.rollEquips = function (n, state, preferSlot) {
  const owned = new Set((state && state.equips || []).map((e) => e.id));
  // 法宝同 id 去重：同一 treasureId 的法宝（凡品/成品是同一法宝的不同阶段）只持有一件，
  // 已持有其任一阶段则其余阶段不再出现，避免"紫金钵盂 + 紫金钵"两件同名法宝并存。
  const ownedTreas = new Set(
    (state && state.equips || [])
      .filter((e) => e.treasureId)
      .map((e) => e.treasureId)
  );
  const shown = state && state.shownEquips ? state.shownEquips : [];
  // 专属法宝隔离：owner 标记的法宝仅其主英雄可获得，绝不流落他人之手
  const hero = state && state.hero;
  const ownerOk = (e) => !e.owner || e.owner === hero;
  // 法宝阶段去重：已持有同 treasureId 则整体排除
  const treasOk = (e) => !e.treasureId || !ownedTreas.has(e.treasureId);
  // 掉落规则：① 绝不出现成品（setTier>=2），只出基座(setTier=1)与散件；② 优先出套装基座，
  //    散件仅作兜底，强力引导玩家收集组件、走合成线，避免"散件一大堆却凑不齐套装"。
  const tierOk = (e) => !e.setTier || e.setTier < 2;          // 排除成品 T2
  const isBase = (e) => !!e.set && e.setTier === 1;            // 套装基座
  const isLoose = (e) => !isBase(e);                          // 散件（非套装基座）
  // 章节上限：按全局进度解锁，第 1 章只掉通用/英雄套基座与无章节标记的散件（全章可用），
  //   第 2~4 章才解锁对应章节专属装备（chapter 字段标记的 langyajia / sanmei / jiutouji 等），
  //   避免第一章就摇出高阶章节货、或高层仍只出第一章破烂——保证装备随章节推进稳步升级。
  // V8.37 修复标尺错位：用 regionToEquipChapter(4章制) 替代 chapterOf(17地区号)
  // 原逻辑：cap=chapterOf(1-17)，装备chapter(1-4)永远<=cap，导致全装备随时可掉
  // 新逻辑：cap=regionToEquipChapter(1-4)，装备随章节推进逐步解锁
  const cap = state ? NDX.regionToTier(NDX.chapterOf(NDX.globalProgress(state))) : 4;
  // 方案X2·六道加权掉落：按当前主要道途（动态主道，允许中途转道实时跟随）给同道装备 ×4 权重
  // P0-3 劫难词条·恶缘当道：同道权重失效（_daoMain 置空 → 回退均匀随机），构筑更杂乱
  const _daoMain = (state && !(NDX.hasCurse && NDX.hasCurse(state, 'eyuan')) && NDX.daoAtkStyleOf) ? (NDX.daoAtkStyleOf(state) || {}).dao : null;
  const _daoW = (e) => (e && e.set && _daoMain && NDX.setDao && NDX.setDao(e.set) === _daoMain) ? (NDX.DAO_EQUIP_W || 4) : 1;
  const _weightedIdx = (pool) => {
    let sum = 0;
    const ws = [];
    for (let i = 0; i < pool.length; i++) { const w = _daoW(pool[i]); ws.push(w); sum += w; }
    let r = NDX.runRandom() * sum;
    for (let i = 0; i < pool.length; i++) { r -= ws[i]; if (r < 0) return i; }
    return pool.length - 1;
  };
  const chapterOk = (e) => !e.chapter || e.chapter <= cap;
  // 第一章基础套件（破军/玄武/贪狼三套通用基座）仅第一章可掉落，第 2 章起不再出现，
  // 由本章专属套件（黑风/狮驼/凌云）替代，符合"装备随章节推进升级"的获取逻辑。
  const genBaseOk = (e) => cap <= 1 || !NDX.isGenBase(e);
  // 第一优先池：套装基座（排除已拥有 + 同法宝其它阶段 + 被高阶替代 + 曾展示 + 非本英雄专属/法宝 + 其他英雄套装 + 成品 + 越章 + 非第一章通用基座）
  let basePool = NDX.EQUIP_POOL.filter((e) => tierOk(e) && isBase(e) && chapterOk(e) && genBaseOk(e) && !owned.has(e.id) && treasOk(e) && !NDX.isSupersededByHigherTier(state, e) && !shown.includes(e.id) && ownerOk(e) && !NDX.setBelongsToOtherHero(e, hero));
  if (preferSlot) basePool = basePool.filter((e) => e.slot === preferSlot);
  // 兜底池：其余可出物。V8.42 散件清理——排除事件专属装备(eventOnly)与无 set 散件（事件装备只由剧情发放，
  //   无 set 散件不再随机掉落；V8.43 五行饰品已删，trinket 条件随之移除）。
  let loosePool = NDX.EQUIP_POOL.filter((e) => tierOk(e) && chapterOk(e) && genBaseOk(e) && !owned.has(e.id) && treasOk(e) && !NDX.isSupersededByHigherTier(state, e) && !shown.includes(e.id) && ownerOk(e) && !NDX.setBelongsToOtherHero(e, hero) && !e.eventOnly && !!e.set);
  if (preferSlot) loosePool = loosePool.filter((e) => e.slot === preferSlot);
  const out = [];
  // V8.48 soft-pity：累计 NDX.EQUIP_PITY_THRESHOLD 次 rollEquips 未掉落「套装基座」(setTier>=1) 时，
  // 强制保底一件未拥有的套装基座。P0-C 轮回赐福感受性保底：state._favorPity 提前保底层（失败越多保底越早）。
  const _pityThreshold = (NDX.EQUIP_PITY_THRESHOLD || 6) - ((state && state._favorPity) || 0);
  if (state && (state._equipPity || 0) >= _pityThreshold) {
    const heroSet = (NDX.HERO_SET_KEY && state.hero) ? NDX.HERO_SET_KEY[state.hero] : null;
    const cand = NDX.EQUIP_POOL.filter((e) => {
      if (!e.set || (e.setTier || 0) !== 1) return false;       // 仅套装基座
      if (owned.has(e.id)) return false;                         // 已拥有排除
      if (!chapterOk(e)) return false;                           // 章节制
      if (NDX.isSupersededByHigherTier && NDX.isSupersededByHigherTier(state, e)) return false;
      if (NDX.setBelongsToOtherHero && NDX.setBelongsToOtherHero(e, state.hero)) return false;
      return true;                                               // 不排除 shown：保底打破曾展示去重
    });
    if (cand.length) {
      cand.sort((a, b) => (b.set === heroSet ? 1 : 0) - (a.set === heroSet ? 1 : 0)); // 本英雄套优先
      out.push(cand[0]);
      state._equipPity = 0;
    }
  }
  while (out.length < n && basePool.length) {
    // 方案X2·六道加权：有主道判定时同道权重 ×4，无则回退均匀随机
    const idx = _daoMain ? _weightedIdx(basePool) : Math.floor(NDX.runRandom() * basePool.length); // P1 Seed：候选抽取走整局播种流
    out.push(basePool.splice(idx, 1)[0]);
  }
  // 基座不足 n 时，用散件兜底补足，杜绝空手
  while (out.length < n && loosePool.length) {
    const idx = _daoMain ? _weightedIdx(loosePool) : Math.floor(NDX.runRandom() * loosePool.length); // P1 Seed：候选抽取走整局播种流
    out.push(loosePool.splice(idx, 1)[0]);
  }
  // 仍不足（被 shownEquips 占满）：放宽"曾展示"约束，依旧排除已拥有 + 成品 + 被高阶替代 + 非本英雄专属 + 事件装备 + 无 set 散件
  if (out.length < n) {
    let avail3 = NDX.EQUIP_POOL.filter((e) => tierOk(e) && chapterOk(e) && genBaseOk(e) && !owned.has(e.id) && treasOk(e) && !NDX.isSupersededByHigherTier(state, e) && !out.includes(e) && ownerOk(e) && !NDX.setBelongsToOtherHero(e, hero) && !e.eventOnly && !!e.set);
    if (preferSlot) avail3 = avail3.filter((e) => e.slot === preferSlot);
    while (out.length < n && avail3.length) {
      const idx = Math.floor(NDX.runRandom() * avail3.length); // P1 Seed：候选抽取走整局播种流
      out.push(avail3.splice(idx, 1)[0]);
    }
  }
  if (state) {
    if (!state.shownEquips) state.shownEquips = [];
    out.forEach((e) => { if (!state.shownEquips.includes(e.id)) state.shownEquips.push(e.id); });
    // V8.48 保底计数：本次含「套装基座/成品」则重置，否则 +1
    const _gotBoon = out.some((e) => e.set && (e.setTier || 0) >= 1);
    state._equipPity = _gotBoon ? 0 : (state._equipPity || 0) + 1;
  }
  // V8.48 埋点：装备掉落（owner 天然埋点，零污染核心逻辑）
  if (NDX.telemetry && out.length) {
    try {
      NDX.telemetry.track('drop_equip', {
        n: out.length,
        ids: out.map((e) => e.id),
        tiers: out.map((e) => e.setTier || 0),
        pity: (state && state._equipPity) || 0
      });
    } catch (e) {}
  }
  return out;
};

// 注：NDX.BASIC_EQUIPS 与分章池 BASIC_EQUIPS_BY_CHAPTER 已在上面定义（行 629+），此处不再重复。
// （保持向后兼容：旧代码引用 NDX.BASIC_EQUIPS 仍指向第一章默认池）

// 该英雄的全部套装件（基座 + 成品）：劫难按"参与者"只掉其专属套装
// 注：EQUIP_POOL 中英雄套装的 set 字段用中文名（悟空/取经人/…），需把英文 hero id 映射为中文
NDX.HERO_SET_KEY = { wukong: '悟空', tangseng: '取经人', bajie: '八戒', xiaobailong: '龙马', shaseng: '沙僧' };
NDX.setEquipsForHero = function (hero) {
  const key = NDX.HERO_SET_KEY[hero] || hero;
  const pool = NDX.EQUIP_POOL.concat(NDX.CRAFT_POOL);
  return pool.filter((e) => e.set === key).map((e) => e.id);
};
// 该装备的套装 set 是否属于「当前英雄以外的英雄」专属套——
// 通用三套（破军/玄武/贪狼）不属于任何英雄，不在此列；
// 用于掉落/商店/机缘等随机发放时，杜绝「取经人当主角却出现其他四英雄基装」。
// 给定套装基座 id（如 'set_treasure_base'），返回该套 T2 配方所需的全部材料名数组；
// 用于「套装精英」战胜后必发基座 + 全套材料，确保玩家当章即可合成成品。
NDX.setCraftMatsOf = function (baseId) {
  const r = (NDX.RECIPES || []).find((x) => x.base === baseId);
  if (!r) return [];
  if (r.materials) return Object.keys(r.materials);
  if (r.material) return [r.material];
  return [];
};

NDX.setBelongsToOtherHero = function (e, hero) {
  if (!e || !e.set) return false;
  const heroKey = NDX.HERO_SET_KEY[hero];
  const allHeroSets = Object.values(NDX.HERO_SET_KEY);
  return allHeroSets.includes(e.set) && e.set !== heroKey;
};
// 选项善恶归属：符合西游原著 / 守佛祖定下的规则 → 善；违背、不按本分 → 恶。
// 优先看显式 effect.good/evil（或 reward），否则按命运倾向 fate 推断：
//   渡/隐 = 善（渡人向善、避锋修心，合取经人本分）；战/夺/逆 = 恶（以力破劫、逆取天机、跳出簿子，皆悖佛祖之规）。
NDX.optAlign = function (opt) {
  const eff = opt.effect || {};
  const rew = opt.reward || {};
  if (eff.good || rew.good) return 'good';
  if (eff.evil || rew.evil) return 'evil';
  const f = opt.fate;
  if (f === '渡' || f === '隐') return 'good';
  if (f === '战' || f === '夺' || f === '逆') return 'evil';
  return null; // 中性（如"特/观望/金"等既不彰善也不彰恶）
};

// 劫难二选一：只从"当前英雄套装"中抽（参与者专属），且仅出基座（绝不出现成品），
// 不足时以通用三套基座补足，强力引导玩家收集组件、走合成线。
NDX.rollSetEquips = function (n, state) {
  const hero = state && state.hero;
  const setIds = NDX.setEquipsForHero(hero);
  const owned = new Set((state && state.equips || []).map((e) => e.id));
  // 法宝同 id 去重：同一 treasureId 的法宝（凡品/成品是同一法宝的不同阶段）只持有一件
  const ownedTreas = new Set(
    (state && state.equips || [])
      .filter((e) => e.treasureId)
      .map((e) => e.treasureId)
  );
  const treasOk = (e) => !e || !e.treasureId || !ownedTreas.has(e.treasureId);
  const baseOnly = (e) => e && (!e.setTier || e.setTier < 2); // 仅基座，排除成品 T2
  // 主池：英雄专属套装基座（排除已拥有 + 同法宝其它阶段 + 成品）
  let avail = setIds
    .filter((id) => !owned.has(id))
    .map((id) => NDX.equipById(id))
    .filter((e) => treasOk(e) && baseOnly(e));
  // 池不足（基座已集齐）则放宽：仅纳入「通用三套基座」（破军/玄武/贪狼），
  // 绝不混入其他英雄的专属基座——取经人当主角时绝不出现其他四英雄基装。
  // 注意：通用三套基座仅第一章掉落；第 2 章起由本章专属套件（chapterGear）补足，不再纳入通用三套。
  const HERO_SETS = Object.values(NDX.HERO_SET_KEY); // ['悟空','取经人','八戒','龙马','沙僧']
  // V8.37 修复标尺错位：用 regionToEquipChapter(4章制) 替代 chapterOf(17地区号)
  if (avail.length < n && NDX.regionToTier(NDX.chapterOf(NDX.globalProgress(state))) <= 1) {
    const extra = NDX.EQUIP_POOL.concat(NDX.CRAFT_POOL)
      .filter((e) => e.set && !owned.has(e.id) && !setIds.includes(e.id) && !HERO_SETS.includes(e.set))
      .map((id) => NDX.equipById(id))
      .filter((e) => treasOk(e) && baseOnly(e));
    avail = avail.concat(extra);
  }
  // 第 2~4 章专属套件基座（黑风/狮驼/凌云 套的 setTier:1 件：狼牙铠/三昧火种/九头戟/梅瓣甲…）：
  // 随全局进度解锁，纳入精英「装备二选一」—— 否则第 2~4 章精英永远只给英雄基座，本章标志性装备永不出现。
  // 注意这些件现已归属章节套件（有 set），不会再被上面 !e.set 的兜底逻辑命中，故此处显式按章纳入。
  // V8.37 修复标尺错位：用 regionToEquipChapter(4章制) 替代 chapterOf(17地区号)
  const cap = state ? NDX.regionToTier(NDX.chapterOf(NDX.globalProgress(state))) : 4;
  const chapterGear = NDX.EQUIP_POOL
    .filter((e) => baseOnly(e) && treasOk(e) && !owned.has(e.id) && e.chapter && e.chapter <= cap && !NDX.setBelongsToOtherHero(e, hero));
  avail = avail.concat(chapterGear);
  // 去重（同一 id 可能因多来源重复）
  const _seen = new Set();
  avail = avail.filter((e) => { if (_seen.has(e.id)) return false; _seen.add(e.id); return true; });
  const out = [];
  while (out.length < n && avail.length) {
    const idx = Math.floor(NDX.runRandom() * avail.length); // P1 Seed：候选抽取走整局播种流
    out.push(avail.splice(idx, 1)[0]);
  }
  if (state && state.shownEquips) {
    out.forEach((e) => { if (!state.shownEquips.includes(e.id)) state.shownEquips.push(e.id); });
  }
  return out;
};

// -------------------------------------------------------------
// 机缘事件（简化选项：effect 直接改玩家状态）
// effect: {atk,hp,maxhp,dr,gold,good,evil,heal,equip,reveal}
// -------------------------------------------------------------
// 小劫（随机事件弹窗）—— 每个劫难为独立弹窗，通过对话选择「战斗」或「剧情」通过
// 选项约定：
//   effect: 剧情奖励（通用字段）



// 体愿抉择（劫难/精英后）—— 三选一，强化肉鸽获得感
// effect 按 体(ti) / 愿(yuan) 双体系切割：
//   ti:  atk 体攻 / hp 气血 / dr 护体 / eva 身法
//   yuan: matk 愿伤 / mdef 御念
NDX.TIYUAN_OPTS = [
  { key: 'ti',  text: '【体】体攻 +15 · 气血 +30', effect: { ti: { atk: 15, hp: 30 } }, fate: '战' },
  { key: 'yuan',text: '【愿】愿伤 +18 · 御念 +6%', effect: { yuan: { matk: 18, mdef: 0.06 } }, fate: '隐' },
  { key: 'bao', text: '【宝】装备二选一',        effect: { equip: 2 }, fate: '夺' },
];

