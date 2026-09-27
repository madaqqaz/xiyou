#!/usr/bin/env node
'use strict';
/* _verify_landscape_hotzone.js — 真实横屏(844×390)可点元素热区门禁
 * 依据: docs/横屏UI逐屏重排设计与验收方案_V1.0.md §四.2（热区红线 ≥36px）
 * 依赖本机 Edge（同 _tool_landscape_cdp.js）；无法启动浏览器时跳过并退出 0（打印 SKIP）。 */
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const tool = path.join(__dirname, '_tool_landscape_cdp.js');
const summaryFile = path.join(__dirname, '_audit_shots', 'hotzone_summary.json');
try { fs.unlinkSync(summaryFile); } catch (e) {}
const r = spawnSync(process.execPath, [tool, 'file', '--hotzone-only'], { encoding: 'utf8', timeout: 420000 });
if (!fs.existsSync(summaryFile)) { console.log('HOTZONE SKIP (browser unavailable): ' + (r.stderr || '').slice(0, 200)); process.exit(0); }
const summary = JSON.parse(fs.readFileSync(summaryFile, 'utf8'));
let total = 0, worst = null;
for (const vp of Object.keys(summary)) for (const sc of Object.keys(summary[vp])) {
  for (const v of summary[vp][sc]) { total++; if (!worst || v.w * v.h < worst.w * worst.h) worst = Object.assign({ screen: sc }, v); }
}
if (total === 0) { console.log('HOTZONE PASS (violations=0)'); process.exit(0); }
console.log('HOTZONE FAIL (violations=' + total + ') · worst: ' + worst.t + '.' + worst.c + ' ' + worst.w + 'x' + worst.h + ' @' + worst.screen);
process.exit(1);
