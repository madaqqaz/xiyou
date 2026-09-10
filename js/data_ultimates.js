// =============================================================
// data_ultimates.js — 《逆道西行》终极技能系统 · ULTIMATES/ultimateTier/ultimateOf
// 从 data.js 拆分（2026-08-31）：独立维护终极技能系统
// 全局命名空间 NDX（同时挂到 window，兼容其他文件以 window.NDX 引用）
// =============================================================
window.NDX = window.NDX || {};
var NDX = window.NDX;

NDX.ULTIMATES = {
  tangseng: [
    { tier: 1, name: '金蝉禅唱', cd: 4, mult: 1.2, kind: 'heal-dmg', desc: '金蝉之音渡己渡敌：法伤 + 回血' },
    { tier: 2, name: '地藏禅唱', cd: 4, mult: 1.6, kind: 'shield-dmg', desc: '玄武帝相：法伤 + 护盾' },
    { tier: 3, name: '一言成刃', cd: 4, mult: 2.2, kind: 'wish-blade', desc: '弃经者：愿力化刃，无视防御' }
  ],
  wukong: [
    { tier: 1, name: '当头一棒', cd: 4, mult: 1.8, kind: 'crit-dmg', desc: '齐天棍意：暴击重击' },
    { tier: 2, name: '千钧破军', cd: 4, mult: 2.4, kind: 'aoe-dmg', desc: '破军之势：重击 + 破甲' },
    { tier: 3, name: '大闹天宫', cd: 4, mult: 3.0, kind: 'ignore-dmg', desc: '齐天大圣：多段 + 无视防御' }
  ],
  bajie: [
    { tier: 1, name: '天蓬一耙', cd: 4, mult: 1.6, kind: 'drain-dmg', desc: '九齿钉耙：重击 + 吸血' },
    { tier: 2, name: '吞天噬地', cd: 4, mult: 2.2, kind: 'drain-dmg', desc: '贪狼之相：大吸血 + 自愈' },
    { tier: 3, name: '净坛吞天', cd: 4, mult: 2.8, kind: 'ignore-dmg', desc: '吞天净坛：吸血 + 真伤' }
  ],
  shaseng: [
    { tier: 1, name: '卷帘覆水', cd: 4, mult: 1.2, kind: 'guard-dmg', desc: '降妖宝杖：防御反击' },
    { tier: 2, name: '厚土金身', cd: 4, mult: 1.6, kind: 'guard-dmg', desc: '厚土守心：减伤 + 反击' },
    { tier: 3, name: '万劫镇狱', cd: 4, mult: 2.0, kind: 'guard-dmg', desc: '卷帘镇妖：反震 + 减伤' }
  ],
  xiaobailong: [
    { tier: 1, name: '白龙翻江', cd: 4, mult: 1.5, kind: 'multi-dmg', desc: '白龙出水：多段法伤' },
    { tier: 2, name: '无迹逆鳞', cd: 4, mult: 2.0, kind: 'multi-dmg', desc: '幽行匿踪：多段 + 闪避' },
    { tier: 3, name: '逆鳞化龙', cd: 4, mult: 2.6, kind: 'ignore-dmg', desc: '逆鳞白龙：多段 + 必中' }
  ]
};
// 当前绝招阶次：隐藏职 3 → 任一道命数≥18（一转）2 → 基础 1
NDX.ultimateTier = function (s) {
  if (!s) return 1;
  if (s.flags && s.flags.jobConfirm) return 3;
  const f = s.fate || {};
  // V8.58 修复：原代码 fate>=12 即返回2阶，与注释"任一道命数≥18（一转）2"不一致
  // 2阶大招应在一转（命数≥18）时解锁，避免提前解锁导致数值膨胀
  for (const k of ['渡', '逆', '战', '夺', '缘', '隐']) if ((f[k] || 0) >= 18) return 2;
  return 1;
};
NDX.ultimateOf = function (heroId, tier) {
  const list = (NDX.ULTIMATES && NDX.ULTIMATES[heroId]) || [];
  return list.find((u) => u.tier === (tier || 1)) || list[0] || null;
};


// ============================================================
// 逆道经文系统（选逆即得 · 攒齐自动合成）
// 前提：无（不设门槛）——凡选「逆」道抉择，即随机拾得一部逆道经文之碎片；
// 机制：每部逆道经文拆 3 段碎片（·上/·中/·下 等），集齐一部之 3 段即「自动合成全本」，
//       全本存入 s.niSutras，由 computeStats 读取提供被动战力（与佛经全本同管线）。
//       逆道经文即「暗黑西游」之经——真经是锁，逆道之经方是钥匙。
// ============================================================
