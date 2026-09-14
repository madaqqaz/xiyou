// =============================================================
// data_trial_tip.js — 六道道评 / 道派定位 统一注入（2026-09-14 P1 整改 #8）
// ---------------------------------------------------------------------------
// 问题（实测）：观音道评只覆盖 6/302 = 2% 的选项，longDesc（道派定位）同样只有 6 条。
//   根因不是「没写」，而是**只写在第 1 难的六个选项上就停了**——六道模板本就是
//   每人一套的固定文案（渡/缘/战/夺/隐/逆），第 2~81 难录入时没有复制过去。
//   于是六道引导只在开局第 1 难存在，之后 98% 的抉择没有任何道派说明。
//
// 方案：把第 1 难那六套原文抽为单一真源 DAO_TIP_LIB，加载时遍历 TRIAL_LIB 全部选项，
//   按选项自身的道派（option.fate 优先，回退 option.key）补全缺失的 guanyinTip / longDesc。
//   已手写的（第 1 难）原样保留，不覆盖——只补缺口，不改存量。
//
// 为什么用「运行时注入」而不是改 81 难源码：
//   81 难 × ~4 选项 ≈ 320 处，正则批量改写大文件风险高（一次误替换就是几百行文案损坏）；
//   注入式只增不减、可门禁验证，且模板本身只有 6 条，改一处即全量生效。
// =============================================================
window.NDX = window.NDX || {};
var NDX = window.NDX;

// —— 六道道评 / 道派定位模板（单一真源：第 1 难「金蝉遭贬」六选项的 guanyinTip/longDesc 已与本表逐字对齐）——
//   注：此前本表为第 1 难原文的扩写版，导致「模板 ≠ 难1本地文案」两套口径；
//   已按门禁 _verify_trial_tip T4 收敛为一致，后续改文案请只改本表 + 同步难1（或删难1本地副本走注入）。
NDX.DAO_TIP_LIB = {
  渡: {
    guanyinTip: '观音菩萨：渡者，慈悲顺命，渡己渡人。诵经可渡敌，钵盂可承佛之命——此道仁厚绵长，然杀伐不足，遇强魔时需借法宝之力。',
    longDesc: '渡道 · 慈悲顺命 · 诵经渡敌 · 观音结缘 · 紫金钵盂',
  },
  缘: {
    guanyinTip: '观音菩萨：缘者，广结善缘，随缘而安。防御加身，肉生成圣——此道稳如磐石，然进取不足，需借劫印突破瓶颈。',
    longDesc: '缘道 · 广结善缘 · 防御加身 · 肉生成圣 · 稳如磐石',
  },
  战: {
    guanyinTip: '观音菩萨：战者，以力破局，杀伐果断。以杀止杀，以力破法——此道威猛却折寿，每战需速战速决，久战必亏。',
    longDesc: '战道 · 以力破局 · 杀伐果断 · 以杀止杀 · 威猛折寿',
  },
  夺: {
    guanyinTip: '观音菩萨：夺者，巧取豪夺，利益至上。夺取宝物，万宝附体——此道富贵险中求，然失道寡助，心魔易涨，需持正念压之。',
    longDesc: '夺道 · 巧取豪夺 · 万宝附体 · 富贵险求 · 心魔易涨',
  },
  隐: {
    guanyinTip: '观音菩萨：隐者，避世潜行，明哲保身。万物成空，无道无我——此道身法卓绝，然正面交锋乏力，需借闪避与暴击制敌。',
    longDesc: '隐道 · 避世潜行 · 明哲保身 · 身法卓绝 · 闪避暴击',
  },
  逆: {
    guanyinTip: '观音菩萨：逆者，逆天改命，不走寻常。我命由我，普度众人——此道最为凶险，须先炼成一世正果（完美通关）方得入此道，然一旦入道，天地皆为之侧目。',
    longDesc: '逆道 · 逆天改命 · 我命由我 · 最为凶险 · 天地侧目',
  },
};

// 遍历 TRIAL_LIB，为缺失道评/道派定位的选项注入模板（只补缺，不覆盖存量）
// 返回注入统计，供门禁与调试使用。
NDX.injectDaoTips = function () {
  const stat = { options: 0, guanyin: 0, longDesc: 0, noDao: 0 };
  const lib = NDX.TRIAL_LIB || {};
  Object.keys(lib).forEach((id) => {
    const tr = lib[id];
    if (!tr || !Array.isArray(tr.options)) return;
    tr.options.forEach((o) => {
      if (!o) return;
      stat.options++;
      const dao = o.fate || o.key;
      const tpl = NDX.DAO_TIP_LIB[dao];
      if (!tpl) { stat.noDao++; return; }
      if (!o.guanyinTip) { o.guanyinTip = tpl.guanyinTip; stat.guanyin++; }
      if (!o.longDesc) { o.longDesc = tpl.longDesc; stat.longDesc++; }
    });
  });
  return stat;
};

if (NDX.TRIAL_LIB) NDX.injectDaoTips();
