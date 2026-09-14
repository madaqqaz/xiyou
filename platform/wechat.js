// NDX.Platform 合同实现 · 微信小游戏宿主（本轮是占位骨架，不改动 minigame/bundle.js）
// 宿主会有全局 wx 对象；若无则 fallback 到 browser 等同的内存+本地 failback。
// 存档：wx.setStorageSync / getStorageSync（同步 API，与核心 SaveSystem 同步契约匹配）
// 成就：游戏圈上报占位（wx.postMessage / wx.request/wx.cloud 等运营后续接入，此处只记不抛）
(function () {
  if (!window.NDX) window.NDX = {};
  // 工厂注册（与 platform/index.js 约定）：index.js 检测出微信宿主后可重建本实现。
  function create() {
  function hasWx() { try { return typeof wx !== 'undefined' && wx; } catch (e) { return false; } }
  function has(name) { return hasWx() && typeof wx[name] === 'function'; }

  function mkStorage() {
    function mem() {
      var m = {};
      var order = [];
      return {
        getItem: function (k) { return (k in m) ? m[k] : null; },
        setItem: function (k, v) {
          if (!(k in m)) order.push(String(k));
          m[k] = String(v);
        },
        removeItem: function (k) {
          if (!(k in m)) return;
          delete m[k];
          var i = order.indexOf(String(k));
          if (i >= 0) order.splice(i, 1);
        },
        clear: function () { m = {}; order = []; },
        _m: function () { return m; },
        _order: function () { return order; }
      };
    }
    var MEM = mem();
    function hasK(k) {
      if (has('getStorageInfoSync')) { try {
        var info = wx.getStorageInfoSync();
        return info && info.keys && info.keys.indexOf(k) >= 0;
      } catch (e) {} return false; }
      return MEM.getItem(k) !== null;
    }
    function lenAll() {
      if (has('getStorageInfoSync')) { try {
        var info = wx.getStorageInfoSync();
        return info && Array.isArray(info.keys) ? info.keys.length : 0;
      } catch (e) {} return 0; }
      return MEM._order().length;
    }
    function keyAt(i) {
      if (has('getStorageInfoSync')) { try {
        var info = wx.getStorageInfoSync();
        return info && info.keys && info.keys[i] != null ? info.keys[i] : null;
      } catch (e) {} return null; }
      return MEM._order()[i] || null;
    }
    return {
      get: function (k, fallback) {
        try {
          var raw = null;
          if (has('getStorageSync')) { try { raw = wx.getStorageSync(k); } catch (e) { raw = MEM.getItem(k); } }
          else raw = MEM.getItem(k);
          if (raw === null || raw === undefined || raw === '') return (fallback !== undefined) ? fallback : null;
          if (typeof fallback === 'string' || fallback === null) return raw;
          if (typeof raw !== 'string') return raw; // wx 同步读可能已解析
          try { return JSON.parse(raw); } catch (e) { return fallback; }
        } catch (e) { return (fallback !== undefined) ? fallback : null; }
      },
      set: function (k, v) {
        try {
          var s = (typeof v === 'string') ? v : JSON.stringify(v);
          if (has('setStorageSync')) { try { wx.setStorageSync(k, s); return; } catch (e) {} }
          MEM.setItem(k, s);
        } catch (e) {}
      },
      remove: function (k) {
        try { if (has('removeStorageSync')) wx.removeStorageSync(k); else MEM.removeItem(k); } catch (e) {}
      },
      clear: function () {
        try { if (has('clearStorageSync')) wx.clearStorageSync(); else MEM.clear(); } catch (e) {}
      },
      getItem: function (k) { return String(this.get(k, null)); },
      setItem: function (k, v) { return this.set(k, v); },
      removeItem: function (k) { return this.remove(k); },
      get length() { return lenAll(); },
      key: function (i) { return keyAt(i); }
    };
  }

  window.NDX.Platform = {
    name: 'wechat',
    version: 1,
    storage: mkStorage(),
    buyout: {
      key: 'ndx_buyout_v1',
      simulate: function () { /* 微信端无买断（免费+广告），本方法 noop */ },
      // 微信端无买断门禁，永远回调 onPurchased（视为免费玩家=已购买）
      verifyAndBoot: function (opts) {
        opts = opts || {};
        var res = { purchased: true, purchaseToken: '', source: 'wechat.free_to_play' };
        if (typeof opts.onPurchased === 'function') opts.onPurchased(res);
        return Promise.resolve(res);
      },
      markPurchased: function () { /* noop */ }
    },
    achievements: {
      reportUnlocked: function (histArr, newlyArr) {
        // 游戏圈上报占位：失败不抛；具体 API 运营联调时加
        newlyArr = newlyArr || [];
        try {
          if (has('postMessage')) {
            // 订阅消息或开放数据域发送，占位 payload（不 await 不阻塞）
            wx.postMessage({ type: 'achievements.unlock', ids: newlyArr, ts: Date.now() });
          }
        } catch (e) {}
        return Promise.resolve();
      },
      reportLeaderboard: function (payload) {
        payload = payload || {};
        try { if (has('postMessage')) wx.postMessage({ type: 'leaderboard.submit', key: payload.key, score: payload.score, ts: Date.now() }); } catch (e) {}
        return Promise.resolve();
      }
    },
    share: function (p) {
      p = p || {};
      try {
        if (has('shareAppMessage')) {
          // 仅设置最近一次分享菜单内容（分享按钮触发），不主动弹
          wx.shareAppMessage({ title: p.title || '逆道西行 · 黑暗西游 · 肉鸽', desc: p.desc || '', query: 'ref=share' });
        }
      } catch (e) {}
      return Promise.resolve();
    },
    // 微信小游戏有内购（wx.requestMidasPayment），但本项目微信端策略是「免费+激励视频广告」
    // 为避免宪法"无内购（买断版）"与微信端策略混淆，purchase 走微信真 API 的占位：直接 fail（具体策略由运营后续打开）
    purchase: function (_sku) {
      return Promise.reject(new Error('[Platform.wechat] 微信端内购/激励视频待接入，请在适配层扩展'));
    }
  };
  return window.NDX.Platform;
  }
  window.__NDX_PLATFORM_FACTORIES = window.__NDX_PLATFORM_FACTORIES || {};
  window.__NDX_PLATFORM_FACTORIES.wechat = create;
  if (!window.NDX.Platform || !window.NDX.Platform.name) create();
})();
