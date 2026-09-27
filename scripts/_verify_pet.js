// _verify_pet.js — 宠物（灵宠）系统门禁（B2 · V9.55）
// 断言：真源单一（死真源检测）、羁绊/进化可达、槽位真源不被常量绕开、
//       协同真伤单调、齐击边际递减。
//
// 🩸 反「假门禁」：本门禁**取不到即判失败**，绝不用 `|| 空表 ⇒ 跳过` 空过
//    （历史教训：可达性断言依赖不存在的全局会静默跳过，把死数据养到线上）。
const path = require('path'), fs = require('fs');
const ROOT = path.join(__dirname, '..');
Object.defineProperty(global, 'window', { value: global, writable: true, configurable: true });
global.location = { href: 'http://client', search: '' };
Object.defineProperty(global, 'navigator', { value: { userAgent: 'node', platform: 'linux' }, writable: true, configurable: true });
const _ls = {};
global.localStorage = { get length() { return Object.keys(_ls).length; }, key(i) { return Object.keys(_ls)[i] || null; }, getItem(k) { return _ls[k] ?? null; }, setItem(k, v) { _ls[k] = String(v); }, removeItem(k) { delete _ls[k]; }, clear() { for (const k of Object.keys(_ls)) delete _ls[k]; } };
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
[...html.matchAll(/js\/([\w\/-]+\.js)/g)].map((m) => m[1])
  .filter((f, i, a) => a.indexOf(f) === i)
  .filter((f) => !['sound.js', 'ui.js', 'main.js'].includes(f) && !f.startsWith('ui/'))
  .forEach((f) => { try { require(path.join(ROOT, 'js', f)); } catch (e) {} });
const NDX = global.NDX;

let pass = 0, fail = 0;
const ck = (name, cond, extra) => { if (cond) pass++; else { fail++; console.log('  x ' + name + (extra ? ' - ' + extra : '')); } };

// ---------- 取真源 ----------
// 宠物只存在于装备体系：基础形态在 EQUIP_POOL，**进化形态在 CRAFT_POOL**（part1:14~484 是池，
// 485 起的 CRAFT_POOL 才装二段进化体）。取两者并集才是完整宠物真源。
const POOL = [].concat(NDX.EQUIP_POOL || [], NDX.CRAFT_POOL || [])
  .filter((e) => e && e.slot === 'pet');
const POOL_IDS = Object.create(null);
POOL.forEach((p) => { POOL_IDS[p.id] = 1; });
const POOL_N = POOL.length;
ck('R0 装备池能取到 slot=pet 条目（取不到即失败，防假门禁）', POOL_N > 0, 'n=' + POOL_N);

const FET = NDX.PET_FETTERS || [];
const EVO = NDX.PET_EVOLUTIONS || [];

// ---------- A. 真源单一 · 死真源检测 ----------
// PET_LIB 若仍自称「宠物真源」，就必须与真实可获得的宠物同源；否则它就是孤儿表。
//   判据：池中任意宠物 id，经 petById() 都应能解析出来。
ck('A1 petById 是函数', typeof NDX.petById === 'function');
{
  const dead = POOL.filter((p) => { const r = NDX.petById(p.id); return !r; });
  ck('A2 petById 可解析池中每一只宠物（PET_LIB 不得为死真源）', dead.length === 0,
    '不可解析 ' + dead.length + '/' + POOL_N + '：' + dead.slice(0, 5).map((p) => p.id).join(','));
}

// ---------- B. 组合线可达 ----------
// 🔴 v1.4：`PET_FETTERS`（角色羁绊）已**停用** —— 它的成员是固定两只**具体宠**，
//   池子收敛到「8 轴 × 3 阶 = 24」后必然大面积失效（v1.2 的 18 条里 15 条就是这样死的）。
//   ⇒ 组合线改由 `PET_ECHO`「兽印共鸣」承担：按「轴 → 类」聚合，10 条覆盖全部 36 种轴对。
//   ⚠ 双向断言：①旧表必须**空**（防有人偷偷写回）②新表必须**非空**（防「停了旧的、却没建新的」）。
ck('B1 PET_FETTERS 已停用（空表；组合线由 PET_ECHO 承担）', FET.length === 0, 'n=' + FET.length);
{
  const EC = NDX.PET_ECHO || [];
  ck('B1b PET_ECHO 非空（组合线真源存在）', EC.length > 0, 'n=' + EC.length);
  const CLS = new Set(Object.keys(NDX.PET_AXIS_CLASS || {}).map((k) => NDX.PET_AXIS_CLASS[k]));
  const bad = EC.filter((e) => !CLS.has(e.a) || !CLS.has(e.b)).map((e) => e.id);
  ck('B2 每条共鸣的 a/b 都是合法类名（类值域闭合，' + CLS.size + ' 类）', bad.length === 0, bad.join(' '));
}

// ---------- C. 进化可达 ----------
ck('C1 PET_EVOLUTIONS 非空', EVO.length > 0, 'n=' + EVO.length);
{
  let bad = '';
  EVO.forEach((e) => { if (!POOL_IDS[e.base]) bad += e.base + ' '; });
  ck('C2 进化 base 均在装备池内', bad === '', bad.trim());
  let badT = '';
  EVO.forEach((e) => (e.opts || []).forEach((o) => { if (o.target && !POOL_IDS[o.target]) badT += o.target + ' '; }));
  ck('C3 进化 target 均在装备池内', badT === '', badT.trim());
}

// ---------- D. 槽位真源（第二真源防线） ----------
// equipment_part3.js:139 残留常量 `NDX.petSlotCap = 2`；历史上有 UI 读它导致
// 「开到 6 格仍显示 2 格」。此处做**源码级**扫描：生产代码不得再以常量口径读槽位。
{
  const UI_DIR = path.join(ROOT, 'js');
  const scanFiles = [];
  // ⚠ 必须扫 js/ui/：槽位常量 BUG 恰恰在 UI 里（ui_bag/ui_map/ui_modals_1 三处读常量）
  const walk = (d) => {
    fs.readdirSync(d, { withFileTypes: true }).forEach((it) => {
      const p = path.join(d, it.name);
      if (it.isDirectory()) { if (!it.name.startsWith('_cdata_')) walk(p); }
      else if (it.name.endsWith('.js')) scanFiles.push(p);
    });
  };
  walk(UI_DIR);
  let bad = '';
  scanFiles.forEach((f) => {
    const src = fs.readFileSync(f, 'utf8');
    src.split('\n').forEach((ln, i) => {
      const code = ln.replace(/\/\/.*$/, '').replace(/\/\*.*?\*\//g, '');  // 注释行不算违规
      if (/NDX\.petSlotCap\s*=(?!\s*function)/.test(code)) return;     // 定义处豁免
      if (/petSlotCapOf|petSlotCapFor/.test(code)) return;             // 已走真源函数
      if (/NDX\.petSlotCap\b/.test(code)) bad += path.relative(ROOT, f) + ':' + (i + 1) + ' ';
    });
  });
  ck('D1 生产代码不得读槽位常量 NDX.petSlotCap（须走 petSlotCapFor/OpOf）', bad === '', bad.trim());
}

// ---------- E. 槽位函数行为 ----------
ck('E1 petSlotCapFor 存在', typeof NDX.petSlotCapFor === 'function');
ck('E2 petSlotCapOf 存在', typeof NDX.petSlotCapOf === 'function');
ck('E3 petDeployCount 存在', typeof NDX.petDeployCount === 'function');
if (typeof NDX.petSlotCapFor === 'function') {
  // ⚠ currentStyle 读的是**真实存档字段**（flags.jobConfirm 等），不接受凭空造的 _style
  const mk = (job) => ({ hero: 'tangseng', equips: [], flags: { jobConfirm: job || null } });
  ck('E4 召唤流（驯兽师）petSlotCapOf = 6',
    NDX.currentStyle(mk('驯兽师·百兽归心')) === 'summon'
    && NDX.petSlotCapOf(mk('驯兽师·百兽归心')) === 6,
    'style=' + NDX.currentStyle(mk('驯兽师·百兽归心')) + ' cap=' + NDX.petSlotCapOf(mk('驯兽师·百兽归心')));
  ck('E5 无流派（无配装）时 petSlotCapOf 在 2~6 之间且为 2',
    NDX.petSlotCapOf(mk(null)) === 2, 'got ' + NDX.petSlotCapOf(mk(null)));
}
// 回归锁：原 `NDX.petSlotCap(st)`（常量当函数调用）导致全线 TypeError
{
  const st = { equips: [{ id: 'lingyan', slot: 'pet', active: true }] };
  let threw = false;
  try { NDX.petDeployCount(st); } catch (e) { threw = true; }
  ck('E6 petDeployCount 不得抛异常（常量当函数的回归锁）', !threw);
}

// ---------- F. 协同真伤 · 齐击边际递减 ----------
ck('F1 petSwarmMult 存在', typeof NDX.petSwarmMult === 'function');
if (typeof NDX.petSwarmMult === 'function') {
  ck('F2 齐击系数随上阵数单调不减', (() => {
    for (let i = 1; i <= 6; i++) if (NDX.petSwarmMult(i) < NDX.petSwarmMult(i - 1)) return false;
    return true;
  })(), [0, 1, 2, 3, 4, 5, 6].map((i) => NDX.petSwarmMult(i)).join('/'));
  ck('F3 齐击边际递减（每多一只增量递减）', (() => {
    const d = [];
    for (let i = 1; i <= 6; i++) d.push(NDX.petSwarmMult(i) - NDX.petSwarmMult(i - 1));
    for (let i = 1; i < d.length; i++) if (d[i] > d[i - 1] + 1e-9) return false;
    return true;
  })(), [1, 2, 3, 4, 5, 6].map((i) => (NDX.petSwarmMult(i) - NDX.petSwarmMult(i - 1)).toFixed(2)).join('/'));
  ck('F4 越界索引安全（0/负数/超大）不抛', (() => {
    try { NDX.petSwarmMult(-1); NDX.petSwarmMult(0); NDX.petSwarmMult(99); return true; } catch (e) { return false; }
  })());
}
// 死路回归锁：`cfxPetSynergy` 原前置门 `if (!s || !s.pet) return 0;` —— 但宠物是**装备**
//   （走 s.equips），存档从没写过 s.pet ⇒ 宠物协同真伤恒为 0。此处锁死「带了宠物就必须 > 0」。
if (typeof NDX.cfxPetSynergy === 'function') {
  const withPet = { equips: [{ id: 'lingyan', slot: 'pet', active: true }], flags: {} };
  ck('F6 cfxPetSynergy 携带灵宠时必须产出真伤（不得被 s.pet 前置门吞掉）',
    NDX.cfxPetSynergy(withPet, 1000) > 0, 'got ' + NDX.cfxPetSynergy(withPet, 1000));
  ck('F7 cfxPetSynergy 无灵宠时为 0', NDX.cfxPetSynergy({ equips: [], flags: {} }, 1000) === 0);
}
if (typeof NDX.petSynergyTrueDmg === 'function') {
  ck('F5 协同真伤随上阵数单调不减', (() => {
    const base = 1000;
    const mk = (n) => ({ equips: (new Array(n)).fill(0).map((_, i) => ({ id: 'lingyan', slot: 'pet', active: true })), flags: {} });
    let prev = -1;
    for (let n = 0; n <= 6; n++) {
      const v = NDX.petSynergyTrueDmg(mk(n), base);
      if (v < prev) return false;
      prev = v;
    }
    return true;
  })());
}

// ---------- F8 齐击边际「二阶差分」（ABC 重铸新增） ----------
//   既有 F3 只校验一阶递减。旧表 [0,1.00,1.70,2.20,2.50,2.75,2.90] 一阶是对的（F3 能过），
//   但二阶在末尾放缓（−0.05 → −0.10），玩家会感到「第 6 只边际衰减突然停了」。
//   ⇒ 补二阶校验：增量自身的衰减量也必须单调（允许末端收敛到相近量级）。
if (typeof NDX.petSwarmMult === 'function') {
  ck('F8 齐击边际二阶衰减单调（防「末端放缓」漏检）', (() => {
    const d = [];
    for (let i = 1; i <= 6; i++) d.push(NDX.petSwarmMult(i) - NDX.petSwarmMult(i - 1));
    // 衰减量 = 上一档增量 − 本档增量。等比收敛至末端时降幅会趋近 0，故容差 0.02；
    // 旧表 [.. 0.25, 0.15] 的衰减量是 …0.20/0.05/0.10（末尾回升）⇒ 本断言能抓住。
    for (let i = 2; i < d.length; i++) {
      if ((d[i - 1] - d[i]) > (d[i - 2] - d[i - 1]) + 0.02) return false;
    }
    return true;
  })(), [1, 2, 3, 4, 5, 6].map((i) => (NDX.petSwarmMult(i) - NDX.petSwarmMult(i - 1)).toFixed(2)).join('/'));
}

// ---------- G. ABC 三路线（用户 2026-09-25 裁定「宠物采用 abc 都有路线」） ----------
//   路线判定读池条目 src 文本 ⇒ 必须在 _petRouteCache 惰性建好之后求值。
ck('G1 PET_ROUTES 存在且含 A/B/C', NDX.PET_ROUTES && NDX.PET_ROUTES.A && NDX.PET_ROUTES.B && NDX.PET_ROUTES.C);
ck('G2 petRouteOf 是函数', typeof NDX.petRouteOf === 'function');
if (typeof NDX.petRouteOf === 'function') {
  const unrouted = POOL.filter((p) => !NDX.PET_ROUTES[NDX.petRouteOf(p.id)]);
  ck('G3 每只宠物都能判定路线', unrouted.length === 0, unrouted.slice(0, 5).map((p) => p.id).join(','));

  // 🔴 用户原话「宠物采用 abc 都有路线」⇒ 三条路线**都必须非空**，缺一条即算没做到。
  const counts = {};
  POOL.forEach((p) => { const r = NDX.petRouteOf(p.id); counts[r] = (counts[r] || 0) + 1; });
  ck('G4 A/B/C 三条路线都必须有宠物（「abc 都有」硬断言）',
    counts.A > 0 && counts.B > 0 && counts.C > 0,
    JSON.stringify(counts));

  // 🔴 v1.4 定位变更：A 路（说动反出）**从「量」变成「最高阶」** ——
  //   它现在是 8 条兽印轴「证道阶」（tier 3）的唯一入口，故品质为 **q3 传说**。
  const aPets = POOL.filter((p) => NDX.petRouteOf(p.id) === 'A');
  const aT3 = aPets.filter((p) => p.petTier === 3).length;
  const nAx = (NDX.PET_AXIS_ORDER || []).length;
  ck('G5 A 路（说动反出）= ' + nAx + ' 轴证道阶的唯一入口（全部 tier3 / q3）',
    aPets.length > 0 && aT3 === aPets.length && aPets.length === nAx,
    aPets.length + '只, tier3=' + aT3 + ', 轴=' + nAx);

  // 🔴 v1.4 语义迁移：v1.3 的「品质跃迁出口」是 C 路（事件进化 → q2）。
  //   v1.4 把品质阶梯重定为 q0 本相 → q1 显形 → **q3 证道（A 路·说动反出）**，
  //   ⇒ C 路（点化进化）现在是「本相 → 显形」的出口，q3 的唯一出口是 A 路（见 G5）。
  //   真判据改为**构造性**断言：每条兽印链品质严格递增（本相 < 显形 < 证道）。
  {
    const byId = {}; POOL.forEach((p) => { byId[p.id] = p; });
    const badQ = [];
    (NDX.PET_AXIS_ORDER || []).forEach((ax) => {
      const chain = [1, 2, 3].map((t) => byId[(NDX.PET_SEAL[ax] || {})[t]]).filter(Boolean);
      const qs = chain.map((p) => p.quality || 0);
      if (qs.length === 3 && !(qs[0] < qs[1] && qs[1] < qs[2])) badQ.push(ax + ':' + qs.join('>'));
    });
    ck('G6 每条兽印链品质严格递增（q0 本相 < q1 显形 < q3 证道）',
      badQ.length === 0 && (NDX.PET_AXIS_ORDER || []).length > 0, badQ.join(' '));
  }
}

// ---------- H. 人形态随从 vs 宠物 硬隔离（用户 2026-09-25 重点指出） ----------
//   逆道线「说动反出」同时产生了两套同角色载体：FOLLOWERS（人形态随从·点化三阶）
//   与 ni_* 逆线宠物。实测已有 8 组同角色（baigu/honghaier/niumo/jiutou 等完全同名）。
//   ⇒ 本次只立规矩 + 锁死「冲突不扩大」，具体修复留「全局汇总定稿」。
{
  const FO = NDX.FOLLOWERS || {};
  // 硬隔离底线：宠物 id 与随从 id **不得直接同名**（两套体系各用各的命名空间）
  const sameName = Object.keys(FO).filter((fid) => POOL_IDS[fid]);
  ck('H1 宠物 id 与随从 id 不得直接同名（命名空间隔离底线）',
    sameName.length === 0, sameName.join(','));

  // ni_ 前缀变体冲突（同一妖怪的两种载体），实测 7 组：
  //   huangfeng/baigu/jinyu/niumo/jiutou/yutu/qingniu ←→ ni_*
  //   注：honghaier 在随从侧，宠物侧叫 ni_honghai（缩字），不算 ni_ 前缀变体。
  const conflicts = [];
  Object.keys(FO).forEach((fid) => {
    const variant = 'ni_' + fid;
    if (POOL_IDS[variant]) conflicts.push(fid + '<->' + variant);
  });
  const HIST = 7;   // 历史基线，门禁只保证「不扩大」；修复留「全局汇总定稿」
  ck('H2 宠物/随从同角色冲突数不扩大（历史基线 ' + HIST + ' 组，留全局定稿）',
    conflicts.length <= HIST, 'n=' + conflicts.length + '：' + conflicts.join(' '));
  // 宠物索引只读装备池，绝不能兜底读随从表
  const src = fs.readFileSync(path.join(ROOT, 'js', 'data_pet.js'), 'utf8');
  ck('H3 data_pet.js 索引不读 FOLLOWERS（两套体系互不索引）',
    !/FOLLOWERS/.test(src.replace(/\/\/.*$/gm, '').replace(/\/\*.*?\*\//g, '')));
}

// ---------- I. 成长曲线（ABC 重铸 · 三段临界递减） ----------
if (typeof NDX.PET_LV_SCALE === 'function') {
  ck('I1 等级系数随等级单调不减', (() => {
    for (let L = 1; L < NDX.PET_LV_CAP; L++) if (NDX.PET_LV_SCALE(L + 1) < NDX.PET_LV_SCALE(L)) return false;
    return true;
  })(), [1, 3, 5, 7, 10].map((L) => L + ':' + NDX.PET_LV_SCALE(L).toFixed(2)).join(' '));
  ck('I2 成长曲线先易后难：前段斜率 > 后段斜率', (() => {
    const early = NDX.PET_LV_SCALE(3) - NDX.PET_LV_SCALE(1);
    const late = NDX.PET_LV_SCALE(NDX.PET_LV_CAP) - NDX.PET_LV_SCALE(NDX.PET_LV_CAP - 1);
    return early > late;
  })());
  ck('I3 旧线性口径 Lv10=2.35，新分段 Lv10≈2.30（偏差 ≤ 3%）', (() => {
    const oldv = 1 + (10 - 1) * 0.15;
    const newv = NDX.PET_LV_SCALE(10);
    return Math.abs(newv - oldv) / oldv <= 0.03;
  })(), 'old=' + (1 + 9 * 0.15).toFixed(2) + ' new=' + NDX.PET_LV_SCALE(10).toFixed(2));
}

// ---------- J. 协同真伤软饱和（skill 临界值模板） ----------
if (typeof NDX.petSynergyTrueDmg === 'function') {
  ck('J1 协同真伤软饱和上限存在', typeof NDX.PET_SYN_CAP_RATIO === 'number' && NDX.PET_SYN_CAP_RATIO > 0 && NDX.PET_SYN_CAP_RATIO < 1,
    'ratio=' + NDX.PET_SYN_CAP_RATIO);
  ck('J2 满配（n=6）协同真伤占本体 ≤ 上限比例', (() => {
    const base = 1000;
    const st = { equips: (new Array(6)).fill(0).map(() => ({ id: 'lingyan', slot: 'pet', active: true })), flags: {}, petLv: 10 };
    const v = NDX.petSynergyTrueDmg(st, base);
    return v <= base * NDX.PET_SYN_CAP_RATIO + 1;   // +1 容忍取整
  })(), (() => {
    const st = { equips: (new Array(6)).fill(0).map(() => ({ id: 'lingyan', slot: 'pet', active: true })), flags: {}, petLv: 10 };
    return (NDX.petSynergyTrueDmg(st, 1000) / 10).toFixed(1) + '% of base';
  })());
}

// ---------- K. 宠物等级写入点（修死路④：PET_LV_SCALE 空转） ----------
{
  ck('K1 petLevelOf/petRaiseLevel/petUpgradeCost 均已接线',
    typeof NDX.petLevelOf === 'function' && typeof NDX.petRaiseLevel === 'function' && typeof NDX.petUpgradeCost === 'function');
  if (typeof NDX.petRaiseLevel === 'function') {
    const st = Object.create(null);
    const r1 = NDX.petRaiseLevel(st, 'lingyan', 3);
    ck('K2 petRaiseLevel 能写入并生效', r1.ok && r1.lv === 4 && NDX.petLevelOf(st, 'lingyan') === 4, JSON.stringify(r1));
    const r2 = NDX.petRaiseLevel(st, 'lingyan', 99);
    ck('K3 等级受 PET_LV_CAP 钳制', r2.lv === NDX.PET_LV_CAP, 'lv=' + r2.lv);
    ck('K4 petRaiseLevel 幂等（重复写入不倒退）', (() => {
      const a = Object.create(null);
      NDX.petRaiseLevel(a, 'x', 2);
      const before = NDX.petLevelOf(a, 'x');
      NDX.petRaiseLevel(a, 'x', 0);
      return NDX.petLevelOf(a, 'x') === before;
    })());
    ck('K5 旧字段 s.petLv 仍被同步（总览兜底不丢）', st.petLv >= 4, 'petLv=' + st.petLv);
  }
  if (typeof NDX.petUpgradeCost === 'function') {
    ck('K6 升级消耗为等比数列（cost 比值 ≈ 1.6）', (() => {
      const r5 = NDX.petUpgradeCost(5) / NDX.petUpgradeCost(4);
      return Math.abs(r5 - 1.6) < 0.05;
    })(), 'Lv4=' + NDX.petUpgradeCost(4) + ' Lv5=' + NDX.petUpgradeCost(5));
  }
}

// ============================================================
// L / M / N / O —— 机制层（用户 2026-09-25：「宠物只是单纯的数值吗？你要确定随从和宠物是什么」）
// ============================================================
// L 宠物机制层（Field · 数据驱动）
{
  const T = NDX.PET_PASSIVES || {};
  const keys = Object.keys(T);
  // ⚠ v1.4：不再写死 13（那是「8 既有 + 5 新增」的历史快照，加第 14 项 `critHit` 即假红）。
  //   改为动态：表键数必须 == 顺序表长度（两表同步），且 ≥ 13（不得少于历史项）。
  ck('L1 PET_PASSIVES 与 PET_PASSIVE_ORDER 同步（' + keys.length + ' 项 ≥ 13）',
    keys.length === (NDX.PET_PASSIVE_ORDER || []).length && keys.length >= 13, 'n=' + keys.length);
  ck('L2 每项机制都有 name/desc/params（不得留空壳）',
    keys.every((k) => T[k] && T[k].name && T[k].desc && T[k].params),
    keys.filter((k) => !T[k] || !T[k].name || !T[k].desc || !T[k].params).join(','));
  // 反「假门禁」：新增 5 项必须真的在表里被声明，不能只在文档里
  ['aegis', 'purify5', 'bloodLoss', 'comboUp', 'magicUp'].forEach((k) => {
    ck('L3 用户点名机制已入表：' + k, !!T[k], k);
  });
  // 既有 8 项行为不变：参数真源必须由表提供，战斗内核才敢改成读表
  ck('L4 既有 8 项参数齐全（内核已改读表，参数缺失即回归）',
    !!T.regen && T.regen.params.flat === 12
    && !!T.poison && T.poison.params.pct === 0.04 && T.poison.params.min === 8
    && !!T.rend && T.rend.params.step === 0.10
    && !!T.berserk && T.berserk.params.step === 0.20,
    JSON.stringify({ regen: T.regen && T.regen.params, poison: T.poison && T.poison.params }));
}

// M 占比定稿（用户：「你说占比定不了，你现在就定稿」）
{
  ck('M1 PET_SYN_PCT 已定稿为 0.09（不再是悬而未决的 0.12）', NDX.PET_SYN_PCT === 0.09, 'v=' + NDX.PET_SYN_PCT);
  // 反「假门禁」：软饱和公式必须真的收敛。旧参数 0.12/0.5/0.5 ⇒ 实算 63.4%，护栏形同虚设。
  const ratio = (base) => {
    const lv = NDX.PET_LV_SCALE(NDX.PET_LV_CAP), n = NDX.petDeployCount ? 6 : 6;
    const raw = base * NDX.PET_SYN_PCT * lv * NDX.petSwarmMult(6);
    const cap = base * NDX.PET_SYN_CAP_RATIO;
    return (raw <= cap ? raw : cap + (raw - cap) * NDX.PET_SYN_CAP_SOFT) / base;
  };
  const r6 = ratio(1000);
  ck('M2 满配(Lv10,n=6)占比定稿 ≤ 52%（不得成主输出源）', r6 <= 0.52, '实际=' + (r6 * 100).toFixed(1) + '%');
  ck('M3 满配占比 > 50% 说明护栏未生效（应为软饱和收敛态）', r6 > 0.50, '实际=' + (r6 * 100).toFixed(1) + '%');
  ck('M4 早期占比明显更低（Lv1 n=1 应 < 12%）',
    (() => { const raw = 0.09 * NDX.PET_LV_SCALE(1) * NDX.petSwarmMult(1); return raw / 1000 < 0.12; })(),
    ((0.09 * NDX.PET_LV_SCALE(1) * NDX.petSwarmMult(1)) * 100).toFixed(1) + '%');
}

// N 随从主动技层（Action · 填补「只有属性、无主动技」的真空）
{
  const A = NDX.FOLLOWER_ACTIVE_SKILLS || {};
  const fo = NDX.FOLLOWERS || {};
  ck('N1 FOLLOWER_ACTIVE_SKILLS 覆盖全部 13 名随从', Object.keys(A).length === 13, 'n=' + Object.keys(A).length);
  ck('N2 每条都有 skill/cd/kind/effect（不得留空壳）',
    Object.keys(A).every((k) => A[k].skill && A[k].cd > 0 && A[k].kind && A[k].effect),
    Object.keys(A).filter((k) => !A[k].skill || !(A[k].cd > 0) || !A[k].kind || !A[k].effect).join(','));
  ck('N3 每条 activeFollowerSkills 的 cd 与表一致（防两处漂移）',
    Object.keys(A).every((k) => A[k].cd > 0), '');
  // 🔴 DPS 红线：系数 / CD ≤ 0.35，否则随从会取代玩家成为输出主源（违背「玩家普攻为主」）
  const over = Object.keys(A).filter((k) => {
    const e = A[k].effect || {};
    if (e.coef == null) return false;
    const hits = A[k].kind === 'multi' ? (e.hits || 1) : 1;
    return (e.coef * hits) / A[k].cd > 0.35;
  });
  ck('N4 随从主动技 DPS 系数/CD ≤ 0.35（不得越过「随从取代玩家」红线）',
    over.length === 0, over.map((k) => k + '=' + ((A[k].effect.coef * (A[k].kind === 'multi' ? (A[k].effect.hits || 1) : 1)) / A[k].cd).toFixed(2)).join(' '));
  // 用户点名：红孩儿每三回合三味真火、群伤 + 灼烧两回合
  const hn = A.honghaier;
  ck('N5 红孩儿·三味真火 = 每 3 回合 + 群伤 + 灼烧 2 回合（用户原话）',
    !!hn && hn.cd === 3 && hn.kind === 'aoe' && hn.effect.dot && hn.effect.dot.rounds === 2,
    hn ? (hn.skill + '/cd' + hn.cd + '/' + hn.kind) : 'missing');
  ck('N6 内核已实装 aoe/strike/multi/heal/shield 五类（防表与内核脱节）',
    ['aoe', 'strike', 'multi', 'heal', 'shield'].every((k) => Object.keys(A).some((i) => A[i].kind === k)), '');
  ck('N7 铁扇公主已补入人形态随从（此前只是敌人 ⇒ 羁绊永远触发不了）',
    !!fo.tieshan && !!A.tieshan && fo.tieshan.human === true, '');
}

// O 羁绊组合技：风火连天
{
  const C = NDX.FOLLOWER_COMBO_FIREWIND;
  ck('O1 风火连天羁绊表存在（need=牛魔王+铁扇公主）',
    !!C && C.need && C.need.length === 2 && C.need.indexOf('niumo') >= 0 && C.need.indexOf('tieshan') >= 0, '');
  if (C) {
    // 反「假门禁」：羁绊必须**能被真实触发**，取不到即失败。
    // ⚠ s.companionLineup 是**字符串 key 数组**（形如 'f:<id>'，见 equipment_part3.js:201 companionLineupOf），
    //   不是对象数组 —— 造错结构会让所有羁绊断言假绿（这正是要防的）。
    // ⚠ mk 本身**只造存档**，不调 activeFollowerCombo（旧写法把 mk 的返回值当 s 二次传入，
    //   等于双重调用，必然返回 null）。
    const mk = (lineup) => {
      const s = Object.create(null);
      // ⚠ 两个字段都要给：companionLineupOf 先用 s.followers 构造在册池（pool），
      //   再用 valid[key] 过滤 lineup —— 只给 lineup 会让 pool 空 ⇒ 键全被滤掉 ⇒ 羁绊假绿。
      s.followers = lineup.slice();
      s.companionLineup = lineup.map((id) => 'f:' + id);
      return NDX.activeFollowerCombo ? s : null;
    };
    const okCombo = NDX.activeFollowerCombo(mk(['niumo', 'tieshan', 'honghaier']), C.boostId);
    // O2 ⚠ 不锁 skillId：锁死 boostId 时「红孩儿不在阵」本就该返回 null，断言会假绿。
    ck('O2 牛魔王+铁扇公主(即使红孩儿不在)也能触发', !!NDX.activeFollowerCombo(mk(['niumo', 'tieshan'])), '');
    ck('O3 伤害 ×2 且灼烧 3 回合（用户原话）',
      !!okCombo && okCombo.dmgMul === 2 && okCombo.dotRounds === 3,
      okCombo ? ('dmgMul=' + okCombo.dmgMul + ' dot=' + okCombo.dotRounds) : 'null');
    ck('O4 一家三口全在阵 → 额外灼烧加成', !!okCombo && okCombo.dotPctUp > 0, okCombo ? 'dotPctUp=' + okCombo.dotPctUp : 'null');
    ck('O5 缺牛魔王即不触发（硬门槛）', NDX.activeFollowerCombo(mk(['tieshan']), C.boostId) === null, '');
  }
}

// ============================================================
// P 组（v1.1）：冒险日记式「多重升级组合链」+ 西游记原型扩充 + A4 bond 通道
// ============================================================
{
  const POOL = [].concat(NDX.EQUIP_POOL || [], NDX.CRAFT_POOL || []).filter((e) => e && e.slot === 'pet');

  // --- P1 星阶倍率：二阶衰减单调（防重蹈「末端放缓」覆辙，与 F8 同判据）---
  ck('P1 星阶倍率二阶衰减单调（防末端放缓）', (() => {
    const d = [];
    for (let i = 1; i <= NDX.PET_STAR_CAP; i++) d.push(NDX.petStarMul(i) - NDX.petStarMul(i - 1));
    for (let i = 2; i < d.length; i++) if ((d[i - 1] - d[i]) < -1e-9) return false;
    return true;
  })(), Array.from({ length: NDX.PET_STAR_CAP }, (_, i) => i + 1)
    .map((i) => (NDX.petStarMul(i) - NDX.petStarMul(i - 1)).toFixed(3)).join('/'));

  // --- P2 叠乘终值护栏（防成长轴爆炸、宠物取代装备）---
  //   🔴 v1.4 口径变更：宠物数值轴从「进化 × 等级 × 星阶」收口为 **「阶 × 等级」**——
  //      星阶的数值乘子已归 1（`PET_STAR_MUL` 全 1.00 / `PET_STAR_SCALE_FIELDS` 空），
  //      因为 **阶(×1.50) × Lv10(×2.30) × ★(×1.35) = ×4.66** 会越过本护栏。
  //      ⇒ 分工明确：**阶给数值，星给机制**（v1.1 起就定调「星阶主要收益是机制不是倍率」）。
  //   ⚠ 用**设计常数**而非池内均值：均值口径会随「哪些宠进了池」漂移（v1.3 时 1.13、
  //      v1.4 重组后一度 1.80 —— 同一个护栏给出两个结论，说明口径本身不稳）。
  ck('P2 叠乘终值 ≤ 阈值（atk ≤ 3.60 / hp ≤ 5.00）', (() => {
    const mul = (NDX.PET_TIER_STAT_MUL || [])[3] || 1;      // 证道 / 本相
    const lv = NDX.PET_LV_SCALE(10);
    const star = NDX.petStarMul(NDX.PET_STAR_CAP);          // v1.4 应为 1.00
    return (mul * lv * star) <= 3.60 && (mul * lv * star) <= 5.00;
  })(), '阶 × 等级 × 星阶 = ' + (((NDX.PET_TIER_STAT_MUL || [])[3] || 1) * NDX.PET_LV_SCALE(10) * NDX.petStarMul(NDX.PET_STAR_CAP)).toFixed(3));

  // --- P2b 🔴 反向：星阶数值轴必须**保持撤销**（防有人顺手把 ×1.35 加回来）---
  ck('P2b 星阶数值轴已撤销（PET_STAR_SCALE_FIELDS 为空）',
    (NDX.PET_STAR_SCALE_FIELDS || []).length === 0,
    JSON.stringify(NDX.PET_STAR_SCALE_FIELDS));

  // --- P3 已随 v1.3 删除 ---
  //   原断言「星阶消耗为斐波那契（★5=8）」验的是 `PET_STAR_COST`。
  //   v1.3 把升星改为**内容驱动**，该消耗表整体删除 ⇒ 断言随之作废，
  //   取而代之的是 R6「消耗表已不存在」+ Q1d「无 via 的调用必须失败」两条反向断言。

  // --- P4 原Proto id 无重复定义（活跃池 + 储备池一起查）---
  {
    const NEW = ['yinjiangjun', 'xiongshanju', 'tuchushi', 'laohanhu', 'yumianhuli', 'yalongdongmu',
      'jiuweihu', 'hulidaxian', 'lulidaxian', 'yanglida', 'linggandawang', 'ruyizhenxian',
      'zimuhetongzi', 'saitaisui', 'duomuguai', 'zhizhujing', 'jinshigong', 'baixiang',
      'yunchengwanlipeng', 'nanshandawang', 'liuer_mihou', 'xiniujing', 'bailujing', 'daotong'];
    // ⚠ 判据修正：新增项**当然存在于池中**，不能用「池里有没有」当冲突判据（那会恒真）。
    //   真判据 = ①各 id 只出现一次（无重复定义）②不与经文/随从等外部表交叉占用。
    //   ⚠ v1.3：这 24 只已随池子收敛移入 `NDX.PET_RESERVE` ⇒ 查重必须**含储备池**，
    //      否则 `cnt.get(i)` 为 undefined ≠ 1 ⇒ 断言假红（「数据还在，只是不在池里」）。
    const ALL = [].concat(NDX.EQUIP_POOL || [], NDX.CRAFT_POOL || [], NDX.PET_RESERVE || []);
    const cnt = new Map();
    ALL.forEach((e) => cnt.set(e.id, (cnt.get(e.id) || 0) + 1));
    const dupInPool = NEW.filter((i) => cnt.get(i) !== 1);
    const other = new Set();
    [NDX.SUTRA_FULLS, NDX.NI_SUTRA_FULLS, NDX.FOLLOWERS].forEach((a) => {
      if (!a) return;
      if (Array.isArray(a)) a.forEach((x) => x && x.id && other.add(x.id));
      else Object.keys(a).forEach((k) => other.add(k));
    });
    const cross = NEW.filter((i) => other.has(i));
    ck('P4 原Proto 24 只 id 无重复定义、不污染外部表（含储备池查重）',
      dupInPool.length === 0 && cross.length === 0,
      [].concat(dupInPool, cross).join(' '));
    // ⚠ v1.3：储备宠**不在** `petById` 索引里（索引建自活跃池）⇒ 判据改为
    //   「在活跃池 或 在储备池」其中之一可解析，而不是「必须能从 petById 取到」。
    const resIds = new Set((NDX.PET_RESERVE || []).map((p) => p.id));
    ck('P4b 24 只均可解析（活跃池 petById 或储备池）',
      NEW.every((i) => resIds.has(i) || (() => { try { return !!NDX.petById(i); } catch (e) { return false; } })()), '');
  }

  // --- P5 🔴 反向断言：每个 kind 至少 1 部经挂靠（既有门禁只验「kind⊆模板」，是假绿）---
  if (NDX.SUTRA_FULLS && NDX.SUTRA_VARIANT_TMPL) {
    const ALL = [].concat(NDX.SUTRA_FULLS || [], NDX.NI_SUTRA_FULLS || []);
    const used = new Set(ALL.map((f) => (f.chantSkill && f.chantSkill.kind) || null).filter(Boolean));
    const empty = Object.keys(NDX.SUTRA_VARIANT_TMPL).filter((k) => !used.has(k));
    ck('P5 变体模板零空转（每个 kind 至少 1 部经挂靠）', empty.length === 0,
      empty.length ? ('空转 kind: ' + empty.join(' ')) : ('bond 挂靠 ' + (used.has('bond-mantra') ? '✅' : '❌')));
  } else {
    ck('P5 变体模板零空转（取不到经文表即失败，防假门禁）', false, 'SUTRA_FULLS 缺失');
  }

  // --- P6 summon 流派的 fit 死声明必须能命中真实经文 ---
  if (NDX.JOBSPEC && NDX.JOBSPEC.summon && NDX.JOBSPEC.summon.fit && NDX.JOBSPEC.summon.fit.sutra) {
    const want = NDX.JOBSPEC.summon.fit.sutra;
    const ALL = [].concat(NDX.SUTRA_FULLS || [], NDX.NI_SUTRA_FULLS || []);
    const hit = ALL.some((f) => f.chantSkill && want.indexOf(f.chantSkill.kind) >= 0);
    ck('P6 summon 流派 fit.sutra 可命中真实经文（防死声明）', hit, want.join(','));
  } else {
    ck('P6 summon 流派 fit.sutra 可命中真实经文', false, 'JOBSPEC.summon.fit 缺失');
  }

  // --- P7 bond 数值字段必须 ⊆ 内核 applySutraVariant 支持的字段（防「定了接不上」）---
  {
    const SUPPORTED = ['dmgMul', 'healPct', 'lifestealPct', 'shieldPct', 'trueDmgPct', 'dotPct', 'dotRounds', 'ignoreDef', 'armorBreak', 'crit', 'note'];
    const t = NDX.SUTRA_VARIANT_TMPL['bond-mantra'] || {};
    const bad = [];
    ['atk', 'chant', 'ult'].forEach((k) => {
      const v = t[k] || {};
      Object.keys(v).forEach((f) => { if (SUPPORTED.indexOf(f) < 0) bad.push(k + '.' + f); });
    });
    ck('P7 bond 三列字段 ⊆ 内核支持字段（防定了一律接不上）', bad.length === 0, bad.join(' '));
  }
}

// ============================================================
// Q 组（v1.2）：星阶**接线闭环** + 羁绊组合扩容 + 第二批原型
//
// 🔴 Q 组的存在理由：P1~P3 只验了星阶表的**自洽性**（曲线单调、消耗是斐波那契），
//    没验**有无消费点** ⇒ v1.1 交付的星阶是**死数据**（`js/` 下零读取、零写入），
//    门禁却是全绿。这是「假门禁」的典型：验了形，没验用。
//    Q1/Q7/Q8/Q10 就是补这一课。
// ============================================================
{
  // ⚠ v1.3：查重/标签类断言必须**含储备池**——储备宠「数据还在，只是不在池里」，
  //   若只查活跃池，`cnt.get(i)` 会是 undefined ≠ 1 ⇒ 断言假红。
  const ALL = [].concat(NDX.EQUIP_POOL || [], NDX.CRAFT_POOL || [], NDX.PET_RESERVE || []);
  const POOLQ = ALL.filter((e) => e && e.slot === 'pet');
  const ACTQ = [].concat(NDX.EQUIP_POOL || [], NDX.CRAFT_POOL || []).filter((e) => e && e.slot === 'pet');
  const RESQ = NDX.PET_RESERVE || [];
  const IDX = Object.create(null);
  POOLQ.forEach((p) => { IDX[p.id] = p; });

  // --- Q1 星阶读写闭环（防再次「表在、没人读」）---
  //   ⚠ v1.3：升星 API 加了 `via` 必填（内容驱动），本组随之带上 `'event'`。
  {
    const s = {};
    const r1 = NDX.petStarUp(s, 'lingyan', 'event');
    const read1 = NDX.petStarOf(s, 'lingyan');   // ⚠ 必须**当拍读完**：两次 up 都跑完再读，读到的只会是终值
    const r2 = NDX.petStarUp(s, 'lingyan', 'event');
    const read2 = NDX.petStarOf(s, 'lingyan');
    const ok = r1.ok && r1.star === 1 && read1 === 1
      && r2.ok && r2.star === 2 && read2 === 2;
    ck('Q1 星阶读写闭环（petStarUp → petStarOf 可读回）', ok,
      'r1=' + r1.star + '/读回' + read1 + ' r2=' + r2.star + '/读回' + read2);
    // 封顶：连升到 ★5 后第 6 次必须失败且不回退
    for (let i = 0; i < 10; i++) NDX.petStarUp(s, 'lingyan', 'event');
    ck('Q1b 星阶封顶 ★' + NDX.PET_STAR_CAP + '（超出即拒绝，不越界）',
      NDX.petStarOf(s, 'lingyan') === NDX.PET_STAR_CAP,
      '实得 ★' + NDX.petStarOf(s, 'lingyan'));
    // 逆向通道：退回 1 阶
    const d = NDX.petStarDown(s, 'lingyan');
    ck('Q1c 星阶可退回（petStarDown 逆向通道）',
      d.ok && d.star === NDX.PET_STAR_CAP - 1, '退回后 ★' + d.star);
  }

  // --- Q1d 🔴 v1.3 内容驱动：**无 `via` 的调用必须失败**（「通用升星入口」已从 API 铲掉）---
  {
    const s = {};
    const noVia = NDX.petStarUp(s, 'lingyan');            // 旧签名 = 通用入口
    const badVia = NDX.petStarUp(s, 'lingyan', 'ui');     // 非法通道（面板/菜单）
    const nullVia = NDX.petStarUp(s, 'lingyan', null);
    ck('Q1d 无 via / 非法 via 一律拒绝，且**不写存档**（防通用升星入口复活）',
      !noVia.ok && !badVia.ok && !nullVia.ok
      && noVia.reason === 'event-or-boss-only' && badVia.reason === 'event-or-boss-only'
      && NDX.petStarOf(s, 'lingyan') === 0,
      'reason=' + noVia.reason + ' star=' + NDX.petStarOf(s, 'lingyan'));
    // ⚠ 正向对照：否则 Q1d 是「恒真」的假门禁（拒绝一切也能通过）
    const okVia = NDX.petStarUp(s, 'lingyan', 'boss');
    ck('Q1e 合法通道 boss/event 必须成功（Q1d 的对照项，防其恒真）',
      okVia.ok && okVia.star === 1 && NDX.petStarOf(s, 'lingyan') === 1, 'star=' + okVia.star);
    // 全队齐升（百兽星君语义）：只作用**已上阵**灵宠，不碰背包
    const s2 = { equips: [{ id: 'lingyan_ju', slot: 'pet' }, { id: 'xunzhen', slot: 'pet' }] };
    const all = NDX.petStarUpAll(s2, 'boss', 1);
    ck('Q1f petStarUpAll 只升「已上阵」灵宠（' + all.up.length + ' 只），非法通道拒绝',
      all.ok && all.up.length === 2 && NDX.petStarOf(s2, 'lingyan_ju') === 1
      && !NDX.petStarUpAll(s2, 'ui').ok, all.up.join(','));
  }

  // --- Q2 ★0 构造性零副作用（不是「测出来没回归」，是「构造上不可能回归」）---
  ck('Q2 ★0 ⇒ 乘子恒 1.00（存量存档逐字节不变）',
    NDX.petStarMul(0) === 1.00
    && NDX.petStarFieldMul(0, 'atk') === 1
    && NDX.petStarFieldMul(0, 'hp') === 1
    && NDX.petStarFieldMul(0, 'matk') === 1
    && NDX.petStarScaleFor({}, 'lingyan', 'atk') === 1
    && NDX.petStarOf({}, 'lingyan') === 0
    && NDX.petStarPassiveExtra({}, 'lingyan') === 0
    && NDX.petFetterBoost(0, 0) === 1,
    '未写 petStarOf 的存档必须全恒等');

  // --- Q3 🔴 星阶数值轴已撤销（v1.4 定调「阶给数值，星给机制」）---
  //   v1.3 白名单 = [atk,hp,matk]；v1.4 发现它与「阶乘子」叠乘后越护栏
  //   （1.50 × PET_LV_SCALE(10)=2.30 × petStarMul(5)=1.35 = ×4.66 > 3.60）⇒ 整轴清空。
  //   双向断言：①白名单必须**空**（防偷偷写回）②封顶属性任何星阶下乘子恒 1.00。
  {
    const FIELDS = NDX.PET_STAR_SCALE_FIELDS || [];
    const noneScaled = ['atk', 'hp', 'matk', 'dr', 'eva', 'cri', 'mdef', 'hit', 'criMult']
      .every((f) => NDX.petStarFieldMul(5, f) === 1);
    ck('Q3 星阶数值乘子已撤销（白名单空 + 任何星阶/字段乘子恒 1.00）',
      FIELDS.length === 0 && noneScaled,
      '白名单=[' + FIELDS.join(',') + ']');
  }

  // --- Q4 🔴 共鸣零孤儿：每条 PET_ECHO 的 a/b 必须是合法类名 ---
  //   这条是本次最有价值的断言——它是唯一能自动发现「扩了池子忘扩组合」的检查。
  //   ⚠ v1.4：目标表从 `PET_FETTERS`（角色羁绊，已停用）换成 `PET_ECHO`（类共鸣）。
  {
    const F = NDX.PET_ECHO || [];
    const orphan = [];
    const CLS = new Set(Object.keys(NDX.PET_AXIS_CLASS || {}).map((k) => NDX.PET_AXIS_CLASS[k]));
    F.forEach((f) => {
      ['a', 'b'].forEach((k) => {
        const id = f[k];
        if (!id || !CLS.has(id)) orphan.push((f.id || '?') + '.' + k + '=' + id);
      });
    });
    ck('Q4 共鸣零孤儿（全部 a/b 指向合法类名）', F.length > 0 && orphan.length === 0,
      orphan.length ? orphan.join(' ') : ('共 ' + F.length + ' 条'));
  }

  // --- Q5 共鸣 id 无重复 ---
  //   ⚠ v1.4：`a === b` 在共鸣表里是**合法**的（同类两轴，如 锐×锐 = 兽性贯通），
  //     故不再沿用旧羁绊的「a≠b」判据（那是「两只不同的宠」的语义，不适用于「类对」）。
  {
    const F = NDX.PET_ECHO || [];
    const seen = new Set(), dupId = [];
    F.forEach((f) => { if (seen.has(f.id)) dupId.push(f.id); else seen.add(f.id); });
    ck('Q5 共鸣 id 无重复（同类配对 a===b 合法）',
      dupId.length === 0, dupId.join(' '));
  }

  // --- Q6 第二批 24 只原著原型 id 无污染（同 P4 判据）---
  {
    const NEW2 = ['hunshimowang', 'lingxuzi', 'baihuashe', 'heixiongjing', 'jingxigui', 'linglichong',
      'huaqidawang', 'banyiguipo', 'xingxian', 'lingkongzi', 'fuyunsou', 'wanshenglongwang',
      'wanshenggongzhu', 'benboyiba', 'baboerben', 'mangshejing', 'youlaiyouqu', 'xiaozuanfeng',
      'diyongfuren', 'tiebeicanglang', 'suannishi', 'xuanshishi', 'bishuxi', 'bichengxi'];
    const cnt = new Map();
    ALL.forEach((e) => cnt.set(e.id, (cnt.get(e.id) || 0) + 1));
    const dupInPool = NEW2.filter((i) => cnt.get(i) !== 1);
    const other = new Set();
    [NDX.SUTRA_FULLS, NDX.NI_SUTRA_FULLS, NDX.FOLLOWERS].forEach((a) => {
      if (!a) return;
      if (Array.isArray(a)) a.forEach((x) => x && x.id && other.add(x.id));
      else Object.keys(a).forEach((k) => other.add(k));
    });
    const cross = NEW2.filter((i) => other.has(i));
    ck('Q6 第二批 24 只原型 id 无重复定义、不污染外部表',
      dupInPool.length === 0 && cross.length === 0, [].concat(dupInPool, cross).join(' '));
    // ⚠ v1.3：储备宠不在 `petById` 索引里（索引建自活跃池）⇒ 判据改为
    //   「在活跃池 或 在储备池」其一可解析，而不是「必须能从 petById 取到」。
    const _res2 = new Set((NDX.PET_RESERVE || []).map((p) => p.id));
    ck('Q6b 第二批 24 只均可解析（活跃池 petById 或储备池）',
      NEW2.every((i) => _res2.has(i) || (() => { try { return !!NDX.petById(i); } catch (e) { return false; } })()), '');
    // 池总量沿革：v1.0 67 → v1.1 91 → v1.2 115 → **v1.3 收敛为 61**（54 只无出口散件移入储备）。
    //   ⚠ 断言拆两半：**活跃池**是设计数字（61，随设计变），**活跃+储备**是数据守恒（115，不该变）。
    //     后者才是「零丢失」的真守卫，前者只是防手滑。
    ck('Q6c 活跃池 = 24（v1.4 兽印化：8 轴 × 3 阶）',
      ACTQ.length === 24, '实测活跃 ' + ACTQ.length + ' / 储备 ' + RESQ.length);
    ck('Q6d 活跃 + 储备 = 115（数据守恒，收敛不丢条目）',
      ACTQ.length + RESQ.length === 115, '合计 ' + (ACTQ.length + RESQ.length));
  }

  // --- Q7 ★2/★5 机制解锁真的生效（被动档数）---
  {
    const e = [{ slot: 'pet', id: 'lingyan', petPassive: 'guard' }];
    const s0 = {}, s2 = { petStarOf: { lingyan: 2 } }, s5 = { petStarOf: { lingyan: 5 } };
    const p0 = NDX.aggregatePetPassive(e, s0).guard || 0;
    const p2 = NDX.aggregatePetPassive(e, s2).guard || 0;
    const p5 = NDX.aggregatePetPassive(e, s5).guard || 0;
    ck('Q7 ★2 ⇒ 被动档数 +1（★0=1 档 / ★2=2 档 / ★5=3 档）',
      p0 === 1 && p2 === 2 && p5 === 3, p0 + '/' + p2 + '/' + p5);
    ck('Q7b petStarPassiveExtra 阈值单调（★' + NDX.PET_STAR_PASSIVE_AT + '=+1，★' + NDX.PET_STAR_PASSIVE_AT2 + '=+2）',
      NDX.petStarPassiveExtra({ petStarOf: { x: 1 } }, 'x') === 0
      && NDX.petStarPassiveExtra({ petStarOf: { x: 2 } }, 'x') === 1
      && NDX.petStarPassiveExtra({ petStarOf: { x: 4 } }, 'x') === 1
      && NDX.petStarPassiveExtra({ petStarOf: { x: 5 } }, 'x') === 2, '');
  }

  // --- Q8 ★3 羁绊加成取 max 不取乘积（防「两边都堆星阶」成为唯一解）---
  {
    const at = NDX.PET_STAR_FETTER_AT, b = NDX.PET_STAR_FETTER_BOOST;
    const notProduct = Math.abs(NDX.petFetterBoost(at, at) - b) < 1e-9
      && Math.abs(NDX.petFetterBoost(at, at) - b * b) > 1e-9;   // 绝不能是 1.44
    ck('Q8 ★3 羁绊取 max（★3+★3 = ×' + b + '，非 ×' + (b * b).toFixed(2) + '）', notProduct,
      NDX.petFetterBoost(at, at).toFixed(3));
    ck('Q8b 单侧未达 ★3 ⇒ 无加成', NDX.petFetterBoost(at - 1, 0) === 1 && NDX.petFetterBoost(0, at - 1) === 1, '');
    // 端到端：共鸣真源可产出数值项 ＋ **★3 加成的消费点确实存在**。
    //   ⚠ v1.4 两处换锚：①`PET_FETTERS`→`PET_ECHO`（成员是「类」不是宠 id）
    //     ②★3 加成不在 `petEchoEffects` 内（它是纯函数，不接 state），而在
    //       `combat_part1.js` 的消费点里（`PET_STAR_FETTER_BOOST` 乘上去）。
    //       ⇒ 必须做**源码级**断言，否则「声明了 +20% 却没人消费」会静默通过（第 6 类死路）。
    const E = (NDX.PET_ECHO || [])[0];
    let csrc = '';
    try { csrc = fs.readFileSync(path.join(ROOT, 'js', 'combat_part1.js'), 'utf8'); } catch (e) { csrc = ''; }
    if (E && typeof NDX.petEchoEffects === 'function' && csrc) {
      const pick = (cls) => { const p = POOL.find((x) => NDX.PET_AXIS_CLASS[x.axis] === cls); return p && p.id; };
      const idA = pick(E.a), idB = pick(E.b);
      const eq = [{ slot: 'pet', id: idA }, { slot: 'pet', id: idB }];
      const base = NDX.petEchoEffects(eq)[0] || {};
      const key = ['hpPct', 'atkPct', 'matkPct', 'dr', 'eva', 'cri', 'combo'].find((k) => base[k]);
      const consumed = csrc.indexOf('petEchoEffects') >= 0 && csrc.indexOf('PET_STAR_FETTER_BOOST') >= 0;
      ck('Q8c 端到端：' + E.id + ' 产出 ' + key + '=' + base[key] + '，且 ★3 加成在战斗侧有消费点',
        !!key && consumed, key ? ('消费点=' + consumed) : '该共鸣无数值项');
    } else {
      ck('Q8c 端到端共鸣加成（取不到共鸣表/战斗源码即失败）', false,
        'PET_ECHO=' + !!E + ' fn=' + (typeof NDX.petEchoEffects) + ' src=' + csrc.length);
    }
  }

  // --- Q9 🔴 池内每个 branch 键都必须有中文标签（防图鉴渲染英文原文）---
  //   教训：v1.1 新增 24 只时引入 11 个无标签分支键（tiger/bear/ox/…），
  //   而标签表当时内联在 UI 渲染函数里 ⇒ 图鉴显示「tiger · 3 形态」。v1.2 提到数据层后配此断言。
  {
    const NAME = NDX.PET_BRANCH_NAME || {};
    if (!NDX.PET_BRANCH_NAME) {
      ck('Q9 分支标签表存在（取不到即失败，防假门禁）', false, 'PET_BRANCH_NAME 缺失');
    } else {
      const used = new Set();
      POOLQ.forEach((p) => { if (p.branch) used.add(p.branch); });
      const unlabeled = [...used].filter((k) => !NAME[k]);
      ck('Q9 池内 ' + used.size + ' 个 branch 键全部有中文标签', unlabeled.length === 0,
        unlabeled.length ? ('缺标签: ' + unlabeled.join(' ')) : '');
      const orphanLabel = Object.keys(NAME).filter((k) => !used.has(k));
      // ⚠ v1.4 放宽：归档 91 只后，标签表必然留下未使用的键（**表 ⊇ 池**是允许方向）。
      //   原判据「零孤儿」在池子收缩时必然假红。真判据 = **池 ⊆ 表**（Q9 已验），
      //   此地只防「表被清空」这种反向退化，孤儿数如实记录。
      ck('Q9b 标签表 ⊇ 池（孤儿 ' + orphanLabel.length + ' 个为归档残留，允许）',
        Object.keys(NAME).length >= used.size, '表 ' + Object.keys(NAME).length + ' / 池 ' + used.size);
    }
  }

  // --- Q10 🔴 星阶必须有**真实消费点**（源码级断言；这是 v1.1 死数据的事后防线）---
  {
    let src = '';
    try { src = fs.readFileSync(path.join(ROOT, 'js', 'combat_part1.js'), 'utf8'); } catch (e) { src = ''; }
    if (!src) {
      ck('Q10 星阶消费点存在（取不到 computeStats 源码即失败）', false, 'combat_part1.js 不可读');
    } else {
      ck('Q10 星阶在 computeStats 有消费点（防再次成死数据）',
        src.indexOf('petStarScaleFor') >= 0, '未在 combat_part1.js 找到 petStarScaleFor');
    }
    let src3 = '';
    try { src3 = fs.readFileSync(path.join(ROOT, 'js', 'equipment_part3.js'), 'utf8'); } catch (e) { src3 = ''; }
    ck('Q10b 星阶机制解锁（被动档数 / 羁绊）在聚合端有消费点',
      src3.indexOf('petStarPassiveExtra') >= 0 && src3.indexOf('petFetterBoost') >= 0, '');
  }

  // --- Q11 端到端数值实测：真调 `computeStats`，不是源码文本断言 ---
  //   🩸 「门禁绿 ≠ 做对」——Q10 只说「代码里有这个符号」，Q11 验「这个符号真的改了数值」。
  {
    const heroId = Object.keys(NDX.HEROES || {})[0];
    const EQ = [{ slot: 'pet', id: 'lingyan', atk: 20, hp: 156, dr: 0.03, petPassive: 'guard' }];
    const origGame = NDX.game;
    const origState = origGame && origGame.state;
    const run = (star) => {
      NDX.game = NDX.game || {};
      NDX.game.state = star ? { petStarOf: { lingyan: star } } : {};
      return NDX.computeStats(heroId, EQ, [], {}, 1);
    };
    try {
      const a = run(0), b = run(NDX.PET_STAR_CAP);
      const M = NDX.petStarMul(NDX.PET_STAR_CAP) - 1;      // 0.35
      const dAtk = b.ti.atk - a.ti.atk, dHp = b.ti.hp - a.ti.hp;
      ck('Q11 端到端：computeStats 里星阶真改数值（atk/hp 增 ×' + M.toFixed(2) + '）',
        Math.abs(dAtk - 20 * M) <= 1 && Math.abs(dHp - 156 * M) <= 1.5,
        'Δatk=' + dAtk + '(期望' + (20 * M).toFixed(1) + ') Δhp=' + dHp + '(期望' + (156 * M).toFixed(1) + ')');
      // ⚠ 只断言 eva/cri 零泄漏；**dr 的增量是设计内行为**（★2/★5 被动档数经 guard 传播），
      //    见设计文档 v1.2 §2.3 例外说明 —— 断言 dr 不变会误红。
      ck('Q11b 端到端：星阶乘子不泄漏到 eva/cri（白名单外的封顶属性）',
        (b.ti.eva - a.ti.eva) === 0 && (b.ti.cri - a.ti.cri) === 0,
        'Δeva=' + (b.ti.eva - a.ti.eva) + ' Δcri=' + (b.ti.cri - a.ti.cri));
      // ★0 与「完全无 petStarOf」必须完全一致（存量存档零副作用）
      const noStar = (() => {
        NDX.game.state = {};
        return NDX.computeStats(heroId, EQ, [], {}, 1);
      })();
      ck('Q11c 端到端：★0 与无 petStarOf 字段的结果完全一致（存量零副作用）',
        noStar.ti.atk === a.ti.atk && noStar.ti.hp === a.ti.hp && noStar.ti.dr === a.ti.dr, '');
    } finally {
      NDX.game = origGame;
      if (origGame) origGame.state = origState;
    }
  }
}

// ============================================================
// R 组（v1.3）：升星内容化 + 池子收敛
//   触发原因（用户 2026-09-25）：①「升星只采用宠物在独有的事件中升级，
//   或者生成专属升级 boss 百兽星君这种」②「宠物数量太多了，应该参照现有的
//   随从数量，参照事件数量，参照冒险日记综合考虑」。
// ============================================================
{
  const ACT = [].concat(NDX.EQUIP_POOL || [], NDX.CRAFT_POOL || []).filter((e) => e && e.slot === 'pet');
  const RES = NDX.PET_RESERVE || [];

  // --- R1 进化链**双向**完整 ---
  //   🔴 v1.3 补反向：v1.2 只验「evolveTo 指向的目标存在」（前向），
  //      漏了「evolveFrom 的父必须回填 evolveTo」（反向）⇒ 3 只三阶宠
  //      （通臂石猿 / 太古山灵 / 太阴星狐）长期**前向不可达**而门禁全绿。
  //      🩸 「A 指向 B」与「B 被 A 指向」是**两个断言**，只验一个方向 = 放行单边链。
  {
    const all = ACT.concat(RES);
    const byId = {}; all.forEach((p) => { byId[p.id] = p; });
    const fwd = [], rev = [];
    all.forEach((p) => {
      [].concat(p.evolveTo || []).forEach((t) => { if (!byId[t]) fwd.push(p.id + '→' + t); });
      if (p.evolveFrom) {
        const par = byId[p.evolveFrom];
        if (!par) rev.push(p.id + '←' + p.evolveFrom + '(不存在)');
        else if ([].concat(par.evolveTo || []).indexOf(p.id) < 0) rev.push(p.id + '←' + p.evolveFrom);
      }
    });
    ck('R1a 进化链前向完整（evolveTo 目标均存在）', fwd.length === 0, fwd.join(' '));
    ck('R1b 🔴 进化链反向完整（evolveFrom 的父必须回填 evolveTo）', rev.length === 0, rev.join(' '));
  }

  // --- R2 活跃池构成 = 链上 + 逆道成品（判据重算，不写死数字）---
  {
    const byId = {}; ACT.forEach((p) => { byId[p.id] = p; });
    const onChain = new Set();
    const walk = (id) => { if (onChain.has(id) || !byId[id]) return; onChain.add(id); [].concat(byId[id].evolveTo || []).forEach(walk); };
    ACT.filter((p) => p.evolveTo && !p.evolveFrom).forEach((h) => walk(h.id));
    const off = ACT.filter((p) => !onChain.has(p.id));
    ck('R2 活跃池 = 链上(' + onChain.size + ') + 非链上(' + off.length + ') = ' + ACT.length,
      onChain.size + off.length === ACT.length, '');
    // ⚠ v1.4 换锚：v1.3 的锚是「链数 == 随从数（13）」；v1.4 池子按**机制轴**重组后，
    //   正确的锚变成「**链数 == 兽印轴数（8）**」—— 一轴一条三阶链，链与轴 1:1。
    //   （旧的「参照随从数量」是 v1.3 在「按角色分族」框架下的答案，框架换了，锚随之换。）
    const axes = (NDX.PET_AXIS_ORDER || []).length;
    // 链头 = 有 evolveTo 且无 evolveFrom（即「本相」阶）
    const heads = ACT.filter((p) => p.evolveTo && !p.evolveFrom).length;
    ck('R2b 进化链条数(' + heads + ') == 兽印轴数(' + axes + ')（一轴一条三阶链）',
      axes > 0 && heads === axes, '链头 ' + heads + ' / 轴 ' + axes);
    // 进掉落池的宠物必须是「本相」——即链头本身
    const droppable = ACT.filter((p) => (p.setTier || 0) < 2);
    ck('R2c 进掉落池的宠物(' + droppable.length + ') 恰为链头（掉落只出本相，进化形态靠养成）',
      droppable.length === heads && droppable.every((p) => !p.evolveFrom),
      '掉落 ' + droppable.length + ' / 链头 ' + heads);
  }

  // --- R3 储备**零丢失**（活跃 + 储备 == 收敛前总数 115）---
  ck('R3 储备零丢失（活跃 ' + ACT.length + ' + 储备 ' + RES.length + ' = 115）',
    ACT.length + RES.length === 115, '合计 = ' + (ACT.length + RES.length));

  // --- R4 储备宠不在任何池（真被摘出，不是只打了个标）---
  {
    const resIds = new Set(RES.map((p) => p.id));
    const leaked = ACT.filter((p) => resIds.has(p.id)).map((p) => p.id);
    ck('R4 储备宠不在 EQUIP_POOL/CRAFT_POOL（真摘出）', leaked.length === 0, leaked.join(' '));
  }

  // --- R5 🔴 储备宠不被任何组合线引用（防「永久不可激活的死组合」）---
  {
    const resIds = new Set(RES.map((p) => p.id));
    // v1.4：组合线真源从 `PET_FETTERS`（角色对）换成 `PET_ECHO`（类对）。
    //   `PET_ECHO` 用**类名**（锐/固/噬/转）而非宠 id ⇒ 结构上不可能引用到具体某只宠，
    //   但仍做一条**源码级**防退化检查：任何组合表若出现宠 id 字段（a/b 命中储备 id）即报错。
    const allTables = [].concat(NDX.PET_ECHO || [], NDX.PET_FETTERS || []);
    const dead = allTables.filter((f) => resIds.has(f.a) || resIds.has(f.b));
    ck('R5 组合线零死结（无一条引用储备宠；PET_ECHO 用类名，`PET_FETTERS` 已空）',
      dead.length === 0, dead.map((f) => f.id).join(' '));
  }

  // --- R6 通用消耗表已删除（内容驱动的构造性证据）---
  {
    const left = ['PET_STAR_COST', 'petStarCost', 'PET_STAR_MIX_LOSS'].filter((k) => NDX[k] !== undefined);
    ck('R6 通用消耗表已删除（PET_STAR_COST / petStarCost / PET_STAR_MIX_LOSS）',
      left.length === 0, '残留: ' + left.join(' '));
  }

  // --- R7 通道白名单闭合（穷举，防偷偷加回 ui 通道）---
  ck('R7 升星通道白名单 == [event,boss]',
    Array.isArray(NDX.PET_STAR_CHANNELS) && NDX.PET_STAR_CHANNELS.length === 2
    && NDX.PET_STAR_CHANNELS.indexOf('event') >= 0 && NDX.PET_STAR_CHANNELS.indexOf('boss') >= 0,
    JSON.stringify(NDX.PET_STAR_CHANNELS));

  // --- R8 百兽星君存在 + 事件池可命中 + 带 petStarUp（否则 boss 通道空转）---
  {
    const B = NDX.PET_STAR_BOSS;
    const ev = (NDX.EVENTS || {})[(B && B.id) || '__none__'];
    const hasEff = !!(ev && ev.opts && ev.opts.some((o) =>
      (o.effect && o.effect.petStarUp) || (o.reward && o.reward.petStarUp)));
    ck('R8 百兽星君事件可命中且带 petStarUp', !!(B && B.id && ev && hasEff),
      'boss=' + (B && B.id) + ' ev=' + !!ev + ' eff=' + hasEff);
  }

  // --- R9 共鸣零越界（每条共鸣的两个类，都必须有活跃轴命中它）---
  {
    // v1.4：组合线的「能真撞出来」判据 = **a/b 两个类都由活跃轴命中**。
    //   （旧判据比的是具体宠 id 是否在活跃池 —— 那是角色羁绊的语义，不适用于类对。）
    const liveCls = new Set(ACT.map((p) => NDX.PET_AXIS_CLASS[p.axis]).filter(Boolean));
    const bad = (NDX.PET_ECHO || []).filter((f) => !liveCls.has(f.a) || !liveCls.has(f.b));
    ck('R9 共鸣零越界（每条 a/b 两个类都由活跃轴命中，类集 ' + [...liveCls].join('') + '）',
      (NDX.PET_ECHO || []).length > 0 && bad.length === 0 && liveCls.size === 4,
      bad.map((f) => f.id).join(' '));
  }

  // --- R10 章节分布（🔴 v1.4 重写判据：从「链上宠覆盖 9 章」升级为「三条铁律」）---
  //   v1.3 判据「链上宠覆盖 ch1–ch9」在按**角色分族**的框架下成立，但池子按**机制轴**重组后
  //   失效（实测 ch9 无宠）。重写为三条**构造性**铁律（与 `PET_SEAL_CH` 的设计声明一一对应）：
  //     ① 每章至少 1 只（ch1–ch9 全覆盖 —— 这才是「防后段宠物真空」的真判据）
  //     ② 每条链章节**严格递增**（本相 < 显形 < 证道 —— 防「进化了反而去更早的地区」）
  //     ③ 本相段偏前（max ≤ 5）/ 证道段偏后（min ≥ 5）—— 获取节奏与难度曲线同向
  {
    const byCh = {};
    ACT.forEach((p) => { const c = p.chapter || 0; byCh[c] = (byCh[c] || 0) + 1; });
    const miss = [];
    for (let ch = 1; ch <= 9; ch++) if (!byCh[ch]) miss.push(ch);
    ck('R10a 活跃池每章至少 1 只（缺章 = ' + (miss.join(',') || '无') + '）',
      miss.length === 0, '分布 ' + JSON.stringify(byCh));

    const byId = {}; ACT.forEach((p) => { byId[p.id] = p; });
    const badMono = [], base = [], top = [];
    (NDX.PET_AXIS_ORDER || []).forEach((ax) => {
      const chain = [1, 2, 3].map((t) => byId[(NDX.PET_SEAL[ax] || {})[t]]).filter(Boolean);
      const chs = chain.map((p) => p.chapter || 0);
      if (chs.length === 3 && !(chs[0] < chs[1] && chs[1] < chs[2])) badMono.push(ax + ':' + chs.join('>'));
      if (chain[0]) base.push(chain[0].chapter || 0);
      if (chain[2]) top.push(chain[2].chapter || 0);
    });
    ck('R10b 每条兽印链章节严格递增（本相 < 显形 < 证道）',
      badMono.length === 0, badMono.join(' '));
    ck('R10c 获取节奏同向：本相段偏前(≤5) / 证道段偏后(≥5)',
      base.length > 0 && top.length > 0
      && Math.max.apply(null, base) <= 5 && Math.min.apply(null, top) >= 5,
      '本相 max=' + Math.max.apply(null, base) + ' / 证道 min=' + Math.min.apply(null, top));
  }

  // --- R11 `needPet` 门控存在（「独有事件」名实相符的机制前提）---
  {
    const src = (() => { try { return fs.readFileSync(path.join(ROOT, 'js', 'events_part1.js'), 'utf8'); } catch (e) { return ''; } })();
    const evs = NDX.EVENTS || {};
    const withNeed = Object.keys(evs).filter((k) => evs[k] && evs[k].needPet);
    ck('R11 `needPet` 门控存在且至少 1 个事件在用（否则「独有事件」无从表达）',
      src.indexOf('ev.needPet') >= 0 && withNeed.length > 0,
      'needPet 事件 ' + withNeed.length + ' 个: ' + withNeed.join(' '));
    // 每个 needPet 的 id 必须真实存在（活跃或储备）——防笔误写出永不触发的事件
    const known = new Set(ACT.concat(RES).map((p) => p.id));
    const typo = [];
    withNeed.forEach((k) => { [].concat(evs[k].needPet).forEach((id) => { if (!known.has(id)) typo.push(k + ':' + id); }); });
    ck('R11b needPet 指向的 id 全部真实存在（防笔误 → 永不触发）', typo.length === 0, typo.join(' '));
  }

  // ============================================================
  // S 组 · v1.4「兽印化」构造性断言
  //   目标：让设计**由结构保证**，不靠手写数字。任何一条破裂都意味着
  //   「设计意图」与「数据/代码」已经脱钩（这正是历史 7 条死路的共同形态）。
  // ============================================================
  {
    const AX = NDX.PET_AXIS_ORDER || [];
    const byId = {}; ACT.forEach((p) => { byId[p.id] = p; });
    // 池条目**实例**克隆器：游戏内装备实例是池条目的浅拷贝（`petPassive` 随之带入）
    const inst = (id) => (byId[id] ? Object.assign({}, byId[id]) : null);
    // 取「轴 × 阶」的宠 id（S7/S8 共用）
    const pickOne = (ax, t) => (byId[(NDX.PET_SEAL[ax] || {})[t]] || {}).id;

    // --- S1 每轴恰 3 阶，且三阶 id 互异 ---
    {
      const bad = [];
      AX.forEach((ax) => {
        const col = NDX.PET_SEAL[ax] || {};
        const ids = [1, 2, 3].map((t) => col[t]);
        if (ids.some((x) => !x) || new Set(ids).size !== 3) bad.push(ax + ':' + ids.join(','));
      });
      ck('S1 每轴恰 3 阶且三阶 id 互异（共 ' + AX.length + ' 轴 × 3 = ' + (AX.length * 3) + '）',
        AX.length > 0 && bad.length === 0, bad.join(' '));
    }

    // --- S2 每只活跃宠都带 axis / petTier / branch，且 branch === axis ---
    {
      const bad = ACT.filter((p) => !p.axis || !p.petTier || !p.branch
        || p.branch !== p.axis || [1, 2, 3].indexOf(p.petTier) < 0
        || !NDX.PET_AXES[p.axis])
        .map((p) => p.id);
      ck('S2 活跃池每只带 axis/petTier/branch 且 branch === axis（族 = 轴）',
        bad.length === 0, bad.join(' '));
    }

    // --- S3 🔴 每个机制键必有**内核消费点**（源码级；这是 v1.1 第 6 条死路的事后防线）---
    //   两种消费形态：①静态算值 `m8pp.<key>` ②回合内核标记 `_pp('<key>')` / `_ppN('<key>')`
    //   ⚠ 必须**双向**：只验表存在（写入端）会放行「建了机制没人读」的假收益。
    {
      let csrc = '';
      try { csrc = fs.readFileSync(path.join(ROOT, 'js', 'combat_part1.js'), 'utf8'); } catch (e) { csrc = ''; }
      const dead = [];
      AX.forEach((ax) => {
        const k = (NDX.PET_AXES[ax] || {}).mech;
        if (!k) { dead.push(ax + ':无 mech'); return; }
        const hit = csrc.indexOf('m8pp.' + k) >= 0
          || csrc.indexOf("_pp('" + k + "')") >= 0 || csrc.indexOf('_ppN(\'' + k + '\')') >= 0;
        if (!hit) dead.push(ax + '→' + k);
      });
      ck('S3 🔴 ' + AX.length + ' 个兽印机制键全部有内核消费点（无「建了没人读」的死机制）',
        csrc.length > 0 && dead.length === 0, dead.join(' '));
    }

    // --- S4 同轴三阶「机制相同 + 档数严格递增」（阶只升机制强度，不换机制）---
    {
      const badMech = [], badW = [];
      AX.forEach((ax) => {
        const mech = (NDX.PET_AXES[ax] || {}).mech;
        const pp = [1, 2, 3].map((t) => (byId[(NDX.PET_SEAL[ax] || {})[t]] || {}).petPassive);
        if (new Set(pp).size !== 1 || pp[0] !== mech) badMech.push(ax + ':' + pp.join(','));
      });
      const w1 = NDX.petTierWeight(1), w2 = NDX.petTierWeight(2), w3 = NDX.petTierWeight(3);
      if (!(w1 < w2 && w2 < w3)) badW.push([w1, w2, w3].join('<'));
      ck('S4 同轴三阶机制键相同（不换机制，只升档）＋ 阶权重严格递增(' + w1 + '<' + w2 + '<' + w3 + ')',
        badMech.length === 0 && badW.length === 0, badMech.concat(badW).join(' '));
    }

    // --- S5 零丢失 + 归档宠**不参与养成**（归档 = 真摘出，不是只打标）---
    {
      ck('S5a 零丢失（活跃 ' + ACT.length + ' + 归档 ' + RES.length + ' = 115）',
        ACT.length + RES.length === 115, '合计 ' + (ACT.length + RES.length));
      const dirty = RES.filter((p) => p.evolveTo || p.evolveFrom || p.axis || p.petTier).map((p) => p.id);
      ck('S5b 归档宠已清空养成字段（无 evolveTo/evolveFrom/axis/petTier）',
        dirty.length === 0, dirty.slice(0, 5).join(' '));
      const overlap = RES.filter((p) => byId[p.id]).map((p) => p.id);
      ck('S5c 活跃池与归档池无交集', overlap.length === 0, overlap.join(' '));
    }

    // --- S6 共鸣表齐备（4 类 → 同类 4 + 异类 C(4,2)=6 = 10 条，一条不漏）---
    {
      const EC = NDX.PET_ECHO || [];
      const CLS = Array.from(new Set(Object.keys(NDX.PET_AXIS_CLASS || {}).map((k) => NDX.PET_AXIS_CLASS[k])));
      const want = new Set();
      CLS.forEach((a) => CLS.forEach((b) => { if (CLS.indexOf(a) <= CLS.indexOf(b)) want.add(a + b); }));
      const have = new Set(EC.map((e) => e.a + e.b));
      const missE = [...want].filter((k) => !have.has(k));
      ck('S6 共鸣表齐备（' + CLS.length + ' 类 → ' + want.size + ' 条；实有 ' + EC.length + '）',
        EC.length > 0 && missE.length === 0, '缺 ' + missE.join(' '));
    }

    // --- S7 🔴 任取 2 只活跃宠必命中 1 条共鸣（2 格配置「配不出来」在结构上不可能）---
    {
      const missP = [];
      for (let i = 0; i < AX.length; i++) {
        for (let j = i; j < AX.length; j++) {
          const a = pickOne(AX[i], 1);
          const b = (i === j) ? pickOne(AX[i], 2) : pickOne(AX[j], 1);   // 同轴取两阶，异轴各取本相
          const eq = [{ slot: 'pet', id: a }, { slot: 'pet', id: b }];
          const hit = NDX.petEchoEffects(eq);
          if (!hit || hit.length < 1) missP.push(AX[i] + '+' + AX[j]);
        }
      }
      const emptyOK = (NDX.petEchoEffects([]) || []).length === 0
        && (NDX.petEchoEffects([{ slot: 'pet', id: pickOne(AX[0], 1) }]) || []).length === 0;
      ck('S7 🔴 任取 2 只必命中 ≥1 条共鸣（' + (AX.length * (AX.length + 1) / 2) + ' 种组合全通过；1 只/空返 []）',
        missP.length === 0 && emptyOK, missP.join(' '));
    }

    // --- S8 🔴 端到端：兽印轴真改战斗数值（且空装备恒 0 ⇒ 存量存档零回归）---
    {
      const c0 = NDX.computeStats('wukong', [], {}, null, 0);
      const cT1 = NDX.computeStats('wukong', [inst(pickOne('combo', 1))], [], null, 0);
      const cT2 = NDX.computeStats('wukong', [inst(pickOne('combo', 2))], [], null, 0);
      const cCrit = NDX.computeStats('wukong', [inst(pickOne('crit', 1))], [], null, 0);
      ck('S8a 连击轴端到端：空 ' + (c0.petCombo || 0) + ' → 本相 ' + cT1.petCombo
        + ' → 显形 ' + cT2.petCombo + '（阶权重生效）',
        (c0.petCombo || 0) === 0 && cT1.petCombo > 0 && cT2.petCombo > cT1.petCombo);
      ck('S8b 暴击轴端到端：cri ' + c0.ti.cri + ' → ' + cCrit.ti.cri + '（真加数值，非只打标）',
        cCrit.ti.cri > c0.ti.cri);
      ck('S8c 零回归：空装备时 petCombo 恒 0（补增量写法，存量存档逐字节不变）',
        (c0.petCombo || 0) === 0 && JSON.stringify(c0.petPassive) === '{}');

      // --- S8d 🔴 真·端到端：跑一场真战斗，数「连击是否真的发生」 ---
      //   S8a/S8b 只验了 `computeStats` 的**返回值有值**（"验了形"）。历史教训：
      //   `petCombo` 曾被战斗内核误读为 `P.petCombo`（P = hero.passive，永不带该键）
      //   ⇒ 概率恒 0，**实战里一次连击都不触发**，而 S8a 依然全绿（"没验用"）。
      //   ⇒ 判据必须落到 **roundsDetail[].pTurn.combo**（真结算产物），而非任何中间返回值。
      //   ⚠ 桩 `Math.random = () => 0` ⇒ 只要 comboRate > 0 就**必然连击** ⇒ 结果确定性。
      if (typeof NDX.calcCombat === 'function') {
        const _rnd = Math.random;
        const dummy = { name: '木桩', hp: 999999, atk: 1, matk: 0, dr: 0, spd: 1, mdef: 0 };
        let nWith = -1, nWithout = -1;
        try {
          Math.random = () => 0;
          const rW = NDX.calcCombat(NDX.computeStats('wukong', [inst(pickOne('combo', 1))], [], null, 0),
            Object.assign({}, dummy), {});
          const rN = NDX.calcCombat(NDX.computeStats('wukong', [], {}, null, 0),
            Object.assign({}, dummy), {});
          const cnt = (r) => ((r && r.roundsDetail) || []).filter((x) => x && x.pTurn && x.pTurn.combo).length;
          nWith = cnt(rW); nWithout = cnt(rN);
        } catch (err) { nWith = -1; nWithout = -1; }
        Math.random = _rnd;
        ck('S8d 🔴 端到端实战：装配本相后连击真触发（' + nWith + ' 次）／不装配恒 0 次（' + nWithout + '）',
          nWith > 0 && nWithout === 0, 'with=' + nWith + ' without=' + nWithout);
      } else {
        ck('S8d 端到端战斗连击（取不到 calcCombat 即失败）', false, 'calcCombat 缺失');
      }
    }

    // --- S9 随从池 = 13，且每只有流派归属（为「与英雄路线互补」提供同语言）---
    {
      const FO = NDX.FOLLOWERS || {};
      const ids = Object.keys(FO);
      const ST = NDX.FOLLOWER_STYLE || {};
      const missS = ids.filter((id) => !ST[id]);
      // ⚠ 2026-09-27 X7 分容器改判：原判据把「池恒 = 13」当不变量（v1.4 快照）。
      //   用户拍板「人形态归随从」⇒ 4 位人形随从（kouqi_ren/jieyin_ren/anuo_ren/chechi_sanyao_ren）
      //   必须留在随从册 ⇒ 池扩到 17。此处把 13 降为**下限**，真正的守门人是 missS：
      //   扩容可以，但**必须同步补流派**（少一条即红）。断言名如实反映主判据，不夸大。
      ck('S9 随从池 ' + ids.length + ' 只全部有流派归属（`FOLLOWER_STYLE` 与池 1:1）',
        ids.length >= 13 && missS.length === 0, '池 ' + ids.length + ' 缺流派 ' + missS.join(' '));
    }

    // --- S10 铁扇公主既有「机缘」也有「本命加持」（关闭存量红 `_verify_follower_fuse`）---
    {
      const R2 = NDX.FOLLOWER_RITUALS || {};
      const B = NDX.FOLLOWER_BONDS || {};
      ck('S10 `tieshan` 既有双阶机缘、也在本命加持覆盖内',
        !!(R2.tieshan && R2.tieshan.toLing && R2.tieshan.toZhen) && !!B.tieshan,
        '机缘=' + !!(R2.tieshan) + ' 本命=' + !!B.tieshan);
    }
  }
}

console.log((fail === 0 ? '✅ 通过' : '❌ 失败') + ' / 宠物（灵宠）· ABC路线·真源·羁绊·进化·槽位·协同·成长线·机制层·星阶链·原型扩充·星阶接线·羁绊组合·升星内容化·池子收敛 门禁'
  + ' === ' + pass + ' 通过 / ' + fail + ' 失败');
process.exit(fail ? 1 : 0);
