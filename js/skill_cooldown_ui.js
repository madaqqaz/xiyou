// =============================================================
// skill_cooldown_ui.js - 技能冷却可视化系统
// 功能：冷却进度环、冷却完成提示、冷却加速机制
// 加载顺序：skill_combo.js -> skill_cooldown_ui.js
// =============================================================

window.NDX = window.NDX || {};
var NDX = window.NDX;

NDX.SkillCooldownUI = NDX.SkillCooldownUI || {};

// =============================================================
// 一、配置
// =============================================================
NDX.SkillCooldownUI.config = {
  showProgressRing: true,    // 是否显示冷却进度环
  showReadyGlow: true,       // 冷却完成时是否发光
  showReadyText: true,       // 冷却完成时是否显示"可释放"
  ringColor: '#4a90d9',      // 进度环颜色
  readyColor: '#ffd700',     // 就绪颜色
  enabled: true               // 是否启用
};

// =============================================================
// 二、核心功能
// =============================================================

// 更新法宝冷却显示
NDX.SkillCooldownUI.updateCooldown = function(treasureEl, currentCooldown, maxCooldown) {
  if (!this.config.enabled || !treasureEl) return;
  
  // 移除旧的进度环
  const oldRing = treasureEl.querySelector('.cooldown-ring');
  if (oldRing) oldRing.remove();
  
  if (currentCooldown <= 0) {
    // 冷却完成，显示就绪效果
    if (this.config.showReadyGlow) {
      treasureEl.classList.add('cooldown-ready');
      treasureEl.style.boxShadow = '0 0 15px ' + this.config.readyColor + ', inset 0 0 10px ' + this.config.readyColor;
    }
    if (this.config.showReadyText) {
      let readyText = treasureEl.querySelector('.ready-text');
      if (!readyText) {
        readyText = document.createElement('div');
        readyText.className = 'ready-text';
        readyText.style.cssText = [
          'position: absolute',
          'bottom: -20px',
          'left: 50%',
          'transform: translateX(-50%)',
          'font-size: 12px',
          'color: ' + this.config.readyColor,
          'white-space: nowrap',
          'animation: readyPulse 1s infinite'
        ].join(';');
        readyText.textContent = '可释放';
        treasureEl.appendChild(readyText);
      }
    }
  } else {
    // 冷却中，移除就绪效果
    treasureEl.classList.remove('cooldown-ready');
    treasureEl.style.boxShadow = '';
    const readyText = treasureEl.querySelector('.ready-text');
    if (readyText) readyText.remove();
    
    // 显示冷却进度环
    if (this.config.showProgressRing && maxCooldown > 0) {
      const progress = 1 - (currentCooldown / maxCooldown);
      const ring = document.createElement('div');
      ring.className = 'cooldown-ring';
      ring.style.cssText = [
        'position: absolute',
        'top: -3px',
        'left: -3px',
        'right: -3px',
        'bottom: -3px',
        'border-radius: 50%',
        'border: 3px solid rgba(255,255,255,0.2)',
        'border-top-color: ' + this.config.ringColor,
        'transform: rotate(' + (progress * 360) + 'deg)',
        'transition: transform 0.3s linear',
        'pointer-events: none'
      ].join(';');
      treasureEl.appendChild(ring);
      
      // 显示剩余回合数
      let cdText = treasureEl.querySelector('.cooldown-text');
      if (!cdText) {
        cdText = document.createElement('div');
        cdText.className = 'cooldown-text';
        cdText.style.cssText = [
          'position: absolute',
          'top: 50%',
          'left: 50%',
          'transform: translate(-50%, -50%)',
          'font-size: 18px',
          'font-weight: bold',
          'color: #fff',
          'text-shadow: 1px 1px 2px #000',
          'pointer-events: none'
        ].join(';');
        treasureEl.appendChild(cdText);
      }
      cdText.textContent = currentCooldown;
    }
  }
};

// 添加CSS动画
NDX.SkillCooldownUI.addStyles = function() {
  if (document.getElementById('cooldown-ui-css')) return;
  
  const css = document.createElement('style');
  css.id = 'cooldown-ui-css';
  css.textContent = `
    @keyframes readyPulse {
      0%, 100% { opacity: 1; transform: translateX(-50%) scale(1); }
      50% { opacity: 0.7; transform: translateX(-50%) scale(1.1); }
    }
    .cooldown-ready {
      animation: readyGlow 1.5s infinite;
    }
    @keyframes readyGlow {
      0%, 100% { filter: brightness(1); }
      50% { filter: brightness(1.3); }
    }
  `;
  document.head.appendChild(css);
};

// 初始化
try {
  NDX.SkillCooldownUI.addStyles();
} catch (e) {
  console.warn('[SkillCooldownUI] 初始化失败:', e);
}
