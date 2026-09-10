// =============================================================
// data_chants.js — 《逆道西行》本命诵经系统 · CHANTS / chantOf
// 与 data_ultimates.js 同构：给「诵经」按钮补英雄身份分镜
// （Model C 英雄身份透镜：绝招已有 ULTIMATES，诵经补 CHANTS，使三键主动技都带英雄辨识度）
// kind 映射到 combat.js applyActiveIntervention 已支持的原语：
//   heal / shield / trueDmg / critHit / ignoreDef
// =============================================================
window.NDX = window.NDX || {};
var NDX = window.NDX;

// 本命诵经：每个英雄「经」按钮的基础形态（渡系禅光，法术伤害 + 本命特效）
// —— 唐僧为法伤/诵经本命，故 zen-heal 的回血与法伤倍率最高，与其设计定位一致
NDX.CHANTS = {
  tangseng:    { name: '禅光诵经', cd: 2, mult: 1.6, kind: 'zen-heal',    desc: '禅光普照：法伤并大幅回血（本命·渡）' },
  wukong:      { name: '战意梵音', cd: 2, mult: 1.7, kind: 'war-buff',    desc: '战吼梵音：法伤并激昂重击（本命·战）' },
  bajie:       { name: '贪嗔真言', cd: 2, mult: 1.6, kind: 'glut-ton',    desc: '贪狼真言：法伤并吸血自愈（本命·缘）' },
  shaseng:     { name: '镇妖陀罗', cd: 2, mult: 1.5, kind: 'ward-mantra', desc: '镇妖陀罗：法伤并凝护反震（本命·夺）' },
  xiaobailong: { name: '隐龙密咒', cd: 2, mult: 1.6, kind: 'veil-mantra', desc: '隐龙密咒：法伤并凝匿必中（本命·隐）' }
};

NDX.chantOf = function (heroId) {
  return (NDX.CHANTS && NDX.CHANTS[heroId]) || NDX.CHANTS['tangseng'];
};
