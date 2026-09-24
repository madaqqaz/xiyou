// =============================================================
// boss_skill_audio.js - Boss专属技能音效系统
// 使用Web Audio API生成不同类型的技能音效
// 加载顺序：boss_skill_combat.js -> boss_skill_audio.js -> combat_part1.js
// =============================================================

(function () {
  if (!window.NDX) window.NDX = {};
  var NDX = window.NDX;

  // =============================================================
  // 一、音效系统初始化
  // =============================================================
  NDX.BossSkillAudio = NDX.BossSkillAudio || {};
  NDX.BossSkillAudio.audioContext = null;
  NDX.BossSkillAudio.masterGain = null;
  NDX.BossSkillAudio.enabled = true;

  // 初始化音频上下文
  NDX.BossSkillAudio.init = function () {
    if (this.audioContext) return;
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.masterGain = this.audioContext.createGain();
      this.masterGain.gain.value = 0.3; // 主音量30%
      this.masterGain.connect(this.audioContext.destination);
      console.log('[BossSkillAudio] 音效系统已初始化');
    } catch (e) {
      console.warn('[BossSkillAudio] 音频初始化失败:', e);
      this.enabled = false;
    }
  };

  // 播放音效（需要用户交互后才能播放）
  NDX.BossSkillAudio.play = function (type, skillName) {
    if (!this.enabled) return;
    if (!this.audioContext) this.init();
    if (!this.audioContext) return;

    // 如果音频上下文被暂停，恢复它
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    // 根据技能类型播放不同音效
    switch (type) {
      case 'dot':
        this.playFireEffect();
        break;
      case 'shield':
        this.playShieldEffect();
        break;
      case 'disarm':
        this.playDisarmEffect();
        break;
      case 'stun':
        this.playStunEffect();
        break;
      case 'debuff':
        this.playDebuffEffect();
        break;
      case 'lifesteal':
        this.playLifestealEffect();
        break;
      case 'special':
        this.playSpecialEffect();
        break;
      case 'charm':
        this.playCharmEffect();
        break;
      case 'summon':
        this.playSummonEffect();
        break;
      case 'ultimate':
        this.playUltimateEffect();
        break;
      case 'multi':
        this.playMultiEffect();
        break;
      case 'heavy':
        this.playHeavyEffect();
        break;
      case 'guard':
      case 'defensive':
        this.playGuardEffect();
        break;
      case 'buff':
        this.playBuffEffect();
        break;
      case 'heal':
        this.playHealEffect();
        break;
      default:
        this.playDefaultEffect();
        break;
    }
  };

  // =============================================================
  // 二、各种技能音效生成函数
  // =============================================================

  // DOT持续伤害（火焰/灼烧）音效
  NDX.BossSkillAudio.playFireEffect = function () {
    const ctx = this.audioContext;
    const now = ctx.currentTime;

    // 白噪声模拟火焰声
    const bufferSize = ctx.sampleRate * 0.5;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 800;
    filter.Q.value = 2;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    noise.start(now);
    noise.stop(now + 0.5);

    // 低频隆隆声
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(80, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.3);

    const oscGain = ctx.createGain();
    oscGain.gain.setValueAtTime(0.15, now);
    oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

    osc.connect(oscGain);
    oscGain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.3);
  };

  // 护盾音效
  NDX.BossSkillAudio.playShieldEffect = function () {
    const ctx = this.audioContext;
    const now = ctx.currentTime;

    // 上升的正弦波
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.2);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.4);

    // 高频泛音
    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(600, now);
    osc2.frequency.exponentialRampToValueAtTime(1200, now + 0.15);

    const gain2 = ctx.createGain();
    gain2.gain.setValueAtTime(0.1, now);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

    osc2.connect(gain2);
    gain2.connect(this.masterGain);
    osc2.start(now);
    osc2.stop(now + 0.2);
  };

  // 缴械音效
  NDX.BossSkillAudio.playDisarmEffect = function () {
    const ctx = this.audioContext;
    const now = ctx.currentTime;

    // 金属碰撞声
    const osc = ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(100, now + 0.15);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.2);

    // 金属掉落声
    setTimeout(() => {
      const osc2 = ctx.createOscillator();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(200, ctx.currentTime);
      osc2.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.2);

      const gain2 = ctx.createGain();
      gain2.gain.setValueAtTime(0.2, ctx.currentTime);
      gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);

      osc2.connect(gain2);
      gain2.connect(this.masterGain);
      osc2.start(ctx.currentTime);
      osc2.stop(ctx.currentTime + 0.25);
    }, 100);
  };

  // 眩晕音效
  NDX.BossSkillAudio.playStunEffect = function () {
    const ctx = this.audioContext;
    const now = ctx.currentTime;

    // 快速上升的正弦波（眩晕感）
    for (let i = 0; i < 3; i++) {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400 + i * 200, now + i * 0.1);
      osc.frequency.exponentialRampToValueAtTime(800 + i * 200, now + i * 0.1 + 0.1);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.15, now + i * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.15);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now + i * 0.1);
      osc.stop(now + i * 0.1 + 0.15);
    }
  };

  // 减益音效
  NDX.BossSkillAudio.playDebuffEffect = function () {
    const ctx = this.audioContext;
    const now = ctx.currentTime;

    // 下降的锯齿波
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(150, now + 0.3);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.35);
  };

  // 吸血音效
  NDX.BossSkillAudio.playLifestealEffect = function () {
    const ctx = this.audioContext;
    const now = ctx.currentTime;

    // 抽吸声（白噪声+滤波器）
    const bufferSize = ctx.sampleRate * 0.4;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2000, now);
    filter.frequency.exponentialRampToValueAtTime(300, now + 0.3);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    noise.start(now);
    noise.stop(now + 0.4);
  };

  // 特殊（遁形）音效
  NDX.BossSkillAudio.playSpecialEffect = function () {
    const ctx = this.audioContext;
    const now = ctx.currentTime;

    // 神秘的上升音
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(1200, now + 0.3);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.4);

    // 闪烁效果
    for (let i = 0; i < 4; i++) {
      const osc2 = ctx.createOscillator();
      osc2.type = 'sine';
      osc2.frequency.value = 800 + i * 100;

      const gain2 = ctx.createGain();
      gain2.gain.setValueAtTime(0.1, now + i * 0.08);
      gain2.gain.exponentialRampToValueAtTime(0.01, now + i * 0.08 + 0.05);

      osc2.connect(gain2);
      gain2.connect(this.masterGain);
      osc2.start(now + i * 0.08);
      osc2.stop(now + i * 0.08 + 0.05);
    }
  };

  // 魅惑音效
  NDX.BossSkillAudio.playCharmEffect = function () {
    const ctx = this.audioContext;
    const now = ctx.currentTime;

    // 柔和的上升音（魅惑感）
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(900, now + 0.4);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.5);

    // 泛音
    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(600, now);
    osc2.frequency.exponentialRampToValueAtTime(1200, now + 0.3);

    const gain2 = ctx.createGain();
    gain2.gain.setValueAtTime(0.08, now);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

    osc2.connect(gain2);
    gain2.connect(this.masterGain);
    osc2.start(now);
    osc2.stop(now + 0.4);
  };

  // 召唤音效
  NDX.BossSkillAudio.playSummonEffect = function () {
    const ctx = this.audioContext;
    const now = ctx.currentTime;

    // 低沉的召唤声
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(60, now);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.5);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.6);

    // 召唤完成的闪光
    setTimeout(() => {
      const osc2 = ctx.createOscillator();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(800, ctx.currentTime);
      osc2.frequency.exponentialRampToValueAtTime(1600, ctx.currentTime + 0.1);

      const gain2 = ctx.createGain();
      gain2.gain.setValueAtTime(0.15, ctx.currentTime);
      gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

      osc2.connect(gain2);
      gain2.connect(this.masterGain);
      osc2.start(ctx.currentTime);
      osc2.stop(ctx.currentTime + 0.15);
    }, 400);
  };

  // 终极技能音效
  NDX.BossSkillAudio.playUltimateEffect = function () {
    const ctx = this.audioContext;
    const now = ctx.currentTime;

    // 强烈的上升音
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(100, now);
    osc.frequency.exponentialRampToValueAtTime(1000, now + 0.5);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.7);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.7);

    // 低频隆隆声
    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(50, now);
    osc2.frequency.exponentialRampToValueAtTime(30, now + 0.6);

    const gain2 = ctx.createGain();
    gain2.gain.setValueAtTime(0.3, now);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.7);

    osc2.connect(gain2);
    gain2.connect(this.masterGain);
    osc2.start(now);
    osc2.stop(now + 0.7);

    // 爆发闪光
    setTimeout(() => {
      const osc3 = ctx.createOscillator();
      osc3.type = 'square';
      osc3.frequency.value = 1200;

      const gain3 = ctx.createGain();
      gain3.gain.setValueAtTime(0.2, ctx.currentTime);
      gain3.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);

      osc3.connect(gain3);
      gain3.connect(this.masterGain);
      osc3.start(ctx.currentTime);
      osc3.stop(ctx.currentTime + 0.2);
    }, 500);
  };

  // 多段攻击音效
  NDX.BossSkillAudio.playMultiEffect = function () {
    const ctx = this.audioContext;
    const now = ctx.currentTime;

    // 快速连续的攻击声
    for (let i = 0; i < 3; i++) {
      const osc = ctx.createOscillator();
      osc.type = 'square';
      osc.frequency.setValueAtTime(300 + i * 50, now + i * 0.1);
      osc.frequency.exponentialRampToValueAtTime(100, now + i * 0.1 + 0.08);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.2, now + i * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.1);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now + i * 0.1);
      osc.stop(now + i * 0.1 + 0.1);
    }
  };

  // 蓄力重击音效
  NDX.BossSkillAudio.playHeavyEffect = function () {
    const ctx = this.audioContext;
    const now = ctx.currentTime;

    // 蓄力声
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(80, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.3);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.25, now + 0.3);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.3);

    // 重击爆发
    setTimeout(() => {
      const osc2 = ctx.createOscillator();
      osc2.type = 'square';
      osc2.frequency.setValueAtTime(150, ctx.currentTime);
      osc2.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.2);

      const gain2 = ctx.createGain();
      gain2.gain.setValueAtTime(0.3, ctx.currentTime);
      gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);

      osc2.connect(gain2);
      gain2.connect(this.masterGain);
      osc2.start(ctx.currentTime);
      osc2.stop(ctx.currentTime + 0.25);
    }, 300);
  };

  // 防御/铁壁音效
  NDX.BossSkillAudio.playGuardEffect = function () {
    const ctx = this.audioContext;
    const now = ctx.currentTime;

    // 金属碰撞声
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(500, now);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.1);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.15);
  };

  // 增益音效
  NDX.BossSkillAudio.playBuffEffect = function () {
    const ctx = this.audioContext;
    const now = ctx.currentTime;

    // 上升的和弦
    const frequencies = [400, 500, 600];
    frequencies.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.05);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.5, now + i * 0.05 + 0.2);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.1, now + i * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.05 + 0.3);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now + i * 0.05);
      osc.stop(now + i * 0.05 + 0.3);
    });
  };

  // 回血音效
  NDX.BossSkillAudio.playHealEffect = function () {
    const ctx = this.audioContext;
    const now = ctx.currentTime;

    // 柔和的上升音
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(500, now);
    osc.frequency.exponentialRampToValueAtTime(1000, now + 0.3);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.4);

    // 泛音
    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(750, now);
    osc2.frequency.exponentialRampToValueAtTime(1500, now + 0.25);

    const gain2 = ctx.createGain();
    gain2.gain.setValueAtTime(0.08, now);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

    osc2.connect(gain2);
    gain2.connect(this.masterGain);
    osc2.start(now);
    osc2.stop(now + 0.3);
  };

  // 默认音效
  NDX.BossSkillAudio.playDefaultEffect = function () {
    const ctx = this.audioContext;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.2);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.3);
  };

  // =============================================================
  // 三、音量控制
  // =============================================================
  NDX.BossSkillAudio.setVolume = function (volume) {
    if (this.masterGain) {
      this.masterGain.gain.value = Math.max(0, Math.min(1, volume));
    }
  };

  NDX.BossSkillAudio.getVolume = function () {
    return this.masterGain ? this.masterGain.gain.value : 0.3;
  };

  NDX.BossSkillAudio.toggle = function () {
    this.enabled = !this.enabled;
    return this.enabled;
  };

  console.log('[BossSkillAudio] Boss专属技能音效系统已加载');
})();
