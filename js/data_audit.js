// =============================================================
// data_audit.js — P2 Build可验收定义（auditBuild）+ 系统间协同共鸣（applyCrossResonance）
// 依据《逆道西行_系统简化与肉鸽核心回归_融合设计文档_V3.md》§5 / §6：
//   §5 Build 成形的可验收定义：主道途层数≥6 + 关键经/印到位≥2 + 至少1条 synergy 闭环
//   §6 系统间协同：劫印+经文 / 劫印+装备 / 经文+装备 / 三者大协同（共鸣词条）
// 挂载：combat.js computeStats 在 applySetResonance 之后调用 applyCrossResonance。
// 关键经/印以实际数据（SUTRA_DAO_TAG / SEAL_WORDS / SET_DAO）为真源——
//   doc 示例与代码道途标签冲突处（法华=缘、无量寿=夺、涅槃=缘、楞严=渡）以代码为准；
//   逆道关键经走逆藏（无字经/剔骨诀），缘道关键印以「金刚」承「金身」概念。
// =============================================================
window.NDX = window.NDX || {};
var NDX = window.NDX;

// ============================================================
// §5 Build 可验收定义
// 判定：主道途层数 ≥ AUDIT_MIN_LAYER（阶段碑第二档 6 层）
//      + 关键经/印到位 ≥ AUDIT_MIN_KEY（2 项）
//      + synergy 闭环（关键经+关键印双到位 + 装备道途与流派道一致）
// API：NDX.auditBuild(s) → { mainDao, formed, main, builds }（纯函数，供数据验证/UI 复用）
// ============================================================
NDX.AUDIT_MIN_LAYER = 6;   // 主道途层数阈值 N（V3 §5.2 六流派均 ≥6）
NDX.AUDIT_MIN_KEY = 2;     // 关键经/印到位阈值 M（经+印合计 ≥2 项）
NDX.AUDIT_BUILD_DEF = {
  渡: { name: '渡道法伤流', stat: 'matk', keySutras: ['su_full_xinjing', 'su_full_lengyan'], keySeals: ['渡厄'], desc: '心经/楞严经 + 渡厄劫印' },
  战: { name: '战道物攻流', stat: 'atk', keySutras: ['su_full_jingang', 'su_full_yuanjue'], keySeals: ['杀伐'], desc: '金刚经/圆觉经 + 杀伐劫印' },
  缘: { name: '缘道肉盾流', stat: 'dr', keySutras: ['su_full_fahua', 'su_full_huayan'], keySeals: ['金刚'], desc: '法华经/华严经 + 金刚劫印' },
  夺: { name: '夺道吸血流', stat: 'lifesteal', keySutras: ['su_full_wuliangshou', 'ni_full_pojie'], keySeals: ['吞纳'], desc: '无量寿经/破戒录 + 吞纳劫印' },
  隐: { name: '隐道闪避流', stat: 'eva', keySutras: ['su_full_tanjing', 'su_full_jieshenmi'], keySeals: ['匿踪'], desc: '六祖坛经/解深密经 + 匿踪劫印' },
  逆: { name: '逆道狂暴流', stat: 'reflect', keySutras: ['ni_full_wuzi', 'ni_full_tigujue'], keySeals: ['戾骨'], desc: '无字经/剔骨诀 + 戾骨劫印' },
};

NDX.auditBuild = function (s) {
  if (!s) return null;
  const owned = new Set((s.sutras || []).concat(s.niSutras || []));
  const sealNames = new Set((s.seals || []).filter(Boolean).map((x) => x.name));
  const equips = s.equips || [];
  const mainDao = NDX.playerDao(s);
  const builds = {};
  for (const dao of Object.keys(NDX.AUDIT_BUILD_DEF)) {
    const def = NDX.AUDIT_BUILD_DEF[dao];
    const layer = (NDX.sealDaoLayerSum ? NDX.sealDaoLayerSum(s, dao) : 0);
    const keySutrasOwned = def.keySutras.filter((fid) => owned.has(fid));
    const keySealsOwned = def.keySeals.filter((nm) => sealNames.has(nm));
    const keyOwned = keySutrasOwned.length + keySealsOwned.length;
    // synergy 闭环：关键经/印双到位 + 装备道途与流派道一致（§5.2 装备协同）
    const equipDaoMatch = equips.some((e) => e && e.set && NDX.setDao && NDX.setDao(e.set) === dao);
    const closedLoop = keySutrasOwned.length >= 1 && keySealsOwned.length >= 1 && equipDaoMatch;
    const formed = layer >= NDX.AUDIT_MIN_LAYER && keyOwned >= NDX.AUDIT_MIN_KEY && closedLoop;
    builds[dao] = {
      dao, def, layer,
      layerOk: layer >= NDX.AUDIT_MIN_LAYER,
      keySutrasOwned, keySealsOwned, keyOwned,
      keyOk: keyOwned >= NDX.AUDIT_MIN_KEY,
      equipDaoMatch, closedLoop, formed,
    };
  }
  const main = builds[mainDao] || null;
  return { mainDao, formed: !!(main && main.formed), main, builds };
};

// ============================================================
// §6 系统间协同 · 数据源辅助
// ============================================================
// 某道途已持有劫印枚数（按持有计，非层数）
NDX.sealDaoCount = function (s, dao) {
  return ((s && s.seals) || []).filter((x) => x && x.dao === dao).length;
};
// 某道途已合成经文全本数（渡藏+逆藏，按 SUTRA_DAO_TAG 归属计）
NDX.sutraDaoCount = function (s, dao) {
  let n = 0;
  ((s && s.sutras) || []).forEach((id) => { if (NDX.sutraDaoOf(id) === dao) n++; });
  ((s && s.niSutras) || []).forEach((id) => { if (NDX.sutraDaoOf(id) === dao) n++; });
  return n;
};
// 已合成经文全本总数（渡+逆）
NDX.totalSutras = function (s) {
  return ((s && s.sutras) || []).length + ((s && s.niSutras) || []).length;
};
// 套装件数统计：只计身体四槽（与 applySetResonance 同口径，组件/法宝/宠物不计）
NDX.equipSetCounts = function (equips) {
  const cnt = {};
  const _body = new Set(['weapon', 'armor', 'head', 'boots']);
  (equips || []).forEach((e) => { if (e && e.set && _body.has(e.slot)) cnt[e.set] = (cnt[e.set] || 0) + 1; });
  return cnt;
};
// 是否「混搭装备」：无任何套装达到 2 件身体槽（未成套装共鸣的散搭）
NDX.isMixedEquip = function (equips) {
  const cnt = NDX.equipSetCounts(equips);
  return !Object.keys(cnt).some((k) => cnt[k] >= 2);
};
// 英雄专属套装是否已上阵（含 treasure 槽；needTier2 时要求 setTier≥2 的「二阶」件）
NDX.heroSetEquipped = function (s, equips, needTier2) {
  if (!s || !s.hero || !NDX.HERO_SET_KEY) return null;
  const set = NDX.HERO_SET_KEY[s.hero];
  if (!set) return null;
  const _slots = new Set(['weapon', 'armor', 'head', 'boots', 'treasure']);
  const has = (equips || []).some((e) => e && e.set === set && _slots.has(e.slot) && (!needTier2 || (e.setTier || 0) >= 2));
  return has ? set : null;
};
// 某道途转职阶数（六道专职）
NDX.tierOf = function (s, dao) {
  return (s && s.flags && s.flags.tierUp && s.flags.tierUp.current && s.flags.tierUp.current[dao]) || 0;
};
// 英雄专属套装的共鸣词条名（取经人沿用 doc 定名：禅心稳固/锡杖镇魔；其余按流派命名）
NDX.HERO_SET_RESO = {
  取经人: { dr: '禅心稳固', atk: '锡杖镇魔' },
  悟空: { dr: '斗战稳固', atk: '齐天镇魔' },
  八戒: { dr: '净坛稳固', atk: '九齿镇魔' },
  沙僧: { dr: '卷帘稳固', atk: '降魔镇魔' },
  龙马: { dr: '白龙稳固', atk: '龙吟镇魔' },
};
NDX._heroSetResoName = function (s, kind) {
  const set = (s && s.hero && NDX.HERO_SET_KEY) ? NDX.HERO_SET_KEY[s.hero] : null;
  return (set && NDX.HERO_SET_RESO[set] && NDX.HERO_SET_RESO[set][kind]) || (kind === 'atk' ? '锡杖镇魔' : '禅心稳固');
};
// 共鸣效果结算：atkPct/matkPct/hpPct = 乘区；dr/mdef/eva/cri = 加区；allPct = 全属性乘区
NDX._applyResoEff = function (ctx, eff) {
  if (!eff || !ctx) return;
  if (eff.atkPct) ctx.atk *= (1 + eff.atkPct);
  if (eff.matkPct) ctx.matk *= (1 + eff.matkPct);
  if (eff.hpPct) ctx.maxHp *= (1 + eff.hpPct);
  if (eff.dr) ctx.dr += eff.dr;
  if (eff.mdef) ctx.mdef += eff.mdef;
  if (eff.eva) ctx.eva += eff.eva;
  if (eff.cri) ctx.cri += eff.cri;
  if (eff.allPct) {
    ctx.atk *= (1 + eff.allPct);
    ctx.matk *= (1 + eff.allPct);
    ctx.maxHp *= (1 + eff.allPct);
    ctx.dr *= (1 + eff.allPct);
    ctx.mdef *= (1 + eff.allPct);
    ctx.eva *= (1 + eff.allPct);
    ctx.cri *= (1 + eff.allPct);
  }
};

// ============================================================
// §6 系统间协同 · 共鸣词条表
// 每条：{ id, name, desc, check(s, equips) → bool, eff }
// 同一时刻可多词条并存（叠乘/叠加），在套装共鸣之后统一结算。
// ============================================================
NDX.CROSS_RESONANCE = (function () {
  const list = [];
  // —— §6.1 劫印+经文：同道途协同（3 印 + 2 经 → 流派核心属性额外加成）——
  const _DAO_ECHO = {
    渡: { name: '渡道共鸣', desc: '3枚渡道劫印 + 2本渡道经文 → 法伤+10%', eff: { matkPct: 0.10 } },
    战: { name: '战道共鸣', desc: '3枚战道劫印 + 2本战道经文 → 物攻+10%', eff: { atkPct: 0.10 } },
    缘: { name: '缘道共鸣', desc: '3枚缘道劫印 + 2本缘道经文 → 减伤+8%', eff: { dr: 0.08 } },
    夺: { name: '夺道共鸣', desc: '3枚夺道劫印 + 2本夺道经文 → 气血+10%', eff: { hpPct: 0.10 } },
    隐: { name: '隐道共鸣', desc: '3枚隐道劫印 + 2本隐道经文 → 闪避+8%', eff: { eva: 0.08 } },
    逆: { name: '逆道共鸣', desc: '3枚逆道劫印 + 2本逆道经文 → 攻法+5%', eff: { atkPct: 0.05, matkPct: 0.05 } },
  };
  Object.keys(_DAO_ECHO).forEach((dao) => {
    const cfg = _DAO_ECHO[dao];
    list.push({
      id: 'echo_' + dao, name: cfg.name, desc: cfg.desc, eff: cfg.eff,
      check(s) { return NDX.sealDaoCount(s, dao) >= 3 && NDX.sutraDaoCount(s, dao) >= 2; },
    });
  });
  // —— §6.1 劫印+经文：阈值协同（层数≥6 + 3 经 → 暴击额外+5%）——
  list.push({
    id: 'burst_zhan', name: '战道爆发', desc: '战道层数≥6 + 3本战道经文 → 暴击+5%', eff: { cri: 0.05 },
    check(s) { return NDX.sealDaoLayerSum(s, '战') >= 6 && NDX.sutraDaoCount(s, '战') >= 3; },
  });
  // —— §6.1 劫印+经文：混搭协同（3渡印+3战印+2渡经+2战经 → 文武双全）——
  list.push({
    id: 'wenwu', name: '文武双全', desc: '3渡印+3战印+2渡经+2战经 → 物攻+5% 法伤+5%', eff: { atkPct: 0.05, matkPct: 0.05 },
    check(s) {
      return NDX.sealDaoCount(s, '渡') >= 3 && NDX.sealDaoCount(s, '战') >= 3
        && NDX.sutraDaoCount(s, '渡') >= 2 && NDX.sutraDaoCount(s, '战') >= 2;
    },
  });
  // —— §6.2 劫印+装备：英雄专属套装 + 3 同道劫印 → 减伤额外+5% ——
  list.push({
    id: 'chanxin', name: '禅心稳固', desc: '英雄专属套装 + 3枚同道劫印 → 减伤+5%', eff: { dr: 0.05 },
    check(s, equips) {
      const hs = NDX.heroSetEquipped(s, equips);
      const dao = hs ? NDX.setDao(hs) : null;
      return !!hs && !!dao && NDX.sealDaoCount(s, dao) >= 3;
    },
  });
  // —— §6.2 劫印+装备：破军套 + 任意 6 劫印 → 物攻额外+8% ——
  list.push({
    id: 'pojun', name: '破军之势', desc: '破军套≥2件 + 任意6枚劫印 → 物攻+8%', eff: { atkPct: 0.08 },
    check(s, equips) {
      return (NDX.equipSetCounts(equips)['破军'] || 0) >= 2 && (s.seals || []).length >= 6;
    },
  });
  // —— §6.2 劫印+装备：混搭装备 + 3渡+3战劫印 → 所有属性+3% ——
  list.push({
    id: 'linghuo', name: '灵活多变', desc: '混搭装备 + 3渡印+3战印 → 所有属性+3%', eff: { allPct: 0.03 },
    check(s, equips) {
      return NDX.isMixedEquip(equips) && NDX.sealDaoCount(s, '渡') >= 3 && NDX.sealDaoCount(s, '战') >= 3;
    },
  });
  // —— §6.3 经文+装备：英雄专属套装 + 2 本同道经文 → 物攻额外+7% ——
  list.push({
    id: 'xizhang', name: '锡杖镇魔', desc: '英雄专属套装 + 2本同道经文 → 物攻+7%', eff: { atkPct: 0.07 },
    check(s, equips) {
      const hs = NDX.heroSetEquipped(s, equips);
      const dao = hs ? NDX.setDao(hs) : null;
      return !!hs && !!dao && NDX.sutraDaoCount(s, dao) >= 2;
    },
  });
  // —— §6.3 经文+装备：玄武套 + 任意 4 本经文 → 气血额外+10% ——
  list.push({
    id: 'xuanwu_hu', name: '玄武护体', desc: '玄武套≥2件 + 任意4本经文 → 气血+10%', eff: { hpPct: 0.10 },
    check(s, equips) {
      return (NDX.equipSetCounts(equips)['玄武'] || 0) >= 2 && NDX.totalSutras(s) >= 4;
    },
  });
  // —— §6.3 经文+装备：混搭装备 + 2渡+2战经文 → 经武通达 ——
  list.push({
    id: 'jingwu', name: '经武通达', desc: '混搭装备 + 2渡经+2战经 → 法伤+4% 物攻+4%', eff: { matkPct: 0.04, atkPct: 0.04 },
    check(s, equips) {
      return NDX.isMixedEquip(equips) && NDX.sutraDaoCount(s, '渡') >= 2 && NDX.sutraDaoCount(s, '战') >= 2;
    },
  });
  // —— §6.4 三者大协同：道途圆满（英雄2阶套 + 主道≥6层 + 3本同道经 + 对应转职）——
  list.push({
    id: 'daoyuan', name: '道途圆满', desc: '英雄2阶套装 + 主道≥6层 + 3本同道经 + 对应道途转职 → 所有属性+15%', eff: { allPct: 0.15 },
    check(s, equips) {
      const hs = NDX.heroSetEquipped(s, equips, true);
      if (!hs) return false;
      const dao = NDX.setDao(hs);
      return NDX.sealDaoLayerSum(s, dao) >= 6 && NDX.sutraDaoCount(s, dao) >= 3 && NDX.tierOf(s, dao) >= 1;
    },
  });
  // —— §6.4 三者大协同：万法归一（通用套 + 9劫印 + 5经文 + 隐藏转职）——
  list.push({
    id: 'wanfa', name: '万法归一', desc: '通用套装≥2件 + 9枚劫印 + 5本经文 + 隐藏转职 → 所有属性+12%', eff: { allPct: 0.12 },
    check(s, equips) {
      const cnt = NDX.equipSetCounts(equips);
      const generic = ['破军', '玄武', '贪狼'].some((st) => (cnt[st] || 0) >= 2);
      return generic && (s.seals || []).length >= 9 && NDX.totalSutras(s) >= 5
        && !!(s.flags && s.flags.jobConfirm);
    },
  });
  return list;
})();

// 系统间协同共鸣结算：遍历 CROSS_RESONANCE，命中即施加 eff 并记入 flags.crossResonated
// （供 UI 展示「道途共鸣」词条；套装共鸣 flags.resonated 与之分离）
NDX.applyCrossResonance = function (equips, ctx, s) {
  if (!s && NDX.game && NDX.game.state) s = NDX.game.state;
  if (!s || !ctx) return ctx;
  const flags = ctx.flags || {};
  const hit = [];
  (NDX.CROSS_RESONANCE || []).forEach((r) => {
    let ok = false;
    try { ok = r.check ? !!r.check(s, equips) : false; } catch (e) { ok = false; }
    if (!ok) return;
    NDX._applyResoEff(ctx, r.eff);
    // 英雄专属套共鸣词条名按当前英雄套装动态取（取经人=禅心稳固/锡杖镇魔）
    const dynName = (r.id === 'chanxin' || r.id === 'xizhang')
      ? NDX._heroSetResoName(s, r.id === 'xizhang' ? 'atk' : 'dr') : r.name;
    hit.push({ id: r.id, name: dynName, desc: r.desc });
  });
  if (hit.length) {
    flags.crossResonated = flags.crossResonated || [];
    hit.forEach((h) => flags.crossResonated.push(h));
  }
  return ctx;
};
