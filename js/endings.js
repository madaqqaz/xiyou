// ============================================================================
//  动态结局系统（网状叙事 · 第一阶段 P0）
//  真源：NDX.Ending —— 依 s.choiceFlags / s.fate / s.hero / s.good / s.evil 判定结局。
//  优先级：灵山逆座 > 六耳同修 > 长安还俗 > 金蝉正果 > 一魄转世 > 逆道西行（兜底）。
//  未命中任何动态结局时返回 null，交由 game_meta.computeEnding() 兜底（保留各英雄专属结局）。
//  第二阶段补：wanbao（万宝归库）/ wanfa（万法归宗）/ zhanfo（战佛）/ yuanding（缘定）。
// ============================================================================
(function () {
  // 逆道抉择累计次数（s.fate['逆']）
  function _rebelCount(s) {
    const f = (s && s.fate) || {};
    return (f['逆'] || 0);
  }
  // 是否走了难4「逼问真相」（biwen）线——难5 起分支内容 + 灵山内幕的前置印记
  function _choseBiwen(s) {
    return !!(s && s.choiceFlags && s.choiceFlags.n4_choice === 'biwen');
  }
  function _goodPath(s) {
    const c = (s && s.choiceFlags) || {};
    return c.n4_choice === 'rao' || c.n4_choice === 'guanfu';
  }
  // P1：夺/渡/战/缘 道累计抉择次数（s.fate[道]）
  function _duoCount(s) { return ((s && s.fate) || {})['夺'] || 0; }
  function _ferryCount(s) { return ((s && s.fate) || {})['渡'] || 0; }
  function _warCount(s) { return ((s && s.fate) || {})['战'] || 0; }
  function _yuanCount(s) { return ((s && s.fate) || {})['缘'] || 0; }
  // P1：装备数 / 金币
  function _equipCount(s) { return ((s && s.equips) || []).length; }
  // P1：NPC 关系总和
  function _npcRelSum(s) {
    const r = (s && s.npcRel) || {};
    return Object.keys(r).reduce((a, k) => a + (r[k] || 0), 0);
  }
  // P1：是否收八戒 + 沙僧（eff.ally 落 s.flags.ally）
  function _hasBajie(s) { return !!(s && s.flags && s.flags.ally && s.flags.ally.bajie); }
  function _hasShaseng(s) { return !!(s && s.flags && s.flags.ally && s.flags.ally.shaseng); }
  function _npc(s, k) { return ((s && s.npcRel) || {})[k] || 0; }

  var DEFINITIONS = {
    // 1) 灵山逆座：查到灵山幕后 + 恶盖善 + 逆道抉择≥5 + 通关（第一阶段先定义 cond）
    lingshan: {
      id: 'lingshan', title: '灵山逆座',
      cond: function (s) {
        return _choseBiwen(s) && (s.evil || 0) > (s.good || 0) && _rebelCount(s) >= 5;
      },
      text: '你走过八十一难，把账簿翻到了最后一页——原来西天不是尽头，是另一只收钱的手。你不再跪。莲座是空的，你坐了上去，把那本记了十世的簿子，当着如来的面一页页烧了。火光里，你听见自己十世前那句问话终于有了答：度人的从来不是经，是掀桌子的人。灵山自此多了一尊不拜的佛。',
    },
    // 2) 六耳同修：难70 选六耳相关分支（第一阶段 cond 先挂在 liuerUnlocked 印记上，难70 分支第三阶段实现）
    liuer: {
      id: 'liuer', title: '六耳同修',
      cond: function (s) { return !!(s && s.flags && s.flags.liuerUnlocked); },
      text: '灵山问你何方神圣，你身后走出另一个你——六耳猕猴，与你同一张脸、同一卷经。诸天分不清哪个是真，你却笑了：真假本是灵山造的谎。你与它并肩西行，把八十一难走成了两条影子。到雷音寺，如来合掌不语——因为殿上站着两尊取经人，他谁也辨不得，谁也不敢辨。',
    },
    // 3) 长安还俗：善值极高 + 走了饶刘洪/交官府等善向分支 + 通关（放弃取经，回长安）
    changan: {
      id: 'changan', title: '长安还俗',
      cond: function (s) {
        return s.hero === 'tangseng' && (s.good || 0) > 40 && _goodPath(s);
      },
      text: '你走到凌云渡，却停了脚。十世取经，你见过太多被簿子写死的人命，也见够了西天的灯红酒绿。你把经卷留在渡口，脱了袈裟，一步一步走回长安。曲江池边，你开了家药铺，为人看病，再不问佛。唐僧这个名字，就此散在风里——你做回了人，做回了那个会疼、会悔、会放手的人。',
    },
    // P1) 万宝归一：夺道选择≥5 或 装备数≥10 或 金币≥200
    wanbao: {
      id: 'wanbao', title: '万宝归一',
      cond: function (s) {
        return _duoCount(s) >= 5 || _equipCount(s) >= 10 || (s.gold || 0) >= 200;
      },
      text: '你走到灵山，怀里的法宝叮当作响——紫金红葫芦、羊脂玉净瓶、金刚琢、芭蕉扇……诸天的宝贝，十件有八件在你身上。如来问你：取经人，经呢？你笑了：经？这一路的宝贝，哪一件不是经？你把法宝一件件排在莲台前，堆成一座小山。灵山的灯照在上面，比佛光还亮。你转身西行——不取了，这些宝贝，够你买下整座长安。',
    },
    // P1) 万法皆空：渡道选择≥8 且 善>恶*2 且 观音缘≥10
    wanfa: {
      id: 'wanfa', title: '万法皆空',
      cond: function (s) {
        return _ferryCount(s) >= 8 && (s.good || 0) > (s.evil || 0) * 2 && _npc(s, '观音') >= 10;
      },
      text: '凌云渡上，你合掌不语。八十一难的经文在你口中化作一句"阿弥陀佛"——不是你念了佛，是佛终于念了你。观音在云头合掌，如来微微颔首。你脱去袈裟，肉身随江水漂走，只留一念清明。万法皆空，空而不空——这一世，你把自己渡成了一卷无字真经。',
    },
    // P1) 战佛临世：战道选择≥8
    zhanfo: {
      id: 'zhanfo', title: '战佛临世',
      cond: function (s) {
        return _warCount(s) >= 8;
      },
      text: '你是一路杀到灵山的。棒下的妖、殿前的佛、拦路的仙，都成了你脚下的阶。如来问你：取经人，你可知罪？你把棒往地上一顿：罪？我杀的都是该杀的。满天神佛无人敢应。你撕了袈裟，碎了钵盂，指着雷音寺大笑：从今日起，佛由我来做——战佛临世，不服的，出来打。',
    },
    // P1) 缘定三生：缘道选择≥6 且 npcRel总和≥20 且 收八戒+沙僧
    yuanding: {
      id: 'yuanding', title: '缘定三生',
      cond: function (s) {
        return _yuanCount(s) >= 6 && _npcRelSum(s) >= 20 && _hasBajie(s) && _hasShaseng(s);
      },
      text: '你走到灵山，身后站着八戒、沙僧、白龙马，还有一路结识的妖王旧部。如来问：经呢？你指了指身后的人：这就是经。十世修行，你修的不是佛，是缘——每一个被你渡化的妖、被你感动的人、被你救下的魂，都是你经卷上的一个字。灵山无声，因为这卷经，他们写不出来。',
    },
    // 4) 金蝉正果：取经人 + 善≥恶 + 通关（未走逆道/还俗分支）
    jinchan: {
      id: 'jinchan', title: '金蝉正果',
      cond: function (s) {
        return s.hero === 'tangseng' && (s.good || 0) >= (s.evil || 0);
      },
      text: '八十一难历历在心，你仍以慈悲渡尽劫波。凌云渡上，金蝉脱去的不是凡壳，而是最后一丝执妄。佛光不惊不怖，你合掌低眉——这一世，取经人如愿成佛，真经东归，度的不只是众生，还有那个十世前敢问一句"度的是谁"的自己。',
    },
    // 5) 一魄转世：恶盖善 或 逆道抉择≥3 + 通关（拒绝成佛，横刀向颈）
    yipo: {
      id: 'yipo', title: '一魄转世',
      cond: function (s) {
        return (s.evil || 0) > (s.good || 0) || _rebelCount(s) >= 3;
      },
      text: '你走到灵山脚下，却不愿跪。经不必取，佛不必见，天命更不必认。横刀向颈，血溅凌云渡——肉身沉水，只留一魄不灭。你望着西天那盏灯笑了：你们说度人，可你们连自己的账都不敢算。这一魄投胎来世，再走一条更野的路——下一世，簿子上的名字，要换你来写。',
    },
    // 6) 逆道西行：兜底（非取经人且未命中上述动态结局时由 computeEnding 接管；此处保留文本框架）
    nidao: {
      id: 'nidao', title: '逆道西行',
      cond: function (s) { return s.hero === 'tangseng'; },
      text: '你走过八十一难，虽未成佛，却也未输。西游簿上少了一笔，天地间多了一条不认命的路。长安的灯、灵山的钟、半途的血，都化作你脚下一块垫脚石——经你取了，佛你见了，可你偏不跪。这，便是逆道西行。',
    },
  };

  // 优先级顺序（命中第一个 cond 为真者即终局）
  var ORDER = ['lingshan', 'liuer', 'changan', 'wanbao', 'wanfa', 'zhanfo', 'yuanding', 'jinchan', 'yipo', 'nidao'];

  NDX.Ending = {
    DEFINITIONS: DEFINITIONS,
    ORDER: ORDER,
    // 按优先级遍历，返回 { title, text }；无任何动态结局命中时返回 null（交由 computeEnding 兜底）
    determineEnding: function (s) {
      for (var i = 0; i < ORDER.length; i++) {
        var d = DEFINITIONS[ORDER[i]];
        try {
          if (d.cond(s)) return { title: d.title, text: d.text };
        } catch (e) { /* 单结局判定异常不阻断终局流程 */ }
      }
      return null;
    },
    endingText: function (id) {
      var d = DEFINITIONS[id];
      return d ? { title: d.title, text: d.text } : null;
    },
  };
})();
