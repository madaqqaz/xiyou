// =============================================================
// data_equipment.js — 《逆道西行》装备生成 · 套装基座/装备池/升级
// 从 data.js 拆分（2026-08-31）：独立维护装备生成与升级逻辑
// 全局命名空间 NDX（同时挂到 window，兼容其他文件以 window.NDX 引用）
// =============================================================
window.NDX = window.NDX || {};
var NDX = window.NDX;

// 通用三套（破军/玄武/贪狼）的基座：仅第一章基础套件，第 2 章起不再掉落
NDX.GEN_SET_BASES = ['set_weapon_base', 'set_armor_base', 'set_treasure_base', 'pj_armor_base', 'pj_treasure_base'];
NDX.isGenBase = function (e) {
  return !!(e && e.id && NDX.GEN_SET_BASES.indexOf(e.id) >= 0);
};
// 生成岔路节点的内容（与主路径错开，保证多样性）
// 通用三套（破军/玄武/贪狼）的基座+全套材料配置——仅第一章侧路精英/劫难使用，
// 确保第一章无论玩家走哪条分岔路线，都能触发"套装精英齐发"并当章合成成品。
NDX._GEN_SET_PICKS = [
  { drop: 'set_weapon_base',   material: ['破军·锋', '破军·脊'] },
  { drop: 'pj_armor_base',     material: ['破军·铠', '破军·骨'] },
  { drop: 'pj_treasure_base',  material: ['破军·印', '破军·魄'] },
  { drop: 'set_armor_base',    material: ['玄武·鳞', '玄武·心'] },
  { drop: 'set_treasure_base', material: ['贪狼·牙', '贪狼·瞳'] },
];
// 第 2~4 章专属套件基座+材料（按章推进解锁，替代第一章通用三套）：
// 第二章→黑风套 / 第三章→狮驼套 / 第四章→凌云套。第 2 章起侧路精英/劫难改掉这些。
// 第 5~9 章（高章节）继续沿用本章专属套件池，并逐章融合更高阶材料，保证中后期装备成长不断档。
NDX._GEN_SET_PICKS_BY_CHAPTER = {
  2: [
    { drop: 'langyajia',  material: ['黑风铁', '兜率火', '三昧烬'] },
    { drop: 'sanmei',     material: ['黑风铁', '兜率火', '三昧烬'] },
    { drop: 'jingangying', material: ['黑风铁', '兜率火', '三昧烬'] },
  ],
  3: [
    { drop: 'jiutouji', material: ['金翅羽', '狮驼骨', '巨蟒涎'] },
    { drop: 'mangzhu',  material: ['金翅羽', '狮驼骨', '巨蟒涎'] },
    { drop: 'gongwu',   material: ['金翅羽', '狮驼骨', '巨蟒涎'] },
  ],
  4: [
    { drop: 'meiban',  material: ['天竺佛香', '凌云木', '月宫桂'] },
    { drop: 'xijiao',  material: ['天竺佛香', '凌云木', '月宫桂'] },
    { drop: 'yuehua',  material: ['天竺佛香', '凌云木', '月宫桂'] },
  ],
  // 第 5~9 章：专属套件按高章节进阶——复用第四章凌云级基座 + 通用高阶基座，材料逐章升级。
  // 仅使用已验证存在的装备 id 与材料 token，避免掉落无效物品。
  5: [
    { drop: 'langyajia', material: ['兜率火', '金翅羽'] },
    { drop: 'sanmei',    material: ['兜率火', '凌云木'] },
    { drop: 'set_armor_base', material: ['兜率火', '天竺佛香'] },
  ],
  6: [
    { drop: 'meiban',  material: ['三昧烬', '狮驼骨'] },
    { drop: 'xijiao',  material: ['三昧烬', '巨蟒涎'] },
    { drop: 'set_weapon_base', material: ['三昧烬', '天竺佛香'] },
  ],
  7: [
    { drop: 'jiutouji', material: ['狮驼骨', '金翅羽'] },
    { drop: 'mangzhu',  material: ['狮驼骨', '凌云木'] },
    { drop: 'set_treasure_base', material: ['狮驼骨', '天竺佛香'] },
  ],
  8: [
    { drop: 'yuehua',  material: ['凌云木', '月宫桂'] },
    { drop: 'meiban',  material: ['凌云木', '天竺佛香'] },
    { drop: 'pj_treasure_base', material: ['月宫桂', '天竺佛香'] },
  ],
  9: [
    { drop: 'xijiao',  material: ['凌云木', '月宫桂'] },
    { drop: 'langyajia', material: ['月宫桂', '天竺佛香'] },
    { drop: 'pj_armor_base', material: ['凌云木', '月宫桂'] },
  ],
};

// 三~九章（中后期，逆道开放）地图调优：精英概率小幅提升、功能房问号（event）占比提高。
// 仅作用于 act>=3，不影响前两章节奏（前两章已隔离为新手/完整肉鸽形态）。逐章小幅递增强度。
NDX.MAP_TUNE = {
  3: { elite: 0.10, event: 0.14 }, // 精英 +10%、问号 +14%（在 mob 节点上概率升级）
  4: { elite: 0.14, event: 0.18 }, // 精英 +14%、问号 +18%
  5: { elite: 0.16, event: 0.18 },
  6: { elite: 0.18, event: 0.20 },
  7: { elite: 0.18, event: 0.20 },
  8: { elite: 0.20, event: 0.22 },
  9: { elite: 0.22, event: 0.22 },
};

// 红色装备池（setTier>=3 的成品：凌云/天庭级）：三/四章 Boss 高概率掉落，强化后期红色装备获取。
// 按章节解锁：三章起可掉凌云级（setTier:3），四章额外纳入天庭终阶（chapter:4）。
NDX.redEquipPoolFor = function (act, hero) {
  const cap = act >= 4 ? 4 : 3;
  let pool = NDX.EQUIP_POOL
    .concat(NDX.CRAFT_POOL || [])
    .filter((e) => e.setTier && e.setTier >= cap && e.set && !e.treasure);
  if (hero) pool = pool.filter((e) => !NDX.setBelongsToOtherHero(e, hero));
  const owned = new Set();
  return pool.filter((e) => { if (owned.has(e.id)) return false; owned.add(e.id); return true; });
};

NDX._sideNode = function (layer, type) {
  // 连续地图：layer 为全局层，真实难号 = diffOfLayer(globalLayer)（1~81），
  // 使小怪/精英/劫难的难度与「第 N 难」剧情难号一致，跨地区平滑爬升。
  const d = NDX.diffOfLayer(layer);
  if (type === 'mob') {
    const names = ['拦路山魈', '黑松夜叉', '野祠饿鬼', '断桥水卒', '焦尾妖狐'];
    return { type, name: NDX._pick(names), diff: d, gold: 12 + d * 3, material: NDX.COMMON_MATS };
  }
  if (type === 'elite') {
    const names = ['熊罴老怪', '赤发鬼王', '独脚魈王', '黑风大圣', '黄眉童子'];
    // 节点资源严格隔离（V8.26 命痕砍除改版）：精英房【产蓝劫（机制改写）+ 逆道经文碎片 + 少量合成材料】，
    // 绝不掉可穿戴套装基座。兵甲装备的成长严格只来自劫难线 / 坊市，使「多闯精英=机制丰富但面板一般」的取舍成立。
    // 材料略多于普通，作为「不拿装备」的轻度补偿。
    return { type, name: NDX._pick(names), diff: d, gold: 18 + d * 4, material: NDX.COMMON_MATS };
  }
  if (type === 'trial') {
    // 侧路劫难：掉落一套套装基座+材料；第一章给通用三套，第 2 章起给本章专属套件
    // V8.37 修复标尺错位（收尾）：原逻辑直接用 chapterOf(d)（17地区号）索引 _GEN_SET_PICKS_BY_CHAPTER（按章 1~9 键），
    //   导致：①地区2起就错位拿到高1章套件；②地区10~17（难41~81，后半程）键不存在→回退通用第一章套，中后期专属成长断档。
    //   改用 regionToActChapter（17地区→9章）对齐表的键尺度，使黑风→狮驼→凌云→高阶套按章推进铺满全程。
    const ch = NDX.regionToActChapter(NDX.chapterOf(d));
    const picks = (ch > 1 ? NDX._GEN_SET_PICKS_BY_CHAPTER[ch] : null) || NDX._GEN_SET_PICKS;
    const pick = NDX._pick(picks);
    return { type, name: '劫难', diff: d, drop: pick.drop, material: pick.material };
  }
  if (type === 'event') {
    // 缘(?)：地图只标「?」不标名；进入时再按保底机制随机决定是「遇怪(小怪/劫)」还是「无战斗得宝」
    return { type, name: '缘', diff: d };
  }
  if (type === 'treasure') {
    // 宝：获得宝物(装备二选一) + 大量金币；地图标「宝」
    return { type, name: '宝窟', diff: d };
  }
  if (type === 'rest') {
    // 平衡 V42：前 5 层以较低概率（30%）仍可出现休整，缓解"连续战斗血崩"；其余维持战斗/选择节奏
    // 第一章（新手）：绝不回退到问号(event)，改为小怪(mob)——问号事件已整体屏蔽
    if (d <= 5 && Math.random() >= 0.30) {
      const alt = (NDX.chapterOf(d) === 1) ? 'mob' : (Math.random() < 0.5 ? 'event' : 'mob');
      return NDX._sideNode(layer, alt);
    }
    return { type, name: NDX._pick(['土地庙', '山亭', '废庙', '碑亭']), diff: d };
  }
  if (type === 'shop') {
    // 前 5 层不出现市场：此时金币不足以消费，避免“过早市场买不起”的挫败感
    // 第一章（新手）：前 5 层市场回退为小怪(mob)而非问号(event)——问号事件已整体屏蔽
    if (d <= 5) {
      const alt = (NDX.chapterOf(d) === 1) ? 'mob' : (Math.random() < 0.5 ? 'event' : 'mob');
      return NDX._sideNode(layer, alt);
    }
    // 价格随层数递增：早期只卖 tier1~2 低价货，后期才卖高价，匹配玩家金币成长
    const tier = Math.max(1, Math.min(5, 1 + Math.floor(d / 4) + NDX._rand(0, 1)));
    return { type, name: NDX._pick(['游商', '货郎担', '鬼市摊']), diff: d, priceTier: tier };
  }
  if (type === 'cave') {
    // 隐藏洞天（三周目全开放）：逆道秘境。产出逆道经文碎片 + 红色高阶套装材料 + 金币；
    // 不产可穿戴套装基座（与劫难线隔离），但给逆道流后期补强的专属资源。
    // V8.26 命痕砍除：逆道经文碎片由 game.js 进入时发放，此处只标类型与材料。
    // V8.37 修复标尺错位：用 regionToEquipChapter(4章制) 替代 chapterOf(17地区号)
    // 原逻辑：chapterOf(d) >= 4 → 地区4(难14)就掉凌云木，提前约47难
    // 新逻辑：equipChapter >= 4 → 地区14(难59)才掉凌云木，符合后期定位
    const _equipCh = NDX.regionToTier(NDX.chapterOf(d));
    const redMat = (_equipCh >= 4) ? '凌云木' : (_equipCh >= 3 ? '狮驼骨' : '黑风铁');
    return { type, name: NDX._pick(['逆道洞天', '无字秘窟', '堕落灵山影']), diff: d, gold: 30 + d * 6, material: [redMat, '三昧烬'], cave: true };
  }
  return { type: 'mob', name: '无名妖', diff: d, gold: 10 };
};

// 开局随机生成整张地图：杀戮尖塔式多节点并行分支网。
// 每层（除首尾）生成 2~3 个节点，相邻层节点按"列差≤1"连通，
// 形成大量可自由规划的路线岔口（多数决策点有 3 条可选路径）。
// 装备淬炼（土地庙）：将一件基础装备升至二阶——属性 ×1.6，封顶 upgraded 不可再升。
// 排除 stackable（合成叠加件）与 setTier 基座（避免破坏套装合成配方）。
NDX.upgradeEquip = function (e) {
  const f = (v) => Math.max(1, Math.round(v * 1.6));
  const fPct = (v) => Math.round(v * 1.6 * 100) / 100; // 百分比字段(dr/eva/mdef)以小数存
  return {
    ...e,
    name: e.name + '·精进',
    atk: e.atk ? f(e.atk) : 0,
    hp: e.hp ? f(e.hp) : 0,
    dr: e.dr ? fPct(e.dr) : 0,
    eva: e.eva ? fPct(e.eva) : 0,
    matk: e.matk ? f(e.matk) : 0,
    mdef: e.mdef ? fPct(e.mdef) : 0,
    upgraded: true,
  };
};
