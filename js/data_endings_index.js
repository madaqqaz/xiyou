// =============================================================
// data_endings_index.js — 结局数据化 · NDX.ENDINGS 统一索引表（2026-09-14 P2 整改 #10）
// ---------------------------------------------------------------------------
// 问题：结局从未数据化——之前 NDX.ENDINGS 被当作死代码清理掉（data_trials_story.js:167
//   「全局无任何调用点」），因为当时它只是个没有消费者的数据壳。
//   但「没有消费者」不等于「不需要」：结局逻辑散在三处，图鉴/藏经阁无法枚举：
//     · 动态结局 10 条：js/endings.js NDX.Ending.DEFINITIONS（cond 是函数，门槛不可读）
//     · 静态兜底 7 变种：js/game/game_meta.js computeEnding（按英雄 + 善恶，硬编码 if 链）
//     · CG 6 张：js/data_endings_cg.js NDX.ENDINGS_CG（与结局之间无任何关联字段）
//   后果：玩家看不到「还有哪些结局没打到」，新增结局要在三处同步改，扩展成本高。
//
// 方案：建唯一索引表 NDX.ENDINGS（20 条：10 动态 + 7 静态 + 3 告别卡），
//   每条含 id / title / source / threshold（**可读门槛**，把 cond 函数翻译成人话）/ cg / tone / hero。
//   并让表**真被消费**：包装 NDX.Ending.determineEnding，返回值补上 id + cg，
//   使「结局 → CG」的关联第一次真正接上（此前 CG 与结局各画各的）。
//
// ⚠ 维护约定：新增/修改结局时，必须同步本表 + endings.js + ENDINGS_CG 三处，
//   门禁 _verify_endings_index.js 会校验三者的 id / 标题 / CG 引用一致性。
// =============================================================
window.NDX = window.NDX || {};
var NDX = window.NDX;

NDX.ENDINGS = [
  // ——— 动态结局（source: dynamic，判定真源 endings.js DEFINITIONS，按 ORDER 优先级命中）———
  { id: 'lingshan', title: '灵山逆座', source: 'dynamic', tone: 'dark', cg: 'nidao',
    threshold: '难4 选「逼问真相」+ 恶 > 善 + 逆道抉择 ≥ 5',
    desc: '掀桌子的人，坐上了空着的莲座。' },
  { id: 'liuer', title: '六耳同修', source: 'dynamic', tone: 'rebel', cg: 'dasheng',
    threshold: '解锁六耳印记（flags.liuerUnlocked，难70 分支）',
    desc: '殿上站着两尊取经人，如来谁也辨不得。' },
  { id: 'changan', title: '长安还俗', source: 'dynamic', tone: 'light', cg: null,
    threshold: '取经人 + 善 > 40 + 难4 走「饶他一命／交官府」善向分支',
    desc: '把经卷留在渡口，脱了袈裟，走回长安开了家药铺。' },
  { id: 'wanbao', title: '万宝归一', source: 'dynamic', tone: 'rebel', cg: null,
    threshold: '夺道抉择 ≥ 5 或 装备 ≥ 10 件 或 金币 ≥ 200',
    desc: '经？这一路的宝贝，哪一件不是经。' },
  { id: 'wanfa', title: '万法皆空', source: 'dynamic', tone: 'light', cg: 'zhengguo',
    threshold: '渡道抉择 ≥ 8 + 善 > 恶×2 + 观音缘 ≥ 10',
    desc: '你把自己渡成了一卷无字真经。' },
  { id: 'zhanfo', title: '战佛临世', source: 'dynamic', tone: 'rebel', cg: 'dasheng',
    threshold: '战道抉择 ≥ 8',
    desc: '从今日起，佛由我来做——不服的，出来打。' },
  { id: 'yuanding', title: '缘定三生', source: 'dynamic', tone: 'light', cg: null,
    threshold: '缘道抉择 ≥ 6 + 人脉总和 ≥ 20 + 已收八戒与沙僧',
    desc: '如来问：经呢？你指了指身后的人：这就是经。' },
  { id: 'jinchan', title: '金蝉正果', source: 'dynamic', tone: 'light', cg: 'zhengguo',
    threshold: '取经人 + 善 ≥ 恶',
    desc: '度的不只是众生，还有十世前敢问一句"度的是谁"的自己。' },
  { id: 'yipo', title: '一魄转世', source: 'dynamic', tone: 'dark', cg: 'nidao',
    threshold: '恶 > 善 或 逆道抉择 ≥ 3',
    desc: '横刀向颈，只留一魄不灭——下一世，簿子上的名字换你来写。' },
  { id: 'nidao', title: '逆道西行', source: 'dynamic', tone: 'rebel', cg: 'nidao',
    threshold: '取经人（动态结局兜底）',
    desc: '经你取了，佛你见了，可你偏不跪。' },
  // ——— 静态兜底（source: static，判定真源 game_meta.computeEnding 的 if 链）———
  { id: 'st_jinchan', title: '金蝉正果', source: 'static', tone: 'light', cg: 'zhengguo', hero: 'tangseng',
    threshold: '取经人 + 非恶道（善 ≥ 恶 且 渡+隐 ≥ 逆+战+夺）',
    desc: '静态兜底第 1 分支：如愿成佛，真经东归。' },
  { id: 'st_yipo', title: '一魄转世', source: 'static', tone: 'dark', cg: 'nidao',
    threshold: '恶道（恶 > 善 或 逆+战+夺 > 渡+隐）',
    desc: '静态兜底第 2 分支：不愿跪，血溅凌云渡。' },
  { id: 'st_dasheng', title: '大圣脱局', source: 'static', tone: 'rebel', cg: 'dasheng', hero: 'wukong',
    threshold: '英雄 = 悟空（且未命中恶道）',
    desc: '八十一难困得住取经人，困不住那只醒了的猴子。' },
  { id: 'st_jingtan', title: '净坛圆觉', source: 'static', tone: 'light', cg: null, hero: 'bajie',
    threshold: '英雄 = 八戒（且未命中恶道）',
    desc: '回高老庄，替翠兰扶一亩春。' },
  { id: 'st_juanlian', title: '卷帘归真', source: 'static', tone: 'light', cg: null, hero: 'shaseng',
    threshold: '英雄 = 沙僧（且未命中恶道）',
    desc: '第一个「不说话」的罗汉。' },
  { id: 'st_bailong', title: '白龙渡海', source: 'static', tone: 'rebel', cg: null, hero: 'xiaobailong',
    threshold: '英雄 = 小白龙（且未命中恶道）',
    desc: '从此你是自己的龙王，自由东归。' },
  // ⚠【2026-09-14 实机发现】本条为 computeEnding 的**最终兜底**，实测**不可达**：
  //   hero 只可能是 5 个英雄之一——tangseng 走「金蝉正果 / 一魄转世」，其余 4 英雄走
  //   「一魄转世 / 各自专属分支」，五个分支已穷尽所有组合，return 永远落不到这一行。
  //   保留登记是为了让「有这条兜底但走不到」这件事**可见**（此前没人知道），
  //   不删除是因为它仍是防御性代码（若日后新增第 6 英雄，即刻恢复可达）。
  { id: 'st_nidao', title: '逆道西行', source: 'static', tone: 'rebel', cg: 'nidao', unreachable: true,
    threshold: '以上皆未命中（最终兜底）— 当前英雄集下不可达，见上方说明',
    desc: '西游簿上少了一笔，天地间多了一条不认命的路。' },
  // ——— 英雄告别卡（source: cg，以「该英雄通关」逐卡点亮）———
  { id: 'bajie-farewell', title: '净坛圆觉', source: 'farewell', tone: 'light', cg: 'bajie-farewell', hero: 'bajie',
    threshold: '以八戒达成任意结局', desc: '散伙的话我说了八百回，可真到分岔口，腿反倒比嘴老实。' },
  { id: 'shaseng-farewell', title: '卷帘归真', source: 'farewell', tone: 'light', cg: 'shaseng-farewell', hero: 'shaseng',
    threshold: '以沙僧达成任意结局', desc: '灯亮了，众生在其中影影绰绰。他合掌，不言语。' },
  { id: 'longma-farewell', title: '白龙渡海', source: 'farewell', tone: 'rebel', cg: 'longma-farewell', hero: 'xiaobailong',
    threshold: '以小白龙达成任意结局', desc: '长吟入海，从此再无缰绳。' },
];

// —— 查询接口（供图鉴 / 藏经阁 / 结局画廊消费）——
NDX.endingById = function (id) { return (NDX.ENDINGS || []).find((e) => e.id === id) || null; };
NDX.endingsBySource = function (src) { return (NDX.ENDINGS || []).filter((e) => e.source === src); };
NDX.endingByTitle = function (title) { return (NDX.ENDINGS || []).find((e) => e.title === title) || null; };
// 取该结局的 CG 定义（打通「结局 → CG」，此前两者无任何关联字段）
NDX.endingCgOf = function (id) {
  const e = NDX.endingById(id);
  if (!e || !e.cg) return null;
  return (NDX.ENDINGS_CG || []).find((c) => c.id === e.cg) || null;
};

// —— 消费点：包装动态结局判定，返回值补 id + cg ——
//    此前 determineEnding 只回 { title, text }，UI 想配 CG 只能靠标题硬匹配（且根本没做），
//    结局与 CG 各画各的。包装后返回值即为「带 CG 的完整结局」，接线一处、全链路生效。
(function () {
  if (!NDX.Ending || typeof NDX.Ending.determineEnding !== 'function') return;
  const _orig = NDX.Ending.determineEnding;
  NDX.Ending.determineEnding = function (s) {
    const r = _orig.call(this, s);
    if (!r) return r;
    if (!r.id) {
      const e = NDX.endingByTitle(r.title);
      if (e) { r.id = e.id; r.cg = e.cg || null; }
    }
    if (r.id && r.cg == null) {
      const e2 = NDX.endingById(r.id);
      if (e2) r.cg = e2.cg || null;
    }
    return r;
  };
})();
