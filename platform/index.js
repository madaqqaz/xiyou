// NDX.Platform 自动装配：根据宿主全局对象存在性选实现
// 判定顺序（必须与宪法 §七 三端同步保持一致）：
//   1) 有 window.tt 或 __ndxPlatformHint === 'taptap' → taptap
//   2) 有 window.wx 或 __ndxPlatformHint === 'wechat'   → wechat
//   3) 其他（浏览器 / file:// / 桌面壳）               → browser
// 注意：必须在 platform/browser.js / taptap.js / wechat.js 之前加载吗？
//   → 不：反过来，本文件最后加载，按顺序 import 三个子实现：子实现内部有已装配检测（Platform.name 存在就 return）
//     所以实际 index.html 要：先依次加载 browser.js → taptap.js → wechat.js → 最后 index.js。
//     本文件的职责是：基于 Hint 清理掉不匹配的实现、保留匹配的。
(function () {
  var hint = window.__ndxPlatformHint;
  var host;
  if (hint === 'taptap') host = 'taptap';
  else if (hint === 'wechat') host = 'wechat';
  else if (hint === 'browser') host = 'browser';
  else {
    try { if (typeof window.tt !== 'undefined') host = 'taptap'; } catch (e) {}
    if (!host) try { if (typeof wx !== 'undefined') host = 'wechat'; } catch (e) {}
    if (!host) host = 'browser';
  }
  if (!window.NDX) window.NDX = {};
  var cur = (window.NDX.Platform && window.NDX.Platform.name) || '';
  if (cur && cur !== host) {
    // 重新装配：若顺序错了（如 browser 先建了但其实是 taptap 宿主），走一次重建（每个实现都有 no-conflict 保护，这里给兜底清）
    var saved = window.NDX.Platform;
    window.NDX.Platform = undefined;
    // 触发对应文件里的 IIFE 重新执行是不可能的（script 只跑一次），所以提供一个兜底：
    // 按 host 名查找是否有对应的工厂方法。各 platform/*.js 在文件尾把实现挂在 window.__NDX_PLATFORM_FACTORIES[name]
    var factory = (window.__NDX_PLATFORM_FACTORIES && window.__NDX_PLATFORM_FACTORIES[host]) || null;
    if (factory) factory();
    if (!window.NDX.Platform) window.NDX.Platform = saved; // 工厂未提供时保留
  }

  // 保证 NDX.Platform 在任何情况下都不为空（browser fallback）：
  if (!window.NDX.Platform) {
    window.NDX.Platform = {
      name: 'fallback', version: 0,
      storage: (function () {
        var m = {};
        var order = [];
        return {
          get: function (k, f) { return k in m ? m[k] : (f!==undefined?f:null); },
          set: function (k, v) { if (!(k in m)) order.push(String(k)); m[k] = (typeof v==='string'?v:JSON.stringify(v)); },
          remove: function (k) { if (!(k in m)) return; delete m[k]; var i = order.indexOf(String(k)); if (i>=0) order.splice(i,1); },
          clear: function () { m={}; order=[]; },
          getItem: function (k) { return this.get(k, null); },
          setItem: function (k,v){ return this.set(k,v); },
          removeItem: function (k){ return this.remove(k); },
          get length() { return order.length; },
          key: function (i) { return order[i] || null; }
        };
      })(),
      buyout: { key:'ndx_buyout_v1', simulate: function(){}, verifyAndBoot: function(o){ o=o||{}; var r={purchased:true,purchaseToken:'',source:'fallback'}; if (o.onPurchased) o.onPurchased(r); return Promise.resolve(r); }, markPurchased: function(){} },
      achievements: { reportUnlocked: function(){return Promise.resolve();}, reportLeaderboard: function(){return Promise.resolve();} },
      share: function(){return Promise.resolve();},
      purchase: function(){return Promise.reject(new Error('[Platform.fallback] 无内购'));}
    };
  }
  // 对外只读暴露检测结果
  try { Object.defineProperty(window.NDX.Platform, '_hostHint', { value: host, writable: false, enumerable: false }); } catch (e) {}
})();
