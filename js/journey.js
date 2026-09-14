/* ============================================================
 * 《逆道西行》· 一路西行旅行层 (journey overlay)
 * 三层视差合成：远景(已重着色暖金 ACT_BG) / 中景(贯穿道路) / 近景(师徒四人+白龙马)
 * 行进模式：原地踏步 —— 背景(远景+地面)完全静止；队伍固定在偏右处，
 *           仅「唐僧骑白龙马」精灵做马腿踱步动画（唐僧上身保持不动）。
 * 不依赖任何游戏内模块；NDX.ACT_BG 存在时自动采用，否则用 init({bgs}) 显式传入。
 * 暴露 API：
 *   NDX.journey.init({bgs, act})  配置背景列表(0基)与起始幕
 *   NDX.journey.mount(rootEl)     挂载到某容器(非全屏也可)
 *   NDX.journey.setAct(i)         交叉淡入远景到第 i 幕（背景静止，不下落消失）
 *   NDX.journey.slideTo(i)        兼容别名 → setAct
 *   NDX.journey.travel(from,to,done)  过场：原地静止 + 交叉淡入到目标幕，done 后关闭
 *   NDX.journey.open(act)         全屏覆盖层打开(点背景关闭)
 *   NDX.journey.close()
 *   NDX.journey.autoCycle(ms)     自动循环 0..N-1(交叉淡入，用于 showcase)
 * ========================================================== */
(function () {
  'use strict';
  var W = window;
  var NDX = (W.NDX = W.NDX || {});
  var J = (NDX.journey = {});

  var cfg = { bgs: null, act: 0, playing: false, timer: null, travelTimer: null, idx: 0 };

  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }

  // 近景：仅唐僧骑白马。其余英雄先隐藏，按用户要求只保留领队。
  // 原地踏步模式：唐僧上身锁定静止，仅白马四腿做踱步循环（4帧横条 steps）。
  function partyHTML() {
    return '<div class="jx-sprite-cell">' +
             '<div class="jx-sprite"><div class="jx-sprite-strip"></div></div>' +
             '<div class="jx-card-name">唐僧</div>' +
           '</div>';
  }

  // 中景道路：底部贯穿全屏的土路，整体向右滚动（马朝左走，地面相对右移）。
  // 关键：dasharray 周期必须整除 SVG 一半宽度（600），保证 [0,600] 与 [600,1200] 虚线相位一致，无缝。
  //   - dasharray 周期 = 60（"20 40" 与 "24 36"），600/60=10、1200/60=20，无余数。
  // viewBox 1200×160（一周期），CSS width:200% + translateX(50%) 循环 = 移动 100% container = 半 viewBox。
  var ROAD_SVG =
    '<svg class="jx-road-svg" viewBox="0 0 1200 160" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      '<rect x="0" y="0" width="1200" height="160" fill="#caa15a" opacity="0.55"/>' +
      '<path d="M0 20 Q300 8 600 20 T1200 20" fill="none" stroke="#e8c27a" stroke-width="2.5" stroke-dasharray="20 40" opacity="0.55"/>' +
      '<path d="M0 80 Q300 68 600 80 T1200 80" fill="none" stroke="#f3d9a0" stroke-width="3" stroke-dasharray="24 36" opacity="0.75"/>' +
      '<path d="M0 140 Q300 128 600 140 T1200 140" fill="none" stroke="#e8c27a" stroke-width="2.5" stroke-dasharray="20 40" opacity="0.55"/>' +
    '</svg>';

  function build(root) {
    root.classList.add('jx-root');
    root.innerHTML = '';
    // 远景：两层静态 wrapper，交叉淡入在两者间切换；背景本身不滚动
    var farA = el('div', 'jx-far jx-far-a');
    var farB = el('div', 'jx-far jx-far-b');
    var vignette = el('div', 'jx-vignette');
    var mid = el('div', 'jx-mid', ROAD_SVG);
    var near = el('div', 'jx-near', partyHTML());
    var label = el('div', 'jx-label');
    root.appendChild(farA);
    root.appendChild(farB);
    root.appendChild(vignette);
    root.appendChild(mid);
    root.appendChild(near);
    root.appendChild(label);
    J._els = {
      root: root, farA: farA, farB: farB,
      mid: mid, near: near, label: label, front: farA
    };
  }

  function ensureOverlay() {
    var ov = document.getElementById('jx-overlay');
    if (!ov) {
      ov = el('div', 'jx-overlay');
      ov.id = 'jx-overlay';
      document.body.appendChild(ov);
      ov.addEventListener('click', function (e) {
        if (e.target === ov && !cfg.travelTimer) J.close();
      });
    }
    return ov;
  }

  // 静态设置某层远景（背景不滚动）。可带 ?v 缓存戳。
  function applyStatic(farEl, url) {
    if (!farEl) return;
    farEl.style.backgroundImage = "url('" + url + "')";
  }

  function resolveBgs() {
    if (cfg.bgs && cfg.bgs.length) return cfg.bgs;
    if (NDX.ACT_BG && NDX.ACT_BG.length) return NDX.ACT_BG;
    return [];
  }

  function actName(i) {
    var names = NDX.ACT_NAMES || null;
    if (names && names[i]) return names[i];
    return '第 ' + (i + 1) + ' 幕';
  }

  function norm(i, n) { return ((i % n) + n) % n; }

  J.init = function (opts) {
    opts = opts || {};
    cfg.bgs = opts.bgs || null;
    cfg.act = opts.act || 0;
    return J;
  };

  J.mount = function (root) {
    if (!root) return J;
    build(root);
    var bgs = resolveBgs();
    if (bgs.length) {
      var i = cfg.act % bgs.length;
      applyStatic(J._els.farA, bgs[i]);
      J._els.label.textContent = actName(i);
    }
    return J;
  };

  // 交叉淡入（默认/静止用）：背景静止，仅切换可见层，截图不下落消失
  J.setAct = function (i) {
    var bgs = resolveBgs();
    if (!bgs.length) return J;
    i = norm(i, bgs.length);
    var els = J._els;
    if (!els) return J;
    var front = els.front;
    var back = (front === els.farA) ? els.farB : els.farA;
    applyStatic(back, bgs[i]);
    requestAnimationFrame(function () {
      back.style.opacity = '1';
      front.style.opacity = '0';
    });
    els.front = back;
    cfg.act = i;
    els.label.textContent = actName(i);
    return J;
  };

  // 兼容别名
  J.slideTo = function (i) { return J.setAct(i); };

  // 过场：原地静止 + 交叉淡入到目标幕（不再整屏滑走、不再滚动背景）
  J.travel = function (fromI, toI, done) {
    var bgs = resolveBgs();
    if (!bgs.length) { if (done) done(); return J; }
    fromI = norm(fromI, bgs.length);
    toI = norm(toI, bgs.length);
    var ov = ensureOverlay();
    build(ov);
    var els = J._els;
    cfg.act = fromI;
    applyStatic(els.farA, bgs[fromI]);
    els.label.textContent = actName(fromI);
    ov.classList.add('show');
    // 短暂停留后交叉淡入到目标幕
    if (cfg.travelTimer) clearTimeout(cfg.travelTimer);
    cfg.travelTimer = setTimeout(function () {
      cfg.travelTimer = null;
      J.setAct(toI);
      setTimeout(function () {
        J.close();
        if (done) done();
      }, 900);
    }, 620);
    return ov;
  };

  J.open = function (act) {
    var ov = ensureOverlay();
    build(ov);
    var bgs = resolveBgs();
    var start = norm((act || cfg.act || 0), (bgs.length || 1));
    cfg.act = start;
    applyStatic(J._els.farA, bgs[start]);
    J._els.label.textContent = actName(start);
    ov.classList.add('show');
    return ov;
  };

  J.close = function () {
    var ov = document.getElementById('jx-overlay');
    if (ov) ov.classList.remove('show');
    J.stop();
  };

  J.stop = function () {
    cfg.playing = false;
    if (cfg.timer) { clearInterval(cfg.timer); cfg.timer = null; }
  };

  // 自动循环：交叉淡入换幕，背景始终静止（不会整幕滑走消失）
  J.autoCycle = function (ms) {
    ms = ms || 3200;
    J.stop();
    cfg.playing = true;
    var bgs = resolveBgs();
    if (!bgs.length) return J;
    cfg.timer = setInterval(function () {
      J.setAct(cfg.act + 1);
    }, ms);
    return J;
  };

  J.getAct = function () { return cfg.act; };

  // 暴露给控制台调试
  NDX.journey = J;
})();
