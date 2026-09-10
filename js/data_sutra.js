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
// 机制：恶线劫难掉落佛经碎片（散件），集齐一部之碎片即可「合成全本」；
//       全本存入 s.sutras，由 computeStats 读取提供被动战力。
// 数量/内容参照梦幻西游散件风格（每经拆 3 段散件，16 经 = 16 条合成全本）。
// ============================================================
NDX.SUTRA_FRAG_NAMES = {
  dabei: ['千','手'],
  amituo: ['西','方','净'],
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
  // —— V8.57 补 act14-17 专属渡经池碎片名 ——
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
  { id: 'su_full_amituo', name: '《阿弥陀经》全本', sutra: 'amituo', region: 1, chant: { per: 0.05 }, effect: {"ti":{"hp":140},"dr":0.03,"yuan":{"hp":40}}, desc: '执持名号，往生愿力，气血与愿伤同源。', chantSkill: { name: '弥陀接引', cd: 3, mult: 1.7, kind: 'zen-heal', desc: '法伤并大幅回血（持诵）' } },
  { id: 'su_full_wuliangshou', name: '《无量寿经》全本', sutra: 'wuliangshou', region: 5, chant: { per: 0.015 }, effect: {"ti":{"hp":180},"maxhpPct":0.05,"healPct":0.04}, desc: '无量寿光，续命延元，气血与上限同辉。', chantSkill: { name: '寿光续命', cd: 2, mult: 1.6, kind: 'glut-ton', desc: '法伤并吸血自愈（持诵）' } },
  { id: 'su_full_weimo', name: '《维摩诘经》全本', sutra: 'weimo', region: 6, chant: { per: 0.015 }, effect: {"matk":20,"ti":{"atk":18},"yuan":{"matk":6}}, desc: '不二法门，净名除疾，体法双修。', chantSkill: { name: '净名不二', cd: 2, mult: 1.5, kind: 'zen-heal', desc: '法伤并回血（持诵）' } },
  { id: 'su_full_yuanjue', name: '《圆觉经》全本', sutra: 'yuanjue', region: 7, chant: { per: 0.015 }, effect: {"ti":{"atk":24,"hp":120},"crit":0.05,"dr":0.02}, desc: '圆觉妙心，觉性成轮，暴击与体攻同明。', chantSkill: { name: '觉性成轮', cd: 2, mult: 1.6, kind: 'war-buff', desc: '法伤并激昂暴击（持诵）' } },
  { id: 'su_full_niepan', name: '《涅槃经》全本', sutra: 'niepan', region: 12, chant: { per: 0.015 }, effect: {"ti":{"hp":160},"dr":0.06,"mdef":0.04}, desc: '常乐我净，灭度诸苦，护体坚固。', chantSkill: { name: '涅槃寂静', cd: 3, mult: 1.6, kind: 'ward-mantra', desc: '法伤并护盾（持诵）' } },
  { id: 'su_full_dabei', name: '《大悲咒》全本', sutra: 'dabei', region: 1, chant: { per: 0.05 }, effect: {"matk":18,"healPct":0.07,"yuan":{"matk":6}}, desc: '千手护持，大悲回生，自愈与愿伤同涌。', chantSkill: { name: '大悲回生', cd: 3, mult: 1.7, kind: 'zen-heal', desc: '法伤并大幅回血（持诵）' } },
  { id: 'su_full_lengqie', name: '《楞伽经》全本', sutra: 'lengqie', region: 10, chant: { per: 0.015 }, effect: {"matk":24,"mdef":0.05,"ti":{"atk":16}}, desc: '楞伽识海，转识成智，法防法伤并张。', chantSkill: { name: '楞伽识海', cd: 2, mult: 1.6, kind: 'veil-mantra', desc: '法伤并必中真伤（持诵）' } },
  { id: 'su_full_jieshenmi', name: '《解深密经》全本', sutra: 'jieshenmi', region: 11, chant: { per: 0.015 }, effect: {"ti":{"hp":140},"matk":16,"crit":0.04}, desc: '深密解脱，三性圆明，法伤暴击并起。', chantSkill: { name: '深密解脱', cd: 2, mult: 1.6, kind: 'veil-mantra', desc: '法伤并必中真伤（持诵）' } },
  { id: 'su_full_dizang', name: '《地藏本愿经》全本', sutra: 'dizang', region: 2, chant: { per: 0.015 }, effect: {"ti":{"hp":200},"dr":0.04,"yuan":{"hp":50}}, desc: '地狱不空，誓不成佛，气血与愿伤同承。', chantSkill: { name: '地藏愿力', cd: 3, mult: 1.6, kind: 'ward-mantra', desc: '法伤并护盾（持诵）' } },
  { id: 'su_full_shanshan', name: '《十善业道经》全本', sutra: 'shanshan', region: 3, chant: { per: 0.015 }, effect: {"ti":{"atk":18,"hp":120},"dr":0.03,"mdef":0.03}, desc: '十善业道，善恶同源，攻防并济。', chantSkill: { name: '十善净业', cd: 2, mult: 1.5, kind: 'zen-heal', desc: '法伤并回血（持诵）' } },
  { id: 'su_full_tanjing', name: '《六祖坛经》全本', sutra: 'tanjing', region: 13, chant: { per: 0.015 }, effect: {"matk":26,"ti":{"atk":22},"crit":0.04}, desc: '顿悟成佛，本来无一物，体法暴击通明。', chantSkill: { name: '本来无一物', cd: 2, mult: 1.7, kind: 'veil-mantra', desc: '法伤并必中真伤（持诵）' } },
  // —— V8.57 补 act14-17 专属渡经池（原 23 难 28% 无区域经）——
  { id: 'su_full_jinguangming', name: '《金光明经》全本', sutra: 'jinguangming', region: 14, chant: { per: 0.015 }, effect: {"ti":{"atk":28,"hp":180},"dr":0.05,"healPct":0.05}, desc: '金光明照，护国佑民，气血与减伤同辉（祭赛国·金光寺）。', chantSkill: { name: '金光明照', cd: 2, mult: 1.7, kind: 'ward-mantra', desc: '法伤并护盾（持诵）' } },
  { id: 'su_full_renwang', name: '《仁王经》全本', sutra: 'renwang', region: 15, chant: { per: 0.015 }, effect: {"ti":{"hp":200},"dr":0.06,"mdef":0.05,"maxhpPct":0.03}, desc: '仁王护国，般若波罗蜜，护体与上限同固（比丘国·仁王殿）。', chantSkill: { name: '仁王护国', cd: 3, mult: 1.7, kind: 'ward-mantra', desc: '法伤并大护盾（持诵）' } },
  { id: 'su_full_faju', name: '《法句经》全本', sutra: 'faju', region: 16, chant: { per: 0.015 }, effect: {"matk":30,"ti":{"atk":24},"crit":0.05,"mdef":0.04}, desc: '法句譬喻，缘起性空，法伤暴击并明（天竺·佛法本源）。', chantSkill: { name: '法句譬喻', cd: 2, mult: 1.8, kind: 'veil-mantra', desc: '法伤并必中真伤（持诵）' } },
  { id: 'su_full_fanwang', name: '《梵网经》全本', sutra: 'fanwang', region: 17, chant: { per: 0.02, zenLayer: 1 }, effect: {"ti":{"hp":220},"dr":0.07,"mdef":0.06,"maxhpPct":0.05,"crit":0.05}, desc: '梵网千佛，菩萨戒本，终极经文——灵山脚下，万法归一（灵山·终极经）。', chantSkill: { name: '梵网千佛', cd: 3, mult: 2.0, kind: 'ward-mantra', desc: '法伤并终极护盾（持诵·灵山终极经）' } },
  // P0-C 传承经文（死亡渐进解锁 · V3 §3.2）：不进常规地区池，仅当累计死亡达阈值
  // 时并入渡经候选池（sutraDropChoices 动态并入）——「每死一局＝多一本可得的传承经」。
  { id: 'su_full_guanyin', name: '《观音经》全本', sutra: 'guanyin', region: 'death', deathReq: 3, chant: { per: 0.02 }, effect: {"ti":{"hp":180},"healPct":0.08,"yuan":{"hp":40}}, desc: '闻声救苦，千处祈求千处应，气血与自愈同涨（传承经 · 死亡3解锁）。', chantSkill: { name: '闻声救苦', cd: 3, mult: 1.7, kind: 'zen-heal', desc: '法伤并大幅回血（持诵·传承经）' } },
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
// 返回当前可合成的佛经全本（碎片已集齐且尚未合成）
// V3 §二 自动路由：已合成入背包（待投）的全本视为「已得」，不再可合成
NDX.availableSutras = function (s) {
  const frags = s.sutraFrags || {};
  const done = (s.sutras || []).concat(s.sutraBackpack || []);
  return NDX.SUTRA_FULLS.filter((f) => {
    if (done.indexOf(f.id) >= 0) return false;
    return f.frags.every((fid) => (frags[fid] || 0) >= 1);
  });
};
// 佛经系统是否已对本局激活（自己西游 + 恶）
NDX.sutraSystemUnlocked = function (s) {
  return (s.fate && s.fate.逆 >= 1) && (s.evil > 0);
};

// ============================================================
// 经文规模真源常量（闭环实测值 · 单一事实来源 · 防文档漂移）
// 渡 22 部 203 片 / 逆 12 部 76 片 / 合计 34 部 279 片；六藏全 34 部覆盖无遗漏。
// 早期 V8.27 设计约束「渡 16 部 133 片 / 逆 9 部 58 片（191 片）」已作废——
// 凡文档/注释/代码引用经文数量，须以此处 SUTRA_SPEC 为准；legacy 仅供审计对照。
// ============================================================
NDX.SUTRA_SPEC = {
  ferry: { bu: 22, frags: 203 },
  rebel: { bu: 12, frags: 76 },
  total: { bu: 34, frags: 279 },
  legacy: { ferryBu: 16, ferryFrags: 133, rebelBu: 9, rebelFrags: 58 },
};

// ============================================================
// 经文收集制 API
// 掉落：渡=地区池（大经低频）、逆=未完成逆经池；华严限量；逆天录锁二周目。
// 状态：s.sutraFrags（渡片 {fid:count}）/ s.niSutraFrags（逆片）/ s.sutras / s.niSutras（全本）
// ============================================================
NDX.SUTRA_GLOBAL_POOL = ['su_full_huayan', 'su_full_lengqie', 'su_full_jieshenmi', 'su_full_niepan', 'su_full_tanjing'];
NDX.SUTRA_REGION = {
  1: ['su_full_dabei', 'su_full_amituo'],
  2: ['su_full_xinjing', 'su_full_dizang'],
  3: ['su_full_shanshan'],
  4: ['su_full_jingang'],
  5: ['su_full_wuliangshou'],
  6: ['su_full_weimo'],
  7: ['su_full_yuanjue'],
  8: ['su_full_lengyan'],
  9: ['su_full_fahua'],
  10: ['su_full_lengqie'],
  11: ['su_full_jieshenmi'],
  12: ['su_full_niepan'],
  13: ['su_full_tanjing'],
  14: null, 15: null, 16: null, 17: null
};
// 地区渡经池（14-17 走全局池：华严+后段大经补缺）
NDX.sutraRegionPool = function (act) {
  return (NDX.SUTRA_REGION[act] || NDX.SUTRA_GLOBAL_POOL);
};
// 华严经单局限量：地区 1-10 每章最多 1 片、11-15 每章最多 2 片、16-17 不限
NDX.HUAYAN_QUOTA = function (act) {
  if (act >= 16) return Infinity;
  if (act >= 11) return 2;
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
  const missing = fulls.filter((f) => pool.indexOf(f.id) >= 0 && !f.frags.every((fid) => (frags[fid] || 0) >= 1));
  const cands = (missing.length ? missing : fulls.filter((f) => pool.indexOf(f.id) >= 0)).map((f) => f.id);
  const arr = cands.slice();
  const picked = [];
  while (picked.length < 3 && arr.length) {
    const i = Math.floor(Math.random() * arr.length);
    picked.push(arr.splice(i, 1)[0]);
  }
  return picked;
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
  // 集齐自动路由（V3 §二：合成入背包 → 立即按当前主道自动投入生效）
  if (side === 'ferry') {
    if (s.sutras.indexOf(full.id) < 0 && (s.sutraBackpack || []).indexOf(full.id) < 0
        && full.frags.every((x) => (frags[x] || 0) >= 1)) {
      NDX.sutraBackpackOf(s).push(full.id);
      full.frags.forEach((x) => { frags[x] = Math.max(0, (frags[x] || 0) - 1); });
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
  return NDX.grantSutraShard(s, side, pick, act);
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
  pojie: ['贪','嗔','痴'],
  wuzi: ['无','字','真','经'],
  yaopu: ['形','骨','魂','魄'],
  xinyuan: ['跳','脱','闹','定','猿'],
  qitian: ['残','卷','破','天','阙','齐'],
  tigujue: ['剔','骨','还','父','母','莲'],
  zhanyaojue: ['听','调','不','听','宣','戟'],
  niumo: ['混','世','摩','云','覆','海','撼','山'],
  nitian: ['逆','天','改','命','破','法','裂','道','覆','纲','乱','常','诛','仙','弑','佛'],
  xuefo: ['血','佛','经','祭','灵'],
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
  { id: 'ni_full_xuefo', name: '《血佛经》', sutra: 'xuefo', effect: { ti: { atk: 30, hp: 120 }, reflect: 0.08, crit: 0.04 }, desc: '以血为墨，以骨为纸——血佛临世，攻、血、反伤同涨。', chantSkill: { name: '血佛降临', cd: 2, mult: 1.8, kind: 'glut-ton', desc: '法伤并吸血回复（持诵·血系）' } },
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
// 逆道经文全本是否已合成
NDX.niSutraDone = function (s, fullId) { return (s.niSutras || []).indexOf(fullId) >= 0; };
// 集齐一部之 3 段 → 自动合成全本（合成后扣除已用碎片）
// V3 §二 自动路由：合成入背包（待投）→ 立即按当前主道自动投入生效
NDX.tryCombineNiSutra = function (s, fullId) {
  const full = NDX.niSutraFullById(fullId);
  if (!full) return null;
  s.niSutras = s.niSutras || [];
  if (s.niSutras.indexOf(full.id) >= 0 || (s.sutraBackpack || []).indexOf(full.id) >= 0) return null;
  const frags = s.niSutraFrags || {};
  if (!full.frags.every((fid) => (frags[fid] || 0) >= 1)) return null;
  NDX.sutraBackpackOf(s).push(full.id);
  full.frags.forEach((fid) => { frags[fid] = (frags[fid] || 0) - 1; if (frags[fid] <= 0) delete frags[fid]; });
  if (NDX._notifySutra) NDX._notifySutra(s, full.id);
  if (NDX.routePendingSutras) NDX.routePendingSutras(s);
  return full;
};
// 选「逆」道即随机拾得一部逆道经文之碎片（优先补全已开卷者，避免永远凑不齐）
NDX.grantNiSutraFrag = function (s, rng) {
  s.niSutraFrags = s.niSutraFrags || {};
  s.niSutras = s.niSutras || [];
  const doneIds = (s.sutraBackpack || []);
  const pending = NDX.NI_SUTRA_FULLS.filter((f) => s.niSutras.indexOf(f.id) < 0 && doneIds.indexOf(f.id) < 0);
  if (!pending.length) return null;
  // 加权：已集 2 段者权重最高（快成了），已集 1 段次之，0 段最低——随机但偏向补全
  const weights = pending.map((f) => {
    const have = f.frags.filter((fid) => (s.niSutraFrags[fid] || 0) >= 1).length;
    return have === 2 ? 5 : have === 1 ? 3 : 1;
  });
  const total = weights.reduce((a, b) => a + b, 0);
  let roll = (rng ? rng() : Math.random()) * total;
  let pick = pending[0];
  for (let i = 0; i < pending.length; i++) { roll -= weights[i]; if (roll <= 0) { pick = pending[i]; break; } }
  const fragId = pick.frags[Math.floor((rng ? rng() : Math.random()) * pick.frags.length)];
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
  egui: { name: '饿鬼藏', desc: '大悲咒、观音经、血佛经、破戒录——千手护持，大悲回生。喉细如针，腹大如山；求不得的，才念得最勤。', sutras: ['su_full_dabei', 'su_full_guanyin', 'ni_full_xuefo', 'ni_full_pojie'] },
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
//  V3 §二 · 每经绑定六道途（渡/战/缘/夺/隐/逆）——自动路由版核心
//  合成后自动并入当前主道途生效，本经道途 === 当前主道途 时该经效果 ×1.5，
//  使「经文自动流向玩家所走之道」——替代旧的「全本通用 + 全局主道加成一次」。
//  API：NDX.SUTRA_DAO_TAG[fullId]=道途；NDX.sutraDaoOf(fullId) → 道途；NDX.sutraDaoName(fullId) → 道途名。
// ============================================================================
NDX.SUTRA_DAO_TAG = {
  // —— 渡藏（佛经）——
  su_full_jingang: '战', su_full_xinjing: '渡', su_full_fahua: '缘', su_full_huayan: '缘',
  su_full_lengyan: '渡', su_full_amituo: '缘', su_full_wuliangshou: '夺', su_full_weimo: '渡',
  su_full_yuanjue: '战', su_full_niepan: '缘', su_full_dabei: '渡', su_full_lengqie: '渡',
  su_full_jieshenmi: '隐', su_full_dizang: '缘', su_full_shanshan: '渡', su_full_tanjing: '隐',
  // —— 传承经文（P0-C 死亡渐进解锁，道途标签随书绑定）——
  su_full_guanyin: '渡', su_full_wenshu: '战',
  // —— 逆藏（逆道经文）——
  ni_full_pojie: '夺', ni_full_wuzi: '逆', ni_full_yaopu: '夺', ni_full_xinyuan: '战',
  ni_full_qitian: '战', ni_full_tigujue: '逆', ni_full_zhanyaojue: '战', ni_full_niumo: '夺',
  ni_full_nitian: '逆',
  // —— 补全（V8.58）：早期漏标 7 部，按「chantSkill.kind 强规则 + 藏别归属」补齐 ——
  //   ward-mantra 现网 4/4 全为「缘」；glut-ton 4/4 全为「夺」；逆藏终极/堕天归「逆」。
  su_full_jinguangming: '缘', su_full_renwang: '缘', su_full_fanwang: '缘',
  su_full_faju: '渡',
  ni_full_xuefo: '夺',
  ni_full_duotian: '逆', ni_full_mieshi: '逆',
};
NDX.sutraDaoOf = function (fullId) { return NDX.SUTRA_DAO_TAG[fullId] || null; };
NDX.sutraDaoName = function (fullId) {
  const d = NDX.sutraDaoOf(fullId);
  return (d && NDX.SEAL_DAOTU && NDX.SEAL_DAOTU[d]) ? NDX.SEAL_DAOTU[d].name : d;
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
  const all = Object.keys(NDX.SUTRA_DAO_TAG || {}).filter((fid) => {
    if (NDX.SUTRA_DAO_TAG[fid] !== mainDao) return false;
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
  夺: { hp: 120,  dr: 0.01,   desc: '夺道·经文吞纳' },
  隐: { eva: 0.02, cri: 0.02, desc: '隐道·经文匿踪' },
  逆: { atk: 8,   cri: 0.03,  desc: '逆道·经文戾骨' },
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
  };
  if (daoB && daoB.hp) eff.ti.hp += daoB.hp;
  if (daoB && daoB.atk) eff.ti.atk += daoB.atk;
  return eff;
};

