// =============================================================
// data_favor.js — 《逆道西行》赐福加成系统 · ORDER_BLESSINGS/favorBonus
// 从 data.js 拆分（2026-08-31）：独立维护赐福加成系统
// 全局命名空间 NDX（同时挂到 window，兼容其他文件以 window.NDX 引用）
// =============================================================
window.NDX = window.NDX || {};
var NDX = window.NDX;

NDX.ORDER_BLESSINGS = [
  { id: 'order_atk', name: '佛臂·力', desc: '攻击 +2% / 级', per: 0.02, stat: 'atk' },
  { id: 'order_def', name: '佛心·守', desc: '防御 +2% / 级', per: 0.02, stat: 'dr' },
  { id: 'order_hp',  name: '莲台·安', desc: '气血 +2% / 级', per: 0.02, stat: 'maxHp' },
  { id: 'order_eva', name: '净瓶·慧', desc: '闪避 +1% / 级', per: 0.01, stat: 'eva' },
  { id: 'order_cri', name: '菩提·悟', desc: '暴击 +1% / 级', per: 0.01, stat: 'cri' },
];
// 混沌赐福定义：挣脱桎梏，单级收益更高，自带永久属性惩罚（防御 -1%/级）
NDX.CHAOS_BLESSINGS = [
  { id: 'chaos_atk',  name: '魔爪·狂',  desc: '攻击 +3% / 级', per: 0.03, stat: 'atk' },
  { id: 'chaos_ls',   name: '魔血·沸',  desc: '吸血 +2% / 级', per: 0.02, stat: 'lifesteal' },
  { id: 'chaos_cri',  name: '业火·焚',  desc: '暴击伤害 +3% / 级', per: 0.03, stat: 'criMult' },
  { id: 'chaos_dr',   name: '魔骨·硬',  desc: '减伤 +2% / 级', per: 0.02, stat: 'dr' },
  { id: 'chaos_matk', name: '魔念·噬',  desc: '法强 +2% / 级', per: 0.02, stat: 'matk' },
];
// 混沌固有代价：每级混沌赐福，防御 -1%
NDX.CHAOS_DEF_PENALTY_PER_LV = 0.01;
// 因果反噬：每提升一层混沌赐福，秩序赐福总效果降低 0.5%
NDX.ORDER_DILUTE_PER_CHAOS = 0.005;

// 把 orderLv / chaosLv 折算为百分比倍率（写入 favor 存档）
NDX.favorLevelToBonus = function (fv) {
  const orderLv = (fv && fv.orderLv) || 0;
  const chaosLv = (fv && fv.chaosLv) || 0;
  const orderMult = Math.max(0, 1.0 - chaosLv * NDX.ORDER_DILUTE_PER_CHAOS); // 混沌单向稀释
  const chaosMult = 1.0; // 混沌倍率固定不受秩序影响
  const out = {
    orderLv: orderLv, chaosLv: chaosLv,
    orderMult: orderMult, chaosMult: chaosMult,
    order: {}, chaos: {},
    chaosDefPenalty: chaosLv * NDX.CHAOS_DEF_PENALTY_PER_LV,
  };
  NDX.ORDER_BLESSINGS.forEach(function (b) {
    out.order[b.stat] = (out.order[b.stat] || 0) + b.per * orderLv * orderMult;
  });
  NDX.CHAOS_BLESSINGS.forEach(function (b) {
    out.chaos[b.stat] = (out.chaos[b.stat] || 0) + b.per * chaosLv * chaosMult;
  });
  return out;
};

// 将双线赐福注入本局 state（对接 game.js buildOpeningBlessing）
// 对接代码（策划案定稿）：
//   NDX.applyBlessing = function(state) {
//     const fv = NDX.loadFavor();
//     const b = NDX.favorLevelToBonus(fv);
//     state.bonusTi.atk    += (b.order.atk||0) + (b.chaos.atk||0);
//     state.bonusTi.dr     += (b.order.dr||0)  + (b.chaos.dr||0) - b.chaosDefPenalty;
//     state.bonusTi.maxHp  += (b.order.maxHp||0);
//     state.bonusTi.eva    += (b.order.eva||0);
//     state.bonusTi.cri    += (b.order.cri||0);
//     state.bonusTi.lifesteal += (b.chaos.lifesteal||0);
//     state.bonusTi.criMult   += (b.chaos.criMult||0);
//     state.bonusTi.matk      += (b.chaos.matk||0);
//   }
// 将双线赐福注入本局结算面板。
// 注意：computeStats 对 bonus.ti 是「加法」合并，而赐福是「百分比」增益，
// 故此处（策划案定稿）对 computeStats 返回的 base 做「百分比乘区」，避免数值失真。
// 对接 game.js stats()：在 const base = NDX.computeStats(...) 之后调用本函数。
//   NDX.applyBlessing(base, NDX.loadFavor());
NDX.applyBlessing = function (base, _fv) {
  const fv = _fv || NDX.loadFavor();
  const b = NDX.favorLevelToBonus(fv);
  if ((fv.orderLv || 0) <= 0 && (fv.chaosLv || 0) <= 0) return base; // 未升级则不改动
  const ti = base.ti, yuan = base.yuan;
  // 百分比乘区（经混沌单向稀释后的秩序 + 不受影响的混沌）
  if (ti && b.order.atk)   ti.atk    = Math.round(ti.atk * (1 + b.order.atk));
  if (ti && b.order.maxHp) ti.maxHp  = Math.round(ti.maxHp * (1 + b.order.maxHp));
  if (ti && b.order.dr)    ti.dr     = Math.min(0.85, ti.dr + b.order.dr);
  if (ti && b.order.eva)   ti.eva    = Math.min(0.6, ti.eva + b.order.eva);
  if (ti && b.order.cri)   ti.cri    = Math.min(1, ti.cri + b.order.cri);
  if (ti && b.chaos.atk)   ti.atk    = Math.round(ti.atk * (1 + b.chaos.atk));
  if (ti && b.chaos.matk)  yuan.matk = Math.round(yuan.matk * (1 + b.chaos.matk));
  if (ti && b.chaos.dr)    ti.dr     = Math.min(0.85, ti.dr + b.chaos.dr - b.chaosDefPenalty);
  if (ti && b.chaos.criMult) ti.criMult = (ti.criMult || 1.6) + b.chaos.criMult;
  if (ti && b.chaos.lifesteal) base.lifesteal = +((base.lifesteal || 0) + b.chaos.lifesteal).toFixed(3);
  if (ti) { ti.atk = Math.round(ti.atk); ti.maxHp = Math.round(ti.maxHp); ti.hp = ti.maxHp; base.hp = ti.maxHp; }
  return base;
};

// ============================================================
// 轮回殿·中央核心形态 & 背景光影（依据全局存档，非单局临时善恶）
// ============================================================

// 长期善恶倾向：累计 good / evil 值（在局末 recordRunEnd 时登记）
NDX.TRACK_KEY = 'ndx_track';
NDX.loadTrack = function () {
  // V8.41 统一使用NDX.SaveSystem，删除降级逻辑
  const o = NDX.SaveSystem.load(NDX.TRACK_KEY, { good: 0, evil: 0 });
  return { good: Math.max(0, (o && o.good) || 0), evil: Math.max(0, (o && o.evil) || 0) };
};
NDX.saveTrack = function (t) {
  // V8.41 统一使用NDX.SaveSystem，删除降级逻辑
  NDX.SaveSystem.save(NDX.TRACK_KEY, { good: t.good || 0, evil: t.evil || 0 });
};
NDX.trackBodyClass = function () {
  const t = NDX.loadTrack();
  if (t.good > t.evil && t.good > 0) return 'save-good-track';
  if (t.evil > t.good && t.evil > 0) return 'save-evil-track';
  return '';
};

// 正道 / 逆道全路线收集完成度判断
NDX.loadAch = NDX.loadAch || function () { return {}; };
NDX.nanbuCompletion = function () {
  const ach = NDX.loadAch() || [];
  const achSet = Array.isArray(ach) ? ach : Object.keys(ach || {});
  const all = NDX.NANBU_ALL || [];
  let zheng = 0, zhengTotal = 0, ni = 0, niTotal = 0;
  all.forEach(function (n) {
    if (!n || !n.side) return;
    if (n.side === '正果') { zhengTotal++; if (achSet.indexOf('nanbu_' + n.id) >= 0) zheng++; }
    else if (n.side === '逆道') { niTotal++; if (achSet.indexOf('nanbu_' + n.id) >= 0) ni++; }
  });
  return {
    zheng: zheng, zhengTotal: zhengTotal, zhengAll: zhengTotal > 0 && zheng >= zhengTotal,
    ni: ni, niTotal: niTotal, niAll: niTotal > 0 && ni >= niTotal,
    both: false,
  };
};

// 计算中央核心形态（返回 key / 名称 / 文案）
NDX.coreForm = function () {
  const cycle = (typeof NDX.getCycle === 'function') ? NDX.getCycle() : 1;
  const comp = NDX.nanbuCompletion();
  if (comp.zhengAll && comp.niAll) {
    return { key: 'kong', name: '空莲台', desc: '勘破虚实，混元如一。', hunyuan: true };
  }
  if (comp.niAll) {
    return { key: 'sui', name: '碎箍·乱', desc: '箍碎枷锁，道由己寻。', hunyuan: false };
  }
  if (comp.zhengAll) {
    return { key: 'fo', name: '佛像·伪', desc: '以业为基，塑佛亦是魔。', hunyuan: false };
  }
  if (cycle >= 2) {
    const cracks = Math.max(0, cycle - 1);
    return { key: 'lie', name: '紧箍·裂', desc: '裂痕渐深，业火灼心。', cracks: cracks, hunyuan: false };
  }
  return { key: 'chu', name: '紧箍·初', desc: '头上金箍，心中戒律。', hunyuan: false };
};

// 混元淬炼解锁条件：双线全收集 + 空莲台 + 劫印道途成势
// V8.6x 命痕并入劫印：原「命痕满级」前提去除，改以「劫印道途层数」衡量
// V3 §1.1 砍生效格：改以「任一道途层数 ≥ 6」（阶段碑第二档激活）作为劫印成势门槛，
//   层数按全部持有印自动累计（金=2/红=3），无需玩家管理生效位。
NDX.hunyuanUnlocked = function (s) {
  const form = NDX.coreForm();
  if (!form.hunyuan) return false;
  if (typeof NDX.sealDaoLayerSum === 'function') {
    return ['战', '渡', '缘', '夺', '隐', '逆'].some((d) => NDX.sealDaoLayerSum(s, d) >= 6);
  }
  return (s && s.seals ? s.seals.length : 0) >= 6;
};

// ============================================================
// 混元淬炼（终局规则改写系统）
// 专属货币：混元点（fv.hunyuan）
// 获取：天道劫稳定产出 / 每10层批量奖励 / 成就全收集一次性发放
// ============================================================
