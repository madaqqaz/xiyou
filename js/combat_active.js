// =============================================================
// combat_active.js — 《逆道西行》三键主动技能系统（攻击/诵经/绝招）
// 从 combat.js 拆分（2026-09-09）：独立维护主动技能系统逻辑
// 全局命名空间 NDX（同时挂到 window，兼容其他文件以 window.NDX 引用）
// =============================================================
window.NDX = window.NDX || {};
var NDX = window.NDX;

// —— 三键主动技能（V8.27 万世剑冢式 · 攻击 / 诵经·禅光 / 戾骨献祭 / 绝招）——
// 被 game.js：resolveManualActive（在拍差 CD 探测与正式结算时各调一次）与
// ui.js：_activeSkillBar（只用于探测 CD）消费。自《逆道西行_经文系统整理设计.md》§9 与
// NDX.ULTIMATES 数据落地；伤害基准取既有 applyMomentumBurst/applyShiPo 的「玩家双攻」口径
// （res._playerAtk + res._playerMatk），保证与操作点爆发的数值量级一致。
// 双攻基准：攻击吃 ti.atk，诵经/绝招吃 yuan.matk（物理/法术双轨）。
NDX.activeSkill = function (player, monster, kind, s) {
  const S = s || {};
  // 经文招式包（GDD 五）：持诵经 atkVariant/ultVariant -> 换经即换套路（单一真源 NDX.sutraVariantOf）
  const _sutraVariant = function (act, key) {
    if (!act || !S.chantSutra || !NDX.sutraVariantOf || !NDX.applySutraVariant) return act;
    const sv = NDX.sutraVariantOf(S.chantSutra, key);
    if (sv) NDX.applySutraVariant(act, sv.variant, sv.scale);
    return act;
  };
  // 道途/阶途进阶：由 game.js.resolveManualActive 依据「已装备劫印 / 绝招阶」算定后挂于 player._skillAdvance，
  // 此处只读不重算（与 chant 同源定义，避免囤印冲突）。探针调用未挂载时 _sa 为 null，退化为基础技能。
  const _sa = (player && player._skillAdvance) || null;
  const ti = (player && player.ti) || {};
  const yuan = (player && player.yuan) || {};
  const mMax = (monster && monster.maxHp) || 1;
  const heroId = S.hero || 'tangseng';
  const isBoss = !!(monster && monster.boss);
  // 善念(good)乘区：与自动回合内核(playerAttack / combat.js:326·470)同口径——
  // 体攻吃 mercyAtk、愿伤吃 mercy，使「斗战善果 / 慈悲愿力」在手动三键技上同样生效（原 dblBase 绕过善念，与预期矛盾）。
  const _P = (NDX.HEROES && NDX.HEROES[heroId] && NDX.HEROES[heroId].passive) || {};
  const _good = Number(S.good) || 0;
  const _mercyAtk = (_P.mercyAtk || 0) * _good;
  const _mercy = (_P.mercy || 0) * _good;
  const dblBase = Math.round((ti.atk || 0) * (1 + _mercyAtk) + (yuan.matk || 0) * (1 + _mercy));
  const magicBase = Math.round((yuan.matk || 0) * (1 + _mercy) * (1 + (yuan.matkB || 0)) + (yuan.fixMatk || 0));
  if (kind === 'atk') {
    // 攻击 · CD1（近常驻）；物理双攻×0.8，作为三键体系的常驻普攻
    // —— 道途进阶（与 chant 同源：仅「已装备劫印」生效，避免囤印冲突）——
    // combo(战)＝连击多段 / burst(夺)＝连爆爆发 / pierce(逆)＝透骨穿刺
    const dmg = Math.max(1, Math.round(dblBase * 0.8));
    const act = { kind: 'atk', name: '攻击', cd: 1, dmg: dmg, heal: 0, shield: 0, note: '挥兵狠击' };
    if (_sa && _sa.atk) {
      if (_sa.atk === 'combo') { act.hits = 2; act.spread = true; act.note += '·连击(战)'; }
      else if (_sa.atk === 'burst') { act.dmg = Math.max(1, Math.round(dmg * 1.5)); act.note += '·连爆(夺)'; }
      else if (_sa.atk === 'pierce') { act.trueDmg = Math.max(1, Math.round(dmg * 0.4)); act.ignoreDef = true; act.note += '·透骨(逆)'; }
    }
    // —— 方案X2·六道攻式（手动三键·攻）：按当前主要道途单一生效 ——
    // player.daoAtk 由 resolveManualActive 透传；手动风格（combo/burst/pierce）优先，未进阶才吃攻式
    const _mdA = (player && player.daoAtk) || null;
    const _mk = (_mdA && _mdA.style) ? _mdA.style.key : null;
    const _mp = (_mdA && _mdA.style) ? (_mdA.style.pct || 0) : 0;
    if (_mk && !(_sa && _sa.atk)) {
      if (_mk === 'crit') {
        if (Math.random() < _mp) { act.dmg = Math.max(1, Math.round(act.dmg * 1.5)); act.critHit = true; act.note += '·战意冲霄'; }
      } else if (_mk === 'heal') { act.heal = Math.max(0, Math.round(act.dmg * _mp)); act.note += '·禅光渡世'; }
      else if (_mk === 'lifesteal') { act.heal = Math.max(0, Math.round(act.dmg * _mp)); act.note += '·夺灵噬血'; }
      else if (_mk === 'shield') { act.shield = Math.max(0, Math.round(act.dmg * _mp)); act.note += '·缘起护身'; }
      else if (_mk === 'true') { act.trueDmg = Math.max(1, Math.round(act.dmg * _mp)); act.note += '·逆锋透骨'; }
      else if (_mk === 'evade-crit' && player.daoEvadeReady) { act.dmg = Math.max(1, Math.round(act.dmg * 1.5)); act.critHit = true; act.note += '·影遁必杀'; }
    }
    // —— 本命攻式：把每英雄被动机制显影到攻键手感（与 chantOf 本命诵经对称，见 applyHeroKeyFeel）——
    if (NDX.applyHeroKeyFeel) NDX.applyHeroKeyFeel(player, act, 'atk', S);
    // —— 经文招式包·普攻变体：持诵哪部经，普攻就带哪一路套路（叠加于本命攻式之上，最末微调）——
    _sutraVariant(act, 'atk');
    return act;
  }
  if (kind === 'chant') {
    // 诵经 · 三态优先级（方案X1·持诵位）：
    //   ① 持诵位已设（chantSutra=已合成全本）→ 诵经=持诵经 chantSkill（念什么经，使什么法）
    //   ② 未设持诵且已合成逆经（破戒录/逆天录）→ 戾骨献祭（重创大招，CD5 场限1，代价=清气势+承伤）
    //   ③ 其余 → 本命诵经（英雄分镜 CHANTS）
    const _csId = S.chantSutra || null;
    const _csFull = _csId ? (NDX.sutraFullById(_csId) || NDX.niSutraFullById(_csId)) : null;
    const _csSkill = (_csFull && _csFull.chantSkill) ? _csFull.chantSkill : null;
    const _isChantSutra = !!_csSkill;
    // 戾骨献祭：仅未设持诵时兜底（现代存储 s.niSutras 已合成破戒录/逆天录）
    const _rebelFulls = S.niSutras || [];
    const rebelReady = !_isChantSutra && (_rebelFulls.indexOf('ni_full_pojie') >= 0 || _rebelFulls.indexOf('ni_full_nitian') >= 0);
    // —— 模块八·经匣拼篇阶位（V8.6x）：戾骨献祭吃逆侧、本命诵经吃渡侧，晋阶放大伤害 ——
    const _rTier = NDX.sutraSideTier ? NDX.sutraSideTier(S, 'rebel') : null;
    const _fTier = NDX.sutraSideTier ? NDX.sutraSideTier(S, 'ferry') : null;
    let act;
    if (rebelReady) {
      const baseLien = Math.round(magicBase * 2.2 + (isBoss ? mMax * 0.05 : 0));
      const _m = NDX.sutraTierMult ? NDX.sutraTierMult(_rTier, 'rebel') : 1;
      act = { kind: 'chant', name: '戾骨献祭', cd: 5, dmg: Math.max(1, Math.round(baseLien * _m)), heal: 0, shield: 0,
        note: '以逆经喂骨，血债血偿（每场限1次）' + (_rTier ? ' · 拼篇' + _rTier.label + '×' + _m.toFixed(2) : ''), cost: { momentum: 'clear', incomingDmgMul: 0.2 } };
    } else {
      // 持诵经 chantSkill / 本命诵经：按英雄取 CHANTS 分镜，使「经」按钮带英雄辨识度（唐僧=法伤/回血本命）
      let c = _csSkill;
      if (!c) c = (typeof NDX.chantOf === 'function') ? NDX.chantOf(heroId) : { name: '禅光诵经', cd: 2, mult: 1.5, kind: 'zen-heal' };
      // 拼篇阶位取侧：持诵逆经吃逆侧（戾骨强化），其余（持诵渡经/本命）吃渡侧（诵经强化）
      const _csSide = (_isChantSutra && _csId.indexOf('ni_full_') === 0) ? 'rebel' : 'ferry';
      const _tier = _csSide === 'rebel' ? _rTier : _fTier;
      const _fm = NDX.sutraTierMult ? NDX.sutraTierMult(_tier, _csSide) : 1;
      const dmg = Math.max(1, Math.round(magicBase * (c.mult || 1.5) * _fm));
      act = { kind: 'chant', name: c.name || '禅光诵经', cd: c.cd || 2, dmg: dmg, heal: 0, shield: 0, note: (c.desc || '禅光普照') + (_tier ? ' · 拼篇' + _tier.label + '×' + _fm.toFixed(2) : '') };
      // —— 诵经 kind 真机制（映射到 applyActiveIntervention 已支持原语；持诵经保留其 chantSkill.desc 说明）——
      switch (c.kind) {
        case 'zen-heal': // 唐僧：法伤 + 大幅回血
          act.heal = Math.max(0, Math.round(dmg * 0.5));
          if (!_isChantSutra) act.note = '禅光普照：法伤并大幅回血';
          break;
        case 'war-buff': // 悟空：法伤 + 激昂重击（暴击级）
          act.dmg = Math.max(1, Math.round(dmg * 1.15));
          act.critHit = true;
          if (!_isChantSutra) act.note = '战吼梵音：法伤并激昂重击';
          break;
        case 'glut-ton': // 八戒：法伤 + 吸血自愈
          act.heal = Math.max(0, Math.round(dmg * 0.45));
          if (!_isChantSutra) act.note = '贪狼真言：法伤并吸血自愈';
          break;
        case 'ward-mantra': // 沙僧：法伤 + 凝护反震（护盾 + 穿刺真伤）
          act.shield = Math.max(0, Math.round(dmg * 0.35));
          act.trueDmg = Math.max(1, Math.round(dmg * 0.2));
          if (!_isChantSutra) act.note = '镇妖陀罗：法伤并凝护反震';
          break;
        case 'veil-mantra': // 小白龙：法伤 + 凝匿必中（无视防御）
          act.trueDmg = Math.max(1, Math.round(dmg * 0.25));
          act.ignoreDef = true;
          if (!_isChantSutra) act.note = '隐龙密咒：法伤并凝匿必中';
          break;
        case 'break-mantra': // 方案X1·持诵：法伤 + 破甲真伤（无视防御）
          act.trueDmg = Math.max(1, Math.round(dmg * 0.3));
          act.armorBreak = true;
          if (!_isChantSutra) act.note = '破甲真言：法伤并破甲真伤';
          break;
        default:
          act.heal = Math.max(0, Math.round(dmg * 0.35));
          break;
      }
      // —— 道途进阶（V3 §1.1 全量自动生效：按全部持有劫印判定，而非生效位）——
      // 劫印全量累计，多道同时≥3 的冲突由「动态主道判定（劫印≥3且领先≥2）+
      // 本命道加权 + 专精门槛 + 本命道兜底」消化，玩家无需生效位管理。
      const _heroHome = (NDX.HERO_HOME_DAO && NDX.HERO_HOME_DAO[S.hero]) || null;
      let _equipped = ((S.seals) || []).filter(function (x) { return x && x.dao; });
      if (!_equipped) _equipped = [];
      const _dc = {};
      _equipped.forEach(function (x) { if (x && x.dao) _dc[x.dao] = (_dc[x.dao] || 0) + 1; });
      const _total = _equipped.length || 1;
      const _order = ['战', '渡', '缘', '夺', '隐', '逆'];
      const _cnts = _order.map(function (d) {
        const c = _dc[d] || 0;
        return { d: d, cnt: c, score: c + (d === _heroHome ? 2 : 0) };
      });
      _cnts.sort(function (a, b) { return b.score - a.score; });
      const _top = _cnts[0], _second = _cnts[1] || { cnt: 0 };
      const _specialized = _top.cnt >= 2 && (_top.cnt >= _second.cnt + 2 || _top.cnt / _total >= 0.5);
      const _DAO_ADV = { '战': 'fury', '渡': 'aoe', '缘': 'dot', '夺': 'recoil', '隐': 'stun', '逆': '逆' };
      const _adv = (_total === 0) ? null : (_specialized ? _DAO_ADV[_top.d] : (_heroHome ? _DAO_ADV[_heroHome] : _DAO_ADV[_top.d]));
      if (_adv) {
        switch (_adv) {
          case 'aoe': // 渡→普照：附加怪物最大生命 8% 不可减免真伤（无视防御）
            act.trueDmg = Math.max(1, Math.round((act.trueDmg || 0) + (mMax || 1) * 0.08));
            act.ignoreDef = true;
            act.note += '·普照（附加最大生命真伤）';
            break;
          case 'dot': // 缘→业火：未来 3 回合每回合 act.dmg×15% 不可减免真伤
            act.dot = { per: Math.max(1, Math.round(act.dmg * 0.15)), rounds: 3 };
            act.note += '·业火（三回合持续真伤）';
            break;
          case 'stun': // 隐→定身：凝滞增伤 +25% 并必中无视防御
            act.dmg = Math.max(1, Math.round(act.dmg * 1.25));
            act.ignoreDef = true;
            act.critHit = true;
            act.note += '·定身（凝滞增伤·必中）';
            break;
          case 'fury': // 战→激昂：猛诵法伤 ×1.2 并暴击级
            act.dmg = Math.max(1, Math.round(act.dmg * 1.2));
            act.critHit = true;
            act.note += '·激昂（猛诵暴击）';
            break;
          case 'recoil': // 夺→反震：额外真实穿刺 20% + 护盾 15%
            act.trueDmg = Math.max(1, Math.round((act.trueDmg || 0) + act.dmg * 0.2));
            act.shield = Math.max(0, (act.shield || 0) + Math.round(act.dmg * 0.15));
            act.note += '·反震（穿刺+护盾）';
            break;
          case '逆': // 逆→逆鳞血祭：以战养战，伤害 ×1.3 + 吸血（补全此前被遗漏的第六道）
            act.dmg = Math.max(1, Math.round(act.dmg * 1.3));
            act.heal = Math.max(0, (act.heal || 0) + Math.round(act.dmg * 0.3));
            act.note += '·逆鳞（血祭·以战养战）';
            break;
        }
      }
      // 金刚经：经力圆满时本次诵经威力翻倍并附加穿刺真伤
      // （修复此前仅有日志、无实战效果的死触发：资源条承诺「满层触发金刚经」但 combat 从未落地）
      const jlReady = !!(S.pending && S.pending.jingLiReady);
      if (jlReady) {
        act.dmg = Math.max(1, Math.round(act.dmg * 2));
        act.trueDmg = Math.max(1, Math.round((act.dmg + (act.trueDmg || 0)) * 0.4));
        act.note = '【金刚经】' + (act.note || '');
      }
      // P2-1 经力化雨（满而不溢）：溢流经力在诵经时尽数化雨，每层回复 6% 最大气血
      // （层数由 battle_resource 在经力已满时继续获得经力时攒积，≤3；game_core_3.js 结算后清零）
      const _jyOv = (S.pending && S.pending.jingLiOverflow) || 0;
      if (_jyOv > 0) {
        const _pMax = (player.ti && player.ti.maxHp) || 0;
        if (_pMax > 0) {
          act.heal = Math.max(0, (act.heal || 0) + Math.round(_pMax * 0.06 * _jyOv));
          act.note += `·化雨×${_jyOv}`;
        }
      }
      return act;
    }
  }
  if (kind === 'ult') {
    const tier = typeof NDX.ultimateTier === 'function' ? NDX.ultimateTier(S) : 1;
    const u = (typeof NDX.ultimateOf === 'function' && NDX.ultimateOf(heroId, tier)) || null;
    const dr = (ti && typeof ti.dr === 'number') ? ti.dr : 0;
    const magic = magicBase; // 已在上方以 yuan.matk 口径算出
    if (u) {
      const base = Math.max(1, Math.round(dblBase * (u.mult || 1)));
      const act = { kind: 'ult', name: u.name, cd: u.cd || 4, dmg: base, heal: 0, shield: 0, note: u.desc || '绝招', tier: u.tier, hero: heroId, daoKind: u.kind };
      // —— 各 kind 真实机制（V8.5x：不再只是倍率数字，按描述落地可辨识战斗行为）——
      switch (u.kind) {
        case 'crit-dmg': // 悟空·当头一棒：暴击重击（×2 暴击级爆发）
          act.dmg = Math.max(1, Math.round(dblBase * (u.mult || 1) * 2));
          act.critHit = true;
          act.note = '暴击重击：本次爆发以暴击级伤害落下';
          break;
        case 'aoe-dmg': // 悟空·千钧破军：重击 + 破甲（附加 30% 真实伤害破甲）
          act.trueDmg = Math.max(1, Math.round(act.dmg * 0.3));
          act.armorBreak = true;
          act.note = '破军之势：重击并破甲（附加真实伤害）';
          break;
        case 'ignore-dmg': // 悟空/八戒/小白龙·无视防御：50% 真实伤害穿刺
          act.trueDmg = Math.max(1, Math.round(act.dmg * 0.5));
          act.ignoreDef = true;
          act.note = '无视防御：半数伤害化为真实穿刺';
          break;
        case 'guard-dmg': // 沙僧·卷帘覆水/镇狱：防御反击（按减伤放大 + 减伤护盾）
          act.dmg = Math.max(1, Math.round(dblBase * (u.mult || 1) * (1 + dr * 0.6)));
          act.shield = Math.max(0, Math.round(act.dmg * 0.3));
          act.guardCounter = true;
          act.note = '防御反击：减伤越高伤害越重，并得减伤护盾';
          break;
        case 'multi-dmg': // 小白龙·白龙翻江：多段（dmg 分 3 击落地）
          act.hits = 3;
          act.spread = true;
          act.note = '多段法伤：分 3 击连续落下';
          break;
        case 'wish-blade': // 唐僧·一言成刃：愿力化刃（用 matk 口径）+ 穿刺真伤
          act.dmg = Math.max(1, Math.round(magic * (u.mult || 1)));
          act.trueDmg = Math.max(1, Math.round(act.dmg * 0.4));
          act.ignoreDef = true;
          act.note = '愿力化刃：以法伤为基、无视防御';
          break;
        case 'heal-dmg': // 唐僧·金蝉禅唱：法伤 + 回血
          act.heal = Math.max(0, Math.round(act.dmg * 0.3));
          act.note = '金蝉禅唱：法伤并回复气血';
          break;
        case 'shield-dmg': // 唐僧·地藏禅唱：法伤 + 护盾
          act.shield = Math.max(0, Math.round(act.dmg * 0.4));
          act.note = '玄武帝相：法伤并得护盾';
          break;
        case 'drain-dmg': // 八戒·天蓬一耙：重击 + 吸血
          act.heal = Math.max(0, Math.round(act.dmg * 0.4));
          act.note = '九齿钉耙：重击并吸血';
          break;
        default:
          break;
      }
      // 绝招·道途进阶（按已达成阶 tier 解锁：execute→shield→lifesteal，叠加于各 kind 机制之上）
      if (_sa && _sa.ult) {
        if (_sa.ult === 'execute') { act.dmg = Math.max(1, Math.round(act.dmg * 1.25)); act.note += '·斩杀'; }
        else if (_sa.ult === 'shield') { act.shield = Math.max(0, (act.shield || 0) + Math.round(act.dmg * 0.3)); act.note += '·护体'; }
        else if (_sa.ult === 'lifesteal') { act.heal = Math.max(0, (act.heal || 0) + Math.round(act.dmg * 0.35)); act.note += '·吸星'; }
      }
      // P2-1 战意昂扬（满而不溢）：溢流战意在绝招时尽数倾注，每层 +15% 伤害
      // （层数由 battle_resource 在战意已满时继续获得战意时攒积，≤3；consumeForUlt 结算后清零）
      const _zyOv = (S.pending && S.pending.zhanYiOverflow) || 0;
      if (_zyOv > 0) {
        act.dmg = Math.max(1, Math.round(act.dmg * (1 + 0.15 * _zyOv)));
        act.note += `·战意昂扬×${_zyOv}`;
      }
      // 道途·绝招加成（夺 +5%/枚、逆 +8%/枚，经 DaoSystem.getDaoBonus 累计）
      // P0-1 修复：此前 ultBonusPerLayer 只在 battle_resource 被算出、并在日志里打印，
      // 却从未进入伤害结算——夺道与逆道的绝招加成是空头支票。此处按比率乘入，与「战意昂扬」同口径。
      const _ultB = (S.pending && S.pending.ultBonusPerLayer) || 0;
      if (_ultB > 0) {
        act.dmg = Math.max(1, Math.round(act.dmg * (1 + _ultB)));
        act.note += `·道途绝招+${Math.round(_ultB * 100)}%`;
      }
      // —— 经文招式包·绝招变体：持诵经为绝招叠上其道套路（不夺英雄身份）——
      _sutraVariant(act, 'ult');
      return act;
    }
    // 兜底绝招（仍接活道途进阶）
    const _fb = { kind: 'ult', name: '绝招', cd: 4, dmg: Math.max(1, Math.round(dblBase * 1.5)), heal: 0, shield: 0, note: '竭尽全力' };
    if (_sa && _sa.ult) {
      if (_sa.ult === 'execute') { _fb.dmg = Math.max(1, Math.round(_fb.dmg * 1.25)); _fb.note += '·斩杀'; }
      else if (_sa.ult === 'shield') { _fb.shield = Math.max(0, Math.round(_fb.dmg * 0.3)); _fb.note += '·护体'; }
      else if (_sa.ult === 'lifesteal') { _fb.heal = Math.max(0, Math.round(_fb.dmg * 0.35)); _fb.note += '·吸星'; }
    }
    const _zyOv2 = (S.pending && S.pending.zhanYiOverflow) || 0;
    if (_zyOv2 > 0) {
      _fb.dmg = Math.max(1, Math.round(_fb.dmg * (1 + 0.15 * _zyOv2)));
      _fb.note += `·战意昂扬×${_zyOv2}`;
    }
    // 道途·绝招加成（与主分支同口径，见上方 P0-1 说明）
    const _ultB2 = (S.pending && S.pending.ultBonusPerLayer) || 0;
    if (_ultB2 > 0) {
      _fb.dmg = Math.max(1, Math.round(_fb.dmg * (1 + _ultB2)));
      _fb.note += `·道途绝招+${Math.round(_ultB2 * 100)}%`;
    }
    // —— 经文招式包·绝招变体（兜底路径同口径）——
    _sutraVariant(_fb, 'ult');
    return _fb;
  }
  return null;
};

// —— 本命攻式：把每英雄被动机制显影到攻键手感（与 chantOf 本命诵经对称的攻键分镜）——
// 只改 act 上已被 applyActiveIntervention 消费的原语字段（trueDmg/heal/shield/hits/dot），
// 不触碰 dblBase 基值，五英雄互斥、auto/手动同一路径生效，克制不破坏「破爆发」节奏。
// 主打键与文案真源：NDX.HEROES[heroId].mainKey / .attackFeel（data_heroes_data.js）。
NDX.applyHeroKeyFeel = function (player, act, kind, s) {
  if (!act || !act.kind) return act;
  if (kind !== 'atk' || act.kind !== 'atk') return act; // 经/绝已有英雄专属分镜，此处只显影攻键
  const S = s || {};
  const heroId = S.hero || 'tangseng';
  const H = (NDX.HEROES && NDX.HEROES[heroId]) || null;
  if (!H) return act;
  const P = H.passive || {};
  const base = act.dmg || 1;
  // 注：note 用短标签（战斗日志/DOM 播报），attackFeel 完整文案由 UI 层 title/角标呈现
  switch (heroId) {
    case 'wukong': // 如意棒势·撕甲：金睛破甲显影，攻命中撕出真伤
      if (P.sunder) { act.trueDmg = Math.max(1, Math.round(base * 0.12)); act.ignoreDef = true; act.note += '·撕甲'; }
      break;
    case 'tangseng': // 金蝉谛听·慈悲：慈悲愿力显影，攻命中回微血续航
      act.heal = Math.max(0, Math.round(base * 0.25)); act.note += '·慈悲';
      break;
    case 'bajie': // 九齿劲·攒盾：净坛护盾主动侧，攻命中累护盾
      act.shield = Math.max(0, Math.round(base * 0.2)); act.note += '·攒盾';
      break;
    case 'xiaobailong': // 龙影连刺·双影：疾风身法显影，攻分两段连刺
      act.hits = Math.max(act.hits || 1, 2); act.spread = true; act.note += '·龙影';
      break;
    case 'shaseng': // 降妖杖势·印记：御念反震显影，攻命中叠持续真伤
      act.dot = { per: Math.max(1, Math.round(base * 0.08)), rounds: 2 }; act.note += '·杖势';
      break;
    default:
      break;
  }
  // —— 转职联动（模块一·任务3）：转职收益已由 Z.tierBonus→computeStats 的 bonus.tier 实算生效，
  //    此处只做「余弦显影」——把当前最高转职阶的那一道派系(cls)追加到攻键手感 note，
  //    与英雄攻式(·撕甲/·慈悲…)同一条手感印迹；绝不改数值（再加即与 engineTier 双计）。
  const ZJ = NDX.ZHUANJIE;
  if (ZJ && typeof ZJ.currentTier === 'function' && S && S.flags) {
    let _zj_dao = null, _zj_tier = 0;
    (ZJ.DAOS || []).forEach(function (_d) {
      const _t = ZJ.currentTier(S, _d) || 0;
      if (_t > _zj_tier) { _zj_tier = _t; _zj_dao = _d; }
    });
    if (_zj_dao && _zj_tier >= 1) {
      const _C = ZJ.CLASSES[_zj_dao];
      if (_C && _C.cls) act.note += '·' + _C.cls;
    }
  }
  return act;
};

// —— 三键主动技能 · 就地修正回合表 ——
// 与 applyMomentumBurst 同构：把技能伤害灌入当前回合与后续回合，处理治疗/护盾，重算顶层胜负并截断。
// 戾骨的「清气势 / 承伤+20%」代价由 game.js.resolveManualActive 按 act.cost 落地，此处只管数值/播报一致。
NDX.applyActiveIntervention = function (res, atRound, act) {
  if (!res || !res.roundsDetail || !act) return res;
  const idx = Math.max(0, atRound - 1);
  const list = res.roundsDetail;
  const rd = list[idx];
  if (!rd) return res;
  const maxHp = res.maxHp || 1;
  const heal = Math.max(0, act.heal || 0);
  const shield = Math.max(0, act.shield || 0);
  const trueDmg = Math.max(0, act.trueDmg || 0);
  // 多段分摊：dmg 分 hits 击落在连续回合；否则单发（穿刺真伤 trueDmg 仅本回合生效）
  const hits = (act.spread && act.hits > 1) ? act.hits : 1;
  const perHit = hits > 1 ? (act.dmg + trueDmg) / hits : (act.dmg + trueDmg);
  // 1) 本回合怪物扣血（dmg + 穿刺真伤 合并，不可减免）
  const mBefore = rd.mHpAfter || 0;
  const mAfter = Math.max(0, mBefore - perHit);
  rd.mHpAfter = mAfter;
  if (rd.mTurn) rd.mTurn.hpAfter = mAfter;
  // 2) 玩家治疗/护盾
  rd.pHpAfter = Math.min(maxHp, (rd.pHpAfter || 0) + heal);
  if (shield > 0) rd.shield = (rd.shield || 0) + shield;
  // 3) 后续回合：多段分摊落击 / 单发沿用原「每回合扣 dmg」语义（真伤仅本回合）
  if (hits > 1) {
    const end = Math.min(list.length, idx + hits);
    for (let i = idx + 1; i < end; i++) {
      const r2 = list[i];
      if (!r2) break;
      const c = r2.mTurn && r2.mTurn.hpBefore != null ? r2.mTurn.hpBefore : (r2.mHpAfter || 0);
      r2.mHpAfter = Math.max(0, c - perHit);
      if (r2.mTurn) r2.mTurn.hpAfter = r2.mHpAfter;
      if (heal > 0) r2.pHpAfter = Math.min(maxHp, (r2.pHpAfter || 0) + heal);
    }
  } else {
    for (let i = idx + 1; i < list.length; i++) {
      const r2 = list[i];
      const c = r2.mTurn && r2.mTurn.hpBefore != null ? r2.mTurn.hpBefore : (r2.mHpAfter || 0);
      r2.mHpAfter = Math.max(0, c - (act.dmg || 0));
      if (r2.mTurn) r2.mTurn.hpAfter = r2.mHpAfter;
      if (heal > 0) r2.pHpAfter = Math.min(maxHp, (r2.pHpAfter || 0) + heal);
    }
  }
  // 道途进阶·业火持续真伤（缘道）：在已落下的当前/后续回合上追加不可减免真伤
  if (act.dot && act.dot.per > 0) {
    const _end = Math.min(list.length, idx + (act.dot.rounds || 3));
    for (let i = idx; i < _end; i++) {
      const r2 = list[i];
      if (!r2) break;
      r2.mHpAfter = Math.max(0, (r2.mHpAfter || 0) - act.dot.per);
      if (r2.mTurn) r2.mTurn.hpAfter = r2.mHpAfter;
    }
  }
  // 4) 打标
  rd.intervention = Object.assign({}, rd.intervention || {}, {
    active: act.kind || 'skill', name: act.name || '', activeDmg: Math.round(perHit),
    activeTrueDmg: Math.round(trueDmg), activeHeal: heal, activeShield: shield,
    armorBreak: !!act.armorBreak, ignoreDef: !!act.ignoreDef, guardCounter: !!act.guardCounter, critHit: !!act.critHit,
  });
  // 5) 重算顶层胜负 + 怪物提前归零截断
  res.monsterHpLeft = list.length ? list[list.length - 1].mHpAfter : res.monsterHpLeft;
  res.playerHpLeft = list.length ? Math.min(maxHp, list[list.length - 1].pHpAfter) : res.playerHpLeft;
  let killAt = -1;
  for (let i = idx; i < list.length; i++) {
    if (list[i].mHpAfter <= 0) { killAt = i; break; }
  }
  if (killAt >= 0) {
    res.roundsDetail = list.slice(0, killAt + 1);
    res.total = res.roundsDetail.length;
  }
  res.win = res.monsterHpLeft <= 0 && res.playerHpLeft > 0;
  res.lose = res.playerHpLeft <= 0;
  return res;
};

// —— 经文招式包·应用器（GDD V9.6 五）——
// 把 sutraVariantOf() 产出的声明式变体落到 act 的既有原语上（applyActiveIntervention 已消费的字段），
// 只叠加、不改 act.kind/name，不触碰英雄本命与道途进阶（调用方置于其之后）。全确定性。
NDX.applySutraVariant = function (act, v, scale) {
  if (!act || !v) return act;
  const s = (typeof scale === 'number' && scale > 0) ? scale : 1;
  const base = act.dmg || 1;
  if (v.dmgMul && v.dmgMul !== 1) act.dmg = Math.max(1, Math.round(act.dmg * (1 + (v.dmgMul - 1) * s)));
  if (v.healPct) act.heal = Math.max(0, (act.heal || 0) + Math.round(base * v.healPct * s));
  if (v.lifestealPct) act.heal = Math.max(0, (act.heal || 0) + Math.round(base * v.lifestealPct * s));
  if (v.shieldPct) act.shield = Math.max(0, (act.shield || 0) + Math.round(base * v.shieldPct * s));
  if (v.trueDmgPct) act.trueDmg = Math.max(1, Math.round((act.trueDmg || 0) + base * v.trueDmgPct * s));
  if (v.dotPct) act.dot = { per: Math.max(1, Math.round(base * v.dotPct * s)), rounds: v.dotRounds || 3 };
  if (v.ignoreDef) act.ignoreDef = true;
  if (v.armorBreak) act.armorBreak = true;
  if (v.crit) act.critHit = true;
  if (v.note) act.note = (act.note || '') + v.note;
  return act;
};
