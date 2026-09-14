// NDX.Platform 合同实现 · browser 宿主
// 契约：字段齐全（所有方法永远存在，不 undefined）；storage 同步语义；
// buyout 默认 dev mock=true（不破坏现有 H5 体验），可 buyout=0 模拟未购买。
(function () {
  if (!window.NDX) window.NDX = {};
  // 工厂注册（与 platform/index.js 约定）：index.js 检测出正确宿主后，
  // 经 window.__NDX_PLATFORM_FACTORIES[name] 重新装配本实现。
  function create() {
  function mkStorage(localStore) {
    return {
      get: function (k, fallback) {
        try {
          var raw = localStore.getItem(k);
          if (raw === null || raw === undefined) return (fallback !== undefined) ? fallback : null;
          if (typeof fallback === 'string' || fallback === null) return raw;
          try { return JSON.parse(raw); } catch (e) { return fallback; }
        } catch (e) { return (fallback !== undefined) ? fallback : null; }
      },
      set: function (k, v) {
        try {
          var s = (typeof v === 'string') ? v : JSON.stringify(v);
          localStore.setItem(k, s);
        } catch (e) { /* 存储满 / 隐私模式 / Safari file:// 都忽略 */ }
      },
      remove: function (k) { try { localStore.removeItem(k); } catch (e) {} },
      clear: function () { try { localStore.clear(); } catch (e) {} },
      // 与 localStorage 原接口形状兼容，便于核心层 failback
      getItem: function (k) { return (localStore.getItem ? localStore.getItem(k) : this.get(k, null)); },
      setItem: function (k, v) { return localStore.setItem ? localStore.setItem(k, v) : this.set(k, v); },
      removeItem: function (k) { return localStore.removeItem ? localStore.removeItem(k) : this.remove(k); },
      get length() { try { if (typeof localStore.length === 'number') return localStore.length; } catch (e) {} return 0; },
      key: function (i) { try { if (typeof localStore.key === 'function') return localStore.key(i) || null; } catch (e) {} return null; }
    };
  }

  var STORE = (typeof localStorage !== 'undefined') ? localStorage : (function () {
    var m = {};
    return {
      getItem: function (k) { return (k in m) ? m[k] : null; },
      setItem: function (k, v) { m[k] = String(v); },
      removeItem: function (k) { delete m[k]; },
      clear: function () { m = {}; }
    };
  })();

  function qsParam(name) {
    try {
      var s = (location && location.search) || '';
      if (!s) return null;
      var m = new RegExp('[?&]' + name + '=([^&]+)').exec(s);
      return m ? decodeURIComponent(m[1]) : null;
    } catch (e) { return null; }
  }

  var BUYOUT_KEY = 'ndx_buyout_v1';
  var sim;
  if (window.__ndxBuyoutSim !== undefined) sim = window.__ndxBuyoutSim;
  else if (qsParam('buyout') === '0') sim = false;
  else if (qsParam('buyout') === '1') sim = true;

  window.NDX.Platform = {
    name: 'browser',
    version: 1,
    storage: mkStorage(STORE),
    buyout: {
      key: BUYOUT_KEY,
      simulate: function (state) { sim = state; },
      verifyAndBoot: function (opts) {
        opts = opts || {};
        try {
          // 浏览器 dev mock：本地标记 or sim 决定；默认当作"已购买"，与现状 H5 体验一致
          var local = STORE.getItem(BUYOUT_KEY);
          var purchased = false;
          if (local === 'true') purchased = true;
          if (sim === true) purchased = true;
          else if (sim === false) purchased = false;
          else if (sim === undefined && local !== 'true') purchased = true; // 浏览器 mock 默认已购 = 不破坏现有体验
          var res = { purchased: purchased, purchaseToken: local || ('mock-browser-' + Date.now()), source: 'browser.mock' };
          if (purchased && typeof opts.onPurchased === 'function') opts.onPurchased(res);
          if (!purchased && typeof opts.onNeedPurchase === 'function') opts.onNeedPurchase(res);
          return Promise.resolve(res);
        } catch (e) {
          if (typeof opts.onError === 'function') opts.onError(e);
          return Promise.reject(e);
        }
      },
      markPurchased: function (token) {
        try { STORE.setItem(BUYOUT_KEY, 'true'); } catch (e) {}
        if (typeof token === 'string' && token) {
          try { STORE.setItem(BUYOUT_KEY + '_token', token); } catch (e) {}
        }
      }
    },
    achievements: {
      // 浏览器端：不上传，记录到内存（方便单元测试断言）
      _calls: [],
      reportUnlocked: function (histArr, newlyArr) {
        if (window.NDX && window.NDX.Platform && window.NDX.Platform.achievements) {
          window.NDX.Platform.achievements._calls.push({ hist: (histArr || []).slice(), newly: (newlyArr || []).slice(), at: Date.now() });
        }
        try { STORE.setItem('ndx_ach_report_last', JSON.stringify({hist: histArr, newly: newlyArr, t: Date.now()})); } catch (e) {}
        return Promise.resolve();
      },
      reportLeaderboard: function (payload) {
        try { STORE.setItem('ndx_board_report_last', JSON.stringify(payload)); } catch (e) {}
        return Promise.resolve();
      }
    },
    share: function (p) {
      p = p || {};
      var url = (p.url || (location && location.href) || '');
      if (navigator && typeof navigator.clipboard !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        try {
          return Promise.resolve(navigator.clipboard.writeText(url)).catch(function () { return Promise.resolve(); });
        } catch (e) { /* 隐私模式无权限 */ }
      }
      // 降级：prompt
      try { if (window.prompt) window.prompt('复制以下链接分享：', url); } catch (e) {}
      return Promise.resolve();
    },
    // 买断版必须无内购（除买断本身）：任何 purchase 请求直接 fail（符合宪法 §七·五 第3条）
    purchase: function (_sku) {
      return Promise.reject(new Error('[Platform.browser] 买断版无内购：所有内容买断后可玩'));
    }
  };
  return window.NDX.Platform;
  }
  window.__NDX_PLATFORM_FACTORIES = window.__NDX_PLATFORM_FACTORIES || {};
  window.__NDX_PLATFORM_FACTORIES.browser = create;
  // 首次加载：尚无 Platform 则自建；否则等 index.js 按宿主 hint 决定是否重建。
  if (!window.NDX.Platform || !window.NDX.Platform.name) create();
})();
