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
//   A3 版本号全局唯一（一个资源一个号；拦双计数/并列重复）
//   A4 版本号无巨大断档（拦双计数式平行序列：单断档 > BUMP_CEILING 判红；允许增量 bump 的小断档）
//   A5 最高号不超过资源数 + BUMP_SLACK（允许 max+1 递增；拦高位留白）
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

// —— A3 / A4 / A5：唯一 + 无巨大断档 + 无高位留白 ——
const vs = code.map(ver).sort((a, b) => a - b);
const uniq = [...new Set(vs)];
ck('A3 版本号全局唯一（' + vs.length + ' 引用 / ' + uniq.length + ' 个号）', vs.length === uniq.length);
const noHugeGap = !detectGaps(uniq, BUMP_CEILING);
ck('A4 版本号无巨大断档（拦双计数式平行序列，单断档>' + BUMP_CEILING + '判红）', noHugeGap,
  '区间 [' + uniq[0] + ',' + uniq[uniq.length - 1] + ']，去重 ' + uniq.length + ' 个');
ck('A5 最高号不超过资源数+' + BUMP_SLACK + '（允许 max+1 递增，无高位留白）', uniq[uniq.length - 1] <= vs.length + BUMP_SLACK,
  'max=' + uniq[uniq.length - 1] + ' 资源数=' + vs.length);

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

console.log('=== _verify_asset_version: ' + pass + ' 通过 / ' + fail + ' 失败 ===');
process.exit(fail ? 1 : 0);
