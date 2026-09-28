// _verify_style_model.js — 流派生成模型（P2′ 去英雄化 + P3 十流派）实证探针
// 依据：docs/《逆道西行》英雄底色与流派生成模型（v1.0）.md
//       用户拍板：「英雄的特性只是底色，上面的建筑是装备与劫印与经文共同的叠加。」
// 断言：① 真源契约（底色/劫印映射/经文映射 值域合法，STYLE_LIST ⟷ JOBSPEC）；
//       ② 零副作用（无配装信号 → currentStyle=null、applyJobStyle 逐字节不变，5 英雄 × 3 键）；
//       ③ 底色生效但不锁死（同英雄可被「一枚劫印」转向他路）；
//       ④ 三源驱动（劫印 / 经文 / 隐藏职倾向 各自可独立定路线）；
//       ⑤ 权重单调（劫印越多权重不减）；
//       ⑥ P3 十流派三键改造全量生效（summon 例外：禁忌=无灵宠腰斩，由 _verify_jobspec 覆盖）；
//       ⑦ 死字段不复活（data_jobspec 内无 act.reflect / act.lifesteal 赋值）；
//       ⑧ 三键链路已接线；⑨ P4 本局路线+累计善恶读取口存在。
// 运行：node scripts/_verify_style_model.js
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

// ============ ① 真源契约 ============
ck('NDX.STYLE_LIST 已定义且恰 10 条', Array.isArray(NDX.STYLE_LIST) && NDX.STYLE_LIST.length === 10);
ck('STYLE_LIST ⟷ JOBSPEC 键集合一致',
  NDX.STYLE_LIST.slice().sort().join(',') === Object.keys(NDX.JOBSPEC || {}).sort().join(','),
  'list=' + NDX.STYLE_LIST.join(','));
ck('HERO_STYLE_BASE 覆盖 5 英雄', ['tangseng', 'wukong', 'bajie', 'xiaobailong', 'shaseng']
  .every((h) => NDX.HERO_STYLE_BASE && NDX.HERO_STYLE_BASE[h]));
ck('HERO_STYLE_BASE 值域 ⊆ STYLE_LIST',
  Object.keys(NDX.HERO_STYLE_BASE || {}).every((h) =>
    Object.keys(NDX.HERO_STYLE_BASE[h]).every((s) => NDX.STYLE_LIST.indexOf(s) >= 0)));
ck('SEAL_STYLE_MAP 覆盖六道（战渡隐夺缘逆）',
  ['战', '渡', '隐', '夺', '缘', '逆'].every((d) => NDX.SEAL_STYLE_MAP && Array.isArray(NDX.SEAL_STYLE_MAP[d])));
ck('SEAL_STYLE_MAP 值域 ⊆ STYLE_LIST',
  Object.keys(NDX.SEAL_STYLE_MAP || {}).every((d) =>
    NDX.SEAL_STYLE_MAP[d].every((s) => NDX.STYLE_LIST.indexOf(s) >= 0)));
ck('SUTRA_KIND_STYLE 覆盖 6 种 chantSkill.kind',
  ['zen-heal', 'war-buff', 'glut-ton', 'ward-mantra', 'veil-mantra', 'break-mantra']
    .every((k) => NDX.SUTRA_KIND_STYLE && Array.isArray(NDX.SUTRA_KIND_STYLE[k])));
ck('SUTRA_KIND_STYLE 值域 ⊆ STYLE_LIST',
  Object.keys(NDX.SUTRA_KIND_STYLE || {}).every((k) =>
    NDX.SUTRA_KIND_STYLE[k].every((s) => NDX.STYLE_LIST.indexOf(s) >= 0)));
ck('JOBSPEC_IMPL 已扩到 10/10（P3）',
  Array.isArray(NDX.JOBSPEC_IMPL) && NDX.JOBSPEC_IMPL.length === 10 &&
  NDX.STYLE_LIST.every((s) => NDX.JOBSPEC_IMPL.indexOf(s) >= 0));
ck('JOBSPEC 十张卡 impl 全为 true',
  Object.keys(NDX.JOBSPEC || {}).every((k) => NDX.JOBSPEC[k] && NDX.JOBSPEC[k].impl === true));

// ============ ② 零副作用：无配装信号 → 不显影（存量玩家行为不变） ============
ck('currentStyle 是函数', typeof NDX.currentStyle === 'function');
['tangseng', 'wukong', 'bajie', 'xiaobailong', 'shaseng'].forEach((h) => {
  ck('无信号·' + h + ' → currentStyle=null（底色不得单独产出流派）',
    NDX.currentStyle({ hero: h }) === null, 'got ' + NDX.currentStyle({ hero: h }));
});
const B = snap(mk());
['tangseng', 'wukong', 'bajie', 'xiaobailong', 'shaseng'].forEach((h) => {
  ['atk', 'chant', 'ult'].forEach((k) => {
    ck('无信号·' + h + '·' + k + ' → applyJobStyle 逐字节不变',
      snap(NDX.applyJobStyle(mk(), k, { hero: h })) === B);
  });
});
ck('空存档（无 hero）→ 零操作（默认渡/底色不显影）', snap(NDX.applyJobStyle(mk(), 'atk', {})) === B);

// ============ ③ 底色生效但不锁死：一枚劫印即可转向 ============
ck('唐僧 + 1 枚夺印 → 走吸血流（法伤底色可被一枚劫印转向）',
  NDX.currentStyle({ hero: 'tangseng', seals: [{ dao: '夺' }] }) === 'drain',
  'got ' + NDX.currentStyle({ hero: 'tangseng', seals: [{ dao: '夺' }] }));
ck('龙马 + 1 枚战印 → 走连击流（英雄只是底色）',
  NDX.currentStyle({ hero: 'xiaobailong', seals: [{ dao: '战' }] }) === 'combo',
  'got ' + NDX.currentStyle({ hero: 'xiaobailong', seals: [{ dao: '战' }] }));
ck('悟空 + 1 枚渡印 → 走净化流（物攻底色改走法伤路线）',
  NDX.currentStyle({ hero: 'wukong', seals: [{ dao: '渡' }] }) === 'purify',
  'got ' + NDX.currentStyle({ hero: 'wukong', seals: [{ dao: '渡' }] }));
ck('唐僧 + 1 枚渡印 → 净化（与底色同向，权重叠加）',
  NDX.currentStyle({ hero: 'tangseng', seals: [{ dao: '渡' }] }) === 'purify');

// ============ ④ 三源各自可独立定路线 ============
const _origSutra = NDX.sutraFullById;
const _PASS_KINDS = ['zen-heal', 'war-buff', 'glut-ton', 'ward-mantra', 'veil-mantra', 'break-mantra'];
NDX.sutraFullById = function (id) {
  if (id === '__test_glut') return { chantSkill: { kind: 'glut-ton' } };
  if (id === '__test_veil') return { chantSkill: { kind: 'veil-mantra' } };
  const _m = /^__pass_(\d+)$/.exec(String(id || ''));   // 被动经替身：轮转 6 种 kind ⇒ 覆盖多条路线
  if (_m) return { chantSkill: { kind: _PASS_KINDS[((parseInt(_m[1], 10) - 1) % _PASS_KINDS.length)] } };
  return _origSutra ? _origSutra.apply(this, arguments) : null;
};
// —— V9.53 用户拍板「经文分技能经与被动经」：两条通道，权重不再一刀切 ——
//   技能经 = 持诵位：定 chant 形态 + 高权重，是 BD 主动支点（换经即换套路）
ck('② 技能经（持诵位）足以转向：唐僧 + 单持 glut-ton 经 → 吸血流',
  NDX.currentStyle({ hero: 'tangseng', chantSutra: '__test_glut' }) === 'drain',
  'got ' + NDX.currentStyle({ hero: 'tangseng', chantSutra: '__test_glut' }));
ck('② 技能经（持诵位）足以转向：唐僧 + 单持 veil-mantra 经 → 闪避流',
  NDX.currentStyle({ hero: 'tangseng', chantSutra: '__test_veil' }) === 'evade',
  'got ' + NDX.currentStyle({ hero: 'tangseng', chantSutra: '__test_veil' }));
ck('② 技能经 + 1 枚劫印 → 叠加转向',
  NDX.currentStyle({ hero: 'tangseng', chantSutra: '__test_glut', seals: [{ dao: '夺' }] }) === 'drain',
  'got ' + NDX.currentStyle({ hero: 'tangseng', chantSutra: '__test_glut', seals: [{ dao: '夺' }] }));

//   被动经 = 持有位：只叠属性不换形态，权重恒 < 底色 ⇒ 永远只是「微调」
const _passive8 = { hero: 'tangseng', sutras: ['__test_glut', '__test_veil', '__pass_1', '__pass_2', '__pass_3', '__pass_4', '__pass_5', '__pass_6'] };
ck('② 被动经可枚举：持有位全本（除持诵位）去重列出',
  NDX.passiveSutraIds(_passive8).length === 8 &&
  NDX.passiveSutraIds({ chantSutra: '__test_glut', sutras: ['__test_glut'] }).length === 0,
  'got ' + NDX.passiveSutraIds(_passive8).length);
ck('② 被动经路线去重：同向经不重复计权重',
  NDX.passiveSutraStyles({ hero: 'tangseng', sutras: ['__test_glut', '__test_veil'] }).length === 2);
ck('② 被动经类型判定：非持诵位一律 passive（位置判定优先）',
  NDX.sutraConsumeKind({ chantSutra: '__keep' }, '__test_glut') === 'passive' &&
  NDX.sutraConsumeKind({ chantSutra: '__test_glut' }, '__test_glut') === 'chant');
ck('② 被动经不换 chant 形态（形态只归持诵位的技能经）',
  NDX.sutraConsumeKind({}, '__test_glut') === 'passive');
ck('② 被动经**再多也压不倒底色**：8 部被动经 → 仍走净化（封顶 < BASE 1.0）',
  NDX.passiveSutraWeight(_passive8) < NDX.STYLE_W.BASE &&
  NDX.currentStyle(_passive8) === 'purify',
  'w=' + NDX.passiveSutraWeight(_passive8) + ' style=' + NDX.currentStyle(_passive8));
ck('② 被动经封顶 < 一枚劫印（劫印仍比被动经更能改路线）',
  NDX.passiveSutraWeight(_passive8) < NDX.STYLE_W.SEAL);
ck('② 被动经软饱和：部数↑但增速递减（n=1 < n=4 < n=8，且均 < 封顶）',
  NDX.passiveSutraWeight({ hero: 'tangseng', sutras: ['__pass_1'] }) <
  NDX.passiveSutraWeight({ hero: 'tangseng', sutras: ['__pass_1', '__pass_2', '__pass_3', '__pass_4'] }) &&
  NDX.passiveSutraWeight(_passive8) < NDX.STYLE_W.SUTRA_PASSIVE_CAP);
ck('② 被动经 + 1 枚劫印 → 合力转向（被动经可与劫印同向）',
  NDX.currentStyle({ hero: 'tangseng', sutras: ['__test_glut'], seals: [{ dao: '夺' }] }) === 'drain',
  'got ' + NDX.currentStyle({ hero: 'tangseng', sutras: ['__test_glut'], seals: [{ dao: '夺' }] }));
ck('② 技能经权重 > 被动经合并封顶（两条通道有明确主次）',
  NDX.STYLE_W.SUTRA > NDX.STYLE_W.SUTRA_PASSIVE_CAP);
ck('② 装备权重 = 最高（EQUIP 2.4 > 技能经 1.5 = 用户拍板「核心的数值是装备」）',
  NDX.STYLE_W.EQUIP > NDX.STYLE_W.SEAL && NDX.STYLE_W.EQUIP > NDX.STYLE_W.JOB &&
  NDX.STYLE_W.EQUIP > NDX.STYLE_W.SUTRA);
ck('④ 装备源：件级 style 标签计入权重（P2′-b 预接）',
  NDX.styleWeightVector({ hero: 'tangseng', equips: [{ id: 'x', style: 'crit' }] }).crit >= NDX.STYLE_W.EQUIP,
  'got ' + NDX.styleWeightVector({ hero: 'tangseng', equips: [{ id: 'x', style: 'crit' }] }).crit);
ck('④ 装备源：带 1 件 style 装 → 路线立即转向（装备是核心数值）',
  NDX.currentStyle({ hero: 'tangseng', equips: [{ id: 'x', style: 'crit' }] }) === 'crit',
  'got ' + NDX.currentStyle({ hero: 'tangseng', equips: [{ id: 'x', style: 'crit' }] }));
ck('④ 装备源：未打标签的现网件（taomu_sword）贡献恒为 0（零副作用）',
  NDX.styleWeightVector({ hero: 'tangseng', equips: [{ id: 'taomu_sword', set: '取经人' }] }).crit === 0);
// 🔴 S04 §⑤-1（2026-09-27 用户拍板「打」）：EQUIP 权重由「恒为 0」转为「已生效」
const _POJUN = (NDX.equipById ? NDX.equipById('set_weapon_top') : null) || {};
ck('④ 装备源：BD 核心装件「破军枪」已打 style 标签（EQUIP 权重已落地）',
  _POJUN.style === 'combo', 'got ' + JSON.stringify(_POJUN.style));
ck('④ 装备源：真源 ≥1 件带 style（EQUIP 2.4 不再恒为 0）',
  [].concat(NDX.EQUIP_POOL || [], NDX.CRAFT_POOL || []).filter((e) => e && e.style).length >= 1);
// 装件标签 → currentStyle 翻转：唐僧底色 purify(1.0) 被 1 件破军枪(combo 2.4) 压过
const _tangGun = { hero: 'tangseng', equips: [Object.assign({}, _POJUN)] };
ck('④ 装件标签→currentStyle 翻转：唐僧持破军枪 ⇒ 底色 purify 被翻为 combo',
  NDX.currentStyle(_tangGun) === 'combo' &&
  NDX.styleWeightVector(_tangGun).combo >= NDX.STYLE_W.EQUIP,
  'got ' + NDX.currentStyle(_tangGun));
ck('④ 装件标签→currentStyle 翻转：空装时唐僧仍不显影（翻转由装备触发，非统计漂移）',
  NDX.currentStyle({ hero: 'tangseng' }) === null);
NDX.sutraFullById = _origSutra;
ck('③ 隐藏职源：唐僧 + 转职净化职（弃经金蝉）→ 净化流',
  NDX.currentStyle({ hero: 'tangseng', flags: { jobConfirm: '弃经金蝉' } }) === 'purify');
ck('③ 隐藏职源：沙僧 + 转职反伤职（卷帘镇妖）→ 反伤流',
  NDX.currentStyle({ hero: 'shaseng', flags: { jobConfirm: '卷帘镇妖' } }) === 'reflect');

// ============ ⑤ 权重单调 ============
const _w1 = NDX.styleWeightVector({ hero: 'tangseng', seals: [{ dao: '夺' }] });
const _w3 = NDX.styleWeightVector({ hero: 'tangseng', seals: [{ dao: '夺' }, { dao: '夺' }, { dao: '夺' }] });
ck('劫印数量 → 该路线权重单调不减', _w3.drain > _w1.drain && _w1.drain > 0,
  '_w1=' + _w1.drain + ' _w3=' + _w3.drain);
ck('权重向量覆盖全部 10 路线', NDX.STYLE_LIST.every((s) => typeof _w1[s] === 'number'));

// ============ ⑥ P3 十流派三键改造生效 ============
const styleJob = {};
Object.keys(NDX.JOB_STYLE || {}).forEach((j) => { const st = NDX.JOB_STYLE[j]; if (!styleJob[st]) styleJob[st] = j; });
NDX.STYLE_LIST.forEach((st) => {
  if (st === 'summon') return; // 禁忌：无灵宠腰斩（由 _verify_jobspec 用带宠存档覆盖）
  const s = { hero: 'tangseng', flags: { jobConfirm: styleJob[st] } };
  ck('P3·' + st + ' 攻键改造生效', snap(NDX.applyJobStyle(mk(), 'atk', s)) !== B);
  ck('P3·' + st + ' 诵键改造生效', snap(NDX.applyJobStyle(mk(), 'chant', s)) !== B);
});
// summon：给一个不报错的最小存档，确认其「无灵宠 → 零操作」的禁忌契约
ck('P3·summon 无灵宠 → 零操作（禁忌成立）',
  snap(NDX.applyJobStyle(mk(), 'atk', { hero: 'tangseng', flags: { jobConfirm: styleJob.summon } })) === B);

// ============ ⑦ 死字段不复活 ============
const dj = code('js/data_jobspec.js');
ck('data_jobspec 无 act.reflect 赋值（死字段）', !/act\.reflect\s*=/.test(dj));
ck('data_jobspec 无 act.lifesteal 赋值（死字段）', !/act\.lifesteal\s*=/.test(dj));
ck('data_jobspec 无 act.pierce 赋值（死字段）', !/act\.pierce\s*=/.test(dj));
ck('data_jobspec 只写活原语（含 shield/dr/dot/trueDmg/armorBreak/evaUp/cleanse/heal）',
  /act\.shield\s*=/.test(dj) && /act\.dr\s*=/.test(dj) && /act\.dot\s*=/.test(dj) &&
  /act\.trueDmg\s*=/.test(dj) && /act\.armorBreak\s*=/.test(dj) &&
  /act\.evaUp\s*=/.test(dj) && /act\.cleanse\s*=/.test(dj) && /act\.heal\s*=/.test(dj));

// ============ ⑧ 三键链路已接线 ============
const ca = code('js/combat_active.js');
// 🔴 V9.55 A3 技能：applyJobStyle 的四个调用点已收口到技能总表 SKILL_LAYERS.job，
//   combat_active 三键只调 NDX.resolveSkillAct。断言改为「总表注册 job 层 + 主链路走 resolveSkillAct」。
const _si = code('js/data_skill_index.js');
const _hits = (ca.match(/NDX\.resolveSkillAct/g) || []).length;
ck('combat_active 三键统一走 resolveSkillAct（= 4 处：atk/chant/ult主/兜底）', _hits >= 4, 'got ' + _hits);
ck('技能总表 SKILL_LAYERS.job 承接 applyJobStyle',
  /SKILL_LAYERS[\s\S]{0,400}job:\s*\{[\s\S]{0,400}applyJobStyle/.test(_si));
ck('applyJobStyle 驱动源为 currentStyle', /currentStyle/.test(dj) && /applyJobStyle = function[\s\S]{0,400}currentStyle/.test(dj));
ck('applyUltVariant 支持 style 覆盖（P2′ 大招随路线）',
  /applyUltVariant = function \(act, heroId, tier, jobKey, styleOverride\)/.test(code('js/data_skill_variant.js')));

// ============ ⑨ P4 本局路线 + 累计善恶 ============
ck('NDX.daoRouteBrief 已定义（P4 读取口）', typeof NDX.daoRouteBrief === 'function');
const _rb = NDX.daoRouteBrief({ hero: 'tangseng', seals: [{ dao: '夺' }], good: 18, evil: 5 });
ck('daoRouteBrief 返回 route/good/evil', _rb && _rb.style === 'drain' && _rb.good === 18 && _rb.evil === 5,
  JSON.stringify(_rb));
ck('daoRouteBrief 无信号 → style=null 但善恶仍可读',
  NDX.daoRouteBrief({ hero: 'tangseng', good: 3 }).style === null);
ck('ui_panel_2 已渲染 routeBrief（两个面板）',
  (code('js/ui/ui_panel_2.js').match(/routeBrief/g) || []).length >= 2);

console.log('\n结论：' + pass + ' 通过 / ' + fail + ' 失败');
process.exit(fail ? 1 : 0);
