// =============================================================
// data_seed.js — 《逆道西行》种子系统 · 工具函数/种子分享
// 从 data.js 拆分（2026-08-31）：独立维护种子系统与随机工具
// 全局命名空间 NDX（同时挂到 window，兼容其他文件以 window.NDX 引用）
// =============================================================
window.NDX = window.NDX || {};
var NDX = window.NDX;

// 随机工具
NDX._rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
NDX._clampCol = (c) => Math.max(1, Math.min(5, c));
NDX._pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

// ============================================================
// 地图种子分享（V8.35 · 完善文档第13项·种子分享）
// mulberry32 确定性随机器 + withSeed 临时替换 Math.random：
// 在 withSeed 作用域内，generateMap 的全部随机（_rand/_pick/直接 Math.random）
// 都走种子流，同一种子必然生成相同地图布局；作用域外自动恢复真随机。
// 战斗/掉落等后续随机不受种子约束（MVP：仅复现地图布局，挑战相同路线）。
// ============================================================
NDX.mulberry32 = function (a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};
NDX.withSeed = function (seed, fn) {
  const rng = NDX.mulberry32(seed);
  const orig = Math.random;
  Math.random = rng; // 种子作用域内全局替换，保证 generateMap 全部随机可复现
  try { return fn(); }
  finally { Math.random = orig; }
};
NDX.SEED_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // 去易混淆 0/O/1/I/L
NDX.encodeSeed = function (n) {
  let s = '';
  let x = Math.abs(n | 0);
  do { s = NDX.SEED_ALPHABET[x % NDX.SEED_ALPHABET.length] + s; x = Math.floor(x / NDX.SEED_ALPHABET.length); }
  while (x > 0 && s.length < 6);
  while (s.length < 6) s = NDX.SEED_ALPHABET[0] + s;
  return s;
};
NDX.decodeSeed = function (code) {
  if (!code) return null;
  const s = String(code).trim().toUpperCase();
  if (!/^[A-Z2-9]{4,8}$/.test(s)) return null;
  let n = 0;
  for (let i = 0; i < s.length; i++) {
    const idx = NDX.SEED_ALPHABET.indexOf(s[i]);
    if (idx < 0) return null;
    n = n * NDX.SEED_ALPHABET.length + idx;
  }
  return n;
};

// ============================================================
// P1 Seed 播种扩展（V3 §4.2）：整局「候选流」确定性
// 现状（MVP）：withSeed 仅约束地图布局（作用域最短路只包 generateMap），
//   劫印/装备三选一候选流仍走全局 Math.random（不可复盘）。
// 本扩展：把开局 seed 派生一条整局随机器 NDX._runRng，供「三选一候选流」
//   （劫印 offerSeals / 装备 offerEquipReward 的加权/等权抽取）消费；
//   同种子 + 相同状态 → 相同候选流（可复盘、可测平衡）。
// 设计边界：战斗过程随机（命中/暴击/词缀）**不受**播种约束——仍走真随机，
//   保留「看玩家实力与局内操作」的峰谷；播种只锁「你看到哪些构筑选择」。
// 未播种（NDX._runRng 为空）时 runRandom 退化为 Math.random，行为等价不回归。
// ============================================================
NDX._runRng = null;
NDX.initRunRng = function (seedNum) {
  const n = (typeof seedNum === 'number') ? seedNum : Math.floor(Math.random() * 2147483647);
  NDX._runRng = NDX.mulberry32(n);
  return NDX._runRng;
};
NDX.clearRunRng = function () { NDX._runRng = null; };
// 候选流随机：播种时走整局流，否则真随机
NDX.runRandom = function () { return NDX._runRng ? NDX._runRng() : Math.random(); };
NDX.runRandInt = function (min, max) { return Math.floor(NDX.runRandom() * (max - min + 1)) + min; };
// 权重随机：按 weights 抽取下标（与 offerSeals 原逻辑等价，仅随机源切到播种流）
NDX.runWeightedPick = function (weights) {
  if (!weights || !weights.length) return -1;
  const wsum = weights.reduce((a, b) => a + b, 0);
  if (wsum <= 0) return Math.floor(NDX.runRandom() * weights.length);
  let roll = NDX.runRandom() * wsum;
  for (let i = 0; i < weights.length; i++) { roll -= weights[i]; if (roll <= 0) return i; }
  return weights.length - 1;
};
