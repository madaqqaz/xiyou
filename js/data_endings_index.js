// =============================================================
// data_endings_index.js — 结局数据化 · NDX.ENDINGS 统一索引表（2026-09-14 P2 整改 #10）
// ---------------------------------------------------------------------------
// 问题：结局从未数据化——之前 NDX.ENDINGS 被当作死代码清理掉（data_trials_story.js:167
//   「全局无任何调用点」），因为当时它只是个没有消费者的数据壳。
//   但「没有消费者」不等于「不需要」：结局逻辑散在三处，图鉴/藏经阁无法枚举：
//     · 动态结局 10 条：js/endings.js NDX.Ending.DEFINITIONS（cond 是函数，门槛不可读）
//     · 静态兜底 7 变种：js/game/game_meta.js computeEnding（按英雄 + 善恶，硬编码 if 链）
//     · CG（当时 6 张 · **现 8 张**）：js/data_endings_cg.js NDX.ENDINGS_CG（当时与结局之间无任何关联字段）
//   后果：玩家看不到「还有哪些结局没打到」，新增结局要在三处同步改，扩展成本高。
//
// 方案：建唯一索引表 NDX.ENDINGS，**2026-09-27 已收缩为 14 条：10 动态 + 4 静态**
//   （原 22 条：10 动态 + 7 静态 + 5 告别卡）。
//   ⚠ 上述计数为**快照事实**，不许当口径引用；真值请以 `NDX.ENDINGS.length` 为准，
//      并已由 `scripts/_verify_endings_index.js` 的 E12/E13 与 `_verify_ending_scope.js` 的
//      A2b/D1 **锁定**（表结构再变时这两处门禁会先红，改表必须同步改门禁与该注）。
//   每条含 id / title / source / threshold（**可读门槛**，把 cond 函数翻译成人话）/ cg / tone / hero。
//   并让表**真被消费**：包装 NDX.Ending.determineEnding，返回值补上 id + cg，
//   使「结局 → CG」的关联第一次真正接上（此前 CG 与结局各画各的）。
//
// 🔴 **2026-09-27 收缩说明（用户拍板「收缩成别名表并接消费端」）**：删掉 8 行重复登记——
//   · 3 条与 dynamic **同标题**的 static（st_jinchan / st_yipo / st_nidao）：
//     `endingByTitle` 取「首个匹配」，它们排在动态行之后 ⇒ **永远命中不到**，只是把行数撑到 22；
//     早期审计报告据此误判「对外口径应是 22」，实为未去重（去重后执行面仍是 10）。
//   · 5 条 farewell：id 与标题与 `ENDINGS_CG` 逐字相同 ⇒ R9「一身一 id」违规的双表重复登记，
//     告别卡真源收敛到 `data_endings_cg.js` 一处（UI 画廊本来就只读那张表）。
//   · 保留的 4 条 static（st_dasheng / st_jingtan / st_juanlian / st_bailong）是
//     `computeEnding` 各英雄分支**唯一的可读门槛登记处**，删不得。
//   ⚠ 收缩后 `endingByTitle` / `endingById` 的命中结果**不变**（删的全是被遮蔽或重复的行）。
//
// ⚠ 维护约定：新增/修改结局时，必须同步本表 + endings.js + ENDINGS_CG 三处，
//   门禁 _verify_endings_index.js 会校验三者的 id / 标题 / CG 引用一致性；
//   收缩后的行数 / 去重标题数由 `scripts/_verify_ending_scope.js` 钉死。
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
  // 🩸 2026-09-27 收缩：原 st_jinchan「金蝉正果」/ st_yipo「一魄转世」/ st_nidao「逆道西行」
  //    三条**与 dynamic 行同标题**，而 `endingByTitle` 取「首个匹配」⇒ 它们永远命中不到，
  //    只是把行数从 14 撑到 22（早期审计报告据此误判「对外口径 22」）。已删除，判定行为不变。
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
  // ⚠【2026-09-14 实机发现 · 保留为注释】`game_meta.computeEnding` 的**最终兜底**「逆道西行」
  //   实测**不可达**：hero 只可能是 5 个英雄之一——tangseng 走「金蝉正果 / 一魄转世」，其余 4 英雄走
  //   「一魄转世 / 各自专属分支」，五个分支已穷尽所有组合，return 永远落不到那一行。
  //   原登记行 `st_nidao` 已于 2026-09-27 收缩时删除（与 dynamic `nidao` 同标题、永远命中不到），
  //   但这段事实仍有价值：**日后若新增第 6 英雄，该兜底即刻恢复可达**，别到时候当 bug 修。
  // 
  // 🩸 2026-09-27 收缩：原 5 条 farewell 行（bajie/shaseng/longma/wukong/tangseng）已删除——
  //   它们的 id 与标题**与 `NDX.ENDINGS_CG` 逐字相同**，属 R9 违规的「一身两表重复登记」。
  //   告别卡真源收敛到 `data_endings_cg.js` 一处（UI 画廊本来就只读那张表）。
];

// =============================================================
// 「已达成结局」持久化 + 结局图鉴（2026-09-27 · 用户拍板 B 方案）
// ---------------------------------------------------------------------------
// 索引表长期以来**零运行时消费者**（全部查询接口只被自家门禁读），立项动机「让玩家看到还缺
//   哪几个结局」从未兑现。本块把它接上：跨局记录已达成结局，藏经阁按条点亮。
//
// ⚠ 存储位置选在 **localStorage 跨局层**（不是局内存档 `s`）：
//   · 新增字段**只增不减** —— 老玩家只是「列表为空」，不会凭空丢任何已有奖励；
//   · 因此**不需要**像 `s.origin` 那样在 `restoreRun` 补折算位（那种是"老档拿不到旧奖励"的真回归）。
// ⚠ 只记**索引表认可**的 id：`NDX.endingById(id)` 命中才入簿 ⇒ 论道三选改写出来的标题
//   （不在索引表内）自然被挡掉，避免图鉴出现无门槛、无 CG 的野条目。
// =============================================================
NDX.endingSeenIds = function () {
  var raw = (NDX.storage && NDX.storage.load) ? NDX.storage.load(NDX.storage.KEYS.ENDING_SEEN) : null;
  return Array.isArray(raw) ? raw.slice() : [];
};
// 从结局对象解析索引表 id：优先自带 id（动态侧由包装层补），否则按 title 反查
//   （`computeEnding` 的静态兜底与 `game_event_2` 的中途结局都不带 id）
NDX.endingIdOf = function (ending) {
  if (!ending) return null;
  if (ending.id && NDX.endingById(ending.id)) return ending.id;
  var e = NDX.endingByTitle(ending.title);
  return e ? e.id : null;
};
NDX.markEndingSeen = function (ending) {
  var id = (typeof ending === 'string') ? ending : NDX.endingIdOf(ending);
  if (!id || !NDX.endingById(id)) return false;   // 索引表不认 ⇒ 不入簿
  var list = NDX.endingSeenIds();
  if (list.indexOf(id) >= 0) return true;
  list.push(id);
  if (NDX.storage && NDX.storage.save) NDX.storage.save(NDX.storage.KEYS.ENDING_SEEN, list);
  return true;
};
// 点亮判据：dynamic 按「已达成」记录；static 按「该英雄通关」（复用既有 `clearedHeroes`，不新存）
NDX.endingSeenFor = function (row) {
  if (!row) return false;
  if (String(row.source) === 'static') {
    var cl = (NDX.clearedHeroes ? NDX.clearedHeroes() : []) || [];
    return !!row.hero && cl.indexOf(row.hero) >= 0;
  }
  return NDX.endingSeenIds().indexOf(row.id) >= 0;
};
// 图鉴渲染（抽成具名导出，供 UI 直接插入、供门禁真调断言）
//   ⚠ 未点亮**只给解锁条件 threshold，不给 title/desc** —— 图鉴是「还差几个」的钩子，不是剧透页。
NDX.endingCodexHtml = function () {
  var rows = NDX.ENDINGS || [];
  var seen = rows.filter(function (e) { return NDX.endingSeenFor(e); }).length;
  var cards = rows.map(function (e) {
    var on = NDX.endingSeenFor(e);
    return '<div class="ex-card tone-' + (e.tone || 'light') + (on ? '' : ' lock') + '">'
      + '<div class="ex-title">' + (on ? e.title : '？？？') + '</div>'
      + '<div class="ex-text">' + (on ? (e.desc || '') : '解锁条件：' + (e.threshold || '—')) + '</div>'
      + '</div>';
  }).join('');
  return '<div class="ending-codex"><div class="ex-head">📖 结局图鉴（已达成 '
    + seen + ' / ' + rows.length + '）</div>' + cards + '</div>';
};

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
