// =============================================================
// data_config.js — 《逆道西行》配置常量 · 五行/难度/终极特质
// 从 data.js 拆分（2026-08-31）：独立维护配置常量，便于数值平衡
// 全局命名空间 NDX（同时挂到 window，兼容其他文件以 window.NDX 引用）
// =============================================================
window.NDX = window.NDX || {};
var NDX = window.NDX;

// =============================================================
// V8.41 时序常量表（逻辑依赖延时集中管理）
// 这些延时与「演出动画时长」耦合：一旦 CSS / 演出时长调整，必须同步此处，
// 否则业务逻辑（选项结算 / 状态重置 / 觉醒闪光）会与演出错位。
// 标注「逻辑依赖」以防误改；未来应改为「演出完成回调业务」彻底解耦。
// =============================================================
NDX.TIMING = {
  MIRROR_SETTLE: 900,      // 逻辑依赖：镜抉择灰影浮现后结算选项（main.js:659）
  SEAL_AWAKEN_FLASH: 1500, // 逻辑依赖：劫印觉醒闪光时长（main.js:616）
  RESET_PANEL_CLOSE: 800,  // 逻辑依赖：重置存档后关闭设置面板（main.js:1056）
  BOOT_VERIFY: 300,        // 启动：买断校验延迟（main.js:120）
  BOOT_STARTGAME: 500,     // 启动：模拟放行延迟（main.js:151）
  FIGHT_PACE_ROUTINE: 0.65, // 动态节拍：平凡回合（无操作点/破韧点）演出拍 ×0.65 快进，决策/识破/破韧/终局拍保持全速（main.js _scheduleFightTick）
  FIGHT_TICK: 1300,        // 战斗每回合基础动画间隔 ms（main.js:1591 fightTick()）
  CHARGE_DUR: 500,         // 出手方冲撞时长 ms@1x（main.js:1546 / ui_misc_3.js:209 同读此单一真源，倍速同比压缩）
  STRIKE_GAP_MS: 1000,     // 后手方冲撞起点 ms@1x（main.js:1489/1547/1711/1723 同读此单一真源）
  SEG_GAP_MS: 150,         // V9.39 多段伤害（连击/暴击）与从怪逐怪行动的特效错峰步进 ms@1x（main.js SEG_GAP_MS 同读此单一真源）
  CUT_DEFAULT_PERCENT: 0.08, // 斩击默认伤害比例：无 data.cutPercent 时兜底（ui.js:3883）
};

// =============================================================
// V8.43 五行系统已删除（用户拍板：与六道/装备体系重复度高，取消该隐性系统）
// 原 WUXING / HERO_WUXING / REGION_WUXING / 五行饰品 / 战斗克制结算 / trinket 槽 全部移除
// =============================================================

// V8.40 流派终极特质（六道通关后获得的专属终极机制）
// 参照万世剑冢"本命神剑终极形态"：每个流派通关后解锁一个改变战斗节奏的终极特质
NDX.ULTIMATE_TRAITS = {
  '战': {
    id: 'ult_war',
    name: '破军·战魂',
    desc: '血量>50%时，攻击+30%（越战越勇）',
    icon: '⚔',
    color: '#d94a4a',
  },
  '渡': {
    id: 'ult_ferry',
    name: '慈航·普渡',
    desc: '每回合开始时，回复5%最大血量（渡人渡己）',
    icon: '☸',
    color: '#d4af37',
  },
  '隐': {
    id: 'ult_hidden',
    name: '匿踪·无影',
    desc: '每回合有20%概率闪避敌人攻击（隐于无形）',
    icon: '🌫',
    color: '#6b6b8a',
  },
  '夺': {
    id: 'ult_greed',
    name: '贪狼·吞噬',
    desc: '击杀敌人后，回复10%最大血量（夺天地造化）',
    icon: '🐺',
    color: '#8b4a8b',
  },
  '缘': {
    id: 'ult_fate',
    name: '善果·福报',
    desc: '受到伤害时，30%概率将伤害转化为治疗（善有善报）',
    icon: '🍀',
    color: '#4a90d9',
  },
  '逆': {
    id: 'ult_rebel',
    name: '背水·逆天',
    desc: '血量<30%时，攻击+100%（背水一战，逆天改命）',
    icon: '🔥',
    color: '#ff6030',
  },
};

// =============================================================
// V8.43 英雄五行本命已删除（五行系统整体移除）
// =============================================================
// 🔴 V9.51 英雄本命道 **彻底取消**（用户拍板 2026-09-25）：
//   六道 = **玩家的选择**，是游戏的核心定义；玩家不同的选择产生不同结果，结果被定义为一种道。
//   英雄与道之间**不存在任何绑定**——发印池、劫印/转职收益、道途攻式一律按「玩家实际选择」判定
//   （`NDX.DaoSystem.getMainDao(s)`：难1 抉择锚点 s.mainDao ＋ 劫印分布动态覆盖）。
//   官方路线的"保底通关"由【专属隐藏转职 / 专属绝招 NDX.ULTIMATES】承担，与六道归属无关。
//   ⚠ 已删除：HERO_HOME_DAO / HOME_DAO_MULT / isHomeDao / homeDaoMult / HERO_MAIN_DAOTU。
// 下方 HERO_RECOMMEND_DAO **仅用于死亡复盘的推荐路线提示**（纯叙事引导，零数值、零发印影响）。
NDX.HERO_RECOMMEND_DAO = {
  'wukong': '夺',        // 悟空推荐路线：夺（六根未净·贪着）
  'tangseng': '渡',      // 取经人推荐路线：渡（诵经法伤杀敌 / 大招回血解异常）
  'bajie': '缘',         // 八戒推荐路线：缘（防御金身）
  'shaseng': '战',       // 沙僧推荐路线：战（卷帘大将）
  'xiaobailong': '隐',   // 小白龙推荐路线：隐（闪避身法）
};
// V9.43 逆道·终伤乘区封顶：Σ(劫印 stat:'finalDamage') 的上限。
//   单枚金劫 = tiers.gold × SEAL_GOLD_SCALE(4.65)，如金·戾骨 0.20×4.65 = 0.93（+93%）。
//   本上限只拦「金劫成堆」的退化情形：绿/蓝/红成堆（Σ≈0.4~0.9）不受影响。
NDX.FINAL_DMG_CAP = 2;
// 吸血封顶（V9.45）：夺道八印复活后堆叠可达 0.9+，消费端须收敛；取库内既有口径 0.5（自适应难度预算同值）。
NDX.LIFESTEAL_CAP = 0.5;
// V9.51：HOME_DAO_MULT（本命道收益 ×1.25）/ isHomeDao / homeDaoMult 已随「英雄本命道」一并删除。
//   六道无英雄归属，故不存在"某英雄走某道更划算"的收益差——收益只取决于玩家的实际选择与构筑深度。
// V8.6x 逆道开启门（C2）：未「完美通关（正果·春朝僧档）」前，六道中的「逆」道暂不可选。
// 完美通关 = 按善线达成回长安受封（s.over.ending.perfect === true），跨周目持久化。
NDX._perfectKey = 'xynj_perfect_clear_v1';
NDX.hasPerfectClear = function () {
  try { return !!NDX.SaveSystem.loadBoolean(NDX._perfectKey, false); } catch (e) { return false; }
};
NDX.savePerfectClear = function () {
  try { NDX.SaveSystem.saveBoolean(NDX._perfectKey, true); } catch (e) {}
};
NDX.canPickDao = function (dao) {
  // 逆道为完整版终极恶道：须先炼成一世正果（完美通关）方可开启；其余五道一律开放。
  if (dao === '逆') return NDX.hasPerfectClear();
  return true;
};
// 逆道路线判定（万世剑冢·逆道融合）：逆道劫印生效数≥2，或已合成任意逆经全本（破戒录/逆天录）。
// 用于：逆道额外宠物出战槽、御兽套逆道共鸣——让逆道贯通宠物/套装/经文，不再做孤儿系统。
NDX.isNiRoute = function (s) {
  if (!s) return false;
  if (NDX.niSutraDone && (NDX.niSutraDone(s, 'ni_full_pojie') || NDX.niSutraDone(s, 'ni_full_nitian'))) return true;
  if (NDX.DaoSystem && NDX.DaoSystem.calcDaoStats) {
    const dc = NDX.DaoSystem.calcDaoStats(s);
    if ((dc['逆'] || 0) >= 2) return true;
  }
  return false;
};

// V8.40 难度选择系统：简单/普通/困难/地狱，不同难度有不同的怪物威胁与奖励倍率。
// P0-D（V3 §4.3/4.4）：monsterHpMult/monsterAtkMult 已由「Build 匹配采样（buildMatchFight）」取代——
// 固定倍率不再直接乘于怪血/怪攻（该语义被「玩家 _dpr 反推血量的节奏校准」+「压力威胁钳制」替代），
// 两字段保留仅作展示/兼容。难度高低的真正差异收敛为 pressureFactor（威胁压力系数，越大越近扛不住线），
// 叠加 diffLv 线路滑动 + 方差抖动，但恒钳于 <0.90，保证「势均而有解」（必死局占比≈0）。
NDX.DIFFICULTY = {
  easy: {
    id: 'easy',
    name: '简单',
    desc: '西行路坦，妖魔孱弱。适合初次体验。',
    icon: '🌱',
    color: '#4a90d9',
    monsterHpMult: 0.70,      // 兼容保留（已由节奏校准+势均采样取代，不再乘算）
    monsterAtkMult: 0.70,     // 兼容保留
    pressureFactor: 0.40,     // P0-D 威胁压力系数：民工下限，难度档的真正差异
    rewardMult: 0.80,         // 奖励×0.8
    sealMult: 0.80,           // 劫印属性×0.8
    startGold: 200,           // 初始金币
    scoreMult: 0.50,          // 分数倍率（排行榜）
  },
  normal: {
    id: 'normal',
    name: '普通',
    desc: '标准西行路。妖魔强度适中，奖励平衡。',
    icon: '⚔',
    color: '#d4af37',
    monsterHpMult: 1.00,
    monsterAtkMult: 1.00,
    pressureFactor: 0.56,
    rewardMult: 1.00,
    sealMult: 1.00,
    startGold: 100,
    scoreMult: 1.00,
  },
  hard: {
    id: 'hard',
    name: '困难',
    desc: '西行多艰，妖魔强横。奖励丰厚，挑战十足。',
    icon: '🔥',
    color: '#d94a4a',
    monsterHpMult: 1.30,
    monsterAtkMult: 1.25,
    pressureFactor: 0.68,
    rewardMult: 1.30,
    sealMult: 1.20,
    startGold: 50,
    scoreMult: 2.00,
  },
  hell: {
    id: 'hell',
    name: '地狱',
    desc: '无间地狱，妖魔如蝗。唯最强者可通行。',
    icon: '💀',
    color: '#8b0000',
    monsterHpMult: 1.60,
    monsterAtkMult: 1.50,
    pressureFactor: 0.80,
    rewardMult: 1.60,
    sealMult: 1.40,
    startGold: 0,
    scoreMult: 4.00,
  },
};

// V9.68 · R5「难度↔回报闭环」：把上面三个长期零消费的字段（rewardMult / sealMult / startGold）
// 接入真实消费点。**本组函数是唯一读取入口**，任何消费点都不得再裸写 NDX.DIFFICULTY[x].xxx。
// 接线清单（与 S18 整改意见 R5 对齐）：
//   ① rewardMult → 战后碎金（game_combat_2.js 胜利结算，与 curseRewardMul 连乘成单一乘子链）
//   ② sealMult   → 劫印属性值（combat_part1.js computeStats 的 bonus.seals 聚合，乘区只此一处，全链路生效）
//   ③ startGold  → 开局金币（game_event_1.js newRun 的 state.gold，轮回赐福 startGold 在其后叠加）
// 难度来源优先级：state.difficulty（本局选择）→ settings.nextDifficulty（未开局）→ normal 兜底。
// ⚠ 难度字段历史上还有 `s.diff`（V8.40 前的数字难度 1~4），与本表 id 语义不同，不可互换，故不参与解析。
NDX.diffCfgOf = function diffCfgOf(state) {
  const st = state || (typeof NDX !== 'undefined' && NDX.game && NDX.game.state) || null;
  const d = (st && (st.difficulty || (st.settings && st.settings.difficulty)))
    || (NDX.settings && NDX.settings.nextDifficulty) || 'normal';
  return (NDX.DIFFICULTY && NDX.DIFFICULTY[d]) || (NDX.DIFFICULTY && NDX.DIFFICULTY.normal) || {};
};
NDX.rewardMulOf = function rewardMulOf(state) { const m = NDX.diffCfgOf(state).rewardMult; return Number.isFinite(+m) ? +m : 1; };
NDX.sealMultOf = function sealMultOf(state) { const m = NDX.diffCfgOf(state).sealMult; return Number.isFinite(+m) ? +m : 1; };
NDX.startGoldOf = function startGoldOf(state) { const g = NDX.diffCfgOf(state).startGold; return Number.isFinite(+g) ? +g : 0; };

// =============================================================
// P0-3 西行劫难词条（Hades Heat 式自选进阶）
// =============================================================
// 通关/高难解锁后，玩家可在开局自选 1–3 条负面条件（诅咒词条），每条叠加「碎金酬」倍率，
// 高难换取更高回报——肝度与重玩性双升。钩子分散在战斗/结算/掉落，本表为单一真源。
// mul：碎金奖励倍率增量（多条相加，如两条 0.15+0.20 → 战后碎金 ×1.35）
NDX.CURSE_TABLE = {
  qiyao: {
    id: 'qiyao', name: '妖气弥漫', icon: '🌀',
    desc: '怪物开场即叠 1 层妖气暴涨，攻击永久 +20%',
    mul: 0.15,
  },
  liugen: {
    id: 'liugen', name: '六根不净', icon: '🧘',
    desc: '每场战斗仅 2 次识破机会，第 3 次起识破失效',
    mul: 0.20,
  },
  ganliang: {
    id: 'ganliang', name: '干粮短缺', icon: '🍚',
    desc: '战后调息回血减半（装备回血与战后喘息均 -50%）',
    mul: 0.15,
  },
  xinmo: {
    id: 'xinmo', name: '心魔缠身', icon: '🜏',
    desc: '每 5 回合玩家流失 3% 当前气血',
    mul: 0.20,
  },
  eyuan: {
    id: 'eyuan', name: '恶缘当道', icon: '☄',
    desc: '装备三选一同道权重失效，构筑更杂乱',
    mul: 0.10,
  },
};
NDX.CURSE_ORDER = ['qiyao', 'liugen', 'ganliang', 'xinmo', 'eyuan'];
NDX.curseRewardMul = function curseRewardMul(curses) {
  if (!curses || !curses.length) return 1;
  let sum = 0;
  for (const c of curses) { const d = NDX.CURSE_TABLE && NDX.CURSE_TABLE[c]; if (d) sum += d.mul || 0; }
  return 1 + sum;
};
NDX.hasCurse = function hasCurse(state, id) {
  return !!(state && state.curses && state.curses.indexOf(id) >= 0);
};

// =============================================================
// P0-D 运气核心 · Build 匹配采样 + 方差钳制（V3 §4.3/4.4）
// =============================================================
// 「势均而有解」匹配函数：
//   依玩家 Build 的承伤预算（气血 + 每回合回复）× 难度威胁压力系数，反推怪物体/愿攻击，
//   使任何 Build 在所选难度档下都「扛得住而不必死、但威胁足够」。纯函数，可独立单测。
//   - 承伤预算 tank = maxHp + hpRegen*(目标回合-1)：忽略护盾/吸血，保守取更弱，钳制更牢
//   - 现怪每回合净威胁 = 体伤*(1-pDr)*(1-闪避) + 愿伤*(1-pMdef)
//   - scale = 目标每回合威胁 / 现每回合威胁，同比例缩放 atk/matk（保留原体愿比例与词缀语义）
//   - 方差钳制：pressure 恒钳于 [0.25, 0.90]，0.90 << 1 → 玩家的「扛不住纯必死」局占比趋 0
//                   同时叠加 ±5% 抖动，让「势均」有波动（有的局贴险、有的局宽松），保峰谷正反馈
//   入参 st: computeStats 返回体 {ti:{atk,matk,maxHp,hp,dr,eva,hpRegen}, yuan:{matk,mdef}}
//   入参 m : 已缩放/校准的怪物 {atk, matk, type}，就地改写 atk/matk 并返回匹配信息供日志/门禁
NDX.buildMatchFight = function buildMatchFight(st, m, opts) {
  opts = opts || {};
  const p = (st && st.ti) || {};
  const yuan = (st && st.yuan) || {};
  const cfg = (NDX.DIFFICULTY && NDX.DIFFICULTY[opts.difficulty || 'normal']) || NDX.DIFFICULTY.normal;
  const diffLv = Number(opts.diffLv) > 0 ? Number(opts.diffLv) : 1;
  const p0 = (cfg && cfg.pressureFactor != null) ? Number(cfg.pressureFactor) : 0.56;
  // 高层更险（线性滑升，最多约 +0.08），但全钳于 [0.25, 0.90]：0.90<<1 保证「非必死（有解）」
  const slide = Math.max(0, diffLv - 1) * 0.004;
  const baseP = Math.min(0.88, Math.max(0.30, p0 + slide));
  // 方差钳制：±5% 抖动让「势均」有波动，但永压回 ≤0.90 → 必死局占比≈0
  const wobble = (typeof opts.rng === 'function' ? opts.rng() : Math.random()) - 0.5;
  const pressure = Math.min(0.90, Math.max(0.25, baseP + wobble * 0.10));
  // 目标回合窗口（与血量节奏校准同口径）：mob 3-6 / elite 6-10 / boss 8-20
  let rounds;
  if (m && m.type === 'mob') rounds = Math.min(6, Math.max(3, Math.round(3 + (diffLv - 1) * 0.15)));
  else if (m && m.type === 'elite') rounds = Math.min(10, Math.max(6, Math.round(6 + (diffLv - 1) * 0.25)));
  else rounds = Math.min(20, Math.max(8, 8 + Math.round((diffLv - 1) * 0.3)));
  const inHp = (p.maxHp || p.hp || 600);
  const hpRegen = (Number(p.hpRegen) || 0);
  const tank = Math.max(1, inHp + hpRegen * (rounds - 1));
  const threatPerRoundTarget = (tank * pressure) / rounds;
  // 现怪每回合净威胁：体伤被减伤与闪避削弱，愿伤被法防削弱
  const physCur = (m && m.atk ? m.atk : 0) * (1 - Math.min(0.9, p.dr || 0)) * (1 - Math.min(0.9, p.eva || 0));
  const magicCur = (m && m.matk ? m.matk : 0) * (1 - Math.min(0.9, yuan.mdef || 0));
  const threatCur = physCur + magicCur;
  let scale = threatCur <= 0.0001 ? 1 : threatPerRoundTarget / threatCur;
  // V8.58 方案B：威胁侧scale上限降到1.5、下限提到0.5，让dr/eva投资保留部分收益。
  // 原范围[0.25, 8.0]会导致dr/eva被完全约掉（玩家防御力成长完全失效）。
  // 新范围[0.5, 1.5]意味着：玩家dr/eva翻倍时，怪物攻击最多只增加50%，
  // 玩家保留约50%的防御力成长净收益。
  scale = Math.min(1.5, Math.max(0.5, scale));
  const atk = Math.max(1, Math.round((m && m.atk ? m.atk : 1) * scale));
  const matk = Math.max(1, Math.round((m && m.matk ? m.matk : 1) * scale));
  if (m) { m.atk = atk; m.matk = matk; }
  return {
    pressure: +pressure.toFixed(3),
    scale: +scale.toFixed(3),
    rounds,
    tank: Math.round(tank),
    targetThreat: Math.round(threatPerRoundTarget * rounds),
    threatCur: Math.round(threatCur),
    atk,
    matk,
  };
};

// =============================================================
// V8.43 地区五行映射已删除（五行系统整体移除）
// =============================================================
