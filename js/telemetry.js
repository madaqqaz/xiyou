// =============================================================
// telemetry.js — 运营数据埋点（V8.48 · P0 运营数据闭环）
// 轻量环形缓冲；零第三方依赖；上线后用于定位流失 / 卡关 / 经济。
// 仅由 owner 层（game.js / data_equip_core.js）在关键节点调用 NDX.telemetry.track()。
// 存储统一走 NDX.Platform.storage（三端适配层契约，browser/wechat/taptap 均已提供），
// 绝不裸用 localStorage —— 符合 AGENTS.md 三端同步纪律。无平台存储环境时 track 静默 no-op。
// 所有写入 try/catch 静默，绝不阻断游戏主流程。
// =============================================================
(function (root) {
  var NDX = root.NDX || (root.NDX = {});
  var KEY = 'ndx_telemetry_v1';
  var CAP = 600; // 环形缓冲上限（条），超出丢弃最旧；P0-3（2026-09-06）由 200→600，单局战斗+经济双采样（≈2 事件/场）可保约 3 整局基线
  var _mem = null;
  // 统一存储入口：优先平台适配层 storage（三端一致），无则无存储环境
  function _store() {
    try { if (NDX.Platform && NDX.Platform.storage) return NDX.Platform.storage; } catch (e) {}
    return null;
  }
  function _load() {
    if (_mem) return _mem;
    try {
      var st = _store();
      var raw = st ? st.getItem(KEY) : null;
      _mem = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(_mem)) _mem = [];
    } catch (e) { _mem = []; }
    return _mem;
  }
  function _save(arr) {
    _mem = arr;
    try { var st = _store(); if (st) st.setItem(KEY, JSON.stringify(arr)); } catch (e) {}
  }
  NDX.telemetry = {
    // 写入一条事件。payload 任意可序列化对象。失败静默。
    track: function (ev, payload) {
      try {
        var arr = _load();
        var rec = { t: Date.now(), ev: ev };
        if (payload && typeof payload === 'object') {
          for (var k in payload) {
            if (Object.prototype.hasOwnProperty.call(payload, k)) rec[k] = payload[k];
          }
        }
        arr.push(rec);
        if (arr.length > CAP) arr = arr.slice(arr.length - CAP); // 环形：丢弃最旧
        _save(arr);
      } catch (e) { /* 静默 */ }
    },
    // 返回全部并清空（调试 / 导出用）
    drain: function () { var a = _load(); _save([]); return a; },
    // 返回 JSON 字符串（不清空）
    export: function () { try { return JSON.stringify(_load()); } catch (e) { return '[]'; } },
    count: function () { return _load().length; },
    clear: function () { _save([]); },
    // —— P0-3（2026-09-06）：战斗时长 / 经济存量遥测"纯构建器" ——
    // 与 track() 分离：构建器只吃 (p, s) 返回可序列化载荷，便于无头门禁直接断言字段，
    // 不在游戏流程里散落取数逻辑。所有取数失败均 try/catch 降级为最小载荷，绝不抛错。
    // 战斗场次事件：一回合一记录，胜负/难度/类型/回合/墙钟全维度——把"时长分布"从推测变可证伪。
    buildFightEvent: function (p, s) {
      try {
        var res = (p && p.res) ? p.res : {};
        var rd = res.roundsDetail;
        var rounds = (rd && Array.isArray(rd)) ? rd.length : 0;
        var node = (p && p.node) ? p.node : null;
        var nodeType = (node && node.type) || 'mob';
        var boss = !!(res.monsterTags && res.monsterTags.indexOf && res.monsterTags.indexOf('boss') >= 0) || !!(p && p.monster && p.monster.boss);
        var diff = (node && node.diff) || (s && s.diff) || (s && s.layer) || 0;
        var ms = (p && p._startTs) ? Math.max(0, Date.now() - p._startTs) : null;
        return {
          win: !!(p && p.win),
          nodeType: nodeType,
          boss: !!boss,
          rounds: rounds,
          diff: diff,
          region: (s && s.act) || 1,
          ms: ms
        };
      } catch (e) { return { win: !!(p && p.win), rounds: 0 }; }
    },
    // 经济存量快照：单局资源存量随进度采样（post_fight / run_end），把"通胀曲线"从推测变可证伪。
    buildEconEvent: function (s, tag) {
      try {
        if (!s) return { tag: tag || 'unknown' };
        var mats = s.materials || {};
        var matCount = 0;
        for (var k in mats) { if (Object.prototype.hasOwnProperty.call(mats, k)) matCount += (mats[k] || 0); }
        return {
          tag: tag || 'unknown',
          layer: s.layer || 0,
          region: s.act || 1,
          gold: s.gold || 0,
          equips: (s.equips || []).length,
          materials: matCount,
          seals: (s.hSeals || []).length,
          treasures: (s.treasures || []).length,
          shards: s.runShards || 0,
          mi: s.miPoints || 0
        };
      } catch (e) { return { tag: tag || 'unknown' }; }
    }
  };
})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this));
