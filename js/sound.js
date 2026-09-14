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
  // V8.6x OGG格式支持：优先使用OGG格式（文件更小），不支持时回退到MP3
  const _useOgg = (function () {
    try {
      const a = document.createElement('audio');
      return !!(a.canPlayType && a.canPlayType('audio/ogg; codecs="opus"').replace(/no/, ''));
    } catch (e) { return false; }
  })();
  const _ext = _useOgg ? 'ogg' : 'mp3';
  // V8.7 BGM 全量切换为 AI 生成音乐（零第三方版权负担），逐场景声明可用格式：
  // 有 ogg 的场景在浏览器支持时用 ogg，否则一律 mp3；播放失败时 music() 内再做另一格式回退。
  // 注：AI 重生音轨为 MP3（Suno 输出），重生场景将其 ogg 偏好置 0 以直用 MP3，
  // 避免浏览器回退到旧的 bgm_*.ogg（音画整改时再统一转码 ogg）。
  const _hasOgg = { title: 0, map: 1, fight: 1, boss: 1, home: 1, event: 1, shop: 1, rest: 1, ending: 1, hidden: 1 };
  const _bgmSrc = function (scene, base) { return 'assets/sound/' + base + '.' + ((_useOgg && _hasOgg[scene]) ? 'ogg' : 'mp3'); };
  // Seed Audio 1.0：全套黑暗西游原创配乐（WAV 22050Hz/8bit/单声道，浏览器原生支持）
  const BGM_FILES = {
    title: 'assets/sound/bgm_title_seed.wav',
    map: 'assets/sound/bgm_map_seed.wav',
    fight: 'assets/sound/bgm_fight_seed.wav',
    boss: 'assets/sound/bgm_boss_seed.wav',
    home: 'assets/sound/bgm_home_seed.wav',
    event: 'assets/sound/bgm_event_seed.wav',
    shop: 'assets/sound/bgm_shop_seed.wav',
    rest: 'assets/sound/bgm_rest_seed.wav',
    ending: 'assets/sound/bgm_ending_seed.wav',
    hidden: 'assets/sound/bgm_hidden_seed.wav',
  };
  const SFX_FILES = {
    click: 'assets/sound/sfx_click.wav',
    zhuanjie: 'assets/sound/sfx_zhuanjie.wav',
    worship: 'assets/sound/sfx_worship.wav',
    // V8.6x 新增音效：攻击/受击/暴击/格挡/闪避/技能/绝招/装备/劫印/治疗/中毒/反伤/升级/收集/宝藏/警告/悬停/胜利/失败/生命警告/骰子/展卷
    attack: 'assets/sound/sfx_attack.wav',
    hit: 'assets/sound/sfx_hit.wav',
    crit: 'assets/sound/sfx_crit.wav',
    guard: 'assets/sound/sfx_guard.wav',
    dodge: 'assets/sound/sfx_dodge.wav',
    skill: 'assets/sound/sfx_skill.wav',
    ult: 'assets/sound/sfx_ult.wav',
    equip: 'assets/sound/sfx_equip.wav',
    seal: 'assets/sound/sfx_seal.wav',
    heal: 'assets/sound/sfx_heal.wav',
    poison: 'assets/sound/sfx_poison.wav',
    reflect: 'assets/sound/sfx_reflect.wav',
    levelup: 'assets/sound/sfx_levelup.wav',
    collect: 'assets/sound/sfx_collect.wav',
    treasure: 'assets/sound/sfx_treasure.wav',
    warn: 'assets/sound/sfx_warn.wav',
    hover: 'assets/sound/sfx_hover.wav',
    victory: 'assets/sound/sfx_victory.wav',
    defeat: 'assets/sound/sfx_defeat.wav',
    lifewarn: 'assets/sound/sfx_lifewarn.wav',
    roll: 'assets/sound/sfx_roll.wav',
    open: 'assets/sound/sfx_open.wav',
  };
  // V8.6x 环境音文件：风声/雨声/寺庙钟声/火焰/水流/鸟鸣
  const AMBIENT_FILES = {
    wind: 'assets/sound/ambient_wind.wav',
    rain: 'assets/sound/ambient_rain.wav',
    bell: 'assets/sound/ambient_bell.wav',
    fire: 'assets/sound/ambient_fire.wav',
    water: 'assets/sound/ambient_water.wav',
    bird: 'assets/sound/ambient_bird.wav',
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
        a.volume = Math.max(0, Math.min(0.8, this._bgmVolume * 0.8)); // V8.7 提高BGM音量，让用户能听到背景音乐
        // V8.7 格式回退：当前扩展名文件缺失（onerror）时，尝试另一扩展名续播同场景
        a.onerror = function () {
          try {
            if (B.audio !== a) return; // 场景已被切换/清除则不再回退
            // Seed Audio 1.0：候选链依次尝试，单次失败不再终结整条链
            //   _seed.wav → _ai.ogg → 旧版裸名.ogg → 旧版裸名.mp3
            //   （title / home 两场景无 _ai 版，必须能落到旧版裸名，否则整场静音）
            const cands = [];
            if (src.indexOf('_seed.wav') >= 0) {
              const stem = src.replace('_seed.wav', '');
              cands.push(stem + '_ai.ogg', stem + '.ogg', stem + '.mp3');
            } else if (src.indexOf('.ogg') >= 0) {
              cands.push(src.replace('.ogg', '.mp3'));
            } else {
              cands.push(src.replace('.mp3', '.ogg'));
            }
            // 防御：剔除与原始 src 相同的候选，避免自环重试
            const list = cands.filter(function (c) { return c && c !== src; });
            (function next(i, prev) {
              if (B.audio !== prev) return;              // 场景已切换/清除，终止回退
              if (i >= list.length) { B.audio = null; return; }
              const b = new Audio(list[i]);
              b.loop = true;
              b.preload = 'auto';
              b.volume = prev.volume;
              b.onerror = function () { next(i + 1, b); };
              b.play().catch(function () {});
              B.audio = b;
            })(0, a);
          } catch (e) {}
        };
        a.play().catch(function () {});
        B.audio = a;
      } catch (e) { B.audio = null; }
    },
    // 停止背景音乐
    musicStop() { this._bgm._clear(); },
    bgmScene() { return this._bgm.scene; },

    // =============================================================
    // V8.6x 环境音系统（风声/雨声/寺庙钟声/火焰/水流/鸟鸣）
    // 与BGM独立，音量更低，营造场景氛围
    // =============================================================
    _ambient: {
      audio: null, scene: null,
      _clear() {
        if (this.audio) {
          try { this.audio.pause(); this.audio.src = ''; } catch (e) {}
          this.audio = null;
        }
        this.scene = null;
      },
    },
    // 播放环境音
    ambient(scene) {
      const A = this._ambient;
      if (!scene || scene === 'none') { A._clear(); return; }
      // 静音时切场景：只记意图
      if (!this._on) {
        if (A.scene !== scene) { A._clear(); A.scene = scene; }
        return;
      }
      const src = AMBIENT_FILES[scene];
      if (!src) return;
      if (A.scene === scene && A.audio) return; // 同场景不重启
      A._clear();
      A.scene = scene;
      try {
        const a = new Audio(src);
        a.loop = true;
        a.preload = 'auto';
        a.volume = Math.max(0, Math.min(0.2, this._ambientVolume * 0.2)); // V8.6x 使用独立的环境音音量控制
        a.play().catch(function () {});
        A.audio = a;
      } catch (e) { A.audio = null; }
    },
    // 停止环境音
    ambientStop() { this._ambient._clear(); },
    ambientScene() { return this._ambient.scene; },

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
      // V8.6x 加载保存的独立音量偏好（BGM/音效/环境音）
      try {
        // BGM音量
        let savedBgmVol = null;
        if (NDX.SaveSystem && typeof NDX.SaveSystem.load === 'function') {
          savedBgmVol = NDX.SaveSystem.load('ndx_bgm_volume', null);
        } else {
          const rawBgmVol = NDX.storage.load('ndx_bgm_volume');
          if (rawBgmVol != null) savedBgmVol = parseFloat(rawBgmVol);
        }
        if (savedBgmVol != null && !isNaN(savedBgmVol)) {
          this._bgmVolume = Math.max(0, Math.min(1, savedBgmVol));
        }
        // 音效音量
        let savedSfxVol = null;
        if (NDX.SaveSystem && typeof NDX.SaveSystem.load === 'function') {
          savedSfxVol = NDX.SaveSystem.load('ndx_sfx_volume', null);
        } else {
          const rawSfxVol = NDX.storage.load('ndx_sfx_volume');
          if (rawSfxVol != null) savedSfxVol = parseFloat(rawSfxVol);
        }
        if (savedSfxVol != null && !isNaN(savedSfxVol)) {
          this._sfxVolume = Math.max(0, Math.min(1, savedSfxVol));
        }
        // 环境音音量
        let savedAmbientVol = null;
        if (NDX.SaveSystem && typeof NDX.SaveSystem.load === 'function') {
          savedAmbientVol = NDX.SaveSystem.load('ndx_ambient_volume', null);
        } else {
          const rawAmbientVol = NDX.storage.load('ndx_ambient_volume');
          if (rawAmbientVol != null) savedAmbientVol = parseFloat(rawAmbientVol);
        }
        if (savedAmbientVol != null && !isNaN(savedAmbientVol)) {
          this._ambientVolume = Math.max(0, Math.min(1, savedAmbientVol));
        }
      } catch (e) {}
      this._ensure();
      // V8.7 首次用户手势后，尝试恢复播放当前场景的BGM
      try {
        if (this._bgm && this._bgm.scene && this._bgm.audio && this._bgm.audio.paused) {
          this._bgm.audio.play().catch(function () {});
        }
      } catch (e) {}
    },

    // V8.6x 独立音量控制：BGM音量 / 音效音量 / 环境音音量（0.0~1.0）
    _bgmVolume: 0.7,
    _sfxVolume: 0.8,
    _ambientVolume: 0.5,

    // V8.6x 设置BGM音量
    setBgmVolume(v) {
      const vol = Math.max(0, Math.min(1, parseFloat(v) || 0));
      this._bgmVolume = vol;
      if (this._bgm && this._bgm.audio) {
        try { this._bgm.audio.volume = Math.max(0, Math.min(0.8, vol * 0.8)); } catch (e) {}
      }
      try {
        if (NDX.SaveSystem && typeof NDX.SaveSystem.save === 'function') {
          NDX.SaveSystem.save('ndx_bgm_volume', vol);
        } else {
          NDX.storage.save('ndx_bgm_volume', vol);
        }
      } catch (e) {}
      return vol;
    },
    getBgmVolume() { return this._bgmVolume; },

    // V8.6x 设置音效音量
    setSfxVolume(v) {
      const vol = Math.max(0, Math.min(1, parseFloat(v) || 0));
      this._sfxVolume = vol;
      if (this._ensure() && this._master) {
        try { this._master.gain.value = vol * 0.9; } catch (e) {}
      }
      try {
        if (NDX.SaveSystem && typeof NDX.SaveSystem.save === 'function') {
          NDX.SaveSystem.save('ndx_sfx_volume', vol);
        } else {
          NDX.storage.save('ndx_sfx_volume', vol);
        }
      } catch (e) {}
      return vol;
    },
    getSfxVolume() { return this._sfxVolume; },

    // V8.6x 设置环境音音量
    setAmbientVolume(v) {
      const vol = Math.max(0, Math.min(1, parseFloat(v) || 0));
      this._ambientVolume = vol;
      if (this._ambient && this._ambient.audio) {
        try { this._ambient.audio.volume = Math.max(0, Math.min(0.2, vol * 0.2)); } catch (e) {}
      }
      try {
        if (NDX.SaveSystem && typeof NDX.SaveSystem.save === 'function') {
          NDX.SaveSystem.save('ndx_ambient_volume', vol);
        } else {
          NDX.storage.save('ndx_ambient_volume', vol);
        }
      } catch (e) {}
      return vol;
    },
    getAmbientVolume() { return this._ambientVolume; },

    // V8.5x 音量调节：设置主音量（0.0~1.0），持久化到 localStorage，AudioContext 未就绪时先创建
    setVolume(v) {
      const vol = Math.max(0, Math.min(1, parseFloat(v) || 0));
      this._volume = vol;
      // 主音量同时影响BGM和音效
      this.setBgmVolume(vol);
      this.setSfxVolume(vol);
      this.setAmbientVolume(vol);
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