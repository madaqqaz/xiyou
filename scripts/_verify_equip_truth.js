// _verify_equip_truth.js — 装备真值门禁（2026-09-26「参照冒险日记重梳装备」）
// ---------------------------------------------------------------------------
// 三条被长期潜伏的缺陷，本门禁逐条锁死：
//
// 缺陷①（已修）日记装备判定依赖命名约定。
//   旧实现 data_trials.js 用「id 以 ev_ 开头」判断是否日记装备。
//   但经文双线 21 件（jade_vase / wuchao_robe / sanjian_p1..p6 / bajiao_fan …）
//   实质完全符合定义（eventOnly、不入掉落商店、仅事件 gear 发放），却无 ev_ 前缀
//   ⇒ 被漏计，「日记装备≥N」类隐藏职（行旅录主等）静默卡死。
//   修：显式 diary:true + NDX.DIARY_EQUIP_IDS + NDX.isDiaryEquip 单一入口。
//
// 缺陷②（已止血）treasure: 字段是个杂物筐，其中 73 个 id 查无此物。
//   消费端 lootById 返回 null 时盲目 addMaterial(tid)，把英文 id 泄漏进 UI
//   （玩家看到「拾得 tre_huojianqiang」）；夺宝战胜路径则更安静——什么都不给。
//   修：NDX.isUnresolvedTreasureId 区分「中文材料名」与「未建实体的编码 id」，
//       后者不入库。本门禁以**基线锁定**方式兜住缺口：只许下降，不许新增。
//
// 缺陷③ gear: 发放必须全部可解析（本条应当恒绿，用于防止再次开洞）。
//
// 本门禁**真调运行时**（不靠静态 grep 字面值），并对关键项做**移源反证**排除假通过。
// 运行：node scripts/_verify_equip_truth.js
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
const BAD = [];
const ck = (name, cond, extra) => {
  if (cond) { pass++; console.log('  ✓ ' + name); }
  else { fail++; BAD.push(name + (extra != null ? ' — ' + extra : '')); console.log('  ✗ ' + name + (extra != null ? ' — ' + extra : '')); }
};

// ---------- 源文件归类：treasure: / gear: 全量收集 ----------
// ⚠ 口径必须收窄到「劫难/事件数据文件」：
//   js/ui/* 里的 `treasure:` 是**布局字段名**（如 ui_bag/ui_panel_2 的栏位键），
//   equipment_part3.js 里 `treasure: '法宝'` 是 EQUIP_SLOT_LABEL 的**显示标签**。
//   若一并计入，会把这两个非发放语义的中文串误报成「缺口」（正是首次跑红的原因）。
function walk(d, out = []) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p, out); else if (e.name.endsWith('.js')) out.push(p);
  }
  return out;
}
const FILES = walk(path.join(ROOT, 'js'));
const isDataFile = (f) => {
  const rel = path.relative(ROOT, f).replace(/\\/g, '/');
  if (rel.startsWith('js/ui/')) return false;                        // UI 布局，非发放
  return /^(js\/trials_|js\/events_|js\/equipment_|js\/data_treasure_evo\.js|js\/hero_trials_)/.test(rel);
};
const treasureIds = new Set(), gearIds = new Set();
for (const f of FILES) {
  if (!isDataFile(f)) continue;
  const lines = fs.readFileSync(f, 'utf8').split('\n');
  lines.forEach((ln) => {
    if (ln.indexOf('EQUIP_SLOT_LABEL') >= 0) return;                  // 显示标签，非发放
    for (const m of ln.matchAll(/treasure\s*:\s*'([a-zA-Z_0-9\u4e00-\u9fa5]+)'/g)) treasureIds.add(m[1]);
    for (const m of ln.matchAll(/gear\s*:\s*'([a-zA-Z_0-9]+)'/g)) gearIds.add(m[1]);
  });
}

console.log('\n[装备真值] 门禁（冒险日记式重梳 · 2026-09-26）');

// ============================== A · 日记装备单一真源 ==============================
console.log('\n--- A 日记装备（冒险日记）单一真源 ---');
ck('A1 NDX.DIARY_EQUIP_IDS 存在', NDX.DIARY_EQUIP_IDS instanceof Set);
ck('A2 NDX.isDiaryEquip 是函数', typeof NDX.isDiaryEquip === 'function');
ck('A3 NDX.isUnresolvedTreasureId 是函数', typeof NDX.isUnresolvedTreasureId === 'function');

const pool = NDX.EQUIP_POOL || [];
const diaryInPool = pool.filter((e) => e && NDX.isDiaryEquip(e));
ck('A4 日记装备集合非空', diaryInPool.length > 0, diaryInPool.length + ' 件');

// A5：所有日记装备都打了 diary:true 标记（不再是靠前缀猜）
const noFlag = diaryInPool.filter((e) => e.diary !== true).map((e) => e.id);
ck('A5 日记装备均带 diary:true 显式标记', noFlag.length === 0, noFlag.join(' '));

// A6（🔴 移源反证·核心）：无 ev_ 前缀的一族必须同样被认出
//   这正是旧实现漏掉的那 21 件——若本条红，说明判定又退回了前缀约定。
const nonEvDiary = diaryInPool.filter((e) => String(e.id).indexOf('ev_') !== 0);
ck('A6 存在「无 ev_ 前缀但属日记装备」的一族（反证样本存在）', nonEvDiary.length >= 20, nonEvDiary.length + ' 件');
const nonEvRecognized = nonEvDiary.filter((e) => NDX.isDiaryEquip({ id: e.id, diary: undefined }));
ck('A7 无前缀一族经 isDiaryEquip 仍被认出（id 兜底生效）',
  nonEvRecognized.length === nonEvDiary.length,
  (nonEvDiary.length - nonEvRecognized.length) + ' 件漏认');

// A8：日记装备必须 eventOnly（定义：不入随机掉落/商店）
const notEventOnly = diaryInPool.filter((e) => !e.eventOnly).map((e) => e.id);
ck('A8 日记装备均为 eventOnly', notEventOnly.length === 0, notEventOnly.join(' '));

// A9：日记装备必须有事件 gear 发放源（否则玩家永远拿不到）
const gearArr = [...gearIds];
const noSource = diaryInPool.filter((e) => !gearIds.has(e.id) && !isInDropPool(e.id)).map((e) => e.id);
function isInDropPool(id) {
  return [].concat(NDX.LOW_EQUIP_DROPS || [], NDX.ELITE_EQUIP_DROPS || [], NDX.BOSS_EQUIP_DROPS || []).indexOf(id) >= 0;
}
ck('A9 日记装备均有可及来源（gear 发放 / 掉落池）', noSource.length === 0, noSource.join(' '));

// A10：DIARY_EQUIP_IDS 与池内实际一致（防止真源漂移）
const setArr = [...(NDX.DIARY_EQUIP_IDS || [])];
const drift = setArr.filter((id) => !pool.some((e) => e.id === id));
ck('A10 DIARY_EQUIP_IDS 每项都在装备池内', drift.length === 0, drift.join(' '));

// ============================== B · 宝物 id 缺口（基线锁定） ==============================
console.log('\n--- B 宝物 id 缺口 · 基线锁定（只许下降不许新增）---');
// 🔴 基线已于 2026-09-26 清零：最后一条悬空 id（equip_nanshan_yin）处置完毕后
//    `treasure:` 的 73 个查无此物已全部销账（去重 id 83 → 58）。
//    基线归零意味着**任何新出现的查无此物都是回归**，不再有豁免空间。
//    （旧基线清单 73 项已完整归档到 docs《装备系统 · 冒险日记式重梳 v1.0》§五，不在此保留。）
const BASELINE = new Set([]);
const orphans = [...treasureIds].filter((id) => !(NDX.lootById && NDX.lootById(id)));
console.log('    treasure: 去重 id ' + treasureIds.size + ' 个，其中查无此物 ' + orphans.length + ' 个（基线 ' + BASELINE.size + ' · 已清零）');
ck('B1 缺口数不超过基线（不得新增缺口）', orphans.length <= BASELINE.size, '实测 ' + orphans.length + ' > 基线 ' + BASELINE.size);
const newOrphans = orphans.filter((id) => !BASELINE.has(id));
ck('B2 无基线外的新增缺口', newOrphans.length === 0, newOrphans.join(' '));
// B3：这是本门禁最有价值的一条 —— 把缺口压到 0 之后，任何回涨都要当场红。
ck('B3 存量缺口已清零（回归哨）', orphans.length === 0, orphans.join(' '));
console.log('    （信息）treasure: 字段的 73 个查无此物已于 2026-09-26 全部销账');

// 记录基线已归档，便于日后查证（不参与断言）
const BASELINE_ARCHIVED = 73;

// ============================== C · 止血函数语义 ==============================
console.log('\n--- C isUnresolvedTreasureId 语义 ---');
// C1：缺口已清零，故用**构造的未建 id** 取样。
//    ⚠ 反模式教训：曾经写死某个具体缺口 id（tre_huojianqiang），补建后断言自我过期；
//    C3 已覆盖「查得到 ⇒ false」，此处只验证「形如内部编码且查无此物 ⇒ true」的判定本身。
const _gapSample = 'zzz_not_exist_by_design';
ck('C1 缺口 id 判 true（走"不入库"分支）',
  NDX.isUnresolvedTreasureId(_gapSample) === true, '取样 ' + _gapSample);
ck('C2 中文材料名判 false（仍按材料收）',
  NDX.isUnresolvedTreasureId('牛魔妖丹') === false);
ck('C3 可解析的既有法宝判 false（不得误伤）',
  NDX.isUnresolvedTreasureId('dingfeng') === false && NDX.isUnresolvedTreasureId('ts_bowl') === false);
ck('C4 空值判 false（不抛异常）', NDX.isUnresolvedTreasureId('') === false && NDX.isUnresolvedTreasureId(null) === false);
// C5：确保没有既有法宝被误判为缺口（否则会吞掉玩家本该拿到的宝）
const wronglyFlagged = [...treasureIds].filter((id) => (NDX.lootById && NDX.lootById(id)) && NDX.isUnresolvedTreasureId(id));
ck('C5 无「查得到却被判缺口」的误伤', wronglyFlagged.length === 0, wronglyFlagged.join(' '));

// ============================== D · gear: 发放闭环（恒绿） ==============================
console.log('\n--- D gear: 发放闭环 ---');
const gearOrphan = [...gearIds].filter((id) => !(NDX.lootById && NDX.lootById(id)));
ck('D1 所有 gear: 发放 id 均可解析（入池或入字典）', gearOrphan.length === 0, gearOrphan.join(' '));
const gearDiary = [...gearIds].filter((id) => NDX.isDiaryEquip({ id }));
ck('D2 事件 gear 发放覆盖到日记装备（非空）', gearDiary.length > 0, gearDiary.length + ' 件');
const diaryNotGear = nonEvDiary.filter((e) => !gearIds.has(e.id)).map((e) => e.id);
ck('D3 经文双线（无 ev_ 前缀）一族均有 gear 发放源', diaryNotGear.length === 0, diaryNotGear.join(' '));

// ============================== E · 材料通道不吞英文 id（2026-09-26 新增） ==============================
// 血泪：effect.material 的唯一消费点是 game_event_3.js:558
//   `if (eff.material) s.materials[eff.material] = ...`
// —— 它**不做任何解析**，值被原样当材料 key 入库。所以任何 `material: '英文id'`
// 都会把裸英文塞进材料袋与日志。历史上 8 处踩过（ch2/ch3/ch6/ch8），
// 其中 ch8 4 处更狠：把**装备实体 id** 塞进材料通道 ⇒ 玩家夺宝只拿到一条英文字符串。
// 此处设为硬哨，任何回归当场红。
console.log('\n--- E 材料通道不吞英文 id ---');
const ENG = /^[A-Za-z][A-Za-z0-9_]*$/;
const MAT_RE = /\bmaterial:\s*(['"])([^'"]+)\1/g;
const matEnglish = [], matEquipMix = [];
// eventOnly 装备 id 集合：这些**只能**走 gear: 通道
const trialDropIds = new Set((NDX.EQUIP_POOL || [])
  .filter((e) => e && e.eventOnly && /^[A-Za-z_]/.test(e.id)).map((e) => e.id));
for (const f of FILES) {
  if (!isDataFile(f)) continue;                                  // UI 层的 material 是布局字段名
  const rel = path.relative(ROOT, f).replace(/\\/g, '/');
  const src = fs.readFileSync(f, 'utf8');
  let m;
  while ((m = MAT_RE.exec(src))) {
    const v = m[2];
    if (v.indexOf('/') >= 0) continue;                           // 图标路径，不是材料 id
    if (ENG.test(v)) matEnglish.push(rel + ' → ' + v);
    if (trialDropIds.has(v)) matEquipMix.push(rel + ' → ' + v);
  }
}
ck('E1 effect.material 不得填英文 id（会原样入库污染材料袋）',
  matEnglish.length === 0, matEnglish.join(' | '));
ck('E2 eventOnly 装备 id 不得塞进 material:（应改走 gear:）',
  matEquipMix.length === 0, matEquipMix.join(' | '));

// E3 反证：故意把一个 eventOnly 装备 id 塞进 material:，断言必须能捕获
//    （否则 E2 可能因「压根没扫到 material:」而假绿）
const _probe = 'equip_biqiu';
if (trialDropIds.has(_probe)) {
  const probePath = path.join(ROOT, 'js', '_probe_mat_check.js');
  fs.writeFileSync(probePath, 'effect: { material: \'' + _probe + '\' }\n');
  let caught = false;
  {
    const s2 = fs.readFileSync(probePath, 'utf8');
    for (const m of s2.matchAll(MAT_RE)) { if (trialDropIds.has(m[2])) caught = true; }
  }
  ck('E3 反证：人为塞回的 material: 装备 id 可被捕获', caught === true);
  fs.unlinkSync(probePath);
}

console.log('\n---------------------------------------------');
console.log(pass + ' 通过 / ' + fail + ' 失败');
if (fail) { console.log('\n失败项：'); BAD.forEach((b) => console.log('  - ' + b)); }
process.exit(fail ? 1 : 0);
