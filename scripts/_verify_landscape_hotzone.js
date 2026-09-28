#!/usr/bin/env node
'use strict';
/* _verify_landscape_hotzone.js — 真实横屏(844×390)可点元素热区 + 弹窗收尾按钮可见性门禁
 * 依据: docs/横屏UI逐屏重排设计与验收方案_V1.0.md §四.2（热区红线 ≥36px）+ §四.3（收尾按钮不外藏，L-P2-01）
 * 依赖本机 Edge（同 _tool_landscape_cdp.js）；仅当浏览器真的起不来（stderr 命中环境特征）才 SKIP 退 0；
 * 工具退 0 却无产物、或产物不可读，一律 exit 1（不得假绿灯）。NDX_CDP_PORT 与工具同源，决定产物后缀。 */
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const tool = path.join(__dirname, '_tool_landscape_cdp.js');
// 端口后缀必须与工具同源（NDX_CDP_PORT）：否则并行取证时工具写 .<port>.json、
// 门禁去找无后缀文件→读不到→走 SKIP 分支退 0，把「根本没审」洗成假绿灯（已实测复现）。
const _rawPort = parseInt(process.env.NDX_CDP_PORT || '9222', 10);
if (process.env.NDX_CDP_PORT && (!Number.isInteger(_rawPort) || _rawPort <= 0 || _rawPort >= 65536)) {
  console.error('HOTZONE ERROR: NDX_CDP_PORT 非法（' + process.env.NDX_CDP_PORT + '），需为 1-65535 整数');
  process.exit(1);
}
const PORT_SUFFIX = _rawPort === 9222 ? '' : '.' + _rawPort;
const summaryFile = path.join(__dirname, '_audit_shots', 'hotzone_summary' + PORT_SUFFIX + '.json');
const footerFile = path.join(__dirname, '_audit_shots', 'footer_summary' + PORT_SUFFIX + '.json');
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
  // 工具自报成功（exit 0、无 signal、无 error）却没产出汇总：这是工具/口径 bug，不是环境问题，必须响
  if (!toolFailed && !envBad) {
    console.log('HOTZONE ERROR: 工具退出码 0 但未产出 ' + path.basename(summaryFile) + '（疑口径/产物错位，不得计通过）');
    console.log('  工具 stdout 尾部: ' + String(r.stdout || '').slice(-300).replace(/\n/g, ' / '));
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
// 收尾按钮裁切（L-P2-01）：仅旧版工具无 footer_summary 文件时计 0 向后兼容；
// 文件存在但不可读/结构异常一律判红，不得静默洗成 PASS（与上方「不得假绿灯」同源原则）
let clipTotal = 0, clipWorst = null;
try {
  const footer = JSON.parse(fs.readFileSync(footerFile, 'utf8'));
  for (const vp of Object.keys(footer)) for (const sc of Object.keys(footer[vp])) {
    const arr = footer[vp][sc];
    if (!Array.isArray(arr)) throw new Error('结构异常：' + vp + '/' + sc + ' 非数组');
    for (const v of arr) { clipTotal++; if (!clipWorst) clipWorst = Object.assign({ screen: sc }, v); }
  }
} catch (e) {
  if (e.code !== 'ENOENT') {
    console.log('HOTZONE ERROR (footer_summary unusable, not treated as pass): ' + e.message);
    process.exit(1);
  }
}
if (total === 0 && clipTotal === 0) { console.log('HOTZONE PASS (violations=0, footerClips=0)'); process.exit(0); }
if (total > 0) console.log('HOTZONE FAIL (violations=' + total + ') · worst: ' + worst.t + (worst.c ? '.' + worst.c : '') + (worst.a ? '[' + worst.a + ']' : '') + ' ' + worst.w + 'x' + worst.h + ' @' + worst.screen);
if (clipTotal > 0) console.log('FOOTER FAIL (clips=' + clipTotal + ') · first: ' + clipWorst.t + (clipWorst.c ? '.' + clipWorst.c : '') + ' "' + clipWorst.txt + '" bottom=' + clipWorst.bottom + ' modalBottom=' + clipWorst.mBottom + ' vh=' + clipWorst.vh + ' @' + clipWorst.screen);
process.exit(1);
