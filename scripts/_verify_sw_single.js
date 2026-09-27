// _verify_sw_single.js — SW 单注册门禁（2026-09-26 reload 死循环修复配套）
// 断言：
//  S1 index.html 恰有 1 处 serviceWorker.register（双注册 = 乒乓 reload 死循环根因）
//  S2 唯一注册的脚本 URL 不带查询串（?v= 会让同 scope 出现两个脚本 URL，效果等同双注册）
//  S3 sw.js 语法可编译
//  S4 sw.js 预缓存清单中每个文件真实存在（任一 404 → cache.addAll 整体失败 → 预缓存静默全废）
//  S5 css/style.min.css 不得回来（已裁决删除的陈旧死产物；若重建 minify 管线须同步改本门禁）
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
let pass = 0, fail = 0;
function ck(name, cond, extra) {
  if (cond) { pass++; console.log('ok   ' + name); }
  else { fail++; console.log('FAIL ' + name + (extra ? '  → ' + extra : '')); }
}

// —— S1/S2：index.html 注册块审计 ——
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const regs = [...html.matchAll(/serviceWorker\s*\.\s*register\s*\(\s*['"]([^'"]+)['"]/g)];
ck('S1 serviceWorker.register 恰 1 处（实得 ' + regs.length + '）', regs.length === 1);
if (regs.length === 1) {
  const url = regs[0][1];
  ck('S2 注册 URL 无查询串（' + url + '）', !url.includes('?'), '带 ?v= 会复现乒乓 reload');
}

// —— S3：sw.js 语法可编译 ——
const swPath = path.join(ROOT, 'sw.js');
const swSrc = fs.readFileSync(swPath, 'utf8');
try { new vm.Script(swSrc, { filename: 'sw.js' }); ck('S3 sw.js 语法编译通过', true); }
catch (e) { ck('S3 sw.js 语法编译通过', false, e.message); }

// —— S4：预缓存清单逐项存在 ——
const m = swSrc.match(/PRECACHE_URLS\s*=\s*\[([\s\S]*?)\]/);
ck('S4a 找到 PRECACHE_URLS 清单', !!m);
if (m) {
  const urls = [...m[1].matchAll(/['"]([^'"]+)['"]/g)].map(x => x[1]);
  const missing = [];
  urls.forEach((u) => {
    // '/' 与 '/index.html' 同指入口；其余按路径对盘
    const rel = u === '/' ? 'index.html' : u.replace(/^\//, '');
    const p = path.join(ROOT, rel);
    if (u !== '/' && !fs.existsSync(p)) missing.push(u);
  });
  ck('S4b 预缓存清单 ' + urls.length + ' 项全部存在', missing.length === 0, '缺失: ' + missing.join(', '));
  ck('S4c 清单不含已退役的 lazy_load.js', !urls.some(u => /lazy_load/.test(u)));
}

// —— S5：style.min.css 死产物不复活 ——
ck('S5 css/style.min.css 不存在（已裁决删除）', !fs.existsSync(path.join(ROOT, 'css', 'style.min.css')));

console.log('—— SW 单注册门禁 —— ' + pass + ' 通过 / ' + fail + ' 失败 ——');
process.exit(fail ? 1 : 0);
