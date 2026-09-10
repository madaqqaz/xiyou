// =============================================================
// data_dynasty.js — 《逆道西行》朝代系统 · DYNASTY/getDynasty/bumpDynasty/resetDynasty
// 从 data.js 拆分（2026-08-31）：独立维护朝代系统（死亡递进朝代，通关重置为夏）
// 全局命名空间 NDX（同时挂到 window，兼容其他文件以 window.NDX 引用）
// =============================================================
window.NDX = window.NDX || {};
var NDX = window.NDX;

// =============================================================
// 朝代系统 · 金蝉子十世转世（V8.58 调整）
// 设计：符合"唐僧第十世金蝉子"说法，共10世，第10世为唐朝（终点）
//   - 第1-9世：夏→商→周→秦→汉→三国→晋→南北朝→隋
//   - 第10世：唐（终点，死亡后重新开始唐朝，不再递进）
//   - 每次死亡到下一朝代，每一代遗产保留
//   - 每个朝代有专属特色（feature字段）
//   - 称号：夏朝叫夏僧，商朝叫商僧，...，唐朝叫唐僧
// 每朝配「当朝天子」字段（送行叙事动态代入用）：
//   monarch      实姓名（如 李世民）
//   monarchTitle 帝王尊号（如 唐太宗）—— 送行手谕署名
//   monarchKing  王称（如 唐王）—— 送行节点标题
//   feature      朝代专属特色（影响游戏玩法）
//   featureDesc  特色描述（UI展示用）
// 注：取经背景以唐为锚，转世进入他朝时，送行天子随之更替，强化代入感。
NDX.DYNASTY = {
  LIST: [
    { id: 'xia',    name: '夏',   full: '夏朝',   title: '夏僧',  desc: '上古之世，鸿蒙初辟。',       monarch: '大禹',     monarchTitle: '禹王',     monarchKing: '夏王',
      feature: { ashBonus: 0.10, startEquip: 1 }, featureDesc: '蛮荒初启：初始劫灰+10%，开局多1件基础装备' },
    { id: 'shang',  name: '商',   full: '商朝',   title: '商僧',  desc: '青铜铸鼎，巫风炽盛。',       monarch: '成汤',     monarchTitle: '商汤',     monarchKing: '商王',
      feature: { shopDiscount: 0.10, eventHint: true }, featureDesc: '巫风盛行：商店价格-10%，事件选择有额外提示' },
    { id: 'zhou',   name: '周',   full: '周朝',   title: '周僧',  desc: '礼乐崩坏，百家争鸣。',       monarch: '姬发',     monarchTitle: '周武王',   monarchKing: '周天子',
      feature: { fateBonus: 0.20, sealSlot: 1 }, featureDesc: '礼乐文明：六道抉择属性加成+20%，初始劫印槽+1' },
    { id: 'qin',    name: '秦',   full: '秦朝',   title: '秦僧',  desc: '书同文，车同轨，万世之基。', monarch: '嬴政',     monarchTitle: '秦始皇',   monarchKing: '秦王',
      feature: { diffBonus: 0.10, dropBonus: 0.15, craftBonus: 0.10 }, featureDesc: '法家治国：战斗难度+10%，掉落+15%，装备合成成功率+10%' },
    { id: 'han',    name: '汉',   full: '汉朝',   title: '汉僧',  desc: '犯强汉者，虽远必诛。',       monarch: '刘彻',     monarchTitle: '汉武帝',   monarchKing: '汉王',
      feature: { goodBonus: 0.10, lifeBonus: 1, startTreasure: 1 }, featureDesc: '独尊儒术：善道选项额外加成，寿数+1岁，开局多1件法宝' },
    { id: 'sanguo', name: '三国', full: '三国',   title: '三国僧', desc: '群雄逐鹿，鼎足三分。',       monarch: '曹丕',     monarchTitle: '魏文帝',   monarchKing: '魏王',
      feature: { eliteBonus: 1, eliteDrop: 0.20, petLevel: 1 }, featureDesc: '群雄逐鹿：精英怪数量+1，精英掉落+20%，宠物初始等级+1' },
    { id: 'jinxi',  name: '晋',   full: '晋朝',   title: '晋僧',  desc: '衣冠南渡，五胡乱华。',       monarch: '司马炎',   monarchTitle: '晋武帝',   monarchKing: '晋王',
      feature: { sutraBonus: 0.20, sutraShard: 0.15 }, featureDesc: '魏晋风度：经文获取+20%，经文碎片掉落+15%' },
    { id: 'nanbei', name: '南北朝', full: '南北朝', title: '南北朝僧', desc: '南北对峙，佛道并兴。',     monarch: '萧衍',     monarchTitle: '梁武帝',   monarchKing: '梁王',
      feature: { restBonus: 0.30, bonfireBonus: 0.20 }, featureDesc: '佛教兴盛：休息节点回复+30%，篝火仪典效果+20%' },
    { id: 'sui',    name: '隋',   full: '隋朝',   title: '隋僧',  desc: '大运河通，科举始立。',       monarch: '杨坚',     monarchTitle: '隋文帝',   monarchKing: '隋王',
      feature: { mapNode: 1, shopRefresh: 1 }, featureDesc: '科举初开：地图可选节点+1，商店刷新+1次' },
    { id: 'tang',   name: '唐',   full: '唐朝',   title: '唐僧',  desc: '贞观开元，万国来朝。',       monarch: '李世民',   monarchTitle: '唐太宗',   monarchKing: '唐王',
      feature: { allBonus: 0.10, perfectEnding: true }, featureDesc: '盛世大唐：全面解锁，所有加成+10%，可触发完美结局（45岁回长安）' },
  ],
  // 唐朝索引（终点，第10世）
  TANG_IDX: 9,
};
// 动态计算最后一朝索引（唐朝为终点）
NDX.DYNASTY.LAST_IDX = NDX.DYNASTY.TANG_IDX;
// 朝代存储key（统一访问，避免各处重复写回退值）
NDX.DYNASTY_KEY = NDX.storage.KEYS.DYNASTY_IDX || 'ndx_dynasty_idx';
// 获取当前朝代索引（跨周目持久化）
NDX.getDynastyIdx = function () {
  // V8.40 通过统一模块NDX.SaveSystem读取数字
  // V8.41 统一使用NDX.SaveSystem，删除降级逻辑
  let v = NDX.SaveSystem.loadNumber(NDX.DYNASTY_KEY, 0);
  v = isNaN(v) ? 0 : Math.max(0, Math.min(NDX.DYNASTY.LAST_IDX, v));
  // 一次性校准：历史版本中战斗死亡未调用 bumpDynasty，导致高周目仍卡夏朝。
  // 若玩家从未通关且当前周目已超前于朝代索引，把朝代追至与周目对齐。
  const cycle = (NDX.getCycle ? NDX.getCycle() : 1) || 1;
  const clears = (NDX.clearedHeroes ? NDX.clearedHeroes().length : 0) || 0;
  if (clears <= 0 && cycle > 1 && v < cycle - 1) {
    v = Math.min(NDX.DYNASTY.LAST_IDX, cycle - 1);
    NDX.SaveSystem.saveNumber(NDX.DYNASTY_KEY, v);
  }
  return v;
};
// 获取当前朝代对象
NDX.getDynasty = function () { return NDX.DYNASTY.LIST[NDX.getDynastyIdx()]; };
// 获取当前朝代专属特色
NDX.getDynastyFeature = function () {
  const d = NDX.getDynasty() || {};
  return d.feature || {};
};
// 判断是否为唐朝（终点）
NDX.isTangDynasty = function () {
  return NDX.getDynastyIdx() >= NDX.DYNASTY.TANG_IDX;
};
// 死亡时递进朝代（V8.58 调整：唐朝为终点，死亡后重新开始唐朝，不再递进）
NDX.bumpDynasty = function () {
  const cur = NDX.getDynastyIdx();
  // 唐朝为终点，死亡后重新开始唐朝（不递进）
  if (cur >= NDX.DYNASTY.TANG_IDX) {
    NDX.SaveSystem.saveNumber(NDX.DYNASTY_KEY, NDX.DYNASTY.TANG_IDX);
    return NDX.DYNASTY.LIST[NDX.DYNASTY.TANG_IDX];
  }
  // 非唐朝，递进至下一朝代
  const next = Math.min(NDX.DYNASTY.LAST_IDX, cur + 1);
  // V8.41 统一使用NDX.SaveSystem，删除降级逻辑
  NDX.SaveSystem.saveNumber(NDX.DYNASTY_KEY, next);
  return NDX.DYNASTY.LIST[next];
};
// 通关后重置朝代为夏（进入二周目）
NDX.resetDynasty = function () {
  // V8.41 统一使用NDX.SaveSystem，删除降级逻辑
  NDX.SaveSystem.saveNumber(NDX.DYNASTY_KEY, 0);
  return NDX.DYNASTY.LIST[0];
};
// 送行叙事插值：将文本中的朝代占位符替换为「当朝天子」实际称谓。
// 占位符：{{MONARCH_TITLE}} 帝王尊号 / {{MONARCH}} 实姓名 / {{KING}} 王称 / {{DYNASTY}} 朝代名
// 非送行文本若不含占位符则原样返回，调用安全。
NDX.dynastyInterp = function (text) {
  if (!text) return text;
  const d = NDX.getDynasty() || {};
  const king = d.monarchKing || (d.name ? d.name + '王' : '王');
  return String(text)
    .replace(/\{\{MONARCH_TITLE\}\}/g, d.monarchTitle || '')
    .replace(/\{\{MONARCH\}\}/g, d.monarch || '')
    .replace(/\{\{KING\}\}/g, king)
    .replace(/\{\{DYNASTY\}\}/g, d.name || '');
};
// 轮回重置·从夏朝重开：朝代→夏、周目→第1周目；
// 清除三类遗留承继数据（引渡匣 INHERIT / 衣冠冢遗物 MONUMENT_GEAR / 舍利塔碑塔 MONUMENT），
// 保留成就、藏品、图鉴、轮回殿赐福、已通关英雄等长线收集。
NDX.reincarnateReset = function () {
  NDX.resetDynasty();
  NDX.resetCycle();
  try {
    if (NDX.storage && typeof NDX.storage.remove === 'function') {
      NDX.storage.remove(NDX.storage.KEYS.INHERIT);
      NDX.storage.remove(NDX.storage.KEYS.MONUMENT_GEAR);
      NDX.storage.remove(NDX.storage.KEYS.MONUMENT);
    }
  } catch (e) {}
  return { dynasty: (NDX.getDynasty() || {}).name, cycle: NDX.getCycle() };
};

// =============================================================
// 朝代专属特色接入辅助函数（V8.58 新增）
// 统一接口，方便各个系统调用朝代特色
// =============================================================

// 判断当前朝代是否有某个特色
NDX.dynastyHas = function (featureKey) {
  try {
    const f = NDX.getDynastyFeature();
    return f && f[featureKey] !== undefined && f[featureKey] !== null && f[featureKey] !== false && f[featureKey] !== 0;
  } catch (e) { return false; }
};

// 获取当前朝代某个特色的数值（不存在则返回默认值）
NDX.dynastyValue = function (featureKey, defaultValue) {
  try {
    const f = NDX.getDynastyFeature();
    if (f && f[featureKey] !== undefined && f[featureKey] !== null) {
      return f[featureKey];
    }
  } catch (e) {}
  return defaultValue !== undefined ? defaultValue : 0;
};

// 根据当前朝代特色修正数值（百分比加成）
// type: 'shop'（商店价格）、'drop'（掉落）、'diff'（难度）、'sutra'（经文获取）、
//       'rest'（休息回复）、'bonfire'（篝火效果）、'fate'（六道抉择加成）、
//       'all'（全局加成，唐朝）、'good'（善道加成）、'eliteDrop'（精英掉落）
NDX.dynastyAdjust = function (value, type) {
  try {
    const f = NDX.getDynastyFeature();
    if (!f) return value;
    let multiplier = 1;
    let additive = 0;
    switch (type) {
      case 'shop':
        // 商朝：商店价格-10%
        if (f.shopDiscount) multiplier *= (1 - f.shopDiscount);
        break;
      case 'drop':
        // 秦朝：掉落+15%
        if (f.dropBonus) multiplier *= (1 + f.dropBonus);
        break;
      case 'diff':
        // 秦朝：战斗难度+10%
        if (f.diffBonus) multiplier *= (1 + f.diffBonus);
        break;
      case 'sutra':
        // 晋朝：经文获取+20%
        if (f.sutraBonus) multiplier *= (1 + f.sutraBonus);
        break;
      case 'sutraShard':
        // 晋朝：经文碎片掉落+15%
        if (f.sutraShard) multiplier *= (1 + f.sutraShard);
        break;
      case 'rest':
        // 南北朝：休息回复+30%
        if (f.restBonus) multiplier *= (1 + f.restBonus);
        break;
      case 'bonfire':
        // 南北朝：篝火效果+20%
        if (f.bonfireBonus) multiplier *= (1 + f.bonfireBonus);
        break;
      case 'fate':
        // 周朝：六道抉择属性加成+20%
        if (f.fateBonus) multiplier *= (1 + f.fateBonus);
        break;
      case 'good':
        // 汉朝：善道选项额外加成
        if (f.goodBonus) multiplier *= (1 + f.goodBonus);
        break;
      case 'eliteDrop':
        // 三国：精英掉落+20%
        if (f.eliteDrop) multiplier *= (1 + f.eliteDrop);
        break;
      case 'ash':
        // 夏朝：初始劫灰+10%
        if (f.ashBonus) multiplier *= (1 + f.ashBonus);
        break;
      case 'craft':
        // 秦朝：装备合成成功率+10%
        if (f.craftBonus) additive += f.craftBonus;
        break;
      case 'life':
        // 汉朝：寿数+1岁
        if (f.lifeBonus) additive += f.lifeBonus;
        break;
      case 'all':
        // 唐朝：所有加成+10%
        if (f.allBonus) multiplier *= (1 + f.allBonus);
        break;
    }
    // 唐朝全局加成（对所有类型生效，除了'all'本身避免重复计算）
    if (type !== 'all' && f.allBonus) {
      multiplier *= (1 + f.allBonus);
    }
    return value * multiplier + additive;
  } catch (e) {
    return value;
  }
};

// 获取当前朝代称号（如"夏僧"、"唐僧"）
NDX.getDynastyTitle = function () {
  const d = NDX.getDynasty() || {};
  return d.title || (d.name ? d.name + '僧' : '僧人');
};

// 获取当前朝代世数（1-10）
NDX.getDynastyGeneration = function () {
  return NDX.getDynastyIdx() + 1;
};
