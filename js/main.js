// =============================================================
// main.js — 入口：实例化游戏、事件委托、首次渲染
// =============================================================

// 悟空小说段落「打字机」逐字播放（水墨叙事，胜利后播放 STATE_NARRATIVE）
function startNovelTypewriter() {
  const el = document.getElementById('narr-text');
  if (!el) return;
  const g = NDX.game;
  const text = (g.state && g.state.pending && g.state.pending.text) || '';
  el.textContent = '';
  let i = 0;
  if (el._timer) clearInterval(el._timer);
  el._timer = setInterval(() => {
    i++;
    el.textContent = text.slice(0, i);
    if (i >= text.length) { clearInterval(el._timer); el._timer = null; }
  }, 55);
}

// 全局长安按钮入口已回收（v327）：排查期加的 onclick 直连 + 调试浮层已删除，
// 起始页/地图 HUD 长安按钮统一走 document 事件委托（onAppClick 'open-changan'），
// 实测（CDP 375x812 伪旋转）两条路径均正常弹窗，委托为唯一真源（AGENTS.md §五）。

// 全局错误兜底：任何运行时异常都显示到页面，避免纯白屏难以排查
window.addEventListener('error', function (e) {
  const box = document.getElementById('fatal-error');
  // 优先取真实 Error 对象堆栈；跨域脚本的 e.message 可能为空（"Script error."）
  const realErr = e && e.error ? e.error : null;
  const stack = realErr && realErr.stack ? realErr.stack : '';
  const msg = (e && e.message) ? e.message : (realErr ? String(realErr) : '未知错误');
  const src = (e && e.filename) ? (e.filename + ':' + (e.lineno || '?')) : '';
  let text = '[运行时错误] ' + msg + (src ? ('  @ ' + src) : '');
  if (stack) text += '\n' + stack;
  if (box) { box.style.display = 'block'; box.textContent += text + '\n'; }
  else {
    const d = document.createElement('pre');
    d.id = 'fatal-error';
    d.style.cssText = 'position:fixed;left:0;top:0;right:0;z-index:99999;background:#3a0d0d;color:#ffd2d2;padding:12px;white-space:pre-wrap;font-size:13px;max-height:50vh;overflow:auto;border-bottom:2px solid #b00;';
    d.textContent = text + '\n';
    (document.body || document.documentElement).appendChild(d);
  }
});
// 资源加载失败（如某个 js 脚本 404）→ 明确提示，避免只显示无信息的 "Script error."
window.addEventListener('error', function (e) {
  if (e && e.target && (e.target.tagName === 'SCRIPT' || e.target.tagName === 'LINK')) {
    const src = e.target.src || e.target.href || '';
    const box = document.getElementById('fatal-error');
    const tip = '[资源加载失败] ' + src + '\n请确认该文件与本页面在同一目录，并尝试强制刷新（Ctrl+F5）。';
    if (box) { box.style.display = 'block'; box.textContent += tip + '\n'; }
    else {
      const d = document.createElement('pre');
      d.id = 'fatal-error';
      d.style.cssText = 'position:fixed;left:0;top:0;right:0;z-index:99999;background:#3a0d0d;color:#ffd2d2;padding:12px;white-space:pre-wrap;font-size:13px;max-height:50vh;overflow:auto;border-bottom:2px solid #b00;';
      d.textContent = tip + '\n';
      (document.body || document.documentElement).appendChild(d);
    }
  }
}, true); // 捕获阶段，才能收到资源加载错误

// ============================================================================
// 买断版启动门禁（AGENTS.md §七·五 买断版特殊规则(1)）
// 统一入口：先跑 NDX.Platform.buyout.verifyAndBoot
//   → purchased=true → startGame()（进入原主线）
//   → purchased=false → 渲染 buyout-gate 全屏弹窗（「启动游戏」/「已购买验证」/「模拟未购买开关」等）
// 若 NDX.Platform / buyout 不可用（极旧环境）：降级直接 startGame，不破坏现有 H5 体验。
// ============================================================================
function _qsParam(name) {
  try {
    const s = (location && location.search) || '';
    if (!s) return null;
    const m = new RegExp('[?&]' + name + '=([^&]+)').exec(s);
    return m ? decodeURIComponent(m[1]) : null;
  } catch (e) { return null; }
}
function _hideBuyoutGate() {
  try { const g = document.getElementById('ndx-buyout-gate'); if (g && g.parentNode) g.parentNode.removeChild(g); } catch (e) {}
}
function _showBuyoutGate(result) {
  _hideBuyoutGate();
  const html = (typeof document !== 'undefined') && document.documentElement;
  if (html && html.classList) {
    // 买断门禁永远在 body 顶层，不被 #ndx-lock 旋转；但我们给 <html> 加一个标记让 CSS 能处理
    html.classList.add('ndx-buyout-shown');
  }
  const layer = document.createElement('div');
  layer.id = 'ndx-buyout-gate';
  layer.className = 'buyout-gate';
  layer.innerHTML =
    '<div class="buyout-mask"></div>' +
    '<div class="buyout-modal">' +
    '  <div class="buyout-title">逆道西行 · 买断版</div>' +
    '  <div class="buyout-sub">黑暗西游 · 单局 Roguelike 肉鸽构筑</div>' +
    '  <div class="buyout-desc">买断内容：9 章 / 17 地区 / 81 难 / 5+ 英雄，无广告 · 无内购 · 完全离线可玩</div>' +
    '  <div class="buyout-status" id="ndx-buyout-status">尚未检测到购买记录。点击「启动游戏」可进入购买流程；如您已购买，点「我已购买，验证」自动启用。</div>' +
    '  <div class="buyout-actions">' +
    '    <button type="button" class="buyout-btn buyout-primary" id="ndx-btn-buy">启动游戏 · 买断解锁</button>' +
    '    <button type="button" class="buyout-btn buyout-secondary" id="ndx-btn-restore">我已购买，验证</button>' +
    '    <button type="button" class="buyout-btn buyout-ghost" id="ndx-btn-hide">取消/返回</button>' +
    '  </div>' +
    '  <div class="buyout-footer">TapTap 平台 · 官方买断版 · 一次买断永不过期。来源信息：<span id="ndx-buyout-source">' + (result && result.source || 'pending') + '</span></div>' +
    '</div>';
  // 买断门禁挂进 ndx-modal-host（ndx-lock 内部，随旋转层横屏）；body 仅兜底
  (window.__ndxOverlay || document.body.appendChild.bind(document.body))(layer);
  function showTip(text, kind) {
    const el = document.getElementById('ndx-buyout-status');
    if (!el) return;
    el.textContent = text;
    el.className = 'buyout-status ' + (kind ? ('is-' + kind) : '');
  }
  const bo = (window.NDX && NDX.Platform && NDX.Platform.buyout) || null;
  document.getElementById('ndx-btn-buy').addEventListener('click', function () {
    // 买断版：此处应走真实平台买断发起。Browser 端做 dev mock（直接本地打已购标记并放行）。
    if (bo && typeof bo.markPurchased === 'function') bo.markPurchased('dev-mock-' + Date.now());
    // 关键：若由 ?buyout=0 / simulate(false) 触发了"模拟未购"强压，这里必须取消强压
    // （simulate(undefined)），否则 browser.js verifyAndBoot 的 sim===false 分支会无视已购标记，
    // 点解锁后仍判为未购而无法启动主线（AGENTS.md §七·五 买断规则）。
    if (bo && typeof bo.simulate === 'function') bo.simulate(undefined);
    showTip('已标记为已购买，正在启动游戏…', 'ok');
    setTimeout(function () { bo && bo.verifyAndBoot({ onPurchased: startGame }); }, NDX.TIMING.BOOT_VERIFY);
  });
  document.getElementById('ndx-btn-restore').addEventListener('click', function () {
    if (!bo) { showTip('适配层未就绪，无法验证。', 'err'); return; }
    showTip('正在从 TapTap 服务端 / 本地缓存检索购买记录…');
    // 即使 verifyAndBoot 仍返回未购买，markPurchased 本地 failback 保证开发包可"点击手动解锁"。
    // 同样需取消 simulate 强压，让本地已购标记在 verifyAndBoot 中生效。
    bo.markPurchased('restore-' + Date.now());
    if (typeof bo.simulate === 'function') bo.simulate(undefined);
    bo.verifyAndBoot({
      onPurchased: startGame,
      onNeedPurchase: function (r) { showTip('暂未查询到购买记录；点「启动游戏 · 买断解锁」可在开发模式手动试用。（' + (r && r.source || '') + '）', 'warn'); }
    });
  });
  document.getElementById('ndx-btn-hide').addEventListener('click', function () {
    // 注意：宪法规定「未购买不直接放玩」。取消键仅退回空页面，不进入游戏。
    layer.classList.add('ndx-hidden');
    showTip('您尚未完成买断，暂不可进入游戏。请点「启动游戏 · 买断解锁」或「我已购买，验证」。', 'warn');
    setTimeout(function () { layer.classList.remove('ndx-hidden'); }, 900);
  });
  // dev：?buyout=0 页面显示一个"一键切换模拟"调试开关
  if (_qsParam('buyout') !== null || (window.__ndxAllowBuyoutSim === true)) {
    const t = document.createElement('div');
    t.className = 'buyout-sim';
    t.innerHTML = '<label><input type="checkbox" id="ndx-chk-sim" /> 模拟未购买（开发调试）</label>';
    layer.querySelector('.buyout-modal').appendChild(t);
    const cb = document.getElementById('ndx-chk-sim');
    cb.checked = true;
    cb.addEventListener('change', function () {
      if (bo && typeof bo.simulate === 'function') bo.simulate(!cb.checked);
      if (cb.checked) showTip('当前：模拟未购买（勾取消切回已购模拟）', 'warn');
      else showTip('当前：模拟已购买，将在 0.5s 后放行…', 'ok'), setTimeout(startGame, NDX.TIMING.BOOT_STARTGAME);
    });
  }
}

window.addEventListener('DOMContentLoaded', function () {
  try {
    if (!window.NDX) {
      throw new Error('核心脚本未加载：请确认 js/data.js 等文件与本页面在同一目录，且未因 file:// 的 ?v= 版本参数而加载失败。');
    }
    const NDX = window.NDX;
    const bo = (NDX.Platform && NDX.Platform.buyout) ? NDX.Platform.buyout : null;
    // 启动先跑买断门禁（若不可用，降级直接进入原主线）
    if (bo && typeof bo.verifyAndBoot === 'function') {
      bo.verifyAndBoot({
        onPurchased: startGame,
        onNeedPurchase: _showBuyoutGate,
        onError: function (err) {
          try { console.warn('[buyout] verifyAndBoot 异常，降级进入买断门禁 UI：', err); } catch (e) {}
          try { _showBuyoutGate({ source: 'verify-error' }); } catch (e2) { startGame(); }
        }
      }).catch(function (err) {
        try { console.warn('[buyout] verifyAndBoot promise reject：', err); } catch (e) {}
        try { _showBuyoutGate({ source: 'verify-reject' }); } catch (e2) { startGame(); }
      });
    } else {
      startGame();
    }
  } catch (err) {
    const d = document.createElement('pre');
    d.id = 'fatal-error';
    d.style.cssText = 'position:fixed;left:0;top:0;right:0;z-index:99999;background:#3a0d0d;color:#ffd2d2;padding:12px;white-space:pre-wrap;font-size:13px;max-height:50vh;overflow:auto;border-bottom:2px solid #b00;';
    d.textContent = '[初始化失败] ' + (err && err.stack ? err.stack : err);
    (document.body || document.documentElement).appendChild(d);
    console.error(err);
  }
});

// 实际主线入口（所有 Game 实例化、事件监听、渲染、退后台暂停都在这里，保证被买断门禁正确包裹）
function startGame() {
  try {
    _hideBuyoutGate();
    if (typeof document !== 'undefined') {
      const html = document.documentElement;
      if (html && html.classList) html.classList.remove('ndx-buyout-shown');
    }
    var NDX = window.NDX;
    // NDX.game 只实例化一次（防止「已购买→启动→失败→再回」重复实例化造成状态串）
    if (!NDX.game) NDX.game = new NDX.Game();
    document.addEventListener('click', onAppClick);

    // V8.5x 立绘 WebP 全局 fallback：WebP 加载失败时自动替换为同路径 PNG（兼容不支持 WebP 的旧浏览器）
    document.addEventListener('error', function(e) {
      const t = e.target;
      if (t && t.tagName === 'IMG' && t.src && t.src.endsWith('.webp') && !t._webpFallback) {
        t._webpFallback = true;
        t.src = t.src.replace(/.webp$/, '.png');
      }
    }, true);

    // 难簿长卷地图：悬停节点更新底部提示（不阻断战斗逻辑）
    document.addEventListener('mouseover', (e) => {
      const node = e.target.closest && e.target.closest('.nbm-node');
      const tip = document.getElementById('nbm-tip');
      if (!node || !tip) return;
      const diff = parseInt(node.getAttribute('data-diff'), 10);
      const lib = (NDX.TRIAL_LIB || {})[diff] || {};
      const cleared = NDX.loadClearedDiffs().indexOf(diff) >= 0;
      tip.textContent = `第 ${diff} 难 · ${lib.name || '？'}${cleared ? ' · 已历' : ' · 未历'} — ${lib.dark ? lib.dark.slice(0, 24) + '…' : '悬停查看详情，点击展开难情'}`;
    });

    // —— 特殊交互：拖拽空白处查看敌方详情 + 长按法宝弹窗 ——
    let _drag = null, _lpTimer = null;
    const _inFight = () => { const p = NDX.game && NDX.game.state && NDX.game.state.pending; return !!(p && p.kind === 'fight'); };
    const _toggleEnemyDetail = (show) => {
      const el = document.querySelector('[data-enemy-detail]');
      if (!el) return;
      if (show === undefined) show = el.hasAttribute('hidden');
      if (show) el.removeAttribute('hidden'); else el.setAttribute('hidden', '');
    };
    document.addEventListener('pointerdown', (e) => {
      if (!_inFight()) return;
      const t = e.target;
      const tre = t.closest && t.closest('[data-tre-popup]');
      if (tre) {
        // 长按 450ms 弹窗（不触发释放）
        const tid = tre.getAttribute('data-tre-popup');
        _lpTimer = setTimeout(() => {
          window.__treLongPressed = true;
          if (NDX.ui && NDX.ui.openTreasurePopup) NDX.ui.openTreasurePopup(tid);
        }, 450);
      }
      _drag = {
        x: e.clientX, y: e.clientY, moved: false, shown: false,
        onBlank: !t.closest('.fb-tre, .fb-topbar, .fb-bottom-actions, button'),
      };
    }, { passive: true });
    document.addEventListener('pointermove', (e) => {
      if (!_drag || !_inFight()) return;
      const dx = e.clientX - _drag.x, dy = e.clientY - _drag.y;
      const dist = Math.hypot(dx, dy);
      if (_lpTimer && dist > 12) { clearTimeout(_lpTimer); _lpTimer = null; } // 移动即取消长按
      if (!_drag.moved && dist > 24) _drag.moved = true;
      if (_drag.moved && _drag.onBlank && !_drag.shown) { _toggleEnemyDetail(true); _drag.shown = true; } // 拖拽展开敌方详情
    }, { passive: true });
    document.addEventListener('pointerup', () => {
      if (_lpTimer) { clearTimeout(_lpTimer); _lpTimer = null; }
      _drag = null;
    }, { passive: true });
    // 点击敌方详情（hint / 面板）关闭
    document.addEventListener('click', (e) => {
      if (!_inFight()) return;
      if (e.target.closest('[data-enemy-detail]') && e.target.closest('.fed-hint')) _toggleEnemyDetail(false);
    });

    // P0-3 退后台暂停（移动端必现）：限时窗口用绝对墙钟时间戳 deadline，退后台时浏览器节流
    // setInterval，回前台后 deadline 已过期会立即判超时，操作点/破韧窗口被瞬间作废。
    // 只把仍存活的窗口 deadline 顺延补回暂停时长，不触碰战斗结算与回放拍速。
    let _hiddenAt = 0;
    const _extendPendingTimers = () => {
      const g = NDX.game, s = g && g.state, p = s && s.pending;
      if (!g || !s || !p) return;
      const dt = Date.now() - _hiddenAt;
      if (dt < 0) { _hiddenAt = 0; return; }
      if (p.opInfo && p.opInfo.deadline) p.opInfo.deadline += dt;
      if (p.stageBreakInfo && p.stageBreakInfo.deadline) p.stageBreakInfo.deadline += dt;
      _hiddenAt = 0;
    };
    const _onHide = () => { _hiddenAt = _hiddenAt || Date.now(); };
    document.addEventListener('visibilitychange', () => { if (document.hidden) _onHide(); else _extendPendingTimers(); });
    window.addEventListener('blur', _onHide);
    window.addEventListener('focus', () => { if (!document.hidden) _extendPendingTimers(); });

    doRender();
  } catch (err) {
    const d = document.createElement('pre');
    d.id = 'fatal-error';
    d.style.cssText = 'position:fixed;left:0;top:0;right:0;z-index:99999;background:#3a0d0d;color:#ffd2d2;padding:12px;white-space:pre-wrap;font-size:13px;max-height:50vh;overflow:auto;border-bottom:2px solid #b00;';
    d.textContent = '[初始化失败] ' + (err && err.stack ? err.stack : err);
    (document.body || document.documentElement).appendChild(d);
    console.error(err);
  }
}

// 统一渲染入口：渲染后将当前节点（#map-cur）滚动到地图中央，路线只进不退
function doRender() {
  NDX.ui.render();
  NDX.ui.centerCurrent();
}

function onAppClick(e) {
  // 弹窗内部阻止背景关闭（点击弹窗内容不关闭，仅点击遮罩/关闭按钮关闭）
  const stop = e.target.closest('[data-stop]');
  const el = e.target.closest('[data-action]');

  // 关闭弹窗：点击遮罩背景或关闭按钮
  if ((el && el.getAttribute('data-action') === 'close-modal') || (!stop && !el && (NDX.ui.showHeroDetail || NDX.ui.showBagDetail || NDX.ui.showLampDetail || NDX.ui.showXinmoDetail || NDX.ui.showMomentumHelp || NDX.ui.showAchBook || NDX.ui.showCollection || NDX.ui.showRubbing || NDX.ui.showChangan || NDX.ui.showSettings || NDX.ui.showMetaOverview || NDX.ui.showCompliance || NDX.ui.showDynasty || NDX.ui.showDockModal))) {
    NDX.ui.bagSlotPick = null;
    NDX.ui.showHeroDetail = false;
    NDX.ui.showBagDetail = false;
    NDX.ui.showDockModal = false;
    NDX.ui.showLampDetail = false;
    NDX.ui.showXinmoDetail = false;
    NDX.ui.showMomentumHelp = false;
    NDX.ui.showAchBook = false;
    NDX.ui.showCollection = false;
    NDX.ui.showRubbing = false;
    NDX.ui.showSettings = false;
    NDX.ui.showMetaOverview = false;
    NDX.ui.showCompliance = false;
    NDX.ui._resetConfirm = false;
    // 触发了关闭即一并收起所有长安设施浮层（含降妖簿/轮回殿/舍利塔/功德榜/劫灰坊），
    // 否则这些设施各自的 show* 标志未重置时，点「合上」关不掉、点遮罩空白处也不关闭。
    NDX.ui.showYezanglu = false;
    NDX.ui.showCyclePalace = false;
    NDX.ui.showMonuments = false;
    NDX.ui.showRanking = false;
    NDX.ui.showDynasty = false;
    NDX.ui.showAsh = false;
    NDX.ui.showChangan = false;
    NDX.ui.showPetAtlas = false;
    NDX.ui.showFollowerAtlas = false;
    doRender();
    return;
  }

  // 旁白 / 操作点面板：点击遮罩空白处亦可推进，避免“继续/跳过”按钮不在视野内造成卡死
  if (!el && NDX.game && NDX.game.state && NDX.game.state.pending) {
    const p = NDX.game.state.pending;
    if (p.kind === 'narrative') {
      NDX.game.state.pending = { kind: 'choices' };
      doRender();
      return;
    }
    if (p.kind === 'fight' && p.awaitOp > 0) {
      NDX.game.skipOp();
      doRender();
      driveFight();
      return;
    }
  }

  // 难簿长卷地图：点击节点展开该难详情（节点无 data-action，需单独拦截）
  const nbmNode = e.target.closest('.nbm-node');
  if (nbmNode) {
    const diff = parseInt(nbmNode.getAttribute('data-diff'), 10);
    NDX.ui.showNanbuDetail(diff);
    return;
  }

  // 点击已锁定的地图节点时给出明确反馈，避免"点了没反应=卡死"的误解
  if (!el) {
    const lockedNode = e.target.closest('.cell');
    if (lockedNode && !lockedNode.hasAttribute('data-action')) {
      if (NDX.ui && NDX.ui.toast) NDX.ui.toast('地图节点暂不可点：请先在中部完成当前面板');
    }
    return;
  }
  const g = NDX.game;
  const s = g.state;
  const action = el.getAttribute('data-action');

  // 从长安大本营点进任一设施时，先收起大本营浮层（各设施为独立场景层，避免双层叠压）
  if (NDX.ui.showChangan && action !== 'close-modal') NDX.ui.showChangan = false;

  // 阶段七·音效：可交互按钮发声（木鱼轻点），开面板类换展卷音
  try { if (NDX.sound) NDX.sound.play(action === 'close-modal' ? 'click' : (action && action.indexOf('open-') === 0 ? 'open' : 'click')); } catch (err) {}

  try {
    switch (action) {
    case 'toggle-mission':
      // V8.41 任务卡折叠：点击标题折叠/展开观音指引任务卡。
      // V8.46 默认折叠（undefined 视同折叠），切换用显式布尔对置，保证首点能展开。
      if (NDX.game && NDX.game.state) {
        NDX.game.state._missionCollapsed = NDX.game.state._missionCollapsed === false;
        doRender();
      }
      break;
    case 'open-changan':
      NDX.ui.showChangan = true;
      doRender();
      break;
    case 'open-meta-overview':
      // P0-5 局外成长统一出口：轮回总鉴（终局摘要）
      NDX.ui.showChangan = false;
      NDX.ui.showMetaOverview = true;
      doRender();
      break;
    case 'meta-guide-ok': {
      // 轴四·首访引导「知道了」：仅收起 banner（标记已在渲染时落持久化），不关总鉴
      const _b = el.closest('.mo-guide-banner');
      if (_b && _b.parentNode) _b.parentNode.removeChild(_b);
      break;
    }
    case 'open-cycle':
      // 轮回殿：先收难簿，再开紧箍具象化
      NDX.ui.showAchBook = false;
      NDX.ui.showCyclePalace = true;
      // 长期善恶倾向 → body 光影 class（依据全局存档，非单局临时善恶）
      NDX.applyTrackBodyClass && NDX.applyTrackBodyClass();
      NDX.playCycleEnter && NDX.playCycleEnter(); // 入场台词/音效
      doRender();
      break;
    case 'open-blessing':
      // 轮回殿主界面即含双线赐福面板，点击核心/入口保持停留
      NDX.ui.showCyclePalace = true;
      doRender();
      break;
    case 'open-hunyuan':
      // 空莲台形态：打开混元淬炼（与赐福同界面，滚动至淬炼区）
      NDX.ui.showCyclePalace = true;
      doRender();
      break;
    case 'bless-up': {
      const side = el.getAttribute('data-side');
      const bid = el.getAttribute('data-id');
      const r = NDX.upgradeBlessing(side, bid);
      if (!r.ok) { alert(r.msg); break; }
      NDX.playBlessSfx && NDX.playBlessSfx(side); // 秩序风铃 / 混沌撕裂
      doRender();
      break;
    }
    case 'hy-up': {
      const hid = el.getAttribute('data-id');
      const r = NDX.upgradeHunyuan(hid);
      if (!r.ok) { alert(r.msg); break; }
      doRender();
      break;
    }
    case 'intro-close':
    case 'intro-skip':
      // §16.6 · 序章演出关闭：标记已阅后重绘选卡，仅首局出现一次
      NDX.markIntroSeen && NDX.markIntroSeen();
      doRender();
      break;
    case 'pick-hero':
      NDX.pendingHero = el.getAttribute('data-id');
      doRender();
      break;
    case 'locked-hero': {
      // 锁定英雄不可选：提示需先通关取经人任意一次
      const id = el.getAttribute('data-id');
      alert(`该英雄尚未解锁：请先通关【取经人】任意一次`);
      break;
    }
    case 'start': {
      // V8.35 种子分享：读取首页种子输入框（若有），设置 pendingSeed 供 start() 使用
      const _seedEl = document.querySelector('.seed-input');
      if (_seedEl && _seedEl.value && _seedEl.value.trim()) {
        const _dec = NDX.decodeSeed(_seedEl.value);
        NDX.pendingSeed = (_dec != null) ? _dec : null;
        if (_dec == null) {
          NDX.ui.toast && NDX.ui.toast('种子码无效——仅限 4-8 位大写字母/数字（去 0O1IL）');
        }
      } else {
        NDX.pendingSeed = null; // 无输入则随机新局
      }
      g.start(NDX.pendingHero || (NDX.HERO_ORDER[0] || 'tangseng'));
      if (NDX.ui.tryShowInheritPreview) NDX.ui.tryShowInheritPreview(g); // 轴二·开局承继明细浮层
      doRender();
      break;
    }
    case 'resume-run': {
      // V8.35 离线存档：恢复断点继续西行
      if (g.restoreRun()) {
        NDX.ui.showCyclePalace = false;
        NDX.ui.showAchBook = false;
        g.pushLog('【继续西行】自上次节点接续此世。');
        NDX.ui.render();
      } else {
        g.pushLog('存档无效，无法继续西行。');
      }
      break;
    }
    case 'copy-seed': {
      // V8.35 种子分享：复制当前局种子码
      const _sc = (g && g.state && g.state.seed) || '';
      if (!_sc) break;
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(_sc).then(() => {
            NDX.ui.toast && NDX.ui.toast('种子码 ' + _sc + ' 已复制——可分享挑战同图');
          });
        } else {
          const _ta = document.createElement('textarea');
          _ta.value = _sc; document.body.appendChild(_ta); _ta.select();
          document.execCommand('copy'); document.body.removeChild(_ta);
          NDX.ui.toast && NDX.ui.toast('种子码 ' + _sc + ' 已复制——可分享挑战同图');
        }
      } catch (e) { NDX.ui.toast && NDX.ui.toast('复制失败，请手动记录 ' + _sc); }
      break;
    }
    case 'to-tianjie':
      // 登天征伐：进入天道劫（终局玩法）。需已跳出81难（通关主线）
      NDX.ui.showCyclePalace = false;
      NDX.ui.showAchBook = false;
      g.start(NDX.pendingHero || (NDX.HERO_ORDER[0] || 'tangseng'), 'tianjie');
      break;
    case 'restart':
      g.start(NDX.pendingHero || (NDX.HERO_ORDER[0] || 'tangseng'));
      break;
    case 'return-home':
      // 失败屏：返回初始界面（startScreen）
      g.state = null;
      break;
    case 'ngplus-continue':
      // 转世重修 NG+：带当前英雄（引渡匣匹配）自夏重开
      g.start((s && s.hero) || (NDX.HERO_ORDER[0] || 'tangseng'));
      if (NDX.ui.tryShowInheritPreview) NDX.ui.tryShowInheritPreview(g);
      break;
    case 'reincarnate-reset': {
      // 轮回重置·从夏朝重开（不可逆，二次确认）
      const _msg = '轮回重置 · 自夏重开？\n\n'
        + '· 当前朝代与周目归零：回到【夏朝 · 第1周目】\n'
        + '· 清除遗留：衣冠冢（承继兵甲）、舍利塔（跨周目碑塔）\n'
        + '· 保留：成就、藏品库、图鉴、轮回殿赐福、已通关英雄\n\n'
        + '确定要从夏朝重新开始吗？';
      if (typeof window.confirm === 'function' && !window.confirm(_msg)) break;
      if (NDX.reincarnateReset) NDX.reincarnateReset();
      g.state = null; // 丢弃进行中的一局，回首页
      NDX.ui.toast && NDX.ui.toast('轮回重置完成 · 已归夏朝第1周目，衣冠冢与舍利塔遗留已清除');
      NDX.ui.render();
      break;
    }
    case 'win-continue': {
      // 胜利结算大屏 → 进入后续抉择链（劫印/命痕/装备/Boss 弹窗等）
      const p = g.state.pending;
      if (p && p.then) {
        // 把本场战利品（装备/财产）带进后续抉择屏，便于劫印三选一右侧展示「获得装备/财产」
        if (p.rewards) p.then.rewards = p.rewards;
        g.state.pending = p.then;
      }
      NDX.ui.render();
      break;
    }
    case 'node': {
      const L = +el.getAttribute('data-layer');
      const c = +el.getAttribute('data-col');
      // 只允许点击"前方可达节点"（nextNodes 已按层+1 计算），禁止重入/回退
      const ok = g.choices().some((n) => n.layer === L && n.col === c);
      if (ok) g.chooseNext(L, c);
      break;
    }
    case 'map-abandon': {
      // 中途撤退保资源（《体系补全》·一阶）
      g.onAbandon();
      break;
    }
    case 'abandon-confirm': {
  // 确认撤退收手
  g.finishAbandon();
  break;
}
case 'sutra-finish': {
  // 通关态：佛经合成完毕，进入返程（V8.55 固定9岁返程）再定型终局
  g.startReturn && g.startReturn();
  break;
}
    case 'open-vault': {
      // 万世剑冢·成亡节点地块（V8.56）：点击地图地块 → 打开衣冠冢/舍利塔 二选一弹窗
      const vid = el.getAttribute('data-vault');
      if (vid && g.openVault) g.openVault(vid);
      else { doRender(); }
      break;
    }
    case 'vault-opt': {
      // 二选一：选择装备/经文/组件 里的一项（含衰减发放）
      const idx = +el.getAttribute('data-idx');
      if (g.chooseVault) g.chooseVault(idx);
      else { doRender(); }
      break;
    }
    case 'tiyuan': {
      const key = el.getAttribute('data-key');
      const opt = NDX.TIYUAN_OPTS.find((o) => o.key === key);
      if (opt) g.applyTiyuan(opt);
      break;
    }
    case 'event-opt': {
      const idx = +el.getAttribute('data-idx');
      const p = g.state.pending;
      if (p && p.opts[idx]) g.applyEventOpt(p.opts[idx]);
      break;
    }
    case 'compound-route-opt': {
      // 复合节点（多难合并）路线抉择：选「渡 / 恶 / 跳过」后决定子难节奏与 Boss 强度
      const idx = +el.getAttribute('data-idx');
      const p = g.state.pending;
      if (p && p.opts && p.opts[idx]) g.applyCompoundRoute ? g.applyCompoundRoute(p.opts[idx]) : g._compoundRoute(p.opts[idx]);
      break;
    }
    case 'roll-cast': {
      g.resolveRoll('cast');
      break;
    }
    case 'roll-fold': {
      g.resolveRoll('fold');
      break;
    }
    case 'start-opt': {
      const idx = +el.getAttribute('data-idx');
      const p = g.state.pending;
      if (p && p.opts[idx]) g.applyStartOpt(p.opts[idx]);
      break;
    }
    case 'start-teach-opt': {
      // 寿命系统教学第二页：玩家确认后正式进入地图选择
      g.state.pending = { kind: 'choices' };
      NDX.ui.render();
      break;
    }
    case 'guanyin-msg-ok': {
      // 观音偈语（机缘/寿命/刘洪战前引导）：点「继续」后按 p.then 推进
      const _p = g.state.pending;
      if (!_p) break;
      if (_p.then && _p.then.kind === 'song-gift') {
        g.enterSongGift(_p.then.grantHero);
      } else if (_p.then && _p.then.kind === 'start-fight') {
        // 刘洪（第一章关隘）战前引导结束：重入该节点正式开战（首入已设 s.layer/s.col，且尚未记入 visited，可安全重入）
        g.enterNode(_p.then.layer, _p.then.col);
      } else if (_p.then && _p.then.kind === 'enter-node') {
        // 土地庙（首入）战前引导结束：重入该节点打开土地庙面板（首入尚未记入 visited，可安全重入）
        g.enterNode(_p.then.layer, _p.then.col);
      } else {
        g.state.pending = _p.then || null;
        g.render();
      }
      break;
    }
    case 'song-event-opt': {
      // V8.31 长安送行事件选项：结算效果+赠装备
      const idx = +el.getAttribute('data-idx');
      const p = g.state.pending;
      if (p && p.opts && p.opts[idx]) g.applySongEventOpt(p.opts[idx]);
      break;
    }
    case 'song-event-next': {
      // V8.31 长安送行五步教学：推进到下一步
      // V8.32 手机适配：点「继续/明白了」先弹观音气泡盖字；点掉气泡再真正推进
      const _p = g.state && g.state.pending;
      if (_p && _p.kind === 'song-event' && _p.teachStep < 5 && !_p.songBubble) {
        _p.songBubble = true; // 弹出观音示下气泡，等待玩家点掉
        g.render();
        break;
      }
      g.nextSongEventStep();
      break;
    }
    case 'song-event-skip': {
      // V8.40 长安送行六步教学：跳过教学，直接进入最终选择
      if (g.skipSongEvent) g.skipSongEvent();
      break;
    }
    case 'song-gift-ok': {
      // 长安送行·观音赠宝单窗口：点「继续」后返回地图（赠宝已在进入时发放）
      const _sp = g.state.pending;
      g.state.pending = (_sp && _sp.then) || { kind: 'choices' };
      g.render();
      break;
    }
    // V8.5x 已移除 teach-event 逐句教学（改为战斗/六道界面内观音气泡）
    case 'scene-next': {
      // 劫/缘 弹窗翻页：推进当前叙事卷，重渲染即可
      const p = g.state.pending;
      if (p) p.page = (p.page || 0) + 1;
      break;
    }
    case 'trial-result-ok': {
      // V8.31 第一难劫印觉醒：关闭反馈卡后，属性面板闪一下高亮
      const p = g.state.pending;
      if (p && p.awakenFate) {
        document.body.classList.add('seal-awaken-flash');
        setTimeout(() => document.body.classList.remove('seal-awaken-flash'), NDX.TIMING.SEAL_AWAKEN_FLASH);
      }
      g.afterTrialResult();
      break;
    }
    case 'tutorial-fight': {
      // V8.44 接引使者教学战：第一段文字读完，点击迎战后开局（teach='tutorial' 驱动逐回合攻/经/绝引导）
      const _g = NDX.game;
      const _s = NDX.game.state;
      const _node = (_s.pending && _s.pending.node) || null;
      _g.fight(NDX.TUTORIAL_MONSTER, '接引使者', 'tutorial', null, _node, false, 'tutorial');
      break;
    }
    case 'trial-opt': {
      const idx = +el.getAttribute('data-idx');
      const p = g.state.pending;
      if (p && p.opts[idx]) g.applyTrialOpt(p.opts[idx]);
      break;
    }
    case 'sixdao-pick': {
      // V10.x 优化：点击道途后直接应用选择，不需要再点击确认按钮
      // 避免玩家以为点击后就完成了选择，导致界面卡住
      const idx = +el.getAttribute('data-idx');
      const p = g.state.pending;
      if (p && p.opts && p.opts[idx]) {
        g.applyTrialOpt(p.opts[idx]);
      }
      break;
    }
    case 'sixdao-confirm': {
      const idx = +el.getAttribute('data-idx');
      const p = g.state.pending;
      if (p && p.opts && p.opts[idx]) g.applyTrialOpt(p.opts[idx]);
      break;
    }
    case 'sixdao-repick': {
      const modal = el.closest('.sixdao-modal');
      if (!modal) break;
      modal.querySelectorAll('.sixdao-row').forEach(function(r) { r.classList.remove('selected'); });
      const confirmBar = modal.querySelector('.sixdao-confirm-bar');
      if (confirmBar) confirmBar.style.display = 'none';
      break;
    }
    case 'lundao-continue': {
      // V8.63 P1-6 二周目论道：序章→三问 / 兑现→三选 推进
      if (g.lundaoContinue) g.lundaoContinue();
      break;
    }
    case 'lundao-answer': {
      const idx = +el.getAttribute('data-idx');
      if (g.lundaoAnswer) g.lundaoAnswer(idx);
      break;
    }
    case 'lundao-choose': {
      const key = el.getAttribute('data-key');
      if (g.lundaoChoose) g.lundaoChoose(key);
      break;
    }
    case 'sub-trial-opt': {
      // 第1难二级面板：子选项即为普通 opt，复用完整结算（含 fight / 善恶分档 / 好感等）
      const idx = +el.getAttribute('data-idx');
      const p = g.state.pending;
      if (p && p.opts[idx]) g.applyTrialOpt(p.opts[idx]);
      break;
    }
    case 'sub-choices-back': {
      // V8.5x 二级面板返回上一层：恢复保存的 choices pending
      const p = g.state.pending;
      if (p && p.then) { g.state.pending = p.then; g.render(); }
      break;
    }
    case 'branch-opt': {
      const idx = +el.getAttribute('data-idx');
      const p = g.state.pending;
      if (p && p.opts[idx]) g.applyBranchOpt(p.opts[idx]);
      break;
    }
    case 'mirror-opt': {
      const idx = +el.getAttribute('data-idx');
      const p = g.state.pending;
      if (p && p.opts && p.opts[idx]) {
        // 灰影残留：被放弃的选项化作灰色虚影停留 3 秒，仿佛嘲讽玩家的抉择
        const stage = document.querySelectorAll('.mirror-opts .mirror-opt');
        stage.forEach((box, i) => {
          const btn = box.querySelector('.mirror-btn');
          if (i !== idx && btn) { btn.classList.add('mirror-ghost'); btn.setAttribute('disabled', 'true'); }
          else if (btn) { btn.setAttribute('disabled', 'true'); }
        });
        setTimeout(() => { g.applyMirrorOpt(p.opts[idx]); }, NDX.TIMING.MIRROR_SETTLE); // 让灰影先浮现，再结算（延时见 NDX.TIMING.MIRROR_SETTLE，避免与演出时长错位）
      }
      break;
    }
    case 'equip': {
      g.chooseEquip(el.getAttribute('data-id'));
      break;
    }
    case 'gift': {
      g.chooseEquip(el.getAttribute('data-id'));
      break;
    }
    case 'rest-opt': {
      const opt = el.getAttribute('data-opt');
      g.chooseRest(opt);
      break;
    }
    case 'forge': {
      g.chooseForge(el.getAttribute('data-id'));
      break;
    }
    case 'sutra-drop-pick': {
      // P2-2 释经：择一片残片放下（渡/逆），换碎金
      g.dropSutraShard(el.getAttribute('data-side'), el.getAttribute('data-fid'));
      break;
    }
    case 'seal-drop-pick': {
      // P2-2 弃印：择一枚劫印放下，换碎金
      g.dropSeal(+el.getAttribute('data-idx'));
      break;
    }
    case 'elite-equip': {
      g.chooseEliteEquip(el.getAttribute('data-id'));
      break;
    }
    case 'bossreward': {
      g.chooseBossReward(el.getAttribute('data-id'));
      break;
    }
    case 'seal-pick': {
      // 劫印系统：选择一枚劫印（加入本局构筑层），随后恢复原奖励面板
      const idx = +el.getAttribute('data-idx');
      g.chooseSeal(idx);
      break;
    }
    case 'seal-skip': {
      // 劫印系统：放弃本次劫印
      g.skipSeal();
      break;
    }
    case 'bless-seal-pick': {
      // 开局赐福：自选 1 套白劫印
      const idx = +el.getAttribute('data-idx');
      g.chooseBlessSeal(idx);
      break;
    }
    case 'bless-seal-skip': {
      // 开局赐福：跳过白劫印，仍进入法宝自选
      g.skipBlessSeal();
      break;
    }
    case 'bless-treasure-pick': {
      // 开局赐福：自选 1 件基础法宝
      const idx = +el.getAttribute('data-idx');
      g.chooseBlessTreasure(idx);
      break;
    }
    case 'bless-treasure-skip': {
      // 开局赐福：跳过法宝，直接启程
      const s = g.state;
      if (s && s.pending && s.pending.kind === 'bless-treasure') {
        s.pending = s.pending.then || { kind: 'choices' };
        NDX.ui && NDX.ui.render && NDX.ui.render();
      }
      break;
    }
    case 'rite-blood':
    case 'rite-life':
    case 'rite-xinmo':
    case 'rite-incense': {
      // 篝火献祭取舍（V9.6 接线收口）：血/寿/心魔/金 四仪典统一分发到 NDX.doRite
      g.chooseRite(action.slice(5));
      break;
    }
    case 'equipbar-open': {
      // 土地庙·装备栏（按槽位激活生效）
      g.openEquipBar({ name: '土地庙' });
      break;
    }
    case 'equip-swap': {
      g.swapEquipAction(el.getAttribute('data-id'));
      break;
    }
    case 'equip-combine-do': {
      g.doEquipCombine(el.getAttribute('data-out'));
      break;
    }
    case 'equip-combine-back': {
      g.chooseRest('reopen');
      break;
    }
    case 'sealbar-open': {
      // 土地庙·劫印栏（V3 §1.1 道途层数，全数自动生效）
      g.openSealBar({ name: '土地庙' });
      break;
    }
    case 'sealbar-back': {
      g._backToRest();
      break;
    }
    // —— 土地庙子面板：罪业贸易 + 土地神龛（V8.5C 竞品借鉴）——
    case 'rest-sin': { g.openSin(); break; }
    case 'rest-camp': { g.openCamp(); break; }
    case 'sin-buy': {
      var route = el.getAttribute('data-route');
      var tier = el.getAttribute('data-tier');
      // V8.5x 罪业兑换知情确认：有连带风险（跌破转职门槛/心魔将满）时需玩家确认
      if (el.getAttribute('data-risk') === '1') {
        var ok = confirm('此兑换将带来连带因果影响（或跌破转职门槛 / 推高心魔至镜像战）。确认以善恶念兑换？');
        if (!ok) break;
      }
      g.exchangeSin(route, tier);
      break;
    }
    case 'camp-upgrade': {
      g.campUpgrade();
      break;
    }
    case 'camp-bless': {
      g.chooseCampBless(el.getAttribute('data-bless'));
      break;
    }
    case 'camp-cancel-bless': {
      g._backToRest();
      break;
    }
    case 'camp-back': {
      g._backToRest();
      break;
    }
    case 'shop-buy': {
      g.buyShop(el.getAttribute('data-id'));
      break;
    }
    case 'shop-leave': {
      g.leaveShop();
      break;
    }
    case 'shop-reroll': {
      g.shopReroll();
      break;
    }
    case 'craft': {
      g.chooseCraft(el.getAttribute('data-id'));
      break;
    }
    case 'sutra': {
      g.chooseSutra(el.getAttribute('data-id'));
      break;
    }
    case 'sutra-leave': {
      g.state.pending = { kind: 'choices' };
      break;
    }
    case 'sutra-finish': {
      // 通关态：佛经合成完毕，进入返程（V8.55 固定9岁返程）再定型终局
      g.startReturn && g.startReturn();
      break;
    }
    case 'use-item': {
      g.useItem(el.getAttribute('data-id'));
      break;
    }
    case 'prefight-toggle': {
      g.togglePreFightTreasure && g.togglePreFightTreasure(el.getAttribute('data-id'));
      break;
    }
    case 'prefight-start': {
      g.startPreFight && g.startPreFight();
      break;
    }
    case 'show-hero-detail':
      NDX.ui.showHeroDetail = true;
      break;
    case 'open-hero':
      NDX.ui.showHeroDetail = true;
      doRender();
      break;
    case 'open-bag':
      NDX.ui.bagSlotPick = null;
      NDX.ui.showBagDetail = true;
      doRender();
      break;
    // —— 行装快捷栏（地图底部 dock）：装备栏 / 法宝栏 / 宠物栏 / 劫印栏 ——
    case 'dock-open':
      NDX.ui.showDockModal = true;
      NDX.ui.dockTab = el.getAttribute('data-tab') || 'equip';
      doRender();
      break;
    case 'dock-tab':
      NDX.ui.dockTab = el.getAttribute('data-tab') || 'equip';
      doRender();
      break;
    case 'open-lamp':
      NDX.ui.showLampDetail = true;
      doRender();
      break;
    // P0-④ 气势 / 识破 说明：战斗内「?」入口（手机无 hover，原 title 提示失效）
    case 'momentum-help':
      NDX.ui.showMomentumHelp = true;
      doRender();
      break;
    case 'open-xinmo':
      NDX.ui.showXinmoDetail = true;
      doRender();
      break;
    // #63 右上「已历 X/Y 难」芯片点击：提示 Boss 门禁（历经足够劫难）进度
    case 'open-trials': {
      const gg = NDX.fateGateCheck(s);
      const parts = (NDX.MISSION_KINDS || ['trials', 'battle', 'events'])
        .map((k) => `${NDX.MISSION_KIND_LABEL[k] || k} ${gg.progress[k] || 0}/${gg.gate[k] || 0}`)
        .join(' · ');
      g.toast(gg.met
        ? `📿 已历劫难达标（${parts}）——关隘之主已现，可叩关。`
        : `📿 已历劫难进度（${parts}）——尚须历尽劫难，关隘之主方现。`);
      break;
    }
    // #64 刘洪后土地庙三选一：套装自动组合 / 打坐回寿，选完即退出当前节点
    // V3 §1.1：原「劫印合成」选项随铸印司下线移除，仅余两选
    case 'tudi-choice': {
      const opt = el.getAttribute('data-opt');
      const p = s.pending || {};
      const _layer = p.layer, _col = p.col;
      if (opt === 'combine') {
        g.autoCombineShrine(s);
        g.toast('⚒ 套装已自动组合');
        g.pushLog('【土地庙·指引】择「套装自动组合」');
      } else if (opt === 'meditate') {
        const _g = (NDX.LIFE && NDX.LIFE.MEDITATE_REGAIN) || 0;
        s.life = Math.min(s.lifeMax, (s.life || 0) + _g);
        g.pushLog(`【土地庙·指引】择「打坐回寿」——寿元 +${_g}（现 ${Math.round(s.life)}）`);
        g.toast(`🧘 打坐回寿 +${_g}`);
      }
      // 选完即退出当前节点：标记已用并回退地图
      if (_layer != null && _col != null) s.visited.push({ layer: _layer, col: _col });
      s.pending = { kind: 'choices' };
      g.render();
      break;
    }
    // V8.35 设置菜单
    case 'open-settings':
      NDX.ui.showSettings = true;
      doRender();
      break;
    // V8.5x 合规入口：隐私政策 / 用户协议 / 版号备案 / 客服反馈
    case 'open-privacy':
    case 'open-terms':
    case 'open-icp':
    case 'open-feedback': {
      const k = { 'open-privacy': 'privacy', 'open-terms': 'terms', 'open-icp': 'icp', 'open-feedback': 'feedback' }[action];
      NDX.ui.showSettings = false;
      NDX.ui.complianceKind = k;
      NDX.ui.showCompliance = true;
      doRender();
      break;
    }
    case 'toggle-sound-setting': {
      const st = NDX.settings;
      st.soundOn = !st.soundOn;
      NDX.saveSettings(st);
      if (NDX.sound && NDX.sound.toggle) NDX.sound.toggle();
      doRender();
      break;
    }

    case 'set-volume': {
      const v = parseInt(el.value || '50', 10) / 100;
      NDX.settings.soundVol = v;
      NDX.saveSettings(NDX.settings);
      if (NDX.sound && typeof NDX.sound.setVolume === 'function') NDX.sound.setVolume(v);
      break;
    }
    case 'set-speed': {
      const v = parseInt(el.getAttribute('data-val') || '1', 10);
      const applied = applyBattleSpeed(v);          // 章节门禁 / Boss锁速统一收敛
      NDX.settings.fightSpeed = applied;
      NDX.saveSettings(NDX.settings);
      doRender();
      break;
    }
    // V8.40 战斗界面快捷速度切换：与set-speed相同，但不保存设置（临时切换）
    case 'set-fight-speed': {
      const v = parseInt(el.getAttribute('data-val') || '1', 10);
      if (NDX.ui && NDX.ui.fightSpeedLocked) break; // Boss战锁定1倍速
      NDX.settings.fightSpeed = applyBattleSpeed(v);
      NDX.saveSettings(NDX.settings);
      if (NDX.ui) NDX.ui.fightSpeed = NDX.settings.fightSpeed;
      doRender();
      break;
    }
    // V8.40 难度选择：设置下一局游戏的难度
    case 'set-difficulty': {
      const v = el.getAttribute('data-val') || 'normal';
      NDX.settings.nextDifficulty = v;
      NDX.saveSettings(NDX.settings);
      const d = NDX.DIFFICULTY[v];
      if (d) NDX.ui.toast(`下局难度：${d.icon} ${d.name} —— ${d.desc}`);
      doRender();
      break;
    }
    case 'toggle-tutorial': {
      NDX.settings.showTutorial = !NDX.settings.showTutorial;
      NDX.saveSettings(NDX.settings);
      doRender();
      break;
    }
    // V8.38 速战模式：跳过入场动画 + 强制2x速度
    case 'toggle-fast-mode': {
      NDX.settings.fastMode = !NDX.settings.fastMode;
      NDX.saveSettings(NDX.settings);
      if (NDX.ui) NDX.ui.fightSpeed = applyBattleSpeed(NDX.settings.fastMode ? 2 : (NDX.settings.fightSpeed || 1));
      if (NDX.applyAccessibility) NDX.applyAccessibility();
      doRender();
      break;
    }
    // V8.37 无障碍设置
    case 'set-font-scale': {
      const v = parseFloat(el.getAttribute('data-val') || '1');
      NDX.settings.fontScale = v;
      NDX.saveSettings(NDX.settings);
      if (NDX.applyAccessibility) NDX.applyAccessibility();
      doRender();
      break;
    }
    case 'toggle-high-contrast': {
      NDX.settings.highContrast = !NDX.settings.highContrast;
      NDX.saveSettings(NDX.settings);
      if (NDX.applyAccessibility) NDX.applyAccessibility();
      doRender();
      break;
    }
    case 'set-colorblind': {
      const v = el.getAttribute('data-val') || 'none';
      NDX.settings.colorBlindMode = v;
      NDX.saveSettings(NDX.settings);
      if (NDX.applyAccessibility) NDX.applyAccessibility();
      doRender();
      break;
    }
    case 'reset-save': {
      // 危险操作：二次确认后清除全部存档
      if (!NDX.ui._resetConfirm) {
        NDX.ui._resetConfirm = true;
        NDX.ui.toast && NDX.ui.toast('再次点击「重置全部存档」确认执行（不可恢复）');
        doRender();
        break;
      }
      NDX.ui._resetConfirm = false;
      try {
        if (NDX.storage && NDX.storage.clearAll) NDX.storage.clearAll();
      } catch (e) {}
      NDX.settings = NDX.loadSettings();
      if (NDX.game) { NDX.game.state = null; }
      NDX.ui.toast && NDX.ui.toast('全部存档已重置，即将返回首页');
      setTimeout(() => { NDX.ui.showSettings = false; NDX.ui.render(); }, NDX.TIMING.RESET_PANEL_CLOSE);
      break;
    }
    case 'huiying': {
      // §5.4 影遁三转【回影入世】：主动重介入当前节点
      if (g.reengage) { g.reengage(); doRender(); }
      break;
    }
    case 'show-bag-detail':
      NDX.ui.bagSlotPick = null;
      NDX.ui.showBagDetail = true;
      break;
    case 'bag-slot-pick':
      // 点击身体装备槽格（兵/甲/冠/靴）→ 弹出该槽可装备项并按评分排序
      NDX.ui.showBagDetail = true;
      NDX.ui.bagSlotPick = el.getAttribute('data-slot');
      break;
    case 'bag-pick-close':
      // 换装弹窗 → 返回完整包裹
      NDX.ui.bagSlotPick = null;
      break;
    case 'open-pet-atlas':
      // 灵兽图鉴（V8.22）：打开则收起包裹弹层，只留图鉴
      if (NDX.ui.showPetAtlas) { NDX.ui.showPetAtlas = false; NDX.ui.showBagDetail = true; }
      else { NDX.ui.showPetAtlas = true; NDX.ui.showBagDetail = false; }
      break;
    case 'open-follower-atlas':
      // V8.6x 模块九·随从名册：打开则收起包裹弹层，只留名册（与灵兽图鉴同款互斥）
      if (NDX.ui.showFollowerAtlas) { NDX.ui.showFollowerAtlas = false; NDX.ui.showBagDetail = true; }
      else { NDX.ui.showFollowerAtlas = true; NDX.ui.showBagDetail = false; }
      break;
    case 'bag-equip-toggle':
      // 背包·装备栏切换（保留背包弹层）
      g.bagEquipToggle(el.getAttribute('data-id'));
      break;
    case 'bag-seal-toggle':
      // 兼容历史数据残留入口：劫印已全数自动生效，无生效格切换
      break;
    case 'open-ach':
      NDX.ui.showAchBook = true;
      break;
    case 'open-codex':
      if (NDX.UICodex) NDX.UICodex.open();
      break;
    case 'open-cultivation':
      if (NDX.UICultivation) NDX.UICultivation.open();
      break;
    case 'open-daily':
      if (NDX.UIDaily) NDX.UIDaily.open();
      break;
    case 'open-dynasty':
      NDX.ui.showDynasty = true;
      break;
    case 'life-mode': {
      // V8.61 难度阶梯显性化：开局自选限期档（宽松/标准/严苛），跨周目记忆
      const mode = el.dataset.mode;
      if (mode && NDX.setLifeMode) { NDX.setLifeMode(mode); doRender(); }
      break;
    }
    case 'open-collection':
      NDX.ui.showCollection = true;
      break;
    case 'open-rubbing':
      NDX.ui.showRubbing = true;
      break;
    case 'open-yezanglu':
      NDX.ui.showYezanglu = true;
      break;
    case 'open-monuments':
      NDX.ui.showMonuments = true;
      break;
    case 'open-ash':
      g.toggleAsh(true);
      break;
    case 'ash-buy': {
      const aid = el.dataset.id;
      if (aid && g.buyAshUp) g.buyAshUp(aid);
      break;
    }
    case 'open-ranking':
      NDX.ui.showRanking = true;
      break;
    case 'rank-tab': {
      const r = el.dataset.r;
      if (r && NDX.ui.switchRankTab) NDX.ui.switchRankTab(r);
      break;
    }
    case 'toggle-sound':
      if (NDX.sound) { NDX.sound.toggle(); NDX.ui.toast(NDX.sound.isOn() ? '音效已开启（余韵袅袅）' : '音效已关闭（万籁俱寂）'); }
      break;
    case 'claim-coll': {
      const gid = el.dataset.group, mode = el.dataset.mode, idx = parseInt(el.dataset.idx, 10) || 0;
      const r = NDX.claimCollectionReward(gid, mode, idx);
      NDX.ui.toast(r.msg || (r.ok ? '领取成功' : '无法领取'));
      NDX.ui.showYezanglu = true; // 刷新面板（进度/按钮状态更新）
      doRender();
      break;
    }
    case 'yz-detail': {
      const gid = el.dataset.group, eid = el.dataset.id;
      const m = document.createElement('div');
      m.id = 'yezanglu-entry-modal';
      m.innerHTML = NDX.ui.yezangluEntryHtml(gid, eid);
      document.getElementById('app').appendChild(m);
      break;
    }
    case 'craft-leave': {
      // 暂不炼化：保持原节点行为（篝火直接结束/坊市进商店）
      const s = g.state;
      const node = NDX.LAYERS[s.layer][s.col];
      if (node && node.type === 'shop') {
        const price = NDX.shopPrice(node.priceTier);
        const si = NDX.rollEquips(3, s);
        s.pending = si.length
          ? { kind: 'shop', tier: node.priceTier, items: si.map((e) => ({ ...e, price })) }
          : { kind: 'choices' };
      } else {
        s.pending = { kind: 'choices' };
      }
      break;
    }
    case 'fight-skip': {
      // 跳过战斗演出需第8地区解锁；未解锁忽略并提示（见 data.js FIGHT_GATE）
      const _su = NDX.fightUnlock ? NDX.fightUnlock((s && s.act) || 1).skip : false;
      if (!_su) {
        if (NDX.ui && NDX.ui.toast) NDX.ui.toast('跳过战斗需推进至第 ' + NDX.FIGHT_GATE.skip + ' 地区解锁');
        break;
      }
      if (s && s.pending && s.pending.kind === 'fight') g.finishFight();
      break;
    }
    case 'fight-speed': {
      // 切换战斗演出倍速（1x / 2x / 3x）。精英 / Boss 锁速时仅 1x 生效。
      const sp = parseInt(el.getAttribute('data-speed'), 10);
      setFightSpeed(sp);
      doRender();
      break;
    }
    case 'fight-toggle-pause': {
      // 顶部信息栏 ⏸ 按钮：暂停 / 继续战斗演出
      NDX.ui.fightPaused = !NDX.ui.fightPaused;
      doRender();
      if (!NDX.ui.fightPaused) driveFight(); // 继续：从暂停处续演
      break;
    }
    case 'fight-auto-toggle': {
      // 回合制自动/手动切换。前3地区强制手动；第4地区起开放自动；切自动时强制1x（取消多倍速）
      var _p = g.state && g.state.pending;
      if (_p && _p.kind === 'fight') {
        var _lock = NDX.fightUnlock ? !NDX.fightUnlock((g.state && g.state.act) || 1).auto : true;
        if (_lock && !_p.autoFight) {
          if (NDX.ui && NDX.ui.toast) NDX.ui.toast('第 ' + NDX.FIGHT_GATE.auto + ' 地区起解锁自动战斗（当前强制手动）');
          break; // 前3地区强制手动，禁止切换到自动
        }
        // V8.45 BOSS 战禁用自动战斗：仅非 Boss 允许开启自动
        const _isBossNow = !!(_p.res && _p.res.monsterTags && _p.res.monsterTags.includes('boss'));
        if (!_p.autoFight && _isBossNow) {
          if (NDX.ui && NDX.ui.toast) NDX.ui.toast('BOSS 战禁用自动战斗，请手动操作');
          break;
        }
        _p.autoFight = !_p.autoFight;
        if (_p.autoFight) applyBattleSpeed(1);      // 自动战斗强制1x，移除多倍速
        doRender();
        // 切到自动时立即推进当前回合
        if (_p.autoFight && _p.phase === PHASE_WAIT) driveFight();
      }
      break;
    }
    case 'op-treasure': {
      // 主动操作点：玩家择机祭出某法宝（dataset.tid 为法宝 id）
      const tid = el && el.dataset ? el.dataset.tid : null;
      if (tid && g.resolveOpTreasure) g.resolveOpTreasure(tid);
      break;
    }
    case 'op-manual': {
      // 战斗中随时点法宝栏：手动打断 AI 普攻，优先释放法宝（dataset.tid 为法宝 id）
      // 单指点击即放：0.8s 轻量释放动画与回放并行，不拖沓、不阻塞挂机续演。
      const tid = el && el.dataset ? el.dataset.tid : null;
      if (window.__treLongPressed) { window.__treLongPressed = false; break; } // 长按弹窗后的误触 click：不释放
      if (tid && g.resolveManualTreasure) {
        const fired = g.resolveManualTreasure(tid);
        if (fired) {
          if (NDX.ui && NDX.ui.playTreasureCast) NDX.ui.playTreasureCast(tid); // 轻量释放特效（异步、不阻塞）
          doRender(); driveFight(); // 立即打断当前拍并重排，AI 随后恢复自动循环
        }
      }
      break;
    }
    case 'op-skip': {
      // 主动操作点：玩家选择不祭宝，继续回放
      if (g.skipOp) g.skipOp();
      break;
    }
    case 'op-burst': {
      // 独立【爆发·舍弃】主按钮：复用气势爆发结算（同 __BURST__ 法宝）
      if (g.resolveOpTreasure) g.resolveOpTreasure('__BURST__');
      break;
    }
    case 'op-burst-hud': {
      // 战斗主界面常驻「爆发」钮：手动回合或自动模式下均可手动倾泻气势（resolveHudBurst，结算走 applyMomentumBurst）
      const _p = g.state && g.state.pending;
      if (_p && _p.kind === 'fight' && (_p.phase === PHASE_WAIT || (_p.autoFight && _p.phase === PHASE_PLAY))) {
        const _fired = g.resolveHudBurst ? g.resolveHudBurst() : false;
        if (_fired) { _p.phase = PHASE_PLAY; doRender(); driveFight(); }
      }
      break;
    }
    case 'active-skill': {
      // V8.29 回合制：三键技能仅在 PHASE_WAIT 阶段可用，释放后进入演出阶段
      const kind = el && el.dataset ? el.dataset.kind : null;
      if (kind && g.resolveManualActive) {
        const p = g.state && g.state.pending;
        // V8.46：自动模式下绝招 / 手动风格攻击可覆盖自动（玩家手动触发），基础 atk/chant 仍由 AI 代点
        if (p && p.kind === 'fight' && p.phase && p.phase !== PHASE_WAIT && !(p.autoFight && (kind === 'ult' || (kind === 'atk' && el && el.dataset && el.dataset.atkStyle)))) break;
        const style = (el && el.dataset) ? el.dataset.atkStyle : null; // V8.45 手动指定 atk 风格（连招）
        const fired = g.resolveManualActive(kind, style);
        if (fired && p) {
          p.phase = PHASE_PLAY;
          // V8.53 预输入缓冲（万世剑冢式连点节奏）：手动点击若在演出间隙（上一拍的 driveFight 定时器仍悬空），
          // 取消该悬空定时器，使本次点击精确接续一个玩家选定的回合，杜绝「旧定时器 + 新点击」双重推进 / 回合跳拍。
          if (p._driveTimer) { clearTimeout(p._driveTimer); p._driveTimer = null; p._animating = false; }
          // V8.40 技能专属演出动作：给玩家立绘添加对应技能类，触发CSS动画
          const side = document.querySelector('.fb-side.you');
          if (side) {
            side.classList.remove('skill-atk', 'skill-chant', 'skill-ult');
            void side.offsetWidth; // 强制重绘，重置动画
            side.classList.add('skill-' + kind);
            setTimeout(() => side.classList.remove('skill-atk', 'skill-chant', 'skill-ult'), 800);
          }
          // 万世剑冢招牌：金色技能名 callout（与暴击红字、刀光粒子共构强可读性反馈）
          if (NDX.ui && NDX.ui.emit && el) {
            const _nm = (el.querySelector && el.querySelector('span')) ? el.querySelector('span').textContent : (kind === 'ult' ? '绝招' : kind === 'chant' ? '诵经' : '攻击');
            try { NDX.ui.emit('battle-fx', { type: 'skill-name', side: 'you', name: _nm, kind: kind }); } catch (e) {}
          }
        }
        // doRender + driveFight 由 onAppClick 末尾统一调度，避免双重调度
      }
      break;
    }
    case 'use-treasure': {
      // V8.40 法宝主动技能化：点击法宝按钮祭出法宝；V8.46 自动模式下仍允许手动祭宝（覆盖自动）
      const treasureId = el && el.dataset ? el.dataset.treasureId : null;
      if (treasureId && g.resolveUseTreasure) {
        const p = g.state && g.state.pending;
        if (p && p.kind === 'fight' && p.phase && p.phase !== PHASE_WAIT && !p.autoFight) break;
        const fired = g.resolveUseTreasure(treasureId);
        // 法宝使用不消耗回合，不进入演出阶段
      }
      break;
    }
    case 'open-sutra-box': {
      if (NDX.ui && NDX.ui.openSutraBox) NDX.ui.openSutraBox();
      break;
    }
    case 'sutra-box-close': {
      const ov = document.querySelector('.sutra-overlay');
      if (ov && ov.parentNode) ov.parentNode.removeChild(ov);
      break;
    }
    case 'sx-tab': {
      const tab = el && el.dataset ? el.dataset.sxTab : null;
      const ov = document.querySelector('.sutra-overlay');
      if (!ov || !tab) break;
      ov.querySelectorAll('.sx-tab').forEach((t) => t.classList.toggle('on', t.dataset.sxTab === tab));
      ov.querySelectorAll('.sx-pane').forEach((pn) => { pn.hidden = pn.dataset.sxPane !== tab; });
      break;
    }
    case 'set-chant-sutra': {
      // 方案X1·持诵位：设为持诵（已合成全本校验在 game.setChantSutra 内）
      const id = el && el.dataset ? el.dataset.id : null;
      if (g && g.setChantSutra) g.setChantSutra(id);
      // 重开经匣刷新持诵位/按钮状态
      const ov = document.querySelector('.sutra-overlay');
      if (ov && ov.parentNode) ov.parentNode.removeChild(ov);
      if (NDX.ui && NDX.ui.openSutraBox) NDX.ui.openSutraBox();
      break;
    }
    case 'clear-chant-sutra': {
      if (g && g.clearChantSutra) g.clearChantSutra();
      const ov = document.querySelector('.sutra-overlay');
      if (ov && ov.parentNode) ov.parentNode.removeChild(ov);
      if (NDX.ui && NDX.ui.openSutraBox) NDX.ui.openSutraBox();
      break;
    }
    case 'stagebreak-manual': {
      // 两相劫·破韧窗口：玩家手动临阵祭宝破韧 → 领阶段厚赏（区分挂机兜底收益）
      if (g.resolveStageBreakManual) g.resolveStageBreakManual();
      break;
    }
    case 'stagebreak-skip': {
      // 两相劫·破韧窗口：玩家主动跳过（或超时未破韧）→ 仅得挂机兜底
      if (g.resolveStageBreakIdle) g.resolveStageBreakIdle();
      break;
    }
    case 'narrative-next':
      // 地区之门·土地庙：面板带 gate 标记时，「继续西行」= 玩家确认推进地区，
      // 而非普通叙事返回节点选择（过界从此由玩家按下按钮完成）
      if (s && s.pending && s.pending.kind === 'narrative' && s.pending.gate) {
        if (g.doAdvanceRegion) g.doAdvanceRegion(); else s.pending = { kind: 'choices' };
        break;
      }
      // 悟空小说段落播放完毕 → 返回地图节点选择
      if (s && s.pending && s.pending.kind === 'narrative') s.pending = { kind: 'choices' };
      break;
    case 'gate-meditate':
      // 地区之门·土地庙：打坐回寿（每道关隘一炷香）
      if (g.gateMeditate) g.gateMeditate();
      break;
    case 'region-gate':
      // 地区之门：关隘之主败后，点门内土地庙进入歇脚整备
      if (g.enterRegionGate) g.enterRegionGate();
      break;
    case 'quota-dao-opt': {
      // V8.34 地区配额制·主攻道选择：选定当前地区主攻道，进入地区叙事
      const idx = +el.getAttribute('data-idx');
      const p = g.state.pending;
      if (p && p.opts && p.opts[idx]) g.chooseMainDao(p.opts[idx].dao);
      break;
    }
    case 'open-dao-retune': {
      // 方案X2·自愿改道：土地庙/长安入口弹出六道改道面板
      if (g.openDaoRetune) g.openDaoRetune();
      break;
    }
    case 'dao-retune-opt': {
      // 方案X2·六道改道：选定新主道（装备/攻式/钩子实时跟随）
      const idx = +el.getAttribute('data-idx');
      const p = g.state.pending;
      if (p && p.opts && p.opts[idx]) g.chooseMainDao(p.opts[idx].dao);
      break;
    }
    case 'dao-retune-close': {
      // 方案X2·改道面板退出：恢复进入前的面板（土地庙歇脚/长安）
      const p = g.state.pending;
      if (p && p.retuneBack) g.state.pending = p.retuneBack;
      else if (s && s.pending && s.pending.kind === 'dao-retune') s.pending = { kind: 'choices' };
      break;
    }
    case 'dao-overview-next': {
      // 方案X2·难1六道总览看完：返回地图选路
      if (s && s.pending && s.pending.kind === 'dao-overview') s.pending = { kind: 'choices' };
      break;
    }
    case 'curse-toggle': {
      // P0-3 西行劫难词条·点选/取消（最多 3 条）
      const idx = +el.getAttribute('data-idx');
      const p = g.state.pending;
      if (p && p.kind === 'curse-pick') {
        const id = NDX.CURSE_ORDER && NDX.CURSE_ORDER[idx];
        const list = p.sel || [];
        const i = list.indexOf(id);
        if (i >= 0) list.splice(i, 1);
        else if (list.length < 3 && id) list.push(id);
        NDX.ui.render();
      }
      break;
    }
    case 'curse-pick-opt': {
      // P0-3 西行劫难词条·确认启程（按已选 1~3 条）
      const p = g.state.pending;
      if (p && p.kind === 'curse-pick' && g.setCurses) g.setCurses(p.sel || []);
      break;
    }
    case 'curse-pick-skip': {
      // P0-3 西行劫难词条·正途西行（0 条，跳过）
      const p = g.state.pending;
      if (p && p.kind === 'curse-pick' && g.setCurses) g.setCurses([]);
      break;
    }
    case 'negotiate-opt': {
      // 逆道谈判 · 以经为质（《竞品借鉴》§3）：谈判面板选项（谈判 / 开战）
      const idx = +el.getAttribute('data-idx');
      const p = g.state.pending;
      if (p && p.opts && p.opts[idx]) g.negotiate(p.opts[idx]);
      break;
    }
    case 'follower-replace-opt': {
      // V8.6x 模块九·随从满钦点替换：玩家钦点旧随从让位（idx≥0）或拱手辞谢（idx=-1）
      const idx = +el.getAttribute('data-idx');
      g.replaceFollower(idx);
      break;
    }
    case 'first-evil-close':
      // 关闭「首次违背佛祖规则」警示浮层
      if (s && s.pending) s.pending.firstEvilToast = false;
      break;
    case 'promote-confirm':
      // 关闭「六道专职·转职达成」浮层
      if (s && s.pending) s.pending.promote = false;
      break;
    default:
      return;
    }
  } catch (err) {
    console.error('[onAppClick] 处理动作异常，已尝试恢复渲染：', err);
  }
  doRender();
  driveFight();
  // 进入「悟空小说段落」叙事面板时启动打字机
  if (s && s.pending && s.pending.kind === 'narrative') startNovelTypewriter();
}

// 战斗逐回合演出：每拍 FIGHT_TICK 播放一阶段（INTRO 对峙 → 逐回合交锋 → 收尾胜负 → 结算）
// 状态机拍序：roundIdx = -1(对峙) → 0..total-1(回合) → total(收尾点评) → 结算
const FIGHT_TICK = (NDX.TIMING && NDX.TIMING.FIGHT_TICK) || 2000; // ms 每回合基础动画间隔（真值见 NDX.TIMING.FIGHT_TICK，@1x 由倍速 NDX.ui.fightSpeed 同比压缩）
const STRIKE_GAP_MS = (NDX.TIMING && NDX.TIMING.STRIKE_GAP_MS) || 1000; // ms 后手方冲撞起点（真值见 NDX.TIMING.STRIKE_GAP_MS，main.js / ui_misc_3.js 同读此单一真源）

// V8.29 回合制状态机：每回合等待玩家输入（三键选择），替代旧自动回放
const PHASE_INTRO  = 'intro';    // 入场对峙（roundIdx = -1）
const PHASE_WAIT   = 'wait';     // 等待玩家选择技能（三键）
const PHASE_PLAY   = 'play';     // 播放当前回合演出
const PHASE_BREAK  = 'break';    // 阶段破韧窗口
const PHASE_FINISH = 'finish';   // 战斗结算

// —— 血条平滑过渡追踪（因 render() 用 innerHTML 重建 DOM，CSS transition 无法自动生效；
//    需在 render 后手动把血条从旧值动画到新值）——
var _lastRenderedMHp = null;
var _lastRenderedPHp = null;
var _fightHpDirty = false;
// V8.40 性能优化：缓存血条DOM元素引用，避免每次动画都执行querySelectorAll
var _cachedFoeBars = null;
var _cachedYouBars = null;
var _cachedFightKey = null;

// 战斗演出血条平滑过渡：render() 重建 DOM 后，把血条宽度从上一帧值动画到当前值
function _animateFightHpBars() {
  if (!_fightHpDirty) return;
  _fightHpDirty = false;
  var g = NDX.game; if (!g || !g.state) return;
  var p = g.state.pending; if (!p || p.kind !== 'fight') return;
  var mMax = (p.monster && p.monster.hp) || 1;
  var pMax = p.maxHp || 1;
  var newMHp = Math.max(0, p.mHp || 0);
  var newPHp = Math.max(0, p.pHp || 0);
  // 首次渲染：无历史值，直接记录不动画（避免从 0 滑到满血的反直觉效果）
  if (_lastRenderedMHp === null) {
    _lastRenderedMHp = newMHp; _lastRenderedPHp = newPHp; return;
  }
  var oldMHp = _lastRenderedMHp, oldPHp = _lastRenderedPHp;
  _lastRenderedMHp = newMHp; _lastRenderedPHp = newPHp;
  // 值未变 → 跳过
  if (Math.abs(oldMHp - newMHp) < 0.5 && Math.abs(oldPHp - newPHp) < 0.5) return;
  var oldMPct = Math.max(0, Math.min(100, Math.round((oldMHp / mMax) * 100)));
  var newMPct = Math.max(0, Math.min(100, Math.round((newMHp / mMax) * 100)));
  var oldPPct = Math.max(0, Math.min(100, Math.round((oldPHp / pMax) * 100)));
  var newPPct = Math.max(0, Math.min(100, Math.round((newPHp / pMax) * 100)));
  // V8.40 性能优化：使用缓存的DOM元素引用，避免每次动画都执行querySelectorAll
  // 缓存key基于战斗唯一标识（怪物名+最大血量），战斗变化时自动失效
  var fightKey = (p.monster && p.monster.name || '') + '_' + mMax + '_' + (p.enemyCount || 1);
  if (_cachedFightKey !== fightKey || !_cachedFoeBars || !_cachedFoeBars.length) {
    _cachedFoeBars = document.querySelectorAll('.fb-side.foe .hpfill.foe');
    _cachedYouBars = document.querySelectorAll('.fb-side.you .hpfill.you');
    _cachedFightKey = fightKey;
  }
  var foeBars = _cachedFoeBars;
  var youBars = _cachedYouBars;
  // V8.49 真·回合制：HP 条不在 charge 中途开始掉，而是等该方冲撞走完才掉——
  // 和「打过去→才掉血」的回合制一致。CHARGE_DUR 与 ui.js 同步（500ms@1x），
  // SECOND_START（=STRIKE_GAP_MS）是后手方冲撞起点（先手为 0）。下方算出每条血条的 transitionDelay。
  var rd = (p.res && p.res.roundsDetail) ? p.res.roundsDetail[p.roundIdx] : null;
  var firstIsEnemy = !!(rd && rd.first === 'enemy');
  var sp = Math.max(1, (NDX.ui && NDX.ui.fightSpeed) || 1);
  var CHARGE_DUR = Math.round((NDX.TIMING && NDX.TIMING.CHARGE_DUR || 500) / sp); // 出手方冲撞时长（单一真源 NDX.TIMING.CHARGE_DUR）
  var SECOND_START = Math.round(STRIKE_GAP_MS / sp);                      // 后手方冲撞起点（先手为 0；与 _emitBattleFx 的 strike delay 同步）
  var playerStart = firstIsEnemy ? SECOND_START : 0;
  var monsterStart = firstIsEnemy ? 0 : SECOND_START;
  var foeDelay = playerStart + CHARGE_DUR;       // 怪物血条 → 玩家冲撞结束时才掉
  var youDelay = monsterStart + CHARGE_DUR;      // 我方血条 → 怪物冲撞结束时才掉
  // 第一步：关闭 transition，设回旧值（瞬时跳回，无动画）
  foeBars.forEach(function(b) { b.style.transition = 'none'; b.style.width = oldMPct + '%'; });
  youBars.forEach(function(b) { b.style.transition = 'none'; b.style.width = oldPPct + '%'; });
  // 第二步：强制重绘，确保浏览器记录旧值
  void document.body.offsetWidth;
  // 第三步：恢复 CSS transition，设目标值 → 触发平滑过渡（后手方带延迟）
  requestAnimationFrame(function() {
    foeBars.forEach(function(b) {
      b.style.transition = ''; b.style.transitionDelay = foeDelay + 'ms';
      b.style.width = newMPct + '%';
    });
    youBars.forEach(function(b) {
      b.style.transition = ''; b.style.transitionDelay = youDelay + 'ms';
      b.style.width = newPPct + '%';
    });
  });
}

// 战斗演出倍速：1x / 2x / 3x，统一存于 NDX.ui.fightSpeed。精英 / 多阶段 Boss 战斗由 game.js
// 自动锁定为 1x（见 NDX.ui.fightSpeedLocked），以便玩家看清韧性条、在「临阵祭宝」操作点手动放大招爆发。
// —— 战斗倍速门禁（17地区制 s.act）：Boss锁速/章节解锁/自动强制1x，全在此处统一收敛。——
function battleSpeedCap() {
  if (NDX.ui && NDX.ui.fightSpeedLocked) return 1;
  const g = NDX.game;
  const p = (g && g.state && g.state.pending) || null;
  if (p && p.kind === 'fight' && p.autoFight) return 1;          // 自动战斗强制1x，取消多倍速
  const act = (g && g.state && g.state.act) || 1;
  const u = (NDX.fightUnlock && NDX.fightUnlock(act)) || {};
  if (u.speed3) return 3;
  if (u.speed2) return 2;
  return 1;
}
function applyBattleSpeed(n) {
  const cap = battleSpeedCap();
  const v = (n === 2 || n === 3) ? Math.min(n, cap) : 1;
  if (NDX.ui) NDX.ui.fightSpeed = v;
  return v;
}
function setFightSpeed(n) { applyBattleSpeed(n); }
function fightTick() { return Math.round(FIGHT_TICK / (NDX.ui.fightSpeed || 1)); }

// 节奏对标尖塔（2026-09-08）：平凡回合快进、决策回合全速。
// 即将播放的回合无操作点（telegraph/enrage/lowhp/routine）且无破韧点 → 演出拍 ×FIGHT_PACE_ROUTINE
// （data_config.js TIMING，0.65）；识破/爆发/破韧/终局等决策拍保持全速不打折。
// 效果：小怪战整体墙钟时长约降 30%，且不压缩任何玩家决策窗口（QTE 倒计时独立计时不受影响）。
function _pendingPaceMult(p) {
  try {
    if (!p || p.phase === 'finish') return 1;
    const res = p.res;
    if (!res || !Array.isArray(res.roundsDetail)) return 1;
    const nd = res.roundsDetail[p.roundIdx]; // 定时器到点后 driveFight 将处理的回合
    if (!nd) return 1;
    if (nd.operationPoint || nd.stageBreakPoint) return 1;
    return (NDX.TIMING && NDX.TIMING.FIGHT_PACE_ROUTINE) || 0.65;
  } catch (e) { return 1; }
}

// V8.53 预输入缓冲调度：统一接管「下一拍 driveFight」的定时器，跟踪 timer id 以便演出间隙
// 玩家点击时取消悬空定时器（见 active-skill 处理器），杜绝手动战斗「旧定时器 + 新点击」双重推进 / 回合跳拍。
function _scheduleFightTick(p) {
  if (p && p._driveTimer) { clearTimeout(p._driveTimer); p._driveTimer = null; }
  if (!p) { setTimeout(function () { driveFight(); }, fightTick()); return; }
  p._animating = true;
  p._driveTimer = setTimeout(function () {
    p._driveTimer = null; p._animating = false;
    try { driveFight(); } catch (e) { console.error('[driveFight] tick error', e); }
  }, Math.round(fightTick() * _pendingPaceMult(p)));
}

// 战前入场动画状态机（分小怪 / 精英 / Boss 三档，强化层级感知）
// 在 driveFight 真正播放 INTRO 拍之前调用；动画期间主战斗演出暂停（roundIdx 保持 -1）。
// 时间线总控：通用水墨卷帘过渡 1.2s（各档共用）→ 分档入场 → done 后交还 driveFight。
const PREANIM_MS = {
  transition: 1200,   // 节点跳转→战斗：水墨卷帘遮罩过渡（通用）
  mobEnter: 1500,     // 普通小怪：极简滑入（适配 2x 速刷）
  eliteFlash: 600,    // 精英：黑屏闪一次红光
  eliteDrop: 900,     // 精英：踏云砸入 + 碎石化
  eliteAffix: 2000,   // 精英：词缀浮字停留
  bossReveal: 2600,   // Boss：本体远景降下
  bossAura: 2000,     // Boss：锁链 / 烈火 / 佛光炸开
};
function runPreFightAnim(p, g) {
  const pa = p.preAnim;
  if (!pa || pa.done) return;
  if (pa._started) return;     // 防止重复启动
  // V8.38 速战模式：跳过所有入场动画，直接进入战斗
  if (NDX.settings && NDX.settings.fastMode) {
    pa._started = true;
    pa.done = true;
    pa.phase = 'done';
    driveFight();
    return;
  }
  // 「劫难」trial 节点（命运抉择）全屏铺垫；关隘 Boss 节点也播入场秀（V8.27 接入横版立绘大图）；
  // 普通小怪 / 精英直接进入战斗，不弹这一幕——保持速刷节奏。
  if (pa.nodeType !== 'trial' && pa.tier !== 'boss') {
    pa._started = true;
    pa.done = true;
    pa.phase = 'done';
    driveFight(); // 普通小怪/精英：跳过入场秀，立即进入战斗演出（否则 driveFight 只在 onAppClick 调一次便 return，战斗卡在 INTRO 拍）
    return;
  }
  pa._started = true;
  // 入场动画期间强制 1x（Boss 段还会在 game.js 锁速，这里保证过渡不被倍速跳过）
  NDX.ui.fightSpeedLocked = true;
  NDX.ui.fightSpeed = 1;

  const advance = (nextPhase, holdMs) => {
    pa.phase = nextPhase;
    pa.t0 = Date.now();
    doRender();
    if (holdMs > 0) {
      setTimeout(() => step(), holdMs);
    }
  };
  const finish = () => {
    pa.done = true;
    // V8.38 同步：仅Boss锁速，精英不再锁速（与game.js一致）
    NDX.ui.fightSpeedLocked = !!(p.monster && p.monster.boss);
    if (!NDX.ui.fightSpeedLocked) NDX.ui.fightSpeed = applyBattleSpeed(NDX.settings.fightSpeed || 1);
    doRender();
    driveFight();   // 交还正常战斗演出（INTRO 拍 → 逐回合）
  };
  const step = () => {
    switch (pa.phase) {
      case 'transition':
        // 通用过渡结束 → 进入分档入场
        if (pa.tier === 'boss') advance('bossReveal', PREANIM_MS.bossReveal);
        else if (pa.tier === 'elite') advance('eliteFlash', PREANIM_MS.eliteFlash);
        else advance('mobEnter', PREANIM_MS.mobEnter);
        break;
      case 'eliteFlash':
        advance('eliteDrop', PREANIM_MS.eliteDrop);
        break;
      case 'eliteDrop':
        advance('eliteAffix', PREANIM_MS.eliteAffix);
        break;
      case 'eliteAffix':
        finish();
        break;
      case 'mobEnter':
        finish();
        break;
      case 'bossReveal':
        advance('bossAura', PREANIM_MS.bossAura);
        break;
      case 'bossAura':
        finish();
        break;
      default:
        finish();
    }
  };
  // 启动：先渲染 transition 过渡层
  advance('transition', PREANIM_MS.transition);
}

// V8.29 表现层信号发射器（从 driveFight 抽取，回合制复用）
function _emitBattleFx(p, res, g, s) {
  try {
    if (typeof NDX.ui.emit !== 'function') return;
    var d = res.roundsDetail[p.roundIdx]; if (!d) return;
    // V9.x 气势层级跃迁 feedback（C7）：跨过二势/三势时金光 callout，让「攒势」过程可感知（不叠 hit-stop，避免与 C4 打击顿帧双冻结）
    try {
      var _prevTier = (p.roundIdx > 0 && res.roundsDetail[p.roundIdx - 1]) ? (res.roundsDetail[p.roundIdx - 1].momentumTier || 0) : 0;
      if (d.momentumTier > _prevTier) {
        if (d.momentumTier >= 3) NDX.ui.emit('battle-fx', { type: 'climax', text: '三势·气势滔天' });
        else if (d.momentumTier >= 2) NDX.ui.emit('battle-fx', { type: 'climax', text: '二势·气势攀升' });
      }
    } catch (e) {}
    if (d.justEnraged && !p._fxEnrage) { p._fxEnrage = true; NDX.ui.emit('battle-fx', { type: 'enrage', round: p.roundIdx + 1 }); NDX.ui.emit('battle-fx', { type: 'climax', text: '狂暴!' }); }
    if (d.stageBreakPoint && !p._fxBreak) { p._fxBreak = true; NDX.ui.emit('battle-fx', { type: 'break', stage: d.breakStage, needTreasure: (p.monster && p.monster.breakWith) || null, isRed: ((s.evil || 0) - (s.good || 0)) > 0 }); }
    if (d.operationPoint && !d.stageBreakPoint && !p._fxOpDone) { p._fxOpDone = p._fxOpDone || []; if (!p._fxOpDone.includes(p.roundIdx + 1)) { p._fxOpDone.push(p.roundIdx + 1); NDX.ui.emit('battle-fx', { type: 'op', point: d.operationPoint, round: p.roundIdx + 1 }); } }
    if (d.pTurn && d.pTurn.deal > 0) {
      var _pt = d.pTurn, _kind = 'hit';
      // V9.x 伤害数字分级：识破反制（金）/ 气势爆发（红）优先于重击判定，视觉权重独立
      if (_pt.cri) _kind = 'crit';
      else if (d.intervention && d.intervention.shiPo) _kind = 'shipo';
      else if (d.intervention && d.intervention.burstTier > 0) _kind = 'burst';
      else if (_pt.deal >= Math.max(20, (p.monster ? p.monster.hp : 1) * 0.18)) _kind = 'heavy';
      var _isBreak = !!d.stageBreakPoint; if (_isBreak && _kind !== 'crit') _kind = 'break';
      NDX.ui.emit('battle-fx', { type: 'dmg-fly', side: 'foe', dmg: _pt.deal, kind: _kind, cri: !!_pt.cri, reflect: _pt.reflect || 0 });
      // 出手扑击：我方命中瞬间向敌扑出（后手方加 200ms 错开，形成一递一还）
      NDX.ui.emit('battle-fx', { type: 'strike', side: 'you', delay: (d.first === 'enemy') ? STRIKE_GAP_MS : 0 });
      var _sk = _pt.cri ? 'crit' : (_isBreak ? 'break' : (_kind === 'heavy' ? 'heavy' : (_kind === 'shipo' || _kind === 'burst' ? _kind : 'hit')));
      NDX.ui.emit('battle-fx', { type: 'shake', kind: _sk, side: 'foe' }); NDX.ui.emit('battle-fx', { type: 'slash', kind: _kind, side: 'foe' }); NDX.ui.emit('battle-fx', { type: 'knockback', side: 'foe', kind: _sk }); NDX.ui.emit('battle-fx', { type: 'projectile', kind: _sk });
      if (_pt.cri) { NDX.ui.emit('battle-fx', { type: 'hitstop', level: 'crit' }); NDX.ui.emit('battle-fx', { type: 'climax', text: '暴击!' }); NDX.ui.emit('battle-fx', { type: 'crit-burst', side: 'foe' }); }
      else if (_isBreak) { NDX.ui.emit('battle-fx', { type: 'hitstop', level: 'break' }); NDX.ui.emit('battle-fx', { type: 'climax', text: '业障破碎!' }); }
      // V9.x 普通/重击命中补停帧（此前仅暴击/破韧有停顿，普通打击无重量感）：重击 65ms / 普攻 50ms
      else if (_kind === 'heavy') NDX.ui.emit('battle-fx', { type: 'hitstop', level: 'heavy' });
      else NDX.ui.emit('battle-fx', { type: 'hitstop', level: 'hit' });
      // V9.x 识破/爆发命中：金石/爆发重顿 + 震屏加大（表现层重量，核心结算已由 applyShiPo/applyMomentumBurst 完成）
      if (_kind === 'shipo') { NDX.ui.emit('battle-fx', { type: 'hitstop', level: 'break' }); NDX.ui.emit('battle-fx', { type: 'climax', text: '识破!' }); }
      else if (_kind === 'burst') { NDX.ui.emit('battle-fx', { type: 'hitstop', level: 'crit' }); NDX.ui.emit('battle-fx', { type: 'climax', text: '势·爆发!' }); }
    }
    if (d.mTurn && d.mTurn.deal > 0) { var _mt = d.mTurn, _k2 = 'hurt'; if (_mt.reflect) _k2 = 'reflect'; else if (_mt.absorbed) _k2 = 'shield'; NDX.ui.emit('battle-fx', { type: 'dmg-fly', side: 'you', dmg: _mt.deal, kind: _k2, reflect: _mt.reflect || 0 }); NDX.ui.emit('battle-fx', { type: 'strike', side: 'foe', delay: (d.first === 'player') ? STRIKE_GAP_MS : 0 }); if (_mt.cri) { NDX.ui.emit('battle-fx', { type: 'crit-burst', side: 'you' }); NDX.ui.emit('battle-fx', { type: 'climax', text: '受暴击!' }); } }
    // 闪避 / 持续伤害：此前只画飘字、不出声，补发事件供 ui 渲染层配音
    if (d.pTurn && d.pTurn.dodged) NDX.ui.emit('battle-fx', { type: 'dodge', side: 'foe' });
    if (d.mTurn && d.mTurn.dodged) NDX.ui.emit('battle-fx', { type: 'dodge', side: 'you' });
    var _dots = (d.resolve && d.resolve.dots) || [];
    if (_dots.length) NDX.ui.emit('battle-fx', { type: 'dot', count: _dots.length });
    if (p.monster && p.monster.hp > 0) { NDX.ui.emit('battle-fx', { type: 'boss-hp', pct: Math.max(0, Math.min(1, p.mHp / p.monster.hp)) }); }
    if (d.pTurn && d.pTurn.cri && !p._fxCriDone) { p._fxCriDone = p._fxCriDone || []; if (!p._fxCriDone.includes(p.roundIdx + 1)) { p._fxCriDone.push(p.roundIdx + 1); NDX.ui.emit('battle-fx', { type: 'line-crit', hero: g.state.currentHeroId, round: p.roundIdx + 1 }); } }
    if (d.mTurn && d.mTurn.deal > (p.maxHp || 1) * 0.15 && !p._fxHurtDone) { p._fxHurtDone = p._fxHurtDone || []; if (!p._fxHurtDone.includes(p.roundIdx + 1)) { p._fxHurtDone.push(p.roundIdx + 1); NDX.ui.emit('battle-fx', { type: 'line-hurt', hero: g.state.currentHeroId, round: p.roundIdx + 1 }); } }
    if (p.monster && p.monster._jinguMark && !p._fxJingu) { p._fxJingu = true; NDX.ui.emit('battle-fx', { type: 'jingu', cutPercent: 0.05 + Math.random() * 0.05 }); }
    if (d.jinguProc && d.jinguProc.deal > 0) { p._fxJinguProcDone = p._fxJinguProcDone || []; if (!p._fxJinguProcDone.includes(p.roundIdx + 1)) { p._fxJinguProcDone.push(p.roundIdx + 1); NDX.ui.emit('battle-fx', { type: 'dmg-fly', side: 'foe', dmg: d.jinguProc.deal, kind: 'hit', cri: false }); } }
    // V9.6 被动法宝 on-hit 触发可见化（西游释厄传名器：收妖/晕眩/灼烧…）：逐条出金色标签，让"概率触发"被玩家看见
    if (d.onHitFx && d.onHitFx.length) {
      for (var _fi = 0; _fi < d.onHitFx.length; _fi++) {
        var _f = d.onHitFx[_fi];
        NDX.ui.emit('battle-fx', { type: 'treasure-onhit', side: 'foe', label: _f.label, icon: _f.icon, name: _f.name, syn: _f.syn || '' });
      }
    }
  } catch (e) { console.error('[battle-fx] 表现层异常已被忽略，战斗继续：', e); }
}

// —— Canvas 战斗引擎桥接（方案A：真实本场，引擎直接播放 res 引用；NDX.settings.canvasBattle=false 退回 DOM）——
var NdxCanvasBattle = (function () {
  var cv = null, ctx = null, raf = 0, active = false;
  function ensureCanvas() {
    if (cv) return cv;
    cv = document.getElementById('ndx-battle-cv');
    if (!cv) return null;
    ctx = cv.getContext('2d');
    cv.addEventListener('pointerdown', function (e) {
      if (!active) return;
      var rect = cv.getBoundingClientRect();
      var x = (e.clientX - rect.left) / rect.width * 812;
      var y = (e.clientY - rect.top) / rect.height * 375;
      if (NDX.battleView && NDX.battleView.mode === 'fight') NDX.battleView.tap(x, y);
      e.stopPropagation(); e.preventDefault();
    });
    return cv;
  }
  function loop() {
    if (!active) return;
    var BV = NDX.battleView;
    if (BV && BV.mode !== 'idle') {
      BV.update(); BV.render(ctx);
      var p = NDX.game && NDX.game.state && NDX.game.state.pending;
      if (p && p.kind === 'fight') p.roundIdx = BV.idx; // 同步拍序，便于复活/三键沿用正确回合
    }
    raf = requestAnimationFrame(loop);
  }
  function start(p) {
    if (!NDX.battleView) return false;
    if (!ensureCanvas() || !ctx) return false;
    p.preAnim = null; // 跳过 DOM 入场动画，引擎自有 INTRO
    active = true;
    cv.style.display = 'block';
    var player = { heroId: NDX.game.state.hero, ti: { maxHp: (p.res && p.res.maxHp) || 1 } };
    NDX.battleView.startFightWith(p.res, player, p.monster, {
      onEnd: function (victory, res) { onEnd(p, victory, res); }
    });
    if (!raf) raf = requestAnimationFrame(loop);
    return true;
  }
  function onEnd(p, victory, res) {
    p.win = !!(res && res.win);
    p._canvasEnded = true;
    p.phase = PHASE_FINISH;
    p.preAnim = null;
    // 留 900ms 展示引擎胜/败演出，再交还主游戏叙事
    setTimeout(function () {
      active = false;
      if (cv) cv.style.display = 'none';
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
      try { driveFight(); } catch (e) { console.error('[canvasBattle] driveFight after end', e); }
    }, 900);
  }
  function stop() { active = false; if (cv) cv.style.display = 'none'; if (raf) { cancelAnimationFrame(raf); raf = 0; } }
  return { start: start, stop: stop, isActive: function () { return active; } };
})();

function driveFight() {
  var g = NDX.game;
  if (!g || !g.state) return;
  var s = g.state;
  var p = s.pending;
  if (!p || p.kind !== 'fight') return;
  // V8.53 战斗画面主线回归 DOM 水墨界面：minigame/engine/battle-canvas.js（简笔画引擎）
  // 不再默认接管浏览器 H5 战斗演出——水墨背景 / 英雄与妖物立绘精灵 / 冲撞一递一还 /
  // 业障韧性条 / 飘字特效均由 DOM 层（fb-arena + _emitBattleFx）承担，对齐万世剑冢式
  // 水墨大立绘对峙的战斗画面。Canvas 引擎仅当 NDX.settings.canvasBattle === true
  // （设置面板显式开启）才接管；minigame/bundle.js 为自包含产物，不受此判定影响。
  if (p.useCanvas === undefined) p.useCanvas = !!(NDX.battleView) && !!(NDX.settings && NDX.settings.canvasBattle === true);
  if (p.useCanvas && !p._canvasEnded) {
    if (!p._canvasStarted) {
      p._canvasStarted = true;
      if (!NdxCanvasBattle.start(p)) { p.useCanvas = false; } // 引擎不可用则回退 DOM 逐拍
      else return; // 引擎 RAF 驱动，主游戏不再逐拍
    } else { return; } // 引擎已在驱动
  }
  if (p.preAnim && !p.preAnim.done) { runPreFightAnim(p, g); return; }
  if (p.preFight) return;
  if (NDX.ui.fightPaused) return;
  var res = p.res;
  if (!res || !Array.isArray(res.roundsDetail) || !res.roundsDetail.length) {
    try { g.finishFight(); doRender(); } catch (e) {}
    return;
  }
  var total = res.roundsDetail.length;
  if (!p.phase) p.phase = PHASE_INTRO;

  switch (p.phase) {
    case PHASE_INTRO:
      // V9.x Build 成型宣告：本局首次 auditBuild 验收达标时（战斗开场），全屏金光 + 横幅「道途圆满·诸法归一」
      if (!s.flags.buildAnnounced && NDX.auditBuild) {
        try {
          const _ab = NDX.auditBuild(s);
          if (_ab && _ab.formed) {
            s.flags.buildAnnounced = true;
            NDX.ui.emit('battle-fx', { type: 'build-formed', dao: _ab.mainDao });
          }
        } catch (e) {}
      }
      doRender();
      p.roundIdx = 0;
      p.phase = PHASE_WAIT;
      _scheduleFightTick(p);
      break;

    case PHASE_BREAK:
      if (p.awaitStageBreak > 0 && !(p.stageBreakHandled || []).includes(p.awaitStageBreak)) {
        if (!p.stageBreakInfo || p.stageBreakInfo.deadline < Date.now()) {
          if (g.resolveStageBreakIdle) g.resolveStageBreakIdle();
          doRender(); driveFight();
        }
        return;
      }
      p.phase = PHASE_WAIT;
      driveFight();
      break;

    case PHASE_WAIT:
      if (p.roundIdx >= total) { p.phase = PHASE_FINISH; driveFight(); return; }
      var nd = res.roundsDetail[p.roundIdx];
      // V8.50 同步当前回合玩家侧 debuff 到 pending（临阵 cleanse 判定与高亮依赖实时状态）
      if (nd) p.pDebuffs = Object.assign({}, nd.pDebuffs || {});
      if (nd && nd.stageBreakPoint && !(p.stageBreakHandled || []).includes(p.roundIdx + 1)) {
        p.awaitStageBreak = p.roundIdx + 1;
        if (p.noTimer) {
          // 第一章：破韧窗口无时间限制，强制等待玩家手动破韧，便于学习机制
          p.stageBreakInfo = {
            stage: nd.breakStage, nextStage: nd.nextStage, nextStageHp: nd.nextStageHp,
            reward: nd.reward, deadline: Infinity, ms: 0, noTimer: true,
          };
        } else {
          p.stageBreakInfo = {
            stage: nd.breakStage, nextStage: nd.nextStage, nextStageHp: nd.nextStageHp,
            reward: nd.reward, deadline: Date.now() + NDX.STAGE_BREAK_MS, ms: NDX.STAGE_BREAK_MS,
          };
        }
        if (typeof NDX.ui.emit === 'function' && !p._fxBreak) {
          p._fxBreak = true;
          try { NDX.ui.emit('battle-fx', { type: 'break', stage: nd.breakStage,
            needTreasure: (p.monster && p.monster.breakWith) || null,
            isRed: ((s.evil || 0) - (s.good || 0)) > 0 }); } catch (e) {}
        }
        p.phase = PHASE_BREAK;
        doRender();
        startStageBreakTimer(p, g);
        return;
      }
      // —— 破爆发节奏 · 主动操作点：识破/气势爆发/受击防备/临阵祭宝 择机窗 ——
      // 在操作点回合暂停演出，弹出择机面板并开启限时（超时自动"按兵不动"续演）。
      // QTE 窗口按战斗类型分层：Boss 用 OP_COUNTDOWN_MS_BOSS(2.5s)，其余用 OP_COUNTDOWN_MS_MOB(2.0s)，
      // 前者多阶段破韧+气势蓄放决策密集需容错，后者强化"走神就错过"的紧迫节奏。
      if (p.awaitOp > 0) return; // 已在择机窗口中等待，防重复暂停/重启倒计时
      var _opHandledArr = p.opHandled || (p.opHandled = []);
      if (nd && nd.operationPoint && !nd.stageBreakPoint && !_opHandledArr.includes(p.roundIdx + 1)) {
        p.awaitOp = p.roundIdx + 1;
        if (p.noTimer) {
          // 第一章：操作点窗口无时间限制，强制等待玩家临阵祭宝，便于学习机制
          p.opInfo = { deadline: Infinity, ms: 0, noTimer: true };
        } else {
          const _opWin = (p.monster && p.monster.boss) ? NDX.OP_COUNTDOWN_MS_BOSS : NDX.OP_COUNTDOWN_MS_MOB;
          p.opInfo = { deadline: Date.now() + _opWin, ms: _opWin };
        }
        if (typeof NDX.ui.emit === 'function') {
          try { NDX.ui.emit('battle-fx', { type: 'op', point: nd.operationPoint, round: p.roundIdx + 1 }); } catch (e) {}
        }
        p.phase = PHASE_WAIT;
        doRender();
        if (!p.noTimer) startOpCountdown(p, g);
        return;
      }
      // V8.45 BOSS 战强制手动：即便误开自动，进入 Boss 回合也回退手动并提示
      if (p.autoFight && p.res && p.res.monsterTags && p.res.monsterTags.includes('boss')) {
        p.autoFight = false;
        if (NDX.ui && NDX.ui.toast) NDX.ui.toast('BOSS 战强制手动操作');
      }
      if (p.autoFight) {
        var _auto = g.aiAutoSkill ? g.aiAutoSkill(p.roundIdx) : 'atk';
        var kind = (typeof _auto === 'string') ? _auto : (_auto ? _auto.kind : 'atk');
        var _autoStyle = (typeof _auto === 'object' && _auto) ? _auto.style : null;
        var fired = g.resolveManualActive ? g.resolveManualActive(kind, _autoStyle) : false;
        if (!fired && g.resolveManualActive) g.resolveManualActive('atk');
      }
      try { doRender(); _animateFightHpBars(); } catch (e) {}
      if (p.autoFight) {
        p.phase = PHASE_PLAY;
        _scheduleFightTick(p);
      }
      break;

    case PHASE_PLAY:
      if (p.roundIdx >= total) { p.phase = PHASE_FINISH; driveFight(); return; }
      var d = res.roundsDetail[p.roundIdx];
      // V8.50 同步当前回合玩家侧 debuff 到 pending（临阵 cleanse 判定与高亮依赖实时状态）
      if (d) p.pDebuffs = Object.assign({}, d.pDebuffs || {});
      if (d) {
        // V8.40 战意系统：通过统一模块NDX.BattleResource.onHit处理受击清零战意
        var _oldPHp = p.pHp || 0;
        // 修复「怪物明明没血了还打我一下」的观感：当本回合怪物先手出手、随后被玩家击杀（mHpAfter=0）时，
        // 若直接把血条设为回合末的 0，会在怪物攻击动画播放前就显示 0 血，造成"0 血还打一下"的错觉。
        // 故该回合改用"怪物出手前血量"（上一回合末血量）显示，使怪物是「带残血出的手」而非「0 血出手」。
        var _mHpShown = d.mHpAfter;
        if (d.mHpAfter <= 0 && d.first === 'enemy' && d.mTurn && !d.mTurn.dodged) {
          var _prev = (p.roundIdx > 0 && res.roundsDetail[p.roundIdx - 1]) ? res.roundsDetail[p.roundIdx - 1].mHpAfter : p.mHp;
          if (_prev != null) _mHpShown = _prev;
        }
        p.mHp = _mHpShown; p.pHp = d.pHpAfter; p.lastDetail = d; _fightHpDirty = true;
        if (NDX.BattleResource && typeof NDX.BattleResource.onHit === 'function') {
          NDX.BattleResource.onHit(p, _oldPHp, p.pHp);
        } else {
          // 降级：手动处理受击清零战意
          if ((p.pHp || 0) < _oldPHp && (p.zhanYi || 0) > 0) {
            var keepChance = p.keepZhanYiChance || 0;
            var hasBuff = (p.keepZhanYiBuff || 0) > 0;
            if (hasBuff) {
              p.keepZhanYiBuff = Math.max(0, (p.keepZhanYiBuff || 0) - 1);
            } else if (keepChance > 0 && Math.random() < keepChance) {
              // 保留战意
            } else {
              p.zhanYi = 0;
            }
          }
        }
        // V8.46 法宝改纯手动：自动战斗不再自动祭宝，玩家须在血危时手动临阵祭宝（见 use-treasure 处理器）
      }
      _emitBattleFx(p, res, g, s);
      try { doRender(); _animateFightHpBars(); } catch (e) {}
      p.roundIdx++;
      if (p.roundIdx >= total) { p.phase = PHASE_FINISH; } else { p.phase = PHASE_WAIT; }
      _scheduleFightTick(p);
      break;

    case PHASE_FINISH:
      try { doRender(); } catch (e) {}
      // P2-10 终结一击：玩家胜利时在战斗收尾触发高潮层（慢镜+震屏+闪光+粒子+大字台词）
      if (p.win && !p._fxFinalBlow) {
        p._fxFinalBlow = true;
        try { NDX.ui.emit('battle-fx', { type: 'climax', text: '终结！' }); } catch (e) {}
      }
      setTimeout(function() {
        try { g.finishFight(); doRender(); } catch (e) { console.error('[finishFight] error', e); }
      }, 500);
      break;

    default:
      p.phase = PHASE_INTRO;
      driveFight();
  }
}

// 两相劫·阶段破韧限时窗口倒计时：每隔一拍刷新剩余时间，超时未破韧则自动以挂机兜底了结该阶段。
let _stageBreakTimer = null;
let _opTimer = null; // 主动操作点限时倒计时定时器（与阶段破韧窗口同构）
function startStageBreakTimer(p, g) {
  if (_stageBreakTimer) clearInterval(_stageBreakTimer);
  NDX.ui.stageBreakRemain = (p.stageBreakInfo && p.stageBreakInfo.ms) || NDX.STAGE_BREAK_MS;
  _stageBreakTimer = setInterval(() => {
    if (!p || !p.stageBreakInfo) { clearInterval(_stageBreakTimer); _stageBreakTimer = null; return; }
    const remain = Math.max(0, p.stageBreakInfo.deadline - Date.now());
    NDX.ui.stageBreakRemain = remain;
    if (remain <= 0) {
      clearInterval(_stageBreakTimer); _stageBreakTimer = null;
      if (g.resolveStageBreakIdle) g.resolveStageBreakIdle(); // 超时：自动挂机兜底
      doRender(); driveFight();
    } else {
      // 仅刷新倒计时显示（不重排回合），保持轻量
      NDX.ui._stageBreakTick = (NDX.ui._stageBreakTick || 0) + 1;
      if (window.__renderStageBreakRemain) window.__renderStageBreakRemain(remain);
    }
  }, 100);
}

// 主动操作点限时倒计时：operationPoint 暂停窗口弹出时启动，超时自动"静观其变"继续回放。
// 与阶段破韧窗口同构：p.opInfo 记录截止时间戳；玩家手动祭宝/跳过时置 null 由定时器自清理。
// 只压缩"暂停等待"的最坏时长，正常回放拍速（FIGHT_TICK）不变，不拉长单节点战斗时长。
function startOpCountdown(p, g) {
  if (_opTimer) clearInterval(_opTimer);
  NDX.ui.opRemain = (p.opInfo && p.opInfo.ms) || NDX.OP_COUNTDOWN_MS;
  _opTimer = setInterval(() => {
    if (!p || !p.opInfo) { clearInterval(_opTimer); _opTimer = null; return; }
    const remain = Math.max(0, p.opInfo.deadline - Date.now());
    NDX.ui.opRemain = remain;
    if (remain <= 0) {
      clearInterval(_opTimer); _opTimer = null;
      if (g.skipOp) g.skipOp(); // 超时：自动"按兵不动·静观其变"
      doRender(); driveFight();
    } else {
      // 仅刷新倒计时显示（不重排回合），保持轻量
      if (window.__renderOpRemain) window.__renderOpRemain(remain);
    }
  }, 100);
}
