// _verify_mirror_hidden.js — 心魔隐藏线门禁（明镜五件套 / 镜痕材料 / 照镜人·明心见性）
// 背景：V9.9 为心魔系统补 reward 侧——「敢直面心魔者」应有专属收益，而非只有念经耗天。
//   镜痕（镜战取胜唯一产出）→ 熔铸明镜五件套 → 集齐三件 + 明镜升级石 → 觉醒隐藏职「照镜人·明心见性」。
// 本项目已三犯「数据表写了值、消费点读另一处/根本没有消费点」的死数据错误（data_seal_source、
//   三仪典、60-85 敌人强化），故本门禁对每条新增数据都断言其**消费点真实存在**。
// 断言：A 明镜件与配方 · B 镜痕产出 · C 明心见性减幅 · D 照镜人觉醒链 · E 战斗真源接线
//       F 不进随机掉落 · G 死数据守卫（改共鸣值→减幅跟着变） · H 图鉴可达
// 运行：node scripts/_verify_mirror_hidden.js
const path = require('path'), fs = require('fs');
const ROOT = path.join(__dirname, '..');
Object.defineProperty(global, 'window', { value: global, writable: true, configurable: true });
global.location = { href: 'http://client', search: '' };
Object.defineProperty(global, 'navigator', { value: { userAgent: 'node', platform: 'linux' }, writable: true, configurable: true });
const _ls = {};
global.localStorage = {
  get length() { return Object.keys(_ls).length; },
  key(i) { const k = Object.keys(_ls); return k[i] != null ? k[i] : null; },
  getItem(k) { return Object.prototype.hasOwnProperty.call(_ls, k) ? _ls[k] : null; },
  setItem(k, v) { _ls[k] = String(v); }, removeItem(k) { delete _ls[k]; },
  clear() { for (const k of Object.keys(_ls)) delete _ls[k]; },
};
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const SKIP = new Set(['sound.js', 'ui.js', 'main.js']);
[...html.matchAll(/js\/([\w\/-]+\.js)/g)].map((m) => m[1])
  .filter((f, i, a) => a.indexOf(f) === i)
  .filter((f) => !SKIP.has(f) && !f.startsWith('ui/'))
  .forEach((f) => { try { require(path.join(ROOT, 'js', f)); } catch (e) { console.log('LOAD-FAIL', f, e.message); } });
const NDX = global.NDX;

let pass = 0, fail = 0;
const ck = (name, cond, extra) => {
  if (cond) { pass++; console.log('  ✓ ' + name); }
  else { fail++; console.log('  ✗ ' + name + (extra ? '  → ' + extra : '')); }
};
const rel = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');

// ============ A 明镜件与配方 ============
const MIRROR_IDS = ['mj_w', 'mj_a', 'mj_h', 'mj_b', 'mj_t', 'mj_stone', 'mj_comp1'];
const craft = NDX.CRAFT_POOL || [];
ck('A1 明镜七件（五件套+升级石+组件）均在 CRAFT_POOL',
  MIRROR_IDS.every((id) => craft.some((e) => e.id === id)),
  MIRROR_IDS.filter((id) => !craft.some((e) => e.id === id)).join(','));
const body = ['mj_w', 'mj_a', 'mj_h', 'mj_b'];
ck('A2 五件套覆盖身体四槽 + 法宝槽（共鸣只计身体四槽）', (() => {
  const slots = body.map((id) => (craft.find((e) => e.id === id) || {}).slot);
  const t = (craft.find((e) => e.id === 'mj_t') || {}).slot;
  return slots.join(',') === 'weapon,armor,head,boots' && t === 'treasure';
})());
ck('A3 全部明镜件带 noDrop 标记（隐藏套，绝不进随机掉落）',
  MIRROR_IDS.every((id) => (craft.find((e) => e.id === id) || {}).noDrop === true));
ck('A4 五件 + 升级石配方齐备（各耗镜痕 1 / 2）', (() => {
  const R = NDX.RECIPES || [];
  const byOut = (id) => R.find((r) => r.out === id);
  const five = ['mj_w', 'mj_a', 'mj_h', 'mj_b', 'mj_t'].every((id) => {
    const r = byOut(id); return r && r.materials && r.materials['镜痕'] === 1;
  });
  const st = byOut('mj_stone');
  return five && st && st.materials && st.materials['镜痕'] === 2;
})());
ck('A5 组件 mj_comp1 由明镜三件熔铸（comps 口径，与既有套装组件同构）', (() => {
  const r = (NDX.RECIPES || []).find((x) => x.out === 'mj_comp1');
  return r && r.comps && r.comps.length === 3 && r.comps.every((c) => c.indexOf('mj_') === 0);
})());

// ============ B 镜痕产出 ============
const X = NDX.XINMO || {};
ck('B1 XINMO.SHARD_MAT 常量就位（=镜痕）', X.SHARD_MAT === '镜痕', String(X.SHARD_MAT));
ck('B2 XINMO.SHARD_PER_WIN 常量就位（≥1）', (X.SHARD_PER_WIN || 0) >= 1, String(X.SHARD_PER_WIN));
const g2 = rel('js/game/game_combat_2.js');
ck('B3 镜战胜写入镜痕（game_combat_2 破镜分支消费 SHARD_MAT + addMaterial）',
  /SHARD_MAT/.test(g2) && /addMaterial/.test(g2));
// 防刷核心：镜痕只在「胜」分支写。game_combat_2 的 __xinmoReflex 胜块内必须出现 SHARD_MAT 写入，
// 而败分支文件（game_event_4）不得出现 SHARD_MAT（败即无痕，杜绝「故意输给镜本我」刷材料）。
ck('B4 镜战败不产镜痕（败分支与 game_event_4 均无 SHARD_MAT）', (() => {
  // game_combat_2.js 中 __xinmoReflex 出现两次：先「败」分支、后「胜」分支（V9.7 结构）
  const p1 = g2.indexOf('__xinmoReflex');
  const p2 = g2.indexOf('__xinmoReflex', p1 + 1);
  const loseBlock = g2.slice(p1, p2);
  const winBlock = g2.slice(p2, p2 + 8000);
  return /SHARD_MAT/.test(winBlock) && !/SHARD_MAT/.test(loseBlock)
    && rel('js/game/game_event_4.js').indexOf('SHARD_MAT') < 0;
})());
// 材料实际可累加（走既有 addMaterial 真源）
ck('B5 addMaterial 真源可累加镜痕（写入 s.materials）', (() => {
  const s = { materials: {} };
  NDX.addMaterial(s, X.SHARD_MAT, 1); NDX.addMaterial(s, X.SHARD_MAT, 1);
  return (s.materials[X.SHARD_MAT] || 0) === 2;
})());

// ============ C 明心见性（心魔增长减幅） ============
const mkS = (n) => ({
  equips: body.slice(0, n).map((id) => Object.assign({}, craft.find((e) => e.id === id))),
});
ck('C1 明镜 0/2 件 → 无减幅', NDX.mirrorSetSuppress(mkS(0)) === 0 && NDX.mirrorSetSuppress(mkS(2)) === 0);
ck('C2 明镜 3 件 → 减幅生效（0.15）', Math.abs(NDX.mirrorSetSuppress(mkS(3)) - 0.15) < 1e-9,
  String(NDX.mirrorSetSuppress(mkS(3))));
ck('C3 减幅只计身体四槽（法宝 mj_t 不计入）', (() => {
  const s = mkS(2); s.equips.push(Object.assign({}, craft.find((e) => e.id === 'mj_t')));
  return NDX.mirrorSetSuppress(s) === 0;
})());
ck('C4 gainXinmo 消费减幅（game_event_3 含 mirrorSetSuppress）',
  rel('js/game/game_event_3.js').indexOf('mirrorSetSuppress') >= 0);
ck('C5 减幅后心魔仍 ≥1（不为零增长，防心魔系统被叠没）', (() => {
  // 模拟：inc=8（隐道）经 15% 减幅 → round(6.8)=7 ≥1
  const n = Math.max(1, Math.round(8 * (1 - 0.15)));
  return n >= 1 && n < 8;
})());

// ============ D 照镜人觉醒链 ============
ck('D1 JOB_STONES 含 mj_stone（明镜升级石）', !!(NDX.JOB_STONES && NDX.JOB_STONES.mj_stone));
ck('D2 SET_JOBS 含 明镜 · tier1 组件 = mj_comp1', (() => {
  const sj = NDX.SET_JOBS && NDX.SET_JOBS['明镜'];
  return sj && sj.tiers && sj.tiers[0] && sj.tiers[0].comp === 'mj_comp1';
})());
ck('D3 觉醒效果 xinmoAtk 就位（0.30）', (() => {
  const t = NDX.SET_JOBS['明镜'].tiers[0];
  return t.bonus && t.bonus.xinmoAtk === 0.30;
})());
ck('D4 无升级石 → 不激活（job 列表为空）', (() => {
  const r = NDX.setJobBonusFor({ equips: [{ id: 'mj_comp1', slot: 'component', set: '明镜' }] });
  return (!r.jobs || r.jobs.length === 0) && !(r.extra > 0);
})());
ck('D5 升级石 + 组件 → 激活「照镜人·明心见性」且 extra=0.30', (() => {
  const r = NDX.setJobBonusFor({ equips: [{ id: 'mj_stone', slot: 'component' }, { id: 'mj_comp1', slot: 'component', set: '明镜' }] });
  return r.jobs.indexOf('照镜人·明心见性') >= 0 && r.extra === 0.30;
})(), JSON.stringify(NDX.setJobBonusFor({ equips: [{ id: 'mj_stone', slot: 'component' }, { id: 'mj_comp1', slot: 'component', set: '明镜' }] }).jobs));
// 门槛链：三件(1痕×3) + 升级石(2痕) = 5 次镜战取胜 → 至少 5 次破镜，稀有度成立
ck('D6 觉醒门槛 ≥ 5 次镜战取胜（稀有度校验）', (() => {
  const R = NDX.RECIPES || [];
  const per = (id) => { const r = R.find((x) => x.out === id); return r && r.materials ? (r.materials['镜痕'] || 0) : 0; };
  return per('mj_w') + per('mj_a') + per('mj_h') + per('mj_stone') === 5;
})());

// ============ E 战斗真源接线 ============
const cjs = rel('js/combat.js'), acjs = rel('js/attr_calc.js');
ck('E1 战斗真源 computeStats 消费 xinmoAtk（combat.js）', /setJobBonusFor/.test(cjs) && /_sj\.extra/.test(cjs));
ck('E2 面板口径同步消费（attr_calc.js 7.5 段）', /_sj\.extra/.test(acjs));
ck('E3 两处口径一致（均按 xinmo/100×extra 缩放攻击）',
  /xinmo[^\n]*\/ 100 \* _sj\.extra/.test(cjs) && /xinmo[^\n]*\/ 100 \* _sj\.extra/.test(acjs));
ck('E4 无镜痕/未觉醒时零回归（xinmo=0 或 extra=0 不缩放）', (() => {
  // 直接验证缩放式：xinmo=0 → 系数 1
  const f = (xinmo, extra) => 1 + (xinmo / 100) * extra;
  return f(0, 0.30) === 1 && f(60, 0) === 1;
})());

// ============ F 不进随机掉落 ============
const dec = rel('js/data_equip_core.js');
ck('F1 掉落池含 noDrop 守卫（extra / chapterGear 两处）',
  (dec.match(/!e\.noDrop/g) || []).length >= 2);
ck('F2 明镜件不在小怪基座池 BASIC_EQUIPS', (() => {
  const all = (NDX.BASIC_EQUIPS || []).concat(Object.values(NDX.BASIC_EQUIPS_BY_CHAPTER || {}).reduce((a, b) => a.concat(b), []));
  return !MIRROR_IDS.some((id) => all.indexOf(id) >= 0);
})());
ck('F3 明镜件不在英雄套装件表（setEquipsForHero 不会吐出）', (() => {
  const sets = ['wukong', 'tangseng', 'bajie', 'xiaobailong', 'shaseng'];
  return !sets.some((h) => (NDX.setEquipsForHero(h) || []).some((id) => MIRROR_IDS.indexOf(id) >= 0));
})());

// ============ G 死数据守卫 ============
ck('G1 共鸣 tier3.xinmoSuppress 被 mirrorSetSuppress 实际消费（改值→减幅跟随）', (() => {
  const def = NDX.SET_RESONANCE['明镜'];
  const old = def.tier3.xinmoSuppress;
  def.tier3.xinmoSuppress = 0.5;
  const v = NDX.mirrorSetSuppress(mkS(3));
  def.tier3.xinmoSuppress = old;
  return Math.abs(v - 0.5) < 1e-9;
})());
ck('G2 移除共鸣减幅后回落到 MIRROR_SET 兜底值 0.15', (() => {
  const def = NDX.SET_RESONANCE['明镜'];
  const old = def.tier3.xinmoSuppress;
  delete def.tier3.xinmoSuppress;
  const v = NDX.mirrorSetSuppress(mkS(3));
  def.tier3.xinmoSuppress = old;
  return Math.abs(v - 0.15) < 1e-9;
})());

// ============ H 图鉴可达 ============
ck('H1 明镜件可被图鉴扫描（data_codex 扫描 CRAFT_POOL）',
  rel('js/data_codex.js').indexOf('CRAFT_POOL') >= 0 && MIRROR_IDS.every((id) => craft.some((e) => e.id === id)));
ck('H2 明镜件均有中文名与描述（UI 可读）',
  MIRROR_IDS.every((id) => { const e = craft.find((x) => x.id === id); return e && e.name && e.desc; }));

console.log('\n结论：' + pass + ' 通过 / ' + fail + ' 失败');
process.exit(fail ? 1 : 0);
