// =============================================================
// data_mirror.js — 《逆道西行》镜像战系统 · MIRROR_TIERS/MIRROR_LIB
// 从 data.js 拆分（2026-08-31）：独立维护镜像战系统
// 全局命名空间 NDX（同时挂到 window，兼容其他文件以 window.NDX 引用）
// =============================================================
window.NDX = window.NDX || {};
var NDX = window.NDX;

NDX.MIRROR_TIERS = {
  1: { name: '天兵阶段', theme: '生存与杀戮' },
  2: { name: '星宿阶段', theme: '伪装与真实' },
  3: { name: '真君阶段', theme: '力量与代价' },
  4: { name: '帝君阶段', theme: '认知与存在' },
};

// 基础抉择库：每个选项含 文案 / 镜中倒影 / 顺逆线 / apply（本局持续状态增量） / once（立即结算 effect）
NDX.MIRROR_LIB = {
  1: [ // 1-20 天兵：生存与杀戮
    {
      side: 'order', verse: '天兵虽众，皆有性命。绕道而行，不伤蝼蚁。',
      reflect: '你转身离去，镜中人却拔刀斩杀了空无一人的地平线。',
      apply: { nextEnemyMinus: 1, healPct: 0.30 },
    },
    {
      side: 'chaos', verse: '挡我者死，以血铺路。杀光他们，踏尸前行。',
      reflect: '你疯狂劈砍，镜中人却双手合十，面露慈悲。',
      apply: { atkPct: 0.15, maxHpLossPct: 0.10 },
    },
  ],
  2: [ // 21-40 星宿：伪装与真实
    {
      side: 'order', verse: '天庭封正，星宿有名。受其一礼，可保无虞。',
      reflect: '你低头受礼，镜中人却顶着你的脸，狞笑着吞噬了星宿的元神。',
      apply: { shieldPct: 0.20, starDmgTaken: 0.20 },
    },
    {
      side: 'chaos', verse: '神位虚名，我亦撕之。夺其神位，据为己有。',
      reflect: '你坐在神位上，镜中人却被钉在神位的椅背上，鲜血淋漓。',
      apply: { starPassive: true, hpLossOnEnterPct: 0.05 },
    },
  ],
  3: [ // 41-60 真君：力量与代价
    {
      side: 'order', verse: '真君法力，浩荡无量。借法护身，虽稳却慢。',
      reflect: '你浑身金光，镜中人却被沉重的金光压得跪在地上。',
      apply: { drPct: 0.25, slowMove: true },
    },
    {
      side: 'chaos', verse: '法力无主，强取豪夺。燃寿换力，只争朝夕。',
      reflect: '你浑身浴血狂笑，镜中人却面色红润，端坐养神。',
      apply: { bloodFury: true, hpDrainPct: 0.01 },
    },
  ],
  4: [ // 61-80 帝君：认知与存在
    {
      side: 'order', verse: '天道有序，不可逆也。顺应天命，可得超脱。',
      reflect: '你飞升而去，镜中人却留在原地，慢慢化为石像。',
      apply: { immuneDeath: true, bossDebuff: 0.20 },
    },
    {
      side: 'chaos', verse: '天道不仁，以万物为刍狗。我既为狗，便要噬天。',
      reflect: '你啃食着天空，镜中人却被天穹挤压成一张薄饼。',
      apply: { bossDmgMul: 0.30, fateNodeDisabled: true },
    },
  ],
};

// 第50层【业镜·中阴身】：善恶分水岭，强制改写双线权重并解锁结局分支
NDX.MIRROR_MID = {
  order: {
    verse: '原来，我才是那需要被度化的劫数。罢了，合眼便是终局。',
    reflect: '无面人长出了一张慈悲的脸，然后碎裂成无数金色的字符。',
    apply: { midOrder: true, enemyAtkMul: 0.85, enemyHpMul: 1.30, fateBranch: '归顺天道' },
  },
  chaos: {
    verse: '既为劫数，那便劫个彻底！这天道若不容我，我便将它撕个粉碎！',
    reflect: '无面人长出了一双血红色的眼睛，然后一拳打碎了镜子。',
    apply: { midChaos: true, enemyAtkMul: 1.30, enemyHpMul: 0.80, fateBranch: '大闹天宫' },
  },
};

// 照见五蕴：携带特定英雄神装碎片时触发（五英雄心魔）
// 触发判定由 buildMirror 读取 s.tjShards（神装碎片 id 列表），碎片 id 形如 'shard_wukong' 等
NDX.MIRROR_FIVE = {
  wukong: {
    hero: '悟空', demon: '镜中悟空：“你以为你打破了紧箍？可笑！那紧箍早已长进了肉里，化作了你的骨头！”',
    opts: [
      { key: 'cut', verse: '【斩业】弃一件防御装备，换【如意金箍棒碎片】×2', apply: { wuCutArmor: 2 } },
      { key: 'heart', verse: '【斩心】弃碎片，换全队护盾', apply: { wuHeartShield: true } },
    ],
  },
  tangseng: {
    hero: '取经人', demon: '镜中取经人：“你念你的阿弥陀佛，我见我的尸山血海。超度？你连自己都超度不了。”',
    opts: [
      { key: 'sacrifice', verse: '【舍身】耗50%当前生命，复活全体阵亡队友', apply: { tsSacrifice: true } },
      { key: 'save', verse: '【普度】耗所有混元点，下层BOSS化为友军（仅本层）', apply: { tsSaveBoss: true } },
    ],
  },
  bajie: {
    hero: '八戒', demon: '镜中八戒：“高老庄？那是梦。这满地的神装，才是实在的。吃，给我吃！”',
    opts: [
      { key: 'glutton', verse: '【暴食】吞噬背包内一件装备，属性永久叠加到另一件', apply: { bjGlutton: true } },
      { key: 'vomit', verse: '【呕吐】丢弃所有装备，换巨额混元点', apply: { bjVomit: true } },
    ],
  },
  shaseng: {
    hero: '沙僧', demon: '镜中沙僧：“这担子太重了，压弯了我的脊梁。不如放下，做个自在人？”',
    opts: [
      { key: 'drop', verse: '【卸担】移除所有负面状态，但本局不再获新劫印', apply: { ssDrop: true } },
      { key: 'carry', verse: '【挑担】保留负面状态，转化为等量攻击力', apply: { ssCarry: true } },
    ],
  },
  bailong: {
    hero: '白龙', demon: '镜中白龙：“龙吟九霄，却无人听闻。你我的故事，史书不载，天道不记。”',
    opts: [
      { key: 'roar', verse: '【龙吟】本层攻击附真实伤害，但无法触发缘分节点交互', apply: { blRoar: true } },
      { key: 'dive', verse: '【潜渊】本层完全隐形（敌人无视你），但无法获得战利品', apply: { blDive: true } },
    ],
  },
};
NDX.MIRROR_FIVE_SHARD = { wukong: 'shard_wukong', tangseng: 'shard_tangseng', bajie: 'shard_bajie', shaseng: 'shard_shaseng', bailong: 'shard_bailong' };

// 无尽模式【业镜·破碎】：文字与效果错位（天道已疯，我亦成魔）
NDX.MIRROR_BROKEN = [
  {
    textA: '饮下孟婆汤，忘却前尘。', effectA: { grantRandomDivine: true },
    textB: '斩断因果线，重塑真我。', effectB: { loseFirstSlot: true },
    note: '文字与效果皆已错位——你只能凭直觉去赌。',
  },
];

// 动态构建业镜节点数据（供 ui 渲染 / game 应用）
// 返回 { title, sub, mirror:true, opts:[{key,side,verse,reflect,apply}], mid, broken, five }
NDX.buildMirror = function (node, layer, s) {
  s = s || {};
  const shards = s.tjShards || [];
  // 1) 无尽破碎（优先级最高）
  if (node.mirrorBroken) {
    const b = NDX.MIRROR_BROKEN[0];
    return {
      title: '业镜·破碎', sub: '天道已疯，我亦成魔', mirror: true, broken: true,
      opts: [
        { key: 'bA', side: 'void', verse: b.textA, reflect: '镜面裂成蛛网，每一片里都映着一个陌生的你。', apply: b.effectA },
        { key: 'bB', side: 'void', verse: b.textB, reflect: '镜中倒影与文字背道而驰，逻辑在此崩坏。', apply: b.effectB },
      ],
      note: b.note,
    };
  }
  // 2) 第50层【业镜·中阴身】
  if (node.mirrorMid) {
    return {
      title: '业镜·中阴身', sub: '无面取经人凝视着你', mirror: true, mid: true,
      opts: [
        { key: 'midOrder', side: 'order', verse: NDX.MIRROR_MID.order.verse, reflect: NDX.MIRROR_MID.order.reflect, apply: NDX.MIRROR_MID.order.apply },
        { key: 'midChaos', side: 'chaos', verse: NDX.MIRROR_MID.chaos.verse, reflect: NDX.MIRROR_MID.chaos.reflect, apply: NDX.MIRROR_MID.chaos.apply },
      ],
    };
  }
  // 3) 照见五蕴（携带神装碎片时触发，镜中显现一名英雄心魔）
  // 触发条件：神装碎片 ≥ 3 件（暗合"五蕴"之数取其意）；随机择一名尚未照见过的英雄
  if (shards.length >= 3) {
    const keys = Object.keys(NDX.MIRROR_FIVE);
    const seen = (s.flags && s.flags._mirrorFiveSeen) || [];
    let pool = keys.filter((k) => seen.indexOf(k) < 0);
    if (!pool.length) pool = keys;
    const hk = pool[Math.floor(Math.random() * pool.length)];
    const five = NDX.MIRROR_FIVE[hk];
    return {
      title: '照见五蕴', sub: five.demon, mirror: true, five: true, fiveKey: hk,
      opts: five.opts.map((o) => ({ key: 'five_' + o.key, side: 'demon', verse: o.verse, reflect: '镜中显现的，是你的心魔，而非你的倒影。', apply: o.apply })),
    };
  }
  // 4) 基础抉择库（按 tier）
  const tier = node.mirrorTier || 1;
  const lib = NDX.MIRROR_LIB[tier] || NDX.MIRROR_LIB[1];
  const tdef = NDX.MIRROR_TIERS[tier] || NDX.MIRROR_TIERS[1];
  return {
    title: '业镜·' + tdef.name, sub: '主题：' + tdef.theme, mirror: true, tier,
    opts: lib.map((o, i) => ({ key: 't' + tier + '_' + i, side: o.side, verse: o.verse, reflect: o.reflect, apply: o.apply })),
  };
};

// 敌人血量指数缩放（防崩坏机制）：base * (1 + layer*0.1)^2
NDX.tianJieMonsterHpScale = function (layer, baseHp) {
  const f = Math.pow(1 + (layer || 1) * 0.1, 2);
  return Math.round((baseHp || 100) * f);
};

// 混元点结算：写入 favor.hunyuan（永久货币），并同步刷新最高层数
NDX.addMiPoints = function (n, layer) {
  const fv = NDX.loadFavor();
  fv.hunyuan = (fv.hunyuan || 0) + (n || 0);
  NDX.saveFavor(fv);
  if (typeof layer === 'number' && layer > 0) NDX.saveTianDaoLayer(layer);
  return fv.hunyuan;
};

// 神装碎片掉落（仅本次天道劫生效）：精英1-2片，BOSS 3-5片
NDX.rollDivineShard = function (layer, isBoss) {
  const count = isBoss ? NDX._rand(3, 5) : NDX._rand(1, 2);
  const tier = layer >= 80 ? 'gold' : (layer >= 40 ? 'blue' : 'white');
  const names = ['斗战圣佛·箍', '斗战圣佛·甲', '斗战圣佛·棒', '斗战圣佛·靴', '斗战圣佛·披'];
  const out = [];
  for (let i = 0; i < count; i++) {
    out.push({ id: 'tj_shard_' + layer + '_' + i, name: NDX._pick(names) + '碎片', tier: tier, tianJie: true });
  }
  return out;
};

// 升级混元淬炼条目：扣混元点，写存档；返回 {ok, msg}
NDX.upgradeHunyuan = function (id) {
  const opt = (NDX.HUNYUAN_OPTS || []).find((o) => o.id === id);
  if (!opt) return { ok: false, msg: '未知淬炼条目' };
  const fv = NDX.loadFavor();
  const hy = NDX.loadHunyuan();
  const cur = hy[id] || 0;
  if (opt.prereq && !opt.prereq(hy, fv)) return { ok: false, msg: '前置未满足（需全部淬炼≥1层且天道劫100层）' };
  if (cur >= (opt.maxLv || 1)) return { ok: false, msg: '已达最高层' };
  if ((fv.hunyuan || 0) < opt.cost) return { ok: false, msg: '混元点不足' };
  fv.hunyuan -= opt.cost;
  hy[id] = cur + 1;
  NDX.saveFavor(fv);
  NDX.saveHunyuan(hy);
  return { ok: true, msg: `${opt.name} 淬炼至 ${'ⅠⅡⅢⅣⅤ'[cur] || (cur + 1)} 层` };
};

// 升级赐福（order/chaos 任一条目 +1 级）。混元点不足时也可用轮回败绩进度兑换？此处直接升级，消耗由局末 recordRunEnd 累积。
// 为避免无代价刷级，正道/逆道升级各消耗 1 点「轮回败绩进度」(fv.progress)，不足则拒绝。
NDX.upgradeBlessing = function (side, id) {
  const fv = NDX.loadFavor();
  const cost = 1; // 每级消耗 1 点轮回败绩进度
  if ((fv.progress || 0) < cost) {
    return { ok: false, msg: '轮回败绩进度不足（需反复轮回历练）' };
  }
  if (side === 'order') {
    const bs = (NDX.ORDER_BLESSINGS || []).find((x) => x.id === id);
    if (!bs) return { ok: false, msg: '未知秩序赐福' };
    fv.orderLv = (fv.orderLv || 0) + 1;
  } else if (side === 'chaos') {
    const bs = (NDX.CHAOS_BLESSINGS || []).find((x) => x.id === id);
    if (!bs) return { ok: false, msg: '未知混沌赐福' };
    fv.chaosLv = (fv.chaosLv || 0) + 1;
  } else {
    return { ok: false, msg: '未知赐福路线' };
  }
  fv.progress -= cost;
  NDX.saveFavor(fv);
  return { ok: true, msg: '赐福已晋升' };
};

// ============================================================
// 轮回殿·音效与台词 钩子（对接点，留待音频系统接入）
// 纯前端无音频库时为安全占位：不影响逻辑，仅作为接入点
// ============================================================
NDX.applyTrackBodyClass = function () {
  try {
    if (typeof document === 'undefined' || !document.body) return;
    document.body.classList.remove('save-good-track', 'save-evil-track', 'hunyuan-mode');
    const tc = NDX.trackBodyClass();
    if (tc) document.body.classList.add(tc);
    const form = NDX.coreForm();
    if (form.key === 'kong') document.body.classList.add('hunyuan-mode');
  } catch (e) { /* 忽略 */ }
};
NDX.playCycleEnter = function () {
  // 一周目初次进入：「回头是岸。」；多周目未双线收集：「这路，你还要走多久？」
  try {
    const cycle = (typeof NDX.getCycle === 'function') ? NDX.getCycle() : 1;
    const comp = NDX.nanbuCompletion();
    if (cycle <= 1 && !comp.zhengAll && !comp.niAll) {
      NDX.flashLine && NDX.flashLine('回头是岸。');
    } else if (!comp.zhengAll || !comp.niAll) {
      NDX.flashLine && NDX.flashLine('这路，你还要走多久？');
    }
  } catch (e) { /* 忽略 */ }
};
NDX.playBlessSfx = function (side) {
  // 秩序：清脆风铃；混沌：低沉血肉撕裂声 + 尖啸
  // 音频系统接入点（当前占位）
};
NDX.flashLine = NDX.flashLine || function (txt) {
  try {
    if (typeof document === 'undefined') return;
    let el = document.getElementById('ndx-flash-line');
    if (!el) {
      el = document.createElement('div');
      el.id = 'ndx-flash-line';
      el.className = 'ndx-flash-line';
      // 闪现提示行挂进 ndx-modal-host（随旋转层横屏）；body 仅兜底
      (window.__ndxOverlay || document.body.appendChild.bind(document.body))(el);
    }
    el.textContent = txt;
    el.classList.add('show');
    setTimeout(function () { el.classList.remove('show'); }, 2600);
  } catch (e) { /* 忽略 */ }
};

// 构建本局开局福利（在 start() 时调用）。返回：
// { pickWhiteSeal:bool, grantBlueFate:bool, favor:BonusObj, lines:[...] }
// 注意：pickWhiteSeal 进入「bless-seal」面板让玩家自选；grantBlueFate 与 favor 在 start 内直接生效
NDX.buildOpeningBlessing = function (s) {
  const last = NDX.loadLastRun();
  const fv = NDX.loadFavor();
  const cycle = (typeof NDX.getCycle === 'function') ? NDX.getCycle() : (s.flags.cycle || 1);
  const favor = NDX.favorBonus(fv.progress, cycle);
  const lines = [];
  let pickWhiteSeal = false;
  let grantBlueFate = false;

  if (last && last.killed) {
    // 档1：未过第一章 Boss → 自选白劫印 + 基础法宝
    if (!last.beatCh1Boss) {
      pickWhiteSeal = true;
      lines.push('【佛祖庇佑】上一局未破第一章关隘——佛祖于你临行前塞来一道白劫与一件法宝，择印自取。');
    }
    // 档2：前15难暴毙 → 直送蓝色劫印（与档1可叠加；V8.26 命痕并入劫印）
    if (last.deathLayer > 0 && last.deathLayer <= 15) {
      grantBlueFate = true;
      lines.push('【佛祖庇佑】上一局于前十五难便折戟——一道蓝劫已刻入你魂魄，改写此后战斗。');
    }
    if (!pickWhiteSeal && !grantBlueFate) {
      lines.push('【佛祖庇佑】上一局虽败，然你已行至深处——赐福自在轮回中积累。');
    }
  } else if (last && !last.killed) {
    lines.push('（上一局全身而退 / 已通关，此局不享失败补偿。）');
  } else {
    lines.push('（初入西行，尚无败绩——轮回赐福自你第一次倒下时开启。）');
  }

  if (favor.unlocked && favor.progress > 0) {
    lines.push('【' + favor.note + '】');
  }
  return { pickWhiteSeal: pickWhiteSeal, grantBlueFate: grantBlueFate, favor: favor, lines: lines };
};

// 取本局可用的「基础法宝」供赐福面板选择：开局已赠英雄专属法宝，
// 此处额外给一件 chapter1 通用傍身法宝（非本英雄专属，避免重复）。
// 返回 EQUIP_POOL 中 slot==='treasure' && treasure && chapter===1 且无 owner 或 owner≠heroKey 的列表
NDX.baseTreasureOptions = function (heroKey) {
  const all = NDX.EQUIP_POOL || [];
  const pool = all.filter((e) =>
    e.slot === 'treasure' && e.treasure && e.chapter === 1 &&
    (!e.owner || e.owner !== heroKey)
  );
  if (pool.length) return pool;
  // 回退：任意 chapter1 法宝，或首 3 件法宝
  const ch1 = all.filter((e) => e.slot === 'treasure' && e.treasure && e.chapter === 1);
  return ch1.length ? ch1 : all.filter((e) => e.slot === 'treasure' && e.treasure).slice(0, 3);
};

// ============================================================================
//  V8.35 设置系统：音效/战斗速度/操作说明/关于/重置存档（localStorage 持久化）
// ============================================================================
NDX.SETTINGS_KEY = NDX.storage.KEYS.SETTINGS; // V8.41 统一引用 STORE 注册表（原字面量 'nidao_settings_v1' 已迁移）
NDX.DEFAULT_SETTINGS = {
  soundOn: true,       // 音效+BGM 总开关
  soundVol: 0.5,        // V8.5x 主音量（0.0~1.0，默认50%）
  fightSpeed: 1,       // 战斗速度倍率（1/2/3，非BOSS战生效）
  showTutorial: true,  // 新手指引开关（重玩时可关闭）
  // V8.37 无障碍设置
  fontScale: 1,        // 字号缩放（0.9/1/1.1/1.2，默认1）
  highContrast: false, // 高对比度模式（增强文字与背景对比度）
  colorBlindMode: 'none', // 色盲模式（none/protanopia/deuteranopia/tritanopia）
  // V8.38 速战模式：跳过入场动画 + 强制2x速度 + 简化飘字，适合速刷
  fastMode: false,
  // V8.40 难度选择：下一局游戏的难度（easy/normal/hard/hell）
  nextDifficulty: 'normal',
};
NDX.loadSettings = function () {
  // V8.41 统一使用NDX.SaveSystem，删除降级逻辑
  let parsed = NDX.SaveSystem.load(NDX.SETTINGS_KEY, null);
  // 兼容旧版键名 'nidao_settings_v1'：首次访问迁移到新键，避免老存档静默丢失
  if (!parsed) {
    const legacy = NDX.SaveSystem.load('nidao_settings_v1', null);
    if (legacy) { NDX.SaveSystem.save(NDX.SETTINGS_KEY, legacy); parsed = legacy; }
  }
  return Object.assign({}, NDX.DEFAULT_SETTINGS, parsed || {});
};
NDX.saveSettings = function (s) {
  // V8.41 统一使用NDX.SaveSystem，删除降级逻辑
  NDX.SaveSystem.save(NDX.SETTINGS_KEY, s || {});
};
NDX.settings = NDX.loadSettings();
// 启动时应用设置：音效开关
if (NDX.settings.soundOn === false && NDX.sound && NDX.sound.isOn && NDX.sound.isOn()) {
  try { NDX.sound.toggle(); } catch (e) {}
}
// 启动时应用设置：战斗速度
if (NDX.ui && NDX.settings.fightSpeed) NDX.ui.fightSpeed = NDX.settings.fightSpeed;

// V8.37 启动时应用无障碍设置
NDX.applyAccessibility = function () {
  try {
    var s = NDX.settings || {};
    var body = document.body;
    // 字号缩放
    if (s.fontScale) body.setAttribute('data-font-scale', String(s.fontScale));
    else body.removeAttribute('data-font-scale');
    // 高对比度
    if (s.highContrast) body.classList.add('high-contrast');
    else body.classList.remove('high-contrast');
    // 色盲模式
    if (s.colorBlindMode && s.colorBlindMode !== 'none') {
      body.setAttribute('data-colorblind', s.colorBlindMode);
    } else {
      body.removeAttribute('data-colorblind');
    }
    // V8.38 速战模式
    if (s.fastMode) body.classList.add('fast-mode');
    else body.classList.remove('fast-mode');
  } catch (e) { /* 静默失败 */ }
};
// =============================================================
// 逆道谈判 · 以经为质（《竞品借鉴》§3 · 2026-08-31 重新定位）
//   通关后解锁（niDaoUnlocked）+ 主攻道=逆 + 妖王精英/Boss + 佛经积累 → 谈判收服随从
//   佛经不消耗，仅作谈判强度；成功免战无掉落，失败妖王激怒 atk+10%
// =============================================================
