// =============================================================
// _verify_job_merge.js —— 隐藏职「链上叠加」回归门禁
//   真源：docs/《逆道西行》转职系统 · 链上叠加与跨周目继承（v1.0）.md
//
//   守住四件事（都是曾经真实发生过的坑）：
//   A 多职 bonus 必须**全部累加**（旧口径 find+break 丢弃 72% 的 atk）
//   B passive **同名取最大、异名累加**，且逐键套硬顶（全叠会让绝对穿透率破 100%）
//   C 旧存档（只有 jobConfirm 单值、无 jobs）必须零副作用回退
//   D 转职写入必须走 NDX.confirmHiddenJob（禁止裸写 s.flags.jobConfirm）
//   E mount 检查：每个 passive 键都要有战斗侧消费点（防「建表无消费点」的死字段）
// =============================================================
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.join(__dirname, '..');
const sb = { window: {}, console, Math, JSON, Object, Array, Set, Map, Number, String, Boolean, RegExp, Error };
sb.globalThis = sb; sb.NDX = {}; sb.window.NDX = sb.NDX;
vm.createContext(sb);
const load = (rel) => {
  try { vm.runInContext(fs.readFileSync(path.join(ROOT, rel), 'utf8'), sb, { filename: rel }); }
  catch (e) { console.log('  [load fail] ' + rel + ' :: ' + e.message); }
};
[
  'js/data_trials.js', 'js/data_skill_index.js', 'js/data_sutra.js',
  'js/data_equip_core.js', 'js/data_treasure_evo.js', 'js/data_jobspec.js',
].forEach(load);
const NDX = sb.NDX || sb.window.NDX;

let pass = 0; const fails = [];
const ck = (name, ok, extra) => {
  if (ok) { pass++; console.log('  ✅ ' + name); }
  else { fails.push(name + (extra ? ' :: ' + extra : '')); console.log('  ❌ ' + name + (extra ? '\n       ' + extra : '')); }
};
const rel = (f) => path.relative(ROOT, f).replace(/\\/g, '/');
const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');

console.log('===== 隐藏职「链上叠加」门禁 =====');
if (!NDX || !NDX.HIDDEN_JOBS) { console.log('  HIDDEN_JOBS 未加载，门禁无法执行'); process.exit(1); }

// ---------- 取一组可控的样本职 ----------
const allJobs = [];
Object.keys(NDX.HIDDEN_JOBS).forEach((h) => (NDX.HIDDEN_JOBS[h] || []).forEach((j) => allJobs.push(j)));
const chainJobs = (id) => allJobs.filter((j) => j.chainId === id).map((j) => j.job);

console.log('\n-- A. 多职 bonus 全部累加 --');
{
  // 悟空持棒者链：全中时 atk 理论累计必须 ≥ 各步之和（旧口径只留链尾）
  const wk = chainJobs('wk_chibang');
  const names = wk.length ? wk : allJobs.slice(0, 3).map((j) => j.job);
  const sum = (key) => names.reduce((acc, n) => {
    const e = NDX.hiddenJobEntry ? NDX.hiddenJobEntry(null, n) : null;
    const t = e && e.effect && e.effect.bonus && e.effect.bonus.ti;
    return acc + ((t && t[key]) || 0);
  }, 0);
  const r = NDX.mergeJobBonus(names, null);
  const atkNeed = sum('atk'), hpNeed = sum('hp');
  ck('A1 样本链至少 3 职（样本不足则本次无意义）', names.length >= 3, '实测 ' + names.length + ' 职');
  ck('A2 多职合并 atk ≥ 各步之和（不再只取链尾）', (r.ti.atk || 0) >= atkNeed - 1e-9,
    '合并 ' + r.ti.atk + ' vs 累加 ' + atkNeed);
  ck('A3 多职合并 hp ≥ 各步之和', (r.ti.hp || 0) >= hpNeed - 1e-9, '合并 ' + r.ti.hp + ' vs 累加 ' + hpNeed);
  // 旧口径参照：只取最后一个职
  const last = names.length ? NDX.mergeJobBonus([names[names.length - 1]], null) : { ti: {} };
  ck('A4 合并结果严格大于「单取末位」旧口径', (r.ti.atk || 0) > (last.ti.atk || 0),
    '新 ' + r.ti.atk + ' / 旧 ' + last.ti.atk);
}

console.log('\n-- B. passive 同名取最大 / 异名累加 / 逐键硬顶 --');
{
  const caps = NDX.JOB_PASSIVE_CAP || {};
  // 全表所有职一起合并：任何键都不许超硬顶
  const all = NDX.mergeJobPassive(allJobs.map((j) => j.job));
  const over = Object.keys(all).filter((k) => caps[k] != null && all[k] > caps[k] + 1e-9);
  ck('B1 全表合并后无 passive 超硬顶', over.length === 0, over.map((k) => k + '=' + all[k] + '>' + caps[k]).join(' '));
  ck('B2 全表合并后 absolute 穿透类(empty)不破 100%', (all.empty || 0) <= 1.0, '实测 empty=' + all.empty);

  // 定向：同一键多职 ⇒ 取最大而非累加
  const namesWith = (k, want) => {
    const out = [];
    allJobs.forEach((j) => {
      const e = NDX.hiddenJobEntry(null, j.job);
      const p = e && e.effect && e.effect.passive;
      if (p && p[k] != null && (want(p[k]))) out.push(j.job);
    });
    return out;
  };
  const empties = namesWith('empty', (v) => v > 0);
  if (empties.length >= 2) {
    const v = NDX.mergeJobPassive(empties);
    let mx = 0;
    namesWith('empty', (x) => { if (x > mx) mx = x; });
    ck('B3 同名 passive 取最大（非累加）', Math.abs((v.empty || 0) - Math.min(mx, caps.empty)) < 1e-9,
      '合并 ' + v.empty + ' / 单项最大 ' + mx);
    const naiveSum = empties.reduce((a, n) => {
      const e = NDX.hiddenJobEntry(null, n);
      return a + (e.effect.passive.empty || 0);
    }, 0);
    ck('B4 同名不累加（否则会 ' + naiveSum.toFixed(2) + ' 的绝对穿透）', (v.empty || 0) < naiveSum);
  } else {
    ck('B3 同名 passive 取最大（样本不足，跳过）', true);
  }
  // 布尔系
  ck('B5 布尔 passive 取 or', NDX.mergeJobPassive(allJobs.map((j) => j.job)).restored === true);
  // 异名累加：两个不同键互不影响、同时出现
  const bo = Object.keys(NDX.JOB_PASSIVE_BOOL || {});
  ck('B6 passive 键集合已登记硬顶或布尔表',
    allJobs.every((j) => {
      const e = NDX.hiddenJobEntry(null, j.job);
      const p = (e && e.effect && e.effect.passive) || {};
      return Object.keys(p).every((k) => caps[k] != null || bo.indexOf(k) >= 0);
    }));
}

console.log('\n-- C. 旧存档零迁移回退 --');
{
  const legacy = { hero: 'wukong', flags: { jobConfirm: '持棒证道' } };
  const m = NDX.activeJobs(legacy);
  ck('C1 旧存档（无 jobs）回退为单值列表', m.length === 1 && m[0] === '持棒证道', JSON.stringify(m));
  ck('C2 旧存档 currentJob = jobConfirm（语义等价）', NDX.currentJob(legacy) === '持棒证道');
  const nb = NDX.mergeJobBonus(m, null);
  const direct = NDX.hiddenJobEntry(null, '持棒证道');
  ck('C3 旧存档数值与改造前一致（仅末位职生效）',
    nb.ti && direct && direct.effect && direct.effect.bonus && direct.effect.bonus.ti &&
    Object.keys(direct.effect.bonus.ti).every((k) => Math.abs((nb.ti[k] || 0) - direct.effect.bonus.ti[k]) < 1e-9));
  ck('C4 activeJobs 过滤不存在/非法条目',
    JSON.stringify(NDX.activeJobs({ flags: { jobs: ['不存在的职', '', null, '持棒证道'] } })) === JSON.stringify(['持棒证道']));
  ck('C5 空状态安全', Array.isArray(NDX.activeJobs(null)) && NDX.activeJobs(null).length === 0);
}

console.log('\n-- D. 写入端唯一入口 --');
{
  const s = { hero: 'wukong', flags: {} };
  ck('D1 confirmHiddenJob 写入 jobs 并同步 jobConfirm', (() => {
    NDX.confirmHiddenJob(s, '悟空的空');
    NDX.confirmHiddenJob(s, '持棒证道');
    return JSON.stringify(s.flags.jobs) === JSON.stringify(['悟空的空', '持棒证道']) && s.flags.jobConfirm === '持棒证道';
  })());
  const s2 = { flags: {} };
  NDX.confirmHiddenJob(s2, '悟空的空');
  NDX.confirmHiddenJob(s2, '悟空的空');
  ck('D2 重复确认不去重不报错', JSON.stringify(s2.flags.jobs) === JSON.stringify(['悟空的空']));
  ck('D3 非法名不入列', NDX.confirmHiddenJob({ flags: {} }, '') === false);
  // 源码扫描：转职写入点必须走 confirmHiddenJob
  const bad = [];
  ['js/game/game_event_2.js'].forEach((f) => {
    const src = read(f);
    const re = /s\.flags\.jobConfirm\s*=(?!=)/g; let m;   // (?!=) 排除 ===/!== 这类**读取**
    while ((m = re.exec(src))) {
      const before = src.slice(Math.max(0, m.index - 160), m.index);
      if (before.indexOf('confirmHiddenJob') < 0) bad.push(rel(path.join(ROOT, f)) + ':' + src.slice(0, m.index).split('\n').length);
    }
  });
  ck('D4 转职分支禁止裸写 s.flags.jobConfirm', bad.length === 0, bad.join(' | '));
}

console.log('\n-- E. 死字段检查：passive 键必须有战斗侧消费点 --');
{
  const caps = NDX.JOB_PASSIVE_CAP || {}, bo = NDX.JOB_PASSIVE_BOOL || {};
  const keys = new Set();
  allJobs.forEach((j) => {
    const e = NDX.hiddenJobEntry(null, j.job);
    Object.keys((e && e.effect && e.effect.passive) || {}).forEach((k) => keys.add(k));
  });
  const CombatSrc = ['js/combat_part1.js', 'js/combat_active.js', 'js/game/game_combat_1.js', 'js/game/game_combat_2.js']
    .map((f) => { try { return read(f); } catch (e) { return ''; } }).join('\n');
  const dead = [...keys].filter((k) => {
    if (bo[k]) return false;
    const re = new RegExp('\\b' + k + '\\b');
    return !re.test(CombatSrc);
  });
  ck('E1 每个 passive 键都在战斗源码出现（无死字段）', dead.length === 0, dead.join(' '));
  ck('E2 注册表（JOB_PET_SLOT / JOB_TREASURE_SYNERGY）已被消费',
    /JOB_PET_SLOT/.test(read('js/equipment_part3.js')) && /JOB_TREASURE_SYNERGY/.test(read('js/equipment_part3.js')));
  ck('E3 equipment_part3.js 不再硬编码逆兽师职位名',
    !/isAwakened\('逆兽师·百逆归心'\)/.test(read('js/equipment_part3.js')));
}

console.log('\n-- F. 流派与数值补齐 --');
{
  const st = NDX.JOB_STYLE || {};
  const burn = Object.keys(st).filter((k) => st[k] === 'burn');
  ck('F1 burn 流派 ≥3 职（原唯一薄流派）', burn.length >= 3, burn.join('、'));
  const empty = allJobs.filter((j) => { const e = NDX.hiddenJobEntry(null, j); return e && e.effect && Object.keys(e.effect).length === 0; });
  ck('F2 无 effect 空壳隐藏职', empty.length === 0, empty.join('、'));
  const noColor = Object.keys(st).filter((k) => !(NDX.JOB_STYLE_COLOR || {})[st[k]]);
  ck('F3 每个流派都有外观取色（JOB_STYLE_COLOR 全覆盖）', noColor.length === 0, noColor.join(' '));
  ck('F4 跨周目继承常量已定义',
    NDX.JOB_LEGACY_CAP > 0 && NDX.JOB_LEGACY_PCT > 0, 'CAP=' + NDX.JOB_LEGACY_CAP + ' PCT=' + NDX.JOB_LEGACY_PCT);
}

console.log('\n---------------------------------------------');
console.log(`结果：${pass} 通过 / ${fails.length} 失败`);
if (fails.length) { console.log('失败项：'); fails.forEach((f) => console.log('  · ' + f)); process.exit(1); }
