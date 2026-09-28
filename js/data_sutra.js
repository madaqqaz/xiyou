// =============================================================
// data_sutra.js — 三套经文系统（渡藏/逆藏/六藏）
// SUTRA_FRAG_NAMES/NI_SUTRA_*/SUTRA_SIX_CANG/碎片合成/数量加成
// 从 data.js 拆分（2026-08-31，Node 锚点拆分）
// 全局命名空间 NDX
// =============================================================
window.NDX = window.NDX || {};
var NDX = window.NDX;

// ============================================================
// 佛经系统（通关后激活 · 自己西游 + 恶线专属战力）
// 前提：s.fate.逆 >= 1（自带行囊上路——取经是自己的事）且 s.evil > 0（恶）
// 机制：恶线劫难掉落佛经碎片（散件），凑够该部「定价 cost」枚即可「合成全本」（V9.54 按定位定价）；
//       全本存入 s.sutras，由 computeStats 读取提供被动战力。
// 数量/内容参照梦幻西游散件风格；⚠ 片数不再等于经文字数（V9.54 定价见 NDX.SUTRA_COST）。
// ============================================================
NDX.SUTRA_FRAG_NAMES = {
  // 🔴 V9.54：碎片**种类**不足者补足到 6 —— 旧《大悲咒》仅 2 种 /《阿弥陀经》3 种，
  //   而定价 6 枚 ⇒ 玩家须在同一枚残片上叠 3 次，体感是「永远凑不齐不同的字」。
  //   ⚠ 零迁移风险：新增的 fid 旧存档中不存在（视为 0 枚），旧 fid（千/手…）仍照常计数；
  //     `sutraHave` 按「该部残片总数求和」口径，扩展只增可选面，不夺存量。
  dabei: ['千','手','眼','悲','生','莲'],
  amituo: ['西','方','净','土','愿','接'],
  xinjing: ['观','照','空','度','明'],
  dizang: ['狱','誓','孝','愿','慈','救'],
  shanshan: ['身','口','意','业','道','净'],
  jingang: ['断','行','证','我','相','法','空'],
  wuliangshou: ['量','寿','光','愿','劫','海','众','生'],
  weimo: ['疾','室','座','香','饭','默','道','缽'],
  yuanjue: ['性','轮','觉','境','净','照','定','慧'],
  lengyan: ['咒','耳','圆','通','破','魔','显','密','严'],
  fahua: ['妙','药','喻','化','城','会','三','归','一','莲'],
  lengqie: ['楞','伽','识','海','转','智','性','空','月','波'],
  jieshenmi: ['深','密','三','性','无','相','了','义','真','如','解'],
  niepan: ['涅','槃','常','乐','我','净','寂','灭','为','乐','无','余'],
  tanjing: ['坛','经','顿','悟','无','住','生','心','摩','诃','般','若'],
  huayan: ['尘','刹','海','藏','界','光','云','盖','网','影','劫','轮','重','玄','法','界'],
  guanyin: ['闻','声','救','苦'],
  wenshu: ['慧','剑','断','执'],
  // —— V8.57 补后段大经碎片名（原标「act14-17 专属池」，那是 17 地区旧制；9 章制下已按 cost 递增配入第 3~9 章）——
  jinguangming: ['金','光','明','照','护','国','佑','民','忏','业','障','消'],
  renwang: ['仁','王','护','国','般','若','波','罗','蜜','多','镇','国','安','邦'],
  faju: ['法','句','譬','喻','缘','起','性','空','无','常','无','我','寂','灭','为','乐'],
  fanwang: ['梵','网','千','佛','菩','萨','戒','本','华','藏','世','界','莲','华','台','藏','性','海','印','定']
};
// 动态生成渡经碎片（V8.27 收集制：碎片数=命名表长度，全收集才合成）
NDX.SUTRA_FRAGS = [];
Object.keys(NDX.SUTRA_FRAG_NAMES).forEach((key) => {
  NDX.SUTRA_FRAG_NAMES[key].forEach((nm, i) => {
    NDX.SUTRA_FRAGS.push({ id: 'su_' + key + '_' + i, sutra: key, name: nm, note: '渡经残片·' + nm, ord: i });
  });
});NDX.SUTRA_FULLS = [
  { id: 'su_full_jingang', name: '《金刚经》全本', sutra: 'jingang', region: 4, chant: { per: 0.015 }, effect: {"ti":{"atk":28,"hp":120},"mdef":0.05,"dr":0.03}, desc: '破相显性，刀兵不能伤其本心，体攻与御念同增。', chantSkill: { name: '金刚怒目', cd: 2, mult: 1.7, kind: 'break-mantra', desc: '法伤并破甲真伤（持诵）' } },
  { id: 'su_full_xinjing', name: '《般若波罗蜜多心经》全本', sutra: 'xinjing', region: 2, chant: { per: 0.015 }, effect: {"matk":25,"ti":{"hp":100},"yuan":{"matk":8}}, desc: '照见五蕴皆空，愿伤与法伤同涨，渡厄不滞。', chantSkill: { name: '照见五蕴', cd: 2, mult: 1.6, kind: 'zen-heal', desc: '法伤并回血（持诵）' } },
  { id: 'su_full_fahua', name: '《法华经》全本', sutra: 'fahua', region: 9, chant: { per: 0.015 }, effect: {"ti":{"atk":20,"hp":160},"healPct":0.06}, desc: '会三归一，慈悲回血，气血与自愈同增。', chantSkill: { name: '会三归一', cd: 2, mult: 1.5, kind: 'ward-mantra', desc: '法伤并护盾（持诵）' } },
  { id: 'su_full_huayan', name: '《华严经》全本', sutra: 'huayan', region: 'global', chant: { per: 0.015, zenLayer: 1 }, effect: {"ti":{"hp":200},"dr":0.05,"maxhpPct":0.04}, desc: '一即一切，护体如海，气血上限与减伤同长。', chantSkill: { name: '华严海印', cd: 2, mult: 1.8, kind: 'ward-mantra', desc: '法伤并大护盾（持诵·终极经）' } },
  { id: 'su_full_lengyan', name: '《楞严经》全本', sutra: 'lengyan', region: 8, chant: { per: 0.015 }, effect: {"matk":22,"mdef":0.06,"ti":{"atk":14}}, desc: '楞严神咒，魔不能侵，法防与法伤并固。', chantSkill: { name: '楞严神咒', cd: 2, mult: 1.6, kind: 'veil-mantra', desc: '法伤并必中真伤（持诵）' } },
  { id: 'su_full_amituo', name: '《阿弥陀经》全本', sutra: 'amituo', region: 1, chant: { per: 0.05 }, effect: {"ti":{"hp":140},"dr":0.03,"yuan":{"hp":40}}, desc: '执持名号，往生愿力，气血与愿伤同源。', chantSkill: { name: '弥陀接引', cd: 3, mult: 1.7, kind: 'bond-mantra', desc: '法伤并唤伴协同（持诵·往生齐击）' } },
  { id: 'su_full_wuliangshou', name: '《无量寿经》全本', sutra: 'wuliangshou', region: 5, chant: { per: 0.015 }, effect: {"ti":{"hp":180},"maxhpPct":0.05,"healPct":0.04}, desc: '无量寿光，续命延元，气血与上限同辉。', chantSkill: { name: '寿光续命', cd: 2, mult: 1.6, kind: 'glut-ton', desc: '法伤并吸血自愈（持诵）' } },
  { id: 'su_full_weimo', name: '《维摩诘经》全本', sutra: 'weimo', region: 6, chant: { per: 0.015 }, effect: {"matk":20,"ti":{"atk":18},"yuan":{"matk":6}}, desc: '不二法门，净名除疾，体法双修。', chantSkill: { name: '净名不二', cd: 2, mult: 1.5, kind: 'zen-heal', desc: '法伤并回血（持诵）' } },
  { id: 'su_full_yuanjue', name: '《圆觉经》全本', sutra: 'yuanjue', region: 7, chant: { per: 0.015 }, effect: {"ti":{"atk":24,"hp":120},"crit":0.05,"dr":0.02}, desc: '圆觉妙心，觉性成轮，暴击与体攻同明。', chantSkill: { name: '觉性成轮', cd: 2, mult: 1.6, kind: 'war-buff', desc: '法伤并激昂暴击（持诵）' } },
  { id: 'su_full_niepan', name: '《涅槃经》全本', sutra: 'niepan', region: 5, chant: { per: 0.015 }, effect: {"ti":{"hp":160},"dr":0.06,"mdef":0.04}, desc: '常乐我净，灭度诸苦，护体坚固。', chantSkill: { name: '涅槃寂静', cd: 3, mult: 1.6, kind: 'ward-mantra', desc: '法伤并护盾（持诵）' } },
  { id: 'su_full_dabei', name: '《大悲咒》全本', sutra: 'dabei', region: 1, chant: { per: 0.05 }, effect: {"matk":18,"healPct":0.07,"yuan":{"matk":6}}, desc: '千手护持，大悲回生，自愈与愿伤同涌。', chantSkill: { name: '大悲回生', cd: 3, mult: 1.7, kind: 'zen-heal', desc: '法伤并大幅回血（持诵）' } },
  { id: 'su_full_lengqie', name: '《楞伽经》全本', sutra: 'lengqie', region: 3, chant: { per: 0.015 }, effect: {"matk":24,"mdef":0.05,"ti":{"atk":16}}, desc: '楞伽识海，转识成智，法防法伤并张。', chantSkill: { name: '楞伽识海', cd: 2, mult: 1.6, kind: 'veil-mantra', desc: '法伤并必中真伤（持诵）' } },
  { id: 'su_full_jieshenmi', name: '《解深密经》全本', sutra: 'jieshenmi', region: 4, chant: { per: 0.015 }, effect: {"ti":{"hp":140},"matk":16,"crit":0.04}, desc: '深密解脱，三性圆明，法伤暴击并起。', chantSkill: { name: '深密解脱', cd: 2, mult: 1.6, kind: 'veil-mantra', desc: '法伤并必中真伤（持诵）' } },
  { id: 'su_full_dizang', name: '《地藏本愿经》全本', sutra: 'dizang', region: 2, chant: { per: 0.015 }, effect: {"ti":{"hp":200},"dr":0.04,"yuan":{"hp":50}}, desc: '地狱不空，誓不成佛，气血与愿伤同承。', chantSkill: { name: '地藏愿力', cd: 3, mult: 1.6, kind: 'bond-mantra', desc: '法伤并同伴分担（持诵·与谛听同途）' } },
  { id: 'su_full_shanshan', name: '《十善业道经》全本', sutra: 'shanshan', region: 3, chant: { per: 0.015 }, effect: {"ti":{"atk":18,"hp":120},"dr":0.03,"mdef":0.03}, desc: '十善业道，善恶同源，攻防并济。', chantSkill: { name: '十善净业', cd: 2, mult: 1.5, kind: 'zen-heal', desc: '法伤并回血（持诵）' } },
  { id: 'su_full_tanjing', name: '《六祖坛经》全本', sutra: 'tanjing', region: 6, chant: { per: 0.015 }, effect: {"matk":26,"ti":{"atk":22},"crit":0.04}, desc: '顿悟成佛，本来无一物，体法暴击通明。', chantSkill: { name: '本来无一物', cd: 2, mult: 1.7, kind: 'veil-mantra', desc: '法伤并必中真伤（持诵）' } },
  // —— V8.57 补后段大经（原标「act14-17 专属池」，17 地区旧制；9 章制下已按 cost 递增配入第 3~9 章）——
  { id: 'su_full_jinguangming', name: '《金光明经》全本', sutra: 'jinguangming', region: 7, chant: { per: 0.015 }, effect: {"ti":{"atk":28,"hp":180},"dr":0.05,"healPct":0.05}, desc: '金光明照，护国佑民，气血与减伤同辉（祭赛国·金光寺）。', chantSkill: { name: '金光明照', cd: 2, mult: 1.7, kind: 'ward-mantra', desc: '法伤并护盾（持诵）' } },
  { id: 'su_full_renwang', name: '《仁王经》全本', sutra: 'renwang', region: 8, chant: { per: 0.015 }, effect: {"ti":{"hp":200},"dr":0.06,"mdef":0.05,"maxhpPct":0.03}, desc: '仁王护国，般若波罗蜜，护体与上限同固（比丘国·仁王殿）。', chantSkill: { name: '仁王护国', cd: 3, mult: 1.7, kind: 'ward-mantra', desc: '法伤并大护盾（持诵）' } },
  { id: 'su_full_faju', name: '《法句经》全本', sutra: 'faju', region: 9, chant: { per: 0.015 }, effect: {"matk":30,"ti":{"atk":24},"crit":0.05,"mdef":0.04}, desc: '法句譬喻，缘起性空，法伤暴击并明（天竺·佛法本源）。', chantSkill: { name: '法句譬喻', cd: 2, mult: 1.8, kind: 'veil-mantra', desc: '法伤并必中真伤（持诵）' } },
  { id: 'su_full_fanwang', name: '《梵网经》全本', sutra: 'fanwang', region: 9, chant: { per: 0.02, zenLayer: 1 }, effect: {"ti":{"hp":220},"dr":0.07,"mdef":0.06,"maxhpPct":0.05,"crit":0.05}, desc: '梵网千佛，菩萨戒本，终极经文——灵山脚下，万法归一（灵山·终极经）。', chantSkill: { name: '梵网千佛', cd: 3, mult: 2.0, kind: 'ward-mantra', desc: '法伤并终极护盾（持诵·灵山终极经）' } },
  // P0-C 传承经文（死亡渐进解锁 · V3 §3.2）：不进常规地区池，仅当累计死亡达阈值
  // 时并入渡经候选池（sutraDropChoices 动态并入）——「每死一局＝多一本可得的传承经」。
  { id: 'su_full_guanyin', name: '《观音经》全本', sutra: 'guanyin', region: 'death', deathReq: 3, chant: { per: 0.02 }, effect: {"ti":{"hp":180},"healPct":0.08,"yuan":{"hp":40}}, desc: '闻声救苦，千处祈求千处应，气血与自愈同涨（传承经 · 死亡3解锁）。', chantSkill: { name: '闻声救苦', cd: 3, mult: 1.7, kind: 'bond-mantra', desc: '法伤并唤伴救度（持诵·传承经）' } },
  { id: 'su_full_wenshu', name: '《文殊般若经》全本', sutra: 'wenshu', region: 'death', deathReq: 6, chant: { per: 0.02 }, effect: {"ti":{"atk":30,"hp":80},"crit":0.06,"matk":12}, desc: '慧剑断执，无明即斩，体攻暴击并明（传承经 · 死亡6解锁）。', chantSkill: { name: '慧剑断执', cd: 2, mult: 1.8, kind: 'war-buff', desc: '法伤并激昂暴击（持诵·传承经）' } }
];
// 补 frags（按命名表动态生成，id 稳定 su_<key>_<i>）
NDX.SUTRA_FULLS.forEach((f) => {
  const names = NDX.SUTRA_FRAG_NAMES[f.sutra] || [];
  f.frags = names.map((_, i) => 'su_' + f.sutra + '_' + i);
});NDX.sutraFragById = function (id) { return NDX.SUTRA_FRAGS.find((e) => e.id === id); };
// 佛经碎片读写封装（碎片存于 Favor 主档 s.sutraFrags，结构 {fragId: count}）
NDX.loadSutraFrags = function () { const f = NDX.loadFavor(); return f.sutraFrags || (f.sutraFrags = {}); };
NDX.saveSutraFrags = function (sf) { const f = NDX.loadFavor(); f.sutraFrags = sf || {}; NDX.saveFavor(); };
NDX.sutraFullById = function (id) { return NDX.SUTRA_FULLS.find((e) => e.id === id); };
// 返回当前可合成的佛经全本（碎片已凑够定价且尚未合成）
// V3 §二 自动路由：已合成入背包（待投）的全本视为「已得」，不再可合成
// 🔴 V9.54：按 `sutraCostOf` 定价判定（旧「集齐全部不同碎片 id」口径过于苛刻，
//   玩家常卡在「永远差 1 片」；新口径只看数量，且 grantSutraShard 的 miss 优先已保证可凑）
NDX.availableSutras = function (s) {
  const done = (s.sutras || []).concat(s.sutraBackpack || []);
  return NDX.SUTRA_FULLS.filter((f) => {
    if (done.indexOf(f.id) >= 0) return false;
    return NDX.sutraHave(s, f.id) >= NDX.sutraCostOf(f.id);
  });
};
// 佛经系统是否已对本局激活（自己西游 + 恶）
NDX.sutraSystemUnlocked = function (s) {
  return (s.fate && s.fate.逆 >= 1) && (s.evil > 0);
};

// ============================================================
// 经文规模真源常量（闭环实测值 · 单一事实来源 · 防文档漂移）
// 渡 22 部 210 片 / 逆 12 部 79 片 / 合计 34 部 289 片；六藏全 34 部覆盖无遗漏。
//   ⚠ 这里的「片」= **残片种类数**（存档结构口径，V9.54 只补种类未增部数）。
//     🔴 玩家面板/合成看到的 N 已改为 **按定位定价**（`NDX.SUTRA_COST`），
//        总量变成 渡 223 / 逆 134 / 合计 357 片。
//        ⚠ S09 §⑤-3 修正（2026-09-27）：勿引 `sutraFragOverview()` 作"合计"——该函数**只覆盖渡侧**
//          （实测返回 {fullN:22, fragN:210, total:223}），拿它当合计会少算逆侧 134 片。
//          真值取证：Σ sutraCostOf(渡部)=223（22 部）· Σ sutraCostOf(逆部)=134（12 部）· 合计 357。
// 早期 V8.27 设计约束「渡 16 部 133 片 / 逆 9 部 58 片（191 片）」已作废——
// 凡文档/注释/代码引用经文数量，须以此处 SUTRA_SPEC 为准；legacy 仅供审计对照。
// ============================================================
// ⚠ V9.54：为支撑按定位定价，《大悲咒》(2→6) /《阿弥陀经》(3→6) /《破戒录》(3→6) 补足了残片种类，
//   故渡 203→210 片、逆 76→79 片（**部数不变**，仅每种经的可选残片变多）。
NDX.SUTRA_SPEC = {
  ferry: { bu: 22, frags: 210 },
  rebel: { bu: 12, frags: 79 },
  total: { bu: 34, frags: 289 },
  legacy: { ferryBu: 16, ferryFrags: 133, rebelBu: 9, rebelFrags: 58 },
};

// ============================================================
// 🔴 V9.54 碎片定价重做（2026-09-25 用户拍板）：**按定位定价，不再按经文字数**
//   旧口径「1 字 1 片」导致《大悲咒》2 片成一本、终极《梵网经》20 片——成本与强度完全脱钩，
//   玩家只会去刷最便宜的两部，34 部经文等于只有 2 种形态。
//   新口径：合成某部全本**只需凑够 `cost` 个残片**（该部任意片，不须集齐特定 id）——
//     · 碎片 id 生成与存档结构**完全不变**（`su_<key>_<i>` 稳定，零迁移）
//     · `grantSutraShard` 的「miss 优先补缺失片」天然适配 ⇒ 不再出现「永远差一片」
//     · 体感从「集齐 20 个不同字」变成「攒够 12 片」，目标明确
//   平衡口径：定价须同时满足 ①渡/逆两侧单局可达量 ②寿命（消耗寿元换碎片）
// ============================================================
NDX.SUTRA_COST = {
  // —— 渡经 22 部 ——
  dabei: 6, amituo: 6,                                  // 入门（1~2 章即得）
  guanyin: 7, wenshu: 7,                                // 传承经（死亡 3/6 解锁）
  xinjing: 8, dizang: 8,                                // 区域常规
  shanshan: 9, jingang: 9, wuliangshou: 9,              // 区域常规（3~5 章）
  weimo: 10, yuanjue: 10, lengyan: 10, fahua: 10,        // 区域进阶
  lengqie: 11, niepan: 11, tanjing: 11, jieshenmi: 11,
  // ⚠ 2026-09-28 9 章制：后段大经已按 cost 递增配入第 3~9 章（见 SUTRA_FULLS[].region），
  //   旧注释「13~15 章 / 16 章·天竺 / 17 章·灵山」是 17 地区制遗留，已随 region 归一。
  jinguangming: 11, renwang: 11,                         // 区域特色（第 7~8 章）
  faju: 12,                                              // 高阶（第 9 章·天竺）
  huayan: 16,                                            // 终极（global·限量·每章低频）
  fanwang: 20,                                           // 终极（第 9 章·灵山）
  // —— 逆经 12 部 ——
  // ⚠ 逆经整体较渡经**贵一档**：逆经 `chant.per` 达 0.10/片（渡经仅 0.015/片，相差 6.7 倍），
  //   强度不对等 ⇒ 定价须同比例上抬，否则「逆经 6 片白送」会碾压整条渡经线。
  pojie: 8,
  wuzi: 10, yaopu: 10,
  xinyuan: 11, qitian: 11,
  tigujue: 12, zhanyaojue: 12,
  niumo: 13,
  xuefo: 14, duotian: 14,
  nitian: 16, mieshi: 16,
};
// 某部全本的定价（片）；无定价项→回退「按命名表长度」的旧口径（防数据遗漏）
// 🔴 硬夹取：cost ≤ **碎片种类数 × 2**（同一枚残片最多叠 2 次）。
//   防止「某部经只有 2 种残片却定价 12」这类不可达定价——那等于该经**永远合成不了**。
NDX.sutraCostOf = function (fullId) {
  const f = NDX.sutraFullById(fullId) || NDX.niSutraFullById(fullId);
  if (!f) return 0;
  const kinds = (f.frags && f.frags.length) || 1;
  const c = NDX.SUTRA_COST[f.sutra];
  if (typeof c !== 'number') return kinds;
  return Math.min(c, kinds * 2);
};
// 某部全本当前已凑到的残片数（该部任意片，可重复计）
NDX.sutraHave = function (s, fullId) {
  if (!s || !fullId) return 0;
  const f = NDX.sutraFullById(fullId) || NDX.niSutraFullById(fullId);
  if (!f || !f.frags) return 0;
  const frags = (f.id.indexOf('ni_') === 0) ? (s.niSutraFrags || {}) : (s.sutraFrags || {});
  let n = 0;
  for (let i = 0; i < f.frags.length; i++) n += frags[f.frags[i]] || 0;
  return n;
};
// 进度（{have, need, pct}）——UI 一律用此口，勿再手算
NDX.sutraProgress = function (s, fullId) {
  const need = NDX.sutraCostOf(fullId) || 1;
  const have = NDX.sutraHave(s, fullId);
  return { have: have, need: need, pct: Math.max(0, Math.min(100, Math.round(have / need * 100))) };
};
// 合成扣片：优先扣「同部内已有余量 >1 的片」（保留稀缺片），扣满 need 为止
// 返回 true 表示扣减成功（调用方须先确认可合成）
NDX.sutraConsumeFor = function (s, fullId) {
  if (!s || !fullId) return false;
  const f = NDX.sutraFullById(fullId) || NDX.niSutraFullById(fullId);
  if (!f || !f.frags) return false;
  const want = NDX.sutraCostOf(fullId);
  const bag = (f.id.indexOf('ni_') === 0) ? (s.niSutraFrags || {}) : (s.sutraFrags || {});
  const count = NDX.sutraHave(s, fullId);
  if (count < want) return false;
  // ① 余量 >1 的片先扣（保留稀缺）；② 余量 =1 的片（按命名表顺序）
  const idx = f.frags.map(function (fid, i) { return { fid: fid, i: i, n: bag[fid] || 0 }; });
  idx.sort(function (a, b) { return (b.n > 1 ? 1 : 0) - (a.n > 1 ? 1 : 0) || a.i - b.i; });
  let left = want;
  for (let k = 0; k < idx.length && left > 0; k++) {
    const take = Math.min(idx[k].n, left);
    bag[idx[k].fid] = idx[k].n - take;
    if (bag[idx[k].fid] <= 0) delete bag[idx[k].fid];
    left -= take;
  }
  return left <= 0;
};

// ============================================================
// 🔴 V9.54 土地庙·诵经（2026-09-25 用户拍板：「每章打完 boss，进入下一章开始的土地庙，
//   可以选择诵经，增加经文」）——渡经在节点层的**唯一稳定产出**，同时是经文多样性的主入口。
//   定价：每章免费 1 次（对应「章首土地庙」），此后每次耗寿元；每章至多 3 次（防刷）。
//   寿命真源 `NDX.LIFE.DAYS_PER_YEAR`（360 天/年），故耗寿以「天」计价再年化，与全局同轴。
// ============================================================
NDX.SUTRA_CHANT = {
  FREE_PER_ACT: 1,     // 每章免费诵经次数（章首土地庙·香火未尽）
  MAX_PER_ACT: 3,      // 每章上限（含免费）
  //   ⚠ 寿命平衡实算（余寿 23 年 = 8280 天）：用满 = 9 章 × 付费 2 次 × 40 天 = 720 天 = 2.0 年，
  //     占余寿 8.7%。低于此值（试过 18 天 ⇒ 仅 3.9%）寿命几乎不构成约束，诵经成为无脑刷；
  //     高于 60 天（⇒ 13%）则会逼玩家放弃经文线，与「经文＝技能多样性」的设计目的相悖。
  LIFE_DAYS: 40,       // 超出免费额度后，每诵一次耗寿元（天）
  GAIN: 1,             // 每次诵经补 1 枚残片（走 grantSutraShard 的「miss 优先」→ 永不成废片）
  //   一周目得体感（9 章 × 3 次 = 27 枚 + 探索/战斗掉落 ≈ 45~50 枚）：
  //   可成 4~6 部小经或 2~3 部中经 ⇒ 立刻看得见 chant 形态变化（多样性），
  //   但终极《梵网经》(20 片) 须跨周目 —— 稀缺性与成长感同时保住。
};
// 当前章本已诵次数（存 s._chantLog = { act: n }）
NDX.sutraChantUsed = function (s) {
  if (!s) return 0;
  const n = s._chantLog && s._chantLog.act;
  return (typeof n === 'number') ? n : 0;
};
// 🔴 S09 §⑤-7（2026-09-27 债务收口）：SUTRA_CHANT 的**兜底取值单点**。
//   真值 `LIFE_DAYS = 40`（本文件 SUTRA_CHANT 定义处）。原代码在 3 处各写 `|| 18`，
//   一旦真源缺失/改名，诵经寿元代价会**静默降价 55%**（40 天 → 18 天）且无任何告警。
//   现统一走本函数；**禁再在别处写该字面量**（门禁 `_verify_sutra_two_type.js` 已加断言）。
NDX.sutraChantCfg = function () {
  const C = NDX.SUTRA_CHANT || {};
  return {
    FREE_PER_ACT: (C.FREE_PER_ACT != null) ? C.FREE_PER_ACT : 1,
    MAX_PER_ACT:  (C.MAX_PER_ACT  != null) ? C.MAX_PER_ACT  : 3,
    LIFE_DAYS:    (C.LIFE_DAYS    != null) ? C.LIFE_DAYS    : 40,  // 与真值同源（非 18）
  };
};
NDX.sutraChantQuota = function (s) {
  const C = NDX.sutraChantCfg();
  const act = (s && s.act) || 1;
  const used = NDX.sutraChantUsed(s);
  const left = Math.max(0, (C.MAX_PER_ACT || 3) - used);
  const freeLeft = Math.max(0, (C.FREE_PER_ACT || 1) - used);
  return {
    act: act, used: used, left: left, freeLeft: freeLeft,
    nextCostDays: freeLeft > 0 ? 0 : C.LIFE_DAYS,
    free: freeLeft > 0,
  };
};
// 可诵经池：当前章可得（region 匹配 / global / 传承经解锁）+ 尚未合成 + (已有碎片或本章内出现过)
//   排序：① 缺口最小优先（快成一本，正反馈）② 本章区域经优先（地域叙事）③ 名称序
NDX.sutraChantPool = function (s) {
  if (!s) return [];
  const act = (s && s.act) || 1;
  const done = [].concat(s.sutras || [], s.sutraBackpack || []);
  const deaths = (s.deaths || 0);
  const list = NDX.SUTRA_FULLS.filter(function (f) {
    if (done.indexOf(f.id) >= 0) return false;
    if (f.region === 'global') return true;                        // 限量 global 经（华严）
    if (f.region === 'death') return deaths >= (f.deathReq || 3);  // 传承经（死亡解锁）
    return f.region === act;                                        // 本章区域经
  });
  const scored = list.map(function (f) {
    const pg = NDX.sutraProgress(s, f.id);
    return { id: f.id, name: f.name, have: pg.have, need: pg.need, gap: pg.need - pg.have,
             region: f.region, pct: pg.pct };
  }).filter(function (x) { return x.gap > 0; });
  scored.sort(function (a, b) {
    if (a.need !== b.need) return a.need - b.need;   // 便宜的先成（早期正反馈）
    if (a.gap !== b.gap) return a.gap - b.gap;
    return (a.id > b.id ? 1 : -1);
  });
  return scored;
};
// 诵一经：补 GAIN 枚该部残片（miss 优先 ⇒ 永不浪费），扣寿元/记次。返回 {ok, gain, costDays, name}
NDX.doChantSutra = function (s, fullId) {
  if (!s || !fullId) return { ok: false, why: '未择经' };
  const q = NDX.sutraChantQuota(s);
  if (q.left <= 0) return { ok: false, why: '此章诵经已至上限，来世再诵' };
  const f = NDX.sutraFullById(fullId);
  if (!f) return { ok: false, why: '无此经' };
  const done = [].concat(s.sutras || [], s.sutraBackpack || []);
  if (done.indexOf(f.id) >= 0) return { ok: false, why: `${f.name} 已合成，毋庸再诵` };
  const pg = NDX.sutraProgress(s, f.id);
  if (pg.have >= pg.need) return { ok: false, why: `${f.name} 残片已满` };
  // 扣寿元（仅超出免费额度时）· 走寿命唯一入口：Game 层启动时注入 NDX.sutraLifeSink（= _loseLife）
  //   ⚠ 直接 `s.life -= x` 会绕过大限判定（_checkLife）与新手寿数教学 —— 严禁在此直写 s.life。
  let costDays = 0;
  if (!q.free) {
    const C = NDX.sutraChantCfg();   // S09 §⑤-7：单点取值，禁用字面量 18
    costDays = C.LIFE_DAYS;
    const D = (NDX.LIFE && NDX.LIFE.DAYS_PER_YEAR) || 360;
    const costYr = costDays / D;
    if ((s.life || 0) <= costYr) return { ok: false, why: '寿元将尽，无以为诵' };
    if (NDX.sutraLifeSink) { try { NDX.sutraLifeSink(s, costYr); } catch (e) {} }
    else s.life = Math.max(0, (s.life || 0) - costYr);
  }
  // 补片：走 NDX.grantSutraShard(s,'ferry',fullId,act)—— 其内部已实现
  //   ① **miss 优先**：只补该部尚缺的片 ⇒ 永不出废片、永不「永远差一枚」
  //   ② **集齐自动合成**：凑够即成全本并自动投入（routePendingSutras），与常规掉落同口径
  NDX.grantSutraShard(s, 'ferry', f.id, (s.act || 1));
  // 记次（同章累计）
  s._chantLog = s._chantLog || {};
  s._chantLog.act = q.used + 1;
  return { ok: true, name: f.name, gain: (NDX.SUTRA_CHANT || {}).GAIN || 1, costDays: costDays, free: q.free };
};

// ============================================================
// 经文收集制 API
// 掉落：渡=地区池（大经低频）、逆=未完成逆经池；华严限量；逆天录锁二周目。
// 状态：s.sutraFrags（渡片 {fid:count}）/ s.niSutraFrags（逆片）/ s.sutras / s.niSutras（全本）
// ============================================================
NDX.SUTRA_GLOBAL_POOL = ['su_full_huayan', 'su_full_lengqie', 'su_full_jieshenmi', 'su_full_niepan', 'su_full_tanjing'];
// 🔴 2026-09-28 P0：「派生优先于手写」——本表**不再手写**，改为从 `SUTRA_FULLS[].region` 派生。
//   背景（9 章制核查）：游戏已确认为 **9 章＝9 地区 1:1**（`NDX.TOTAL_ACTS = 9`，`ACT_RANGES` 唯一真源），
//   调用方传入的 `act` 恒为 1~9。旧写法手写 17 个键（1~17，17 地区制遗留），与 `region` 字段两张皮：
//   旧写法是手写 17 个键（1~17，17 地区制遗留），与 `region` 字段两张皮：
//     · 键 10~17 在 9 章制下（`act` 恒 1~9）永不命中 ⇒ 8 部后段大经结构性不可达；
//     · `region` 字段又另写 10~17 ⇒ `sutraChantPool` 的 `f.region === act` 同样永不成立。
//   派生后：改 `region` 一处即全链路同步，两张表不可能再漂移。
//   《华严经》(region:'global') 不入任何章的 region 派生结果，故每章单独并入一次 ——
//   依据是 `sutraDropChoices` 里 `pool.filter(fid => fid==='su_full_huayan' ? picked < HUAYAN_QUOTA(act) : true)`：
//   该过滤**假定华严在章池内**，否则整段是死代码。配合 QUOTA（1~2 片/章）实现「低频、跨周目」。
//   ⚠ 提取为**可重算函数**（而非一次性 IIFE）：门禁 `_verify_sutra_reach` 须拿它做反证
//   （改一部经的 region 再重算，验证派生真的跟着变），写成 IIFE 就只能做静态断言。
NDX.sutraRegionMap = function () {
  const m = {};
  (NDX.SUTRA_FULLS || []).forEach((f) => {
    if (typeof f.region !== 'number') return;          // 'global' / 'death' 不进章池
    (m[f.region] = m[f.region] || []).push(f.id);
  });
  Object.keys(m).forEach((k) => { if (m[k].indexOf('su_full_huayan') < 0) m[k].push('su_full_huayan'); });
  return m;
};
NDX.SUTRA_REGION = NDX.sutraRegionMap();
// 地区渡经池（9 章制）。⚠ `|| SUTRA_GLOBAL_POOL` 仅在 act 越界/未配置时兜底——
//   正常 1~9 章都命中左支，故 global 池里的经文**必须同时出现在某个章池**才可达
//   （由 `_verify_sutra_reach` 逐部钉死）。
NDX.sutraRegionPool = function (act) {
  return (NDX.SUTRA_REGION[act] || NDX.SUTRA_GLOBAL_POOL);
};
// 华严经单章限量（9 章制）：第 1~6 章每章最多 1 片、第 7~9 章每章最多 2 片。
//   🔴 2026-09-28 修复：原实现按「1-10 / 11-15 / 16-17」分档（17 地区遗留）⇒
//   `act` 恒 1~9 时 `>=16` 与 `>=11` 两个分支**都是死代码**、实际恒返回 1（等于没有后段放量）。
//   现按 9 章重排为 1~6 / 7~9 两档，分支全部可达。
NDX.HUAYAN_QUOTA = function (act) {
  if (act >= 7) return 2;
  return 1;
};
// 本地区已拾华严片数
NDX.sutraPickedCount = function (s, act, fullId) {
  return ((s._sutraActPick || {})[act + ':' + fullId]) || 0;
};
// 三选一池：渡=当前地区池（未完成优先，含全局大经低频）；逆=未完成逆经抽 3 部候选
// V3 §二 自动路由：已合成入背包（待投）的全本同样视为已完成，不再进入候选池
// P0-C 传承经文：SUTRA_DEATH_POOL 不进常规地区池，累计死亡达 deathReq 才并入候选池
NDX.SUTRA_DEATH_POOL = ['su_full_guanyin', 'su_full_wenshu'];
NDX.sutraDropChoices = function (s, side, act) {
  const frags = side === 'ferry' ? (s.sutraFrags || {}) : (s.niSutraFrags || {});
  const bp = (s.sutraBackpack || []);
  const done = side === 'ferry' ? (s.sutras || []).concat(bp) : (s.niSutras || []).concat(bp);
  const fulls = side === 'ferry' ? NDX.SUTRA_FULLS : NDX.NI_SUTRA_FULLS;
  let pool;
  if (side === 'ferry') {
    pool = NDX.sutraRegionPool(act).slice();
    // 华严限量过滤
    if (act) pool = pool.filter((fid) => {
      if (fid !== 'su_full_huayan') return true;
      return NDX.sutraPickedCount(s, act, fid) < NDX.HUAYAN_QUOTA(act);
    });
    // V3 §二 已完成（含待投）全本不再进入掉落候选池
    pool = pool.filter((fid) => done.indexOf(fid) < 0);
    // P0-C 传承经文：死亡达阈值 → 并入候选池（横向解锁，非数值）
    const _dcnt = (typeof NDX.deathCount === 'function') ? NDX.deathCount() : 0;
    (NDX.SUTRA_DEATH_POOL || []).forEach((fid) => {
      if (done.indexOf(fid) >= 0) return;
      const f = NDX.sutraFullById(fid);
      if (f && f.deathReq && _dcnt >= f.deathReq && pool.indexOf(fid) < 0) pool.push(fid);
    });
  } else {
    const cyc = (NDX.getCycle ? NDX.getCycle() : 1);
    pool = fulls.filter((f) => done.indexOf(f.id) < 0 && (!f.cycleReq || cyc >= f.cycleReq)).map((f) => f.id);
    if (!pool.length) pool = fulls.filter((f) => !f.cycleReq || cyc >= f.cycleReq).map((f) => f.id);
  }
  if (!pool.length) return [];
  // 未完成部优先
  // 🔴 V9.54：口径改为「按定价判定」——旧 `frags.every(...>=1)` 是「集齐全部不同片」，
  //   在新定价下（cost 可能 < 碎片种类数）会误判「还差片」，把快凑满的经踢出候选池。
  const missing = fulls.filter((f) => pool.indexOf(f.id) >= 0
    && !((NDX.sutraHave ? NDX.sutraHave(s, f.id) : 0) >= (NDX.sutraCostOf ? NDX.sutraCostOf(f.id) : 0)));
  const cands = (missing.length ? missing : fulls.filter((f) => pool.indexOf(f.id) >= 0)).map((f) => f.id);
  const _base = cands.slice();                    // 本章池（六道倾向的「本地」参照，见下 _wOf）
  let arr = cands.slice();
  const picked = [];
  // V9.6 六道主干（GDD §2.2 经文池）：候选取 3 由「均匀随机」改为「六道数量 × 主道」加权抽取，
  //   使「经文出现概率」与其他池同口径受六道偏置（软饱和）；无信号时权重全 1 = 均匀随机（零回归）。
  const _mainDao = (NDX.DaoSystem && NDX.DaoSystem.getMainDao) ? NDX.DaoSystem.getMainDao(s) : (NDX.playerDao ? NDX.playerDao(s) : null);
  // 🆕 V9.70 候选面放宽（解「六道倾向」死代码的唯一正解）：
  //   🔴 根因：渡侧章池**恒 3 部**（ch9 为 4）而三选一正好抽 3 ⇒ `while` 循环一次全取，
  //      权重只改变**出列顺序**、不改变**集合本身** ⇒ `_wOf` 的六道偏置数学上不可能生效
  //      （2026-09-28 已定性为死代码；V9.69 只在保底那 1 席上兑现了「优先」）。
  //   · 放宽到「全本未完成面」，使抽 3 真正成为**取舍**；「本章池」语义由 `_wOf` 的本地倍率保住
  //     （本章经 ×3，仍是候选主体），而不是靠**限制候选面**这种硬切手段。
  //   · 构造性零回归：候选面已 ≥ 池宽（如 ch9 的 4 部 / 逆侧 12 部）⇒ 不进入放宽分支，逐字不改。
  //   · 华严不进放宽面：它是「全局大经·低频」，由 HUAYAN_QUOTA 独占通道（混入会让每章候选都变华严）。
  if (arr.length < NDX.SUTRA_PICK_WIDE && NDX.sutraPickWidePool) {
    arr = NDX.sutraPickWidePool(s, side, act, arr);
  }
  // 🔴 V9.70 事实核查（写代码时实测，别只看函数名）：**经文原是没有六道标签的**——
  //   `sutraDaoOf` 对渡侧 22 部恒返回 '渡'、对逆侧 12 部恒返回 '逆'（值域只有这两值）。
  //   ⇒ `daoPoolMult`/`d === _mainDao` 两条**对全体候选同乘一个常数**，对集合取舍零影响，
  //     是比「章池恒 3 部」更底层的死代码根因。
  //   ✅ 2026-09-28 已由 `NDX.SUTRA_SIX_DAO` 打完六道标签（34 部全部归位，六道无空道），
  //      本段改读 `sutraSixDaoOf` —— 六道倾向在这条抽选链上**数学上**生效，不再只是话术。
  //   ⚠ `sutraDaoOf` 的「渡/逆」语义只留给藏别展示与 attr_calc 的自动路由加成，**不许再当六道用**。
  const _wOf = (fid) => {
    const d = NDX.sutraSixDaoOf ? NDX.sutraSixDaoOf(fid) : null;
    let w = 1;
    // 🩸 常量读取**禁 `|| 默认值`**：`0 || 1` === 1 ⇒ 把常量设成 0 想「关掉某条规则」会静默失效，
    //   反证脚本改 0 也关不掉（V9.70 本地保底席就栽在这，门禁 G4 反证红不了）。一律用 typeof 判型。
    if (_base.indexOf(fid) >= 0) w *= (typeof NDX.SUTRA_PICK_LOCAL_MULT === 'number' ? NDX.SUTRA_PICK_LOCAL_MULT : 1);
    if (d && NDX.daoPoolMult) w *= NDX.daoPoolMult(s, d);
    if (d && _mainDao && d === _mainDao) w *= (NDX.DAO_EQUIP_W || 4);
    return w;
  };
  while (picked.length < 3 && arr.length) {
    const ws = arr.map(_wOf);
    const _wi = NDX.runWeightedPick ? NDX.runWeightedPick(ws) : Math.floor(NDX.runRandom() * arr.length);
    const i = (_wi < 0 || _wi >= arr.length) ? Math.floor(NDX.runRandom() * arr.length) : _wi;
    picked.push(arr.splice(i, 1)[0]);
  }
  // 🆕 V9.69 包裹型保底席（用户拍板「技能变更性经文优先」在这条抽选链上的唯一兑现点）：
  //   · 保底池是**跨章**的（NDX.sutraWrappedCrossPool），不是本章池 —— 本章池只有 3~4 部，
  //     其中包裹型经常在 0~1 部（ch2/ch3/ch6 甚至只有华严一部，还被 HUAYAN_QUOTA 限量过滤）
  //     ⇒ 若保底池＝本章池，「优先」在这半数章节里会静默失效。
  //   · 保底席**吃 _wOf 六道权重**（主道经 ×4），所以「按六道带倾向性」在这条新通道上是真生效的；
  //     原抽选的另 2 席仍是章池恒 3 部抽 3 ⇒ 六道权重在那 2 席上仍是死代码（残留，见报告）。
  //   · 零回归：act<=1（首章不发，用户拍板）⇒ 保底 0 席 ⇒ 上面 while 段的产出**逐字不改**。
  //   · 逐席补齐而非「替换整批」：已抽中包裹型就跳过，不重复塞。
  const _gSlots = NDX.sutraWrapGuarantee ? NDX.sutraWrapGuarantee(act) : 0;
  if (_gSlots && picked.length) {
    const _wrapPool = NDX.sutraWrappedCrossPool ? NDX.sutraWrappedCrossPool(side, s) : [];
    let _have = 0;
    picked.forEach((fid) => { if (_wrapPool.indexOf(fid) >= 0) _have++; });
    for (let _gi = _have; _gi < _gSlots; _gi++) {
      const _rest = _wrapPool.filter((fid) => picked.indexOf(fid) < 0);
      if (!_rest.length) break;
      const _ws = _rest.map(_wOf);
      const _k = NDX.runWeightedPick ? NDX.runWeightedPick(_ws) : 0;
      // 🆕 V9.70 写入位改为「第一个非本章经席位」：本地保底席刚补上的本章经**不能被顶掉**，
      //   否则「本章可诵」与「技能变更优先」这两条保证会互相拆台（E3 实测漏网 2.5~5%）。
      let _slot = -1;
      for (let k = 0; k < picked.length; k++) { if (_base.indexOf(picked[k]) < 0) { _slot = k; break; } }
      // 🔴 找不到非本章经席位时（**本章池 3 部全是本章经且不含包裹型**，逆侧 ch5 正是如此）
      //   必须**替换一席本章经**，不能 `break` 放弃保底 —— V9.70 初版就写成了 break，
      //   实测逆侧 200 次里 62 次（31%）三选一零包裹型，门禁 E4 直接判红。
      //   安全性：3 席全本章经 ⇒ 替换掉 1 席后仍余 2 席本章经 ⇒ 本地保底（≥1 席）照样成立。
      if (_slot < 0) _slot = picked.length - 1;
      picked[_slot] = _rest[(_k >= 0 && _k < _rest.length) ? _k : 0];
    }
  }
  // 🆕 V9.70 本地保底席（必须与包裹型保底席**并列在最后**，顺序错了等于没写）：
  //   · 放宽后候选面 19 部，纯加权抽 3 有一成概率**一部本章经都不中** —— 章池是「本章地域叙事」
  //     的载体（每章三部地域经 + 华严），全被跨章经挤掉会让「本章可诵」这件事消失。这是我用
  //     「放宽候选面」换取舍空间时**没预料到的副作用**，由 `_verify_sutra_reach` G 组抓到。
  //   · 规则：**本章池成员至少占 1 席**，候补按 `_wOf` 权重抽取（不是固定取第一部，否则每章都
  //     是同一部），且**优先替换「不是包裹型」的那一席** ⇒ 不会把 V9.69 的保底席挤掉。
  //   🔴 顺序教训（本轮实测两次翻车，别再犯）：本段**必须写在包裹型保底席之后**，且**全链只此一段**。
  //     ① 放在 while 之后、包裹型保底席之前 ⇒ 包裹型席改写 picked[0]，把刚补的本地席抹掉，
  //        实测仍 5.8% 抽取零本章经（门禁 G3 判红）。
  //     ② 写成两份（一份在包裹型席前、一份在后）⇒ 前面的那份被后面静默覆盖，读代码像是双保险，
  //        实际只有后面那份生效 —— **重复段是隐患不是保险**，删掉先写的那份。
  //   · 只在候选面被放宽时生效 ⇒ 旧行为（arr 未被放宽）逐字不改（构造性零回归）。
  if (arr.length > _base.length && picked.length && (typeof NDX.SUTRA_PICK_LOCAL_SEAT === 'number' ? NDX.SUTRA_PICK_LOCAL_SEAT : 1)) {
    if (!picked.some((fid) => _base.indexOf(fid) >= 0)) {
      const _alt = _base.filter((fid) => picked.indexOf(fid) < 0);
      if (_alt.length) {
        const _ws = _alt.map(_wOf);
        const _k = NDX.runWeightedPick ? NDX.runWeightedPick(_ws) : 0;
        const _pick = _alt[(_k >= 0 && _k < _alt.length) ? _k : 0];
        let _idx = -1;
        for (let k = picked.length - 1; k >= 0; k--) {
          if (!NDX.isWrappedSutra || !NDX.isWrappedSutra(picked[k])) { _idx = k; break; }
        }
        if (_idx < 0) _idx = picked.length - 1;
        picked[_idx] = _pick;
      }
    }
  }
  return picked;
};
// —— 候选面放宽（V9.70）——
//   `SUTRA_PICK_WIDE` 是**抽 3 需要的最小取舍空间**（3 部池抽 3 = 没有取舍）；
//   `SUTRA_PICK_LOCAL_MULT` 是本章经的权重倍率 —— 用「加权」而非「限制候选面」保住章池语义。
//   ⚠ 两者一起改会同时影响「本章经占比」与「六道倾向强度」，调参时先看 `_verify_sutra_wrapped`
//     的 G 组（六道倾向实锤）而非只看候选数量。
// —— 包裹型投放配额（V9.70 用户「按建议来」拍板 ≈6~8）——
//   🔴 为什么要有上限：「包裹型优先」是**硬性保底**（每次三选一必给 ≥1 部），配额放太宽
//     就会退化成「必给哪几部」，玩家的三选一失去取舍。8 是按「内核接线字段数 + 分章节奏」定的：
//     渡侧 22 部里仅 8 部可投放（华严走 HUAYAN_QUOTA 专属通道，不占配额），逆侧 5 部。
//   ⚠ 华严（SUTRA_WRAP_EXCLUDE）**不计入配额**：它不在三选一保底池里，走低频专属通道。
NDX.SUTRA_WRAP_MAX_PER_SIDE = 8;
NDX.SUTRA_PICK_WIDE = 6;
NDX.SUTRA_PICK_LOCAL_MULT = 3;
NDX.SUTRA_PICK_LOCAL_SEAT = 1;      // 本章池至少占 1 席（放宽的配套约束；0 = 退回纯加权抽 3）
// 🩸 关断方式：`SUTRA_PICK_LOCAL_SEAT = 0`（0 是合法关断值，不是「未设置」）；
//   读取端一律 `typeof NDX.X === 'number' ? NDX.X : 默认`，**禁 `NDX.X || 默认`**。
// 放宽面 = 本章池 ∪（未完成 && 非华严 && 满足 cycleReq/死亡传承条件）
NDX.sutraPickWidePool = function (s, side, act, baseIds) {
  const out = (baseIds || []).slice();
  const fulls = (side === 'ferry') ? (NDX.SUTRA_FULLS || []) : (NDX.NI_SUTRA_FULLS || []);
  const bp = (s && s.sutraBackpack) || [];
  const done = side === 'ferry' ? (s.sutras || []).concat(bp) : (s.niSutras || []).concat(bp);
  const cyc = (NDX.getCycle ? NDX.getCycle() : 1);
  const dcnt = (typeof NDX.deathCount === 'function') ? NDX.deathCount() : 0;
  fulls.forEach((f) => {
    if (out.indexOf(f.id) >= 0) return;
    if (NDX.SUTRA_WRAP_EXCLUDE.indexOf(f.id) >= 0) return;      // 华严走低频专属通道
    if (done.indexOf(f.id) >= 0) return;
    if (f.cycleReq && cyc < f.cycleReq) return;
    if (f.deathReq && dcnt < f.deathReq) return;
    out.push(f.id);
  });
  return out;
};
// —— 包裹型经的「优先投放」派生（V9.69）——
//   🔴 背景（为什么不能只靠 `_wOf` 权重）：渡侧章池恒 3 部而三选一正好抽 3 ⇒
//      权重数学上不可能生效（2026-09-28 已定性为死代码）。「优先」必须靠**独立席位**实现。
//   · 首章不发（用户拍板）⇒ NDX.sutraWrapGuarantee(act<=1) === 0。
//   · 跨章而非本章池：见上 sutraDropChoices 保底段注释。
//   · 🔴 排除 su_full_huayan：华严是「全局大经·低频跨周目」定位（HUAYAN_QUOTA 1~2 片/章），
//     让它蹭保底席会让半数章节的保底都变成华严 ⇒ 低频定位被冲掉，同时把 `_verify_sutra_reach`
//     G 组「华严应在候选内」的抽样断言变成抖动来源。
//   · 已完成（含待投背包）自动排除 ⇒ 保底池空时保底静默跳过，不报错、不塞空 id。
NDX.SUTRA_WRAP_GUARANTEE = 1;                                  // 保底席数（单章上限；刻意不做 2 席）
NDX.SUTRA_WRAP_EXCLUDE = ['su_full_huayan'];                    // 不蹭保底席的经（华严走低频专属通道）
NDX.sutraWrapGuarantee = function (act) {
  return (act && act >= 2) ? NDX.SUTRA_WRAP_GUARANTEE : 0;
};
NDX.sutraWrappedCrossPool = function (side, s) {
  const fulls = (side === 'ferry') ? (NDX.SUTRA_FULLS || []) : (NDX.NI_SUTRA_FULLS || []);
  const bp = (s && s.sutraBackpack) || [];
  const done = ((s && (side === 'ferry' ? s.sutras : s.niSutras)) || []).concat(bp);
  return fulls.filter((f) => NDX.isWrappedSutra(f.id)
      && NDX.SUTRA_WRAP_EXCLUDE.indexOf(f.id) < 0
      && done.indexOf(f.id) < 0)
    .map((f) => f.id);
};
// —— 包裹型经的「玩家可见」徽标（V9.70）——
//   🔴 背景：V9.69 的「包裹型优先」只改变**抽取概率**，玩家在列表里看不出哪部经会改行为。
//     一条「行为改写」级的经若没有任何显形，玩家只能用试错去发现 —— 这违背「玩家视角优先」。
//   · 派生而非写死清单：`isWrappedSutra` 是唯一判据，新增包裹型经自动带标（零维护）。
//   · 返回空串表示非包裹型 ⇒ UI 侧 `|| ''` 拼接，零回归（调用点不产生多余空格/标签）。
//   · ⚠ 本函数是**唯一出口**：UI 禁手写 `id === 'su_full_xxx'` 的标记表。
NDX.SUTRA_WRAP_TAG = '⚙技能变更';
NDX.sutraWrapTagText = function (fullId) {
  if (!fullId || !NDX.isWrappedSutra || !NDX.isWrappedSutra(fullId)) return '';
  return NDX.SUTRA_WRAP_TAG;
};
// 徽标 HTML（唯一出口）：非包裹型返回 **空串** ⇒ UI 拼接零副作用（不产生多余标签/空格）。
//   🩸 为什么把 HTML 也放进派生函数：门禁要「真调」而不是「在源码文本里找标识符」。
//      写成 `data_sutra.js 出串 + ui 拼 <span>` 两头，反证时就只能做文本匹配（X4 弱门禁老毛病）。
NDX.sutraWrapBadgeHtml = function (fullId) {
  const t = NDX.sutraWrapTagText(fullId);
  return t ? ('<span class="sutra-wrap-badge" data-wrap-tag="' + t + '">' + t + '</span>') : '';
};
// 授予一片经文碎片（fullId 指定；返回碎片对象）
// 集齐合成完成时的轻提示（V3 §二：避免"掉落瞬间无声盖帽"，告知经名与道途归属）
NDX._notifySutra = function (s, fullId) {
  const full = NDX.sutraFullById(fullId) || NDX.niSutraFullById(fullId);
  const tag = NDX.sutraDaoName ? NDX.sutraDaoName(fullId) : '';
  const mainDao = NDX.playerDao ? NDX.playerDao(s) : null;
  const isMain = tag && mainDao && tag === mainDao;
  try {
    if (NDX.ui && NDX.ui.toast) {
      NDX.ui.toast('📜 经文合成：' + (full ? full.name : fullId) + ' · ' + (tag || '无道') + '道'
        + (isMain ? '（主道经 · 效果 ×1.5）' : '')
        + ' 已自动投入主道途生效。');
    }
  } catch (e) { /* 静默失败 */ }
};
// ============================================================
// V3 §二 · 经文背包（自动路由版）：合成全本先入 s.sutraBackpack（待投），
// 再经 routePendingSutras 按当前主道自动并入 s.sutras/niSutras（已投）生效——
// 「集齐入背包 + 自动投入主道」，不新增玩家决策点。
// 待投期间不提供任何加成（computeStats 只读已投集合）；改道时补路由兜底。
// ============================================================
NDX.sutraBackpackOf = function (s) {
  if (!s) return [];
  return (s.sutraBackpack = s.sutraBackpack || []);
};
// 把「待投」全本自动并入当前主道途生效；返回 { routed, dao, pending }
NDX.routePendingSutras = function (s) {
  if (!s) return { routed: [], dao: null, pending: [] };
  const bp = NDX.sutraBackpackOf(s);
  if (!bp.length) return { routed: [], dao: (NDX.playerDao ? NDX.playerDao(s) : null), pending: [] };
  const mainDao = NDX.playerDao(s);
  s.sutras = s.sutras || [];
  s.niSutras = s.niSutras || [];
  const routed = [];
  const rest = [];
  bp.forEach((fullId) => {
    if (s.sutras.indexOf(fullId) >= 0 || s.niSutras.indexOf(fullId) >= 0) return; // 已生效去重
    const f = NDX.sutraFullById(fullId) || NDX.niSutraFullById(fullId);
    if (!f) return; // 未知 id 丢弃（防御）
    (NDX.sutraFullById(fullId) ? s.sutras : s.niSutras).push(fullId);
    routed.push(fullId);
  });
  s.sutraBackpack = rest;
  return { routed, dao: mainDao, pending: rest.slice() };
};
// 经匣展示用：{ pending: [待投全本], routed: 已投数, mainDao }
NDX.sutraRouteState = function (s) {
  if (!s) return { pending: [], routed: 0, mainDao: null };
  return {
    pending: (s.sutraBackpack || []).slice(),
    routed: (s.sutras || []).length + (s.niSutras || []).length,
    mainDao: NDX.playerDao ? NDX.playerDao(s) : null,
  };
};
NDX.grantSutraShard = function (s, side, fullId, act) {
  const full = side === 'ferry' ? NDX.sutraFullById(fullId) : NDX.niSutraFullById(fullId);
  if (!full) return null;
  // 华严限量
  if (full.id === 'su_full_huayan' && act) {
    if (NDX.sutraPickedCount(s, act, full.id) >= NDX.HUAYAN_QUOTA(act)) return null;
    s._sutraActPick = s._sutraActPick || {};
    s._sutraActPick[act + ':' + full.id] = (s._sutraActPick[act + ':' + full.id] || 0) + 1;
  }
  const frags = side === 'ferry' ? (s.sutraFrags || (s.sutraFrags = {})) : (s.niSutraFrags || (s.niSutraFrags = {}));
  const miss = full.frags.filter((fid) => (frags[fid] || 0) < 1);
  const pool = miss.length ? miss : full.frags;
  const fid = pool[Math.floor(NDX.runRandom() * pool.length)]; // P1 Seed：碎片选择走整局播种流
  frags[fid] = (frags[fid] || 0) + 1;
  if (NDX.addSutraPiece) NDX.addSutraPiece(s, side); // 模块八·拼篇累计（渡/逆分计）
  // V9.67 朝代'sutra'特色：晋朝经文获取+20%（概率追加一枚碎片）
  const _sutraMul = NDX.dynastyAdjust ? NDX.dynastyAdjust(1, 'sutra') : 1;
  if (_sutraMul > 1 && (NDX.runRandom || Math.random)() < (_sutraMul - 1)) {   // S09 §⑤-4：播种轴
    const miss2 = full.frags.filter((f2) => (frags[f2] || 0) < (frags[fid] || 0));
    const pool2 = miss2.length ? miss2 : full.frags;
    const fid2 = pool2[Math.floor(NDX.runRandom() * pool2.length)];
    frags[fid2] = (frags[fid2] || 0) + 1;
    if (NDX.addSutraPiece) NDX.addSutraPiece(s, side);
  }
  // 集齐自动路由（V3 §二：合成入背包 → 立即按当前主道自动投入生效）
  // 🔴 V9.54：合成判定与扣片一律走「按定价」口径（`sutraConsumeFor`）。
  //   旧写法 `frags.every(...>=1)` + 「每种片各 -1」是「集齐全部不同片」逻辑，
  //   在新定价下会把**超额攒的片一并抹掉**（如 心经 cost 8 / 种类 8，但攒了 10 片会被扣回 8）。
  if (side === 'ferry') {
    if (s.sutras.indexOf(full.id) < 0 && (s.sutraBackpack || []).indexOf(full.id) < 0
        && NDX.sutraConsumeFor(s, full.id)) {
      NDX.sutraBackpackOf(s).push(full.id);
      NDX._notifySutra(s, fullId);
      NDX.routePendingSutras(s);
    }
  } else if (NDX.tryCombineNiSutra) {
    NDX.tryCombineNiSutra(s, full.id);
  }
  return (side === 'ferry' ? NDX.sutraFragById(fid) : NDX.niSutraFragById(fid)) || null;
};
// 自动掉片（三选一 UI 未弹出时的兜底：从池中随机取一部）
// V3 §4.5 Synergy-in-reach：优先保证「主道途流派」的可达性——
// 若主道经缺口大（未合成比例 > 50%）且仍有主道经可选，则保底投一部主道经，
// 避免伪随机把当前流派锁死；否则回退原随机（候选池/随机仍走整局播种流）。
NDX.grantSutraAuto = function (s, side, act) {
  const choices = NDX.sutraDropChoices(s, side, act);
  if (!choices.length) return null;
  const mainDao = NDX.playerDao(s);
  const reach = NDX.synergyInReach ? NDX.synergyInReach(s) : null;
  let pick = null;
  if (reach && reach.sutraReachable && !reach.locked && reach.keySutraTotal > 0
      && (reach.keySutraRemaining / reach.keySutraTotal) > 0.5) {
    // 主道经缺口大：从「候选池 ∩ 主道剩余经」里投（若当前池不含主道经则仍回退候选池）
    const mainInChoices = choices.filter((fid) => reach.remainingKeySutras.indexOf(fid) >= 0);
    if (mainInChoices.length) pick = mainInChoices[Math.floor(NDX.runRandom() * mainInChoices.length)];
  }
  if (!pick) pick = choices[Math.floor(NDX.runRandom() * choices.length)];
  const _r = NDX.grantSutraShard(s, side, pick, act);
  // V9.67 朝代'sutraShard'特色：晋朝经文碎片掉落+15%（概率追加一次自动掉片）
  const _shardMul = NDX.dynastyAdjust ? NDX.dynastyAdjust(1, 'sutraShard') : 1;
  if (_shardMul > 1 && choices.length > 1 && (NDX.runRandom || Math.random)() < (_shardMul - 1)) {   // S09 §⑤-4：播种轴
    const pick2 = choices.filter(function(c){return c !== pick;})[Math.floor(NDX.runRandom() * (choices.length - 1))];
    if (pick2) NDX.grantSutraShard(s, side, pick2, act);
  }
  return _r;
};
// 诵经加成：渡=Σ每片（大悲咒/阿弥陀 5%，其他 1.5%）；逆=破戒录每片 10% + 逆天录 50%
NDX.sutraChantBonus = function (s, side) {
  let bonus = 0;
  const done = side === 'ferry' ? (s.sutras || []) : (s.niSutras || []);
  const fulls = side === 'ferry' ? NDX.SUTRA_FULLS : NDX.NI_SUTRA_FULLS;
  done.forEach((id) => {
    const f = fulls.find((x) => x.id === id);
    if (!f || !f.chant) return;
    bonus += (f.chant.per || 0) * (f.frags ? f.frags.length : 1);
    bonus += (f.chant.zenith || 0);
  });
  return bonus;
};
// 华严禅光层上限（华严合成 3→4 层）
NDX.sutraZenithLayers = function (s) {
  return (s.sutras || []).indexOf('su_full_huayan') >= 0 ? 4 : 3;
};

// ============================================================
// 逆道经文系统（选逆即得 · 攒齐自动合成）
// 前提：无（不设门槛）——凡选「逆」道抉择，即随机拾得一部逆道经文之碎片；
// 机制：每部逆道经文拆 3 段碎片（·上/·中/·下 等），集齐一部之 3 段即「自动合成全本」，
//       全本存入 s.niSutras，由 computeStats 读取提供被动战力（与佛经全本同管线）。
//       逆道经文即「暗黑西游」之经——真经是锁，逆道之经方是钥匙。
// ============================================================
NDX.NI_SUTRA_FRAG_NAMES = {
  pojie: ['贪','嗔','痴','破','戒','自在'],
  wuzi: ['无','字','真','经'],
  yaopu: ['形','骨','魂','魄'],
  xinyuan: ['跳','脱','闹','定','猿'],
  qitian: ['残','卷','破','天','阙','齐'],
  tigujue: ['剔','骨','还','父','母','莲'],
  zhanyaojue: ['听','调','不','听','宣','戟'],
  niumo: ['混','世','摩','云','覆','海','撼','山'],
  nitian: ['逆','天','改','命','破','法','裂','道','覆','纲','乱','常','诛','仙','弑','佛'],
  xuefo: ['血','煞','经','祭','灵'],
  duotian: ['堕','天','录','翼','血','灭'],
  mieshi: ['灭','世','咒','毁','绝','空','万'],
};
NDX.NI_SUTRA_FULLS = [
  { id: 'ni_full_pojie', name: '《破戒录》', sutra: 'pojie', chant: { per: 0.10 }, effect: { ti: { atk: 26, hp: 80 }, crit: 0.05 }, desc: '戒律是锁，破戒方得自在——体攻、暴击、气血同明。', chantSkill: { name: '破戒狂禅', cd: 2, mult: 1.8, kind: 'glut-ton', desc: '法伤并大吸血（持诵）' } },
  { id: 'ni_full_wuzi', name: '《无字经》', sutra: 'wuzi', effect: { matk: 28, mdef: 0.05, ti: { atk: 16 } }, desc: '真经是锁，无字才是钥匙——法伤、法防、体攻并张。', chantSkill: { name: '无字真经', cd: 2, mult: 1.7, kind: 'veil-mantra', desc: '法伤并必中真伤（持诵）' } },
  { id: 'ni_full_yaopu', name: '《妖谱》', sutra: 'yaopu', effect: { ti: { atk: 22, hp: 140 }, dr: 0.04 }, desc: '妖亦有道——气血、体攻、护体同固。', chantSkill: { name: '妖亦有道', cd: 2, mult: 1.7, kind: 'glut-ton', desc: '法伤并吸血（持诵）' } },
  { id: 'ni_full_xinyuan', name: '《心猿经》', sutra: 'xinyuan', effect: { ti: { atk: 24, hp: 100 }, eva: 0.04 }, desc: '心猿不驯，方有齐天——体攻、身法、气血同活。', chantSkill: { name: '心猿不驯', cd: 2, mult: 1.7, kind: 'war-buff', desc: '法伤并激昂暴击（持诵）' } },
  { id: 'ni_full_qitian', name: '《齐天残卷》', sutra: 'qitian', effect: { ti: { atk: 34, hp: 120 }, dr: 0.03, crit: 0.03 }, desc: '大圣已脱局，残卷记其志——攻、血、护、暴并起。', chantSkill: { name: '齐天残卷', cd: 2, mult: 1.8, kind: 'war-buff', desc: '法伤并激昂暴击（持诵）' } },
  { id: 'ni_full_tigujue', name: '《剔骨诀》', sutra: 'tigujue', effect: { ti: { atk: 28, hp: 120 }, crit: 0.03 }, desc: '剔骨还父，莲花化身——血、攻、暴同证。', chantSkill: { name: '剔骨还父', cd: 2, mult: 1.8, kind: 'veil-mantra', desc: '法伤并必中真伤（持诵）' } },
  { id: 'ni_full_zhanyaojue', name: '《斩妖诀》', sutra: 'zhanyaojue', effect: { ti: { atk: 30, hp: 80 }, dr: 0.04 }, desc: '听调不听宣——攻、御并立。', chantSkill: { name: '听调不听宣', cd: 2, mult: 1.7, kind: 'break-mantra', desc: '法伤并破甲真伤（持诵）' } },
  { id: 'ni_full_niumo', name: '《牛魔卷》', sutra: 'niumo', effect: { ti: { atk: 32, hp: 140 }, dr: 0.03 }, desc: '混世摩云，撼山覆海——攻、血、御并壮。', chantSkill: { name: '混世摩云', cd: 2, mult: 1.7, kind: 'glut-ton', desc: '法伤并吸血自愈（持诵）' } },
  { id: 'ni_full_nitian', name: '《逆天录》', sutra: 'nitian', cycleReq: 2, chant: { zenith: 0.50 }, effect: { ti: { atk: 50, hp: 200 }, matk: 30, dr: 0.06, crit: 0.06, eva: 0.03 }, desc: '天条既锁，我便逆天——体、攻、防、法全加成，逆道之极。', chantSkill: { name: '逆天伐道', cd: 3, mult: 2.0, kind: 'break-mantra', desc: '法伤并大破甲真伤（持诵·终极经）' } },
  // —— V8.56 新增3部逆经（平衡正经/逆经 18:12）——
  { id: 'ni_full_xuefo', name: '《血煞经》', sutra: 'xuefo', effect: { ti: { atk: 30, hp: 120 }, reflect: 0.08, crit: 0.04 }, desc: '以血为墨，以骨为纸——血煞临世，攻、血、反伤同涨。', chantSkill: { name: '血煞降临', cd: 2, mult: 1.8, kind: 'glut-ton', desc: '法伤并吸血回复（持诵·血系）' } },
  { id: 'ni_full_duotian', name: '《堕天录》', sutra: 'duotian', effect: { ti: { atk: 25, hp: 80 }, crit: 0.08, eva: 0.06, criDmg: 0.15 }, desc: '天使堕地，双翼染血——暴击、闪避、暴伤同明。', chantSkill: { name: '堕天一击', cd: 2, mult: 1.9, kind: 'veil-mantra', desc: '高暴伤法伤（持诵·堕落系）' } },
  { id: 'ni_full_mieshi', name: '《灭世咒》', sutra: 'mieshi', cycleReq: 2, effect: { ti: { atk: 35, hp: 150 }, matk: 25, dr: 0.05, crit: 0.05 }, desc: '世界将灭，万法归空——体、攻、法、防全加成，灭世之极。', chantSkill: { name: '灭世真言', cd: 3, mult: 2.0, kind: 'break-mantra', desc: '法伤并大破甲真伤（持诵·终极经）' } }
];
NDX.NI_SUTRA_FRAGS = [];
NDX.NI_SUTRA_FULLS.forEach((f) => {
  const names = NDX.NI_SUTRA_FRAG_NAMES[f.sutra] || [];
  f.frags = names.map((_, i) => 'ni_' + f.sutra + '_' + i);
  names.forEach((nm, i) => {
    NDX.NI_SUTRA_FRAGS.push({ id: 'ni_' + f.sutra + '_' + i, sutra: f.id, name: nm, note: '逆经残片·' + nm, ord: i });
  });
});
NDX.niSutraFragById = function (id) { return NDX.NI_SUTRA_FRAGS.find((e) => e.id === id); };
NDX.niSutraFullById = function (id) { return NDX.NI_SUTRA_FULLS.find((e) => e.id === id); };

// ============================================================
// 方案X1·持诵位（2026-09-05）：已合成全本可任择一部「持诵」，
// 诵经技能随持诵经 chantSkill 变更（念什么经，使什么法）；未设持诵回退本命诵经。
// API：chantSkillOf(fullId) → 该经 chantSkill（渡/逆通查，无则 null）
//      chantSutraOf(s) → 当前持诵经全本对象（失效回 null）
//      canChantSutra(s, fullId) → 该经是否已合成全本（渡/逆任一侧）
// ============================================================
NDX.chantSkillOf = function (fullId) {
  const f = NDX.sutraFullById(fullId) || NDX.niSutraFullById(fullId);
  return (f && f.chantSkill) ? f.chantSkill : null;
};
NDX.chantSutraOf = function (s) {
  const id = (s && s.chantSutra) || null;
  if (!id) return null;
  return NDX.sutraFullById(id) || NDX.niSutraFullById(id) || null;
};
NDX.canChantSutra = function (s, fullId) {
  if (!s || !fullId) return false;
  return (s.sutras || []).indexOf(fullId) >= 0 || (s.niSutras || []).indexOf(fullId) >= 0;
};

// ============================================================
// 🔴 V9.54 经位双格唯一真源（2026-09-25 用户拍板：「扩容到两个，一个变更攻击，一个变更诵经，
//   其他包裹被动生效」）
//   既有 `s.jingSlots = { atk, chant }` 升为**唯一真源**，旧持诵位 `s.chantSutra` 降为**兼容回落**：
//     · `NDX.atkSutraId(s)`   攻击格 → 变更攻击键（atk 变体 / on-hit 状态 / 攻击格修饰）
//     · `NDX.chantSutraId(s)` 诵经格 → 变更诵经键（chantSkill 形态本体）
//   两者皆空 → 回落旧 `s.chantSutra`（旧存档免迁移）；再无 → 本命技能。
//   ⚠ 所有**读写**经位的战斗/属性代码一律走这两个口，禁止再直读 `s.jingSlots.xxx` 或 `s.chantSutra`。
// ============================================================
NDX.atkSutraId = function (s) {
  if (!s) return null;
  const j = s.jingSlots || null;
  if (j && (j.atk || j.chant) && ((j.atk && j.atk.indexOf('ni_') !== 0) || j.atk)) {
    // 攻击格：优先取 atk 格；atk 空缺而 chant 格装的是攻击型经（slot==='atk' 派生）时，也认作攻击格
    if (j.atk) return j.atk;
    if (j.chant) {
      const b = NDX.jingBookOf(j.chant);
      if (b && b.slot === 'atk') return j.chant;
    }
    return null;
  }
  // 回落：旧持诵位在装攻击型经时，视同攻击格（兼容 2026-09-05 方案X1 老存档）
  const cs = s.chantSutra || null;
  if (cs) { const b = NDX.jingBookOf(cs); if (b && b.slot === 'atk') return cs; }
  return null;
};
NDX.chantSutraId = function (s) {
  if (!s) return null;
  const j = s.jingSlots || null;
  if (j && j.chant) return j.chant;
  if (j && j.atk) {
    const b = NDX.jingBookOf(j.atk);
    if (b && b.slot === 'chant') return j.atk;
  }
  return (s.chantSutra || null);   // 旧存档回落（ chantSutra 装诵经型经 ⇒ 即诵经格）
};
// 「其余包裹被动生效」的清单口径由 `js/data_jobspec.js` 的 `NDX.passiveSutraIds` 独家维护
// （它已排除持诵位；★ V9.54 起改为排除**双格**，见 data_jobspec 同名函数）——此处不另立
// 第二真源，避免两处的「已生效」口径漂移。
// 逆道经文全本是否已合成
NDX.niSutraDone = function (s, fullId) { return (s.niSutras || []).indexOf(fullId) >= 0; };
// 🔴 V9.54（2026-09-25 用户拍板）：**逆经与逆道同开**——「逆经只有在开局选择了第二路线
//   才开放，跟逆道一起开放」。故解锁判据直接复用 `NDX.niDaoUnlocked(s)`（逆道唯一真源，
//   首周目逆命数达标亦开缝），**不得另立判据**（防第二真源导致的「逆道开了却拿不到逆经」）。
//   未解锁时：逆经碎片不掉落、逆经面板不渲染、逆经合成入口不出现。
NDX.niSutraUnlocked = function (s) {
  if (NDX.niDaoUnlocked) { try { return !!NDX.niDaoUnlocked(s); } catch (e) { return false; } }
  return false;
};
// 凑够定价 → 自动合成全本（合成后扣除已用碎片）
// V3 §二 自动路由：合成入背包（待投）→ 立即按当前主道自动投入生效
// 🔴 V9.54：判定与扣减改走 sutraHave / sutraConsumeFor（按定价 cost，非「集齐不同 id」）
NDX.tryCombineNiSutra = function (s, fullId) {
  const full = NDX.niSutraFullById(fullId);
  if (!full) return null;
  s.niSutras = s.niSutras || [];
  if (s.niSutras.indexOf(full.id) >= 0 || (s.sutraBackpack || []).indexOf(full.id) >= 0) return null;
  const need = NDX.sutraCostOf(full.id);
  if (NDX.sutraHave(s, full.id) < need) return null;
  if (!NDX.sutraConsumeFor(s, full.id)) return null;
  NDX.sutraBackpackOf(s).push(full.id);
  // 🔴 V9.54：扣片已由 `sutraConsumeFor` 统一完成（「余量>1 先扣、保留稀缺片」）。
  //   旧行 `frags.forEach(...-1)` 会**再扣一遍每一种片** ⇒ 超额攒的碎片被凭空吃掉。
  if (NDX._notifySutra) NDX._notifySutra(s, full.id);
  if (NDX.routePendingSutras) NDX.routePendingSutras(s);
  return full;
};
// 选「逆」道即随机拾得一部逆道经文之碎片（优先补全已开卷者，避免永远凑不齐）
NDX.grantNiSutraFrag = function (s, rng) {
  s.niSutraFrags = s.niSutraFrags || {};
  s.niSutras = s.niSutras || [];
  // 🔴 V9.54（用户拍板「逆经跟逆道一起开放」）：逆道未解锁 ⇒ 逆经碎片一并不掉，
  //   否则会出现「面板看得见、却永远刷不出来」的假内容。
  if (NDX.niSutraUnlocked && !NDX.niSutraUnlocked(s)) return null;
  const doneIds = (s.sutraBackpack || []);
  const pending = NDX.NI_SUTRA_FULLS.filter((f) => s.niSutras.indexOf(f.id) < 0 && doneIds.indexOf(f.id) < 0);
  if (!pending.length) return null;
  // 加权：已集 2 段者权重最高（快成了），已集 1 段次之，0 段最低——随机但偏向补全
  const weights = pending.map((f) => {
    const have = f.frags.filter((fid) => (s.niSutraFrags[fid] || 0) >= 1).length;
    return have === 2 ? 5 : have === 1 ? 3 : 1;
  });
  const total = weights.reduce((a, b) => a + b, 0);
  let roll = (rng ? rng() : (NDX.runRandom || Math.random)()) * total;   // S09 §⑤-4：默认走播种轴
  let pick = pending[0];
  for (let i = 0; i < pending.length; i++) { roll -= weights[i]; if (roll <= 0) { pick = pending[i]; break; } }
  const fragId = pick.frags[Math.floor((rng ? rng() : (NDX.runRandom || Math.random)()) * pick.frags.length)];   // S09 §⑤-4
  s.niSutraFrags[fragId] = (s.niSutraFrags[fragId] || 0) + 1;
  if (NDX.addSutraPiece) NDX.addSutraPiece(s, 'rebel'); // 模块八·拼篇累计（逆侧）
  const frag = NDX.niSutraFragById(fragId);
  const combined = NDX.tryCombineNiSutra(s, pick.id);
  return { frag, full: pick, combined };
};

// ============================================================
// 收集型长线·模块3：经文拓印系统（六道归类 + 跨周目拓印 + 三结局 CG）
// 设计：34 部经文全本归入「六藏」（天藏/人藏/修罗藏/畜生藏/饿鬼藏/地狱藏）。
//   每一藏由若干全本构成；当某局内「集齐某一藏全部全本」后，可在藏书阁「拓印」该藏——
//   拓印记入永久拓印库（跨周目累计，哪怕某一周目没通关也能逐步攒）。六藏全拓印 →
//   解锁《八十一难·三结局》CG 画廊（正果 / 逆道 / 大圣脱局 三条结局绘卷）。
//   机制目标：经文作为长线碎片目标，多周目持续吸引「补收集」而非数值膨胀。
// ============================================================
// 方案B（主理人拍板）：「六道」一词由 A 套道途（战/渡/隐/夺/缘/逆）独占；
// 此处经文收集分组改名「六藏」，与「渡藏/逆藏/藏经阁/藏书阁」同族，彻底脱离「道」字。
// ⚠️ 键名（tiandao/rendao/…）是存档契约：data_rubbing.js 直接以 rub[dao] 写入 localStorage
//    （RUBBING_KEY='xynj_rubbing'，跨周目永久）。改键名 = 全玩家拓印进度清零，严禁改动。
// 归属原则：佛教六道本义的语义契合 > 数量均衡；逆藏经文按其「堕向」归入修罗/饿鬼/地狱。
NDX.SUTRA_SIX_CANG = {
  tiandao: { name: '天藏', desc: '金刚、华严、圆觉、文殊般若、金光明、无字——破相显性、护体如海、觉性成轮。最亮的地方，最先失守。', sutras: ['su_full_jingang', 'su_full_huayan', 'su_full_yuanjue', 'su_full_wenshu', 'su_full_jinguangming', 'ni_full_wuzi'] },
  rendao: { name: '人藏', desc: '心经、法华、无量寿、十善业道、仁王、梵网、法句——渡厄回生、善恶同源。戒律本是写给人守的，人却拿去量别人。', sutras: ['su_full_xinjing', 'su_full_fahua', 'su_full_wuliangshou', 'su_full_shanshan', 'su_full_renwang', 'su_full_fanwang', 'su_full_faju'] },
  xiuluo: { name: '修罗藏', desc: '楞严、维摩诘、楞伽、解深密、六祖坛经、齐天残卷、斩妖诀——法防法伤并张。道理越辩越明，拳头越打越硬。', sutras: ['su_full_lengyan', 'su_full_weimo', 'su_full_lengqie', 'su_full_jieshenmi', 'su_full_tanjing', 'ni_full_qitian', 'ni_full_zhanyaojue'] },
  chusheng: { name: '畜生藏', desc: '阿弥陀、地藏、妖谱、心猿经、牛魔卷——往生愿力、地狱不空。披了毛角的未必不是菩萨，坐了莲台的未必不是畜生。', sutras: ['su_full_amituo', 'su_full_dizang', 'ni_full_yaopu', 'ni_full_xinyuan', 'ni_full_niumo'] },
  egui: { name: '饿鬼藏', desc: '大悲咒、观音经、血煞经、破戒录——千手护持，大悲回生。喉细如针，腹大如山；求不得的，才念得最勤。', sutras: ['su_full_dabei', 'su_full_guanyin', 'ni_full_xuefo', 'ni_full_pojie'] },
  diyu: { name: '地狱藏', desc: '涅槃、剔骨诀、逆天录、堕天录、灭世咒——常乐我净，灭度诸苦。最底下那一层，是留给不听话的。', sutras: ['su_full_niepan', 'ni_full_tigujue', 'ni_full_nitian', 'ni_full_duotian', 'ni_full_mieshi'] },
};
// 兼容别名：改名后旧引用（含未审计到的第三方/存档路径）仍可解析
NDX.SUTRA_SIX_DAOS = NDX.SUTRA_SIX_CANG;
// 反查：全本 id → 所属藏
NDX.SUTRA_DAO_OF = {};
Object.keys(NDX.SUTRA_SIX_CANG).forEach((dao) => {
  NDX.SUTRA_SIX_CANG[dao].sutras.forEach((fid) => { NDX.SUTRA_DAO_OF[fid] = dao; });
});

// ============================================================================
//  V3 §二 · 每经绑定道途——自动路由版核心
//  合成后自动并入当前主道途生效，本经道途 === 当前主道途 时该经效果 ×1.5。
//  ⚠️ V9.27 口径收口（主理人拍板）：经文道途**只分「渡 / 逆」两类**——
//     渡藏（su_full_*，佛经）恒为「渡」；逆藏（ni_full_*，逆道经文）恒为「逆」。
//     不再散落 战/缘/夺/隐（原 21 部已按藏别收敛）。
//     后果（设计如此）：主道为 战/缘/夺/隐 的局吃不到经文 ×1.5 加成。
//     原「经文池随六道数量偏置」机制随之不再适用，门禁断言已改为「藏→道途一致性」校验。
//  API：NDX.SUTRA_DAO_TAG[fullId]=道途；NDX.sutraDaoOf(fullId) → 道途；NDX.sutraDaoName(fullId) → 道途名。
// ============================================================================
NDX.SUTRA_DAO_TAG = {
  // —— 渡藏（佛经）→ 一律「渡」——
  su_full_jingang: '渡', su_full_xinjing: '渡', su_full_fahua: '渡', su_full_huayan: '渡',
  su_full_lengyan: '渡', su_full_amituo: '渡', su_full_wuliangshou: '渡', su_full_weimo: '渡',
  su_full_yuanjue: '渡', su_full_niepan: '渡', su_full_dabei: '渡', su_full_lengqie: '渡',
  su_full_jieshenmi: '渡', su_full_dizang: '渡', su_full_shanshan: '渡', su_full_tanjing: '渡',
  // —— 传承经文（P0-C 死亡渐进解锁，道途标签随书绑定）——
  su_full_guanyin: '渡', su_full_wenshu: '渡',
  // —— 逆藏（逆道经文）→ 一律「逆」——
  ni_full_pojie: '逆', ni_full_wuzi: '逆', ni_full_yaopu: '逆', ni_full_xinyuan: '逆',
  ni_full_qitian: '逆', ni_full_tigujue: '逆', ni_full_zhanyaojue: '逆', ni_full_niumo: '逆',
  ni_full_nitian: '逆',
  // —— 补全（V8.58 早期漏标 7 部）——
  su_full_jinguangming: '渡', su_full_renwang: '渡', su_full_fanwang: '渡',
  su_full_faju: '渡',
  ni_full_xuefo: '逆',
  ni_full_duotian: '逆', ni_full_mieshi: '逆',
};
NDX.sutraDaoOf = function (fullId) { return NDX.SUTRA_DAO_TAG[fullId] || null; };
NDX.sutraDaoName = function (fullId) {
  const d = NDX.sutraDaoOf(fullId);
  return (d && NDX.SEAL_DAOTU && NDX.SEAL_DAOTU[d]) ? NDX.SEAL_DAOTU[d].name : d;
};

// ============================================================
//  V9.70 · 经文的「六道」标签（用户 2026-09-28 拍板方案二：现在就打）
//  🔴 为什么**不能**把上面的 `SUTRA_DAO_TAG` 值域直接扩到六道：
//     ① `_verify_dao_pool.js:116` 有一条显式断言 `经文道途无非渡/逆残留`，扩值域当场判红；
//     ② 更硬的是 `attr_calc.js:294` 的 `sutraDaoOf(id) !== mainDao` ⇒ 扩值域等于**打开**
//        「战/隐/夺/缘 四道玩家突然吃满经文 ×1.5」这条此前一直为 0 的加成分，属平衡变更，
//        不能由一次数据标注顺手送出。
//  ⇒ 正确建模是拆两维：**藏别**（渡藏/逆藏，= SUTRA_DAO_TAG，UI 标识 + 自动路由加成口径）
//    **六道**（经文最契合的道途，= 本表）。一部佛经本来就可以「既属渡藏、又偏战道」。
//  · 分配依据：effect 主倾向（crit/matk→战、healPct/maxhpPct→渡、yuan→缘、eva→隐）+ 语义
//    （智慧剑/见性→战、常乐我净/回生→渡、护持/接引→缘、唯识/幽冥→隐）。
//    ⚠ 夺/逆 的 effect 字段经文侧根本没有（无吸血/护盾/真伤），只能走语义，属已知取舍。
//  · 分布：战 8 / 渡 7 / 缘 6 / 隐 6 / 逆 4 / 夺 3 —— 六道**无空道**，
//    六道卡片经文栏、`sutraDaoCount`、`synergyInReach.keySutraTotal` 全部从「0 或全量」变有效。
//  · 读法：`sutraSixDaoOf` 是六道语义的**唯一出口**，禁手写 `SUTRA_SIX_DAO[id] === '战'`。
// ============================================================
NDX.SUTRA_SIX_DAO = {
  // —— 渡藏 22（佛经）→ 按 effect 主倾向 + 语义 ——
  su_full_jieshenmi: '战', su_full_tanjing: '战', su_full_faju: '战', su_full_wenshu: '战', su_full_yuanjue: '战',
  su_full_fahua: '渡', su_full_huayan: '渡', su_full_wuliangshou: '渡', su_full_niepan: '渡',
  su_full_shanshan: '渡', su_full_jinguangming: '渡', su_full_renwang: '渡',
  su_full_jingang: '缘', su_full_xinjing: '缘', su_full_amituo: '缘', su_full_weimo: '缘',
  su_full_dabei: '缘', su_full_guanyin: '缘',
  su_full_lengyan: '隐', su_full_lengqie: '隐', su_full_dizang: '隐', su_full_fanwang: '隐',
  // —— 逆藏 12（逆道经文）→ 按语义 ——
  ni_full_pojie: '战', ni_full_qitian: '战', ni_full_zhanyaojue: '战',
  ni_full_yaopu: '夺', ni_full_niumo: '夺', ni_full_xuefo: '夺',
  ni_full_wuzi: '隐', ni_full_xinyuan: '隐',
  ni_full_tigujue: '逆', ni_full_nitian: '逆', ni_full_duotian: '逆', ni_full_mieshi: '逆',
};
NDX.sutraSixDaoOf = function (fullId) {
  return (NDX.SUTRA_SIX_DAO && NDX.SUTRA_SIX_DAO[fullId]) || null;
};
// 六道中文名（ dao_system.DAO_NAMES 真源优先，缺时退本地表，避免 ui/审计侧再写第二份 ）
NDX.SUTRA_SIX_DAO_FALLBACK_NAME = { 战: '战', 渡: '渡', 隐: '隐', 夺: '夺', 缘: '缘', 逆: '逆' };
NDX.sutraSixDaoName = function (fullId) {
  const d = NDX.sutraSixDaoOf(fullId);
  if (!d) return '';
  if (NDX.DAO_NAMES && NDX.DAO_NAMES[d]) return NDX.DAO_NAMES[d];
  return NDX.SUTRA_SIX_DAO_FALLBACK_NAME[d] || d;
};
// 经名「标题化」：**唯一出口**。
//   `full.name` 本身就是 `《文殊般若经》全本`（带书名号 + 全本后缀）⇒ 调用点若再包一层
//   `《${f.name}》` 就会渲染成 `《《文殊般若经》全本》` 这种双书名号（V9.70-B 实锤复现）。
//   与 `dao_system.sixDaoSutraNames` 的清理口径一致（`replace(/[《》]/g,'')`）。
NDX.sutraTitle = function (fullId) {
  const f = (NDX.sutraFullById ? NDX.sutraFullById(fullId) : null)
    || (NDX.niSutraFullById ? NDX.niSutraFullById(fullId) : null);
  return String((f && f.name) || fullId).replace(/[《》]/g, '');
};
// 六道归属去重集合（与 sutraDaosOf 同口径，只是换成六道标签）
NDX.sutraSixDaosOf = function (s) {
  if (!s) return [];
  const out = [];
  const owned = (s.sutras || []).concat(s.niSutras || []).concat(s.sutraBackpack || []);
  for (let i = 0; i < owned.length; i++) {
    const d = NDX.sutraSixDaoOf(owned[i]);
    if (d && out.indexOf(d) < 0) out.push(d);
  }
  return out;
};
// V9.6 单一真源：玩家「已持全本经文（渡/逆/待投）」所覆盖的道途去重集合。
// 供法宝 on-hit 协同（法宝道途 ∈ 该集合 → 经文共鸣）、UI 提示、门禁共用，禁止各处重写推导。
NDX.sutraDaosOf = function (s) {
  if (!s) return [];
  const out = [];
  const owned = (s.sutras || []).concat(s.niSutras || []).concat(s.sutraBackpack || []);
  for (let i = 0; i < owned.length; i++) {
    const d = NDX.sutraDaoOf(owned[i]);
    if (d && out.indexOf(d) < 0) out.push(d);
  }
  return out;
};

// ============================================================================
// V3 §4.5 · Synergy-in-reach（可达成校验 / 防伪随机锁死）
// 判定「当前 build 的主道途流派所需关键资源是否仍可达」，避免伪随机把某流派锁死：
//   - 印侧：主道途劫印恒在 offerSeals 候选池首项（V3 §1.1）→ 天然可达，不锁死
//   - 经侧：统计「本经道途 === 主道途」且「本局尚未合成」的关键经文；只要仍持有其
//           碎片来源（未拥有 + 可继续拾碎片）即视为可达
// 返回结构供：①事件/商店在「主道经即将绝迹」时优先投放保底朝圣（assureSynergy）；
//            ②战后面板/调试断言复用（替代"手感调平衡"）。
// ============================================================================
NDX.synergyInReach = function (s) {
  if (!s) return null;
  const mainDao = NDX.playerDao(s);
  // V3 §二 自动路由：待投（sutraBackpack）全本同样视为已拥有（不重复投放关键经）
  const owned = new Set((s.sutras || []).concat(s.niSutras || []).concat(s.sutraBackpack || []));
  // 主道途全部关键经文 id（P0-C：未达死亡阈值的传承经文不参与可达性，防朝圣保底推荐不可得经）
  const _dc = (typeof NDX.deathCount === 'function') ? NDX.deathCount() : 0;
  // 🆕 V9.70：六道标签改读 `sutraSixDaoOf`。旧读 `SUTRA_DAO_TAG`（值域只有渡/逆）时，
  //   主道为 战/隐/夺/缘 的局 `keyTotal` 恒 0 ⇒ `sutraReachable` 恒真、**流派永不锁死**，
  //   这条可达性校验对四道形同虚设。打完六道标签后 keyTotal 才有真实含义（每道 ≥3 部）。
  const all = Object.keys(NDX.SUTRA_DAO_TAG || {}).filter((fid) => {
    if (NDX.sutraSixDaoOf(fid) !== mainDao) return false;
    const f = NDX.sutraFullById(fid) || NDX.niSutraFullById(fid);
    if (f && f.deathReq && _dc < f.deathReq) return false;
    return true;
  });
  const keyTotal = all.length;
  const keyOwned = all.filter((fid) => owned.has(fid));
  const keyRemaining = all.filter((fid) => !owned.has(fid));
  // 线索：任一剩余经文仍可「拾碎片」即该道经未绝迹（碎片来源不设死，视为仍可收集）
  const sutraReachable = keyRemaining.length > 0;
  // 印侧恒可达（主道首项恒在候选池）
  const sealReachable = true;
  return {
    mainDao,
    // —— 关键资源可达性 ——
    sealReachable,
    keySutraTotal: keyTotal,
    keySutraOwned: keyOwned.length,
    keySutraRemaining: keyRemaining.length,
    sutraReachable,
    // —— 流派可复盘结论 ——
    stillReachable: sealReachable && sutraReachable,
    locked: !(sealReachable && sutraReachable),
    gap: Math.max(0, keyTotal - keyOwned.length),
    remainingKeySutras: keyRemaining,
  };
};
// 在「主道经仅剩最后一部且已持有片段」或「主道经占比较高」时，供事件/商店投放该道经文朝圣保底
NDX.assureSynergy = function (s) {
  const info = NDX.synergyInReach(s);
  if (!info) return null;
  if (info.locked) return null;                 // 全绝迹不可救（掉宝/三选一另有全局池）
  if (info.keySutraRemaining === 0) return null; // 主道经已集齐，不需要朝圣
  // 优先投放主道仍未合成的关键经（返回其一供事件/商店作为保底候选）
  const idx = Math.floor(NDX.runRandom() * info.remainingKeySutras.length);
  return info.remainingKeySutras[idx] || null;
};

// ============================================================================
//  六道经文宏愿·数量加成（V8.35 《BD 流派多样性》：经文数量 → 属性多档加成）
//  设计口径（用户确认）：经文系统「根据数量多少对属性都有不同加成」——
//  每集齐一本经文（佛经/逆道经文均计入），按当前总数分档解锁「经文宏愿」：
//  档位越高，全属性加成越多；同时按局内主攻道（mainDao）给道途专属加成，
//  使「走哪条道，经文就往哪条道倾斜」，六道形成差异化成长轴线。
//  调用：NDX.sutraCountBonus(s) → 返回一个 effect 对象（并入 computeStats sutras 管线）。
// ============================================================================
// 档位：累计经文数阈值 → 全属性加成（体攻/愿伤/气血/减伤/法防 微量）
NDX.SUTRA_COUNT_BREAKPOINTS = [
  { n: 3,  atk: 8,  matk: 8,  hp: 60,  dr: 0.01, mdef: 0.01, label: '经文初鸣' },
  { n: 6,  atk: 12, matk: 12, hp: 90,  dr: 0.015, mdef: 0.015, label: '经文朗朗' },
  { n: 9,  atk: 16, matk: 16, hp: 120, dr: 0.02, mdef: 0.02, label: '经文如海' },
  { n: 12, atk: 20, matk: 20, hp: 150, dr: 0.025, mdef: 0.025, label: '经文照世' },
  { n: 16, atk: 26, matk: 26, hp: 200, dr: 0.03, mdef: 0.03, label: '经文圆满' },
];
// 主攻道专属加成（与 SEAL_DAOTU 六道对齐：渡=法伤 战=物攻 缘=减伤 夺=气血 隐=闪避 逆=攻暴）
// 注意：computeStats bonus.ti 仅认 atk/hp/dr/eva/cri/matk/mdef；反伤走劫印 sealFlags，不在此重复
NDX.SUTRA_DAO_BONUS = {
  渡: { matk: 14, mdef: 0.02, desc: '渡道·经文渡厄' },
  战: { atk: 14,  cri: 0.02,  desc: '战道·经文杀伐' },
  缘: { dr: 0.02, hp: 80,     desc: '缘道·经文金身' },
  夺: { lifesteal: 0.06, atk: 8, desc: '夺道·经文吞纳（吸血）' },
  隐: { eva: 0.02, cri: 0.02, desc: '隐道·经文匿踪' },
  逆: { atk: 8,   cri: 0.03,  finalDamage: 0.06, desc: '逆道·经文戾骨（终伤）' }, // V9.44 终伤共鸣：与 逆=终伤 身份一致，令 V9.43 管线不再空转（量级同 夺道吸血 0.06）
};
// 玩家当前主攻道（六道）：通过统一模块NDX.DaoSystem.getMainDao()计算
// 优先局内选定 mainDao → 英雄体系推断 → 地区配额推断 → 道途分布推断 → 默认渡
// 供经文宏愿/法宝道途共鸣/克制联动共用。
NDX.playerDao = function (s) {
  if (NDX.DaoSystem && typeof NDX.DaoSystem.getMainDao === 'function') {
    return NDX.DaoSystem.getMainDao(s);
  }
  // 降级：旧逻辑
  if (!s) return '渡';
  if (s.mainDao) return s.mainDao;
  if (NDX.HEROES && s.hero) {
    const heroDef = NDX.HEROES[s.hero];
    if (heroDef) return (heroDef.sys === 'yuan') ? '渡' : '战';
  }
  const q = NDX.regionQuotaOf ? NDX.regionQuotaOf(s.act || 1) : null;
  const keys = q ? Object.keys(q) : [];
  return (keys[0] && NDX.SUTRA_DAO_BONUS[keys[0]]) ? keys[0] : '渡';
};

// 计算数量加成 effect（s=状态；返回 effect 或 null）
NDX.sutraCountBonus = function (s) {
  const count = (s.sutras ? s.sutras.length : 0) + (s.niSutras ? s.niSutras.length : 0);
  if (count < NDX.SUTRA_COUNT_BREAKPOINTS[0].n) return null;
  let tier = NDX.SUTRA_COUNT_BREAKPOINTS[0];
  for (let i = 0; i < NDX.SUTRA_COUNT_BREAKPOINTS.length; i++) {
    if (count >= NDX.SUTRA_COUNT_BREAKPOINTS[i].n) tier = NDX.SUTRA_COUNT_BREAKPOINTS[i];
  }
  const mainDao = NDX.playerDao(s);
  const daoB = (mainDao && NDX.SUTRA_DAO_BONUS[mainDao]) || null;
  const eff = {
    _sutraCount: count,
    _sutraTier: tier.label,
    _sutraDao: daoB ? daoB.desc : '',
    ti: { atk: tier.atk, hp: tier.hp, dr: tier.dr, eva: (daoB && daoB.eva) || 0, cri: (daoB && daoB.cri) || 0 },
    matk: tier.matk + (daoB && daoB.matk || 0),
    mdef: tier.mdef + (daoB && daoB.mdef || 0),
    lifesteal: (daoB && daoB.lifesteal) || 0,
    finalDamage: (daoB && daoB.finalDamage) || 0,
  };
  if (daoB && daoB.hp) eff.ti.hp += daoB.hp;
  if (daoB && daoB.atk) eff.ti.atk += daoB.atk;
  return eff;
};

// ============================================================
// V9.6 经文招式包（GDD 五）：经文 = atkVariant + chantSkill + ultVariant，换经换整套套路，不绑英雄。
// 设计：以 chantSkill.kind 为骨（6 种语义），一张模板派生「普攻变体 / 绝招变体」——单一真源，避免 34 部经 x3 手写。
//   经文可自带 atkVariant / ultVariant 覆盖模板（留出个别经的特化余地）。
//   强度 scale 由自身 chantSkill.mult 归一化派生：大经（mult 2.0）招式更重，小经（mult 1.5）更轻。
// 全部为确定性效果（不含随机）——因 activeSkill 会被「CD 探测」与「正式结算」各调一次，随机将致两值不一致。
// 数值 [已调优]（2026-09-14）：模板各字段已被门禁 _verify_sutra_variant 写死（B7 glut-ton lifestealPct=0.22、
//   E1 金刚经 break trueDmg=24 等），不得改动。一致性审计：同语义 effect 数值无数量级差——续航/护盾/吸血 atk 均 0.22、
//   ult 均 0.40；trueDmgPct atk 0.20~0.25 差异仅来自 ignoreDef/armorBreak 语义侧重，非失衡。确认保持原值。
// ============================================================
NDX.SUTRA_VARIANT_TMPL = {
  // 渡系·续航（回血 / 护盾）
  'zen-heal':    { atk: { healPct: 0.22, note: '·慈悲' },                            chant: { healPct: 0.18, note: '·甘露' },                    ult: { healPct: 0.40, note: '·大悲' } },
  'ward-mantra': { atk: { shieldPct: 0.22, note: '·凝护' },                          chant: { shieldPct: 0.20, note: '·共护' },                  ult: { shieldPct: 0.40, trueDmgPct: 0.15, note: '·金刚' } },
  // 战系·猛攻（暴击 / 必中）
  'war-buff':    { atk: { crit: true, dmgMul: 1.18, note: '·激昂' },                  chant: { crit: true, dmgMul: 1.12, note: '·战意' },         ult: { crit: true, dmgMul: 1.25, note: '·战魂' } },
  'veil-mantra': { atk: { trueDmgPct: 0.25, ignoreDef: true, note: '·凝匿' },          chant: { trueDmgPct: 0.18, ignoreDef: true, note: '·匿踪' }, ult: { trueDmgPct: 0.40, ignoreDef: true, note: '·必中' } },
  // 贪/夺系·吸血（以战养战）
  'glut-ton':    { atk: { lifestealPct: 0.22, note: '·鲸吞' },                        chant: { lifestealPct: 0.18, note: '·掠取' },               ult: { lifestealPct: 0.40, note: '·血食' } },
  // 逆/破法系·破甲（无视防御真伤）
  'break-mantra':{ atk: { trueDmgPct: 0.20, armorBreak: true, note: '·破相' },        chant: { trueDmgPct: 0.15, armorBreak: true, note: '·破法' }, ult: { trueDmgPct: 0.35, armorBreak: true, note: '·碎法' } },
  // 缘系·伴（宠物 / 随从协同 · V9.51 新增 kind，v1.1 接通）
  //   ---------------------------------------------------------------------------
  //   🔴 v1.1 接通前，34 部经**无一部**挂此 kind ⇒ data_jobspec.js 中 summon 流派的
  //      fit.sutra:['bond-mantra'] 是**永远匹配不到的死声明** ⇒ 那 ×1.15 经文配对加成
  //      召唤流玩家永远拿不到。本次改数值落「内核已支持字段」（combat_active.js:492
  //      applySutraVariant 实吃 dmgMul/healPct/lifestealPct/shieldPct/trueDmgPct/dotPct
  //      /ignoreDef/armorBreak/crit），再把 3 部叙事强绑定的经挂上来。
  //   ⚠ 语义是「同伴协同」，不是「伴生回血」：与 ward-mantra（防御向）区分开。
  //   ⚠ 数值幅度刻意低于 ward-mantra——缘道同时挂 bond 的经文不得因此变强于护体系。
  'bond-mantra': { atk: { dmgMul: 1.14, note: '·伴生' },                            chant: { healPct: 0.14, note: '·唤伴' },                   ult: { trueDmgPct: 0.22, note: '·齐击' } },
};
// 解析：fullId x 'atk'|'chant'|'ult' -> { variant, scale, kind, name }；无 chantSkill/无模板则 null
// V9.51：新增 'chant' —— 补《三键技能·经文变体综合设计》§二 第三列（诵经数值修饰 = 经位 chant 槽经书）
NDX.sutraVariantOf = function (fullId, key) {
  if (!fullId || (key !== 'atk' && key !== 'ult' && key !== 'chant')) return null;
  const f = NDX.sutraFullById(fullId) || NDX.niSutraFullById(fullId);
  if (!f) return null;
  const cs = f.chantSkill || null;
  const kind = (cs && cs.kind) || null;
  const tmpl = (kind && NDX.SUTRA_VARIANT_TMPL[kind]) ? NDX.SUTRA_VARIANT_TMPL[kind][key] : null;
  const own = (key === 'atk') ? f.atkVariant : (key === 'chant') ? (f.chantVariant || null) : f.ultVariant; // own override (optional)
  const variant = own || tmpl;
  if (!variant) return null;
  const mult = (cs && cs.mult) || 1.7;
  const scale = Math.max(0.5, Math.min(1.5, mult / 1.7));
  return { variant: variant, scale: scale, kind: kind, name: f.name };
};

// ============================================================
// V9.31 · 经文获取侧（残片 X/N 计数 · 半部发放 · 章末正常结算）
//   用户拍板（2026-09-23）：所有经文皆以「残片 X/N」计量（N=命名表长度，近似真经长度）；
//   章末正常结算掉落残片（默认 6 片/章）；章节起点（过关土地庙）「增寿 / 念经」二选一——
//   念经＝给一部「未完成」经的半部（⌈N/2⌉ 片，无即时效果，未跑满则后续补齐另半部）；
//   满 N 即合成整本（沿用既有 grantSutraShard 的自动路由），超出作废。
// ============================================================
NDX.sutraSideOf = function (fullId) {
  if (!fullId) return null;
  if ((NDX.SUTRA_FULLS || []).some((f) => f.id === fullId)) return 'ferry';
  if ((NDX.NI_SUTRA_FULLS || []).some((f) => f.id === fullId)) return 'rebel';
  return null;
};
NDX.sutraFragsOf = function (s, side) {
  if (!s) return {};
  return side === 'ferry'
    ? (s.sutraFrags = s.sutraFrags || {})
    : (s.niSutraFrags = s.niSutraFrags || {});
};
// 残片进度：{ fullId, name, side, need, have, halfNeed, done, kinds }
// 🔴 V9.54：口径 = **按定价**（need=合成所需片数，have=可堆叠求和，同 `sutraProgress`）。
//   旧口径「need=碎片种类数 / have=已集不重复片数」是「1 字 1 片」时代的写法，
//   在按定位定价下会与真实合成门槛脱钩（如 心经 need=8 却显示 5）。
NDX.sutraFragProgress = function (s, fullId) {
  const side = NDX.sutraSideOf(fullId);
  if (!side || !s) return null;
  const full = side === 'ferry' ? NDX.sutraFullById(fullId) : NDX.niSutraFullById(fullId);
  if (!full || !full.frags) return null;
  const frags = NDX.sutraFragsOf(s, side);
  const need = NDX.sutraCostOf(fullId) || full.frags.length;
  const have = NDX.sutraHave(s, fullId);
  const done = side === 'ferry' ? (s.sutras || []) : (s.niSutras || []);
  return {
    fullId: fullId, name: full.name, side: side,
    need: need, have: have, halfNeed: Math.ceil(need / 2),
    kinds: full.frags.length,                      // 碎片种类数（定价硬夹取上限 = kinds×2）
    done: done.indexOf(fullId) >= 0,
  };
};
// 残片总览（供 UI 面板 V9.35）：{ side, fullN, doneN, have, total, fragN }
//   have   = 该侧**已攒片数**（可堆叠求和，与 have/total 同口径）
//   total  = 该侧**全部经文的定价总和**（合成完全部所需片数，渡 223 / 逆 127）
//   fragN  = 该侧残片种类总数（渡 210 / 逆 79，存档结构总量，仅作审计对照）
// 🔴 V9.54：旧口径「have=不重复片数 / total=frags.length 求和」已随定价改版作废。
NDX.sutraFragOverview = function (s, side) {
  const fulls = (side === 'rebel' ? NDX.NI_SUTRA_FULLS : NDX.SUTRA_FULLS) || [];
  const st = s || {};
  const done = side === 'rebel' ? (st.niSutras || []) : (st.sutras || []);
  const bp = st.sutraBackpack || [];
  let doneN = 0, have = 0, total = 0, fragN = 0;
  fulls.forEach((f) => {
    if (!f) return;
    total += NDX.sutraCostOf(f.id) || ((f.frags || []).length);
    have += NDX.sutraHave(st, f.id);
    fragN += (f.frags || []).length;
    if (done.indexOf(f.id) >= 0 || bp.indexOf(f.id) >= 0) doneN++;
  });
  return { side: side, fullN: fulls.length, doneN: doneN, have: have, total: total, fragN: fragN };
};
// 挑一部「未完成」经（优先本地区池 → 再优先主道），供「念经·半部」与章末结算定向
NDX.sutraHalfPick = function (s, act, side) {
  const fulls = (side === 'rebel' ? NDX.NI_SUTRA_FULLS : NDX.SUTRA_FULLS) || [];
  const done = side === 'rebel' ? (s.niSutras || []) : (s.sutras || []);
  const frags = NDX.sutraFragsOf(s, side);
  const cyc = (NDX.getCycle ? NDX.getCycle() : 1);
  let cands = fulls.filter((f) => {
    if (done.indexOf(f.id) >= 0) return false;
    if (f.cycleReq && cyc < f.cycleReq) return false;
    return f.frags.some((fid) => (frags[fid] || 0) < 1);
  });
  if (!cands.length) return null;
  if (side === 'ferry' && act) {
    const region = NDX.sutraRegionPool(act);
    const inR = cands.filter((f) => region && region.indexOf(f.id) >= 0);
    if (inR.length) cands = inR;
  }
  const mainDao = (NDX.DaoSystem && NDX.DaoSystem.getMainDao) ? NDX.DaoSystem.getMainDao(s) : (NDX.playerDao ? NDX.playerDao(s) : null);
  // 🆕 V9.70：六道倾向改读 `sutraSixDaoOf`（渡/逆 两个值对五道玩家恒不命中 ⇒ 原过滤是空操作）
  if (mainDao && NDX.sutraSixDaoOf) {
    const inDao = cands.filter((f) => NDX.sutraSixDaoOf(f.id) === mainDao);
    if (inDao.length) cands = inDao;
  }
  return cands[0].id;
};

// ============================================================
//  V9.70 · 土地庙·念经（用户 2026-09-28 拍板 ①三选一子面板 + ②整本/半部派生）
//  —— 「念什么经」的单一派生源 ——
//  🔴 为什么不是「发放时才知道给什么」：原来 `grantSutraHalf` 先发 ⌈N/2⌉ 片，够不够凑满全看运气，
//     面板上永远只能写「得半部·另半部待续」，玩家对这一炷香的取舍毫无预期。方案一（派生）要求
//     **发之前就算得清**：`gain = ⌈need/2⌉` 是定的（grantSutraHalf 内部就这么发），
//     所以「念这一部能不能一次圆满」完全可派生，**零新存档字段**（have 本就在存档里）。
//  —— 首章不发 —— 总纲「首章不发」+ ①的 UI 要求：act < SUTRA_CHANT_MIN_ACT 时无经可诵。
// ============================================================
NDX.SUTRA_CHANT_MIN_ACT = 2;    // 首章土地庙「念经」置灰（调回 1 即恢复首章可诵）
// 单次念经给多少片（与 grantSutraHalf 内部 `want` 同口径：⌈need/2⌉，不超 need-have）
NDX.sutraChantGain = function (fullId) {
  const need = NDX.sutraCostOf ? NDX.sutraCostOf(fullId) : 0;
  return need ? Math.ceil(need / 2) : 0;
};
// 念一部经的「结果派生物」：{ fullId, name, side, have, need, gain, after, completes, grant }
//   completes = after >= need ⇒ 这一炷香正好把此经凑满 ⇒ 发放形态是「整本」而非「半部」
NDX.sutraChantPlan = function (s, fullId) {
  const p = NDX.sutraFragProgress(s, fullId);
  if (!p || p.done) return null;
  const gain = Math.min(NDX.sutraChantGain(fullId) || 0, p.need - p.have);
  const after = p.have + gain;
  return {
    fullId: fullId, name: p.name, side: p.side,
    have: p.have, need: p.need, gain: gain, after: after,
    completes: after >= p.need,
    grant: after >= p.need ? 'full' : 'half',
  };
};
// 三选一候选（念经专用）：走 `sutraDropChoices`（同一条抽选链 ⇒ 六道倾向/本章经/包裹型保底
// 三套约束在念经这里同样生效，不另造一套），每条附上 `sutraChantPlan` 派生结果供 UI 展示。
NDX.sutraChantCandidates = function (s, act, side, n) {
  const cnt = (n == null ? 3 : n);
  const act0 = (typeof act === 'number' && act >= 1) ? act : (s && s.act) || 1;
  if (act0 < NDX.SUTRA_CHANT_MIN_ACT) return [];          // 首章不发
  if (!s) return [];
  const ids = (NDX.sutraDropChoices ? NDX.sutraDropChoices(s, side, act0) : []) || [];
  const out = [];
  for (let i = 0; i < ids.length && out.length < cnt; i++) {
    const pl = NDX.sutraChantPlan(s, ids[i]);
    if (pl) out.push(pl);
  }
  return out;
};
// 发放一次念经（整本 / 半部由 plan 派生）。返回 plan 叠加实际发放量。
NDX.grantSutraChant = function (s, fullId, act) {
  if (!s || !fullId) return null;
  const plan = NDX.sutraChantPlan(s, fullId);
  if (!plan) return null;
  const r = NDX.grantSutraHalf ? NDX.grantSutraHalf(s, fullId, act) : null;
  if (!r) return null;
  const p = r.prog || {};
  return {
    fullId: fullId, name: r.name, side: r.side,
    granted: r.granted != null ? r.granted : 0,
    have: p.have != null ? p.have : plan.after,
    need: p.need != null ? p.need : plan.need,
    done: !!p.done,
    completes: plan.comples || !!p.done,      // 🔴 合成由 grantSutraShard 自动完成（routePendingSutras），
    //    所以「整本」是既有行为，本次只把**形态如实报出来**（此前日志永远写「半部·另半部待续」）。
    grant: plan.grant,
  };
};
// 发放「半部」：给未完成经补 ⌈N/2⌉ 片（不超 N；沿途满即合成）。返回发放结果。
NDX.grantSutraHalf = function (s, fullId, act) {
  const side = NDX.sutraSideOf(fullId);
  if (!side || !s) return null;
  s.sutras = s.sutras || []; s.niSutras = s.niSutras || []; // 兜底：早期存档可能未初始化
  const p0 = NDX.sutraFragProgress(s, fullId);
  if (!p0 || p0.done || p0.have >= p0.need) return null;
  const want = Math.min(p0.halfNeed, p0.need - p0.have);
  let got = 0;
  for (let i = 0; i < want; i++) {
    const before = NDX.sutraFragProgress(s, fullId);
    if (!before || before.done) break;
    // 念经为玩家定向获取（非地区随机掉落）→ 不占「华严单章限量」配额（传 null act）
    const r = NDX.grantSutraShard(s, side, fullId, null);
    if (!r) break;
    got++;
  }
  const after = NDX.sutraFragProgress(s, fullId);
  return { fullId: fullId, name: p0.name, side: side, granted: got, prog: after };
};
// 章末正常结算：发 n 片残片（默认 6）。逆道未开启时全走渡藏，开启后渡/逆交替。
NDX.CHAPTER_SHARD_N = 6;
NDX.grantChapterSutraShards = function (s, act, n) {
  const cnt = Math.max(0, n == null ? NDX.CHAPTER_SHARD_N : n);
  if (!s) return [];
  s.sutras = s.sutras || []; s.niSutras = s.niSutras || []; // 兜底：早期存档可能未初始化
  const rebelOn = !!(s.fate && s.fate.逆 >= 1);
  const got = [];
  for (let i = 0; i < cnt; i++) {
    const side = (rebelOn && (i % 2 === 1)) ? 'rebel' : 'ferry';
    const r = NDX.grantSutraAuto(s, side, act) || (side === 'rebel' ? NDX.grantSutraAuto(s, 'ferry', act) : null);
    if (r) got.push(r);
  }
  return got;
};

// ============================================================
//  批B · 经文系统重设计（V9.32）：两型 / 经位 / 残片获取 / 逆道优先
//  设计真源：《逆道西行》经文系统重设计 · 真源_V9.27 §3
//   · 单一目录：既有 34 部（渡 22 + 逆 12，真经名 + 命名表残片数）为唯一真源；
//     V9.28 自造的 16 部「启程经/破障经…」已作废删除（用户 2026-09-23 定调「以 34 部为准」）。
//   · 两型：attr（加属性·包裹生效，被动，无需经位） / skill（改技能·须装经位）；
//     34 部本身 kind:'attr'（effect 被动入 s.sutras）；同时**均可入经位**当技能经用——
//     经位身份由 chantSkill.kind 派生（见 JING_KIND_MOD），不另造目录。
//   · 经位：s.jingSlots = { atk: fullId|null, chant: fullId|null }（2 格：攻击 / 诵经）
//   · 逆道获取：正常/逆都正常获得；三选一优先刷新逆道经文
// ============================================================

// —— 两型自动归一化：legacy 34 部未显式标 kind 者 → attr（其 effect 为被动属性）——
NDX.SUTRA_FULLS.forEach((f) => { if (!f.kind) f.kind = 'attr'; });
NDX.NI_SUTRA_FULLS.forEach((f) => { if (!f.kind) f.kind = 'attr'; });

// —— 经位身份派生（V9.32）：34 部的「技能经」身份由 chantSkill.kind 派生 ——
//   kind → 经位归属 slot（攻击格/诵经格）+ act 修饰 mod（经位注入）+ def（经位被动，入 computeStats）。
//   注意：def 为**经位专属**新增数值（不在 legacy effect 内），故与「包裹生效」的 effect 无重复计算。
//   套路覆盖：回血/减伤/护盾/法防/吸血/气血/暴击/暴伤/体攻/增伤/闪避/连击/反伤 —— 13 套路。
//   （舍攻为盾 / 净秽 等按键技巧变种见 js/data_skill_variant.js）
NDX.JING_KIND_MOD = {
  'zen-heal':     { slot: 'chant', mod: { regen: 0.04 },               def: { ti: { dr: 0.03 } },  note: '回春·减伤' },
  // 🆕 V9.68 包裹型经（技能变更性经的唯一正统判据）：本表加 **mod 字段在战斗内核有专属接线**
  //    这一条。此前的「技能变更性」只是 `chantSkill !== null` 的别名 ⇒ 34/34 全真（2026-09-28 根因）。
  //    现正解为「包裹型」：效果在被动包裹层（经位 mod）内改写**行为**，且每条都在内核有接线。
  //    · break-mantra＝连击（V9.62 已接线）/ ward-mantra＝舍攻为盾 / war-buff＝被动反击，三族共 14 部。
  //    · ward-mantra 是 chant 格身份，其 atkToShield 走 `NDX.jingWrappedMods`（经位无关）生效。
  'ward-mantra':  { slot: 'chant', mod: { shield: 0.10, atkToShield: 0.22 }, def: { mdef: 0.03 }, note: '凝护·转盾' },
  'glut-ton':     { slot: 'atk',   mod: { spellLifesteal: 0.10 },      def: { ti: { hp: 40 } },    note: '噬血·气血' },
  'war-buff':     { slot: 'atk',   mod: { crit: 0.12, critDmg: 0.15, counter: 0.18 }, def: { ti: { atk: 12 } }, note: '战意·还击' },
  'veil-mantra':  { slot: 'atk',   mod: { atkPct: 0.12, aoe: 0.6 },    def: { ti: { eva: 0.03 } }, note: '破相·普照' },
  'break-mantra': { slot: 'atk',   mod: { combo: 0.30, comboDmg: 0.30 }, def: { reflect: 0.04 },   note: '破相·连击链' },
  // —— bond-mantra（v1.1 接通同伴协同系）——
  //   🔴 补注册原因：V9.51 的缘系通道只进了 SUTRA_VARIANT_TMPL，漏登记本表，
  //      导致 jingBookOf('bond 系经') 恒返回 null ⇒ 3 部挂靠经「入不了经位」。
  //   ⚠ 数值刻意低于 zen-heal（regen 0.04/dr 0.03）：bond 的强力在经文变体层
  //      （atk dmgMul / ult trueDmgPct），经位被动层只做温和协同，避免与回春系重复。
  'bond-mantra':  { slot: 'chant', mod: { regen: 0.02 },               def: { ti: { dr: 0.02 } }, note: '唤伴·协同' },
};
// —— 包裹型经位效果的两条封顶（V9.68）——
//   🔴 封顶必须在**数据层**就钉住，不能只靠内核 clamp：包裹型经是「行为改写」级效果，
//      一旦出现第 8 部同类经，系数叠加会把普攻彻底废掉（舍攻为盾 100% ⇒ 零输出）。
//   atkToShield 封顶 0.35：至多三成半的伤害转为护盾，输出永不为零。
//   counter 封顶 0.40：与 V9.60 格挡/反击体系的 COUNTER_CAP 同值（反击附带出手，不比格挡好叠）。
NDX.SUTRA_WRAP_CAP = { atkToShield: 0.35, counter: 0.40 };
// —— 包裹型经位效果派生（V9.68 唯一读取口）——
//   派生而非手写清单：直接遍历 jingSlotMods 的两格，取「内核已接线字段」的**逐键最大值**。
//   · 经位无关：装 atk 格或 chant 格都生效（ward-mantra 是 chant 格身份，若限定 atk 格该效果恒不生效）。
//   · 逐键 max 而非累加：两格同时挂包裹型经属异常配装，max 不会出现「叠两份盾」的失控。
//   · 缺省（装了非包裹型经）返回 null ⇒ 战斗内核新分支不可达 ⇒ **构造性零回归**。
//   · 判据键（JING_WRAPPED_KEYS）：出现任一键 ⇒ 该经有「行为改写」级专属接线。
//     combo/comboDmg 由 V9.62 在**构建期** `applyJingSlotMods` 接线（atk 格专用），
//     atkToShield/counter 由 V9.68 在**回合内核**接线（见 combat_part1.js 的 _wrapped 段）。
//     两侧通道互不重复：jingWrappedMods 只吐内核侧两键，避免把连击的构建期通道抄第二遍。
NDX.JING_WRAPPED_KEYS = ['combo', 'comboDmg', 'atkToShield', 'counter'];
NDX.JING_WRAPPED_KERNEL_KEYS = ['atkToShield', 'counter'];
NDX.jingWrappedMods = function (s) {
  if (!s || !NDX.jingSlotMods) return null;
  const _mods = NDX.jingSlotMods(s) || {};
  const _out = {};
  ['atk', 'chant'].forEach((slot) => {
    const mm = _mods[slot] || {};
    NDX.JING_WRAPPED_KERNEL_KEYS.forEach((k) => {
      const v = mm[k];
      if (typeof v === 'number' && v > 0) _out[k] = Math.max(_out[k] || 0, v);
    });
  });
  return Object.keys(_out).length ? _out : null;
};
// 是否为「包裹型经」派生判据（V9.68）——判据＝该经经位身份的 mod 里含有内核已接线字段。
//   ⚠ 这不是 `chantSkill !== null` 的别名：34 部 legacy 全部有 chantSkill，但只有 3 族共 14 部
//     的 mod 字段在战斗内核有专属接线（见 js/combat_part1.js 的 _wrapped 段）。
NDX.isWrappedSutra = function (fullId) {
  const b = NDX.jingBookOf(fullId);
  if (!b || !b.mod) return false;
  return NDX.JING_WRAPPED_KEYS.some((k) => typeof b.mod[k] === 'number' && b.mod[k] > 0);
};
// 包裹型经所属族（供 UI/门禁反查；非包裹型返回 null）
NDX.wrappedSutraKinds = function () {
  const _out = [];
  Object.keys(NDX.JING_KIND_MOD || {}).forEach((k) => {
    const spec = NDX.JING_KIND_MOD[k];
    if (spec && spec.mod && NDX.JING_WRAPPED_KEYS.some((f) => typeof spec.mod[f] === 'number' && spec.mod[f] > 0)) _out.push(k);
  });
  return _out;
};
// —— 经位经书 on-hit 状态（自动战斗，V9.33）——
//   ⚠️ V9.27 解耦：onHit **不再由道途派生**，改为逐经显式绑定（见下方 JING_ONHIT_BY_ID）。
//   原因：经文道途已收敛为「渡/逆」两类，若仍按道途派生，破甲/蚀毒/迟滞/虚弱 四类 debuff
//   将失去全部经文来源（自动战斗只剩定身/禁法）。道途现仅作缺省兜底。
//   手动三键路径的经文状态来自 act.mStatus（finalizeActiveAct）；自动回合无按键，
//   故以「装经即带 debuff」补足，逐回合概率触发并复用 NDX.applyMonsterStatus
//   （眩晕真跳过怪物行动 / 灼烧真扣血 / 破甲真增伤 / 封技折减大招）。
//   V9.42 双时长解耦：rounds = 主怪 mStatus 的「持续回合数」（applyJingOnHit → applyMonsterStatus）；
//     poolRounds = 编队从怪状态池的「单层寿命」（combat_squad secApply），层数另由 SEC_STATUS[st].cap 封顶。
//     稳态层数 = min(cap, poolRounds)（单源每回合施加 1 层时）；两者独立，抬高从怪叠层不再连带拉长主怪控制时长。
NDX.JING_DAO_ONHIT = {
  '逆': { status: 'stun',    chance: 0.15, rounds: 1, poolRounds: 1, label: '逆乱定身' },
  '战': { status: 'sunder',  chance: 0.25, rounds: 2, poolRounds: 5, label: '破甲' },
  '夺': { status: 'poison',  chance: 0.20, rounds: 2, poolRounds: 5, label: '蚀毒' },
  '隐': { status: 'slow',    chance: 0.20, rounds: 2, poolRounds: 5, label: '迟滞' },
  '缘': { status: 'weaken',  chance: 0.20, rounds: 2, poolRounds: 5, label: '虚弱' },
  '渡': { status: 'silence', chance: 0.18, rounds: 2, poolRounds: 2, label: '梵音禁法' },
};
// V9.27 逐经 onHit 绑定（按道途收敛「前」的原归属还原，六类 debuff 全保留）
NDX.JING_ONHIT_BY_ID = {
  // 原「战」→ 破甲
  su_full_jingang: 'sunder', su_full_yuanjue: 'sunder', su_full_wenshu: 'sunder',
  ni_full_xinyuan: 'sunder', ni_full_qitian: 'sunder', ni_full_zhanyaojue: 'sunder',
  // 原「缘」→ 虚弱
  su_full_fahua: 'weaken', su_full_huayan: 'weaken', su_full_amituo: 'weaken', su_full_niepan: 'weaken',
  su_full_dizang: 'weaken', su_full_jinguangming: 'weaken', su_full_renwang: 'weaken', su_full_fanwang: 'weaken',
  // 原「夺」→ 蚀毒
  su_full_wuliangshou: 'poison', ni_full_pojie: 'poison', ni_full_yaopu: 'poison',
  ni_full_niumo: 'poison', ni_full_xuefo: 'poison',
  // 原「隐」→ 迟滞
  su_full_jieshenmi: 'slow', su_full_tanjing: 'slow',
  // 原「渡」→ 梵音禁法
  su_full_xinjing: 'silence', su_full_lengyan: 'silence', su_full_weimo: 'silence', su_full_dabei: 'silence',
  su_full_lengqie: 'silence', su_full_shanshan: 'silence', su_full_guanyin: 'silence', su_full_faju: 'silence',
  // 原「逆」→ 逆乱定身
  ni_full_wuzi: 'stun', ni_full_tigujue: 'stun', ni_full_nitian: 'stun',
  ni_full_duotian: 'stun', ni_full_mieshi: 'stun',
};
// status → 规格反查（复用 JING_DAO_ONHIT 六条定义，避免规格重复定义/漂移）
NDX.JING_ONHIT_SPEC = {};
Object.keys(NDX.JING_DAO_ONHIT).forEach(function (_d) {
  const _v = NDX.JING_DAO_ONHIT[_d];
  if (_v && _v.status) NDX.JING_ONHIT_SPEC[_v.status] = _v;
});
// 浅克隆规格（防共享引用被下游篡改）
function _jingClone(mod, def) {
  const cm = mod ? Object.assign({}, mod) : null;
  const cd = def ? Object.assign({}, def) : null;
  if (cd && cd.ti) cd.ti = Object.assign({}, cd.ti);
  return { mod: cm, def: cd };
}
// 解析一部的经位身份：{ id, name, slot, mod, def, note }；无 chantSkill/无模板则 null
//   · 34 部 legacy：kind 派生（JING_KIND_MOD）
//   · 显式 skill 型（forward-compat）：直读 f.mod / f.def
NDX.jingBookOf = function (fullId) {
  if (!fullId) return null;
  const f = NDX.sutraFullById(fullId) || NDX.niSutraFullById(fullId);
  if (!f) return null;
  const _dao = NDX.sutraDaoOf(fullId);
  // V9.27：onHit 优先取逐经显式绑定，缺省才回落道途派生（见 JING_ONHIT_BY_ID 说明）
  const _st = NDX.JING_ONHIT_BY_ID[fullId]
    || ((_dao && NDX.JING_DAO_ONHIT[_dao]) ? NDX.JING_DAO_ONHIT[_dao].status : null);
  const _onHit = (_st && NDX.JING_ONHIT_SPEC[_st]) ? Object.assign({}, NDX.JING_ONHIT_SPEC[_st]) : null;
  if (f.kind === 'skill' && f.mod && f.mod.slot) {
    const c = _jingClone(f.mod, f.def);
    return { id: f.id, name: f.name, slot: f.mod.slot, mod: c.mod, def: c.def, note: '', onHit: _onHit };
  }
  const kind = f.chantSkill && f.chantSkill.kind;
  const spec = (kind && NDX.JING_KIND_MOD[kind]) ? NDX.JING_KIND_MOD[kind] : null;
  if (!spec) return null;
  const c = _jingClone(spec.mod, spec.def);
  return { id: f.id, name: f.name, slot: spec.slot, mod: c.mod, def: c.def, note: spec.note || '', onHit: _onHit };
};
// 玩家已持有且可入经位的经目（供经位 UI 列表）
NDX.jingSlotCatalog = function (s) {
  if (!s) return [];
  const seen = {};
  const out = [];
  [].concat(s.sutras || [], s.niSutras || [], s.sutraBackpack || [], s.chapterSutras || []).forEach((id) => {
    if (seen[id]) return;
    seen[id] = 1;
    const b = NDX.jingBookOf(id);
    if (b) out.push(b);
  });
  return out;
};

// —— 两型查询 ——
NDX.sutraKindOf = function (fullId) {
  const f = NDX.sutraFullById(fullId) || NDX.niSutraFullById(fullId);
  return f ? (f.kind || 'attr') : null;
};
NDX.sutraModOf = function (fullId) {
  const b = NDX.jingBookOf(fullId);
  return b ? b.mod : null;
};

// —— 经位 state（攻击 + 诵经 2 格）；skill 型经须装经位方生效，attr 型包裹生效 ——
NDX.ensureJingSlots = function (s) {
  if (!s) return;
  if (!s.jingSlots || typeof s.jingSlots !== 'object') s.jingSlots = { atk: null, chant: null };
  if (!('atk' in s.jingSlots)) s.jingSlots.atk = null;
  if (!('chant' in s.jingSlots)) s.jingSlots.chant = null;
};
// 装/卸经位（返回是否成功）；仅 skill 型可装；须已持有
NDX.setJingSlot = function (s, slot, fullId) {
  NDX.ensureJingSlots(s);
  if (slot !== 'atk' && slot !== 'chant') return false;
  if (fullId) {
    if (!NDX.jingBookOf(fullId)) return false; // 无经位身份（无 chantSkill 派生）不可装
    if (!NDX.sutraOwned(s, fullId)) return false;
  }
  s.jingSlots[slot] = fullId || null;
  return true;
};
NDX.sutraOwned = function (s, fullId) {
  return (s.sutras || []).indexOf(fullId) >= 0 || (s.niSutras || []).indexOf(fullId) >= 0
      || (s.chapterSutras || []).indexOf(fullId) >= 0 || (s.sutraBackpack || []).indexOf(fullId) >= 0;
};
// 经位生效的修饰聚合（仅已装备 skill 型章经，且 slot 匹配）
NDX.jingSlotMods = function (s) {
  NDX.ensureJingSlots(s);
  const out = { atk: null, chant: null };
  ['atk', 'chant'].forEach((slot) => {
    const id = s.jingSlots[slot];
    if (!id) return;
    const b = NDX.jingBookOf(id);
    if (b && b.slot === slot) {
      out[slot] = b.mod;
      // 🆕 V9.62 连击链三档（材料精简×经文重整 拍板）：仅破相系（mod.combo）带档位元数据。
      //   档位判据用**西行进度**（jingBookOf 每次克隆 mod，此处改写安全）：
      //   散件档＝缺省（combo 0.30 + 追加段 30% 伤害）；
      //   全本档＝进度越过本部 region（prog > region×20）⇒ combo 0.50 + 连击后再判 25%；
      //   终极档＝进度越过下一章（prog > (region+1)×20，回头精进）⇒ 追加段 50% 伤害 + 追加段 25% 概率 ×1.5 暴击。
      if (b.mod && b.mod.combo) {
        const f = NDX.sutraFullById(id) || NDX.niSutraFullById(id);
        const rg = (f && typeof f.region === 'number') ? f.region : null;
        const prog = (NDX.globalProgress && NDX.globalProgress(s)) || 0;
        if (rg != null && prog > rg * 20) { b.mod.comboChain = 0.25; b.mod._tier = 1; }
        if (rg != null && prog > (rg + 1) * 20) { b.mod._tier = 2; }
      }
    }
  });
  return out;
};
// 战斗生命周期修饰（regen / 开局护盾）：仅 chant 格 skill 经携带
NDX.battleModsOf = function (s) {
  const mods = NDX.jingSlotMods(s);
  const out = { regenPct: 0, shieldPct: 0 };
  const c = mods.chant;
  if (c) {
    if (c.regen) out.regenPct += c.regen;
    if (c.shield) out.shieldPct += c.shield;
  }
  return out;
};
// 经位被动属性（防/闪避/反伤/攻防）：仅已装备经的 def 字段（经位身份派生，见 jingBookOf），
// 由 attr_calc.js 并入 sutraEffs → computeStats，与渡藏/逆藏同管线生效。
// 与 jingSlotMods 同口径：须 slot 双向匹配（atk 身份经装 chant 格不生效）。
NDX.jingSlotDefStats = function (s) {
  NDX.ensureJingSlots(s);
  const out = { ti: {}, matk: 0, mdef: 0, reflect: 0 };
  ['atk', 'chant'].forEach((slot) => {
    const id = s.jingSlots[slot];
    if (!id) return;
    const b = NDX.jingBookOf(id);
    if (!b || b.slot !== slot || !b.def) return;
    const d = b.def;
    if (d.ti) for (const k of Object.keys(d.ti)) out.ti[k] = (out.ti[k] || 0) + d.ti[k];
    if (d.matk) out.matk += d.matk;
    if (d.mdef) out.mdef += d.mdef;
    if (d.reflect) out.reflect += d.reflect;
  });
  if (!Object.keys(out.ti).length && !out.matk && !out.mdef && !out.reflect) return null;
  return out;
};

// —— 逆道获取规则：正常/逆都正常获得；三选一优先刷新逆道经文 ——
NDX.sutraOfferPriorityDao = function (s) {
  if ((s.fate && s.fate.逆 >= 1) || s.reversePath) return '逆';
  return null;
};
NDX.prioritizeSutraOffer = function (s, choices) {
  const dao = NDX.sutraOfferPriorityDao(s);
  if (!dao || !Array.isArray(choices) || choices.length <= 1) return choices;
  return choices.slice().sort((a, b) => {
    const da = NDX.sutraDaoOf(a) || '';
    const db = NDX.sutraDaoOf(b) || '';
    return (da === dao ? 0 : 1) - (db === dao ? 0 : 1);
  });
};

// —— 经位 skill 修饰注入攻击/诵经 act（构建期；crit 在构建期乘算，与现有 _sa/道途进阶同范式）——
// V9.64 · 增加可选第 4 参数 rng：与同文件 grantNiSutraFrag(s, rng) 及 applyTreasureStatus(act, s, rng) 保持注入惯例；
//         生产路径不传 → 走**播种轴** `NDX.runRandom()`（S09 §⑤-4 收口，2026-09-27，原为裸 Math.random）；
//         门禁测试传 stub → 概率分支可确定，让 G3 幂等断言成立。
NDX.applyJingSlotMods = function (act, s, slotKey, rng) {
  if (!act || !s) return act;
  const m = NDX.jingSlotMods(s)[slotKey];
  if (!m) return act;
  const _roll = function (p) {
    const _r = (typeof rng === 'function') ? rng
      : (typeof NDX.runRandom === 'function') ? NDX.runRandom
      : (typeof Math.random === 'function') ? Math.random : null;   // S09 §⑤-4：默认播种轴
    return _r ? (_r() < p) : false;
  };
  if (slotKey === 'atk') {
    // 🆕 V9.62 连击链三档：combo=触发率；comboDmg=每追加段伤害份额（act.dmg 为总量、按 hits 分摊，
    //    总量 ×(1+comboDmg×追加段数) ⇒ 每个追加段恰带 comboDmg 份伤害）；comboChain=连击后再判再连；
    //    终极档(_tier≥2) 追加段 25% 概率 ×1.5 暴击（只乘追加段份额，不污染基础段）。
    if (m.combo && _roll(m.combo)) {
      let _extra = 1;
      if (m.comboChain && _roll(m.comboChain)) _extra = 2;
      act.hits = (act.hits || 1) + _extra;
      act.spread = true;
      const _cd = (m._tier >= 2) ? 0.50 : (m.comboDmg != null ? m.comboDmg : 0);
      if (_cd > 0 && act.dmg) {
        const _k = 1 + _cd * _extra;
        let _total = act.dmg * _k;
        if (m._tier >= 2 && _roll(0.25)) { _total += act.dmg * _cd * _extra * 0.5; act.critHit = true; act.note = (act.note || '') + '·连击暴'; }
        act.dmg = Math.max(1, Math.round(_total));
      }
      act.note = (act.note || '') + '·经连击' + (_extra > 1 ? '×2' : '');
    }
    if (m.crit && _roll(m.crit)) {
      const _mul = 1.5 + (m.critDmg || 0);
      act.dmg = Math.max(1, Math.round((act.dmg || 0) * _mul)); act.critHit = true;
      act.note = (act.note || '') + '·经暴击';
    }
    if (m.spellLifesteal) { act.heal = Math.max(0, (act.heal || 0) + Math.round((act.dmg || 0) * m.spellLifesteal)); act.note = (act.note || '') + '·经吸血'; }
    if (m.atkPct) { act.dmg = Math.max(1, Math.round((act.dmg || 0) * (1 + m.atkPct))); act.note = (act.note || '') + '·经攻强'; }
    if (m.matkPct) { act.dmg = Math.max(1, Math.round((act.dmg || 0) * (1 + m.matkPct))); act.note = (act.note || '') + '·经法强'; }
  } else if (slotKey === 'chant') {
    if (m.combo && _roll(m.combo)) { act.hits = (act.hits || 1) + 1; act.spread = true; act.note = (act.note || '') + '·经连击'; }
    if (m.crit && _roll(m.crit)) {
      const _mul = 1.5 + (m.critDmg || 0);
      act.dmg = Math.max(1, Math.round((act.dmg || 0) * _mul)); act.critHit = true;
      act.note = (act.note || '') + '·经暴击';
    }
    if (m.spellLifesteal) { act.heal = Math.max(0, (act.heal || 0) + Math.round((act.dmg || 0) * m.spellLifesteal)); act.note = (act.note || '') + '·经吸血'; }
    if (m.atkPct) { act.dmg = Math.max(1, Math.round((act.dmg || 0) * (1 + m.atkPct))); act.note = (act.note || '') + '·经攻强'; }
    if (m.matkPct) { act.dmg = Math.max(1, Math.round((act.dmg || 0) * (1 + m.matkPct))); act.note = (act.note || '') + '·经法强'; }
  }
  return act;
};

