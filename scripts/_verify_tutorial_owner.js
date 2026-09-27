// scripts/_verify_tutorial_owner.js
// V9.65 · 教学 owner 单一真源门禁
// ------------------------------------------------------------
// 背景：项目内曾有两套"新手教学"平行体系——
//   1) js/newbie_teach.js + js/data_newbie_teach.js（活；index.html 加载；15 处外引；s.taught.* 存档）
//   2) js/battle_tutorial.js（孤儿；未加载；零外引；NDX.BattleTutorial 只在自身内部使用）
// 经《系统完善度审计 v1.1》§二 定性：battle_tutorial.js 属"战斗表现 5 件旧实现残留"。
// V9.65 将其退役到 js/_retired/，本门禁锁定退役边界，防"孤儿复活"与"教学双轨"回归。
//
// 断言：
//   A. js/battle_tutorial.js 不存在；js/_retired/battle_tutorial.js 存在。
//   B. index.html 加载 data_newbie_teach.js 与 newbie_teach.js（各一处，带 ?v=NN）。
//   C. js/ 主库（不含 _retired/、不含 taptap_bundle）无 "NDX.BattleTutorial" 或 "battle_tutorial.js" 引用。
//   D. js/ 主库对 NDX.NewbieTeach 或 NDX.triggerTeach 至少有 5 处外部引用（含自身定义），
//      且外部（非 js/newbie_teach.js 自身）至少 5 处，防漂移。
//   E. js/game/game_core_2.js 保留 s.taught.* 首触标记（mob/rest/trial/sixdao/life/elite/boss/treasure/shop 9 类）。

var fs = require('fs');
var path = require('path');

var ROOT = path.resolve(__dirname, '..');
var PASS = 0, FAIL = 0;
function ok(cond, msg) {
  if (cond) { PASS++; console.log('  ✓ ' + msg); }
  else { FAIL++; console.log('  ✗ ' + msg); }
}

function read(p) {
  var abs = path.join(ROOT, p);
  return fs.existsSync(abs) ? fs.readFileSync(abs, 'utf8') : null;
}
function exists(p) { return fs.existsSync(path.join(ROOT, p)); }

// 递归列 js/ 主库下所有 .js（跳过 _retired/）
function walkJs(dir, out) {
  var abs = path.join(ROOT, dir);
  if (!fs.existsSync(abs)) return out;
  var entries = fs.readdirSync(abs, { withFileTypes: true });
  for (var i = 0; i < entries.length; i++) {
    var e = entries[i];
    var rel = dir ? (dir + '/' + e.name) : e.name;
    if (e.isDirectory()) {
      if (e.name === '_retired') continue; // 跳过退役目录
      walkJs(rel, out);
    } else if (e.isFile() && /\.js$/.test(e.name)) {
      out.push(rel);
    }
  }
  return out;
}

console.log('=== _verify_tutorial_owner: V9.65 教学 owner 单一真源 ===');

// —— A · battle_tutorial.js 已退役 ——
console.log('\n[A] battle_tutorial.js 退役边界');
ok(!exists('js/battle_tutorial.js'), 'js/battle_tutorial.js 已不存在（主库无孤儿）');
ok(exists('js/_retired/battle_tutorial.js'), 'js/_retired/battle_tutorial.js 存在（保留历史可查）');

// —— B · newbie_teach 加载 ——
console.log('\n[B] newbie_teach.js 与 data_newbie_teach.js 已加载');
var html = read('index.html') || '';
var mNewbie = html.match(/<script[^>]+src="js\/newbie_teach\.js(\?v=(\d+))?"[^>]*><\/script>/g) || [];
var mDataNewbie = html.match(/<script[^>]+src="js\/data_newbie_teach\.js(\?v=(\d+))?"[^>]*><\/script>/g) || [];
ok(mNewbie.length === 1, 'index.html 加载 newbie_teach.js 恰一处（实际 ' + mNewbie.length + '）');
ok(mDataNewbie.length === 1, 'index.html 加载 data_newbie_teach.js 恰一处（实际 ' + mDataNewbie.length + '）');
// 教学数据应在教学逻辑之前加载
if (mNewbie.length === 1 && mDataNewbie.length === 1) {
  var idxData = html.indexOf(mDataNewbie[0]);
  var idxLogic = html.indexOf(mNewbie[0]);
  ok(idxData < idxLogic, 'data_newbie_teach.js 在 newbie_teach.js 之前加载');
}

// —— C · js/ 主库无 BattleTutorial 孤儿符号 ——
console.log('\n[C] js/ 主库（排除 _retired/）无 NDX.BattleTutorial / battle_tutorial.js 引用');
var jsFiles = walkJs('js', []);
var orphanHits = [];
for (var i = 0; i < jsFiles.length; i++) {
  var src = read(jsFiles[i]) || '';
  if (/NDX\.BattleTutorial/.test(src) || /battle_tutorial\.js/.test(src)) {
    orphanHits.push(jsFiles[i]);
  }
}
ok(orphanHits.length === 0,
  'js/ 主库无 BattleTutorial 孤儿引用（命中文件：' + (orphanHits.length ? orphanHits.join(', ') : '无') + '）');

// —— D · NDX.NewbieTeach / NDX.triggerTeach 有真实外引 ——
console.log('\n[D] NDX.NewbieTeach 与 NDX.triggerTeach 外部接线');
var externalHits = [];
for (var i = 0; i < jsFiles.length; i++) {
  if (jsFiles[i] === 'js/newbie_teach.js') continue; // 排除定义源
  var src = read(jsFiles[i]) || '';
  if (/NDX\.NewbieTeach|NDX\.triggerTeach/.test(src)) {
    externalHits.push(jsFiles[i]);
  }
}
ok(externalHits.length >= 5,
  'js/ 主库至少 5 个外部文件引用 NDX.NewbieTeach / NDX.triggerTeach（实际 ' + externalHits.length + '：' + externalHits.join(', ') + '）');

// —— E · s.taught.* 首触标记体系仍在跑 ——
console.log('\n[E] s.taught.* 首触标记（活的教学进度真源）');
var core2 = read('js/game/game_core_2.js') || '';
var taughtKeys = ['mob', 'rest', 'trial', 'sixdao', 'life', 'elite', 'boss', 'treasure', 'shop'];
taughtKeys.forEach(function (k) {
  var re = new RegExp('s\\.taught\\.' + k);
  ok(re.test(core2), 'game_core_2.js 保留 s.taught.' + k + ' 标记');
});

// —— 汇总 ——
console.log('\n=== _verify_tutorial_owner: ' + PASS + ' 通过 / ' + FAIL + ' 失败 ===');
process.exit(FAIL === 0 ? 0 : 1);
