// _verify_hidden_jobs.js — 隐藏转职注册表门禁（V9.51 · 新增）
//
// 断言（对应《四系统复核骨架 v1.0》§3.3 R1/R2 + 用户拍板 Q5）：
//   R1 无孤儿：正文 trials_ch*.js / trials81.js 出现的 hidden.job，
//      必须在 NDX.HIDDEN_JOBS 注册表有同 job 条目 —— 否则 `game_event_2.js:477-527`
//      的 else 分支会「零门槛直得」（后门：不验劫难前置、不验持宝）。
//   R2 链完整：声明 chainId 的链，chainStep 必须 1..N 连续且恰有一条 chainTail:true 收尾。
//   R3 流派可解析：注册表的 job 若在 JOB_STYLE 有条目，其流派标签须为已知值。
//
// 历史背景：V9.23 之前存在 7 条「孤儿职」（正文有种子、注册表无条目）＝ 空壳后门。
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

// ---------- A. 真源存在 ----------
const REG = NDX.HIDDEN_JOBS || null;
ck('A1 HIDDEN_JOBS 存在', !!REG);
if (!REG) { console.log('结论：' + pass + ' 通过 / ' + fail + ' 失败'); process.exit(fail ? 1 : 0); }

// 注册表 job 全集
const regJobs = [];
Object.keys(REG).forEach((hero) => {
  (REG[hero] || []).forEach((h) => { if (h && h.job) regJobs.push({ hero: hero, job: h.job, e: h }); });
});
ck('A2 注册表非空', regJobs.length > 0, 'n=' + regJobs.length);

// ---------- B. R1 无孤儿：正文 hidden.job 必须在注册表 ----------
const bodyFiles = fs.readdirSync(path.join(ROOT, 'js'))
  .filter((f) => /^(trials_ch\d+|trials81|trials_return)\.js$/.test(f))
  .map((f) => path.join(ROOT, 'js', f));
ck('B1 正文文件已发现', bodyFiles.length > 0, 'n=' + bodyFiles.length);

const bodyJobs = [];
bodyFiles.forEach((fp) => {
  let src = '';
  try { src = fs.readFileSync(fp, 'utf8'); } catch (e) { return; }
  // 抓 "hidden": { ... "job": "xxx" } —— 允许跨行，取 hidden 块内最近的 job
  const re = /"hidden"\s*:\s*\{([\s\S]{0,600}?)\}/g;
  let m;
  while ((m = re.exec(src))) {
    const jm = /"job"\s*:\s*"([^"]+)"/.exec(m[1]);
    const hm = /"hero"\s*:\s*"([^"]+)"/.exec(m[1]);
    if (jm) bodyJobs.push({ file: path.basename(fp), job: jm[1], hero: (hm && hm[1]) || null });
  }
});
ck('B2 正文 hidden 种子已解析', bodyJobs.length > 0, 'n=' + bodyJobs.length);

const regJobSet = {};
regJobs.forEach((r) => { regJobSet[r.job] = true; });
const orphans = [];
bodyJobs.forEach((b) => { if (!regJobSet[b.job]) orphans.push(b.file + ':' + b.job); });
ck('B3 R1 无孤儿职（正文种子 ⊆ 注册表）', orphans.length === 0, orphans.join(' / '));

// ---------- C. R2 链完整（chainId / chainStep / chainTail）----------
const chains = {};
regJobs.forEach((r) => {
  const c = r.e.chainId;
  if (!c) return;
  (chains[c] = chains[c] || []).push({ job: r.job, step: Number(r.e.chainStep) || 0, tail: !!r.e.chainTail });
});
let chainBad = '';
Object.keys(chains).forEach((cid) => {
  const arr = chains[cid].slice().sort((a, b) => a.step - b.step);
  for (let i = 0; i < arr.length; i++) {
    if (arr[i].step !== i + 1) { chainBad += cid + '@step' + arr[i].step + ' '; break; }
  }
  const tails = arr.filter((x) => x.tail).length;
  if (tails !== 1) chainBad += cid + '@tail=' + tails + ' ';
});
ck('C1 R2 转职链 step 连续且恰一条收尾', chainBad === '', chainBad);

// ---------- D. R3 流派标签已知 ----------
// 流派标签全集（V9.51 实读 JOB_STYLE：10 种）
const KNOWN_STYLE = ['summon', 'reflect', 'combo', 'crit', 'burn', 'drain', 'evade', 'purify', 'reverse', 'ward'];
let badStyle = '';
regJobs.forEach((r) => {
  const st = (NDX.JOB_STYLE && NDX.JOB_STYLE[r.job]) || null;
  if (st && KNOWN_STYLE.indexOf(st) < 0) badStyle += r.job + '=' + st + ' ';
});
ck('D1 R3 流派标签均为已知值', badStyle === '', badStyle);

// ---------- E. 召唤师槽位接线（防回归）----------
ck('E1 宠物槽常量存在', NDX.PET_SLOT_BASE === 2 && NDX.PET_SLOT_MAX === 4 && NDX.PET_SLOT_SUMMONER === 6,
  [NDX.PET_SLOT_BASE, NDX.PET_SLOT_MAX, NDX.PET_SLOT_SUMMONER].join('/'));
{
  const summoner = (NDX.PET_SUMMONER_JOBS || [])[0];
  const cap = summoner ? NDX.petSlotCapOf({ jobConfirm: summoner }) : 0;
  ck('E2 召唤师获 6 格', cap === 6, summoner + '→' + cap);
  ck('E3 普通上限 4 格', NDX.petSlotCapOf({ petSlotUnlocked: 2 }) === 4);
  ck('E4 齐击边际递减单调', NDX.petSwarmMult(1) === 1 && NDX.petSwarmMult(6) > NDX.petSwarmMult(4) && NDX.petSwarmMult(6) < NDX.petSwarmMult(4) * 1.2,
    [1, 4, 6].map(NDX.petSwarmMult).join('/'));
}

console.log('结论：' + pass + ' 通过 / ' + fail + ' 失败');
process.exit(fail ? 1 : 0);
