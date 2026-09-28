// _audit_pet_channels.js — S06 宠物 · §⑤-2 配方可达性门禁（P0）+ §⑤-5 单一来源守卫 + §⑤-1/§⑤-3 可达性报告
//
// 断言（会判红）：
//   A 组 §⑤-2：任意 state 下 `availableRecipes` 返回的**每一项**都必须能被 `craftById` 解析
//              —— 否则玩家看到「可合成」、点下去静默失败（§1.7-C），且 _autoCraft 会空转 100 次。
//              含**反证**：RECIPES 中确实存在 out 不可解析的死配方（证明判据非恒真）。
//   B 组 §⑤-5：`equipment_part3.js` 内不得存在重复 NDX 定义
//              —— 原 L167-257 / L271-361 逐字节重复块（后写覆盖前写）已于 S03 轮消掉，此处锁死禁回归。
// 报告（不判红，仅供 §⑤-1/§⑤-3 待办可视化）：8 只证道宠 / 2 只缺配方显形宠的通道实况。
//
// 运行：node scripts/_audit_pet_channels.js（已登记进 _run_all_gates.js）
const path = require('path'), fs = require('fs');
const ROOT = path.join(__dirname, '..');
Object.defineProperty(global, 'window', { value: global, writable: true, configurable: true });
global.location = { href: 'http://client', search: '' };
Object.defineProperty(global, 'navigator', { value: { userAgent: 'node', platform: 'linux' }, writable: true, configurable: true });
const _ls = {};
global.localStorage = {
  get length() { return Object.keys(_ls).length; }, key(i) { return Object.keys(_ls)[i] || null; },
  getItem(k) { return _ls[k] ?? null; }, setItem(k, v) { _ls[k] = String(v); },
  removeItem(k) { delete _ls[k]; }, clear() { for (const k of Object.keys(_ls)) delete _ls[k]; },
};
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
[...html.matchAll(/js\/([\w\/-]+\.js)/g)].map((m) => m[1])
  .filter((f, i, a) => a.indexOf(f) === i)
  .filter((f) => !['sound.js', 'ui.js', 'main.js'].includes(f) && !f.startsWith('ui/'))
  .forEach((f) => { try { require(path.join(ROOT, 'js', f)); } catch (e) {} });
const NDX = global.NDX;

let fail = 0;
const ck = (n, c, extra) => {
  if (c) console.log('ok   ' + n);
  else { console.log('FAIL ' + n + (extra ? '  → ' + extra : '')); fail++; }
};

// ============ A 组 · §⑤-2 配方可达性（P0） ============
ck('A1 availableRecipes 是函数', typeof NDX.availableRecipes === 'function');
ck('A2 craftById 是函数', typeof NDX.craftById === 'function');

const RECIPES = NDX.RECIPES || [];
ck('A3 RECIPES 非空（防取不到真源时静默空过）', RECIPES.length > 0, 'n=' + RECIPES.length);

// 构造「最大可合成面」state：持有全部 base/comps，材料给足，
//   ⚠ 但**不持有任何 out**（否则 `owned.includes(out.id)` 会把配方全过滤掉 ⇒ 断言恒真空过）。
const baseIds = [...new Set(RECIPES.map((r) => r.base).filter(Boolean))];
const compIds = [...new Set(RECIPES.reduce((a, r) => a.concat(r.comps || []), []))];
const matNames = [...new Set(RECIPES.reduce((a, r) => a.concat(
  Object.keys(r.materials || {}), r.material ? [r.material] : []), []))];
const state = {
  hero: 'wukong',
  equips: [...new Set(baseIds.concat(compIds))].map((id) => ({ id })),
  materials: matNames.reduce((o, m) => { o[m] = 99; return o; }, {}),
  trialsPassed: [],
};

const resolvable = (r) => !!NDX.craftById(r.out);
const deadInTable = RECIPES.filter((r) => !resolvable(r));

const avail = NDX.availableRecipes(state) || [];
ck('A4 availableRecipes 在最大可合成面下非空（防过滤过度导致恒真空过）', avail.length > 0, 'n=' + avail.length);

const unresolvable = avail.filter((r) => !resolvable(r));
ck('A5 availableRecipes 每项均可被 craftById 解析（点了必不静默失败）',
  unresolvable.length === 0, '不可解析 ' + unresolvable.length + ' 项：' + unresolvable.slice(0, 6).map((r) => r.out).join(','));

const deadIds = new Set(deadInTable.map((r) => r.out));
const leaked = avail.filter((r) => deadIds.has(r.out));
ck('A6 死配方（out 已归档/不可解析）已从源头摘除，不泄漏给 UI/自动合成',
  leaked.length === 0, '泄漏 ' + leaked.length + ' 项：' + leaked.slice(0, 6).map((r) => r.out).join(','));

// 反证：确认「死配方」这一情形在数据里真实存在 ⇒ A5/A6 不是恒真空断言
ck('A7 反证：RECIPES 中确实存在 out 不可解析的配方（证明 A5/A6 判据非恒真）',
  deadInTable.length > 0, 'dead=' + deadInTable.length);

// ============ B 组 · §⑤-5 单一来源守卫 ============
const part3 = fs.readFileSync(path.join(ROOT, 'js/equipment_part3.js'), 'utf8');
const defs = [...part3.matchAll(/NDX\.(\w+)\s*=\s*(?:function|\{)/g)].map((m) => m[1]);
const dup = [...new Set(defs.filter((n, i) => defs.indexOf(n) !== i))];
ck('B1 equipment_part3.js 无重复 NDX 定义（原逐字节重复块已消，禁回归）',
  dup.length === 0, 'dup=' + dup.join(','));

// ============ C 组 · 可达性报告（信息性，不判红；对应 §⑤-1 / §⑤-3 待办） ============
const POOL = [].concat(NDX.EQUIP_POOL || [], NDX.CRAFT_POOL || []);
const poolById = {};
POOL.forEach((e) => { if (e && e.id) poolById[e.id] = e; });
// 口径全部**照抄引擎判定**，不做字符串/正则猜引用：
//   · 掉落：rollEquips 闸门是 `!e.setTier || e.setTier < 2`（setTier≥2 永不被 roll 出）
//   · 点化：`out === id` 且 craftById 可解析（= 真能合成出来）
//   · 发放：lootById 可解析（事件 effect.treasure 走这条）
//   · 未解析引用：isUnresolvedTreasureId（引擎自己的"体面提示但拿不到"判据）
const hasOutRecipe = (id) => RECIPES.filter((r) => r.out === id && NDX.craftById(r.out)).length;
const unresolved = (id) => (typeof NDX.isUnresolvedTreasureId === 'function') ? !!NDX.isUnresolvedTreasureId(id) : null;
// 实际发放口：某 id 被写进事件/劫难选项的 `treasure:` 字段 —— 这是「说动妖怪反出」的唯一真发放路径。
//   ⚠ 注意：`lootById(id)` 可解析**不等于**有发放口（它只说明"若有事件发放则能解析"），
//      故不计入通道数，仅作诊断列。判据用 `treasure:` 文本引用（照抄 §1.7-D 的取证方式）。
const allJsText = (function () {
  const out = [];
  const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).forEach((d) => {
    const p = path.join(dir, d.name);
    if (d.isDirectory()) walk(p);
    else if (d.name.endsWith('.js')) { try { out.push(fs.readFileSync(p, 'utf8')); } catch (e) {} }
  });
  walk(path.join(ROOT, 'js'));
  return out.join('\n');
})();
// 兼容两种书写：`treasure: 'ni_x'`（JS 对象）与 `"treasure":"ni_x"`（JSON 剧情表）
const dispatchRef = (id) => new RegExp('treasure["\']?\\s*:\\s*["\']' + id + '["\']').test(allJsText);

console.log('\n     —— §⑤-1/§⑤-3 可达性报告（不判红 · 待办可视化）——');
const row = (id) => {
  const e = poolById[id];
  const inPool = !!e;
  const drop = inPool && !(e.setTier >= 2);
  const rec = hasOutRecipe(id);
  const disp = dispatchRef(id);
  const loot = !!NDX.lootById(id);
  const unl = unresolved(id);
  const ch = (drop ? 1 : 0) + (rec ? 1 : 0) + (disp ? 1 : 0);
  return `       ${id.padEnd(14)} 在池=${inPool ? 'Y' : 'N'}(setTier=${e && e.setTier != null ? e.setTier : '-'})  掉落=${drop ? 'Y' : 'N'}  点化配方=${rec}  发放口=${disp ? 'Y' : 'N'}  (诊断:lootById=${loot ? 'Y' : 'N'}/未解析=${unl === null ? 'n/a' : (unl ? 'Y' : 'N')})  ⇒ 通道=${ch}`;
};
console.log('     [证道 8] （§⑤-1 要求每只 ≥1 通道）');
['ni_huxianfeng', 'ni_kui', 'ni_xiejing', 'ni_shujing', 'ni_huangshi', 'ni_jiuling', 'ni_xiniu', 'ni_yutu']
  .forEach((id) => console.log(row(id)));
console.log('     [显形缺配方 2] （§⑤-3）');
['yinjiangjun', 'duomuguai'].forEach((id) => console.log(row(id)));

console.log(fail === 0
  ? `ok / 宠物配方可达性 + 单一来源守卫通过（死配方 ${deadInTable.length} 条已摘除，返回项 ${avail.length} 条全可解析）`
  : fail + ' 失败');
process.exit(fail === 0 ? 0 : 1);
