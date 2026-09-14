// =============================================================
// 每日系统（Daily System）
// 对应留存设计优化方案 P2-1：限时·每日·FOMO
// 轻量版——有更好，没有也不影响核心体验
// =============================================================

NDX.Daily = NDX.Daily || {};

// 存储键
NDX.Daily.STORAGE_KEY = 'ndx_daily';

// 加载每日数据
NDX.Daily.load = function () {
  try {
    return NDX.SaveSystem.load(NDX.Daily.STORAGE_KEY, {
      lastLoginDate: null,        // 上次登录日期
      loginStreak: 0,              // 连续登录天数
      todayClaimed: false,         // 今日是否已领取禅修奖励
      todayChallenge: null,        // 今日劫难
      todayChallengeCompleted: false, // 今日劫难是否完成
      totalLogins: 0,              // 总登录天数
      totalChallenges: 0,          // 总完成劫难数
      eventActive: null,            // 当前活动
      eventProgress: {}             // 活动进度
    });
  } catch (e) {
    return { lastLoginDate: null, loginStreak: 0, todayClaimed: false, todayChallenge: null, todayChallengeCompleted: false, totalLogins: 0, totalChallenges: 0, eventActive: null, eventProgress: {} };
  }
};

// 保存每日数据
NDX.Daily.save = function (data) {
  try {
    NDX.SaveSystem.save(NDX.Daily.STORAGE_KEY, data);
  } catch (e) { /* 静默失败 */ }
};

// 获取今日日期字符串
NDX.Daily.getTodayStr = function () {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

// 检查是否是新的一天
NDX.Daily.isNewDay = function () {
  const data = NDX.Daily.load();
  return data.lastLoginDate !== NDX.Daily.getTodayStr();
};

// =============================================================
// 1. 每日禅修（Daily Meditation）
// 每日首次登录获得奖励，连续登录有额外奖励
// =============================================================

NDX.Daily.MEDITATION_REWARDS = [
  { day: 1, gold: 50, sutraFragment: 1, desc: '初禅' },
  { day: 2, gold: 80, sutraFragment: 1, desc: '二禅' },
  { day: 3, gold: 100, sutraFragment: 2, desc: '三禅' },
  { day: 4, gold: 120, sutraFragment: 2, desc: '四禅' },
  { day: 5, gold: 150, sutraFragment: 3, desc: '五禅' },
  { day: 6, gold: 180, sutraFragment: 3, desc: '六禅' },
  { day: 7, gold: 300, sutraFragment: 5, equipQuality: 'blue', desc: '周禅·圆满' }
];

// 每日登录处理
NDX.Daily.onLogin = function () {
  const data = NDX.Daily.load();
  const today = NDX.Daily.getTodayStr();
  
  if (data.lastLoginDate === today) {
    return { isNewDay: false, data: data };
  }
  
  // 检查是否连续登录
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
  
  if (data.lastLoginDate === yesterdayStr) {
    data.loginStreak = (data.loginStreak || 0) + 1;
  } else {
    data.loginStreak = 1;
  }
  
  data.lastLoginDate = today;
  data.todayClaimed = false;
  data.todayChallengeCompleted = false;
  data.totalLogins = (data.totalLogins || 0) + 1;
  
  // 生成今日劫难
  data.todayChallenge = NDX.Daily.generateDailyChallenge();
  
  NDX.Daily.save(data);
  
  return { isNewDay: true, data: data, loginStreak: data.loginStreak };
};

// 领取每日禅修奖励
NDX.Daily.claimMeditation = function () {
  const data = NDX.Daily.load();
  
  if (data.todayClaimed) {
    return { success: false, msg: '今日已领取' };
  }
  
  const streakDay = ((data.loginStreak - 1) % 7) + 1;
  const reward = NDX.Daily.MEDITATION_REWARDS.find(r => r.day === streakDay) || NDX.Daily.MEDITATION_REWARDS[0];
  
  data.todayClaimed = true;
  NDX.Daily.save(data);
  
  return {
    success: true,
    reward: reward,
    streakDay: streakDay,
    loginStreak: data.loginStreak
  };
};

// 获取禅修奖励预览
NDX.Daily.getMeditationPreview = function () {
  const data = NDX.Daily.load();
  const streakDay = ((data.loginStreak - 1) % 7) + 1;
  const reward = NDX.Daily.MEDITATION_REWARDS.find(r => r.day === streakDay) || NDX.Daily.MEDITATION_REWARDS[0];
  
  return {
    todayClaimed: data.todayClaimed,
    loginStreak: data.loginStreak,
    streakDay: streakDay,
    todayReward: reward,
    weekRewards: NDX.Daily.MEDITATION_REWARDS
  };
};

// =============================================================
// 2. 每日一难（Daily Challenge）
// 每日刷新一个特殊条件挑战
// =============================================================

NDX.Daily.CHALLENGE_TYPES = [
  {
    id: 'pure_atk',
    name: '纯武之道',
    desc: '今日仅用普攻通关一场战斗',
    condition: 'no_skills',
    reward: { gold: 100, merit: 50 }
  },
  {
    id: 'speed_run',
    name: '疾风之行',
    desc: '今日在5回合内通关一场战斗',
    condition: 'under_5_turns',
    reward: { gold: 120, merit: 60 }
  },
  {
    id: 'no_damage',
    name: '无伤之境',
    desc: '今日无伤通关一场战斗',
    condition: 'no_damage',
    reward: { gold: 150, merit: 80 }
  },
  {
    id: 'life_drain',
    name: '寿元之劫',
    desc: '今日寿数消耗翻倍，但掉落品质提升',
    condition: 'double_life_cost',
    reward: { gold: 80, merit: 40, luckBonus: 0.1 }
  },
  {
    id: 'xinmo_trial',
    name: '心魔试炼',
    desc: '今日心魔增长翻倍，但攻击提升20%',
    condition: 'double_xinmo',
    reward: { gold: 100, merit: 50, atkBonus: 0.2 }
  },
  {
    id: 'elite_hunter',
    name: '精英猎手',
    desc: '今日击败一个精英敌人',
    condition: 'kill_elite',
    reward: { gold: 120, merit: 60 }
  },
  {
    id: 'seal_collector',
    name: '劫印收集者',
    desc: '今日获得3个劫印',
    condition: 'collect_3_seals',
    reward: { gold: 100, merit: 50 }
  },
  {
    id: 'sutra_master',
    name: '经文大师',
    desc: '今日获得5个经文碎片',
    condition: 'collect_5_sutra',
    reward: { gold: 120, merit: 60 }
  }
];

// 生成今日劫难
NDX.Daily.generateDailyChallenge = function () {
  const today = NDX.Daily.getTodayStr();
  // 使用日期作为种子，确保同一天挑战相同
  const seed = today.split('-').reduce((a, b) => a + parseInt(b), 0);
  const index = seed % NDX.Daily.CHALLENGE_TYPES.length;
  return NDX.Daily.CHALLENGE_TYPES[index];
};

// 获取今日劫难
NDX.Daily.getTodayChallenge = function () {
  const data = NDX.Daily.load();
  if (!data.todayChallenge) {
    data.todayChallenge = NDX.Daily.generateDailyChallenge();
    NDX.Daily.save(data);
  }
  return {
    challenge: data.todayChallenge,
    completed: data.todayChallengeCompleted
  };
};

// 完成今日劫难
NDX.Daily.completeChallenge = function () {
  const data = NDX.Daily.load();
  
  if (data.todayChallengeCompleted) {
    return { success: false, msg: '今日劫难已完成' };
  }
  
  if (!data.todayChallenge) {
    return { success: false, msg: '今日无劫难' };
  }
  
  data.todayChallengeCompleted = true;
  data.totalChallenges = (data.totalChallenges || 0) + 1;
  NDX.Daily.save(data);
  
  return {
    success: true,
    reward: data.todayChallenge.reward,
    totalChallenges: data.totalChallenges
  };
};

// =============================================================
// 3. 限时活动（Limited Events）
// 节日/版本更新时开启
// =============================================================

NDX.Daily.EVENTS = [
  {
    id: 'spring_festival',
    name: '春节庆典',
    startDate: '01-25',
    endDate: '02-08',
    desc: '新春佳节，双倍掉落，经验加成',
    effects: { dropRate: 2, expRate: 1.5 },
    rewards: { gold: 500, specialItem: 'red_envelope' }
  },
  {
    id: 'mid_autumn',
    name: '中秋月圆',
    startDate: '09-15',
    endDate: '09-22',
    desc: '月圆之夜，心魔降低，掉落提升',
    effects: { xinmoReduce: 0.5, dropRate: 1.3 },
    rewards: { gold: 300, specialItem: 'mooncake' }
  },
  {
    id: 'buddha_birthday',
    name: '佛诞吉日',
    startDate: '05-12',
    endDate: '05-19',
    desc: '佛陀诞辰，经文掉落翻倍，渡道收益提升',
    effects: { sutraDrop: 2, duBonus: 1.3 },
    rewards: { gold: 400, specialItem: 'lotus' }
  },
  {
    id: 'new_year',
    name: '元旦迎新',
    startDate: '01-01',
    endDate: '01-07',
    desc: '新年新气象，全属性提升，开局多一件装备',
    effects: { allStats: 1.1, startEquip: 1 },
    rewards: { gold: 600, specialItem: 'firework' }
  },
  {
    id: 'version_celebration',
    name: '版本庆典',
    startDate: null, // 版本更新时手动开启
    endDate: null,
    desc: '新版本上线，限时商店开放，双倍掉落',
    effects: { dropRate: 2, shopDiscount: 0.8 },
    rewards: { gold: 800, specialItem: 'version_gift' }
  }
];

// 检查当前活动
NDX.Daily.checkActiveEvent = function () {
  const now = new Date();
  const monthDay = `${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  
  for (const event of NDX.Daily.EVENTS) {
    if (event.startDate && event.endDate) {
      if (monthDay >= event.startDate && monthDay <= event.endDate) {
        return event;
      }
    }
  }
  
  return null;
};

// 获取活动效果
NDX.Daily.getEventEffects = function () {
  const event = NDX.Daily.checkActiveEvent();
  return event ? event.effects : {};
};

// =============================================================
// 4. 每日统计
// =============================================================

NDX.Daily.getStats = function () {
  const data = NDX.Daily.load();
  return {
    totalLogins: data.totalLogins || 0,
    loginStreak: data.loginStreak || 0,
    totalChallenges: data.totalChallenges || 0,
    todayClaimed: data.todayClaimed,
    todayChallengeCompleted: data.todayChallengeCompleted,
    activeEvent: NDX.Daily.checkActiveEvent()
  };
};

console.log('[Daily] 每日系统已加载');
