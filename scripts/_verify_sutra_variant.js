// _verify_sutra_variant.js — 经文招式包门禁（V9.6 · GDD §五）
// 断言：模板完备（6 kind × atk/ult + 34 经全覆盖）、解析边界、scale 归一化、
//       应用器逐字段、端到端 activeSkill（持诵/未持诵/换经换套路）、不夺英雄身份。
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
const KINDS = ['zen-heal', 'ward-mantra', 'war-buff', 'veil-mantra', 'glut-ton', 'break-mantra'];

// ---------- A. 真源存在 + 模板完备 ----------
ck('A1 SUTRA_VARIANT_TMPL 存在', !!NDX.SUTRA_VARIANT_TMPL);
ck('A2 sutraVariantOf 存在', typeof NDX.sutraVariantOf === 'function');
ck('A3 applySutraVariant 存在', typeof NDX.applySutraVariant === 'function');
KINDS.forEach((k) => {
  const t = NDX.SUTRA_VARIANT_TMPL && NDX.SUTRA_VARIANT_TMPL[k];
  ck('A4 模板含 atk/ult :: ' + k, !!(t && t.atk && t.ult));
});
{
  const all = (NDX.SUTRA_FULLS || []).concat(NDX.NI_SUTRA_FULLS || []);
  ck('A5 全本总数=34', all.length === 34, 'n=' + all.length);
  let miss = '';
  all.forEach((f) => {
    if (!NDX.sutraVariantOf(f.id, 'atk') || !NDX.sutraVariantOf(f.id, 'ult')) miss += f.id + ' ';
  });
  ck('A6 34 部经 atk/ult 全可解析', miss === '', miss);
  let badKind = '';
  all.forEach((f) => {
    const k = f.chantSkill && f.chantSkill.kind;
    if (KINDS.indexOf(k) < 0) badKind += f.id + ':' + k + ' ';
  });
  ck('A7 经文 kind 全在模板 6 类内', badKind === '', badKind);
}

// ---------- B. 解析边界 ----------
ck('B1 null id -> null', NDX.sutraVariantOf(null, 'atk') === null);
ck('B2 非法 key -> null', NDX.sutraVariantOf('su_full_jingang', 'xxx') === null);
ck('B3 不存在 id -> null', NDX.sutraVariantOf('no_such_sutra', 'atk') === null);
{
  const jg = NDX.sutraVariantOf('su_full_jingang', 'atk');
  ck('B4 金刚经 kind=break-mantra', jg && jg.kind === 'break-mantra', jg && jg.kind);
  ck('B5 金刚经 atk 破甲', jg && jg.variant.armorBreak === true);
  const pj = NDX.sutraVariantOf('ni_full_pojie', 'atk');
  ck('B6 逆经 破戒录 kind=glut-ton', pj && pj.kind === 'glut-ton', pj && pj.kind);
  ck('B7 逆经 atk 吸血', pj && pj.variant.lifestealPct === 0.22, pj && pj.variant.lifestealPct);
}
{
  // 自带覆盖优先于模板
  const f = NDX.SUTRA_FULLS.find((x) => x.id === 'su_full_jingang');
  f.atkVariant = { healPct: 0.33, note: '·特化' };
  const v = NDX.sutraVariantOf('su_full_jingang', 'atk');
  ck('B8 经文自带 atkVariant 覆盖模板', v && v.variant.healPct === 0.33 && v.variant.note === '·特化', v && JSON.stringify(v.variant));
  delete f.atkVariant;
}

// ---------- C. scale 归一化（mult/1.7，clamp [0.5,1.5]） ----------
{
  const fh = NDX.sutraVariantOf('su_full_fahua', 'atk');   // mult 1.5
  ck('C1 小经 scale=1.5/1.7', fh && Math.abs(fh.scale - 1.5 / 1.7) < 1e-9, fh && fh.scale);
  const fw = NDX.sutraVariantOf('su_full_fanwang', 'atk'); // mult 2.0
  ck('C2 大经 scale=2.0/1.7', fw && Math.abs(fw.scale - 2.0 / 1.7) < 1e-9, fw && fw.scale);
  const nt = NDX.sutraVariantOf('ni_full_nitian', 'atk');  // mult 2.0
  ck('C3 逆终经 scale=2.0/1.7', nt && Math.abs(nt.scale - 2.0 / 1.7) < 1e-9, nt && nt.scale);
  ck('C4 scale 上界 clamp 1.5', NDX.sutraVariantOf('su_full_fanwang', 'atk').scale <= 1.5);
}

// ---------- D. 应用器逐字段 ----------
{
  const mk = () => ({ dmg: 100, note: 'X' });
  let a = NDX.applySutraVariant(mk(), { healPct: 0.2 }, 1);
  ck('D1 healPct -> heal', a.heal === 20, a.heal);
  a = NDX.applySutraVariant(mk(), { healPct: 0.2 }, 0.5);
  ck('D2 healPct 受 scale 缩放', a.heal === 10, a.heal);
  a = NDX.applySutraVariant(mk(), { lifestealPct: 0.25 }, 1);
  ck('D3 lifestealPct -> heal', a.heal === 25, a.heal);
  a = NDX.applySutraVariant(mk(), { shieldPct: 0.3 }, 1);
  ck('D4 shieldPct -> shield', a.shield === 30, a.shield);
  a = NDX.applySutraVariant(mk(), { trueDmgPct: 0.25, ignoreDef: true }, 1);
  ck('D5 trueDmgPct -> trueDmg', a.trueDmg === 25, a.trueDmg);
  ck('D6 ignoreDef 置位', a.ignoreDef === true);
  a = NDX.applySutraVariant(mk(), { trueDmgPct: 0.2, armorBreak: true }, 1);
  ck('D7 armorBreak 置位', a.armorBreak === true && a.trueDmg === 20, 'td=' + a.trueDmg);
  a = NDX.applySutraVariant(mk(), { crit: true, dmgMul: 1.2 }, 1);
  ck('D8 crit + dmgMul', a.critHit === true && a.dmg === 120, 'dmg=' + a.dmg);
  a = NDX.applySutraVariant(mk(), { dotPct: 0.1, dotRounds: 2 }, 1);
  ck('D9 dotPct -> dot', a.dot && a.dot.per === 10 && a.dot.rounds === 2, a.dot && JSON.stringify(a.dot));
  a = NDX.applySutraVariant(mk(), { note: '!z' }, 1);
  ck('D10 note 追加', a.note === 'X!z', a.note);
  const before = JSON.stringify(mk());
  a = NDX.applySutraVariant(mk(), null, 1);
  ck('D11 null variant 不改动', JSON.stringify(a) === JSON.stringify(mk()));
  // 叠加不覆盖既有原语
  a = NDX.applySutraVariant({ dmg: 100, heal: 30, note: 'Y' }, { healPct: 0.2 }, 1);
  ck('D12 与既有 heal 叠加', a.heal === 50, a.heal);
}

// ---------- E. 端到端 activeSkill：持诵/未持诵/换经换套路 ----------
const mkP = () => ({ ti: { atk: 100, maxHp: 1000 }, yuan: { matk: 50 } });
const M = { maxHp: 1000, boss: false, name: '试妖' };
{
  // E1 持诵金刚经（break-mantra）→ 普攻带破甲真伤
  const act = NDX.activeSkill(mkP(), M, 'atk', { hero: 'tangseng', chantSutra: 'su_full_jingang' });
  ck('E1 持诵金刚经 普攻附破甲', act.armorBreak === true && act.trueDmg === 24 && /·破相/.test(act.note), 'td=' + act.trueDmg + ' note=' + act.note);
  // E2 未持诵 → 普攻无经文套路
  const act2 = NDX.activeSkill(mkP(), M, 'atk', { hero: 'tangseng' });
  ck('E2 未持诵 普攻无经文标记', !act2.armorBreak && !/·破相/.test(act2.note) && !act2.trueDmg, 'note=' + act2.note);
  // E3 换经：持诵心经（zen-heal）→ 普攻改带回血（套路切换）
  const act3 = NDX.activeSkill(mkP(), M, 'atk', { hero: 'tangseng', chantSutra: 'su_full_xinjing' });
  ck('E3 换经换套路（回血）', /·慈悲/.test(act3.note) && !/·破相/.test(act3.note) && act3.trueDmg == null, 'note=' + act3.note);
  // E4 持诵逆经破戒录 → 普攻附吸血
  const act4 = NDX.activeSkill(mkP(), M, 'atk', { hero: 'wukong', chantSutra: 'ni_full_pojie' });
  ck('E4 持诵逆经 普攻附吸血', act4.heal >= Math.round(120 * 0.22), 'heal=' + act4.heal);
}
{
  // E5 绝招：持诵金刚经 → 附破甲；不夺英雄身份
  const u1 = NDX.activeSkill(mkP(), M, 'ult', { hero: 'tangseng', chantSutra: 'su_full_jingang' });
  ck('E5 持诵经 绝招附破甲', u1 && u1.kind === 'ult' && u1.armorBreak === true && /·碎法/.test(u1.note), u1 && ('note=' + u1.note));
  const u2 = NDX.activeSkill(mkP(), M, 'ult', { hero: 'tangseng' });
  ck('E6 未持诵 绝招无经文标记', u2 && !u2.armorBreak && !/·碎法/.test(u2.note), u2 && ('note=' + u2.note));
  ck('E7 绝招 name 保持英雄绝招（非变体）', u1 && u2 && u1.name === u2.name && u1.kind === 'ult', u1 && u1.name);
}
{
  // E8 符文招式包不改诵经本身（chant 分支不受影响，仍由 chantSkill 驱动）
  const c1 = NDX.activeSkill(mkP(), M, 'chant', { hero: 'tangseng', chantSutra: 'su_full_jingang' });
  ck('E8 诵经仍走 chantSkill（不受招式包污染）', c1 && c1.kind === 'chant' && !/·破相/.test(c1.note || ''), c1 && ('note=' + c1.note));
}

console.log('\n结论：' + pass + ' 通过 / ' + fail + ' 失败');
process.exit(fail ? 1 : 0);
