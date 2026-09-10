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
    // 按英雄体系推断
    if (NDX.HEROES && s.hero) {
      const heroDef = NDX.HEROES[s.hero];
      if (heroDef) return (heroDef.sys === 'yuan') ? '渡' : '战';
    }
    // 按地区配额推断（兼容旧逻辑NDX.playerDao）
    if (typeof NDX.regionQuotaOf === 'function') {
      const q = NDX.regionQuotaOf(s.act || 1);
      const keys = q ? Object.keys(q) : [];
      if (keys[0] && NDX.SUTRA_DAO_BONUS && NDX.SUTRA_DAO_BONUS[keys[0]]) {
        return keys[0];
      }
    }
    // 默认渡道
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

  /**
   * 判断是否为恶道（战/夺/逆）
   * @param {string} dao - 道途标识
   * @returns {boolean} 是否为恶道
   */
  function isEvilDao(dao) {
    return ['战', '夺', '逆'].includes(dao);
  }

  /**
   * 判断是否为善道（渡/隐/缘）
   * @param {string} dao - 道途标识
   * @returns {boolean} 是否为善道
   */
  function isGoodDao(dao) {
    return ['渡', '隐', '缘'].includes(dao);
  }

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
   */
  const DAO_ATK_STYLE = {
    '战': { key: 'crit', name: '战意冲霄', pct: 0.25, desc: '攻式·战：25% 概率暴击' },
    '渡': { key: 'heal', name: '禅光渡世', pct: 0.25, desc: '攻式·渡：攻击按 25% 伤害回血' },
    '隐': { key: 'evade-crit', name: '影遁必杀', pct: 0, desc: '攻式·隐：闪避后下一次攻击必爆' },
    '夺': { key: 'lifesteal', name: '夺灵噬血', pct: 0.20, desc: '攻式·夺：攻击按 20% 伤害吸血' },
    '缘': { key: 'shield', name: '缘起护身', pct: 0.20, desc: '攻式·缘：攻击附加 20% 伤害的护盾' },
    '逆': { key: 'true', name: '逆锋透骨', pct: 0.30, desc: '攻式·逆：攻击附带 30% 真伤（无视防御）' },
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
        align: isEvilDao(dao) ? '恶' : '善',
        atk: st ? { name: st.name, desc: st.desc } : null,
        set: card ? card.set : '',
        stoneName: card ? card.stoneName : '',
        sutras: sixDaoSutraNames(dao),
      };
    });
  }

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
    isEvilDao: isEvilDao,
    isGoodDao: isGoodDao,
  };

})();
