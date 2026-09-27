// _verify_follower_fuse.js — A2 随从「点化」三阶体系 + 驯兽师死锁修复 实证探针
// 依据：docs/《逆道西行》随从系统 · 点化三阶体系（v1.0）.md
//       用户 2026-09-25 拍板：「炼化不符合西游背景，参照冒险日记重新设计」
//       旧探针（v1.0 三阶炼化）已随机制重写作废，本文件即 v2.0 门禁。
// 断言：① 三阶定义（本相/显形/证道 + 倍率）；
//       ② 机缘表完整性（12 妖王全覆盖 / 条件白名单 / 可确定性判定）；
//       ③ 零副作用（无 followerTiers ⇒ 全按本相 ×1.0；followerBonus 不传 s 不变）；
//       ④ 机缘路径（条件达成 ⇒ 原地升阶、不损失任何随从；未达成 ⇒ 拒绝）；
//       ⑤ 渡引路径（献同阶随从为引，失败路径全拒绝）；
//       ⑥ 可行方案枚举（机缘优先、不足 2 名同阶无渡引）；
//       ⑦ 死锁已修：驯兽师门槛「随从≥N + 御兽套」+ 逆兽师单源；
//       ⑧ summon 平行线（非驯兽师零操作 / 封顶）；
//       ⑨ UI 与 action 已接线且「炼化」术语已全线退役；⑩ 纪律项。
// 运行：node scripts/_verify_follower_fuse.js
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

// ============ ① 三阶定义 ============
ck('FOLLOWER_TIERS 三阶齐备（fan/ling/zhen）',
  ['fan', 'ling', 'zhen'].every((k) => NDX.FOLLOWER_TIERS && NDX.FOLLOWER_TIERS[k]));
ck('阶名已回归西游（本相 / 显形 / 证道）',
  NDX.FOLLOWER_TIERS.fan.name === '本相' &&
  NDX.FOLLOWER_TIERS.ling.name === '显形' &&
  NDX.FOLLOWER_TIERS.zhen.name === '证道',
  [NDX.FOLLOWER_TIERS.fan.name, NDX.FOLLOWER_TIERS.ling.name, NDX.FOLLOWER_TIERS.zhen.name].join('/'));
ck('阶数倍率 = 1.0 / 1.8 / 2.5（继承 v1.0 平衡）',
  NDX.FOLLOWER_TIERS.fan.mult === 1.0 && NDX.FOLLOWER_TIERS.ling.mult === 1.8 &&
  NDX.FOLLOWER_TIERS.zhen.mult === 2.5,
  'got ' + [NDX.FOLLOWER_TIERS.fan.mult, NDX.FOLLOWER_TIERS.ling.mult, NDX.FOLLOWER_TIERS.zhen.mult].join('/'));
ck('FOLLOWER_TIER_ORDER 恰 3 阶且有序',
  Array.isArray(NDX.FOLLOWER_TIER_ORDER) && NDX.FOLLOWER_TIER_ORDER.join(',') === 'fan,ling,zhen');

// ============ ② 机缘表完整性 ============
const RIT = NDX.FOLLOWER_RITUALS || {};
const FOLLOWER_IDS = Object.keys(NDX.FOLLOWERS || {});
ck('机缘表存在且为对象', !!RIT && typeof RIT === 'object');
ck('机缘表覆盖全部 ' + FOLLOWER_IDS.length + ' 名妖王（无孤儿随从）',
  FOLLOWER_IDS.length > 0 && FOLLOWER_IDS.every((id) => !!RIT[id]),
  '缺：' + FOLLOWER_IDS.filter((id) => !RIT[id]).join(','));
ck('每条机缘既有 toLing 又有 toZhen，且 conds 非空',
  Object.keys(RIT).every((id) => !!(RIT[id].toLing && RIT[id].toLing.conds.length) &&
                                  !!(RIT[id].toZhen && RIT[id].toZhen.conds.length)));
ck('每条机缘都有人类可读的 text（UI 直接展示）',
  Object.keys(RIT).every((id) => !!(RIT[id].toLing.text && RIT[id].toZhen.text)));
const _condTypes = {};
Object.keys(RIT).forEach((id) => ['toLing', 'toZhen'].forEach((k) =>
  RIT[id][k].conds.forEach((c) => { _condTypes[c.type] = (_condTypes[c.type] || 0) + 1; })));
ck('条件类型全部落在白名单（可确定性判定，无随机）',
  Object.keys(_condTypes).every((t) => ['item', 'seal', 'good', 'evil', 'with', 'act'].indexOf(t) >= 0),
  JSON.stringify(_condTypes));
ck('条件均有判定参数（item→id/name，good/evil→n，with/act→id/min）',
  Object.keys(RIT).every((id) => ['toLing', 'toZhen'].every((k) =>
    RIT[id][k].conds.every((c) => {
      if (c.type === 'item') return !!(c.id || c.name);
      if (c.type === 'good' || c.type === 'evil') return typeof c.n === 'number';
      if (c.type === 'with') return !!c.id;
      if (c.type === 'act') return typeof c.min === 'number';
      if (c.type === 'seal') return !!c.id;
      return false;
    }))));
// 机缘可达性：item 条件引用的法宝必须真实存在（否则该路永远空转）
const _itemNames = new Set();
Object.keys(RIT).forEach((id) => ['toLing', 'toZhen'].forEach((k) =>
  RIT[id][k].conds.forEach((c) => { if (c.type === 'item') _itemNames.add(c.name || c.id); })));
// 实收装备名/id 全集（真源：EQUIP_POOL / TREASURES）—— 取不到就判失败，不许空过
const _equipNames = new Set(), _equipIds = new Set();
(NDX.EQUIP_POOL || []).forEach((e) => { if (e) { if (e.name) _equipNames.add(e.name); if (e.id) _equipIds.add(e.id); } });
Object.keys(NDX.TREASURES || {}).forEach((k) => {
  const v = (NDX.TREASURES || {})[k];
  if (v) { if (v.name) _equipNames.add(v.name); if (v.id) _equipIds.add(v.id); }
  if (Array.isArray(v)) v.forEach((x) => { if (x) { if (x.name) _equipNames.add(x.name); if (x.id) _equipIds.add(x.id); } });
});
ck('装备真源已实收（否则「法宝可达性」断言会空过）',
  _equipNames.size > 0, 'EQUIP_POOL / TREASURES 均未取到');
ck('机缘引用的法宝均见于装备表（防死条件：条件永不达成）',
  _itemNames.size > 0 && Array.from(_itemNames).every((nm) => {
    const name = String(nm);
    return _equipNames.has(name) || _equipIds.has(name);
  }),
  '未见于装备表：' + Array.from(_itemNames).filter((nm) => !_equipNames.has(String(nm)) && !_equipIds.has(String(nm))).join(','));
// with 条件必须指向真实随从 id
const _withIds = [];
Object.keys(RIT).forEach((id) => ['toLing', 'toZhen'].forEach((k) =>
  RIT[id][k].conds.forEach((c) => { if (c.type === 'with') _withIds.push(c.id); })));
ck('羁绊条件（with）均指向真实随从 id',
  _withIds.length > 0 && _withIds.every((fid) => !!RIT[fid]),
  '未收服即得：' + _withIds.filter((fid) => !RIT[fid]).join(','));

// ============ ③ 零副作用 ============
const mk = (followers, tiers) => ({ followers: (followers || []).slice(), followerTiers: tiers || undefined });
ck('无 followerTiers ⇒ followerTierOf 恒为 fan',
  ['huangfeng', 'baigu', 'niumo'].every((id) => NDX.followerTierOf({}, id) === 'fan'));
ck('无 followerTiers ⇒ followerMultOf 恒为 1.0', NDX.followerMultOf({}, 'huangfeng') === 1.0);
ck('未知阶名 ⇒ 回落 fan（防脏存档）',
  NDX.followerTierOf({ followerTiers: { huangfeng: '不存在的阶' } }, 'huangfeng') === 'fan');
const _base = NDX.followerBonus(['huangfeng']);
const _base2 = NDX.followerBonus(['huangfeng'], { followerTiers: { huangfeng: 'fan' } });
ck('followerBonus 不传 s ≡ 传 fan 阶（旧行为逐字节不变）',
  JSON.stringify(_base) === JSON.stringify(_base2),
  JSON.stringify(_base) + ' vs ' + JSON.stringify(_base2));
ck('followerBonus 空列表 → 全 0',
  JSON.stringify(NDX.followerBonus([])) === JSON.stringify({ atk: 0, hp: 0, dr: 0, matk: 0, mdef: 0 }));

// ============ ④ 机缘路径（v2.0 新增·核心） ============
// 黄风大圣：显形条件 = 持「定风珠」
ck('机缘未达成（无定风珠）→ 拒绝点化',
  NDX.fuseFollowers(mk(['huangfeng']), 'huangfeng', []).ok === false);
const sR1 = mk(['huangfeng']);
sR1.equips = [{ id: 'dingfeng', name: '定风珠' }];
const rR1 = NDX.fuseFollowers(sR1, 'huangfeng', []);
ck('机缘达成（持定风珠）→ 原地升「显形」，不消耗随从',
  rR1 && rR1.ok === true && rR1.channel === 'ritual' && rR1.to === 'ling' &&
  sR1.followers.length === 1 && NDX.followerTierOf(sR1, 'huangfeng') === 'ling',
  JSON.stringify(rR1) + ' / ' + JSON.stringify(sR1.followers));
ck('升阶后 followerBonus ×1.8 生效',
  Math.abs(NDX.followerBonus(['huangfeng'], sR1).atk - (NDX.FOLLOWERS.huangfeng.atk * 1.8)) < 1e-9,
  'got ' + NDX.followerBonus(['huangfeng'], sR1).atk);
// 证道机缘：黄风大圣 toZhen = 恶≥25 或 地区≥2
const sR2 = mk(['huangfeng'], { huangfeng: 'ling' });
sR2.evil = 30;
const rR2 = NDX.fuseFollowers(sR2, 'huangfeng', []);
ck('灵阶 + 机缘（恶≥25）→ 升「证道」',
  rR2 && rR2.ok && rR2.to === 'zhen' && NDX.followerTierOf(sR2, 'huangfeng') === 'zhen', JSON.stringify(rR2));
// 羁绊机缘：红孩儿 ← 同行牛魔王
const sR3 = mk(['honghaier', 'niumo']);
const rR3 = NDX.fuseFollowers(sR3, 'honghaier', []);
ck('羁绊机缘（同行牛魔王）→ 红孩儿原地升阶且双方都在册',
  rR3 && rR3.ok && rR3.channel === 'ritual' &&
  sR3.followers.length === 2 && NDX.followerTierOf(sR3, 'honghaier') === 'ling',
  JSON.stringify(rR3) + ' / ' + JSON.stringify(sR3.followers));
ck('机缘路径不触发 companionLineup 清理（无人被消耗）',
  (function () {
    const st = { followers: ['honghaier', 'niumo'], followerTiers: {}, companionLineup: ['f:honghaier', 'f:niumo'] };
    NDX.fuseFollowers(st, 'honghaier', []);
    return st.companionLineup.length === 2;
  })());

// ============ ⑤ 渡引路径（兜底出口） ============
const s1 = mk(['huangfeng', 'baigu']);
const r1 = NDX.fuseFollowers(s1, 'huangfeng', ['baigu']);
ck('渡引成功：献同阶随从 → 主体升「显形」',
  r1 && r1.ok === true && r1.channel === 'guide' && r1.to === 'ling' && r1.toName === '显形', JSON.stringify(r1));
ck('渡引消耗为引者（从随从册扣除）',
  s1.followers.length === 1 && s1.followers[0] === 'huangfeng', JSON.stringify(s1.followers));
const s2 = { followers: ['huangfeng', 'baigu'], followerTiers: {}, companionLineup: ['f:huangfeng', 'f:baigu'] };
NDX.fuseFollowers(s2, 'huangfeng', ['baigu']);
ck('渡引后阵容自动剔除被消耗者',
  s2.companionLineup.indexOf('f:baigu') < 0 && s2.companionLineup.indexOf('f:huangfeng') >= 0,
  JSON.stringify(s2.companionLineup));
// 二段收敛：4 本相 → 2 显形 → 1 证道
const s3 = mk(['huangfeng', 'baigu', 'niumo', 'liuer']);
NDX.fuseFollowers(s3, 'huangfeng', ['baigu']);
NDX.fuseFollowers(s3, 'niumo', ['liuer']);
ck('4 本相 → 2 显形',
  s3.followers.length === 2 && NDX.followerTierOf(s3, 'huangfeng') === 'ling' && NDX.followerTierOf(s3, 'niumo') === 'ling',
  JSON.stringify(s3.followers));
const r3 = NDX.fuseFollowers(s3, 'huangfeng', ['niumo']);
ck('2 显形 → 1 证道（收敛出口 4 → 1 保留）',
  r3 && r3.ok && r3.to === 'zhen' && s3.followers.length === 1 && NDX.followerTierOf(s3, 'huangfeng') === 'zhen',
  JSON.stringify(r3) + ' / ' + JSON.stringify(s3.followers));

// 渡引失败路径
const s4 = mk(['huangfeng', 'baigu', 'niumo']);
ck('无主体（不在册）→ 拒绝', NDX.fuseFollowers(s4, '不存在的随从', ['huangfeng']).ok === false);
ck('为引者与主体同 id → 拒绝（防自吞）', NDX.fuseFollowers(s4, 'huangfeng', ['huangfeng']).ok === false);
ck('为引者不在册 → 拒绝', NDX.fuseFollowers(s4, 'huangfeng', ['不存在']).ok === false);
const s5 = { followers: ['huangfeng', 'baigu'], followerTiers: { huangfeng: 'ling', baigu: 'fan' } };
ck('不同阶 → 拒绝', NDX.fuseFollowers(s5, 'huangfeng', ['baigu']).ok === false);
// 已是证道 → 两条路都拒绝
const s6 = { followers: ['huangfeng', 'baigu'], followerTiers: { huangfeng: 'zhen', baigu: 'zhen' } };
ck('已是「证道」→ 渡引拒绝', NDX.fuseFollowers(s6, 'huangfeng', ['baigu']).ok === false);
ck('已是「证道」→ 机缘亦拒绝（无更高阶）', NDX.fuseFollowers(s6, 'huangfeng', []).ok === false);
ck('失败不改变 s（原子性：随从册与阶数均不变）',
  s6.followers.length === 2 && NDX.followerTierOf(s6, 'huangfeng') === 'zhen');

// ============ ⑥ 可行方案枚举（机缘优先） ============
const opts = NDX.followerFuseOptions(mk(['huangfeng', 'baigu', 'niumo']));
ck('无装备/无善恶 ⇒ 只有渡引方案（机缘一条都不出）',
  opts.length === 3 && opts.every((o) => o.channel === 'guide'), 'got ' + opts.length);
ck('方案带 channel / mainId / feedIds / to / toName', opts.length > 0 &&
  !!opts[0].mainId && Array.isArray(opts[0].feedIds) && opts[0].feedIds.length === 1 &&
  !!opts[0].to && !!opts[0].toName);
ck('机缘方案排在渡引之前（玩家首先看得到机缘）',
  (() => {
    const st = mk(['huangfeng', 'baigu']);
    st.equips = [{ id: 'dingfeng', name: '定风珠' }];
    const o = NDX.followerFuseOptions(st);
    return o.length >= 2 && o[0].channel === 'ritual' && o[0].mainId === 'huangfeng';
  })());
ck('不足 2 名同阶 → 无渡引方案（但机缘仍可点化）',
  NDX.followerFuseOptions(mk(['huangfeng'])).length === 0 &&
  (function () {
    const st = mk(['huangfeng']);
    st.equips = [{ id: 'dingfeng', name: '定风珠' }];
    return NDX.followerFuseOptions(st).length === 1;
  })());
ck('空册 → 无可行方案', NDX.followerFuseOptions({}).length === 0);
ck('followerTierSummary 计数正确',
  JSON.stringify(NDX.followerTierSummary(mk(['huangfeng', 'baigu']))) === JSON.stringify({ fan: 2, ling: 0, zhen: 0, total: 2 }));
ck('followerRitualOf 返回机缘进度（未达成时 unmet 有文案、达成时 met 有文案）', (function () {
  const a = NDX.followerRitualOf(mk(['huangfeng']), 'huangfeng');
  const b = mk(['huangfeng']); b.equips = [{ id: 'dingfeng', name: '定风珠' }];
  const r = NDX.followerRitualOf(b, 'huangfeng');
  return a && a.ready === false && a.toLing.unmet.length > 0 && a.toZhen === null &&
         r && r.ready === true && r.toLing.met.length > 0 && r.toZhen === null;
})());
ck('灵阶才查证道机缘（本相阶 toZhen 恒为 null，避免误判）',
  (function () {
    const st = mk(['huangfeng'], { huangfeng: 'ling' });
    st.equips = [{ id: 'dingfeng', name: '定风珠' }];
    const r = NDX.followerRitualOf(st, 'huangfeng');
    return r.from === 'ling' && r.toLing === null && r.toZhen && r.toZhen.unmet.length > 0;
  })());

// ============ ⑦ 死锁已修（门槛真源） ============
const trialsSrc = code('js/data_trials.js');
const fuseSrc = code('js/data_follower_fuse.js');
ck('驯兽师 cond 已改为「随从≥3 + 御兽套」', /cond: '夺 \+ 随从≥3 \+ 御兽套'/.test(trialsSrc));
ck('逆兽师 cond 已改为「随从≥3 + 御兽套」', /cond: '逆 \+ 随从≥3 \+ 御兽套'/.test(trialsSrc));
ck('旧门槛「出阵灵兽≥」不得复活（活动引用为 0）',
  !/c\.indexOf\('出阵灵兽≥'\)/.test(trialsSrc), 'data_trials 仍有活动引用');
ck('_KNOWN 语法表含「随从≥N」与「御兽套」',
  /\^随从≥\\d\+\$/.test(trialsSrc) && /\^御兽套\$/.test(trialsSrc));
ck('逆兽师觉醒走 evalHiddenCond（单一真源，杜绝两处漂移）',
  /evalHiddenCond\('逆 \+ 随从≥3 \+ 御兽套'/.test(code('js/game/game_event_2.js')));
const _eqYushou = [{ id: 'yushou_x', set: '御兽', slot: 'armor' }];
ck('随从不足 3 → 门槛判负',
  NDX.evalHiddenCond('夺 + 随从≥3 + 御兽套', { followers: ['huangfeng'], disciples: [], equips: _eqYushou }, { fate: '夺' }).ok === false);
ck('随从足但无御兽套 → 门槛判负',
  NDX.evalHiddenCond('夺 + 随从≥3 + 御兽套',
    { followers: ['huangfeng', 'baigu', 'niumo'], disciples: [], equips: [] }, { fate: '夺' }).ok === false);
ck('随从≥3（随从＋徒弟合计）且有御兽套 → 门槛通过',
  NDX.evalHiddenCond('夺 + 随从≥3 + 御兽套',
    { followers: ['huangfeng', 'baigu'], disciples: ['yuhua3'], equips: _eqYushou }, { fate: '夺' }).ok === true);

// ============ ⑧ summon 平行线（零操作） ============
ck('isSummonerRoute 定义且非驯兽师 → false',
  typeof NDX.isSummonerRoute === 'function' && NDX.isSummonerRoute({ hero: 'wukong' }) === false);
ck('非驯兽师 → summonerPower = 0 且 summonerFollowerBonus = null',
  NDX.summonerPower({ hero: 'wukong', followers: ['huangfeng'] }) === 0 &&
  NDX.summonerFollowerBonus({ hero: 'wukong', followers: ['huangfeng'] }) === null);
ck('驯兽师 + 2 显形随从 → 御兽之力 3.6 → ×2% = 7.2%', (function () {
  const st = { followers: ['huangfeng', 'baigu'], followerTiers: { huangfeng: 'ling', baigu: 'ling' },
    flags: { jobConfirm: '驯兽师·百兽归心' } };
  const b = NDX.summonerFollowerBonus(st);
  return NDX.summonerPower(st) === 3.6 && b && b.pct === 0.072;
})());
ck('summonerBonus 封顶 = FOLLOWER_FUSE.SUMMONER_CAP（4 格全「证道」）', (function () {
  const many = ['huangfeng', 'baigu', 'niumo', 'liuer'];
  const st = { followers: many, followerTiers: {}, flags: { jobConfirm: '驯兽师·百兽归心' } };
  many.forEach((id) => { st.followerTiers[id] = 'zhen'; });
  const b = NDX.summonerFollowerBonus(st);
  return NDX.summonerPower(st) === 10 && b && b.pct === NDX.FOLLOWER_FUSE.SUMMONER_CAP;
})());

// ============ ⑨ 接线与术语退役 ============
ck('followerBonusCtx 含 followers/followerTiers/summonerBonus',
  (function () {
    const c = NDX.followerBonusCtx({ followers: ['huangfeng'] });
    return c && Array.isArray(c.followers) && 'followerTiers' in c && 'summonerBonus' in c;
  })());
ck('三处 computeStats 调用点均走 followerBonusCtx',
  (code('js/game/game_meta.js').match(/followerBonusCtx/g) || []).length >= 1 &&
  (code('js/game/game_event_2.js').match(/followerBonusCtx/g) || []).length >= 1 &&
  (code('js/attr_calc.js').match(/followerBonusCtx/g) || []).length >= 1);
ck('combat_part1 消费 summonerBonus（驯兽师加成入属性）', /bonus\.summonerBonus/.test(code('js/combat_part1.js')));
ck('followerBonus 读阶数倍率（data_negotiate）', /followerMultOf\(s, id\)/.test(code('js/data_negotiate.js')));
ck('UI 随从册含点化区块与按钮',
  /followerFuseHtml/.test(code('js/ui/ui_misc_2.js')) && /data-action="fuse-follower"/.test(code('js/ui/ui_misc_2.js')));
ck('main.js 已接 case fuse-follower', /case 'fuse-follower'/.test(code('js/main.js')));
ck('index.html 已引入 data_follower_fuse.js', /data_follower_fuse\.js\?v=/.test(html));
// 术语退役：「炼化」不得再作为机制名出现在 UI / action / 真源注释
ck('「炼化」术语已从真源文件退役（仅历史文档可留）',
  !/炼化/.test(fuseSrc), 'data_follower_fuse.js 仍有「炼化」');
ck('UI 区块标题已改为「点化」', /随从点化/.test(code('js/ui/ui_misc_2.js')));
ck('action toast 已改为「点化」', /点化/.test(code('js/main.js')));

// ============ ⑨·五 证道阶羁绊技（A2-2） ============
const _bondSt = (function () {
  const st = mk(['huangfeng', 'niumo', 'baigu']);
  st.followerTiers = { huangfeng: 'zhen', niumo: 'zhen', baigu: 'fan' };
  return st;
})();
ck('羁绊技仅证道阶生效：本相阶不给技',
  NDX.activeFollowerBonds(_bondSt).length === 2 &&
  NDX.activeFollowerBonds(_bondSt).every((b) => b.skill),
  'got ' + NDX.activeFollowerBonds(_bondSt).length);
ck('羁绊技只认**上阵**随从（随行位外不生效）',
  (function () {
    const st = mk(['huangfeng']);          // 在册
    st.followerTiers = { huangfeng: 'zhen' };
    st.companionLineup = [];               // 主动全部撤下 → 待命 ⇒ 不该产出羁绊技
    return NDX.activeFollowerBonds(st).length === 0 &&
      (NDX.companionFollowerIds ? NDX.companionFollowerIds(st).length === 0 : true);
  })(), '待命随从不应产出羁绊技');
ck('羁绊技修正与 FOLLOWERS 助战同字段（走既有 computeStats 通道，无新开战斗接线）',
  ['atk', 'matk', 'hp', 'dr', 'mdef'].every((k) => k in (NDX.FOLLOWER_BONDS.niumo || {})) ||
  Object.keys(NDX.FOLLOWER_BONDS).every((id) =>
    ['atk', 'matk', 'hp', 'dr', 'mdef'].some((k) => k in NDX.FOLLOWER_BONDS[id])));
ck('每条羁绊技都有名称与描述（面板可读，防空壳数据）',
  Object.keys(NDX.FOLLOWER_BONDS).every((id) =>
    NDX.FOLLOWER_BONDS[id].name && NDX.FOLLOWER_BONDS[id].desc));
// ⚠ v1.4 修正：原断言写死「12」且同时要求「每名随从都有条目」——
//   而 `FOLLOWERS` 有 13 名（12 妖王 + 铁扇公主 human 形态）⇒ 两条子条件**互相矛盾**，
//   一旦补上 tieshan 就必然报红。这是「断言写死数字」的同型缺陷（同 A7 的「6 类」）。
//   改为与 `FOLLOWERS` 长度动态对齐；同时把用词从「羁绊技」正名为**本命加持**——
//   本表内容是单只随从的个人加成，真正的「组合」是 `NDX.FOLLOWER_COMBOS`。
ck('本命加持覆盖全部 ' + Object.keys(NDX.FOLLOWERS || {}).length + ' 名随从（无遗漏）',
  Object.keys(NDX.FOLLOWER_BONDS).length === Object.keys(NDX.FOLLOWERS || {}).length &&
  Object.keys(NDX.FOLLOWERS || {}).every((id) => !!NDX.FOLLOWER_BONDS[id]),
  Object.keys(NDX.FOLLOWER_BONDS).length + ' / ' + Object.keys(NDX.FOLLOWERS || {}).length);
ck('无证道随从 → 羁绊修正全 0（存量玩家零副作用）',
  (function () {
    const m = NDX.followerBondMods(mk(['huangfeng']));
    return m.atk === 0 && m.hp === 0 && m.dr === 0 && m.matk === 0 && m.mdef === 0 && m.names.length === 0;
  })());
ck('followerBonusCtx 携带 followerBonds（computeStats 单一来源）',
  (function () {
    const c = NDX.followerBonusCtx(_bondSt);
    return c.followerBonds && c.followerBonds.length === 2;
  })());
ck('combat_part1 消费 followerBonds（羁绊技入属性）', /bonus\.followerBonds/.test(code('js/combat_part1.js')));

// ============ ⑨·六 宠物格流派驱动（A2-3） ============
ck('宠物格：当前路线 = summon ⇒ 直接给满 6 格（不再看隐藏职）',
  NDX.petSlotCapOf({ hero: 'bailongma', equips: [{ id: 'x', style: 'summon' }] }) === NDX.PET_SLOT_SUMMONER,
  'got ' + NDX.petSlotCapOf({ hero: 'bailongma', equips: [{ id: 'x', style: 'summon' }] }));
ck('宠物格：非召唤流仍走原判定（不被流派口污染）',
  NDX.petSlotCapOf({ hero: 'tangseng' }) <= NDX.PET_SLOT_MAX,
  'got ' + NDX.petSlotCapOf({ hero: 'tangseng' }));

// ============ ⑩ 纪律 ============
ck('点化真源无 act.* 死字段赋值', !/act\.(reflect|lifesteal|pierce)\s*=/.test(fuseSrc));
ck('点化真源未直写 s.xinmo（单源纪律）', !/s\.xinmo\s*=/.test(fuseSrc));

console.log('\n结论：' + pass + ' 通过 / ' + fail + ' 失败');
process.exit(fail ? 1 : 0);
