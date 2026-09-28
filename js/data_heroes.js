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
  // V9.5x 综合量纲（开发文档「全系统综合数值设计合同」批A）：
  // d28+ 后期斜率收敛（每难 +8 攻 / +9 愿伤，封顶 +400/+450），
  // 避免裸号 atk/matk 随 diff 线性外推爆炸（d81 曾达 d1 的 ×23.7），使装备固定值不被稀释。
  // 🔴 S18 §⑤-12（2026-09-28 注释口径修正）：**真实饱和点不是 d27**——下式 `t` 的分母是 19，
  //   `t` 在 **d20 即饱和到 1**（旧注"d1-27 保留原曲线"与代码不符，此处已改真实分段）。
  //   ⚠ S18 §⑤-12 记载：`late` 原起点为 **d28**，与 `t` 的饱和点 d20 之间**留出 d21–d27 共 7 档
  //   零成长平台**（"双端零成长"：玩家 `t` 已饱和、`late` 未启动；怪物侧 `_cap=min(d-1,20)`
  //   亦已于 d21 饱和）。**该平台已于 2026-09-28 平衡批次修复**：`late` 起点前移至 d20
  //   （= `t` 饱和点，衔接无跳变），使玩家骨架 d1…d81 **单调不减**。
  const h = hero || {};
  const t = Math.min(1, (diff - 1) / 19);
  // 🔴 S18 §⑤-1（2026-09-28 平衡批次）：`late` 起点由 d28 → **d20**，并**同步降斜率**
  //   （atk 8→7 / matk 9→8），把封顶点从 d70/d70 **推回 d78/d77**（与旧式封顶档一致）。
  //   为什么必须同步降斜率：若只前移起点而不降斜率，`min(400, late*8)` 会在 **d70 就封顶**
  //   ⇒ 尾部出现 **12 档平台**（本门禁 A3 实测抓红）。降斜率后同为「同总额预算、更长摊薄区间」。
  //   影响面（逐档实测，见 `scripts/_audit_difficulty_monotonic.js` A7）：
  //     · d ≤ 20   ：`late=0`，与改动前**逐字节一致**（保留全部早中期手感）；
  //     · d21–d27  ：由 0 变为 +7/+8 per 档 ⇒ **空档消除**（原 7 档零成长）；
  //     · d28–d77  ：增量 = 84−d（atk）/ 92−d（matk），**随档单调收敛到 0**（d28 峰值 +56/+64）；
  //     · d78–d81  ：两式均达封顶 (+400/+450) ⇒ 再次**完全一致**（尾部平台 4/5 档，与旧式同级）。
  //   ⇒ 全程无削弱档位（A7 自证），终局数值不变，仅填平中段空档。
  const late = Math.max(0, diff - 20);
  const lateAtk = Math.min(400, late * 7);
  const lateMatk = Math.min(450, late * 8);
  // 愿伤成长：基础值 + 约 500 随层数线性提升（愿流派核心输出来源；平衡微调：提升斜率使取经人等愿流派后期可击杀高血 Boss/精英）
  const matk = (h.baseMatk != null ? h.baseMatk : 0) + Math.round(500 * t) + lateMatk;
  return {
    atk: Math.round((h.baseAtk != null ? h.baseAtk : 150) + 420 * t) + lateAtk,
    // 血量完全由装备提供：取消英雄升级血量成长（平衡 V39 修订）
    hp:  (h.baseHp != null ? h.baseHp : 1000),
    dr:  +((h.baseDr != null ? h.baseDr : 0.20) + 0.06 * t).toFixed(3),
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
  mult = Math.max(0.72, Math.min(1.28, mult));          // clamp：[-28%, +28%] 收窄道带（渡/逆差距从±60%收为±28%）
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
  // ⚠ V9.65：战/夺也贡献 monStr（道带补全），此处必须用逆道专属计数 monStrNi，
  //   否则「夺道叠 4 次（+20%）」会被误报成「逆道过凶」。
  const monStr = s.flags.monStrNi != null ? s.flags.monStrNi : (s.flags.monStr || 0);
  if (monStr > 0.15) {
    flaws.push('逆道叠劫过凶：连续逆道使怪物强度 +' + Math.round(monStr * 100) + '%，收益未补防御');
    tips.push('逆道换锋需配「缘」道护盾劫兜底，下一局适度掺走「渡」道弱化路线');
  }

  // 5) 气血/减伤基底薄（无渡道气血、无缘道减伤）
  const hpSeals = seals.filter((x) => x.stat === 'maxhp' || x.stat === 'dr');
  const monAll = s.flags.monStr || 0;   // 总压强（含战/夺）用于「基底薄」判据，与逆道专属计数分开
  if (!hpSeals.length && !yuanSeals.length && monAll <= 0.15) {
    flaws.push('气血/减伤基底偏薄：未拿「渡」道气血劫或「缘」道护盾劫，挨打全靠装备硬扛');
    tips.push('下一局优先拿「渡」道气血劫或「缘」道护盾劫，补厚气血/减伤基底');
  }

  // 6) 推荐路线提示（V9.51）：英雄本命道已彻底取消（六道 = 玩家的选择，英雄不绑定任何道）。
  //   此处**不再判定"走错道"、不涉及任何收益差**，只给官方保底通关路线作叙事引导
  //   （真源 NDX.HERO_RECOMMEND_DAO，data_config.js）。取经人推荐路线 = 渡道。
  try {
    const _fate = s.fate || {};
    let _domDao = '', _domMax = 0;
    for (const _k in _fate) { const _v = _fate[_k] || 0; if (_v > _domMax) { _domMax = _v; _domDao = _k; } }
    const _recDao = (s.hero && NDX.HERO_RECOMMEND_DAO && NDX.HERO_RECOMMEND_DAO[s.hero]) || null;
    if (_domDao && _recDao) {
      const _hn = (s.hero && NDX.HEROES && NDX.HEROES[s.hero]) ? NDX.HEROES[s.hero].name : '该英雄';
      if (_domDao === _recDao) {
        tips.push(`本局主走「${_domDao}」道——正是 ${_hn} 的推荐路线，官方路线通关最稳，下一局可继续深挖此道`);
      } else {
        tips.push(`本局主走「${_domDao}」道；${_hn} 的推荐路线为「${_recDao}」道（官方保底通关路线）。六道无优劣，全看你的选择——想换口味就走下去`);
      }
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
