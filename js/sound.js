// =============================================================
// sound.js —— 音效模块（阶段七 · 音效综合）
// 全程 Web Audio 即时合成，零外部音频资源，fit 本地 file:///静态服务器。
// 所有发声入口统一 NDX.sound.play(name)，内部做「静音 / 上下文未就绪」守卫，
// 任何调用失败都不会影响主逻辑。首次用户手势才创建 AudioContext（浏览器策略）。
// 静音偏好落 localStorage，跨周目记忆。
// =============================================================
(function () {
  var NDX = window.NDX;
  const SND_KEY = NDX.storage.KEYS.SOUND;
  // =============================================================
  // 自制音轨资源表（v=353 音频整改）：
  // 5 条 BGM（title/map/fight/boss/home）+ 3 条音效（click 木鱼点击 / zhuanjie 转职觉醒 / worship 诵经梵呗）。
  // 音频文件位于 assets/sound/*.mp3，由 AI 音频工具自制（生成→转码 MP3 128kbps 单声道 44.1kHz），无第三方版权。
  // 详细说明与自制凭证见 docs/音频音轨说明_2026-09-01.md。
  // 保留 Web Audio 程序化合成作为音效降级方案（文件缺失/不可用时回退）。
  // =============================================================
  const BGM_FILES = {
    title: 'assets/sound/bgm_title.mp3',
    map: 'assets/sound/bgm_map.mp3',
    fight: 'assets/sound/bgm_fight.mp3',
    boss: 'assets/sound/bgm_boss.mp3',
    home: 'assets/sound/bgm_home.mp3',
  };
  const SFX_FILES = {
    click: 'assets/sound/sfx_click.mp3',
    zhuanjie: 'assets/sound/sfx_zhuanjie.mp3',
    worship: 'assets/sound/sfx_worship.mp3',
  };
  const SND = {
    _ctx: null,
    _on: true,
    _master: null,
    _ready: false,

    _ensure() {
      if (this._ctx) return true;
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return false;
        this._ctx = new AC();
        this._master = this._ctx.createGain();
        // V8.5x 应用用户设置的音量（默认0.5，master gain = vol * 0.9）
        const vol = this._volume != null ? this._volume : 0.5;
        this._master.gain.value = vol * 0.9;
        this._master.connect(this._ctx.destination);
        this._ready = true;
        return true;
      } catch (e) { return false; }
    },

    isOn() { return this._on; },

    toggle() {
      this._on = !this._on;
      // V8.40 通过统一模块 NDX.SaveSystem 保存布尔值
      if (NDX.SaveSystem && typeof NDX.SaveSystem.saveBoolean === 'function') {
        NDX.SaveSystem.saveBoolean(SND_KEY, this._on);
      } else {
        try { NDX.storage.save(SND_KEY, this._on); } catch (e) {}
      }
      // 静音同步停 BGM；恢复静音时若此前有场景意图则重启
      // 静音停 BGM（保留场景意图）；恢复时若有场景且未播放则重启
      if (!this._on) {
        if (this._bgm.audio) { try { this._bgm.audio.pause(); } catch (e) {} }
      }
      else if (this._bgm.scene && !this._bgm.audio) { this.music(this._bgm.scene); }
      return this._on;
    },

    // tone(freqHz, durSec, {type,glide,vol}) —— 木鱼 / 金石 / 法铃式合成拍
    _tone(f, dur, opt) {
      if (!this._ensure()) return;
      if (!this._on) return;
      const o = this._ctx.createOscillator();
      const g = this._ctx.createGain();
      const t = this._ctx.currentTime;
      o.type = (opt && opt.type) || 'sine';
      const vol = (opt && opt.vol) || 0.5;
      o.frequency.setValueAtTime(f, t);
      if (opt && opt.glide) o.frequency.exponentialRampToValueAtTime(Math.max(30, opt.glide), t + dur);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(vol, t + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(this._master);
      o.start(t);
      o.stop(t + dur + 0.02);
    },

    _strike(f, dur, opt) {
      this._tone(f, dur, Object.assign({ type: 'triangle' }, opt));
      if (opt && opt.overtone) this._tone(f * opt.overtone, dur * 0.7, Object.assign({ type: 'sine', v: (opt.vol || 0.5) * 0.4 }, opt));
    },

    // 主音量计算值（与 master gain 一致），供 Audio 文件播放同步
    _vol() {
      const v = this._volume != null ? this._volume : 0.5;
      return Math.max(0, Math.min(1, v)) * 0.9;
    },
    // 播放音效音频文件；成功返回 true（供调用方跳过 Web Audio 合成降级）
    _sfxFile(name) {
      const src = SFX_FILES[name];
      if (!src) return false;
      try {
        const a = new Audio(src);
        a.volume = this._vol();
        a.play().catch(function () {});
        return true;
      } catch (e) { return false; }
    },

    play(name) {
      if (!this._on || !this._ctx) this._ensure();
      if (!this._on || !this._ctx) return;
      switch (name) {
        case 'click':   if (!this._sfxFile('click')) this._strike(660, 0.06, { vol: 0.22 }); break; // ui click (track first)               // 木鱼轻点
        case 'open':    this._tone(520, 0.14, { type: 'sine', vol: 0.3, glide: 880 }); break; // 展卷
        case 'hit':     this._strike(180, 0.12, { vol: 0.4, overtone: 1.8 }); break;  // 受击闷响
        case 'crit':    this._strike(880, 0.16, { type: 'square', vol: 0.32, overtone: 1.5 }); break; // 爆发
        case 'guard':   this._strike(420, 0.10, { vol: 0.3, overtone: 2.1 }); break;  // 格挡脆响
        case 'victory': // 三连上行法铃
          this._tone(523, 0.16, { type: 'sine', vol: 0.3 });
          this._timeout(() => this._tone(659, 0.16, { type: 'sine', vol: 0.32 }), 130);
          this._timeout(() => this._tone(784, 0.28, { type: 'sine', vol: 0.36, glide: 1046 }), 260);
          break;
        case 'defeat':  // 下沉低鸣
          this._tone(220, 0.4, { type: 'sawtooth', vol: 0.18, glide: 110 });
          break;
        case 'lifeWarn': this._tone(440, 0.12, { type: 'square', vol: 0.2, glide: 330 }); break; // 寿烛将尽
        case 'roll':    // 骰子滚动→落定
          this._tone(900, 0.05, { type: 'square', vol: 0.12, glide: 300 });
          this._timeout(() => this._tone(1200, 0.05, { type: 'square', vol: 0.12, glide: 400 }), 90);
          this._timeout(() => this._strike(740, 0.18, { type: 'triangle', vol: 0.4 }), 180);
          break;
        case 'treasure': this._strike(1000, 0.12, { type: 'sine', vol: 0.3, overtone: 1.5 }); this._timeout(() => this._tone(1200, 0.2, { type: 'sine', vol: 0.3, glide: 1500 }), 90); break;
        case 'colect':  this._tone(700, 0.1, { type: 'sine', vol: 0.28, glide: 1050 }); break; // 收集
        // —— V8.37 音效扩展，闪避 / 技能 / 装备 / 劫印 / 悬停 / 警告 ——
        case 'dodge':   this._tone(1200, 0.08, { type: 'sine', vol: 0.2, glide: 600 }); break; // 闪避（高频下滑）
        case 'skill':   this._strike(660, 0.14, { type: 'triangle', vol: 0.3, overtone: 1.5 }); this._timeout(() => this._tone(880, 0.12, { type: 'sine', vol: 0.25, glide: 1320 }), 60); break; // 技能释放
        case 'ult':     // 绝招（P1-7 专用音，legacy 合成回退）：低宫音 + 爆裂 + 上行扫尾
          this._strike(294, 0.3, { type: 'triangle', vol: 0.4, overtone: 1.5 });
          this._strike(880, 0.16, { type: 'square', vol: 0.3 });
          this._timeout(() => this._tone(440, 0.28, { type: 'sine', vol: 0.3, glide: 1046 }), 140);
          break;
        case 'equip':   this._strike(520, 0.1, { type: 'triangle', vol: 0.28, overtone: 2 }); this._timeout(() => this._tone(780, 0.14, { type: 'sine', vol: 0.25 }), 80); break; // 装备获得
        case 'seal':    this._tone(440, 0.12, { type: 'sine', vol: 0.25, glide: 660 }); this._timeout(() => this._tone(660, 0.16, { type: 'sine', vol: 0.28, glide: 880 }), 100); break; // 劫印获得
        case 'hover':   this._tone(880, 0.04, { type: 'sine', vol: 0.1 }); break; // 按钮悬停（极轻）
        case 'warn':    this._tone(330, 0.15, { type: 'square', vol: 0.18, glide: 220 }); this._timeout(() => this._tone(330, 0.15, { type: 'square', vol: 0.18, glide: 220 }), 200); break; // 警告（双声）
        case 'heal':    this._tone(523, 0.12, { type: 'sine', vol: 0.22, glide: 784 }); this._timeout(() => this._tone(659, 0.16, { type: 'sine', vol: 0.24, glide: 880 }), 80); break; // 治疗（上行）
        case 'poison':  this._tone(220, 0.2, { type: 'sawtooth', vol: 0.15, glide: 110 }); break; // 中毒（低频下行）
        case 'reflect': this._strike(330, 0.1, { type: 'square', vol: 0.22, overtone: 1.5 }); break; // 反伤
        case 'levelup': if (this._sfxFile('zhuanjie')) break; // zhuanjie track first // 升级/转职（四连上行）
          this._tone(523, 0.12, { type: 'sine', vol: 0.28 });
          this._timeout(() => this._tone(659, 0.12, { type: 'sine', vol: 0.3 }), 100);
          this._timeout(() => this._tone(784, 0.12, { type: 'sine', vol: 0.32 }), 200);
          this._timeout(() => this._tone(1046, 0.24, { type: 'sine', vol: 0.36, glide: 1318 }), 300);
          break;
        case 'worship': if (!this._sfxFile('worship')) { this._tone(220, 0.3, { type: 'sine', vol: 0.2, glide: 330 }); this._timeout(() => this._tone(440, 0.3, { type: 'sine', vol: 0.18 }), 250); } break; // worship chant (track first)
        default: break;
      }
    },
    _timeout(fn, ms) { try { setTimeout(fn, ms); } catch (e) {} },

    // =============================================================
    // V8.35 BGM 背景音乐（Web Audio 即时合成，零外部音频资源）
    // 设计：五声音阶 + 长音垫底 + 循环呼吸，营造「黑暗西游 · 水墨」氛围。
  // 场景：title 主界面 / map 地图 / fight 战斗 / boss Boss / home 长安大本营
  // 与音效共用同一 AudioContext，但走独立 gain 总线（BGM 音量更低），
  // 静音开关同时作用于 BGM（toggle 时一起停/起）。
    // =============================================================
    _bgm: {
      audio: null, scene: null,
      _clear() {
        if (this.audio) {
          try { this.audio.pause(); this.audio.src = ''; } catch (e) {}
          this.audio = null;
        }
        this.scene = null;
      },
    },
    music(scene) {
      const B = this._bgm;
      if (!scene || scene === 'none') { B._clear(); return; }
      // 静音时切场景：只记意图（toggle 恢复时再起）
      if (!this._on) {
        if (B.scene !== scene) { B._clear(); B.scene = scene; }
        return;
      }
      const src = BGM_FILES[scene];
      if (!src) return;
      if (B.scene === scene && B.audio) return; // 同场景不重启
      B._clear();
      B.scene = scene;
      try {
        const a = new Audio(src);
        a.loop = true;
        a.preload = 'auto';
        a.volume = Math.max(0, Math.min(0.4, this._vol() * 0.35)); // BGM 明显低于音效
        a.play().catch(function () {});
        B.audio = a;
      } catch (e) { B.audio = null; }
    },
    // 停止背景音乐
    musicStop() { this._bgm._clear(); },
    bgmScene() { return this._bgm.scene; },

    // 首次用户手势：初始化音频上下文并遵循静音记忆（应在首帧后调用一次）
    init() {
      try {
      // V8.40 通过统一模块 NDX.SaveSystem 读取布尔值
        let v = null;
        if (NDX.SaveSystem && typeof NDX.SaveSystem.loadBoolean === 'function') {
          v = NDX.SaveSystem.loadBoolean(SND_KEY, null);
        } else {
          const raw = NDX.storage.load(SND_KEY);
          v = (raw === false) ? false : (raw === true ? true : null);
        }
        if (v === false) this._on = false;
      } catch (e) {}
      // V8.5x 加载保存的音量偏好
      try {
        let savedVol = null;
        if (NDX.SaveSystem && typeof NDX.SaveSystem.load === 'function') {
          savedVol = NDX.SaveSystem.load(NDX.storage.KEYS.SOUND_VOL, null);
        } else {
          const rawVol = NDX.storage.load(NDX.storage.KEYS.SOUND_VOL);
          if (rawVol != null) savedVol = parseFloat(rawVol);
        }
        if (savedVol != null && !isNaN(savedVol)) {
          this._volume = Math.max(0, Math.min(1, savedVol));
        }
      } catch (e) {}
      this._ensure();
    },

    // V8.5x 音量调节：设置主音量（0.0~1.0），持久化到 localStorage，AudioContext 未就绪时先创建
    setVolume(v) {
      const vol = Math.max(0, Math.min(1, parseFloat(v) || 0));
      this._volume = vol;
      if (this._ensure() && this._master) {
        try { this._master.gain.value = vol * 0.9; } catch (e) {}
      }
      // 同步 BGM 音频文件音量（与 master gain 同源，BGM 再压低一档）
      if (this._bgm && this._bgm.audio) {
        try { this._bgm.audio.volume = Math.max(0, Math.min(0.4, vol * 0.9 * 0.35)); } catch (e) {}
      }
      try {
        if (NDX.SaveSystem && typeof NDX.SaveSystem.save === 'function') {
          NDX.SaveSystem.save(NDX.storage.KEYS.SOUND_VOL, vol);
        } else {
          NDX.storage.save(NDX.storage.KEYS.SOUND_VOL, vol);
        }
      } catch (e) {}
      return vol;
    },
    getVolume() { return this._volume != null ? this._volume : 0.5; },
  };

  NDX.sound = SND;

  // 静音偏好以选项注入，用于装潢 on/off 按钮文案
  // 并保证「静音 / 上下文未就绪 / 播放异常」三种情况都静默降级，绝不中断调用方。
  NDX.sfx = function (name) {
    try { if (NDX.sound && typeof NDX.sound.play === 'function') NDX.sound.play(name); } catch (e) {}
  };

  // 静音偏好以选项注入，用于装潢 on/off 按钮文案
  if (!NDX.soundInitFired) {
    NDX.soundInitFired = true;
    const kick = function () {
      try { if (NDX.sound) NDX.sound.init(); } catch (e) {}
      // 浏览器有原生 DOM 事件；微信小游戏 window 为 plain 对象（见 minigame/adapter.js），
      // 无 addEventListener 时跳过，避免启动时抛 TypeError 中断逻辑层初始化。
      if (typeof window.removeEventListener === 'function') {
        window.removeEventListener('pointerdown', kick);
        window.removeEventListener('keydown', kick);
      }
    };
    if (typeof window.addEventListener === 'function') {
      window.addEventListener('pointerdown', kick);
      window.addEventListener('keydown', kick);
    }
  }
})();