// =============================================================
// data_rubbing.js — 《逆道西行》拓印系统 · RUBBING_KEY
// 从 data.js 拆分（2026-08-31）：独立维护拓印系统
// 全局命名空间 NDX（同时挂到 window，兼容其他文件以 window.NDX 引用）
// =============================================================
window.NDX = window.NDX || {};
var NDX = window.NDX;

NDX.RUBBING_KEY = 'xynj_rubbing';
NDX.loadRubbing = function () {
  // V8.41 统一使用NDX.SaveSystem，删除降级逻辑
  const data = NDX.SaveSystem.load(NDX.RUBBING_KEY, {});
  return data && typeof data === 'object' ? data : {};
};
NDX.saveRubbing = function (r) {
  // V8.41 统一使用NDX.SaveSystem，删除降级逻辑
  NDX.SaveSystem.save(NDX.RUBBING_KEY, r);
};
// 根据某局已合成的全本集合，追加可拓印的道（返回本次新拓印的道 id 列表）
NDX.applyRubbing = function (s) {
  const done = s.sutras || [];
  const rub = NDX.loadRubbing();
  const fresh = [];
  Object.keys(NDX.SUTRA_SIX_DAOS).forEach((dao) => {
    if (rub[dao]) return;
    const all = NDX.SUTRA_SIX_DAOS[dao].sutras;
    if (all.length > 0 && all.every((fid) => done.indexOf(fid) >= 0)) {
      rub[dao] = true; fresh.push(dao);
    }
  });
  if (fresh.length) NDX.saveRubbing(rub);
  return fresh;
};
// 六藏是否已全部拓印（解锁三结局 CG 画廊）
NDX.sixDaosComplete = function () {
  const rub = NDX.loadRubbing();
  return Object.keys(NDX.SUTRA_SIX_DAOS).every((dao) => rub[dao]);
};
// 单道佛经拓印完成后，本局同命运抉择额外 +5 命数（降低难簿解锁门槛）
// 永久拓印库已含该道 → 返回 5，否则 0。拓印为跨周目永久，故后续周目同道抉择均 +5。
NDX.RUBBING_FATE_BONUS = 5;
NDX.rubbingFateBonus = function (dao) {
  if (!dao) return 0;
  const rub = NDX.loadRubbing();
  return rub[dao] ? NDX.RUBBING_FATE_BONUS : 0;
};

// 难簿「分卷」边界：1-20 / 21-40 / 41-60 / 61-81 四卷
