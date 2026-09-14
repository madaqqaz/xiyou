/* =============================================================================
 * 逆道西行 · 自适应音频引擎（完整实现 · 覆盖 M1–M11）
 * 单源 NDX + file:// 双击兼容 · Web Audio API · 移动端 H5 默认预算
 * 设计纪律：事件驱动 / 参数驱动 / 总线树 / 语音预算+steal / 程序化合成优先
 *
 * 已落地里程碑：
 *   M1 总线树 + 手势解锁            M2 合成器库(drone/钟磬/噪声/脉冲/拨奏/环境)
 *   M3 量化节拍自适应音乐          M4 俯视 PannerNode(HRTF)+遮挡+共享混响
 *   M5 语音预算 + steal            M6 过渡量化 + Boss 动机(渡/逆不同音程)
 *   M7 数据驱动事件注册表          M8 区域音景配置(环境层/调式/混响交叉淡入)
 *   M9 移动端健壮性(限制器/后台恢复/设置持久化/参数全接入)
 *   M10 诊断与真机自检
 *   三按键战斗：普攻(中性) / 渡式(+resonance) / 逆式(−resonance)
 *
 * 用法（index.html 中 <script src="audio_engine.js"></script>）：
 *   NDX_Audio.init();                       // 首次用户手势内
 *   NDX_Audio.combat('du'|'ni'|'neutral');  // 三按键
 *   NDX_Audio.set('CombatIntensity', 0.9);  // 进入 Boss
 *   NDX_Audio.setZone('cave');              // 切区域音景
 *   NDX_Audio.spawnSpatial('event:/SFX/Combat/Strike_Metal', {x:3,z:-8}, {x:0,z:0}, 0.3);
 *   NDX_Audio.getDiagnostics();             // 真机诊断
 * ========================================================================== */
(function (global) {
  'use strict';

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;

  // M14：游戏同名 SFX → 事件路径映射（buildEvents 填充，NDX_Audio.sfx 查表）
  const SFX_BY_NAME = {};

  // 五声音阶锚点（以 D 为宫，单位 Hz）
  const SCALE = { gong: 293.66, shang: 329.63, jue: 369.99, zhi: 440.00, yu: 493.88 };
  // 渡=徵调式明亮（大三/属），逆=羽调式阴郁（小三）
  const MODE_DU = [SCALE.gong, SCALE.zhi, SCALE.shang, SCALE.yu, SCALE.jue];
  const MODE_NI = [SCALE.yu, SCALE.gong, SCALE.jue, SCALE.shang, SCALE.zhi];
  // 持续层根音：渡偏亮(D3)、逆偏暗(A2)
  const ROOT_DU = 146.83, ROOT_NI = 110.00;

  // ---------------------------------------------------------------------------
  // M13：17 关隘 Boss 动机变体表（让每场 Boss 战在音乐上彼此可辨）
  //  - off   ：相对当前调式根音的半音偏移（全部落在五声友好集，避免与 pad 打架）
  //  - flavor：音程性格，决定动机的"气质"
  //  - 渡/逆（ScriptureResonance）再叠加明暗着色，故同一 Boss 也随玩法偏移
  //  表中 17 组 (off,flavor) 全部唯一，相邻关隘刻意错开，便于记忆与辨识。
  // ---------------------------------------------------------------------------
  const BOSS_FLAVORS = {
    open:  { maj: [0, 4, 7, 12],  min: [0, 3, 7, 12] },   // 空旷开放
    maj:   { maj: [0, 4, 7, 11],  min: [0, 3, 7, 11] },   // 威严明亮
    min:   { maj: [0, 4, 7, 10],  min: [0, 3, 7, 10] },   // 阴郁沉重
    sus:   { maj: [0, 5, 7, 11],  min: [0, 5, 7, 10] },   // 悬疑挂留
    phryg: { maj: [0, 1, 5, 9],   min: [0, 1, 5, 8]  },   // 诡谲异域
  };
  const BOSS_MOTIF_TABLE = {
    1:  { off: 0,  flavor: 'open'  }, // 两界山·启程开阔
    2:  { off: 7,  flavor: 'maj'   }, // 黄风岭·五度威严
    3:  { off: 5,  flavor: 'sus'   }, // 流沙河·四度悬疑
    4:  { off: 2,  flavor: 'min'   }, // 五庄观·大二阴郁
    5:  { off: 9,  flavor: 'phryg' }, // 火云洞·六度诡谲
    6:  { off: 3,  flavor: 'maj'   }, // 车迟国·小三亮色
    7:  { off: 7,  flavor: 'open'  }, // 通天河·五度开放
    8:  { off: 10, flavor: 'min'   }, // 真假猴王·小七沉重（镜像前奏）
    9:  { off: 5,  flavor: 'maj'   }, // 火焰山·四度亮色
    10: { off: 2,  flavor: 'sus'   }, // 狮驼岭·大二悬疑
    11: { off: 4,  flavor: 'phryg' }, // 天竺国·大三诡谲
    12: { off: 4,  flavor: 'open'  }, // 玉兔精·大三开放
    13: { off: 7,  flavor: 'min'   }, // 灵山残烬·五度阴郁
    14: { off: 2,  flavor: 'maj'   }, // 凌云渡·大二亮色
    15: { off: 0,  flavor: 'sus'   }, // 兜率劫·同根悬疑
    16: { off: 3,  flavor: 'phryg' }, // 大闹天宫·小三诡谲
    17: { off: 10, flavor: 'open'  }, // 灵霄逆座·终局开放
  };
  function _bossMotifForAct(act) {
    return BOSS_MOTIF_TABLE[act] || BOSS_MOTIF_TABLE[1];
  }

  // 平台语音预算 —— 移动端 H5 默认（UA 自动识别，桌面端自动放宽）
  const _uaMobile = /Android|iPhone|iPad|iPod|Mobile|MicroMessenger/i.test(
    (global.navigator && global.navigator.userAgent) || ''
  );
  const _isMobile = global.isMobile !== undefined ? global.isMobile : _uaMobile;
  const VOICE_BUDGET = {
    maxVoices: _isMobile ? 24 : 64,
    virtualVoices: _isMobile ? 64 : 256,
  };

  const REVERB_PRESETS = {
    outdoor: { decay: 0.8, wet: 0.15 },
    indoor:  { decay: 1.5, wet: 0.35 },
    cave:    { decay: 3.5, wet: 0.60 },
    metal:   { decay: 1.0, wet: 0.45 },
  };

  // ---------------------------------------------------------------------------
  // Bus：总线/混音树（支持可选低通，用于濒死全局滤波 + 静音切换）
  // ---------------------------------------------------------------------------
  class Bus {
    constructor(ctx, name, parent, opts = {}) {
      this.ctx = ctx; this.name = name;
      this.gain = ctx.createGain();
      this.gain.gain.value = opts.gain != null ? opts.gain : 1;
      let tail = this.gain;
      if (opts.lowpass) {
        this.filter = ctx.createBiquadFilter();
        this.filter.type = 'lowpass';
        this.filter.frequency.value = opts.lowpass;
        this.gain.connect(this.filter);
        tail = this.filter;
      }
      tail.connect(parent ? parent._out : ctx.destination);
      this._out = tail;
    }
    get input() { return this.gain; }
    setGain(v, tc = 0.08) { this.gain.gain.setTargetAtTime(v, this.ctx.currentTime, tc); }
    setLowpass(hz, tc = 0.12) { if (this.filter) this.filter.frequency.setTargetAtTime(hz, this.ctx.currentTime, tc); }
  }

  // ---------------------------------------------------------------------------
  // VoiceManager：语音预算 + 优先级 + steal（无语音用默认值上线 = 禁止）
  // ---------------------------------------------------------------------------
  class VoiceManager {
    constructor(ctx, budget) { this.ctx = ctx; this.budget = budget; this.voices = []; }
    // priority: 0(高,永不steal) .. 3(低)
    // 硬预算 + steal：达预算时，UI/VO(priority 0) 永不被拒；其余按优先级争抢最旧的可让位语音，
    //   无可让位者则返回 null（调用方丢弃该发声），坚决不超过 maxVoices，避免移动端 DSP 过载/破音。
    acquire(priority) {
      if (this.voices.length < this.budget.maxVoices) {
        const v = { priority, born: this.ctx.currentTime };
        this.voices.push(v);
        return v;
      }
      if (priority === 0) { // UI/VO 永不被拒
        const v = { priority, born: this.ctx.currentTime };
        this.voices.push(v);
        return v;
      }
      let victim = null;
      for (const v of this.voices) {
        if (v.priority >= priority && (!victim || v.born < victim.born)) victim = v;
      }
      if (victim) { this.release(victim); const v = { priority, born: this.ctx.currentTime }; this.voices.push(v); return v; }
      return null; // 无可让位的更低优先级语音 → 拒绝（调用方应丢弃该发声）
    }
    release(v) { const i = this.voices.indexOf(v); if (i >= 0) this.voices.splice(i, 1); }
    count() { return this.voices.length; }
    _find(pred) {
      let best = null;
      for (const v of this.voices) if (pred(v) && (!best || v.born < best.born)) best = v;
      return best;
    }
  }

  // ---------------------------------------------------------------------------
  // Synth：程序化合成基元（零外部文件，file:// 友好）
  // ---------------------------------------------------------------------------
  const Synth = {
    // 持续低音 drone（常驻层，不走语音预算）
    drone(ctx, dest, freq, gainVal = 0.06) {
      const osc = ctx.createOscillator();
      const sub = ctx.createOscillator();
      const lp = ctx.createBiquadFilter();
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      const g = ctx.createGain();
      osc.type = 'sawtooth'; osc.frequency.value = freq;
      sub.type = 'sine'; sub.frequency.value = freq / 2;
      lp.type = 'lowpass'; lp.frequency.value = 220; lp.Q.value = 0.7;
      lfo.frequency.value = 0.08; lfoGain.gain.value = freq * 0.008;
      lfo.connect(lfoGain).connect(osc.frequency);
      g.gain.value = gainVal;
      osc.connect(lp); sub.connect(lp); lp.connect(g).connect(dest);
      osc.start(); sub.start(); lfo.start();
      return { stop() { try { osc.stop(); sub.stop(); lfo.stop(); } catch (e) {} } };
    },
    // 经文钟磬：FM 金属声
    bell(ctx, dest, freq, t = 0, gainVal = 0.5, onEnd) {
      const now = ctx.currentTime + t;
      const carrier = ctx.createOscillator();
      const mod = ctx.createOscillator();
      const modGain = ctx.createGain();
      const g = ctx.createGain();
      const bp = ctx.createBiquadFilter();
      carrier.type = 'sine'; carrier.frequency.value = freq;
      mod.type = 'sine'; mod.frequency.value = freq * 2.76;
      modGain.gain.value = freq * 1.4;
      mod.connect(modGain).connect(carrier.frequency);
      bp.type = 'bandpass'; bp.frequency.value = freq * 2; bp.Q.value = 4;
      g.gain.setValueAtTime(0.0001, now);
      g.gain.exponentialRampToValueAtTime(gainVal, now + 0.005);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 1.6);
      carrier.connect(bp).connect(g).connect(dest);
      carrier.onended = onEnd || null;
      carrier.start(now); mod.start(now);
      carrier.stop(now + 1.7); mod.stop(now + 1.7);
    },
    // 噪声打击（法术/金属撞击）
    noiseHit(ctx, dest, dur = 0.18, cutoff = 2200, gainVal = 0.6, onEnd) {
      const now = ctx.currentTime;
      const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
      const src = ctx.createBufferSource(); src.buffer = buf;
      const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = cutoff;
      const g = ctx.createGain(); g.gain.value = gainVal;
      src.connect(hp).connect(g).connect(dest);
      src.onended = onEnd || null;
      src.start(now);
    },
    // 低频脉冲（压迫感）
    pulse(ctx, dest, freq = 55, dur = 0.3, gainVal = 0.4, onEnd) {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator(); osc.type = 'sine'; osc.frequency.value = freq;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, now);
      g.gain.exponentialRampToValueAtTime(gainVal, now + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
      osc.connect(g).connect(dest);
      osc.onended = onEnd || null;
      osc.start(now); osc.stop(now + dur + 0.05);
    },
    // 拨奏（三按键用）
    pluck(ctx, dest, freq, vel = 0.45, onEnd) {
      const now = ctx.currentTime;
      const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = freq;
      const o2 = ctx.createOscillator(); o2.type = 'sine'; o2.frequency.value = freq * 2.01;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, now);
      g.gain.exponentialRampToValueAtTime(vel, now + 0.005);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);
      o.connect(g); o2.connect(g); g.connect(dest);
      o.onended = onEnd || null;
      o.start(now); o2.start(now); o.stop(now + 0.3); o2.stop(now + 0.3);
    },
    // 环境层（区域氛围，持续性，不走语音预算）
    ambience(ctx, dest, type, gainVal = 0.12) {
      if (type === 'wind') {
        const len = Math.floor(ctx.sampleRate * 2);
        const buf = ctx.createBuffer(1, len, ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * 0.4;
        const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
        const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 600; bp.Q.value = 0.6;
        const lfo = ctx.createOscillator(); lfo.frequency.value = 0.1;
        const lfoG = ctx.createGain(); lfoG.gain.value = 400;
        lfo.connect(lfoG).connect(bp.frequency);
        const g = ctx.createGain(); g.gain.value = gainVal;
        src.connect(bp).connect(g).connect(dest);
        src.start(); lfo.start();
        return { stop() { try { src.stop(); lfo.stop(); } catch (e) {} } };
      }
      if (type === 'water') {
        const len = Math.floor(ctx.sampleRate * 2);
        const buf = ctx.createBuffer(1, len, ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1);
        const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
        const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900;
        const trem = ctx.createOscillator(); trem.frequency.value = 0.7;
        const tremG = ctx.createGain(); tremG.gain.value = 0.35;
        const g = ctx.createGain(); g.gain.value = gainVal * 0.5;
        trem.connect(tremG).connect(g.gain);
        src.connect(lp).connect(g).connect(dest);
        src.start(); trem.start();
        return { stop() { try { src.stop(); trem.stop(); } catch (e) {} } };
      }
      if (type === 'cave') {
        // 低频隆隆 + 随机滴水（钟磬质感 ping）
        const rum = ctx.createOscillator(); rum.type = 'sawtooth'; rum.frequency.value = 41;
        const rl = ctx.createBiquadFilter(); rl.type = 'lowpass'; rl.frequency.value = 120;
        const rg = ctx.createGain(); rg.gain.value = gainVal * 0.6;
        rum.connect(rl).connect(rg).connect(dest); rum.start();
        let timer = setInterval(() => {
          Synth.bell(ctx, dest, 880 + Math.random() * 660, 0, 0.12 * gainVal * 4);
        }, 2600 + Math.random() * 2200);
        return { stop() { try { clearInterval(timer); rum.stop(); } catch (e) {} } };
      }
      return { stop() {} }; // 无环境层
    },
    // —— M14：游戏同名 SFX 合成基元（全部程序化 / file:// 安全）——
    // 通用单音：借鉴 sound.js 的简洁接口，便于事件复用
    tone(ctx, dest, freq, dur, opt) {
      opt = opt || {};
      const t = ctx.currentTime;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = opt.type || 'sine';
      o.frequency.setValueAtTime(freq, t);
      if (opt.glide) o.frequency.exponentialRampToValueAtTime(Math.max(20, opt.glide), t + dur);
      const vol = opt.vol != null ? opt.vol : 0.4;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(vol, t + (opt.atk || 0.008));
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g).connect(dest);
      o.start(t); o.stop(t + dur + 0.02);
    },
    footstep(ctx, dest, gainVal) { // 脚步：轻噪点 + 低频闷
      Synth.noiseHit(ctx, dest, 0.06, 380, gainVal != null ? gainVal : 0.22);
      Synth.tone(ctx, dest, 90, 0.08, { type: 'sine', vol: 0.18 });
    },
    fleshHit(ctx, dest, gainVal) { // 受击（血肉闷响）：噪声低通 + 低频砸
      Synth.noiseHit(ctx, dest, 0.12, 700, gainVal != null ? gainVal : 0.5);
      Synth.tone(ctx, dest, 140, 0.14, { type: 'sine', vol: 0.4, glide: 70 });
    },
    critHit(ctx, dest, gainVal) { // 暴击：金属明亮爆发（FM 钟 + 方波）
      Synth.bell(ctx, dest, 1175, 0, gainVal != null ? gainVal : 0.5);
      Synth.tone(ctx, dest, 880, 0.16, { type: 'square', vol: 0.3, glide: 1320 });
    },
    guard(ctx, dest, gainVal) { Synth.bell(ctx, dest, 1320, 0, gainVal != null ? gainVal : 0.4); }, // 格挡清脆
    arrow(ctx, dest, gainVal) { // 破风/箭：带通下扫
      const now = ctx.currentTime;
      const len = Math.floor(ctx.sampleRate * 0.18);
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
      const src = ctx.createBufferSource(); src.buffer = buf;
      const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 1.2;
      bp.frequency.setValueAtTime(2400, now); bp.frequency.exponentialRampToValueAtTime(600, now + 0.18);
      const g = ctx.createGain(); g.gain.value = gainVal != null ? gainVal : 0.4;
      src.connect(bp).connect(g).connect(dest); src.start(now);
    },
    pickup(ctx, dest, gainVal) { // 拾取/收集：上行双音
      Synth.tone(ctx, dest, 784, 0.1, { type: 'sine', vol: gainVal != null ? gainVal : 0.3, glide: 1175 });
      Synth.tone(ctx, dest, 1046, 0.18, { type: 'sine', vol: (gainVal != null ? gainVal : 0.3) * 1.1, glide: 1568 });
    },
    healUp(ctx, dest, gainVal) { // 治疗：柔和上行正弦和弦
      [523, 659, 784].forEach((f) => Synth.tone(ctx, dest, f, 0.2, { type: 'sine', vol: gainVal != null ? gainVal : 0.3, glide: f * 1.18 }));
    },
    levelUp(ctx, dest, gainVal) { // 升级/转职：四连上行法铃
      [523, 659, 784, 1046].forEach((f, i) => Synth.bell(ctx, dest, f, i * 0.1, gainVal != null ? gainVal : 0.36));
    },
    victory(ctx, dest, gainVal) { // 胜利：三连上行
      [523, 659, 784].forEach((f) => Synth.tone(ctx, dest, f, 0.24, { type: 'sine', vol: gainVal != null ? gainVal : 0.34, glide: f * 1.3 }));
    },
    defeat(ctx, dest, gainVal) { Synth.tone(ctx, dest, 220, 0.5, { type: 'sawtooth', vol: gainVal != null ? gainVal : 0.2, glide: 90 }); }, // 下沉低鸣
    hover(ctx, dest, gainVal) { Synth.tone(ctx, dest, 1320, 0.04, { type: 'sine', vol: gainVal != null ? gainVal : 0.1 }); }, // 悬停极轻
    back(ctx, dest, gainVal) { Synth.tone(ctx, dest, 440, 0.06, { type: 'sine', vol: gainVal != null ? gainVal : 0.18, glide: 330 }); }, // 返回较低
    portal(ctx, dest, gainVal) { // 传送/法阵：失谐双铃微光
      Synth.bell(ctx, dest, 660, 0, gainVal != null ? gainVal : 0.35);
      Synth.bell(ctx, dest, 666, 0.04, gainVal != null ? gainVal : 0.3);
    },
    gust(ctx, dest, gainVal) { // 风涌：滤波噪声涌起
      const now = ctx.currentTime;
      const len = Math.floor(ctx.sampleRate * 0.6);
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1);
      const src = ctx.createBufferSource(); src.buffer = buf;
      const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 500; bp.Q.value = 0.7;
      const lfo = ctx.createOscillator(); lfo.frequency.value = 0.8;
      const lg = ctx.createGain(); lg.gain.value = 400; lfo.connect(lg).connect(bp.frequency);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, now);
      g.gain.linearRampToValueAtTime(gainVal != null ? gainVal : 0.3, now + 0.25);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);
      src.connect(bp).connect(g).connect(dest); src.start(now); lfo.start(now);
    },
    poison(ctx, dest, gainVal) { Synth.tone(ctx, dest, 220, 0.25, { type: 'sawtooth', vol: gainVal != null ? gainVal : 0.15, glide: 90 }); }, // 中毒低频下行
    reflect(ctx, dest, gainVal) { Synth.tone(ctx, dest, 330, 0.1, { type: 'square', vol: gainVal != null ? gainVal : 0.22, glide: 500 }); }, // 反伤
    roll(ctx, dest, gainVal) { // 骰子/翻滚：下滑点 + 落定
      Synth.tone(ctx, dest, 900, 0.05, { type: 'square', vol: 0.12, glide: 300 });
      Synth.tone(ctx, dest, 740, 0.18, { type: 'triangle', vol: gainVal != null ? gainVal : 0.4 });
    },
    treasure(ctx, dest, gainVal) { // 宝箱/奇遇：明亮上行
      Synth.bell(ctx, dest, 1046, 0, gainVal != null ? gainVal : 0.3);
      Synth.tone(ctx, dest, 1318, 0.2, { type: 'sine', vol: gainVal != null ? gainVal : 0.3, glide: 1568 });
    },
    seal(ctx, dest, gainVal) { // 劫印获得：双上行
      Synth.tone(ctx, dest, 440, 0.14, { type: 'sine', vol: gainVal != null ? gainVal : 0.25, glide: 660 });
      Synth.tone(ctx, dest, 660, 0.18, { type: 'sine', vol: gainVal != null ? gainVal : 0.28, glide: 880 });
    },
    equip(ctx, dest, gainVal) { Synth.tone(ctx, dest, 520, 0.1, { type: 'triangle', vol: gainVal != null ? gainVal : 0.28, glide: 780 }); }, // 装备获得
    warn(ctx, dest, gainVal) { // 警告：双声方波
      Synth.tone(ctx, dest, 330, 0.15, { type: 'square', vol: gainVal != null ? gainVal : 0.18, glide: 220 });
      Synth.tone(ctx, dest, 330, 0.15, { type: 'square', vol: gainVal != null ? gainVal : 0.18, glide: 220 });
    },
    lifeWarn(ctx, dest, gainVal) { Synth.tone(ctx, dest, 440, 0.12, { type: 'square', vol: gainVal != null ? gainVal : 0.2, glide: 330 }); }, // 寿烛将尽
    worship(ctx, dest, gainVal) { // 诵经梵呗（程序化近似：低频吟咏 + 上方泛音）
      Synth.tone(ctx, dest, 196, 0.4, { type: 'sine', vol: gainVal != null ? gainVal : 0.2, glide: 294 });
      Synth.tone(ctx, dest, 392, 0.4, { type: 'sine', vol: gainVal != null ? gainVal : 0.16 });
    },
  };

  // ---------------------------------------------------------------------------
  // Spatializer：俯视(top-down) PannerNode(HRTF) + 遮挡低通 + 共享混响链
  //   世界坐标 {x, z}：x=左(−)/右(+)，z=近(0)/远(−，屏幕上)
  //   监听者(listener) 置于玩家，朝 -z（屏幕上方）
  //   M9 关键修复：混响为单一共享 Convolver + 湿声发送，区域切换交叉淡入，
  //               杜绝"每发声音 new 一个 Convolver"造成的移动端掉帧。
  // ---------------------------------------------------------------------------
  class Spatializer {
    constructor(ctx, destination) {
      this.ctx = ctx; this.dest = destination;
      this.conv = ctx.createConvolver();
      this.wet = ctx.createGain(); this.wet.gain.value = REVERB_PRESETS.outdoor.wet;
      this.conv.connect(this.wet).connect(destination);
      this._zone = 'outdoor';
    }
    setZone(zone, irBuffer, crossfade = 0.4) {
      this._zone = zone;
      const pre = REVERB_PRESETS[zone] || REVERB_PRESETS.outdoor;
      const t = this.ctx.currentTime;
      this.wet.gain.cancelScheduledValues(t);
      this.wet.gain.setTargetAtTime(0.0001, t, 0.06); // 先淡出避免爆音
      setTimeout(() => {
        if (!this.ctx) return;
        this.conv.buffer = irBuffer;
        this.wet.gain.setTargetAtTime(pre.wet, this.ctx.currentTime, 0.06); // 淡入新混响
      }, crossfade * 1000);
    }
    connect(sourceNode, worldPos, occlusion = 0) {
      const p = this.ctx.createPanner();
      p.panningModel = 'HRTF';
      p.distanceModel = 'inverse';
      p.refDistance = 1; p.maxDistance = 30; p.rolloffFactor = 1;
      if (p.positionX) {
        p.positionX.value = worldPos.x; p.positionY.value = 0; p.positionZ.value = worldPos.z;
      } else {
        p.setPosition(worldPos.x, 0, worldPos.z);
      }
      sourceNode.connect(p);
      const lp = this.ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 800 + (1 - occlusion) * 12000; // 遮挡 1 → 800Hz
      p.connect(lp);
      lp.connect(this.dest);  // 干声
      lp.connect(this.conv);  // 湿声（共享）
      return p;
    }
  }

  // ===========================================================================
  // 区域音景（M8）：区域类型表 + 注册表
  // 游戏侧：把 17 区域映射到下列 zone-type，或 registerZone 自定义。
  // ===========================================================================
  const ZONE_TYPES = {
    outdoor: { reverb: 'outdoor', root: ROOT_DU, scale: MODE_DU, ambient: 'wind',  ambientGain: 0.12 },
    forest:  { reverb: 'outdoor', root: 146.83,  scale: MODE_DU, ambient: 'water', ambientGain: 0.14 },
    cave:    { reverb: 'cave',    root: ROOT_NI, scale: MODE_NI, ambient: 'cave',  ambientGain: 0.18 },
    temple:  { reverb: 'indoor',  root: 130.81,  scale: MODE_DU, ambient: null,    ambientGain: 0 },
    town:    { reverb: 'indoor',  root: 146.83,  scale: MODE_DU, ambient: 'wind',  ambientGain: 0.08 },
    abyss:   { reverb: 'cave',    root: ROOT_NI, scale: MODE_NI, ambient: 'cave',  ambientGain: 0.22 },
    boss:    { reverb: 'metal',   root: ROOT_NI, scale: MODE_NI, ambient: null,    ambientGain: 0 },
  };

  // M14：每区域旋律动机（让 17 区域在音乐上彼此可辨，不止混响/调式不同）
  // 用五声音阶度数（相对 zoneRoot 的倍频比）构成短乐句；调度器按拍点取音，可无限变体。
  const PENTA_RATIO = [1, 1.122, 1.25, 1.335, 1.5, 1.682, 2]; // 度 0..6（五声扩展）
  const ZONE_MOTIF = {
    outdoor: [0, 2, 4, 2, 3, 1, 0],
    forest:  [4, 3, 2, 4, 1, 2, 0],
    cave:    [0, 1, 3, 1, 0, 2, 1],
    temple:  [0, 3, 4, 2, 0, 3, 0],
    town:    [2, 0, 2, 4, 3, 1, 2],
    abyss:   [0, 1, 0, 2, 1, 0, 1],
    boss:    [0, 0, 3, 4, 0, 3, 0],
  };

  // M15：副歌/桥段旋律变体（更长、更宽音域、更明亮）——解决"短 7 音循环单调"
  const ZONE_MOTIF_B = {
    outdoor: [4, 3, 2, 4, 1, 0, 2, 3],
    forest:  [4, 3, 1, 2, 0, 1, 3, 2],
    cave:    [0, 1, 3, 1, 0, 2, 1, 3],
    temple:  [0, 3, 4, 2, 3, 0, 4, 2],
    town:    [2, 0, 2, 4, 3, 1, 2, 4],
    abyss:   [0, 1, 0, 2, 1, 0, 1, 2],
    boss:    [0, 0, 3, 4, 3, 0, 4, 3],
  };
  // M15：和声进行（每区域类型 4 个和弦，元素为相对 zoneRoot 的 PENTA_RATIO 度数索引 0..6）
  //   每小节走动一个和弦，pad 不再静止——"复杂"的核心来源。
  const CHORD_PROG = {
    outdoor: [[0,2,4],[1,3,5],[2,4,6],[0,3,5]],
    forest:  [[2,4,6],[0,2,4],[1,3,5],[2,4,6]],
    cave:    [[0,1,3],[2,3,5],[0,1,3],[1,2,4]],
    temple:  [[0,3,4],[2,4,6],[0,2,4],[1,3,5]],
    town:    [[2,4,6],[0,2,4],[1,3,5],[0,3,4]],
    abyss:   [[0,1,3],[1,2,4],[0,1,3],[1,3,5]],
    boss:    [[0,3,5],[0,3,4],[1,4,6],[0,3,5]],
  };
  // M15：8 小节长曲式段落（避免 7 音 3.5 小节原样重复）
  //   A 主歌 → B 副歌(更宽+对位) → A2 主歌变体(加琶音) → C 桥段(琶音流动)
  //   长曲式始终循环（解决"单调"核心）；RunDepth 仅加厚织体，不门控整体段落。
  function _formSection(bar) {
    const b = ((bar % 8) + 8) % 8;
    if (b < 4) return 'A';
    if (b < 6) return 'B';
    if (b < 7) return 'A2';
    return 'C';
  }

  // ===========================================================================
  // 事件注册表（M7）：数据驱动，未来可直接平移 Wwise JS 事件表
  // 简单事件用 data 描述，复合/特殊事件用 fn(ctx, busOut, vel) 自定义。
  // ===========================================================================
  function buildEvents(SCALE, Synth) {
    const E = {};
    // —— UI ——
    E['event:/UI/Button_Click'] = { bus: 'UI', priority: 0, fn: (c, b) => Synth.bell(c, b, SCALE.shang, 0, 0.3) };
    E['event:/UI/Menu_Open']    = { bus: 'UI', priority: 0, fn: (c, b) => Synth.bell(c, b, SCALE.gong, 0, 0.35) };
    E['event:/UI/Scripture_Gain']= { bus: 'VO', priority: 0, fn: (c, b) => { Synth.bell(c, b, SCALE.gong, 0, 0.3); Synth.bell(c, b, SCALE.zhi, 0.12, 0.25); } };
    // —— 战斗 SFX ——
    E['event:/SFX/Combat/Strike_Metal'] = { bus: 'SFX', priority: 1, fn: (c, b) => Synth.noiseHit(c, b, 0.18, 2600, 0.6) };
    E['event:/SFX/Combat/Spell_Cast']   = { bus: 'SFX', priority: 1, fn: (c, b) => { Synth.bell(c, b, SCALE.jue, 0, 0.4); Synth.noiseHit(c, b, 0.3, 1200, 0.3); } };
    E['event:/SFX/Combat/Boss_Roar']    = { bus: 'SFX', priority: 1, fn: (c, b) => Synth.pulse(c, b, 41, 0.9, 0.7) };
    // Boss 专属入场：低音涌动 + 上方金属泛音，走 Music 总线吃金属混响（压迫感）
    E['event:/Music/Sting/Boss_Enter'] = { bus: 'Music', priority: 1, fn: (c, b) => { Synth.pulse(c, b, 55, 1.2, 0.8); Synth.pulse(c, b, 110, 0.8, 0.4); Synth.noiseHit(c, b, 1.0, 600, 0.25); } };
    E['event:/SFX/Combat/Dodge']        = { bus: 'SFX', priority: 2, fn: (c, b) => Synth.noiseHit(c, b, 0.1, 3200, 0.35) };
    // —— 环境 ——
    E['event:/SFX/Environment/Chain_Rattle'] = { bus: 'SFX', priority: 2, fn: (c, b) => Synth.noiseHit(c, b, 0.4, 3000, 0.35) };
    E['event:/SFX/Environment/Door_Stone']   = { bus: 'SFX', priority: 1, fn: (c, b) => { Synth.pulse(c, b, 60, 0.6, 0.4); Synth.noiseHit(c, b, 0.5, 800, 0.25); } };
    // —— 经文 VO（渡/逆）——
    E['event:/VO/Scripture/Du_Gain'] = { bus: 'VO', priority: 0, fn: (c, b) => Synth.bell(c, b, SCALE.gong, 0, 0.4), resonance: +0.2 };
    E['event:/VO/Scripture/Ni_Gain'] = { bus: 'VO', priority: 0, fn: (c, b) => Synth.bell(c, b, SCALE.yu, 0, 0.4), resonance: -0.2 };
    // —— 试炼节点（六道统一词汇：天/人/阿修罗/畜生/饿鬼/地狱）——
    ['tian', 'ren', 'asura', 'chusheng', 'egui', 'diyu'].forEach((dao, i) => {
      const note = [SCALE.gong, SCALE.shang, SCALE.jue, SCALE.zhi, SCALE.yu, SCALE.gong][i];
      E['event:/Trial/' + dao + '/Enter'] = { bus: 'VO', priority: 0, fn: (c, b) => { Synth.bell(c, b, note, 0, 0.4); Synth.bell(c, b, note * 1.5, 0.18, 0.25); } };
    });
    // —— 特殊试炼（游戏侧可在 config 标记某 trial 节点为 special，覆盖常规六道音景）——
    // 镜像：同度双声部 + 失谐八度，营造"另一个自己"
    E['event:/Trial/Mirror/Enter'] = { bus: 'VO', priority: 0, fn: (c, b) => {
      Synth.bell(c, b, SCALE.gong, 0, 0.4);
      Synth.bell(c, b, SCALE.gong * 1.005, 0.05, 0.4); // 失谐 → 不安
      Synth.bell(c, b, SCALE.yu * 1.5, 0.22, 0.22);
    } };
    // 秘境：低沉钟磬 + 上方金属泛音，神秘感（吞噬感）
    E['event:/Trial/Secret/Enter'] = { bus: 'VO', priority: 0, fn: (c, b) => {
      Synth.bell(c, b, SCALE.gong / 2, 0, 0.5);
      Synth.bell(c, b, SCALE.jue, 0.25, 0.3);
      Synth.bell(c, b, SCALE.shang * 2, 0.4, 0.18);
    } };

    // —— M14：游戏同名 SFX（接管 NDX.sfx(name) 的 21 个名称）——
    // 统一注册为 event:/SFX/Game/<name> 并写入 SFX_BY_NAME，NDX_Audio.sfx 查表。
    const G = function (name, fn) {
      const p = 'event:/SFX/Game/' + name;
      E[p] = { bus: 'SFX', priority: 1, fn: fn };
      SFX_BY_NAME[name] = p;
    };
    G('click',       (c, b) => Synth.bell(c, b, SCALE.shang, 0, 0.3));
    G('open',        (c, b) => Synth.tone(c, b, 520, 0.14, { type: 'sine', vol: 0.3, glide: 880 }));
    G('hit',         (c, b) => Synth.fleshHit(c, b, 0.5));
    G('crit',        (c, b) => Synth.critHit(c, b, 0.5));
    G('guard',       (c, b) => Synth.guard(c, b, 0.4));
    G('victory',     (c, b) => Synth.victory(c, b, 0.34));
    G('defeat',      (c, b) => Synth.defeat(c, b, 0.2));
    G('lifeWarn',    (c, b) => Synth.lifeWarn(c, b, 0.2));
    G('roll',        (c, b) => Synth.roll(c, b, 0.4));
    G('treasure',    (c, b) => Synth.treasure(c, b, 0.3));
    G('colect',      (c, b) => Synth.pickup(c, b, 0.28));
    G('dodge',       (c, b) => Synth.arrow(c, b, 0.4));
    G('skill',       (c, b) => { Synth.bell(c, b, SCALE.jue, 0, 0.4); Synth.noiseHit(c, b, 0.3, 1200, 0.3); });
    // 绝招专用音（与普通技能区分）：宫音钟磬定底 + 爆裂击 + 低频噪声扫，三重叠加显分量（P1-7）
    G('ult',         (c, b) => { Synth.bell(c, b, SCALE.gong, 0, 0.45); Synth.critHit(c, b, 0.5); Synth.noiseHit(c, b, 0.35, 800, 0.4); });
    G('equip',       (c, b) => Synth.equip(c, b, 0.28));
    G('craft',       (c, b) => { Synth.bell(c, b, SCALE.gong, 0, 0.35); Synth.noiseHit(c, b, 0.2, 1200, 0.22); }); // 锻造/合成成功（game.js:5288/5305）
    G('seal',        (c, b) => Synth.seal(c, b, 0.26));
    G('hover',       (c, b) => Synth.hover(c, b, 0.1));
    G('warn',        (c, b) => Synth.warn(c, b, 0.18));
    G('heal',        (c, b) => Synth.healUp(c, b, 0.3));
    G('poison',      (c, b) => Synth.poison(c, b, 0.15));
    G('reflect',     (c, b) => Synth.reflect(c, b, 0.22));
    G('levelup',     (c, b) => Synth.levelUp(c, b, 0.36));
    G('worship',     (c, b) => Synth.worship(c, b, 0.2));
    // 纯移动脚步（游戏若需可 NDX.sfx('footstep') 调）
    G('footstep',    (c, b) => Synth.footstep(c, b, 0.22));

    return E;
  }

  // ===========================================================================
  // NDX_Audio 主引擎
  // ===========================================================================
  const NDX_Audio = {
    ctx: null, buses: {}, voiceMgr: null, spatializer: null,
    params: { CombatIntensity: 0, ThreatLevel: 0, ScriptureResonance: 0, PlayerHealth: 1, RunDepth: 0 },
    music: null, listener: { x: 0, z: 0 },
    events: null, zones: {}, currentZone: 'outdoor', zoneRoot: ROOT_DU, ambient: null,
    settings: { master: true, music: true, sfx: true, ui: true, voice: true },
    _limiter: null, _visHandler: null, _musicTimer: null,
    bossAct: null, bossFlavor: null, bossRootOff: 0, // M13：当前 Boss 动机变体
    musicRich: true, _curSection: 'A', _curChord: 0, // M15：丰富曲式开关 + 诊断

    // M1 + M9：总线树 + 手势解锁 + Master 限制器
    init() {
      if (this.ctx) return;
      const AC = global.AudioContext || global.webkitAudioContext;
      this.ctx = new AC();
      if (this.ctx.state === 'suspended') this.ctx.resume();

      const master = new Bus(this.ctx, 'Master', null, { gain: 0.8 });
      // M9：Master 限制器（移动端防破音爆音）
      const comp = this.ctx.createDynamicsCompressor();
      comp.threshold.value = -8; comp.knee.value = 6; comp.ratio.value = 12;
      comp.attack.value = 0.003; comp.release.value = 0.25;
      master._out.disconnect();
      master._out.connect(comp);
      comp.connect(this.ctx.destination);
      this._limiter = comp;

      this.buses = {
        Master: master,
        Music: new Bus(this.ctx, 'Music', master, { gain: 0.8 }),
        SFX: new Bus(this.ctx, 'SFX', master, { gain: 0.9 }),
        UI: new Bus(this.ctx, 'UI', master, { gain: 1.0 }),
        Ambience: new Bus(this.ctx, 'Ambience', master, { gain: 0.6 }),
        VO: new Bus(this.ctx, 'VO', master, { gain: 1.0 }),
      };
      this.voiceMgr = new VoiceManager(this.ctx, VOICE_BUDGET);
      this.spatializer = new Spatializer(this.ctx, this.buses.SFX._out);
      this.spatializer.setZone('outdoor', this._makeIR('outdoor'), 0);
      this.setListener(this.listener);
      this.events = buildEvents(SCALE, Synth);
      this._loadSettings();
      this._startAdaptiveMusic();
      this._bindVisibility(); // M9：后台挂起/恢复
    },

    _makeIR(zone) {
      const pre = REVERB_PRESETS[zone] || REVERB_PRESETS.outdoor;
      const len = Math.floor(this.ctx.sampleRate * pre.decay);
      const buf = this.ctx.createBuffer(2, len, this.ctx.sampleRate);
      for (let ch = 0; ch < 2; ch++) {
        const d = buf.getChannelData(ch);
        for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.2);
      }
      return buf;
    },

    // ---- 监听者（俯视：位于玩家，朝 -z）----
    setListener(pos) {
      if (!this.ctx) return;
      this.listener = pos || this.listener;
      const L = this.ctx.listener;
      if (L.positionX) {
        L.positionX.value = this.listener.x; L.positionY.value = 0; L.positionZ.value = this.listener.z;
        if (L.forwardX) {
          L.forwardX.value = 0; L.forwardY.value = 0; L.forwardZ.value = -1;
          L.upX.value = 0; L.upY.value = 1; L.upZ.value = 0;
        }
      } else if (L.setPosition) {
        L.setPosition(this.listener.x, 0, this.listener.z);
        L.setOrientation(0, 0, -1, 0, 1, 0);
      }
    },

    // -------------------------------------------------------------------------
    // 注册接口（M7/M8）
    // -------------------------------------------------------------------------
    registerEvent(path, def) { if (this.events) this.events[path] = def; },
    // 自定义区域类型：可传完整 cfg 对象，或传 ZONE_TYPES 的已有类型字符串（自动克隆）
    registerZone(id, cfg) {
      if (typeof cfg === 'string') {
        const base = ZONE_TYPES[cfg];
        if (base) ZONE_TYPES[id] = Object.assign({}, base);
        return;
      }
      ZONE_TYPES[id] = cfg;
    },

    // -------------------------------------------------------------------------
    // 设置（M9）：音乐/音效/语音/总开关，持久化到 localStorage（file:// 友好）
    // -------------------------------------------------------------------------
    _loadSettings() {
      try {
        const raw = global.localStorage && global.localStorage.getItem('ndx_audio_settings');
        if (raw) Object.assign(this.settings, JSON.parse(raw));
      } catch (e) {}
      this._applySettings();
    },
    _applySettings() {
      if (!this.ctx) return;
      const s = this.settings;
      this.buses.Master.setGain(s.master ? 0.8 : 0.0, 0.05);
      this.buses.Music.setGain(s.music ? 0.8 : 0.0, 0.05);
      this.buses.SFX.setGain(s.sfx ? 0.9 : 0.0, 0.05);
      this.buses.UI.setGain(s.ui ? 1.0 : 0.0, 0.05);
      this.buses.VO.setGain(s.voice ? 1.0 : 0.0, 0.05);
    },
    setSetting(key, on) {
      if (!(key in this.settings)) return;
      this.settings[key] = !!on;
      this._applySettings();
      try { global.localStorage && global.localStorage.setItem('ndx_audio_settings', JSON.stringify(this.settings)); } catch (e) {}
    },

    // -------------------------------------------------------------------------
    // M3/M6/M9：自适应音乐（量化节拍调度器）
    // -------------------------------------------------------------------------
    _startAdaptiveMusic() {
      const m = this.buses.Music._out;
      this.music = {
        drone: Synth.drone(this.ctx, m, 55, 0.06), // 常驻低音，不走语音预算
        bpm: 96, beat: 0, bar: 0, nextNoteTime: 0, timer: null,
      };
      this.music.secPerBeat = 60 / this.music.bpm;
      this.music.nextNoteTime = this.ctx.currentTime + 0.12;
      const tick = () => {
        if (!this.ctx) return;
        const lookahead = 0.12;
        while (this.music.nextNoteTime < this.ctx.currentTime + lookahead) {
          this._scheduleBeat(this.music.beat, this.music.nextNoteTime);
          this.music.beat++;
          if (this.music.beat % 4 === 0) this.music.bar++;
          this.music.nextNoteTime += this.music.secPerBeat;
        }
      };
      this.music.timer = setInterval(tick, 25);
      this._musicTimer = this.music.timer;
    },
    _pauseMusic() { if (this._musicTimer) { clearInterval(this._musicTimer); this._musicTimer = null; } },
    _resumeMusic() { if (this.music && !this._musicTimer) this._startAdaptiveMusic(); },

    // 当前调式根音：ScriptureResonance 在 逆(暗) ↔ 渡(亮) 间连续滑动
    _modeRoot() {
      const t = (this.params.ScriptureResonance + 1) / 2;
      return lerp(ROOT_NI, ROOT_DU, t);
    },

    _scheduleBeat(beat, t) {
      const ci = this.params.CombatIntensity;
      const threat = this.params.ThreatLevel;
      const depth = this.params.RunDepth;
      const root = this.zoneRoot; // M8：区域决定和声基音
      const bar = Math.floor(beat / 4);
      const rich = this.musicRich ? (0.25 + depth * 0.75) : 0;        // M15：深度加厚织体（用于未来微调，段落本身始终循环）
      const section = this.musicRich ? _formSection(bar) : 'A';        // M15：长曲式段落
      const chordIdx = ((bar % 4) + 4) % 4;                          // M15：每小节一个和弦
      this._curSection = section; this._curChord = chordIdx;
      if (beat % 4 === 0) this._schedulePad(t, root, chordIdx);                 // M15：按进行铺和弦（不再静止）
      if (this.musicRich && beat % 2 === 0) this._scheduleBass(t, chordIdx, ci);// M15：低音线律动
      if (beat % 2 === 0) this._scheduleMotif(beat, t, section);               // M14+M15：段落选旋律源
      if (this.musicRich && section === 'B' && beat % 2 === 1) this._scheduleCounter(t, root); // M15：副歌对位
      if (this.musicRich && (section === 'A2' || section === 'C')) this._scheduleArp(t, chordIdx, section); // M15：琶音流动
      if (threat > 0.3 && ci < 0.2) this._scheduleStalk(t, threat);   // M9：潜行压迫层（无战斗时）
      if (ci > 0.15) this._schedulePulse(t, 0.05 + ci * 0.22 + depth * 0.05); // M9：RunDepth 加深脉冲
      if (ci > 0.3) {                                                 // 战斗：打击乐进
        this._schedulePerc(t, 0.25 + ci * 0.4 + depth * 0.05);
        if (ci > 0.6 && beat % 2 === 1) this._schedulePerc(t + this.music.secPerBeat * 0.5, 0.15 + ci * 0.3);
      }
      if (ci >= 0.9 && beat % 8 === 0) this._scheduleBossMotif(t);    // Boss 动机每两小节
    },

    _schedulePad(t, root, chordIdx) {
      const v = this.voiceMgr.acquire(1);
      if (!v) return; // 超预算丢弃
      // M15：按当前和弦铺三音（带和声运动），替代原静止 root×[1,1.5,2]
      const prog = (CHORD_PROG[this.currentZone] || CHORD_PROG.outdoor);
      const chord = prog[((chordIdx % 4) + 4) % 4];
      const freqs = chord.map(d => root * PENTA_RATIO[((d % 7) + 7) % 7]);
      const spb = this.music.secPerBeat;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.16, t + 0.5);
      g.gain.exponentialRampToValueAtTime(0.0001, t + spb * 4 - 0.1);
      g.connect(this.buses.Music._out);
      let last = null;
      freqs.forEach(f => {
        const o = this.ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = f;
        const og = this.ctx.createGain(); og.gain.value = 0.33;
        o.connect(og).connect(g);
        o.start(t); o.stop(t + spb * 4);
        last = o;
      });
      if (last) last.onended = () => this.voiceMgr.release(v);
    },

    _scheduleStalk(t, threat) {
      const v = this.voiceMgr.acquire(2);
      if (!v) return;
      const root = this.zoneRoot;
      const o = this.ctx.createOscillator(); o.type = 'sawtooth';
      o.frequency.value = root / 2;
      const lp = this.ctx.createBiquadFilter(); lp.type = 'lowpass';
      lp.frequency.value = 200 + threat * 400;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.06 + threat * 0.05, t + 0.4);
      g.gain.exponentialRampToValueAtTime(0.0001, t + this.music.secPerBeat * 4);
      o.connect(lp).connect(g).connect(this.buses.Music._out);
      o.start(t); o.stop(t + this.music.secPerBeat * 4);
      o.onended = () => this.voiceMgr.release(v);
    },

    _schedulePulse(t, vel) { Synth.pulse(this.ctx, this.buses.Music._out, 55, 0.22, vel, () => {}); },
    _schedulePerc(t, vel) {
      const v = this.voiceMgr.acquire(2);
      if (!v) return;
      Synth.noiseHit(this.ctx, this.buses.Music._out, 0.14, 2400, vel, () => this.voiceMgr.release(v));
    },

    // M6 + M13：Boss 动机 —— 当前关隘决定根音偏移与音程性格（M13），
    // 渡/逆（ScriptureResonance）再叠加明暗着色，故同一 Boss 也随玩法偏移。
    _scheduleBossMotif(t) {
      const v = this.voiceMgr.acquire(1);
      if (!v) return;
      const base = this._modeRoot();
      const res = this.params.ScriptureResonance;
      const m = _bossMotifForAct(this.bossAct);
      this.bossFlavor = m.flavor;
      this.bossRootOff = m.off;
      const root = base * Math.pow(2, m.off / 12); // M13：每关隘独立基音
      const bright = res >= 0;
      const set = (BOSS_FLAVORS[m.flavor] && BOSS_FLAVORS[m.flavor][bright ? 'maj' : 'min']) || [0, 4, 7, 12];
      const spb = this.music.secPerBeat;
      let last = null;
      set.forEach((s, i) => {
        const f = root * Math.pow(2, s / 12);
        const o = this.ctx.createOscillator();
        const mod = this.ctx.createOscillator();
        const modGain = this.ctx.createGain();
        const g = this.ctx.createGain();
        const bp = this.ctx.createBiquadFilter();
        o.type = 'sine'; o.frequency.value = f;
        mod.type = 'sine'; mod.frequency.value = f * 2.76; modGain.gain.value = f * 1.2;
        mod.connect(modGain).connect(o.frequency);
        bp.type = 'bandpass'; bp.frequency.value = f * 2; bp.Q.value = 3;
        const tt = t + i * spb * 0.5;
        g.gain.setValueAtTime(0.0001, tt);
        g.gain.exponentialRampToValueAtTime(0.35, tt + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, tt + 0.5);
        o.connect(bp).connect(g).connect(this.buses.Music._out);
        o.start(tt); mod.start(tt); o.stop(tt + 0.55); mod.stop(tt + 0.55);
        last = o;
      });
      if (last) last.onended = () => this.voiceMgr.release(v);
    },

    // M14：区域旋律 —— 让各区域有可辨识的短乐句（探索时突出，战斗时压低让打击乐主导）
    _melodyFreq(deg) {
      const root = this.zoneRoot || ROOT_DU;
      const n = PENTA_RATIO.length;
      const r = PENTA_RATIO[((deg % n) + n) % n];
      return root * r;
    },
    _scheduleMotif(beat, t, section) {
      if (section === 'C') return; // M15：C 段旋律退场，交予琶音流动主导
      const v = this.voiceMgr.acquire(2);
      if (!v) return;
      const useB = (section === 'B');
      // M15：B 段用更宽更亮的副歌变体 ZONE_MOTIF_B，其余用主歌 ZONE_MOTIF
      const phrase = useB ? (ZONE_MOTIF_B[this.currentZone] || ZONE_MOTIF_B.outdoor)
                          : (ZONE_MOTIF[this.currentZone] || ZONE_MOTIF.outdoor);
      const deg = phrase[Math.floor(beat / 2) % phrase.length];
      const f = this._melodyFreq(deg);
      const ci = this.params.CombatIntensity;
      const vel = 0.10 + (1 - ci) * 0.08; // 探索更亮，战斗让位
      Synth.pluck(this.ctx, this.buses.Music._out, f, vel, () => this.voiceMgr.release(v));
    },

    // M15：低音线（按和声根音走律动，替代静态 drone 的单调节奏感）
    _scheduleBass(t, chordIdx, ci) {
      const v = this.voiceMgr.acquire(2);
      if (!v) return;
      const prog = (CHORD_PROG[this.currentZone] || CHORD_PROG.outdoor);
      const chord = prog[((chordIdx % 4) + 4) % 4];
      const f = this.zoneRoot * PENTA_RATIO[((chord[0] % 7) + 7) % 7] / 2; // 低八度根音律动
      const vel = 0.10 + (1 - ci) * 0.06;
      Synth.pulse(this.ctx, this.buses.Music._out, f, 0.20, vel, () => this.voiceMgr.release(v));
    },
    // M15：副歌对位旋律（五度平行的错位对比线，增加"复杂"层次）
    _scheduleCounter(t, root) {
      const v = this.voiceMgr.acquire(2);
      if (!v) return;
      const phrase = ZONE_MOTIF[this.currentZone] || ZONE_MOTIF.outdoor;
      const deg = phrase[Math.floor(this.music.beat / 2 + 3) % phrase.length]; // 错位取音
      const f = this._melodyFreq(deg) * 1.5; // 上方五度对位
      Synth.pluck(this.ctx, this.buses.Music._out, f, 0.07, () => this.voiceMgr.release(v));
    },
    // M15：琶音（A2/C 段分解和弦，增加流动感；声部占位 1 voice，内部短 pluck 自动收尾）
    _scheduleArp(t, chordIdx, section) {
      const v = this.voiceMgr.acquire(2);
      if (!v) return;
      const prog = (CHORD_PROG[this.currentZone] || CHORD_PROG.outdoor);
      const chord = prog[((chordIdx % 4) + 4) % 4];
      const spb = this.music.secPerBeat;
      const root = this.zoneRoot;
      const n = section === 'C' ? 4 : 3;
      for (let i = 0; i < n; i++) {
        const d = chord[i % chord.length];
        const f = root * PENTA_RATIO[((d % 7) + 7) % 7] * (i >= 2 ? 2 : 1);
        Synth.pluck(this.ctx, this.buses.Music._out, f, 0.08);
      }
      setTimeout(() => this.voiceMgr.release(v), Math.ceil(spb * 2 * 1000));
    },

    // M13：设置当前 Boss 关隘（驱动动机变体）；传入 null 复位
    setBossAct(act) {
      if (act == null) { this.bossAct = null; this.bossFlavor = null; this.bossRootOff = 0; return; }
      const a = Math.max(1, Math.min(17, act | 0));
      const m = _bossMotifForAct(a);
      this.bossAct = a; this.bossFlavor = m.flavor; this.bossRootOff = m.off;
    },

    // -------------------------------------------------------------------------
    // 唯一对外参数接口（游戏系统只调这个）
    // -------------------------------------------------------------------------
    set(name, value) { this.setParameter(name, value); },
    setParameter(name, value) {
      if (!(name in this.params)) return;
      const v = clamp(value, 0, 1);
      this.params[name] = v;
      switch (name) {
        case 'CombatIntensity':
          this.buses.Music.setGain(lerp(0.5, 0.95, v), 0.1); // 战斗越烈整体越饱满
          break;
        case 'ThreatLevel':
          // 潜行压迫：提高 drone 亮度上限（由调度器读取）
          break;
        case 'RunDepth':
          // 区域深度：加深脉冲/打击（由调度器读取）
          break;
        case 'PlayerHealth': // 濒死 → 全局低通
          if (v < 0.2) {
            const hz = 400 + v * 2000;
            this.buses.Music.setLowpass(hz, 0.2);
            this.buses.Ambience.setLowpass(hz, 0.2);
          } else {
            this.buses.Music.setLowpass(20000, 0.2);
            this.buses.Ambience.setLowpass(20000, 0.2);
          }
          break;
        // ScriptureResonance 由调度器实时读取
        default: break;
      }
    },

    // -------------------------------------------------------------------------
    // 自适应音乐总开关（M9 集成用）：on=false 时静音 Music/Ambience 总线，
    // 调度器仍运行但不出声，便于与既有 MP3 BGM 平滑切换、零爆音。
    // -------------------------------------------------------------------------
    setMusicEnabled(on) {
      if (!this.ctx) return;
      this._musicOn = !!on;
      const mGain = on ? (this.settings.music ? 0.8 : 0) : 0;
      const aGain = on ? (this.settings.music ? 0.6 : 0) : 0;
      this.buses.Music.setGain(mGain, 0.06);
      this.buses.Ambience.setGain(aGain, 0.06);
    },

    // M15：丰富曲式开关（默认 true）；设 false 退化为原版单循环（仅主歌 A + 静止 pad）
    setMusicRich(on) { this.musicRich = !!on; },

    // -------------------------------------------------------------------------
    // 三按键战斗：普攻(中性) / 渡式(+resonance) / 逆式(−resonance)
    // -------------------------------------------------------------------------
    combat(type) {
      if (!this.ctx) return;
      const sfx = this.buses.SFX._out;
      const v = this.voiceMgr.acquire(1);
      const root = this._modeRoot();
      if (type === 'du') {
        if (v) Synth.pluck(this.ctx, sfx, root * 2, 0.5);
        this.setParameter('ScriptureResonance', clamp(this.params.ScriptureResonance + 0.15, -1, 1));
        this._scriptureFeedback('du');
      } else if (type === 'ni') {
        if (v) Synth.pluck(this.ctx, sfx, root, 0.5);
        this.setParameter('ScriptureResonance', clamp(this.params.ScriptureResonance - 0.15, -1, 1));
        this._scriptureFeedback('ni');
      } else {
        if (v) Synth.pluck(this.ctx, sfx, SCALE.gong, 0.45);
      }
      if (v) setTimeout(() => this.voiceMgr.release(v), 320);
    },
    _scriptureFeedback(kind) {
      const v = this.voiceMgr.acquire(0); // UI/VO 级，永不 steal
      const arr = kind === 'du' ? MODE_DU.slice(0, 3) : MODE_NI.slice(0, 3);
      arr.forEach((f, i) => Synth.bell(this.ctx, this.buses.VO._out, f, i * 0.1, 0.4));
      setTimeout(() => this.voiceMgr.release(v), 600);
    },

    // -------------------------------------------------------------------------
    // M7：事件播放（数据驱动查表）
    // -------------------------------------------------------------------------
    playEvent(eventPath, vel = 1) {
      if (!this.ctx || !this.events) return;
      const def = this.events[eventPath];
      if (!def) return; // 未注册事件静默（便于扩展）
      const v = this.voiceMgr.acquire(def.priority != null ? def.priority : 2);
      if (!v) return; // 超语音预算，丢弃该发声（steal 已尽量让位）
      const busOut = this.buses[def.bus] ? this.buses[def.bus]._out : this.buses.SFX._out;
      def.fn(this.ctx, busOut, vel);
      if (def.resonance) this.setParameter('ScriptureResonance', clamp(this.params.ScriptureResonance + def.resonance, -1, 1));
      // 复合/钟磬事件靠 onended 释放；一次性包一层兜底
      setTimeout(() => this.voiceMgr.release(v), 700);
    },

    // -------------------------------------------------------------------------
    // M4/M8/M9：区域音景切换（环境层 + 调式根音 + 共享混响交叉淡入）
    // -------------------------------------------------------------------------
    setZone(zoneOrId) {
      if (!this.ctx) return;
      const cfg = ZONE_TYPES[zoneOrId];
      if (!cfg) return;
      this.currentZone = zoneOrId;
      this.zoneRoot = cfg.root;
      this.spatializer.setZone(cfg.reverb, this._makeIR(cfg.reverb), 0.4);
      // 环境层热切换
      if (this.ambient) { this.ambient.stop(); this.ambient = null; }
      if (cfg.ambient) {
        this.ambient = Synth.ambience(this.ctx, this.buses.Ambience._out, cfg.ambient, cfg.ambientGain);
      }
    },

    // -------------------------------------------------------------------------
    // 空间化播放（世界内 diegetic 声音，俯视坐标）
    // -------------------------------------------------------------------------
    spawnSpatial(eventPath, worldPos, listenerPos, occlusion = 0) {
      if (!this.ctx) return;
      this.setListener(listenerPos || this.listener);
      const def = this.events && this.events[eventPath];
      const v = this.voiceMgr.acquire(def && def.priority != null ? def.priority : 2);
      if (!v) return; // 超预算丢弃
      const len = Math.floor(this.ctx.sampleRate * 0.2);
      const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
      const src = this.ctx.createBufferSource(); src.buffer = buf;
      this.spatializer.connect(src, worldPos, occlusion);
      src.onended = () => this.voiceMgr.release(v);
      src.start();
    },

    // -------------------------------------------------------------------------
    // M9：后台挂起/恢复（手机切后台再回来防止变静音）
    // -------------------------------------------------------------------------
    _bindVisibility() {
      const doc = global.document;
      if (!doc || !doc.addEventListener) return;
      this._visHandler = () => {
        if (!this.ctx) return;
        if (doc.hidden) {
          this._pauseMusic();
          this.buses.Master.setGain(0, 0.05); // 后台静默
        } else {
          if (this.ctx.state === 'suspended') this.ctx.resume();
          this._applySettings();
          this._resumeMusic();
        }
      };
      doc.addEventListener('visibilitychange', this._visHandler);
      // 首次手势后确保恢复（部分 webview 需二次 resume）
      const resumeOnce = () => {
        if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
        global.removeEventListener && global.removeEventListener('touchend', resumeOnce);
        global.removeEventListener && global.removeEventListener('click', resumeOnce);
      };
      global.addEventListener && global.addEventListener('touchend', resumeOnce, { once: true });
      global.addEventListener && global.addEventListener('click', resumeOnce, { once: true });
    },

    // -------------------------------------------------------------------------
    // M10：诊断与真机自检
    // -------------------------------------------------------------------------
    getDiagnostics() {
      if (!this.ctx) return { ready: false };
      const all = this.voiceMgr.count();
      // 压力计数只统计 priority>0 的玩法发声（UI/VO priority 0 为豁免额度，永不参与 steal/超额判定）
      const stress = this.voiceMgr.voices.filter(function (v) { return v.priority > 0; }).length;
      const estDSPms = (stress * 0.02 + (this.ambient ? 0.08 : 0)).toFixed(2);
      return {
        ready: true,
        state: this.ctx.state,
        sampleRate: this.ctx.sampleRate,
        baseLatency: this.ctx.baseLatency,
        voices: all,
        voicesStress: stress,
        maxVoices: VOICE_BUDGET.maxVoices,
        zone: this.currentZone,
        zoneRoot: Math.round(this.zoneRoot),
        bossAct: this.bossAct,
        bossFlavor: this.bossFlavor,
        bossRootOff: this.bossRootOff,
        formSection: this._curSection,
        chordIndex: this._curChord,
        musicRich: this.musicRich,
        settings: Object.assign({}, this.settings),
        params: Object.assign({}, this.params),
        estDSPms: Number(estDSPms),
        budgetOk: stress <= VOICE_BUDGET.maxVoices,
      };
    },
    // 真机压力测试：瞬时铺满语音，报告峰值占用（仅为诊断，不影响游戏）
    selfTest(burst = 40) {
      if (!this.ctx) return { error: 'not init' };
      const peak = { voices: 0 };
      for (let i = 0; i < burst; i++) {
        this.playEvent('event:/SFX/Combat/Strike_Metal');
        peak.voices = Math.max(peak.voices, this.voiceMgr.count());
      }
      return { requested: burst, peakVoices: peak.voices, maxVoices: VOICE_BUDGET.maxVoices, stealOk: peak.voices <= VOICE_BUDGET.maxVoices };
    },

    // 调试读数
    getParams() { return Object.assign({}, this.params); },
  };

  global.NDX_Audio = NDX_Audio;
  // 接入《逆道西行》真实工程：同时挂到 NDX.audio，供桥接层 ndx_audio_bridge.js 调用
  try { global.NDX = global.NDX || {}; global.NDX.audio = NDX_Audio; } catch (e) {}
  if (typeof module !== 'undefined') module.exports = NDX_Audio;
})(typeof window !== 'undefined' ? window : this);
