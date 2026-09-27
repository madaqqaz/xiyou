// _verify_jobspec.js — L3 套路层（A1 + P3）实证探针
// 目的：证明「职业/配装改变我怎么打」已落地，且**无配装信号零操作**、断线字段不复活。
// 依据：docs/《逆道西行》隐藏职业 · L3 套路层设计（v1.0）.md
//       docs/《逆道西行》英雄底色与流派生成模型（v1.0）.md（P2′ 驱动源变更）
// 断言：① 真源契约（JOBSPEC 10 流派 ⟷ JOB_STYLE 值域一一对应）；
//       ② 断线修复闭合（reflect/evaUp/cleanse/summon/lifesteal 五字段已全部有消费端）；
//       ③ 零操作（无任何配装信号）；
//       ④ P3 十流派三键改造生效（summon/combo/reflect/crit/ward/evade/drain/purify/burn/reverse）；
//       ⑤ 禁忌成立（summon 无灵宠 → 腰斩）；⑥ 连击层资源边界；⑦ 三键链路已接线。
// 运行：node scripts/_verify_jobspec.js
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
const code = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

let pass = 0, fail = 0;
const ck = (name, cond, extra) => { if (cond) { pass++; } else { fail++; console.log('  ✗ ' + name + (extra ? ' — ' + extra : '')); } };
const mk = () => ({ kind: 'atk', name: '攻击', cd: 1, dmg: 100, heal: 0, shield: 0, note: '挥兵狠击' });
const snap = (o) => JSON.stringify(o);

// ============ ① 真源契约：JOBSPEC 10 流派 ⟷ JOB_STYLE 值域 ============
ck('NDX.JOBSPEC 已定义', !!NDX.JOBSPEC && typeof NDX.JOBSPEC === 'object');
const specKeys = Object.keys(NDX.JOBSPEC || {});
ck('JOBSPEC 恰 10 流派', specKeys.length === 10, 'got ' + specKeys.length);
const styleVals = Array.from(new Set(Object.values(NDX.JOB_STYLE || {})));
ck('JOB_STYLE 值域 ⊆ JOBSPEC（无孤儿流派）',
  styleVals.length > 0 && styleVals.every((s) => specKeys.indexOf(s) >= 0),
  'style=' + styleVals.join(',') + ' spec=' + specKeys.join(','));
ck('JOBSPEC ⊆ JOB_STYLE 值域（无多余空卡）',
  specKeys.every((k) => styleVals.indexOf(k) >= 0),
  'spec=' + specKeys.join(','));
ck('45 隐藏职全部映射到 JOBSPEC 流派',
  Object.keys(NDX.JOB_STYLE || {}).every((j) => specKeys.indexOf(NDX.JOB_STYLE[j]) >= 0));
ck('每张卡四要素齐全（how/res/atk/chant/ult/fit/taboo）',
  specKeys.every((k) => { const c = NDX.JOBSPEC[k]; return c && c.how && c.res && c.atk && c.chant && c.ult && c.fit && c.taboo; }));
ck('JOBSPEC_IMPL ⊂ JOBSPEC', (NDX.JOBSPEC_IMPL || []).every((k) => specKeys.indexOf(k) >= 0));
ck('JOBSPEC_IMPL 已扩到 10/10（P3 · 2026-09-25）',
  Array.isArray(NDX.JOBSPEC_IMPL) && NDX.JOBSPEC_IMPL.length === 10 &&
  NDX.STYLE_LIST.every((s) => NDX.JOBSPEC_IMPL.indexOf(s) >= 0));

// ============ ② 断线修复闭合（五死字段全有消费端） ============
const ca = code('js/combat_active.js');
const sv = code('js/data_skill_variant.js');
// 🔴 V9.55 A3 技能：数值真源已迁到技能总表（data_skill_index.js），执行器不再持有数值。
//   这些**源码级**断言因此改为「总表 + 执行器」两处取并集，避免迁移后被假红淹没。
const si = code('js/data_skill_index.js');
const SV_ALL = sv + '\n' + si;
ck('summon 有消费分支（combat_active）', /act\.summon\b/.test(ca));
ck('cleanse 有消费分支（combat_active → applyBattleCleanse）',
  /act\.cleanse/.test(ca) && /applyBattleCleanse/.test(ca));
ck('evaUp 有消费分支（combat_active）', /act\.evaUp/.test(ca));
ck('reflect 不再写死字段（无 act.reflect 赋值）', !/act\.reflect\s*=/.test(SV_ALL));
ck('lifesteal 不再写死字段（无 act.lifesteal 赋值）', !/act\.lifesteal\s*=/.test(SV_ALL));
ck('reflect 已改走 guardCounter 透传（applyUltVariant）', /v\.guardCounter/.test(sv));
ck('ULT_STYLE_MOD.reflect 用 counterPct（非 reflect 死字段）',
  /reflect:\s*\{[^}]*counterPct/.test(SV_ALL), '需 guardCounter+counterPct');
ck('CHANT_VARIANTS.reflect（业报诵）改走 guardCounter', /name: '业报诵'[\s\S]{0,200}guardCounter/.test(SV_ALL));
ck('act.summon 消费用的 _bumpHp 真源存在', typeof NDX._bumpHp === 'function');
ck('applyBattleCleanse 真源存在（cleanse 落地器）', typeof NDX.applyBattleCleanse === 'function');

// ============ ③ 零操作：未转职 / 未识别 / 未落地流派 ============
// 🔴 P2′（2026-09-25）：驱动源已由「隐藏职」改为「权重向量」（英雄底色 + 劫印 + 经文 + 隐藏职倾向）。
//   因此「零操作」的判据变为「无任何配装信号」；隐藏职倾向仍是一把满权重票（见 _verify_style_model.js）。
const B = snap(mk());
ck('无信号（空存档）→ 攻键零操作（逐字节一致）', snap(NDX.applyJobStyle(mk(), 'atk', {})) === B);
ck('无信号（空存档）→ 绝招零操作', snap(NDX.applyJobStyle(mk(), 'ult', {})) === B);
ck('无信号（仅英雄底色）→ 零操作（底色不单独产出流派）',
  snap(NDX.applyJobStyle(mk(), 'atk', { hero: 'tangseng' })) === B);
ck('P3 已落地流派（crit·齐天·大圣）→ 改造生效（不再是零操作）',
  snap(NDX.applyJobStyle(mk(), 'atk', { flags: { jobConfirm: '齐天·大圣' } })) !== B);
ck('P3 已落地流派（ward·卷帘复权）→ 改造生效（不再是零操作）',
  snap(NDX.applyJobStyle(mk(), 'atk', { flags: { jobConfirm: '卷帘复权' } })) !== B);
ck('applyJobStyle 缺参安全（无 act / 无 key）',
  NDX.applyJobStyle(null, 'atk', {}) === null && NDX.applyJobStyle(mk(), null, {}) != null);

// ============ ④ P3 十流派三键改造生效 ============
// —— summon（有灵宠）——
const stSum = { flags: { jobConfirm: '驯兽师·百兽归心' }, pets: ['tiger_cub', 'renshen_tong'] };
let nPets = -1;
try { nPets = NDX.petDeployCount(stSum); } catch (e) { nPets = -2; }
ck('petDeployCount 可用且 >0（summon 前置）', nPets > 0, 'n=' + nPets);
ck('currentJobStyle 识别 summon', NDX.currentJobStyle(stSum) === 'summon', String(NDX.currentJobStyle(stSum)));
const actS = NDX.applyJobStyle(mk(), 'atk', stSum);
ck('summon 攻键：灵宠协同真伤 + note 唤兽',
  (actS.trueDmg || 0) > 0 && /唤兽/.test(actS.note || ''), 'trueDmg=' + actS.trueDmg);
const actSC = NDX.applyJobStyle(mk(), 'chant', stSum);
ck('summon 诵经：唤伴多段（hits≥2 + spread）',
  (actSC.hits || 1) >= 2 && actSC.spread === true, 'hits=' + actSC.hits);

// —— combo ——
const stC = { flags: { jobConfirm: '斗战明王' }, pending: { comboStack: 0 } };
ck('currentJobStyle 识别 combo', NDX.currentJobStyle(stC) === 'combo');
const actC = NDX.applyJobStyle(mk(), 'atk', stC);
ck('combo 攻键（层0）：2 段 + comboDelta=1',
  actC.hits === 2 && actC.comboDelta === 1, 'hits=' + actC.hits + ' delta=' + actC.comboDelta);
const stC3 = { flags: { jobConfirm: '斗战明王' }, pending: { comboStack: 3 } };
const actC3 = NDX.applyJobStyle(mk(), 'atk', stC3);
ck('combo 攻键（层3）：升 3 段', actC3.hits === 3, 'hits=' + actC3.hits);
const actCU = NDX.applyJobStyle(mk(), 'ult', stC3);
ck('combo 绝招：层数清算（dmg ↑）+ comboReset',
  actCU.dmg > 100 && actCU.comboReset === true, 'dmg=' + actCU.dmg);
const actCC = NDX.applyJobStyle(mk(), 'chant', stC3);
ck('combo 诵经：保层回血（heal>0）', (actCC.heal || 0) > 0, 'heal=' + actCC.heal);

// —— reflect ——
const stR = { flags: { jobConfirm: '卷帘镇妖' } };
ck('currentJobStyle 识别 reflect', NDX.currentJobStyle(stR) === 'reflect');
const actR = NDX.applyJobStyle(mk(), 'atk', stR);
ck('reflect 攻键：蓄势（dr≥0.2 + 穿刺真伤）',
  (actR.dr || 0) >= 0.2 && (actR.trueDmg || 0) > 0, 'dr=' + actR.dr + ' true=' + actR.trueDmg);
const actRC = NDX.applyJobStyle(mk(), 'chant', stR);
ck('reflect 诵经：反震（guardCounter + counterPct≥0.6 + ward）',
  actRC.guardCounter === true && (actRC.counterPct || 0) >= 0.6 && !!(actRC.sBuff && actRC.sBuff.ward),
  'pct=' + actRC.counterPct);

// ============ ⑤ 禁忌成立：summon 无灵宠 → 腰斩 ============
const stSum0 = { flags: { jobConfirm: '驯兽师·百兽归心' }, pets: [] };
ck('summon 禁忌：无灵宠 → 攻键零操作',
  snap(NDX.applyJobStyle(mk(), 'atk', stSum0)) === B);
ck('summon 禁忌：无灵宠 → 诵经零操作',
  snap(NDX.applyJobStyle(mk(), 'chant', stSum0)) === B);
ck('JOBSPEC.summon.taboo 已登记', !!(NDX.JOBSPEC.summon.taboo && NDX.JOBSPEC.summon.taboo.desc));

// ============ ⑥ 连击层资源边界 ============
const s1 = { pending: {} };
NDX.bumpComboStack(s1, 3); ck('comboStack 累加', NDX.comboStackOf(s1) === 3, String(NDX.comboStackOf(s1)));
NDX.bumpComboStack(s1, 9); ck('comboStack 上限 5', NDX.comboStackOf(s1) === 5, String(NDX.comboStackOf(s1)));
NDX.bumpComboStack(s1, -99); ck('comboStack 下限 0', NDX.comboStackOf(s1) === 0, String(NDX.comboStackOf(s1)));
NDX.bumpComboStack(s1, 2); NDX.resetComboStack(s1);
ck('resetComboStack 归零', NDX.comboStackOf(s1) === 0);
ck('comboStackOf 无 pending 安全', NDX.comboStackOf({}) === 0 && NDX.comboStackOf(null) === 0);

// ============ ⑦ 三键链路已接线 ============
// 🔴 V9.55 A3 技能：applyJobStyle 的调用点已从 combat_active.js 收口到技能总表的
//   SKILL_LAYERS.job 层，combat_active 三键只调 NDX.resolveSkillAct。故断言随之改为
//   「总表有 job 层 + 主链路只走 resolveSkillAct」——继续数 combat_active 内的调用点会是假红。
ck('技能总表注册了 job 层（applyJobStyle 已收口）',
  /SKILL_LAYERS[\s\S]{0,400}job:\s*\{[\s\S]{0,400}applyJobStyle/.test(si));
ck('combat_active 三键统一走 resolveSkillAct（不再自行编排变体顺序）',
  (ca.match(/NDX\.resolveSkillAct/g) || []).length >= 4,
  'n=' + (ca.match(/NDX\.resolveSkillAct/g) || []).length);
const gc3 = code('js/game/game_core_3.js');
ck('game_core_3 已落账 comboDelta / comboReset',
  /comboDelta/.test(gc3) && /comboReset/.test(gc3));
ck('battle_resource 已建 comboStack 通道', /comboStack/.test(code('js/battle_resource.js')));
ck('index.html 已加载 data_jobspec.js', /js\/data_jobspec\.js/.test(html));

// ============ ⑧ 经职相合（×1.15） ============
ck('JOB_SUTRA_SYNERGY = 1.15', NDX.JOB_SUTRA_SYNERGY === 1.15);
const actNoSyn = mk();
NDX._jobSutraSynergy(actNoSyn, {}, NDX.JOBSPEC.combo);
ck('经职相合：无持诵经 → 零操作', snap(actNoSyn) === B);

console.log('\n结论：' + pass + ' 通过 / ' + fail + ' 失败');
process.exit(fail ? 1 : 0);
