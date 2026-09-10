// =============================================================
// 探索未知系统（Exploration System）
// 对应留存设计优化方案 P1-2：探索·未知
// 好奇心是最古老的引擎——"下一个转角有什么"
// =============================================================

NDX.Exploration = NDX.Exploration || {};

// 存储键
NDX.Exploration.STORAGE_KEY = 'ndx_exploration';

// 加载探索数据
NDX.Exploration.load = function () {
  try {
    return NDX.SaveSystem.load(NDX.Exploration.STORAGE_KEY, {
      discoveredNodes: {},      // 已发现的节点 { runId: { nodeId: true } }
      hiddenRoomsFound: {},     // 已发现的隐藏房间 { runId: [roomId] }
      eventsTriggered: {},       // 已触发的奇遇事件 { runId: [eventId] }
      totalExplored: 0,          // 总探索节点数
      totalHiddenFound: 0,       // 总发现隐藏房间数
      totalEventsTriggered: 0,   // 总触发奇遇事件数
    });
  } catch (e) {
    return { discoveredNodes: {}, hiddenRoomsFound: {}, eventsTriggered: {}, totalExplored: 0, totalHiddenFound: 0, totalEventsTriggered: 0 };
  }
};

// 保存探索数据
NDX.Exploration.save = function (data) {
  try {
    NDX.SaveSystem.save(NDX.Exploration.STORAGE_KEY, data);
  } catch (e) { /* 静默失败 */ }
};

// 记录节点发现
NDX.Exploration.recordNode = function (runId, nodeId) {
  const data = NDX.Exploration.load();
  if (!data.discoveredNodes[runId]) data.discoveredNodes[runId] = {};
  if (!data.discoveredNodes[runId][nodeId]) {
    data.discoveredNodes[runId][nodeId] = true;
    data.totalExplored = (data.totalExplored || 0) + 1;
    NDX.Exploration.save(data);
  }
};

// 记录隐藏房间发现
NDX.Exploration.recordHiddenRoom = function (runId, roomId) {
  const data = NDX.Exploration.load();
  if (!data.hiddenRoomsFound[runId]) data.hiddenRoomsFound[runId] = [];
  if (!data.hiddenRoomsFound[runId].includes(roomId)) {
    data.hiddenRoomsFound[runId].push(roomId);
    data.totalHiddenFound = (data.totalHiddenFound || 0) + 1;
    NDX.Exploration.save(data);
    return true; // 首次发现
  }
  return false;
};

// 记录奇遇事件触发
NDX.Exploration.recordEvent = function (runId, eventId) {
  const data = NDX.Exploration.load();
  if (!data.eventsTriggered[runId]) data.eventsTriggered[runId] = [];
  if (!data.eventsTriggered[runId].includes(eventId)) {
    data.eventsTriggered[runId].push(eventId);
    data.totalEventsTriggered = (data.totalEventsTriggered || 0) + 1;
    NDX.Exploration.save(data);
  }
};

// =============================================================
// 1. 迷雾地图（Fog of War）
// 未探索区域用迷雾覆盖，只能看到当前节点和相邻节点
// =============================================================

NDX.Exploration.FOG_CONFIG = {
  revealRadius: 1,        // 揭示半径（当前节点+相邻节点）
  fogOpacity: 0.85,       // 迷雾不透明度
  animateReveal: true,     // 揭示时动画
};

// 检查节点是否可见
NDX.Exploration.isNodeVisible = function (runId, nodeId, currentNodeId, adjacencyMap) {
  // 当前节点始终可见
  if (nodeId === currentNodeId) return true;
  
  // 已发现的节点可见
  const data = NDX.Exploration.load();
  if (data.discoveredNodes[runId] && data.discoveredNodes[runId][nodeId]) return true;
  
  // 相邻节点可见
  if (adjacencyMap && adjacencyMap[currentNodeId]) {
    return adjacencyMap[currentNodeId].includes(nodeId);
  }
  
  return false;
};

// 获取迷雾样式
NDX.Exploration.getFogStyle = function (isVisible) {
  if (isVisible) {
    return 'opacity: 1; filter: none; transition: opacity 0.5s ease;';
  }
  return `opacity: ${NDX.Exploration.FOG_CONFIG.fogOpacity}; filter: blur(3px) grayscale(0.8); transition: opacity 0.5s ease;`;
};

// 揭示节点（带动画）
NDX.Exploration.revealNode = function (nodeElement) {
  if (!nodeElement) return;
  nodeElement.style.opacity = '0';
  nodeElement.style.filter = 'blur(10px)';
  setTimeout(() => {
    nodeElement.style.opacity = '1';
    nodeElement.style.filter = 'none';
  }, 50);
};

// =============================================================
// 2. 隐藏房间（Hidden Rooms）
// 每个地区有1-2个隐藏房间，需要特定条件触发
// =============================================================

NDX.Exploration.HIDDEN_ROOM_TYPES = [
  {
    id: 'scripture_room',
    name: '藏经密室',
    desc: '一间隐秘的藏经阁，散落着古老的经卷',
    icon: '📜',
    trigger: { type: 'daotu_count', daotu: 'du', count: 3 }, // 选择3次渡道后出现
    reward: { type: 'sutra', count: 2 }
  },
  {
    id: 'armory_room',
    name: '废弃兵库',
    desc: '一处被遗忘的兵器库，锈迹斑斑但仍有宝光',
    icon: '⚔️',
    trigger: { type: 'daotu_count', daotu: 'zhan', count: 3 }, // 选择3次战道后出现
    reward: { type: 'equip', quality: 'blue' }
  },
  {
    id: 'shrine_room',
    name: '古佛神龛',
    desc: '一尊残破的古佛，似乎在等待有缘人的供奉',
    icon: '🛕',
    trigger: { type: 'item', itemId: 'incense' }, // 携带特定物品时出现
    reward: { type: 'seal', quality: 'gold' }
  },
  {
    id: 'spring_room',
    name: '灵泉秘境',
    desc: '一汪清澈的灵泉，散发着治愈的气息',
    icon: '💧',
    trigger: { type: 'hp_below', percent: 30 }, // 气血低于30%时出现
    reward: { type: 'heal', percent: 50 }
  },
  {
    id: 'merchant_room',
    name: '神秘商人',
    desc: '一位行踪诡秘的商人，只在特定时刻出现',
    icon: '🎭',
    trigger: { type: 'gold_above', amount: 500 }, // 金币超过500时出现
    reward: { type: 'shop', discount: 0.5 }
  },
  {
    id: 'relic_room',
    name: '上古遗迹',
    desc: '一处上古仙人的遗迹，充满未知的危险与机遇',
    icon: '🏛️',
    trigger: { type: 'random', chance: 0.05 }, // 5%概率随机出现
    reward: { type: 'random_rare' }
  }
];

// 检查隐藏房间是否触发
NDX.Exploration.checkHiddenRoom = function (roomType, context) {
  const room = NDX.Exploration.HIDDEN_ROOM_TYPES.find(r => r.id === roomType);
  if (!room) return false;
  
  const trigger = room.trigger;
  const ctx = context || {};
  
  switch (trigger.type) {
    case 'daotu_count':
      return (ctx.daotuCounts && ctx.daotuCounts[trigger.daotu] || 0) >= trigger.count;
    case 'item':
      return ctx.inventory && ctx.inventory.includes(trigger.itemId);
    case 'hp_below':
      return ctx.hpPercent && ctx.hpPercent <= trigger.percent;
    case 'gold_above':
      return ctx.gold && ctx.gold >= trigger.amount;
    case 'random':
      return Math.random() < trigger.chance;
    default:
      return false;
  }
};

// 获取当前可触发的隐藏房间
NDX.Exploration.getAvailableHiddenRooms = function (context) {
  return NDX.Exploration.HIDDEN_ROOM_TYPES.filter(room => 
    NDX.Exploration.checkHiddenRoom(room.id, context)
  );
};

// =============================================================
// 3. 奇遇事件（Serendipity Events）
// 低概率触发的特殊事件，给稀有奖励
// =============================================================

NDX.Exploration.SERENDIPITY_EVENTS = [
  {
    id: 'mysterious_traveler',
    name: '神秘旅人',
    desc: '一位风尘仆仆的旅人向你招手，似乎有话要说',
    icon: '🧙',
    chance: 0.03,
    choices: [
      { text: '上前交谈', result: '获得稀有物品或线索', reward: { type: 'random', quality: 'gold' } },
      { text: '保持警惕', result: '旅人消失在迷雾中', reward: null }
    ]
  },
  {
    id: 'ancient_ruins',
    name: '上古遗迹',
    desc: '你发现了一处被藤蔓覆盖的古老遗迹',
    icon: '🏛️',
    chance: 0.02,
    choices: [
      { text: '进入探索', result: '可能获得宝物，也可能遭遇危险', reward: { type: 'risk_reward' } },
      { text: '绕道而行', result: '安全但错过机遇', reward: null }
    ]
  },
  {
    id: 'buddha_enlightenment',
    name: '佛菩萨点化',
    desc: '一道金光闪过，一位佛菩萨出现在你面前',
    icon: '🧘',
    chance: 0.01,
    choices: [
      { text: '虔诚叩拜', result: '获得佛菩萨加持', reward: { type: 'buff', duration: 10 } },
      { text: '请教佛法', result: '获得经文碎片', reward: { type: 'sutra_fragment', count: 3 } }
    ]
  },
  {
    id: 'demon_contract',
    name: '妖魔交易',
    desc: '一只妖魔提出与你交易，代价是你的一部分寿数',
    icon: '👹',
    chance: 0.02,
    choices: [
      { text: '接受交易', result: '获得强大力量，但损失寿数', reward: { type: 'power_life' } },
      { text: '断然拒绝', result: '妖魔愤怒离去', reward: { type: 'xinmo', amount: 5 } }
    ]
  },
  {
    id: 'time_rift',
    name: '时空裂隙',
    desc: '一道时空裂隙出现在你面前，似乎能看到过去或未来',
    icon: '🌀',
    chance: 0.01,
    choices: [
      { text: '探入裂隙', result: '获得前世记忆或未来启示', reward: { type: 'memory' } },
      { text: '封闭裂隙', result: '获得功德', reward: { type: 'merit', amount: 100 } }
    ]
  }
];

// 检查奇遇事件是否触发
NDX.Exploration.rollSerendipity = function () {
  for (const event of NDX.Exploration.SERENDIPITY_EVENTS) {
    if (Math.random() < event.chance) {
      return event;
    }
  }
  return null;
};

// =============================================================
// 4. 探索统计与成就
// =============================================================

NDX.Exploration.getStats = function () {
  const data = NDX.Exploration.load();
  return {
    totalExplored: data.totalExplored || 0,
    totalHiddenFound: data.totalHiddenFound || 0,
    totalEventsTriggered: data.totalEventsTriggered || 0,
    explorationRate: data.totalExplored > 0 ? Math.min(100, Math.round((data.totalExplored / 1000) * 100)) : 0,
  };
};

// 检查探索成就
NDX.Exploration.checkAchievements = function () {
  const stats = NDX.Exploration.getStats();
  const achievements = [];
  
  if (stats.totalExplored >= 100) achievements.push('explorer_100');
  if (stats.totalExplored >= 500) achievements.push('explorer_500');
  if (stats.totalExplored >= 1000) achievements.push('explorer_1000');
  if (stats.totalHiddenFound >= 10) achievements.push('hidden_finder_10');
  if (stats.totalHiddenFound >= 50) achievements.push('hidden_finder_50');
  if (stats.totalEventsTriggered >= 5) achievements.push('serendipity_5');
  if (stats.totalEventsTriggered >= 20) achievements.push('serendipity_20');
  
  return achievements;
};

console.log('[Exploration] 探索未知系统已加载');
