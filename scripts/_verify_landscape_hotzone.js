#!/usr/bin/env node
'use strict';
/* _verify_landscape_hotzone.js — 真实横屏(844×390)可点元素热区 + 弹窗收尾按钮可见性门禁
 * 依据: docs/横屏UI逐屏重排设计与验收方案_V1.0.md §四.2（热区红线 ≥36px）+ §四.3（收尾按钮不外藏，L-P2-01）
 * 依赖本机 Edge（同 _tool_landscape_cdp.js）；无法启动浏览器时跳过并退出 0（打印 SKIP）。 */
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const tool = path.join(__dirname, '_tool_landscape_cdp.js');
const summaryFile = path.join(__dirname, '_audit_shots', 'hotzone_summary.json');
const footerFile = path.join(__dirname, '_audit_shots', 'footer_summary.json');
for (const f of [summaryFile, footerFile]) {
  try { fs.unlinkSync(f); } catch (e) { if (e.code !== 'ENOENT') console.log('HOTZONE WARN: 旧清理失败 ' + e.code + '（本轮结果可能受残留影响，需人工复核）'); }
}
const r = spawnSync(process.execPath, [tool, 'file', '--hotzone-only'], { encoding: 'utf8', timeout: 420000 });
if (!fs.existsSync(summaryFile)) {
  // 区分「环境问题」与「工具真失败」：超时/崩溃/断连不得洗成 SKIP（假绿灯）
  const stderr = r.stderr || '';
  const envBad = /无法连接 Edge CDP|无法获取页面目标|ENOENT|EBUSY|EPERM/.test(stderr);
  const toolFailed = r.error || (r.status != null && r.status !== 0) || r.signal;
  if (toolFailed && !envBad) {
    console.log('HOTZONE ERROR (tool failed, not env): ' + ((r.error && r.error.message) || stderr.slice(-200)));
    process.exit(1);
  }
  console.log('HOTZONE SKIP (browser unavailable): ' + stderr.slice(-200));
  process.exit(0);
}
const summary = JSON.parse(fs.readFileSync(summaryFile, 'utf8'));
let total = 0, worst = null;
const side = (o) => Math.min(o.w, o.h); // 与红线口径（单维 <36px）同源：最短边最小 = 最难命中，不用面积避免细长条被摊薄排名
for (const vp of Object.keys(summary)) for (const sc of Object.keys(summary[vp])) {
  for (const v of summary[vp][sc]) { total++; if (!worst || side(v) < side(worst)) worst = Object.assign({ screen: sc }, v); }
}
// 收尾按钮裁切（L-P2-01）：旧版工具无 footer_summary 时计 0 向后兼容
let clipTotal = 0, clipWorst = null;
try {
  const footer = JSON.parse(fs.readFileSync(footerFile, 'utf8'));
  for (const vp of Object.keys(footer)) for (const sc of Object.keys(footer[vp])) {
    for (const v of footer[vp][sc]) { clipTotal++; if (!clipWorst) clipWorst = Object.assign({ screen: sc }, v); }
  }
} catch (e) { if (e.code !== 'ENOENT') console.log('HOTZONE WARN: footer_summary 解析失败 ' + e.message); }
if (total === 0 && clipTotal === 0) { console.log('HOTZONE PASS (violations=0, footerClips=0)'); process.exit(0); }
if (total > 0) console.log('HOTZONE FAIL (violations=' + total + ') · worst: ' + worst.t + (worst.c ? '.' + worst.c : '') + (worst.a ? '[' + worst.a + ']' : '') + ' ' + worst.w + 'x' + worst.h + ' @' + worst.screen);
if (clipTotal > 0) console.log('FOOTER FAIL (clips=' + clipTotal + ') · first: ' + clipWorst.t + (clipWorst.c ? '.' + clipWorst.c : '') + ' "' + clipWorst.txt + '" bottom=' + clipWorst.bottom + ' modalBottom=' + clipWorst.mBottom + ' vh=' + clipWorst.vh + ' @' + clipWorst.screen);
process.exit(1);
