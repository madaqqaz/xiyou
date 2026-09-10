// =============================================================
// data_rank.js — 《逆道西行》排行榜系统 · RANK_KEY/loadRank/saveRank/submitRank
// 从 data.js 拆分（2026-08-31）：独立维护排行榜系统
// 全局命名空间 NDX（同时挂到 window，兼容其他文件以 window.NDX 引用）
// =============================================================
window.NDX = window.NDX || {};
var NDX = window.NDX;

NDX.RANK_KEY = 'xynj_leaderboard_v1';
NDX.RANK_MAX = 20;
// 加载排行榜
NDX.loadRank = function () {
  // V8.41 统一使用NDX.SaveSystem，删除降级逻辑
  const data = NDX.SaveSystem.load(NDX.RANK_KEY, []);
  return Array.isArray(data) ? data : [];
};
// 保存排行榜
NDX.saveRank = function (arr) {
  // V8.41 统一使用NDX.SaveSystem，删除降级逻辑
  NDX.SaveSystem.save(NDX.RANK_KEY, arr.slice(0, NDX.RANK_MAX));
};
// 提交一条记录（完美/不完美皆可进对应榜；仅两种结局回长安可进榜），返回该榜内排名（1-based），未进榜返回-1
// V8.55 双榜：完美结局进「朝代僧」榜、不完美结局进「朝代和尚」榜；每条记录展示 朝代+僧(和尚) + 英雄结局 + 玩家留名
NDX.submitRank = function (record) {
  if (!record) return -1;
  const board = record.perfect ? 'perfect' : 'imperfect';
  const arr = NDX.loadRank();
  const _diff = record.difficulty || 'normal';
  const _diffCfg = (NDX.DIFFICULTY && NDX.DIFFICULTY[_diff]) || NDX.DIFFICULTY.normal;
  const _scoreMult = _diffCfg.scoreMult || 1;
  const _score = Math.round((record.life || 0) * _scoreMult);
  const rec = {
    board: board,
    name: record.name || '无名行脚',      // 朝代+僧 / 朝代+和尚
    heroTitle: record.heroTitle || (perfect ? '取经人' : '行者'),
    player: record.player || '',
    dynasty: record.dynasty || '唐',
    cycle: record.cycle || 1,
    life: record.life || 0,
    daotu: record.daotu || '',
    time: record.time || Date.now(),
    difficulty: _diff,
    difficultyName: _diffCfg.name || '普通',
    score: _score,
  };
  arr.push(rec);
  // 同榜内按分数降序，各榜各保留前 RANK_MAX；整体保留前 RANK_MAX（双榜合计上限，兼顾旧榜容量）
  const byBoard = { perfect: [], imperfect: [] };
  arr.forEach((r) => { if (byBoard[r.board]) byBoard[r.board].push(r); });
  const top = [];
  Object.keys(byBoard).forEach((b) => {
    byBoard[b].sort((a, b2) => (b2.score || 0) - (a.score || 0));
    top.push(...byBoard[b].slice(0, NDX.RANK_MAX));
  });
  NDX.saveRank(top);
  const bIdx = byBoard[board];
  const idx = bIdx.findIndex((r) => r.time === rec.time && r.name === rec.name);
  return idx >= 0 ? idx + 1 : -1;
};
// 取指定榜（'perfect' 完美 / 'imperfect' 不完美）的记录，按分数降序
NDX.loadRankBoard = function (board) {
  const arr = NDX.loadRank();
  const b = board === 'imperfect' ? 'imperfect' : 'perfect';
  return arr.filter((r) => r.board === b).sort((a, c) => (c.score || 0) - (a.score || 0));
};
// 清空排行榜
NDX.clearRank = function () { NDX.SaveSystem.remove(NDX.RANK_KEY); };
