// =============================================================
// skill_timing.js - 技能释放前摇/后摇系统
// 功能：技能前摇、后摇、技能取消、技能插队
// 加载顺序：skill_build.js -> skill_timing.js
// =============================================================

window.NDX = window.NDX || {};
var NDX = window.NDX;

NDX.SkillTiming = NDX.SkillTiming || {};

// =============================================================
// 一、配置
// =============================================================
NDX.SkillTiming.config = {
  defaultCastTime: 300,      // 默认前摇时间（毫秒）
  defaultRecoveryTime: 200,  // 默认后摇时间（毫秒）
  cancelCostMomentum: 1,     // 取消技能消耗的气势
  enableCastTime: true,      // 是否启用前摇
  enableRecoveryTime: true,  // 是否启用后摇
  enabled: true               // 是否启用
};

// =============================================================
// 二、状态
// =============================================================
NDX.SkillTiming._state = {
  isCasting: false,       // 是否正在前摇
  castingSkill: null,     // 正在释放的技能
  castStartTime: 0,       // 前摇开始时间
  isRecovering: false,    // 是否正在后摇
  recoveringSkill: null,  // 后摇的技能
  recoveryStartTime: 0    // 后摇开始时间
};

// =============================================================
// 三、核心功能
// =============================================================

// 开始技能前摇
NDX.SkillTiming.startCast = function(skillName, castTime) {
  if (!this.config.enabled || !this.config.enableCastTime) return true;
  
  this._state.isCasting = true;
  this._state.castingSkill = skillName;
  this._state.castStartTime = Date.now();
  
  // 显示前摇动画
  this._showCastAnimation(skillName);
  
  return true;
};

// 完成技能前摇（释放技能）
NDX.SkillTiming.completeCast = function() {
  if (!this._state.isCasting) return false;
  
  const skill = this._state.castingSkill;
  this._state.isCasting = false;
  this._state.castingSkill = null;
  
  // 开始后摇
  if (this.config.enableRecoveryTime) {
    this._state.isRecovering = true;
    this._state.recoveringSkill = skill;
    this._state.recoveryStartTime = Date.now();
    
    // 后摇结束后自动清除
    const self = this;
    setTimeout(function() {
      self._state.isRecovering = false;
      self._state.recoveringSkill = null;
    }, this.config.defaultRecoveryTime);
  }
  
  return true;
};

// 取消技能前摇
NDX.SkillTiming.cancelCast = function() {
  if (!this._state.isCasting) return false;
  
  // 消耗气势
  if (NDX.game && NDX.game.state && NDX.game.state.momentum != null) {
    NDX.game.state.momentum = Math.max(0, NDX.game.state.momentum - this.config.cancelCostMomentum);
  }
  
  this._state.isCasting = false;
  this._state.castingSkill = null;
  
  // 显示取消动画
  this._showCancelAnimation();
  
  return true;
};

// 检查是否可以释放技能（不在前摇/后摇中）
NDX.SkillTiming.canCast = function() {
  if (!this.config.enabled) return true;
  return !this._state.isCasting && !this._state.isRecovering;
};

// 检查是否正在前摇（可以被受击决策插队）
NDX.SkillTiming.isCasting = function() {
  return this._state.isCasting;
};

// 受击决策插队（打断前摇）
NDX.SkillTiming.interruptCast = function() {
  if (!this._state.isCasting) return false;
  
  this._state.isCasting = false;
  this._state.castingSkill = null;
  
  // 显示被打断动画
  this._showInterruptAnimation();
  
  return true;
};

// 获取前摇进度（0-1）
NDX.SkillTiming.getCastProgress = function() {
  if (!this._state.isCasting) return 0;
  const elapsed = Date.now() - this._state.castStartTime;
  return Math.min(1, elapsed / this.config.defaultCastTime);
};

// 重置状态
NDX.SkillTiming.reset = function() {
  this._state.isCasting = false;
  this._state.castingSkill = null;
  this._state.isRecovering = false;
  this._state.recoveringSkill = null;
};

// =============================================================
// 四、动画显示
// =============================================================

// 显示前摇动画
NDX.SkillTiming._showCastAnimation = function(skillName) {
  // 创建前摇进度条
  let castBar = document.getElementById('skill-cast-bar');
  if (!castBar) {
    castBar = document.createElement('div');
    castBar.id = 'skill-cast-bar';
    castBar.style.cssText = [
      'position: fixed',
      'top: 60%',
      'left: 50%',
      'transform: translateX(-50%)',
      'width: 200px',
      'height: 8px',
      'background: rgba(0,0,0,0.5)',
      'border: 1px solid #ffd700',
      'border-radius: 4px',
      'overflow: hidden',
      'z-index: 9999',
      'pointer-events: none'
    ].join(';');
    
    const fill = document.createElement('div');
    fill.id = 'skill-cast-fill';
    fill.style.cssText = [
      'width: 0%',
      'height: 100%',
      'background: linear-gradient(90deg, #ffd700, #ff6600)',
      'transition: width 0.05s linear'
    ].join(';');
    castBar.appendChild(fill);
    
    const label = document.createElement('div');
    label.id = 'skill-cast-label';
    label.style.cssText = [
      'position: absolute',
      'top: -20px',
      'left: 50%',
      'transform: translateX(-50%)',
      'font-size: 14px',
      'color: #ffd700',
      'white-space: nowrap',
      'text-shadow: 1px 1px 2px #000'
    ].join(';');
    castBar.appendChild(label);
    
    document.body.appendChild(castBar);
  }
  
  document.getElementById('skill-cast-label').textContent = '正在释放：' + skillName;
  document.getElementById('skill-cast-fill').style.width = '0%';
  castBar.style.display = 'block';
  
  // 动画进度
  const self = this;
  const startTime = Date.now();
  const animate = function() {
    if (!self._state.isCasting || self._state.castingSkill !== skillName) {
      castBar.style.display = 'none';
      return;
    }
    const progress = Math.min(100, (Date.now() - startTime) / self.config.defaultCastTime * 100);
    document.getElementById('skill-cast-fill').style.width = progress + '%';
    if (progress < 100) {
      requestAnimationFrame(animate);
    }
  };
  requestAnimationFrame(animate);
};

// 显示取消动画
NDX.SkillTiming._showCancelAnimation = function() {
  const castBar = document.getElementById('skill-cast-bar');
  if (castBar) castBar.style.display = 'none';
  
  // 显示取消文字
  const cancelText = document.createElement('div');
  cancelText.style.cssText = [
    'position: fixed',
    'top: 60%',
    'left: 50%',
    'transform: translateX(-50%)',
    'font-size: 24px',
    'color: #ff4444',
    'text-shadow: 2px 2px 4px #000',
    'z-index: 10000',
    'pointer-events: none',
    'animation: cancelPopup 0.5s ease-out forwards'
  ].join(';');
  cancelText.textContent = '技能已取消';
  document.body.appendChild(cancelText);
  
  setTimeout(function() {
    if (cancelText.parentNode) cancelText.parentNode.removeChild(cancelText);
  }, 500);
};

// 显示被打断动画
NDX.SkillTiming._showInterruptAnimation = function() {
  const castBar = document.getElementById('skill-cast-bar');
  if (castBar) castBar.style.display = 'none';
  
  // 显示被打断文字
  const interruptText = document.createElement('div');
  interruptText.style.cssText = [
    'position: fixed',
    'top: 60%',
    'left: 50%',
    'transform: translateX(-50%)',
    'font-size: 24px',
    'color: #ff0000',
    'text-shadow: 2px 2px 4px #000',
    'z-index: 10000',
    'pointer-events: none',
    'animation: interruptPopup 0.5s ease-out forwards'
  ].join(';');
  interruptText.textContent = '技能被打断！';
  document.body.appendChild(interruptText);
  
  setTimeout(function() {
    if (interruptText.parentNode) interruptText.parentNode.removeChild(interruptText);
  }, 500);
};

// 添加CSS动画
if (!document.getElementById('timing-animation-css')) {
  const css = document.createElement('style');
  css.id = 'timing-animation-css';
  css.textContent = `
    @keyframes cancelPopup {
      0% { transform: translateX(-50%) scale(1); opacity: 1; }
      100% { transform: translateX(-50%) scale(1.5); opacity: 0; }
    }
    @keyframes interruptPopup {
      0% { transform: translateX(-50%) scale(1); opacity: 1; }
      50% { transform: translateX(-50%) scale(1.3); }
      100% { transform: translateX(-50%) scale(0.8); opacity: 0; }
    }
  `;
  document.head.appendChild(css);
}
