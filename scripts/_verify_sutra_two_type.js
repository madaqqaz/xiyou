// _verify_sutra_two_type.js — 经文两型 / 经位门禁（V9.32：单一 34 部目录）
// 断言：34 部 legacy 归一化 attr；经位身份由 chantSkill.kind 派生（jingBookOf）；
//       经位聚合 / 生命周期 / 经位被动 def / 双向 slot 匹配 / 逆道优先；
//       V9.28 自造的 16 部 CHAPTER_SUTRAS 已删除（用户定调「以 34 部为准」）。
// 由 scripts/_run_all_gates.js 的 /^(_smoke_|test_|_verify_).*\.js$/ 正则自动收录。
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const win = {};
const sandbox = { NDX: {}, window: win, console: console, Math: Math };
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js', 'data_sutra.js'), 'utf8'), sandbox);
const NDX = win.NDX;

let fail = 0;
const failMsg = (m) => { console.log('FAIL ' + m); fail++; };

// 1) V9.28 自造 16 部已彻底移除
if (NDX.CHAPTER_SUTRAS !== undefined) failMsg('CHAPTER_SUTRAS 应已删除（以 34 部为准）');
if (NDX.CHAPTER_SUTRA_MAP !== undefined) failMsg('CHAPTER_SUTRA_MAP 应已删除');
if (NDX.grantChapterSutra !== undefined) failMsg('grantChapterSutra 应已删除（章末改发残片）');
if (typeof NDX.grantChapterSutraShards !== 'function') failMsg('grantChapterSutraShards（章末残片）应保留');

// 2) 34 部 legacy 归一化 attr
const allLegacy = (NDX.SUTRA_FULLS || []).concat(NDX.NI_SUTRA_FULLS || []);
if (allLegacy.length !== 34) failMsg(`legacy 应 34 部 实际=${allLegacy.length}`);
for (const f of allLegacy) {
  if (f.kind !== 'attr') failMsg(`legacy 经[${f.id}] kind 应为 attr 实际=${f.kind}`);
  if (!f.chantSkill || !f.chantSkill.kind) failMsg(`legacy 经[${f.id}] 缺 chantSkill.kind（经位身份无从派生）`);
}

// 3) 经位派生规格：6 类 kind 齐全且 slot 合法
const KINDS = ['zen-heal', 'ward-mantra', 'glut-ton', 'war-buff', 'veil-mantra', 'break-mantra'];
for (const k of KINDS) {
  const s = NDX.JING_KIND_MOD[k];
  if (!s) failMsg(`JING_KIND_MOD 缺 ${k}`);
  else if (s.slot !== 'atk' && s.slot !== 'chant') failMsg(`JING_KIND_MOD[${k}].slot 非法=${s.slot}`);
}
// 3b) 全部 34 部均可入经位（jingBookOf 非 null），且分槽计数 = atk 21 / chant 13
let nAtk = 0, nChant = 0;
for (const f of allLegacy) {
  const b = NDX.jingBookOf(f.id);
  if (!b) { failMsg(`jingBookOf(${f.id}) 应为非 null`); continue; }
  if (b.slot === 'atk') nAtk++; else if (b.slot === 'chant') nChant++;
  else failMsg(`jingBookOf(${f.id}).slot 非法=${b.slot}`);
}
if (nAtk !== 21) failMsg(`攻击格经目应 21 部 实际=${nAtk}`);
if (nChant !== 13) failMsg(`诵经格经目应 13 部 实际=${nChant}`);
if (NDX.jingBookOf('不存在的经') !== null) failMsg('jingBookOf 未知 id 应返回 null');

// 4) 经位聚合：atk 格装《圆觉经》(war-buff) → crit 0.12 + critDmg 0.15
{
  const s = { jingSlots: { atk: 'su_full_yuanjue', chant: null } };
  const m = NDX.jingSlotMods(s).atk;
  if (!m || m.crit !== 0.12 || m.critDmg !== 0.15) failMsg(`经位atk聚合圆觉经 crit/critDmg 异常=${JSON.stringify(m)}`);
  const mo = NDX.sutraModOf('su_full_yuanjue');
  if (!mo || mo.crit !== 0.12) failMsg('sutraModOf(圆觉经) 应返回 mod');
}

// 5) 战斗生命周期：chant 格《大悲咒》(zen-heal) → regen 0.04；《梵网经》(ward-mantra) → shield 0.10
{
  const sR = { jingSlots: { atk: null, chant: 'su_full_dabei' } };
  if (NDX.battleModsOf(sR).regenPct !== 0.04) failMsg(`battleModsOf 大悲咒 regen 期望0.04 实际=${NDX.battleModsOf(sR).regenPct}`);
  const sS = { jingSlots: { atk: null, chant: 'su_full_fanwang' } };
  if (NDX.battleModsOf(sS).shieldPct !== 0.10) failMsg(`battleModsOf 梵网经 shield 期望0.10 实际=${NDX.battleModsOf(sS).shieldPct}`);
}

// 6) 经位被动 def（经位专属数值，与包裹 effect 不重复）：
//    break-mantra→reflect 0.04 / veil-mantra→eva 0.03 / glut-ton→hp 40 / war-buff→atk 12
//    ward-mantra→mdef 0.03 / zen-heal→dr 0.03
{
  const cases = [
    ['su_full_jingang', 'atk',  'reflect', 0.04],
    ['ni_full_duotian', 'atk',  'ti.eva',  0.03],
    ['ni_full_xuefo',   'atk',  'ti.hp',   40],
    ['su_full_yuanjue', 'atk',  'ti.atk',  12],
    ['su_full_fanwang', 'chant', 'mdef',   0.03],
    ['su_full_dabei',   'chant', 'ti.dr',  0.03],
  ];
  for (const [id, slot, key, want] of cases) {
    const s = { jingSlots: { atk: null, chant: null } };
    s.jingSlots[slot] = id;
    const d = NDX.jingSlotDefStats(s);
    const got = key.split('.').reduce((o, k) => (o ? o[k] : undefined), d);
    if (got !== want) failMsg(`jingSlotDefStats(${id},${slot}) ${key} 期望${want} 实际=${got}`);
  }
}

// 7) applyJingSlotMods 四类 atk 修饰（构建期注入）
{
  const _r = Math.random;
  // 7a 连击：破甲经→combo 0.18（命中原样）
  Math.random = () => 0;
  const a1 = NDX.applyJingSlotMods({ kind: 'atk', dmg: 100, note: '' }, { jingSlots: { atk: 'su_full_jingang', chant: null } }, 'atk');
  if (!(a1.hits >= 2 && a1.spread)) failMsg('applyJingSlotMods atk 连击(金刚经) 未生效');
  // 7b 暴击+暴伤：圆觉经 crit 0.12 → ×(1.5+0.15)=1.65
  const a2 = NDX.applyJingSlotMods({ kind: 'atk', dmg: 100, note: '' }, { jingSlots: { atk: 'su_full_yuanjue', chant: null } }, 'atk');
  if (!a2.critHit || Math.round(a2.dmg) !== 165) failMsg(`applyJingSlotMods atk 暴击(圆觉经) 期望165 实际=${a2.dmg}`);
  // 7c 增伤：堕天录 atkPct 0.12（不暴击）
  Math.random = () => 1;
  const a3 = NDX.applyJingSlotMods({ kind: 'atk', dmg: 100, note: '' }, { jingSlots: { atk: 'ni_full_duotian', chant: null } }, 'atk');
  if (Math.round(a3.dmg) !== 112) failMsg(`applyJingSlotMods atk 增伤(堕天录) 期望112 实际=${a3.dmg}`);
  // 7d 吸血：血佛经 spellLifesteal 0.10
  const a4 = NDX.applyJingSlotMods({ kind: 'atk', dmg: 100, note: '' }, { jingSlots: { atk: 'ni_full_xuefo', chant: null } }, 'atk');
  if (a4.heal !== 10) failMsg(`applyJingSlotMods atk 吸血(血佛经) 期望10 实际=${a4.heal}`);
  // 7e chant 格连击同口径（《金刚经》break-mantra 若装 chant 格应因 slot 不匹配而无效）
  const a5 = NDX.applyJingSlotMods({ kind: 'chant', dmg: 100, note: '' }, { jingSlots: { atk: null, chant: 'su_full_jingang' } }, 'chant');
  if (a5.hits || a5.heal) failMsg('atk 身份经装 chant 格不应生效（slot 双向匹配）');
  Math.random = _r;
}

// 8) slot 双向匹配：atk 身份经装进 chant 格 → 聚合为 null，且 def 不聚合
{
  const s = { jingSlots: { atk: null, chant: 'su_full_yuanjue' } };
  if (NDX.jingSlotMods(s).chant !== null) failMsg('atk 身份经装 chant 格 jingSlotMods.chant 应为 null');
  if (NDX.jingSlotDefStats(s) !== null) failMsg('atk 身份经装 chant 格 jingSlotDefStats 应为 null');
}

// 9) 经位目录派生（jingSlotCatalog）：从持有经目去重生成
{
  const s = { sutras: ['su_full_yuanjue', 'su_full_dabei'], niSutras: ['ni_full_xuefo'] };
  const cat = NDX.jingSlotCatalog(s);
  if (cat.length !== 3) failMsg(`jingSlotCatalog 应 3 条 实际=${cat.length}`);
  if (cat.filter((b) => b.slot === 'atk').length !== 2) failMsg('jingSlotCatalog atk 应 2 条');
  if (cat.filter((b) => b.slot === 'chant').length !== 1) failMsg('jingSlotCatalog chant 应 1 条');
  if (NDX.jingSlotCatalog({ sutras: ['su_full_yuanjue', 'su_full_yuanjue'] }).length !== 1) failMsg('jingSlotCatalog 应去重');
}

// 10) 逆道获取优先：reversePath 时 prioritizeSutraOffer 把逆道经排前
{
  const s = { reversePath: true };
  const choices = ['su_full_yuanjue', 'ni_full_duotian', 'su_full_dabei'];
  const sorted = NDX.prioritizeSutraOffer(s, choices);
  if (sorted[0] !== 'ni_full_duotian') failMsg(`逆道优先：首位应为 ni_full_duotian 实际=${sorted[0]}`);
}

if (fail === 0) console.log('ok / 经文两型·经位（34 部目录）门禁通过');
else console.log(`${fail} 失败`);
process.exit(fail === 0 ? 0 : 1);
