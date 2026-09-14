// _verify_seal_pool.js — 劫印池健康度门禁（词条×档位×图标×结算口径）
// 背景：V9.6 审计发现三处池级缺陷——
//   ① offerSealsAligned 未按品阶过滤，白档可能产出 val=undefined 的「零收益废印」
//      （「逐杀/焚天/流沙」仅有蓝/金档，却可被白档抽中）；offerSeals 有过滤 → 两路口径分叉。
//   ② attr_calc.js calcSealBonus 按不存在的字段名直读 seal 对象（maxHp/cri/lifeSteal），
//      对劫印恒零命中 → 形似真源实为陷阱的并行实现。
//   ③ 红劫档位曾在数据层齐备但无来源（见 _verify_seal_source.js B2）。
// 断言：A 词条规模 · B 档位完备 · C 白档废印守卫 · D 双路口径一致 · E 图标资产一致
//       F calcSealBonus 口径对齐真源 · G 道途阶段碑 · H 档位词表一致
// 运行：node scripts/_verify_seal_pool.js
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
  .forEach((f) => { try { require(path.join(ROOT, 'js', f)); } catch (e) {} });
const NDX = global.NDX;

let pass = 0, fail = 0;
const ck = (name, cond, extra) => { if (cond) { pass++; } else { fail++; console.log('  ✗ ' + name + (extra ? ' — ' + extra : '')); } };
const rel = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const DAOS = ['战', '渡', '缘', '夺', '隐', '逆'];
const WORDS = NDX.SEAL_WORDS || {};
const NAMES = Object.keys(WORDS);
const TIERS = (NDX.SEAL_TIER_ORDER || ['white', 'green', 'blue', 'red', 'gold']).slice();

// ============ A 词条规模 ============
ck('A 词条总数 48（V8.37 扩充 47 + 2026-09-14 新增逆道「轮回」）', NAMES.length === 48, 'n=' + NAMES.length);
ck('A 六道均有词条', DAOS.every((d) => (NDX.SEAL_DAOTU_WORDS[d] || []).length > 0),
  DAOS.map((d) => d + (NDX.SEAL_DAOTU_WORDS[d] || []).length).join(' '));
ck('A 道途索引与词条 dao 一致（无错挂）',
  NAMES.every((n) => (NDX.SEAL_DAOTU_WORDS[WORDS[n].dao] || []).indexOf(n) >= 0));
ck('A 每词条具备 name/dao/stat/tiers/desc', NAMES.every((n) => {
  const w = WORDS[n];
  return !!w.name && !!w.dao && !!w.stat && !!w.tiers && typeof w.desc === 'string' && w.desc.length > 0;
}));
ck('A 道途枚举覆盖六道', DAOS.every((d) => !!NDX.SEAL_DAOTU[d]));
ck('A 每道至少 1 条带战斗机制（mech）',
  DAOS.every((d) => (NDX.SEAL_DAOTU_WORDS[d] || []).some((n) => !!WORDS[n].mech)));

// ============ B 档位完备 ============
const missB = {}, missG = {}, missR = {}, missGr = {};
NAMES.forEach((n) => {
  const t = WORDS[n].tiers;
  if (t.green == null) missGr[n] = 1;
  if (t.blue == null) missB[n] = 1;
  if (t.gold == null) missG[n] = 1;
  if (t.red == null) missR[n] = 1;
});
ck('B 全部词条具备 green 档数值（V9.8 旧 blue 档下移为 green）', Object.keys(missGr).length === 0, Object.keys(missGr).join(','));
ck('B 全部词条具备 blue 档数值（派生 = green×1.62）', Object.keys(missB).length === 0, Object.keys(missB).join(','));
ck('B 全部词条具备 gold 档数值', Object.keys(missG).length === 0, Object.keys(missG).join(','));
ck('B 全部词条具备 red 档数值（红劫可达前提）', Object.keys(missR).length === 0, Object.keys(missR).join(','));
// 无 white 档属设计性缺档（绿/金专属词条），数量必须被门禁锁定，防止无声漂移
const noWhite = NAMES.filter((n) => WORDS[n].tiers.white == null);
ck('B 无 white 档词条为已知 6 条（设计性缺档，非缺失）', noWhite.length === 6, noWhite.join('/'));
ck('B 档位数值单调递增（white<green<blue<red<gold）', NAMES.every((n) => {
  const seq = TIERS.map((k) => NDX.sealTierVal(WORDS[n], k));
  for (let i = 1; i < seq.length; i++) if (!(seq[i] > seq[i - 1])) return false;
  return true;
}));
ck('B 机制附着品阶 mechTier 均在五档内',
  NAMES.filter((n) => WORDS[n].mech).every((n) => TIERS.indexOf(WORDS[n].mechTier) >= 0));
ck('B 机制门槛随档位下移：原「blue 起机制」已更名为 green',
  NAMES.filter((n) => WORDS[n].mech).every((n) => WORDS[n].mechTier === 'green' || WORDS[n].mechTier === 'gold'));

// ============ C 白档废印守卫（核心修复项） ============
// 白档下，任何来源/阵营产出的劫印都必须有实际数值（val 非 undefined 且 > 0）
const bad = [];
const ROUNDS = 400;
['evil', 'good'].forEach((align) => {
  ['wukong', 'tangseng', 'bajie', 'shaseng', 'xiaobailong'].forEach((hero) => {
    for (let i = 0; i < ROUNDS; i++) {
      const s = { seals: [], fate: {}, act: 1, flags: {} };
      const out = NDX.offerSealsAligned(hero, 'white', s, align);
      out.forEach((o) => {
        if (o.val == null || !(o.val > 0)) bad.push(align + '/' + hero + '/' + o.name + ' val=' + o.val);
      });
    }
  });
});
ck('C offerSealsAligned 白档样本 ' + (ROUNDS * 10) + ' 次均无零收益废印', bad.length === 0, bad.slice(0, 3).join(' | '));
// 主池路径同口径
const bad2 = [];
for (let i = 0; i < ROUNDS; i++) {
  const s = { seals: [], fate: {}, act: 1, flags: {} };
  NDX.offerSeals('wukong', 'white', s).forEach((o) => {
    if (o.val == null || !(o.val > 0)) bad2.push(o.name + ' val=' + o.val);
  });
}
ck('C offerSeals 白档样本 ' + ROUNDS + ' 次均无零收益废印', bad2.length === 0, bad2.slice(0, 3).join(' | '));
// 反向锁死：无 white 档词条绝不出现在白档候选中
const noWhiteSeen = new Set();
for (let i = 0; i < ROUNDS; i++) {
  ['evil', 'good'].forEach((align) => {
    const s = { seals: [], fate: {}, act: 1, flags: {} };
    NDX.offerSealsAligned('wukong', 'white', s, align).forEach((o) => { if (noWhite.indexOf(o.name) >= 0) noWhiteSeen.add(o.name); });
  });
}
ck('C 无 white 档词条（' + noWhite.join('/') + '）绝不出现在白档', noWhiteSeen.size === 0, [...noWhiteSeen].join(','));
// 各档位产出均带有效数值
const bad3 = [];
TIERS.forEach((tier) => {
  for (let i = 0; i < 120; i++) {
    const s = { seals: [], fate: {}, act: 5, flags: { sealUp: 2 } };
    NDX.offerSealsAligned('wukong', tier, s, 'evil').forEach((o) => {
      if (o.val == null || !(o.val > 0)) bad3.push(tier + '/' + o.name);
      if (o.tier !== tier) bad3.push(tier + '/tier-mismatch:' + o.tier);
    });
  }
});
ck('C 五档（含 green/blue/red）产出数值有效且 tier 标注自洽', bad3.length === 0, bad3.slice(0, 3).join(' | '));
// 非永真反证：按「修复前的过滤口径」（不校验品阶数值）构造白档候选，必须存在 val=undefined 的项，
//   以证明 C 段守卫不是恒真断言——它拦下的正是这批零收益废印。
const legacyWhite = {};
DAOS.forEach((dao) => {
  const w = NDX.SEAL_DAOTU_WORDS[dao].find((n) => {
    const t = NDX.SEAL_WORDS[n].tiers;
    return t.white == null;
  });
  if (w) legacyWhite[dao] = w;
});
ck('C2 反证·旧口径下白档确会产出 val=undefined 的废印（守卫非永真）',
  Object.keys(legacyWhite).length >= 3, JSON.stringify(legacyWhite));
ck('C2 反证逐项确认（逐杀/焚天/流沙 均无 white 档）',
  ['逐杀', '焚天', '流沙'].every((n) => WORDS[n].tiers.white == null), JSON.stringify(['逐杀', '焚天', '流沙'].map((n) => WORDS[n].tiers)));

// ============ D 双路口径一致 ============
ck('D 两路皆含品阶数值过滤（源码守卫）',
  (rel('js/jieseals.js').match(/tiers\[tier\] != null/g) || []).length >= 2,
  '命中 ' + (rel('js/jieseals.js').match(/tiers\[tier\] != null/g) || []).length + ' 处');
ck('D 唯一劫印在两路都不重复出现（unique 过滤同口径）',
  /wd\.unique && ownedNames\.has\(w\)/.test(rel('js/jieseals.js')));

// ============ E 图标资产一致 ============
const icons = NDX.SEAL_ICONS || {};
// 专属立绘为「应然」，但 jieseals.js 的设计注释允许未映射词条回退「道途通用图标」。
// 为不丢失内容卫生网（新增无图词条仍应被拦），保留强断言 + 一张显式白名单登记已知缺口。
const DAO_FALLBACK_OK = new Set(['轮回']); // 2026-09-14 新增词条，暂无专属立绘（逆道通用图标回退）
const noIcon = NAMES.filter((n) => !icons[n] && !DAO_FALLBACK_OK.has(n));
ck('E 每词条均有专属图标映射（或列入已知回退白名单）', noIcon.length === 0, noIcon.join(','));
ck('E 回退白名单词条可解析出道途通用图标（非空，无 404）',
  [...DAO_FALLBACK_OK].every((n) => !!NDX.getSealIcon(n, WORDS[n].dao)),
  [...DAO_FALLBACK_OK].join(','));
const paths = new Set(Object.values(icons).concat(Object.values(NDX.SEAL_DAO_ICONS || {})));
const missFile = [...paths].filter((p) => !fs.existsSync(path.join(ROOT, p)));
ck('E 全部映射指向的图标文件均存在（无 404）', missFile.length === 0, missFile.slice(0, 6).join(','));
const dir = path.join(ROOT, 'img/seals');
const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => /\.(webp|png|jpg)$/i.test(f)) : [];
const orphan = files.filter((f) => ![...paths].some((p) => p.endsWith('/' + f)));
ck('E img/seals 无孤儿图（每张图都被引用）', orphan.length === 0, orphan.slice(0, 6).join(','));
ck('E getSealIcon 回退链正确（专属 → 道途通用 → 空）',
  NDX.getSealIcon('杀伐', '战') === icons['杀伐'] && NDX.getSealIcon('不存在的印', '逆') === NDX.SEAL_DAO_ICONS['逆'] && NDX.getSealIcon('X', 'ZZ') === '');

// ============ F calcSealBonus 口径对齐真源 ============
const AC = NDX.AttrCalc;
ck('F NDX.AttrCalc.calcSealBonus 可访问', !!(AC && typeof AC.calcSealBonus === 'function'));
const goldAtk = NDX._mkSeal('杀伐', 'gold');      // stat=atk
const goldMdef = NDX._mkSeal('固甲', 'gold');      // stat=mdef
const goldHp = NDX._mkSeal('禅光', 'gold');        // stat=maxhp
const goldLs = NDX._mkSeal('渡厄', 'gold');        // maxhp + lifesteal
const bTest = AC.calcSealBonus({ seals: [goldAtk, goldMdef, goldHp, goldLs] });
const _sb4 = NDX.sealBreakAll({ seals: [goldAtk, goldMdef, goldHp, goldLs] });
ck('F atk 类劫印→atkPct（不再零命中，含阶段碑）', Math.abs((bTest.atkPct || 0) - (goldAtk.val + (_sb4.atkPct || 0))) < 1e-9, 'atkPct=' + bTest.atkPct + ' val=' + goldAtk.val + ' bp=' + (_sb4.atkPct || 0));
ck('F mdef 类劫印→mdef', Math.abs((bTest.mdef || 0) - goldMdef.val) < 1e-9, 'mdef=' + bTest.mdef);
ck('F maxhp 类劫印→hpPct（含 渡厄 附随 + 阶段碑）',
  Math.abs((bTest.hpPct || 0) - (goldHp.val + goldLs.val + goldLs.maxhp + (_sb4.hpPct || 0))) < 1e-9, 'hpPct=' + bTest.hpPct + ' bp=' + (_sb4.hpPct || 0));
ck('F lifesteal 附随→lifeSteal', Math.abs((bTest.lifeSteal || 0) - goldLs.lifesteal) < 1e-9, 'ls=' + bTest.lifeSteal);
ck('F crit 附随→cri', (() => {
  const b = AC.calcSealBonus({ seals: [NDX._mkSeal('碎击', 'gold')] });
  return Math.abs((b.cri || 0) - WORDS['碎击'].crit) < 1e-9;
})(), JSON.stringify(AC.calcSealBonus({ seals: [NDX._mkSeal('碎击', 'gold')] })));
ck('F 空 state / 非数组 seals → 空对象不抛错',
  Object.keys(AC.calcSealBonus(null)).length === 0 && Object.keys(AC.calcSealBonus({ seals: null })).length === 0);
ck('F 道途阶段碑仍并入（3 枚同金劫 = 战道 9 层 → atkPct +0.14）', (() => {
  const seals = [NDX._mkSeal('杀伐', 'gold'), NDX._mkSeal('碎击', 'gold'), NDX._mkSeal('裂魂', 'gold')];
  const b = AC.calcSealBonus({ seals: seals });
  const pure = seals.reduce((a, x) => a + x.val, 0);
  const sb = NDX.sealBreakAll({ seals: seals });
  return Math.abs((b.atkPct || 0) - (pure + (sb.atkPct || 0))) < 1e-9;
})(), 'layers=' + NDX.sealDaoLayerSum({ seals: [NDX._mkSeal('杀伐', 'gold'), NDX._mkSeal('碎击', 'gold'), NDX._mkSeal('裂魂', 'gold')] }, '战'));
ck('F 战斗真源仍在 combat.js 消费 seal.stat（本函数非战斗真源）',
  /sl\.stat === '/.test(rel('js/combat_part1.js')));

// ============ G 道途阶段碑 ============
ck('G 六道阶段碑各 4 档（3/6/9/12）',
  DAOS.every((d) => Object.keys(NDX.SEAL_DAO_BREAKPOINTS[d] || {}).length === 4),
  DAOS.map((d) => d + Object.keys(NDX.SEAL_DAO_BREAKPOINTS[d] || {}).length).join(' '));
ck('G 档位效果字段在真源可结算白名单内',
  DAOS.every((d) => Object.values(NDX.SEAL_DAO_BREAKPOINTS[d]).every((e) =>
    Object.keys(e).every((k) => ['atkPct', 'matkPct', 'hpPct', 'drPct', 'eva', 'cri', 'dr'].indexOf(k) >= 0))));
ck('G sealLayerVal：白/绿=1、蓝=2、红=3、金=4（V9.8 五档，金劫顶阶计层最高）',
  NDX.sealLayerVal('white') === 1 && NDX.sealLayerVal('green') === 1 && NDX.sealLayerVal('blue') === 2
  && NDX.sealLayerVal('red') === 3 && NDX.sealLayerVal('gold') === 4);
ck('G sealBreakInfo 给出下一档提示（3 枚金劫 = 12 层，顶档已达成）', (() => {
  const s = { seals: [NDX._mkSeal('杀伐', 'gold'), NDX._mkSeal('碎击', 'gold'), NDX._mkSeal('裂魂', 'gold')] };
  const info = NDX.sealBreakInfo(s, '战');
  return info.layer === 12 && !!info.cur && info.nxtTier === null;
})(), JSON.stringify(NDX.sealBreakInfo({ seals: [NDX._mkSeal('杀伐', 'gold'), NDX._mkSeal('碎击', 'gold'), NDX._mkSeal('裂魂', 'gold')] }, '战')));

// ============ H 档位词表一致 ============
ck('H SEAL_TIER_LABEL 五档齐备', TIERS.every((t) => !!NDX.SEAL_TIER_LABEL[t]));
ck('H SEAL_TIER_CLS 五档齐备且为 tier-* 类名', TIERS.every((t) => NDX.SEAL_TIER_CLS[t] === 'tier-' + t));
ck('H SEAL_TIER_GOLD 按战力序递增（白<绿<蓝<红<金，金劫顶阶最贵）',
  TIERS.every((t, i) => i === 0 || NDX.SEAL_TIER_GOLD[t] > NDX.SEAL_TIER_GOLD[TIERS[i - 1]]),
  TIERS.map((t) => t + '=' + NDX.SEAL_TIER_GOLD[t]).join(' '));
ck('H 五档样式在 style.css 均落地（.seal-opt.tier-* / .seal-chip.tier-*）',
  TIERS.every((t) => {
    const css = fs.readFileSync(path.join(ROOT, 'css/style.css'), 'utf8');
    return css.indexOf('.seal-opt.tier-' + t) >= 0 && css.indexOf('.seal-chip.tier-' + t) >= 0;
  }));
ck('H 图鉴登记 seal 分类', /record\('seal'|['"]seal['"]/.test(rel('js/data_codex.js')));

console.log('\n结论：' + pass + ' 通过 / ' + fail + ' 失败');
process.exit(fail ? 1 : 0);
