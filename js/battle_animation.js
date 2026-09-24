// =============================================================
// battle_animation.js - 战斗动画模块
// 功能：英雄攻击动画、怪物攻击动画、法宝释放动画、受击动画、死亡动画
// 加载顺序：battle_ui_enhance.js -> battle_animation.js
// =============================================================

window.NDX = window.NDX || {};
var NDX = window.NDX;

NDX.BattleAnimation = NDX.BattleAnimation || {};

// =============================================================
// 优化7: 动画优先级系统（避免同一动作触发多个动画冲突）
// =============================================================
NDX.BattleAnimation._currentAnim = { player: null, enemy: null };
NDX.BattleAnimation._animPriority = {
  death: 100,      // 死亡动画最高优先级
  enrage: 90,       // 狂暴动画
  chargeUp: 80,     // 蓄力动画
  treasureCast: 70, // 法宝释放动画
  heroAttack: 60,   // 英雄攻击动画
  enemyAttack: 60,  // 怪物攻击动画
  hitReact: 50,     // 受击动画
  hitFlash: 40,     // 受击闪烁
  idleBreath: 10    // 待机呼吸动画最低优先级
};

// 检查是否可以播放动画（优先级判断）
NDX.BattleAnimation._canPlay = function(target, animName) {
  const current = this._currentAnim[target];
  if (!current) return true;
  const currentPriority = this._animPriority[current] || 0;
  const newPriority = this._animPriority[animName] || 0;
  return newPriority >= currentPriority;
};

// 记录当前播放的动画
NDX.BattleAnimation._setCurrent = function(target, animName) {
  this._currentAnim[target] = animName;
  // 动画结束后清除状态（默认500ms）
  const self = this;
  setTimeout(function() {
    if (self._currentAnim[target] === animName) {
      self._currentAnim[target] = null;
    }
  }, 600);
};

// =============================================================
// 一、CSS动画样式注入
// =============================================================

NDX.BattleAnimation.addStyles = function() {
  if (document.getElementById('battle-animation-css')) return;
  
  const css = document.createElement('style');
  css.id = 'battle-animation-css';
  css.textContent = `
    /* 英雄攻击动画（修复：移除来回滚动，改为自然前冲） */
    @keyframes heroAttack {
      0% { transform: translateX(0) scale(1); }
      15% { transform: translateX(-3px) scale(0.98); }
      50% { transform: translateX(25px) scale(1.08); }
      75% { transform: translateX(8px) scale(1.02); }
      100% { transform: translateX(0) scale(1); }
    }
    
    /* 怪物攻击动画（修复：移除来回滚动，改为自然前冲） */
    @keyframes enemyAttack {
      0% { transform: translateX(0) scale(1); }
      15% { transform: translateX(3px) scale(0.98); }
      50% { transform: translateX(-25px) scale(1.08); }
      75% { transform: translateX(-8px) scale(1.02); }
      100% { transform: translateX(0) scale(1); }
    }
    
    /* 受击动画（修复：减小幅值，避免过度晃动） */
    @keyframes hitReact {
      0% { transform: translateX(0); filter: brightness(1); }
      25% { transform: translateX(-8px); filter: brightness(2) saturate(0); }
      50% { transform: translateX(5px); filter: brightness(1.5); }
      75% { transform: translateX(-2px); filter: brightness(1.2); }
      100% { transform: translateX(0); filter: brightness(1); }
    }
    
    /* 受击闪烁 */
    @keyframes hitFlash {
      0%, 100% { opacity: 1; }
      25%, 75% { opacity: 0.3; }
      50% { opacity: 0.6; }
    }
    
    /* 死亡动画 */
    @keyframes deathAnim {
      0% { transform: scale(1) rotate(0deg); opacity: 1; }
      30% { transform: scale(1.1) rotate(-5deg); opacity: 0.8; }
      60% { transform: scale(0.9) rotate(5deg); opacity: 0.5; }
      100% { transform: scale(0) rotate(15deg); opacity: 0; }
    }
    
    /* 法宝释放动画 */
    @keyframes treasureCast {
      0% { transform: scale(0) rotate(0deg); opacity: 0; }
      30% { transform: scale(1.2) rotate(180deg); opacity: 1; }
      60% { transform: scale(1) rotate(360deg); opacity: 1; }
      100% { transform: scale(1.5) rotate(540deg); opacity: 0; }
    }
    
    /* 法宝飞行动画 */
    @keyframes treasureFly {
      0% { left: 30%; top: 50%; transform: scale(0.5); opacity: 0; }
      20% { opacity: 1; transform: scale(1); }
      80% { left: 70%; top: 50%; transform: scale(1); opacity: 1; }
      100% { left: 70%; top: 50%; transform: scale(1.5); opacity: 0; }
    }
    
    /* 待机呼吸动画 */
    @keyframes idleBreath {
      0%, 100% { transform: scale(1) translateY(0); }
      50% { transform: scale(1.02) translateY(-3px); }
    }
    
    /* 蓄力动画 */
    @keyframes chargeUp {
      0%, 100% { transform: scale(1); filter: brightness(1); }
      50% { transform: scale(1.08); filter: brightness(1.5) drop-shadow(0 0 20px gold); }
    }
    
    /* 狂暴动画 */
    @keyframes enrageAnim {
      0%, 100% { transform: scale(1); filter: hue-rotate(0deg); }
      25% { transform: scale(1.05); filter: hue-rotate(-30deg) brightness(1.2); }
      75% { transform: scale(1.02); filter: hue-rotate(-15deg) brightness(1.1); }
    }
    
    /* 应用动画类 */
    .anim-hero-attack { animation: heroAttack 0.5s ease-out !important; }
    .anim-enemy-attack { animation: enemyAttack 0.5s ease-out !important; }
    .anim-hit-react { animation: hitReact 0.4s ease-out !important; }
    .anim-hit-flash { animation: hitFlash 0.3s ease-out !important; }
    .anim-death { animation: deathAnim 0.8s ease-in forwards !important; }
    .anim-treasure-cast { animation: treasureCast 0.6s ease-out !important; }
    .anim-idle-breath { animation: idleBreath 2s ease-in-out infinite !important; }
    .anim-charge-up { animation: chargeUp 0.8s ease-in-out infinite !important; }
    .anim-enrage { animation: enrageAnim 1s ease-in-out infinite !important; }
  `;
  
  document.head.appendChild(css);
};

// =============================================================
// 二、动画触发函数
// =============================================================

// 获取英雄元素
NDX.BattleAnimation.getHeroElement = function() {
  return document.querySelector('.fb-avatar.you, .hero-portrait, [class*="hero"][class*="avatar"]');
};

// 获取怪物元素
NDX.BattleAnimation.getEnemyElement = function() {
  return document.querySelector('.fb-avatar.foe, .fb-foe-art, .enemy-portrait, [class*="foe"][class*="avatar"]');
};

// 英雄攻击动画（修复：攻击前停止待机动画，避免冲突）
NDX.BattleAnimation.heroAttack = function() {
  this.addStyles();
  const hero = this.getHeroElement();
  if (!hero) return;
  
  // 停止待机动画，避免transform冲突
  hero.classList.remove('anim-idle-breath');
  hero.classList.remove('anim-hero-attack');
  void hero.offsetWidth;
  hero.classList.add('anim-hero-attack');
  
  const self = this;
  setTimeout(() => {
    hero.classList.remove('anim-hero-attack');
    // 强制重置transform，防止动画残留
    hero.style.transform = '';
    // 恢复待机动画
    self.startIdle('player');
  }, 500);
};

// 怪物攻击动画（修复：攻击前停止待机动画，避免冲突）
NDX.BattleAnimation.enemyAttack = function() {
  this.addStyles();
  const enemy = this.getEnemyElement();
  if (!enemy) return;
  
  // 停止待机动画，避免transform冲突
  enemy.classList.remove('anim-idle-breath');
  enemy.classList.remove('anim-enemy-attack');
  void enemy.offsetWidth;
  enemy.classList.add('anim-enemy-attack');
  
  const self = this;
  setTimeout(() => {
    enemy.classList.remove('anim-enemy-attack');
    // 强制重置transform，防止动画残留
    enemy.style.transform = '';
    // 恢复待机动画
    self.startIdle('enemy');
  }, 500);
};

// 受击动画（修复：攻击前停止待机动画，避免冲突）
NDX.BattleAnimation.hitReact = function(target) {
  this.addStyles();
  const el = target === 'player' ? this.getHeroElement() : this.getEnemyElement();
  if (!el) return;
  
  // 停止待机动画，避免transform冲突
  el.classList.remove('anim-idle-breath');
  el.classList.remove('anim-hit-react', 'anim-hit-flash');
  void el.offsetWidth;
  el.classList.add('anim-hit-react', 'anim-hit-flash');
  
  const self = this;
  setTimeout(() => {
    el.classList.remove('anim-hit-react', 'anim-hit-flash');
    // 强制重置transform和filter，防止动画残留
    el.style.transform = '';
    el.style.filter = '';
    // 恢复待机动画
    self.startIdle(target);
  }, 400);
};

// 死亡动画
NDX.BattleAnimation.death = function(target) {
  this.addStyles();
  const el = target === 'player' ? this.getHeroElement() : this.getEnemyElement();
  if (!el) return;
  
  el.classList.add('anim-death');
  
  // 死亡后隐藏
  setTimeout(() => {
    el.style.display = 'none';
    setTimeout(() => {
      el.style.display = '';
      el.classList.remove('anim-death');
    }, 100);
  }, 800);
};

// 法宝释放动画
NDX.BattleAnimation.treasureCast = function(treasureName, treasureIcon) {
  this.addStyles();
  
  // 创建法宝特效元素
  const fx = document.createElement('div');
  fx.className = 'anim-treasure-cast';
  fx.style.cssText = `
    position: absolute;
    left: 30%;
    top: 50%;
    transform: translate(-50%, -50%);
    font-size: 48px;
    z-index: 500;
    pointer-events: none;
    text-shadow: 0 0 20px gold;
  `;
  fx.textContent = treasureIcon || '✨';
  fx.title = treasureName || '';
  
  // 找到战斗容器
  const battleContainer = document.querySelector('.fb-arena, .fightbox, #battle-container');
  if (battleContainer) {
    battleContainer.appendChild(fx);
  } else {
    document.body.appendChild(fx);
  }
  
  setTimeout(() => fx.remove(), 600);
  
  // 同时播放英雄施法动画
  this.heroAttack();
};

// 待机呼吸动画
NDX.BattleAnimation.startIdle = function(target) {
  this.addStyles();
  const el = target === 'player' ? this.getHeroElement() : this.getEnemyElement();
  if (!el) return;
  
  el.classList.add('anim-idle-breath');
};

// 停止待机动画
NDX.BattleAnimation.stopIdle = function(target) {
  const el = target === 'player' ? this.getHeroElement() : this.getEnemyElement();
  if (!el) return;
  
  el.classList.remove('anim-idle-breath');
};

// 蓄力动画
NDX.BattleAnimation.chargeUp = function(target) {
  this.addStyles();
  const el = target === 'player' ? this.getHeroElement() : this.getEnemyElement();
  if (!el) return;
  
  el.classList.add('anim-charge-up');
  
  setTimeout(() => el.classList.remove('anim-charge-up'), 1600);
};

// 狂暴动画
NDX.BattleAnimation.enrage = function(target) {
  this.addStyles();
  const el = target === 'player' ? this.getHeroElement() : this.getEnemyElement();
  if (!el) return;
  
  el.classList.add('anim-enrage');
};

// 停止狂暴动画
NDX.BattleAnimation.stopEnrage = function(target) {
  const el = target === 'player' ? this.getHeroElement() : this.getEnemyElement();
  if (!el) return;
  
  el.classList.remove('anim-enrage');
};

// =============================================================
// 三、初始化
// =============================================================

NDX.BattleAnimation.init = function() {
  this.addStyles();
  // 启动待机动画
  setTimeout(() => {
    this.startIdle('player');
    this.startIdle('enemy');
  }, 500);
};

console.log('[BattleAnimation] 战斗动画模块已加载：英雄/怪物/法宝/受击/死亡动画');
