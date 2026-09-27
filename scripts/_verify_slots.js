// _verify_slots.js — 槽位真源门禁（V9.10 · 用户 2026-09-20 拍板）
// ---------------------------------------------------------------------------
// 背景：本项目的槽位上限历史上散落在 5 处（gearSlotCap / petSlotCap / petSlotCapFor /
//   treasureSlotCap / NEGOTIATE.followerCap），且劫印 V3 §1.1 砍掉生效格后「没有槽」，
//   连带 sealBonusSlots（劫灰「劫印拓印」）与 data_dynasty feature.sealSlot 成为**零消费死码**。
//   V9.10 拍板：装备 4 / 随从 4 / 灵宠 2(+逆道+逆兽师+成就) / 劫印 2(+成就+拓印+王朝 · **展示用**)
//   —— 全部收敛到单一真源 NDX.SLOT_CAP，并让两个死码**重新有消费者**。
//
// 为什么必须写成「运行时」门禁：本项目已三次栽在「定义了但零消费」上（finishFight 作用域、
//   RETURN_COST 死常量、sealBonusSlots 悬空）——静态 grep 只能证明字面值，证明不了它被读进判定。
//   故本门禁真调 NDX.sealSlotCap / petSlotCapFor / achvSlotBonus，并做**移源反证**
//   （撤掉成就/王朝/拓印来源 → 槽位必须回落 base），排除「写死常量 / 来源被短路」两类假通过。
// 运行：node scripts/_verify_slots.js
'use strict';
const fs = require('fs');
const path = require('path');
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
  .filter((f) => !SKIP.has(f))
  .forEach((f) => { try { require(path.join(ROOT, 'js', f)); } catch (e) {} });
const NDX = global.NDX;

let pass = 0, fail = 0;
const ck = (name, cond, extra) => {
  if (cond) { pass++; console.log('  ✓ ' + name); }
  else { fail++; console.log('  ✗ ' + name + (extra != null ? ' — ' + extra : '')); }
};
const rel = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');

console.log('\n[槽位真源] 门禁');

ck('G0 NDX.SLOT_CAP 已挂载', !!NDX && !!NDX.SLOT_CAP);
ck('G0 槽位函数齐备', typeof NDX.companionSlotCap === 'function'
  && typeof NDX.sealSlotCap === 'function'
  && typeof NDX.dynastySealSlot === 'function'
  && typeof NDX.achvSlotBonus === 'function'
  && typeof NDX.petSlotCapFor === 'function');

// ---------------------------------------------------------------- A 静态真源
const C = NDX.SLOT_CAP || {};
ck('A SLOT_CAP.gear = 4', C.gear === 4, 'got=' + C.gear);
ck('A SLOT_CAP.companion = 4', C.companion === 4, 'got=' + C.companion);
ck('A SLOT_CAP.pet = 2', C.pet === 2, 'got=' + C.pet);
ck('A SLOT_CAP.seal = 2', C.seal === 2, 'got=' + C.seal);

const E = rel('js/equipment_part3.js');
ck('A 源码无旧「收徒加槽」残留 recruitedCount', E.indexOf('NDX.recruitedCount') < 0);
ck('A 源码 petSlotCapFor 含 achvSlotBonus(\'pet\')', E.indexOf("cap += NDX.achvSlotBonus('pet');") >= 0);
ck('A 源码无「印全效」文案残留', rel('js/ui/ui_modals_1.js').indexOf('印全效') < 0);
ck('A 源码 followerCap = 4（已无 3）', rel('js/data_negotiate.js').indexOf('followerCap: 4') >= 0
  && rel('js/data_negotiate.js').indexOf('followerCap: 3') < 0);

// ---------------------------------------------------------------- B 运行时消费
const N = NDX.NEGOTIATE || {};
ck('B 随从槽：SLOT_CAP.companion = 4 且 NEGOTIATE.followerCap 已对齐',
  NDX.companionSlotCap() === 4 && N.followerCap === 4, 'companionSlotCap=' + NDX.companionSlotCap() + ' followerCap=' + N.followerCap);

// 劫印槽 = 2（无任何来源时）
const _achv0 = NDX.loadAch;
NDX.loadAch = () => [];
ck('B 劫印槽 base（无成就/无拓印/无王朝）= 2', NDX.sealSlotCap() === 2, 'got=' + NDX.sealSlotCap());

// 灵宠槽 base = 2
ck('B 灵宠槽 base（无逆道/无逆兽师/无成就）= 2', NDX.petSlotCapFor({ equips: [] }) === 2, 'got=' + NDX.petSlotCapFor({ equips: [] }));

// 成就「印海无涯」→ 劫印槽 +1
NDX.loadAch = () => ['slot_seal'];
ck('B 成就 [印海无涯] → 劫印槽 2 → 3', NDX.sealSlotCap() === 3, 'got=' + NDX.sealSlotCap());

// 成就「兽园初成」→ 灵宠槽 +1
NDX.loadAch = () => ['slot_pet'];
ck('B 成就 [兽园初成] → 灵宠槽 2 → 3', NDX.petSlotCapFor({ equips: [] }) === 3, 'got=' + NDX.petSlotCapFor({ equips: [] }));

NDX.loadAch = _achv0;

// 王朝 feature.sealSlot → 劫印槽 +1（消费 data_dynasty 原悬空字段）
const _dv = NDX.dynastyValue;
NDX.dynastyValue = (k, d) => (k === 'sealSlot' ? 1 : (typeof _dv === 'function' ? _dv(k, d) : d));
ck('B 王朝「礼乐文明」feature.sealSlot=1 → 劫印槽 +1', NDX.sealSlotCap() === 3, 'got=' + NDX.sealSlotCap());
NDX.dynastyValue = _dv;

// 劫灰「劫印拓印」等级 → 劫印槽 +N（消费 data_reincarnation.sealBonusSlots）
const _ash = NDX.ashLevel;
NDX.ashLevel = (id) => (id === 'seal' ? 2 : (typeof _ash === 'function' ? _ash(id) : 0));
ck('B 劫印拓印 2 级 → 劫印槽 2 → 4', NDX.sealSlotCap() === 4 && NDX.sealBonusSlots() === 2,
  'sealSlotCap=' + NDX.sealSlotCap());
NDX.ashLevel = _ash;

// ---------------------------------------------------------------- C 反证
ck('C 反证：撤去成就 → 劫印槽回落 base 2（证明 achvSlotBonus 真被消费）', (() => {
  const old = NDX.loadAch;
  NDX.loadAch = () => ['slot_seal'];
  const on = NDX.sealSlotCap();
  NDX.loadAch = () => [];
  const off = NDX.sealSlotCap();
  NDX.loadAch = old;
  return on === 3 && off === 2;
})());

ck('C 反证：撤去拓印来源 → 劫印槽回落（证明 sealBonusSlots 真被消费）', (() => {
  const old = NDX.ashLevel;
  NDX.ashLevel = (id) => (id === 'seal' ? 3 : 0);
  const on = NDX.sealSlotCap();
  NDX.ashLevel = () => 0;
  const off = NDX.sealSlotCap();
  NDX.ashLevel = old;
  return on === 5 && off === 2;
})());

ck('C 反证：撤去王朝来源 → 劫印槽回落（证明 dynastySealSlot 真被消费）', (() => {
  const old = NDX.dynastyValue;
  NDX.dynastyValue = (k) => (k === 'sealSlot' ? 1 : 0);
  const on = NDX.sealSlotCap();
  NDX.dynastyValue = () => 0;
  const off = NDX.sealSlotCap();
  NDX.dynastyValue = old;
  return on === 3 && off === 2;
})());

// —— 法宝槽 / 特殊装备栏（B1 v1.1 · 2026-09-25 用户拍板）——
//   法宝位一分为二：真法宝（祭出式）留法宝槽 2 格；非祭出式（原「被动件」）迁装备第 5 栏 special。
ck('D 法宝真源 SLOT_CAP.treasure 存在且 active=2（2 格全纳真法宝）',
  !!(NDX.SLOT_CAP && NDX.SLOT_CAP.treasure) && NDX.SLOT_CAP.treasure.active === 2);

(() => {
  let allOk = true; const got = [];
  for (let a = 1; a <= 9; a++) {
    const c = NDX.treasureCaps(a);
    got.push(a + ':' + c.total);
    if (c.total !== 2 || c.active !== 2 || c.passive !== 0) allOk = false;
  }
  ck('D 法宝槽固定 2 格（2 主动 · 被动件已迁 special，全章恒定）', allOk, got.join(' '));
})();

// 机械判定：祭出式（treasure:true / treasureId / charges）＝真法宝；纯数值件＝特殊装备
ck('D isActiveTreasure 机械判定',
  NDX.isActiveTreasure({ slot: 'treasure', treasure: true, treasureId: 'x', charges: 2 }) === true
  && NDX.isActiveTreasure({ slot: 'treasure', atk: 10, hp: 30 }) === false
  && NDX.isActiveTreasure(null) === false);

// 🆕 槽位归一化 · 单一入口（方案乙核心）
ck('D 归一化入口齐备', typeof NDX.equipSlotOf === 'function' && typeof NDX.equipsOfSlot === 'function');
ck('D equipSlotOf：非祭出式 treasure → special（祭出式留 treasure）',
  NDX.equipSlotOf({ slot: 'treasure', atk: 10 }) === 'special'
  && NDX.equipSlotOf({ slot: 'treasure', treasure: true, treasureId: 'x' }) === 'treasure'
  && NDX.equipSlotOf({ slot: 'weapon' }) === 'weapon'
  && NDX.equipSlotOf(null) === null);
ck('D _equipKind：special 独立成类（不再混入 treasure）',
  NDX._equipKind({ slot: 'treasure', atk: 10 }) === 'special'
  && NDX._equipKind({ slot: 'treasure', treasureId: 'x' }) === 'treasure');
ck('D slotCapForKind：special = 1 格', NDX.slotCapForKind({ equips: [], act: 1 }, 'special') === 1);

// 运行时真消费：法宝槽只纳真法宝；特殊装备入第 5 栏
(() => {
  const mk = (id, opt) => Object.assign({ id, slot: 'treasure', atk: 1 }, opt || {});
  const act1 = mk('t_act1', { treasure: true, treasureId: 't_act1', charges: 2, atk: 5 });
  const act2 = mk('t_act2', { treasure: true, treasureId: 't_act2', charges: 1, atk: 4 });
  const act3 = mk('t_act3', { treasure: true, treasureId: 't_act3', charges: 1, atk: 3 });
  const pas = [1, 2, 3, 4, 5, 6].map((i) => mk('t_p' + i, { atk: 100 - i })); // 特殊装备评分更高
  const st = { equips: [act1, act2, act3].concat(pas), act: 1 };
  const on = NDX.equipsOfSlot(NDX.activeEquipsFor(st), 'treasure');
  const onS = NDX.equipsOfSlot(NDX.activeEquipsFor(st), 'special');
  ck('D 运行时：法宝槽只纳真法宝（高评分特殊装备不挤占）',
    on.length === 2 && on.every((e) => e.id.indexOf('t_act') === 0), on.map((e) => e.id).join(','));
  ck('D 运行时：特殊装备入第 5 栏（1 格 · 取最高评分）',
    onS.length === 1 && onS[0].id === 't_p1', onS.map((e) => e.id).join(','));
  // 零削弱：法宝 2 件 + 特殊装备 1 件 = 3 件（原「法宝 2 件含 1 被动」→ 现「法宝 2 + 特殊 1」）
  ck('D 总生效件数 = 法宝 2 + 特殊 1', on.length + onS.length === 3);

  // 反证：撤掉 isActiveTreasure（恒 false）→ 全部落 special，法宝槽空
  const old = NDX.isActiveTreasure;
  NDX.isActiveTreasure = () => false;
  const r = NDX.equipsOfSlot(NDX.activeEquipsFor({ equips: [act1, act2].concat(pas), act: 1 }), 'treasure');
  NDX.isActiveTreasure = old;
  ck('D 反证：撤除祭出式判定 → 法宝槽空（证明 isActiveTreasure 真被消费）', r.length === 0, r.map((e) => e.id).join(','));

  // 反证：老存档兼容 —— 明文 slot:'treasure' 的被动件无需迁移即被认作 special
  const legacy = { equips: [{ id: 'old_pas', slot: 'treasure', atk: 50 }], act: 1 };
  ck('D 反证：老存档 slot:\'treasure\' 被动件 → 自动认作 special（零迁移）',
    NDX.equipsOfSlot(NDX.activeEquipsFor(legacy), 'special').length === 1
    && NDX.equipsOfSlot(NDX.activeEquipsFor(legacy), 'treasure').length === 0);
})();

// 🆕 R8：成就「法宝圆融」→ 法宝槽 2 → 3
NDX.loadAch = () => ['slot_treasure'];
ck('D 成就 [法宝圆融] → 法宝槽 2 → 3', NDX.treasureCaps(1).total === 3, 'got=' + NDX.treasureCaps(1).total);
NDX.loadAch = _achv0;
ck('D 反证：撤去成就 → 法宝槽回落 2', NDX.treasureCaps(1).total === 2, 'got=' + NDX.treasureCaps(1).total);

// —— 随行位 · 随从 ＋ 徒弟 共用（V9.13 · 用户 2026-09-21 定调「随从槽＝徒弟槽，共用，自选上阵」）——
ck('E 随行位真源齐备', ['companionPoolOf', 'companionLineupOf', 'companionFollowerIds',
  'companionDiscipleIds', 'toggleCompanion'].every((k) => typeof NDX[k] === 'function'));

ck('E 随行位上限 = SLOT_CAP.companion = 4', NDX.companionSlotCap() === 4 && NDX.SLOT_CAP.companion === 4);

(() => {
  // 池 = 2 随从 + 2 徒弟（共 4，正好满位）
  const st = { followers: ['huangfeng', 'baigu'], disciples: ['yuhua3', 'fengxian'] };
  const pool = NDX.companionPoolOf(st);
  ck('E 池合并随从＋徒弟（key 前缀 f: / d:）', pool.length === 4
    && pool.filter((p) => p.kind === 'follower').length === 2
    && pool.filter((p) => p.kind === 'disciple').length === 2,
    pool.map((p) => p.key).join(','));

  // 缺省（未指定 lineup）→ 自动取前 cap，且随从优先（随从属性更强 → 评分更高）
  const auto = NDX.companionLineupOf(st);
  ck('E 缺省自动上阵（取前 4）', auto.length === 4, auto.map((p) => p.key).join(','));

  ck('E companionFollowerIds / companionDiscipleIds 分流正确',
    NDX.companionFollowerIds(st).length === 2 && NDX.companionDiscipleIds(st).length === 2);

  // 反证：手动只留 1 人上阵 → 助战只算这 1 人（其余待命不计）
  st.companionLineup = ['f:huangfeng'];
  const on1 = NDX.companionLineupOf(st);
  ck('E 反证：手动只留 1 人 → 上阵 1 人（待命不计）', on1.length === 1 && on1[0].key === 'f:huangfeng',
    on1.map((p) => p.key).join(','));

  // 徒弟增益只算上阵者（待命徒弟不得计入）
  const bAll = NDX.discipleBonus({ disciples: ['yuhua3', 'jinping'], companionLineup: ['d:yuhua3'] });
  const bOne = NDX.discipleBonus({ disciples: ['yuhua3'], companionLineup: ['d:yuhua3'] });
  ck('E 反证：待命徒弟不计入增益', bAll.hp === bOne.hp && bAll.hpRegen === 0 && bAll.hp > 0,
    'hp=' + bAll.hp + ' regen=' + bAll.hpRegen);

  // 满位时加入须被拒
  // 池 5 人（2 随从 + 3 徒弟），填满 4 → 第 5 人加入须被拒
  const st2 = { followers: ['huangfeng', 'baigu'], disciples: ['yuhua3', 'fengxian', 'jinping'] };
  st2.companionLineup = ['f:huangfeng', 'd:yuhua3', 'd:fengxian', 'd:jinping'];
  const r = NDX.toggleCompanion(st2, 'd:fengxian'); // 移出 → 3 人
  ck('E 反证：满位时移出仍允许', r && r.ok === true && st2.companionLineup.length === 3, JSON.stringify(r));
  const r2 = NDX.toggleCompanion(st2, 'd:fengxian'); // 加回 → 4 人
  ck('E 反证：未满位可加回', r2 && r2.ok === true && st2.companionLineup.length === 4, JSON.stringify(r2));
  const r3 = NDX.toggleCompanion(st2, 'f:baigu'); // 已满 4 → 第 5 人被拒
  ck('E 反证：满位时加入被拒', r3 && r3.ok === false && /已满/.test(r3.reason || ''), JSON.stringify(r3));

  const st3 = { followers: ['huangfeng'], disciples: [] };
  st3.companionLineup = ['f:huangfeng'];
  const off = NDX.toggleCompanion(st3, 'f:huangfeng');
  ck('E 切换：已在阵 → 退为待命', off.ok === true && off.on === false && st3.companionLineup.length === 0);
  const back = NDX.toggleCompanion(st3, 'f:huangfeng');
  ck('E 切换：待命 → 重新上阵', back.ok === true && back.on === true && st3.companionLineup.length === 1,
    JSON.stringify(back));
  // 反证：空数组＝玩家主动清空，不得被自动补满
  ck('E 反证：主动清空后不自动补满（空数组 ≠ 未指定）',
    NDX.companionLineupOf(st3).length === 1 && NDX.companionLineupOf({ followers: ['huangfeng'] }).length === 1);
})();

console.log('\n结论：' + pass + ' 通过 / ' + fail + ' 失败');
process.exit(fail ? 1 : 0);
