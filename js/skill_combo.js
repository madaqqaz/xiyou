// =============================================================
// skill_combo.js - 技能连招系统（Combo Chain）
// 功能：连招计数、时间窗口、连击加成、终结技
// 加载顺序：battle_particle_pool.js -> skill_combo.js
// =============================================================

window.NDX = window.NDX || {};
var NDX = window.NDX;

NDX.SkillCombo = NDX.SkillCombo || {};

// =============================================================
// 一、配置
// =============================================================
NDX.SkillCombo.config = {
  comboWindow: 3000,        // 连招时间窗口（毫秒）
  maxCombo: 99,             // 最大连击数
  comboDamageBonus: [
    { min: 2, max: 4, bonus: 0.1 },    // 2-4连击：+10%伤害
    { min: 5, max: 9, bonus: 0.25 },   // 5-9连击：+25%伤害
    { min: 10, max: 19, bonus: 0.5 },  // 10-19连击：+50%伤害
    { min: 20, max: 99, bonus: 1.0 }   // 20+连击：+100%伤害
  ],
  finisherThreshold: 5,     // 终结技触发阈值（5连击）
  finisherDamageMult: 2.0,  // 终结技伤害倍率
  enabled: true              // 是否启用连招系统
};

// =============================================================
// 二、状态
// =============================================================
NDX.SkillCombo._state = {
  combo: 0,           // 当前连击数
  lastSkillTime: 0,   // 上次释放技能时间
  comboTimer: null,   // 连招计时器
  finisherReady: false // 终结技是否就绪
};

// =============================================================
// 三、核心功能
// =============================================================

// 重置连招
NDX.SkillCombo.reset = function() {
  this._state.combo = 0;
  this._state.lastSkillTime = 0;
  this._state.finisherReady = false;
  if (this._state.comboTimer) {
    clearTimeout(this._state.comboTimer);
    this._state.comboTimer = null;
  }
  this._updateUI();
};

// 增加连击（释放技能时调用）
NDX.SkillCombo.addCombo = function(skillName) {
  if (!this.config.enabled) return 0;
  
  const now = Date.now();
  
  // 检查是否在连招时间窗口内
  if (this._state.combo > 0 && (now - this._state.lastSkillTime) > this.config.comboWindow) {
    // 超时断连，重置
    this.reset();
  }
  
  // 增加连击
  this._state.combo = Math.min(this.config.maxCombo, this._state.combo + 1);
  this._state.lastSkillTime = now;
  
  // 检查是否达到终结技阈值
  if (this._state.combo >= this.config.finisherThreshold) {
    this._state.finisherReady = true;
  }
  
  // 重置连招计时器
  if (this._state.comboTimer) {
    clearTimeout(this._state.comboTimer);
  }
  const self = this;
  this._state.comboTimer = setTimeout(function() {
    self.reset();
  }, this.config.comboWindow);
  
  // 显示连招提示
  this._showComboEffect(skillName);
  this._updateUI();
  
  return this._state.combo;
};

// 获取当前连击伤害加成
NDX.SkillCombo.getDamageBonus = function() {
  if (!this.config.enabled || this._state.combo < 2) return 0;
  
  for (let i = 0; i < this.config.comboDamageBonus.length; i++) {
    const tier = this.config.comboDamageBonus[i];
    if (this._state.combo >= tier.min && this._state.combo <= tier.max) {
      return tier.bonus;
    }
  }
  return 0;
};

// 检查终结技是否就绪
NDX.SkillCombo.isFinisherReady = function() {
  return this.config.enabled && this._state.finisherReady;
};

// 释放终结技
NDX.SkillCombo.releaseFinisher = function() {
  if (!this.isFinisherReady()) return null;
  
  const combo = this._state.combo;
  const damageMult = this.config.finisherDamageMult + (combo - this.config.finisherThreshold) * 0.1;
  
  // 显示终结技特效
  this._showFinisherEffect(combo);
  
  // 重置连招
  this.reset();
  
  return {
    combo: combo,
    damageMult: damageMult,
    name: '万法归一'
  };
};

// 获取当前连击数
NDX.SkillCombo.getCombo = function() {
  return this._state.combo;
};

// =============================================================
// 四、UI显示
// =============================================================

// 更新连招UI显示
NDX.SkillCombo._updateUI = function() {
  let comboEl = document.getElementById('skill-combo-display');
  if (!comboEl) {
    comboEl = document.createElement('div');
    comboEl.id = 'skill-combo-display';
    comboEl.style.cssText = [
      'position: fixed',
      'top: 20%',
      'right: 5%',
      'z-index: 9999',
      'text-align: right',
      'pointer-events: none',
      'display: none'
    ].join(';');
    document.body.appendChild(comboEl);
  }
  
  if (this._state.combo >= 2) {
    comboEl.style.display = 'block';
    const bonus = Math.round(this.getDamageBonus() * 100);
    comboEl.innerHTML = `
      <div style="font-size: 48px; font-weight: bold; color: #ffd700; text-shadow: 0 0 10px #ff6600, 2px 2px 4px #000;">
        ${this._state.combo} 连击！
      </div>
      <div style="font-size: 18px; color: #ff9900; text-shadow: 1px 1px 2px #000;">
        伤害 +${bonus}%
      </div>
      ${this._state.finisherReady ? '<div style="font-size: 20px; color: #ff0000; animation: pulse 0.5s infinite;">终结技就绪！</div>' : ''}
    `;
  } else {
    comboEl.style.display = 'none';
  }
};

// 显示连招特效
NDX.SkillCombo._showComboEffect = function(skillName) {
  if (this._state.combo < 2) return;
  
  // 创建连击文字
  const comboText = document.createElement('div');
  comboText.style.cssText = [
    'position: fixed',
    'top: 30%',
    'left: 50%',
    'transform: translateX(-50%)',
    'font-size: ' + (32 + this._state.combo * 2) + 'px',
    'font-weight: bold',
    'color: #ffd700',
    'text-shadow: 0 0 20px #ff6600, 2px 2px 4px #000',
    'z-index: 10000',
    'pointer-events: none',
    'animation: comboPopup 0.8s ease-out forwards'
  ].join(';');
  comboText.textContent = this._state.combo + ' 连击！';
  document.body.appendChild(comboText);
  
  setTimeout(function() {
    if (comboText.parentNode) {
      comboText.parentNode.removeChild(comboText);
    }
  }, 800);
  
  // 添加CSS动画
  if (!document.getElementById('combo-animation-css')) {
    const css = document.createElement('style');
    css.id = 'combo-animation-css';
    css.textContent = `
      @keyframes comboPopup {
        0% { transform: translateX(-50%) scale(0.5); opacity: 0; }
        30% { transform: translateX(-50%) scale(1.3); opacity: 1; }
        100% { transform: translateX(-50%) scale(1) translateY(-50px); opacity: 0; }
      }
      @keyframes pulse {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.7; transform: scale(1.1); }
      }
    `;
    document.head.appendChild(css);
  }
};

// 显示终结技特效
NDX.SkillCombo._showFinisherEffect = function(combo) {
  // 全屏闪光
  const flash = document.createElement('div');
  flash.style.cssText = [
    'position: fixed',
    'top: 0',
    'left: 0',
    'width: 100%',
    'height: 100%',
    'background: radial-gradient(circle, rgba(255,215,0,0.8) 0%, rgba(255,100,0,0.4) 50%, transparent 70%)',
    'z-index: 9998',
    'pointer-events: none',
    'animation: finisherFlash 1s ease-out forwards'
  ].join(';');
  document.body.appendChild(flash);
  
  // 终结技大字
  const finisherText = document.createElement('div');
  finisherText.style.cssText = [
    'position: fixed',
    'top: 40%',
    'left: 50%',
    'transform: translateX(-50%)',
    'font-size: 72px',
    'font-weight: bold',
    'color: #ffd700',
    'text-shadow: 0 0 30px #ff0000, 4px 4px 8px #000',
    'z-index: 10000',
    'pointer-events: none',
    'animation: finisherText 1.5s ease-out forwards'
  ].join(';');
  finisherText.textContent = '万法归一！';
  document.body.appendChild(finisherText);
  
  setTimeout(function() {
    if (flash.parentNode) flash.parentNode.removeChild(flash);
    if (finisherText.parentNode) finisherText.parentNode.removeChild(finisherText);
  }, 1500);
  
  // 添加CSS动画
  if (!document.getElementById('finisher-animation-css')) {
    const css = document.createElement('style');
    css.id = 'finisher-animation-css';
    css.textContent = `
      @keyframes finisherFlash {
        0% { opacity: 0; }
        20% { opacity: 1; }
        100% { opacity: 0; }
      }
      @keyframes finisherText {
        0% { transform: translateX(-50%) scale(0.3); opacity: 0; }
        30% { transform: translateX(-50%) scale(1.5); opacity: 1; }
        70% { transform: translateX(-50%) scale(1); opacity: 1; }
        100% { transform: translateX(-50%) scale(1.2); opacity: 0; }
      }
    `;
    document.head.appendChild(css);
  }
};

// 初始化
try {
  NDX.SkillCombo.reset();
} catch (e) {
  console.warn('[SkillCombo] 初始化失败:', e);
}
