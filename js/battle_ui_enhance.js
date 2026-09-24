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

// debuff图标映射
NDX.BattleUI.DEBUFF_ICONS = {
  burn: { icon: '🔥', name: '灼烧', color: '#ff6b6b' },
  poison: { icon: '☠️', name: '剧毒', color: '#51cf66' },
  curse: { icon: '💀', name: '咒蚀', color: '#845ef7' },
  bleed: { icon: '🩸', name: '裂伤', color: '#ff8787' },
  stun: { icon: '💫', name: '眩晕', color: '#ffd43b' },
  disarm: { icon: '🔒', name: '缴械', color: '#868e96' },
  blind: { icon: '👁️', name: '致盲', color: '#74c0fc' },
  atkDown: { icon: '⬇️', name: '攻击下降', color: '#ffa94d' },
  defDown: { icon: '🛡️', name: '防御下降', color: '#63e6be' },
  charm: { icon: '💕', name: '魅惑', color: '#f783ac' },
  freeze: { icon: '❄️', name: '冰冻', color: '#4dabf7' }
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
    
    debuffEl.innerHTML = `
      <span>` + info.icon + `</span>
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
