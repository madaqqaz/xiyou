/**
 * _verify_jingpo.js — 精魄系统门禁（V9.11 · 骨架 A6.6 杀/收 + A6.8 悟空斩心魔）
 *
 * A 静态真源：NDX.JINGPO 字段 / 消费档位 / 接线点 / state 初始化 / index.html 注册
 * B 运行时真调：niCatchDecision / jingpoKill / spendJingpo / jingpoMirrorTier 真跑
 * C 反证：悟空恒杀、非悟空默认收、心魔走 gainXinmo 单源、镜战阶封顶、来源撤除即回落
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

let PASS = 0, FAIL = 0;
const fails = [];
function ok(cond, name, extra) {
  if (cond) { PASS++; }
  else { FAIL++; fails.push(name + (extra ? ' :: ' + extra : '')); }
}
function eq(a, b, name) { ok(a === b, name, 'got=' + JSON.stringify(a) + ' want=' + JSON.stringify(b)); }

/* ---------------------------- 载入真源（无 DOM） ---------------------------- */
global.window = global.window || {};
global.NDX = window.NDX = window.NDX || {};

function loadJS(rel) {
  const code = fs.readFileSync(path.join(ROOT, rel), 'utf8');
  // eslint-disable-next-line no-new-func
  (new Function('window', 'NDX', 'console', code))(global.window, global.NDX, console);
}
loadJS('js/data_jingpo.js');

// Game 原型桩：game_jingpo.js 只依赖 prototype 赋值 + pushLog/toast/render/gainXinmo
global.NDX.Game = function Game() {};
global.NDX.Game.prototype.pushLog = function () {};
global.NDX.Game.prototype.toast = function () {};
global.NDX.Game.prototype.render = function () {};
global.NDX.Game.prototype.gainXinmo = function () { return 0; };
loadJS('js/game/game_jingpo.js');

const J = global.NDX.JINGPO;
const P = global.NDX.Game.prototype;

/* --------------------------------- A 静态 --------------------------------- */
ok(!!J, 'A1 NDX.JINGPO 已定义');
ok(J.NAME === '精魄', 'A2 NAME=精魄');
ok(Array.isArray(J.GAIN_BY_ACT) && J.GAIN_BY_ACT.length === 9, 'A3 GAIN_BY_ACT 9 章');
ok(J.GAIN_BY_ACT.every((v, i, a) => i === 0 || v > a[i - 1]), 'A4 精魄产出随章严格递增');
ok(J.ATK_PER_KILL > 0 && J.HP_PER_KILL > 0, 'A5 杀支属性成长 > 0');
ok(J.XINMO_ON_KILL > 0, 'A6 杀支额外心魔 > 0');
ok(Array.isArray(J.HERO_AUTO_KILL) && J.HERO_AUTO_KILL.indexOf('wukong') >= 0, 'A7 HERO_AUTO_KILL 含 wukong');
eq(J.MIRROR_TIER_MAX, 3, 'A8 MIRROR_TIER_MAX=3（斩 3 次＝逆轨三转）');
ok(Array.isArray(J.SPEND_TIERS) && J.SPEND_TIERS.length === 3, 'A9 消费三档');
ok(J.SPEND_TIERS.every((t, i, a) => i === 0 || t.cost > a[i - 1].cost), 'A10 消费档 cost 递增（防无限刷）');
ok(J.SPEND_TIERS.every((t) => t.key && t.name && t.eff && (t.eff.ti || t.eff.maxhpPct)), 'A11 每档 eff 合法');

function src(rel) { return fs.readFileSync(path.join(ROOT, rel), 'utf8'); }
const E2 = src('js/game/game_event_2.js');
ok(/niCatchDecision\(\)\s*===\s*'kill'/.test(E2) && /jingpoKill\(eq\.id/.test(E2), 'A12 game_event_2 逆选项杀/收拦截已接线');
ok(/jingpoMirrorTier\(s\.xinmoBattles\)/.test(src('js/game/game_combat_2.js')), 'A13 game_combat_2 镜战胜利调 jingpoMirrorTier');
const E1 = src('js/game/game_event_1.js');
ok(/jingpo:\s*0/.test(E1) && /jingpoUsed:\s*\[\]/.test(E1) && /niSlain:\s*\[\]/.test(E1), 'A14 state 初始化三字段');
const MU = src('js/ui/ui_misc_4.js');
ok(/data-action="rest-jingpo"/.test(MU), 'A15 土地庙入口按钮');
const P1 = src('js/ui/ui_panel_1.js');
ok(/_jingpoPanelBody\(s\)/.test(P1) && /data-action="jingpo-buy"/.test(P1), 'A16 精魄面板与购买按钮');
ok(/p\.kind === 'jingpo'/.test(src('js/ui/ui_panel_2.js')), 'A17 ui_panel_2 kind 分支');
const MN = src('js/main.js');
ok(/case 'rest-jingpo'/.test(MN) && /case 'jingpo-buy'/.test(MN) && /case 'jingpo-policy'/.test(MN), 'A18 main.js 三个 action');
const H = src('index.html');
ok(/js\/data_jingpo\.js\?v=\d+/.test(H), 'A19 index.html 注册 data_jingpo');
ok(/js\/game\/game_jingpo\.js\?v=\d+/.test(H), 'A20 index.html 注册 game_jingpo');
ok(/s\.xinmo\s*=/.test(src('js/game/game_jingpo.js')) === false, 'A21 game_jingpo 不直写 s.xinmo（心魔单源）');

/* ------------------------------- B 运行时真调 ------------------------------- */
function mkState(hero, opt) {
  const st = {
    hero: hero || 'tangseng', act: 1, over: false,
    jingpo: 0, jingpoUsed: [], niSlain: [],
    bonusTi: { atk: 0, hp: 0 }, flags: {}, fate: {}, log: [],
  };
  Object.assign(st, opt || {});
  return st;
}
function mkGame(st) {
  const g = Object.create(P);
  g.state = st;
  g.logs = []; g.toasts = []; g.xinmoCalls = [];
  g.pushLog = function (t) { g.logs.push(t); };
  g.toast = function (t) { g.toasts.push(t); };
  g.render = function () {};
  g.gainXinmo = function (n, o) { g.xinmoCalls.push({ n: n, o: o }); return n; };
  return g;
}

// B1 悟空恒杀 / 非悟空默认收 / 政策可切
{
  const gw = mkGame(mkState('wukong'));
  eq(gw.niCatchDecision(), 'kill', 'B1 悟空 niCatchDecision=kill');
  const gb = mkGame(mkState('bajie'));
  eq(gb.niCatchDecision(), 'keep', 'B2 八戒默认 keep');
  gb.state.flags.jingpoPolicy = 'kill';
  eq(gb.niCatchDecision(), 'kill', 'B3 政策切 kill 生效');
  // 反证：悟空不可改「收」
  gw.setJingpoPolicy('keep');
  eq(gw.state.flags.jingpoPolicy, undefined, 'B4 悟空不可改为 keep（反证）');
  eq(gw.niCatchDecision(), 'kill', 'B5 悟空政策改后仍 kill');
}

// B6 杀支产出：精魄 + 属性 + 心魔 + 名录
{
  const st = mkState('wukong', { act: 3 });
  const g = mkGame(st);
  const before = st.xinmo || 0;
  const r = g.jingpoKill('ni_baigu', '白骨夫人');
  eq(st.jingpo, J.GAIN_BY_ACT[2], 'B6 精魄按章入账（第3章）');
  ok(r.atk > 0 && r.hp > 0, 'B7 杀支属性成长 > 0');
  eq(st.bonusTi.atk, r.atk, 'B8 bonusTi.atk 落账');
  eq(st.niSlain.length, 1, 'B9 niSlain 记录 1 只');
  eq(g.xinmoCalls.length, 1, 'B10 心魔经 gainXinmo 一次');
  eq(g.xinmoCalls[0].n, J.XINMO_ON_KILL, 'B11 心魔量 = XINMO_ON_KILL');
  ok(!('xinmo' in st) || st.xinmo === before, 'B12 未直写 s.xinmo（心魔单源反证）');
  // 重复杀同名不重复计数
  g.jingpoKill('ni_baigu', '白骨夫人');
  eq(st.niSlain.length, 1, 'B13 同兽不重复入 niSlain');
  eq(st.jingpo, J.GAIN_BY_ACT[2] * 2, 'B14 精魄可累积');
}

// B15 消费：不足 / 成功 / 重复 / 属性生效
{
  const st = mkState('bajie', { jingpo: 20 });
  const g = mkGame(st);
  eq(g.spendJingpo('hun').ok, false, 'B15 精魄不足则失败');
  const r1 = g.spendJingpo('jing');
  eq(r1.ok, true, 'B16 足额购买成功');
  eq(st.jingpo, 0, 'B17 扣除 cost');
  eq(st.jingpoUsed.length, 1, 'B18 记账');
  eq(st.bonusTi.atk, J.SPEND_TIERS[0].eff.ti.atk, 'B19 属性落账');
  eq(g.spendJingpo('jing').ok, false, 'B20 同档不可重复购买');
  // maxhpPct 档
  const st2 = mkState('bajie', { jingpo: 200 });
  const g2 = mkGame(st2);
  g2.spendJingpo('po');
  ok(st2.maxhpPctBonus > 0, 'B21 maxhpPct 生效');
  g2.spendJingpo('hun');
  eq(st2.jingpoUsed.length, 2, 'B22 两档各一次');
}

// B23 悟空斩心魔转阶（真调 ZHUANJIE）
{
  const tiers = {};
  const forbidden = [];
  global.NDX.ZHUANJIE = {
    currentTier: function (s, dao) { return (dao === '逆' ? (tiers.ni || 0) : 0); },
    setTier: function (s, dao, t) { if (dao === '逆') tiers.ni = t; },
    gateKey: function (dao, t) { return dao + '@' + t; },
    forbid: function (s, k) { forbidden.push(k); },
  };
  const st = mkState('wukong', { fate: { 逆: 3 } });
  const g = mkGame(st);
  eq(g.jingpoMirrorTier(1), 1, 'B23 斩 1 次 → 逆轨一转');
  eq(g.jingpoMirrorTier(2), 2, 'B24 斩 2 次 → 二转');
  eq(g.jingpoMirrorTier(3), 3, 'B25 斩 3 次 → 三转（混世妖猴）');
  eq(g.jingpoMirrorTier(9), 3, 'B26 封顶 3（反证：超额不越界）');
  ok(forbidden.length >= 3, 'B27 常规闸门逐阶封闭（防重复弹阶）');

  // 反证 1：非悟空不转
  tiers.ni = 0;
  const gb = mkGame(mkState('bajie', { fate: { 逆: 3 } }));
  eq(gb.jingpoMirrorTier(3), 0, 'B28 非悟空不转（反证）');
  // 反证 2：悟空未入逆道不转
  const gn = mkGame(mkState('wukong', { fate: {}, mainDao: '渡' }));
  eq(gn.jingpoMirrorTier(3), 0, 'B29 悟空未走逆道不转（反证）');
  // 反证 3：撤除 HERO_AUTO_KILL 后不转
  const bak = J.HERO_AUTO_KILL;
  J.HERO_AUTO_KILL = [];
  tiers.ni = 0;
  const gx = mkGame(mkState('wukong', { fate: { 逆: 3 } }));
  eq(gx.jingpoMirrorTier(3), 0, 'B30 撤除 AUTO_KILL 即不转（移源反证）');
  J.HERO_AUTO_KILL = bak;
  // mainDao='逆' 亦可触发
  tiers.ni = 0;
  const gm = mkGame(mkState('wukong', { fate: {}, mainDao: '逆' }));
  eq(gm.jingpoMirrorTier(2), 2, 'B31 mainDao=逆 亦触发');
}

// B32 jingpoInfo 面板数据
{
  const st = mkState('wukong', { jingpo: 55 });
  st.niSlain = ['ni_baigu', 'ni_huangshi'];
  const g = mkGame(st);
  const info = g.jingpoInfo();
  eq(info.jingpo, 55, 'B32 info.jingpo');
  eq(info.kills, 2, 'B33 info.kills');
  eq(info.tiers.length, 3, 'B34 info 三档');
  eq(info.tiers[1].payable, true, 'B35 55 精魄可付 50 档');
  eq(info.tiers[2].payable, false, 'B36 55 精魄不足 90 档');
  eq(info.unlocked, true, 'B37 unlocked');
}

/* --------------------------------- 结果 --------------------------------- */
console.log('[jingpo] PASS=' + PASS + '  FAIL=' + FAIL);
if (fails.length) { fails.forEach((f) => console.log('   ✗ ' + f)); }
process.exit(FAIL ? 1 : 0);
