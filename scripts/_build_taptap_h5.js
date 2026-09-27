#!/usr/bin/env node
'use strict';
/*
 * 《逆道西行》TapTap H5 直发包构建脚本
 * ============================================================
 * 目标形态：TapTap「H5/WebGL 直发」（**非**小游戏形态）
 *
 * TapTap 上传规范（来源：taptap.cn/moment/598609424361196724 + developer.taptap.cn/docs/pc-store）：
 *   1. 包体为 .zip（建议 gzip 压缩），后台「支持上传 7z、zip 包，大小不限」
 *   2. 解压后「第一级有且仅能有一个文件夹」，文件夹名只可包含 英文/数字
 *   3. 该文件夹内「直接」就是 index.html 等文件（不可再嵌套一层大目录）
 *   4. 横屏游戏须有「横屏参数告知」；含 wasd 类玩法须配虚拟摇杆（本作为点击操作，无此项）
 *
 * 与 scripts/_taptap_bundle.js 的区别：
 *   _taptap_bundle.js → 【TapTap 小游戏形态】产出 game.json + 假分包 + 懒加载垫片，
 *                        受「首包 4M/20M/60M、总包 60M」这类小游戏约束
 *   本脚本           → 【H5 直发形态】单一目录 + HTTP 天然按需加载（浏览器只取首屏所需），
 *                        无体积硬约束，无需分包、无需垫片
 *
 * 用法：
 *   node scripts/_build_taptap_h5.js                  # dry：只扫描 + 报告，不写盘（默认）
 *   node scripts/_build_taptap_h5.js --no-webp-only   # dry 且不剔除 png/jpg（用于体积对比）
 *   node scripts/_build_taptap_h5.js --build          # 产出发布目录
 *   node scripts/_build_taptap_h5.js --build --out D:/somewhere
 *
 * 非破坏性：不改动任何源码；所有产物内部处理只作用于 out 目录内的副本。
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const MODE = process.argv.includes('--build') ? 'build' : 'dry';
const WEBP_ONLY = !process.argv.includes('--no-webp-only');

// zip 内第一级目录：TapTap 只允许 英文/数字
const PACK_NAME = 'nidaoxiyou';
const outArgIdx = process.argv.indexOf('--out');
const OUT_ROOT = outArgIdx >= 0
  ? path.resolve(process.argv[outArgIdx + 1])
  : path.resolve(ROOT, '..', 'ndx_release');
const OUT = path.join(OUT_ROOT, PACK_NAME);

const MB = 1048576;

// ---------- 发布包含清单（顶层条目）----------
const INCLUDE = [
  'index.html',
  'manifest.json',
  'sw.js',
  'js',
  'css',
  'platform',
  'img',
  'audio',
  'video',
  'assets',
];

// ---------- 排除规则（相对 ROOT 的 posix 路径 glob）----------
const EXCLUDE_GLOBS = [
  'img/_archive/**',              // 资源归档
  'img/美术资产归档_*/**',         // 资源归档
  'video/README.md',              // 目录说明，非运行时资源
];

// ---------- 工具 ----------
function escapeReg(s) { return s.replace(/[.+?^${}()|[\]\\]/g, '\\$&'); }
function globToRegex(g) {
  const body = g.split('/').map(seg => {
    if (seg === '**') return '.*';
    return seg.split('*').map(escapeReg).join('[^/]*');
  }).join('\\/');
  return new RegExp('^' + body + '$');
}
function matchAny(rel, globs) {
  for (const g of globs) if (globToRegex(g).test(rel)) return true;
  return false;
}
function listFiles(dir) {
  const out = [];
  (function walk(d) {
    let ents; try { ents = fs.readdirSync(d, { withFileTypes: true }); } catch (e) { return; }
    for (const e of ents) {
      const fp = path.join(d, e.name);
      if (e.isDirectory()) walk(fp);
      else if (e.isFile()) out.push(fp);
    }
  })(dir);
  return out;
}
function relOf(abs) { return path.relative(ROOT, abs).split(path.sep).join('/'); }
function mb(n) { return (n / MB).toFixed(1); }

// ---------- 1. 顶层条目判定 ----------
const incSet = new Set(INCLUDE);
const entries = fs.readdirSync(ROOT, { withFileTypes: true })
  .filter(e => !e.name.startsWith('.'))
  .map(e => ({ name: e.name, isDir: e.isDirectory() }));

const willInclude = entries.filter(e => incSet.has(e.name));
const willExclude = entries.filter(e => !incSet.has(e.name));

// ---------- 2. 收集文件 ----------
let files = [];
for (const e of willInclude) {
  const abs = path.join(ROOT, e.name);
  if (e.isDir) for (const f of listFiles(abs)) files.push({ abs: f, rel: relOf(f) });
  else files.push({ abs, rel: relOf(abs) });
}
const beforeExclude = files.length;
files = files.filter(f => !matchAny(f.rel, EXCLUDE_GLOBS));
const excludeHit = beforeExclude - files.length;

// ---------- 3. webp-only 精简 ----------
let webpSkipped = 0, webpSkippedBytes = 0;
if (WEBP_ONLY) {
  const relSet = new Set(files.map(f => f.rel));
  const kept = [];
  for (const f of files) {
    if (/\.(png|jpe?g)$/i.test(f.rel)) {
      // 不剔除非图片目录下同名 .webp 的情况：按同目录同名替换判定
      const webpRel = f.rel.replace(/\.(png|jpe?g)$/i, '.webp');
      if (relSet.has(webpRel)) {
        webpSkipped++;
        webpSkippedBytes += fs.statSync(f.abs).size;
        continue;
      }
    }
    kept.push(f);
  }
  files = kept;
}

// ---------- 4. 体积统计 ----------
const perTop = new Map();
let totalBytes = 0;
for (const f of files) {
  const top = f.rel.split('/')[0];
  const sz = fs.statSync(f.abs).size;
  totalBytes += sz;
  const rec = perTop.get(top) || { n: 0, b: 0 };
  rec.n++; rec.b += sz;
  perTop.set(top, rec);
}

// 首屏关键资源（index.html 里 preload 声明的）
const preloads = [];
try {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const re = /<link\b[^>]*\brel=["']preload["'][^>]*>/gi;
  let m;
  while ((m = re.exec(html))) {
    const h = m[0].match(/\bhref=["']([^"']+)["']/i);
    if (h) preloads.push(h[1]);
  }
} catch (e) { /* ignore */ }
let preloadBytes = 0;
for (const p of preloads) {
  const rel = p.split(/[?#]/)[0].replace(/^\.?\//, '');
  const found = files.find(f => f.rel === rel);
  if (found) preloadBytes += fs.statSync(found.abs).size;
}

// ---------- 5. 报告 ----------
console.log('=== TapTap H5 直发包分析 (' + MODE + ') ===');
console.log('源根      : ' + ROOT);
console.log('包内一级目录: ' + PACK_NAME + '/   (仅英文/数字，符合 TapTap 规范)');
console.log('产物路径  : ' + OUT);
console.log('');
console.log('--- 纳入发布的顶层条目 ---');
for (const e of willInclude) {
  const r = perTop.get(e.name) || { n: 0, b: 0 };
  const tag = e.isDir ? 'dir ' : 'file';
  console.log('  [' + tag + '] ' + e.name.padEnd(16) + String(r.n).padStart(7) + ' 文件  ' + mb(r.b).padStart(9) + 'MB');
}
console.log('');
console.log('--- 排除的顶层条目（开发/文档/构建物）---');
for (const e of willExclude) {
  console.log('  [' + (e.isDir ? 'dir ' : 'file') + '] ' + e.name);
}
console.log('');
if (excludeHit) console.log('归档规则额外剔除: ' + excludeHit + ' 文件  (' + EXCLUDE_GLOBS.join(' | ') + ')');
if (WEBP_ONLY) {
  console.log('webp-only 精简  : ' + webpSkipped + ' 个 png/jpg 被剔除（存在同名 .webp 兄弟）  ' + mb(webpSkippedBytes) + 'MB');
} else {
  console.log('webp-only 精简  : 已关闭（--no-webp-only），png/jpg 全量保留');
}
console.log('');
console.log('=== 发布总体积: ' + mb(totalBytes) + 'MB   共 ' + files.length + ' 文件 ===');
console.log('首屏 preload   : ' + preloads.length + ' 条  ' + mb(preloadBytes) + 'MB');

// ---------- 6. 产物 index.html 处理预告 ----------
const REL_PATCH = [
  '禁用 Service Worker 注册：两处 `if (\'serviceWorker\' in navigator) {` → 发布包内短路',
  '   理由：sw.js 的 controllerchange 会触发 location.reload（本项目实测过数据飘忽）；',
  '         且 H5 直发每次是整包替换，SW 缓存反而会让玩家停留在旧版本',
  '注入横屏声明 meta：screen-orientation / x5-orientation / x5-fullscreen',
  '   理由：TapTap 要求「横屏游戏必须包含横屏参数告知」，否则内嵌浏览器按竖屏打开',
];
console.log('');
console.log('--- 构建时对【产物副本】index.html 的处理（源码不动）---');
for (const l of REL_PATCH) console.log('  · ' + l);

if (MODE === 'dry') {
  console.log('\n[dry] 未写入任何文件。确认无误后运行 --build。');
  process.exit(0);
}

// ---------- 7. build ----------
console.log('\n[build] 开始生成 ' + OUT + ' ...');

// 旧产物清理：用 rename 移走（非 delete，避开 safe-delete 批量删除拦截）
if (fs.existsSync(OUT)) {
  const trash = path.join(outArgIdx >= 0 ? OUT_ROOT : 'D:/WorkBuddyData/_ai_tmp',
    '_trash_' + PACK_NAME + '_' + Date.now());
  try {
    fs.mkdirSync(path.dirname(trash), { recursive: true });
    fs.renameSync(OUT, trash);
    console.log('[build] 旧产物已移至 ' + trash);
  } catch (e) {
    console.log('[build] 旧产物移走失败（继续覆盖写入）: ' + e.message);
  }
}
fs.mkdirSync(OUT, { recursive: true });

function copyOne(src, rel) {
  const dest = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

let copied = 0;
for (const f of files) {
  copyOne(f.abs, f.rel);
  copied++;
  if (copied % 500 === 0) process.stdout.write('  已复制 ' + copied + '/' + files.length + '\r');
}
console.log('  资源复制: ' + copied + ' 文件');

// ---- 可选：JS 压缩（--minify，只压 out 副本，源码零改动）----
if (process.argv.includes('--minify')) {
  const { minifyJsTree } = require(path.join(__dirname, '_lib_minify.js'));
  console.log('  [minify] 压缩产物 js/ ...');
  (async () => {
    const r = await minifyJsTree(path.join(OUT, 'js'), (m) => console.log(m));
    console.log('  [minify] ' + r.n + ' 个 js：' + Math.round(r.before / 1048576 * 10) / 10 + 'MB → ' +
      Math.round(r.after / 1048576 * 10) / 10 + 'MB（-' + Math.round((1 - r.after / r.before) * 100) + '%）' +
      (r.failed ? '，' + r.failed + ' 个未压原样保留' : ''));
    finish();
  })().catch((e) => { console.error('  [minify] 失败（继续未压缩产物）:', e.message); finish(); });
} else {
  finish();
}

function finish() {

// ---- 产物 index.html 处理 ----
const idxPath = path.join(OUT, 'index.html');
if (fs.existsSync(idxPath)) {
  let html = fs.readFileSync(idxPath, 'utf8');
  const orig = html;

  // (1) 禁用 Service Worker 注册
  const swPat = "if ('serviceWorker' in navigator) {";
  const swHits = html.split(swPat).length - 1;
  html = html.split(swPat).join("if (false) { /* [release] Service Worker 注册已禁用 */");

  // (2) 注入横屏声明
  let oriHit = 0;
  html = html.replace(/<meta\s+name=["']viewport["'][^>]*>/i, (tag) => {
    oriHit++;
    return tag + '\n  <!-- [release] 横屏参数告知：TapTap 内嵌浏览器据此按横屏打开 -->' +
      '\n  <meta name="screen-orientation" content="landscape" />' +
      '\n  <meta name="x5-orientation" content="landscape" />' +
      '\n  <meta name="x5-fullscreen" content="true" />' +
      '\n  <meta name="full-screen" content="yes" />';
  });

  if (html !== orig) {
    fs.writeFileSync(idxPath, html, 'utf8');
    console.log('  产物 index.html: SW 注册禁用 ' + swHits + ' 处 / 横屏声明注入 ' + oriHit + ' 处');
    // 2026-09-26：index.html 已修复双注册（reload 死循环），唯一定义为 1 处
    if (swHits !== 1) console.log('  [warn] 预期 1 处 SW 注册，实际 ' + swHits + ' 处，请复核 index.html');
    if (oriHit !== 1) console.log('  [warn] 预期 1 处 viewport meta，实际 ' + oriHit + ' 处，请复核 index.html');
  } else {
    console.log('  [warn] 产物 index.html 未发生改动，模式可能已不匹配，请复核');
  }
}

console.log('[build] 完成。');
console.log('');
console.log('下一步打包（zip 内第一级 = ' + PACK_NAME + '/，符合 TapTap 规范）：');
console.log('  Compress-Archive -Path "' + OUT + '" -DestinationPath "' + path.join(OUT_ROOT, PACK_NAME + '.zip') + '" -CompressionLevel Optimal');
console.log('然后经 TapTap 开发者后台「商店 >> 添加新版本 >> 上传包体」上传 zip。');
}
