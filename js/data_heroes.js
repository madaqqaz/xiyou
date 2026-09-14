// =============================================================
// data_heroes.js — 《逆道西行》英雄数据 · 玩家基础属性/死亡复盘
// 从 data.js 拆分（2026-08-31）：独立维护英雄相关数据与计算
// 全局命名空间 NDX（同时挂到 window，兼容其他文件以 window.NDX 引用）
// =============================================================
window.NDX = window.NDX || {};
var NDX = window.NDX;

// 玩家同期基准曲线（随 diff 线性插值，平衡 V24 修订）
// 关键修复：matk 此前完全不随层数成长，导致愿流派(取经人/沙僧)后期输出跟不上怪物 hp 膨胀、
// 「未合成组件」时 15 难后连小兵都打不过。现令 matk 随层数成长；
// atk/hp 斜率也提高，使裸装备玩家也能在后期推进，合成后仍明显变强。
NDX.playerBaseAt = function (diff, hero) {
  const t = (diff - 1) / 19;
  const h = hero || {};
  // 愿伤成长：基础值 + 约 500 随层数线性提升（愿流派核心输出来源；平衡微调：提升斜率使取经人等愿流派后期可击杀高血 Boss/精英）
  const matk = (h.baseMatk != null ? h.baseMatk : 0) + Math.round(500 * t);
  return {
    atk: Math.round((h.baseAtk != null ? h.baseAtk : 150) + 420 * t),
    // 血量完全由装备提供：取消英雄升级血量成长（平衡 V39 修订）
    hp:  (h.baseHp != null ? h.baseHp : 1000),
    dr:  +((h.baseDr != null ? h.baseDr : 0.20) + 0.15 * t).toFixed(3),
    matk: matk,
    mdef: h.baseMdef != null ? h.baseMdef : 0,
    eva:  h.baseEva != null ? h.baseEva : 0,
    spd:  h.baseSpd != null ? h.baseSpd : 8,
  };
};

// 各章关隘 Boss 难度：随章递增（1章=20档约2300血，4章≈58档约1万血），使终局 Boss 真正有压迫感。
// 原先所有章节 Boss 都用 MAP_PLAN 的 diff20（末档），导致四章 Boss 血量完全相同。
// 本局劫难抉择的即时战斗调节：逆道→怪物强度上升；渡道→怪物弱化。
// 由 game.js 在每次开战前调用，使「选择立刻改变对局难度」——剧情与玩法双向绑定。
NDX.scaleRunMods = function (m, s) {
  if (!m || !s) return m;
  const f = s.flags || {};
  let mult = 1 + (f.monStr || 0) - (f.monWeak || 0);   // 逆道增益 - 渡道弱化
  mult = Math.max(0.55, Math.min(1.6, mult));           // clamp：[-45%, +60%]
  m.hp = Math.max(1, Math.round(m.hp * mult));
  m.atk = Math.max(1, Math.round(m.atk * mult));
  m.matk = Math.max(1, Math.round(m.matk * mult));
  // 多阶段 Boss：阶段血量数组同步缩放（否则阶段条与 m.hp 脱节）
  if (Array.isArray(m.stages)) m.stages = m.stages.map((h) => Math.max(1, Math.round(h * mult)));
  m._runStrMult = +mult.toFixed(2);                    // 供日志/UI 展示实际倍率
  return m;
};

// 死亡复盘：把"为何打不过"归因到本局构筑与决策，给出下一局可操作建议。
// 目的——让玩家觉得"下一把调整路线就能通关"，而非数值不公平（区别于数值碾压）。
NDX.buildDeathReview = function (s, p) {
  const res = p.res || {};
  const seals = s.seals || [];
  const rd = res.roundsDetail || [];
  const flaws = [];
  const tips = [];

  // 1) 劫印偏向：是否缺「缘」道护盾/减伤劫（守心/固甲/镇岳）
  const yuanSeals = seals.filter((x) => x.dao === '缘');
  const defSeals = seals.filter((x) => x.stat === 'dr' || x.stat === 'mdef' || x.stat === 'maxhp');
  if (!yuanSeals.length && !defSeals.length) {
    flaws.push('劫印偏输出无护盾：本局未纳「缘」道防御烙印（守心减伤 / 固甲法防 / 镇岳减伤+气血）');
    tips.push('下一局多走劫难节点拿「缘」道防御烙印，补上护盾短板');
  } else if (!yuanSeals.length) {
    flaws.push('缺少「缘」道护盾劫：减伤/法防基底偏薄');
    tips.push('下一局顺路拿一道「缘」道劫印（守心/镇岳）兜底');
  }

  // 2) 劫印机制：是否缺护盾/减伤机制（厚土每回合回盾、坚甲破盾减速、万象护盾免控等）
  //    V8.26 命痕砍除：机制已并入劫印（seal.mechanism），复盘改读劫印机制
  const shieldMechs = seals.filter((x) => /shield|regenShield|guard|immuneCtrl|dr/i.test(x.mechanism || ''));
  if (!shieldMechs.length) {
    flaws.push('缺少护盾机制：无护盾/减伤类劫印机制改写');
    tips.push('遇劫时优先纳「厚土（每回合回盾）」「坚甲（破盾减速）」「万象（护盾免控）」等缘道蓝劫');
  }

  // 3) 法宝冷却/祭宝时机：本场有操作点却未祭宝
  const opPoints = rd.filter((r) => r.operationPoint).length;
  const opUsed = (p.opUsed || []).length;
  if (opPoints > opUsed && opPoints > 0) {
    flaws.push('法宝没把控：错失 ' + (opPoints - opUsed) + ' 次祭宝时机（狂暴 / 残血 / 节奏点）');
    tips.push('妖物狂暴或你命悬一线时，点法宝栏按钮临阵祭宝，可逆转战局');
  }

  // 4) 逆道叠劫过凶：连续逆道使怪变强却没补防御
  const monStr = s.flags.monStr || 0;
  if (monStr > 0.15) {
    flaws.push('逆道叠劫过凶：连续逆道使怪物强度 +' + Math.round(monStr * 100) + '%，收益未补防御');
    tips.push('逆道换锋需配「缘」道护盾劫兜底，下一局适度掺走「渡」道弱化路线');
  }

  // 5) 气血/减伤基底薄（无渡道气血、无缘道减伤）
  const hpSeals = seals.filter((x) => x.stat === 'maxhp' || x.stat === 'dr');
  if (!hpSeals.length && !yuanSeals.length && monStr <= 0.15) {
    flaws.push('气血/减伤基底偏薄：未拿「渡」道气血劫或「缘」道护盾劫，挨打全靠装备硬扛');
    tips.push('下一局优先拿「渡」道气血劫或「缘」道护盾劫，补厚气血/减伤基底');
  }

  // 6) 本命道提醒（C3 V8.6x）：六道主命非英雄本命道时，×1.25 转职/劫印收益未吃满
  try {
    const _fate = s.fate || {};
    let _domDao = '', _domMax = 0;
    for (const _k in _fate) { const _v = _fate[_k] || 0; if (_v > _domMax) { _domMax = _v; _domDao = _k; } }
    const _homeDao = (s.hero && NDX.HERO_HOME_DAO && NDX.HERO_HOME_DAO[s.hero]) || null;
    if (_domDao && _homeDao && _domDao !== _homeDao && _domMax >= 2) {
      const _hn = (s.hero && NDX.HEROES && NDX.HEROES[s.hero]) ? NDX.HEROES[s.hero].name : '该英雄';
      flaws.push(`主走「${_domDao}」道非 ${_hn} 的本命道「${_homeDao}」——同路线本命道收益 ×${NDX.HOME_DAO_MULT || 1.25} 未吃满`);
      tips.push(`下一局可沿 ${_hn} 本命道「${_homeDao}」推进：转职与劫印同路线收益更高，通关更顺`);
    }
  } catch (e) {}

  if (!flaws.length) flaws.push('本局构筑无明显短板，胜负在毫厘之间——多祭一次法宝或许就翻盘');
  if (!tips.length) tips.push('针对本层怪物词缀（反伤 / 咒蚀 / 狂暴）提前备好克制法宝，下一局微调路线');

  // 死亡直接诱因：本场怪物词缀
  let deathCause = '常规妖物';
  if (p.monster && p.monster.affix && p.monster.affix.length) {
    const names = p.monster.affix.map((a) => (NDX.MONSTER_AFFIXES[a] && NDX.MONSTER_AFFIXES[a].name) || a);
    deathCause = '遭遇「' + names.join('·') + '」词缀妖物';
  }
  // 是否被词缀直接耗死（环境侵蚀累计）
  const envTotal = rd.reduce((a, r) => a + (r.envDrain || 0), 0);
  if (envTotal > 0) deathCause += `（封印侵蚀累计流失 ${envTotal} 气血）`;

  return {
    layer: s.layer,
    name: p.name,
    deathCause: deathCause,
    flaws: flaws,
    tips: tips,
  };
};
