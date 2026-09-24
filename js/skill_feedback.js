// =============================================================
// skill_feedback.js - 技能反馈优化系统
// 功能：技能名称大字显示、技能属性颜色、技能音效差异化、技能屏幕震动
// 加载顺序：skill_upgrade.js -> skill_feedback.js
// =============================================================

window.NDX = window.NDX || {};
var NDX = window.NDX;

NDX.SkillFeedback = NDX.SkillFeedback || {};

// =============================================================
// 一、技能属性颜色定义
// =============================================================
NDX.SkillFeedback.ELEMENT_COLORS = {
  fire: { primary: '#ff4400', secondary: '#ff8800', glow: 'rgba(255,68,0,0.5)' },
  water: { primary: '#0088ff', secondary: '#00ccff', glow: 'rgba(0,136,255,0.5)' },
  thunder: { primary: '#aa00ff', secondary: '#dd00ff', glow: 'rgba(170,0,255,0.5)' },
  physical: { primary: '#cccccc', secondary: '#ffffff', glow: 'rgba(204,204,204,0.5)' },
  heal: { primary: '#00ff88', secondary: '#88ffaa', glow: 'rgba(0,255,136,0.5)' },
  defense: { primary: '#8888ff', secondary: '#aaaaff', glow: 'rgba(136,136,255,0.5)' },
  curse: { primary: '#880088', secondary: '#aa00aa', glow: 'rgba(136,0,136,0.5)' },
  buff: { primary: '#ffdd00', secondary: '#ffee44', glow: 'rgba(255,221,0,0.5)' },
  neutral: { primary: '#ffffff', secondary: '#dddddd', glow: 'rgba(255,255,255,0.5)' }
};

// =============================================================
// 二、配置
// =============================================================
NDX.SkillFeedback.config = {
  showSkillName: true,       // 是否显示技能名称大字
  showElementColor: true,    // 是否显示技能属性颜色
  showScreenShake: true,      // 是否显示屏幕震动
  skillNameDuration: 1000,   // 技能名称显示时长（毫秒）
  shakeIntensity: {
    normal: 3,
    strong: 6,
    ultimate: 10
  },
  enabled: true               // 是否启用
};

// =============================================================
// 三、核心功能
// =============================================================

// 显示技能释放反馈
NDX.SkillFeedback.showSkillRelease = function(skillName, element, intensity) {
  if (!this.config.enabled) return;
  
  const elemColor = this.ELEMENT_COLORS[element] || this.ELEMENT_COLORS.neutral;
  const shakeIntensity = this.config.shakeIntensity[intensity] || this.config.shakeIntensity.normal;
  
  // 1. 显示技能名称大字
  if (this.config.showSkillName) {
    this._showSkillName(skillName, elemColor);
  }
  
  // 2. 屏幕震动
  if (this.config.showScreenShake) {
    this._screenShake(shakeIntensity);
  }
  
  // 3. 属性颜色闪光
  if (this.config.showElementColor) {
    this._elementFlash(elemColor);
  }
};

// 显示技能名称大字
NDX.SkillFeedback._showSkillName = function(skillName, elemColor) {
  // 移除旧的技能名称
  const oldName = document.getElementById('skill-name-display');
  if (oldName) oldName.remove();
  
  // 创建新的技能名称
  const nameEl = document.createElement('div');
  nameEl.id = 'skill-name-display';
  nameEl.style.cssText = [
    'position: fixed',
    'top: 35%',
    'left: 50%',
    'transform: translateX(-50%)',
    'font-size: 56px',
    'font-weight: bold',
    'color: ' + elemColor.primary,
    'text-shadow: 0 0 20px ' + elemColor.glow + ', 0 0 40px ' + elemColor.secondary + ', 3px 3px 6px #000',
    'z-index: 10001',
    'pointer-events: none',
    'white-space: nowrap',
    'animation: skillNamePopup ' + (this.config.skillNameDuration / 1000) + 's ease-out forwards'
  ].join(';');
  nameEl.textContent = skillName + '！';
  document.body.appendChild(nameEl);
  
  // 自动移除
  setTimeout(function() {
    if (nameEl.parentNode) nameEl.parentNode.removeChild(nameEl);
  }, this.config.skillNameDuration);
};

// 屏幕震动
NDX.SkillFeedback._screenShake = function(intensity) {
  const container = document.querySelector('.fb-arena, .fightbox, #battle-container, body');
  if (!container) return;
  
  container.style.animation = 'none';
  container.offsetHeight; // 触发重排
  container.style.animation = 'screenShake 0.3s ease-out';
  container.style.setProperty('--shake-intensity', intensity + 'px');
  
  setTimeout(function() {
    container.style.animation = '';
  }, 300);
};

// 属性颜色闪光
NDX.SkillFeedback._elementFlash = function(elemColor) {
  // 移除旧的闪光
  const oldFlash = document.getElementById('skill-element-flash');
  if (oldFlash) oldFlash.remove();
  
  // 创建新的闪光
  const flash = document.createElement('div');
  flash.id = 'skill-element-flash';
  flash.style.cssText = [
    'position: fixed',
    'top: 0',
    'left: 0',
    'width: 100%',
    'height: 100%',
    'background: radial-gradient(circle, ' + elemColor.glow + ' 0%, transparent 70%)',
    'z-index: 9997',
    'pointer-events: none',
    'animation: elementFlash 0.5s ease-out forwards'
  ].join(';');
  document.body.appendChild(flash);
  
  setTimeout(function() {
    if (flash.parentNode) flash.parentNode.removeChild(flash);
  }, 500);
};

// 显示技能命中效果
NDX.SkillFeedback.showSkillHit = function(targetX, targetY, element, damage, isCrit) {
  if (!this.config.enabled) return;
  
  const elemColor = this.ELEMENT_COLORS[element] || this.ELEMENT_COLORS.neutral;
  
  // 创建命中特效
  const hitEffect = document.createElement('div');
  hitEffect.style.cssText = [
    'position: fixed',
    'left: ' + targetX + '%',
    'top: ' + targetY + '%',
    'transform: translate(-50%, -50%)',
    'width: 100px',
    'height: 100px',
    'border-radius: 50%',
    'background: radial-gradient(circle, ' + elemColor.secondary + ' 0%, ' + elemColor.primary + ' 50%, transparent 70%)',
    'z-index: 9998',
    'pointer-events: none',
    'animation: skillHitExplode 0.6s ease-out forwards'
  ].join(';');
  document.body.appendChild(hitEffect);
  
  // 显示伤害数字
  const damageText = document.createElement('div');
  damageText.style.cssText = [
    'position: fixed',
    'left: ' + targetX + '%',
    'top: ' + (targetY - 10) + '%',
    'transform: translateX(-50%)',
    'font-size: ' + (isCrit ? 48 : 32) + 'px',
    'font-weight: bold',
    'color: ' + (isCrit ? '#ff0000' : elemColor.primary),
    'text-shadow: 2px 2px 4px #000, 0 0 10px ' + elemColor.glow,
    'z-index: 10000',
    'pointer-events: none',
    'animation: damageFloat 1s ease-out forwards'
  ].join(';');
  damageText.textContent = (isCrit ? '暴击 ' : '') + damage;
  document.body.appendChild(damageText);
  
  // 自动移除
  setTimeout(function() {
    if (hitEffect.parentNode) hitEffect.parentNode.removeChild(hitEffect);
    if (damageText.parentNode) damageText.parentNode.removeChild(damageText);
  }, 1000);
};

// 添加CSS动画
NDX.SkillFeedback.addStyles = function() {
  if (document.getElementById('skill-feedback-css')) return;
  
  const css = document.createElement('style');
  css.id = 'skill-feedback-css';
  css.textContent = `
    @keyframes skillNamePopup {
      0% { transform: translateX(-50%) scale(0.3); opacity: 0; }
      20% { transform: translateX(-50%) scale(1.3); opacity: 1; }
      80% { transform: translateX(-50%) scale(1); opacity: 1; }
      100% { transform: translateX(-50%) scale(1.1) translateY(-30px); opacity: 0; }
    }
    @keyframes screenShake {
      0%, 100% { transform: translate(0, 0); }
      10% { transform: translate(calc(var(--shake-intensity, 5px) * -1), calc(var(--shake-intensity, 5px) * 0.5)); }
      20% { transform: translate(var(--shake-intensity, 5px), calc(var(--shake-intensity, 5px) * -0.5)); }
      30% { transform: translate(calc(var(--shake-intensity, 5px) * -0.8), var(--shake-intensity, 5px)); }
      40% { transform: translate(var(--shake-intensity, 5px) * 0.8, calc(var(--shake-intensity, 5px) * -0.8)); }
      50% { transform: translate(calc(var(--shake-intensity, 5px) * -0.6), var(--shake-intensity, 5px) * 0.6); }
      60% { transform: translate(var(--shake-intensity, 5px) * 0.6, calc(var(--shake-intensity, 5px) * -0.6)); }
      70% { transform: translate(calc(var(--shake-intensity, 5px) * -0.4), var(--shake-intensity, 5px) * 0.4); }
      80% { transform: translate(var(--shake-intensity, 5px) * 0.4, calc(var(--shake-intensity, 5px) * -0.4)); }
      90% { transform: translate(calc(var(--shake-intensity, 5px) * -0.2), var(--shake-intensity, 5px) * 0.2); }
    }
    @keyframes elementFlash {
      0% { opacity: 0; }
      30% { opacity: 1; }
      100% { opacity: 0; }
    }
    @keyframes skillHitExplode {
      0% { transform: translate(-50%, -50%) scale(0.3); opacity: 1; }
      50% { transform: translate(-50%, -50%) scale(1.5); opacity: 0.8; }
      100% { transform: translate(-50%, -50%) scale(2); opacity: 0; }
    }
    @keyframes damageFloat {
      0% { transform: translateX(-50%) translateY(0); opacity: 1; }
      100% { transform: translateX(-50%) translateY(-80px); opacity: 0; }
    }
  `;
  document.head.appendChild(css);
};

// 初始化
try {
  NDX.SkillFeedback.addStyles();
} catch (e) {
  console.warn('[SkillFeedback] 初始化失败:', e);
}
