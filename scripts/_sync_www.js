// _sync_www.js — 三端镜像同步：主源 → demo/www/（Android/Capacitor 输入源）
// 目的：capacitor.config.json webDir='www'，但 www 无自动同步脚本、靠手工复制已漂移。
//       本脚本把主源代码镜像进 www/ 并递增 www/index.html 的 ?v 防缓存漂移。
// 运行：node scripts/_sync_www.js
// 范围：js/ css/ platform/ index.html manifest.json（+ img/ assets/ 若在主源存在，按当前磁盘状态镜像）
//       注意：被外部工具删除的 AI 音视频/背景图不会出现在磁盘，故不会进 www；
//             需先 git checkout HEAD -- <被删路径> 还原资产后再同步，Android 构建才完整。
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const WWW = path.join(ROOT, 'www');

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return 0;
  fs.mkdirSync(dest, { recursive: true });
  let n = 0;
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, e.name), d = path.join(dest, e.name);
    if (e.isDirectory()) n += copyDir(s, d);
    else { fs.copyFileSync(s, d); n++; }
  }
  return n;
}
function copyFile(s, d) {
  if (!fs.existsSync(s)) return 0;
  fs.mkdirSync(path.dirname(d), { recursive: true });
  fs.copyFileSync(s, d);
  return 1;
}

let total = 0;
total += copyDir(path.join(ROOT, 'js'), path.join(WWW, 'js'));
total += copyDir(path.join(ROOT, 'css'), path.join(WWW, 'css'));
total += copyDir(path.join(ROOT, 'platform'), path.join(WWW, 'platform'));
total += copyDir(path.join(ROOT, 'img'), path.join(WWW, 'img'));
total += copyDir(path.join(ROOT, 'assets'), path.join(WWW, 'assets'));
total += copyFile(path.join(ROOT, 'index.html'), path.join(WWW, 'index.html'));
total += copyFile(path.join(ROOT, 'manifest.json'), path.join(WWW, 'manifest.json'));

// 递增 www/index.html 的 ?v（每同步 +1，强制 Android WebView 重新加载）
const ip = path.join(WWW, 'index.html');
let html = fs.readFileSync(ip, 'utf8');
const before = (html.match(/\?v=\d+/g) || []).length;
html = html.replace(/(\?v=)(\d+)/g, (m, p, v) => p + (parseInt(v, 10) + 1));
fs.writeFileSync(ip, html);
const after = (html.match(/\?v=\d+/g) || []).length;

console.log('[sync-www] 已镜像 ' + total + ' 个文件 → www/');
console.log('[sync-www] index.html ?v 条目 ' + before + ' → ' + after + '（已 +1 防漂移）');
console.log('[sync-www] 下一步：npx cap sync android  （需先还原被删资产以保证 Android 构建完整）');
