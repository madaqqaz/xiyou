// =============================================================
// 战斗反馈特效系统（Battle FX System）
// 对应留存设计优化方案 P1-1：变量奖励·随机性
// 变率强化——不知道什么时候中，反而最上瘾
// =============================================================

NDX.BattleFX = NDX.BattleFX || {};

// 特效层容器
NDX.BattleFX.container = null;

// 初始化特效层
NDX.BattleFX.init = function () {
  if (document.getElementById('battle-fx-layer')) return;
  const layer = document.createElement('div');
  layer.id = 'battle-fx-layer';
  layer.className = 'battle-fx-layer';
  layer.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:5000;overflow:hidden;';
  document.body.appendChild(layer);
  NDX.BattleFX.container = layer;
};

// 移除特效层
NDX.BattleFX.destroy = function () {
  if (NDX.BattleFX.container) {
    NDX.BattleFX.container.remove();
    NDX.BattleFX.container = null;
  }
};

// =============================================================
// 1. 暴击反馈（Crit Feedback）
// 全屏闪光+震屏+大字"暴击！"
// =============================================================

NDX.BattleFX.crit = function (options) {
  NDX.BattleFX.init();
  const opts = options || {};
  const damage = opts.damage || 0;
  const isHero = opts.isHero !== false;
  
  // 全屏闪光
  NDX.BattleFX.flash({
    color: isHero ? 'rgba(255, 200, 50, 0.3)' : 'rgba(255, 80, 80, 0.3)',
    duration: 300
  });
  
  // 震屏
  NDX.BattleFX.shake({
    intensity: 8,
    duration: 400
  });
  
  // 大字"暴击！"
  const critText = document.createElement('div');
  critText.className = 'fx-crit-text';
  critText.innerHTML = `<span class="fx-crit-label">暴击！</span><span class="fx-crit-damage">${damage}</span>`;
  critText.style.cssText = `
    position: absolute;
    top: 40%;
    left: 50%;
    transform: translate(-50%, -50%) scale(0);
    font-size: 48px;
    font-weight: bold;
    color: #ffd700;
    text-shadow: 0 0 20px rgba(255, 215, 0, 0.8), 0 0 40px rgba(255, 215, 0, 0.4);
    z-index: 5001;
    animation: fxCritPop 0.8s ease-out forwards;
    pointer-events: none;
  `;
  NDX.BattleFX.container.appendChild(critText);
  
  // 粒子爆散
  for (let i = 0; i < 12; i++) {
    NDX.BattleFX.particle({
      x: 50,
      y: 40,
      color: '#ffd700',
      size: 4 + Math.random() * 6,
      angle: (i / 12) * Math.PI * 2,
      speed: 100 + Math.random() * 100,
      duration: 600 + Math.random() * 400
    });
  }
  
  setTimeout(() => critText.remove(), 900);
};

// =============================================================
// 2. 掉落仪式感（Loot Ritual）
// 金光迸射特效+品质分级
// =============================================================

NDX.BattleFX.loot = function (options) {
  NDX.BattleFX.init();
  const opts = options || {};
  const quality = opts.quality || 'white'; // white/blue/gold/red
  const itemName = opts.name || '物品';
  const x = opts.x || 50;
  const y = opts.y || 50;
  
  const qualityColors = {
    white: { main: '#e0e0e0', glow: 'rgba(224, 224, 224, 0.5)', label: '普通' },
    blue: { main: '#4a90d9', glow: 'rgba(74, 144, 217, 0.6)', label: '稀有' },
    gold: { main: '#ffd700', glow: 'rgba(255, 215, 0, 0.7)', label: '史诗' },
    red: { main: '#ff4444', glow: 'rgba(255, 68, 68, 0.8)', label: '传说' }
  };
  
  const qc = qualityColors[quality] || qualityColors.white;
  
  // 金色及以上品质增加全屏闪光
  if (quality === 'gold' || quality === 'red') {
    NDX.BattleFX.flash({
      color: quality === 'red' ? 'rgba(255, 68, 68, 0.2)' : 'rgba(255, 215, 0, 0.2)',
      duration: 500
    });
  }
  
  // 光柱
  const beam = document.createElement('div');
  beam.className = 'fx-loot-beam';
  beam.style.cssText = `
    position: absolute;
    left: ${x}%;
    top: ${y - 30}%;
    width: 4px;
    height: 0;
    background: linear-gradient(to top, ${qc.main}, transparent);
    box-shadow: 0 0 20px ${qc.glow};
    transform: translateX(-50%);
    animation: fxBeamRise 0.8s ease-out forwards;
    pointer-events: none;
  `;
  NDX.BattleFX.container.appendChild(beam);
  
  // 物品名称弹出
  const lootText = document.createElement('div');
  lootText.className = 'fx-loot-text';
  lootText.innerHTML = `<span class="fx-loot-quality" style="color:${qc.main}">【${qc.label}】</span><span class="fx-loot-name">${itemName}</span>`;
  lootText.style.cssText = `
    position: absolute;
    left: ${x}%;
    top: ${y}%;
    transform: translate(-50%, -50%) scale(0);
    font-size: 20px;
    font-weight: bold;
    color: ${qc.main};
    text-shadow: 0 0 10px ${qc.glow};
    background: rgba(0, 0, 0, 0.7);
    padding: 8px 20px;
    border-radius: 8px;
    border: 2px solid ${qc.main};
    animation: fxLootPop 1.2s ease-out forwards;
    pointer-events: none;
    white-space: nowrap;
  `;
  NDX.BattleFX.container.appendChild(lootText);
  
  // 粒子环绕
  for (let i = 0; i < 8; i++) {
    NDX.BattleFX.particle({
      x: x,
      y: y,
      color: qc.main,
      size: 3 + Math.random() * 4,
      angle: (i / 8) * Math.PI * 2,
      speed: 60 + Math.random() * 60,
      duration: 800 + Math.random() * 400
    });
  }
  
  setTimeout(() => {
    beam.remove();
    lootText.remove();
  }, 1500);
};

// =============================================================
// 3. 连击显示（Combo Display）
// =============================================================

NDX.BattleFX.combo = function (count) {
  if (count < 2) return;
  NDX.BattleFX.init();
  
  // 移除旧的连击显示
  const oldCombo = document.querySelector('.fx-combo');
  if (oldCombo) oldCombo.remove();
  
  const combo = document.createElement('div');
  combo.className = 'fx-combo';
  combo.innerHTML = `<span class="fx-combo-count">${count}</span><span class="fx-combo-label">连击！</span>`;
  combo.style.cssText = `
    position: absolute;
    top: 25%;
    right: 15%;
    font-size: 32px;
    font-weight: bold;
    color: #ff8c00;
    text-shadow: 0 0 15px rgba(255, 140, 0, 0.7);
    animation: fxComboPop 0.3s ease-out;
    pointer-events: none;
  `;
  NDX.BattleFX.container.appendChild(combo);
  
  clearTimeout(NDX.BattleFX._comboTimer);
  NDX.BattleFX._comboTimer = setTimeout(() => combo.remove(), 1500);
};

// =============================================================
// 4. 基础特效函数
// =============================================================

// 全屏闪光
NDX.BattleFX.flash = function (options) {
  NDX.BattleFX.init();
  const opts = options || {};
  const flash = document.createElement('div');
  flash.className = 'fx-flash';
  flash.style.cssText = `
    position: absolute;
    top: 0; left: 0;
    width: 100%; height: 100%;
    background: ${opts.color || 'rgba(255, 255, 255, 0.3)'};
    opacity: 1;
    animation: fxFlashFade ${opts.duration || 300}ms ease-out forwards;
    pointer-events: none;
  `;
  NDX.BattleFX.container.appendChild(flash);
  setTimeout(() => flash.remove(), (opts.duration || 300) + 50);
};

// 震屏
NDX.BattleFX.shake = function (options) {
  const opts = options || {};
  const intensity = opts.intensity || 5;
  const duration = opts.duration || 300;
  
  const gameContainer = document.getElementById('app') || document.body;
  if (!gameContainer) return;
  
  let startTime = null;
  function shakeFrame(timestamp) {
    if (!startTime) startTime = timestamp;
    const elapsed = timestamp - startTime;
    if (elapsed < duration) {
      const progress = 1 - elapsed / duration;
      const x = (Math.random() - 0.5) * intensity * progress * 2;
      const y = (Math.random() - 0.5) * intensity * progress * 2;
      gameContainer.style.transform = `translate(${x}px, ${y}px)`;
      requestAnimationFrame(shakeFrame);
    } else {
      gameContainer.style.transform = '';
    }
  }
  requestAnimationFrame(shakeFrame);
};

// 粒子
NDX.BattleFX.particle = function (options) {
  NDX.BattleFX.init();
  const opts = options || {};
  const particle = document.createElement('div');
  particle.className = 'fx-particle';
  
  const startX = opts.x || 50;
  const startY = opts.y || 50;
  const angle = opts.angle || 0;
  const speed = opts.speed || 50;
  const duration = opts.duration || 500;
  const endX = startX + Math.cos(angle) * speed / 10;
  const endY = startY + Math.sin(angle) * speed / 10;
  
  particle.style.cssText = `
    position: absolute;
    left: ${startX}%;
    top: ${startY}%;
    width: ${opts.size || 4}px;
    height: ${opts.size || 4}px;
    background: ${opts.color || '#fff'};
    border-radius: 50%;
    box-shadow: 0 0 ${opts.size * 2}px ${opts.color || '#fff'};
    transform: translate(-50%, -50%);
    animation: fxParticleMove ${duration}ms ease-out forwards;
    pointer-events: none;
  `;
  
  // 设置终点（通过CSS变量）
  particle.style.setProperty('--end-x', endX + '%');
  particle.style.setProperty('--end-y', endY + '%');
  
  NDX.BattleFX.container.appendChild(particle);
  setTimeout(() => particle.remove(), duration + 50);
};

// =============================================================
// 5. 伤害数字飘字（Damage Number）
// =============================================================

NDX.BattleFX.damageNumber = function (options) {
  NDX.BattleFX.init();
  const opts = options || {};
  const damage = opts.damage || 0;
  const type = opts.type || 'normal'; // normal/crit/heal/miss
  const x = opts.x || 50;
  const y = opts.y || 50;
  const isHero = opts.isHero !== false;
  
  const typeStyles = {
    normal: { color: isHero ? '#ff6b6b' : '#fff', size: 24 },
    crit: { color: '#ffd700', size: 36 },
    heal: { color: '#51cf66', size: 24 },
    miss: { color: '#868e96', size: 20 }
  };
  
  const style = typeStyles[type] || typeStyles.normal;
  
  const dmgNum = document.createElement('div');
  dmgNum.className = 'fx-damage-number';
  dmgNum.textContent = type === 'miss' ? '闪避' : (type === 'heal' ? '+' + damage : '-' + damage);
  dmgNum.style.cssText = `
    position: absolute;
    left: ${x}%;
    top: ${y}%;
    transform: translate(-50%, -50%);
    font-size: ${style.size}px;
    font-weight: bold;
    color: ${style.color};
    text-shadow: 0 0 8px rgba(0, 0, 0, 0.8), 0 2px 4px rgba(0, 0, 0, 0.5);
    animation: fxDmgFloat 1s ease-out forwards;
    pointer-events: none;
    z-index: 5002;
  `;
  NDX.BattleFX.container.appendChild(dmgNum);
  setTimeout(() => dmgNum.remove(), 1100);
};

// =============================================================
// 6. 高潮层特效（Climax Layer）
// 识破/破韧/爆发/终结/Boss大招时触发
// =============================================================

NDX.BattleFX.climax = function (options) {
  NDX.BattleFX.init();
  const opts = options || {};
  const type = opts.type || 'burst'; // burst/break/ultimate/boss
  const text = opts.text || '爆发！';
  
  const typeConfig = {
    burst: { color: '#ff6b6b', label: '气势爆发', duration: 1000 },
    break: { color: '#ffd700', label: '破韧！', duration: 800 },
    ultimate: { color: '#c77dff', label: '终结一击', duration: 1200 },
    boss: { color: '#ff4444', label: 'Boss大招', duration: 1000 }
  };
  
  const config = typeConfig[type] || typeConfig.burst;
  
  // 慢镜效果（通过CSS动画时间缩放）
  document.body.classList.add('fx-slowmo');
  
  // 全屏闪光
  NDX.BattleFX.flash({
    color: config.color.replace(')', ', 0.3)').replace('rgb', 'rgba'),
    duration: config.duration
  });
  
  // 强震屏
  NDX.BattleFX.shake({
    intensity: 12,
    duration: config.duration
  });
  
  // 大字台词
  const climaxText = document.createElement('div');
  climaxText.className = 'fx-climax-text';
  climaxText.innerHTML = `<span class="fx-climax-label">${config.label}</span><span class="fx-climax-sub">${text}</span>`;
  climaxText.style.cssText = `
    position: absolute;
    top: 35%;
    left: 50%;
    transform: translate(-50%, -50%) scale(0);
    font-size: 56px;
    font-weight: bold;
    color: ${config.color};
    text-shadow: 0 0 30px ${config.color}, 0 0 60px ${config.color};
    animation: fxClimaxPop ${config.duration}ms ease-out forwards;
    pointer-events: none;
    z-index: 5003;
    text-align: center;
  `;
  NDX.BattleFX.container.appendChild(climaxText);
  
  // 大量粒子
  for (let i = 0; i < 24; i++) {
    NDX.BattleFX.particle({
      x: 50,
      y: 35,
      color: config.color,
      size: 5 + Math.random() * 8,
      angle: (i / 24) * Math.PI * 2,
      speed: 150 + Math.random() * 150,
      duration: config.duration + Math.random() * 500
    });
  }
  
  setTimeout(() => {
    document.body.classList.remove('fx-slowmo');
    climaxText.remove();
  }, config.duration + 200);
};

// =============================================================
// CSS动画注入
// =============================================================

NDX.BattleFX.injectCSS = function () {
  if (document.getElementById('battle-fx-css')) return;
  const css = document.createElement('style');
  css.id = 'battle-fx-css';
  css.textContent = `
    @keyframes fxCritPop {
      0% { transform: translate(-50%, -50%) scale(0) rotate(-10deg); opacity: 0; }
      30% { transform: translate(-50%, -50%) scale(1.3) rotate(5deg); opacity: 1; }
      50% { transform: translate(-50%, -50%) scale(1) rotate(0deg); }
      100% { transform: translate(-50%, -70%) scale(0.8); opacity: 0; }
    }
    @keyframes fxBeamRise {
      0% { height: 0; opacity: 0; }
      50% { height: 200px; opacity: 1; }
      100% { height: 200px; opacity: 0; }
    }
    @keyframes fxLootPop {
      0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
      30% { transform: translate(-50%, -50%) scale(1.2); opacity: 1; }
      50% { transform: translate(-50%, -50%) scale(1); }
      80% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
      100% { transform: translate(-50%, -80%) scale(0.8); opacity: 0; }
    }
    @keyframes fxComboPop {
      0% { transform: scale(0.5); opacity: 0; }
      50% { transform: scale(1.2); }
      100% { transform: scale(1); opacity: 1; }
    }
    @keyframes fxFlashFade {
      0% { opacity: 1; }
      100% { opacity: 0; }
    }
    @keyframes fxParticleMove {
      0% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
      100% { opacity: 0; transform: translate(calc(-50% + var(--end-x) - 50%), calc(-50% + var(--end-y) - 50%)) scale(0); }
    }
    @keyframes fxDmgFloat {
      0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0; }
      20% { transform: translate(-50%, -60%) scale(1.2); opacity: 1; }
      100% { transform: translate(-50%, -120%) scale(1); opacity: 0; }
    }
    @keyframes fxClimaxPop {
      0% { transform: translate(-50%, -50%) scale(0) rotate(-15deg); opacity: 0; }
      20% { transform: translate(-50%, -50%) scale(1.5) rotate(5deg); opacity: 1; }
      40% { transform: translate(-50%, -50%) scale(1) rotate(0deg); }
      80% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
      100% { transform: translate(-50%, -50%) scale(1.2); opacity: 0; }
    }
    .fx-slowmo * {
      animation-duration: 0.3s !important;
      transition-duration: 0.3s !important;
    }
    .fx-crit-label { display: block; font-size: 32px; }
    .fx-crit-damage { display: block; font-size: 48px; margin-top: 5px; }
    .fx-climax-label { display: block; font-size: 48px; }
    .fx-climax-sub { display: block; font-size: 24px; margin-top: 10px; opacity: 0.9; }
  `;
  document.head.appendChild(css);
};

// 初始化
NDX.BattleFX.injectCSS();

console.log('[BattleFX] 战斗反馈特效系统已加载');
