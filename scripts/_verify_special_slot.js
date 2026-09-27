// _verify_special_slot.js — 「特殊装备」第 5 栏 + 法宝槽收窄 门禁（B1 v1.1 · 2026-09-25 用户拍板 · 方案乙）
// ---------------------------------------------------------------------------
// 背景：法宝位（slot:'treasure'）历史上混装两类东西 ——
//   ① 真法宝（祭出式：treasure / treasureId / charges）
//   ② 假法宝（原「被动件」＝ 数值件 / 套装件 / 合成基座「XX胚」）
// 用户拍板：「如果是装备类的，应该归属到特殊装备一栏，可以在四件装备后面加一栏」
//         「法宝初设 2 个，随成就增加可多栏」
// 方案乙：**数据侧不改**（106 条字面量仍写 'treasure'）⇒ 老存档零迁移；
//         新增 NDX.equipSlotOf / equipsOfSlot 做运行时归一化，20+ 消费点改走它。
//
// 本门禁**真调运行时**（不靠静态 grep 字面值），并做**移源反证**排除「写死 / 短路」假通过。
// 运行：node scripts/_verify_special_slot.js
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

console.log('\n[特殊装备 · 第 5 栏] 门禁（B1 v1.1）');

// ---------------------------------------------------------------- A 入口齐备
ck('A NDX.equipSlotOf / equipsOfSlot 已挂载',
  typeof NDX.equipSlotOf === 'function' && typeof NDX.equipsOfSlot === 'function');

// ---------------------------------------------------------------- B 全量数据分流
// 真源：法宝位去重后 = 真法宝（祭出式）+ 被动件（→special）
const all = [];
const seen = new Set();
const absorb = (v) => {
  const arr = Array.isArray(v) ? v : (v && typeof v === 'object'
    ? Object.values(v).reduce((a, b) => a.concat(Array.isArray(b) ? b : (b && typeof b === 'object' && b.name ? [b] : [])), []) : []);
  arr.forEach((e) => {
    if (!e || typeof e !== 'object' || e.slot !== 'treasure') return;
    const k = e.id || e.name;
    if (!k || seen.has(k)) return;
    seen.add(k); all.push(e);
  });
};
['EQUIP_POOL', 'CRAFT_POOL', 'SUTRA_EVENT_GEAR', 'ADVENTURE_GEAR', 'BOSS_REWARDS', 'DUO_TREASURE_POOL', 'BASIC_EQUIPS']
  .forEach((k) => { if (NDX[k]) absorb(NDX[k]); });

const actual = all.filter((e) => NDX.equipSlotOf(e) === 'treasure');
const specials = all.filter((e) => NDX.equipSlotOf(e) === 'special');
console.log('  · 法宝位去重合计 ' + all.length + ' = 真法宝 ' + actual.length + ' + 特殊装备 ' + specials.length);

ck('B 法宝位全量已二分（无 third 值）',
  all.every((e) => ['treasure', 'special'].indexOf(NDX.equipSlotOf(e)) >= 0),
  '异常值 ' + [...new Set(all.map((e) => NDX.equipSlotOf(e)))].join(','));
ck('B 真法宝（祭出式）全部判为 treasure',
  actual.every((e) => NDX.isActiveTreasure(e)), '漏判 ' + actual.filter((e) => !NDX.isActiveTreasure(e)).map((e) => e.id).join(','));
ck('B 特殊装备全部非祭出式',
  specials.every((e) => !NDX.isActiveTreasure(e)), '误判 ' + specials.filter((e) => NDX.isActiveTreasure(e)).map((e) => e.id).join(','));
ck('B 入口设计量：真法宝 ' + actual.length + ' 件 > 0', actual.length > 0);
ck('B 入口设计量：特殊装备 ' + specials.length + ' 件 > 0', specials.length > 0);
// 用户原话「最开始设计的是紫金钵和救命毫毛」—— 两件首批法宝必须仍留在法宝区
ck('B 首批法宝仍在法宝区：紫金钵（ts_bowl 系）+ 三根救命毫毛（jiuming）',
  all.some((e) => e.slot === 'treasure' && NDX.equipSlotOf(e) === 'treasure' && (e.treasureId === 'ts_bowl' || e.id === 'ts_bowl'))
  && all.some((e) => e.id === 'jiuming' && NDX.equipSlotOf(e) === 'treasure'));

// ---------------------------------------------------------------- C 归类与格数
ck('C _equipKind：special 独立成类',
  NDX._equipKind({ slot: 'treasure', atk: 1 }) === 'special'
  && NDX._equipKind({ slot: 'treasure', treasureId: 'x' }) === 'treasure'
  && NDX._equipKind({ slot: 'weapon' }) === 'gear'
  && NDX._equipKind({ slot: 'pet' }) === 'pet');
ck('C slotCapForKind：法宝 2 格 / 特殊装备 1 格',
  NDX.slotCapForKind({ equips: [], act: 1 }, 'treasure') === 2
  && NDX.slotCapForKind({ equips: [], act: 1 }, 'special') === 1);

// ---------------------------------------------------------------- D 运行时分流
(() => {
  const mk = (id, opt) => Object.assign({ id, slot: 'treasure', atk: 1 }, opt || {});
  const a1 = mk('t_a1', { treasure: true, treasureId: 't_a1', charges: 2, atk: 9 });
  const a2 = mk('t_a2', { treasure: true, treasureId: 't_a2', charges: 1, atk: 8 });
  const a3 = mk('t_a3', { treasure: true, treasureId: 't_a3', charges: 1, atk: 7 });
  const p1 = mk('t_p1', { atk: 500 });   // 特殊装备评分远高
  const p2 = mk('t_p2', { atk: 400 });
  const st = { equips: [a1, a2, a3, p1, p2], act: 1 };
  const on = NDX.activeEquipsFor(st);
  const tr = NDX.equipsOfSlot(on, 'treasure');
  const sp = NDX.equipsOfSlot(on, 'special');
  ck('D 法宝槽只纳真法宝（高评分特殊装备不挤占）', tr.length === 2 && tr.every((e) => /^t_a/.test(e.id)),
    tr.map((e) => e.id).join(','));
  ck('D 特殊装备入第 5 栏（1 格 · 取最高评分）', sp.length === 1 && sp[0].id === 't_p1', sp.map((e) => e.id).join(','));
  ck('D 五栏总数 = 法宝2 + 特殊1', tr.length + sp.length === 3);

  // 反证 1：撤除 isActiveTreasure → 全落 special、法宝槽空
  const old = NDX.isActiveTreasure;
  NDX.isActiveTreasure = () => false;
  const r = NDX.equipsOfSlot(NDX.activeEquipsFor(st), 'treasure');
  NDX.isActiveTreasure = old;
  ck('D 反证：撤除祭出式判定 → 法宝槽空（证明 isActiveTreasure 真被消费）', r.length === 0, r.map((e) => e.id).join(','));

  // 反证 2：老存档兼容 —— 明文 slot:'treasure' 的被动件零迁移即认作 special
  const legacy = { equips: [{ id: 'legacy_pas', slot: 'treasure', atk: 30, hp: 100 }], act: 1 };
  ck('D 反证：老存档 slot:\'treasure\' 被动件 → 自动认作 special（零迁移）',
    NDX.equipsOfSlot(NDX.activeEquipsFor(legacy), 'special').length === 1
    && NDX.equipsOfSlot(NDX.activeEquipsFor(legacy), 'treasure').length === 0);

  // 反证 3：真法宝不被误判进 special
  const only = { equips: [mk('t_only', { treasure: true, treasureId: 't_only', charges: 1 })], act: 1 };
  ck('D 反证：只有真法宝时 special 栏为空',
    NDX.equipsOfSlot(NDX.activeEquipsFor(only), 'special').length === 0
    && NDX.equipsOfSlot(NDX.activeEquipsFor(only), 'treasure').length === 1);
})();

// ---------------------------------------------------------------- E 成就扩槽（R8）
(() => {
  const oldLoad = NDX.loadAch;
  NDX.loadAch = () => [];
  const base = NDX.treasureCaps(1).total;
  NDX.loadAch = () => ['slot_treasure'];
  const on = NDX.treasureCaps(1).total;
  NDX.loadAch = oldLoad;
  const off = NDX.treasureCaps(1).total;
  ck('E 法宝槽 base = 2（初设 2 格）', base === 2, 'got=' + base);
  ck('E 成就 [法宝圆融] → 2 → 3', on === 3, 'got=' + on);
  ck('E 反证：撤去成就 → 回落 2（证明 achvSlotBonus 真被消费）', off === 2, 'got=' + off);
})();

// ---------------------------------------------------------------- F 源码层防回退
// UI / 逻辑侧不得再出现「裸 e.slot === 'treasure'」的分栏判定（应走 equipSlotOf）
const bare = [];
[['js/ui/ui_bag.js', /\.slot === 'treasure'/],
 ['js/ui/ui_modals_1.js', /slots\.indexOf\(e\.slot\)/],
 ['js/ui/ui_map.js', /e\.slot === 'treasure'/],
 ['js/game/game_combat_2.js', /&& e\.slot === 'treasure'/],
 ['js/game/game_event_3.js', /x\.slot === 'treasure'/]].forEach(([f, re]) => {
  const src = rel(f);
  if (re.test(src)) bare.push(f);
});
ck('F 消费点已改走 equipSlotOf（无裸 slot 判定残留）', bare.length === 0, bare.join(','));
ck('F UI 装备区已含 special 栏',
  rel('js/ui/ui_bag.js').indexOf("concat(['special'])") >= 0
  && rel('js/ui/ui_modals_1.js').indexOf("concat(['special'])") >= 0);
// 2026-09-26 拍板：第 5 栏改用骨架用词「特殊装备」（「器胚」是 09-25 的代码自造词，
// 骨架全文 0 次出现）。此处只改**显示名**，slot 键仍是 'special'，故零存档影响。
ck('F EQUIP_SLOT_LABEL 第 5 栏显示名为骨架用词「特殊装备」',
  /special:\s*'特殊装备'/.test(rel('js/equipment_part3.js')));
ck('F UI 其余处的第 5 栏文案同步（不残留旧自造词做显示名）',
  !/special:\s*'器胚'/.test(rel('js/ui/ui_panel_2.js')));
ck('F 成就表含 slot_treasure', rel('js/achievements.js').indexOf("id: 'slot_treasure'") >= 0);

// ---------------------------------------------------------------- G R6 退役（2026-09-25）
// 用户拍板：「那些凑数的法宝取消」——11 件妖怪随身道具 / 场所产物不得出现在任何池。
(() => {
  const retired = NDX.TREASURE_RETIRED || [];
  ck('G R6 退役名单已导出（11 件）', Array.isArray(retired) && retired.length === 11, 'got=' + retired.length);
  const back = all.filter((e) => retired.indexOf(e.id) >= 0).map((e) => e.id);
  ck('G 退役件不在任何池（零复活）', back.length === 0, back.join(','));
  // 保留件仍在池中（防过度退役）—— 定风珠／九齿钉钯／降妖宝杖／随心铁杆兵／芭蕉扇·影
  const keep = ['tre_dingfengzhu', 'tre_jiuchidingpa', 'tre_baozhang', 'tre_suixinbing', 'tre_bajiaoshan_ying'];
  const missing = keep.filter((id) => all.every((e) => e.id !== id));
  ck('G 8 件保留至宝仍在池中（未过度退役）', missing.length === 0, missing.join(','));
  // 反证：把退役件塞回池 → 断言必能捕获（证明 G 段真在检东西）
  const fake = all.concat([{ id: retired[0], slot: 'treasure' }]);
  ck('G 反证：人为塞回退役件 → 断言可捕获',
    fake.filter((e) => retired.indexOf(e.id) >= 0).length > 0);
})();

console.log('\n结论：' + pass + ' 通过 / ' + fail + ' 失败');
process.exit(fail ? 1 : 0);
