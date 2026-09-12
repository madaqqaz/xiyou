/* =============================================================================
 * ndx_audio_bridge.js —— 《逆道西行》音频桥接层（集成胶水）
 * 作用：把真实游戏运行期状态（区域 act / 战斗 / Boss / 血量 / 试炼）喂给自适应
 *       引擎 NDX.audio，并接管 NDX.sound.music 的场景切换，实现"自适应音乐
 *       增强层"。既有的 NDX.sound（离散音效 + MP3 BGM）完全保留，可一键回退。
 *
 * 集成原则（参考 AGENTS.md 手术补丁纪律）：
 *   - 不修改 NDX.sound / game.js / ui.js / main.js 的任何逻辑，仅"包装"与"轮询"。
 *   - 全部新增代码收敛在 js/audio/ 三文件 + index.html 三行 <script>。
 *   - 顶部 ADAPTIVE_AUDIO 开关：true=用自适应音乐（MP3 静默）；false=退回原 MP3。
 *
 * 接入点（游戏侧如想手动增强，可调用）：
 *   NDX.audio.combat('du'|'ni'|'neutral')   三按键 / 渡逆式
 *   NDX.audioBridge.reportDao('du'|'ni')     渡/逆 经文反馈（推 ScriptureResonance 并播 VO）
 *   NDX.audio.set('CombatIntensity', 0~1)     手动覆盖战斗强度
 *   NDX.audio.setZone('cave')                手动切区域音景
 *   NDX.audio.spawnSpatial(eventPath, pos, listener, occ)  空间化发声
 *   NDX.audio.playEvent('event:/...')         数据驱动事件
 *   NDX.audio.getDiagnostics() / NDX.audio.selfTest(40)   真机诊断
 * ========================================================================== */
(function (global) {
  'use strict';
  var NDX = global.NDX = global.NDX || {};

  // ===== 总开关：自适应音乐增强层（true=启用自适应，false=退回原 MP3 BGM）=====
  var ADAPTIVE_AUDIO = false;
  // ===== 子开关：自适应 SFX（true=NDX.sfx(name) 路由到自适应合成引擎，false=退回原 sound.js Web Audio 合成/MP3）=====
  var ADAPTIVE_SFX = false;

  var A = NDX.audio;          // 自适应引擎（由 ndx_audio_engine.js 注入）
  var CFG = NDX.audioConfig;  // 区域配置（由 ndx_audio_config.js 注入）

  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var lerp = function (a, b, t) { return a + (b - a) * t; };

  var bridge = {
    _inited: false,
    _origSfx: null,              // M14：原 NDX.sfx（回退用）
    _pollTimer: null,
    _mode: 'explore',          // explore | combat | home | title | stop
    _boss: false,
    _bossSeen: false,          // Boss 边沿：入场仅一次 roar+enter
    _bossName: null,           // 真实关隘 Boss 名（NDX.bossNameForAct）
    _specialTrialZone: null,   // 特殊试炼临时音景覆盖（离试炼时清）
    _lastZone: null,
    _lastTrialKey: '',
    _resTarget: 0,             // ScriptureResonance 目标（事件驱动）
    _cur: { CombatIntensity: 0, ThreatLevel: 0, ScriptureResonance: 0, PlayerHealth: 1, RunDepth: 0 },
    _target: { CombatIntensity: 0, ThreatLevel: 0, ScriptureResonance: 0, PlayerHealth: 1, RunDepth: 0 },
    _lastRead: null,
  };

  // ---- 读取运行期状态（防御式，任何异常都降级为空）----
  function readState() {
    try {
      var g = NDX.game; if (!g || !g.state) return null;
      var s = g.state;
      var act = s.act || 1;
      var pk = s.pending && s.pending.kind;
      var inFight = pk === 'fight';
      var boss = !!(s.pending && s.pending.monster && s.pending.monster.boss);
      var hp01 = 1, maxHp = 0;
      try { var st = g.stats(); if (st && st.ti) { maxHp = st.ti.maxHp || 0; } } catch (e) {}
      if (maxHp > 0 && typeof s.hp === 'number') hp01 = clamp(s.hp / maxHp, 0, 1);
      else if (typeof s.hp === 'number' && s.hp <= 1) hp01 = clamp(s.hp, 0, 1); // 部分系统 hp 为 0~1
      return { act: act, kind: pk, inFight: inFight, boss: boss, hp01: hp01 };
    } catch (e) { return null; }
  }

  // ---- 试炼进入：取六道并播对应事件（边沿触发，仅一次）----
  function maybeTrialEvent(st) {
    if (!st || st.kind !== 'trial' || !A || !CFG) return;
    var nodeName = (NDX.game.state.pending && NDX.game.state.pending.node && NDX.game.state.pending.node.name) || '';
    // 特殊试炼覆盖（优先于常规六道音景）
    var special = null;
    try { if (CFG.matchSpecialTrial) special = CFG.matchSpecialTrial(st.act, nodeName); } catch (e) {}
    var dao = null;
    try { if (typeof NDX.mainDaoOf === 'function') dao = CFG.normalizeDao(NDX.mainDaoOf(NDX.game.state)); } catch (e) {}
    if (!dao && NDX.game && NDX.game.state && NDX.game.state.pending) {
      var p = NDX.game.state.pending;
      dao = CFG.normalizeDao(p.dao) || CFG.normalizeDao(p.trial && p.trial.dao);
    }
    if (!dao) dao = 'ren';
    var key = 'trial:' + st.act + ':' + (special ? 'special:' + (special.event || special.zone) : dao) + ':' + nodeName;
    if (key !== bridge._lastTrialKey) {
      bridge._lastTrialKey = key;
      if (special && special.event) {
        try { A.playEvent(special.event); } catch (e) {}
        bridge._specialTrialZone = special.zone || null; // 临时音景覆盖（poll 在离试炼时清）
      } else {
        bridge._specialTrialZone = null;
        try { A.playEvent(CFG.trialEvent(dao)); } catch (e) {}
      }
    }
  }

  // ---- 每帧目标参数（优先用运行期真实战斗状态，music() 路由作为补充）----
  function computeTargets(st) {
    var t = bridge._target;
    // 战斗中：以真实 inFight 为准（即使 music() 路由被跳过也能正确拉升强度）
    var inFight = st && st.inFight;
    var mode = inFight ? 'combat' : bridge._mode;
    var boss = inFight ? !!st.boss : bridge._boss;
    // 区域音景
    var zone;
    if (mode === 'home') zone = 'town';
    else if (mode === 'title') zone = 'outdoor';
    else if (mode === 'stop') zone = bridge._lastZone || 'outdoor';
    else if (boss) zone = CFG.BOSS_ZONE;
    else if (bridge._specialTrialZone && st && st.kind === 'trial') zone = bridge._specialTrialZone;
    else zone = CFG.zoneOfAct(st ? st.act : 1);
    // 战斗强度
    if (mode === 'combat') t.CombatIntensity = boss ? 1.0 : 0.6;
    else t.CombatIntensity = 0;
    // 血量
    t.PlayerHealth = st ? st.hp01 : 1;
    // 区域深度（RunDepth）
    t.RunDepth = st ? clamp((st.act - 1) / 16, 0, 1) : 0;
    // 潜行压迫（无战斗且濒死时给一点张力）
    t.ThreatLevel = (!st || !st.inFight) && t.PlayerHealth < 0.5 ? (0.5 - t.PlayerHealth) / 0.5 : 0;
    // 经文共振（事件驱动，缓慢衰减回中）
    bridge._resTarget = clamp(bridge._resTarget - 0.015, -1, 1);
    t.ScriptureResonance = bridge._resTarget;
    return zone;
  }

  // ---- 轮询：平滑写入引擎 ----
  function poll() {
    if (!A || !A.ctx) return;
    var st = readState();
    bridge._lastRead = st;
    // Boss 边沿：无论经 music('boss') 路由还是真实 pending.monster.boss，入场仅一次 roar+enter
    // 且 M13：Boss 战期间持续把当前关隘 act 喂给引擎，驱动专属动机变体；离场复位。
    var bossNow = !!(st && st.boss) || bridge._boss;
    if (bossNow) {
      if (!bridge._bossSeen) { announceBoss(st ? st.act : null); bridge._bossSeen = true; }
      try { if (A && A.setBossAct) A.setBossAct(st ? st.act : null); } catch (e) {}
    } else if (bridge._bossSeen) {
      bridge._bossSeen = false;
      try { if (A && A.setBossAct) A.setBossAct(null); } catch (e) {}
    }
    // 离开试炼节点：清特殊音景覆盖
    if (!st || st.kind !== 'trial') bridge._specialTrialZone = null;
    // 先触发试炼事件（边沿）：特殊试炼在此设 _specialTrialZone，供下方 computeTargets 读取
    maybeTrialEvent(st);
    var zone = computeTargets(st);
    // 区域切换（引擎内部做混响交叉淡入，无需平滑）
    if (zone && zone !== bridge._lastZone) {
      try { A.setZone(zone); bridge._lastZone = zone; } catch (e) {}
    }
    // 参数平滑（~2s 时常数）
    var k = 0.12;
    var cur = bridge._cur, tgt = bridge._target;
    ['CombatIntensity', 'ThreatLevel', 'ScriptureResonance', 'PlayerHealth', 'RunDepth'].forEach(function (p) {
      cur[p] = lerp(cur[p], tgt[p], k);
      try { A.set(p, cur[p]); } catch (e) {}
    });
  }

  // ---- 场景切换（包装 NDX.sound.music）----
  function announceBoss(act) {
    if (!ADAPTIVE_AUDIO || !A) return;
    try {
      A.playEvent('event:/SFX/Combat/Boss_Roar');
      A.playEvent('event:/Music/Sting/Boss_Enter');
      if (act != null && typeof NDX.bossNameForAct === 'function') {
        try { bridge._bossName = NDX.bossNameForAct(act); } catch (e) {}
      }
    } catch (e) {}
  }
  function routeScene(scene) {
    if (scene === 'fight') { bridge._mode = 'combat'; bridge._boss = false; }
    else if (scene === 'boss') {
      bridge._mode = 'combat';
      bridge._boss = true; // 边沿触发（roar+enter）改由 poll 统一处理，避免重复/漏触发
    }
    else if (scene === 'home' || scene === 'changan') { bridge._mode = 'home'; bridge._boss = false; }
    else if (scene === 'title') { bridge._mode = 'title'; bridge._boss = false; }
    else if (scene === 'gameover' || scene === 'none') { bridge._mode = 'stop'; bridge._boss = false; }
    else { bridge._mode = 'explore'; bridge._boss = false; }
    // 自适应开启时不再触发 MP3；关闭时交给原实现
    if (!ADAPTIVE_AUDIO && typeof bridge._origMusic === 'function') {
      try { bridge._origMusic(scene); } catch (e) {}
    }
  }

  // ---- 初始化（首次用户手势内调用一次）----
  function initAudio() {
    if (bridge._inited) return;
    bridge._inited = true;
    try {
      if (A && typeof A.init === 'function') A.init();
      if (A && typeof A.setMusicEnabled === 'function') A.setMusicEnabled(ADAPTIVE_AUDIO);
      // 初始区域
      var st = readState();
      if (st) { bridge._lastZone = CFG.zoneOfAct(st.act); try { A.setZone(bridge._lastZone); } catch (e) {} }
      if (bridge._pollTimer) clearInterval(bridge._pollTimer);
      bridge._pollTimer = setInterval(poll, 250);
    } catch (e) {}
  }

  // ---- 包装 NDX.sound.init（sound.js 的手势 kick 会调用它）----
  function install() {
    if (!NDX.sound || !NDX.sound.init) return;
    var orig = NDX.sound.init;
    if (orig && !orig.__audioWrapped) {
      var wrapped = function () {
        try { orig.apply(NDX.sound, arguments); } catch (e) {}
        initAudio();
      };
      wrapped.__audioWrapped = true;
      NDX.sound.init = wrapped;
    }
    // 试炼/场景切换路由：包装 NDX.sound.music
    if (NDX.sound.music && !NDX.sound.music.__audioWrapped) {
      bridge._origMusic = NDX.sound.music.bind(NDX.sound);
      var wm = function (scene) { routeScene(scene); };
      wm.__audioWrapped = true;
      NDX.sound.music = wm;
    }
    // M14：包裹 NDX.sfx(name)，把统一音效入口路由到自适应引擎（不修改 sound.js）
    //   引擎内已把 23+ 游戏同名音效注册为 event:/SFX/Game/<name>；playEvent 对未注册路径静默忽略。
    //   ADAPTIVE_SFX=true 且引擎已初始化 → 自适应合成；否则回退原实现。
    if (typeof NDX.sfx === 'function' && !NDX.sfx.__audioWrapped) {
      bridge._origSfx = NDX.sfx;
      var ws = function (name) {
        if (ADAPTIVE_SFX && A && A.ctx && A.events) {
          try { A.playEvent('event:/SFX/Game/' + name); return; } catch (e) {}
        }
        try { bridge._origSfx(name); } catch (e) {}
      };
      ws.__audioWrapped = true;
      NDX.sfx = ws;
    }
    // 六道技能派发挂钩：每次出招按"本命道"驱动渡/逆（不修改 combat.js）
    if (typeof NDX.activeSkill === 'function' && !NDX.activeSkill.__audioWrapped) {
      var origActive = NDX.activeSkill;
      var wrappedActive = function (player, monster, kind, s) {
        var act = origActive.apply(NDX, arguments);
        try {
          var st = (NDX.game && NDX.game.state) || s;
          if (st && typeof NDX.mainDaoOf === 'function') {
            var d = NDX.mainDaoOf(st);
            if (d === '渡') NDX.audioBridge.reportDao('du');
            else if (d === '逆') NDX.audioBridge.reportDao('ni');
          }
        } catch (e) {}
        return act;
      };
      wrappedActive.__audioWrapped = true;
      NDX.activeSkill = wrappedActive;
    }
  }

  // ---- 暴露钩子 ----
  NDX.audioBridge = {
    init: initAudio,
    setAdaptive: function (on) {
      ADAPTIVE_AUDIO = !!on;
      if (A && typeof A.setMusicEnabled === 'function') A.setMusicEnabled(ADAPTIVE_AUDIO);
      return ADAPTIVE_AUDIO;
    },
    isAdaptive: function () { return ADAPTIVE_AUDIO; },
    setSfxAdaptive: function (on) { ADAPTIVE_SFX = !!on; return ADAPTIVE_SFX; },
    isSfxAdaptive: function () { return ADAPTIVE_SFX; },
    // 渡/逆 经文反馈：推 ScriptureResonance 并播 VO 钟磬
    // 节流 VO：六道技能每回合都派发，钟磬只在前次播后 2.5s 才再响，避免刷屏；
    // resonance 推进不受节流影响（持续反映本命道走向）。
    _lastVoAt: -100,
    reportDao: function (kind) {
      if (!A) return;
      try {
        var now = (A.ctx && A.ctx.currentTime) || 0;
        if (kind === 'du') { bridge._resTarget = clamp(bridge._resTarget + 0.18, -1, 1); if (now - NDX.audioBridge._lastVoAt > 2.5) { A.playEvent('event:/VO/Scripture/Du_Gain'); NDX.audioBridge._lastVoAt = now; } }
        else if (kind === 'ni') { bridge._resTarget = clamp(bridge._resTarget - 0.18, -1, 1); if (now - NDX.audioBridge._lastVoAt > 2.5) { A.playEvent('event:/VO/Scripture/Ni_Gain'); NDX.audioBridge._lastVoAt = now; } }
      } catch (e) {}
    },
    getState: function () { return { mode: bridge._mode, boss: bridge._boss, bossName: bridge._bossName || null, bossAct: (A ? A.bossAct : null), bossFlavor: (A ? A.bossFlavor : null), specialZone: bridge._specialTrialZone, zone: bridge._lastZone, read: bridge._lastRead, cur: Object.assign({}, bridge._cur) }; },
    selfTest: function (n) { try { return A ? A.selfTest(n || 40) : null; } catch (e) { return null; } },
    diagnostics: function () { try { return A ? A.getDiagnostics() : null; } catch (e) { return null; } },
  };

  // 便捷别名（游戏侧手动调用）
  if (A) {
    A.reportDao = NDX.audioBridge.reportDao;
  }

  // ---- 安装：包装 + 兜底手势监听 ----
  var _doc = (typeof document !== 'undefined') ? document : null;
  function boot() {
    install();
    // 兜底：若 sound.js 的手势 kick 未触发（如某些 webview），本次手势自行初始化
    var kick = function () { initAudio(); };
    if (global.removeEventListener) {
      global.removeEventListener('pointerdown', kick);
      global.removeEventListener('keydown', kick);
    }
    if (global.addEventListener) {
      global.addEventListener('pointerdown', kick, { once: false });
      global.addEventListener('keydown', kick, { once: false });
      global.addEventListener('touchend', kick, { once: false });
    }
  }

  if (_doc && _doc.readyState === 'loading') {
    _doc.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})(typeof window !== 'undefined' ? window : this);
