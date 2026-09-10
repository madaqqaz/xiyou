// =============================================================
// 图鉴系统（Codex System）
// 对应留存设计优化方案 P0-1：收集·图鉴·补全
// 蔡格尼克效应：未完成的最挂心，进度条天生让人想拉满
// =============================================================

NDX.CODEX = NDX.CODEX || {};

// 图鉴分类
NDX.CODEX.CATEGORIES = {
  enemy: { name: '敌人', icon: '👹', desc: '击败后解锁' },
  boss: { name: 'Boss', icon: '👺', desc: '击败后解锁' },
  equip: { name: '装备', icon: '⚔️', desc: '获得后解锁' },
  seal: { name: '劫印', icon: '🔮', desc: '获得后解锁' },
  sutra: { name: '经文', icon: '📜', desc: '获得后解锁' },
  treasure: { name: '法宝', icon: '🏺', desc: '获得后解锁' },
};

// 图鉴存储键
NDX.CODEX.STORAGE_KEY = 'ndx_codex';

// 加载图鉴
NDX.CODEX.load = function () {
  try {
    return NDX.SaveSystem.load(NDX.CODEX.STORAGE_KEY, {
      enemy: {}, boss: {}, equip: {}, seal: {}, sutra: {}, treasure: {}
    });
  } catch (e) {
    return { enemy: {}, boss: {}, equip: {}, seal: {}, sutra: {}, treasure: {} };
  }
};

// 保存图鉴
NDX.CODEX.save = function (codex) {
  try {
    NDX.SaveSystem.save(NDX.CODEX.STORAGE_KEY, codex);
  } catch (e) { /* 静默失败 */ }
};

// 记录图鉴条目
NDX.CODEX.record = function (category, id, data) {
  if (!NDX.CODEX.CATEGORIES[category]) return;
  const codex = NDX.CODEX.load();
  if (!codex[category]) codex[category] = {};
  if (!codex[category][id]) {
    codex[category][id] = {
      firstTime: Date.now(),
      count: 1,
      data: data || {}
    };
  } else {
    codex[category][id].count = (codex[category][id].count || 0) + 1;
    if (data) codex[category][id].data = { ...codex[category][id].data, ...data };
  }
  NDX.CODEX.save(codex);
};

// 检查是否已解锁
NDX.CODEX.isUnlocked = function (category, id) {
  const codex = NDX.CODEX.load();
  return !!(codex[category] && codex[category][id]);
};

// 获取图鉴进度
NDX.CODEX.progress = function (category) {
  const codex = NDX.CODEX.load();
  const unlocked = codex[category] ? Object.keys(codex[category]).length : 0;
  let total = 0;
  
  // 根据分类计算总数
  switch (category) {
    case 'enemy':
      total = (NDX.MONSTERS && NDX.MONSTERS.length) || (NDX.MONSTER_TABLE && Object.keys(NDX.MONSTER_TABLE).length) || 0;
      break;
    case 'boss':
      total = (NDX.BOSS_NAMES && NDX.BOSS_NAMES.length) || 0;
      break;
    case 'equip':
      total = (NDX.EQUIPMENTS && NDX.EQUIPMENTS.length) || (NDX.EQUIP_TABLE && Object.keys(NDX.EQUIP_TABLE).length) || 0;
      break;
    case 'seal':
      total = (NDX.SEALS && NDX.SEALS.length) || (NDX.JIEYIN_TABLE && Object.keys(NDX.JIEYIN_TABLE).length) || 0;
      break;
    case 'sutra':
      total = ((NDX.SUTRA_FULLS && NDX.SUTRA_FULLS.length) || 0) + ((NDX.NI_SUTRA_FULLS && NDX.NI_SUTRA_FULLS.length) || 0);
      break;
    case 'treasure':
      total = (NDX.TREASURES && NDX.TREASURES.length) || 0;
      break;
  }
  
  return { unlocked, total, percent: total > 0 ? Math.round((unlocked / total) * 100) : 0 };
};

// 获取全部图鉴进度
NDX.CODEX.allProgress = function () {
  const result = {};
  for (const cat in NDX.CODEX.CATEGORIES) {
    result[cat] = NDX.CODEX.progress(cat);
  }
  return result;
};

// 获取图鉴条目详情
NDX.CODEX.getEntry = function (category, id) {
  const codex = NDX.CODEX.load();
  return codex[category] && codex[category][id] ? codex[category][id] : null;
};

// 获取分类下所有已解锁条目
NDX.CODEX.getUnlocked = function (category) {
  const codex = NDX.CODEX.load();
  return codex[category] ? codex[category] : {};
};

// =============================================================
// 自动记录钩子（在战斗胜利/获得物品时调用）
// =============================================================

// 记录击败敌人
NDX.CODEX.recordEnemy = function (monsterId, monsterData) {
  NDX.CODEX.record('enemy', monsterId, monsterData);
};

// 记录击败Boss
NDX.CODEX.recordBoss = function (bossId, bossData) {
  NDX.CODEX.record('boss', bossId, bossData);
};

// 记录获得装备
NDX.CODEX.recordEquip = function (equipId, equipData) {
  NDX.CODEX.record('equip', equipId, equipData);
};

// 记录获得劫印
NDX.CODEX.recordSeal = function (sealId, sealData) {
  NDX.CODEX.record('seal', sealId, sealData);
};

// 记录获得经文
NDX.CODEX.recordSutra = function (sutraId, sutraData) {
  NDX.CODEX.record('sutra', sutraId, sutraData);
};

// 记录获得法宝
NDX.CODEX.recordTreasure = function (treasureId, treasureData) {
  NDX.CODEX.record('treasure', treasureId, treasureData);
};

console.log('[Codex] 图鉴系统已加载');
