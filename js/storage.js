// ============================================================
// storage.js — 统一持久化层（代码质量 P1：localStorage 统一管理）
//
//   · 所有 localStorage key 集中注册于 STORE（单一来源，不再散落各文件）
//   · NDX.storage.load / save / remove 统一封装：环境守卫 + try/catch + JSON 序列化
//   · key 值保持历史字符串不变（兼容旧存档，无迁移成本）
//   · V8.37 新增：SAVE_VER 存档版本化 + migrate() 迁移函数
//     每次 schema 变更时递增 SAVE_VER 并在 MIGRATIONS 中添加迁移逻辑
//
//   命名规范（代码质量 P2）：
//     - 常量（key 名 / 配置表）→ UPPER_SNAKE
//     - 函数 → camelCase
//     - 模块私有成员 → _ 前缀
//     - 新增 key 一律在此注册，禁止在其他文件硬编码 localStorage
//
//   版本迁移策略：
//     结构变更时，递增 SAVE_VER，在 MIGRATIONS 中添加 from->to 迁移函数。
//     load 时自动检测 _version 并执行迁移，不要就地覆盖结构（否则旧档直接丢失）。
// ============================================================
(function () {
  if (!window.NDX) window.NDX = {};
  var NDX = window.NDX;

  // —— 通用业务事件总线（解耦 game↔ui 反向依赖）——
  // 设计约束：game.js 只 emit 语义事件（'render' / 'toast' / 'loot' / 'fightSpeed' /
  // 'battle-fx' / 'floating-text'），禁止直接调用 NDX.ui.* 业务方法；
  // ui.js / main.js 订阅并负责渲染。与 ui.js 内部的 _fxListeners 作战特效总线
  // 分离，避免战斗特效逻辑与业务渲染耦合。
  var _busListeners = {};
  NDX.bus = {
    on: function (evt, fn) { (_busListeners[evt] = _busListeners[evt] || []).push(fn); },
    off: function (evt, fn) { if (_busListeners[evt]) _busListeners[evt] = _busListeners[evt].filter(function (f) { return f !== fn; }); },
    emit: function (evt, data) {
      (_busListeners[evt] || []).forEach(function (fn) {
        try { fn(data || {}); } catch (e) { if (typeof console !== 'undefined') console.error('[bus]', evt, e); }
      });
    }
  };

  // —— 存档版本号：每次数据结构变更时递增 ——
  // v2：地区/章节分段由旧 20 层第一章改为 17 地区制（大唐境内 1-4 难），
  // 旧 RUN  autosave 若沿用会导致第一章出现第 20 难、跨章劫难错位等问题，故不再迁移旧断点。
  var SAVE_VER = 2;

  // —— 迁移函数表：{ fromVersion: function(data) -> migratedData } ——
  // 每次递增 SAVE_VER 时，在此添加对应版本的迁移逻辑
  var MIGRATIONS = {
    // v1→v2：RUN 断点存档结构随地区制重构，旧断点直接标记为失效，
    // 由 game.js 的 hasRunSave / restoreRun 识别并清理，强制开新局。
    1: function(data) {
      if (data && data.meta && typeof data.layer === 'number') {
        data._runInvalid = true;
      }
      return data;
    }
  };

  // —— 全部持久化 key 注册表（值 = 历史 key，保持兼容） ——
  var STORE = {
    LAST_RUN: 'xy_last_run_v1',        // 上一局结束摘要（仅失败触发补偿）
    FAVOR: 'xy_favor_v1',              // 轮回赐福进度（永久累计）
    COLLECTION: 'xynj_collection',     // 藏品收集
    YEZANGLU: 'xynj_yezanglu',         // 业藏录（降妖簿图鉴）
    CYCLE: 'xynj_cycle',               // 周目计数
    CLEARS: 'xynj_clears',             // 通关次数
    RUBBING: 'xynj_rubbing',           // 藏经阁·经文拓印
    MONUMENT: 'xynj_monuments',        // 舍利塔·碑塔
    ASH: 'xynj_ash_shop',              // 劫灰坊
    INHERIT: 'xynj_inherit_stash',     // NG+ 引渡匣
    MONUMENT_GEAR: 'xynj_monument_gear_v1', // 衣冠冢遗物
    AWAKENED: 'ndx_awakened_jobs',     // 隐藏职觉醒
    TRACK: 'ndx_track',                // 长期善恶倾向
    HUNYUAN: 'ndx_hunyuan',            // 混元点
    TIANDAO: 'ndx_tiandao_layer',      // 天道劫层数
    ACHIEVEMENTS: 'nx_ach_v1',         // 成就列表
    CLEARED_DIFFS: 'ndx_cleared_diffs',// 已通关难度
    SOUND: 'xynj_sound_on',            // 音效开关
    RUN: 'xy_run_autosave_v1',         // 自动断点存档（V8.35 离线存档：退出可继续西行）
    // 🩸 S15 A3（2026-09-27 · Batch 0）：断点档失效前的**只读备份槽**。
    //   原实现里 `Game.hasRunSave()` 判到失效档直接 `storage.remove(RUN)` —— 玩家几十分钟的
    //   未完局在首页渲染那一瞬被静默蒸发。改为「先整串复刻到本键，再清 RUN」⇒ 数据可救。
    //   该键**只读**，任何自动流程都不消费它，避免备份被当作新档覆盖回去。
    RUN_ARCHIVE: 'xy_run_autosave_v1_archive',
    SAVE_META: 'xy_save_meta_v1',      // 存档元信息（版本号/最后保存时间等）
    // V8.41 新增：补充缺失的持久化key（用于收编裸localStorage调用）
    HERO_UNLOCK: 'ndx_hero_unlock',    // 英雄解锁状态
    DIFFICULTY: 'ndx_difficulty',      // 当前难度选择
    TUTORIAL: 'ndx_tutorial_done',     // 新手教学完成状态
    LEADERBOARD: 'ndx_leaderboard',    // 本地排行榜
    SETTINGS: 'ndx_settings',          // 游戏设置（音效/画质等）
    LAST_HERO: 'ndx_last_hero',        // 上次选择的英雄
    SEED_HISTORY: 'ndx_seed_history',  // 地图种子历史
    STAT_TOTAL: 'ndx_stat_total',      // 累计统计数据
    SOUND_VOL: 'xynj_sound_vol',       // 主音量（0.0~1.0）
    ONBOARD: 'xynj_onboard_done',      // 新手引导已完成标记
    VAULT_GUIDE: 'xynj_vault_guide_done', // 万世剑冢·成亡节点引导已完成标记
  };

  // —— 内部：执行迁移 ——
  function _migrate(data) {
    if (!data || typeof data !== 'object') return data;
    // 🩸 S15 A6 判据说明（2026-09-27 · Batch 0）：`_version` 缺失的档（跨版本遗留 / 手工编辑 /
    //   别的写入层写的裸对象）按 `|| 0` 处理 ⇒ 没有 MIGRATIONS[0] 可跑 ⇒ 循环一次都不进，
    //   最后 `data._version = SAVE_VER` 把它**就地升版**，即「按最新结构全量信任地读」。
    //   ⚠ 一度改过 `|| 1`（想让 MIGRATIONS[1] 有机会执行），但 v1→v2 迁移器会给所有
    //     「有 meta 且 layer 为数字」的档打 `_runInvalid` —— 而 RUN 档**必然**满足该条件，
    //     等于把每个未版本化的健康断点都误判成结构失效档。已回滚为 `|| 0`。
    //   若要真正处理未版本化档，应在 game.js 层按「缺 _version」单独判，而非在这里猜版本号。
    var ver = data._version || 0;
    // 从当前版本逐步迁移到最新版本
    while (ver < SAVE_VER && MIGRATIONS[ver]) {
      try {
        var prev = ver;
        data = MIGRATIONS[ver](data) || data;
        // 迁移函数可通过设置 data._version 跳到目标版本；
        // 若未推进版本号，则至少前进一步——否则旧档的 data._version 仍是真值，
        // 会让 MIGRATIONS[ver] 反复执行造成死循环（旧 v1 run 档打开即卡死）。
        ver = (typeof data._version === 'number' && data._version > prev) ? data._version : prev + 1;
      } catch (e) {
        console.warn('[storage] migrate from v' + ver + ' failed:', e);
        break;
      }
    }
    data._version = SAVE_VER;
    return data;
  }

  // —— 内部：统一存储后端获取器（V9.63）
  //   NDX.Platform.storage 优先（宪法 §七·五：核心代码只调 NDX.Platform）
  //   Platform 尚未装配的极端启动窗口下回退到裸 localStorage（行尾 __PLATFORM_FALLBACK__ 标记，门禁白名单）
  //   两者均不可用时回退到内存 Map（避免任何调用抛异常）
  function _store() {
    var P = (typeof window !== 'undefined' && window.NDX && window.NDX.Platform && window.NDX.Platform.storage) || null;
    if (P) return P;
    if (typeof localStorage !== 'undefined') return localStorage; // __PLATFORM_FALLBACK__
    var m = {};
    return {
      getItem: function (k) { return Object.prototype.hasOwnProperty.call(m, k) ? m[k] : null; },
      setItem: function (k, v) { m[k] = String(v); },
      removeItem: function (k) { delete m[k]; },
      clear: function () { m = {}; },
      length: 0,
      key: function () { return null; },
    };
  }

  // —— 内部：存储后端迭代（Platform 无 length/key 时降级到空，避免抛异常） ——
  function _storeKeys() {
    var s = _store();
    var out = [];
    try {
      var len = (typeof s.length === 'number') ? s.length : 0;
      for (var i = 0; i < len; i++) {
        var k = (typeof s.key === 'function') ? s.key(i) : null;
        if (k) out.push(k);
      }
    } catch (e) { /* 无迭代能力时返回空 */ }
    return out;
  }

  NDX.storage = {
    KEYS: STORE,
    VERSION: SAVE_VER,

    load: function (name) {
      try {
        var raw = _store().getItem(name);
        if (!raw) return null;
        var data = JSON.parse(raw);
        // 自动迁移（仅对对象类型数据）
        if (data && typeof data === 'object' && !Array.isArray(data)) {
          data = _migrate(data);
        }
        return data;
      } catch (e) { return null; }
    },

    save: function (name, data) {
      try {
        // 自动注入版本号（仅对对象类型数据）
        if (data && typeof data === 'object' && !Array.isArray(data)) {
          data._version = SAVE_VER;
          data._savedAt = Date.now();
        }
        _store().setItem(name, JSON.stringify(data));
      } catch (e) { /* 隐私模式 / 空间满：静默失败 */ }
    },

    remove: function (name) {
      try { _store().removeItem(name); } catch (e) {}
    },

    // —— S15 A3：断点档归档（失效前留一份可读的原件）——
    //   纯字符串复刻，不做 JSON 解析/回填 ⇒ 任何结构异常都不会在这里炸掉存档。
    //   @returns {boolean} 是否确实归档过（原档不存在时返回 false）
    archiveRunSave: function (reason) {
      try {
        var s = _store();
        var raw = s.getItem(STORE.RUN);
        if (!raw) return false;
        s.setItem(STORE.RUN_ARCHIVE, raw);
        s.removeItem(STORE.RUN);
        // 备份原因与时刻写进存档元信息，便于日后排查「我的局去哪了」
        var meta = {};
        try { meta = JSON.parse(s.getItem(STORE.SAVE_META) || '') || {}; } catch (e) { meta = {}; }
        meta._runArchiveReason = reason || '';
        meta._runArchiveAt = Date.now();
        s.setItem(STORE.SAVE_META, JSON.stringify(meta));
        return true;
      } catch (e) { return false; }
    },

    // —— S15 A3 UI 出口（2026-09-27 · Batch 1）：备份槽的**唯一读取端** ——
    //   Batch 0 只做「写备份」，备份槽在 UI 上零展示 ⇒ 玩家无从得知自己那局没蒸发。
    //   本函数是 `RUN_ARCHIVE` 的唯一读取口，UI 只认它（不许各处自己 `getItem`）。
    //   顺带把 `SAVE_META._runArchiveReason/_runArchiveAt` 这两个「写了没人读」的孤儿字段接上。
    //   ⚠ 只读：任何自动流程都不得消费它，避免备份被当新档覆盖回去。
    runArchiveInfo: function () {
      try {
        var s = _store();
        var raw = s.getItem(STORE.RUN_ARCHIVE);
        if (!raw) return null;
        var ts = 0;
        try {
          var o = JSON.parse(raw);
          if (o && o.meta && o.meta.ts) ts = o.meta.ts;
        } catch (e) { /* 纯留档性质，解析失败不影响展示 */ }
        var meta = {};
        try { meta = JSON.parse(s.getItem(STORE.SAVE_META) || '') || {}; } catch (e) { meta = {}; }
        return { bytes: raw.length, ts: ts, reason: meta._runArchiveReason || '', at: meta._runArchiveAt || 0 };
      } catch (e) { return null; }
    },

    // —— 迁移工具：获取当前存档版本 ——
    getVersion: function () { return SAVE_VER; },

    // —— 迁移工具：检查并迁移所有存档 ——
    migrateAll: function () {
      var migrated = 0;
      for (var key in STORE) {
        if (STORE.hasOwnProperty(key)) {
          var data = this.load(STORE[key]);
          if (data && data._version && data._version < SAVE_VER) {
            this.save(STORE[key], data);
            migrated++;
          }
        }
      }
      return migrated;
    },

    // —— 重置全部存档：移除注册表内所有 key + 历史遗留前缀 key ——
    clearAll: function () {
      try {
        var s = _store();
        for (var k in STORE) { if (STORE.hasOwnProperty(k)) s.removeItem(STORE[k]); }
        var legacyPrefixes = ['nidao', 'ndx_', 'xynj_', 'xy_'];
        var keys = _storeKeys();
        for (var i = 0; i < keys.length; i++) {
          var key = keys[i];
          if (key && legacyPrefixes.some(function (p) { return key.indexOf(p) === 0; })) {
            s.removeItem(key);
          }
        }
      } catch (e) {}
    },

    // —— 按前缀移除（备用）——
    clearByPrefix: function (prefix) {
      try {
        var s = _store();
        var keys = _storeKeys();
        for (var i = 0; i < keys.length; i++) {
          var key = keys[i];
          if (key && key.indexOf(prefix) === 0) s.removeItem(key);
        }
      } catch (e) {}
    },
  };
})();
