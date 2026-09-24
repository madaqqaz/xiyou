// =============================================================
// game_jingpo.js — 精魄系统 · 运行时逻辑（domain: jingpo · V9.11）
// 依赖：NDX.JINGPO（data_jingpo.js）／Game.prototype.gainXinmo（心魔唯一写入口 ·
//       门禁 _verify_xinmo_single_source 锁死，本文件绝不自写 s.xinmo）
// 设计真源：骨架 A6.6「杀 / 收」二选一 + A6.8 悟空「斩心魔」转阶
// =============================================================
NDX.Game.prototype.jingpoInfo = function jingpoInfo() {
  const s = this.state, J = NDX.JINGPO || {};
  const used = s.jingpoUsed || [];
  const tiers = (J.SPEND_TIERS || []).map((t) => ({
    key: t.key, name: t.name, desc: t.desc, cost: t.cost,
    bought: used.indexOf(t.key) >= 0,
    payable: (s.jingpo || 0) >= t.cost
  }));
  return {
    jingpo: s.jingpo || 0,
    kills: (s.niSlain || []).length,
    slain: (s.niSlain || []).slice(),
    tiers: tiers,
    unlocked: (s.jingpo || 0) > 0 || (s.niSlain || []).length > 0
  };
};

// 精魄唯一入账口（杀支 / 后续扩展同源）
NDX.Game.prototype.gainJingpo = function gainJingpo(n, src) {
  const s = this.state;
  if (!s || s.over || !n) return 0;
  s.jingpo = (s.jingpo || 0) + n;
  this.pushLog(`【精魄】${src || '逆道'} · 精魄 +${n}（共 ${s.jingpo}）`);
  return n;
};

// 逆道「杀 / 收」决策：悟空恒为「杀」（A6.8），其余英雄默认「收」，
// 玩家可在土地庙·精魄熔魂面板切 s.flags.jingpoPolicy = 'kill' 改为一律杀。
NDX.Game.prototype.niCatchDecision = function niCatchDecision() {
  const s = this.state, J = NDX.JINGPO || {};
  const hero = s.hero || s.heroId || '';
  if ((J.HERO_AUTO_KILL || []).indexOf(hero) >= 0) return 'kill';
  return (s.flags && s.flags.jingpoPolicy === 'kill') ? 'kill' : 'keep';
};

// —— 杀支：不收为逆随从，取其精魄 ——
// 产出：精魄 + 自身属性成长；代价：+ 额外心魔（走 gainXinmo），且该兽不计入逆兽 / 转职数。
NDX.Game.prototype.jingpoKill = function jingpoKill(beastId, beastName) {
  const s = this.state, J = NDX.JINGPO || {};
  if (!s) return null;
  const act = Math.max(1, Math.min(9, s.act || 1));
  const gain = Math.round((J.GAIN_BY_ACT || [])[act - 1] || 6);
  const scale = 1 + (act - 1) * (J.ACT_SCALE || 0.12);
  const atk = Math.round((J.ATK_PER_KILL || 3) * scale);
  const hp = Math.round((J.HP_PER_KILL || 22) * scale);
  s.bonusTi = s.bonusTi || {};
  s.bonusTi.atk = (s.bonusTi.atk || 0) + atk;
  s.bonusTi.hp = (s.bonusTi.hp || 0) + hp;
  if (!s.niSlain) s.niSlain = [];
  if (beastId && s.niSlain.indexOf(beastId) < 0) s.niSlain.push(beastId);
  this.gainJingpo(gain, '杀·' + (beastName || beastId || '折服之妖'));
  const dX = J.XINMO_ON_KILL || 12;
  if (dX) this.gainXinmo(dX, { cap: false, quota: false, source: 'jingpo-kill' });
  this.pushLog(`【逆·杀】${beastName || beastId || '此獠'}已折于你手，却仍被你反手屠之——精魄 +${gain}、体攻 +${atk}、气血 +${hp}；心魔 +${dX}（此兽不入逆兽名录、不计转职）。`);
  this.toast(`逆·杀：精魄 +${gain} · 心魔 +${dX}`);
  return { gain: gain, atk: atk, hp: hp, xinmo: dX };
};

NDX.Game.prototype.openJingpo = function openJingpo() {
  const s = this.state;
  const info = this.jingpoInfo ? this.jingpoInfo() : null;
  if (!info || !info.unlocked) {
    this.toast('尚无精魄——走【逆】折服之妖后择「杀」，方得此物'); this.render(); return;
  }
  s.pending = { kind: 'jingpo', node: (s.pending && s.pending.node) || { name: '土地庙' } };
  this.render();
};

NDX.Game.prototype.spendJingpo = function spendJingpo(key) {
  const s = this.state, J = NDX.JINGPO || {};
  if (!s || s.over) return { ok: false, why: '此世已了，无从熔炼' };
  const tier = (J.SPEND_TIERS || []).find((t) => t.key === key);
  if (!tier) return { ok: false, why: '无此档位' };
  const used = s.jingpoUsed || [];
  if (used.indexOf(key) >= 0) return { ok: false, why: '此档已然在身' };
  if ((s.jingpo || 0) < tier.cost) return { ok: false, why: `精魄不足（需 ${tier.cost}，现 ${s.jingpo || 0}）` };
  s.jingpo = (s.jingpo || 0) - tier.cost;
  s.jingpoUsed = used.concat(key);
  this._applyJingpoEffects(tier);
  this.pushLog(`【精魄熔魂】以精魄 ${tier.cost} 兑得「${tier.name}」——${tier.desc}（余 ${s.jingpo}）。`);
  this.toast(`${J.ICON || ''} 已熔：${tier.name}`);
  this.render();
  return { ok: true, tier: tier };
};

NDX.Game.prototype._applyJingpoEffects = function _applyJingpoEffects(tier) {
  const s = this.state;
  const e = tier.eff || {}, ti = e.ti || {};
  s.bonusTi = s.bonusTi || {};
  if (ti.atk) s.bonusTi.atk = (s.bonusTi.atk || 0) + ti.atk;
  if (ti.hp) s.bonusTi.hp = (s.bonusTi.hp || 0) + ti.hp;
  if (ti.cri) s.bonusTi.cri = (s.bonusTi.cri || 0) + ti.cri;
  if (ti.dr) s.bonusTi.dr = (s.bonusTi.dr || 0) + ti.dr;
  if (e.maxhpPct) s.maxhpPctBonus = (s.maxhpPctBonus || 0) + e.maxhpPct / 100;
};

NDX.Game.prototype.setJingpoPolicy = function setJingpoPolicy(policy) {
  const s = this.state;
  if (!s || !s.flags) return null;
  if (policy !== 'kill' && policy !== 'keep') return null;
  if ((NDX.JINGPO && (NDX.JINGPO.HERO_AUTO_KILL || []).indexOf(s.hero || '') >= 0)) {
    this.toast('悟空逆轨＝以杀止杀，不可改「收」'); return null;
  }
  s.flags.jingpoPolicy = policy;
  this.toast(policy === 'kill' ? '此后走【逆】一律「杀」取精魄' : '此后走【逆】一律「收」为逆随从');
  this.render();
  return policy;
};

// —— A6.8 悟空逆轨「斩心魔」：心魔满值章末具现镜像战，斩一次转一阶 ——
// 由 game_combat_2.js 镜战胜利处调用（传入 s.xinmoBattles）。
NDX.Game.prototype.jingpoMirrorTier = function jingpoMirrorTier(winCount) {
  const s = this.state, J = NDX.JINGPO || {}, Z = NDX.ZHUANJIE;
  if (!s || !Z) return 0;
  const hero = s.hero || s.heroId || '';
  if ((J.HERO_AUTO_KILL || []).indexOf(hero) < 0) return 0;      // 仅悟空
  const isNi = (s.mainDao === '逆') || (((s.fate && s.fate['逆']) || 0) > 0);
  if (!isNi) return 0;                                            // 未入逆道不转
  const want = Math.max(0, Math.min(J.MIRROR_TIER_MAX || 3, winCount || 0));
  const cur = Z.currentTier(s, '逆');
  if (want <= cur) return cur;
  // 逐阶封闭常规闸门，避免与 ZHUANJIE.evaluate 的常规转职重复弹阶
  for (let t = cur; t < want; t++) { if (Z.gateKey && Z.forbid) Z.forbid(s, Z.gateKey('逆', t)); }
  Z.setTier(s, '逆', want);
  const done = want >= (J.MIRROR_TIER_MAX || 3);
  this.pushLog(`【斩心魔】镜中本我又碎一次——逆轨进阶：第 ${want} 转${done ? '（混世妖猴 · 逆轨三转）' : ''}。`);
  this.toast(`斩心魔 ×${want}${done ? ' · 混世妖猴' : ' · 逆轨第 ' + want + ' 转'}`);
  return want;
};
