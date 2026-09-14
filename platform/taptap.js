// NDX.Platform 合同实现 · TapTap 买断版宿主
// 真正上架时会注入 window.tt (TapSDK)。此处按 failback 优先设计：
//   - 若 window.tt / TapSDK.Achievement / buyout 单例存在 → 走真 SDK
//   - 否则 → 全 failback 本地 Storage，保证开发包、离线、SDK 加载失败全路径仍能跑
(function () {
  if (!window.NDX) window.NDX = {};
  // 工厂注册（与 platform/index.js 约定）：index.js 检测出 TapTap 宿主后可重建本实现。
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
        } catch (e) {}
      },
      remove: function (k) { try { localStore.removeItem(k); } catch (e) {} },
      clear: function () { try { localStore.clear(); } catch (e) {} },
      getItem: function (k) { return localStore.getItem ? localStore.getItem(k) : this.get(k, null); },
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

  var BUYOUT_KEY = 'ndx_buyout_v1';
  // 成就 ID → TapTap 运营下发 id 的映射表（运营补填，缺 key 直接 noop）
  var ACH_MAP = {};

  function hasSDK(k) { try { return !!(window.tt && k && window.tt[k]); } catch (e) { return false; } }

  window.NDX.Platform = {
    name: 'taptap',
    version: 1,
    storage: mkStorage(STORE),
    buyout: {
      key: BUYOUT_KEY,
      simulate: function (state) {
        // 防泄露：生产环境若 window.__ndxAllowBuyoutSim !== true 时，simulate 被禁用
        if (window.__ndxAllowBuyoutSim !== true) return;
        try { STORE.setItem('ndx_buyout_sim', state ? '1' : '0'); } catch (e) {}
      },
      verifyAndBoot: function (opts) {
        opts = opts || {};
        function done(purchased, token, source) {
          var res = { purchased: purchased, purchaseToken: token || '', source: source || 'taptap.failback' };
          if (purchased && typeof opts.onPurchased === 'function') opts.onPurchased(res);
          if (!purchased && typeof opts.onNeedPurchase === 'function') opts.onNeedPurchase(res);
          return Promise.resolve(res);
        }
        try {
          // 1) 优先走真 SDK：window.tt.buyout.check()
          if (hasSDK('buyout') && typeof window.tt.buyout.check === 'function') {
            return Promise.resolve(window.tt.buyout.check()).then(function (r) {
              var ok = !!(r && (r.purchased || r.status === 'purchased'));
              if (ok) {
                try { STORE.setItem(BUYOUT_KEY, 'true'); } catch (e) {}
                return done(true, (r && r.token) || '', 'taptap.sdk.buyout');
              }
              return done(false, '', 'taptap.sdk.buyout');
            }).catch(function (err) {
              if (typeof opts.onError === 'function') opts.onError(err);
              return done(false, '', 'taptap.sdk.error');
            });
          }
          // 2) failback：本地买断标记
          var local = STORE.getItem(BUYOUT_KEY) === 'true';
          var sim = null;
          if (window.__ndxAllowBuyoutSim === true) {
            var s = STORE.getItem('ndx_buyout_sim');
            if (s === '1') sim = true; else if (s === '0') sim = false;
          }
          if (sim === true) return done(true, '', 'taptap.sim');
          if (sim === false) return done(false, '', 'taptap.sim');
          if (local) return done(true, STORE.getItem(BUYOUT_KEY + '_token') || '', 'taptap.failback');
          // 离线 failback：开发阶段/SDK 暂未接入，不阻断，提示一次即可（主 UI 会再弹 buyout gate 说明）
          return done(false, '', 'taptap.failback.notpurchased');
        } catch (e) {
          if (typeof opts.onError === 'function') opts.onError(e);
          return Promise.resolve({ purchased: false, purchaseToken: '', source: 'taptap.error' });
        }
      },
      markPurchased: function (token) {
        try {
          STORE.setItem(BUYOUT_KEY, 'true');
          if (typeof token === 'string' && token) STORE.setItem(BUYOUT_KEY + '_token', token);
        } catch (e) {}
      }
    },
    achievements: {
      reportUnlocked: function (histArr, newlyArr) {
        newlyArr = newlyArr || [];
        if (hasSDK('achievements') && typeof window.tt.achievements.unlock === 'function') {
          for (var i = 0; i < newlyArr.length; i++) {
            var id = newlyArr[i];
            var mapped = ACH_MAP[id] || id;
            try { window.tt.achievements.unlock(mapped); } catch (e) { /* 单条不影响后续 */ }
          }
        } else {
          // 无 SDK 时 failback 记录本地，不报错
          try { STORE.setItem('ndx_ach_report_last', JSON.stringify({hist: histArr, newly: newlyArr, t: Date.now()})); } catch (e) {}
        }
        return Promise.resolve();
      },
      reportLeaderboard: function (payload) {
        payload = payload || {};
        if (hasSDK('leaderboard') && typeof window.tt.leaderboard.submitScore === 'function') {
          try { window.tt.leaderboard.submitScore(String(payload.key || ''), Number(payload.score || 0)); } catch (e) {}
        } else {
          try { STORE.setItem('ndx_board_report_last', JSON.stringify(payload)); } catch (e) {}
        }
        return Promise.resolve();
      }
    },
    share: function (p) {
      p = p || {};
      if (hasSDK('share') && typeof window.tt.share === 'function') {
        try {
          return Promise.resolve(window.tt.share({ title: p.title || '', desc: p.desc || '', url: p.url || '' }));
        } catch (e) { return Promise.resolve(); }
      }
      // failback：复制到剪贴板
      var url = p.url || '';
      try { if (navigator && navigator.clipboard && navigator.clipboard.writeText) return Promise.resolve(navigator.clipboard.writeText(url)).catch(function () { return Promise.resolve(); }); } catch (e) {}
      try { if (window.prompt) window.prompt('复制以下链接分享：', url); } catch (e) {}
      return Promise.resolve();
    },
    purchase: function (_sku) {
      // 买断版除买断本身外不得有内购：任何 purchase 请求直接 fail
      return Promise.reject(new Error('[Platform.taptap] 买断版无内购'));
    }
  };
  return window.NDX.Platform;
  }
  window.__NDX_PLATFORM_FACTORIES = window.__NDX_PLATFORM_FACTORIES || {};
  window.__NDX_PLATFORM_FACTORIES.taptap = create;
  if (!window.NDX.Platform || !window.NDX.Platform.name) create();
})();
