// =============================================================
// data_monument.js — 《逆道西行》衣冠冢系统 · MONUMENT_KEY
// 从 data.js 拆分（2026-08-31）：独立维护衣冠冢系统
// 全局命名空间 NDX（同时挂到 window，兼容其他文件以 window.NDX 引用）
// =============================================================
window.NDX = window.NDX || {};
var NDX = window.NDX;

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
