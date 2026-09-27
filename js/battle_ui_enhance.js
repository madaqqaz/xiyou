// =============================================================
// battle_ui_enhance.js - 战斗UI优化模块
// 功能：玩家debuff状态显示、战斗日志、伤害统计
// 加载顺序：battle_feedback.js -> battle_ui_enhance.js
// =============================================================

window.NDX = window.NDX || {};
var NDX = window.NDX;

// =============================================================
// 一、玩家debuff状态显示
// =============================================================

NDX.BattleUI = NDX.BattleUI || {};

// debuff图标映射（优先使用图标图片，emoji作为fallback）
NDX.BattleUI.DEBUFF_ICONS = {
  burn: { icon: '🔥', iconImg: 'img/icons/status/status_burn.webp', name: '灼烧', color: '#ff6b6b' },
  poison: { icon: '☠️', iconImg: 'img/icons/status/status_poison.webp', name: '剧毒', color: '#51cf66' },
  curse: { icon: '💀', name: '咒蚀', color: '#845ef7' },
  bleed: { icon: '🩸', name: '裂伤', color: '#ff8787' },
  stun: { icon: '💫', iconImg: 'img/icons/status/status_stun.webp', name: '眩晕', color: '#ffd43b' },
  disarm: { icon: '🔒', name: '缴械', color: '#868e96' },
  blind: { icon: '👁️', name: '致盲', color: '#74c0fc' },
  atkDown: { icon: '⬇️', name: '攻击下降', color: '#ffa94d' },
  defDown: { icon: '🛡️', name: '防御下降', color: '#63e6be' },
  charm: { icon: '💕', name: '魅惑', color: '#f783ac' },
  freeze: { icon: '❄️', iconImg: 'img/icons/status/status_freeze.webp', name: '冰冻', color: '#4dabf7' },
  paralyze: { icon: '⚡', iconImg: 'img/icons/status/status_paralyze.webp', name: '麻痹', color: '#ffd43b' }
};

// 初始化debuff状态显示容器
NDX.BattleUI.initDebuffDisplay = function() {
  if (document.getElementById('battle-debuff-container')) return;
  
  const container = document.createElement('div');
  container.id = 'battle-debuff-container';
  container.className = 'battle-debuff-container';
  container.style.cssText = `
    position: absolute;
    left: 15%;
    top: 65%;
    display: flex;
    gap: 4px;
    z-index: 100;
    pointer-events: none;
  `;
  
  // 找到战斗容器
  const battleContainer = document.querySelector('.fb-arena, .fightbox, #battle-container');
  if (battleContainer) {
    battleContainer.appendChild(container);
  } else {
    document.body.appendChild(container);
  }
};

// 更新debuff状态显示
NDX.BattleUI.updateDebuffDisplay = function(debuffs, dots) {
  this.initDebuffDisplay();
  const container = document.getElementById('battle-debuff-container');
  if (!container) return;
  
  container.innerHTML = '';
  
  // 合并debuffs和dots
  const allDebuffs = Object.assign({}, debuffs || {});
  
  // DOT状态也显示
  if (dots && Array.isArray(dots)) {
    dots.forEach(dot => {
      if (dot.type && dot.turns > 0) {
        allDebuffs[dot.type] = Math.max(allDebuffs[dot.type] || 0, dot.turns);
      }
    });
  }
  
  // 显示每个debuff
  Object.keys(allDebuffs).forEach(type => {
    const turns = allDebuffs[type];
    if (turns <= 0) return;
    
    const info = this.DEBUFF_ICONS[type] || { icon: '❓', name: type, color: '#ccc' };
    
    const debuffEl = document.createElement('div');
    debuffEl.className = 'battle-debuff-item';
    debuffEl.title = info.name + '（剩余' + turns + '回合）';
    debuffEl.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      background: rgba(0, 0, 0, 0.7);
      border: 1px solid ` + info.color + `;
      border-radius: 4px;
      font-size: 14px;
      position: relative;
    `;
    
    // 优先使用图标图片，emoji作为fallback
    var iconHtml = info.iconImg ? '<img src="' + info.iconImg + '" style="width:20px;height:20px;object-fit:contain;" />' : '<span>' + info.icon + '</span>';
    debuffEl.innerHTML = `
      ` + iconHtml + `
      <span style="
        position: absolute;
        bottom: -2px;
        right: -2px;
        background: ` + info.color + `;
        color: #000;
        font-size: 10px;
        font-weight: bold;
        width: 14px;
        height: 14px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
      ">` + turns + `</span>
    `;
    
    container.appendChild(debuffEl);
  });
};

// =============================================================
// 二、战斗日志
// =============================================================

NDX.BattleUI.battleLog = [];
NDX.BattleUI.maxLogEntries = 50;

// 添加战斗日志
NDX.BattleUI.addLog = function(text, type) {
  const entry = {
    text: text,
    type: type || 'normal',
    time: Date.now()
  };
  
  this.battleLog.push(entry);
  
  // 限制日志数量
  if (this.battleLog.length > this.maxLogEntries) {
    this.battleLog.shift();
  }
  
  // 更新日志显示
  this.updateLogDisplay();
};

// 初始化战斗日志容器
NDX.BattleUI.initLogDisplay = function() {
  if (document.getElementById('battle-log-container')) return;
  
  const container = document.createElement('div');
  container.id = 'battle-log-container';
  container.className = 'battle-log-container';
  container.style.cssText = `
    position: absolute;
    right: 2%;
    top: 15%;
    width: 180px;
    max-height: 200px;
    background: rgba(0, 0, 0, 0.75);
    border: 1px solid rgba(255, 215, 0, 0.3);
    border-radius: 6px;
    padding: 8px;
    overflow-y: auto;
    z-index: 100;
    font-size: 11px;
    line-height: 1.4;
    color: #ddd;
    pointer-events: none;
  `;
  
  const title = document.createElement('div');
  title.style.cssText = 'color: #ffd700; font-weight: bold; margin-bottom: 6px; border-bottom: 1px solid rgba(255,215,0,0.3); padding-bottom: 4px;';
  title.textContent = '战斗日志';
  container.appendChild(title);
  
  const logContent = document.createElement('div');
  logContent.id = 'battle-log-content';
  logContent.style.cssText = 'display: flex; flex-direction: column; gap: 2px;';
  container.appendChild(logContent);
  
  // 找到战斗容器
  const battleContainer = document.querySelector('.fb-arena, .fightbox, #battle-container');
  if (battleContainer) {
    battleContainer.appendChild(container);
  } else {
    document.body.appendChild(container);
  }
};

// 更新战斗日志显示
NDX.BattleUI.updateLogDisplay = function() {
  this.initLogDisplay();
  const content = document.getElementById('battle-log-content');
  if (!content) return;
  
  // 只显示最近的10条
  const recentLogs = this.battleLog.slice(-10);
  
  content.innerHTML = '';
  recentLogs.forEach(entry => {
    const logEl = document.createElement('div');
    let color = '#ddd';
    if (entry.type === 'damage') color = '#ff8787';
    else if (entry.type === 'heal') color = '#51cf66';
    else if (entry.type === 'buff') color = '#74c0fc';
    else if (entry.type === 'debuff') color = '#ffa94d';
    else if (entry.type === 'crit') color = '#ffd700';
    else if (entry.type === 'skill') color = '#da77f2';
    
    logEl.style.cssText = 'color: ' + color + ';';
    logEl.textContent = entry.text;
    content.appendChild(logEl);
  });
  
  // 滚动到底部
  content.scrollTop = content.scrollHeight;
};

// 清空战斗日志
NDX.BattleUI.clearLog = function() {
  this.battleLog = [];
  this.updateLogDisplay();
};

// =============================================================
// 三、伤害统计
// =============================================================

NDX.BattleUI.damageStats = {
  playerDamage: 0,
  enemyDamage: 0,
  playerHeal: 0,
  critCount: 0,
  hitCount: 0,
  missCount: 0,
  skillCount: 0,
  startTime: 0
};

// 重置伤害统计
NDX.BattleUI.resetDamageStats = function() {
  this.damageStats = {
    playerDamage: 0,
    enemyDamage: 0,
    playerHeal: 0,
    critCount: 0,
    hitCount: 0,
    missCount: 0,
    skillCount: 0,
    startTime: Date.now()
  };
};

// 记录伤害
NDX.BattleUI.recordDamage = function(source, damage, isCrit) {
  if (source === 'player') {
    this.damageStats.playerDamage += damage;
    this.damageStats.hitCount++;
    if (isCrit) this.damageStats.critCount++;
  } else if (source === 'enemy') {
    this.damageStats.enemyDamage += damage;
  }
};

// 记录治疗
NDX.BattleUI.recordHeal = function(amount) {
  this.damageStats.playerHeal += amount;
};

// 记录闪避
NDX.BattleUI.recordMiss = function() {
  this.damageStats.missCount++;
};

// 记录技能使用
NDX.BattleUI.recordSkill = function() {
  this.damageStats.skillCount++;
};

// 获取伤害统计摘要
NDX.BattleUI.getDamageStatsSummary = function() {
  const stats = this.damageStats;
  const duration = Math.max(1, Math.round((Date.now() - stats.startTime) / 1000));
  const critRate = stats.hitCount > 0 ? Math.round((stats.critCount / stats.hitCount) * 100) : 0;
  
  return {
    playerDamage: stats.playerDamage,
    enemyDamage: stats.enemyDamage,
    playerHeal: stats.playerHeal,
    critRate: critRate,
    dps: Math.round(stats.playerDamage / duration),
    duration: duration,
    hitCount: stats.hitCount,
    missCount: stats.missCount,
    skillCount: stats.skillCount
  };
};

// 显示伤害统计面板
NDX.BattleUI.showDamageStats = function() {
  const summary = this.getDamageStatsSummary();
  
  // 创建统计面板
  let panel = document.getElementById('battle-stats-panel');
  if (!panel) {
    panel = document.createElement('div');
    panel.id = 'battle-stats-panel';
    panel.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(20, 15, 10, 0.95);
      border: 2px solid #ffd700;
      border-radius: 10px;
      padding: 20px 30px;
      z-index: 10000;
      color: #ddd;
      min-width: 300px;
      box-shadow: 0 0 30px rgba(255, 215, 0, 0.3);
    `;
    document.body.appendChild(panel);
  }
  
  panel.innerHTML = `
    <div style="color: #ffd700; font-size: 18px; font-weight: bold; text-align: center; margin-bottom: 15px; border-bottom: 1px solid rgba(255,215,0,0.3); padding-bottom: 10px;">战斗统计</div>
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 13px;">
      <div>玩家伤害：<span style="color: #ff8787;">` + summary.playerDamage + `</span></div>
      <div>承受伤害：<span style="color: #ffa94d;">` + summary.enemyDamage + `</span></div>
      <div>治疗量：<span style="color: #51cf66;">` + summary.playerHeal + `</span></div>
      <div>DPS：<span style="color: #74c0fc;">` + summary.dps + `</span></div>
      <div>暴击率：<span style="color: #ffd700;">` + summary.critRate + `%</span></div>
      <div>战斗时长：<span style="color: #ccc;">` + summary.duration + `秒</span></div>
      <div>命中次数：<span style="color: #ccc;">` + summary.hitCount + `</span></div>
      <div>闪避次数：<span style="color: #ccc;">` + summary.missCount + `</span></div>
    </div>
    <div style="text-align: center; margin-top: 15px;">
      <button onclick="document.getElementById('battle-stats-panel').style.display='none'" style="
        background: linear-gradient(135deg, #8b0000, #5c0000);
        color: #ffd700;
        border: 1px solid #ffd700;
        padding: 6px 20px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 13px;
      ">关闭</button>
    </div>
  `;
  
  panel.style.display = 'block';
};

// =============================================================
// 四、初始化与集成
// =============================================================

// 战斗开始时初始化
NDX.BattleUI.initBattle = function() {
  this.resetDamageStats();
  this.clearLog();
  this.initDebuffDisplay();
  this.initLogDisplay();
  this.addLog('战斗开始！', 'skill');
};

// 战斗结束时显示统计
NDX.BattleUI.endBattle = function(victory) {
  if (victory) {
    this.addLog('战斗胜利！', 'crit');
  } else {
    this.addLog('战斗失败...', 'debuff');
  }
  // 延迟显示统计
  setTimeout(() => this.showDamageStats(), 1000);
};

console.log('[BattleUI] 战斗UI优化模块已加载：debuff状态显示 + 战斗日志 + 伤害统计');


// =============================================================
// 三、异常状态视觉特效
// =============================================================

// 异常状态特效映射
NDX.BattleUI.STATUS_FX = {
  burn: {
    img: 'img/portraits/foe/generic/fx/fx_fire_strip.webp',
    frames: 4,
    className: 'status-fx-burn',
    style: 'position:absolute;top:-20%;left:50%;transform:translateX(-50%);width:80px;height:80px;pointer-events:none;z-index:50;opacity:0.8;'
  },
  poison: {
    img: 'img/fx/debuff/debuff_poison.webp',
    frames: 1,
    className: 'status-fx-poison',
    style: 'position:absolute;top:-10%;left:50%;transform:translateX(-50%);width:60px;height:60px;pointer-events:none;z-index:50;opacity:0.7;'
  },
  freeze: {
    img: 'img/icons/status/status_freeze.webp',
    frames: 1,
    className: 'status-fx-freeze',
    style: 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:50;opacity:0.4;mix-blend-mode:screen;'
  },
  stun: {
    img: 'img/icons/status/status_stun.webp',
    frames: 1,
    className: 'status-fx-stun',
    style: 'position:absolute;top:-30%;left:50%;transform:translateX(-50%);width:40px;height:40px;pointer-events:none;z-index:50;animation:status-spin 1s linear infinite;'
  },
  paralyze: {
    img: 'img/icons/status/status_paralyze.webp',
    frames: 1,
    className: 'status-fx-paralyze',
    style: 'position:absolute;top:-20%;left:50%;transform:translateX(-50%);width:40px;height:40px;pointer-events:none;z-index:50;animation:status-flash 0.5s ease-in-out infinite;'
  },
  buff: {
    img: 'img/fx/buff/buff_aura.webp',
    frames: 1,
    className: 'status-fx-buff',
    style: 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:40;opacity:0.5;mix-blend-mode:screen;'
  }
};

// 添加状态特效CSS动画
NDX.BattleUI.addStatusFxCSS = function() {
  if (document.getElementById('status-fx-css')) return;
  
  const style = document.createElement('style');
  style.id = 'status-fx-css';
  style.textContent = `
    @keyframes status-spin {
      from { transform: translateX(-50%) rotate(0deg); }
      to { transform: translateX(-50%) rotate(360deg); }
    }
    @keyframes status-flash {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.3; }
    }
    @keyframes status-pulse {
      0%, 100% { transform: translateX(-50%) scale(1); }
      50% { transform: translateX(-50%) scale(1.2); }
    }
    .status-fx-container {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 50;
    }
  `;
  document.head.appendChild(style);
};

// 在角色身上显示异常状态特效
NDX.BattleUI.showStatusFx = function(characterEl, statusType) {
  if (!characterEl || !statusType) return;
  
  this.addStatusFxCSS();
  
  const fxInfo = this.STATUS_FX[statusType];
  if (!fxInfo) return;
  
  // 查找或创建特效容器
  let fxContainer = characterEl.querySelector('.status-fx-container');
  if (!fxContainer) {
    fxContainer = document.createElement('div');
    fxContainer.className = 'status-fx-container';
    characterEl.appendChild(fxContainer);
  }
  
  // 检查是否已存在该状态的特效
  const existingFx = fxContainer.querySelector('.' + fxInfo.className);
  if (existingFx) return;
  
  // 创建特效元素
  const fxEl = document.createElement('div');
  fxEl.className = fxInfo.className;
  fxEl.setAttribute('data-status', statusType);
  fxEl.style.cssText = fxInfo.style;
  
  if (fxInfo.frames > 1) {
    // 序列帧动画
    fxEl.style.backgroundImage = 'url(' + fxInfo.img + ')';
    fxEl.style.backgroundSize = (fxInfo.frames * 100) + '% 100%';
    fxEl.style.animation = 'status-fx-play 0.8s steps(' + fxInfo.frames + ') infinite';
  } else {
    // 单帧图片
    fxEl.innerHTML = '<img src="' + fxInfo.img + '" style="width:100%;height:100%;object-fit:contain;" />';
  }
  
  fxContainer.appendChild(fxEl);
};

// 隐藏角色身上的异常状态特效
NDX.BattleUI.hideStatusFx = function(characterEl, statusType) {
  if (!characterEl) return;
  
  const fxContainer = characterEl.querySelector('.status-fx-container');
  if (!fxContainer) return;
  
  if (statusType) {
    // 隐藏指定状态的特效
    const fxEl = fxContainer.querySelector('[data-status="' + statusType + '"]');
    if (fxEl) {
      fxEl.remove();
    }
  } else {
    // 隐藏所有特效
    fxContainer.remove();
  }
};

// 更新角色的所有异常状态特效
NDX.BattleUI.updateCharacterStatusFx = function(characterEl, statuses) {
  if (!characterEl) return;
  
  // 清除所有现有特效
  this.hideStatusFx(characterEl);
  
  // 显示新的特效
  if (statuses && typeof statuses === 'object') {
    Object.keys(statuses).forEach(statusType => {
      if (statuses[statusType] > 0) {
        this.showStatusFx(characterEl, statusType);
      }
    });
  } else if (Array.isArray(statuses)) {
    statuses.forEach(statusType => {
      this.showStatusFx(characterEl, statusType);
    });
  }
};
