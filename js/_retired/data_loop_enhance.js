// =============================================================
// 多层循环强化系统（Loop Enhancement System）
// 对应留存设计优化方案 P1-3：多层循环套娃
// 好机制 = 期待 × 反馈 × 成长的复利
// =============================================================

NDX.LoopEnhance = NDX.LoopEnhance || {};

// =============================================================
// 1. 战斗→抉择紧密衔接
// 战斗胜利后立即弹出抉择，形成"打完就选"的流畅循环
// =============================================================

NDX.LoopEnhance.battleToChoice = function (battleResult) {
  // 战斗结果数据
  const result = battleResult || {};
  const heroDaotu = result.heroDaotu || 'du';
  const enemyDaotu = result.enemyDaotu || 'zhan';
  const battleType = result.battleType || 'normal'; // normal/elite/boss
  
  // 根据战斗结果生成相关抉择
  const choices = NDX.LoopEnhance.generateRelatedChoices(result);
  
  return {
    immediate: true, // 立即弹出，不返回地图
    choices: choices,
    context: {
      battleResult: result,
      relatedDaotu: enemyDaotu,
      battleType: battleType
    }
  };
};

// 生成与战斗相关的抉择
NDX.LoopEnhance.generateRelatedChoices = function (battleResult) {
  const result = battleResult || {};
  const choices = [];
  
  // 基础抉择（始终出现）
  choices.push({
    id: 'rest',
    text: '稍作休整',
    desc: '恢复少量气血，平复心绪',
    daotu: 'du',
    effect: { type: 'heal', percent: 15 }
  });
  
  choices.push({
    id: 'press',
    text: '乘胜追击',
    desc: '战意沸腾，下一场战斗攻击提升',
    daotu: 'zhan',
    effect: { type: 'buff', stat: 'atk', percent: 20, duration: 1 }
  });
  
  // 根据战斗类型生成特殊抉择
  if (result.battleType === 'elite' || result.battleType === 'boss') {
    choices.push({
      id: 'absorb',
      text: '吸收妖气',
      desc: '吸收敌人残余妖气，获得临时力量，但增加心魔',
      daotu: 'duo',
      effect: { type: 'power_xinmo', atkBonus: 30, xinmo: 10 }
    });
  }
  
  // 根据敌人道途生成相关抉择
  if (result.enemyDaotu === 'du') {
    choices.push({
      id: 'learn',
      text: '参悟佛法',
      desc: '从敌人的佛法中领悟，获得经文碎片',
      daotu: 'du',
      effect: { type: 'sutra_fragment', count: 1 }
    });
  }
  
  if (result.enemyDaotu === 'yin') {
    choices.push({
      id: 'shadow',
      text: '潜行隐匿',
      desc: '学习敌人的隐匿之术，下一场战斗闪避提升',
      daotu: 'yin',
      effect: { type: 'buff', stat: 'eva', percent: 25, duration: 1 }
    });
  }
  
  // 随机抉择（30%概率出现）
  if (Math.random() < 0.3) {
    const randomChoices = [
      { id: 'meditate', text: '静心冥想', desc: '冥想片刻，心魔降低', daotu: 'du', effect: { type: 'xinmo_reduce', amount: 5 } },
      { id: 'forage', text: '搜刮战利品', desc: '仔细搜刮，可能获得额外金币', daotu: 'duo', effect: { type: 'gold', amount: 50 + Math.floor(Math.random() * 100) } },
      { id: 'train', text: '磨练武艺', desc: '利用间隙磨练武艺，经验提升', daotu: 'zhan', effect: { type: 'exp', amount: 20 } }
    ];
    const randomChoice = randomChoices[Math.floor(Math.random() * randomChoices.length)];
    choices.push(randomChoice);
  }
  
  // 最多显示4个抉择
  return choices.slice(0, 4);
};

// =============================================================
// 2. 抉择→成长即时反馈
// 抉择后立即显示属性变化，让玩家立刻感受到"我的选择有效果"
// =============================================================

NDX.LoopEnhance.choiceToGrowth = function (choice, context) {
  const effect = choice.effect || {};
  const feedback = {
    choiceId: choice.id,
    choiceText: choice.text,
    effects: [],
    statChanges: [],
    narrative: ''
  };
  
  // 处理各种效果
  switch (effect.type) {
    case 'heal':
      feedback.statChanges.push({ stat: 'hp', change: `+${effect.percent}%`, label: '气血恢复' });
      feedback.narrative = '你稍作休整，气血渐渐恢复。';
      break;
    case 'buff':
      feedback.statChanges.push({ stat: effect.stat, change: `+${effect.percent}%`, label: `${effect.stat === 'atk' ? '攻击' : effect.stat === 'eva' ? '闪避' : effect.stat}提升`, duration: effect.duration });
      feedback.narrative = `你${choice.text}，${effect.stat === 'atk' ? '战意沸腾' : effect.stat === 'eva' ? '身形愈发灵动' : '状态提升'}！`;
      break;
    case 'power_xinmo':
      feedback.statChanges.push({ stat: 'atk', change: `+${effect.atkBonus}%`, label: '攻击提升' });
      feedback.statChanges.push({ stat: 'xinmo', change: `+${effect.xinmo}`, label: '心魔增加' });
      feedback.narrative = '你吸收了妖气，力量暴涨，但心魔也随之增长...';
      break;
    case 'sutra_fragment':
      feedback.effects.push({ type: 'item', name: '经文碎片', count: effect.count });
      feedback.narrative = '你从佛法中领悟，获得了经文碎片。';
      break;
    case 'xinmo_reduce':
      feedback.statChanges.push({ stat: 'xinmo', change: `-${effect.amount}`, label: '心魔降低' });
      feedback.narrative = '你静心冥想，心魔渐渐平息。';
      break;
    case 'gold':
      feedback.effects.push({ type: 'gold', amount: effect.amount });
      feedback.narrative = `你搜刮到了 ${effect.amount} 金币。`;
      break;
    case 'exp':
      feedback.effects.push({ type: 'exp', amount: effect.amount });
      feedback.narrative = '你磨练武艺，获得了额外经验。';
      break;
    default:
      feedback.narrative = '你做出了选择。';
  }
  
  // 顿悟触发（10%概率）
  if (Math.random() < 0.1) {
    feedback.epiphany = {
      type: 'random_buff',
      desc: '顿悟！',
      effect: { stat: 'all', percent: 5, duration: 3 }
    };
    feedback.narrative += ' 忽然间，你有所顿悟，全属性短暂提升！';
  }
  
  return feedback;
};

// 渲染抉择反馈动画
NDX.LoopEnhance.renderChoiceFeedback = function (feedback, container) {
  if (!container) return;
  
  const feedbackEl = document.createElement('div');
  feedbackEl.className = 'loop-choice-feedback';
  
  let html = `<div class="lcf-title">${feedback.choiceText}</div>`;
  
  // 属性变化
  if (feedback.statChanges.length > 0) {
    html += '<div class="lcf-stats">';
    for (const change of feedback.statChanges) {
      const isPositive = change.change.startsWith('+');
      html += `<div class="lcf-stat ${isPositive ? 'positive' : 'negative'}">
        <span class="lcf-stat-label">${change.label}</span>
        <span class="lcf-stat-change">${change.change}</span>
        ${change.duration ? `<span class="lcf-stat-duration">(${change.duration}场)</span>` : ''}
      </div>`;
    }
    html += '</div>';
  }
  
  // 物品/金币/经验
  if (feedback.effects.length > 0) {
    html += '<div class="lcf-items">';
    for (const eff of feedback.effects) {
      if (eff.type === 'gold') {
        html += `<div class="lcf-item">💰 +${eff.amount} 金币</div>`;
      } else if (eff.type === 'exp') {
        html += `<div class="lcf-item">✨ +${eff.amount} 经验</div>`;
      } else if (eff.type === 'item') {
        html += `<div class="lcf-item">📜 ${eff.name} ×${eff.count}</div>`;
      }
    }
    html += '</div>';
  }
  
  // 顿悟
  if (feedback.epiphany) {
    html += `<div class="lcf-epiphany">
      <span class="lcf-epiphany-label">🌟 ${feedback.epiphany.desc}</span>
      <span class="lcf-epiphany-effect">全属性 +${feedback.epiphany.effect.percent}% (${feedback.epiphany.effect.duration}场)</span>
    </div>`;
  }
  
  // 叙事文本
  html += `<div class="lcf-narrative">${feedback.narrative}</div>`;
  
  feedbackEl.innerHTML = html;
  container.appendChild(feedbackEl);
  
  // 动画
  setTimeout(() => feedbackEl.classList.add('show'), 50);
  setTimeout(() => {
    feedbackEl.classList.remove('show');
    setTimeout(() => feedbackEl.remove(), 500);
  }, 3000);
};

// =============================================================
// 3. 成长→再战斗期待感
// 每次抉择后显示"下一场战斗预告"，激发期待
// =============================================================

NDX.LoopEnhance.growthToBattle = function (nextBattle, currentBuild) {
  const battle = nextBattle || {};
  const build = currentBuild || {};
  
  return {
    showPreview: true,
    preview: {
      enemyName: battle.enemyName || '未知敌人',
      enemyIcon: battle.enemyIcon || '👹',
      enemyLevel: battle.enemyLevel || 1,
      enemyType: battle.enemyType || 'normal', // normal/elite/boss
      recommendedStats: NDX.LoopEnhance.getRecommendedStats(battle, build),
      newItems: build.newItems || [],
      dangerLevel: NDX.LoopEnhance.calculateDangerLevel(battle, build)
    }
  };
};

// 获取推荐属性
NDX.LoopEnhance.getRecommendedStats = function (battle, build) {
  const recommendations = [];
  
  if (battle.enemyType === 'boss') {
    recommendations.push({ stat: 'hp', label: '气血', recommended: build.maxHp * 0.8, current: build.hp, status: build.hp >= build.maxHp * 0.8 ? 'ok' : 'warning' });
    recommendations.push({ stat: 'def', label: '防御', recommended: 50, current: build.def || 0, status: (build.def || 0) >= 50 ? 'ok' : 'warning' });
  } else if (battle.enemyType === 'elite') {
    recommendations.push({ stat: 'atk', label: '攻击', recommended: 30, current: build.atk || 0, status: (build.atk || 0) >= 30 ? 'ok' : 'warning' });
  }
  
  return recommendations;
};

// 计算危险等级
NDX.LoopEnhance.calculateDangerLevel = function (battle, build) {
  let danger = 1;
  
  if (battle.enemyType === 'boss') danger += 2;
  if (battle.enemyType === 'elite') danger += 1;
  if (build.hp < build.maxHp * 0.3) danger += 1;
  if (build.xinmo > 70) danger += 1;
  
  return Math.min(5, danger);
};

// 渲染战斗预告
NDX.LoopEnhance.renderBattlePreview = function (preview, container) {
  if (!container || !preview) return;
  
  const previewEl = document.createElement('div');
  previewEl.className = 'loop-battle-preview';
  
  const dangerColors = ['#51cf66', '#94d82d', '#ffd43b', '#ff922b', '#ff6b6b'];
  const dangerLabels = ['安全', '轻松', '标准', '困难', '危险'];
  
  let html = `
    <div class="lbp-header">
      <span class="lbp-icon">${preview.enemyIcon}</span>
      <div class="lbp-info">
        <div class="lbp-name">${preview.enemyName}</div>
        <div class="lbp-level">Lv.${preview.enemyLevel} · ${preview.enemyType === 'boss' ? 'BOSS' : preview.enemyType === 'elite' ? '精英' : '普通'}</div>
      </div>
      <div class="lbp-danger" style="color: ${dangerColors[preview.dangerLevel - 1]}">
        ⚠ ${dangerLabels[preview.dangerLevel - 1]}
      </div>
    </div>
  `;
  
  // 推荐属性
  if (preview.recommendedStats.length > 0) {
    html += '<div class="lbp-stats">';
    for (const stat of preview.recommendedStats) {
      html += `<div class="lbp-stat ${stat.status}">
        <span>${stat.label}</span>
        <span>${Math.floor(stat.current)} / ${stat.recommended}</span>
      </div>`;
    }
    html += '</div>';
  }
  
  // 新获得物品
  if (preview.newItems.length > 0) {
    html += '<div class="lbp-new-items"><span class="lbp-new-label">新获得：</span>';
    for (const item of preview.newItems) {
      html += `<span class="lbp-new-item">${item.name}</span>`;
    }
    html += '</div>';
  }
  
  html += '<div class="lbp-hint">点击进入战斗</div>';
  
  previewEl.innerHTML = html;
  container.appendChild(previewEl);
};

// =============================================================
// 4. 循环状态管理
// =============================================================

NDX.LoopEnhance.state = {
  currentLoop: 0,        // 当前循环次数
  battleCount: 0,         // 战斗次数
  choiceCount: 0,         // 抉择次数
  lastBattleResult: null, // 上一场战斗结果
  lastChoice: null,       // 上一次抉择
  comboCount: 0,          // 连击数
  flowState: 'idle'       // idle/battle/choice/growth/preview
};

// 记录战斗开始
NDX.LoopEnhance.recordBattleStart = function () {
  NDX.LoopEnhance.state.flowState = 'battle';
};

// 记录战斗结束
NDX.LoopEnhance.recordBattleEnd = function (result) {
  NDX.LoopEnhance.state.battleCount++;
  NDX.LoopEnhance.state.lastBattleResult = result;
  NDX.LoopEnhance.state.flowState = 'choice';
};

// 记录抉择
NDX.LoopEnhance.recordChoice = function (choice) {
  NDX.LoopEnhance.state.choiceCount++;
  NDX.LoopEnhance.state.lastChoice = choice;
  NDX.LoopEnhance.state.flowState = 'growth';
};

// 记录成长完成
NDX.LoopEnhance.recordGrowthComplete = function () {
  NDX.LoopEnhance.state.currentLoop++;
  NDX.LoopEnhance.state.flowState = 'preview';
};

// 获取循环统计
NDX.LoopEnhance.getLoopStats = function () {
  return {
    loops: NDX.LoopEnhance.state.currentLoop,
    battles: NDX.LoopEnhance.state.battleCount,
    choices: NDX.LoopEnhance.state.choiceCount,
    flowState: NDX.LoopEnhance.state.flowState,
    efficiency: NDX.LoopEnhance.state.battleCount > 0 ? 
      Math.round((NDX.LoopEnhance.state.choiceCount / NDX.LoopEnhance.state.battleCount) * 100) : 0
  };
};

// 重置循环状态（新局开始时）
NDX.LoopEnhance.reset = function () {
  NDX.LoopEnhance.state = {
    currentLoop: 0,
    battleCount: 0,
    choiceCount: 0,
    lastBattleResult: null,
    lastChoice: null,
    comboCount: 0,
    flowState: 'idle'
  };
};

console.log('[LoopEnhance] 多层循环强化系统已加载');
