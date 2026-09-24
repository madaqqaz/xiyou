// =============================================================
// battle_feedback.js - 战斗反馈集成系统
// 统一管理战斗中的特效调用：伤害数字、震屏、闪光、前冲/击退、hitstop等
// 加载顺序：ui_battle_fx.js -> battle_feedback.js -> combat_part1.js
// =============================================================

(function () {
  if (!window.NDX) window.NDX = {};
  var NDX = window.NDX;

  NDX.BattleFeedback = NDX.BattleFeedback || {};

  // =============================================================
  // 一、配置
  // =============================================================
  NDX.BattleFeedback.config = {
    // 震屏强度分级
    shakeIntensity: {
      normal: 3,      // 普通攻击
      crit: 6,        // 暴击
      heavy: 8,       // 蓄力重击
      bossSkill: 10,  // Boss专属技能
      ultimate: 12    // 终极技能
    },
    // 闪光强度
    flashOpacity: {
      normal: 0.15,
      crit: 0.25,
      bossSkill: 0.35,
      ultimate: 0.45
    },
    // hitstop时长（毫秒）
    hitstopDuration: {
      normal: 50,
      crit: 80,
      heavy: 100,
      bossSkill: 120
    },
    // 前冲/击退距离（像素）
    lungeDistance: 30,
    knockbackDistance: 20,
    // 是否启用
    enabled: true,
    // 特效密度等级：0=关闭, 1=低（仅伤害数字）, 2=中（默认）, 3=高（全部特效）
    fxLevel: 2
  };

  // 特效密度控制
  NDX.BattleFeedback.setFxLevel = function(level) {
    this.config.fxLevel = Math.max(0, Math.min(3, level));
    try { localStorage.setItem('nidao_fx_level', this.config.fxLevel); } catch (e) {}
  };
  NDX.BattleFeedback.getFxLevel = function() {
    try {
      const saved = localStorage.getItem('nidao_fx_level');
      if (saved != null) this.config.fxLevel = parseInt(saved) || 2;
    } catch (e) {}
    return this.config.fxLevel;
  };
  // 初始化时读取保存的设置
  try { NDX.BattleFeedback.getFxLevel(); } catch (e) {}
  // 检查是否应该播放某级特效
  NDX.BattleFeedback.shouldPlayFx = function(level) {
    return this.config.fxLevel >= level;
  };

  // =============================================================
  // 二、玩家攻击反馈
  // =============================================================

  // 玩家攻击命中反馈
  NDX.BattleFeedback.playerHit = function (options) {
    if (!this.enabled) return;
    const opts = options || {};
    const damage = opts.damage || 0;
    const isCrit = opts.isCrit || false;
    const isHeavy = opts.isHeavy || false;
    const targetX = opts.targetX || 70; // 怪物位置（百分比）
    const targetY = opts.targetY || 50;

    // 1. 伤害数字飘字
    if (NDX.BattleFX && NDX.BattleFX.damageNumber) {
      NDX.BattleFX.damageNumber({
        damage: damage,
        type: isCrit ? 'crit' : 'normal',
        x: targetX + (Math.random() - 0.5) * 10,
        y: targetY - 10 + (Math.random() - 0.5) * 10,
        isHero: true
      });
    }

    // 2. 震屏
    if (NDX.BattleFX && NDX.BattleFX.shake) {
      const intensity = isCrit ? this.config.shakeIntensity.crit :
                        isHeavy ? this.config.shakeIntensity.heavy :
                        this.config.shakeIntensity.normal;
      NDX.BattleFX.shake({
        intensity: intensity,
        duration: 200 + intensity * 20
      });
    }

    // 3. 暴击特效
    if (isCrit && NDX.BattleFX && NDX.BattleFX.crit) {
      NDX.BattleFX.crit({
        damage: damage,
        isHero: true
      });
    }

    // 4. 命中点粒子
    if (NDX.BattleFX && NDX.BattleFX.particle) {
      const particleCount = isCrit ? 8 : 4;
      for (let i = 0; i < particleCount; i++) {
        NDX.BattleFX.particle({
          x: targetX,
          y: targetY,
          color: isCrit ? '#ffd700' : '#fff',
          size: 3 + Math.random() * 4,
          angle: (i / particleCount) * Math.PI * 2,
          speed: 50 + Math.random() * 80,
          duration: 400 + Math.random() * 300
        });
      }
    }

    // 5. 目标高亮（被攻击的目标短暂高亮）
    this.highlightTarget(targetX, targetY, isCrit ? '#ffd700' : '#fff');

    // 6. 击退效果
    if (isHeavy || isCrit) {
      this.knockback('enemy', this.config.knockbackDistance);
    }
  };

  // 玩家攻击闪避反馈
  NDX.BattleFeedback.playerMiss = function (options) {
    if (!this.enabled) return;
    const opts = options || {};
    const targetX = opts.targetX || 70;
    const targetY = opts.targetY || 50;

    if (NDX.BattleFX && NDX.BattleFX.damageNumber) {
      NDX.BattleFX.damageNumber({
        damage: 0,
        type: 'miss',
        x: targetX,
        y: targetY - 10,
        isHero: true
      });
    }
  };

  // =============================================================
  // 三、敌人攻击反馈
  // =============================================================

  // 敌人攻击命中反馈
  NDX.BattleFeedback.enemyHit = function (options) {
    if (!this.enabled) return;
    const opts = options || {};
    const damage = opts.damage || 0;
    const isCrit = opts.isCrit || false;
    const isHeavy = opts.isHeavy || false;
    const isBossSkill = opts.isBossSkill || false;
    const playerX = opts.playerX || 30; // 玩家位置（百分比）
    const playerY = opts.playerY || 50;

    // 1. 伤害数字飘字
    if (NDX.BattleFX && NDX.BattleFX.damageNumber) {
      NDX.BattleFX.damageNumber({
        damage: damage,
        type: isCrit ? 'crit' : 'normal',
        x: playerX + (Math.random() - 0.5) * 10,
        y: playerY - 10 + (Math.random() - 0.5) * 10,
        isHero: false
      });
    }

    // 2. 震屏
    if (NDX.BattleFX && NDX.BattleFX.shake) {
      const intensity = isBossSkill ? this.config.shakeIntensity.bossSkill :
                        isCrit ? this.config.shakeIntensity.crit :
                        isHeavy ? this.config.shakeIntensity.heavy :
                        this.config.shakeIntensity.normal;
      NDX.BattleFX.shake({
        intensity: intensity,
        duration: 200 + intensity * 20
      });
    }

    // 3. 全屏闪光（Boss技能或暴击时）
    if ((isBossSkill || isCrit) && NDX.BattleFX && NDX.BattleFX.flash) {
      NDX.BattleFX.flash({
        color: isBossSkill ? 'rgba(255, 80, 80, 0.3)' : 'rgba(255, 200, 50, 0.2)',
        duration: 300
      });
    }

    // 4. 命中点粒子
    if (NDX.BattleFX && NDX.BattleFX.particle) {
      const particleCount = isBossSkill ? 12 : (isCrit ? 8 : 4);
      for (let i = 0; i < particleCount; i++) {
        NDX.BattleFX.particle({
          x: playerX,
          y: playerY,
          color: isBossSkill ? '#ff4444' : (isCrit ? '#ffd700' : '#ff6b6b'),
          size: 3 + Math.random() * 4,
          angle: (i / particleCount) * Math.PI * 2,
          speed: 50 + Math.random() * 80,
          duration: 400 + Math.random() * 300
        });
      }
    }

    // 5. 玩家受击高亮
    this.highlightTarget(playerX, playerY, isBossSkill ? '#ff4444' : '#ff6b6b');

    // 6. 玩家受击后退
    this.knockback('player', this.config.knockbackDistance * 0.7);
  };

  // 敌人攻击闪避反馈
  NDX.BattleFeedback.enemyMiss = function (options) {
    if (!this.enabled) return;
    const opts = options || {};
    const playerX = opts.playerX || 30;
    const playerY = opts.playerY || 50;

    if (NDX.BattleFX && NDX.BattleFX.damageNumber) {
      NDX.BattleFX.damageNumber({
        damage: 0,
        type: 'miss',
        x: playerX,
        y: playerY - 10,
        isHero: false
      });
    }

    // 闪避时的轻微粒子效果
    if (NDX.BattleFX && NDX.BattleFX.particle) {
      for (let i = 0; i < 3; i++) {
        NDX.BattleFX.particle({
          x: playerX,
          y: playerY,
          color: '#868e96',
          size: 2 + Math.random() * 2,
          angle: (i / 3) * Math.PI * 2,
          speed: 30 + Math.random() * 40,
          duration: 300 + Math.random() * 200
        });
      }
    }
  };

  // =============================================================
  // 四、辅助效果
  // =============================================================

  // =============================================================
  // 四·一、攻击→目标因果链（刃光/弹道线）
  // =============================================================

  // 刃光效果（从攻击者到目标的一道光刃）
  NDX.BattleFeedback.slashEffect = function (options) {
    if (!NDX.BattleFX || !NDX.BattleFX.container) return;
    NDX.BattleFX.init();
    const opts = options || {};
    const fromX = opts.fromX || 30;
    const fromY = opts.fromY || 50;
    const toX = opts.toX || 70;
    const toY = opts.toY || 50;
    const color = opts.color || '#fff';
    const width = opts.width || 4;
    const duration = opts.duration || 300;

    // 计算角度和长度
    const dx = toX - fromX;
    const dy = toY - fromY;
    const length = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx) * 180 / Math.PI;

    // 创建刃光元素
    const slash = document.createElement('div');
    slash.className = 'fx-slash';
    slash.style.cssText = 'position: absolute; left: ' + fromX + '%; top: ' + fromY + '%; width: 0%; height: ' + width + 'px; background: linear-gradient(90deg, transparent, ' + color + ', transparent); box-shadow: 0 0 ' + (width * 2) + 'px ' + color + '; transform-origin: left center; transform: rotate(' + angle + 'deg); animation: fxSlashExtend ' + duration + 'ms ease-out forwards; pointer-events: none; z-index: 5001; border-radius: ' + (width / 2) + 'px;';
    // 设置终点（通过CSS变量）
    slash.style.setProperty('--slash-length', length + '%');
    NDX.BattleFX.container.appendChild(slash);
    setTimeout(() => slash.remove(), duration + 50);

    // 命中点爆发特效
    this.hitBurst({
      x: toX,
      y: toY,
      color: color,
      size: width * 3
    });
  };

  // 命中点爆发特效
  NDX.BattleFeedback.hitBurst = function (options) {
    if (!NDX.BattleFX || !NDX.BattleFX.container) return;
    NDX.BattleFX.init();
    const opts = options || {};
    const x = opts.x || 50;
    const y = opts.y || 50;
    const color = opts.color || '#fff';
    const size = opts.size || 20;

    // 创建爆发圆环
    const burst = document.createElement('div');
    burst.className = 'fx-hit-burst';
    burst.style.cssText = 'position: absolute; left: ' + x + '%; top: ' + y + '%; width: ' + size + 'px; height: ' + size + 'px; transform: translate(-50%, -50%) scale(0); border: 2px solid ' + color + '; border-radius: 50%; box-shadow: 0 0 ' + size + 'px ' + color + ', inset 0 0 ' + (size / 2) + 'px ' + color + '; animation: fxHitBurst 0.4s ease-out forwards; pointer-events: none; z-index: 5001;';
    NDX.BattleFX.container.appendChild(burst);
    setTimeout(() => burst.remove(), 500);

    // 粒子爆散
    if (NDX.BattleFX && NDX.BattleFX.particle) {
      for (let i = 0; i < 6; i++) {
        NDX.BattleFX.particle({
          x: x,
          y: y,
          color: color,
          size: 2 + Math.random() * 3,
          angle: (i / 6) * Math.PI * 2,
          speed: 60 + Math.random() * 60,
          duration: 300 + Math.random() * 200
        });
      }
    }
  };

  // 目标高亮
  NDX.BattleFeedback.highlightTarget = function (x, y, color) {
    if (!NDX.BattleFX || !NDX.BattleFX.container) return;
    NDX.BattleFX.init();

    const highlight = document.createElement('div');
    highlight.className = 'fx-target-highlight';
    highlight.style.cssText = `
      position: absolute;
      left: ${x}%;
      top: ${y}%;
      width: 80px;
      height: 80px;
      transform: translate(-50%, -50%);
      border: 2px solid ${color || '#fff'};
      border-radius: 50%;
      opacity: 0.8;
      animation: fxHighlightPulse 0.4s ease-out forwards;
      pointer-events: none;
      z-index: 5001;
    `;
    NDX.BattleFX.container.appendChild(highlight);
    setTimeout(() => highlight.remove(), 500);
  };

  // 击退效果
  NDX.BattleFeedback.knockback = function (target, distance) {
    // 通过CSS类实现击退动画
    const selector = target === 'player' ? '.fb-avatar.you, .hero-portrait' : '.fb-avatar.foe, .fb-foe-art, .enemy-portrait';
    const elements = document.querySelectorAll(selector);
    if (!elements.length) return;

    elements.forEach(el => {
      el.style.transition = 'transform 0.15s ease-out';
      const direction = target === 'player' ? -1 : 1;
      el.style.transform = `translateX(${direction * distance}px)`;
      setTimeout(() => {
        el.style.transform = 'translateX(0)';
        setTimeout(() => {
          el.style.transition = '';
        }, 200);
      }, 150);
    });
  };

  // 前冲效果（玩家攻击前冲）
  NDX.BattleFeedback.lunge = function (target, distance) {
    const selector = target === 'player' ? '.fb-avatar.you, .hero-portrait' : '.fb-avatar.foe, .fb-foe-art, .enemy-portrait';
    const elements = document.querySelectorAll(selector);
    if (!elements.length) return;

    elements.forEach(el => {
      el.style.transition = 'transform 0.1s ease-in';
      const direction = target === 'player' ? 1 : -1;
      el.style.transform = `translateX(${direction * distance}px)`;
      setTimeout(() => {
        el.style.transition = 'transform 0.15s ease-out';
        el.style.transform = 'translateX(0)';
        setTimeout(() => {
          el.style.transition = '';
        }, 200);
      }, 100);
    });
  };

  // =============================================================
  // 五、战斗高潮层
  // =============================================================

  // 识破成功反馈
  NDX.BattleFeedback.parrySuccess = function (options) {
    if (!this.enabled) return;
    const opts = options || {};

    // 调用高潮层特效
    if (NDX.BattleFX && NDX.BattleFX.climax) {
      NDX.BattleFX.climax({
        type: 'break',
        text: '识破成功！'
      });
    }

    // 额外的粒子效果
    if (NDX.BattleFX && NDX.BattleFX.particle) {
      for (let i = 0; i < 16; i++) {
        NDX.BattleFX.particle({
          x: 50,
          y: 50,
          color: '#4ecdc4',
          size: 4 + Math.random() * 6,
          angle: (i / 16) * Math.PI * 2,
          speed: 100 + Math.random() * 100,
          duration: 600 + Math.random() * 400
        });
      }
    }
  };

  // 气势爆发反馈
  NDX.BattleFeedback.momentumBurst = function (options) {
    if (!this.enabled) return;
    const opts = options || {};
    const level = opts.level || 1;

    if (NDX.BattleFX && NDX.BattleFX.climax) {
      NDX.BattleFX.climax({
        type: 'burst',
        text: `气势爆发 Lv.${level}！`
      });
    }
  };

  // Boss大招反馈
  NDX.BattleFeedback.bossUltimate = function (options) {
    if (!this.enabled) return;
    const opts = options || {};
    const skillName = opts.skillName || 'Boss大招';

    if (NDX.BattleFX && NDX.BattleFX.climax) {
      NDX.BattleFX.climax({
        type: 'boss',
        text: skillName
      });
    }
  };

  // =============================================================
  // 六、开关控制
  // =============================================================

  NDX.BattleFeedback.setEnabled = function (enabled) {
    this.config.enabled = enabled;
  };

  NDX.BattleFeedback.isEnabled = function () {
    return this.config.enabled;
  };

  // 添加CSS动画
  NDX.BattleFeedback.addStyles = function () {
    if (document.getElementById('battle-feedback-styles')) return;
    const style = document.createElement('style');
    style.id = 'battle-feedback-styles';
    style.textContent = `
      @keyframes fxHighlightPulse {
        0% { transform: translate(-50%, -50%) scale(0.5); opacity: 1; }
        100% { transform: translate(-50%, -50%) scale(1.5); opacity: 0; }
      }
      @keyframes fxDmgFloat {
        0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0; }
        20% { transform: translate(-50%, -60%) scale(1.2); opacity: 1; }
        100% { transform: translate(-50%, -100%) scale(1); opacity: 0; }
      }
      @keyframes fxCritPop {
        0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
        30% { transform: translate(-50%, -50%) scale(1.3); opacity: 1; }
        60% { transform: translate(-50%, -50%) scale(1); }
        100% { transform: translate(-50%, -50%) scale(0.8); opacity: 0; }
      }
      @keyframes fxFlashFade {
        0% { opacity: 1; }
        100% { opacity: 0; }
      }
      @keyframes fxParticleMove {
        0% { transform: translate(-50%, -50%); opacity: 1; }
        100% { transform: translate(calc(-50% + var(--end-x, 0)), calc(-50% + var(--end-y, 0))); opacity: 0; }
      }
      @keyframes fxSlashExtend {
        0% { width: 0%; opacity: 1; }
        50% { width: var(--slash-length, 50%); opacity: 1; }
        100% { width: var(--slash-length, 50%); opacity: 0; }
      }
      @keyframes fxHitBurst {
        0% { transform: translate(-50%, -50%) scale(0); opacity: 1; }
        50% { transform: translate(-50%, -50%) scale(1.2); opacity: 0.8; }
        100% { transform: translate(-50%, -50%) scale(2); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  };

  // 初始化
  NDX.BattleFeedback.init = function () {
    this.addStyles();
    console.log('[BattleFeedback] 战斗反馈集成系统已初始化');
  };

  // 页面加载时自动初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => NDX.BattleFeedback.init());
  } else {
    NDX.BattleFeedback.init();
  }

  console.log('[BattleFeedback] 战斗反馈集成系统已加载');
})();
