/**
 * 存档/读档系统模块（V8.40）
 * 统一管理_store()存档key和读写接口，提供存档版本管理和迁移
 *
 * 设计原则：
 * 1. 单一职责：只负责存档读写，不负责业务逻辑
 * 2. 统一接口：所有系统通过NDX.SaveSystem访问存档
 * 3. 渐进式迁移：提供统一接口，逐步迁移现有存档逻辑
 * 4. 版本管理：支持存档版本升级和迁移
 */
(function () {
  'use strict';

  var NDX = window.NDX || (window.NDX = {});

  /**
   * 存储抽象（TapTap / 微信 / 浏览器三端统一，AGENTS.md §七·五 平台适配层）。
   * 如果 NDX.Platform.storage 存在就走平台层；否则 failback 到 window.localStorage。
 * 要求平台 storage 提供 localStorage 兼容 API：getItem/setItem/removeItem + length + key(i)
 *   — 见 platform/browser.js mkStorage() 实现。
   */
  function _store() {
    try {
      if (window.NDX && window.NDX.Platform && window.NDX.Platform.storage) return window.NDX.Platform.storage;
    } catch (e) {}
    try { if (window.localStorage) return window.localStorage; } catch (e) {}
    // 绝对 failback（无宿主环境 / 隐私模式等）：每次调用同一个闭包对象
    if (!window.__ndxSaveStoreFallback) {
      var m = {}, order = [];
      window.__ndxSaveStoreFallback = {
        getItem: function (k) { return (k in m) ? m[k] : null; },
        setItem: function (k, v) { if (!(k in m)) order.push(String(k)); m[k] = String(v); },
        removeItem: function (k) { if (k in m) { delete m[k]; var i = order.indexOf(String(k)); if (i >= 0) order.splice(i, 1); } },
        get length() { return order.length; },
        key: function (i) { return order[i] || null; }
      };
    }
    return window.__ndxSaveStoreFallback;
  }

  /**
   * 存档版本号
   */
  const SAVE_VERSION = 2;  // V9.26 升级：启用结构迁移体骨架（见 MIGRATIONS / migrateSave）

  /**
   * 存档key定义（集中管理，避免散落）
   * V8.41 统一：与storage.js的STORE键名一致，避免双持久化层键名冲突
   * 冲突键迁移：ACHIEVEMENTS 'xynj_ach'→'nx_ach_v1'，CLEARED_DIFFS 'xynj_cleared_diffs'→'ndx_cleared_diffs'
   */
  const SAVE_KEYS = {
    // 主存档
    MAIN: 'xynj_save',
    // 成就系统（与storage.js一致）
    ACHIEVEMENTS: 'nx_ach_v1',
    CLEARED_DIFFS: 'ndx_cleared_diffs',
    // 收藏系统
    COLLECTION: 'xynj_collection',
    // 夜葬录（衣冠冢）
    YEZANGLU: 'xynj_yezanglu',
    // 舍利塔
    STUPA: 'xynj_stupa',
    // 轮回次数
    CYCLE: 'xynj_cycle',
    // 朝代
    DYNASTY: 'xynj_dynasty',
    // 排行榜
    RANK: 'xynj_rank',
    // 英雄解锁
    UNLOCK: 'xynj_unlock',
    // 通关记录
    CLEAR: 'xynj_clear',
    // 新手引导
    INTRO: 'xynj_intro',
    // 难度选择
    DIFFICULTY: 'xynj_difficulty',
    // 拓印库（跨周目持久化）
    RUBBING: 'xynj_rubbing',
    // 经文碎片
    SUTRA_FRAGS: 'xynj_sutra_frags',
    // 设置
    SETTINGS: 'xynj_settings',
  };

  /**
   * 旧键→新键迁移映射（V8.41 统一存档键名）
   * 读取时如果新键不存在，自动从旧键迁移数据
   */
  const KEY_MIGRATION_MAP = {
    'xynj_ach': 'nx_ach_v1',           // 成就
    'xynj_cleared_diffs': 'ndx_cleared_diffs', // 已通关难度
  };

  /**
   * 存档结构迁移体（V9.26 新增骨架）
   * 与 KEY_MIGRATION_MAP（键名迁移）正交：本迁移体负责「值域结构迁移」。
   * 当存档对象内嵌版本 __v 低于 SAVE_VERSION 时，依次应用 MIGRATIONS[v]（v 为「从版本」），
   * 将旧结构补齐到当前版本。
   *
   * 🩸 S15 A6（2026-09-27 · Batch 0）判据修正：
   *   「本表为空」本身**不是**缺陷 —— 它只说明 v1→v2 之间确实没有字段变更。
   *   真正的缺陷是另两条，本次一并修：
   *   ① 接线曾经只覆盖 `SAVE_KEYS.MAIN` 一个键 ⇒ 成就 / 藏品 / 夜葬录等**所有**其它键的旧档
   *      从不过迁移体（见下方 load 的放宽）。
   *   ② 缺条目时**静默跳过**（旧结构被就地贴上 __v=SAVE_VERSION 当新档读）⇒ 结构一变就悄悄丢字段。
   *      现在改为 `console.warn` 显式告警（见下方 migrateSave）。
   * ⚠ 与 storage.js 的 `MIGRATIONS`（键 `_version`）是**两套并行**的迁移表：
   *   storage.js 管存储层写入的档（含 RUN 断点），本表管 SaveSystem 写入的档（含主存档）。
   *   任一侧升 SAVE_VER / SAVE_VERSION，**另一侧必须同步评估**，否则某条路径会漏迁。
   */
  const MIGRATIONS = {
    // 当前无条目 = v1→v2 无字段变更（正确状态）。
    // 下次改本层存档结构时，在此登记形如：
    //   1: function (obj) { obj.xxx = obj.xxx || def; return obj; }
    // 并同时复核 storage.js 的 MIGRATIONS 是否需要对应条目。
  };
  function migrateSave(obj) {
    if (!obj || typeof obj !== 'object') return obj;
    let v = (typeof obj.__v === 'number') ? obj.__v : 1;
    while (v < SAVE_VERSION) {
      const step = MIGRATIONS[v];
      if (typeof step === 'function') {
        obj = step(obj) || obj;
      } else if (typeof console !== 'undefined' && console.warn) {
        console.warn('[SaveSystem] 存档结构需 v' + v + '→v' + (v + 1) +
          '，但 MIGRATIONS[' + v + '] 未登记 ⇒ 旧结构就地升版后当新档读（字段可能缺失）。' +
          '请先在 save_system.js 的 MIGRATIONS 中登记该迁移器。', obj);
      }
      v++;
    }
    obj.__v = SAVE_VERSION;
    return obj;
  }

  /**
   * 存档key前缀（用于批量管理）
   */
  const KEY_PREFIX = 'xynj_';

  /**
   * 读取存档（带错误处理）
   * @param {string} key - 存档key
   * @param {*} defaultValue - 默认值
   * @returns {*} 存档数据
   */
  function load(key, defaultValue) {
    try {
      // V8.41 存档键迁移：如果新键不存在，尝试从旧键迁移
      let raw = _store().getItem(key);
      if (raw == null) {
        for (const oldKey in KEY_MIGRATION_MAP) {
          if (KEY_MIGRATION_MAP[oldKey] === key) {
            const oldRaw = _store().getItem(oldKey);
            if (oldRaw != null) {
              _store().setItem(key, oldRaw);
              _store().removeItem(oldKey);
              console.info('[SaveSystem] 存档键迁移:', oldKey, '→', key);
              raw = oldRaw;
            }
            break;
          }
        }
      }
      if (raw == null) return defaultValue;
      let parsed;
      try { parsed = JSON.parse(raw); } catch (e) { return defaultValue; }
      // 🩸 S15 A6（2026-09-27 · Batch 0）：此处判据原为 `key === SAVE_KEYS.MAIN`，
      //   即**只有主存档**会过迁移体。而本层的调用方遍布成就 / 藏品 / 夜葬录 / 舍利塔等
      //   （`NDX.SaveSystem.load(NDX._achKey, ...)` 等），这些键的旧档因此**从不迁移**，
      //   旧结构被原样交付给新代码 ⇒ 字段缺失时静默出怪 bug。放宽为「本层读出的任何对象都过迁移体」。
      //   零回归：现有档的 __v 未落盘（save 不注入）⇒ v=1 ⇒ 缺条目时只多打一条 warn，行为不变。
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        parsed = migrateSave(parsed);
      }
      return parsed;
    } catch (e) {
      console.warn('[SaveSystem] 读取存档失败:', key, e);
      return defaultValue;
    }
  }

  /**
   * 保存存档（带错误处理）
   * @param {string} key - 存档key
   * @param {*} data - 要保存的数据
   * @returns {boolean} 是否保存成功
   */
  function save(key, data) {
    try {
      _store().setItem(key, JSON.stringify(data));
      return true;
    } catch (e) {
      console.warn('[SaveSystem] 保存存档失败:', key, e);
      return false;
    }
  }

  /**
   * 删除存档
   * @param {string} key - 存档key
   * @returns {boolean} 是否删除成功
   */
  function remove(key) {
    try {
      _store().removeItem(key);
      return true;
    } catch (e) {
      console.warn('[SaveSystem] 删除存档失败:', key, e);
      return false;
    }
  }

  /**
   * 检查存档是否存在
   * @param {string} key - 存档key
   * @returns {boolean} 是否存在
   */
  function exists(key) {
    try {
      return _store().getItem(key) != null;
    } catch (e) {
      return false;
    }
  }

  /**
   * 读取字符串存档（不经过JSON解析）
   * @param {string} key - 存档key
   * @param {string} defaultValue - 默认值
   * @returns {string} 存档字符串
   */
  function loadString(key, defaultValue) {
    try {
      const raw = _store().getItem(key);
      return raw == null ? defaultValue : raw;
    } catch (e) {
      console.warn('[SaveSystem] 读取字符串存档失败:', key, e);
      return defaultValue;
    }
  }

  /**
   * 保存字符串存档（不经过JSON序列化）
   * @param {string} key - 存档key
   * @param {string} data - 要保存的字符串
   * @returns {boolean} 是否保存成功
   */
  function saveString(key, data) {
    try {
      _store().setItem(key, String(data));
      return true;
    } catch (e) {
      console.warn('[SaveSystem] 保存字符串存档失败:', key, e);
      return false;
    }
  }

  /**
   * 读取数字存档
   * @param {string} key - 存档key
   * @param {number} defaultValue - 默认值
   * @returns {number} 存档数字
   */
  function loadNumber(key, defaultValue) {
    try {
      const raw = _store().getItem(key);
      if (raw == null) return defaultValue;
      const num = parseInt(raw, 10);
      return isNaN(num) ? defaultValue : num;
    } catch (e) {
      console.warn('[SaveSystem] 读取数字存档失败:', key, e);
      return defaultValue;
    }
  }

  /**
   * 保存数字存档
   * @param {string} key - 存档key
   * @param {number} data - 要保存的数字
   * @returns {boolean} 是否保存成功
   */
  function saveNumber(key, data) {
    try {
      _store().setItem(key, String(data));
      return true;
    } catch (e) {
      console.warn('[SaveSystem] 保存数字存档失败:', key, e);
      return false;
    }
  }

  /**
   * 读取布尔存档
   * @param {string} key - 存档key
   * @param {boolean} defaultValue - 默认值
   * @returns {boolean} 存档布尔值
   */
  function loadBoolean(key, defaultValue) {
    try {
      const raw = _store().getItem(key);
      if (raw == null) return defaultValue;
      return raw === '1' || raw === 'true';
    } catch (e) {
      console.warn('[SaveSystem] 读取布尔存档失败:', key, e);
      return defaultValue;
    }
  }

  /**
   * 保存布尔存档
   * @param {string} key - 存档key
   * @param {boolean} data - 要保存的布尔值
   * @returns {boolean} 是否保存成功
   */
  function saveBoolean(key, data) {
    try {
      _store().setItem(key, data ? '1' : '0');
      return true;
    } catch (e) {
      console.warn('[SaveSystem] 保存布尔存档失败:', key, e);
      return false;
    }
  }

  /**
   * 🩸 S15 A1（Batch 0）：**托管键 = 前缀扫描 ∪ SAVE_KEYS ∪ storage.KEYS**。
   *   原先用单一 `xynj_` 前缀过滤，但 storage.js 的 STORE 里绝大多数键不带该前缀
   *   （`xy_*` / `ndx_*` / `nx_*`）——实测注入 42 键时，**18 个键完全不可见，
   *   其中就含断点存档本体 `xy_run_autosave_v1` 与成就 `nx_ach_v1`**。
   *   ⇒ `SaveSystem.clearAll` 清完仍残留 18 键、`exportAll` 漏同样 18 键。
   *   现改为并集：**行为只增不减**（前缀扫描保留，历史遗留键照样被清/被导出）。
   *   ⚠ 玩家点「重置全部存档」实际走的是 `NDX.storage.clearAll()`（main.js:1239），那条路径
   *     已实测清干净（0 残留）；本处修的是 SaveSystem 这一层，避免将来改回该路径时复发。
   */
  function managedKeys() {
    const out = [], seen = {};
    function add(v) { if (typeof v === 'string' && v && !seen[v]) { seen[v] = 1; out.push(v); } }
    Object.keys(SAVE_KEYS).forEach((k) => add(SAVE_KEYS[k]));
    try {
      if (window.NDX && NDX.storage && NDX.storage.KEYS) {
        Object.keys(NDX.storage.KEYS).forEach((k) => add(NDX.storage.KEYS[k]));
      }
    } catch (e) { /* storage 层未加载时退化为 SAVE_KEYS */ }
    return out;
  }

  /**
   * 获取所有存档key（前缀 + 托管键表并集）
   * @returns {Array} 存档key列表
   */
  function getAllKeys() {
    const keys = [];
    try {
      const managed = {};
      managedKeys().forEach((k) => { managed[k] = 1; });
      for (let i = 0; i < _store().length; i++) {
        const key = _store().key(i);
        if (key && (key.indexOf(KEY_PREFIX) === 0 || managed[key])) {
          keys.push(key);
        }
      }
    } catch (e) {
      console.warn('[SaveSystem] 获取所有存档key失败:', e);
    }
    return keys;
  }

  /**
   * 清除所有游戏存档（带前缀）
   * @returns {boolean} 是否清除成功
   */
  function clearAll() {
    try {
      const keys = getAllKeys();
      keys.forEach((key) => _store().removeItem(key));
      // 托管表里存在但已被外部直接 setItem 覆盖、未出现在扫描结果里的键，兜底再清一次
      const scanned = {};
      keys.forEach((k) => { scanned[k] = 1; });
      managedKeys().forEach((k) => { if (!scanned[k]) _store().removeItem(k); });
      return true;
    } catch (e) {
      console.warn('[SaveSystem] 清除所有存档失败:', e);
      return false;
    }
  }

  /**
   * 获取存档大小（字节）
   * @returns {number} 存档大小
   */
  function getSize() {
    try {
      let size = 0;
      const keys = getAllKeys();
      keys.forEach((key) => {
        const raw = _store().getItem(key);
        if (raw) size += raw.length;
      });
      return size;
    } catch (e) {
      return 0;
    }
  }

  /**
   * 导出所有存档（用于备份）
   * @returns {Object} 所有存档数据
   */
  function exportAll() {
    const data = {};
    try {
      const keys = getAllKeys();
      keys.forEach((key) => {
        data[key] = _store().getItem(key);
      });
    } catch (e) {
      console.warn('[SaveSystem] 导出存档失败:', e);
    }
    return {
      version: SAVE_VERSION,
      timestamp: Date.now(),
      data: data,
    };
  }

  /**
   * 导入存档（用于恢复）
   * @param {Object} exportData - 导出的存档数据
   * @returns {boolean} 是否导入成功
   */
  function importAll(exportData) {
    try {
      if (!exportData || !exportData.data) return false;
      // 🩸 S15 A1：与 exportAll 同口径——托管键（前缀 ∪ SAVE_KEYS ∪ storage.KEYS）皆可写回，
      //   否则备份恢复会把成就/设置等 18 个非 xynj_ 键静默丢掉。
      const _managed = {};
      managedKeys().forEach((k) => { _managed[k] = 1; });
      Object.keys(exportData.data).forEach((key) => {
        if (key.indexOf(KEY_PREFIX) === 0 || _managed[key]) {
          _store().setItem(key, exportData.data[key]);
        }
      });
      return true;
    } catch (e) {
      console.warn('[SaveSystem] 导入存档失败:', e);
      return false;
    }
  }

  // 导出模块
  NDX.SaveSystem = {
    SAVE_VERSION: SAVE_VERSION,
    SAVE_KEYS: SAVE_KEYS,
    KEY_PREFIX: KEY_PREFIX,
    MIGRATIONS: MIGRATIONS,
    migrateSave: migrateSave,
    load: load,
    save: save,
    remove: remove,
    exists: exists,
    loadString: loadString,
    saveString: saveString,
    loadNumber: loadNumber,
    saveNumber: saveNumber,
    loadBoolean: loadBoolean,
    saveBoolean: saveBoolean,
    getAllKeys: getAllKeys,
    clearAll: clearAll,
    getSize: getSize,
    exportAll: exportAll,
    importAll: importAll,
  };

})();
