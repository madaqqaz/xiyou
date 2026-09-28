// _verify_asset_version.js — index.html 资源版本号一致性门禁（2026-09-27 甲案落地配套，2026-09-27 修订兼容增量 bump）
//
// 背景：index.html 曾出现「?v= 双计数」——主序列 1~543 与发布分支段 7436~7477 并存，
//       83 个去重版本值横跨 6893 级空档，导致「读旧值→算新值」的版本递增纪律根本无法执行。
//       更致命的是 Batch 0 要改的核心文件（main.js / combat_active.js / data_skill_variant.js /
//       game_core_2.js）全部落在高段，改码与版本号纪律会在同一批改动里撞车。
//
// 裁决（甲案，2026-09-27 修订）：
//   1) 版本号「按文件唯一」（拦双计数 / 并列重复）—— 核心不变量，保留。
//   2) 增量 bump 兼容：宪法 §五「改码必递增 ?v=NN」要求被改文件版本号 +1；连续 1..N 是理想态，
//      但增量 bump 必然在连续集中留小断档（被改文件跳到 max+1..），故 A4/A5 由「严格连续 1..N」
//      放宽为「无巨大断档（拦双计数式平行序列）/ 无高位留白」，与 A5 原注释「max+1 递增安全」自洽。
//
// 断言：
//   A1 每个 script/link 的 js/css 资源都带 ?v=（图片/manifest 等豁免）
//   A2 同一文件名不得出现两个不同版本（检测陈旧并列引用）
//   A3 版本号「组内唯一 + 组间唯一」（一个资源一个号；拦双计数/并列重复）
//       🟡 2026-09-28 用户拍板「合并」：核心不变量由「全局唯一」放宽为「合并组内唯一」——
//          同一改动批次的文件共用一个号，N 文件占 1 号 ⇒ bump 通道被压缩，号池寿命 ×N。
//          放宽的同时加严三条（A3b/A3c/S3），防「手滑复制号」这类真实 pathology 乘机溜过。
//   A4 版本号无巨大断档（拦双计数式平行序列：单断档 > BUMP_CEILING 判红；允许增量 bump 的小断档）
//   A5 最高号不超过资源数 + BUMP_SLACK（允许 max+1 递增；拦高位留白）
//   A5b 号池健康度：报出 [1,max] 内的空缺号 —— **新增文件可直接用空缺号，不必把 max 顶上去**
//   A6 ?v= 只出现在 src/href 属性内（防止有人写到别处造成第二真源）
//   S1 反证：把断档检测器喂给一段已知的坏样本，必须报告失败（证明本门禁不是恒真空断言）
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
let pass = 0, fail = 0;
function ck(name, cond, extra) {
  if (cond) { pass++; console.log('ok   ' + name); }
  else { fail++; console.log('FAIL ' + name + (extra ? '  → ' + extra : '')); }
}

// 增量 bump 容差：BUMP_CEILING 拦「双计数式平行版本序列」（原始病理 543↔7477 跨 6893 级）；
// BUMP_SLACK 允许 max 高于资源数（一次增量 bump 最多改数十文件）。
const BUMP_CEILING = 1000;
const BUMP_SLACK = 64;

const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const refs = [];
const re = /<(?:script|link)\b[^>]*?(?:src|href)="([^"]+)"/g;
let m;
while ((m = re.exec(html))) refs.push(m[1]);

const strip = (u) => u.replace(/[?&]v=\d+/, '');
const ver = (u) => { const x = u.match(/[?&]v=(\d+)/); return x ? Number(x[1]) : null; };

// —— A1：js/css 必须带版本 ——
const code = refs.filter((u) => /\.(js|css)$/.test(strip(u)));
const noVer = code.filter((u) => ver(u) === null);
ck('A1 代码资源(' + code.length + ') 全部带 ?v=（' + noVer.length + ' 处缺失）', noVer.length === 0, noVer.join(', '));

// —— A2：同一文件名不得并列两个版本 ——
const byUrl = {};
code.forEach((u) => { (byUrl[strip(u)] = byUrl[strip(u)] || new Set()).add(ver(u)); });
const conflict = Object.entries(byUrl).filter(([, s]) => s.size > 1);
ck('A2 无文件名并列多版本', conflict.length === 0,
  conflict.map(([u, s]) => u + '→' + [...s].join('/')).join(' ; '));

// —— 合并组（V9.70 用户 2026-09-28 拍板「合并」）——
//   同一改动批次的文件共用一个 `?v=`：改组内任一个文件 ⇒ 整组换号，而不是各文件各 +1。
//   · 收益：N 个文件只占 1 个 bump 槽 ⇒ 号池寿命 ×N（这是「池枯竭」的唯一真正解药，
//     扩 BUMP_SLACK 只是把上限抬高，仍是一条会走到底的路）。
//   · 代价：改组内一个文件会连带清掉同组其它文件的缓存（可能多下一次没变的文件）⇒
//     **只合并确实同批联动的文件**，别为省号乱并。
//   · 语义：组内共享号；**组间仍必须唯一**（A3a），S3 反证守住「手滑复制号」这条真实 pathology。
const MERGE_GROUPS = [
  {
    files: ['js/combat_part1.js', 'js/balance_db.js'],
    why: '战斗数值与平衡库同源同批：改缩放公式要同时改 combat_part1.js / balance_db.js 与两处 balance 脚本',
  },
];

// —— A3 / A4 / A5：组内唯一 + 组间唯一 + 无巨大断档 + 无高位留白 ——
const vs = code.map(ver).sort((a, b) => a - b);
const uniq = [...new Set(vs)];
const _filesOf = (n) => code.filter((u) => ver(u) === n).map(strip);
// 撞号明细：同一号被多个文件占用
const _dupNums = uniq.filter((n) => _filesOf(n).length > 1);
const _grpOf = new Map();
MERGE_GROUPS.forEach((g, i) => g.files.forEach((f) => _grpOf.set(f, i)));
// A3a：每个撞号都必须落在**同一个**合并组里（组间撞号 = 不同批次的文件共用号 = 真 pathology）
// 🩸 判空必须显式查 `gs[0] != null`：两个都不在合并组里的文件撞号时，gs = [undefined, undefined]
//    会让 `every(x => x === gs[0])` 恒真 ⇒ 漏判（本条正是放开 A3 后唯一守「手滑复制号」的闸门）。
//   判据做成**纯函数**（filesOf/grpOf 由外部注入），好让 S3/S4 反证喂构件化样本时
//   走的与主断言**完全同一份判据** —— 否则会出现「生产一套逻辑、测试另一套」的假绿灯。
const crossBad = (dupNums, filesOf, grpOf) => dupNums.filter((n) => {
  const gs = filesOf(n).map((f) => grpOf.get(f));
  return !(gs[0] != null && gs.length > 1 && gs.every((x) => x === gs[0]));
});
const _badCross = crossBad(_dupNums, _filesOf, _grpOf);
ck('A3 版本号组内唯一 + 组间唯一（' + vs.length + ' 引用 / ' + uniq.length + ' 个号 / ' + MERGE_GROUPS.length + ' 个合并组）',
  _badCross.length === 0,
  _dupNums.map((n) => 'v' + n + ' → ' + _filesOf(n).join(' , ')).join(' ; ')
  + (_badCross.length ? ' ‖ 跨组合并（须并入 MERGE_GROUPS 或拆号）: ' + _badCross.map((n) => 'v' + n).join(',') : ''));
// A3b：合并组内成员号必须一致（防「组内只改了其中一个的号」，那种半吊子状态比撞号更难查）
const _grpBad = [];
MERGE_GROUPS.forEach((g, gi) => {
  const hit = code.filter((u) => g.files.indexOf(strip(u)) >= 0);
  const vs2 = [...new Set(hit.map(ver))];
  if (vs2.length !== 1) _grpBad.push('组' + gi + '(' + g.files.join('+') + ') 号不一致: ' + vs2.join('/'));
});
ck('A3b 合并组内版本号一致（改一个＝整组换号，不能只改其中一个）', _grpBad.length === 0, _grpBad.join(' ; '));
// A3c：合并组不得重叠（一个文件同属两组 ⇒ 换号时该文件的归属不确定）
const _seen = {}, _ov = [];
MERGE_GROUPS.forEach((g, gi) => g.files.forEach((f) => {
  if (_seen[f] != null) _ov.push(f + '(组' + _seen[f] + '∩组' + gi + ')'); else _seen[f] = gi;
}));
ck('A3c 合并组不重叠（同文件不得同属两组）', _ov.length === 0, _ov.join(' ; '));
const noHugeGap = !detectGaps(uniq, BUMP_CEILING);
ck('A4 版本号无巨大断档（拦双计数式平行序列，单断档>' + BUMP_CEILING + '判红）', noHugeGap,
  '区间 [' + uniq[0] + ',' + uniq[uniq.length - 1] + ']，去重 ' + uniq.length + ' 个');
ck('A5 最高号不超过资源数+' + BUMP_SLACK + '（允许 max+1 递增，无高位留白）', uniq[uniq.length - 1] <= vs.length + BUMP_SLACK,
  'max=' + uniq[uniq.length - 1] + ' 资源数=' + vs.length);
// A5b：号池健康度 —— **空缺号可直接分配，不必顶高 max**（此前把它误判成「池枯竭」，其实是 max 触顶）
const _max = uniq[uniq.length - 1];
const _free = [];
for (let i = 1; i <= _max; i++) if (!uniq.includes(i)) _free.push(i);
console.log('       · 号池：' + uniq.length + ' 个唯一号散布于 1~' + _max
  + '，[1,' + _max + '] 内还有 ' + _free.length + ' 个空缺号可直接分配'
  + '（新增文件用空缺号不会触发 A5；只有 bump 已有文件才会顶高 max）');
ck('A5b 号池未触顶（max < 资源数+SLACK，或已用合并组压住增长）',
  _max <= vs.length + BUMP_SLACK && uniq.length <= vs.length,
  'max=' + _max + ' 唯一号=' + uniq.length + ' 引用=' + vs.length);

// —— A6：?v= 只出现在 src/href 内 ——
// 取「带 ?v= 但不是 script/link 的 src/href」的命中数
const stray = [...html.matchAll(/[?&]v=\d+/g)].filter((x) => {
  const lineStart = html.lastIndexOf('\n', x.index) + 1;
  const line = html.slice(lineStart, html.indexOf('\n', x.index) < 0 ? html.length : html.indexOf('\n', x.index));
  return !/<(?:script|link)\b[^>]*?(?:src|href)="[^"]*[?&]v=\d+"/.test(line);
});
ck('A6 ?v= 无「属性外」游离引用（' + stray.length + ' 处）', stray.length === 0,
  stray.slice(0, 5).map((x) => JSON.stringify(html.slice(Math.max(0, x.index - 40), x.index + 8))).join(' '));

// —— S1 反证：检测器不得是恒真空断言 ——
// 用一段已知「故意造巨大断档」的假样本喂给同样的解析逻辑，必须能被判红
function detectGaps(seq, ceil) {
  const arr = seq.slice().sort((a, b) => a - b);
  for (let i = 1; i < arr.length; i++) if (arr[i] - arr[i - 1] > ceil) return true;
  return false;
}
ck('S1 反证：断档检测器对坏样本([1,2,4,5000])能判红', detectGaps([1, 2, 4, 5000], BUMP_CEILING) === true);
ck('S2 反证：断档检测器对好样本（含增量 bump 小断档）能判绿', detectGaps(uniq, BUMP_CEILING) === false);
// S3 反证：放开 A3「全局唯一」后，**非合并组的撞号必须照样判红** —— 一旦这条转绿，
//   说明「合并组白名单」变成了「撞号随便来」的漏洞，A3 等于被悄悄删掉。
{
  const _g0 = MERGE_GROUPS[0].files[0], _outsider = 'js/zz_probe_outsider.js';
  const _f2 = () => [_g0, _outsider];                     // 两文件共用号 99，但局外人不在任何组
  const _m2 = new Map([[_g0, 0]]);
  ck('S3 反证：非合并组撞号（局外人共用 combat_part1 的号）必须判红',
    crossBad([99], _f2, _m2).length === 1, '判红 ' + crossBad([99], _f2, _m2).length + ' 项');
}
// S4 反证：合并组必须**真的放行** —— 若 MERGE_GROUPS 声明了组合并但判据仍判红，
//   说明白名单没接线（写了个寂寞），本条负责抓出来。
{
  // 🩸 这里两文件必须映射到**同一个**组索引（真实 `_grpOf` 就是这么建的：`forEach((g,i)=>...)
  //   归到同一个 i`）。早先我写成 `map((f,i)=>[f,i])` ⇒ 组索引 0/1 不同 ⇒ 判红 —— 那是**测试构造错**，
  //   不是判据错（真实数据下 A3 本就绿）。反证脚本自己写错，比不写还危险：它会把人引向错方向。
  const _g0 = MERGE_GROUPS[0].files, _f3 = () => _g0;
  const _m3 = new Map(_g0.map((f) => [f, 0]));
  ck('S4 反证：合并组内撞号判绿（白名单确实放行了，非摆设）',
    crossBad([99], _f3, _m3).length === 0, '判红 ' + crossBad([99], _f3, _m3).length + ' 项');
}
// S5 反证：判空不得漏判（两个都不在合并组里的文件撞号 ⇒ 必须判红）
{
  const _a = 'js/zz_a.js', _b = 'js/zz_b.js';
  const _f4 = () => [_a, _b];                             // 都不在 MERGE_GROUPS 里
  const _m4 = new Map();
  ck('S5 反证：双局外人撞号也必须判红（防 gs[0]===undefined 导致的漏判）',
    crossBad([99], _f4, _m4).length === 1);
}

console.log('=== _verify_asset_version: ' + pass + ' 通过 / ' + fail + ' 失败 ===');
process.exit(fail ? 1 : 0);
