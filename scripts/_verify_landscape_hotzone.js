#!/usr/bin/env node
'use strict';
/* _verify_landscape_hotzone.js — 真实横屏(844×390)可点元素热区 + 弹窗收尾按钮可见性门禁
 * 依据: docs/横屏UI逐屏重排设计与验收方案_V1.0.md §四.2（热区红线 ≥36px）+ §四.3（收尾按钮不外藏，L-P2-01）
 * 依赖本机 Edge（同 _tool_landscape_cdp.js）；仅当工具非零退出且 stderr 命中浏览器不可达专属文案才 SKIP 退 0；
 * 工具退 0 却无产物、产物不可读、或热区零覆盖（未真正审到），一律 exit 1（不得假绿灯）。
 * NDX_CDP_PORT 与工具同源，决定产物后缀。 */
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
  // 区分「环境问题」与「工具真失败」：超时/崩溃/断连不得洗成 SKIP（假绿灯）。
  // envBad 只认工具自己声明的浏览器不可达文案，以及 spawn 级 ENOENT（Edge 路径不存在）；
  // 泛化的 ENOENT（fs 栈）是工具 bug，不能当环境问题（CodeReview 阻断1）。
  const stderr = r.stderr || '';
  const envBad = /无法连接 Edge CDP|无法获取页面目标|Error: spawn |EBUSY|EPERM/.test(stderr);
  const toolFailed = r.error || (r.status != null && r.status !== 0) || r.signal;
  // 工具自报成功（exit 0、无 signal、无 error）却没产出汇总：无论 stderr 是否命中环境文案，
  // 一律判红——退 0 意味着工具认为环境正常，无产物只能是产物路径/口径 bug（CodeReview 阻断1）
  if (!toolFailed) {
    console.log('HOTZONE ERROR: 工具退出码 0 但未产出 ' + path.basename(summaryFile) + '（疑口径/产物错位，不得计通过）');
    console.log('  工具 stdout 尾部: ' + String(r.stdout || '').slice(-300).replace(/\n/g, ' / '));
    process.exit(1);
  }
  if (envBad) {
    console.log('HOTZONE SKIP (browser unavailable): ' + stderr.slice(-200));
    process.exit(0);
  }
  console.log('HOTZONE ERROR (tool failed, not env): ' + ((r.error && r.error.message) || stderr.slice(-200)));
  process.exit(1);
}
const summary = JSON.parse(fs.readFileSync(summaryFile, 'utf8'));
let total = 0, worst = null;
const noCoverage = []; // 零覆盖/断言未执行的屏：「0 违规」不等于「审过」（CodeReview 阻断2）
const side = (o) => Math.min(o.w, o.h); // 与红线口径（单维 <36px）同源：最短边最小 = 最难命中，不用面积避免细长条被摊薄排名
for (const vp of Object.keys(summary)) for (const sc of Object.keys(summary[vp])) {
  const entry = summary[vp][sc];
  const viols = Array.isArray(entry) ? entry : (entry && entry.violations) || [];
  // checked：新口径为数字（布局盒命中的可见可点元素数）；<1 即零覆盖或断言未执行。
  // 旧口径数组无该字段 → 不判（向后兼容，但同工具同提交下不应再产生旧口径）
  if (entry && !Array.isArray(entry)) {
    const n = entry.checked;
    if (typeof n !== 'number' || n < 1) noCoverage.push(vp + '/' + sc);
  }
  for (const v of viols) { total++; if (!worst || side(v) < side(worst)) worst = Object.assign({ screen: sc }, v); }
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
if (noCoverage.length) { console.log('HOTZONE FAIL (coverage) · 零覆盖/断言未执行屏: ' + noCoverage.join(', ')); process.exit(1); }
if (total === 0 && clipTotal === 0) { console.log('HOTZONE PASS (violations=0, footerClips=0, coverage ok)'); process.exit(0); }
if (total > 0) console.log('HOTZONE FAIL (violations=' + total + ') · worst: ' + worst.t + (worst.c ? '.' + worst.c : '') + (worst.a ? '[' + worst.a + ']' : '') + ' ' + worst.w + 'x' + worst.h + ' @' + worst.screen);
if (clipTotal > 0) console.log('FOOTER FAIL (clips=' + clipTotal + ') · first: ' + clipWorst.t + (clipWorst.c ? '.' + clipWorst.c : '') + ' "' + clipWorst.txt + '" bottom=' + clipWorst.bottom + ' modalBottom=' + clipWorst.mBottom + ' vh=' + clipWorst.vh + ' @' + clipWorst.screen);
process.exit(1);
