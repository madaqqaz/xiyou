// =============================================================
// data_quota.js — 《逆道西行》地区配额系统 · REGION_QUOTA/QUOTA_LABEL/quotaCheck/addQuota
// 从 data.js 拆分（2026-08-31）：独立维护地区配额系统（万世剑冢式配额制）
// 全局命名空间 NDX（同时挂到 window，兼容其他文件以 window.NDX 引用）
// =============================================================
window.NDX = window.NDX || {};
var NDX = window.NDX;

// V8.34 六道配额生成器（N=战斗基数）：主路径+替代路径，防"选道但地区内无对应节点"卡死
// P2-2 降低与六道系统耦合：增加更多替代路径，让玩家有更多选择
//   渡: 渡抉择N 或 诵经N+1 或 休息N+1
//   战: 战斗N 或 精英1 或 夺抉择1+战斗N-1
//   缘: 缘抉择N 或 休息N 或 渡抉择N
//   夺: 夺抉择1+战斗N-1 或 精英1+战斗N-1 或 商店1+战斗N-1
//   隐: 隐抉择1+战斗N-1 或 隐抉择1+精英1 或 事件1+战斗N-1
//   逆: 逆抉择1+战斗N-1 或 逆抉择1+心魔5 或 精英1+战斗N-1
NDX._quotaSix = function (N) {
  const _b = Math.max(1, (N || 2) - 1);
  return {
    渡: { main: { ferry: N }, alt: { chant: N + 1 }, alt2: { rest: N + 1 } },
    战: { main: { battle: N }, alt: { elite: 1 }, alt2: { duo: 1, battle: _b } },
    缘: { main: { yuan: N }, alt: { rest: N }, alt2: { ferry: N } },
    夺: { main: { duo: 1, battle: _b }, alt: { elite: 1, battle: _b }, alt2: { shop: 1, battle: _b } },
    隐: { main: { yin: 1, battle: _b }, alt: { yin: 1, elite: 1 }, alt2: { event: 1, battle: _b } },
    逆: { main: { rebel: 1, battle: _b }, alt: { rebel: 1, xinmo: 5 }, alt2: { elite: 1, battle: _b } },
  };
};

NDX.REGION_QUOTA = {
  // 第一章（act1）：无配额（新手线性教学），只给空壳占位
  1: null,
  // 第二章·白骨岭之劫（难15-20）：融合节点 + 中间层 + Boss。六道配额主/替代路径。
  2: {
    // 玩家进入两界山时选定主攻道（六选一），本地区只需满足该道的配额
    // main 为必选主路径（多数自然达成），alt 为替代路径（选道但地区内无该道节点时兜底）
    渡: { main: { ferry: 2 }, alt: { chant: 3 } },       // 选渡2次 或 诵经3次
    战: { main: { battle: 2 }, alt: { elite: 1 } },      // 战斗2场 或 精英1场
    缘: { main: { yuan: 2 },  alt: { rest: 2 } },        // 选缘2次 或 休息2次
    夺: { main: { duo: 1, battle: 1 }, alt: { elite: 1, battle: 1 } }, // 夺抉择1+战1 或 精英1+战1
    隐: { main: { yin: 1, battle: 1 }, alt: { yin: 1, elite: 1 } },    // 隐抉择1+战1 或 隐抉择1+精英1
    逆: { main: { rebel: 1, battle: 1 }, alt: { rebel: 1, xinmo: 5 } }, // 逆抉择1+战1 或 逆抉择1+心魔5
  },
  // 地区配额（9 章制，键 = 章号 1~9，与 s.act / ACT_RANGES 对齐；V9.26 收敛自旧 17 地区制）
  //   战斗基数 N 按章内难数递增：章3=2 / 章4~6=3 / 章7~9=4
  //   原 17 地区键（act3=黄风岭…act17=凌云渡）已废弃，避免与 9 章制 s.act 错位导致配额错配。
  // 🩸 2026-09-28 订正：旧注释整体前移两章（键3 标「第一章·黄风岭」、键9 标「第七章」），
  //   与 ACT_RANGES 的真实分章对不上。以下按 data_region_config.js 的 ACT_RANGES 逐键对齐。
  3: NDX._quotaSix(2),   // 第三章·火云洞之劫（难21-31，11难）
  4: NDX._quotaSix(3),   // 第四章·金兜山之劫（难32-41，10难）
  5: NDX._quotaSix(3),   // 第五章·女儿国之劫（难42-46，5难）
  6: NDX._quotaSix(3),   // 第六章·火焰山之劫（难47-51，5难）
  7: NDX._quotaSix(4),   // 第七章·狮驼岭之劫（难52-64，13难）
  8: NDX._quotaSix(4),   // 第八章·比丘国之劫（难65-75，11难）
  9: NDX._quotaSix(4),   // 第九章·天竺灵山之劫（难76-81，6难）
};
// 默认配额兜底：未配置地区 → 战 battle≥2（保底可通，不卡玩家）
NDX.regionQuotaOf = function (act) {
  const q = NDX.REGION_QUOTA[act];
  if (q && Object.keys(q).length) return q;
  return { 战: { main: { battle: 2 }, alt: { elite: 1 } } };
};
// 地区是否启用配额制（第一章不加，其余地区启用）
NDX.quotaEnabled = function (act) {
  return act > 1 && !!NDX.REGION_QUOTA[act];
};
// 单计数项是否达标（need=0 视为无需，直接达标）
NDX._quotaItemMet = function (quota, cnt) {
  if (!quota) return true;
  return (cnt || 0) >= (quota || 0);
};
// 判定一组配额（main 或 alt 集合）是否全部满足
NDX._quotaSetMet = function (set, counts) {
  if (!set || !Object.keys(set).length) return true;
  return Object.keys(set).every((k) => NDX._quotaItemMet(set[k], counts[k]));
};
// 主攻道配额判定：返回 { met, mainMet, altMet, missingMain:[...], missingAlt:[...] }
NDX.quotaCheck = function (s, dao) {
  const act = (s && s.act) || 1;
  if (!NDX.quotaEnabled(act)) return { met: true, mainMet: true, altMet: true, missingMain: [], missingAlt: [] };
  const q = NDX.regionQuotaOf(act);
  const dq = q[dao] || q[Object.keys(q)[0]];
  if (!dq) return { met: true, mainMet: true, altMet: true, missingMain: [], missingAlt: [] };
  const counts = (s && s.quota) || {};
  const mainMet = NDX._quotaSetMet(dq.main, counts);
  const altMet = NDX._quotaSetMet(dq.alt, counts);
  const missingMain = dq.main ? Object.keys(dq.main).filter((k) => !NDX._quotaItemMet(dq.main[k], counts[k])) : [];
  const missingAlt = dq.alt ? Object.keys(dq.alt).filter((k) => !NDX._quotaItemMet(dq.alt[k], counts[k])) : [];
  return { met: mainMet || altMet, mainMet, altMet, missingMain, missingAlt, dao, counts };
};
// 配额项中文标签（UI 展示用）
NDX.QUOTA_LABEL = {
  battle: '战斗', elite: '精英', ferry: '渡·抉择', war: '战·抉择', yuan: '缘·抉择',
  yin: '隐·抉择', duo: '夺·抉择', rebel: '逆·抉择', chant: '诵经', xinmo: '心魔', rest: '歇息', sutra: '渡经',
  // S1-4 同族：alt2 兜底路径使用的街市/事件计数，原缺标签会导致 UI 显示 undefined
  shop: '街市', event: '事件'
};
// 六道主攻道候选（进入配额地区时选择；第一章不弹）
NDX.MAIN_DAO_ORDER = ['渡', '战', '缘', '夺', '隐', '逆'];
// 六道主攻道说明（选择界面 tip）
NDX.MAIN_DAO_DESC = {
  渡: '渡化群生，诵经渡敌——本地区多选「渡」，可诵经蓄势',
  战: '以杀止劫，锋芒毕露——本地区多战，最快攒满战斗配额',
  缘: '结缘诸方，休养生息——本地区多选「缘」，可歇息回气',
  夺: '夺宝争胜，多战多取——本地区战斗+精英双修，装备最丰',
  隐: '隐迹避世，留得青山——本地区选「隐」+ 战斗，闪避保命',
  逆: '我命由我，逆天而行——本地区选「逆」+ 战斗，心魔换锋',
};
// 配额计数累计（单次 +1）：读 s.quota 并累加指定 key
NDX.addQuota = function (s, key, n) {
  if (!s) return;
  if (!s.quota) s.quota = {};
  s.quota[key] = (s.quota[key] || 0) + (n || 1);
};
// 配额计数读取（缺省 0）
NDX.quotaOf = function (s, key) {
  return (s && s.quota && s.quota[key]) || 0;
};
// 当前主攻道（未选则取地区默认首道）
NDX.mainDaoOf = function (s) {
  if (s && s.mainDao) return s.mainDao;
  const q = NDX.regionQuotaOf((s && s.act) || 1);
  return Object.keys(q)[0] || '战';
};
// =============================================================
// 六道池刷新口径（V9.22 · 用户 2026-09-21 定调）：
//   取玩家「六道抉择累计次数最多」的那一道，作为六道池（pool:'dao'）的刷新依据。
//   计数真源 = s.fate[道]（game_event_3.js 每次六道抉择 +1）。
//   全零/平手时回退 mainDaoOf（地区选择锚点），保证永不为空。
// =============================================================
NDX.mostDaoOf = function (s) {
  const order = NDX.MAIN_DAO_ORDER || ['渡', '战', '缘', '夺', '隐', '逆'];
  const f = (s && s.fate) || {};
  let best = null, bestN = 0;
  for (const d of order) { const n = +f[d] || 0; if (n > bestN) { bestN = n; best = d; } }
  if (best) return best;
  return NDX.mainDaoOf(s);
};
