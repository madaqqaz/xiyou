/* =============================================================================
 * ndx_audio_config.js —— 《逆道西行》音频区域音景配置（真实 17 区域）
 * 数据驱动，配合 ndx_audio_engine.js + ndx_audio_bridge.js 使用。
 * 仅描述"音频层"映射（区域 → 音景类型），不触碰任何游戏玩法逻辑。
 *
 * 设计来源：data_regions.js 的 NDX.ACT_BG / NDX.ACT_MAP_THEME（act 1~17 真实地名）。
 * 音景类型复用引擎 ZONE_TYPES：outdoor / forest / cave / temple / town / abyss / boss。
 * ========================================================================== */
(function (global) {
  'use strict';
  var NDX = global.NDX = global.NDX || {};

  // 真实 17 区域名（与 data_regions.js / ACT_BG 顺序一致，act = 索引+1）
  var REGION_NAMES = [
    '大唐境内',   // 1
    '两界山',     // 2
    '黄风岭',     // 3
    '流沙河',     // 4
    '五庄观',     // 5
    '火云洞',     // 6
    '车迟国',     // 7
    '通天河',     // 8
    '女儿国',     // 9
    '真假猴王',   // 10
    '火焰山',     // 11
    '祭赛国',     // 12
    '狮驼岭',     // 13
    '比丘国',     // 14
    '天竺·玉兔',  // 15
    '灵山',       // 16
    '凌云渡',     // 17
  ];

  // act(1~17) → 音景类型。字段语义见引擎 ZONE_TYPES。
  // 选择依据（黑暗西游氛围）：
  //   大唐境内/车迟国/女儿国/祭赛国/比丘国 = 城镇/国度为 'town'
  //   两界山/真假猴王/凌云渡 = 荒野户外 'outdoor'
  //   黄风岭/流沙河/通天河 = 含风/水氛围，归 'forest'（引擎 forest 带水声环境层）
  //   五庄观/天竺·玉兔/灵山 = 殿宇道场 'temple'
  //   火云洞/火焰山 = 洞窟火脉 'cave'
  //   狮驼岭 = 妖岭深渊 'abyss'
  var ACT_ZONE = {
    1:  'town',
    2:  'outdoor',
    3:  'forest',
    4:  'forest',
    5:  'temple',
    6:  'cave',
    7:  'town',
    8:  'forest',
    9:  'town',
    10: 'outdoor',
    11: 'cave',
    12: 'town',
    13: 'abyss',
    14: 'town',
    15: 'temple',
    16: 'temple',
    17: 'outdoor',
  };

  // Boss 战强制音景（金属混响 + 阴郁根音），与区域无关
  var BOSS_ZONE = 'boss';

  // 试炼节点事件用的音景 key（C 套）。
  // 注意：游戏侧实际传入的是 A 套道途（战/渡/隐/夺/缘/逆），与本枚举不同源，
  // 由下方 normalizeDao() 做 A→C 语义映射。此前的注释称「与游戏一致」是错误描述，已更正。
  var DAOS = ['tian', 'ren', 'asura', 'chusheng', 'egui', 'diyu'];
  var DAO_LABELS = { tian: '天', ren: '人', asura: '阿修罗', chusheng: '畜生', egui: '饿鬼', diyu: '地狱' };

  function trialEvent(dao) {
    if (DAOS.indexOf(dao) < 0) dao = 'ren';
    return 'event:/Trial/' + dao + '/Enter';
  }

  // 把游戏返回的 dao key 归一为事件用 key（容错：兼容中英/拼音/别称）
  function normalizeDao(d) {
    if (!d) return null;
    var s = String(d).toLowerCase();
    if (DAOS.indexOf(s) >= 0) return s;
    var map = {
      // A 套道途（游戏实际传入）—— P0-2 修复：此前缺失，导致命中 0/6，
      // 81 难全程静默回落到 event:/Trial/ren/Enter，5 条音景从未触发。
      // 语义映射：战=好斗→阿修罗 / 渡=慈悲→人 / 隐=匿踪→畜生
      //           夺=贪婪→饿鬼 / 缘=结缘护持→天 / 逆=逆反堕决→地狱
      '战': 'asura', '战道': 'asura',
      '渡': 'ren', '渡道': 'ren',
      '隐': 'chusheng', '隐道': 'chusheng',
      '夺': 'egui', '夺道': 'egui',
      '缘': 'tian', '缘道': 'tian',
      '逆': 'diyu', '逆道': 'diyu',
      // B 套中文佛名（向后兼容，勿删）
      '天': 'tian', '天道': 'tian', 'tian': 'tian',
      '人': 'ren', '人道': 'ren', 'ren': 'ren',
      '阿修罗': 'asura', '修罗': 'asura', 'asura': 'asura',
      '畜生': 'chusheng', '畜': 'chusheng', 'chusheng': 'chusheng',
      '饿鬼': 'egui', 'egui': 'egui',
      '地狱': 'diyu', 'diyu': 'diyu',
    };
    return map[s] || null;
  }

  /* —— 81 试炼·音景参考表（辅助/文档用，非运行时必需）——
   * 与《逆道西行_黑暗西游81难详表.md》对齐：前期偏天/人，后期偏地狱/饿鬼；
   * 分布 天13/人13/阿修罗14/畜生13/饿鬼14/地狱14 = 81。
   * 真实试炼名以游戏 data 为准；此表用于音频走查与快速定位。 */
  var TRIAL_DAO_PLAN = (function () {
    var plan = [];
    var weights = ['tian','ren','ren','asura','tian','ren','chusheng','asura','egui','tian','ren','asura','chusheng','diyu','egui','asura','chusheng','egui','diyu','tian','ren','asura','chusheng','egui','diyu','asura','chusheng','egui','diyu','ren','tian','asura','chusheng','egui','diyu','tian','ren','asura','chusheng','egui','diyu','tian','ren','asura','chusheng','egui','diyu','asura','chusheng','egui','diyu','tian','ren','asura','chusheng','egui','diyu','tian','ren','asura','chusheng','egui','diyu','asura','chusheng','egui','diyu','tian','ren','asura','chusheng','egui','diyu','asura','chusheng','egui','diyu','tian'];
    for (var i = 0; i < 81; i++) plan.push(weights[i] || 'ren');
    return plan;
  })();
  var TRIAL_APPELLATION = ['劫', '难', '试', '厄', '劫数', '业火', '迷障', '心魔', '残卷', '断章'];

  // —— 特殊试炼音景覆盖（可选，非必需）——
  // 命中规则：act 匹配（且未设 nameHint 时直接命中，或 nameHint 命中节点名）。
  // 示例：把"真假猴王"(act10) 作为镜像主题示例；游戏侧亦可运行时调用
  //   NDX.audioConfig.registerSpecialTrial({ act:10, zone:'abyss', event:'event:/Trial/Mirror/Enter', nameHint:'猴王' })
  // 来注册真实特殊试炼（未来你加了镜像战/逆道秘境节点，往这里加一条即可）。
  var SPECIAL_TRIALS = [
    { act: 10, zone: 'abyss', event: 'event:/Trial/Mirror/Enter', nameHint: '猴王' }, // 真假猴王·镜像示例
  ];
  function matchSpecialTrial(act, name) {
    for (var i = 0; i < SPECIAL_TRIALS.length; i++) {
      var s = SPECIAL_TRIALS[i];
      if (s.act && s.act === act) {
        if (!s.nameHint || (name && String(name).indexOf(s.nameHint) >= 0)) return s;
      }
      if (s.nameHint && name && String(name).indexOf(s.nameHint) >= 0) return s;
    }
    return null;
  }
  function registerSpecialTrial(def) {
    if (def && def.zone) { SPECIAL_TRIALS.push(def); return true; }
    return false;
  }

  function buildTrialList() {
    var list = [];
    for (var i = 0; i < 81; i++) {
      var act = Math.min(17, Math.floor(i / 81 * 17) + 1);
      var dao = TRIAL_DAO_PLAN[i];
      var region = REGION_NAMES[act - 1];
      var name = region + '·' + TRIAL_APPELLATION[i % TRIAL_APPELLATION.length] + (i + 1);
      list.push({ index: i + 1, act: act, dao: dao, daoLabel: DAO_LABELS[dao], name: name, event: trialEvent(dao) });
    }
    return list;
  }

  NDX.audioConfig = {
    REGION_NAMES: REGION_NAMES,
    ACT_ZONE: ACT_ZONE,
    BOSS_ZONE: BOSS_ZONE,
    DAOS: DAOS,
    DAO_LABELS: DAO_LABELS,
    trialEvent: trialEvent,
    normalizeDao: normalizeDao,
    zoneOfAct: function (act) { return ACT_ZONE[act] || 'outdoor'; },
    buildTrialList: buildTrialList,
    SPECIAL_TRIALS: SPECIAL_TRIALS,
    matchSpecialTrial: matchSpecialTrial,
    registerSpecialTrial: registerSpecialTrial,
  };

  if (typeof module !== 'undefined') module.exports = NDX.audioConfig;
})(typeof window !== 'undefined' ? window : this);
