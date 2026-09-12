// 页面内自动游玩器 v5 —— 按 pending 类型 + data-action 精确驱动
// 关键修正（v5）：
//  1) 战斗「主动操作点(p.awaitOp>0)」必须用 op-skip / g.skipOp() 推进——
//     否则 awaitOp 残留、择机面板不再渲染，PHASE_WAIT 永久 early-return = 软锁。
//  2) 绝不点 op-burst / op-burst-hud / op-manual / op-treasure（择机窗误触会致上述软锁）。
//  3) 兜底恢复：战斗已判胜(p.win)却卡住 → 调 g.finishFight()（游戏自身收尾路径，安全）。
// 测试加速：仅放开自动战斗门槛 + 拉满倍速，不改战斗结算逻辑；不使用 fight-skip（直读 p.res 会误判败）。
(function () {
  if (window.__ndxAuto) { window.__ndxAuto.running = true; return 'resumed'; }
  try {
    if (window.NDX && window.NDX.FIGHT_GATE) window.NDX.FIGHT_GATE.auto = 1;
    if (window.NDX && window.NDX.ui) window.NDX.ui.fightSpeed = 3;
  } catch (e) {}

  var A = { running: true, steps: 0, maxAct: 1, maxDiff: 1, last: '', result: null, errors: [], seen: {}, flow: [], recovered: 0 };

  function $(s) { return [].slice.call(document.querySelectorAll(s)); }
  function vis(el) { if (!el || el.disabled) return false; var r = el.getBoundingClientRect(); return r.width > 1 && r.height > 1; }
  function byAction(name) { return $('[data-action="' + name + '"]').filter(vis)[0] || null; }
  function clickEl(el) { try { el.click(); return true; } catch (e) { A.errors.push(e.message); return false; } }
  function actKey(el) { return (el.getAttribute('data-action') || '') + '|' + (el.getAttribute('data-opt') || el.getAttribute('data-kind') || el.getAttribute('data-idx') || el.getAttribute('data-layer') || ''); }
  function stateKey() {
    var s = window.NDX && window.NDX.game && window.NDX.game.state;
    if (!s) return 'nostate';
    var p = s.pending || {};
    // 关键：纳入 title/text 长度——否则连续多步 narrative 会被误判「状态未变」而遭黑名单误杀
    return [s.act, s.layer, s.diff, s.hp, s.gold, p.kind, p.phase, p.roundIdx, p.awaitOp,
      (s.seals || []).length, (p.title || ''), ((p.text || '') + '').length].join('|');
  }

  var ADV = [
    'tutorial-fight', 'node',
    'sixdao-pick', 'sixdao-confirm', 'trial-opt', 'sub-trial-opt', 'branch-opt', 'mirror-opt', 'event-opt',
    'trial-result-ok', 'guanyin-msg-ok', 'scene-next', 'win-continue', 'narrative-next',
    'region-gate', 'gate-meditate',
    'curse-pick-skip', 'curse-pick-opt', 'roll-cast', 'roll-fold',
    'dao-overview-next', 'quota-dao-opt', 'dao-retune-opt',
    'negotiate-opt', 'follower-replace-opt', 'compound-route-opt',
    'rest-opt', 'tudi-choice', 'rest-camp', 'rest-sin', 'camp-upgrade', 'camp-bless', 'camp-cancel-bless', 'camp-back', 'promote-confirm', 'forge',
    'sutra-drop-pick', 'seal-drop-pick', 'equip', 'gift', 'use-item', 'sin-buy', 'ash-buy',
    'lundao-continue', 'lundao-answer', 'lundao-choose', 'first-evil-close', 'meta-guide-ok', 'open-vault'
  ];
  var ADV_SET = {}; ADV.forEach(function (a) { ADV_SET[a] = 1; });

  // 永不通过「兜底」点击（择机窗/破韧窗按钮须经 handleFight 精确处理，误触会软锁）
  var HUD = {
    'op-burst': 1, 'op-burst-hud': 1, 'op-manual': 1, 'op-treasure': 1, 'op-skip': 1, 'op-flee': 1, 'op-slow': 1,
    'stagebreak-manual': 1, 'stagebreak-skip': 1, 'fight-toggle-pause': 1, 'fight-speed': 1,
    'open-lamp': 1, 'open-xinmo': 1, 'open-trials': 1, 'open-hero': 1, 'open-bag': 1, 'open-changan': 1,
    'open-meta-overview': 1, 'open-settings': 1, 'open-sutra-box': 1, 'open-codex': 1, 'open-cultivation': 1,
    'open-daily': 1, 'open-ach': 1, 'open-cycle': 1, 'open-hunyuan': 1, 'open-blessing': 1, 'open-pet-atlas': 1,
    'open-follower-atlas': 1, 'open-privacy': 1, 'open-terms': 1, 'open-icp': 1, 'open-feedback': 1,
    'dock-open': 1, 'dock-tab': 1, 'dock-close': 1, 'toggle-sound': 1, 'toggle-sound-setting': 1,
    'set-speed': 1, 'set-fight-speed': 1, 'set-difficulty': 1, 'set-font-scale': 1, 'set-colorblind': 1,
    'set-volume': 1, 'toggle-fast-mode': 1, 'toggle-tutorial': 1, 'toggle-high-contrast': 1,
    'bag-slot-pick': 1, 'show-bag-detail': 1, 'bag-equip-toggle': 1, 'show-hero-detail': 1, 'toggle-mission': 1,
    'rank-tab': 1, 'claim-coll': 1, 'yz-detail': 1, 'reset-save': 1, 'momentum-help': 1, 'life-mode': 1, 'huiying': 1
  };

  var dead = {}, lastStateKey = '', stuck = 0, lastKey = '';

  function handleFight(p, g) {
    var s = g.state;
    // 1) 两相劫·破韧窗口
    if (p.awaitStageBreak > 0) {
      var sm = byAction('stagebreak-manual'); if (sm && !sm.disabled) { A.last = 'fight:break'; clickEl(sm); return true; }
      var ss = byAction('stagebreak-skip'); if (ss && !ss.disabled) { A.last = 'fight:brkskip'; clickEl(ss); return true; }
    }
    // 2) 主动操作点（择机窗）——必须「按兵不动」推进
    if (p.awaitOp > 0) {
      var os = byAction('op-skip'); if (os && !os.disabled) { A.last = 'fight:opskip'; clickEl(os); return true; }
      var ot = byAction('op-treasure'); if (ot && !ot.disabled) { A.last = 'fight:optre'; clickEl(ot); return true; }
      // 面板未渲染但 awaitOp 残留 → 直接调游戏自身 skipOp 解窗（防软锁）
      if (g.skipOp) { try { g.skipOp(); A.recovered++; A.last = 'fight:skipOp直接'; return true; } catch (e) {} }
    }
    // 3) 自动战斗
    if (!p.autoFight) { var au = byAction('fight-auto-toggle'); if (au && !au.disabled) { A.last = 'fight:auto'; clickEl(au); return true; } }
    // 4) 手动三键
    var order = ['atk', 'chant', 'ult'];
    for (var i = 0; i < order.length; i++) {
      var b = $('[data-action="active-skill"][data-kind="' + order[i] + '"]').filter(vis)[0];
      if (b && !b.disabled) { A.last = 'fight:' + order[i]; clickEl(b); return true; }
    }
    var w = byAction('win-continue'); if (w) { A.last = 'fight:win'; clickEl(w); return true; }
    A.last = 'fight:wait'; return false;
  }

  function tick() {
    try {
      var g = window.NDX && window.NDX.game;
      A.steps++;
      if (!g || !g.state) {
        var st = byAction('start') || byAction('resume-run');
        if (st) { A.last = 'start'; clickEl(st); return; }
        A.last = 'no-game'; return;
      }
      var s = g.state;
      A.maxAct = Math.max(A.maxAct, s.act || 1); A.maxDiff = Math.max(A.maxDiff, s.diff || 1);
      if (s.over) { A.running = false; A.result = 'OVER:' + JSON.stringify(s.over); return; }

      var p = s.pending || {};
      var kind = p.kind || 'none';
      if (!A.seen[kind]) { A.seen[kind] = 1; A.flow.push('act' + (s.act || 1) + '/' + (s.diff || 1) + ':' + kind); }

      var acted = false;
      if (p.kind === 'fight') acted = handleFight(p, g);
      for (var i = 0; i < ADV.length && !acted; i++) {
        var e = $('[data-action="' + ADV[i] + '"]').filter(function (b) { return vis(b) && !dead[actKey(b)]; })[0];
        if (e) { lastKey = actKey(e); A.last = 'adv:' + ADV[i]; clickEl(e); acted = true; }
      }
      if (!acted) {
        var cand = $('[data-action]').filter(function (b) { var da = b.getAttribute('data-action'); return vis(b) && !HUD[da] && !dead[actKey(b)]; })[0];
        if (cand) { lastKey = actKey(cand); A.last = 'any:' + cand.getAttribute('data-action'); clickEl(cand); acted = true; }
      }
      if (!acted) A.last = 'idle';

      var nk = stateKey();
      if (nk === lastStateKey && acted && A.last !== 'idle') {
        stuck++;
        if (stuck >= 6) {
          var _m = /^(?:adv|any):(.+)$/.exec(A.last);
          var _a = _m ? _m[1] : '';
          // 只拉黑「非核心推进」action（如误点的 HUD/装饰项），核心推进链（叙事/节点/选项）绝不拉黑
          if (lastKey && _a && !ADV_SET[_a]) dead[lastKey] = 1;
          stuck = 0;
        }
      } else { stuck = 0; }
      lastStateKey = nk;
    } catch (e) { A.errors.push('tick:' + e.message); A.last = 'err'; }
  }

  A.tick = tick;
  window.__ndxAuto = A;
  window.__ndxAutoTimer = setInterval(tick, 300);
  return 'autoplay v5 started';
})();
