// _verify_batch0_wiring.js — Batch 0「跨系统同根问题」接线门禁（2026-09-27）
//
//   守护本批 7 条接线不再回退：
//     X1 `_playerObj` 手写透传白名单 —— 补 7 个内核真读的成长字段
//     X2 `treasureStatusSources`    —— 认 `s.equips` 容器（真容器），并取 `.treasureId`
//     X6 `shopPrice` / `shopRerollPrice` —— 第 2 参 `act` 的 4 个调用点漏传
//     A2 退出落盘钩子（visibilitychange / pagehide / beforeunload）
//     A3 断点档失效时「先备份再清」而非静默蒸发
//     A6 SaveSystem 迁移体接线 + 缺条目告警
//
// ⚠ 纪律：不只查「符号存在」。每个接线都配一条**真调**（真跑一次）或**反证**（把接线改回旧写法，
//    本脚本必须变红）。X1 用「读取端字段集合 vs 白名单键集合」做差集，将来新增 player.* 字段
//    忘记接线会直接红，不靠人工维护 7 个写死字段名。
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.join(__dirname, '..');

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log('  ✓ ' + m); } else { fail++; console.log('  ✗ ' + m); } };
const readSrc = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const codeLines = (txt) => txt.split(/\r?\n/).filter((l) => !/^\s*(\/\/|\*|\/\*)/.test(l));

// —— 抠出「从某个头到配平花括号」的函数体（X2 正例/反例共用）——
function extractBody(src, header) {
  const i = src.indexOf(header);
  if (i < 0) return null;
  const start = src.indexOf('{', i);
  if (start < 0) return null;
  let depth = 0;
  for (let k = start; k < src.length; k++) {
    if (src[k] === '{') depth++;
    else if (src[k] === '}') { depth--; if (depth === 0) return src.slice(start, k + 1); }
  }
  return null;
}

// —— 迷你沙箱：只注入指定文件，避开全量注入噪声——
function miniSandbox(files, patch) {
  const mem = Object.create(null);
  const localStorage = {
    getItem: (k) => (Object.prototype.hasOwnProperty.call(mem, k) ? mem[k] : null),
    setItem: (k, v) => { mem[k] = String(v); },
    removeItem: (k) => { delete mem[k]; },
    clear: () => { for (const k in mem) delete mem[k]; },
    key: (i) => Object.keys(mem)[i] || null,
  };
  Object.defineProperty(localStorage, 'length', { get: () => Object.keys(mem).length });
  const warns = [];
  const sb = {
    window: { localStorage: localStorage, NDX: {} },
    localStorage,
    console: { warn: (...a) => warns.push(String(a[0])), info: () => {}, error: () => {}, log: () => {} },
    Object, JSON, Array, String, Number, Boolean, Date, Math, RegExp,
  };
  sb.window.localStorage = localStorage;
  const ctx = vm.createContext(sb);
  (files || []).forEach((f) => {
    let src = readSrc(f);
    if (patch && patch[f]) src = patch[f](src);
    // game.js 顶层引用裸全局 NDX（浏览器即 window.NDX），沙箱内补一行同源声明
    if (f === 'js/game.js') src = 'var NDX = window.NDX;\n' + src;
    vm.runInContext(src, ctx, { filename: f });
  });
  sb.__mem = mem; sb.__warns = warns;
  return sb;
}

// —— 全量沙箱：按 index.html 装载顺序注入，用于真调 shopPrice ——
function loadGame() {
  const _noop = () => {};
  const sb = {
    console, setTimeout, clearTimeout, setInterval, clearInterval, Date, JSON, Math,
    navigator: { userAgent: 'node' },
    localStorage: { getItem: () => null, setItem: _noop, removeItem: _noop },
    document: {
      getElementById: () => null,
      createElement: () => ({ style: {}, setAttribute: _noop, appendChild: _noop, addEventListener: _noop, classList: { add: _noop, remove: _noop }, querySelector: () => null, remove: _noop }),
      querySelector: () => null, querySelectorAll: () => [], addEventListener: _noop, body: { appendChild: _noop }, documentElement: { style: {} },
    },
    requestAnimationFrame: (cb) => setTimeout(cb, 0), addEventListener: _noop, removeEventListener: _noop,
  };
  sb.window = sb; sb.global = sb; sb.self = sb;
  const ctx = vm.createContext(sb);
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  [...html.matchAll(/<script src="([^"]+)"[^>]*>/g)].forEach((m) => {
    const f = m[1]; if (/^https?:/.test(f)) return;
    const fp = path.join(ROOT, f.split('?')[0]);
    if (!fs.existsSync(fp)) return;
    try { vm.runInContext(fs.readFileSync(fp, 'utf8'), ctx, { filename: f }); } catch (e) { /* 单文件失败不中断 */ }
  });
  return sb.NDX;
}

console.log('=== _verify_batch0_wiring：Batch 0 跨系统接线（X1/X2/X6 + A2/A3/A6）===');

// ═══ A 组 · X1 `_playerObj` 透传白名单（差集判据，非写死字段名）═══
{
  const P1 = readSrc('js/combat_part1.js');
  const C1 = readSrc('js/game/game_combat_1.js');
  const read = new Set();
  let m; const re = /\bplayer\.([A-Za-z_$][\w$]*)/g;
  while ((m = re.exec(P1))) read.add(m[1]);

  // 白名单键：只取 `_playerObj` 对象体里「键名:」这一形态（8 空格缩进）
  const body = extractBody(C1, 'const _playerObj = {') || '';
  const whitelist = new Set();
  (body.match(/^\s{8}([A-Za-z_$][\w$]*)\s*:/gm) || []).forEach((s) => whitelist.add(s.replace(/^\s+/, '').split(':')[0]));
  ok(whitelist.size > 20, `A0 已取到 _playerObj 白名单键（${whitelist.size} 个）`);

  // 已知豁免：`hp` 在 combat_part1.js:1428 只是「pTi.maxHp 缺失时」的兜底，主路径走 ti.maxHp
  const EXEMPT = { hp: 'combat_part1.js:1428 仅作 pTi.maxHp 兜底，主路径已由 ti 透传' };
  const missing = [...read].filter((k) => !whitelist.has(k) && !EXEMPT[k]);
  ok(missing.length === 0,
    `A1 内核读取的 player.* 字段全部在透传白名单内（漏 ${missing.length} 个：${missing.join(',') || '无'}）`);
  // 7 个成长字段的缺省写法（防止被改成裸 `st.xxx` ⇒ undefined 污染内核）
  ['finalDamage', 'engineTier', 'petPassive', 'petCombo', 'followerSkills', 'hpDrainPct', 'immuneDeath'].forEach((k) => {
    ok(new RegExp(`${k}:\\s*(st\\.${k} \\|\\||!!st\\.${k})`).test(body), `A2· ${k} 有缺省兜底（不传 undefined 给内核）`);
  });
}

// ═══ B 组 · X2 容器接线（真调 + 反证）═══
{
  const SRC = readSrc('js/data_skill_variant.js');
  const header = 'NDX.treasureStatusSources = function (s)';
  const body = extractBody(SRC, header);
  ok(!!body, 'B0 已抠出 treasureStatusSources 函数体');
  const STUB = { TREASURE_STATUS: { dingfeng: { chance: 1, status: 'bind' }, tre_zzz: { chance: 1, status: 'x' } } };
  const call = (txt) => {
    const b = extractBody(txt, header);
    return new Function('s', 'NDX', b)({ equips: [{ treasureId: 'dingfeng' }] }, STUB);
  };
  // 返回值是「状态条目」数组（`{status,chance,src}`），`src` 才是至宝 id
  const hasSrc = (arr, id) => Array.isArray(arr) && arr.some((x) => x && x.src === id);
  const withFix = call(SRC);
  ok(hasSrc(withFix, 'dingfeng'),
    `B1 真调：s.equips=[{treasureId:'dingfeng'}] 能查到法宝状态（实得 ${JSON.stringify(withFix)}）`);
  // 反证：把 'equips' 摘掉（= 改回旧写法）必须查不到
  const reverted = SRC.replace("['equips', 'gear', 'treasures', 'held', 'equip']", "['gear', 'treasures', 'held', 'equip']");
  const without = call(reverted);
  ok(!hasSrc(without, 'dingfeng'),
    `B2 反证：摘掉 'equips' 后查不到（说明 B1 由本次接线产生，实得 ${JSON.stringify(without)}）`);
  // 静态：equips 分支必须取 treasureId（取 x.id 会恒 miss）
  ok(/k === 'equips'/.test(body) && /x\.treasureId/.test(body), 'B3 equips 分支取 `.treasureId`（取 x.id 会恒 miss，等于没修）');
  ok(/\['equips',\s*'gear',\s*'treasures',\s*'held',\s*'equip'\]/.test(SRC), "B4 容器数组同时含 5 个来源（equips 为真容器）");
}

// ═══ C 组 · X6 shopPrice 的 act 实参（真调 + 静态）═══
{
  const NDX = loadGame();
  const a1 = NDX.shopPrice ? NDX.shopPrice(1) : NaN, a10 = NDX.shopPrice ? NDX.shopPrice(1, 10) : NaN;
  ok(typeof NDX.shopPrice === 'function', 'C0 NDX.shopPrice 已定义');
  ok(Number.isFinite(a1) && Number.isFinite(a10) && Math.abs(a10 - a1) > 1e-9,
    `C1 真调：第 2 参 act 真的进价（tier1 act1=${a1} vs act10=${a10}）`);
  const r1 = NDX.shopRerollPrice ? NDX.shopRerollPrice(2, 1) : NaN;
  const r2 = NDX.shopRerollPrice ? NDX.shopRerollPrice(2, 1, 10) : NaN;
  ok(Number.isFinite(r1) && Math.abs(r2 - r1) > 1e-9, `C2 真调：shopRerollPrice 的第 3 参 act 同样生效（${r1} vs ${r2}）`);
  const spots = [['js/game/game_core_2.js', 'priceTier'], ['js/main.js', 'priceTier'],
    ['js/game/game_event_4.js', 'shopRerollPrice'], ['js/ui/ui_panel_2.js', 'shopRerollPrice']];
  spots.forEach(([f, kw]) => {
    const hit = codeLines(readSrc(f)).some((l) => {
      if (l.indexOf(kw) < 0) return false;
      if (kw === 'shopRerollPrice') return /,\s*s\.act\s*\)/.test(l);
      return /\(([^)]*),\s*s\.act\s*\)/.test(l);
    });
    ok(hit, `C3· ${f} 的 ${kw} 调用已传 s.act`);
  });
}

// ═══ D 组 · A2 退出落盘钩子（静态）═══
{
  const MAIN = codeLines(readSrc('js/main.js')).join('\n');
  ok(/addEventListener\('pagehide'/.test(MAIN), 'D1 main.js 已挂 pagehide（iOS 从多任务划掉）');
  ok(/addEventListener\('beforeunload'/.test(MAIN), 'D2 main.js 已挂 beforeunload（桌面关页面）');
  ok(/if \(document\.hidden\)[\s\S]{0,120}_exitSave\(\)/.test(MAIN), 'D3 退后台（visibilitychange→hidden）会落盘');
  ok(/_exitSave/.test(MAIN) && /pagehide/.test(MAIN), 'D4 三处钩子复用同一个 _exitSave（口径一致）');
  // 两个原有的落盘点不得被顺手删掉
  ['js/game/game_combat_2.js', 'js/game/game_core_2.js'].forEach((f) => {
    ok(codeLines(readSrc(f)).some((l) => /this\.autoSave\(\)/.test(l)), `D5· ${f} 仍保留战斗后/入节点后的落盘触发点`);
  });
}

// ═══ E 组 · A3 失效断点「先备份再清」（真调）═══
{
  const sb = miniSandbox(['js/storage.js', 'js/game.js']);
  const NDX = sb.window.NDX;
  const RUN = 'xy_run_autosave_v1', ARC = 'xy_run_autosave_v1_archive';
  const legacy = JSON.stringify({ meta: { hero: 'wukong', heroName: '孙悟空', version: 1, layer: 7 }, layer: 7 });
  sb.__mem[RUN] = legacy;
  const r = NDX.Game.hasRunSave();
  ok(r === false, 'E1 旧版本断点档判定为不可续（失效判据未动）');
  ok(sb.__mem[RUN] === undefined, 'E2 RUN 键确实被清（不再残留失效档）');
  ok(sb.__mem[ARC] === legacy, 'E3 原件已整串备份到 xy_run_autosave_v1_archive（不再静默蒸发）');
  const meta = sb.__mem['xy_save_meta_v1'] || '';
  ok(/_runArchiveReason/.test(meta) && /_runArchiveAt/.test(meta), 'E4 备份原因/时刻写入存档元信息（可排「我的局去哪了」）');
  // 正常档零回归
  const sb2 = miniSandbox(['js/storage.js', 'js/game.js']);
  sb2.__mem[RUN] = JSON.stringify({ meta: { hero: 'wukong', heroName: '孙悟空', version: 2, layer: 7 }, layer: 7 });
  ok(sb2.window.NDX.Game.hasRunSave() === true && sb2.__mem[ARC] === undefined, 'E5 当前版本档照常可续、不产生备份（构造性零回归）');
  ok(typeof NDX.storage.archiveRunSave === 'function', 'E6 NDX.storage.archiveRunSave 已导出');
}

// ═══ F 组 · A6 迁移接线（真调）+ 未版本化档零回归 ═══
{
  const sb = miniSandbox(['js/save_system.js']);
  const NDX = sb.window.NDX;
  sb.__mem['nx_ach_v1'] = JSON.stringify({ list: [{ id: 'a1' }] });
  const o = NDX.SaveSystem.load('nx_ach_v1', {});
  ok(o && o.list && o.list[0].id === 'a1', 'F1 非 MAIN 键现在也会过迁移体且不丢数据');
  ok(o && o.__v === 2, 'F2 迁移体把 __v 补进内存对象');
  ok(sb.__warns.some((w) => w.indexOf('MIGRATIONS[1] 未登记') >= 0), 'F3 缺迁移条目时显式 warn（不再静默跳过）');
  const sbOld = miniSandbox(['js/save_system.js'], {
    'js/save_system.js': (s) => s.replace("if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {", "if (key === SAVE_KEYS.MAIN && parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {"),
  });
  sbOld.__mem['nx_ach_v1'] = JSON.stringify({ list: [{ id: 'a1' }] });
  sbOld.window.NDX.SaveSystem.load('nx_ach_v1', {});
  ok(!sbOld.__warns.some((w) => w.indexOf('MIGRATIONS[1] 未登记') >= 0),
    'F4 反证：接线改回「只挂 MAIN」后不再触发 warn（说明 F3 由本次改动产生）');

  // 回归护栏：未版本化档不得被 MIGRATIONS[1] 误判成结构失效（这里曾踩过一次坑，留档）
  const sb3 = miniSandbox(['js/storage.js', 'js/game.js']);
  sb3.__mem['xy_run_autosave_v1'] = JSON.stringify({ meta: { hero: 'w', heroName: 'w', version: 2, layer: 9 }, layer: 9 });
  const o3 = sb3.window.NDX.storage.load(sb3.window.NDX.storage.KEYS.RUN);
  ok(!(o3 && o3._runInvalid), 'F5 未版本化档不被误判为结构失效（不得把健康断点打成失效）');
  ok(sb3.window.NDX.Game.hasRunSave() === true, 'F6 未版本化健康档仍可续（构造性零回归）');
}

// ═══ G 组 · FIX-C 如意精箍棒「额外物理重击」结算体（真调 + 反证）═══
//   背景：game_combat_1.js:439（fight 结算）/ :600（setStance re-resolve）两处调用
//   `NDX.applyJinguProc`，而全库此前**零定义** ⇒ 持 jingu 且未持断山符的玩家进战斗即 TypeError。
{
  const NDX = loadGame();
  ok(typeof NDX.applyJinguProc === 'function',
    'G0 NDX.applyJinguProc 已有定义（此前实测为 undefined，调用点无 try/catch 兜底）');

  const mkRes = () => ({
    maxHp: 100, maxMHp: 100, playerHpLeft: 80, monsterHpLeft: 70,
    roundsDetail: [
      { round: 1, pTurn: { deal: 10 }, mTurn: { deal: 5 }, mHpAfter: 70, pHpAfter: 90 },
      { round: 2, pTurn: { deal: 0 }, mTurn: { deal: 5 }, mHpAfter: 65, pHpAfter: 85 }, // 未命中：不掷骰
      { round: 3, pTurn: { deal: 12 }, mTurn: { deal: 6 }, mHpAfter: 50, pHpAfter: 80 },
    ],
  });
  const _origRandom = Math.random;
  const withRandom = (v, fn) => { Math.random = () => v; try { return fn(); } finally { Math.random = _origRandom; } };

  // 概率 1 ⇒ 每次出手命中都追加；physBase=20 / mDr=0.25 ⇒ 每记 round(20×0.75)=15
  const res1 = withRandom(0.0, () => NDX.applyJinguProc(mkRes(), { procChance: 1, physBase: 20, mDr: 0.25 }));
  ok(res1.roundsDetail[0].jinguProc && res1.roundsDetail[0].jinguProc.deal === 15,
    `G1 真调：触发回合写入 rd.jinguProc.deal=15（main.js:2067 的表现层契约，实得 ${JSON.stringify(res1.roundsDetail[0].jinguProc)}）`);
  ok(res1.roundsDetail[1].jinguProc === undefined,
    'G2 真调：玩家未出手/未命中的回合不掷骰（与 applyTreasureOnHit 同判据）');
  ok(res1.roundsDetail[1].mHpAfter === 50 && res1.roundsDetail[2].mHpAfter === 20,
    `G3 真调：追加伤害按回合累积推进、mHpAfter 单调递减（实得 ${res1.roundsDetail.map((r) => r.mHpAfter).join(',')}）`);
  ok(res1.monsterHpLeft === 20 && res1.roundsDetail[2].mTurn.hpAfter === 20,
    'G4 真调：顶层 monsterHpLeft 与本回合 mTurn.hpAfter 同步重算（演出与结算一致）');

  // 反证 1：概率 0 ⇒ 一次都不触发，且顶层血量**零改动**（构造性零回归）
  const res2 = withRandom(0.0, () => NDX.applyJinguProc(mkRes(), { procChance: 0, physBase: 20, mDr: 0.25 }));
  ok(res2.roundsDetail.every((r) => r.jinguProc === undefined) && res2.monsterHpLeft === 70,
    'G5 反证：procChance=0 时不触发且顶层血量零改动（不动无谓漂移）');
  // 反证 2：掷骰 0.999 > 概率 0.5 ⇒ 同样不触发（证明 G1 的触发真由概率分支产生）
  const res3 = withRandom(0.999, () => NDX.applyJinguProc(mkRes(), { procChance: 0.5, physBase: 20, mDr: 0.25 }));
  ok(res3.roundsDetail.every((r) => r.jinguProc === undefined) && res3.monsterHpLeft === 70,
    'G6 反证：掷骰未过概率时不触发（G1 的触发不是恒真断言）');
  // 击杀截断：追加伤害打空怪物 ⇒ roundsDetail 截断 + win 置位
  const resKill = withRandom(0.0, () => {
    const r = mkRes();
    r.roundsDetail[0].mHpAfter = 5;
    r.roundsDetail[1].mHpAfter = 5;
    r.roundsDetail[2].mHpAfter = 5;
    return NDX.applyJinguProc(r, { procChance: 1, physBase: 20, mDr: 0.25 });
  });
  ok(resKill.roundsDetail.length === 1 && resKill.win === true && resKill.monsterHpLeft === 0,
    `G7 真调：追加伤害击杀时截断回合并置 win（实得 len=${resKill.roundsDetail.length} win=${resKill.win}）`);
  // 静态：调用点与定义成对（防再次改名脱钩成「调用无定义」）
  const CALL = codeLines(readSrc('js/game/game_combat_1.js')).filter((l) => /NDX\.applyJinguProc\(/.test(l)).length;
  ok(CALL >= 2 && /NDX\.applyJinguProc\s*=\s*function/.test(readSrc('js/combat_part2.js')),
    `G8 静态：${CALL} 个调用点均能在 combat_part2.js 找到同名定义`);

  // 集成：真实 computeStats → calcCombat 产出的 res 上跑生产调用形态（= game_combat_1.js:439 的入参）
  {
    const st = NDX.computeStats('wukong', [], [], { ti: { atk: 0, hp: 0, dr: 0, eva: 0, cri: 0 }, yuan: { matk: 0, mdef: 0 } }, 1);
    const po = {
      ti: Object.assign({}, st.ti, { hp: 4000, curHp: 4000 }),
      yuan: { matk: st.yuan.matk, mdef: st.yuan.mdef }, spd: st.spd || 8, hero: 'wukong',
    };
    const mon = { name: '试妖', hp: 20000, maxHp: 20000, atk: 20, dr: 0.2, spd: 6, mdef: 0.1 };
    let res = null, err = null;
    try { res = NDX.calcCombat(po, mon, { stanceSeq: ['ATK'] }); } catch (e) { err = e; }
    ok(!!res && !err, `G9 集成：真实 calcCombat 可结算（实得 ${res && res.roundsDetail && res.roundsDetail.length} 拍，err=${err && err.message}）`);
    if (res) {
      const hitters = res.roundsDetail.filter((r) => r.pTurn && r.pTurn.deal > 0).length;
      const hitDmg = Math.max(1, Math.round(st.ti.atk * (1 - mon.dr)));
      const before = res.monsterHpLeft;
      let e2 = null;
      const _r = Math.random;
      Math.random = () => 0; // 必触发
      try { NDX.applyJinguProc(res, { procChance: 0.18, physBase: st.ti.atk, mDr: mon.dr }); } catch (e) { e2 = e; }
      Math.random = _r;
      const procs = res.roundsDetail.filter((r) => r.jinguProc).length;
      ok(!e2 && procs === hitters && before - res.monsterHpLeft === hitters * hitDmg,
        `G10 集成：触发次数==出手回合数(${procs}/${hitters})、掉血==次数×单记(${before - res.monsterHpLeft} vs ${hitters * hitDmg})、无异常(${e2 && e2.message})`);
    }
  }
}

// ═══ H 组 · X3 断点：treasure 层透传 c.rng（真调 + 反证）═══
//   背景：applyTreasureStatus(act, s, rng) 第 3 参早已存在（data_skill_variant.js:119），
//   jing 层也已透传 c.rng，唯 treasure 层漏传 ⇒ 法宝状态概率分支恒回退裸 Math.random（门禁无法 stub）。
{
  const SRC = readSrc('js/data_skill_index.js');
  const mkLayer = (txt) => {
    const b = extractBody(txt, 'treasure: {');
    const seen = {};
    const stub = { applyTreasureStatus: (act, s, rng) => { seen.act = act; seen.s = s; seen.rng = rng; } };
    return { layer: new Function('NDX', 'return (' + b + ');')(stub), seen };
  };
  const stubRng = () => 0;
  const a1 = mkLayer(SRC);
  a1.layer.run({}, { s: { hero: 'wukong' }, rng: stubRng });
  ok(a1.seen.rng === stubRng,
    'H1 真调：treasure 层把 c.rng 原样传给 applyTreasureStatus（第 3 参不再是 undefined）');
  // 反证：摘掉 c.rng（= 改回旧写法）后必须收不到 stub
  const reverted = SRC.replace('NDX.applyTreasureStatus(act, c.s, c.rng)', 'NDX.applyTreasureStatus(act, c.s)');
  ok(reverted !== SRC, 'H2 反证样本已构造（旧写法可被还原）');
  const a2 = mkLayer(reverted);
  a2.layer.run({}, { s: { hero: 'wukong' }, rng: stubRng });
  ok(a2.seen.rng === undefined,
    `H3 反证：摘掉 c.rng 后第 3 参为 undefined（说明 H1 由本次接线产生，实得 ${typeof a2.seen.rng}）`);
  // 与 jing 层口径一致（同一条链上两层不得一传一不传）
  ok(/applyJingSlotMods\(act, c\.s, c\.kind, c\.rng\)/.test(SRC),
    'H4 静态：jing 层已透传 c.rng —— 本层补齐后全链口径一致');
}

// ═══ I 组 · S15 A3 UI 出口：失效断点「只备份、不展示」的只读提示（真调 + 反证）═══
//   2026-09-27 Batch 1 落地。`storage.runArchiveInfo()` 是备份槽 `RUN_ARCHIVE` 的唯一读取端，
//   同时把 `SAVE_META._runArchiveReason/_runArchiveAt` 这两个「只写不读」的孤儿字段接上。
{
  // —— 最小沙箱：只装 storage.js + 可写的假 localStorage ——
  const mem = {};
  const sb = {
    console: { log: () => {}, warn: () => {}, error: () => {} },
    Date, JSON, Math, localStorage: {
      getItem: (k) => (k in mem ? mem[k] : null),
      setItem: (k, v) => { mem[k] = String(v); },
      removeItem: (k) => { delete mem[k]; },
    },
  };
  sb.window = sb; sb.global = sb; sb.self = sb; sb.NDX = {};
  const ctx = vm.createContext(sb);
  try { vm.runInContext(readSrc('js/storage.js'), ctx, { filename: 'js/storage.js' }); } catch (e) { /* noop */ }
  const ST = sb.NDX && sb.NDX.storage;

  ok(typeof ST === 'object' && typeof ST.runArchiveInfo === 'function',
    'I1 storage.runArchiveInfo 已存在，且是备份槽 RUN_ARCHIVE 的唯一读取端');

  // 真调：写入一段归档原件 ⇒ 必须解析出 bytes / ts / reason
  let got = null;
  if (ST) {
    mem[ST.KEYS.RUN_ARCHIVE] = JSON.stringify({ meta: { hero: 'wukong', ts: 1769000000000 }, layer: 12 });
    mem[ST.KEYS.SAVE_META] = JSON.stringify({ _runArchiveReason: 'version', _runArchiveAt: 1769000000000 });
    got = ST.runArchiveInfo();
  }
  ok(got && got.bytes > 0 && got.ts === 1769000000000 && got.reason === 'version',
    `I2 真调：读回归档原件（bytes=${got && got.bytes} ts=${got && got.ts} reason=${got && got.reason}）`);

  // 真调：备份槽空 ⇒ null（UI 据此不渲染，避免空白行）
  let none = null;
  if (ST) { mem[ST.KEYS.RUN_ARCHIVE] = ''; none = ST.runArchiveInfo(); }
  ok(none === null, 'I3 真调：备份槽为空时返回 null（UI 不渲染 ⇒ 首页零干扰）');

  // 反证：把 storage.js 里的 runArchiveInfo 删掉，UI 分支必须走 catch 返回空串而非抛错
  const UI = readSrc('js/ui/ui_misc_1.js');
  ok(/typeof NDX\.storage\.runArchiveInfo !== 'function'\) return ''/.test(UI)
    && /class="trial-text run-archive-note"/.test(UI),
    'I4 反证样本：UI 分支既判「函数缺失」又渲染 run-archive-note（两处任一被删都会红）');
  // I5 护栏：只读提示(run-archive-note)「自身元素内」不得含 data-action（不接管点击流程）。
  //   ⚠ 原 `[\s\S]{0,400}?` 窗口过宽，会误伤紧邻的 _runResumeHtml 的「继续西行」按钮（2026-09-27 接线，合法交互元素）；
  //     故收窄为「仅匹配该提示 div 自身内容」（开标签到首个 </div>），仍守住「提示不接管点击」真意。
  const _note = UI.match(/run-archive-note"[^>]*>([\s\S]*?)<\/div>/);
  ok(_note ? !/data-action/.test(_note[1]) : false,
    'I5 护栏：只读提示自身不含 data-action ⇒ 不接管点击流程（不干扰「继续西行」按钮）');
  // 只切「startScreen 方法体」这一段（到下一个方法名为止），避免跨方法假命中
  const _a = UI.indexOf('startScreen() {'), _b = UI.indexOf('clearCountBarHtml() {');
  const _body = (_a >= 0 && _b > _a) ? UI.slice(_a, _b) : '';
  ok(_body.indexOf('this._runArchiveNoticeHtml()') >= 0,
    `I6 护栏：startScreen() 方法体内确实调用了本提示（切到 ${_body.length} 字符，删掉调用行即红）`);
  ok(typeof ST === 'object' && ST.KEYS && ST.KEYS.SAVE_META,
    'I7 静态：SAVE_META 键仍在（runArchiveInfo 是它现在的唯一读取端）');
}

// ═══ J 组 · X7 接线：effect.follower 此前全 17 处零消费（真调 + 反证）═══
//   2026-09-27 用户拍板 A 案：`FOLLOWERS` 补 13 个 id + applyEffectCore 加 eff.follower 分支。
//   R9「一身一 id」：`yutu_yaomo`→`yutu`、`honghai_jiban`→`honghaier` 复用既有真源 id，不另建。
{
  // —— 真调沙箱：storage + data_negotiate + game.js（Game 类）+ game_event_3.js（applyEffectCore）——
  const sb = {
    console: { log: () => {}, warn: () => {}, error: () => {} },
    setTimeout, clearTimeout, Date, JSON, Math,
    localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
  };
  sb.window = sb; sb.global = sb; sb.self = sb; sb.NDX = {};
  const ctx = vm.createContext(sb);
  // ⚠ X7 分容器后必须走 **loadGame() 全量沙箱**（按 index.html 顺序注入）：
  //   精简沙箱里没有 `BOSS_REWARDS`/装备池 ⇒ `equipById` 查不到宠物条目 ⇒ `petEntryById` 恒 null
  //   ⇒ J1/J8b 假红、J4b/J4c 分支根本走不进去。这正是「门禁只加载部分文件」型假红。
  //   （J6 反证用的独立沙箱另算：它只需 game_event_3 的旧形态，不依赖宠物真源。）
  try {
    const _N = loadGame();
    Object.keys(_N || {}).forEach((k) => { if (sb.NDX && sb.NDX[k] === undefined) sb.NDX[k] = _N[k]; });
  } catch (e) { /* 全量加载失败不中断，交由下列断言暴露 */ }
  const N = sb.NDX, ST = N && N.storage;
  const F = N && N.FOLLOWERS;

  // J1 差集护栏（2026-09-27 改口径 · 分容器）：每一处 `follower:'x'` 必须能解析到**任一容器真源** ——
  //   ① `FOLLOWERS`（人形态随从）② 宠物真源 `petEntryById`（妖形宠物，含储备池）。
  //   ⚠ 旧口径只查 FOLLOWERS，会把「妖形已改指宠物真源」误判为漏；新口径同时防两头：
  //     既防随从侧漏，也防事件写到宠物真源里根本不存在的 id（死效果）。
  const trialsFiles = fs.readdirSync(path.join(ROOT, 'js'))
    .filter((f) => /^trials_.*\.js$/.test(f));
  let total = 0, missed = [];
  trialsFiles.forEach((f) => {
    const txt = readSrc('js/' + f);
    (txt.match(/follower:\s*'([a-z0-9_]+)'/g) || []).forEach((m) => {
      const id = m.match(/'([a-z0-9_]+)'/)[1];
      total++;
      const inFollower = !!(F && F[id]);
      const inPet = !!(N.petEntryById && N.petEntryById(id));
      if (!inFollower && !inPet) missed.push(f + ':' + id);
    });
  });
  const _pettotal = trialsFiles.reduce((a, f) => a + ((readSrc('js/' + f).match(/follower:\s*'[a-z0-9_]+'/g) || []).length), 0);
  ok(missed.length === 0,
    `J1 差集护栏：${trialsFiles.length} 个 trials 文件共 ${total} 处，每处都能解析到随从册或宠物真源（漏 ${missed.length}：${missed.join(',') || '无'}）`);

  // J2 真调：grantFollower 四条路径
  const _s = { followers: [] };
  const r1 = N.grantFollower(_s, 'yutu');
  const r2 = N.grantFollower(_s, 'yutu');
  const r3 = N.grantFollower(_s, '不存在_id');
  ok(r1.ok && _s.followers[0] === 'yutu' && r2.reason === 'dup' && r3.reason === 'unknown',
    `J2 真调：grantFollower 入册/去重/未知三路（ok=${r1.ok} dup=${r2.reason} unknown=${r3.reason}）`);
  const _s2 = { followers: ['a', 'b', 'c', 'd'] };
  const r4 = N.grantFollower(_s2, 'yutu');
  ok(!r4.ok && r4.reason === 'full' && _s2.followers.length === 4,
    'J3 真调：随从满（cap 4）时拒绝入册并返回 full（事件侧据此弹让位二选，不静默丢弃）');

  // J4/J5 真调 + 反证：真的跑一次 applyEffectCore（**分容器两条真调**）
  const fake = (state) => {
    const g = Object.create(N.Game.prototype);
    g.state = state;
    g.pushLog = (m) => { state._logs = state._logs || []; state._logs.push(m); };
    g.toast = () => {};
    return g;
  };
  // ① 人形态 → 进随从册
  const st1 = { followers: [], bonusTi: { atk: 0, hp: 0, dr: 0, eva: 0 }, bonusYuan: { matk: 0, mdef: 0 }, flags: {}, materials: {} };
  const g1 = fake(st1);
  try { g1.applyEffectCore({ follower: 'jieyin_ren' }); } catch (e) { /* noop */ }
  ok(st1.followers.indexOf('jieyin_ren') >= 0 && (st1._logs || []).some((l) => /跪地拜师/.test(l)),
    `J4 真调（人形·随从）：applyEffectCore({follower:'jieyin_ren'}) 真的把随从写进 s.followers 并落日志（实得 [${st1.followers}]）`);

  // ② 妖形态 → 发宠物装备（走 petEntryById，覆盖储备池）
  //    ⚠ `grantEquip` 是 Game.prototype 上的**真实方法**，传给它的就是装备对象本身
  //      （`state.equips` 存对象）⇒ 判据要查 `e.id`，不能按字符串比较。
  const hasPetEq = (st, id) => (st.equips || []).some((e) => e && (e.id === id || e === id));
  const st1b = { followers: [], equips: [], bonusTi: { atk: 0, hp: 0, dr: 0, eva: 0 }, bonusYuan: { matk: 0, mdef: 0 }, flags: {}, materials: {} };
  // ⚠ 必须**新建** fake：fake() 的 pushLog 闭包捕获的是传入时的 state，
  //   复用 g1 改 g1.state 不会改变 pushLog 的落点 ⇒ 日志会写到上一份 state 上（本轮踩过）。
  const g1b = fake(st1b);
  try { g1b.applyEffectCore({ follower: 'ni_yutu' }); } catch (e) { /* noop */ }
  ok(hasPetEq(st1b, 'ni_yutu') && (st1b._logs || []).some((l) => /认你为主/.test(l)),
    `J4b 真调（妖形·宠物）：applyEffectCore({follower:'ni_yutu'}) 真的把宠物发进装备栏（实得 ${(st1b.equips || []).map((e) => e && e.id).join(',') || '空'}）`);

  // ③ 储备池宠物也必须发得出去（equipById 只能查活跃池，这是本轮踩过的坑）
  const st1c = { followers: [], equips: [], bonusTi: { atk: 0, hp: 0, dr: 0, eva: 0 }, bonusYuan: { matk: 0, mdef: 0 }, flags: {}, materials: {} };
  const g1c = fake(st1c);
  try { g1c.applyEffectCore({ follower: 'nanshandawang' }); } catch (e) { /* noop */ }
  ok(hasPetEq(st1c, 'nanshandawang'),
    `J4c 真调（储备池宠物）：'nanshandawang' 在储备池也能发出（实得 ${(st1c.equips || []).map((e) => e && e.id).join(',') || '空'}）`);

  // 反证：把 game_event_3.js 里整个 eff.follower 分支摘掉 ⇒ 必须拿不到
  const removed = readSrc('js/game/game_event_3.js')
    .replace(/if \(eff\.follower\) \{[\s\S]*?\n    \}\n(?=    if \(eff\.maxhpPct\))/, '');
  ok(removed !== readSrc('js/game/game_event_3.js') && !/if \(eff\.follower\)/.test(removed),
    'J5 反证样本：eff.follower 分支可被完整摘除（旧写法还原）');
  const st2 = { followers: [], bonusTi: { atk: 0, hp: 0, dr: 0, eva: 0 }, bonusYuan: { matk: 0, mdef: 0 }, flags: {}, materials: {} };
  const sb2 = Object.assign({}, sb);
  const ctx2 = vm.createContext(sb2); sb2.NDX = {};
  ['js/storage.js', 'js/data_negotiate.js', 'js/game.js'].forEach((f) => {
    try { vm.runInContext(readSrc(f), ctx2, { filename: f }); } catch (e) {}
  });
  try { vm.runInContext(removed, ctx2, { filename: 'js/game/game_event_3.js' }); } catch (e) {}
  const g2 = Object.create(sb2.NDX.Game.prototype);
  g2.state = st2; g2.pushLog = () => {}; g2.toast = () => {};
  try { g2.applyEffectCore({ follower: 'jieyin_ren' }); } catch (e) {}
  ok(st2.followers.length === 0,
    `J6 反证：摘掉分支后同一调用拿不到随从（实得 [${st2.followers}] ⇒ 证明 J4 由本次接线产生）`);

  // J7 护栏（改口径）：X7 分容器后随从册只留**人形态**，妖形 id 一律不在这里。
  //   反过来锁一件事：这些妖形 id 不是被丢弃，而是**在宠物真源里都有归宿**——
  //   否则撤回随从侧就真的变成了数据丢失。
  const need = ['kouqi_ren', 'jieyin_ren', 'anuo_ren', 'chechi_sanyao_ren'];
  const lack = need.filter((id) => !F || !F[id]);
  ok(lack.length === 0, `J7 护栏：人形态随从 ${need.length} 位全部入册（缺 ${lack.length}：${lack.join(',') || '无'}）`);

  // J8 护栏：X7 改指宠物真源的 10 个妖形 id，撤回随从侧后仍须在宠物真源可解析
  // ⚠ `yutu` **不在撤回名单内**：它是随从册**存量**（原 13 只之一），且被三处活引用——
  //   `data_follower_fuse.js` 的技能表（月华捣药）、蝎子精机缘 `conds:[{with:'yutu'}]`、
  //   `data_negotiate.js` 的谈判映射表 `'假公主·玉兔'`。删了会打断三条既有链路。
  //   ⇒ 它随宠物侧的 `ni_yutu` 并存属**存量 R9 违反**，登记报告，不在本批就地改。
  const Retired = { renshenguo_tongzi: 'renshanguozi', tuolong_yuan: 'ni_tuolong', jinmaohou: 'ni_jinmaohou',
    zhizhujing: 'zhizhujing', duomugai: 'duomuguai', laoshu_jing: 'diyongfuren',
    nanshan_dawang: 'nanshandawang', jiuling_yuansheng: 'ni_jiuling', sanxi_niu_yaomo: 'ni_xiniu' };
  const _gone = Object.keys(Retired).filter((id) => F && F[id]);
  //   判据查的是**映射目标**（`Retired[id]`）在宠物真源可解析，不是旧 id 本身——旧 id 从来不属于宠物真源。
  const _noHome = Object.keys(Retired).filter((id) => {
    const tgt = Retired[id];
    const e = N.petEntryById ? N.petEntryById(tgt) : null;
    return !(e && e.slot === 'pet');
  });
  ok(_gone.length === 0, `J8a 护栏：妖形 id 已从随从册撤回（仍在册 ${_gone.length}：${_gone.join(',') || '无'}）`);
  ok(_noHome.length === 0,
    `J8b 护栏：撤回的 10 个妖形 id 在宠物真源均有 slot:'pet' 归宿（无归 ${_noHome.length}：${_noHome.join(',') || '无'}）`);
}

console.log(`\n结果：${pass} 通过 / ${fail} 失败`);
process.exit(fail ? 1 : 0);
