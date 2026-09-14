// =============================================================
// 修行进度系统（Cultivation Progress）
// 对应留存设计优化方案 P0-2：成长·精通·心流
// "我在变强"是最持久的驱动力
// =============================================================

NDX.Cultivation = NDX.Cultivation || {};

// 存储键
NDX.Cultivation.STORAGE_KEY = 'ndx_cultivation';

// 年轮存储键
NDX.Cultivation.RING_KEY = 'ndx_ring';

// 加载修行数据
NDX.Cultivation.load = function () {
  try {
    return NDX.SaveSystem.load(NDX.Cultivation.STORAGE_KEY, {
      totalRuns: 0,           // 总局数
      totalWins: 0,           // 总通关数
      totalKills: 0,          // 总击杀数
      totalEquips: 0,         // 总获得装备数
      totalSeals: 0,          // 总获得劫印数
      totalSutras: 0,         // 总获得经文数
      playTime: 0,            // 总游戏时间（秒）
      bestRun: null,          // 最佳单局记录
      heroStats: {},          // 各英雄统计
      dynastyStats: {},       // 各朝代统计
    });
  } catch (e) {
    return { totalRuns: 0, totalWins: 0, totalKills: 0, totalEquips: 0, totalSeals: 0, totalSutras: 0, playTime: 0, bestRun: null, heroStats: {}, dynastyStats: {} };
  }
};

// 保存修行数据
NDX.Cultivation.save = function (data) {
  try {
    NDX.SaveSystem.save(NDX.Cultivation.STORAGE_KEY, data);
  } catch (e) { /* 静默失败 */ }
};

// 记录单局开始
NDX.Cultivation.recordRunStart = function (heroId) {
  const data = NDX.Cultivation.load();
  data.totalRuns = (data.totalRuns || 0) + 1;
  if (!data.heroStats[heroId]) data.heroStats[heroId] = { runs: 0, wins: 0, kills: 0 };
  data.heroStats[heroId].runs = (data.heroStats[heroId].runs || 0) + 1;
  NDX.Cultivation.save(data);
};

// 记录单局结束
NDX.Cultivation.recordRunEnd = function (heroId, result) {
  const data = NDX.Cultivation.load();
  
  if (result.win) {
    data.totalWins = (data.totalWins || 0) + 1;
    if (data.heroStats[heroId]) data.heroStats[heroId].wins = (data.heroStats[heroId].wins || 0) + 1;
  }
  
  if (result.kills) data.totalKills = (data.totalKills || 0) + result.kills;
  if (result.equips) data.totalEquips = (data.totalEquips || 0) + result.equips;
  if (result.seals) data.totalSeals = (data.totalSeals || 0) + result.seals;
  if (result.sutras) data.totalSutras = (data.totalSutras || 0) + result.sutras;
  if (result.playTime) data.playTime = (data.playTime || 0) + result.playTime;
  
  if (data.heroStats[heroId]) {
    if (result.kills) data.heroStats[heroId].kills = (data.heroStats[heroId].kills || 0) + result.kills;
  }
  
  // 记录最佳单局
  if (!data.bestRun || (result.win && result.region > (data.bestRun.region || 0))) {
    data.bestRun = {
      hero: heroId,
      win: result.win,
      region: result.region || 0,
      kills: result.kills || 0,
      date: Date.now()
    };
  }
  
  NDX.Cultivation.save(data);
  
  // 获得年轮
  NDX.Cultivation.addRing(1);
};

// =============================================================
// 年轮系统（Ring System）
// 元进度强化：每完成一局获得年轮，可解锁永久加成
// =============================================================

NDX.Cultivation.RING_UPGRADES = [
  { id: 'hp', name: '体魄强健', desc: '初始气血 +5%', max: 10, cost: 5, effect: 0.05 },
  { id: 'atk', name: '战意昂扬', desc: '初始攻击 +5%', max: 10, cost: 5, effect: 0.05 },
  { id: 'life', name: '延年益寿', desc: '初始寿数 +1岁', max: 5, cost: 8, effect: 1 },
  { id: 'luck', name: '佛光普照', desc: '掉落品质 +1%', max: 10, cost: 6, effect: 0.01 },
  { id: 'startEquip', name: '西行厚礼', desc: '开局额外装备 +1', max: 3, cost: 15, effect: 1 },
  { id: 'startSeal', name: '劫印初启', desc: '开局额外劫印 +1', max: 3, cost: 15, effect: 1 },
  { id: 'coin', name: '财源广进', desc: '初始金币 +50', max: 10, cost: 4, effect: 50 },
  { id: 'exp', name: '顿悟之体', desc: '经验获取 +5%', max: 10, cost: 5, effect: 0.05 },
];

// 加载年轮数据
NDX.Cultivation.loadRing = function () {
  try {
    return NDX.SaveSystem.load(NDX.Cultivation.RING_KEY, {
      rings: 0,           // 当前年轮数
      spent: 0,           // 已消耗年轮数
      upgrades: {},       // 已解锁升级 { id: level }
    });
  } catch (e) {
    return { rings: 0, spent: 0, upgrades: {} };
  }
};

// 保存年轮数据
NDX.Cultivation.saveRing = function (data) {
  try {
    NDX.SaveSystem.save(NDX.Cultivation.RING_KEY, data);
  } catch (e) { /* 静默失败 */ }
};

// 增加年轮
NDX.Cultivation.addRing = function (count) {
  const data = NDX.Cultivation.loadRing();
  data.rings = (data.rings || 0) + count;
  NDX.Cultivation.saveRing(data);
  return data.rings;
};

// 购买升级
NDX.Cultivation.buyUpgrade = function (upgradeId) {
  const upgrade = NDX.Cultivation.RING_UPGRADES.find(u => u.id === upgradeId);
  if (!upgrade) return { success: false, msg: '升级不存在' };
  
  const data = NDX.Cultivation.loadRing();
  const currentLevel = data.upgrades[upgradeId] || 0;
  
  if (currentLevel >= upgrade.max) return { success: false, msg: '已满级' };
  if ((data.rings || 0) < upgrade.cost) return { success: false, msg: '年轮不足' };
  
  data.rings -= upgrade.cost;
  data.spent = (data.spent || 0) + upgrade.cost;
  data.upgrades[upgradeId] = currentLevel + 1;
  NDX.Cultivation.saveRing(data);
  
  return { success: true, level: data.upgrades[upgradeId], remaining: data.rings };
};

// 获取升级效果总值
NDX.Cultivation.getUpgradeEffect = function (upgradeId) {
  const upgrade = NDX.Cultivation.RING_UPGRADES.find(u => u.id === upgradeId);
  if (!upgrade) return 0;
  const data = NDX.Cultivation.loadRing();
  const level = data.upgrades[upgradeId] || 0;
  return level * upgrade.effect;
};

// 获取所有永久加成
NDX.Cultivation.getAllBonuses = function () {
  return {
    hpBonus: NDX.Cultivation.getUpgradeEffect('hp'),
    atkBonus: NDX.Cultivation.getUpgradeEffect('atk'),
    lifeBonus: NDX.Cultivation.getUpgradeEffect('life'),
    luckBonus: NDX.Cultivation.getUpgradeEffect('luck'),
    startEquipBonus: NDX.Cultivation.getUpgradeEffect('startEquip'),
    startSealBonus: NDX.Cultivation.getUpgradeEffect('startSeal'),
    coinBonus: NDX.Cultivation.getUpgradeEffect('coin'),
    expBonus: NDX.Cultivation.getUpgradeEffect('exp'),
  };
};

// =============================================================
// 动态难度调整（Dynamic Difficulty）
// 难度贴合玩家水平 = 心流
// =============================================================

NDX.Cultivation.getDifficultyModifier = function () {
  const data = NDX.Cultivation.load();
  const runs = data.totalRuns || 0;
  const wins = data.totalWins || 0;
  const winRate = runs > 0 ? wins / runs : 0;
  
  // 基础难度系数
  let modifier = 1.0;
  
  // 新手保护：前3局难度降低
  if (runs < 3) modifier = 0.85;
  // 连败保护：连续死亡3次后难度降低
  else if (runs >= 3 && winRate < 0.2) modifier = 0.9;
  // 连胜挑战：连续通关2次后难度提升
  else if (wins >= 2 && winRate > 0.6) modifier = 1.08;
  
  return {
    modifier,
    label: modifier < 1 ? '佛佑（难度降低）' : modifier > 1 ? '心魔试炼（难度提升）' : '标准',
    runs,
    wins,
    winRate
  };
};

console.log('[Cultivation] 修行进度系统已加载');
