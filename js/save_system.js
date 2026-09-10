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
  const SAVE_VERSION = 1;

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
      return JSON.parse(raw);
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
   * 获取所有存档key（带前缀）
   * @returns {Array} 存档key列表
   */
  function getAllKeys() {
    const keys = [];
    try {
      for (let i = 0; i < _store().length; i++) {
        const key = _store().key(i);
        if (key && key.indexOf(KEY_PREFIX) === 0) {
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
      Object.keys(exportData.data).forEach((key) => {
        if (key.indexOf(KEY_PREFIX) === 0) {
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
