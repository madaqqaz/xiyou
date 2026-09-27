/**
 * 道途/六道系统模块（V8.40）
 * 统一管理道途统计、主要道途计算、道途加成
 *
 * 六道定义：
 * - 战（战道）：物攻线，高战意上限
 * - 渡（渡道）：法伤线，高经力上限
 * - 隐（隐道）：闪避线，受击保留战意
 * - 夺（夺道）：爆发线，绝招额外伤害
 * - 缘（缘道）：辅助线，战意/经力获取加速
 * - 逆（逆道）：逆修线，战意/经力上限+绝招伤害
 *
 * 设计原则：
 * 1. 单一职责：只负责道途统计和加成，不负责状态管理
 * 2. 统一接口：所有系统通过NDX.DaoSystem访问道途计算
 * 3. 渐进式迁移：提供统一接口，逐步迁移现有道途计算逻辑
 */
(function () {
  'use strict';

  var NDX = window.NDX || (window.NDX = {});

  /**
   * 六道定义
   */
  const DAO_LIST = ['战', '渡', '隐', '夺', '缘', '逆'];

  /**
   * 六道中文名映射
   */
  const DAO_NAMES = {
    '战': '战道',
    '渡': '渡道',
    '隐': '隐道',
    '夺': '夺道',
    '缘': '缘道',
    '逆': '逆道',
  };

  /**
   * 六道描述
   */
  const DAO_DESC = {
    '战': '以力破局，物攻为主，高战意上限',
    '渡': '慈悲渡世，法伤为主，高经力上限',
    '隐': '匿踪避世，闪避为主，受击保留战意',
    '夺': '杀伐掠夺，爆发为主，绝招额外伤害',
    '缘': '结缘渡化，辅助为主，战意/经力获取加速',
    '逆': '逆天改命，逆修为主，战意/经力上限+绝招伤害',
  };

  /**
   * 统计玩家的道途分布（基于生效劫印）
   * @param {Object} s - 游戏状态
   * @returns {Object} 道途分布 { '战': 2, '渡': 3, ... }
   */
  function calcDaoStats(s) {
    if (!s || !Array.isArray(s.seals)) {
      const result = {};
      DAO_LIST.forEach((d) => { result[d] = 0; });
      return result;
    }
    const activeSeals = s.seals.filter((sl) => sl && sl.dao);
    const daoCount = {};
    DAO_LIST.forEach((d) => { daoCount[d] = 0; });
    activeSeals.forEach((sl) => {
      if (sl && sl.dao && daoCount[sl.dao] != null) {
        daoCount[sl.dao] += 1;
      }
    });
    return daoCount;
  }

  /**
   * 计算玩家的主要道途（方案X2·动态主道）
   * 触发基准 = playerDao：第一难抉择定调（s.mainDao 锚点）+ 全部持有劫印动态（V3 §1.1 全量生效）
   *   - 有锚点：锚点优先；若某道劫印 ≥3 且比锚点道多 ≥2，视为玩家已明显转向，动态道胜出
   *   - 无锚点：全部劫印分布 ≥2 才采纳（避免单印抖动）→ 英雄体系 → 地区配额 → 默认渡
   * @param {Object} s - 游戏状态
   * @returns {string} 主要道途
   */
  function getMainDao(s) {
    if (!s) return '渡';
    // 全部持有劫印分布（V3 §1.1 全量生效，与战斗进阶/转职门槛同口径）
    const _eq = ((s.seals) || []).filter((x) => x && x.dao);
    const _dc = {};
    (_eq || []).forEach((x) => { if (x && x.dao) _dc[x.dao] = (_dc[x.dao] || 0) + 1; });
    let _dynDao = null, _dynCnt = 0;
    DAO_LIST.forEach((d) => {
      const c = _dc[d] || 0;
      if (c > _dynCnt) { _dynCnt = c; _dynDao = d; }
    });
    // 有锚点（第一难抉择定调 / 自愿改道）：锚点优先，劫印动态可覆盖
    if (s.mainDao) {
      const _aCnt = _dc[s.mainDao] || 0;
      if (_dynDao && _dynCnt >= 3 && _dynCnt >= _aCnt + 2) return _dynDao;
      return s.mainDao;
    }
    // 无锚点：已装备劫印分布（≥2 才采纳，避免单印抖动）
    if (_dynCnt >= 2) return _dynDao;
    // 🔴 V9.51 英雄本命道**彻底取消**（用户拍板 2026-09-25）：六道 = 玩家的选择，英雄不绑定任何道。
    //   故此处**不再回落英雄六道归属**，也**不再按「二体系（体/愿）」或地区配额猜道**——
    //   那两者都是「按英雄/进度推断玩家该走哪道」，与「六道是玩家的选择」直接冲突。
    //   玩家首次择道（难1 sixdaoSelect / 土地庙·长安自愿改道）后即由 s.mainDao 锚点接管；
    //   在此之前（理论上仅旧存档/测试）一律默认「渡」＝原著主线。
    return '渡';
  }

  /**
   * 计算道途加成（用于战意/经力参数调整）
   * @param {Object} s - 游戏状态
   * @returns {Object} 道途加成 { zhanYiMax, jingLiMax, zhanYiGain, jingLiGain, keepZhanYiChance, ultBonusPerLayer }
   */
  function getDaoBonus(s) {
    const stats = calcDaoStats(s);
    const bonus = {
      zhanYiMax: 0,
      jingLiMax: 0,
      zhanYiGainMult: 1,
      jingLiGainMult: 1,
      keepZhanYiChance: 0,
      ultBonusPerLayer: 0,
    };
    // 战道：战意上限+2/枚，战意获取+50%/枚
    // B·战道补偿（六道再平衡）：受击保留战意概率+15%/枚（最多75%），
    // 缩小与渡道（经力受击不清零、永续）的资源落差，使其不再被严格支配
    if (stats['战'] > 0) {
      bonus.zhanYiMax += stats['战'] * 2;
      bonus.zhanYiGainMult *= (1 + stats['战'] * 0.5);
      bonus.keepZhanYiChance = Math.min(0.75, stats['战'] * 0.15);
    }
    // 渡道：经力上限+2/枚，经力获取+50%/枚
    if (stats['渡'] > 0) {
      bonus.jingLiMax += stats['渡'] * 2;
      bonus.jingLiGainMult *= (1 + stats['渡'] * 0.5);
    }
    // 隐道：受击保留战意概率+20%/枚（最多80%）
    if (stats['隐'] > 0) {
      bonus.keepZhanYiChance = Math.min(0.8, stats['隐'] * 0.2);
    }
    // 夺道：绝招每层额外伤害+5%/枚
    if (stats['夺'] > 0) {
      bonus.ultBonusPerLayer += stats['夺'] * 0.05;
    }
    // 缘道：战意/经力获取速度+25%/枚
    if (stats['缘'] > 0) {
      bonus.zhanYiGainMult *= (1 + stats['缘'] * 0.25);
      bonus.jingLiGainMult *= (1 + stats['缘'] * 0.25);
    }
    // 逆道：战意/经力上限+1/枚，绝招伤害+10%/枚
    if (stats['逆'] > 0) {
      bonus.zhanYiMax += stats['逆'];
      bonus.jingLiMax += stats['逆'];
      bonus.ultBonusPerLayer += stats['逆'] * 0.1;
    }
    // ===== P1-9 混合道途交叉收益（鼓励玩家混合选择，而非一条路走到底）=====
    const activeDaos = DAO_LIST.filter((d) => stats[d] > 0);
    const daoCount = activeDaos.length;
    if (daoCount >= 2) { bonus.mixedBonus = (bonus.mixedBonus || 0) + 0.05; bonus.mixedTier = 2; }
    if (daoCount >= 3) { bonus.mixedBonus = (bonus.mixedBonus || 0) + 0.05; bonus.mixedTier = 3; }
    if (daoCount >= 4) { bonus.mixedBonus = (bonus.mixedBonus || 0) + 0.05; bonus.mixedTier = 4; }
    bonus.synergies = [];
    if (stats['战'] > 0 && stats['渡'] > 0) { bonus.synergies.push({key:'zhan_du',name:'攻防兼备',desc:'战+渡协同：攻击时10%概率不消耗战意'}); bonus.freeZhanYiChance = 0.10; }
    if (stats['战'] > 0 && stats['夺'] > 0) { bonus.synergies.push({key:'zhan_duo',name:'杀伐之道',desc:'战+夺协同：暴击伤害+20%'}); bonus.critDmgMult = (bonus.critDmgMult || 1) + 0.20; }
    if (stats['渡'] > 0 && stats['缘'] > 0) { bonus.synergies.push({key:'du_yuan',name:'慈悲之道',desc:'渡+缘协同：治疗效果+30%'}); bonus.healMult = (bonus.healMult || 1) + 0.30; }
    if (stats['隐'] > 0 && stats['逆'] > 0) { bonus.synergies.push({key:'yin_ni',name:'暗影之道',desc:'隐+逆协同：闪避后反击伤害+25%'}); bonus.evadeCounterMult = (bonus.evadeCounterMult || 1) + 0.25; }
    if (stats['夺'] > 0 && stats['逆'] > 0) { bonus.synergies.push({key:'duo_ni',name:'逆天杀伐',desc:'夺+逆协同：绝招伤害额外+15%'}); bonus.ultBonusPerLayer += 0.15; }
    if (stats['缘'] > 0 && stats['隐'] > 0) { bonus.synergies.push({key:'yuan_yin',name:'结缘匿踪',desc:'缘+隐协同：受击时15%概率完全闪避'}); bonus.fullEvadeChance = 0.15; }
    if (stats['战'] > 0 && stats['缘'] > 0) { bonus.synergies.push({key:'zhan_yuan',name:'战意结缘',desc:'战+缘协同：战意获取速度额外+20%'}); bonus.zhanYiGainMult *= 1.20; }
    if (stats['渡'] > 0 && stats['逆'] > 0) { bonus.synergies.push({key:'du_ni',name:'逆渡苍生',desc:'渡+逆协同：经力获取速度额外+20%'}); bonus.jingLiGainMult *= 1.20; }
    if (stats['战'] > 0 && stats['渡'] > 0 && stats['缘'] > 0) { bonus.synergies.push({key:'san_jiao',name:'三教合一',desc:'战+渡+缘协同：儒释道三教合一，全属性额外+5%'}); bonus.mixedBonus = (bonus.mixedBonus || 0) + 0.05; }
    if (stats['夺'] > 0 && stats['隐'] > 0 && stats['逆'] > 0) { bonus.synergies.push({key:'an_ye_xiu_luo',name:'暗夜修罗',desc:'夺+隐+逆协同：暗夜修罗，暴击率+10%'}); bonus.critChanceBonus = (bonus.critChanceBonus || 0) + 0.10; }
    return bonus;
  }

  /**
   * 获取道途的中文名
   * @param {string} dao - 道途标识
   * @returns {string} 道途中文名
   */
  function getDaoName(dao) {
    return DAO_NAMES[dao] || dao;
  }

  /**
   * 获取道途的描述
   * @param {string} dao - 道途标识
   * @returns {string} 道途描述
   */
  function getDaoDesc(dao) {
    return DAO_DESC[dao] || '';
  }

  /**
   * 获取所有道途列表
   * @returns {Array} 道途列表
   */
  function getDaoList() {
    return DAO_LIST.slice();
  }

  // 🔴 V9.51 道级固定善恶已废弃（用户拍板 2026-09-25）：
  //   原 isEvilDao(战/夺/逆=恶) / isGoodDao(渡/隐/缘=善) 是「道有固定善恶」的旧口径，
  //   与项目真源冲突——真源里**善恶挂在逐选项**上（九章正文「善恶值：善+8/善+10/恶+5/恶+8/恶+10」，
  //   代码侧 effect.alignGood/alignEvil，全量 404 处覆盖 9 章）：
  //   同一道在不同劫难可有不同善恶（如难1「隐」= 恶+8，而隐系在别处可为善）。
  //   善恶现只由两处承载：① 逐选项 effect.alignGood/alignEvil → s.good/s.evil（结局判定 + 转职善门槛）
  //                          ② 劫印的**来源阵营** seal.align（非战斗得善印 / 战斗得恶印，见 SEAL_SOURCE_ALIGN）
  //   六道本身不判善恶——它只是玩家选择的结果标签。

  /**
   * 六道攻式（方案X2·道途攻式）：按当前主要道途单一生效的攻击特效
   * 触发基准 = playerDao（第一难抉择定调 + 劫印/装备/经文动态，允许中途转道）
   * key 语义（自动战斗 playerAttack / 手动战斗 activeSkill('atk') 双轨消费）：
   *   crit       战：攻击 25% 概率暴击（加性叠加基础暴击）
   *   heal       渡：攻击按伤害比例回血
   *   evade-crit 隐：闪避后下一次攻击必爆（跨回合状态）
   *   lifesteal  夺：攻击按伤害比例吸血
   *   shield     缘：攻击附加护盾
   *   true       逆：攻击附带真伤（无视防御）
   *   ls（可选） 附加吸血比例：在 key 效果之外额外按伤害回血（独立于 LIFESTEAL_CAP）。
   *              V9.66 仅逆道使用（见下方 '逆' 注释）。
   */
  const DAO_ATK_STYLE = {
    '战': { key: 'crit', name: '战意冲霄', pct: 0.25, desc: '攻式·战：25% 概率暴击' },
    // V9.63 平衡下调：0.25 → 0.16（原值叠加唐僧被动「慈悲」25% 后达 50% 回血，
    // 令渡道在裸号/无宠物无经文的保守模型下也能无脑通关，首通墙形同不存在）。
    '渡': { key: 'heal', name: '禅光渡世', pct: 0.16, desc: '攻式·渡：攻击按 16% 伤害回血' },
    '隐': { key: 'evade-crit', name: '影遁必杀', pct: 0, desc: '攻式·隐：闪避后下一次攻击必爆' },
    '夺': { key: 'lifesteal', name: '夺灵噬血', pct: 0.20, desc: '攻式·夺：攻击按 20% 伤害吸血' },
    '缘': { key: 'shield', name: '缘起护身', pct: 0.20, desc: '攻式·缘：攻击附加 20% 伤害的护盾' },
    // V9.66「逆血」：逆道是六道中唯一零续航的道（真伤分支不回血），叠加最高压强 1.28 后
    //   在 demo（ch1-3）内 15 次重试仍打不穿（ch2 卡 43% / ch3 卡 33~38% 平台）。
    //   实测续航是悬崖开关：0→打不穿 / 0.035→第 8 次 / 0.05→第 5 次 / 0.07+→第 3 次（过补偿）。
    //   取 3.5% ⇒ 逆道在 demo 内落到第 8 次（≈10 次目标），且仍是四道中最晚一档。
    //   ⚠ ls 走独立分支（combat_part1.js 逆血消费点），不占 LIFESTEAL_CAP、不与劫印吸血叠加。
    '逆': { key: 'true', name: '逆锋透骨', pct: 0.30, ls: 0.035, desc: '攻式·逆：攻击附带 30% 真伤（无视防御）+ 3.5% 逆血回血' },
  };

  /**
   * 六道总览卡片（方案X2·难1战后独立弹窗）：每道与装备套装/隐藏职升级石/经文的钩子
   * set/stoneName 与 JOB_STONES（equipment.js）对应；sutras 由 SUTRA_DAO_TAG 反查
   */
  const SIX_DAO_CARDS = {
    '战': { set: '破军', stone: 'pw_stone', stoneName: '破军升级石' },
    '渡': { set: '玄武', stone: 'xw_stone', stoneName: '玄武升级石' },
    '缘': { set: '贪狼', stone: 'tl_stone', stoneName: '贪狼升级石' },
    '隐': { set: '影遁', stone: 'yd_stone', stoneName: '影遁升级石' },
    '夺': { set: '饕餮', stone: 'tt_stone', stoneName: '饕餮升级石' },
    '逆': { set: '逆命', stone: 'nm_stone', stoneName: '逆命升级石' },
  };

  /** 当前主要道途的攻式（无则 null） */
  function daoAtkStyleOf(s) {
    const dao = getMainDao(s);
    return (dao && DAO_ATK_STYLE[dao]) ? { dao: dao, style: DAO_ATK_STYLE[dao] } : null;
  }

  /** 某道经文全本名（渡藏/逆藏，SUTRA_DAO_TAG 反查） */
  function sixDaoSutraNames(dao) {
    if (!NDX.SUTRA_DAO_TAG) return [];
    return Object.keys(NDX.SUTRA_DAO_TAG)
      .filter((fid) => NDX.SUTRA_DAO_TAG[fid] === dao)
      .map((fid) => {
        const f = (NDX.sutraFullById && NDX.sutraFullById(fid)) || (NDX.niSutraFullById && NDX.niSutraFullById(fid));
        return f ? String(f.name || fid).replace(/[《》]/g, '') : fid;
      });
  }

  /** 六道总览卡片数组（供难1战后弹窗 / 地图改道面板渲染） */
  function sixDaoCards() {
    return DAO_LIST.map((dao) => {
      const st = DAO_ATK_STYLE[dao] || null;
      const card = SIX_DAO_CARDS[dao] || null;
      return {
        dao: dao,
        name: DAO_NAMES[dao] || dao,
        desc: DAO_DESC[dao] || '',
        // V9.51：原 align（'善'/'恶' 道级固定标签）已删除——道不判善恶，善恶看玩家在该难的具体选择。
        dao: dao,
        atk: st ? { name: st.name, desc: st.desc } : null,
        set: card ? card.set : '',
        stoneName: card ? card.stoneName : '',
        sutras: sixDaoSutraNames(dao),
      };
    });
  }

  // ============================================================
  // V9.6「六道概率主干」· 池权重向量单一真源（GDD §2.2 / §2.3）
  //   六道（s.fate）已从「属性给予者 + 硬门槛」降级为「投放池的概率偏置向量」：
  //   每池在投放点读取本函数，按加权抽取决定各道资源（装备/法宝/劫印/经文）的出现概率。
  //   权重 w[dao] = 1 + FATE_W_MAX * fate / (fate + FATE_W_HALF)  —— 软饱和曲线，
  //   fate→∞ 时趋近 1+FATE_W_MAX（不封死其它道，避免某道 100% 垄断，GDD §2.3 明确要求）。
  //   中性情形（无 state / 无 fate / 恶缘当道 eyuan）→ 返回 null，
  //   调用方回退既有「主道 ×N / 均匀」逻辑，零回归。
  //   数值 [已调优]：HALF 4→5（2026-09-14）。原半饱和点 4 意味 fate=4 即吃满一半池加成（权重 1.75x），
  //     前期道途未定、命运值零星累积时过早单道垄断。推后到 5，同道加成中期（fate≥5）才过半，给前期留白；
  //     MAX 1.5 不变（GDD §2.3 不封死它道）。门禁 _verify_dao_pool 对 MAX/HALF 参数化读取，单调/上界不受影响。
  // ============================================================
  NDX.FATE_POOL_W_MAX = 1.5;   // 六道数量对池权重的最大加成（软饱和上限）
  NDX.FATE_POOL_W_HALF = 5;    // 半饱和常数：fate=5 时加成达上限之半（原 4 推后，2026-09-14 已调优）
  NDX.daoPoolWeights = function (s) {
    if (!s || !s.fate) return null;
    // 恶缘当道：六道偏置整体失效（构筑更杂乱），与 rollEquips / rollFabao 的 eyuan 语义一致
    if (NDX.hasCurse && NDX.hasCurse(s, 'eyuan')) return null;
    const MAXB = NDX.FATE_POOL_W_MAX, HALF = NDX.FATE_POOL_W_HALF;
    const out = {};
    let active = false;
    DAO_LIST.forEach((d) => {
      const f = s.fate[d] || 0;
      out[d] = 1 + MAXB * (f / (f + HALF));
      if (f > 0) active = true;
    });
    return active ? out : null;
  };
  // 便捷取值：某道在当前状态下的池权重倍数（无信号 / 中性 → 1）
  NDX.daoPoolMult = function (s, dao) {
    const w = NDX.daoPoolWeights(s);
    return (w && w[dao] != null) ? w[dao] : 1;
  };

  // 顶层便捷 API（供 combat.js / ui 直接调用；DaoSystem 亦可取）
  NDX.daoAtkStyleOf = daoAtkStyleOf;
  NDX.sixDaoCards = sixDaoCards;

  // 导出模块
  NDX.DaoSystem = {
    DAO_LIST: DAO_LIST,
    DAO_NAMES: DAO_NAMES,
    DAO_DESC: DAO_DESC,
    DAO_ATK_STYLE: DAO_ATK_STYLE,
    SIX_DAO_CARDS: SIX_DAO_CARDS,
    calcDaoStats: calcDaoStats,
    daoAtkStyleOf: daoAtkStyleOf,
    sixDaoCards: sixDaoCards,
    sixDaoSutraNames: sixDaoSutraNames,
    getMainDao: getMainDao,
    getDaoBonus: getDaoBonus,
    getDaoName: getDaoName,
    getDaoDesc: getDaoDesc,
    getDaoList: getDaoList,
  };

})();

// ============================================================
// 本局路线 + 累计善恶（P4 · 2026-09-25）
//   六道总览/改道面板头部显影：让玩家看见「我的选择把我带到了哪条路线」。
//   路线来源拆解见 data_jobspec.js 的 NDX.styleSourcesOf（英雄底色 / 劫印 / 持诵经 / 隐藏职倾向）。
//   六道（价值取向）与路线（打法）正交——本函数把二者同屏呈现。
// ============================================================
NDX.daoRouteBrief = function (s) {
  const S = s || {};
  const src = (NDX.styleSourcesOf && NDX.styleSourcesOf(S)) || null;
  return {
    style: src ? src.style : null,
    name: src ? src.name : '',
    sources: (src && src.sources) || [],
    good: Math.round(Number(S.good) || 0),
    evil: Math.round(Number(S.evil) || 0),
  };
};
