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
    var ver = data._version || 0;
    // 从当前版本逐步迁移到最新版本
    while (ver < SAVE_VER && MIGRATIONS[ver]) {
      try {
        data = MIGRATIONS[ver](data) || data;
        ver = data._version || (ver + 1);
      } catch (e) {
        console.warn('[storage] migrate from v' + ver + ' failed:', e);
        break;
      }
    }
    data._version = SAVE_VER;
    return data;
  }

  NDX.storage = {
    KEYS: STORE,
    VERSION: SAVE_VER,

    load: function (name) {
      try {
        var raw = (typeof localStorage !== 'undefined') && localStorage.getItem(name);
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
        if (typeof localStorage !== 'undefined') {
          // 自动注入版本号（仅对对象类型数据）
          if (data && typeof data === 'object' && !Array.isArray(data)) {
            data._version = SAVE_VER;
            data._savedAt = Date.now();
          }
          localStorage.setItem(name, JSON.stringify(data));
        }
      } catch (e) { /* 隐私模式 / 空间满：静默失败 */ }
    },

    remove: function (name) {
      try {
        if (typeof localStorage !== 'undefined') localStorage.removeItem(name);
      } catch (e) {}
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
        if (typeof localStorage === 'undefined') return;
        for (var k in STORE) { if (STORE.hasOwnProperty(k)) this.remove(STORE[k]); }
        var legacyPrefixes = ['nidao', 'ndx_', 'xynj_', 'xy_'];
        for (var i = 0; i < localStorage.length; i++) {
          var key = localStorage.key(i);
          if (key && legacyPrefixes.some(function (p) { return key.indexOf(p) === 0; })) {
            localStorage.removeItem(key);
            i--; // 移除后 length 变化，回退索引
          }
        }
      } catch (e) {}
    },

    // —— 按前缀移除（备用）——
    clearByPrefix: function (prefix) {
      try {
        if (typeof localStorage === 'undefined') return;
        for (var i = 0; i < localStorage.length; i++) {
          var key = localStorage.key(i);
          if (key && key.indexOf(prefix) === 0) {
            localStorage.removeItem(key);
            i--;
          }
        }
      } catch (e) {}
    },
  };
})();
