// =============================================================
// data_volume.js — 《逆道西行》卷册系统 · VOLUME_BOUNDS
// 从 data.js 拆分（2026-08-31）：独立维护卷册系统
// 全局命名空间 NDX（同时挂到 window，兼容其他文件以 window.NDX 引用）
// =============================================================
window.NDX = window.NDX || {};
var NDX = window.NDX;

NDX.VOLUME_BOUNDS = [20, 40, 60, 81];
NDX.volumeOf = function (diff) {
  for (let i = 0; i < NDX.VOLUME_BOUNDS.length; i++) {
    if (diff <= NDX.VOLUME_BOUNDS[i]) return i + 1;
  }
  return NDX.VOLUME_BOUNDS.length;
};
NDX.volumeRange = function (vol) {
  const lo = vol <= 1 ? 1 : NDX.VOLUME_BOUNDS[vol - 2] + 1;
  const hi = NDX.VOLUME_BOUNDS[vol - 1];
  return [lo, hi];
};
// 三结局 CG 画廊内容（集齐六藏拓印后解锁）
