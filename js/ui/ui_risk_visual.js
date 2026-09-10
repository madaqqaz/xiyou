// =============================================================
// 风险视觉反馈系统（Risk Visual Feedback）
// 对应留存设计优化方案 P2-2：风险·抉择
// 有代价的选择才叫真的选择——让玩家直观感受到风险
// =============================================================

NDX.RiskVisual = NDX.RiskVisual || {};

// =============================================================
// 1. 心魔立绘变暗（Xinmo Darken）
// 心魔值越高，角色立绘越暗
// =============================================================

NDX.RiskVisual.updateHeroDarken = function (xinmoValue, heroElement) {
  if (!heroElement) return;
  const xinmo = Math.max(0, Math.min(100, xinmoValue || 0));
  
  // 心魔0-30：正常
  // 心魔30-60：轻微变暗
  // 心魔60-100：明显变暗+红色边缘
  let brightness = 1;
  let saturate = 1;
  let shadowColor = 'transparent';
  
  if (xinmo > 30 && xinmo <= 60) {
    brightness = 1 - (xinmo - 30) / 100; // 0.7-1.0
    saturate = 1 - (xinmo - 30) / 150; // 0.8-1.0
  } else if (xinmo > 60) {
    brightness = 0.7 - (xinmo - 60) / 200; // 0.5-0.7
    saturate = 0.8 - (xinmo - 60) / 250; // 0.64-0.8
    shadowColor = `rgba(255, 50, 50, ${(xinmo - 60) / 100})`;
  }
  
  heroElement.style.filter = `brightness(${brightness}) saturate(${saturate})`;
  heroElement.style.boxShadow = `0 0 30px ${shadowColor}, inset 0 0 30px ${shadowColor}`;
  heroElement.style.transition = 'filter 0.5s ease, box-shadow 0.5s ease';
};

// =============================================================
// 2. 寿数预警（Life Warning）
// 寿数低于10岁时，屏幕边缘出现"油灯渐暗"特效
// =============================================================

NDX.RiskVisual.updateLifeWarning = function (lifeValue, maxLife) {
  let warningEl = document.getElementById('life-warning-overlay');
  if (!warningEl) {
    warningEl = document.createElement('div');
    warningEl.id = 'life-warning-overlay';
    warningEl.style.cssText = `
      position: fixed;
      top: 0; left: 0;
      width: 100%; height: 100%;
      pointer-events: none;
      z-index: 4000;
      opacity: 0;
      transition: opacity 1s ease;
    `;
    document.body.appendChild(warningEl);
  }
  
  const lifePercent = maxLife > 0 ? (lifeValue / maxLife) * 100 : 100;
  
  if (lifePercent <= 20) {
    // 严重警告：红色脉动边缘
    const intensity = 1 - lifePercent / 20;
    warningEl.style.background = `
      radial-gradient(ellipse at center, transparent 40%, rgba(180, 50, 30, ${intensity * 0.4}) 100%),
      inset 0 0 100px rgba(180, 50, 30, ${intensity * 0.3})
    `;
    warningEl.style.opacity = '1';
    warningEl.style.animation = intensity > 0.5 ? 'lifePulse 1s infinite' : 'none';
  } else if (lifePercent <= 40) {
    // 警告：暗黄色边缘
    const intensity = 1 - (lifePercent - 20) / 20;
    warningEl.style.background = `
      radial-gradient(ellipse at center, transparent 50%, rgba(180, 140, 50, ${intensity * 0.3}) 100%),
      inset 0 0 80px rgba(180, 140, 50, ${intensity * 0.2})
    `;
    warningEl.style.opacity = '1';
    warningEl.style.animation = 'none';
  } else {
    warningEl.style.opacity = '0';
    warningEl.style.animation = 'none';
  }
};

// 寿数警告动画CSS
NDX.RiskVisual.injectLifeWarningCSS = function () {
  if (document.getElementById('life-warning-css')) return;
  const css = document.createElement('style');
  css.id = 'life-warning-css';
  css.textContent = `
    @keyframes lifePulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.6; }
    }
  `;
  document.head.appendChild(css);
};

// =============================================================
// 3. 心魔临门（Xinmo Climax）
// 心魔满100时，全屏变暗+心跳特效
// =============================================================

NDX.RiskVisual.triggerXinmoClimax = function () {
  // 全屏变暗
  let climaxEl = document.getElementById('xinmo-climax-overlay');
  if (!climaxEl) {
    climaxEl = document.createElement('div');
    climaxEl.id = 'xinmo-climax-overlay';
    climaxEl.style.cssText = `
      position: fixed;
      top: 0; left: 0;
      width: 100%; height: 100%;
      pointer-events: none;
      z-index: 4500;
      background: radial-gradient(ellipse at center, rgba(60, 0, 0, 0.3) 0%, rgba(30, 0, 0, 0.7) 100%);
      opacity: 0;
      transition: opacity 0.5s ease;
    `;
    document.body.appendChild(climaxEl);
  }
  
  climaxEl.style.opacity = '1';
  climaxEl.style.animation = 'xinmoHeartbeat 1.5s infinite';
  
  // 心魔临门文字
  let textEl = document.getElementById('xinmo-climax-text');
  if (!textEl) {
    textEl = document.createElement('div');
    textEl.id = 'xinmo-climax-text';
    textEl.style.cssText = `
      position: fixed;
      top: 50%; left: 50%;
      transform: translate(-50%, -50%);
      font-size: 48px;
      font-weight: bold;
      color: #ff3333;
      text-shadow: 0 0 30px rgba(255, 50, 50, 0.8), 0 0 60px rgba(255, 50, 50, 0.4);
      z-index: 4501;
      pointer-events: none;
      opacity: 0;
      animation: xinmoTextPulse 1.5s infinite;
    `;
    textEl.textContent = '心魔临门！';
    document.body.appendChild(textEl);
  }
  
  // 注入心跳动画CSS
  NDX.RiskVisual.injectXinmoCSS();
  
  // 3秒后自动消失（或在心魔降低后消失）
  setTimeout(() => {
    NDX.RiskVisual.removeXinmoClimax();
  }, 5000);
};

// 移除心魔临门效果
NDX.RiskVisual.removeXinmoClimax = function () {
  const climaxEl = document.getElementById('xinmo-climax-overlay');
  const textEl = document.getElementById('xinmo-climax-text');
  if (climaxEl) {
    climaxEl.style.opacity = '0';
    setTimeout(() => climaxEl.remove(), 500);
  }
  if (textEl) {
    textEl.style.opacity = '0';
    setTimeout(() => textEl.remove(), 500);
  }
};

// 心魔动画CSS
NDX.RiskVisual.injectXinmoCSS = function () {
  if (document.getElementById('xinmo-climax-css')) return;
  const css = document.createElement('style');
  css.id = 'xinmo-climax-css';
  css.textContent = `
    @keyframes xinmoHeartbeat {
      0%, 100% { opacity: 0.8; transform: scale(1); }
      15% { opacity: 1; transform: scale(1.02); }
      30% { opacity: 0.85; transform: scale(1); }
      45% { opacity: 1; transform: scale(1.01); }
      60% { opacity: 0.8; transform: scale(1); }
    }
    @keyframes xinmoTextPulse {
      0%, 100% { opacity: 0.8; transform: translate(-50%, -50%) scale(1); }
      50% { opacity: 1; transform: translate(-50%, -50%) scale(1.1); }
    }
  `;
  document.head.appendChild(css);
};

// =============================================================
// 4. 抉择后果可视化（Choice Consequence）
// 选择恶道时，屏幕短暂闪红+角色立绘抖动
// =============================================================

NDX.RiskVisual.choiceConsequence = function (choiceType) {
  // choiceType: 'good' / 'evil' / 'neutral'
  if (choiceType === 'evil') {
    // 恶道：屏幕闪红+立绘抖动
    NDX.RiskVisual.flashScreen('rgba(200, 30, 30, 0.3)', 300);
    NDX.RiskVisual.shakeHero(5, 300);
  } else if (choiceType === 'good') {
    // 善道：屏幕闪金光
    NDX.RiskVisual.flashScreen('rgba(255, 215, 0, 0.2)', 300);
  }
};

// 屏幕闪光
NDX.RiskVisual.flashScreen = function (color, duration) {
  const flash = document.createElement('div');
  flash.style.cssText = `
    position: fixed;
    top: 0; left: 0;
    width: 100%; height: 100%;
    background: ${color};
    pointer-events: none;
    z-index: 4200;
    opacity: 1;
    animation: riskFlashFade ${duration}ms ease-out forwards;
  `;
  document.body.appendChild(flash);
  
  if (!document.getElementById('risk-flash-css')) {
    const css = document.createElement('style');
    css.id = 'risk-flash-css';
    css.textContent = `@keyframes riskFlashFade { from { opacity: 1; } to { opacity: 0; } }`;
    document.head.appendChild(css);
  }
  
  setTimeout(() => flash.remove(), duration + 50);
};

// 角色立绘抖动
NDX.RiskVisual.shakeHero = function (intensity, duration) {
  const heroEl = document.querySelector('.hero-portrait, .hero-sprite, [class*="hero"]');
  if (!heroEl) return;
  
  let startTime = null;
  function shakeFrame(timestamp) {
    if (!startTime) startTime = timestamp;
    const elapsed = timestamp - startTime;
    if (elapsed < duration) {
      const progress = 1 - elapsed / duration;
      const x = (Math.random() - 0.5) * intensity * progress * 2;
      const y = (Math.random() - 0.5) * intensity * progress * 2;
      heroEl.style.transform = `translate(${x}px, ${y}px)`;
      requestAnimationFrame(shakeFrame);
    } else {
      heroEl.style.transform = '';
    }
  }
  requestAnimationFrame(shakeFrame);
};

// =============================================================
// 5. 统一更新入口
// =============================================================

NDX.RiskVisual.update = function (state) {
  // state: { xinmo, life, maxLife, heroElement }
  if (state.heroElement && typeof state.xinmo === 'number') {
    NDX.RiskVisual.updateHeroDarken(state.xinmo, state.heroElement);
  }
  
  if (typeof state.life === 'number' && typeof state.maxLife === 'number') {
    NDX.RiskVisual.updateLifeWarning(state.life, state.maxLife);
  }
  
  if (typeof state.xinmo === 'number' && state.xinmo >= 100) {
    NDX.RiskVisual.triggerXinmoClimax();
  }
};

// 初始化
NDX.RiskVisual.injectLifeWarningCSS();
NDX.RiskVisual.injectXinmoCSS();

console.log('[RiskVisual] 风险视觉反馈系统已加载');
