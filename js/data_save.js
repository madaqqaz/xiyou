// =============================================================
// data_save.js — 《逆道西行》存档系统 · LAST_RUN_KEY/FAVOR_KEY
// 从 data.js 拆分（2026-08-31）：独立维护存档系统
// 全局命名空间 NDX（同时挂到 window，兼容其他文件以 window.NDX 引用）
// =============================================================
window.NDX = window.NDX || {};
var NDX = window.NDX;

NDX.LAST_RUN_KEY = NDX.storage.KEYS.LAST_RUN;   // 上一局结束摘要（仅失败触发补偿）
NDX.FAVOR_KEY = NDX.storage.KEYS.FAVOR;         // 轮回赐福进度（永久累计）
NDX.TOTAL_STATS_KEY = NDX.storage.KEYS.STAT_TOTAL; // 累计统计数据（永久累计）

// ============================================================
// 累计统计（元进度反馈）：每局结束时累加，供死亡结算/主界面显示
// 让玩家明显感受到"连败也在变强"——每一世的行迹都被永久记录
// ============================================================
NDX.loadTotalStats = function () {
  const data = NDX.SaveSystem.load(NDX.TOTAL_STATS_KEY, {});
  return {
    runs: data.runs || 0,           // 累计局数（含胜负）
    clears: data.clears || 0,       // 累计通关数
    deaths: data.deaths || 0,       // 累计死亡数
    kills: data.kills || 0,         // 累计降妖数
    trials: data.trials || 0,       // 累计渡难数
    events: data.events || 0,       // 累计缘遇数
    maxLayer: data.maxLayer || 0,   // 历史最高难号
    totalAsh: data.totalAsh || 0,   // 累计劫灰
  };
};
NDX.saveTotalStats = function (stats) {
  NDX.SaveSystem.save(NDX.TOTAL_STATS_KEY, stats);
};
NDX.getRunCount = function () { return NDX.loadTotalStats().runs; };
NDX.getClearCount = function () { return NDX.loadTotalStats().clears; };
NDX.getDeathCount = function () { return NDX.loadTotalStats().deaths; };
NDX.getClearRate = function () {
  const s = NDX.loadTotalStats();
  if (s.runs <= 0) return null;
  return Math.round(s.clears / s.runs * 100);
};

// 读取上一局摘要：{ killed, beatCh1Boss, deathLayer }；无则 null
NDX.loadLastRun = function () {
  const o = NDX.storage.load(NDX.LAST_RUN_KEY);
  if (!o || typeof o !== 'object') return null;
  return {
    killed: !!o.killed,
    beatCh1Boss: !!o.beatCh1Boss,
    deathLayer: (typeof o.deathLayer === 'number') ? o.deathLayer : 0,
    ts: (typeof o.ts === 'number') ? o.ts : 0,
  };
};
NDX.saveLastRun = function (obj) {
  NDX.storage.save(NDX.LAST_RUN_KEY, Object.assign({}, obj, { ts: Date.now() }));
};

// 读取轮回赐福：
// { progress, cycle, lastKilled, orderLv, chaosLv, hunyuan }
// orderLv   : 秩序赐福（正道）累计等级
// chaosLv   : 混沌赐福（逆道）累计等级
// hunyuan   : 混元点（终局淬炼货币）
NDX.loadFavor = function () {
  const o = NDX.storage.load(NDX.FAVOR_KEY);
  if (!o) return { progress: 0, cycle: 0, lastKilled: false, orderLv: 0, chaosLv: 0, hunyuan: 0 };
  return {
    progress: Math.max(0, (typeof o.progress === 'number') ? o.progress : 0),
    cycle: Math.max(0, (typeof o.cycle === 'number') ? o.cycle : 0),
    lastKilled: !!o.lastKilled,
    orderLv: Math.max(0, (typeof o.orderLv === 'number') ? o.orderLv : 0),
    chaosLv: Math.max(0, (typeof o.chaosLv === 'number') ? o.chaosLv : 0),
    hunyuan: Math.max(0, (typeof o.hunyuan === 'number') ? o.hunyuan : 0),
  };
};
NDX.saveFavor = function (obj) {
  NDX.storage.save(NDX.FAVOR_KEY, obj);
};

// 一局结束时登记：killed=true 记失败摘要 + 累积赐福进度；killed=false 清失败摘要（避免误补偿）
NDX.recordRunEnd = function (s, killed) {
  killed = !!killed;
  const beatCh1Boss = (s.act || 1) >= 2; // 已进入第2章 = 已击败第一章关隘 Boss
  const deathLayer = s.layer || 0;
  NDX.saveLastRun({ killed: killed, beatCh1Boss: beatCh1Boss, deathLayer: deathLayer });
  const fv = NDX.loadFavor();
  const curCycle = (typeof NDX.getCycle === 'function') ? NDX.getCycle() : (s.flags.cycle || 1);
  fv.cycle = Math.max(fv.cycle, curCycle);
  fv.lastKilled = killed;
  if (killed) {
    fv.progress += 1; // 每失败一次，赐福进度 +1
    // P0-C 死亡渐进解锁：每死一局 +1 死亡计数，累积达 1/2/4/8 次逐解传承英雄（横向正反馈）
    try { if (NDX.bumpDeathCount) NDX.bumpDeathCount(); } catch (e) { /* 死亡计数失败不阻断 */ }
  }
  NDX.saveFavor(fv);
  // 长期善恶倾向：累加本局 good/evil（依据全局存档光影，非单局临时善恶）
  const t = NDX.loadTrack();
  t.good = (t.good || 0) + (s.good || 0);
  t.evil = (t.evil || 0) + (s.evil || 0);
  NDX.saveTrack(t);
  // 收集型长线·模块2：局末将本局所得红装/法宝/命痕登记入永久藏品库（无论胜负都归档）
  if (s && s.hero) NDX.recordCollection(s.hero, s);
  // 收集型长线·模块3：局末将本局已合成全本折算为「六藏拓印」（跨周目累计）
  const freshRub = s ? NDX.applyRubbing(s) : [];
  // 阶段三·舍利塔/逆道碑：局末将这一世的行迹与果位镌入跨周目碑塔（单局一次，防重）
  try { if (!s._monumentRec) { s._monumentRec = true; NDX.recordMonument(s, killed); } } catch (e) { /* 碑塔记录失败不阻断 */ }
  // 阶段六·劫灰结算（§11.1）：局末将本世赚得的劫灰入账，供劫灰坊永久升级
  try { s._ashRec = NDX.credAsh(s); } catch (e) { /* 劫灰失败不阻断 */ }
  // 阶段七·累计统计（元进度反馈）：每局结束时累加，供死亡结算/主界面显示
  try {
    const ts = NDX.loadTotalStats();
    const fs = s.fateStats || {};
    ts.runs += 1;
    if (killed) ts.deaths += 1; else ts.clears += 1;
    ts.kills += (fs.kills || 0);
    ts.trials += (fs.trials || 0);
    ts.events += (fs.events || 0);
    ts.maxLayer = Math.max(ts.maxLayer, s.layer || 0);
    if (s._ashRec && typeof s._ashRec === 'number') ts.totalAsh += s._ashRec;
    NDX.saveTotalStats(ts);
  } catch (e) { /* 累计统计失败不阻断 */ }
  return { lastRun: NDX.loadLastRun(), favor: fv, freshRub };
};

// ============================================================
// 阶段三 · 舍利塔 / 逆道碑（跨周目传承沉淀）
// 每一世行至终局（无论胜败），皆在本地「舍利塔·逆道碑」上留一笔：
//   胜者——受封果位/衣冠冢；败者——坐化偈语。供主界面/循环殿回望历代先世。
// 数据落地 localStorage，跨周目累计，最长留存 200 条。
// ============================================================
NDX.MONUMENT_KEY = NDX.storage.KEYS.MONUMENT; // 统一引用 STORE 注册表，消除键名三处定义
NDX.loadMonuments = function () {
  // V8.41 统一使用NDX.SaveSystem，删除降级逻辑
  const data = NDX.SaveSystem.load(NDX.MONUMENT_KEY, []);
  return Array.isArray(data) ? data : [];
};
NDX.saveMonuments = function (list) {
  // V8.41 统一使用NDX.SaveSystem，删除降级逻辑
  NDX.SaveSystem.save(NDX.MONUMENT_KEY, list);
};
NDX.monumentIcon = function (win, grade) {
  if (win) return grade === 'return' ? '⛩' : (grade === 'wayside' ? '衣' : '舍利');
  return '碑';
};
NDX.recordMonument = function (s, killed) {
  if (!s || !s.hero) return;
  const hero = (NDX.HEROES && NDX.HEROES[s.hero]) || { name: '行者', symbol: '器' };
  const win = !!(s.over && s.over.win);
  const rt = s.over && s.over.return;
  const honor = win
    ? ((rt && rt.honor) || '金蝉脱壳')
    : ((s.over && s.over.ending && s.over.ending.title) || '坐化西行');
  const grade = win ? ((rt && rt.grade) || 'return') : (killed ? 'fallen' : 'seated');
  const reason = (s.over && s.over.reason) || (win ? '八十一难功成' : '此生未尽');
  const yrs = typeof s.life === 'number' ? Math.max(0, Math.floor(s.life)) : 0;
  const list = NDX.loadMonuments();
  list.push({
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    hero: hero.name, symbol: hero.symbol || '器',
    win, killed: !!killed, grade, honor, reason,
    act: s.act || 1, years: yrs, diff: s.diff || 0,
    good: s.good || 0, evil: s.evil || 0,
    ts: Date.now(),
  });
  NDX.saveMonuments(list.slice(0, 200));
};

// ============================================================
// 阶段四 · 劫运骰（生死成败 · 善恶修正）
// 高风险抉择 → 一掷定成败。基础成功率 勇65%·渡75%（§12.劫运骰基准），
// 再受「善恶倾向 + 六道命痕」修正：
//   渡/隐（善向）——善高于恶则更受天眷，成败向善偏袒；反之逆/夺向偏袒恶念。
//   每 40 点善恶倾向差 ±25%；每随身一枚命痕 +2%（至多 +12%）。
// 失败可收手保底，或由反噬入战结账。重投耗材见 ROLL_REROLL_COST。
// ============================================================
